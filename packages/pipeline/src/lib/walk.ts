import * as turf from "@turf/turf";
import type { Feature, LineString, MultiPolygon, Polygon, Position } from "geojson";
import { components, lookupArea, lookupLots, lookupRoad, parseLots, wfsQuery, type AnyFeature } from "./gazetteer.js";
import { isForestRoad } from "./roadlist.js";

/**
 * Approximate outlines for metes-and-bounds sections ("commencing at …; thence along …"). Code finds each
 * feature the walk follows in the official layers, places each corner where one followed feature meets the
 * next, then traces between corners along the feature (or straight, where the text says so or the feature is
 * not found). The result is always marked approximate: the engine shows it as "possibly inside", never as a
 * boundary, and a person can replace it with an exact outline.
 */
export interface WalkStep {
  start?: string | null;
  direction?: string | null;
  follow?: string | null;
  feature?: string | null;
  side_or_bank?: string | null;
  until?: string | null;
  distance?: string | null;
  quote?: string;
}

export interface WalkResult {
  geometry: Polygon | MultiPolygon | null;
  /** How exact the outline is: "traced" (every corner placed), "corners" (some sides straight), "vicinity" (a marked zone). */
  quality: "traced" | "corners" | "vicinity" | null;
  notes: string[];
  layers: string[];
}

type Line = Feature<LineString>;
interface Resolved {
  lines: Line[];
  layer: string;
}

const PAD_M = 100;
const VICINITY_M = 1000;
const NEAR_M = 400;
const esc = (s: string) => s.replace(/'/g, "''");

/** "Cheam No. 1 Indian Reserve" -> "CHEAM 1", as the Canada Lands reserve layer names it. */
export function reserveName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\b(INDIAN RESERVE|I\.R\.|RESERVE)\b/g, " ")
    .replace(/\b(NO\.?|NUMBER|#)\s*/g, " ")
    .replace(/[^A-Z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ I$/, " 1");
}

/** "District of Chilliwack", "Town of Hope" -> "Chilliwack", "Hope" (the layer may call it a City or District). */
export function placeCore(name: string): string {
  return name
    .replace(/^(the )?(corporation of the )?(city|district|town|village|township|resort municipality|municipality|district municipality) of (the )?/i, "")
    .replace(/[^A-Za-z' -]+/g, " ")
    .trim();
}

function toLines(fs: AnyFeature[]): Line[] {
  const out: Line[] = [];
  for (const f of fs) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "LineString") out.push(turf.lineString(g.coordinates));
    else if (g.type === "MultiLineString") for (const c of g.coordinates) out.push(turf.lineString(c));
    else if (g.type === "Polygon" || g.type === "MultiPolygon") {
      const l = turf.polygonToLine(f as Feature<Polygon | MultiPolygon>);
      const fc = l.type === "FeatureCollection" ? l.features : [l];
      for (const x of fc) {
        if (x.geometry.type === "LineString") out.push(x as Line);
        else for (const c of (x.geometry as { coordinates: Position[][] }).coordinates) out.push(turf.lineString(c));
      }
    }
  }
  return out.filter((l) => l.geometry.coordinates.length > 1);
}

const box = (b: number[] | null) => (b ? ` AND BBOX(GEOMETRY,${b[0]},${b[1]},${b[2]},${b[3]},'EPSG:4326')` : "");
const boxShape = (b: number[] | null) => (b ? ` AND BBOX(SHAPE,${b[0]},${b[1]},${b[2]},${b[3]},'EPSG:4326')` : "");

/** One followed feature in the official layers, limited to the search box. */
export async function resolveStep(step: WalkStep, area: Feature<Polygon | MultiPolygon> | null, bbox: number[] | null): Promise<Resolved | null> {
  const name = (step.feature ?? "").trim();
  const follow = (step.follow ?? "").toLowerCase();
  if (!name || follow === "straight_line") return null;
  try {
    // District lots ("Lot 1855", "L. 3569s", "Lots 314, 549 and 550") from the Crown survey parcels.
    const lots = follow === "lot_line" || /^(district )?lots?\s+\d|^(D\.?)?L\.?\s?\d/i.test(name) ? parseLots(name) : null;
    if (follow === "lot_line" || lots) {
      if (!lots) return null;
      const l = await lookupLots(lots, bbox);
      return l.status === "ok" ? { lines: toLines(l.features), layer: l.layer } : null;
    }
    if (follow === "road" || /\b(road|highway|hwy|fsr)\b/i.test(name)) {
      if (/private|unnamed|logging company/i.test(name)) return null;
      const hwy = name.match(/^(?:highway|hwy)\.?\s*(?:no\.?\s*)?(\d+[a-z]?)$/i) ?? name.match(/^(?:no\.?\s*)?(\d+[a-z]?)\s+highway$/i);
      const road = await lookupRoad(hwy ? `Highway ${hwy[1]}` : name, isForestRoad(name) ? "FTEN" : "DRA", area);
      return road.features.length ? { lines: toLines(road.features), layer: road.layer } : null;
    }
    if (follow === "reserve_boundary" || /\breserve\b|\bI\.R\./i.test(name)) {
      if (/military|national defence|DND/i.test(name)) return null;
      const n = reserveName(name);
      const fs = await wfsQuery("WHSE_ADMIN_BOUNDARIES.CLAB_INDIAN_RESERVES", `ENGLISH_NAME ILIKE '${esc(n)}${/\d/.test(n) ? "" : " %"}'${box(bbox)}`, 50);
      return fs.length ? { lines: toLines(fs), layer: "WHSE_ADMIN_BOUNDARIES.CLAB_INDIAN_RESERVES" } : null;
    }
    if (follow === "district_boundary" || /\b(city|district|town|village|township|municipality) of\b/i.test(name)) {
      const core = placeCore(name);
      const fs = await wfsQuery("WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP", `ADMIN_AREA_NAME ILIKE '%${esc(core)}'${boxShape(bbox)}`, 10);
      return fs.length === 1 ? { lines: toLines(fs), layer: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP" } : null;
    }
    if (follow === "contour" || /contour/i.test(name)) {
      const m = name.match(/(\d[\d ,]*)\s*(m|metre|meter|foot|feet|ft)\b/i);
      if (!m || !bbox) return null;
      let elev = Number(m[1]!.replace(/[ ,]/g, ""));
      if (/f/i.test(m[2]!)) elev *= 0.3048;
      const nearest = Math.round(elev / 20) * 20;
      const fs = await wfsQuery("WHSE_BASEMAPPING.TRIM_CONTOUR_LINES", `ELEVATION=${nearest}${box(bbox)}`, 5000);
      return fs.length ? { lines: toLines(fs), layer: `WHSE_BASEMAPPING.TRIM_CONTOUR_LINES (${nearest} m)` } : null;
    }
    if (follow === "river" || follow === "creek" || /\b(river|creek|slough|brook|channel)\b/i.test(name)) {
      if (follow === "river" || /\briver\b/i.test(name)) {
        const fs = await wfsQuery("WHSE_BASEMAPPING.FWA_RIVERS_POLY", `GNIS_NAME_1='${esc(name)}'${box(bbox)}`, 200);
        if (fs.length) return { lines: toLines(fs), layer: "WHSE_BASEMAPPING.FWA_RIVERS_POLY" };
      }
      const fs = await wfsQuery("WHSE_BASEMAPPING.FWA_STREAM_NETWORKS_SP", `GNIS_NAME='${esc(name)}'${box(bbox)}`, 2000);
      return fs.length ? { lines: toLines(fs), layer: "WHSE_BASEMAPPING.FWA_STREAM_NETWORKS_SP" } : null;
    }
    if (/\bpark\b|protected area|conservancy|recreation area/i.test(name)) {
      const fs = await wfsQuery("WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW", `PROTECTED_LANDS_NAME ILIKE '${esc(name.replace(/^the /i, "").replace(/\bprovincial\b\s*/i, ""))}'${boxShape(bbox)}`, 20);
      return fs.length ? { lines: toLines(fs), layer: "WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW" } : null;
    }
    if (/\blake\b/i.test(name)) {
      const fs = await wfsQuery("WHSE_BASEMAPPING.FWA_LAKES_POLY", `GNIS_NAME_1='${esc(name.replace(/^the /i, ""))}'${box(bbox)}`, 50);
      return fs.length ? { lines: toLines(fs), layer: "WHSE_BASEMAPPING.FWA_LAKES_POLY" } : null;
    }
  } catch {
    return null;
  }
  return null;
}

/** A walk that runs past its time budget is left to a person rather than holding up the build. */
class WalkTimeout extends Error {}
let deadline = Infinity;
const tick = () => {
  if (Date.now() > deadline) throw new WalkTimeout();
};
const WALK_BUDGET_MS = 45_000;
const NEAR_DEG = (NEAR_M / 111_000) * 2;
const boxes = new WeakMap<Line, number[]>();
const bb = (l: Line) => boxes.get(l) ?? (boxes.set(l, turf.bbox(l)), boxes.get(l)!);
const boxesNear = (p: number[], q: number[], m: number) => !(p[2]! + m < q[0]! || q[2]! + m < p[0]! || p[3]! + m < q[1]! || q[3]! + m < p[1]!);

/** The feature a landmark phrase names: "its intersection with the westerly boundary of the Popkum No. I Indian Reserve" -> "Popkum No. I Indian Reserve". */
export function landmarkName(text: string): string | null {
  let t = text.trim().replace(/[.;,]$/, "");
  t = t.replace(/^(its |the )?(point of )?(intersection|junction|crossing) (with|of) /i, "");
  t = t.replace(/^(the )?(most )?((north|south|east|west)(erly|ern)?(most)? )?(natural )?(boundary|shore|bank|corner|end|edge|limit) of /i, "");
  t = t.replace(/^the /i, "").trim();
  if (!t || t.length > 80 || /^(a |an |its |the )?(point|line|mouth|terminus|corner|place)\b/i.test(t)) return null;
  return t;
}

/** Where two followed features meet: their crossings, or their closest approach when they only come near. */
function meetings(a: Line[], b: Line[]): Position[] {
  const pts: Position[] = [];
  // Only pieces whose boxes overlap can cross; only boxes within NEAR_M can come near.
  for (const x of a) {
    tick();
    for (const y of b) {
      if (!boxesNear(bb(x), bb(y), 0)) continue;
      for (const p of turf.lineIntersect(x, y).features) pts.push(p.geometry.coordinates);
    }
    if (pts.length > 400) break;
  }
  if (!pts.length) {
    let best: { p: Position; d: number } | null = null;
    for (const x of a) {
      tick();
      const near = b.filter((y) => boxesNear(bb(x), bb(y), NEAR_DEG));
      if (!near.length) continue;
      for (const c of x.geometry.coordinates.filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 40)) === 0))
        for (const y of near) {
          const n = turf.nearestPointOnLine(y, c, { units: "meters" });
          const d = n.properties.dist ?? Infinity;
          if (!best || d < best.d) best = { p: n.geometry.coordinates, d };
        }
    }
    if (best && best.d <= NEAR_M) pts.push(best.p);
  }
  // Merge points within 30 m of each other.
  const out: Position[] = [];
  for (const p of pts) if (!out.some((q) => turf.distance(p, q, { units: "meters" }) < 30)) out.push(p);
  return out.slice(0, 40);
}

/** The corners chosen so the walk stays as compact as possible (fewest metres between consecutive corners). */
function chooseCorners(cands: (Position[] | null)[]): (Position | null)[] {
  const idx = cands.map((c, i) => (c && c.length ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return cands.map(() => null);
  type Cell = { cost: number; prev: number };
  const table: Cell[][] = [];
  idx.forEach((ci, k) => {
    const cur = cands[ci]!;
    table.push(
      cur.map((p) => {
        if (k === 0) return { cost: 0, prev: -1 };
        const prevPts = cands[idx[k - 1]!]!;
        let best = { cost: Infinity, prev: -1 };
        prevPts.forEach((q, j) => {
          const c = table[k - 1]![j]!.cost + turf.distance(q, p, { units: "meters" });
          if (c < best.cost) best = { cost: c, prev: j };
        });
        return best;
      }),
    );
  });
  const out: (Position | null)[] = cands.map(() => null);
  let j = table[table.length - 1]!.reduce((b, c, i, arr) => (c.cost < arr[b]!.cost ? i : b), 0);
  for (let k = idx.length - 1; k >= 0; k--) {
    out[idx[k]!] = cands[idx[k]!]![j]!;
    j = table[k]![j]!.prev;
  }
  return out;
}

/** The stretch of a followed feature between two corners (the shorter way round a boundary). */
function along(r: Resolved, from: Position, to: Position): Position[] | null {
  let best: { line: Line; d: number } | null = null;
  for (const comp of components(r.lines.filter((l) => boxesNear(bb(l), turf.bbox(turf.lineString([from, to])), NEAR_DEG)) as unknown as AnyFeature[])) {
    tick();
    const merged = mergeLines(comp as unknown as Line[]);
    for (const line of merged) {
      const d1 = turf.nearestPointOnLine(line, from, { units: "meters" }).properties.dist ?? Infinity;
      const d2 = turf.nearestPointOnLine(line, to, { units: "meters" }).properties.dist ?? Infinity;
      if (d1 < 60 && d2 < 60 && (!best || d1 + d2 < best.d)) best = { line, d: d1 + d2 };
    }
  }
  if (!best) return null;
  const coords = best.line.geometry.coordinates;
  const closed = turf.distance(coords[0]!, coords[coords.length - 1]!, { units: "meters" }) < 5;
  const slice = turf.lineSlice(from, to, best.line).geometry.coordinates;
  if (!closed) return slice;
  // Round a closed boundary both ways and keep the shorter.
  const len = turf.length(best.line, { units: "meters" });
  const sLen = turf.length(turf.lineString(slice), { units: "meters" });
  if (sLen <= len / 2) return slice;
  const rest = [...turf.lineSlice(to, coords[0]!, best.line).geometry.coordinates, ...turf.lineSlice(coords[0]!, from, best.line).geometry.coordinates];
  return rest.reverse();
}

/** Joins line pieces that touch end to end into longer lines. */
function mergeLines(lines: Line[]): Line[] {
  const pool = lines.map((l) => [...l.geometry.coordinates]);
  const out: Position[][] = [];
  const near = (a: Position, b: Position) => turf.distance(a, b, { units: "meters" }) < 2;
  while (pool.length) {
    tick();
    let cur = pool.shift()!;
    let grew = true;
    while (grew) {
      grew = false;
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i]!;
        if (near(cur[cur.length - 1]!, p[0]!)) cur = [...cur, ...p.slice(1)];
        else if (near(cur[cur.length - 1]!, p[p.length - 1]!)) cur = [...cur, ...[...p].reverse().slice(1)];
        else if (near(cur[0]!, p[p.length - 1]!)) cur = [...p, ...cur.slice(1)];
        else if (near(cur[0]!, p[0]!)) cur = [...[...p].reverse(), ...cur.slice(1)];
        else continue;
        pool.splice(i, 1);
        grew = true;
        break;
      }
    }
    out.push(cur);
  }
  return out.map((c) => turf.lineString(c));
}

/** Splits a walk into its parts: each "Commencing at …" starts a new outline. */
function parts(steps: WalkStep[]): WalkStep[][] {
  const out: WalkStep[][] = [];
  for (const s of steps) {
    if (s.start || !out.length) out.push([]);
    out[out.length - 1]!.push(s);
  }
  return out.filter((p) => p.length);
}

async function walkPart(steps: WalkStep[], area: Feature<Polygon | MultiPolygon> | null, layers: Set<string>, notes: string[]): Promise<{ shape: Feature<Polygon | MultiPolygon> | null; quality: WalkResult["quality"]; corners: Position[] }> {
  const legs = steps.filter((s) => !s.start || s.follow || s.feature);
  const searchBox = area ? turf.bbox(area) : null;
  const resolved: (Resolved | null)[] = [];
  for (const s of legs) resolved.push(s.follow === "contour" ? null : await resolveStep(s, area, searchBox));
  // Contours are fetched inside the box the other features span, widened by 5 km.
  const found = resolved.filter((r): r is Resolved => !!r);
  let contourBox: number[] | null = searchBox;
  if (found.length) {
    const b = turf.bbox(turf.featureCollection(found.flatMap((r) => r.lines)));
    contourBox = turf.bbox(turf.buffer(turf.bboxPolygon(b as [number, number, number, number]), 5, { units: "kilometers" })!);
    for (let i = 0; i < legs.length; i++) if (legs[i]!.follow === "contour") resolved[i] = await resolveStep(legs[i]!, area, contourBox);
  }
  resolved.forEach((r, i) => {
    if (r) layers.add(r.layer);
    else if (legs[i]!.feature && legs[i]!.follow !== "straight_line") notes.push(`"${legs[i]!.feature}" was not found in the official layers; that side is drawn straight`);
  });
  // A landmark the text names ("to its intersection with Othello Road"), found like any followed feature.
  const landmark = async (text: string | null | undefined): Promise<Resolved | null> => {
    const name = landmarkName(text ?? "");
    if (!name) return null;
    const r = await resolveStep({ feature: name, follow: null }, area, /contour/i.test(name) ? contourBox : searchBox);
    if (r) layers.add(r.layer);
    return r;
  };
  // Corner k is where leg k ends and leg k+1 begins; the last corner closes the walk back to the first leg.
  const cands: (Position[] | null)[] = [];
  for (let k = 0; k < legs.length; k++) {
    const a = resolved[k];
    const b = resolved[(k + 1) % legs.length];
    let c = a && b ? meetings(a.lines, b.lines) : null;
    if (!c?.length) {
      const end = await landmark(legs[k]!.until);
      if (end) c = a ? meetings(a.lines, end.lines) : b ? meetings(end.lines, b.lines) : null;
    }
    cands.push(c?.length ? c : null);
  }
  // The point of commencement ("the intersection of A and B") closes the walk.
  const pair = steps.find((s) => s.start)?.start?.match(/intersection of (?:the )?(.+) and (?:the )?(.+)$/i);
  if (pair && !cands[legs.length - 1]) {
    const x = await landmark(pair[1]);
    const y = x ? await landmark(pair[2]) : null;
    const c = x && y ? meetings(x.lines, y.lines) : null;
    if (c?.length) cands[legs.length - 1] = c;
  }
  const corners = chooseCorners(cands);
  const known = corners.filter((c): c is Position => !!c);
  if (known.length < 3) {
    // Too few corners for an outline: the followed features close to the corners that were placed.
    if (!known.length) return { shape: null, quality: null, corners: known };
    const pts = [...known];
    for (const r of resolved)
      for (const l of r?.lines ?? [])
        for (const p of l.geometry.coordinates.filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 300)) === 0))
          if (known.some((q) => turf.distance(p, q, { units: "meters" }) <= 1500)) pts.push(p);
    const hull = pts.length >= 3 ? turf.convex(turf.featureCollection(pts.map((p) => turf.point(p)))) : null;
    return { shape: hull, quality: hull ? "vicinity" : null, corners: known };
  }
  const ring: Position[] = [];
  for (let k = 0; k < legs.length; k++) {
    const start = corners[(k - 1 + legs.length) % legs.length];
    const end = corners[k];
    if (!end) continue;
    const r = resolved[k];
    const path = r && start ? along(r, start, end) : null;
    if (path && path.length > 1) ring.push(...path);
    else ring.push(end);
  }
  if (ring.length < 3) return { shape: null, quality: null, corners: known };
  ring.push(ring[0]!);
  let poly: Feature<Polygon | MultiPolygon> = turf.polygon([ring]);
  if (turf.kinks(poly as Feature<Polygon>).features.length) poly = turf.convex(turf.featureCollection(ring.map((p) => turf.point(p))))!;
  const all = known.length === legs.length && resolved.every((r, i) => r || legs[i]!.follow === "straight_line");
  return { shape: poly, quality: all ? "traced" : "corners", corners: known };
}

export async function walkOutline(steps: WalkStep[], area: Feature<Polygon | MultiPolygon> | null, vicinity: Position | null): Promise<WalkResult> {
  deadline = Date.now() + WALK_BUDGET_MS;
  try {
    return await walkWithin(steps, area, vicinity);
  } catch (e) {
    if (!(e instanceof WalkTimeout)) throw e;
    return { geometry: null, quality: null, notes: ["the walk was too complex to trace within the time allowed; a person draws it"], layers: [] };
  } finally {
    deadline = Infinity;
  }
}

async function walkWithin(steps: WalkStep[], area: Feature<Polygon | MultiPolygon> | null, vicinity: Position | null): Promise<WalkResult> {
  const notes: string[] = [];
  const layers = new Set<string>();
  const shapes: Feature<Polygon | MultiPolygon>[] = [];
  let quality: WalkResult["quality"] = null;
  const loose: Position[] = [];
  for (const p of parts(steps)) {
    const r = await walkPart(p, area, layers, notes);
    if (r.shape) {
      shapes.push(r.shape);
      quality = quality === "corners" || r.quality === "corners" ? "corners" : "traced";
    } else loose.push(...r.corners);
  }
  let shape: Feature<Polygon | MultiPolygon> | null = shapes.length > 1 ? turf.union(turf.featureCollection(shapes)) : (shapes[0] ?? null);
  if (shape) shape = turf.buffer(shape, PAD_M, { units: "meters" }) as Feature<Polygon | MultiPolygon>;
  else if (loose.length >= 2) {
    // Too few corners for an outline: a zone around the corners that were placed.
    shape = turf.buffer(turf.convex(turf.featureCollection(loose.map((p) => turf.point(p)))) ?? turf.lineString(loose), 500, { units: "meters" }) as Feature<Polygon | MultiPolygon>;
    quality = "vicinity";
    notes.push(`only ${loose.length} corners could be placed: a zone around them is marked, not the outline`);
  } else if (loose.length === 1 || vicinity) {
    shape = turf.circle(loose[0] ?? vicinity!, VICINITY_M, { units: "meters", steps: 32 });
    quality = "vicinity";
    notes.push(`the outline could not be placed: a ${VICINITY_M / 1000} km zone around ${loose.length ? "the one corner found" : "the place the section names"} is marked`);
  }
  if (shape && area) shape = turf.intersect(turf.featureCollection([shape, area]));
  return { geometry: (shape?.geometry as Polygon | MultiPolygon | undefined) ?? null, quality: shape ? quality : null, notes, layers: [...layers] };
}

/** The place a section says it is near ("in the vicinity of Popkum"), from BC Geographical Names. */
export async function vicinityPoint(text: string, area: Feature<Polygon | MultiPolygon> | null): Promise<Position | null> {
  const m = text.match(/in the vicinity of (?:the )?((?:[A-Z][\w'.-]*\s?){1,5})/);
  if (!m) return null;
  const name = placeCore(m[1]!.replace(/,.*$/, "").trim());
  try {
    const b = area ? turf.bbox(area) : null;
    const fs = await wfsQuery("WHSE_BASEMAPPING.GNS_GEOGRAPHICAL_NAMES_SP", `GEOGRAPHICAL_NAME ILIKE '${esc(name)}'${box(b)}`, 20);
    const pts = fs.filter((f) => f.geometry?.type === "Point").map((f) => (f.geometry as { coordinates: Position }).coordinates);
    return pts.length === 1 ? pts[0]! : null;
  } catch {
    return null;
  }
}

/** What a section names about where it is, for a zone when nothing better could be drawn. */
export interface Places {
  /** The section heading, split into places ("Lafarge to Pritchard" -> Lafarge, Pritchard). */
  heading: string[];
  /** Features, roads and landmarks the text names. */
  names: string[];
  /** Named areas with a type (lake, island, park, reserve, lot) that have their own outline in the official layers. */
  areas: { type: string; name: string }[];
  bufferM: number | null;
}

const GENERIC_TAIL = /\s+(operations|camp|resort|ferry terminal|terminals?|wildlife management area|wildlife reserve|nature conservancy( area)?|recreation area|seed orchard|sewage lagoons|environmental demonstration areas?|dykes?|watersheds?|access road|forest service road|fsr|road|highway|trail corridor|corridor|park)$/i;
const CLUSTER_KM = 15;
const ZONE_MAX_KM2 = 500;

/** Name forms to try in BC Geographical Names: as written, without a leading "the", without a generic tail ("Line Creek Operations" -> "Line Creek"). */
export function placeForms(name: string): string[] {
  const n = name.replace(/^the /i, "").replace(/[.,;]+$/, "").trim();
  const forms = new Set([n]);
  let cut = n;
  while (GENERIC_TAIL.test(cut)) forms.add((cut = cut.replace(GENERIC_TAIL, "").trim()));
  return [...forms].filter((f) => f.length >= 3 && /[a-z]/i.test(f));
}

/** "Lafarge to Pritchard", "Delta/Surrey Dykes", "Mt. Bergeron — Tumbler Ridge" -> the places in a heading. */
export function headingPlaces(heading: string): string[] {
  return heading
    .split(/\s+(?:to|and)\s+|\s*[\/—–]\s*|\s+-\s+/)
    .map((h) => h.replace(/^Mt\.?\s/i, "Mount ").trim())
    .filter((h) => h && !/^(closed areas regulation|schedule|section|the province|provincial parks|highways)\b/i.test(h));
}

/**
 * A zone around the places a section names, from the official layers, when no outline could be drawn: named
 * areas (lakes, islands, parks, reserves, lots) by their own outlines, other places by their BC Geographical
 * Names point, kept to the cluster around the heading's place. Always approximate ("vicinity").
 */
export async function placesZone(p: Places, area: Feature<Polygon | MultiPolygon> | null): Promise<WalkResult> {
  const notes: string[] = [];
  const layers = new Set<string>();
  const b = area ? turf.bbox(area) : null;
  type Cand = { name: string; heading: boolean; at: Position; shape: Feature<Polygon | MultiPolygon> | null; alone: boolean };
  const cands: Cand[] = [];
  for (const a of p.areas) {
    const l = a.type === "lot" ? (parseLots(a.name) ? await lookupLots(parseLots(a.name)!, b) : null) : ["lake", "island", "park", "reserve"].includes(a.type) ? await lookupArea(a.type, a.name) : null;
    if (!l || (l.status !== "ok" && l.status !== "ambiguous")) continue;
    for (const f of l.features) {
      if (!f.geometry || !/Polygon/.test(f.geometry.type)) continue;
      const shape = f as Feature<Polygon | MultiPolygon>;
      if (area && !turf.booleanIntersects(shape, area)) continue;
      cands.push({ name: a.name, heading: false, at: turf.centroid(shape).geometry.coordinates, shape, alone: false });
      layers.add(l.layer);
    }
  }
  const seen = new Set<string>();
  for (const [name, heading] of [...p.heading.map((h) => [h, true] as const), ...p.names.map((n) => [n, false] as const)]) {
    for (const form of placeForms(name)) {
      if (seen.has(form.toLowerCase())) break;
      seen.add(form.toLowerCase());
      let fs: AnyFeature[] = [];
      try {
        fs = (await wfsQuery("WHSE_BASEMAPPING.GNS_GEOGRAPHICAL_NAMES_SP", `GEOGRAPHICAL_NAME ILIKE '${esc(form)}'${box(b)}`, 20)).filter((f) => f.geometry?.type === "Point");
      } catch {
        fs = [];
      }
      if (!fs.length) continue;
      for (const f of fs) cands.push({ name: form, heading, at: (f.geometry as { coordinates: Position }).coordinates, shape: null, alone: fs.length > 1 && !area });
      layers.add("WHSE_BASEMAPPING.GNS_GEOGRAPHICAL_NAMES_SP");
      break;
    }
  }
  if (!cands.length) return { geometry: null, quality: null, notes: ["none of the places the section names was found in the official layers"], layers: [] };
  // The cluster with the most named places near it (heading places first) is where the section is.
  const near = (a: Cand, c: Cand) => turf.distance(a.at, c.at, { units: "kilometers" }) <= CLUSTER_KM;
  const score = (c: Cand) => new Set(cands.filter((o) => near(c, o)).map((o) => o.name)).size * 2 + (c.heading ? 1 : 0);
  const anchor = cands.reduce((best, c) => (score(c) > score(best) ? c : best));
  const kept = cands.filter((c) => near(anchor, c));
  const names = [...new Set(kept.map((c) => c.name))];
  // A lone same-named place picked from several across the province pins nothing down.
  if (names.length === 1 && kept.every((c) => c.alone)) return { geometry: null, quality: null, notes: [`"${names[0]}" names more than one place and nothing narrows it`], layers: [] };
  const pad = Math.max(p.bufferM ?? 0, VICINITY_M);
  const parts: Feature<Polygon | MultiPolygon>[] = kept.filter((c) => c.shape).map((c) => (p.bufferM ? (turf.buffer(c.shape!, p.bufferM, { units: "meters" }) as Feature<Polygon | MultiPolygon>) : c.shape!));
  const pts = kept.filter((c) => !c.shape).map((c) => c.at);
  if (pts.length) {
    const hull = pts.length >= 3 ? turf.convex(turf.featureCollection(pts.map((q) => turf.point(q)))) : null;
    parts.push(turf.buffer(hull ?? (pts.length === 2 ? turf.lineString(pts) : turf.point(pts[0]!)), pad, { units: "meters", steps: 16 }) as Feature<Polygon | MultiPolygon>);
  }
  let shape: Feature<Polygon | MultiPolygon> | null = parts.length > 1 ? turf.union(turf.featureCollection(parts)) : parts[0]!;
  if (shape && area) shape = turf.intersect(turf.featureCollection([shape, area]));
  if (!shape) return { geometry: null, quality: null, notes: ["the places found lie outside the area the section names"], layers: [] };
  const km2 = turf.area(shape) / 1e6;
  if (km2 > ZONE_MAX_KM2) return { geometry: null, quality: null, notes: [`a zone around ${names.join(", ")} would cover ${Math.round(km2)} km2, too wide to mark`], layers: [] };
  const outlined = [...new Set(kept.filter((c) => c.shape).map((c) => c.name))];
  const how = [outlined.length ? `the outline of ${outlined.join(", ")}${p.bufferM ? ` plus ${p.bufferM} m` : ""}` : "", pts.length ? `${pad / 1000} km around the named points` : ""].filter(Boolean).join(" and ");
  notes.push(`a zone around the places the section names (${names.join(", ")}): ${how}; not the boundary`);
  return { geometry: shape.geometry, quality: "vicinity", notes, layers: [...layers] };
}
