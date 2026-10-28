import { join } from "node:path";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Geometry, LineString, MultiLineString, MultiPolygon, Polygon, Position } from "geojson";
import { politeFetch } from "./http.js";
import { P } from "./paths.js";
import { readJsonIf } from "./util.js";

/**
 * Place lookup (Addendum A 4.3): code, not AI, matches every named feature to one official object
 * in the official layers. Zero matches or more than one within the area sends the item to a
 * person. Spelling variants come only from data/aliases.json, which people maintain; standard
 * road-type abbreviations (Road/Rd) are normalised.
 */
const WFS = "https://openmaps.gov.bc.ca/geo/pub/wfs";

export type AnyFeature = Feature<Geometry, Record<string, unknown>>;

export interface Lookup {
  query: string;
  kind: string;
  layer: string;
  status: "ok" | "none" | "ambiguous" | "failed";
  matches: number;
  ids: string[];
  note?: string;
  features: AnyFeature[];
}

const AREA_LAYERS: Record<string, { layer: string; field: string; geom: string }> = {
  regional_district: { layer: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_REGIONAL_DISTRICTS_SP", field: "ADMIN_AREA_NAME", geom: "SHAPE" },
  municipality: { layer: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP", field: "ADMIN_AREA_NAME", geom: "SHAPE" },
  electoral_area: { layer: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_ELECTORAL_AREAS_SP", field: "ADMIN_AREA_NAME", geom: "SHAPE" },
  wildlife_management_unit: { layer: "WHSE_WILDLIFE_MANAGEMENT.WAA_WILDLIFE_MGMT_UNITS_SVW", field: "WILDLIFE_MGMT_UNIT_ID", geom: "GEOMETRY" },
  park: { layer: "WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW", field: "PROTECTED_LANDS_NAME", geom: "SHAPE" },
  reserve: { layer: "WHSE_ADMIN_BOUNDARIES.CLAB_INDIAN_RESERVES", field: "ENGLISH_NAME", geom: "GEOMETRY" },
  lake: { layer: "WHSE_BASEMAPPING.FWA_LAKES_POLY", field: "GNIS_NAME_1", geom: "GEOMETRY" },
  island: { layer: "WHSE_BASEMAPPING.FWA_ISLANDS_POLY", field: "GNIS_NAME_1", geom: "GEOMETRY" },
  land_district: { layer: "WHSE_TANTALIS.TA_LAND_DISTRICTS_SVW", field: "LAND_DISTRICT_NAME", geom: "SHAPE" },
};

const esc = (s: string) => s.replace(/'/g, "''");

/** Management unit ids as the text writes them ("M.U. 2-04", "M.U.s 1-3 and 1-4", "4-19"), as the layer stores them ("2-4"). */
export function muIds(name: string): string[] {
  const s = name.replace(/\s+/g, " ").trim();
  if (!/^((wildlife )?management units? |m\.? ?u\.?s?\.? ?)?\d{1,2} ?- ?\d{1,3}\b/i.test(s)) return [];
  return [...new Set([...s.matchAll(/\b(\d{1,2}) ?- ?0*(\d{1,3})\b/g)].map((m) => `${m[1]}-${m[2]}`))];
}

/** "Cariboo Land District" as Tantalis writes it: "CARIBOO DISTRICT". */
export function landDistrictName(name: string): string {
  return name.toUpperCase().replace(/\bLAND DISTRICT\b/, "DISTRICT").replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
}

/** The layer a named area is in: management units and land districts are recognised by how they are written. */
function areaKind(type: string, name: string): string {
  if ((type === "wildlife_management_unit" || type === "other" || type === "region") && muIds(name).length) return "wildlife_management_unit";
  if ((type === "other" || type === "region") && /\bdistrict\b/i.test(name) && !/regional district/i.test(name)) return "land_district";
  return type;
}

/** Answers already fetched in this run: many sections name the same river, highway or boundary. */
const wfsCache = new Map<string, Promise<AnyFeature[]>>();

export function wfsQuery(layer: string, cql: string, count = 5000): Promise<AnyFeature[]> {
  const key = `${layer}|${cql}|${count}`;
  const hit = wfsCache.get(key);
  if (hit) return hit;
  const p = wfsFetch(layer, cql, count);
  wfsCache.set(key, p);
  p.catch(() => wfsCache.delete(key));
  return p;
}

async function wfsFetch(layer: string, cql: string, count: number): Promise<AnyFeature[]> {
  const u = new URL(WFS);
  u.search = new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: layer, outputFormat: "application/json", srsName: "EPSG:4326", count: String(count), CQL_FILTER: cql }).toString();
  const r = await politeFetch(u.toString(), { kind: "api", timeoutMs: 180_000 });
  return ((await r.json()) as FeatureCollection<Geometry, Record<string, unknown>>).features as AnyFeature[];
}

function aliases(): Record<string, string[]> {
  return readJsonIf<{ aliases: Record<string, string[]> }>(join(P.data, "aliases.json"), { aliases: {} }).aliases;
}

const ABBR: [RegExp, string][] = [
  [/\bRoad\b/g, "Rd"],
  [/\bStreet\b/g, "St"],
  [/\bAvenue\b/g, "Ave"],
  [/\bDrive\b/g, "Dr"],
  [/\bHighway\b/g, "Hwy"],
  [/\bBoulevard\b/g, "Blvd"],
  [/\bCrescent\b/g, "Cres"],
  [/\bPlace\b/g, "Pl"],
  [/\bTrail\b/g, "Trl"],
  [/\bMountain\b/g, "Mtn"],
];

/** Road name forms to try: as written, the Digital Road Atlas abbreviation, and approved aliases. */
export function roadNameForms(name: string): string[] {
  const forms = new Set([name.trim()]);
  let abbr = name.trim();
  for (const [re, to] of ABBR) abbr = abbr.replace(re, to);
  forms.add(abbr);
  for (const a of aliases()[name.trim()] ?? []) forms.add(a);
  return [...forms];
}

export async function lookupArea(type: string, name: string): Promise<Lookup> {
  const kind = areaKind(type, name);
  const spec = AREA_LAYERS[kind];
  if (!spec) return { query: name, kind: type, layer: "-", status: "failed", matches: 0, ids: [], note: `no official layer for area type ${type}`, features: [] };
  try {
    const mus = kind === "wildlife_management_unit" ? muIds(name) : [];
    let fs: AnyFeature[] = [];
    if (mus.length) fs = await wfsQuery(spec.layer, `${spec.field} IN (${mus.map((m) => `'${m}'`).join(",")})`);
    else
      // Names match whatever their case; spelling variants come only from the people-maintained aliases.
      for (const n of [kind === "land_district" ? landDistrictName(name) : name, ...(aliases()[name] ?? [])]) {
        if (fs.length) break;
        fs = await wfsQuery(spec.layer, `${spec.field} ILIKE '${esc(n)}'`);
      }
    const ids = [...new Set(fs.map((f) => String(f.properties[spec.field])))];
    // Several management units named together make one area; each must be found.
    const missing = mus.filter((m) => !ids.includes(m));
    if (missing.length) return { query: name, kind: type, layer: spec.layer, status: "none", matches: ids.length, ids, note: `management unit ${missing.join(", ")} not found`, features: [] };
    const status = fs.length === 0 ? "none" : ids.length > 1 && !mus.length ? "ambiguous" : "ok";
    return { query: name, kind: type, layer: spec.layer, status, matches: ids.length, ids, features: fs };
  } catch (e) {
    return { query: name, kind: type, layer: spec.layer, status: "failed", matches: 0, ids: [], note: (e as Error).message, features: [] };
  }
}

/** Unions an area's parts into one (Multi)Polygon feature. */
export function areaShape(l: Lookup): Feature<Polygon | MultiPolygon> | null {
  const polys = l.features.filter((f) => f.geometry && /Polygon/.test(f.geometry.type)) as Feature<Polygon | MultiPolygon>[];
  if (!polys.length) return null;
  if (polys.length === 1) return polys[0]!;
  return turf.union(turf.featureCollection(polys)) as Feature<Polygon | MultiPolygon> | null;
}

/** Road segments with this name inside the area (DRA, or FTEN for forest service roads). */
export async function lookupRoad(name: string, hint: string, area: Feature<Polygon | MultiPolygon> | null): Promise<Lookup> {
  const forms = roadNameForms(name);
  const [minX, minY, maxX, maxY] = area ? turf.bbox(area) : [-139.1, 48.2, -114.0, 60.0];
  const box = `BBOX(GEOMETRY,${minX},${minY},${maxX},${maxY},'EPSG:4326')`;
  const fsr = hint === "FTEN" || /\b(FSR|Forest Service Road)\b/i.test(name);
  try {
    let fs: AnyFeature[];
    let layer: string;
    if (fsr) {
      layer = "WHSE_FOREST_TENURE.FTEN_ROAD_SECTION_LINES_SVW";
      const base = name.replace(/\b(FSR|Forest Service Road)\b/gi, "").trim().toUpperCase();
      fs = await wfsQuery(layer, `ROAD_SECTION_NAME ILIKE '${esc(base)}' AND LIFE_CYCLE_STATUS_CODE<>'RETIRED' AND ${box}`);
    } else {
      layer = "WHSE_BASEMAPPING.DRA_DGTL_ROAD_ATLAS_MPAR_SP";
      const list = forms.map((f) => `'${esc(f)}'`).join(",");
      const nameCql = ["ROAD_NAME_FULL", "ROAD_NAME_ALIAS1", "ROAD_NAME_ALIAS2", "ROAD_NAME_ALIAS3", "ROAD_NAME_ALIAS4"].map((c) => `${c} IN (${list})`).join(" OR ");
      fs = await wfsQuery(layer, `(${nameCql}) AND ${box}`);
    }
    if (area) fs = fs.filter((f) => turf.booleanIntersects(f as Feature<LineString | MultiLineString>, area));
    const comps = components(fs);
    return {
      query: name,
      kind: fsr ? "fsr" : "road",
      layer,
      status: fs.length === 0 ? "none" : comps.length > 1 ? "ambiguous" : "ok",
      matches: comps.length,
      ids: fs.map((f) => String(f.properties.DIGITAL_ROAD_ATLAS_LINE_ID ?? `${f.properties.FOREST_FILE_ID}.${f.properties.ROAD_SECTION_ID}`)),
      note: comps.length > 1 ? `${comps.length} separate roads named ${name} in the area` : undefined,
      features: fs,
    };
  } catch (e) {
    return { query: name, kind: "road", layer: "-", status: "failed", matches: 0, ids: [], note: (e as Error).message, features: [] };
  }
}

/** Segments grouped into connected roads (endpoints within 2 m). */
export function components(fs: AnyFeature[]): AnyFeature[][] {
  const lines = fs.map((f) => (f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.type === "MultiLineString" ? f.geometry.coordinates : []));
  const parent = fs.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const ends = lines.map((ls) => ls.flatMap((l) => [l[0]!, l[l.length - 1]!]));
  // Ends within 2 m join; a grid of ~5 m cells finds the candidates without comparing every pair.
  const cell = (p: Position) => `${Math.floor(p[0]! / 5e-5)},${Math.floor(p[1]! / 5e-5)}`;
  const grid = new Map<string, number[]>();
  ends.forEach((es, i) => es.forEach((p) => grid.set(cell(p), [...(grid.get(cell(p)) ?? []), i])));
  ends.forEach((es, i) =>
    es.forEach((p) => {
      const [cx, cy] = cell(p).split(",").map(Number);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
          for (const j of grid.get(`${cx! + dx},${cy! + dy}`) ?? [])
            if (j !== i && ends[j]!.some((q) => turf.distance(p, q, { units: "meters" }) < 2)) parent[find(i)] = find(j);
    }),
  );
  const groups = new Map<number, AnyFeature[]>();
  fs.forEach((f, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), f]));
  return [...groups.values()];
}

/** The FTEN section line for a road notice (file and section number). */
export async function ftenSection(fileSection: string): Promise<AnyFeature[]> {
  const [file, sec] = fileSection.split(".");
  return wfsQuery("WHSE_FOREST_TENURE.FTEN_ROAD_SECTION_LINES_SVW", `FOREST_FILE_ID='${esc(file!)}' AND ROAD_SECTION_ID='${esc(sec!)}'`, 50);
}
