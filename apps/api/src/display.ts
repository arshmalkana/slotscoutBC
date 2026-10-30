import type { Feature, Geometry, Position } from "geojson";
import type { DigitisedRuleProps } from "@slotscout/engine";

/**
 * Display copies of closed-area shapes for the map: the few properties the map draws with, and
 * outlines simplified to about 10 m so hundreds of traced walks load quickly on a phone. Checks
 * never use these; they run on the full shapes.
 */
const TOLERANCE_DEG = 0.0001;

/** Douglas-Peucker on one line or ring; a ring keeps at least four positions, a line at least two. */
function simplifyLine(ring: Position[], tolerance = TOLERANCE_DEG, minKeep = 4): Position[] {
  if (ring.length <= minKeep) return ring;
  const k = Math.cos(((ring[0]![1] ?? 0) * Math.PI) / 180);
  const keep = new Uint8Array(ring.length);
  keep[0] = keep[ring.length - 1] = 1;
  const stack: [number, number][] = [[0, ring.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = [ring[a]![0]! * k, ring[a]![1]!];
    const [bx, by] = [ring[b]![0]! * k, ring[b]![1]!];
    const len = Math.hypot(bx - ax, by - ay);
    let far = -1;
    let max = tolerance;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = [ring[i]![0]! * k, ring[i]![1]!];
      const d = len ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len : Math.hypot(px - ax, py - ay);
      if (d > max) (max = d), (far = i);
    }
    if (far >= 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  const out = ring.filter((_, i) => keep[i]);
  return out.length >= minKeep ? out : ring;
}

const simplifyRing = (ring: Position[]) => simplifyLine(ring);

/** Any geometry simplified to a tolerance in degrees (latitude-scaled), for drawing on the map. */
export function simplifyGeometry(g: Geometry, tolerance: number): Geometry {
  const ring = (r: Position[]) => simplifyLine(r, tolerance, 4);
  const line = (l: Position[]) => simplifyLine(l, tolerance, 2);
  switch (g.type) {
    case "Polygon":
      return { type: "Polygon", coordinates: g.coordinates.map(ring) };
    case "MultiPolygon":
      return { type: "MultiPolygon", coordinates: g.coordinates.map((p) => p.map(ring)) };
    case "LineString":
      return { type: "LineString", coordinates: line(g.coordinates) };
    case "MultiLineString":
      return { type: "MultiLineString", coordinates: g.coordinates.map(line) };
    default:
      return g;
  }
}

export function displayFeature(f: Feature<Geometry, DigitisedRuleProps>): Feature<Geometry> {
  const g = f.geometry;
  const geometry: Geometry =
    g.type === "Polygon" ? { type: "Polygon", coordinates: g.coordinates.map(simplifyRing) } : g.type === "MultiPolygon" ? { type: "MultiPolygon", coordinates: g.coordinates.map((p) => p.map(simplifyRing)) } : g;
  const p = f.properties;
  return {
    type: "Feature",
    geometry,
    properties: { rule_id: p.rule_id, effect: p.effect, authority: p.authority, approximate: p.approximate === true, approximate_quality: p.approximate_quality ?? null },
  };
}
