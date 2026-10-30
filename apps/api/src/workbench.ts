import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ContributionView } from "@slotscout/engine";
import { featureState } from "@slotscout/engine";
import { listContributions } from "./contributions.js";
import { config } from "./config.js";
import { data } from "./data.js";
import { simplifyGeometry } from "./display.js";
import { getJson } from "./http.js";

/**
 * The map editor's API: the folders (not done, not confirmed, confirmed) the pipeline wrote in data/workbench,
 * updated with what people have sent and confirmed since; one item's legal wording, findings and pictures with its
 * current shapes and contributions; and two drawing helpers that read the official layers (an area's boundary, and
 * roads, waters, parks, reserves, district lots or places found by name).
 */
export type Kind = "closed-areas" | "bylaws";
type Folder = "not_done" | "not_confirmed" | "confirmed";
interface IndexItem {
  id: string;
  key?: string;
  folder: Folder;
  state: string;
  [k: string]: unknown;
}

const dir = () => join(config.dataDir, "workbench");
const readJson = async <T>(f: string): Promise<T> => JSON.parse(await readFile(f, "utf8")) as T;

/** Where a contribution moves an item: a sent drawing makes "not done" at least "not confirmed"; an exact confirmed one, "confirmed". */
export function withContributions(item: IndexItem, cs: ContributionView[]): IndexItem {
  const live = cs.filter((c) => c.status !== "rejected");
  const waiting = live.filter((c) => c.status === "waiting").length;
  const confirmed = live.filter((c) => c.status === "confirmed");
  let { folder, state } = item;
  if (confirmed.some((c) => c.exact || c.kind === "bylaw")) {
    folder = "confirmed";
    state = "Confirmed in the map editor; goes live with the next data update";
  } else if (confirmed.length && folder !== "confirmed") {
    folder = "not_confirmed";
    state = "Approximate drawing confirmed; goes live with the next data update";
  } else if (waiting && folder === "not_done") {
    folder = "not_confirmed";
    state = `${waiting} contribution${waiting > 1 ? "s" : ""} waiting for a second person`;
  }
  return { ...item, folder, state, waiting, contributions: live.length };
}

export async function workbenchIndex(kind: Kind) {
  const idx = await readJson<{ month: string; builtAt: string; items: IndexItem[] }>(join(dir(), `${kind}.json`));
  const cs = await listContributions({ kind: undefined });
  const byTarget = new Map<string, ContributionView[]>();
  for (const c of cs) {
    if ((kind === "closed-areas") !== (c.kind === "closed_area")) continue;
    byTarget.set(c.target, [...(byTarget.get(c.target) ?? []), c]);
  }
  const items = idx.items.map((i) => withContributions(i, byTarget.get(kind === "closed-areas" ? i.id : String(i.key)) ?? []));
  const counts = { not_done: 0, not_confirmed: 0, confirmed: 0 };
  for (const i of items) counts[i.folder]++;
  return { month: idx.month, builtAt: idx.builtAt, counts, items };
}

const SHAPE_PROPS = ["rule_id", "status", "version", "effect", "approximate", "approximate_quality", "approximate_tolerance_m", "digitised_by", "digitised_on", "reviewed_by", "reviewed_on", "notes", "jurisdiction", "contribution_id"];

export async function workbenchItem(kind: Kind, id: string) {
  if (!/^[A-Za-z0-9.-]+$/.test(id)) return null;
  let detail: Record<string, unknown>;
  try {
    detail = await readJson<Record<string, unknown>>(join(dir(), kind, `${id}.json`));
  } catch {
    return null;
  }
  const target = kind === "closed-areas" ? id : String(detail.key);
  const shapes = data().digitised.filter((f) =>
    kind === "closed-areas" ? f.properties.rule_id === id : (f.properties as unknown as Record<string, unknown>).jurisdiction === target,
  );
  const features = shapes
    .filter((f) => featureState(f) !== "ignore" || f.properties.status === "candidate")
    .map((f) => ({ type: "Feature" as const, geometry: f.geometry, properties: Object.fromEntries(SHAPE_PROPS.map((k) => [k, (f.properties as unknown as Record<string, unknown>)[k] ?? null])) }));
  const contributions = await listContributions({ target });
  const { folder, state } = withContributions({ id, folder: detail.folder as Folder, state: String(detail.state) }, contributions);
  return { ...detail, folder, state, shapes: { type: "FeatureCollection", features }, contributions };
}

export async function workbenchImage(file: string): Promise<{ body: Buffer; type: string } | null> {
  if (!/^[a-z0-9][a-z0-9.-]*\.(jpg|webp)$/.test(file)) return null;
  try {
    return { body: await readFile(join(dir(), "img", file)), type: file.endsWith(".webp") ? "image/webp" : "image/jpeg" };
  } catch {
    return null;
  }
}

// --- Drawing helpers: official layers ---------------------------------------------------------------------------

const esc = (s: string) => s.replace(/'/g, "''");
type Fc = { features: { type: "Feature"; geometry: GeoJSON.Geometry | null; properties: Record<string, unknown> }[] };

async function wfs(typeName: string, cql: string, count: number, props: string[], geom: string): Promise<Fc> {
  const u = new URL(config.wfsUrl);
  u.search = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: `pub:${typeName}`,
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    count: String(count),
    CQL_FILTER: cql,
    propertyName: [...props, geom].join(","),
  }).toString();
  return (await getJson<Fc>(u.toString(), { ttlMs: 6 * 3600_000, timeoutMs: 45_000 })).data;
}

const BOUNDARY: Record<string, { typeName: string; field: string; geom: string }> = {
  municipality: { typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP", field: "ADMIN_AREA_NAME", geom: "SHAPE" },
  electoral_area: { typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_ELECTORAL_AREAS_SP", field: "ADMIN_AREA_NAME", geom: "SHAPE" },
  local_trust_area: { typeName: "WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_LOCAL_TRUST_AREAS_SP", field: "ADMIN_AREA_NAME", geom: "SHAPE" },
  wmu: { typeName: "WHSE_WILDLIFE_MANAGEMENT.WAA_WILDLIFE_MGMT_UNITS_SVW", field: "WILDLIFE_MGMT_UNIT_ID", geom: "GEOMETRY" },
};

/** One area's official boundary (a municipality, electoral area, trust area or management unit), lightly simplified. */
export async function boundary(kind: string, name: string) {
  const spec = BOUNDARY[kind];
  if (!spec || !name || name.length > 120) return null;
  const value = kind === "wmu" ? name.replace(/^0*(\d+)-0*(\d+)$/, "$1-$2") : name;
  const fc = await wfs(spec.typeName, `${spec.field}='${esc(value)}'`, 5, [spec.field], spec.geom);
  return { type: "FeatureCollection", features: fc.features.filter((f) => f.geometry).map((f) => ({ ...f, geometry: simplifyGeometry(f.geometry!, 0.0002) })) };
}

const LOOKUP: Record<string, { typeName: string; field: string; geom: string; label: string[]; needsBox?: boolean; exact?: (n: string) => string }[]> = {
  road: [
    { typeName: "WHSE_BASEMAPPING.DRA_DGTL_ROAD_ATLAS_MPAR_SP", field: "ROAD_NAME_FULL", geom: "GEOMETRY", label: ["ROAD_NAME_FULL"], needsBox: true },
    { typeName: "WHSE_FOREST_TENURE.FTEN_ROAD_SECTION_LINES_SVW", field: "ROAD_SECTION_NAME", geom: "GEOMETRY", label: ["ROAD_SECTION_NAME", "FOREST_FILE_ID"], needsBox: true },
  ],
  water: [
    { typeName: "WHSE_BASEMAPPING.FWA_LAKES_POLY", field: "GNIS_NAME_1", geom: "GEOMETRY", label: ["GNIS_NAME_1"] },
    { typeName: "WHSE_BASEMAPPING.FWA_RIVERS_POLY", field: "GNIS_NAME_1", geom: "GEOMETRY", label: ["GNIS_NAME_1"], needsBox: true },
    { typeName: "WHSE_BASEMAPPING.FWA_STREAM_NETWORKS_SP", field: "GNIS_NAME", geom: "GEOMETRY", label: ["GNIS_NAME"], needsBox: true },
  ],
  park: [{ typeName: "WHSE_TANTALIS.TA_PARK_ECORES_PA_SVW", field: "PROTECTED_LANDS_NAME", geom: "SHAPE", label: ["PROTECTED_LANDS_NAME"] }],
  reserve: [{ typeName: "WHSE_ADMIN_BOUNDARIES.CLAB_INDIAN_RESERVES", field: "ENGLISH_NAME", geom: "GEOMETRY", label: ["ENGLISH_NAME"] }],
  lot: [
    {
      typeName: "WHSE_TANTALIS.TA_SURVEY_PARCELS_SVW",
      field: "PARCEL_SHORT_DESCRIPTION",
      geom: "SHAPE",
      label: ["PARCEL_LEGAL_DESCRIPTION"],
      needsBox: true,
      exact: (n) => `DL ${n.replace(/^(district\s+)?(lot|dl|l\.?)\s*/i, "").toUpperCase()}`,
    },
  ],
  place: [{ typeName: "WHSE_BASEMAPPING.GNS_GEOGRAPHICAL_NAMES_SP", field: "GEOGRAPHICAL_NAME", geom: "GEOMETRY", label: ["GEOGRAPHICAL_NAME", "FEATURE_TYPE"] }],
};

/** Official features by name, for the drawing tools ("add this road with a 400 m buffer"). */
export async function lookupFeatures(type: string, name: string, bbox: number[] | null) {
  const specs = LOOKUP[type];
  if (!specs) throw new Error("type must be road, water, park, reserve, lot or place");
  const n = name.trim();
  if (n.length < 2 || n.length > 100) throw new Error("name is required");
  const box = bbox && bbox.length === 4 && bbox.every(Number.isFinite) ? bbox : null;
  for (const s of specs) {
    if (s.needsBox && !box) continue;
    const where = [s.exact ? `${s.field}='${esc(s.exact(n))}'` : `${s.field} ILIKE '%${esc(n)}%'`, box ? `BBOX(${s.geom},${box.join(",")},'EPSG:4326')` : ""].filter(Boolean).join(" AND ");
    const fc = await wfs(s.typeName, where, 400, s.label, s.geom);
    const features = fc.features.filter((f) => f.geometry);
    if (!features.length) continue;
    return {
      layer: s.typeName,
      features: features.map((f) => ({
        type: "Feature",
        geometry: simplifyGeometry(f.geometry!, 0.00004),
        properties: { label: s.label.map((k) => f.properties[k]).filter(Boolean).join(" · ") },
      })),
    };
  }
  return { layer: null, features: [], note: specs.some((s) => s.needsBox) && !box ? "zoom the map to the area first" : "nothing with that name here" };
}
