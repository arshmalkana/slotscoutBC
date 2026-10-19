import type { Geometry, Position } from "geojson";
import { distanceM, parseCoordinates, titleCase, type LatLon } from "@slotscout/engine";
import { config } from "./config.js";
import { getJson } from "./http.js";
import { wfsSearch } from "./wfs.js";

export interface SearchResult {
  label: string;
  sublabel: string;
  kind: "coordinates" | "place" | "address" | "rec_site" | "road" | "km_marker" | "boundary";
  lat: number;
  lon: number;
  bbox?: [number, number, number, number];
  note?: string;
}

const H = 3600_000;

/** Strip anything that could break out of a CQL string literal. */
function cqlLike(s: string): string {
  return s.replace(/['%_\\]/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

function bboxOf(g: Geometry | null): [number, number, number, number] | undefined {
  if (!g) return undefined;
  let b: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (c: unknown): void => {
    if (typeof (c as Position)[0] === "number") {
      const [x, y] = c as [number, number];
      b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)];
    } else (c as unknown[]).forEach(visit);
  };
  if (g.type !== "GeometryCollection") visit(g.coordinates);
  return isFinite(b[0]) ? b : undefined;
}

function centre(b: [number, number, number, number]): LatLon {
  return { lat: (b[1] + b[3]) / 2, lon: (b[0] + b[2]) / 2 };
}

function linePositions(g: Geometry | null): Position[][] {
  if (!g) return [];
  if (g.type === "LineString") return [g.coordinates];
  if (g.type === "MultiLineString") return g.coordinates;
  return [];
}

/** Walk a road section's linework from its first vertex to a km distance. Approximate: mapped length, not odometer. */
function pointAtKm(lines: Position[][], km: number): LatLon | null {
  let remaining = km * 1000;
  for (const line of lines) {
    for (let i = 0; i + 1 < line.length; i++) {
      const a = { lon: line[i]![0]!, lat: line[i]![1]! };
      const b = { lon: line[i + 1]![0]!, lat: line[i + 1]![1]! };
      const d = distanceM(a, b);
      if (d >= remaining) {
        const t = d === 0 ? 0 : remaining / d;
        return { lat: a.lat + t * (b.lat - a.lat), lon: a.lon + t * (b.lon - a.lon) };
      }
      remaining -= d;
    }
  }
  return null;
}

async function places(q: string): Promise<SearchResult[]> {
  const url = `${config.geonamesUrl}?${new URLSearchParams({ name: q, outputFormat: "json", outputSRS: "4326", itemsPerPage: "6" })}`;
  const { data } = await getJson<{ features: { geometry: { coordinates: [number, number] }; properties: { name: string; featureType?: string; feature?: unknown } }[] }>(url, { ttlMs: 24 * H, timeoutMs: 6000 });
  return (data.features ?? []).map((f) => ({
    label: f.properties.name,
    sublabel: f.properties.featureType ?? "Place",
    kind: "place" as const,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
  }));
}

async function addresses(q: string): Promise<SearchResult[]> {
  const url = `${config.geocoderUrl}?${new URLSearchParams({ addressString: q, maxResults: "3", outputSRS: "4326", locationDescriptor: "any" })}`;
  const { data } = await getJson<{ features: { geometry: { coordinates: [number, number] }; properties: { fullAddress: string; score: number; matchPrecision: string } }[] }>(url, {
    ttlMs: 24 * H,
    timeoutMs: 6000,
  });
  return (data.features ?? [])
    .filter((f) => f.properties.score >= 70 && f.properties.matchPrecision !== "PROVINCE")
    .map((f) => ({
      label: f.properties.fullAddress,
      sublabel: `Address (${f.properties.matchPrecision.toLowerCase()})`,
      kind: "address" as const,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
    }));
}

async function recSites(q: string): Promise<SearchResult[]> {
  const like = cqlLike(q);
  if (like.length < 3) return [];
  const feats = await wfsSearch(
    "WHSE_FOREST_TENURE.FTEN_RECREATION_POLY_SVW",
    `PROJECT_NAME ILIKE '%${like}%' AND LIFE_CYCLE_STATUS_CODE = 'ACTIVE' AND PROJECT_TYPE <> 'Recreation Reserve'`,
    ["PROJECT_NAME", "PROJECT_TYPE", "SITE_LOCATION", "GEOMETRY"],
    5,
    24 * H,
  );
  return feats.flatMap((f) => {
    const b = bboxOf(f.geometry);
    if (!b) return [];
    const c = centre(b);
    return [
      {
        label: titleCase(String(f.properties.PROJECT_NAME ?? "")),
        sublabel: `${String(f.properties.PROJECT_TYPE ?? "Recreation site")}${f.properties.SITE_LOCATION ? `, near ${titleCase(String(f.properties.SITE_LOCATION))}` : ""}`,
        kind: "rec_site" as const,
        lat: c.lat,
        lon: c.lon,
        bbox: b,
      },
    ];
  });
}

async function roads(q: string): Promise<SearchResult[]> {
  const km = q.match(/^(.*?)\s*(?:,|\bat\b)?\s*(?:km|kilometre|kilometer)\s*(\d+(?:\.\d+)?)\s*$/i);
  const nameRaw = (km ? km[1]! : q).replace(/\b(fsr|forest service road|f\.s\.r\.)\b/gi, "").trim();
  const like = cqlLike(nameRaw);
  if (like.length < 3) return [];
  const feats = await wfsSearch(
    "WHSE_FOREST_TENURE.FTEN_ROAD_SECTION_LINES_SVW",
    `ROAD_SECTION_NAME ILIKE '${like}%' AND FILE_TYPE_DESCRIPTION = 'Forest Service Road' AND LIFE_CYCLE_STATUS_CODE = 'ACTIVE'`,
    ["FOREST_FILE_ID", "ROAD_SECTION_ID", "ROAD_SECTION_NAME", "GEOGRAPHIC_DISTRICT_NAME", "FEATURE_LENGTH_M", "GEOMETRY"],
    12,
    24 * H,
  );
  // Prefer the main line: exact name, lowest section number.
  feats.sort((a, b) => {
    const exact = (f: typeof a) => (String(f.properties.ROAD_SECTION_NAME).toUpperCase() === like ? 0 : 1);
    return exact(a) - exact(b) || String(a.properties.ROAD_SECTION_ID).localeCompare(String(b.properties.ROAD_SECTION_ID));
  });
  const out: SearchResult[] = [];
  for (const f of feats.slice(0, 4)) {
    const b = bboxOf(f.geometry);
    if (!b) continue;
    const name = `${titleCase(String(f.properties.ROAD_SECTION_NAME))} FSR ${f.properties.FOREST_FILE_ID}.${f.properties.ROAD_SECTION_ID}`;
    const district = String(f.properties.GEOGRAPHIC_DISTRICT_NAME ?? "");
    if (km && out.length === 0) {
      const p = pointAtKm(linePositions(f.geometry), Number(km[2]));
      if (p) {
        out.push({
          label: `${name}, km ${km[2]}`,
          sublabel: district,
          kind: "km_marker",
          lat: p.lat,
          lon: p.lon,
          note: "Approximate: measured along the mapped road from the start of this section, not from posted km signs.",
        });
      }
    }
    const c = centre(b);
    out.push({ label: name, sublabel: `Forest service road, ${district}`, kind: "road", lat: c.lat, lon: c.lon, bbox: b });
  }
  return out;
}

async function boundaries(q: string): Promise<SearchResult[]> {
  const like = cqlLike(q);
  if (like.length < 3) return [];
  const results: SearchResult[] = [];
  for (const [typeName, kind] of [
    ["WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_REGIONAL_DISTRICTS_SP", "Regional district"],
    ["WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_ELECTORAL_AREAS_SP", "Electoral area"],
  ] as const) {
    const feats = await wfsSearch(typeName, `ADMIN_AREA_NAME ILIKE '%${like}%'`, ["ADMIN_AREA_NAME", "SHAPE"], 3, 24 * H);
    for (const f of feats) {
      const b = bboxOf(f.geometry);
      if (!b) continue;
      const c = centre(b);
      results.push({ label: String(f.properties.ADMIN_AREA_NAME), sublabel: kind, kind: "boundary", lat: c.lat, lon: c.lon, bbox: b });
    }
  }
  return results;
}

/** Drop repeats within 1 km; tell apart same-named places elsewhere by their position. */
function dedupe(list: SearchResult[]): SearchResult[] {
  const out: SearchResult[] = [];
  for (const r of list) {
    const same = out.filter((o) => o.label === r.label && o.kind === r.kind);
    if (same.some((o) => distanceM(o, r) < 1000)) continue;
    out.push(r);
  }
  const counts = new Map<string, number>();
  for (const r of out) counts.set(`${r.kind}|${r.label}`, (counts.get(`${r.kind}|${r.label}`) ?? 0) + 1);
  return out.map((r) => ((counts.get(`${r.kind}|${r.label}`) ?? 0) > 1 ? { ...r, sublabel: `${r.sublabel} near ${r.lat.toFixed(2)}, ${r.lon.toFixed(2)}` } : r));
}

export async function search(qRaw: string): Promise<{ results: SearchResult[]; errors: string[] }> {
  const q = qRaw.trim().slice(0, 120);
  if (!q) return { results: [], errors: [] };
  const coords = parseCoordinates(q);
  if (coords.ok) {
    return {
      results: [{ label: `${coords.point.lat}, ${coords.point.lon}`, sublabel: `Coordinates (${coords.format})`, kind: "coordinates", lat: coords.point.lat, lon: coords.point.lon, note: coords.note }],
      errors: [],
    };
  }
  const looksLikeRoad = /\b(fsr|forest service road|km)\b/i.test(q);
  const tasks: [string, Promise<SearchResult[]>][] = [
    ["roads", roads(q)],
    ["places", places(q)],
    ["rec sites", recSites(q)],
    ["addresses", addresses(q)],
    ["boundaries", boundaries(q)],
  ];
  const settled = await Promise.allSettled(tasks.map(([, p]) => p));
  const errors: string[] = [];
  const byKind: Record<string, SearchResult[]> = {};
  settled.forEach((s, i) => {
    const name = tasks[i]![0];
    if (s.status === "fulfilled") byKind[name] = s.value;
    else errors.push(name);
  });
  const order = looksLikeRoad ? ["roads", "places", "rec sites", "boundaries", "addresses"] : ["places", "rec sites", "roads", "boundaries", "addresses"];
  const results = dedupe(order.flatMap((k) => byKind[k] ?? [])).slice(0, 12);
  if (!coords.ok && /\d/.test(q) && !results.length) errors.push(coords.error);
  return { results, errors };
}
