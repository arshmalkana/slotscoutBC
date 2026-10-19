import { evaluate, type EvaluationInput, type LatLon, type LayerData, type Profile, type SpotReport } from "@slotscout/engine";
import { data, digitisedNear } from "./data.js";
import { declination, fetchFederalProtected, fetchImageryInfo } from "./external.js";
import { WFS_LAYERS } from "./layerplan.js";
import { fetchRoadNotices } from "./roadNotices.js";
import { fetchCircleLayer, fetchPointLayers } from "./wfs.js";

/** Live request statistics per source, for the public source register page. */
export const sourceStats = new Map<string, { lastOk?: string; lastError?: string; lastErrorAt?: string; failures: number }>();

function record(sourceId: string, l: LayerData | { status: string; fetchedAt?: string; error?: string }) {
  const s = sourceStats.get(sourceId) ?? { failures: 0 };
  if (l.status === "ok") {
    s.lastOk = l.fetchedAt;
    s.failures = 0;
  } else if (l.status === "error") {
    s.lastError = l.error;
    s.lastErrorAt = new Date().toISOString();
    s.failures++;
  }
  sourceStats.set(sourceId, s);
}

/** Gather everything the engine needs for one point from live official sources. */
export async function buildInput(point: LatLon, profile: Profile, at: Date): Promise<EvaluationInput> {
  const year = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", year: "numeric" }).format(at));
  const pointSpecs = WFS_LAYERS.filter((s) => s.mode === "point");
  const circleSpecs = WFS_LAYERS.filter((s) => s.mode === "circle");

  const pointPromise = fetchPointLayers(pointSpecs, point, year);
  const circlePromise = Promise.all(circleSpecs.map(async (s) => [s.key, await fetchCircleLayer(s, point, profile.fallZoneM, year)] as const));
  const federalPromise = fetchFederalProtected(point, profile.fallZoneM);
  const imageryPromise = fetchImageryInfo(point);
  // Road notices need the district, which comes from the point bundle.
  const noticesPromise = pointPromise.then((m) => {
    const d = m.get("nr_districts")?.features[0]?.properties;
    return fetchRoadNotices(d?.ORG_UNIT as string | undefined, d?.DISTRICT_NAME as string | undefined);
  });

  const [pointLayers, circleLayers, federal, imagery, roadNotices] = await Promise.all([pointPromise, circlePromise, federalPromise, imageryPromise, noticesPromise]);

  const layers: Record<string, LayerData> = {};
  for (const [k, v] of pointLayers) if (k !== "nr_districts") layers[k] = v;
  for (const [k, v] of circleLayers) layers[k] = v;
  layers.federal_protected = federal;
  for (const l of Object.values(layers)) record(l.sourceId, l);
  record("road_notices", roadNotices);

  const province = layers.province;
  const inBC = province?.status === "ok" ? province.features.length > 0 : null;
  delete layers.province;

  const d = data();
  return {
    point,
    profile,
    at,
    release: d.release,
    inBC,
    layers,
    sources: d.sources,
    digitised: digitisedNear(point.lat, point.lon, profile.fallZoneM + 500),
    wildlifeCoverage: d.wildlifeCoverage,
    bylaws: d.bylaws,
    imagery,
    roadNotices,
    declinationDeg: declination(point, at),
  };
}

export async function checkPoint(point: LatLon, profile: Profile, at: Date): Promise<SpotReport> {
  return evaluate(await buildInput(point, profile, at));
}
