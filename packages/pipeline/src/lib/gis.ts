import { createHash } from "node:crypto";
import { createWriteStream, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createGzip } from "node:zlib";
import { config } from "./config.js";
import { politeFetch } from "./http.js";
import type { LayerEntry } from "./manifest.js";
import type { Source } from "./registry.js";
import { ensureDir, log } from "./util.js";

/**
 * Province-wide GIS pulls (main spec 4.1; Addendum A 10.3 step 3). Each layer is paged through in
 * full; every feature's geometry and attributes are hashed, and the layer hash is the hash of the
 * sorted feature hashes, so it changes only when the content does. Done when the pulled count
 * equals the server's own count.
 */

interface Page {
  features: { id?: string; geometry: unknown; properties: Record<string, unknown> }[];
  numberMatched?: number;
  totalFeatures?: number;
}

function wfsUrl(s: Source, params: Record<string, string>): string {
  const u = new URL(s.endpoint);
  u.search = new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: s.layer, ...params }).toString();
  return u.toString();
}

export async function wfsHits(s: Source): Promise<number> {
  const r = await politeFetch(wfsUrl(s, { resultType: "hits" }), { kind: "api" });
  const m = (await r.text()).match(/numberMatched="(\d+)"/);
  if (!m) throw new Error("no numberMatched in hits response");
  return Number(m[1]);
}

async function wfsSortKey(s: Source): Promise<string | null> {
  const r = await politeFetch(wfsUrl(s, { outputFormat: "application/json", count: "1" }), { kind: "api" });
  const page = (await r.json()) as Page;
  const props = page.features[0]?.properties ?? {};
  if ("OBJECTID" in props) return "OBJECTID";
  return Object.keys(props).find((k) => /_ID$/.test(k) && typeof props[k] === "number") ?? null;
}

async function arcgisCount(s: Source): Promise<number> {
  const u = new URL(`${s.endpoint}/query`);
  u.search = new URLSearchParams({ where: s.where ?? "1=1", returnCountOnly: "true", f: "json" }).toString();
  const r = await politeFetch(u.toString(), { kind: "api" });
  const j = (await r.json()) as { count?: number; error?: { message: string } };
  if (typeof j.count !== "number") throw new Error(j.error?.message ?? "no count");
  return j.count;
}

export async function serverCount(s: Source): Promise<number> {
  return s.endpoint.includes("/arcgis/rest/") ? arcgisCount(s) : wfsHits(s);
}

export async function pullLayer(s: Source, outDir: string, previousCount: number | null): Promise<LayerEntry> {
  const { page_size, store_bodies_up_to_features, max_count_change } = config().gis;
  const startedAt = new Date().toISOString();
  const isArc = s.endpoint.includes("/arcgis/rest/");
  const before = await serverCount(s);
  const keep = before <= store_bodies_up_to_features;
  ensureDir(outDir);
  const tmp = join(outDir, `${s.id}.ndjson.gz.tmp`);
  const gz = keep ? createGzip() : null;
  const out = keep ? createWriteStream(tmp) : null;
  if (gz && out) gz.pipe(out);
  const hashes: string[] = [];
  let bytes = 0;
  let pages = 0;
  const sortBy = isArc ? "OBJECTID" : await wfsSortKey(s);
  const size = isArc ? 1000 : page_size;
  for (let start = 0; ; start += size) {
    let url: string;
    if (isArc) {
      const u = new URL(`${s.endpoint}/query`);
      u.search = new URLSearchParams({ where: s.where ?? "1=1", outFields: "*", f: "geojson", orderByFields: "OBJECTID", resultOffset: String(start), resultRecordCount: String(size) }).toString();
      url = u.toString();
    } else {
      url = wfsUrl(s, { outputFormat: "application/json", count: String(size), startIndex: String(start), ...(sortBy ? { sortBy } : {}) });
    }
    const r = await politeFetch(url, { kind: "api", timeoutMs: 300_000 });
    const text = await r.text();
    bytes += text.length;
    const page = JSON.parse(text) as Page;
    pages++;
    for (const f of page.features) {
      const line = JSON.stringify([f.geometry, f.properties]);
      hashes.push(createHash("sha256").update(line).digest("hex").slice(0, 32));
      gz?.write(JSON.stringify(f) + "\n");
    }
    if (pages % 20 === 0) log("pull", `${s.id}: ${hashes.length.toLocaleString("en-CA")} of ${before.toLocaleString("en-CA")}`);
    if (page.features.length < size) break;
  }
  if (gz && out) {
    await new Promise<void>((res, rej) => {
      out.on("finish", res).on("error", rej);
      gz.end();
    });
    renameSync(tmp, join(outDir, `${s.id}.ndjson.gz`));
  } else rmSync(tmp, { force: true });
  hashes.sort();
  const layerHash = createHash("sha256").update(hashes.join("\n")).digest("hex");
  const after = await serverCount(s);
  const countMatches = hashes.length === after;
  const countChange = previousCount ? (after - previousCount) / previousCount : null;
  const entry: LayerEntry = {
    id: s.id,
    layer: s.layer,
    endpoint: s.endpoint,
    serverCount: after,
    pulledCount: hashes.length,
    sha256: layerHash,
    bytes,
    pages,
    sortBy,
    bodyStored: keep,
    status: countMatches ? "ok" : "failed",
    countMatches,
    previousCount,
    countChange,
    startedAt,
    finishedAt: new Date().toISOString(),
    error: countMatches ? undefined : `pulled ${hashes.length}, server reports ${after} (was ${before} at the start)`,
  };
  if (countChange !== null && Math.abs(countChange) > max_count_change) {
    log("pull", `${s.id}: count changed ${(countChange * 100).toFixed(1)}% since last month; flagged in the change report`);
  }
  return entry;
}
