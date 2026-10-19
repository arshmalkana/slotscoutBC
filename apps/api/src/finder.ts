import type { Geometry, Position } from "geojson";
import { bearingDeg, compass8, distanceM, relate, type LatLon, type Profile, type SpotReport, type VerdictState } from "@slotscout/engine";
import { checkPoint } from "./check.js";
import { wfsSearch } from "./wfs.js";

/**
 * Spot finder preview (PRD 2.5, 8.5). Candidate ground is open cutblocks harvested 4 to 12 years
 * ago with at least 50% clearcut. The nearest candidates are each run through the full engine,
 * so the finder can never disagree with a single-pin check. Precomputed candidate tables
 * (PRD 8.5.6) replace the live search once the monthly release builder exists.
 */
export const FINDER_MAX_RADIUS_KM = 10;
export const FINDER_MAX_CHECKS = 8;

export interface FinderCandidate {
  point: LatLon;
  distanceM: number;
  bearingDeg: number;
  direction: string;
  harvestYear: number;
  areaHa: number;
  verdict: SpotReport["verdict"];
  lights: SpotReport["lights"];
  bestBearingDeg: number | null;
  bestBearingMagneticDeg: number | null;
  nearestRoad?: string;
  nearestRoadM?: number;
  vehicle: string;
  notices: number;
}

function ringCentroid(ring: Position[]): LatLon {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j] as [number, number];
    const [x1, y1] = ring[i] as [number, number];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (a === 0) return { lon: ring[0]![0]!, lat: ring[0]![1]! };
  return { lon: cx / (3 * a), lat: cy / (3 * a) };
}

/** A stand point inside the block: the centroid if it falls inside, else the inside point nearest to it. */
function standPoint(g: Geometry | null): LatLon | null {
  if (!g) return null;
  const outer = g.type === "Polygon" ? g.coordinates[0] : g.type === "MultiPolygon" ? g.coordinates[0]?.[0] : undefined;
  if (!outer?.length) return null;
  const c = ringCentroid(outer);
  if (relate(g, c)?.inside) return c;
  // Nudge from each vertex towards the centroid until inside.
  for (const v of outer) {
    const p = { lon: v[0]! + (c.lon - v[0]!) * 0.15, lat: v[1]! + (c.lat - v[1]!) * 0.15 };
    if (relate(g, p)?.inside) return p;
  }
  return null;
}

const RANK: Record<VerdictState, number> = { green: 0, amber: 1, grey: 2, red: 3 };

export async function findSpots(start: LatLon, radiusKm: number, profile: Profile, at: Date): Promise<{ candidates: FinderCandidate[]; screened: number; checked: number }> {
  const r = Math.min(FINDER_MAX_RADIUS_KM, Math.max(1, radiusKm));
  const year = at.getUTCFullYear();
  const dLat = (r * 1000) / 111_000;
  const dLon = dLat / Math.cos((start.lat * Math.PI) / 180);
  const bbox = `${(start.lon - dLon).toFixed(5)},${(start.lat - dLat).toFixed(5)},${(start.lon + dLon).toFixed(5)},${(start.lat + dLat).toFixed(5)}`;
  const blocks = await wfsSearch(
    "WHSE_FOREST_VEGETATION.VEG_CONSOLIDATED_CUT_BLOCKS_SP",
    `BBOX(SHAPE,${bbox},'EPSG:4326') AND HARVEST_START_YEAR_CALENDAR >= ${year - 12} AND HARVEST_START_YEAR_CALENDAR <= ${year - 4} AND PERCENT_CLEARCUT >= 50 AND AREA_HA >= 2`,
    ["HARVEST_START_YEAR_CALENDAR", "AREA_HA", "SHAPE"],
    400,
    6 * 3600_000,
  );
  const candidates = blocks
    .map((b) => ({ b, p: standPoint(b.geometry) }))
    .filter((x): x is { b: (typeof blocks)[number]; p: LatLon } => !!x.p)
    .map((x) => ({ ...x, d: distanceM(start, x.p) }))
    .filter((x) => x.d <= r * 1000)
    .sort((a, b) => a.d - b.d);

  // Spread the checks out: skip candidates within 400 m of one already chosen.
  const chosen: typeof candidates = [];
  for (const c of candidates) {
    if (chosen.some((o) => distanceM(o.p, c.p) < 400)) continue;
    chosen.push(c);
    if (chosen.length === FINDER_MAX_CHECKS) break;
  }

  const results: FinderCandidate[] = [];
  const queue = [...chosen];
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      const rep = await checkPoint(c.p, profile, at);
      if (rep.verdict.state === "red") continue;
      results.push({
        point: { lat: Math.round(c.p.lat * 1e6) / 1e6, lon: Math.round(c.p.lon * 1e6) / 1e6 },
        distanceM: Math.round(c.d),
        bearingDeg: Math.round(bearingDeg(start, c.p)),
        direction: compass8(bearingDeg(start, c.p)),
        harvestYear: Number(c.b.properties.HARVEST_START_YEAR_CALENDAR),
        areaHa: Math.round(Number(c.b.properties.AREA_HA) * 10) / 10,
        verdict: rep.verdict,
        lights: rep.lights,
        bestBearingDeg: rep.fallZone.bestBearingDeg,
        bestBearingMagneticDeg: rep.fallZone.bestBearingMagneticDeg,
        nearestRoad: rep.access.nearestResourceRoad?.name ?? rep.access.nearestPublicRoad?.name,
        nearestRoadM: rep.access.nearestResourceRoad?.distanceM ?? rep.access.nearestPublicRoad?.distanceM,
        vehicle: rep.access.vehicle,
        notices: rep.access.notices.length,
      });
    }
  };
  await Promise.all([worker(), worker()]);
  results.sort((a, b) => RANK[a.verdict.state] - RANK[b.verdict.state] || b.lights.filter((l) => l.state === "green").length - a.lights.filter((l) => l.state === "green").length || a.distanceM - b.distanceM);
  return { candidates: results, screened: candidates.length, checked: chosen.length };
}
