import { ACCESS_RADIUS_M, NON_CROWN_OWNER_TYPES, type LayerKey } from "@slotscout/engine";

/**
 * How each engine layer is read from the BC Data Catalogue WFS.
 * "point" layers are bundled into one request that asks only "which features contain the pin".
 * "circle" layers return geometry for everything intersecting the search circle.
 */
export interface WfsLayerSpec {
  key: LayerKey | "nr_districts";
  sourceId: string;
  typeName: string;
  geom: "SHAPE" | "GEOMETRY";
  mode: "point" | "circle";
  props: string[];
  /** Extra CQL, combined with AND. Receives the check year. */
  filter?: (year: number) => string;
  /** Search radius for circle layers, from the fall-zone radius. */
  radius?: (fallZoneM: number) => number;
  maxFeatures?: number;
  /** Cache lifetime. Fast-changing wildfire layers are short. */
  ttlMs: number;
}

const H = 3600_000;
const fz = (r: number) => r;
const access = (r: number) => Math.max(r, ACCESS_RADIUS_M);

export const WFS_LAYERS: WfsLayerSpec[] = [
  { key: "province", sourceId: "province", typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_PROVINCE_SP", geom: "SHAPE", mode: "point", props: ["OBJECTID"], ttlMs: 24 * H },
  { key: "treaty_areas", sourceId: "treaty_areas", typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_AREA_SP", geom: "GEOMETRY", mode: "point", props: ["TREATY", "FIRST_NATION_NAME", "AREA_TYPE"], ttlMs: 6 * H },
  { key: "municipalities", sourceId: "municipalities", typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP", geom: "SHAPE", mode: "point", props: ["ADMIN_AREA_NAME", "ADMIN_AREA_GROUP_NAME", "WEBSITE_URL"], ttlMs: 6 * H },
  { key: "regional_districts", sourceId: "regional_districts", typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_REGIONAL_DISTRICTS_SP", geom: "SHAPE", mode: "point", props: ["ADMIN_AREA_NAME"], ttlMs: 6 * H },
  { key: "electoral_areas", sourceId: "electoral_areas", typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_ELECTORAL_AREAS_SP", geom: "SHAPE", mode: "point", props: ["ADMIN_AREA_NAME", "ADMIN_AREA_GROUP_NAME"], ttlMs: 6 * H },
  { key: "local_trust_areas", sourceId: "local_trust_areas", typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_LOCAL_TRUST_AREAS_SP", geom: "SHAPE", mode: "point", props: ["ADMIN_AREA_NAME"], ttlMs: 6 * H },
  { key: "fire_bans", sourceId: "fire_bans", typeName: "WHSE_LAND_AND_NATURAL_RESOURCE.PROT_BANS_AND_PROHIBITIONS_SP", geom: "SHAPE", mode: "point", props: ["TYPE", "ACCESS_PROHIBITION_DESCRIPTION", "BULLETIN_URL", "CATEGORY", "FIRE_CENTRE_NAME"], ttlMs: 0.25 * H },
  { key: "fire_history", sourceId: "fire_history", typeName: "WHSE_LAND_AND_NATURAL_RESOURCE.PROT_HISTORICAL_FIRE_POLYS_SP", geom: "SHAPE", mode: "point", props: ["FIRE_NUMBER", "FIRE_YEAR"], filter: (y) => `FIRE_YEAR >= ${y - 3}`, ttlMs: 6 * H },
  { key: "parcels_point", sourceId: "parcels", typeName: "WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW", geom: "SHAPE", mode: "point", props: ["OWNER_TYPE", "PARCEL_CLASS"], ttlMs: 6 * H },
  { key: "mvpr", sourceId: "mvpr", typeName: "WHSE_WILDLIFE_MANAGEMENT.WAA_MVPR_AREAS_SP", geom: "SHAPE", mode: "point", props: ["REGULATION_GEOGRAPHIC_NAME", "EFFECTIVE_DESCRIPTION", "PROHIBITION_TYPE", "MAP_NUMBER", "EXEMPTION"], ttlMs: 6 * H },
  { key: "wmu", sourceId: "wmu", typeName: "WHSE_WILDLIFE_MANAGEMENT.WAA_WILDLIFE_MGMT_UNITS_SVW", geom: "GEOMETRY", mode: "point", props: ["WILDLIFE_MGMT_UNIT_ID", "REGION_RESPONSIBLE_NAME", "REGION_RESPONSIBLE_ID", "GAME_MANAGEMENT_ZONE_NAME"], ttlMs: 24 * H },
  { key: "community_watersheds", sourceId: "community_watersheds", typeName: "WHSE_WATER_MANAGEMENT.WLS_COMMUNITY_WS_PUB_SVW", geom: "SHAPE", mode: "point", props: ["CW_NAME", "ORGANIZATION", "CW_STATUS"], ttlMs: 24 * H },
  { key: "crown_tenures", sourceId: "crown_tenures", typeName: "WHSE_TANTALIS.TA_CROWN_TENURES_SVW", geom: "SHAPE", mode: "point", props: ["TENURE_TYPE", "TENURE_SUBTYPE", "TENURE_PURPOSE", "TENURE_SUBPURPOSE", "TENURE_STATUS"], ttlMs: 6 * H },
  { key: "range_tenures", sourceId: "range_tenures", typeName: "WHSE_FOREST_TENURE.FTEN_RANGE_POLY_SVW", geom: "GEOMETRY", mode: "point", props: ["FOREST_FILE_ID", "LIFE_CYCLE_STATUS_CODE", "FILE_TYPE_CODE"], ttlMs: 6 * H },
  { key: "mineral_tenures", sourceId: "mineral_tenures", typeName: "WHSE_MINERAL_TENURE.MTA_ACQUIRED_TENURE_SVW", geom: "GEOMETRY", mode: "point", props: ["TENURE_TYPE_DESCRIPTION", "TENURE_SUB_TYPE_DESCRIPTION", "CLAIM_NAME"], ttlMs: 6 * H },
  { key: "nr_districts", sourceId: "nr_districts", typeName: "WHSE_ADMIN_BOUNDARIES.ADM_NR_DISTRICTS_SPG", geom: "SHAPE", mode: "point", props: ["ORG_UNIT", "DISTRICT_NAME"], ttlMs: 24 * H },

  { key: "national_parks", sourceId: "national_parks", typeName: "WHSE_ADMIN_BOUNDARIES.CLAB_NATIONAL_PARKS", geom: "GEOMETRY", mode: "circle", radius: fz, props: ["ENGLISH_NAME"], ttlMs: 6 * H },
  { key: "bc_parks", sourceId: "bc_parks", typeName: "WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW", geom: "SHAPE", mode: "circle", radius: fz, props: ["PROTECTED_LANDS_NAME", "PROTECTED_LANDS_CODE", "PROTECTED_LANDS_DESIGNATION", "ORCS_PRIMARY"], ttlMs: 6 * H },
  { key: "local_parks", sourceId: "local_parks", typeName: "WHSE_BASEMAPPING.GBA_LOCAL_REG_GREENSPACES_SP", geom: "SHAPE", mode: "circle", radius: fz, props: ["PARK_NAME", "PARK_TYPE", "WEBSITE_URL"], ttlMs: 6 * H },
  { key: "reserves", sourceId: "reserves", typeName: "WHSE_ADMIN_BOUNDARIES.CLAB_INDIAN_RESERVES", geom: "GEOMETRY", mode: "circle", radius: fz, props: ["ENGLISH_NAME"], ttlMs: 6 * H },
  { key: "treaty_lands", sourceId: "treaty_lands", typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_LAND_SP", geom: "GEOMETRY", mode: "circle", radius: fz, props: ["FIRST_NATION_NAME", "TREATY", "LAND_TYPE"], ttlMs: 6 * H },
  { key: "rec_sites", sourceId: "rec_sites", typeName: "WHSE_FOREST_TENURE.FTEN_RECREATION_POLY_SVW", geom: "GEOMETRY", mode: "circle", radius: fz, props: ["PROJECT_NAME", "PROJECT_TYPE", "FOREST_FILE_ID", "LIFE_CYCLE_STATUS_CODE"], ttlMs: 6 * H },
  { key: "rec_trails", sourceId: "rec_trails", typeName: "WHSE_FOREST_TENURE.FTEN_RECREATION_LINES_SVW", geom: "GEOMETRY", mode: "circle", radius: fz, props: ["PROJECT_NAME", "PROJECT_TYPE", "FOREST_FILE_ID", "LIFE_CYCLE_STATUS_CODE"], ttlMs: 6 * H },
  { key: "fire_restrictions", sourceId: "fire_restrictions", typeName: "WHSE_LAND_AND_NATURAL_RESOURCE.PROT_RESTRICTED_AREAS_SP", geom: "SHAPE", mode: "circle", radius: fz, props: ["NAME", "ACCESS_STATUS_EFFECTIVE_DATE", "BULLETIN_URL", "FIRE_CENTRE_NAME"], ttlMs: 0.25 * H },
  { key: "fire_current", sourceId: "fire_current", typeName: "WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP", geom: "SHAPE", mode: "circle", radius: fz, props: ["FIRE_NUMBER", "FIRE_STATUS", "FIRE_URL", "FIRE_YEAR"], ttlMs: 0.25 * H },
  {
    key: "parcels_nearby",
    sourceId: "parcels",
    typeName: "WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW",
    geom: "SHAPE",
    mode: "circle",
    radius: fz,
    props: ["OWNER_TYPE"],
    filter: () => `OWNER_TYPE IN (${NON_CROWN_OWNER_TYPES.map((t) => `'${t}'`).join(",")})`,
    maxFeatures: 2500,
    ttlMs: 6 * H,
  },
  { key: "fsr_roads", sourceId: "fsr_roads", typeName: "WHSE_FOREST_TENURE.FTEN_ROAD_SECTION_LINES_SVW", geom: "GEOMETRY", mode: "circle", radius: access, props: ["FOREST_FILE_ID", "ROAD_SECTION_ID", "ROAD_SECTION_NAME", "FILE_TYPE_DESCRIPTION", "LIFE_CYCLE_STATUS_CODE", "CLIENT_NAME", "GEOGRAPHIC_DISTRICT_NAME"], maxFeatures: 3000, ttlMs: 6 * H },
  { key: "dra_roads", sourceId: "dra_roads", typeName: "WHSE_BASEMAPPING.DRA_DGTL_ROAD_ATLAS_MPAR_SP", geom: "GEOMETRY", mode: "circle", radius: access, props: ["ROAD_NAME_FULL", "ROAD_CLASS", "ROAD_SURFACE", "NUMBER_OF_LANES"], maxFeatures: 6000, ttlMs: 6 * H },
  { key: "cutblocks", sourceId: "cutblocks", typeName: "WHSE_FOREST_VEGETATION.VEG_CONSOLIDATED_CUT_BLOCKS_SP", geom: "SHAPE", mode: "circle", radius: fz, props: ["HARVEST_START_YEAR_CALENDAR", "PERCENT_CLEARCUT", "AREA_HA"], filter: (y) => `HARVEST_START_YEAR_CALENDAR >= ${y - 5}`, maxFeatures: 2000, ttlMs: 6 * H },
  { key: "transmission", sourceId: "transmission", typeName: "WHSE_BASEMAPPING.GBA_TRANSMISSION_LINES_SP", geom: "SHAPE", mode: "circle", radius: fz, props: ["CIRCUIT_NAME", "OWNER", "VOLTAGE"], ttlMs: 24 * H },
  { key: "pipelines", sourceId: "pipelines", typeName: "WHSE_MINERAL_TENURE.OG_PIPELINE_SEGMENT_PERMIT_SP", geom: "SHAPE", mode: "circle", radius: fz, props: ["PROPONENT", "STATUS", "LINE_TYPE_DESC"], ttlMs: 24 * H },
  { key: "railways", sourceId: "railways", typeName: "WHSE_BASEMAPPING.GBA_RAILWAY_TRACKS_SP", geom: "SHAPE", mode: "circle", radius: fz, props: ["OWNER_NAME", "OPERATOR_ENGLISH_NAME", "STATUS"], ttlMs: 24 * H },
  { key: "buildings", sourceId: "buildings", typeName: "WHSE_BASEMAPPING.TRIM_EBM_BUILDINGS", geom: "GEOMETRY", mode: "circle", radius: fz, props: ["FEATURE_TYPE"], maxFeatures: 2500, ttlMs: 24 * H },
];
