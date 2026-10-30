import type { Feature, Geometry } from "geojson";
import { DISCLAIMER, LIGHTS, RULES_BY_ID, SEVERITY_ORDER, STANDING_CHECKS } from "./catalogue.js";
import { compass8, lineLengthM, markBlockedBearings, measureAlong, norm360, relate, safeSectors } from "./geo.js";
import { isBlockingStatus } from "./notices.js";
import { ACCESS_RADIUS_M, OWNER_TYPES, REGION_BY_NAME, type LayerKey } from "./layers.js";
import { formatDistance, isRifle, isShot } from "./profile.js";
import { periodStatus } from "./seasonal.js";
import type {
  AccessSummary,
  BylawEntry,
  CheckResult,
  CheckStatus,
  DigitisedRuleProps,
  EvaluationInput,
  FeatureHit,
  LayerData,
  Light,
  NoticePoint,
  RoadNotice,
  SpotReport,
  VerdictState,
} from "./types.js";

type Props = Record<string, unknown>;
type AnyFeature = Feature<Geometry | null, Props>;

const STATUS_RANK: Record<CheckStatus, number> = {
  fail: 4,
  conditional: 3,
  unknown: 2,
  pass: 1,
  note: 0,
  not_applicable: 0,
};

/** Text-derived sources (digitised areas, bylaw register) must be re-confirmed within this many days. */
export const TEXT_SOURCE_FRESHNESS_DAYS = 45;

export function titleCase(s: string): string {
  if (!s) return s;
  if (s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .replace(/(^|[\s\-/(])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase())
    .replace(/\b(Of|And|The|To|At|In|On|For)\b/g, (w, _p, offset: number) => (offset === 0 ? w : w.toLowerCase()))
    .replace(/\bFsr\b/g, "FSR")
    .replace(/\bIr\b/g, "IR");
}

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

function hitText(h: FeatureHit): string {
  if (h.inside) return `${h.kind}: ${h.name}`;
  return `${h.kind}${h.name && h.name !== h.kind ? ` (${h.name})` : ""} ${formatDistance(h.distanceM)} to the ${compass8(h.bearingDeg)}`;
}

class Context {
  readonly checks: CheckResult[] = [];
  /** Red areas inside the fall zone but not at the pin. */
  readonly fzRed: FeatureHit[] = [];
  /** Geometries that block a throw direction. */
  readonly hazards: Geometry[] = [];
  readonly hazardHits: FeatureHit[] = [];
  readonly failedHazardLayers = new Set<string>();
  readonly usedSources = new Set<string>();
  readonly at: Date;
  /** Freshness is measured against the real time of the check, not the date being checked. */
  readonly now: Date;
  readonly radius: number;

  constructor(readonly input: EvaluationInput) {
    this.at = input.at;
    this.now = input.now ?? input.at;
    this.radius = input.profile.fallZoneM;
  }

  layer(key: LayerKey): LayerData {
    return this.input.layers[key] ?? { sourceId: key, status: "missing", features: [] };
  }

  sourceName(sourceId: string): string {
    return this.input.sources[sourceId]?.name ?? sourceId;
  }

  isFresh(l: LayerData): boolean {
    if (l.status !== "ok" || !l.fetchedAt) return false;
    const src = this.input.sources[l.sourceId];
    const limitH = src?.freshnessHours ?? 24 * 45;
    return this.now.getTime() - new Date(l.fetchedAt).getTime() <= limitH * 3600_000;
  }

  /** Returns a reason string when the layer cannot be trusted, otherwise null. */
  problem(key: LayerKey, needComplete = true): string | null {
    const l = this.layer(key);
    this.usedSources.add(l.sourceId);
    if (l.status === "missing") return `${this.sourceName(l.sourceId)} was not loaded`;
    if (l.status === "error") return `${this.sourceName(l.sourceId)} could not be read${l.error ? ` (${l.error})` : ""}`;
    if (!this.isFresh(l)) return `${this.sourceName(l.sourceId)} is older than its freshness limit`;
    if (needComplete && l.truncated) return `${this.sourceName(l.sourceId)} returned too many features to check completely`;
    return null;
  }

  dataDate(keys: LayerKey[]): string | undefined {
    const dates = keys.map((k) => this.layer(k).fetchedAt).filter((d): d is string => !!d).sort();
    return dates[0];
  }

  add(r: Omit<CheckResult, "light" | "citation" | "sourceUrl" | "sources"> & Partial<CheckResult>): CheckResult {
    const def = RULES_BY_ID[r.ruleId] ?? RULES_BY_ID[r.ruleId.split(/[–-]/)[0]!];
    const res: CheckResult = {
      light: def?.light ?? "freshness",
      citation: def ? `${def.authority}${def.verify ? " (citation pending legal review)" : ""}` : "",
      sourceUrl: def?.citationUrl,
      sources: def?.sources ?? [],
      ...r,
    };
    this.checks.push(res);
    return res;
  }

  unknown(ruleId: string, reason: string, keys: LayerKey[] = []): CheckResult {
    return this.add({ ruleId, status: "unknown", reason: `Cannot confirm: ${reason}.`, dataDate: this.dataDate(keys) });
  }

  /** Features of a layer with their relation to the pin, within maxDistance. */
  near(key: LayerKey, maxDistance: number, filter?: (p: Props) => boolean): { f: AnyFeature; inside: boolean; d: number; b: number; edge: number }[] {
    const out: { f: AnyFeature; inside: boolean; d: number; b: number; edge: number }[] = [];
    for (const f of this.layer(key).features) {
      if (filter && !filter(f.properties ?? {})) continue;
      const rel = relate(f.geometry, this.input.point);
      if (!rel) continue;
      if (rel.inside || rel.distanceM <= maxDistance) {
        out.push({ f, inside: rel.inside, d: rel.distanceM, b: rel.bearingDeg, edge: rel.edgeDistanceM });
      }
    }
    return out.sort((a, b) => a.d - b.d);
  }

  /** Features whose geometry contains the pin. Point layers come pre-filtered by the server and may have no geometry. */
  at_(key: LayerKey, filter?: (p: Props) => boolean): AnyFeature[] {
    return this.layer(key).features.filter((f) => {
      if (filter && !filter(f.properties ?? {})) return false;
      if (!f.geometry) return true;
      return relate(f.geometry, this.input.point)?.inside ?? false;
    });
  }

  addHazard(key: LayerKey, items: { f: AnyFeature; d: number; b: number; inside: boolean }[], kind: (p: Props) => string, name: (p: Props) => string): void {
    const l = this.layer(key);
    if (l.status !== "ok" || !this.isFresh(l)) this.failedHazardLayers.add(l.sourceId);
    for (const it of items) {
      if (it.d > this.radius) continue;
      if (it.f.geometry) this.hazards.push(it.f.geometry);
      this.hazardHits.push({
        kind: kind(it.f.properties ?? {}),
        name: name(it.f.properties ?? {}),
        distanceM: Math.round(it.d),
        bearingDeg: Math.round(it.b),
        inside: it.inside,
      });
    }
  }
}

interface PolygonRuleOpts {
  ruleId: string;
  key: LayerKey;
  filter?: (p: Props) => boolean;
  kind: (p: Props) => string;
  name: (p: Props) => string;
  insideStatus?: CheckStatus;
  insideReason: (h: FeatureHit) => string;
  passReason: string;
  /** Count as prohibited land when inside the fall zone. */
  fallZoneRed?: boolean;
  moreUrl?: (p: Props) => string | undefined;
  notes?: string[];
}

function polygonRule(ctx: Context, o: PolygonRuleOpts): CheckResult {
  const problem = ctx.problem(o.key);
  const items = ctx.near(o.key, ctx.radius, o.filter);
  const hits: FeatureHit[] = items.map((it) => ({
    kind: o.kind(it.f.properties ?? {}),
    name: o.name(it.f.properties ?? {}),
    distanceM: Math.round(it.d),
    bearingDeg: Math.round(it.b),
    inside: it.inside,
  }));
  if (o.fallZoneRed) {
    ctx.addHazard(o.key, items, o.kind, o.name);
    for (const h of hits) if (!h.inside) ctx.fzRed.push(h);
  }
  const inside = items.find((it) => it.inside);
  if (inside) {
    const h = hits[items.indexOf(inside)]!;
    return ctx.add({
      ruleId: o.ruleId,
      status: o.insideStatus ?? "fail",
      reason: o.insideReason(h),
      dataDate: ctx.dataDate([o.key]),
      nearestM: Math.round(inside.edge),
      nearestBearingDeg: Math.round(inside.b),
      hits,
      moreUrl: o.moreUrl?.(inside.f.properties ?? {}),
      notes: o.notes,
    });
  }
  if (problem) return ctx.unknown(o.ruleId, problem, [o.key]);
  const nearest = hits[0];
  return ctx.add({
    ruleId: o.ruleId,
    status: "pass",
    reason: nearest ? `${o.passReason} Nearest: ${hitText(nearest)}.` : o.passReason,
    dataDate: ctx.dataDate([o.key]),
    nearestM: nearest?.distanceM,
    nearestBearingDeg: nearest?.bearingDeg,
    hits,
  });
}

// ---------------------------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------------------------

function checkInBC(ctx: Context): void {
  const { inBC } = ctx.input;
  if (inBC === true) ctx.add({ ruleId: "BC", status: "pass", reason: "This point is inside British Columbia." });
  else if (inBC === false)
    ctx.add({ ruleId: "BC", status: "unknown", reason: "Cannot confirm: this point is outside British Columbia. SlotScout only checks spots in BC." });
  else ctx.unknown("BC", "could not confirm that this point is inside British Columbia");
}

function checkFederal(ctx: Context): void {
  const p = ctx.input.profile;
  if (p.firearmClass !== "non_restricted") {
    ctx.add({
      ruleId: "F1",
      status: "fail",
      reason: `${p.firearmClass === "restricted" ? "Restricted" : "Prohibited"} firearms may only be fired at an approved shooting range.`,
      moreUrl: "/ranges",
    });
  } else {
    ctx.add({ ruleId: "F1", status: "pass", reason: "Non-restricted long gun selected." });
  }

  polygonRule(ctx, {
    ruleId: "F3",
    key: "national_parks",
    kind: () => "National park",
    name: (q) => str(q.ENGLISH_NAME),
    insideReason: (h) => `Inside ${h.name}. No shooting in national parks.`,
    passReason: "Not in a national park.",
    fallZoneRed: true,
  });

  const fedParcel = parcelAtPoint(ctx, "F4");
  if (fedParcel) {
    ctx.add({ ruleId: "F4", status: "fail", reason: "This is federal land. It is not open for shooting.", dataDate: ctx.dataDate(["parcels_point"]) });
  } else {
    const pr = ctx.problem("parcels_point");
    if (pr) ctx.unknown("F4", pr, ["parcels_point"]);
    else ctx.add({ ruleId: "F4", status: "pass", reason: "No federal title recorded at this point.", dataDate: ctx.dataDate(["parcels_point"]) });
  }

  // F5 railways
  {
    const problem = ctx.problem("railways");
    const items = ctx.near("railways", ctx.radius);
    ctx.addHazard("railways", items, () => "Railway", (q) => str(q.OWNER_NAME || q.OPERATOR_ENGLISH_NAME) || "Railway");
    const hits = items.map((it) => ({
      kind: "Railway",
      name: str(it.f.properties?.OWNER_NAME || it.f.properties?.OPERATOR_ENGLISH_NAME) || "Railway",
      distanceM: Math.round(it.d),
      bearingDeg: Math.round(it.b),
      inside: it.d <= 20,
    }));
    const onRow = hits.find((h) => h.distanceM <= 20);
    if (onRow) ctx.add({ ruleId: "F5", status: "fail", reason: `On or beside a railway right-of-way (${onRow.name}).`, hits, dataDate: ctx.dataDate(["railways"]) });
    else if (hits[0])
      ctx.add({
        ruleId: "F5",
        status: "conditional",
        reason: `Railway ${formatDistance(hits[0].distanceM)} to the ${compass8(hits[0].bearingDeg)}. Do not shoot towards it.`,
        hits,
        nearestM: hits[0].distanceM,
        nearestBearingDeg: hits[0].bearingDeg,
        dataDate: ctx.dataDate(["railways"]),
      });
    else if (problem) ctx.unknown("F5", problem, ["railways"]);
    else ctx.add({ ruleId: "F5", status: "pass", reason: "No railway inside the fall zone.", dataDate: ctx.dataDate(["railways"]) });
  }

  polygonRule(ctx, {
    ruleId: "F6",
    key: "federal_protected",
    kind: (q) => str(q.TYPE_E) || "Federal protected area",
    name: (q) => str(q.NAME_E),
    insideReason: (h) => `Inside ${h.name}. Federal bird sanctuaries and wildlife areas are closed to shooting.`,
    passReason: "Not in a migratory bird sanctuary or national wildlife area.",
    fallZoneRed: true,
  });
}

function wildlifeRegion(ctx: Context): { region: string | null; mu: string | null } {
  const f = ctx.at_("wmu")[0];
  if (!f) return { region: null, mu: null };
  const name = str(f.properties?.REGION_RESPONSIBLE_NAME).toLowerCase();
  const region = REGION_BY_NAME[name] ?? (str(f.properties?.REGION_RESPONSIBLE_ID) || null);
  return { region, mu: str(f.properties?.WILDLIFE_MGMT_UNIT_ID) || null };
}

/** Schedule part of a digitised rule ID, e.g. "W5-085" -> "W5". */
function wRuleOf(id: string): string {
  return id.split("-")[0]!;
}

function evaluateDigitised(ctx: Context, f: Feature<Geometry, DigitisedRuleProps>, inside: boolean): { status: CheckStatus; reason: string; changesOn?: string; changesText?: string; notes?: string[] } {
  const p = ctx.input.profile;
  const props = f.properties;
  const hunting = p.activity === "hunting";
  const where = props.authority;
  let seasonal: ReturnType<typeof periodStatus> | null = null;
  if (props.period) seasonal = periodStatus(props.period, ctx.at);
  const seasonalText = seasonal ? `No shooting ${seasonal.text}.` : "";
  if (!inside) return { status: "pass", reason: "" };

  switch (props.effect) {
    case "no_shooting":
      return { status: "fail", reason: `No shooting area: ${where}.` };
    case "no_shooting_seasonal":
      if (seasonal?.active) return { status: "fail", reason: `Seasonal no shooting area (${where}). ${seasonalText}`, changesOn: seasonal.nextChange, changesText: "Closure ends" };
      return { status: "note", reason: `Seasonal no shooting area (${where}), not in effect today. ${seasonalText}`, changesOn: seasonal?.nextChange, changesText: "Closure starts" };
    case "no_shooting_hunting_exempt":
      if (hunting)
        return {
          status: "conditional",
          reason: `Only if you are lawfully hunting with a licence: ${where}.`,
          notes: ["Licensed hunting is exempt here. Target shooting is not."],
        };
      return { status: "fail", reason: `No target shooting: ${where}.`, notes: ["Licensed hunting is exempt here."] };
    case "shot_only":
    case "shot_only_seasonal": {
      const active = props.effect === "shot_only" || seasonal?.active;
      if (!active) return { status: "note", reason: `Seasonal shot-only area (${where}), not in effect today.`, changesOn: seasonal?.nextChange };
      if (isShot(p)) return { status: "pass", reason: `Shot-only area (${where}). Your profile uses shot.` };
      return { status: "fail", reason: `Shot-only area (${where}). Slugs and rifles are not allowed.` };
    }
    case "no_rifle":
      if (isRifle(p)) return { status: "fail", reason: `No rifles: ${where}.` };
      return { status: "pass", reason: `No-rifle area (${where}). Your profile is not a rifle.` };
    case "non_toxic":
      if (isShot(p)) return { status: "conditional", reason: `Only if you use steel or other non-toxic shot: ${where}.` };
      return { status: "pass", reason: `Non-toxic shot area (${where}); applies to shot only.` };
    case "no_hunting":
      return { status: "note", reason: `No hunting area (${where}). Shooting is not prohibited by this rule alone.` };
  }
}

/**
 * How a digitised rule feature counts (Addendum A 5.1, 9): approved features count fully; an AI-read
 * stricter change published under the one-way rule ("provisional") may only restrict; a candidate
 * waits for a person and holds its area grey, except a looser candidate, where the older, stricter
 * approved version stays live.
 */
export function featureState(f: Feature<Geometry, DigitisedRuleProps>): "approved" | "provisional" | "pending" | "ignore" {
  const p = f.properties;
  if (p.status === "retired") return "ignore";
  if (p.status === "provisional") return "provisional";
  const reviewed = !!p.reviewed_by && !!p.reviewed_on && p.reviewed_by !== p.digitised_by;
  if ((p.status === undefined || p.status === "approved") && reviewed) return "approved";
  if (p.status === "candidate" && p.change_type === "looser") return "ignore";
  return "pending";
}

const PROVISIONAL_NOTE = "AI-read change published under the one-way rule: it can only make the map stricter, and a person confirms it within 24 hours.";

const EFFECT_LABEL: Record<string, string> = {
  no_shooting: "a No Shooting area",
  no_shooting_seasonal: "a seasonal No Shooting area",
  no_shooting_hunting_exempt: "a No Shooting area (hunting exempt)",
  shot_only: "a shot-only area",
  shot_only_seasonal: "a seasonal shot-only area",
  no_rifle: "a no-rifle area",
  non_toxic: "a non-toxic shot area",
  no_hunting: "a No Hunting area",
};

const APPROX_HOW: Record<string, string> = {
  traced: "traced by code along the boundaries the regulation names",
  corners: "drawn by code between the corners it could place; some sides are straight",
  vicinity: "a zone around the places the regulation names, not its boundary",
  map_image: "read by code from the colours of the official map image",
  whole_feature: "the whole lots or waterbody the regulation names, drawn in full; the closed area is only part of it",
  hand_drawn: "drawn by a person in the map editor, who marked it approximate",
};

function checkWildlife(ctx: Context): void {
  const wmuProblem = ctx.problem("wmu", false);
  const { region, mu } = wildlifeRegion(ctx);
  const cov = region ? ctx.input.wildlifeCoverage.find((c) => c.region === region) : undefined;
  ctx.usedSources.add("closed_areas");

  const freshCoverage =
    cov?.status === "reviewed" &&
    !!cov.confirmedOn &&
    ctx.now.getTime() - new Date(cov.confirmedOn).getTime() <= TEXT_SOURCE_FRESHNESS_DAYS * 86400_000;

  const wFeatures = ctx.input.digitised.filter((f) => f.properties.rule_id.startsWith("W"));
  const byRule = new Map<string, CheckResult[]>();
  let pendingNear: Feature<Geometry, DigitisedRuleProps> | undefined;
  for (const f of wFeatures) {
    const state = featureState(f);
    if (state === "ignore") continue;
    const rel = relate(f.geometry, ctx.input.point);
    if (!rel) continue;
    const near = rel.inside || rel.distanceM <= ctx.radius;
    if (state === "pending") {
      if (near && !pendingNear) pendingNear = f;
      continue;
    }
    const inside = rel.inside;
    // An approximate outline marks where a closed area roughly is and never decides a spot near its edge.
    // An outline read from an official map image is firm deeper inside than its reading tolerance.
    const tol = f.properties.approximate_quality === "map_image" ? (f.properties.approximate_tolerance_m ?? null) : null;
    if (f.properties.approximate && !(inside && tol !== null && rel.edgeDistanceM > tol)) {
      if (!inside) continue;
      const p = f.properties;
      const w = wRuleOf(p.rule_id);
      const list = byRule.get(w) ?? [];
      list.push({
        ruleId: w,
        light: "wildlife",
        status: "unknown",
        reason: `Cannot confirm: possibly inside ${EFFECT_LABEL[p.effect] ?? "a closed area"} (${p.authority}). This outline is approximate, ${APPROX_HOW[p.approximate_quality ?? "corners"]}; read the regulation text before shooting here.`,
        citation: p.authority,
        sourceUrl: p.source_url,
        sources: ["closed_areas"],
        dataDate: p.reviewed_on ?? p.digitised_on,
        sourceText: p.source_text,
        notes: [p.notes].filter(Boolean),
        nearestM: Math.round(rel.edgeDistanceM),
        nearestBearingDeg: Math.round(rel.bearingDeg),
      });
      byRule.set(w, list);
      continue;
    }
    if (!inside && rel.distanceM <= ctx.radius) {
      const prohibits =
        ["no_shooting", "no_shooting_hunting_exempt"].includes(f.properties.effect) ||
        (f.properties.effect === "no_shooting_seasonal" && !!f.properties.period && periodStatus(f.properties.period, ctx.at).active);
      if (prohibits) {
        const hit: FeatureHit = { kind: "Wildlife Act closed area", name: f.properties.rule_id, distanceM: Math.round(rel.distanceM), bearingDeg: Math.round(rel.bearingDeg), inside: false };
        ctx.fzRed.push(hit);
        ctx.hazards.push(f.geometry);
        ctx.hazardHits.push(hit);
      }
    }
    if (!inside) continue;
    const ev = evaluateDigitised(ctx, f, true);
    // A provisional feature may only restrict.
    if (state === "provisional" && ev.status !== "fail" && ev.status !== "conditional") continue;
    const w = wRuleOf(f.properties.rule_id);
    const list = byRule.get(w) ?? [];
    const p = f.properties;
    list.push({
      ruleId: w,
      light: "wildlife",
      status: ev.status,
      reason: ev.reason,
      citation: p.authority,
      sourceUrl: p.source_url,
      sources: ["closed_areas"],
      dataDate: cov?.confirmedOn ?? p.reviewed_on ?? p.digitised_on,
      sourceText: p.source_text,
      changesOn: ev.changesOn,
      changesText: ev.changesText,
      notes: [
        ...(ev.notes ?? []),
        ...(state === "provisional" ? [PROVISIONAL_NOTE] : []),
        `Source: ${p.source_version}. ${p.extraction_method === "ai" ? `Read by ${p.model_version ?? "AI"} (prompt ${p.prompt_version ?? "?"})` : p.extraction_method === "rule" ? "Read by the rule-based parser" : "Digitised by hand"} ${p.digitised_on}${state === "approved" ? `, reviewed ${p.reviewed_on}` : ""}.`,
      ],
      nearestM: Math.round(rel.edgeDistanceM),
      nearestBearingDeg: Math.round(rel.bearingDeg),
    });
    byRule.set(w, list);
  }
  const restricting = [...byRule.values()].flat().filter((c) => c.status === "fail" || c.status === "conditional");

  if (!region || !freshCoverage || pendingNear) {
    let reason: string;
    if (pendingNear) reason = `closed area ${pendingNear.properties.rule_id} near this spot is ${pendingNear.properties.status === "candidate" && pendingNear.properties.change_type === "unclear" ? "being re-read after a wording change" : "digitised but not yet reviewed by a second person"}`;
    else if (!region) reason = wmuProblem ?? "the wildlife management unit for this point could not be found";
    else if (cov?.status === "reviewed") reason = `the Closed Areas Regulation set for Region ${region} has not been re-confirmed against the current consolidation in the last ${TEXT_SOURCE_FRESHNESS_DAYS} days`;
    else reason = `Wildlife Act closed areas for Region ${region}${cov ? ` (${cov.name})` : ""}${mu ? `, MU ${mu},` : ""} are not yet digitised and reviewed`;
    ctx.add({
      ruleId: "W1–W12",
      light: "wildlife",
      status: "unknown",
      reason: `Cannot confirm: ${reason}.`,
      citation: pendingNear?.properties.authority ?? "Wildlife Act, Closed Areas Regulation (B.C. Reg. 76/84), Schedules 1 to 13",
      sourceUrl: pendingNear?.properties.source_url ?? RULES_BY_ID.W1!.citationUrl,
      sources: ["closed_areas", "wmu"],
      sourceText: pendingNear?.properties.source_text,
      moreUrl: RULES_BY_ID.W1!.citationUrl,
      notes: ["Read the regional Hunting and Trapping Regulations Synopsis map for closed areas near this spot."],
    });
    // Closed areas already approved (or published stricter) still count: red is never hidden by a gap elsewhere.
    for (const c of restricting) ctx.checks.push(c);
  } else {
    for (let i = 1; i <= 12; i++) {
      const id = `W${i}`;
      const list = byRule.get(id);
      if (!list?.length) {
        ctx.add({ ruleId: id, status: "pass", reason: `Not inside a ${RULES_BY_ID[id]!.title.split(":")[0]} area.`, dataDate: cov!.confirmedOn });
        continue;
      }
      list.sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status]);
      ctx.checks.push(list[0]!);
    }
  }
  checkRoadAllowance(ctx);
}

function checkRoadAllowance(ctx: Context): void {
  {
    const keys: LayerKey[] = ["dra_roads"];
    const problem = ctx.problem("dra_roads");
    const isRoad = (q: Props) => !["ferry", "water", "proposed", "runway", "trail"].includes(str(q.ROAD_CLASS).toLowerCase());
    const items = ctx.near("dra_roads", ctx.radius, isRoad);
    const allowance = (q: Props) => {
      const lanes = Number(q.NUMBER_OF_LANES) || 2;
      return lanes >= 3 ? 15 + (lanes * 3.7) / 2 : 15;
    };
    const roadName = (q: Props) => str(q.ROAD_NAME_FULL) || `Unnamed ${str(q.ROAD_CLASS) || ""} road`.replace(/\s+/g, " ");
    const inAllowance = items.find((it) => it.d <= allowance(it.f.properties ?? {}));
    if (inAllowance) {
      const q = inAllowance.f.properties ?? {};
      ctx.add({
        ruleId: "W13",
        status: "fail",
        reason: `Within the road allowance of ${roadName(q)} (${formatDistance(inAllowance.d)} from the road). Move at least ${Math.ceil(allowance(q))} m off the road.`,
        dataDate: ctx.dataDate(keys),
        nearestM: Math.round(inAllowance.d),
        nearestBearingDeg: Math.round(inAllowance.b),
      });
    } else if (items[0]) {
      const q = items[0].f.properties ?? {};
      ctx.add({
        ruleId: "W13",
        status: "conditional",
        reason: `${roadName(q)} is ${formatDistance(items[0].d)} to the ${compass8(items[0].b)}, inside your fall zone. Do not shoot on or across it.`,
        dataDate: ctx.dataDate(keys),
        nearestM: Math.round(items[0].d),
        nearestBearingDeg: Math.round(items[0].b),
      });
    } else if (problem) ctx.unknown("W13", problem, keys);
    else ctx.add({ ruleId: "W13", status: "pass", reason: "No public road inside the fall zone.", dataDate: ctx.dataDate(keys) });
  }
}

const recActive = (q: Props) => str(q.LIFE_CYCLE_STATUS_CODE).toUpperCase() !== "RETIRED";
/** Undeveloped "Recreation Reserve" polygons are not sites; every active trail line counts. */
const recSite = (q: Props) => recActive(q) && str(q.PROJECT_TYPE) !== "Recreation Reserve";

function checkProvincial(ctx: Context): void {
  const hunting = ctx.input.profile.activity === "hunting";
  const parkName = (q: Props) => titleCase(str(q.PROTECTED_LANDS_NAME));
  const parkKind = (q: Props) => titleCase(str(q.PROTECTED_LANDS_DESIGNATION)) || "Provincial protected area";
  const parkUrl = (q: Props) => {
    const orcs = str(q.ORCS_PRIMARY);
    return orcs ? `https://bcparks.ca/search/?q=${encodeURIComponent(parkName(q))}` : undefined;
  };
  polygonRule(ctx, {
    ruleId: "P1",
    key: "bc_parks",
    filter: (q) => str(q.PROTECTED_LANDS_CODE) !== "ER",
    kind: parkKind,
    name: parkName,
    insideStatus: hunting ? "conditional" : "fail",
    insideReason: (h) =>
      hunting
        ? `Only if lawful hunting is allowed in ${h.name}. Check the park's rules before you go.`
        : `Inside ${h.name} (${h.kind.toLowerCase()}). No target shooting in provincial parks and protected areas.`,
    passReason: "Not in a provincial park, conservancy, recreation area or protected area.",
    fallZoneRed: true,
    moreUrl: parkUrl,
  });
  polygonRule(ctx, {
    ruleId: "P2",
    key: "bc_parks",
    filter: (q) => str(q.PROTECTED_LANDS_CODE) === "ER",
    kind: () => "Ecological reserve",
    name: parkName,
    insideReason: (h) => `Inside ${h.name}. No shooting in ecological reserves.`,
    passReason: "Not in an ecological reserve.",
    fallZoneRed: true,
  });

  // P3 recreation sites and trails: site + 100 m is red (conservative).
  {
    const keys: LayerKey[] = ["rec_sites", "rec_trails"];
    const problem = ctx.problem("rec_sites") ?? ctx.problem("rec_trails");
    const items = [...ctx.near("rec_sites", ctx.radius, recSite), ...ctx.near("rec_trails", ctx.radius, recActive)].sort((a, b) => a.d - b.d);
    const kind = (q: Props) => str(q.PROJECT_TYPE) || "Recreation site";
    const name = (q: Props) => titleCase(str(q.PROJECT_NAME)) || str(q.FOREST_FILE_ID);
    ctx.addHazard("rec_sites", items, kind, name);
    const hits = items.map((it) => ({ kind: kind(it.f.properties ?? {}), name: name(it.f.properties ?? {}), distanceM: Math.round(it.d), bearingDeg: Math.round(it.b), inside: it.inside }));
    const close = items.find((it) => it.d <= 100);
    const siteUrl = (q: Props) => (q.FOREST_FILE_ID ? `https://www.sitesandtrailsbc.ca/search/search-result.aspx?site=${encodeURIComponent(str(q.FOREST_FILE_ID))}` : undefined);
    if (close) {
      const h = hits[items.indexOf(close)]!;
      ctx.add({
        ruleId: "P3",
        status: "fail",
        reason: close.inside ? `Inside ${h.name} (${h.kind.toLowerCase()}).` : `${formatDistance(close.d)} from ${h.name} (${h.kind.toLowerCase()}). No shooting within 100 m of a recreation site or trail.`,
        hits,
        nearestM: Math.round(close.edge),
        dataDate: ctx.dataDate(keys),
        moreUrl: siteUrl(close.f.properties ?? {}),
      });
    } else if (hits[0]) {
      ctx.add({
        ruleId: "P3",
        status: "conditional",
        reason: `${hits[0].name} (${hits[0].kind.toLowerCase()}) is ${formatDistance(hits[0].distanceM)} to the ${compass8(hits[0].bearingDeg)}, inside your fall zone.`,
        hits,
        nearestM: hits[0].distanceM,
        nearestBearingDeg: hits[0].bearingDeg,
        dataDate: ctx.dataDate(keys),
      });
    } else if (problem) ctx.unknown("P3", problem, keys);
    else ctx.add({ ruleId: "P3", status: "pass", reason: "No recreation site or trail inside the fall zone.", dataDate: ctx.dataDate(keys) });
  }

  // P4 wildfire area restrictions and active fires
  {
    const keys: LayerKey[] = ["fire_restrictions", "fire_current"];
    const restr = ctx.near("fire_restrictions", ctx.radius);
    const fires = ctx.near("fire_current", ctx.radius, (q) => str(q.FIRE_STATUS).toLowerCase() !== "out");
    ctx.addHazard("fire_restrictions", restr, () => "Wildfire area restriction", (q) => str(q.NAME));
    ctx.addHazard("fire_current", fires, () => "Active wildfire", (q) => str(q.FIRE_NUMBER));
    for (const it of [...restr, ...fires]) {
      if (!it.inside) {
        const q = it.f.properties ?? {};
        ctx.fzRed.push({ kind: q.FIRE_NUMBER ? "Active wildfire" : "Wildfire area restriction", name: str(q.NAME || q.FIRE_NUMBER), distanceM: Math.round(it.d), bearingDeg: Math.round(it.b), inside: false });
      }
    }
    const inR = restr.find((it) => it.inside);
    const inF = fires.find((it) => it.inside);
    const problem = ctx.problem("fire_restrictions") ?? ctx.problem("fire_current");
    if (inR) {
      const q = inR.f.properties ?? {};
      ctx.add({ ruleId: "P4", status: "fail", reason: `Inside a wildfire area restriction (${str(q.NAME)}). Entry is prohibited.`, moreUrl: str(q.BULLETIN_URL) || undefined, dataDate: ctx.dataDate(keys) });
    } else if (inF) {
      const q = inF.f.properties ?? {};
      ctx.add({ ruleId: "P4", status: "fail", reason: `Inside the perimeter of active wildfire ${str(q.FIRE_NUMBER)} (${str(q.FIRE_STATUS)}).`, moreUrl: str(q.FIRE_URL) || undefined, dataDate: ctx.dataDate(keys) });
    } else if (problem) ctx.unknown("P4", problem, keys);
    else ctx.add({ ruleId: "P4", status: "pass", reason: "No wildfire area restriction or active fire at this point.", dataDate: ctx.dataDate(keys) });
  }

  // P5 bans
  {
    const problem = ctx.problem("fire_bans", false);
    const bans = ctx.at_("fire_bans");
    if (bans.length) {
      const texts = bans.map((b) => [str(b.properties?.TYPE), str(b.properties?.ACCESS_PROHIBITION_DESCRIPTION)].filter(Boolean).join(": "));
      ctx.add({
        ruleId: "P5",
        status: "conditional",
        reason: `Fire ban in effect: ${texts.join("; ")}. Exploding targets and tracer ammunition are flagged; read the order.`,
        moreUrl: str(bans[0]!.properties?.BULLETIN_URL) || "https://www2.gov.bc.ca/gov/content/safety/wildfire-status/fire-bans-and-restrictions",
        dataDate: ctx.dataDate(["fire_bans"]),
      });
    } else if (problem) ctx.unknown("P5", problem, ["fire_bans"]);
    else ctx.add({ ruleId: "P5", status: "pass", reason: "No fire ban or prohibition mapped at this point today.", dataDate: ctx.dataDate(["fire_bans"]) });
  }

  // P6 road notices
  checkRoadNotices(ctx);

  // P7 motor vehicle closures
  {
    const problem = ctx.problem("mvpr", false);
    const areas = ctx.at_("mvpr");
    if (areas.length) {
      const q = areas[0]!.properties ?? {};
      ctx.add({
        ruleId: "P7",
        status: "conditional",
        reason: `Motor vehicle closure (${titleCase(str(q.REGULATION_GEOGRAPHIC_NAME))}): ${str(q.EFFECTIVE_DESCRIPTION) || "check dates"}. You may need to walk in.`,
        moreUrl: "https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/regulations-synopsis",
        dataDate: ctx.dataDate(["mvpr"]),
      });
    } else if (problem) ctx.unknown("P7", problem, ["mvpr"]);
    else ctx.add({ ruleId: "P7", status: "pass", reason: "Not in a motor vehicle closure area.", dataDate: ctx.dataDate(["mvpr"]) });
  }

  // P8 community watersheds
  {
    const problem = ctx.problem("community_watersheds", false);
    const ws = ctx.at_("community_watersheds");
    if (ws.length) {
      const q = ws[0]!.properties ?? {};
      ctx.add({
        ruleId: "P8",
        status: "conditional",
        reason: `Inside ${str(q.CW_NAME)}, a community drinking-water watershed (${str(q.ORGANIZATION) || "water supplier"}). Check for an access order before entering.`,
        dataDate: ctx.dataDate(["community_watersheds"]),
      });
    } else if (problem) ctx.unknown("P8", problem, ["community_watersheds"]);
    else ctx.add({ ruleId: "P8", status: "pass", reason: "Not in a community watershed.", dataDate: ctx.dataDate(["community_watersheds"]) });
  }

  // P9 tenures
  {
    const keys: LayerKey[] = ["crown_tenures", "range_tenures", "mineral_tenures"];
    const problem = keys.map((k) => ctx.problem(k, false)).find(Boolean);
    const crown = ctx.at_("crown_tenures");
    const range = ctx.at_("range_tenures", (q) => str(q.LIFE_CYCLE_STATUS_CODE).toUpperCase() === "ACTIVE");
    const mineral = ctx.at_("mineral_tenures");
    const mineralLeases = mineral.filter((f) => /lease/i.test(str(f.properties?.TENURE_SUB_TYPE_DESCRIPTION)));
    const reasons: string[] = [];
    for (const f of crown.slice(0, 2)) {
      const q = f.properties ?? {};
      reasons.push(`Crown ${str(q.TENURE_TYPE).toLowerCase()} for ${str(q.TENURE_PURPOSE).toLowerCase()}${q.TENURE_SUBPURPOSE ? ` (${str(q.TENURE_SUBPURPOSE).toLowerCase()})` : ""}`);
    }
    if (range.length) reasons.push("an active grazing tenure: livestock may be present, watch for fences and cattle guards");
    for (const f of mineralLeases.slice(0, 1)) reasons.push(`a ${str(f.properties?.TENURE_TYPE_DESCRIPTION).toLowerCase()} lease`);
    const notes = mineral.length && !mineralLeases.length ? ["A mineral claim covers this spot. Claims do not close land to the public, but claim holders may be working."] : undefined;
    if (reasons.length) {
      ctx.add({ ruleId: "P9", status: "conditional", reason: `Tenure holder may be working here: ${reasons.join("; ")}.`, notes, dataDate: ctx.dataDate(keys) });
    } else if (problem) ctx.unknown("P9", problem, keys);
    else ctx.add({ ruleId: "P9", status: "pass", reason: "No Crown lease, licence or active grazing tenure at this point.", notes, dataDate: ctx.dataDate(keys) });
  }
}

function nearbyFsrs(ctx: Context) {
  return ctx.near("fsr_roads", ACCESS_RADIUS_M);
}

function fileSection(q: Props): string {
  return `${str(q.FOREST_FILE_ID)}.${str(q.ROAD_SECTION_ID)}`;
}

/** "Harrison East FSR 5748.01" or "Road permit R21399 BRSL111" when the section has no name. */
function fsrLabel(q: Props): string {
  const type = str(q.FILE_TYPE_DESCRIPTION);
  const name = titleCase(str(q.ROAD_SECTION_NAME).trim());
  const id = `${str(q.FOREST_FILE_ID)} ${str(q.ROAD_SECTION_ID)}`.trim();
  if (type === "Forest Service Road") return `${name || "Unnamed"} FSR ${fileSection(q)}`;
  return `${name ? `${name} ` : ""}${type ? type.toLowerCase() : "resource road"} ${id}`.replace(/^road permit/, "Road permit").trim();
}

const CLOSURE_SENTENCE = /no access|closed|impassable|not drivable|no vehicle access|bridge out|restricted|washout|washed out|deactivat|gate/i;

/** The sentence(s) of a notice that carry the closure, so the reason quotes what matters. */
function closureText(n: RoadNotice): string {
  const sentences = n.text.split(/(?<=[.!?])\s+/);
  const key = sentences.filter((x) => CLOSURE_SENTENCE.test(x));
  return (key.length ? key : sentences).join(" ").slice(0, 220);
}

function normaliseRoadName(s: string): string {
  return s.toLowerCase().replace(/\b(fsr|forest service road|road|rd)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function matchNotices(ctx: Context): { notices: RoadNotice[]; fsrs: ReturnType<typeof nearbyFsrs> } {
  const fsrs = nearbyFsrs(ctx);
  const notices = ctx.input.roadNotices?.notices ?? [];
  const sections = new Set(fsrs.map((it) => fileSection(it.f.properties ?? {})));
  const files = new Set(fsrs.map((it) => str(it.f.properties?.FOREST_FILE_ID)));
  const names = new Set(fsrs.map((it) => normaliseRoadName(str(it.f.properties?.ROAD_SECTION_NAME))).filter(Boolean));
  const matched = notices.filter((n) => {
    if (n.fileSection) {
      if (sections.has(n.fileSection)) return true;
      const file = n.fileSection.split(".")[0]!;
      if (files.has(file) && !n.fileSection.includes(".")) return true;
    }
    const nm = normaliseRoadName(n.road);
    return nm.length > 2 && names.has(nm);
  });
  return { notices: matched, fsrs };
}

/** "posted 2021, still listed" for notices older than a year (Addendum A 5.2 step 5). */
function postedLabel(n: RoadNotice, now: Date): string {
  const iso = n.postedOn;
  if (!iso) return n.date ? ` (${n.date})` : "";
  const ageDays = (now.getTime() - new Date(iso).getTime()) / 86400_000;
  return ageDays > 365 ? ` (posted ${iso.slice(0, 4)}, still listed)` : ` (${n.date ?? iso})`;
}

type Placement = { notice: RoadNotice; point: NoticePoint; spotKm: number | null; blocks: boolean; why: string };

/**
 * Places a notice's km points against the spot (Addendum A 5.2 step 3): the spot's km is measured
 * along the matching FTEN section from its first vertex. A closure only clears the spot when it is
 * clearly further up the road (more than 1 km or 25% beyond it), a margin for the gap between
 * posted km markers and mapped length; when the section is shorter than the posted km (km markers carried over from an earlier
 * section) or the notice names no km, the closure counts as blocking.
 */
function placeNotice(ctx: Context, n: RoadNotice, fsrs: ReturnType<typeof nearbyFsrs>): Placement[] {
  const section = fsrs.find((it) => n.fileSection && fileSection(it.f.properties ?? {}) === n.fileSection);
  const measured = section ? measureAlong(section.f.geometry, ctx.input.point) : null;
  const lengthKm = section ? lineLengthM(section.f.geometry) / 1000 : 0;
  const spotKm = measured ? measured.alongM / 1000 : null;
  const points: NoticePoint[] = n.points?.length
    ? n.points
    : n.kind === "closed" || n.kind === "restricted" || n.kind === "deactivated"
      ? [{ km: null, extent: "unknown", status: n.kind === "deactivated" ? "deactivated" : n.kind === "restricted" ? "restricted" : "closed", quote: closureText(n) }]
      : [];
  return points.map((point) => {
    if (!isBlockingStatus(point.status)) return { notice: n, point, spotKm, blocks: false, why: "caution" };
    if (point.km === null || point.extent === "unknown") return { notice: n, point, spotKm, blocks: true, why: "the notice does not say where on the road" };
    if (spotKm === null) return { notice: n, point, spotKm, blocks: true, why: "the spot could not be placed on this road section" };
    const startKm = point.km;
    if (startKm > lengthKm + 1) return { notice: n, point, spotKm, blocks: true, why: `the mapped section is ${lengthKm.toFixed(1)} km long, so km ${startKm} cannot be placed on it` };
    // Posted km markers are approximate and mapped lengths are generalised: clear a spot only well below the closure.
    const margin = Math.max(1, startKm * 0.25);
    if (spotKm + margin < startKm) return { notice: n, point, spotKm, blocks: false, why: `the closure starts at km ${startKm}, further up the road than this spot (about km ${spotKm.toFixed(1)})` };
    return { notice: n, point, spotKm, blocks: true, why: `this spot is at about km ${spotKm.toFixed(1)}, at or past the closure` };
  });
}

function checkRoadNotices(ctx: Context): void {
  const fsrProblem = ctx.problem("fsr_roads", false);
  const { notices, fsrs } = matchNotices(ctx);
  ctx.usedSources.add("road_notices");
  const rn = ctx.input.roadNotices;
  const date = rn?.fetchedAt;
  if (!fsrs.length) {
    if (fsrProblem) ctx.unknown("P6", fsrProblem, ["fsr_roads"]);
    else ctx.add({ ruleId: "P6", status: "not_applicable", reason: `No forest service or permit road within ${formatDistance(ACCESS_RADIUS_M)}.`, dataDate: ctx.dataDate(["fsr_roads"]) });
    return;
  }
  const placements = notices.flatMap((n) => placeNotice(ctx, n, fsrs));
  const blocking = placements.filter((p) => p.blocks);
  // A notice that has left the district page still counts until a person checks it (one-way rule).
  const removedNote = notices.some((n) => n.listing === "removed_pending_review")
    ? ["A closure that is no longer on the district page stays on SlotScout until a person checks the District Manager's notice."]
    : [];
  if (blocking.length) {
    const seen = new Set<RoadNotice>();
    const lines = blocking.filter((p) => (seen.has(p.notice) ? false : (seen.add(p.notice), true)));
    ctx.add({
      ruleId: "P6",
      status: "conditional",
      reason: `Route may be closed or restricted: ${lines
        .slice(0, 2)
        .map((p) => `${p.notice.road}${postedLabel(p.notice, ctx.now)}: ${p.point.quote.slice(0, 220)}`)
        .join(" ")}`,
      sourceText: lines[0]!.point.quote,
      moreUrl: lines[0]!.notice.url ?? rn?.pageUrl,
      dataDate: date,
      notes: [
        ...lines.slice(0, 3).map((p) => `${p.notice.road}: counted as blocking because ${p.why}.`),
        ...removedNote,
        "SlotScout does not yet plan routes, so it cannot tell whether a closure is on your way in.",
      ],
    });
    return;
  }
  if (!rn || rn.status !== "ok") {
    ctx.unknown("P6", `the ${rn?.district ?? "natural resource district"} road notices page could not be read${rn?.error ? ` (${rn.error})` : ""}`);
    return;
  }
  const fresh = !!date && ctx.now.getTime() - new Date(date).getTime() <= (ctx.input.sources.road_notices?.freshnessHours ?? 48) * 3600_000;
  if (!fresh) {
    ctx.unknown("P6", "district road notices are older than their freshness limit");
    return;
  }
  const unparsed = rn.unparsed ?? [];
  if (unparsed.length) {
    ctx.add({
      ruleId: "P6",
      status: "unknown",
      reason: `Cannot confirm: the ${rn.district} road safety page has ${unparsed.length === 1 ? "a closure or deactivation item" : `${unparsed.length} closure or deactivation items`} SlotScout could not tie to a road yet.`,
      sourceText: unparsed[0]!.text.slice(0, 400),
      moreUrl: rn.pageUrl,
      dataDate: date,
      notes: ["A person is checking these items. Read the district page for closures near this spot."],
    });
    return;
  }
  const unread = notices.filter((n) => n.needsAi && n.extraction !== "ai" && n.extraction !== "person");
  if (unread.length) {
    const u = unread[0]!;
    ctx.unknown(
      "P6",
      u.origin === "dm_notice"
        ? `a District Manager notice closes or restricts ${u.road}, and its reading has not yet been checked by a person`
        : `a notice for ${u.road} names km points the parser could not read, and it has not yet been read and checked`,
    );
    return;
  }
  const ahead = placements.filter((p) => isBlockingStatus(p.point.status));
  const cautions = placements.filter((p) => !isBlockingStatus(p.point.status));
  ctx.add({
    ruleId: "P6",
    status: "pass",
    reason: ahead.length
      ? `Closures posted on nearby resource roads are further up the road than this spot (${rn.district} notices page).`
      : `No closure posted for nearby resource roads on the ${rn.district} notices page.`,
    notes: [
      ...ahead.slice(0, 2).map((p) => `${p.notice.road}${postedLabel(p.notice, ctx.now)}: ${p.why}. "${p.point.quote.slice(0, 200)}"`),
      ...cautions.slice(0, 3).map((p) => `${p.notice.road}${postedLabel(p.notice, ctx.now)}: ${p.point.quote.slice(0, 200)}`),
    ].slice(0, 5),
    moreUrl: rn.pageUrl,
    dataDate: date,
  });
}

function bylawFor(ctx: Context, key: string): BylawEntry | undefined {
  return ctx.input.bylaws.find((b) => b.key === key);
}

function bylawCheck(ctx: Context, ruleId: "L1" | "L2" | "L3", entry: BylawEntry | undefined, name: string, keys: LayerKey[]): void {
  ctx.usedSources.add("bylaws");
  const link = entry?.bylaw?.url;
  const bylawLabel = entry?.bylaw ? [entry.bylaw.title, entry.bylaw.number && `Bylaw ${entry.bylaw.number}`].filter(Boolean).join(", ") : "";
  if (entry?.status === "not_applicable") {
    ctx.add({ ruleId, status: "not_applicable", reason: `${name} has no firearm bylaw to apply.`, dataDate: ctx.dataDate(keys) });
    return;
  }
  const fresh =
    entry?.status === "reviewed" &&
    !!entry.confirmedOn &&
    ctx.now.getTime() - new Date(entry.confirmedOn).getTime() <= TEXT_SOURCE_FRESHNESS_DAYS * 86400_000;
  if (!entry || !fresh) {
    ctx.add({
      ruleId,
      status: "unknown",
      reason: `Cannot confirm: local bylaw not yet checked for ${name}.${bylawLabel ? ` Read ${bylawLabel}.` : ""}`,
      moreUrl: link,
      dataDate: ctx.dataDate(keys),
      notes: entry?.notes ? [entry.notes] : undefined,
    });
    return;
  }
  if (entry.targetShooting === "prohibited") {
    ctx.add({ ruleId, status: "fail", reason: `${name} bans firearm discharge for target shooting${bylawLabel ? ` (${bylawLabel})` : ""}.`, moreUrl: link, dataDate: entry.confirmedOn, notes: entry.notes ? [entry.notes] : undefined });
    return;
  }
  if (entry.targetShooting === "no_bylaw") {
    ctx.add({ ruleId, status: "pass", reason: `No firearm discharge bylaw applies in ${name} (reviewed ${entry.confirmedOn}).`, dataDate: entry.confirmedOn });
    return;
  }
  // Zoned bylaw: evaluate this jurisdiction's digitised zones by their review state. Until its zones are drawn, an
  // undrawn zone must never read as "outside": the answer cannot be given.
  const all = ctx.input.digitised.filter((f) => f.properties.rule_id.startsWith(`${ruleId}-`) && f.properties.jurisdiction === entry.key && featureState(f) !== "ignore");
  if (!all.length) {
    ctx.add({
      ruleId,
      status: "unknown",
      reason: `Cannot confirm: ${name}'s bylaw${bylawLabel ? ` (${bylawLabel})` : ""} bans discharge in mapped zones or near buildings and roads, and those zones are not drawn yet. Read the bylaw's maps.`,
      moreUrl: link,
      dataDate: entry.confirmedOn,
      notes: entry.notes ? [entry.notes] : undefined,
    });
    return;
  }
  const inside = all.filter((f) => relate(f.geometry, ctx.input.point)?.inside);
  for (const z of inside) {
    const state = featureState(z);
    if (state === "pending") continue;
    const ev = evaluateDigitised(ctx, z, true);
    if (ev.status === "fail" || ev.status === "conditional") {
      ctx.add({
        ruleId,
        status: ev.status,
        reason: `${name}: ${ev.reason}`,
        sourceText: z.properties.source_text,
        moreUrl: link,
        dataDate: entry.confirmedOn,
        notes: state === "provisional" ? [PROVISIONAL_NOTE] : undefined,
      });
      return;
    }
  }
  const pending = inside.find((f) => featureState(f) === "pending");
  if (pending) {
    ctx.add({ ruleId, status: "unknown", reason: `Cannot confirm: bylaw zone ${pending.properties.rule_id} in ${name} is not yet reviewed.`, moreUrl: link });
    return;
  }
  ctx.add({ ruleId, status: "pass", reason: `Outside the bylaw's no-discharge zones in ${name}.`, moreUrl: link, dataDate: entry.confirmedOn });
}

function checkLocal(ctx: Context): void {
  const muni = ctx.at_("municipalities")[0];
  const muniProblem = ctx.problem("municipalities", false);
  if (muni) {
    const name = str(muni.properties?.ADMIN_AREA_NAME);
    bylawCheck(ctx, "L1", bylawFor(ctx, `muni:${name}`), name, ["municipalities"]);
  } else if (muniProblem) ctx.unknown("L1", muniProblem, ["municipalities"]);
  else ctx.add({ ruleId: "L1", status: "not_applicable", reason: "Not inside a municipality.", dataDate: ctx.dataDate(["municipalities"]) });

  const ea = ctx.at_("electoral_areas")[0];
  const eaProblem = ctx.problem("electoral_areas", false);
  if (muni) ctx.add({ ruleId: "L2", status: "not_applicable", reason: "Inside a municipality, so the municipal bylaw applies instead.", dataDate: ctx.dataDate(["electoral_areas"]) });
  else if (ea) {
    const name = str(ea.properties?.ADMIN_AREA_NAME);
    const rd = str(ea.properties?.ADMIN_AREA_GROUP_NAME);
    bylawCheck(ctx, "L2", bylawFor(ctx, `ea:${name}`), `${name}${rd && !name.includes(rd) ? ` (${rd})` : ""}`, ["electoral_areas"]);
  } else if (eaProblem) ctx.unknown("L2", eaProblem, ["electoral_areas"]);
  else {
    const rd = ctx.at_("regional_districts")[0];
    if (rd) ctx.unknown("L2", `this point is in ${str(rd.properties?.ADMIN_AREA_NAME)} but no electoral area was found`, ["regional_districts"]);
    else ctx.add({ ruleId: "L2", status: "not_applicable", reason: "Not inside a regional district electoral area.", dataDate: ctx.dataDate(["electoral_areas"]) });
  }

  const lta = ctx.at_("local_trust_areas")[0];
  const ltaProblem = ctx.problem("local_trust_areas", false);
  if (lta) {
    const name = str(lta.properties?.ADMIN_AREA_NAME);
    bylawCheck(ctx, "L3", bylawFor(ctx, `lta:${name}`), name, ["local_trust_areas"]);
  } else if (ltaProblem) ctx.unknown("L3", ltaProblem, ["local_trust_areas"]);
  else ctx.add({ ruleId: "L3", status: "not_applicable", reason: "Not in an Islands Trust area.", dataDate: ctx.dataDate(["local_trust_areas"]) });

  polygonRule(ctx, {
    ruleId: "L4",
    key: "local_parks",
    kind: (q) => `${str(q.PARK_TYPE) || "Local"} park`,
    name: (q) => str(q.PARK_NAME),
    insideReason: (h) => `Inside ${h.name}. No shooting in regional or municipal parks.`,
    passReason: "Not in a regional or municipal park.",
    fallZoneRed: true,
    moreUrl: (q) => str(q.WEBSITE_URL) || undefined,
  });
}

function checkIndigenous(ctx: Context): void {
  const fnParcel = parcelAtPoint(ctx, "I1");
  const reserve = polygonRule(ctx, {
    ruleId: "I1",
    key: "reserves",
    kind: () => "Reserve",
    name: (q) => titleCase(str(q.ENGLISH_NAME)),
    insideReason: (h) => `Inside ${h.name} reserve. Permission from the Nation is required.`,
    passReason: "Not on reserve land.",
    fallZoneRed: true,
  });
  if (fnParcel && reserve.status !== "fail") {
    reserve.status = "fail";
    reserve.reason = "First Nations land (ParcelMap BC). Permission from the Nation is required.";
  }
  polygonRule(ctx, {
    ruleId: "I2",
    key: "treaty_lands",
    kind: () => "Treaty settlement land",
    name: (q) => str(q.FIRST_NATION_NAME) || str(q.TREATY),
    insideReason: (h) => `Treaty settlement land of ${h.name}. The Nation's laws apply.`,
    passReason: "Not on modern treaty settlement land.",
    fallZoneRed: true,
  });
  const area = ctx.at_("treaty_areas")[0];
  const problem = ctx.problem("treaty_areas", false);
  if (area) {
    const q = area.properties ?? {};
    ctx.add({
      ruleId: "I3",
      status: "note",
      reason: `Inside the ${str(q.TREATY)} treaty area (${str(q.FIRST_NATION_NAME)}). Learn about the Nation whose territory you are on.`,
      dataDate: ctx.dataDate(["treaty_areas"]),
    });
  } else if (problem) ctx.add({ ruleId: "I3", status: "note", reason: `Treaty areas could not be checked: ${problem}.` });
  else ctx.add({ ruleId: "I3", status: "not_applicable", reason: "Not in a mapped treaty area.", dataDate: ctx.dataDate(["treaty_areas"]) });
}

/** Owner type of the parcel(s) at the point that trigger a given rule. */
function parcelAtPoint(ctx: Context, ruleId: string): AnyFeature | undefined {
  return ctx.at_("parcels_point").find((f) => OWNER_TYPES[str(f.properties?.OWNER_TYPE)]?.rule === ruleId);
}

function checkOwnership(ctx: Context): void {
  const keys: LayerKey[] = ["parcels_point"];
  const problem = ctx.problem("parcels_point");
  const parcels = ctx.at_("parcels_point");
  const types = parcels.map((f) => str(f.properties?.OWNER_TYPE));

  const priv = parcels.find((f) => ["Private", "Mixed Ownership"].includes(str(f.properties?.OWNER_TYPE)));
  const unclassified = parcels.find((f) => str(f.properties?.OWNER_TYPE) === "Unclassified");
  if (priv) ctx.add({ ruleId: "O1", status: "fail", reason: `${OWNER_TYPES[str(priv.properties?.OWNER_TYPE)]!.kind}. You need the owner's permission.`, dataDate: ctx.dataDate(keys) });
  else if (problem) ctx.unknown("O1", problem, keys);
  else if (unclassified) ctx.unknown("O1", "ParcelMap BC lists this parcel's ownership as unclassified", keys);
  else
    ctx.add({
      ruleId: "O1",
      status: "pass",
      reason: types.length ? `ParcelMap BC shows ${types.map((t) => OWNER_TYPES[t]?.kind.toLowerCase() ?? t).join(", ")} here.` : "No titled parcel recorded here: unsurveyed provincial Crown land.",
      dataDate: ctx.dataDate(keys),
    });

  if (priv) ctx.add({ ruleId: "O2", status: "note", reason: "If this is private managed forest land, the owner's public access policy decides entry. Ask the owner." });
  else ctx.add({ ruleId: "O2", status: "not_applicable", reason: "Not private land.", dataDate: ctx.dataDate(keys) });

  const agency = parcels.find((f) => OWNER_TYPES[str(f.properties?.OWNER_TYPE)]?.rule === "O3");
  if (agency) ctx.add({ ruleId: "O3", status: "fail", reason: `${OWNER_TYPES[str(agency.properties?.OWNER_TYPE)]!.kind}. Not open for shooting.`, dataDate: ctx.dataDate(keys) });
  else if (problem) ctx.unknown("O3", problem, keys);
  else ctx.add({ ruleId: "O3", status: "pass", reason: "No Crown agency or local government title at this point.", dataDate: ctx.dataDate(keys) });

  // Non-Crown parcels inside the fall zone.
  {
    const items = ctx.near("parcels_nearby", ctx.radius, (q) => OWNER_TYPES[str(q.OWNER_TYPE)]?.rule != null);
    const kind = (q: Props) => OWNER_TYPES[str(q.OWNER_TYPE)]?.kind ?? "Titled land";
    ctx.addHazard("parcels_nearby", items, kind, kind);
    for (const it of items) {
      if (it.inside) continue;
      const k = kind(it.f.properties ?? {});
      ctx.fzRed.push({ kind: k, name: k, distanceM: Math.round(it.d), bearingDeg: Math.round(it.b), inside: false });
    }
  }

  // O4 utility lines
  {
    const keys4: LayerKey[] = ["transmission", "pipelines"];
    const lines = ctx.near("transmission", ctx.radius);
    const pipes = ctx.near("pipelines", ctx.radius);
    ctx.addHazard("transmission", lines, () => "Power line", (q) => str(q.CIRCUIT_NAME) || str(q.OWNER) || "Transmission line");
    ctx.addHazard("pipelines", pipes, () => "Pipeline", (q) => str(q.PROPONENT) || "Pipeline");
    const all = [
      ...lines.map((it) => ({ ...it, what: "Power line" })),
      ...pipes.map((it) => ({ ...it, what: "Pipeline" })),
    ].sort((a, b) => a.d - b.d);
    const problem4 = ctx.problem("transmission") ?? ctx.problem("pipelines");
    if (all[0]) {
      ctx.add({
        ruleId: "O4",
        status: "conditional",
        reason: `${all[0].what} ${formatDistance(all[0].d)} to the ${compass8(all[0].b)}. Do not shoot towards power lines, insulators or pipelines.`,
        nearestM: Math.round(all[0].d),
        nearestBearingDeg: Math.round(all[0].b),
        dataDate: ctx.dataDate(keys4),
      });
    } else if (problem4) ctx.unknown("O4", problem4, keys4);
    else ctx.add({ ruleId: "O4", status: "pass", reason: "No mapped power line or pipeline inside the fall zone.", dataDate: ctx.dataDate(keys4) });
  }
}

function checkSafety(ctx: Context): void {
  const year = new Date(ctx.at).getUTCFullYear();
  const month = new Date(ctx.at).getUTCMonth() + 1;

  // S1 buildings
  const bld = ctx.near("buildings", ctx.radius);
  ctx.addHazard("buildings", bld, () => "Building", (q) => titleCase(str(q.FEATURE_TYPE).replace(/([a-z])([A-Z])/g, "$1 $2")) || "Building");
  const bProblem = ctx.problem("buildings");
  let s1: CheckResult;
  if (bld[0])
    s1 = ctx.add({
      ruleId: "S1",
      status: "conditional",
      reason: `${bld.length} mapped building${bld.length > 1 ? "s" : ""} inside the fall zone; nearest ${formatDistance(bld[0].d)} to the ${compass8(bld[0].b)}.`,
      nearestM: Math.round(bld[0].d),
      nearestBearingDeg: Math.round(bld[0].b),
      dataDate: ctx.dataDate(["buildings"]),
      notes: ["Mapped buildings come from provincial base mapping and can be years out of date. Look for cabins and camps yourself."],
    });
  else if (bProblem) s1 = ctx.unknown("S1", bProblem, ["buildings"]);
  else s1 = ctx.add({ ruleId: "S1", status: "pass", reason: "No mapped building inside the fall zone.", dataDate: ctx.dataDate(["buildings"]), notes: ["Mapped buildings can be years out of date."] });

  // S2 roads, trails, rec sites
  const keys2: LayerKey[] = ["dra_roads", "fsr_roads", "rec_sites", "rec_trails"];
  const roads = ctx.near("dra_roads", ctx.radius, (q) => !["ferry", "water", "proposed", "runway"].includes(str(q.ROAD_CLASS).toLowerCase()));
  const fsr = ctx.near("fsr_roads", ctx.radius);
  ctx.addHazard("dra_roads", roads, (q) => (str(q.ROAD_CLASS).toLowerCase() === "trail" ? "Trail" : "Road"), (q) => str(q.ROAD_NAME_FULL) || `${titleCase(str(q.ROAD_CLASS))} road`);
  ctx.addHazard("fsr_roads", fsr, () => "Resource road", fsrLabel);
  const rec = ctx.near("rec_sites", ctx.radius, recSite).concat(ctx.near("rec_trails", ctx.radius, recActive));
  const all = [
    ...roads.map((it) => ({ d: it.d, b: it.b, label: str(it.f.properties?.ROAD_NAME_FULL) || `${str(it.f.properties?.ROAD_CLASS)} road` })),
    ...fsr.map((it) => ({ d: it.d, b: it.b, label: fsrLabel(it.f.properties ?? {}) })),
    ...rec.map((it) => ({ d: it.d, b: it.b, label: titleCase(str(it.f.properties?.PROJECT_NAME)) })),
  ].sort((a, b) => a.d - b.d);
  const p2 = keys2.map((k) => ctx.problem(k)).find(Boolean);
  let s2: CheckResult;
  if (all[0])
    s2 = ctx.add({
      ruleId: "S2",
      status: "conditional",
      reason: `${all[0].label.trim()} is ${formatDistance(all[0].d)} to the ${compass8(all[0].b)}, inside the fall zone. Use the compass to pick a safe direction.`,
      nearestM: Math.round(all[0].d),
      nearestBearingDeg: Math.round(all[0].b),
      dataDate: ctx.dataDate(keys2),
    });
  else if (p2) s2 = ctx.unknown("S2", p2, keys2);
  else s2 = ctx.add({ ruleId: "S2", status: "pass", reason: "No road, trail or rec site inside the fall zone.", dataDate: ctx.dataDate(keys2) });

  // F2 careless use follows S1 and S2.
  const f2Status: CheckStatus = [s1.status, s2.status].includes("conditional") ? "conditional" : [s1.status, s2.status].includes("unknown") ? "unknown" : "pass";
  ctx.add({
    ruleId: "F2",
    status: f2Status,
    reason:
      f2Status === "conditional"
        ? "Buildings, roads, trails or rec sites are inside your fall zone. Fire only in a direction where shots cannot reach them."
        : f2Status === "unknown"
          ? "Cannot confirm: some fall-zone layers could not be read."
          : "No mapped building, road, trail or rec site inside your fall zone.",
  });

  // S3 recent burn
  {
    const keys: LayerKey[] = ["fire_history", "fire_current"];
    const hist = ctx.at_("fire_history", (q) => Number(q.FIRE_YEAR) >= year - 3);
    const cur = ctx.at_("fire_current");
    const problem = ctx.problem("fire_history", false);
    const burn = hist[0] ?? cur[0];
    if (burn) {
      const q = burn.properties ?? {};
      ctx.add({ ruleId: "S3", status: "conditional", reason: `Burned in ${str(q.FIRE_YEAR)} (fire ${str(q.FIRE_NUMBER)}). Watch for danger trees and slides.`, dataDate: ctx.dataDate(keys) });
    } else if (problem) ctx.unknown("S3", problem, keys);
    else ctx.add({ ruleId: "S3", status: "pass", reason: "No burn mapped here in the last 3 years.", dataDate: ctx.dataDate(keys) });
  }

  // S4 active logging
  {
    const recent = ctx.near("cutblocks", ctx.radius, (q) => Number(q.HARVEST_START_YEAR_CALENDAR) >= year - 1);
    const problem = ctx.problem("cutblocks", false);
    if (recent[0]) {
      const q = recent[0].f.properties ?? {};
      ctx.add({
        ruleId: "S4",
        status: "conditional",
        reason: `${recent[0].inside ? "This cutblock was" : `A cutblock ${formatDistance(recent[0].d)} to the ${compass8(recent[0].b)} was`} harvested in ${str(q.HARVEST_START_YEAR_CALENDAR)}. Active logging possible: workers, trucks and equipment may be present.`,
        nearestM: Math.round(recent[0].d),
        dataDate: ctx.dataDate(["cutblocks"]),
      });
    } else if (problem) ctx.unknown("S4", problem, ["cutblocks"]);
    else ctx.add({ ruleId: "S4", status: "pass", reason: "No cutblock harvested in the last 12 months inside the fall zone.", dataDate: ctx.dataDate(["cutblocks"]) });
  }

  ctx.add({
    ruleId: "S5",
    status: "note",
    reason: "Shoot into a solid earth backstop. SlotScout does not yet read slope from the elevation model, so check the ground behind your targets.",
  });

  const { mu } = wildlifeRegion(ctx);
  ctx.add({
    ruleId: "S6",
    status: "note",
    reason: `${mu ? `Management unit ${mu}. ` : ""}${month >= 8 && month <= 12 ? "Most hunting seasons are open now." : "Some hunting seasons may be open."} Wear blaze orange and expect hunters.`,
    moreUrl: "https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/regulations-synopsis",
  });

  if (month >= 11 || month <= 5)
    ctx.add({ ruleId: "S7", status: "note", reason: "Winter and spring: steep slopes can slide. Check the avalanche forecast before heading into the mountains.", moreUrl: "https://avalanche.ca" });
  else ctx.add({ ruleId: "S7", status: "not_applicable", reason: "Outside avalanche season." });
}

function checkFallZone(ctx: Context): void {
  const red = [...ctx.fzRed].sort((a, b) => a.distanceM - b.distanceM);
  const redLayers: LayerKey[] = ["national_parks", "federal_protected", "bc_parks", "local_parks", "reserves", "treaty_lands", "parcels_nearby", "fire_restrictions", "fire_current"];
  const problem = redLayers.map((k) => ctx.problem(k)).find(Boolean);
  if (red.length) {
    // One line per kind, nearest first.
    const seen = new Set<string>();
    const lines: string[] = [];
    for (const h of red) {
      if (seen.has(h.kind)) continue;
      seen.add(h.kind);
      lines.push(hitText(h));
      if (lines.length === 3) break;
    }
    ctx.add({
      ruleId: "FZ",
      status: "conditional",
      reason: `Inside your ${formatDistance(ctx.radius)} fall zone: ${lines.join("; ")}. Shots must not land there.`,
      hits: red.slice(0, 20),
      nearestM: red[0]!.distanceM,
      nearestBearingDeg: red[0]!.bearingDeg,
    });
  } else if (problem) ctx.unknown("FZ", problem);
  else ctx.add({ ruleId: "FZ", status: "pass", reason: `No prohibited land mapped inside your ${formatDistance(ctx.radius)} fall zone.` });
}

function checkFreshness(ctx: Context, imageryNote: string): void {
  const stale: string[] = [];
  for (const [key, l] of Object.entries(ctx.input.layers)) {
    if (!l) continue;
    if (l.status !== "ok" || !ctx.isFresh(l)) stale.push(`${ctx.sourceName(l.sourceId)}${key.endsWith("_nearby") ? " (fall zone)" : ""}`);
  }
  const rn = ctx.input.roadNotices;
  if (rn && rn.status === "error") stale.push(`${rn.district} road notices`);
  ctx.add({
    ruleId: "IM",
    status: "note",
    reason: imageryNote,
  });
  if (stale.length) ctx.add({ ruleId: "FR", status: "unknown", reason: `Cannot confirm: ${[...new Set(stale)].join(", ")} could not be read or ${stale.length > 1 ? "are" : "is"} stale.` });
  else ctx.add({ ruleId: "FR", status: "pass", reason: "Every source used is inside its freshness limit." });
}

// ---------------------------------------------------------------------------------------------

function buildAccess(ctx: Context): AccessSummary {
  const publicRoad = ctx
    .near("dra_roads", ACCESS_RADIUS_M, (q) => ["highway", "arterial", "collector", "local", "resource", "recreation", "ramp", "service"].includes(str(q.ROAD_CLASS).toLowerCase()))
    .at(0);
  const fsr = nearbyFsrs(ctx).at(0);
  const { notices } = matchNotices(ctx);
  const text = notices.map((n) => n.text.toLowerCase()).join(" ");
  let vehicle: AccessSummary["vehicle"] = "unknown";
  let vehicleReason = "No road data near this spot.";
  if (/\b4x4\b|4wd|four[- ]wheel/.test(text)) {
    vehicle = "4x4";
    vehicleReason = "A district notice says 4x4.";
  } else if (/cross[- ]?ditch|washout|washed out|rough|high clearance/.test(text) || str(publicRoad?.f.properties?.ROAD_SURFACE).toLowerCase() === "rough") {
    vehicle = "high clearance recommended";
    vehicleReason = notices.length ? "A notice mentions cross-ditches, washouts or rough road." : "The nearest mapped road is rough.";
  } else if (publicRoad || fsr) {
    vehicle = "2WD gravel";
    vehicleReason = "Estimate from road class: no rough-road notice found. Conditions change; drive to the road.";
  }
  const pq = publicRoad?.f.properties ?? {};
  const fq = fsr?.f.properties ?? {};
  return {
    nearestPublicRoad: publicRoad
      ? {
          name: str(pq.ROAD_NAME_FULL) || `Unnamed ${str(pq.ROAD_CLASS)} road`,
          roadClass: str(pq.ROAD_CLASS),
          surface: str(pq.ROAD_SURFACE) || undefined,
          distanceM: Math.round(publicRoad.d),
          bearingDeg: Math.round(publicRoad.b),
        }
      : undefined,
    nearestResourceRoad: fsr
      ? {
          name: fsrLabel(fq),
          fileSection: fileSection(fq),
          type: str(fq.FILE_TYPE_DESCRIPTION),
          holder: str(fq.CLIENT_NAME) || undefined,
          lifeCycle: str(fq.LIFE_CYCLE_STATUS_CODE) || undefined,
          distanceM: Math.round(fsr.d),
          bearingDeg: Math.round(fsr.b),
        }
      : undefined,
    notices,
    vehicle,
    vehicleReason,
    noticesPageUrl: ctx.input.roadNotices?.pageUrl,
    noticesFetchedAt: ctx.input.roadNotices?.fetchedAt,
  };
}

function lightState(checks: CheckResult[]): VerdictState {
  if (checks.some((c) => c.status === "fail")) return "red";
  if (checks.some((c) => c.status === "conditional")) return "amber";
  if (checks.some((c) => c.status === "unknown")) return "grey";
  return "green";
}

const CONDITION_RULES = /^(W9|W10|W11|W12|W6|P1|L\d)/;

export function evaluate(input: EvaluationInput): SpotReport {
  const ctx = new Context(input);

  checkInBC(ctx);
  checkFederal(ctx);
  checkWildlife(ctx);
  checkProvincial(ctx);
  checkLocal(ctx);
  checkIndigenous(ctx);
  checkOwnership(ctx);
  checkSafety(ctx);
  checkFallZone(ctx);

  // Imagery (never changes the verdict).
  const img = input.imagery;
  const imageryNotes: string[] = [];
  let loggedSinceImage = false;
  if (img?.captureDate) {
    const capYear = Number(img.captureDate.slice(0, 4));
    const block = ctx.at_("cutblocks")[0];
    const harvest = Number(block?.properties?.HARVEST_START_YEAR_CALENDAR);
    if (harvest && harvest > capYear) {
      loggedSinceImage = true;
      imageryNotes.push(`Logged since this image: the cutblock here was harvested in ${harvest}.`);
    }
  } else {
    imageryNotes.push("Imagery date unknown. Do not rely on the picture for what is on the ground today.");
  }
  const imageryText = img?.captureDate
    ? `Imagery: ${new Date(img.captureDate + "T12:00:00Z").toLocaleDateString("en-CA", { month: "short", year: "numeric", timeZone: "UTC" })}${img.source ? `, ${img.source}` : ""}${img.resolutionM ? `, ${img.resolutionM} m` : ""}.`
    : "Imagery date unknown.";
  checkFreshness(ctx, [imageryText, ...imageryNotes].join(" "));

  // Fall-zone compass.
  const bins = new Array<boolean>(360).fill(false);
  for (const g of ctx.hazards) markBlockedBearings(g, input.point, ctx.radius, bins);
  const sectors = safeSectors(bins);
  const safe = sectors.filter((s) => s.safe);
  const anyBlocked = bins.some(Boolean);
  const best = anyBlocked && safe.length ? safe.reduce((a, b) => (b.clearance > a.clearance ? b : a)) : null;
  const decl = input.declinationDeg ?? null;

  // Order checks by catalogue order.
  const order = new Map(Object.keys(RULES_BY_ID).map((id, i) => [id, i]));
  const orderOf = (id: string) => order.get(id) ?? order.get(id.split(/[–-]/)[0]!) ?? 999;
  const checks = [...ctx.checks].sort((a, b) => orderOf(a.ruleId) - orderOf(b.ruleId));

  const lights: Light[] = LIGHTS.map((l) => {
    const own = checks.filter((c) => c.light === l.id);
    let state = lightState(own);
    if (l.id === "imagery") state = img?.captureDate ? "green" : "grey";
    const partlyUnknown = (state === "red" || state === "amber") && own.some((c) => c.status === "unknown");
    return { id: l.id, label: l.label, state, ruleIds: own.map((c) => c.ruleId), informational: l.informational, partlyUnknown };
  });
  const lightCounts: Record<VerdictState, number> = { red: 0, amber: 0, grey: 0, green: 0 };
  for (const l of lights) lightCounts[l.state]++;

  // Verdict (PRD 3.9). Imagery is never part of it.
  const counted = checks.filter((c) => c.ruleId !== "IM");
  const sevIndex = (c: CheckResult) => {
    const def = RULES_BY_ID[c.ruleId] ?? RULES_BY_ID[c.ruleId.split(/[–-]/)[0]!];
    return SEVERITY_ORDER.indexOf(def?.severity ?? "system");
  };
  const fails = counted.filter((c) => c.status === "fail").sort((a, b) => sevIndex(a) - sevIndex(b));
  // F2 restates S1/S2 in legal terms; the banner quotes the specific hazard instead.
  const conds = counted
    .filter((c) => c.status === "conditional")
    .sort((a, b) => Number(a.ruleId === "F2") - Number(b.ruleId === "F2") || sevIndex(a) - sevIndex(b));
  const unknowns = counted.filter((c) => c.status === "unknown");
  const dateText = new Date(input.at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Vancouver" });
  const alsoUnknown = [...new Set(unknowns.map((c) => LIGHTS.find((l) => l.id === c.light)?.label ?? c.ruleId))];
  let verdict: SpotReport["verdict"];
  if (fails.length) verdict = { state: "red", headline: "Not allowed here", reason: fails[0]!.reason, alsoUnknown };
  else if (conds.length) {
    const cond = conds.find((c) => CONDITION_RULES.test(c.ruleId));
    verdict = cond
      ? { state: "amber", headline: "Only if…", reason: cond.reason, alsoUnknown }
      : { state: "amber", headline: "Clear here, but…", reason: conds[0]!.reason, alsoUnknown };
  } else if (unknowns.length) verdict = { state: "grey", headline: "Cannot confirm", reason: unknowns[0]!.reason, alsoUnknown: alsoUnknown.slice(1) };
  else
    verdict = {
      state: "green",
      headline: "No restriction found",
      reason: `No restriction found in the checks below, as of ${dateText}. Check the standing list before you shoot.`,
      alsoUnknown: [],
    };

  const sources = [...ctx.usedSources]
    .filter((id) => input.sources[id])
    .map((id) => {
      const s = input.sources[id]!;
      const layer = Object.values(input.layers).find((l) => l?.sourceId === id);
      const fetchedAt = layer?.fetchedAt ?? (id === "road_notices" ? input.roadNotices?.fetchedAt : undefined);
      const status = layer?.status ?? (id === "road_notices" ? input.roadNotices?.status ?? "missing" : "register");
      return { id, name: s.name, fetchedAt, status, fresh: layer ? ctx.isFresh(layer) : status === "ok", url: s.url };
    });

  return {
    release: input.release,
    generatedAt: new Date().toISOString(),
    checkDate: input.at.toISOString(),
    point: input.point,
    profile: input.profile,
    inBC: input.inBC,
    verdict,
    lights,
    lightCounts,
    checks,
    fallZone: {
      radiusM: ctx.radius,
      findings: [...ctx.hazardHits].sort((a, b) => a.distanceM - b.distanceM).slice(0, 40),
      sectors: sectors.map(({ centreDeg, safe }) => ({ centreDeg, safe })),
      bestBearingDeg: best ? best.centreDeg : null,
      bestBearingMagneticDeg: best && decl !== null ? Math.round(norm360(best.centreDeg - decl)) : null,
      declinationDeg: decl !== null ? Math.round(decl * 10) / 10 : null,
      incomplete: ctx.failedHazardLayers.size > 0,
    },
    access: buildAccess(ctx),
    imagery: { ...(img ?? { provider: "none" }), loggedSinceImage, notes: imageryNotes },
    standingChecks: STANDING_CHECKS,
    sources,
    disclaimer: DISCLAIMER,
  };
}
