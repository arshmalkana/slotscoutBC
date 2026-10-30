import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { RULES_BY_ID, resolveEndpoint, type BylawEntry, type DigitisedRuleProps, type RegionCoverage } from "@slotscout/engine";
import { schemaErrors } from "../lib/answers.js";
import { P } from "../lib/paths.js";
import { loadRegistry } from "../lib/registry.js";
import { listFiles, log, readJson, rel } from "../lib/util.js";

/**
 * Step 6: schema checks for every register and rule file before anything is released (main spec
 * 5.2, 5.5, Appendix A and B; Addendum A 9). Fails on errors; warnings are listed for the report.
 */
const EFFECTS: DigitisedRuleProps["effect"][] = ["no_shooting", "no_shooting_seasonal", "shot_only", "shot_only_seasonal", "no_rifle", "non_toxic", "no_shooting_hunting_exempt", "no_hunting"];
const METHODS: DigitisedRuleProps["geometry_method"][] = ["admin_boundary", "road_buffer", "metes_and_bounds", "georeferenced_map", "contour", "named_places", "hand_drawn"];
const REQUIRED: (keyof DigitisedRuleProps)[] = ["rule_id", "authority", "source_url", "source_text", "source_version", "effect", "period", "exemptions", "geometry_method", "buffer_m", "partial_extent", "conservative", "digitised_by", "digitised_on", "reviewed_by", "reviewed_on", "confidence", "notes"];
const STATUSES = ["not_started", "in_progress", "digitised", "reviewed", "not_applicable"];
const FEATURE_STATUS = ["candidate", "provisional", "approved", "retired"];
const isoDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function validate(_opts: { month?: string } = {}) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Rule features (rules/*.geojson): one file per rule ID.
  let features = 0;
  for (const file of listFiles(P.rules, (f) => f.endsWith(".geojson"))) {
    const fc = readJson<{ type: string; features: { geometry: { type: string } | null; properties: Partial<DigitisedRuleProps> & Record<string, unknown> }[] }>(file);
    const name = rel(file);
    if (fc.type !== "FeatureCollection") errors.push(`${name}: not a FeatureCollection`);
    const approvedPerRule = new Map<string, number>();
    for (const [i, f] of (fc.features ?? []).entries()) {
      features++;
      const p = f.properties ?? {};
      const where = `${name} #${i} (${p.rule_id ?? "no rule_id"} v${p.version ?? "?"})`;
      for (const k of REQUIRED) if (!(k in p)) errors.push(`${where}: missing field ${k}`);
      if (!f.geometry || !["Polygon", "MultiPolygon"].includes(f.geometry.type)) errors.push(`${where}: geometry must be a Polygon or MultiPolygon`);
      if (p.rule_id) {
        const base = p.rule_id.split("-")[0]!;
        if (!RULES_BY_ID[base]) errors.push(`${where}: rule ${base} is not in the catalogue`);
        if (basename(file, ".geojson") !== p.rule_id && !/^(closed-areas|bylaw-zones)$/.test(basename(file, ".geojson"))) errors.push(`${where}: stored in the wrong file (one file per rule ID)`);
      }
      if (p.effect && !EFFECTS.includes(p.effect)) errors.push(`${where}: unknown effect ${p.effect}`);
      if (p.geometry_method && !METHODS.includes(p.geometry_method)) errors.push(`${where}: unknown geometry_method ${p.geometry_method}`);
      if (p.status && !FEATURE_STATUS.includes(p.status)) errors.push(`${where}: unknown status ${p.status}`);
      if (p.extraction_method && !["manual", "rule", "ai"].includes(p.extraction_method)) errors.push(`${where}: unknown extraction_method`);
      if (p.extraction_method === "ai" && (!p.model_version || !p.prompt_version)) errors.push(`${where}: AI extraction must record model_version and prompt_version`);
      if (p.extraction_method === "ai" && (!p.quotes || !Object.keys(p.quotes).length)) errors.push(`${where}: AI extraction must carry its quotes`);
      for (const [field, q] of Object.entries(p.quotes ?? {})) if (!String(p.source_text ?? "").replace(/\s+/g, " ").includes(String(q).replace(/\s+/g, " "))) errors.push(`${where}: quote for ${field} is not in source_text`);
      // A retired version is history and never reaches the map; every version that can still needs its period.
      if (p.effect?.endsWith("_seasonal") && p.status !== "retired") {
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
      const approved = p.status === "approved" || (!p.status && !!p.reviewed_by);
      if (approved) {
        approvedPerRule.set(p.rule_id ?? "", (approvedPerRule.get(p.rule_id ?? "") ?? 0) + 1);
        if (!p.reviewed_by) errors.push(`${where}: approved without a reviewer`);
        if (p.reviewed_by === p.digitised_by) errors.push(`${where}: reviewer must be a second person, never the digitiser`);
        if (/pipeline|claude|ai:/i.test(String(p.reviewed_by))) errors.push(`${where}: approved by the pipeline or an AI; only a person approves`);
        if (!isoDate(p.reviewed_on)) errors.push(`${where}: reviewed_on must be YYYY-MM-DD`);
      } else if (p.status === "candidate") warnings.push(`${where}: candidate (${p.change_type ?? "new"}) waiting for a person; its area stays grey`);
      if (p.partial_extent && !String(p.notes ?? "").length) warnings.push(`${where}: partial_extent should describe the from and to points in notes`);
    }
    for (const [id, n] of approvedPerRule) if (n > 1) errors.push(`${name}: ${n} approved versions of ${id}; retire the older one`);
  }

  // Bylaw rule lists (rules/bylaws/*.json).
  for (const file of listFiles(join(P.rules, "bylaws"), (f) => f.endsWith(".json"))) {
    const b = readJson<{ status: string; parts: { state: string; answer?: unknown }[] }>(file);
    if (!["candidate", "approved", "retired"].includes(b.status)) errors.push(`${rel(file)}: unknown status ${b.status}`);
    for (const p of b.parts ?? []) if (p.answer) for (const e of schemaErrors("bylaw.v1", { ...(p.answer as object) })) if (!/must NOT have additional|required/.test(e)) warnings.push(`${rel(file)}: ${e}`);
  }

  // Road notice store.
  try {
    const store = readJson<{ notices: { id?: string; listing?: string; extraction?: string; origin?: string; approvedBy?: string | null; points?: { status: string; quote: string }[]; text: string }[] }>(join(P.rules, "road-notices.json"));
    for (const n of store.notices) {
      if (!n.id) errors.push(`road-notices.json: notice without id`);
      if (!["listed", "removed_pending_review", "removed_approved", undefined].includes(n.listing)) errors.push(`road-notices.json ${n.id}: unknown listing ${n.listing}`);
      for (const p of n.points ?? []) if (!p.quote) errors.push(`road-notices.json ${n.id}: km point without its quote`);
      if (n.listing === "removed_approved" && !n.approvedBy) errors.push(`road-notices.json ${n.id}: removal approved without a person`);
      // An AI reading of a District Manager PDF counts (has points) only after a person approved it.
      if (n.origin === "dm_notice" && n.points?.length && !n.approvedBy && n.extraction !== "person") errors.push(`road-notices.json ${n.id}: District Manager reading counts without a person's approval`);
    }
  } catch (e) {
    if (!/ENOENT/.test(String(e))) errors.push(`road-notices.json: ${(e as Error).message}`);
  }

  // Registers.
  const { entries, provinceCounts } = readJson<{ entries: BylawEntry[]; provinceCounts?: Record<string, number | string> }>(join(P.data, "bylaws.json"));
  // The register follows the official boundary layers; the Province's own count is checked against it.
  for (const kind of ["municipality", "electoral_area", "local_trust_area"]) {
    const want = provinceCounts?.[kind];
    const have = entries.filter((e) => e.kind === kind).length;
    if (typeof want === "number" && want !== have) warnings.push(`bylaws: ${have} ${kind.replace("_", " ")} rows from the boundary layer, the Province counts ${want}; a person identifies the difference (all stay grey until reviewed)`);
  }
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
  const { regions } = readJson<{ regions: RegionCoverage[] }>(join(P.data, "wildlife-coverage.json"));
  for (const r of regions) {
    if (!STATUSES.includes(r.status)) errors.push(`coverage: region ${r.region} has unknown status ${r.status}`);
    if (r.status === "reviewed" && !isoDate(r.confirmedOn)) errors.push(`coverage: region ${r.region} is reviewed but has no confirmedOn date`);
  }
  const reg = loadRegistry();
  const ids = new Set<string>();
  for (const s of reg.sources) {
    if (ids.has(s.id)) errors.push(`registry: duplicate id ${s.id}`);
    ids.add(s.id);
    for (const k of ["owner", "url", "access", "cadence", "licence"] as const) if (s[k] === undefined) errors.push(`registry: ${s.id} needs ${k}`);
    if (!(s.freshness_hours > 0)) errors.push(`registry: ${s.id} needs a freshness limit`);
    for (const r of s.rules ?? []) if (!RULES_BY_ID[r]) errors.push(`registry: ${s.id} lists unknown rule ${r}`);
  }
  for (const rule of Object.values(RULES_BY_ID)) for (const s of rule.sources) if (!ids.has(s)) errors.push(`catalogue: rule ${rule.id} uses unregistered source ${s}`);

  // Prompts and schemas are versioned together.
  for (const f of listFiles(P.schema, (x) => x.endsWith(".json"))) {
    try {
      JSON.parse(readFileSync(f, "utf8"));
    } catch (e) {
      errors.push(`${rel(f)}: ${(e as Error).message}`);
    }
    if (!listFiles(P.prompts, (x) => basename(x, ".md") === basename(f, ".json")).length) errors.push(`${rel(f)}: no prompt with the same version`);
  }

  for (const w of warnings.slice(0, 40)) console.warn(`warn  ${w}`);
  if (warnings.length > 40) console.warn(`warn  … ${warnings.length - 40} more`);
  for (const e of errors) console.error(`error ${e}`);
  log("validate", `${features} rule features, ${entries.length} bylaw rows, ${regions.length} regions, ${reg.sources.length} sources: ${errors.length} errors, ${warnings.length} warnings`);
  return { exitCode: errors.length ? 1 : 0, errors, warnings };
}
