import { normaliseProfile, type LatLon, type Profile } from "@slotscout/engine";
import { load, save } from "./storage";

const PROFILE_KEY = "slotscout.profile.v1";

/** The shooting profile lives on this device only (PRD 2.1). */
export function loadProfile(): { profile: Profile; isNew: boolean } {
  const stored = load<Partial<Profile> | null>(PROFILE_KEY, null);
  return { profile: normaliseProfile(stored ?? {}), isNew: !stored };
}

export function saveProfile(p: Profile): void {
  save(PROFILE_KEY, p);
}

export interface UrlState {
  point?: LatLon;
  profile?: Profile;
  date?: string;
  release?: string;
}

/** A shared link reproduces the report: point, profile, date and the release it was made with (PRD 8.6). */
export function readUrl(): UrlState {
  const q = new URLSearchParams(location.search);
  const lat = Number(q.get("lat"));
  const lon = Number(q.get("lon"));
  const out: UrlState = {};
  if (q.has("lat") && q.has("lon") && Number.isFinite(lat) && Number.isFinite(lon)) out.point = { lat, lon };
  if (q.has("type") || q.has("class")) {
    out.profile = normaliseProfile({ firearmClass: q.get("class"), firearmType: q.get("type"), activity: q.get("activity"), fallZoneM: q.get("fz") });
  }
  if (q.get("date")) out.date = q.get("date")!;
  if (q.get("release")) out.release = q.get("release")!;
  return out;
}

export function shareUrl(point: LatLon, p: Profile, release: string, date?: string): string {
  const q = new URLSearchParams({
    lat: point.lat.toFixed(6),
    lon: point.lon.toFixed(6),
    class: p.firearmClass,
    type: p.firearmType,
    activity: p.activity,
    fz: String(p.fallZoneM),
    release,
  });
  if (date) q.set("date", date);
  return `${location.origin}/?${q}`;
}

export function writeUrl(point: LatLon | null, p: Profile, release?: string): void {
  if (!point) {
    history.replaceState(null, "", location.pathname);
    return;
  }
  const url = new URL(shareUrl(point, p, release ?? ""));
  if (!release) url.searchParams.delete("release");
  history.replaceState(null, "", `${url.pathname}${url.search}`);
}

const VIEW_KEY = "slotscout.view.v1";
export const loadView = () => load<{ center: [number, number]; zoom: number } | null>(VIEW_KEY, null);
export const saveView = (v: { center: [number, number]; zoom: number }) => save(VIEW_KEY, v);
