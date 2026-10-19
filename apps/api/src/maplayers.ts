import { NON_CROWN_OWNER_TYPES, type LightId } from "@slotscout/engine";

/**
 * Rule layers for the map's filter panel (PRD 2.4, 9.1). Rendered by the BC WMS with our own SLD
 * so they never use red, amber, grey or green, which are reserved for verdicts (PRD 9.2).
 */
interface PolygonStyle {
  kind: "polygon";
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth?: number;
  hatch?: "slash" | "times" | "backslash";
  outlineOnly?: boolean;
  dash?: [number, number];
}
interface Cond {
  property: string;
  value: string;
  op?: "eq" | "ne";
}
interface LineRule {
  /** All conditions must hold; rules are written so each feature matches exactly one. */
  filter?: Cond[] | "else";
  stroke: string;
  width: number;
  dash?: [number, number];
  casing?: { stroke: string; width: number };
  opacity?: number;
}
interface LineStyle {
  kind: "line";
  rules: LineRule[];
}

export interface MapLayer {
  id: string;
  label: string;
  light: LightId;
  description: string;
  ruleIds: string[];
  typeName: string;
  /** GeoServer CQL_FILTER applied to the WMS request. */
  cql?: string;
  style: PolygonStyle | LineStyle;
  minzoom: number;
  ttlMs: number;
  defaultOn?: boolean;
  /** Legend entries, for the panel. */
  legend: { label: string; color: string; pattern?: "hatch" | "dash" | "outline" | "casing" }[];
}

const H = 3600_000;

export const MAP_LAYERS: MapLayer[] = [
  {
    id: "bc_parks",
    label: "Provincial parks and protected areas",
    light: "parks",
    description: "Parks, conservancies, recreation areas, protected areas and ecological reserves.",
    ruleIds: ["P1", "P2"],
    typeName: "WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW",
    style: { kind: "polygon", fill: "#6d28d9", fillOpacity: 0.2, stroke: "#5b21b6", strokeWidth: 1.4, hatch: "slash" },
    minzoom: 4,
    ttlMs: 12 * H,
    defaultOn: true,
    legend: [{ label: "Provincial park or protected area", color: "#6d28d9", pattern: "hatch" }],
  },
  {
    id: "national_parks",
    label: "National parks",
    light: "federal",
    description: "National parks and national park reserves.",
    ruleIds: ["F3"],
    typeName: "WHSE_ADMIN_BOUNDARIES.CLAB_NATIONAL_PARKS",
    style: { kind: "polygon", fill: "#4c1d95", fillOpacity: 0.3, stroke: "#4c1d95", strokeWidth: 1.2, hatch: "times" },
    minzoom: 4,
    ttlMs: 24 * H,
    defaultOn: true,
    legend: [{ label: "National park", color: "#4c1d95", pattern: "hatch" }],
  },
  {
    id: "local_parks",
    label: "Regional and municipal parks",
    light: "local",
    description: "Local and regional greenspaces.",
    ruleIds: ["L4"],
    typeName: "WHSE_BASEMAPPING.GBA_LOCAL_REG_GREENSPACES_SP",
    style: { kind: "polygon", fill: "#a855f7", fillOpacity: 0.3, stroke: "#7e22ce", strokeWidth: 1 },
    minzoom: 9,
    ttlMs: 24 * H,
    defaultOn: true,
    legend: [{ label: "Regional or municipal park", color: "#a855f7" }],
  },
  {
    id: "reserves",
    label: "Reserves",
    light: "indigenous",
    description: "Indian reserves. Permission from the Nation is required.",
    ruleIds: ["I1"],
    typeName: "WHSE_ADMIN_BOUNDARIES.CLAB_INDIAN_RESERVES",
    style: { kind: "polygon", fill: "#a21caf", fillOpacity: 0.3, stroke: "#86198f", strokeWidth: 1.2, hatch: "backslash" },
    minzoom: 6,
    ttlMs: 24 * H,
    defaultOn: true,
    legend: [{ label: "Reserve", color: "#a21caf", pattern: "hatch" }],
  },
  {
    id: "treaty_lands",
    label: "Treaty settlement lands",
    light: "indigenous",
    description: "Modern treaty lands, where the Nation's laws apply.",
    ruleIds: ["I2"],
    typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_LAND_SP",
    style: { kind: "polygon", fill: "#c026d3", fillOpacity: 0.25, stroke: "#86198f", strokeWidth: 1 },
    minzoom: 6,
    ttlMs: 24 * H,
    defaultOn: true,
    legend: [{ label: "Treaty settlement land", color: "#c026d3" }],
  },
  {
    id: "private_land",
    label: "Private and other titled land",
    light: "ownership",
    description: "ParcelMap BC parcels that are not provincial Crown land: private, federal, local government, Crown agency, First Nations and unclassified.",
    ruleIds: ["O1", "O3", "F4"],
    typeName: "WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW",
    cql: `OWNER_TYPE IN (${NON_CROWN_OWNER_TYPES.map((t) => `'${t}'`).join(",")})`,
    style: { kind: "polygon", fill: "#1d4ed8", fillOpacity: 0.22, stroke: "#1e40af", strokeWidth: 0.6 },
    minzoom: 11,
    ttlMs: 24 * H,
    defaultOn: true,
    legend: [{ label: "Private or other titled land", color: "#1d4ed8" }],
  },
  {
    id: "rec_sites",
    label: "Recreation sites and interpretive forests",
    light: "recsites",
    description: "Active recreation sites. No shooting on or into the developed part; SlotScout adds 100 m.",
    ruleIds: ["P3"],
    typeName: "WHSE_FOREST_TENURE.FTEN_RECREATION_POLY_SVW",
    cql: "LIFE_CYCLE_STATUS_CODE = 'ACTIVE' AND PROJECT_TYPE <> 'Recreation Reserve'",
    style: { kind: "polygon", fill: "#db2777", fillOpacity: 0.3, stroke: "#be185d", strokeWidth: 1.2 },
    minzoom: 8,
    ttlMs: 24 * H,
    defaultOn: true,
    legend: [{ label: "Recreation site", color: "#db2777" }],
  },
  {
    id: "rec_trails",
    label: "Recreation trails",
    light: "recsites",
    description: "Active recreation trails.",
    ruleIds: ["P3", "S2"],
    typeName: "WHSE_FOREST_TENURE.FTEN_RECREATION_LINES_SVW",
    cql: "LIFE_CYCLE_STATUS_CODE = 'ACTIVE'",
    style: { kind: "line", rules: [{ stroke: "#db2777", width: 2, dash: [6, 3] }] },
    minzoom: 10,
    ttlMs: 24 * H,
    defaultOn: true,
    legend: [{ label: "Recreation trail", color: "#db2777", pattern: "dash" }],
  },
  {
    id: "fire_restrictions",
    label: "Wildfire area restrictions",
    light: "wildfire",
    description: "Areas closed to entry by a wildfire area restriction order.",
    ruleIds: ["P4"],
    typeName: "WHSE_LAND_AND_NATURAL_RESOURCE.PROT_RESTRICTED_AREAS_SP",
    style: { kind: "polygon", fill: "#831843", fillOpacity: 0.3, stroke: "#831843", strokeWidth: 1.5, hatch: "times" },
    minzoom: 4,
    ttlMs: 0.25 * H,
    defaultOn: true,
    legend: [{ label: "Area restriction (no entry)", color: "#831843", pattern: "hatch" }],
  },
  {
    id: "fire_current",
    label: "Active fire perimeters",
    light: "wildfire",
    description: "Current fire perimeters from the BC Wildfire Service.",
    ruleIds: ["P4", "S3"],
    typeName: "WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP",
    cql: "FIRE_STATUS <> 'Out'",
    style: { kind: "polygon", fill: "#9d174d", fillOpacity: 0.35, stroke: "#500724", strokeWidth: 1 },
    minzoom: 4,
    ttlMs: 0.25 * H,
    defaultOn: true,
    legend: [{ label: "Active fire", color: "#9d174d" }],
  },
  {
    id: "fire_bans",
    label: "Fire bans and prohibitions",
    light: "wildfire",
    description: "Areas under a fire ban. Read the order: exploding targets and tracers are often banned.",
    ruleIds: ["P5"],
    typeName: "WHSE_LAND_AND_NATURAL_RESOURCE.PROT_BANS_AND_PROHIBITIONS_SP",
    style: { kind: "polygon", fill: "#9f1239", fillOpacity: 0.06, stroke: "#9f1239", strokeWidth: 1.5, dash: [6, 4] },
    minzoom: 4,
    ttlMs: 0.25 * H,
    legend: [{ label: "Fire ban area", color: "#9f1239", pattern: "dash" }],
  },
  {
    id: "mvpr",
    label: "Motor vehicle closures",
    light: "access",
    description: "Motor Vehicle Prohibition Regulation areas, all year or seasonal.",
    ruleIds: ["P7"],
    typeName: "WHSE_WILDLIFE_MANAGEMENT.WAA_MVPR_AREAS_SP",
    style: { kind: "polygon", fill: "#4338ca", fillOpacity: 0.15, stroke: "#3730a3", strokeWidth: 1.2, hatch: "slash" },
    minzoom: 6,
    ttlMs: 24 * H,
    legend: [{ label: "Motor vehicle closure", color: "#4338ca", pattern: "hatch" }],
  },
  {
    id: "community_watersheds",
    label: "Community watersheds",
    light: "parks",
    description: "Drinking-water watersheds. Some have orders that bar entry.",
    ruleIds: ["P8"],
    typeName: "WHSE_WATER_MANAGEMENT.WLS_COMMUNITY_WS_PUB_SVW",
    style: { kind: "polygon", fill: "#0891b2", fillOpacity: 0.18, stroke: "#0e7490", strokeWidth: 1 },
    minzoom: 7,
    ttlMs: 24 * H,
    legend: [{ label: "Community watershed", color: "#0891b2" }],
  },
  {
    id: "fsr_roads",
    label: "Resource roads",
    light: "access",
    description: "Forest service roads (public, district-managed) and road permit roads (licensee-controlled; may be gated).",
    ruleIds: ["P6", "W13"],
    typeName: "WHSE_FOREST_TENURE.FTEN_ROAD_SECTION_LINES_SVW",
    style: {
      kind: "line",
      rules: [
        { filter: [{ property: "LIFE_CYCLE_STATUS_CODE", value: "RETIRED" }], stroke: "#64748b", width: 1, dash: [3, 3], opacity: 0.6 },
        {
          filter: [
            { property: "FILE_TYPE_DESCRIPTION", value: "Forest Service Road" },
            { property: "LIFE_CYCLE_STATUS_CODE", value: "RETIRED", op: "ne" },
          ],
          stroke: "#ffffff",
          width: 2.5,
          casing: { stroke: "#1f2937", width: 4.5 },
        },
        {
          filter: [
            { property: "FILE_TYPE_DESCRIPTION", value: "Road Permit" },
            { property: "LIFE_CYCLE_STATUS_CODE", value: "RETIRED", op: "ne" },
          ],
          stroke: "#ea580c",
          width: 2,
        },
        { filter: "else", stroke: "#ea580c", width: 1.5, dash: [5, 3] },
      ],
    },
    minzoom: 10,
    ttlMs: 24 * H,
    defaultOn: true,
    legend: [
      { label: "Forest service road", color: "#ffffff", pattern: "casing" },
      { label: "Road permit road", color: "#ea580c" },
      { label: "Special use or other permit road", color: "#ea580c", pattern: "dash" },
      { label: "Retired", color: "#64748b", pattern: "dash" },
    ],
  },
  {
    id: "cutblocks",
    label: "Cutblocks",
    light: "access",
    description: "Harvested cutblocks. Recent blocks can have active logging.",
    ruleIds: ["S4"],
    typeName: "WHSE_FOREST_VEGETATION.VEG_CONSOLIDATED_CUT_BLOCKS_SP",
    cql: "HARVEST_START_YEAR_CALENDAR >= 2000",
    style: { kind: "polygon", fill: "#78350f", fillOpacity: 0.05, stroke: "#78350f", strokeWidth: 1, outlineOnly: true },
    minzoom: 11,
    ttlMs: 24 * H,
    legend: [{ label: "Cutblock harvested since 2000", color: "#78350f", pattern: "outline" }],
  },
  {
    id: "municipalities",
    label: "Municipal boundaries",
    light: "local",
    description: "Municipalities. Most ban or limit firearm discharge.",
    ruleIds: ["L1"],
    typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP",
    style: { kind: "polygon", fill: "#111827", fillOpacity: 0.04, stroke: "#111827", strokeWidth: 1.6, outlineOnly: true },
    minzoom: 6,
    ttlMs: 24 * H,
    defaultOn: true,
    legend: [{ label: "Municipality", color: "#111827", pattern: "outline" }],
  },
  {
    id: "electoral_areas",
    label: "Regional district electoral areas",
    light: "local",
    description: "Regional district electoral areas, where regional bylaws apply.",
    ruleIds: ["L2"],
    typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_ELECTORAL_AREAS_SP",
    style: { kind: "polygon", fill: "#334155", fillOpacity: 0, stroke: "#334155", strokeWidth: 1, outlineOnly: true, dash: [8, 4] },
    minzoom: 6,
    ttlMs: 24 * H,
    legend: [{ label: "Electoral area", color: "#334155", pattern: "dash" }],
  },
  {
    id: "wmu",
    label: "Wildlife management units",
    light: "wildlife",
    description: "Management units, used by the Closed Areas Regulation and hunting seasons.",
    ruleIds: ["S6"],
    typeName: "WHSE_WILDLIFE_MANAGEMENT.WAA_WILDLIFE_MGMT_UNITS_SVW",
    style: { kind: "polygon", fill: "#0f172a", fillOpacity: 0, stroke: "#0f172a", strokeWidth: 1, outlineOnly: true, dash: [2, 3] },
    minzoom: 5,
    ttlMs: 24 * H,
    legend: [{ label: "Management unit", color: "#0f172a", pattern: "dash" }],
  },
  {
    id: "transmission",
    label: "Power lines",
    light: "fallzone",
    description: "Transmission lines. Never shoot towards power lines or insulators.",
    ruleIds: ["O4"],
    typeName: "WHSE_BASEMAPPING.GBA_TRANSMISSION_LINES_SP",
    style: { kind: "line", rules: [{ stroke: "#0f172a", width: 1.5, dash: [10, 2] }] },
    minzoom: 9,
    ttlMs: 24 * H,
    legend: [{ label: "Transmission line", color: "#0f172a", pattern: "dash" }],
  },
];

export const MAP_LAYERS_BY_ID = Object.fromEntries(MAP_LAYERS.map((l) => [l.id, l]));

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function css(name: string, value: string | number): string {
  return `<CssParameter name="${name}">${value}</CssParameter>`;
}

function polygonSymbolizer(s: PolygonStyle): string {
  const hatch = s.hatch
    ? `<Fill><GraphicFill><Graphic><Mark><WellKnownName>shape://${s.hatch}</WellKnownName><Stroke>${css("stroke", s.fill)}${css("stroke-width", 1)}${css("stroke-opacity", Math.min(1, s.fillOpacity + 0.45))}</Stroke></Mark><Size>10</Size></Graphic></GraphicFill></Fill>`
    : "";
  const fill = s.outlineOnly || s.hatch ? "" : `<Fill>${css("fill", s.fill)}${css("fill-opacity", s.fillOpacity)}</Fill>`;
  const stroke = `<Stroke>${css("stroke", s.stroke)}${css("stroke-width", s.strokeWidth ?? 1)}${s.dash ? css("stroke-dasharray", s.dash.join(" ")) : ""}</Stroke>`;
  const base = s.hatch ? `<PolygonSymbolizer><Fill>${css("fill", s.fill)}${css("fill-opacity", s.fillOpacity * 0.5)}</Fill></PolygonSymbolizer>` : "";
  return `${base}<PolygonSymbolizer>${fill}${hatch}${stroke}</PolygonSymbolizer>`;
}

function lineSymbolizers(r: LineRule): string {
  const one = (stroke: string, width: number, dash?: [number, number], opacity?: number) =>
    `<LineSymbolizer><Stroke>${css("stroke", stroke)}${css("stroke-width", width)}${dash ? css("stroke-dasharray", dash.join(" ")) : ""}${opacity !== undefined ? css("stroke-opacity", opacity) : ""}${css("stroke-linecap", "round")}</Stroke></LineSymbolizer>`;
  return (r.casing ? one(r.casing.stroke, r.casing.width) : "") + one(r.stroke, r.width, r.dash, r.opacity);
}

/** SLD for a layer, sent as SLD_BODY so the government server renders our palette. */
export function sldFor(layer: MapLayer): string {
  let rules: string;
  if (layer.style.kind === "polygon") {
    rules = `<Rule>${polygonSymbolizer(layer.style)}</Rule>`;
  } else {
    rules = layer.style.rules
      .map((r) => {
        let filter = "";
        if (r.filter === "else") filter = "<ElseFilter/>";
        else if (r.filter) {
          const conds = r.filter.map((c) => {
            const tag = c.op === "ne" ? "PropertyIsNotEqualTo" : "PropertyIsEqualTo";
            return `<ogc:${tag}><ogc:PropertyName>${c.property}</ogc:PropertyName><ogc:Literal>${esc(c.value)}</ogc:Literal></ogc:${tag}>`;
          });
          filter = `<ogc:Filter>${conds.length > 1 ? `<ogc:And>${conds.join("")}</ogc:And>` : conds[0]}</ogc:Filter>`;
        }
        return `<Rule>${filter}${lineSymbolizers(r)}</Rule>`;
      })
      .join("");
  }
  return `<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc"><NamedLayer><Name>pub:${layer.typeName}</Name><UserStyle><FeatureTypeStyle>${rules}</FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`;
}

/** EPSG:3857 bounds of a web map tile. */
export function tileBounds(z: number, x: number, y: number): [number, number, number, number] {
  const size = (2 * Math.PI * 6378137) / 2 ** z;
  const origin = Math.PI * 6378137;
  const minx = x * size - origin;
  const maxy = origin - y * size;
  return [minx, maxy - size, minx + size, maxy];
}
