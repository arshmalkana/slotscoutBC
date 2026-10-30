import { appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as turf from "@turf/turf";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import { normaliseEndpoint, type BylawEntry, type Contribution, type ContributionReview, type DigitisedRuleProps } from "@slotscout/engine";
import { classifyAgainst, rulePath } from "../build/closedAreas.js";
import { config, currentMonth, today } from "../lib/config.js";
import { EFFECT_BY_RULE } from "../lib/effects.js";
import { validateShape } from "../lib/geometry.js";
import { politeFetch } from "../lib/http.js";
import { P } from "../lib/paths.js";
import { loadItems } from "../lib/review.js";
import { ensureDir, listFiles, log, progress, readJson, readJsonIf, writeJson } from "../lib/util.js";
import { loadTasks } from "./queue.js";
import { slug } from "./workbench.js";

/**
 * Community contributions from the map editor. A drawing or bylaw answer that one person made and a second person
 * (a reviewer holding a reviewer key) confirmed goes into the data here: an approved rule feature for a closed area
 * or a bylaw zone, or a reviewed entry in the bylaw register. The two-person rule is checked again here, and each
 * shape is validated like any other. Every change is logged in review/<month>/decisions.jsonl. Nothing unconfirmed
 * is used, and contributions already applied are skipped (data/contributions-applied.json).
 */
type RuleFile = { type: "FeatureCollection"; name: string; features: Feature<Polygon | MultiPolygon, DigitisedRuleProps & Record<string, unknown>>[] };
type Confirmed = Contribution & { review: ContributionReview };
interface Applied {
  applied: Record<string, { at: string; kind: string; target: string; result: string }>;
}

const APPLIED = () => join(P.data, "contributions-applied.json");
const samePerson = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Confirmed contributions: from the live site's public list, and from a local store when the API ran here. */
async function confirmed(): Promise<Confirmed[]> {
  const out = new Map<string, Confirmed>();
  const api = config().community?.api_url;
  if (api) {
    try {
      const r = await politeFetch(`${api.replace(/\/$/, "")}/v1/contributions?status=confirmed`, { kind: "api", accept: "application/json" });
      for (const c of ((await r.json()) as { contributions: (Contribution & { status: string; review?: ContributionReview })[] }).contributions)
        if (c.status === "confirmed" && c.review?.decision === "confirmed") out.set(c.id, c as Confirmed);
    } catch (e) {
      log("contributions", `could not read contributions from ${api}: ${(e as Error).message}`);
    }
  }
  const dir = join(P.root, "contributions");
  if (existsSync(dir)) {
    for (const f of listFiles(join(dir, "c"), (p) => p.endsWith(".json"))) {
      const c = readJson<Contribution>(f);
      const r = readJsonIf<ContributionReview | null>(join(dir, "r", `${c.id}.json`), null);
      if (r?.decision === "confirmed") out.set(c.id, { ...c, review: r });
    }
  }
  return [...out.values()].sort((a, b) => a.review.at.localeCompare(b.review.at));
}

function logDecision(month: string, c: Confirmed, kind: string, changeType: string) {
  ensureDir(join(P.review, month));
  appendFileSync(
    join(P.review, month, "decisions.jsonl"),
    JSON.stringify({
      item: `contribution-${c.id}`,
      kind,
      change_type: changeType,
      decision: "approved",
      by: c.review.by,
      on: c.review.at.slice(0, 10),
      note: `Map editor: drawn or found by ${c.author}, confirmed by ${c.review.by}${c.review.note ? ` (${c.review.note})` : ""}. Published by the pipeline.`,
    }) + "\n",
  );
}

function validGeometry(c: Confirmed): string | null {
  if (!c.geometry || !/^(Multi)?Polygon$/.test(c.geometry.type)) return "no polygon";
  const v = validateShape({ geometry: c.geometry as Polygon | MultiPolygon, method: "other", within: null, synopsis: null, runAgreement: null, disagreements: [] });
  const bad = v.filter((x) => x.passed === false && x.check !== "two independent extractions agree").map((x) => `${x.check} (${x.detail})`);
  return bad.length ? bad.join("; ") : null;
}

function applyClosedArea(c: Confirmed, month: string): string {
  const bad = validGeometry(c);
  if (bad) return `not published: ${bad}`;
  const file = readJsonIf<RuleFile>(rulePath(c.target), { type: "FeatureCollection", name: c.target, features: [] });
  const approved = [...file.features].reverse().find((f) => f.properties.status === "approved");
  const base = approved ?? [...file.features].reverse().find((f) => f.properties.status === "candidate");
  const item = loadItems(month).find((i) => i.kind === "closed_area" && i.rule_id === c.target);
  const task = loadTasks().find((t) => t.kind === "closed_area" && t.meta.ruleId === c.target);
  if (!base && !item) return "not published: no such closed-area section";
  const a1 = ((item?.runs?.run1 as { answer?: Record<string, any> } | undefined)?.answer ?? {}) as Record<string, any>;
  const effect = base?.properties.effect ?? ((task?.meta.scheduleEffect as string | undefined) ?? EFFECT_BY_RULE[c.target.split("-")[0]!] ?? a1.effect);
  const period = base?.properties.period ?? (a1.period ? { start: normaliseEndpoint(a1.period.start), end: normaliseEndpoint(a1.period.end) } : String(effect).endsWith("_seasonal") ? { start: "01-01", end: "12-31" } : null);
  const props: DigitisedRuleProps & Record<string, unknown> = {
    rule_id: c.target,
    authority: base?.properties.authority ?? `Wildlife Act, Closed Areas Regulation (B.C. Reg. 76/84), Sch. ${task?.meta.schedule}, s. ${task?.meta.section}`,
    source_url: base?.properties.source_url ?? item?.source.url ?? "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/76_84_00_multi",
    source_text: base?.properties.source_text ?? item?.source.text ?? "",
    source_version: base?.properties.source_version ?? item?.source.version ?? "",
    effect: effect as DigitisedRuleProps["effect"],
    period,
    exemptions: base?.properties.exemptions ?? a1.exemptions ?? [],
    geometry_method: "hand_drawn",
    buffer_m: base?.properties.buffer_m ?? a1.geometry?.buffer_m ?? null,
    partial_extent: false,
    conservative: false,
    ...(c.exact ? {} : { approximate: true, approximate_quality: "hand_drawn" as const }),
    digitised_by: c.author,
    digitised_on: c.createdAt.slice(0, 10),
    reviewed_by: c.review.by,
    reviewed_on: c.review.at.slice(0, 10),
    confidence: c.exact ? "high" : "medium",
    notes: `Drawn by ${c.author} in the map editor${c.note ? `: ${c.note}` : ""}. Confirmed by ${c.review.by}${c.review.note ? `: ${c.review.note}` : ""}.`,
    extraction_method: "manual",
    status: "approved",
    version: file.features.reduce((m, f) => Math.max(m, Number(f.properties.version ?? 0)), 0) + 1,
    unit_hash: base?.properties.unit_hash,
    task_id: `contribution-${c.id}`,
    contribution_id: c.id,
  };
  const feature: RuleFile["features"][number] = { type: "Feature", geometry: c.geometry as Polygon | MultiPolygon, properties: props };
  const change = classifyAgainst(approved, feature);
  feature.properties.change_type = change;
  for (const f of file.features) if (f.properties.status === "approved" || f.properties.status === "provisional") f.properties.status = "retired";
  file.features.push(feature);
  writeJson(rulePath(c.target), file);
  logDecision(month, c, "closed_area", change);
  return `published (${c.exact ? "exact" : "approximate"}, ${change}, ${(turf.area(feature) / 1e6).toFixed(2)} km2)`;
}

function applyBylaw(c: Confirmed, month: string): string {
  const b = c.bylaw;
  if (!b?.url || !b.quote) return "not published: a bylaw answer needs the bylaw's link and the words it is based on";
  const path = join(P.data, "bylaws.json");
  const reg = readJson<{ entries: BylawEntry[] } & Record<string, unknown>>(path);
  const e = reg.entries.find((x) => x.key === c.target);
  if (!e) return "not published: no such jurisdiction";
  Object.assign(e, {
    status: "reviewed",
    targetShooting: b.targetShooting,
    confirmedOn: c.review.at.slice(0, 10),
    bylaw: { ...(e.bylaw ?? {}), title: b.title, number: b.number, url: b.url },
    notes: `From ${c.author} in the map editor, confirmed by ${c.review.by}: "${b.quote.slice(0, 400)}"`,
  });
  writeJson(path, reg);
  logDecision(month, c, "bylaw", "new");
  return `published (${b.targetShooting})`;
}

function applyZone(c: Confirmed, month: string): string {
  const bad = validGeometry(c);
  if (bad) return `not published: ${bad}`;
  const reg = readJson<{ entries: BylawEntry[] }>(join(P.data, "bylaws.json")).entries;
  const e = reg.find((x) => x.key === c.target);
  if (!e) return "not published: no such jurisdiction";
  const rule = e.kind === "municipality" ? "L1" : e.kind === "electoral_area" ? "L2" : "L3";
  const path = join(P.rules, "bylaw-zones.geojson");
  const file = readJsonIf<RuleFile>(path, { type: "FeatureCollection", name: "bylaw-zones", features: [] });
  const n = file.features.filter((f) => f.properties.jurisdiction === e.key).length + 1;
  const title = e.bylaw?.title ? `${e.bylaw.title}${e.bylaw.number ? `, Bylaw ${e.bylaw.number}` : ""}` : `${e.name} firearm bylaw`;
  const props: DigitisedRuleProps & Record<string, unknown> = {
    rule_id: `${rule}-${slug(e.key)}-${n}`,
    jurisdiction: e.key,
    authority: `${title} (${e.name})`,
    source_url: e.bylaw?.url ?? "",
    source_text: `${title}: ${c.zone?.schedule ?? "zone"} as shown on the bylaw's map, drawn by ${c.author} in the map editor${c.note ? ` (${c.note})` : ""}.`,
    source_version: `Map editor contribution ${c.id}`,
    effect: (c.zone?.effect ?? "no_shooting") as DigitisedRuleProps["effect"],
    period: null,
    exemptions: [],
    geometry_method: "hand_drawn",
    buffer_m: null,
    partial_extent: false,
    conservative: false,
    ...(c.exact ? {} : { approximate: true, approximate_quality: "hand_drawn" as const }),
    digitised_by: c.author,
    digitised_on: c.createdAt.slice(0, 10),
    reviewed_by: c.review.by,
    reviewed_on: c.review.at.slice(0, 10),
    confidence: c.exact ? "high" : "medium",
    notes: `Confirmed by ${c.review.by}${c.review.note ? `: ${c.review.note}` : ""}.`,
    extraction_method: "manual",
    status: "approved",
    version: 1,
    task_id: `contribution-${c.id}`,
    contribution_id: c.id,
  };
  file.features.push({ type: "Feature", geometry: c.geometry as Polygon | MultiPolygon, properties: props });
  writeJson(path, file);
  logDecision(month, c, "bylaw_zone", "new");
  return `published as ${props.rule_id}`;
}

export async function contributions(opts: { month?: string } = {}) {
  const month = currentMonth(opts.month);
  const applied = readJsonIf<Applied>(APPLIED(), { applied: {} });
  const all = await confirmed();
  const todo = all.filter((c) => !applied.applied[c.id]);
  const results: Record<string, number> = {};
  for (const [i, c] of todo.entries()) {
    let result: string;
    if (samePerson(c.author, c.review.by)) result = "not published: drawn and confirmed by the same person";
    else if (c.kind === "closed_area") result = applyClosedArea(c, month);
    else if (c.kind === "bylaw") result = applyBylaw(c, month);
    else if (c.kind === "bylaw_zone") result = applyZone(c, month);
    else result = "not published: unknown kind";
    applied.applied[c.id] = { at: new Date().toISOString(), kind: c.kind, target: c.target, result };
    const key = result.split(" ")[0]!.replace(/:$/, "");
    results[key] = (results[key] ?? 0) + 1;
    log("contributions", `${c.kind} ${c.target} by ${c.author}, confirmed by ${c.review.by}: ${result}`);
    progress("contributions", "confirmed contributions", i + 1, todo.length, `${c.target}: ${result}`);
  }
  if (todo.length) writeJson(APPLIED(), applied);
  log("contributions", `${all.length} confirmed, ${todo.length} new: ${JSON.stringify(results)}`);
  return { confirmed: all.length, new: todo.length, results, today: today() };
}
