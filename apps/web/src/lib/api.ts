import type { LatLon, Light, Profile, RuleDefinition, SpotReport } from "@slotscout/engine";

export interface MapLayerInfo {
  id: string;
  label: string;
  light: string;
  description: string;
  ruleIds: string[];
  minzoom: number;
  defaultOn: boolean;
  tiles: string;
  legend: { label: string; color: string; pattern?: "hatch" | "dash" | "outline" | "casing" }[];
}

export interface SearchResult {
  label: string;
  sublabel: string;
  kind: "coordinates" | "place" | "address" | "rec_site" | "road" | "km_marker" | "boundary";
  lat: number;
  lon: number;
  bbox?: [number, number, number, number];
  note?: string;
}

export interface FinderCandidate {
  point: LatLon;
  distanceM: number;
  bearingDeg: number;
  direction: string;
  harvestYear: number;
  areaHa: number;
  verdict: SpotReport["verdict"];
  lights: Light[];
  bestBearingDeg: number | null;
  bestBearingMagneticDeg: number | null;
  nearestRoad?: string;
  nearestRoadM?: number;
  vehicle: string;
  notices: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      msg = ((await res.json()) as { error?: string }).error ?? msg;
    } catch {
      // keep default
    }
    throw new ApiError(msg, res.status);
  }
  return (await res.json()) as T;
}

export function profileParams(p: Profile): Record<string, string> {
  return { class: p.firearmClass, type: p.firearmType, activity: p.activity, fz: String(p.fallZoneM) };
}

export function fetchReport(point: LatLon, profile: Profile, date: string | undefined, signal?: AbortSignal): Promise<SpotReport> {
  const qs = new URLSearchParams({ lat: String(point.lat), lon: String(point.lon), ...profileParams(profile) });
  if (date) qs.set("date", date);
  return get<SpotReport>(`/v1/check?${qs}`, signal);
}

export const fetchMapLayers = () => get<{ layers: MapLayerInfo[] }>("/v1/map-layers").then((r) => r.layers);

export const searchPlaces = (q: string, signal?: AbortSignal) =>
  get<{ results: SearchResult[]; errors: string[] }>(`/v1/search?q=${encodeURIComponent(q)}`, signal);

export function findSpots(start: LatLon, radiusKm: number, profile: Profile, signal?: AbortSignal) {
  const qs = new URLSearchParams({ lat: String(start.lat), lon: String(start.lon), radius_km: String(radiusKm), ...profileParams(profile) });
  return get<{ radiusKm: number; candidates: FinderCandidate[]; screened: number; checked: number }>(`/v1/finder?${qs}`, signal);
}

export const fetchRules = () => get<{ rules: RuleDefinition[]; lights: { id: string; label: string }[] }>("/v1/rules");

export interface RegisterSource {
  id: string;
  name: string;
  owner: string;
  url: string;
  endpoint: string;
  layer: string;
  licence: string;
  access: string;
  robots: string;
  cadence: string;
  freshnessHours: number;
  rules: string[];
  contact: string;
  live: { lastOk?: string; lastError?: string; lastErrorAt?: string; failures: number } | null;
}

export const fetchRule = (id: string) =>
  get<{ rule: RuleDefinition; sources: RegisterSource[]; digitised: { features: unknown[] }; mapLayers: string[] }>(`/v1/rules/${encodeURIComponent(id)}`);

export const fetchSources = () => get<{ sources: RegisterSource[]; consolidation: { currentTo: string; lastAmended: string; amendingRegulation: string } }>("/v1/sources");

export interface CoverageResponse {
  wildlife: { region: string; name: string; status: string; confirmedOn?: string }[];
  consolidation: { currentTo: string; lastAmended: string; amendingRegulation: string };
  bylawCounts: Record<string, number>;
  bylaws: { key: string; kind: string; name: string; regionalDistrict?: string; status: string; bylaw?: { title?: string; number?: string; url?: string }; confirmedOn?: string }[];
}
export const fetchCoverage = () => get<CoverageResponse>("/v1/coverage");

export interface PipelineStatus {
  month: string;
  updatedAt: string;
  extractor: "api" | "agent" | "manual";
  autopublish: { configured: boolean; goldPasses: boolean; goldItems: number };
  pull: {
    startedAt: string;
    updatedAt: string;
    sources: Record<string, { status: string; detail: string }>;
    layers: number;
    layersMatching: number;
    failures: { source: string; what: string; error: string }[];
  } | null;
  changes: { comparedWith: string | null; new: number; changed: number; removed: number; unchanged: number };
  extraction: { tasks: number; waiting: number };
  rules: { approved: number; provisional: number; candidates: number; retired: number };
  review: { thisMonth: number; open: number; openAllMonths: number; looserOpen: number };
  tests: { regressionRan: boolean; regressionPassed: boolean; falseGreen: boolean } | null;
  release: { id: string; publishable: boolean; missing: string[] } | null;
}

/** The monthly pipeline's state; null before the pipeline has run. */
export async function fetchPipelineStatus(): Promise<PipelineStatus | null> {
  const res = await fetch("/v1/pipeline-status", { headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as PipelineStatus;
}

export const fetchReleases = () => get<{ current: { id: string; label: string; publishedOn: string; notes: string }; changelog: string }>("/v1/releases");

export async function sendProblemReport(body: Record<string, unknown>): Promise<{ ok: boolean; id?: string; error?: string }> {
  const res = await fetch("/v1/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return (await res.json()) as { ok: boolean; id?: string; error?: string };
}
