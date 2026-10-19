import type { Feature, Geometry } from "geojson";
import geomagnetism from "geomagnetism";
import { bboxAround, type ImageryInfo, type LatLon, type LayerData } from "@slotscout/engine";
import { config } from "./config.js";
import { errorText, getJson } from "./http.js";

const H = 3600_000;

/** Federal migratory bird sanctuaries and national wildlife areas in BC, from ECCC's CPCAD (rule F6). */
export async function fetchFederalProtected(point: LatLon, radiusM: number): Promise<LayerData> {
  const snap = 0.001;
  const c = { lat: Math.round(point.lat / snap) * snap, lon: Math.round(point.lon / snap) * snap };
  const [w, s, e, n] = bboxAround(c, Math.ceil((radiusM + 150) / 250) * 250);
  const params = new URLSearchParams({
    where: "LOC=2 AND TYPE_E IN ('Migratory Bird Sanctuary','National Wildlife Area','Marine National Wildlife Area')",
    geometry: `${w.toFixed(5)},${s.toFixed(5)},${e.toFixed(5)},${n.toFixed(5)}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "NAME_E,TYPE_E,MGMT_E",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });
  try {
    const { data, fetchedAt } = await getJson<{ features?: Feature<Geometry, Record<string, unknown>>[]; error?: { message: string } }>(
      `${config.cpcadUrl}?${params}`,
      { ttlMs: 24 * H },
    );
    if (data.error) throw new Error(data.error.message);
    return { sourceId: "federal_protected", status: "ok", fetchedAt, features: data.features ?? [] };
  } catch (err) {
    return { sourceId: "federal_protected", status: "error", error: errorText(err), features: [] };
  }
}

interface IdentifyResult {
  results?: { layerId: number; attributes: Record<string, string> }[];
}

/** Capture date of the World Imagery tile under the point (PRD 7.2). */
export async function fetchImageryInfo(point: LatLon): Promise<ImageryInfo> {
  const d = 0.005;
  const params = new URLSearchParams({
    geometry: `${point.lon},${point.lat}`,
    geometryType: "esriGeometryPoint",
    sr: "4326",
    layers: "all",
    tolerance: "1",
    mapExtent: `${point.lon - d},${point.lat - d},${point.lon + d},${point.lat + d}`,
    imageDisplay: "400,400,96",
    returnGeometry: "false",
    f: "json",
  });
  try {
    const { data } = await getJson<IdentifyResult>(`${config.imageryIdentifyUrl}?${params}`, { ttlMs: 24 * H, timeoutMs: 8000 });
    const dated = (data.results ?? [])
      .map((r) => r.attributes)
      .filter((a) => /^\d{8}$/.test(a["DATE (YYYYMMDD)"] ?? ""))
      .sort((a, b) => Number(a["RESOLUTION (M)"] ?? 99) - Number(b["RESOLUTION (M)"] ?? 99));
    const best = dated[0];
    if (!best) return { provider: "Esri World Imagery" };
    const raw = best["DATE (YYYYMMDD)"]!;
    return {
      provider: "Esri World Imagery",
      captureDate: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
      resolutionM: Number(best["RESOLUTION (M)"]) || undefined,
      source: best.SOURCE || best.SOURCE_INFO || undefined,
    };
  } catch (e) {
    return { provider: "Esri World Imagery", error: errorText(e) };
  }
}

/** Magnetic declination from the World Magnetic Model 2025, degrees east positive. */
export function declination(point: LatLon, at: Date): number | undefined {
  try {
    const model = geomagnetism.model(at, { allowOutOfBoundsModel: true });
    return model.point([point.lat, point.lon]).decl;
  } catch {
    return undefined;
  }
}
