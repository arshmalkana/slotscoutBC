import area from "@turf/area";
import bbox from "@turf/bbox";
import buffer from "@turf/buffer";
import circle from "@turf/circle";
import difference from "@turf/difference";
import { featureCollection, lineString, multiPolygon, point, polygon } from "@turf/helpers";
import intersect from "@turf/intersect";
import kinks from "@turf/kinks";
import simplify from "@turf/simplify";
import union from "@turf/union";
import type { Feature, Geometry, MultiPolygon, Polygon, Position } from "geojson";

/**
 * The map editor's geometry, kept as one MultiPolygon draft (a list of polygons, each a list of rings). Every
 * function returns a new draft; nothing is changed in place, so undo is just the previous draft.
 */
export type Draft = Position[][][];
/** A corner of the draft: polygon, ring, position. */
export type VertexPath = [number, number, number];

export const EMPTY_DRAFT: Draft = [];

export function fromGeometry(g: Geometry | null | undefined): Draft {
  if (!g) return [];
  if (g.type === "Polygon") return [g.coordinates.map((r) => r.map((p) => [p[0]!, p[1]!]))];
  if (g.type === "MultiPolygon") return g.coordinates.map((poly) => poly.map((r) => r.map((p) => [p[0]!, p[1]!])));
  return [];
}

export function toGeometry(d: Draft): Polygon | MultiPolygon | null {
  const polys = d.filter((p) => p.length && p[0]!.length >= 4);
  if (!polys.length) return null;
  return polys.length === 1 ? { type: "Polygon", coordinates: polys[0]! } : { type: "MultiPolygon", coordinates: polys };
}

const asFeature = (d: Draft): Feature<Polygon | MultiPolygon> | null => {
  const g = toGeometry(d);
  return g ? (g.type === "Polygon" ? polygon(g.coordinates) : multiPolygon(g.coordinates)) : null;
};

const copy = (d: Draft): Draft => d.map((p) => p.map((r) => r.map((q) => [...q])));

/** Moves one corner; the first and last corner of a ring are the same point and move together. */
export function moveVertex(d: Draft, [p, r, i]: VertexPath, to: Position): Draft {
  const out = copy(d);
  const ring = out[p]?.[r];
  if (!ring) return d;
  const last = ring.length - 1;
  ring[i] = [to[0]!, to[1]!];
  if (i === 0) ring[last] = [to[0]!, to[1]!];
  if (i === last) ring[0] = [to[0]!, to[1]!];
  return out;
}

/** Adds a corner after position i (dragging a midpoint handle). */
export function insertVertex(d: Draft, [p, r, i]: VertexPath, at: Position): Draft {
  const out = copy(d);
  const ring = out[p]?.[r];
  if (!ring) return d;
  ring.splice(i + 1, 0, [at[0]!, at[1]!]);
  return out;
}

/** Removes a corner. A ring left with fewer than three corners goes; an outer ring takes its polygon with it. */
export function deleteVertex(d: Draft, [p, r, i]: VertexPath): Draft {
  const out = copy(d);
  const ring = out[p]?.[r];
  if (!ring) return d;
  const open = ring.slice(0, -1);
  open.splice(i === ring.length - 1 ? 0 : i, 1);
  if (open.length < 3) {
    if (r === 0) out.splice(p, 1);
    else out[p]!.splice(r, 1);
    return out;
  }
  out[p]![r] = [...open, [...open[0]!]];
  return out;
}

const closeRing = (pts: Position[]): Position[] => [...pts.map((q) => [q[0]!, q[1]!]), [pts[0]![0]!, pts[0]![1]!]];

/** Merges a shape into the draft (overlaps join into one outline). */
export function addShape(d: Draft, g: Polygon | MultiPolygon): Draft {
  const add = g.type === "Polygon" ? polygon(g.coordinates) : multiPolygon(g.coordinates);
  const cur = asFeature(d);
  if (!cur) return fromGeometry(add.geometry);
  const u = union(featureCollection([cur, add]));
  return u ? fromGeometry(u.geometry) : d;
}

/** Cuts a shape out of the draft. */
export function subtractShape(d: Draft, g: Polygon | MultiPolygon): Draft {
  const cur = asFeature(d);
  if (!cur) return d;
  const cut = g.type === "Polygon" ? polygon(g.coordinates) : multiPolygon(g.coordinates);
  const r = difference(featureCollection([cur, cut]));
  return r ? fromGeometry(r.geometry) : [];
}

/** Keeps only the part of the draft inside an area (clip to a management unit or jurisdiction). */
export function clipTo(d: Draft, g: Polygon | MultiPolygon): Draft {
  const cur = asFeature(d);
  if (!cur) return d;
  const keep = g.type === "Polygon" ? polygon(g.coordinates) : multiPolygon(g.coordinates);
  const r = intersect(featureCollection([cur, keep]));
  return r ? fromGeometry(r.geometry) : [];
}

/** A sketched ring (three or more clicks) as a polygon. */
export function ringPolygon(pts: Position[]): Polygon | null {
  if (pts.length < 3) return null;
  return { type: "Polygon", coordinates: [closeRing(pts)] };
}

/** A line or point buffered by a distance in metres ("within 400 m of the road"). */
export function bufferShape(g: Geometry, metres: number): Polygon | MultiPolygon | null {
  if (!(metres > 0)) return g.type === "Polygon" || g.type === "MultiPolygon" ? g : null;
  const b = buffer({ type: "Feature", geometry: g, properties: {} }, metres, { units: "meters", steps: 12 });
  return (b?.geometry as Polygon | MultiPolygon | undefined) ?? null;
}

export function bufferLine(pts: Position[], metres: number): Polygon | MultiPolygon | null {
  if (pts.length < 2) return null;
  return bufferShape(lineString(pts.map((q) => [q[0]!, q[1]!])).geometry, metres);
}

export function circleAt(center: Position, metres: number): Polygon {
  return circle(point([center[0]!, center[1]!]), metres / 1000, { units: "kilometers", steps: 48 }).geometry;
}

/** Fewer corners, within a tolerance in metres (for shapes traced from dense official lines). */
export function simplifyDraft(d: Draft, metres: number): Draft {
  const f = asFeature(d);
  if (!f) return d;
  const s = simplify(f, { tolerance: metres / 111_000, highQuality: true, mutate: false });
  return fromGeometry(s.geometry);
}

export interface DraftStats {
  km2: number;
  polygons: number;
  corners: number;
  crossings: number;
  bbox: [number, number, number, number] | null;
}

export function draftStats(d: Draft): DraftStats {
  const f = asFeature(d);
  const corners = d.reduce((n, p) => n + p.reduce((m, r) => m + Math.max(0, r.length - 1), 0), 0);
  if (!f) return { km2: 0, polygons: 0, corners, crossings: 0, bbox: null };
  return { km2: area(f) / 1e6, polygons: d.length, corners, crossings: kinks(f as Feature<Polygon>).features.length, bbox: bbox(f) as [number, number, number, number] };
}

/** Handles for editing: every corner, and a midpoint on every side (drag it to add a corner). */
export function handles(d: Draft): { vertices: GeoJSON.FeatureCollection; midpoints: GeoJSON.FeatureCollection } {
  const vertices: GeoJSON.Feature[] = [];
  const midpoints: GeoJSON.Feature[] = [];
  d.forEach((poly, p) =>
    poly.forEach((ring, r) => {
      for (let i = 0; i < ring.length - 1; i++) {
        vertices.push({ type: "Feature", geometry: { type: "Point", coordinates: ring[i]! }, properties: { p, r, i } });
        const [a, b] = [ring[i]!, ring[i + 1]!];
        midpoints.push({ type: "Feature", geometry: { type: "Point", coordinates: [(a[0]! + b[0]!) / 2, (a[1]! + b[1]!) / 2] }, properties: { p, r, i } });
      }
    }),
  );
  return { vertices: { type: "FeatureCollection", features: vertices }, midpoints: { type: "FeatureCollection", features: midpoints } };
}
