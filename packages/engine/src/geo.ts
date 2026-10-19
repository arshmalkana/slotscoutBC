import type { Geometry, Position } from "geojson";
import type { LatLon } from "./types.js";

const EARTH_R = 6371008.8;
const RAD = Math.PI / 180;

export function distanceM(a: LatLon, b: LatLon): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingDeg(a: LatLon, b: LatLon): number {
  const y = Math.sin((b.lon - a.lon) * RAD) * Math.cos(b.lat * RAD);
  const x =
    Math.cos(a.lat * RAD) * Math.sin(b.lat * RAD) -
    Math.sin(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.cos((b.lon - a.lon) * RAD);
  return norm360(Math.atan2(y, x) / RAD);
}

export function destination(a: LatLon, bearing: number, distance: number): LatLon {
  const d = distance / EARTH_R;
  const b = bearing * RAD;
  const lat1 = a.lat * RAD;
  const lon1 = a.lon * RAD;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b));
  const lon2 = lon1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: lat2 / RAD, lon: ((lon2 / RAD + 540) % 360) - 180 };
}

export function norm360(d: number): number {
  return ((d % 360) + 360) % 360;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export function compass8(deg: number): string {
  return COMPASS[Math.round(norm360(deg) / 45) % 8]!;
}

/** A polygon approximating a circle, for spatial queries. */
export function circlePolygon(center: LatLon, radiusM: number, steps = 48): LatLon[] {
  const pts: LatLon[] = [];
  for (let i = 0; i < steps; i++) pts.push(destination(center, (360 * i) / steps, radiusM));
  pts.push(pts[0]!);
  return pts;
}

export function bboxAround(center: LatLon, radiusM: number): [number, number, number, number] {
  const dLat = (radiusM / EARTH_R) / RAD;
  const dLon = dLat / Math.cos(center.lat * RAD);
  return [center.lon - dLon, center.lat - dLat, center.lon + dLon, center.lat + dLat];
}

/** Local east/north metres around an origin. Accurate to well under 0.1% inside 10 km. */
export class LocalFrame {
  private readonly kx: number;
  private readonly ky = EARTH_R * RAD;
  constructor(readonly origin: LatLon) {
    this.kx = EARTH_R * RAD * Math.cos(origin.lat * RAD);
  }
  xy(p: Position): [number, number] {
    return [(p[0]! - this.origin.lon) * this.kx, (p[1]! - this.origin.lat) * this.ky];
  }
  lonlat(x: number, y: number): LatLon {
    return { lon: this.origin.lon + x / this.kx, lat: this.origin.lat + y / this.ky };
  }
}

function bearingXY(x: number, y: number): number {
  return norm360(Math.atan2(x, y) / RAD);
}

type Ring = [number, number][];

function polygonsOf(g: Geometry, f: LocalFrame): { rings: Ring[] }[] {
  switch (g.type) {
    case "Polygon":
      return [{ rings: g.coordinates.map((r) => r.map((p) => f.xy(p))) }];
    case "MultiPolygon":
      return g.coordinates.map((poly) => ({ rings: poly.map((r) => r.map((p) => f.xy(p))) }));
    case "GeometryCollection":
      return g.geometries.flatMap((gg) => polygonsOf(gg, f));
    default:
      return [];
  }
}

function linesOf(g: Geometry, f: LocalFrame): Ring[] {
  switch (g.type) {
    case "LineString":
      return [g.coordinates.map((p) => f.xy(p))];
    case "MultiLineString":
      return g.coordinates.map((l) => l.map((p) => f.xy(p)));
    case "Polygon":
      return g.coordinates.map((r) => r.map((p) => f.xy(p)));
    case "MultiPolygon":
      return g.coordinates.flatMap((poly) => poly.map((r) => r.map((p) => f.xy(p))));
    case "GeometryCollection":
      return g.geometries.flatMap((gg) => linesOf(gg, f));
    default:
      return [];
  }
}

function pointsOf(g: Geometry, f: LocalFrame): [number, number][] {
  switch (g.type) {
    case "Point":
      return [f.xy(g.coordinates)];
    case "MultiPoint":
      return g.coordinates.map((p) => f.xy(p));
    case "GeometryCollection":
      return g.geometries.flatMap((gg) => pointsOf(gg, f));
    default:
      return [];
  }
}

/** Even-odd ray test of the origin (0,0) against a ring. */
function ringContainsOrigin(ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > 0 !== yj > 0 && 0 < ((xj - xi) * (0 - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polyContainsOrigin(rings: Ring[]): boolean {
  if (!rings[0] || !ringContainsOrigin(rings[0])) return false;
  for (let k = 1; k < rings.length; k++) if (ringContainsOrigin(rings[k]!)) return false;
  return true;
}

function nearestOnSegment(a: [number, number], b: [number, number]): [number, number] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / len2));
  return [a[0] + t * dx, a[1] + t * dy];
}

export interface GeometryRelation {
  inside: boolean;
  /** 0 when inside a polygon; otherwise distance to the nearest point of the geometry. */
  distanceM: number;
  /** Bearing to the nearest point (or nearest boundary point when inside). */
  bearingDeg: number;
  /** When inside a polygon: distance to its nearest edge. */
  edgeDistanceM: number;
}

/** How a geometry relates to a point: inside, distance and bearing to its nearest part. */
export function relate(g: Geometry | null, origin: LatLon): GeometryRelation | null {
  if (!g) return null;
  const f = new LocalFrame(origin);
  const polys = polygonsOf(g, f);
  const inside = polys.some((p) => polyContainsOrigin(p.rings));
  let best = Infinity;
  let bx = 0;
  let by = 0;
  for (const line of linesOf(g, f)) {
    for (let i = 0; i + 1 < line.length; i++) {
      const [x, y] = nearestOnSegment(line[i]!, line[i + 1]!);
      const d = Math.hypot(x, y);
      if (d < best) {
        best = d;
        bx = x;
        by = y;
      }
    }
    if (line.length === 1) {
      const [x, y] = line[0]!;
      const d = Math.hypot(x, y);
      if (d < best) {
        best = d;
        bx = x;
        by = y;
      }
    }
  }
  for (const [x, y] of pointsOf(g, f)) {
    const d = Math.hypot(x, y);
    if (d < best) {
      best = d;
      bx = x;
      by = y;
    }
  }
  if (!isFinite(best)) return null;
  return {
    inside,
    distanceM: inside ? 0 : best,
    bearingDeg: bearingXY(bx, by),
    edgeDistanceM: best,
  };
}

/**
 * Mark which 1 degree bearings from the origin reach a geometry within the radius.
 * Straight segments are clipped to the circle and the bearing arc they subtend is marked,
 * so thin features between sample rays are never missed.
 */
export function markBlockedBearings(g: Geometry | null, origin: LatLon, radiusM: number, bins: boolean[]): void {
  if (!g) return;
  const f = new LocalFrame(origin);
  for (const p of polygonsOf(g, f)) {
    if (polyContainsOrigin(p.rings)) {
      bins.fill(true);
      return;
    }
  }
  const r2 = radiusM * radiusM;
  for (const line of linesOf(g, f)) {
    for (let i = 0; i + 1 < line.length; i++) {
      const a = line[i]!;
      const b = line[i + 1]!;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const A = dx * dx + dy * dy;
      const B = 2 * (a[0] * dx + a[1] * dy);
      const C = a[0] * a[0] + a[1] * a[1] - r2;
      let t0: number;
      let t1: number;
      if (A === 0) {
        if (C > 0) continue;
        t0 = 0;
        t1 = 0;
      } else {
        const disc = B * B - 4 * A * C;
        if (disc < 0) continue;
        const sq = Math.sqrt(disc);
        t0 = Math.max(0, (-B - sq) / (2 * A));
        t1 = Math.min(1, (-B + sq) / (2 * A));
        if (t0 > t1) continue;
      }
      const p0: [number, number] = [a[0] + t0 * dx, a[1] + t0 * dy];
      const p1: [number, number] = [a[0] + t1 * dx, a[1] + t1 * dy];
      const near = nearestOnSegment(p0, p1);
      if (Math.hypot(near[0], near[1]) < 0.5) {
        // Passes through the shooter's position.
        bins.fill(true);
        return;
      }
      markArc(bins, bearingXY(p0[0], p0[1]), bearingXY(p1[0], p1[1]));
    }
  }
  for (const [x, y] of pointsOf(g, f)) {
    if (x * x + y * y <= r2) bins[Math.floor(bearingXY(x, y)) % 360] = true;
  }
}

function markArc(bins: boolean[], from: number, to: number): void {
  const diff = ((to - from + 540) % 360) - 180;
  const start = diff >= 0 ? from : to;
  const span = Math.abs(diff);
  const first = Math.floor(start);
  const last = Math.floor(start + span);
  for (let k = first; k <= last; k++) bins[((k % 360) + 360) % 360] = true;
}

export const FAN_HALF_WIDTH_DEG = 35;

/** 36 sectors of 10 degrees; a sector is safe when a 70 degree fan centred on it touches nothing blocked (PRD 8.3). */
export function safeSectors(bins: boolean[]): { centreDeg: number; safe: boolean; clearance: number }[] {
  const blocked: number[] = [];
  bins.forEach((b, i) => b && blocked.push(i));
  const out: { centreDeg: number; safe: boolean; clearance: number }[] = [];
  for (let c = 0; c < 360; c += 10) {
    let safe = true;
    for (let k = c - FAN_HALF_WIDTH_DEG; k < c + FAN_HALF_WIDTH_DEG; k++) {
      if (bins[((k % 360) + 360) % 360]) {
        safe = false;
        break;
      }
    }
    let clearance = 180;
    for (const k of blocked) {
      const d = Math.abs(((k + 0.5 - c + 540) % 360) - 180);
      clearance = Math.min(clearance, d);
    }
    out.push({ centreDeg: c, safe, clearance });
  }
  return out;
}
