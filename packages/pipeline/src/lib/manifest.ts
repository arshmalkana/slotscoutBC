import { join } from "node:path";
import { monthDir } from "./paths.js";
import { readJsonIf, writeJson } from "./util.js";

export type SourceStatus = "ok" | "partial" | "failed" | "awaiting_person" | "skipped";

export interface FileEntry {
  path: string;
  sha256: string;
  bytes: number;
  source: string;
  url?: string;
  fetchedAt: string;
  committed: boolean;
  note?: string;
}

export interface LayerEntry {
  id: string;
  layer: string;
  endpoint: string;
  serverCount: number | null;
  pulledCount: number;
  sha256: string | null;
  bytes: number;
  pages: number;
  sortBy: string | null;
  bodyStored: boolean;
  status: SourceStatus;
  countMatches: boolean;
  previousCount: number | null;
  countChange: number | null;
  startedAt: string;
  finishedAt: string;
  error?: string;
}

export interface Manifest {
  month: string;
  userAgent: string;
  startedAt: string;
  updatedAt: string;
  sources: Record<string, { status: SourceStatus; detail: string; at: string }>;
  layers: Record<string, LayerEntry>;
  files: FileEntry[];
  failures: { source: string; what: string; error: string; at: string }[];
}

export function manifestPath(month: string): string {
  return join(monthDir(month), "manifest.json");
}

export function loadManifest(month: string, ua: string): Manifest {
  return readJsonIf<Manifest>(manifestPath(month), {
    month,
    userAgent: ua,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sources: {},
    layers: {},
    files: [],
    failures: [],
  });
}

/** Sources this process changed; saves merge them into what is on disk, so parallel pulls are safe. */
const touched = new WeakMap<Manifest, Set<string>>();
const touch = (m: Manifest, source: string) => {
  const t = touched.get(m) ?? new Set<string>();
  t.add(source);
  touched.set(m, t);
};

export function setSource(m: Manifest, id: string, v: Manifest["sources"][string]): void {
  m.sources[id] = v;
  touch(m, id);
}

export function saveManifest(m: Manifest): void {
  const mine = touched.get(m) ?? new Set<string>();
  const disk = readJsonIf<Manifest | null>(manifestPath(m.month), null);
  if (disk) {
    m.sources = { ...disk.sources, ...Object.fromEntries(Object.entries(m.sources).filter(([k]) => mine.has(k) || !(k in disk.sources))) };
    m.layers = { ...disk.layers, ...Object.fromEntries(Object.entries(m.layers).filter(([k]) => mine.has(k) || !(k in disk.layers))) };
    const paths = new Set(m.files.filter((f) => mine.has(f.source)).map((f) => f.path));
    m.files = [...disk.files.filter((f) => !paths.has(f.path)), ...m.files.filter((f) => paths.has(f.path))];
    m.failures = [...disk.failures.filter((f) => !mine.has(f.source)), ...m.failures.filter((f) => mine.has(f.source))];
    m.startedAt = disk.startedAt < m.startedAt ? disk.startedAt : m.startedAt;
  }
  m.updatedAt = new Date().toISOString();
  m.files.sort((a, b) => a.path.localeCompare(b.path));
  writeJson(manifestPath(m.month), m);
}

export function addFile(m: Manifest, f: FileEntry): void {
  m.files = m.files.filter((x) => x.path !== f.path);
  m.files.push(f);
  touch(m, f.source);
}

export function fail(m: Manifest, source: string, what: string, error: unknown): void {
  const msg = error instanceof Error ? error.message : String(error);
  m.failures = m.failures.filter((x) => !(x.source === source && x.what === what));
  m.failures.push({ source, what, error: msg, at: new Date().toISOString() });
  touch(m, source);
}

export function clearFailure(m: Manifest, source: string, what: string): void {
  m.failures = m.failures.filter((x) => !(x.source === source && x.what === what));
  touch(m, source);
}
