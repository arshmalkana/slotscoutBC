import type { Feature, Geometry, Polygon } from "geojson";
import {
  DEFAULT_PROFILE,
  destination,
  type BylawEntry,
  type DigitisedRuleProps,
  type EvaluationInput,
  type LatLon,
  type LayerData,
  type LayerKey,
  type Profile,
  type RegionCoverage,
  type SourceInfo,
} from "../src/index.js";

/** Synthetic test data only. Nothing here describes a real closed area or bylaw. */

export const AT = new Date("2026-10-19T18:00:00Z");
export const PIN: LatLon = { lat: 50.5, lon: -121.0 };

export const ALL_KEYS: LayerKey[] = [
  "province",
  "national_parks",
  "federal_protected",
  "bc_parks",
  "local_parks",
  "reserves",
  "treaty_lands",
  "treaty_areas",
  "municipalities",
  "regional_districts",
  "electoral_areas",
  "local_trust_areas",
  "rec_sites",
  "rec_trails",
  "fire_restrictions",
  "fire_bans",
  "fire_current",
  "fire_history",
  "parcels_point",
  "parcels_nearby",
  "fsr_roads",
  "dra_roads",
  "cutblocks",
  "mvpr",
  "wmu",
  "community_watersheds",
  "crown_tenures",
  "range_tenures",
  "mineral_tenures",
  "transmission",
  "pipelines",
  "railways",
  "buildings",
];

export function square(center: LatLon, halfM: number, offsetEastM = 0, offsetNorthM = 0): Polygon {
  const c = destination(destination(center, 90, offsetEastM), 0, offsetNorthM);
  const n = destination(c, 0, halfM).lat;
  const s = destination(c, 180, halfM).lat;
  const e = destination(c, 90, halfM).lon;
  const w = destination(c, 270, halfM).lon;
  return {
    type: "Polygon",
    coordinates: [
      [
        [w, s],
        [e, s],
        [e, n],
        [w, n],
        [w, s],
      ],
    ],
  };
}

export function feature<P extends Record<string, unknown>>(geometry: Geometry | null, properties: P): Feature<Geometry | null, P> {
  return { type: "Feature", geometry, properties };
}

export function okLayer(key: LayerKey, features: Feature<Geometry | null, Record<string, unknown>>[] = []): LayerData {
  return { sourceId: sourceOf(key), status: "ok", fetchedAt: new Date(AT.getTime() - 3600_000).toISOString(), features };
}

export function sourceOf(key: LayerKey): string {
  if (key === "parcels_point" || key === "parcels_nearby") return "parcels";
  return key;
}

export const SOURCES: Record<string, SourceInfo> = Object.fromEntries(
  [...new Set(ALL_KEYS.map(sourceOf)), "road_notices", "closed_areas", "bylaws"].map((id) => [
    id,
    { id, name: id.replace(/_/g, " "), owner: "test", freshnessHours: id.startsWith("fire") ? 24 : 24 * 45, url: "https://example.test", licence: "test" },
  ]),
);

export const COVERAGE_REVIEWED: RegionCoverage[] = [{ region: "3", name: "Thompson", status: "reviewed", confirmedOn: "2026-10-10" }];

export const BYLAWS_CLEAR: BylawEntry[] = [
  { key: "ea:Test Electoral Area Z", kind: "electoral_area", name: "Test Electoral Area Z", status: "reviewed", targetShooting: "no_bylaw", confirmedOn: "2026-10-10" },
];

/** An all-clear input: every layer read, region reviewed, electoral area reviewed with no bylaw. */
export function baseInput(over: Partial<EvaluationInput> = {}, profile: Partial<Profile> = {}): EvaluationInput {
  const layers: Record<string, LayerData> = Object.fromEntries(ALL_KEYS.map((k) => [k, okLayer(k)]));
  layers.wmu = okLayer("wmu", [feature(null, { WILDLIFE_MGMT_UNIT_ID: "3-15", REGION_RESPONSIBLE_NAME: "Thompson", REGION_RESPONSIBLE_ID: "3" })]);
  layers.electoral_areas = okLayer("electoral_areas", [feature(null, { ADMIN_AREA_NAME: "Test Electoral Area Z", ADMIN_AREA_GROUP_NAME: "Test RD" })]);
  return {
    point: PIN,
    profile: { ...DEFAULT_PROFILE, ...profile },
    at: AT,
    release: { id: "test", label: "test", publishedOn: "2026-10-01", notes: "" },
    inBC: true,
    layers,
    sources: SOURCES,
    digitised: [],
    wildlifeCoverage: COVERAGE_REVIEWED,
    bylaws: BYLAWS_CLEAR,
    imagery: { provider: "test", captureDate: "2025-08-01", source: "TestSat", resolutionM: 0.5 },
    roadNotices: { district: "Test", status: "ok", fetchedAt: new Date(AT.getTime() - 3600_000).toISOString(), notices: [], pageUrl: "https://example.test" },
    declinationDeg: 16,
    ...over,
  };
}

export function digitised(geometry: Polygon, props: Partial<DigitisedRuleProps>): Feature<Geometry, DigitisedRuleProps> {
  return {
    type: "Feature",
    geometry,
    properties: {
      rule_id: "W5-999",
      authority: "TEST Closed Areas Regulation, Sch. 5, s. 999",
      source_url: "https://example.test",
      source_text: "TEST ONLY",
      source_version: "test",
      effect: "no_shooting",
      period: null,
      exemptions: [],
      geometry_method: "metes_and_bounds",
      buffer_m: null,
      partial_extent: false,
      conservative: true,
      digitised_by: "AA",
      digitised_on: "2026-10-01",
      reviewed_by: "BB",
      reviewed_on: "2026-10-02",
      confidence: "high",
      notes: "",
      ...props,
    },
  };
}
