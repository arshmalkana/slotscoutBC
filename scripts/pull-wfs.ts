/**
 * Monthly pull of every machine-readable layer in the source register (PRD 10.2).
 *
 * Each layer is pulled in full (not incrementally), paged by startIndex and sorted by OBJECTID,
 * and its feature count is checked against resultType=hits. The raw pull is stored gzipped with
 * its request URL, timestamp and SHA-256 hash. A pull is rejected when its count differs from
 * last month's by more than 5% without a known cause.
 *
 *   npm run pipeline:pull -- --hits            change report only (counts), fast
 *   npm run pipeline:pull -- --layer bc_parks  one layer
 *   npm run pipeline:pull                      everything (large: ParcelMap alone is ~740k parcels)
 *
 * Output goes to data/raw/<YYYY-MM>/ (git-ignored; production keeps it in versioned object storage).
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = fileURLToPath(new URL("../data/", import.meta.url));
const UA = "SlotScoutBot/0.1 (+https://slotscout.ca/about; data@slotscout.ca)";
const PAGE = 10000;
const MAX_CHANGE = 0.05;

interface Source {
  id: string;
  access: string;
  endpoint: string;
  layer: string;
  name: string;
}

interface ManifestEntry {
  id: string;
  layer: string;
  requestUrl: string;
  pulledAt: string;
  hits: number;
  features?: number;
  sha256?: string;
  file?: string;
  previousHits?: number;
  change?: number;
  status: "ok" | "rejected" | "failed" | "hits-only";
  note?: string;
}

const args = process.argv.slice(2);
const hitsOnly = args.includes("--hits");
const onlyLayer = args.includes("--layer") ? args[args.indexOf("--layer") + 1] : undefined;
/** Known causes for a large count change, e.g. --known parcels="ParcelMap reload". */
const known = new Map(
  args
    .filter((a) => a.startsWith("--known="))
    .map((a) => a.slice(8).split("=") as [string, string]),
);

async function get(url: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(180_000) });
      if (r.ok) return await r.text();
      if (r.status < 500) throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      if (attempt === 2) throw e;
    }
    await new Promise((res) => setTimeout(res, 5000 * (attempt + 1)));
  }
  throw new Error("unreachable");
}

function wfsUrl(endpoint: string, layer: string, extra: Record<string, string>): string {
  const q = new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: `pub:${layer}`, ...extra });
  return `${endpoint}?${q}`;
}

async function hits(s: Source): Promise<number> {
  const xml = await get(wfsUrl(s.endpoint, s.layer, { resultType: "hits" }));
  const m = xml.match(/numberMatched="(\d+)"/);
  if (!m) throw new Error(`no numberMatched in hits response for ${s.layer}`);
  return Number(m[1]);
}

async function previousManifest(month: string): Promise<Map<string, ManifestEntry>> {
  const rawDir = join(DATA, "raw");
  try {
    const months = (await readdir(rawDir)).filter((d) => /^\d{4}-\d{2}$/.test(d) && d < month).sort();
    const last = months.at(-1);
    if (!last) return new Map();
    const m = JSON.parse(await readFile(join(rawDir, last, "manifest.json"), "utf8")) as { entries: ManifestEntry[] };
    return new Map(m.entries.map((e) => [e.id, e]));
  } catch {
    return new Map();
  }
}

async function pull(s: Source, outDir: string, prev?: ManifestEntry): Promise<ManifestEntry> {
  const pulledAt = new Date().toISOString();
  const requestUrl = wfsUrl(s.endpoint, s.layer, { outputFormat: "application/json", sortBy: "OBJECTID", count: String(PAGE) });
  const total = await hits(s);
  const change = prev?.hits ? (total - prev.hits) / prev.hits : undefined;
  const entry: ManifestEntry = { id: s.id, layer: s.layer, requestUrl, pulledAt, hits: total, previousHits: prev?.hits, change, status: hitsOnly ? "hits-only" : "ok" };
  if (change !== undefined && Math.abs(change) > MAX_CHANGE) {
    if (known.has(s.id)) entry.note = `count changed ${(change * 100).toFixed(1)}%: ${known.get(s.id)}`;
    else {
      entry.status = "rejected";
      entry.note = `count changed ${(change * 100).toFixed(1)}% since last month with no known cause`;
      return entry;
    }
  }
  if (hitsOnly) return entry;

  const hash = createHash("sha256");
  const pages: string[] = [];
  let n = 0;
  for (let start = 0; start < total; start += PAGE) {
    const body = await get(`${requestUrl}&startIndex=${start}`);
    const fc = JSON.parse(body) as { features: unknown[] };
    n += fc.features.length;
    const chunk = fc.features.map((f) => JSON.stringify(f)).join("\n");
    pages.push(chunk);
    hash.update(chunk);
    process.stdout.write(`  ${s.id}: ${n}/${total}\r`);
  }
  if (n !== total) {
    entry.status = "rejected";
    entry.note = `pulled ${n} features but the server reported ${total}`;
    return entry;
  }
  const file = `${s.id}.ndjson.gz`;
  await writeFile(join(outDir, file), gzipSync(pages.filter(Boolean).join("\n") + "\n"));
  return { ...entry, features: n, sha256: hash.digest("hex"), file };
}

async function main() {
  const { sources } = JSON.parse(await readFile(join(DATA, "sources.json"), "utf8")) as { sources: Source[] };
  const month = new Date().toISOString().slice(0, 7);
  const outDir = join(DATA, "raw", month);
  await mkdir(outDir, { recursive: true });
  const prev = await previousManifest(month);
  const entries: ManifestEntry[] = [];
  for (const s of sources.filter((x) => x.access === "wfs" && (!onlyLayer || x.id === onlyLayer))) {
    try {
      const e = await pull(s, outDir, prev.get(s.id));
      entries.push(e);
      console.log(`${e.status.padEnd(9)} ${s.id.padEnd(22)} ${String(e.hits).padStart(9)}${e.change !== undefined ? ` (${(e.change * 100).toFixed(1)}%)` : ""}${e.note ? `  ${e.note}` : ""}`);
    } catch (err) {
      entries.push({ id: s.id, layer: s.layer, requestUrl: "", pulledAt: new Date().toISOString(), hits: 0, status: "failed", note: String(err) });
      console.log(`failed    ${s.id}: ${String(err)}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  await writeFile(join(outDir, "manifest.json"), JSON.stringify({ month, createdAt: new Date().toISOString(), hitsOnly, entries }, null, 2));
  const bad = entries.filter((e) => e.status === "rejected" || e.status === "failed");
  console.log(`\n${entries.length} layers, ${bad.length} rejected or failed. Manifest: data/raw/${month}/manifest.json`);
  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
