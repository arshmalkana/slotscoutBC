import { join } from "node:path";
import * as turf from "@turf/turf";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import { normaliseEndpoint, type DigitisedRuleProps } from "@slotscout/engine";
import { blockingDisagreements, checkQuotes, disagreements, schemaErrors } from "../lib/answers.js";
import { config, today } from "../lib/config.js";
import { EFFECT_BY_RULE } from "../lib/effects.js";
import { areaShape, landDistrictKey, lookupArea, lookupLots, lookupRoad, lookupWater, parseLots, splitWaterbodies, type Lookup } from "../lib/gazetteer.js";
import { isForestRoad, parseRoadList } from "../lib/roadlist.js";
import { headingPlaces, landmarkName, placesZone, vicinityPoint, walkOutline, type WalkStep } from "../lib/walk.js";
import { buildAdminBoundary, buildRoadBuffer, validateShape, type Built } from "../lib/geometry.js";
import { nameWords } from "../lib/mapimage.js";
import { P, monthDir } from "../lib/paths.js";
import { itemId, upsertItem } from "../lib/review.js";
import { listFiles, log, readJsonIf, writeJson } from "../lib/util.js";
import { loadAnswer, type Answer } from "../steps/extract.js";
import type { ClosedAreaMap } from "../steps/pull.js";
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

/** The Province's maps for a section, read at pull time (raw/<month>/closed_area_maps/index.json): by map number, or by name. */
export function sectionMaps(t: Task, month: string): ClosedAreaMap[] {
  const index = readJsonIf<ClosedAreaMap[]>(join(monthDir(month), "closed_area_maps", "index.json"), []).filter((m) => m.outline);
  const id = `${t.meta.schedule}-${t.meta.section}`;
  const byId = index.filter((m) => m.mapId === id);
  if (byId.length) return byId;
  const words = nameWords(t.title.match(/\(([^)]+)\)\s*$/)?.[1] ?? "");
  if (!words.size) return [];
  return index.filter((m) => !m.mapId && [...words].every((w) => nameWords(`${m.file} ${m.title}`).has(w)));
}

/** The parts of a named feature lying mostly (at least half their area) inside the area the text places it in. */
export function partsInside(features: Feature[], area: Feature<Polygon | MultiPolygon> | null): Feature<Polygon | MultiPolygon>[] {
  const polys = features.filter((f) => f.geometry && /Polygon/.test(f.geometry.type)) as Feature<Polygon | MultiPolygon>[];
  if (!area) return polys;
  return polys.filter((f) => {
    const inter = turf.intersect(turf.featureCollection([f, area]));
    return !!inter && turf.area(inter) >= 0.5 * turf.area(f);
  });
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
  const allDis = c1.answer && c2.answer ? disagreements("closed_area", c1.answer, c2.answer) : ["one or both runs gave no valid answer"];
  const dis = c1.answer && c2.answer ? blockingDisagreements(allDis, c1.answer) : allDis;
  const minor = allDis.filter((d) => !dis.includes(d));
  const ruleDis = cr?.answer && c1.answer ? disagreements("closed_area", { ...cr.answer, effect: c1.answer.effect }, c1.answer).map((d) => d.replace("run 1", "rule parser").replace("run 2", "AI runs")) : [];
  if (c1.errors.length) why.push(`run 1 rejected: ${c1.errors.join("; ")}`);
  if (c2.errors.length) why.push(`run 2 rejected: ${c2.errors.join("; ")}`);
  if (c1.rejected.length || c2.rejected.length) why.push(`quotes not found verbatim, fields dropped: ${[...new Set([...c1.rejected, ...c2.rejected])].join(", ")}`);
  if (dis.length) why.push(`AI runs disagree: ${dis.join("; ")}`);
  if (minor.length) why.push(`AI runs also differ on fields this shape is not drawn from (not blocking): ${minor.join("; ")}`);
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
  let approximate: { quality: string; notes: string[]; toleranceM?: number } | null = null;
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
    } else if (g.method === "road_buffer" && !g.road && g.buffer_m) {
      // Several roads listed in the text: code reads the list, then places each road like any other.
      const list = parseRoadList(t.source_text);
      if (!list) built.problems.push("no single road named and no list of roads the code can read");
      else {
        const parts: Feature<Polygon | MultiPolygon>[] = [];
        const notes: string[] = [];
        for (const r of list) {
          const hint = (n: string) => (isForestRoad(n) ? "FTEN" : "DRA");
          const road = await lookupRoad(r.name, hint(r.name), area);
          const from = r.from ? await lookupRoad(r.from, hint(r.from), area) : null;
          const to = r.to ? await lookupRoad(r.to, hint(r.to), area) : null;
          lookups.push(...[road, from, to].filter((x): x is Lookup => !!x));
          const missing = [road, from, to].filter((l) => l && !l.features.length).map((l) => `"${l!.query}" ${l!.status}`);
          if (missing.length) {
            built.problems.push(`listed road ${missing.join(", ")} in the official road layers`);
            continue;
          }
          if (r.partial && !area) {
            built.problems.push(`"${r.name}" is limited (${r.partial}) in a way the code cannot place, and no management unit narrows it`);
            continue;
          }
          const b = buildRoadBuffer({ road: road.features, from: from?.features ?? null, to: to?.features ?? null, bufferM: g.buffer_m, quotes: { "geometry.road": r.text, "geometry.buffer_m": c1.quotes["geometry.buffer_m"] }, roadLayer: road.layer });
          if (!b.geometry) {
            built.problems.push(`"${r.name}": ${b.problems.join("; ")}`);
            continue;
          }
          parts.push(turf.feature(b.geometry));
          built.construction.push(...b.construction);
          if (r.partial) notes.push(`"${r.name}" is drawn along its whole length in ${a.within?.name}; the text limits it (${r.partial})`);
          if (r.spurs) notes.push(`spur roads of "${r.name}" are not drawn`);
        }
        // Drawn only when every listed road is placed, and only inside the area the section names.
        if (!built.problems.length && parts.length) {
          let shape = parts.length > 1 ? turf.union(turf.featureCollection(parts)) : parts[0]!;
          if (shape && area) shape = turf.intersect(turf.featureCollection([shape, area]));
          built.geometry = (shape?.geometry as Polygon | MultiPolygon | undefined) ?? null;
          if (area) built.construction.push({ what: `clipped to ${a.within?.name}`, quote: c1.quotes.within ?? null, source: lookups[0]!.layer });
          why.push(...notes);
        }
      }
    } else if (g.method === "admin_boundary") {
      // Draw the area the section names. The larger area it sits in only narrows the lookup: drawing
      // that instead closes far more ground than the section does (W5-049 drew all of the FVRD).
      const own = g.feature && g.feature.name.trim().toLowerCase() !== String(a.within?.name ?? "").trim().toLowerCase() ? g.feature : null;
      if (own) {
        // District lots come from the Crown survey parcels; the land district is in the lot text or the area named.
        const lots = own.type === "lot" ? parseLots(own.name) : null;
        if (lots && !lots.district) lots.district = landDistrictKey(String(a.within?.name ?? ""));
        const l = lots ? await lookupLots(lots, area ? turf.bbox(area) : null) : await lookupArea(own.type, own.name);
        lookups.push(l);
        const parts = l.status === "ok" || l.status === "ambiguous" || !lots ? partsInside(l.features, area) : [];
        if (lots && l.note) why.push(`${l.query}: ${l.note}`);
        if (!parts.length) {
          const found = l.status === "ok" || l.status === "ambiguous" ? `none inside ${a.within?.name ?? "the area named"}` : l.status;
          why.push(`named ${own.type.replace("_", " ")} "${own.name}": ${found}${l.note ? ` (${l.note})` : ""}; the larger area is not drawn in its place`);
        } else if (lots && l.status !== "ok") {
          why.push(`${l.query}: ${l.status}; drawn by a person`);
        } else if (!lots && !area && parts.length > 1) {
          why.push(`named ${own.type.replace("_", " ")} "${own.name}": ${parts.length} official features have this name and no surrounding area was found to choose between them`);
        } else {
          const shape = areaShape({ ...l, features: parts as unknown as Lookup["features"] });
          if (shape) built = buildAdminBoundary(shape, c1.quotes["geometry.feature"], l.layer);
          if (shape && l.partial) approximate = { quality: "whole_feature", notes: [] };
          if (own.type === "electoral_area")
            why.push(`electoral area letters are reassigned over time: check that today's ${own.name} is the area this section means (its heading: ${t.title.match(/\(([^)]+)\)\s*$/)?.[1] ?? "none"})`);
        }
      } else if (area) built = buildAdminBoundary(area, c1.quotes.within, lookups[0]!.layer);
    } else if (g.method === "waterbody_buffer" && g.feature?.name && g.buffer_m) {
      // Each lake, river or creek named, from the Freshwater Atlas, buffered by the distance the text gives.
      const parts: Feature<Polygon | MultiPolygon>[] = [];
      for (const name of splitWaterbodies(g.feature.name)) {
        const l = await lookupWater(name, area ? turf.bbox(area) : null);
        lookups.push(l);
        if (l.status !== "ok") {
          built.problems.push(`waterbody "${name}": ${l.status} in the Freshwater Atlas`);
          continue;
        }
        const fs = area ? l.features.filter((f) => turf.booleanIntersects(f as Feature, area!)) : l.features;
        const buffered = fs.map((f) => turf.buffer(f as Feature, g.buffer_m, { units: "meters", steps: 8 }) as Feature<Polygon | MultiPolygon>);
        if (buffered.length) parts.push(buffered.length > 1 ? turf.union(turf.featureCollection(buffered))! : buffered[0]!);
      }
      if (!built.problems.length && parts.length) {
        let shape: Feature<Polygon | MultiPolygon> | null = parts.length > 1 ? turf.union(turf.featureCollection(parts)) : parts[0]!;
        if (shape && area) shape = turf.intersect(turf.featureCollection([shape, area]));
        if (shape) {
          built = { geometry: shape.geometry, construction: [{ what: `${g.buffer_m} m around ${g.feature.name}${area ? `, clipped to ${a.within?.name}` : ""}`, quote: c1.quotes["geometry.feature"] ?? null, source: [...new Set(lookups.map((l) => l.layer))].join(", ") }], problems: [] };
          // A stretch ("from … to …") is drawn along the whole waterbody in the area: more than the law, so approximate.
          if (g.from || g.to) approximate = { quality: "whole_feature", notes: [] };
        }
      }
    } else {
      built.problems.push(`the geometry builder does not draw "${g.method}" descriptions yet; a digitiser draws this shape with the extracted steps pre-filled`);
    }
    why.push(...built.problems);
  } else if (!a) why.push("no usable answer to build from");
  else why.push("not built: the AI runs disagree, so the area stays grey until a person decides");

  if (approximate?.quality === "whole_feature") why.push("drawn whole: the text names only part of it, so the outline is approximate (\"possibly inside\")");
  // A section drawn on a map the Province publishes: the outline code read from that map, when no
  // text-drawn shape passed its checks (W8-053's road buffer came out at 58 km2; its map shows 4).
  const maps = sectionMaps(t, month);
  if (maps.length && (!built.geometry || validateShape({ geometry: built.geometry, method: a?.geometry?.method ?? "other", within: area, synopsis: null, runAgreement: null, disagreements: [] }).some((v) => v.passed === false))) {
    if (!area && a?.within) {
      const l = await lookupArea(a.within.type, a.within.name);
      if (l.status === "ok") (lookups.push(l), (area = areaShape(l)));
    }
    const parts = maps.map((m) => readJsonIf<Feature<Polygon | MultiPolygon> | null>(join(P.root, m.outline!), null)).filter((f): f is Feature<Polygon | MultiPolygon> => !!f?.geometry);
    let shape: Feature<Polygon | MultiPolygon> | null = parts.length > 1 ? turf.union(turf.featureCollection(parts)) : (parts[0] ?? null);
    // The section covers only the management units it names, whatever else the map shows.
    if (shape && area) shape = turf.intersect(turf.featureCollection([shape, area]));
    if (shape) {
      const how = maps.map((m) => `${m.file} (${m.style === "highlight" ? `yellow-highlighted roads, ${m.bufferM} m` : "red outline"})`).join("; ");
      built = { geometry: shape.geometry, construction: [{ what: `outline read by code from the official map image: ${how}${area ? `; clipped to ${a?.within?.name}` : ""}`, quote: null, source: maps.map((m) => m.url).join(" ") }], problems: [] };
      approximate = { quality: "map_image", notes: [], toleranceM: Math.max(...maps.map((m) => m.toleranceM ?? 50)) };
      why.push(`outline read from the official map (${maps.map((m) => m.file).join(", ")}); firm more than ${approximate.toleranceM} m inside, "possibly inside" nearer the edge`);
    }
  }

  // A walk ("commencing at …; thence along …") with no exact shape gets an approximate outline, by Arsh's
  // instruction (2026-10-28). It is marked approximate: the engine shows "possibly inside", never a boundary.
  const steps = (a?.geometry?.steps ?? []) as WalkStep[];
  if (!built.geometry && a && steps.filter((s) => s.feature || s.until).length >= 2) {
    if (!area && a.within) {
      const l = await lookupArea(a.within.type, a.within.name);
      if (l.status === "ok") (lookups.push(l), (area = areaShape(l)));
    }
    const w = await walkOutline(steps, area, await vicinityPoint(t.source_text, area));
    if (w.geometry) {
      built = {
        geometry: w.geometry,
        construction: [
          { what: `approximate outline (${w.quality}): corners where the followed features meet, traced along them where found, padded 100 m`, quote: steps.find((s) => s.quote)?.quote ?? null, source: w.layers.join(", ") || "BC Geographical Names" },
        ],
        problems: [],
      };
      approximate = { quality: w.quality!, notes: w.notes };
      why.push(`approximate outline (${w.quality}) drawn from the places the walk names${agreed ? "" : ", using run 1's reading of the steps"}`, ...w.notes);
    } else why.push(...w.notes);
  }

  // Still nothing: a zone around the places the section names, found in the official layers (Arsh's
  // instruction, 2026-10-28: mark every closed area at least approximately). Shown only as "possibly inside".
  if (!built.geometry && a) {
    if (!area && a.within) {
      const l = await lookupArea(a.within.type, a.within.name);
      if (l.status === "ok") (lookups.push(l), (area = areaShape(l)));
    }
    const g = a.geometry ?? {};
    const names = [g.road?.name, g.from?.road ?? g.from?.name, g.to?.road ?? g.to?.name, ...steps.flatMap((s) => [s.feature, landmarkName(s.until ?? ""), s.start ? landmarkName(s.start) : null])].filter((n): n is string => !!n && !/^(unnamed|private)/i.test(n));
    const typed = g.feature?.name ? [{ type: String(g.feature.type ?? "other"), name: String(g.feature.name) }] : [];
    const z = await placesZone({ heading: headingPlaces(t.title.match(/\(([^)]+)\)\s*$/)?.[1] ?? ""), names: [...typed.map((f) => f.name), ...names], areas: typed, bufferM: g.buffer_m ?? null }, area);
    if (z.geometry) {
      built = { geometry: z.geometry, construction: [{ what: `approximate zone: ${z.notes[0]}`, quote: c1.quotes["geometry.feature"] ?? steps.find((s) => s.quote)?.quote ?? null, source: z.layers.join(", ") }], problems: [] };
      approximate = { quality: "vicinity", notes: z.notes };
      why.push(`approximate zone around the places the section names${agreed ? "" : ", using run 1's reading"}`, ...z.notes);
    } else why.push(...z.notes);
  }

  const validation = validateShape({ geometry: built.geometry, method: a?.geometry?.method ?? "other", within: area, synopsis: null, runAgreement: c1.answer && c2.answer ? agreed : null, disagreements: dis });
  if (a?.geometry?.method === "metes_and_bounds") validation.push({ check: "step directions match the line", passed: null, detail: "not run: a walk outline is approximate; a person checks it against the text" });
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
      period: a.period ? { start: normaliseEndpoint(a.period.start), end: normaliseEndpoint(a.period.end) } : null,
      exemptions: a.exemptions ?? [],
      geometry_method: a.geometry.method === "waterbody_buffer" ? "road_buffer" : a.geometry.method,
      buffer_m: a.geometry.buffer_m ?? null,
      partial_extent: !!(a.geometry.from || a.geometry.to),
      conservative: true,
      ...(approximate ? { approximate: true, approximate_quality: approximate.quality as DigitisedRuleProps["approximate_quality"], ...(approximate.toleranceM ? { approximate_tolerance_m: approximate.toleranceM } : {}) } : {}),
      digitised_by: `pipeline (${(r1 as Answer).mode} mode: ${aiModel}; ${rule ? "rule parser cross-check" : "no rule parse"})`,
      digitised_on: today(),
      reviewed_by: null,
      reviewed_on: null,
      confidence: approximate || why.length ? "low" : "medium",
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
    disagreements: [...allDis, ...ruleDis],
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
