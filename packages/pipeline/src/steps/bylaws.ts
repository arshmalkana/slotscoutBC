import { join } from "node:path";
import { capturePage, closeBrowser, type Capture } from "../lib/capture.js";
import { fetchBuffer } from "../lib/http.js";
import { addFile, clearFailure, fail, saveManifest, setSource, type Manifest } from "../lib/manifest.js";
import { P, monthDir } from "../lib/paths.js";
import { pdfToText } from "../lib/pdf.js";
import { config } from "../lib/config.js";
import { log, readJson, readJsonIf, rel, sha256, writeJson, writeText } from "../lib/util.js";

/**
 * Bylaw finder (Addendum A 6.3, 10.3 step 9): opens each local government's website in the
 * headless browser, follows its bylaw library, collects firearm discharge bylaws and amendments,
 * and saves each page as evidence. robots.txt is checked before every page; a site that blocks
 * automation is recorded and left grey for the data steward, never worked around.
 */
export interface BylawSite {
  key: string;
  name: string;
  website: string;
  region: string;
  coversElectoralAreasOf: string | null;
  covers: string[];
  /** Bylaw document URLs a person has found; downloaded directly (robots.txt still checked). */
  documents?: { title: string; url: string }[];
}

export interface BylawFind {
  key: string;
  name: string;
  website: string;
  status: "found" | "not_found" | "blocked" | "failed";
  checkedAt: string;
  pages: { url: string; title: string; status: number | null; capture: string }[];
  documents: { title: string; url: string; file: string | null; sha256: string | null; textFile: string | null; bytes: number }[];
  services: string[];
  note: string;
}

const BYLAW_LINK = /bylaw/i;
const FIREARM = /firearm|discharg|weapon|shooting|bow and arrow|hunting/i;
const CATEGORY = /regulat|safety|protect|nuisance|public|weapon|firearm|discharg|police|consolidat/i;
const MAX_PAGES = 10;
const slug = (s: string) => s.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 60);

function rankBylawLinks(cap: Capture, site: string): string[] {
  const host = new URL(site).host.replace(/^www\./, "");
  const seen = new Set<string>();
  return cap.links
    .filter((l) => (BYLAW_LINK.test(l.text) || BYLAW_LINK.test(l.href)) && /^https?:/.test(l.href))
    .filter((l) => new URL(l.href).host.replace(/^www\./, "").endsWith(host) || /civicweb|escribe|laserfiche|municipalbylaws|bylaws\./i.test(l.href))
    .sort((a, b) => Number(/^bylaws?$/i.test(b.text.trim())) - Number(/^bylaws?$/i.test(a.text.trim())) || a.text.length - b.text.length)
    .map((l) => l.href.split("#")[0]!)
    .filter((h) => (seen.has(h) ? false : (seen.add(h), true)))
    .slice(0, 3);
}

function firearmLinks(cap: Capture): { text: string; href: string }[] {
  const seen = new Set<string>();
  return cap.links
    .filter((l) => FIREARM.test(l.text) || FIREARM.test(decodeURIComponent(l.href)))
    .filter((l) => /^https?:/.test(l.href) && !/facebook|twitter|instagram|youtube|linkedin|mailto:/i.test(l.href))
    .filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true)))
    .slice(0, 8);
}

async function download(m: Manifest, find: BylawFind, dir: string, title: string, url: string): Promise<void> {
  const res = await fetchBuffer(url, { kind: "page" });
  const isPdf = /pdf/i.test(res.contentType) || /\.pdf($|\?)/i.test(url);
  const maxMb = config().storage.commit_pdf_max_mb;
  const big = res.body.length > maxMb * 1024 * 1024;
  const base = `${slug(title) || "document"}-${sha256(url).slice(0, 6)}`;
  const file = join(dir, big ? "large" : "", `${base}${isPdf ? ".pdf" : ".html"}`);
  writeText(file, res.body);
  const digest = sha256(res.body);
  addFile(m, { path: rel(file), sha256: digest, bytes: res.body.length, source: "bylaws", url, fetchedAt: res.fetchedAt, committed: !big, note: big ? `over ${maxMb} MB: hash kept, file not committed` : undefined });
  let textFile: string | null = null;
  if (isPdf) {
    const text = pdfToText(file);
    if (text) {
      textFile = join(dir, `${base}.txt`);
      writeText(textFile, `Source: ${url}\nTitle: ${title}\nFetched: ${res.fetchedAt}\nSHA-256: ${digest}\n\n${text}`);
    }
  }
  find.documents.push({ title, url, file: rel(file), sha256: digest, textFile: textFile ? rel(textFile) : null, bytes: res.body.length });
}

async function findSite(m: Manifest, site: BylawSite): Promise<BylawFind> {
  const dir = join(monthDir(m.month), "bylaws", slug(site.name));
  const find: BylawFind = { key: site.key, name: site.name, website: site.website, status: "not_found", checkedAt: new Date().toISOString(), pages: [], documents: [], services: [], note: "" };
  const visit = async (url: string, name: string): Promise<Capture> => {
    const cap = await capturePage(url, join(dir, "pages"), name);
    find.pages.push({ url: cap.finalUrl, title: cap.title, status: cap.status, capture: rel(cap.textFile) });
    find.services.push(...cap.services);
    return cap;
  };
  // Documents a person listed come first and need no discovery.
  for (const d of site.documents ?? []) {
    try {
      await download(m, find, dir, d.title, d.url);
    } catch (e) {
      find.note += `${d.url}: ${(e as Error).message}. `;
    }
  }
  if (find.documents.length) {
    find.status = "found";
    find.services = [];
    writeJson(join(dir, "find.json"), find);
    return find;
  }
  try {
    const home = await visit(site.website, "home");
    const candidates = [...firearmLinks(home)];
    // Breadth-first through the site's bylaw section: the bylaw pages, then their category pages
    // (regulatory and public-safety first), at most MAX_PAGES pages per site.
    const host = new URL(site.website).host.replace(/^www\./, "");
    const queue = rankBylawLinks(home, site.website);
    const visited = new Set<string>([site.website]);
    while (queue.length && find.pages.length < MAX_PAGES && candidates.length < 4) {
      const u = queue.shift()!;
      if (visited.has(u)) continue;
      visited.add(u);
      try {
        const page = await visit(u, `bylaws-${find.pages.length}`);
        candidates.push(...firearmLinks(page));
        const base = new URL(page.finalUrl).pathname.replace(/\.html?$/, "").replace(/\/$/, "");
        const sub = page.links
          .filter((l) => /^https?:/.test(l.href) && new URL(l.href).host.replace(/^www\./, "") === host && !/\.(pdf|docx?|xlsx?)($|\?)/i.test(l.href))
          .filter((l) => new URL(l.href).pathname.startsWith(`${base}/`) || /bylaw/i.test(l.text))
          .map((l) => ({ href: l.href.split("#")[0]!, score: CATEGORY.test(l.text) ? 0 : 1 }))
          .filter((l) => !visited.has(l.href))
          .sort((a, b) => a.score - b.score);
        for (const l of sub) if (!queue.includes(l.href)) queue.push(l.href);
        queue.sort((a, b) => Number(!CATEGORY.test(a)) - Number(!CATEGORY.test(b)));
      } catch (e) {
        find.note += `bylaw page ${u}: ${(e as Error).message}. `;
      }
    }
    const seen = new Set<string>();
    for (const c of candidates) {
      if (seen.has(c.href) || find.documents.length >= 4) continue;
      seen.add(c.href);
      try {
        if (/\.pdf($|\?)/i.test(c.href)) await download(m, find, dir, c.text || "bylaw", c.href);
        else {
          const page = await visit(c.href, `doc-${seen.size}`);
          const pdfs = page.links.filter((l) => /\.pdf($|\?)/i.test(l.href) && (FIREARM.test(l.text) || FIREARM.test(l.href) || BYLAW_LINK.test(l.text)));
          for (const p of pdfs.slice(0, 3)) if (!seen.has(p.href)) (seen.add(p.href), await download(m, find, dir, p.text || c.text, p.href));
          if (!pdfs.length && FIREARM.test(page.title)) find.documents.push({ title: page.title, url: page.finalUrl, file: rel(page.htmlFile), sha256: page.htmlSha256, textFile: rel(page.textFile), bytes: 0 });
        }
      } catch (e) {
        find.note += `${c.href}: ${(e as Error).message}. `;
      }
    }
    find.status = find.documents.length ? "found" : "not_found";
    if (!find.documents.length) find.note += `No firearm or discharge bylaw link found in ${find.pages.length} page(s) of the site's bylaw section; a person checks the bylaw library.`;
  } catch (e) {
    const msg = (e as Error).message;
    find.status = /robots/i.test(msg) ? "blocked" : "failed";
    find.note += msg;
  }
  find.services = [...new Set(find.services)];
  writeJson(join(dir, "find.json"), find);
  return find;
}

export async function pullBylaws(m: Manifest, opts: { force?: boolean; only?: string[] } = {}): Promise<BylawFind[]> {
  const all = readJson<{ sites: BylawSite[] }>(join(P.data, "bylaw-sites.json")).sites;
  const picked = (opts.only ?? []).filter((o) => o.includes(":"));
  const sites = picked.length ? all.filter((s) => picked.includes(s.key)) : all;
  const results: BylawFind[] = [];
  const doneFile = join(monthDir(m.month), "bylaws", "finds.json");
  const previous = new Map((opts.force ? [] : readJsonIf<BylawFind[]>(doneFile, [])).map((f) => [f.key, f]));
  try {
    for (const site of sites) {
      const prev = previous.get(site.key);
      if (prev && prev.status !== "failed") {
        results.push(prev);
        continue;
      }
      log("pull", `bylaws: ${site.name}`);
      const f = await findSite(m, site);
      results.push(f);
      if (f.status === "failed" || f.status === "blocked") fail(m, "bylaws", site.key, f.note);
      else clearFailure(m, "bylaws", site.key);
      log("pull", `bylaws: ${site.name}: ${f.status}${f.documents.length ? ` (${f.documents.map((d) => d.title).join("; ").slice(0, 160)})` : ""}`);
      writeJson(doneFile, results);
      saveManifest(m);
    }
  } finally {
    await closeBrowser();
  }
  const found = results.filter((r) => r.status === "found").length;
  setSource(m, "bylaws", { status: found === sites.length ? "ok" : found ? "partial" : "failed", detail: `${found} of ${sites.length} starter-set jurisdictions with a bylaw document found; the rest need a person`, at: new Date().toISOString() });
  saveManifest(m);
  return results;
}
