import { join } from "node:path";
import * as turf from "@turf/turf";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { DigitisedRuleProps } from "@slotscout/engine";
import { checkQuotes, disagreements, schemaErrors } from "../lib/answers.js";
import { config, today } from "../lib/config.js";
import { EFFECT_BY_RULE } from "../lib/effects.js";
import { areaShape, lookupArea, lookupRoad, type Lookup } from "../lib/gazetteer.js";
import { buildAdminBoundary, buildRoadBuffer, validateShape, type Built } from "../lib/geometry.js";
import { P } from "../lib/paths.js";
import { itemId, upsertItem } from "../lib/review.js";
import { listFiles, log, readJsonIf, writeJson } from "../lib/util.js";
import { loadAnswer, type Answer } from "../steps/extract.js";
import type { Task } from "../steps/queue.js";

/**
 * Closed Areas sections (Addendum A 3, 4, 10.3 step 8): checked answers -> place lookups ->
 * geometry -> validation -> candidate feature in rules/<rule_id>.geojson and a review item.
 * Nothing here approves anything: candidates count only after a person approves them.
 */
type RuleFile = { type: "FeatureCollection"; name: string; features: Feature<Polygon | MultiPolygon, DigitisedRuleProps & Record<string, unknown>>[] };

const EFFECT_STRICTNESS: Record<string, number> = { no_shooting: 5, no_shooting_hunting_exempt: 4, no_shooting_seasonal: 3, no_rifle: 2, shot_only: 2, shot_only_seasonal: 1, non_toxic: 1, no_hunting: 0 };

export function rulePath(ruleId: string): string {
  return join(P.rules, `${ruleId}.geojson`);
}

/** Stricter, looser, unclear or cosmetic, comparing a candidate with the approved version (5.1). */
export function classifyAgainst(prev: Feature<Polygon | MultiPolygon, DigitisedRuleProps> | undefined, next: Feature<Polygon | MultiPolygon, DigitisedRuleProps>): "new" | "stricter" | "looser" | "unclear" | "cosmetic" {
  if (!prev) return "new";
  const a = prev.properties;
  const b = next.properties;
  const sameFields = a.effect === b.effect && a.buffer_m === b.buffer_m && JSON.stringify(a.period) === JSON.stringify(b.period) && a.exemptions.length === b.exemptions.length;
  const prevArea = turf.area(prev);
  const nextArea = turf.area(next);
  const inter = turf.intersect(turf.featureCollection([prev, next]));
  const shared = inter ? turf.area(inter) : 0;
  const coversOld = shared >= prevArea * 0.995;
  const insideOld = shared >= nextArea * 0.995;
  if (sameFields && coversOld && insideOld) return "cosmetic";
  const effUp = (EFFECT_STRICTNESS[b.effect] ?? 0) - (EFFECT_STRICTNESS[a.effect] ?? 0);
  const fewerExemptions = b.exemptions.length <= a.exemptions.length;
  if (coversOld && effUp >= 0 && fewerExemptions) return "stricter";
  if (insideOld && effUp <= 0 && b.exemptions.length >= a.exemptions.length) return "looser";
  return "unclear";
}

interface Checked {
  answer: Record<string, unknown> | null;
  errors: string[];
  rejected: string[];
  quotes: Record<string, string>;
}

function check(kind: string, schema: string, a: Answer | { answer: Record<string, unknown> | null } | null, source: string): Checked {
  if (!a?.answer) return { answer: null, errors: [a ? `no answer${(a as Answer).error ? `: ${(a as Answer).error}` : ""}` : "missing"], rejected: [], quotes: {} };
  const errors = schemaErrors(schema, a.answer);
  if (errors.length) return { answer: null, errors, rejected: [], quotes: {} };
  const q = checkQuotes(kind, a.answer, source);
  return { answer: q.cleaned, errors: [], rejected: q.rejected, quotes: q.quotes };
}

export async function buildClosedArea(t: Task, month: string): Promise<{ state: string }> {
  const ruleId = t.meta.ruleId as string | null;
  const r1 = loadAnswer(1, t.task_id);
  const r2 = loadAnswer(2, t.task_id);
  const rule = readJsonIf<{ answer: Record<string, unknown> } | null>(join(P.queue, "rule", `${t.task_id}.json`), null);
  if (!r1 || !r2) return { state: "waiting for extraction" };
  const c1 = check("closed_area", t.schema, r1, t.source_text);
  const c2 = check("closed_area", t.schema, r2, t.source_text);
  const cr = rule ? check("closed_area", t.schema, rule, t.source_text) : null;
  const why: string[] = [];
  const dis = c1.answer && c2.answer ? disagreements("closed_area", c1.answer, c2.answer) : ["one or both runs gave no valid answer"];
  const ruleDis = cr?.answer && c1.answer ? disagreements("closed_area", { ...cr.answer, effect: c1.answer.effect }, c1.answer).map((d) => d.replace("run 1", "rule parser").replace("run 2", "AI runs")) : [];
  if (c1.errors.length) why.push(`run 1 rejected: ${c1.errors.join("; ")}`);
  if (c2.errors.length) why.push(`run 2 rejected: ${c2.errors.join("; ")}`);
  if (c1.rejected.length || c2.rejected.length) why.push(`quotes not found verbatim, fields dropped: ${[...new Set([...c1.rejected, ...c2.rejected])].join(", ")}`);
  if (dis.length) why.push(`AI runs disagree: ${dis.join("; ")}`);
  if (ruleDis.length) why.push(`rule parser and AI disagree: ${ruleDis.join("; ")}`);
  const agreed = !dis.length && !!c1.answer;
  const a = (c1.answer ?? cr?.answer ?? null) as Record<string, any> | null;
  const scheduleEffect = (t.meta.scheduleEffect as string | null) ?? (ruleId ? EFFECT_BY_RULE[ruleId.split("-")[0]!] ?? null : null);
  if (a?.effect && scheduleEffect && a.effect !== scheduleEffect) why.push(`effect read from the text (${a.effect}) differs from the schedule's effect (${scheduleEffect})`);
  if (!t.source.confirmed) why.push("source text is an unconfirmed excerpt: approve only after checking it against the current BC Laws consolidation");

  // Place lookups and geometry, only from agreed, quoted fields.
  const lookups: Lookup[] = [];
  let built: Built = { geometry: null, construction: [], problems: [] };
  let area: Feature<Polygon | MultiPolygon> | null = null;
  if (a && agreed) {
    if (a.within) {
      const l = await lookupArea(a.within.type, a.within.name);
      lookups.push(l);
      area = l.status === "ok" ? areaShape(l) : null;
      if (l.status !== "ok") why.push(`named area "${a.within.name}": ${l.status}${l.note ? ` (${l.note})` : ""}`);
    }
    const g = a.geometry;
    if (g.method === "road_buffer" && g.road && g.buffer_m) {
      const road = await lookupRoad(g.road.name, g.road.source_hint, area);
      lookups.push(road);
      const from = g.from?.road ? await lookupRoad(g.from.road, "DRA", area) : null;
      const to = g.to?.road ? await lookupRoad(g.to.road, "DRA", area) : null;
      if (from) lookups.push(from);
      if (to) lookups.push(to);
      for (const l of [road, from, to]) if (l && l.status !== "ok" && !(l === road && l.status === "ambiguous")) why.push(`road "${l.query}": ${l.status}${l.note ? ` (${l.note})` : ""}`);
      if (road.features.length && (!g.from || from?.features.length) && (!g.to || to?.features.length)) {
        built = buildRoadBuffer({ road: road.features, from: from?.features ?? null, to: to?.features ?? null, bufferM: g.buffer_m, quotes: c1.quotes, roadLayer: road.layer });
      }
    } else if (g.method === "admin_boundary" && area) {
      built = buildAdminBoundary(area, c1.quotes.within, lookups[0]!.layer);
    } else {
      built.problems.push(`the geometry builder does not draw "${g.method}" descriptions yet; a digitiser draws this shape with the extracted steps pre-filled`);
    }
    why.push(...built.problems);
  } else if (!a) why.push("no usable answer to build from");
  else why.push("not built: the AI runs disagree, so the area stays grey until a person decides");

  const validation = validateShape({ geometry: built.geometry, method: a?.geometry?.method ?? "other", within: area, synopsis: null, runAgreement: c1.answer && c2.answer ? agreed : null, disagreements: dis });
  if (a?.geometry?.method === "metes_and_bounds") validation.push({ check: "step directions match the line", passed: null, detail: "not run: metes-and-bounds walks are drawn by a person in this version" });
  for (const v of validation.filter((x) => x.passed === false)) why.push(`validation failed: ${v.check} (${v.detail})`);

  const file = ruleId ? readJsonIf<RuleFile>(rulePath(ruleId), { type: "FeatureCollection", name: ruleId, features: [] }) : null;
  const approved = file?.features.find((f) => f.properties.status === "approved" || (!f.properties.status && f.properties.reviewed_by));
  let feature: RuleFile["features"][number] | null = null;
  if (ruleId && built.geometry && a) {
    const aiModel = (r1 as Answer).model;
    const props: DigitisedRuleProps & Record<string, unknown> = {
      rule_id: ruleId,
      authority: `Wildlife Act, Closed Areas Regulation (B.C. Reg. 76/84), Sch. ${t.meta.schedule}, s. ${t.meta.section}`,
      source_url: t.source.url ?? "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/76_84_00_multi",
      source_text: t.source_text,
      source_version: t.source.version,
      effect: (scheduleEffect ?? a.effect) as DigitisedRuleProps["effect"],
      period: a.period ?? null,
      exemptions: a.exemptions ?? [],
      geometry_method: a.geometry.method === "waterbody_buffer" ? "road_buffer" : a.geometry.method,
      buffer_m: a.geometry.buffer_m ?? null,
      partial_extent: !!(a.geometry.from || a.geometry.to),
      conservative: true,
      digitised_by: `pipeline (${(r1 as Answer).mode} mode: ${aiModel}; ${rule ? "rule parser cross-check" : "no rule parse"})`,
      digitised_on: today(),
      reviewed_by: null,
      reviewed_on: null,
      confidence: why.length ? "low" : "medium",
      notes: [built.construction.map((c) => c.what).join("; "), a.geometry.from || a.geometry.to ? `From ${a.geometry.from?.road ?? a.geometry.from?.name} to ${a.geometry.to?.road ?? a.geometry.to?.name}.` : ""].filter(Boolean).join(" "),
      extraction_method: "ai",
      model_version: `${aiModel} / ${(r2 as Answer).model}`,
      prompt_version: t.prompt,
      quotes: c1.quotes,
      run_agreement: agreed,
      status: "candidate",
      version: (file?.features.reduce((m, f) => Math.max(m, Number(f.properties.version ?? 0)), 0) ?? 0) + 1,
      unit_hash: t.unit_hash,
      task_id: t.task_id,
      construction: built.construction,
      validation,
    };
    feature = { type: "Feature", geometry: built.geometry, properties: props };
    feature.properties.change_type = classifyAgainst(approved, feature);
    // One candidate per unit version; a re-run replaces it, approved versions stay.
    const old = file!.features.find((f) => f.properties.status === "candidate" && f.properties.unit_hash === t.unit_hash);
    if (old) feature.properties.version = old.properties.version;
    file!.features = [...file!.features.filter((f) => !(f.properties.status === "candidate" && f.properties.unit_hash === t.unit_hash)), feature];
    writeJson(rulePath(ruleId), file);
  }
  const changeType = feature?.properties.change_type ?? (approved ? "unclear" : "new");
  upsertItem({
    item_id: itemId("closed_area", `${t.task_id}`),
    month,
    kind: "closed_area",
    title: t.title,
    rule_id: ruleId ?? undefined,
    change_type: String(changeType),
    decision:
      changeType === "looser"
        ? "Approve the looser change? Until you do, the older, stricter version stays live."
        : feature
          ? "Check the shape against the text and the map, then approve or reject the candidate."
          : "No shape was built. Draw it from the extracted fields, or reject the extraction.",
    why: why.length ? why : ["every permanent boundary is reviewed by a person (Addendum A 3)"],
    source: { text: t.source_text, url: t.source.url, version: t.source.version, confirmed: t.source.confirmed, file: t.source.file },
    runs: { run1: r1, run2: r2, rule: rule ?? undefined },
    quotes: c1.quotes,
    rejected_quotes: [...new Set([...c1.rejected, ...c2.rejected])],
    disagreements: [...dis, ...ruleDis],
    lookups: lookups.map(({ features, ...l }) => ({ ...l, sample: features.slice(0, 3).map((f) => f.properties) })),
    validation,
    construction: built.construction,
    feature: feature ?? undefined,
    previous_feature: approved ?? undefined,
  });
  log("build", `${ruleId ?? t.task_id}: ${feature ? `candidate v${feature.properties.version} (${changeType})` : "no shape"}; ${why.length} issue(s) for the reviewer`);
  return { state: feature ? "candidate" : "needs person" };
}

export function ruleFiles(): string[] {
  return listFiles(P.rules, (f) => f.endsWith(".geojson"));
}

export const AUTOPUBLISH = () => config().ai.autopublish;
