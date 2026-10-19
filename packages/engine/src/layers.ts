/**
 * Layer keys the engine reads from EvaluationInput.layers. The API decides how to fetch them;
 * the engine only needs features in WGS84 near the point.
 *
 * "point" layers are only tested for containment of the pin. "nearby" layers are fetched for the
 * whole search circle (the fall zone, or the access radius for roads) so distances and the
 * safe-direction compass can be computed.
 */
export type LayerKey =
  | "province"
  | "national_parks"
  | "federal_protected"
  | "bc_parks"
  | "local_parks"
  | "reserves"
  | "treaty_lands"
  | "treaty_areas"
  | "municipalities"
  | "regional_districts"
  | "electoral_areas"
  | "local_trust_areas"
  | "rec_sites"
  | "rec_trails"
  | "fire_restrictions"
  | "fire_bans"
  | "fire_current"
  | "fire_history"
  | "parcels_point"
  | "parcels_nearby"
  | "fsr_roads"
  | "dra_roads"
  | "cutblocks"
  | "mvpr"
  | "wmu"
  | "community_watersheds"
  | "crown_tenures"
  | "range_tenures"
  | "mineral_tenures"
  | "transmission"
  | "pipelines"
  | "railways"
  | "buildings";

export const ACCESS_RADIUS_M = 2000;

/** Parcel owner types in ParcelMap BC, and what they mean for shooting. */
export const OWNER_TYPES: Record<string, { rule: "O1" | "O3" | "F4" | "I1" | null; kind: string; unknown?: boolean }> = {
  Private: { rule: "O1", kind: "Private land" },
  "Mixed Ownership": { rule: "O1", kind: "Mixed private and public land" },
  Federal: { rule: "F4", kind: "Federal land" },
  "Crown Agency": { rule: "O3", kind: "Crown agency land" },
  "Local Government": { rule: "O3", kind: "Local government land" },
  "First Nations": { rule: "I1", kind: "First Nations land" },
  Unclassified: { rule: "O1", kind: "Land of unclassified ownership", unknown: true },
  "Crown Provincial": { rule: null, kind: "Provincial Crown land" },
  "Untitled Provincial": { rule: null, kind: "Untitled provincial Crown land" },
};

/** Owner types that are not open provincial Crown land. Used to filter the fall-zone parcel query. */
export const NON_CROWN_OWNER_TYPES = Object.entries(OWNER_TYPES)
  .filter(([, v]) => v.rule !== null)
  .map(([k]) => k);

/** Hunting regions by the name used in the wildlife management unit layer. */
export const REGION_BY_NAME: Record<string, string> = {
  "vancouver island": "1",
  "lower mainland": "2",
  thompson: "3",
  kootenay: "4",
  cariboo: "5",
  skeena: "6",
  omineca: "7A",
  peace: "7B",
  okanagan: "8",
};
