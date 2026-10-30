import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import * as turf from "@turf/turf";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { BylawEntry, DigitisedRuleProps } from "@slotscout/engine";
import { sectionMaps } from "../build/closedAreas.js";
import { currentMonth } from "../lib/config.js";
import { areaShape, lookupArea, muIds, wfsQuery } from "../lib/gazetteer.js";
import { gdalAvailable, run } from "../lib/mapimage.js";
import { P, monthDir } from "../lib/paths.js";
import { loadItems, type ReviewItem } from "../lib/review.js";
import { ensureDir, listFiles, log, progress, readJson, readJsonIf, sha256, writeJson } from "../lib/util.js";
import type { ClosedAreaMap } from "./pull.js";
import { loadTasks, type Task } from "./queue.js";

/**
 * The map editor's data (data/workbench/): every closed-area section and every jurisdiction's bylaw, sorted into
 * not done, not confirmed and confirmed, with the exact legal wording, what the pipeline read and found, and the
 * pictures a person needs to draw or fix a shape: the Province's closed-area maps (as pages, and warped so the
 * site can lay them over the map) and the bylaw pages with their schedule maps. The site only reads these files;
 * people's drawings come back as contributions (steps/contributions.ts).
 */
export type Folder = "not_done" | "not_confirmed" | "confirmed";
type RuleFeature = Feature<Polygon | MultiPolygon, DigitisedRuleProps & Record<string, unknown>>;

const OUT = () => join(P.data, "workbench");
const IMG = () => join(OUT(), "img");

export const QUALITY_LABEL: Record<string, string> = {
  exact: "exact outline",
  map_image: "read from the Province's map",
  traced: "walk traced along the named features",
  corners: "walk with some straight sides",
  vicinity: "zone around the places named",
  whole_feature: "whole lots or waterbody",
  hand_drawn: "drawn by a person",
};

/** Which folder a closed-area section belongs in: confirmed only when a person approved an exact outline. */
export function closedAreaFolder(approved: DigitisedRuleProps | null, candidate: DigitisedRuleProps | null, failed: string[]): { folder: Folder; state: string; quality: string | null } {
  if (approved) {
    const q = approved.approximate ? (approved.approximate_quality ?? "corners") : "exact";
    if (!approved.approximate) return { folder: "confirmed", state: `Approved: ${QUALITY_LABEL[q]}`, quality: q };
    return { folder: "not_confirmed", state: `Approved, but approximate: ${QUALITY_LABEL[q] ?? q}`, quality: q };
  }
  if (candidate) {
    const q = candidate.approximate ? (candidate.approximate_quality ?? "corners") : "exact";
    return { folder: "not_confirmed", state: failed.length ? `Held: ${failed.join(", ")}` : `Drawn by code (${QUALITY_LABEL[q] ?? q}), waiting for review`, quality: q };
  }
  return { folder: "not_done", state: "Not drawn", quality: null };
}

/** Which folder a jurisdiction's bylaw belongs in. */
export function bylawFolder(entry: BylawEntry, docs: number, zones: number): { folder: Folder; state: string } {
  if (entry.status === "not_applicable") return { folder: "confirmed", state: "No firearm bylaw applies" };
  if (entry.status === "reviewed") {
    if (entry.targetShooting === "prohibited") return { folder: "confirmed", state: "Bans discharge where it applies" };
    if (entry.targetShooting === "no_bylaw") return { folder: "confirmed", state: "No discharge bylaw" };
    return zones ? { folder: "confirmed", state: `Zoned bylaw, ${zones} zone${zones > 1 ? "s" : ""} drawn` } : { folder: "not_confirmed", state: "Zoned bylaw: its zones are not drawn yet" };
  }
  if (docs) return { folder: "not_confirmed", state: "Bylaw read, waiting for review" };
  return { folder: "not_done", state: "Bylaw not found yet" };
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const round = (b: number[]) => b.map((v) => Math.round(v * 1e5) / 1e5) as [number, number, number, number];

function ruleFeatures(ruleId: string): RuleFeature[] {
  return readJsonIf<{ features: RuleFeature[] }>(join(P.rules, `${ruleId}.geojson`), { features: [] }).features;
}

/** Images already rendered from the same source file are kept (manifest of source hashes). */
type ImgManifest = Record<string, string>;

function render(manifest: ImgManifest, name: string, sourceSha: string, make: (out: string) => void): string | null {
  const out = join(IMG(), name);
  if (manifest[name] === sourceSha && existsSync(out)) return name;
  try {
    make(out);
    if (!existsSync(out)) return null;
    manifest[name] = sourceSha;
    return name;
  } catch (e) {
    log("workbench", `could not render ${name}: ${(e as Error).message.split("\n")[0]}`);
    return null;
  }
}

/** One page of a PDF as a JPEG (pdftoppm), at a resolution fit for a side panel. */
function pageJpeg(pdf: string, page: number, dpi: number, out: string): void {
  const stem = out.replace(/\.jpg$/, "");
  run("pdftoppm", ["-q", "-jpeg", "-jpegopt", "quality=70", "-r", String(dpi), "-f", String(page), "-l", String(page), "-singlefile", pdf, stem]);
}

const WEB_MERCATOR_R = 6378137;
const toLonLat = ([x, y]: number[]) => [(x! / WEB_MERCATOR_R) * (180 / Math.PI), (2 * Math.atan(Math.exp(y! / WEB_MERCATOR_R)) - Math.PI / 2) * (180 / Math.PI)];

/**
 * A georeferenced map PDF warped to Web Mercator inside its map frame, with transparent margins, so the site can
 * lay it over the map exactly. Returns the four corners (top-left, top-right, bottom-right, bottom-left) as lon/lat.
 */
function overlay(pdf: string, out: string): number[][] {
  const work = mkdtempSync(join(tmpdir(), "slotscout-overlay-"));
  try {
    const info = JSON.parse(run("gdalinfo", ["-json", pdf])) as { geoTransform?: number[]; metadata?: Record<string, Record<string, string>> };
    const neat = info.metadata?.[""]?.NEATLINE;
    const gt = info.geoTransform;
    if (!neat || !gt) throw new Error("no georeferenced map frame");
    const xy = [...neat.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const xs = xy.map((p) => p[0]!);
    const ys = xy.map((p) => p[1]!);
    const dpi = 90;
    const px = (Math.hypot(gt[1]!, gt[2]!) * 72) / dpi;
    const crop = join(work, "crop.tif");
    run("gdalwarp", ["-q", "--config", "GDAL_PDF_DPI", String(dpi), "-te", String(Math.min(...xs)), String(Math.min(...ys)), String(Math.max(...xs)), String(Math.max(...ys)), "-tr", String(px), String(px), pdf, crop]);
    const merc = join(work, "merc.tif");
    run("gdalwarp", ["-q", "-t_srs", "EPSG:3857", "-r", "bilinear", "-dstalpha", crop, merc]);
    run("gdal_translate", ["-q", "-of", "WEBP", "-co", "QUALITY=72", merc, out]);
    rmSync(`${out}.aux.xml`, { force: true });
    const c = (JSON.parse(run("gdalinfo", ["-json", merc])) as { cornerCoordinates: Record<string, number[]> }).cornerCoordinates;
    return [c.upperLeft!, c.upperRight!, c.lowerRight!, c.lowerLeft!].map((p) => toLonLat(p).map((v) => Math.round(v * 1e6) / 1e6));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

interface MapRef {
  file: string;
  title: string;
  url: string;
  page: string | null;
  overlay: { image: string; corners: number[][] } | null;
}

function closedAreaMapRefs(maps: ClosedAreaMap[], month: string, manifest: ImgManifest, gdal: boolean, done: Map<string, MapRef>): MapRef[] {
  return maps.map((m) => {
    const hit = done.get(m.file);
    if (hit) return hit;
    const dir = join(monthDir(month), "closed_area_maps");
    const pdf = [join(dir, m.file), join(dir, "large", m.file)].find(existsSync);
    const stem = `ca-map-${slug(m.file.replace(/\.pdf$/i, ""))}`;
    let page: string | null = null;
    let ov: MapRef["overlay"] = null;
    if (pdf) {
      page = render(manifest, `${stem}.jpg`, m.sha256, (out) => pageJpeg(pdf, 1, 50, out));
      // Without GDAL (outside the ingest container) the overlay from the last run is kept as it is.
      let corners: number[][] | null = null;
      const name = `${stem}.overlay.webp`;
      const img = gdal
        ? render(manifest, name, m.sha256, (out) => {
            corners = overlay(pdf, out);
            writeJson(`${out}.json`, { corners });
          })
        : existsSync(join(IMG(), name))
          ? name
          : null;
      corners ??= readJsonIf<{ corners: number[][] } | null>(join(IMG(), `${name}.json`), null)?.corners ?? null;
      if (img && corners) ov = { image: img, corners };
    }
    const ref = { file: m.file, title: m.title, url: m.url, page, overlay: ov };
    done.set(m.file, ref);
    return ref;
  });
}

function shortWhy(why: string[]): string[] {
  return why
    .filter((w) => !/^every permanent boundary is reviewed/.test(w))
    .map((w) => (w.length > 240 ? `${w.slice(0, 237)}…` : w))
    .slice(0, 12);
}

async function closedAreas(month: string, manifest: ImgManifest, gdal: boolean) {
  const items = loadItems(month).filter((i) => i.kind === "closed_area" && i.rule_id);
  const tasks = new Map(loadTasks().filter((t) => t.kind === "closed_area" && t.month === month).map((t) => [String(t.meta.ruleId), t]));
  const regions = readJsonIf<{ regions: { region: string; name: string }[] }>(join(P.data, "wildlife-coverage.json"), { regions: [] }).regions;
  const mapsDone = new Map<string, MapRef>();
  const byRule = new Map<string, ReviewItem[]>();
  for (const it of items) byRule.set(it.rule_id!, [...(byRule.get(it.rule_id!) ?? []), it]);
  const out: Record<string, unknown>[] = [];
  ensureDir(join(OUT(), "closed-areas"));
  let n = 0;
  for (const [ruleId, its] of [...byRule.entries()].sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }))) {
    const it = its.find((i) => i.feature) ?? its[0]!;
    const t = tasks.get(ruleId) as Task | undefined;
    const feats = ruleFeatures(ruleId);
    const approved = [...feats].reverse().find((f) => f.properties.status === "approved") ?? null;
    const candidate = (it.status === "open" && (it.feature as RuleFeature | undefined)) || null;
    const failed = (it.validation ?? []).filter((v) => v.passed === false && v.check !== "two independent extractions agree").map((v) => v.check);
    const c = closedAreaFolder(approved?.properties ?? null, candidate?.properties ?? null, failed);
    const shape = approved ?? candidate;
    const a1 = ((it.runs?.run1 as { answer?: Record<string, any> } | undefined)?.answer ?? null) as Record<string, any> | null;
    const within = a1?.within ? { type: String(a1.within.type), name: String(a1.within.name) } : null;
    const mu = within ? muIds(within.name)[0] : undefined;
    let region = mu ? mu.split("-")[0]! : null;
    let bbox: number[] | null = shape ? round(turf.bbox(shape)) : null;
    if (!bbox && within) {
      try {
        const l = await lookupArea(within.type, within.name);
        const s = l.status === "ok" ? areaShape(l) : null;
        if (s) bbox = round(turf.bbox(s));
      } catch {
        // No focus area: the editor starts at the province view.
      }
    }
    // No management unit in the text: the region of the official unit at the middle of the shape or area.
    if (!region && bbox) region = await regionAt([(bbox[0]! + bbox[2]!) / 2, (bbox[1]! + bbox[3]!) / 2]);
    const maps = t ? closedAreaMapRefs(sectionMaps(t, month), month, manifest, gdal, mapsDone) : [];
    const heading = it.title.match(/\(([^)]+)\)\s*$/)?.[1] ?? it.title;
    const g = (a1?.geometry ?? {}) as Record<string, any>;
    writeJson(join(OUT(), "closed-areas", `${ruleId}.json`), {
      id: ruleId,
      itemId: it.item_id,
      title: it.title,
      heading,
      folder: c.folder,
      state: c.state,
      quality: c.quality,
      sourceText: it.source.text,
      sourceUrl: it.source.url,
      sourceVersion: it.source.version,
      quotes: it.quotes ?? {},
      extracted: {
        effect: a1?.effect ?? null,
        period: a1?.period ?? null,
        within,
        method: g.method ?? null,
        feature: g.feature ?? null,
        road: g.road ?? null,
        bufferM: g.buffer_m ?? null,
        steps: Array.isArray(g.steps) ? g.steps.map((s: Record<string, unknown>) => ({ follow: s.follow ?? null, feature: s.feature ?? null, until: s.until ?? null, quote: s.quote ?? null })) : [],
      },
      runsAgree: !(it.disagreements ?? []).length,
      why: shortWhy(it.why ?? []),
      validation: it.validation ?? [],
      construction: it.construction ?? [],
      lookups: ((it.lookups ?? []) as Record<string, unknown>[]).map((l) => ({ query: l.query, kind: l.kind, layer: l.layer, status: l.status, note: l.note ?? null })),
      maps,
      decided: it.status !== "open" ? { status: it.status, by: it.decided_by ?? null, on: it.decided_on ?? null, note: it.note ?? null } : null,
    });
    out.push({
      id: ruleId,
      title: heading,
      schedule: t?.meta.schedule ?? ruleId.slice(1).split("-")[0],
      section: t?.meta.section ?? null,
      effect: approved?.properties.effect ?? candidate?.properties.effect ?? a1?.effect ?? null,
      region,
      regionName: regions.find((r) => r.region === region)?.name ?? null,
      folder: c.folder,
      state: c.state,
      quality: c.quality,
      km2: shape ? Math.round((turf.area(shape) / 1e6) * 100) / 100 : null,
      bbox,
      hasMap: maps.some((m) => m.overlay || m.page),
      issues: shortWhy(it.why ?? []).length,
    });
    progress("workbench", "closed-area sections", ++n, byRule.size, `${ruleId}: ${c.folder}`);
  }
  return out;
}

async function regionAt([lon, lat]: number[]): Promise<string | null> {
  try {
    const fs = await wfsQuery("WHSE_WILDLIFE_MANAGEMENT.WAA_WILDLIFE_MGMT_UNITS_SVW", `INTERSECTS(GEOMETRY,SRID=4326;POINT(${lon!.toFixed(5)} ${lat!.toFixed(5)}))`, 1);
    const id = String(fs[0]?.properties.WILDLIFE_MGMT_UNIT_ID ?? "");
    return id ? id.split("-")[0]! : null;
  } catch {
    return null;
  }
}

/** Bylaw text as the splitter read it, clause by clause in document order. */
function bylawText(units: { kind: string; text: string; meta: Record<string, unknown> }[], doc: string): string {
  return units
    .filter((u) => u.kind === "bylaw_clause" && u.meta.doc === doc)
    .map((u) => u.text)
    .join("\n\n");
}

function bylawPdf(units: { meta: Record<string, unknown>; file?: string }[], doc: string): string | null {
  const f = units.find((u) => u.meta.doc === doc && u.file)?.file;
  if (!f) return null;
  const pdf = join(P.root, f.replace(/\.(txt?|html?)$/i, ".pdf"));
  for (const p of [pdf, join(pdf, "..", "large", basename(pdf))]) if (existsSync(p) && p.toLowerCase().endsWith(".pdf")) return p;
  return null;
}

function pdfPages(pdf: string): number {
  return Number(run("pdfinfo", [pdf]).match(/Pages:\s+(\d+)/)?.[1] ?? 0);
}

function bylaws(month: string, manifest: ImgManifest) {
  const reg = readJson<{ entries: BylawEntry[] }>(join(P.data, "bylaws.json")).entries;
  const sites = readJsonIf<{ sites: { key: string; name: string; website?: string; coversElectoralAreasOf?: string; covers?: string[] }[] }>(join(P.data, "bylaw-sites.json"), { sites: [] }).sites;
  const docs = listFiles(join(P.rules, "bylaws"), (f) => f.endsWith(".json")).map((f) => readJson<Record<string, any>>(f));
  const raw = readJsonIf<{ units: { kind: string; text: string; meta: Record<string, unknown>; file?: string }[] } | { kind: string; text: string; meta: Record<string, unknown>; file?: string }[]>(join(monthDir(month), "units.json"), { units: [] });
  const units = Array.isArray(raw) ? raw : raw.units;
  const zones = listFiles(P.rules, (f) => f.endsWith(".geojson"))
    .flatMap((f) => readJson<{ features: RuleFeature[] }>(f).features)
    .filter((f) => /^L[123]-/.test(String(f.properties.rule_id)) && f.properties.status === "approved");
  ensureDir(join(OUT(), "bylaws"));
  const out: Record<string, unknown>[] = [];
  let n = 0;
  for (const e of reg) {
    const mine = docs.filter((d) => d.jurisdiction === e.key || (d.covers ?? []).includes(e.key));
    const z = zones.filter((f) => (f.properties as Record<string, unknown>).jurisdiction === e.key).length;
    const c = bylawFolder(e, mine.length, z);
    const site =
      sites.find((s) => s.key === e.key) ??
      sites.find((s) => (s.covers ?? []).includes(e.key)) ??
      (e.kind === "electoral_area" ? sites.find((s) => s.coversElectoralAreasOf && s.coversElectoralAreasOf === e.regionalDistrict) : undefined);
    const id = slug(e.key);
    const docOut = mine.map((d) => {
      const a = (d.parts?.[0]?.answer ?? {}) as Record<string, any>;
      const pdf = bylawPdf(units, d.doc);
      const pages: string[] = [];
      if (pdf) {
        const sha = sha256(`${pdf}:${statSync(pdf).size}`);
        const count = Math.min(16, pdfPages(pdf));
        for (let p = 1; p <= count; p++) {
          const name = render(manifest, `bylaw-${slug(String(d.doc))}-p${p}.jpg`, sha, (o) => pageJpeg(pdf, p, 80, o));
          if (name) pages.push(name);
        }
      }
      return {
        doc: d.doc,
        title: d.title,
        number: d.number,
        url: d.url ?? e.bylaw?.url ?? null,
        status: d.status,
        runsAgree: d.run_agreement,
        targetShooting: a.target_shooting ?? null,
        prohibitions: a.prohibitions ?? [],
        exceptions: a.exceptions ?? [],
        distanceRules: a.distance_rules ?? [],
        scheduleMaps: a.schedule_maps ?? [],
        text: bylawText(units, d.doc),
        pages,
      };
    });
    writeJson(join(OUT(), "bylaws", `${id}.json`), {
      id,
      key: e.key,
      name: e.name,
      kind: e.kind,
      regionalDistrict: e.regionalDistrict ?? null,
      folder: c.folder,
      state: c.state,
      entry: e,
      website: site?.website ?? null,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(`${e.name} firearm discharge bylaw`)}`,
      docs: docOut,
      zones: z,
    });
    out.push({ id, key: e.key, name: e.name, kind: e.kind, regionalDistrict: e.regionalDistrict ?? null, folder: c.folder, state: c.state, status: e.status, targetShooting: e.targetShooting ?? null, docs: mine.length, zones: z, hasPages: docOut.some((d) => d.pages.length) });
    progress("workbench", "jurisdictions", ++n, reg.length, `${e.name}: ${c.folder}`);
  }
  return out;
}

const counts = (items: { folder: string }[]) => Object.fromEntries((["not_done", "not_confirmed", "confirmed"] as const).map((f) => [f, items.filter((i) => i.folder === f).length]));

export async function workbench(opts: { month?: string } = {}) {
  const month = currentMonth(opts.month);
  ensureDir(IMG());
  const manifestPath = join(IMG(), "manifest.json");
  const manifest = readJsonIf<ImgManifest>(manifestPath, {});
  const gdal = gdalAvailable();
  if (!gdal) log("workbench", "GDAL is not available here: map overlays are kept from the last run (run this step in the ingest container to refresh them)");
  const builtAt = new Date().toISOString();
  const ca = await closedAreas(month, manifest, gdal);
  writeJson(join(OUT(), "closed-areas.json"), { month, builtAt, counts: counts(ca as { folder: string }[]), items: ca });
  const bl = bylaws(month, manifest);
  writeJson(join(OUT(), "bylaws.json"), { month, builtAt, counts: counts(bl as { folder: string }[]), items: bl });
  writeJson(manifestPath, Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))));
  const summary = { closedAreas: counts(ca as { folder: string }[]), bylaws: counts(bl as { folder: string }[]), images: Object.keys(manifest).length };
  log("workbench", `data/workbench written: ${JSON.stringify(summary)}`);
  return summary;
}
