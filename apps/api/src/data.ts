import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Feature, Geometry, Position } from "geojson";
import type { BylawEntry, DigitisedRuleProps, RegionCoverage, ReleaseInfo, SourceInfo } from "@slotscout/engine";
import { config } from "./config.js";

export interface RegisterSource extends SourceInfo {
  endpoint: string;
  layer: string;
  access: string;
  robots: string;
  cadence: string;
  rules: string[];
  contact: string;
}

export interface DigitisedFeature extends Feature<Geometry, DigitisedRuleProps> {
  bbox: [number, number, number, number];
}

export interface DataStore {
  release: ReleaseInfo;
  sources: Record<string, RegisterSource>;
  sourceList: RegisterSource[];
  wildlifeCoverage: RegionCoverage[];
  consolidation: { currentTo: string; lastAmended: string; amendingRegulation: string };
  bylaws: BylawEntry[];
  digitised: DigitisedFeature[];
  loadedAt: string;
}

async function json<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(join(config.dataDir, file), "utf8")) as T;
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

let store: DataStore | null = null;

export async function loadData(): Promise<DataStore> {
  const [release, reg, coverage, bylaws] = await Promise.all([
    json<ReleaseInfo>("release.json"),
    json<{ sources: RegisterSource[] }>("sources.json"),
    json<{ regions: RegionCoverage[]; consolidation: DataStore["consolidation"] }>("wildlife-coverage.json"),
    json<{ entries: BylawEntry[] }>("bylaws.json"),
  ]);
  const digitised: DigitisedFeature[] = [];
  const dir = join(config.dataDir, "digitised");
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".geojson")).sort()) {
    const fc = await json<{ features: Feature<Geometry, DigitisedRuleProps>[] }>(join("digitised", file));
    for (const f of fc.features ?? []) if (f.geometry) digitised.push({ ...f, bbox: bboxOf(f.geometry) });
  }
  store = {
    release,
    sources: Object.fromEntries(reg.sources.map((s) => [s.id, s])),
    sourceList: reg.sources,
    wildlifeCoverage: coverage.regions,
    consolidation: coverage.consolidation,
    bylaws: bylaws.entries,
    digitised,
    loadedAt: new Date().toISOString(),
  };
  return store;
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
