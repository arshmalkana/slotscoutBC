/**
 * Validates everything under data/ before a release (PRD 5.2, 5.5, Appendix A and B):
 *  - every digitised rule area has all schema fields, valid enums, resolvable seasonal periods,
 *    and, once reviewed, a reviewer who is not the digitiser;
 *  - the bylaw register and Wildlife Act coverage use valid statuses, and "reviewed" rows carry
 *    a confirmation date and a reviewed summary;
 *  - the source register has unique IDs, freshness limits, and rules that exist in the catalogue.
 *
 *   npm run validate:data
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { RULES_BY_ID, resolveEndpoint, type BylawEntry, type DigitisedRuleProps, type RegionCoverage } from "@slotscout/engine";

const DATA = fileURLToPath(new URL("../data/", import.meta.url));
const errors: string[] = [];
const warnings: string[] = [];

const EFFECTS: DigitisedRuleProps["effect"][] = [
  "no_shooting",
  "no_shooting_seasonal",
  "shot_only",
  "shot_only_seasonal",
  "no_rifle",
  "non_toxic",
  "no_shooting_hunting_exempt",
  "no_hunting",
];
const METHODS: DigitisedRuleProps["geometry_method"][] = ["admin_boundary", "road_buffer", "metes_and_bounds", "georeferenced_map", "contour"];
const REQUIRED: (keyof DigitisedRuleProps)[] = [
  "rule_id",
  "authority",
  "source_url",
  "source_text",
  "source_version",
  "effect",
  "period",
  "exemptions",
  "geometry_method",
  "buffer_m",
  "partial_extent",
  "conservative",
  "digitised_by",
  "digitised_on",
  "reviewed_by",
  "reviewed_on",
  "confidence",
  "notes",
];
const STATUSES = ["not_started", "in_progress", "digitised", "reviewed", "not_applicable"];
const isoDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

async function json<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(join(DATA, file), "utf8")) as T;
}

async function digitised() {
  const files = (await readdir(join(DATA, "digitised"))).filter((f) => f.endsWith(".geojson"));
  const ids = new Set<string>();
  let count = 0;
  for (const file of files) {
    const fc = await json<{ type: string; features: { type: string; geometry: { type: string } | null; properties: Partial<DigitisedRuleProps> }[] }>(join("digitised", file));
    if (fc.type !== "FeatureCollection") errors.push(`${file}: not a FeatureCollection`);
    for (const [i, f] of (fc.features ?? []).entries()) {
      count++;
      const where = `${file} #${i} (${f.properties?.rule_id ?? "no rule_id"})`;
      const p = f.properties ?? {};
      for (const k of REQUIRED) if (!(k in p)) errors.push(`${where}: missing field ${k}`);
      if (!f.geometry || !["Polygon", "MultiPolygon"].includes(f.geometry.type)) errors.push(`${where}: geometry must be a Polygon or MultiPolygon`);
      if (p.rule_id) {
        if (ids.has(p.rule_id)) errors.push(`${where}: duplicate rule_id`);
        ids.add(p.rule_id);
        const base = p.rule_id.split("-")[0]!;
        if (!RULES_BY_ID[base]) errors.push(`${where}: rule ${base} is not in the catalogue`);
      }
      if (p.effect && !EFFECTS.includes(p.effect)) errors.push(`${where}: unknown effect ${p.effect}`);
      if (p.geometry_method && !METHODS.includes(p.geometry_method)) errors.push(`${where}: unknown geometry_method ${p.geometry_method}`);
      if (p.confidence && !["high", "medium", "low"].includes(p.confidence)) errors.push(`${where}: confidence must be high, medium or low`);
      if (p.effect?.endsWith("_seasonal")) {
        if (!p.period) errors.push(`${where}: seasonal effect needs a period`);
        else
          for (const e of [p.period.start, p.period.end]) {
            try {
              resolveEndpoint(e, 2026);
            } catch {
              errors.push(`${where}: cannot read period endpoint "${e}"`);
            }
          }
      }
      if (!p.source_text || String(p.source_text).trim().length < 20) errors.push(`${where}: source_text must hold the full legal description`);
      if (!isoDate(p.digitised_on)) errors.push(`${where}: digitised_on must be YYYY-MM-DD`);
      if (p.reviewed_by) {
        if (p.reviewed_by === p.digitised_by) errors.push(`${where}: reviewer must be a second person, never the digitiser`);
        if (!isoDate(p.reviewed_on)) errors.push(`${where}: reviewed_on must be YYYY-MM-DD`);
      } else warnings.push(`${where}: not reviewed yet, so it is ignored and its area stays grey`);
      if (p.partial_extent && !String(p.notes ?? "").length) warnings.push(`${where}: partial_extent should describe the from and to points in notes`);
    }
  }
  return count;
}

async function bylaws() {
  const { entries } = await json<{ entries: BylawEntry[] }>("bylaws.json");
  const keys = new Set<string>();
  for (const b of entries) {
    if (keys.has(b.key)) errors.push(`bylaws: duplicate key ${b.key}`);
    keys.add(b.key);
    if (!STATUSES.includes(b.status)) errors.push(`bylaws: ${b.key} has unknown status ${b.status}`);
    if (b.status === "reviewed") {
      if (!isoDate(b.confirmedOn)) errors.push(`bylaws: ${b.key} is reviewed but has no confirmedOn date`);
      if (!b.targetShooting) errors.push(`bylaws: ${b.key} is reviewed but has no targetShooting summary`);
      if (!b.bylaw?.url && b.targetShooting !== "no_bylaw") errors.push(`bylaws: ${b.key} is reviewed but has no bylaw link`);
    }
  }
  return entries.length;
}

async function coverage() {
  const { regions } = await json<{ regions: RegionCoverage[] }>("wildlife-coverage.json");
  for (const r of regions) {
    if (!STATUSES.includes(r.status)) errors.push(`coverage: region ${r.region} has unknown status ${r.status}`);
    if (r.status === "reviewed" && !isoDate(r.confirmedOn)) errors.push(`coverage: region ${r.region} is reviewed but has no confirmedOn date`);
  }
  return regions.length;
}

async function sources() {
  const { sources } = await json<{ sources: { id: string; freshnessHours: number; rules: string[]; licence: string; owner: string }[] }>("sources.json");
  const ids = new Set<string>();
  for (const s of sources) {
    if (ids.has(s.id)) errors.push(`sources: duplicate id ${s.id}`);
    ids.add(s.id);
    if (!(s.freshnessHours > 0)) errors.push(`sources: ${s.id} needs a freshness limit`);
    if (!s.licence || !s.owner) errors.push(`sources: ${s.id} needs an owner and a licence`);
    for (const r of s.rules) if (!RULES_BY_ID[r]) errors.push(`sources: ${s.id} lists unknown rule ${r}`);
  }
  for (const rule of Object.values(RULES_BY_ID)) for (const s of rule.sources) if (!ids.has(s)) errors.push(`catalogue: rule ${rule.id} uses unregistered source ${s}`);
  return sources.length;
}

const counts = { digitised: await digitised(), bylaws: await bylaws(), regions: await coverage(), sources: await sources() };
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(`Checked ${counts.digitised} digitised areas, ${counts.bylaws} bylaw rows, ${counts.regions} regions, ${counts.sources} sources: ${errors.length} errors, ${warnings.length} warnings.`);
process.exit(errors.length ? 1 : 0);
