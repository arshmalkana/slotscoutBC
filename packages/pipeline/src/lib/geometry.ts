import * as turf from "@turf/turf";
import type { Feature, LineString, MultiPolygon, Polygon, Position } from "geojson";
import { config } from "./config.js";
import { components, type AnyFeature } from "./gazetteer.js";

/**
 * Geometry builder (Addendum A 4.4): deterministic code builds each shape from the lookups.
 * Every construction step keeps the quote that produced it, so a reviewer can trace each part of
 * the shape back to the words of the law. Shapes are drawn slightly larger than the law where the
 * edge is uncertain (conservative pad, main spec 1.5.2).
 */
export interface Construction {
  what: string;
  quote: string | null;
  source: string;
  ids?: string[];
  point?: Position;
}

export interface Built {
  geometry: Polygon | MultiPolygon | null;
  construction: Construction[];
  problems: string[];
  /** The centreline or path used, for the review map. */
  path?: LineString;
}

const lines = (f: AnyFeature): Position[][] =>
  f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [];

/** Points where `cross` meets `road`: true crossings plus T-junctions within 15 m. */
export function junctions(road: AnyFeature[], cross: AnyFeature[]): Position[] {
  const pts: Position[] = [];
  for (const r of road)
    for (const c of cross) {
      for (const p of turf.lineIntersect(r as Feature<LineString>, c as Feature<LineString>).features) pts.push(p.geometry.coordinates);
      for (const l of lines(c))
        for (const end of [l[0]!, l[l.length - 1]!]) {
          for (const rl of lines(r)) {
            const near = turf.nearestPointOnLine(turf.lineString(rl), end, { units: "meters" });
            if ((near.properties.dist ?? Infinity) <= 15) pts.push(near.geometry.coordinates);
          }
        }
    }
  // Merge points closer than 30 m.
  const out: Position[] = [];
  for (const p of pts) if (!out.some((q) => turf.distance(p, q, { units: "meters" }) < 30)) out.push(p);
  return out;
}

const key = (p: Position) => `${p[0]!.toFixed(7)},${p[1]!.toFixed(7)}`;

/** Shortest path along a road network between the vertices nearest two points (Dijkstra). */
export function pathBetween(segs: AnyFeature[], a: Position, b: Position): Position[] | null {
  const adj = new Map<string, { to: string; w: number }[]>();
  const coord = new Map<string, Position>();
  const link = (p: Position, q: Position) => {
    const kp = key(p);
    const kq = key(q);
    coord.set(kp, p);
    coord.set(kq, q);
    const w = turf.distance(p, q, { units: "meters" });
    adj.set(kp, [...(adj.get(kp) ?? []), { to: kq, w }]);
    adj.set(kq, [...(adj.get(kq) ?? []), { to: kp, w }]);
  };
  for (const f of segs) for (const l of lines(f)) for (let i = 0; i + 1 < l.length; i++) link(l[i]!, l[i + 1]!);
  // Join segment ends that touch within 2 m.
  const keys = [...coord.keys()];
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) {
      const d = turf.distance(coord.get(keys[i]!)!, coord.get(keys[j]!)!, { units: "meters" });
      if (d > 0 && d < 2) link(coord.get(keys[i]!)!, coord.get(keys[j]!)!);
    }
  // Insert each limit point into the segment it lies on, so the path starts and ends exactly there.
  const edges: [Position, Position][] = [];
  for (const f of segs) for (const l of lines(f)) for (let i = 0; i + 1 < l.length; i++) edges.push([l[i]!, l[i + 1]!]);
  const attach = (p: Position): [Position, Position] | null => {
    let best: { e: [Position, Position]; d: number } | null = null;
    for (const e of edges) {
      const d = turf.pointToLineDistance(p, turf.lineString(e), { units: "meters" });
      if (!best || d < best.d) best = { e, d };
    }
    if (best) {
      link(p, best.e[0]);
      link(p, best.e[1]);
    }
    return best?.e ?? null;
  };
  const ea = attach(a);
  const eb = attach(b);
  // Both limits on the same segment: the stretch between them is that part of the segment.
  if (ea && ea === eb) link(a, b);
  const s = key(a);
  const t = key(b);
  const dist = new Map<string, number>([[s, 0]]);
  const prev = new Map<string, string>();
  const done = new Set<string>();
  while (true) {
    let u: string | null = null;
    for (const [k, d] of dist) if (!done.has(k) && (u === null || d < dist.get(u)!)) u = k;
    if (u === null) return null;
    if (u === t) break;
    done.add(u);
    for (const e of adj.get(u) ?? []) {
      const nd = dist.get(u)! + e.w;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, u);
      }
    }
  }
  const path: Position[] = [];
  for (let k: string | undefined = t; k; k = prev.get(k)) path.unshift(coord.get(k)!);
  return path;
}

export function buildRoadBuffer(opts: {
  road: AnyFeature[];
  from: AnyFeature[] | null;
  to: AnyFeature[] | null;
  bufferM: number;
  quotes: Record<string, string | undefined>;
  roadLayer: string;
}): Built {
  const pad = config().validation.conservative_pad_m;
  const construction: Construction[] = [];
  const problems: string[] = [];
  const comps = components(opts.road);
  let chosen: AnyFeature[] | null = null;
  let start: Position | null = null;
  let end: Position | null = null;
  if (opts.from && opts.to) {
    const fits = comps
      .map((c) => ({ c, a: junctions(c, opts.from!), b: junctions(c, opts.to!) }))
      .filter((x) => x.a.length && x.b.length);
    if (fits.length !== 1) problems.push(fits.length ? `${fits.length} stretches of the road meet both limits` : "no stretch of the road meets both limits");
    else if (fits[0]!.a.length !== 1 || fits[0]!.b.length !== 1) problems.push(`the limits meet the road ${fits[0]!.a.length} and ${fits[0]!.b.length} times; each must meet it once`);
    else ({ c: chosen, a: [start], b: [end] } = { c: fits[0]!.c, a: fits[0]!.a as [Position], b: fits[0]!.b as [Position] });
  } else if (comps.length === 1) chosen = comps[0]!;
  else problems.push(`${comps.length} separate roads with this name in the area and no limits to choose one`);
  if (!chosen) return { geometry: null, construction, problems };

  let path: LineString;
  if (start && end) {
    const p = pathBetween(chosen, start, end);
    if (!p) return { geometry: null, construction, problems: [...problems, "no connected path along the road between the two limits"] };
    path = turf.lineString(p).geometry;
    construction.push({ what: "start at the junction with the first limit", quote: opts.quotes["geometry.from"] ?? null, source: opts.roadLayer, point: start });
    construction.push({ what: "end at the junction with the second limit", quote: opts.quotes["geometry.to"] ?? null, source: opts.roadLayer, point: end });
  } else {
    const all = chosen.flatMap(lines);
    path = turf.lineString(all.flat()).geometry;
  }
  construction.unshift({ what: "road centreline", quote: opts.quotes["geometry.road"] ?? null, source: opts.roadLayer, ids: chosen.map((f) => String(f.properties.DIGITAL_ROAD_ATLAS_LINE_ID ?? `${f.properties.FOREST_FILE_ID}.${f.properties.ROAD_SECTION_ID}`)) });
  const buffered = turf.buffer(turf.feature(path), opts.bufferM + pad, { units: "meters", steps: 16 });
  construction.push({ what: `buffer ${opts.bufferM} m either side, plus a ${pad} m conservative pad; round ends extend past each limit`, quote: opts.quotes["geometry.buffer_m"] ?? null, source: "geometry builder" });
  return { geometry: (buffered?.geometry as Polygon | MultiPolygon) ?? null, construction, problems, path };
}

export function buildAdminBoundary(area: Feature<Polygon | MultiPolygon>, quote: string | undefined, layer: string): Built {
  return { geometry: area.geometry, construction: [{ what: "official boundary of the named area", quote: quote ?? null, source: layer }], problems: [] };
}

export interface Validation {
  check: string;
  passed: boolean | null;
  detail: string;
}

/** Validation checks (Addendum A 4.5). passed=null means the check could not run; the item still goes to a person. */
export function validateShape(opts: {
  geometry: Polygon | MultiPolygon | null;
  method: string;
  within: Feature<Polygon | MultiPolygon> | null;
  synopsis: Feature<Polygon | MultiPolygon> | null;
  runAgreement: boolean | null;
  disagreements: string[];
}): Validation[] {
  const v = config().validation;
  const out: Validation[] = [];
  if (!opts.geometry) return [{ check: "shape built", passed: false, detail: "no shape could be built" }];
  const f = turf.feature(opts.geometry);
  const rings = opts.geometry.type === "Polygon" ? [opts.geometry.coordinates[0]!] : opts.geometry.coordinates.map((p) => p[0]!);
  const gap = Math.max(...rings.map((r) => turf.distance(r[0]!, r[r.length - 1]!, { units: "meters" })));
  out.push({ check: "ring closes", passed: gap <= v.ring_close_m, detail: `largest gap ${gap.toFixed(1)} m (limit ${v.ring_close_m} m)` });
  const kinks = turf.kinks(f as Feature<Polygon>).features.length;
  out.push({ check: "no self-crossing", passed: kinks === 0, detail: kinks ? `${kinks} self-intersection(s)` : "none" });
  const km2 = turf.area(f) / 1e6;
  const max = opts.method === "road_buffer" ? v.max_area_km2_road_buffer : opts.method === "metes_and_bounds" ? v.max_area_km2_metes_and_bounds : Infinity;
  out.push({ check: "area in expected range", passed: km2 > 0 && km2 <= max, detail: `${km2.toFixed(3)} km² (limit ${max === Infinity ? "none for this type" : `${max} km²`})` });
  if (opts.within) {
    const inter = turf.intersect(turf.featureCollection([f as Feature<Polygon | MultiPolygon>, opts.within]));
    const share = inter ? turf.area(inter) / turf.area(f) : 0;
    // The conservative pad may cross the boundary by a few metres; anything more is a wrong lookup.
    out.push({ check: "inside the area the text names", passed: share >= 0.97, detail: `${(share * 100).toFixed(1)}% inside` });
  } else out.push({ check: "inside the area the text names", passed: null, detail: "the text names no area, or it could not be found" });
  if (opts.synopsis) {
    const inter = turf.intersect(turf.featureCollection([f as Feature<Polygon | MultiPolygon>, opts.synopsis]));
    const share = inter ? turf.area(inter) / Math.max(turf.area(f), turf.area(opts.synopsis)) : 0;
    out.push({ check: "overlaps the synopsis map shape", passed: share >= v.synopsis_overlap_min, detail: `${(share * 100).toFixed(1)}% overlap (needs ${v.synopsis_overlap_min * 100}%)` });
  } else out.push({ check: "overlaps the synopsis map shape", passed: null, detail: "no synopsis shape in inbox/synopsis for this area yet" });
  out.push({
    check: "two independent extractions agree",
    passed: opts.runAgreement,
    detail: opts.runAgreement === null ? "only one reading available" : opts.runAgreement ? "same landmarks, distances and effect" : opts.disagreements.join("; "),
  });
  return out;
}
