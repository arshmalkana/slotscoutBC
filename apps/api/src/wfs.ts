import type { Feature, FeatureCollection, Geometry } from "geojson";
import { circlePolygon, type LatLon, type LayerData } from "@slotscout/engine";
import { config } from "./config.js";
import { errorText, getJson } from "./http.js";
import type { WfsLayerSpec } from "./layerplan.js";

type Props = Record<string, unknown>;
interface WfsCollection extends FeatureCollection<Geometry | null, Props> {
  numberMatched?: number | "unknown";
  numberReturned?: number;
  totalFeatures?: number | "unknown";
}

function pointWkt(p: LatLon): string {
  return `SRID=4326;POINT(${p.lon} ${p.lat})`;
}

function polygonWkt(ring: LatLon[]): string {
  return `SRID=4326;POLYGON((${ring.map((p) => `${p.lon.toFixed(6)} ${p.lat.toFixed(6)}`).join(",")}))`;
}

function qs(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
}

function layerOk(spec: { sourceId: string }, features: Feature<Geometry | null, Props>[], fetchedAt: string, truncated = false): LayerData {
  return { sourceId: spec.sourceId, status: "ok", fetchedAt, features, truncated };
}

function layerError(spec: { sourceId: string }, e: unknown): LayerData {
  return { sourceId: spec.sourceId, status: "error", error: errorText(e), features: [] };
}

/**
 * One WFS 1.1.0 request asking, for every point layer at once, which features contain the pin.
 * No geometry is returned; the server's own exact intersection test is the answer.
 * If the bundle fails, each layer is retried on its own so one bad layer cannot hide the rest.
 */
export async function fetchPointLayers(specs: WfsLayerSpec[], point: LatLon, year: number): Promise<Map<string, LayerData>> {
  const out = new Map<string, LayerData>();
  const filterFor = (s: WfsLayerSpec) => [`INTERSECTS(${s.geom},${pointWkt(point)})`, s.filter?.(year)].filter(Boolean).join(" AND ");
  const url = (group: WfsLayerSpec[]) =>
    `${config.wfsUrl}?${qs({
      service: "WFS",
      version: "1.1.0",
      request: "GetFeature",
      outputFormat: "application/json",
      typeName: group.map((s) => `pub:${s.typeName}`).join(","),
      CQL_FILTER: group.map(filterFor).join(";"),
      propertyName: group.map((s) => `(${s.props.join(",")})`).join(""),
    })}`;
  const ttl = Math.min(...specs.map((s) => s.ttlMs));
  try {
    const { data, fetchedAt } = await getJson<WfsCollection>(url(specs), { ttlMs: ttl });
    for (const s of specs) out.set(s.key, layerOk(s, [], fetchedAt));
    for (const f of data.features ?? []) {
      const prefix = String(f.id ?? "").split(".").slice(0, 2).join(".");
      const spec = specs.find((s) => s.typeName === prefix);
      if (spec) out.get(spec.key)!.features.push({ type: "Feature", geometry: null, properties: f.properties ?? {} });
    }
    return out;
  } catch {
    await Promise.all(
      specs.map(async (s) => {
        try {
          const { data, fetchedAt } = await getJson<WfsCollection>(url([s]), { ttlMs: s.ttlMs });
          out.set(s.key, layerOk(s, (data.features ?? []).map((f) => ({ type: "Feature", geometry: null, properties: f.properties ?? {} })), fetchedAt));
        } catch (e) {
          out.set(s.key, layerError(s, e));
        }
      }),
    );
    return out;
  }
}

/** Snap a centre to a ~100 m grid so nearby pins share cached responses; the radius grows to cover the snap. */
const SNAP_DEG = 0.001;
const SNAP_PAD_M = 120;

export async function fetchCircleLayer(spec: WfsLayerSpec, point: LatLon, fallZoneM: number, year: number): Promise<LayerData> {
  const radius = (spec.radius?.(fallZoneM) ?? fallZoneM) + SNAP_PAD_M;
  const center = { lat: Math.round(point.lat / SNAP_DEG) * SNAP_DEG, lon: Math.round(point.lon / SNAP_DEG) * SNAP_DEG };
  // Round the radius up so small fall-zone edits reuse the cache.
  const r = Math.ceil(radius / 250) * 250;
  const ring = circlePolygon(center, r, 32);
  const cql = [`INTERSECTS(${spec.geom},${polygonWkt(ring)})`, spec.filter?.(year)].filter(Boolean).join(" AND ");
  const count = spec.maxFeatures ?? 1500;
  const url = `${config.wfsUrl}?${qs({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    typeNames: `pub:${spec.typeName}`,
    CQL_FILTER: cql,
    propertyName: [...spec.props, spec.geom].join(","),
    count: String(count),
  })}`;
  try {
    const { data, fetchedAt } = await getJson<WfsCollection>(url, { ttlMs: spec.ttlMs });
    const features = (data.features ?? []).map((f) => ({ type: "Feature" as const, geometry: f.geometry, properties: f.properties ?? {} }));
    const matched = typeof data.numberMatched === "number" ? data.numberMatched : typeof data.totalFeatures === "number" ? data.totalFeatures : features.length;
    return layerOk(spec, features, fetchedAt, matched > features.length || features.length >= count);
  } catch (e) {
    return layerError(spec, e);
  }
}

/** Generic attribute search, used by place search (rec sites, FSR names). */
export async function wfsSearch(typeName: string, cql: string, props: string[], count: number, ttlMs: number): Promise<Feature<Geometry | null, Props>[]> {
  const url = `${config.wfsUrl}?${qs({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    typeNames: `pub:${typeName}`,
    CQL_FILTER: cql,
    propertyName: props.join(","),
    count: String(count),
  })}`;
  const { data } = await getJson<WfsCollection>(url, { ttlMs });
  return data.features ?? [];
}
