import type { ContributionView } from "@slotscout/engine";
import type { Draft } from "./geoedit";

/** The map editor's data: folders, one item's details, contributions and reviews. */
export type Kind = "closed-areas" | "bylaws";
export type Folder = "not_done" | "not_confirmed" | "confirmed";

export const FOLDER_LABEL: Record<Folder, string> = { not_done: "Not done", not_confirmed: "Not confirmed", confirmed: "Confirmed" };
export const FOLDER_HELP: Record<Folder, string> = {
  not_done: "Nothing drawn or found yet. Start here.",
  not_confirmed: "Something is drawn or read, but it is approximate or no second person has checked it.",
  confirmed: "A person approved an exact outline or the bylaw's answer.",
};

export interface ClosedAreaItem {
  id: string;
  title: string;
  schedule: string;
  section: string | null;
  effect: string | null;
  region: string | null;
  regionName: string | null;
  folder: Folder;
  state: string;
  quality: string | null;
  km2: number | null;
  bbox: [number, number, number, number] | null;
  /** What the map zooms to: the shape, the area the text names, a road, feature or place it names, or all of BC. */
  zoom?: "shape" | "area" | "road" | "feature" | "place" | "province" | null;
  hasMap: boolean;
  issues: number;
  waiting?: number;
  contributions?: number;
}

export interface BylawItem {
  id: string;
  key: string;
  name: string;
  kind: "municipality" | "electoral_area" | "local_trust_area";
  regionalDistrict: string | null;
  folder: Folder;
  state: string;
  status: string;
  targetShooting: string | null;
  docs: number;
  zones: number;
  hasPages: boolean;
  /** The jurisdiction's outline box (else its regional district's, else all of BC). */
  bbox?: [number, number, number, number];
  zoom?: "jurisdiction" | "regional district" | "province";
  waiting?: number;
  contributions?: number;
}

export interface WorkbenchIndex<T> {
  month: string;
  builtAt: string;
  counts: Record<Folder, number>;
  items: T[];
}

export interface MapRef {
  file: string;
  title: string;
  url: string;
  page: string | null;
  overlay: { image: string; corners: number[][] } | null;
}

interface Common {
  folder: Folder;
  state: string;
  shapes: GeoJSON.FeatureCollection;
  contributions: ContributionView[];
}

export interface ClosedAreaDetail extends Common {
  id: string;
  itemId: string;
  title: string;
  heading: string;
  quality: string | null;
  sourceText: string;
  sourceUrl: string | null;
  sourceVersion: string;
  quotes: Record<string, string>;
  extracted: {
    effect: string | null;
    period: { start: string; end: string } | null;
    within: { type: string; name: string } | null;
    method: string | null;
    feature: { type?: string; name?: string } | null;
    road: { name?: string } | null;
    bufferM: number | null;
    steps: { follow: string | null; feature: string | null; until: string | null; quote: string | null }[];
  };
  runsAgree: boolean;
  why: string[];
  validation: { check: string; passed: boolean | null; detail: string }[];
  construction: { what: string; quote: string | null; source: string }[];
  lookups: { query: string; kind: string; layer: string; status: string; note: string | null }[];
  maps: MapRef[];
  decided: { status: string; by: string | null; on: string | null; note: string | null } | null;
}

export interface BylawDoc {
  doc: string;
  title: string;
  number: string | null;
  url: string | null;
  status: string;
  runsAgree: boolean;
  targetShooting: string | null;
  prohibitions: { what: string; where: string; quote: string }[];
  exceptions: { applies_to: string; quote: string }[];
  distanceRules: { distance_m: number | null; from_what: string; quote: string }[];
  scheduleMaps: { name: string; description: string; quote: string }[];
  text: string;
  pages: string[];
}

export interface BylawDetail extends Common {
  id: string;
  key: string;
  name: string;
  kind: BylawItem["kind"];
  regionalDistrict: string | null;
  entry: { status: string; targetShooting?: string; confirmedOn?: string; notes?: string; bylaw?: { title?: string; number?: string; url?: string } };
  website: string | null;
  searchUrl: string;
  docs: BylawDoc[];
  zones: number;
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  const body = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
  return body;
}

export const imgUrl = (file: string) => `/v1/workbench/img/${encodeURIComponent(file)}`;
export const fetchIndex = <T>(kind: Kind) => call<WorkbenchIndex<T>>(`/v1/workbench/${kind}`);
export const fetchClosedArea = (id: string) => call<ClosedAreaDetail>(`/v1/workbench/closed-areas/${encodeURIComponent(id)}`);
export const fetchBylaw = (id: string) => call<BylawDetail>(`/v1/workbench/bylaws/${encodeURIComponent(id)}`);
export const fetchBoundary = (kind: string, name: string) => call<GeoJSON.FeatureCollection>(`/v1/workbench/boundary?kind=${encodeURIComponent(kind)}&name=${encodeURIComponent(name)}`);
export const fetchLookup = (type: string, name: string, bbox: number[] | null) =>
  call<{ layer: string | null; features: GeoJSON.Feature[]; note?: string }>(`/v1/workbench/lookup?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}${bbox ? `&bbox=${bbox.map((v) => v.toFixed(5)).join(",")}` : ""}`);
export const fetchContributionStatus = () => call<{ enabled: boolean; store: string }>("/v1/contributions?status=none");

export interface NewContribution {
  kind: "closed_area" | "bylaw" | "bylaw_zone";
  target: string;
  author: string;
  note: string;
  geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  exact?: boolean;
  bylaw?: { url: string; title: string; number: string; targetShooting: string; quote: string };
  zone?: { schedule: string; effect: string };
}

export const sendContribution = (c: NewContribution) =>
  call<{ ok: true; id: string }>("/v1/contributions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) });

export const checkReviewer = (key: string) => call<{ name: string }>("/v1/reviewer", { headers: { "x-reviewer-key": key } });
export const reviewContribution = (key: string, id: string, decision: "confirmed" | "rejected", note: string) =>
  call<{ ok: true }>(`/v1/contributions/${encodeURIComponent(id)}/review`, { method: "POST", headers: { "Content-Type": "application/json", "x-reviewer-key": key }, body: JSON.stringify({ decision, note }) });

// --- Things kept in this browser only: your name, drafts in progress, a reviewer key for this tab ----------------

const safe = <T>(f: () => T, fallback: T): T => {
  try {
    return f();
  } catch {
    return fallback;
  }
};

export const myName = {
  get: () => safe(() => localStorage.getItem("slotscout.editor.name") ?? "", ""),
  set: (v: string) => safe(() => localStorage.setItem("slotscout.editor.name", v), undefined),
};

const draftKey = (kind: Kind, id: string) => `slotscout.editor.draft.${kind}.${id}`;
export const drafts = {
  get: (kind: Kind, id: string): Draft | null => safe(() => JSON.parse(localStorage.getItem(draftKey(kind, id)) ?? "null") as Draft | null, null),
  set: (kind: Kind, id: string, d: Draft) => safe(() => (d.length ? localStorage.setItem(draftKey(kind, id), JSON.stringify(d)) : localStorage.removeItem(draftKey(kind, id))), undefined),
};

export const reviewerKey = {
  get: () => safe(() => sessionStorage.getItem("slotscout.editor.reviewer") ?? "", ""),
  set: (v: string) => safe(() => (v ? sessionStorage.setItem("slotscout.editor.reviewer", v) : sessionStorage.removeItem("slotscout.editor.reviewer")), undefined),
};
