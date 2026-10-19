import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Feature, Geometry, Position } from "geojson";
import { parse as parseYaml } from "yaml";
import type { BylawEntry, DigitisedRuleProps, RegionCoverage, ReleaseInfo, RoadNotice, SourceInfo } from "@slotscout/engine";
import { config } from "./config.js";

export interface RegisterSource extends SourceInfo {
  endpoint: string;
  layer: string;
  access: string;
  robots: string;
  cadence: string;
  rules: string[];
  contact: string;
  pull?: string;
  method?: string;
  status?: string;
}

export interface DigitisedFeature extends Feature<Geometry, DigitisedRuleProps> {
  bbox: [number, number, number, number];
}

/** A road notice as the pipeline keeps it (Addendum A 5.2): listed, or gone from the page and waiting for a person. */
export interface StoredNotice extends RoadNotice {
  orgUnit: string;
  firstSeen: string;
  lastSeen: string;
  approvedBy?: string | null;
  approvedOn?: string | null;
}

/** Page text the parser could not tie to a road; it stops greying P6 once a person has read it. */
export interface StoredBlock {
  orgUnit: string;
  key: string;
  text: string;
  status: "open" | "read";
  readBy?: string | null;
  readOn?: string | null;
}

export interface NoticeStore {
  updatedAt: string | null;
  notices: StoredNotice[];
  blocks?: StoredBlock[];
}

export interface DataStore {
  release: ReleaseInfo;
  sources: Record<string, RegisterSource>;
  sourceList: RegisterSource[];
  wildlifeCoverage: RegionCoverage[];
  consolidation: { currentTo: string; lastAmended: string; amendingRegulation: string };
  bylaws: BylawEntry[];
  digitised: DigitisedFeature[];
  notices: NoticeStore;
  loadedAt: string;
  /** Newest modification time of the files read, to notice pipeline updates. */
  stamp: number;
}

async function json<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

function bboxOf(g: Geometry): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visit = (c: unknown): void => {
    if (typeof (c as Position)[0] === "number") {
      const [x, y] = c as Position;
      minX = Math.min(minX, x!);
      maxX = Math.max(maxX, x!);
      minY = Math.min(minY, y!);
      maxY = Math.max(maxY, y!);
    } else (c as unknown[]).forEach(visit);
  };
  if (g.type === "GeometryCollection") g.geometries.forEach((gg) => visit((gg as { coordinates: unknown }).coordinates));
  else visit(g.coordinates);
  return [minX, minY, maxX, maxY];
}

/** The register is YAML with snake_case keys, shared with the pipeline. */
export function registerFromYaml(text: string): RegisterSource[] {
  const doc = parseYaml(text) as { sources: Record<string, unknown>[] };
  return doc.sources.map((s) => ({
    id: String(s.id),
    name: String(s.name),
    owner: String(s.owner),
    url: String(s.url),
    licence: String(s.licence ?? ""),
    freshnessHours: Number(s.freshness_hours),
    endpoint: String(s.endpoint ?? ""),
    layer: String(s.layer ?? ""),
    access: String(s.access ?? ""),
    robots: String(s.robots ?? ""),
    cadence: String(s.cadence ?? ""),
    rules: (s.rules as string[] | undefined) ?? [],
    contact: String(s.contact ?? ""),
    pull: s.pull ? String(s.pull) : undefined,
    method: s.method ? String(s.method) : undefined,
    status: s.status ? String(s.status) : undefined,
  }));
}

async function inputFiles(): Promise<string[]> {
  const rules = (await readdir(config.rulesDir).catch(() => [] as string[])).filter((f) => f.endsWith(".geojson") || f === "road-notices.json").map((f) => join(config.rulesDir, f));
  return [
    config.registryFile,
    join(config.dataDir, "release.json"),
    join(config.dataDir, "wildlife-coverage.json"),
    join(config.dataDir, "bylaws.json"),
    ...rules,
  ];
}

async function stampOf(files: string[]): Promise<number> {
  const times = await Promise.all(files.map((f) => stat(f).then((s) => s.mtimeMs).catch(() => 0)));
  return Math.max(0, ...times) + files.length;
}

let store: DataStore | null = null;

export async function loadData(): Promise<DataStore> {
  const files = await inputFiles();
  const [release, registry, coverage, bylaws] = await Promise.all([
    json<ReleaseInfo>(join(config.dataDir, "release.json")),
    readFile(config.registryFile, "utf8").then(registerFromYaml),
    json<{ regions: RegionCoverage[]; consolidation: DataStore["consolidation"] }>(join(config.dataDir, "wildlife-coverage.json")),
    json<{ entries: BylawEntry[] }>(join(config.dataDir, "bylaws.json")),
  ]);
  const digitised: DigitisedFeature[] = [];
  for (const file of files.filter((f) => f.endsWith(".geojson")).sort()) {
    const fc = await json<{ features: Feature<Geometry, DigitisedRuleProps>[] }>(file);
    for (const f of fc.features ?? []) {
      // Retired features and looser candidates never reach a check; the engine sorts out the rest.
      if (!f.geometry || f.properties.status === "retired") continue;
      digitised.push({ ...f, bbox: bboxOf(f.geometry) });
    }
  }
  let notices: NoticeStore = { updatedAt: null, notices: [] };
  try {
    notices = await json<NoticeStore>(join(config.rulesDir, "road-notices.json"));
  } catch {
    // The pipeline has not built the notice store yet; live pages still work.
  }
  store = {
    release,
    sources: Object.fromEntries(registry.map((s) => [s.id, s])),
    sourceList: registry,
    wildlifeCoverage: coverage.regions,
    consolidation: coverage.consolidation,
    bylaws: bylaws.entries,
    digitised,
    notices,
    loadedAt: new Date().toISOString(),
    stamp: await stampOf(files),
  };
  return store;
}

/** Reloads when the pipeline has written new rule or register files; keeps the old data on any error. */
export async function reloadIfChanged(log?: (msg: string) => void): Promise<boolean> {
  try {
    const stamp = await stampOf(await inputFiles());
    if (store && stamp === store.stamp) return false;
    await loadData();
    log?.(`data reloaded (${store!.digitised.length} digitised features, ${store!.notices.notices.length} stored notices)`);
    return true;
  } catch (e) {
    log?.(`data reload failed, keeping the previous data: ${(e as Error).message}`);
    return false;
  }
}

export function data(): DataStore {
  if (!store) throw new Error("Data not loaded");
  return store;
}

/** Digitised features whose bounding box comes within the radius of a point. */
export function digitisedNear(lat: number, lon: number, radiusM: number): DigitisedFeature[] {
  const dLat = radiusM / 111_000;
  const dLon = dLat / Math.cos((lat * Math.PI) / 180);
  return data().digitised.filter((f) => f.bbox[0] <= lon + dLon && f.bbox[2] >= lon - dLon && f.bbox[1] <= lat + dLat && f.bbox[3] >= lat - dLat);
}
