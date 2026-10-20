import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { DISTRICT_PAGES, ROAD_NOTICES_BASE, parseNoticesPage } from "@slotscout/engine";
import { config, currentMonth } from "../lib/config.js";
import { pullLayer } from "../lib/gis.js";
import { fetchBuffer, fetchText, userAgent } from "../lib/http.js";
import { addFile, clearFailure, fail, loadManifest, resetSource, saveManifest, setSource, type Manifest } from "../lib/manifest.js";
import { P, monthDir } from "../lib/paths.js";
import { pdfTextFile, readPdf } from "../lib/pdf.js";
import { loadRegistry, type Source } from "../lib/registry.js";
import { ensureDir, listFiles, log, progress, readJsonIf, rel, sha256, writeText } from "../lib/util.js";
import { pullBylaws } from "./bylaws.js";

/**
 * Step 1 (RUNBOOK; Addendum A 10.3 steps 3, 4, 9, 10): pull every source in the register into
 * raw/<YYYY-MM>/ unchanged, with SHA-256. Re-runnable: finished parts are skipped unless --force.
 * Failures are logged in the manifest and turn the affected checks grey; nothing is retried by
 * loosening a rule.
 */
export interface PullOpts {
  month?: string;
  only?: string[];
  force?: boolean;
  skip?: string[];
}

function previousMonths(month: string): string[] {
  if (!existsSync(P.raw)) return [];
  return readdirSync(P.raw)
    .filter((d) => /^\d{4}-\d{2}(-[a-z0-9]+)?$/.test(d) && d < month && existsSync(join(P.raw, d, "manifest.json")))
    .sort()
    .reverse();
}

export function previousManifest(month: string): Manifest | null {
  const prev = previousMonths(month)[0];
  return prev ? readJsonIf<Manifest | null>(join(P.raw, prev, "manifest.json"), null) : null;
}

function want(opts: PullOpts, key: string): boolean {
  if (opts.skip?.includes(key)) return false;
  return !opts.only?.length || opts.only.includes(key);
}

async function pullGis(m: Manifest, sources: Source[], opts: PullOpts): Promise<void> {
  const prev = previousManifest(m.month);
  const dir = join(monthDir(m.month), "gis");
  if (opts.skip?.includes("gis")) return;
  const layers = sources.filter((x) => x.pull === "gis" && !opts.skip?.includes(x.id) && (!opts.only?.length || opts.only.includes(x.id) || opts.only.includes("gis")));
  let done = 0;
  for (const s of layers) {
    if (!opts.force && m.layers[s.id]?.status === "ok") {
      progress("pull", "GIS layers", ++done, layers.length, `${s.id} already pulled`);
      continue;
    }
    log("pull", `GIS ${s.id} (${s.layer})`);
    try {
      const entry = await pullLayer(s, dir, prev?.layers[s.id]?.serverCount ?? null);
      m.layers[s.id] = entry;
      setSource(m, s.id, { status: entry.status, detail: `${entry.pulledCount} features${entry.countMatches ? ", count matches the server" : `; ${entry.error}`}`, at: entry.finishedAt });
      if (entry.status === "ok") clearFailure(m, s.id, "layer");
      else fail(m, s.id, "layer", entry.error);
      log("pull", `${s.id}: ${entry.pulledCount} features, ${entry.countMatches ? "count matches" : "COUNT MISMATCH"}, sha256 ${entry.sha256?.slice(0, 12)}`);
    } catch (e) {
      fail(m, s.id, "layer", e);
      setSource(m, s.id, { status: "failed", detail: (e as Error).message, at: new Date().toISOString() });
      log("pull", `${s.id} FAILED: ${(e as Error).message}`);
    }
    saveManifest(m);
    progress("pull", "GIS layers", ++done, layers.length, `${s.id} ${m.layers[s.id]?.status ?? "failed"}`);
  }
}

function storeFile(m: Manifest, source: string, file: string, body: Buffer, url: string | undefined, fetchedAt: string, note?: string): void {
  const maxMb = config().storage.commit_pdf_max_mb;
  const big = body.length > maxMb * 1024 * 1024;
  const target = big ? join(file, "..", "large", basename(file)) : file;
  writeText(target, body);
  addFile(m, { path: rel(target), sha256: sha256(body), bytes: body.length, source, url, fetchedAt, committed: !big, note: big ? `over ${maxMb} MB: hash kept, file not committed${note ? `; ${note}` : ""}` : note });
}

async function pullDistrictPages(m: Manifest, opts: PullOpts): Promise<void> {
  if (!want(opts, "road_notices")) return;
  if (opts.force) log("pull", `--force: replacing ${resetSource(m, ["road_notices", "dm_notices"], ["district_pages", "dm_notices"])} earlier district page and notice PDF file(s) of ${m.month}`);
  const dir = join(monthDir(m.month), "district_pages");
  const pdfDir = join(monthDir(m.month), "dm_notices");
  let ok = 0;
  let tried = 0;
  const pdfs = new Map<string, string>();
  const pages = Object.entries(DISTRICT_PAGES);
  for (const [org, slug] of pages) {
    const file = join(dir, `${org}.html`);
    const url = `${ROAD_NOTICES_BASE}/${slug}`;
    try {
      const res = await fetchText(url, { kind: "page", accept: "text/html" });
      storeFile(m, "road_notices", file, Buffer.from(res.text), url, res.fetchedAt);
      const notices = parseNoticesPage(res.text, org, url);
      for (const n of notices) for (const p of n.pdfs ?? []) pdfs.set(p, org);
      clearFailure(m, "road_notices", org);
      ok++;
      log("pull", `district page ${org}: ${notices.length} notices`);
    } catch (e) {
      fail(m, "road_notices", org, e);
      log("pull", `district page ${org} FAILED: ${(e as Error).message}`);
    }
    saveManifest(m);
    progress("pull", "district road pages", ++tried, pages.length, org);
  }
  const total = Object.keys(DISTRICT_PAGES).length;
  setSource(m, "road_notices", { status: ok === total ? "ok" : ok ? "partial" : "failed", detail: `${ok} of ${total} district pages`, at: new Date().toISOString() });

  // District Manager notice PDFs linked from the notices (Addendum A 10.3 step 10).
  let pdfOk = 0;
  let pdfTried = 0;
  for (const [url, org] of pdfs) {
    const name = `${org}-${sha256(url).slice(0, 8)}-${basename(new URL(url).pathname).replace(/[^\w.-]+/g, "_").slice(0, 80)}`;
    const file = join(pdfDir, name.endsWith(".pdf") ? name : `${name}.pdf`);
    if (!opts.force && m.files.some((f) => f.url === url)) {
      pdfOk++;
      progress("pull", "District Manager PDFs", ++pdfTried, pdfs.size, `${basename(file)} already pulled`);
      continue;
    }
    try {
      const res = await fetchBuffer(url, { kind: "page", accept: "application/pdf" });
      storeFile(m, "dm_notices", file, res.body, url, res.fetchedAt);
      const stored = m.files.find((f) => f.url === url)!;
      const read = readPdf(join(P.root, stored.path), join(pdfDir, "images", basename(file, ".pdf")));
      writeText(file.replace(/\.pdf$/, ".txt"), pdfTextFile({ Source: url, Fetched: res.fetchedAt, "SHA-256": stored.sha256 }, read));
      clearFailure(m, "dm_notices", url);
      pdfOk++;
    } catch (e) {
      fail(m, "dm_notices", url, e);
      log("pull", `notice PDF ${url} FAILED: ${(e as Error).message}`);
    }
    saveManifest(m);
    progress("pull", "District Manager PDFs", ++pdfTried, pdfs.size, basename(file));
  }
  setSource(m, "dm_notices", { status: pdfOk === pdfs.size ? "ok" : pdfOk ? "partial" : pdfs.size ? "failed" : "ok", detail: `${pdfOk} of ${pdfs.size} linked notice PDFs`, at: new Date().toISOString() });
  saveManifest(m);
}

/** BC Laws: the API only after written confirmation; otherwise the person's copies in inbox/ (Addendum A 6.2). */
async function pullBcLaws(m: Manifest, opts: PullOpts): Promise<void> {
  if (!want(opts, "closed_areas") && !want(opts, "bclaws")) return;
  const { api_confirmed, api_document_url, documents } = config().bclaws;
  const dir = join(monthDir(m.month), "bclaws");
  const have: string[] = [];
  const missing: string[] = [];
  for (const doc of documents) {
    if (api_confirmed) {
      const url = api_document_url.replace("{doc}", doc);
      try {
        const res = await fetchBuffer(url, { kind: "api", accept: "application/xml" });
        storeFile(m, "bclaws_api", join(dir, `${doc}.xml`), res.body, url, res.fetchedAt);
        have.push(doc);
      } catch (e) {
        fail(m, "bclaws_api", doc, e);
        missing.push(doc);
      }
      continue;
    }
    const copies = listFiles(join(P.inbox, "bclaws"), (f) => basename(f).startsWith(doc) && /\.(html?|xml|txt|pdf)$/i.test(f));
    if (!copies.length) {
      missing.push(doc);
      continue;
    }
    for (const c of copies) {
      const body = readFileSync(c);
      storeFile(m, "closed_areas", join(dir, basename(c)), body, undefined, statSync(c).mtime.toISOString(), `copied from ${rel(c)}`);
    }
    have.push(doc);
  }
  // Counts regulations in hand, not regulations looked for: the rest wait for a person (or the API).
  progress("pull", "BC Laws regulations in hand", have.length, documents.length, missing.length ? `waiting for ${missing.join(", ")}` : "all in hand");
  const excerpts = listFiles(join(P.inbox, "excerpts"), (f) => f.endsWith(".txt"));
  const how = api_confirmed ? "BC Laws API" : "copies a person saved in inbox/bclaws";
  const { repealed = {}, not_found = {} } = config().bclaws;
  setSource(m, "closed_areas", {
    status: missing.length ? (have.length ? "partial" : "awaiting_person") : "ok",
    detail: `${have.length} of ${documents.length} regulations from ${how}${missing.length ? `; waiting for ${missing.join(", ")}` : ""}${Object.keys(repealed).length ? `; repealed, not pulled: ${Object.keys(repealed).join(", ")}` : ""}${excerpts.length ? `; ${excerpts.length} unconfirmed excerpt(s) in inbox/excerpts` : ""}`,
    at: new Date().toISOString(),
  });
  const waiting = missing.filter((d) => !not_found[d]);
  if (waiting.length) fail(m, "closed_areas", "legal text", `no dated copy of ${waiting.join(", ")}: ${api_confirmed ? "API request failed" : "waiting for the person to save them into inbox/bclaws (BC Laws robots.txt disallows automated clients)"}`);
  else clearFailure(m, "closed_areas", "legal text");
  // What a person found on BC Laws stays visible until they resolve it.
  for (const [doc, note] of Object.entries(not_found)) if (missing.includes(doc)) fail(m, "closed_areas", doc, note);
  for (const [doc, note] of Object.entries(repealed)) fail(m, "closed_areas", doc, note);
  saveManifest(m);
}

/** Copies every new inbox file into raw/<month>/inbox with its hash; never edits inbox/. */
function pullInbox(m: Manifest): void {
  const dir = join(monthDir(m.month), "inbox");
  let n = 0;
  const files = listFiles(P.inbox, (p) => !p.endsWith("README.md"));
  for (const [i, f] of files.entries()) {
    const body = readFileSync(f);
    const target = join(dir, relative(P.inbox, f));
    if (!m.files.some((x) => x.path === rel(target) && x.sha256 === sha256(body))) {
      storeFile(m, "inbox", target, body, undefined, statSync(f).mtime.toISOString(), `copied from ${rel(f)}`);
      n++;
    }
    progress("pull", "inbox files", i + 1, files.length, rel(f));
  }
  log("pull", `inbox: ${n} new file(s)`);
  saveManifest(m);
}

export async function pull(opts: PullOpts = {}): Promise<Manifest> {
  const month = currentMonth(opts.month);
  ensureDir(monthDir(month));
  const m = loadManifest(month, userAgent());
  const reg = loadRegistry();
  const active = reg.sources.filter((s) => s.status !== "planned");
  for (const s of reg.sources.filter((x) => x.status === "planned")) setSource(m, s.id, { status: "skipped", detail: "planned source, not pulled yet", at: new Date().toISOString() });
  if (want(opts, "inbox")) pullInbox(m);
  await pullBcLaws(m, opts);
  await pullDistrictPages(m, opts);
  if (want(opts, "bylaws") || opts.only?.some((o) => o.includes(":"))) await pullBylaws(m, opts);
  await pullGis(m, active, opts);
  saveManifest(m);
  const failed = m.failures.length;
  log("pull", `done: ${Object.values(m.sources).filter((s) => s.status === "ok").length} sources ok, ${failed} failure(s) logged in raw/${month}/manifest.json`);
  return m;
}

