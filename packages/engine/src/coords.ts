import proj4 from "proj4";
import type { LatLon } from "./types.js";

/** Rough bounding box of British Columbia, used to repair swapped or unsigned coordinates. */
export const BC_BBOX = { minLat: 48.2, maxLat: 60.01, minLon: -139.1, maxLon: -114.0 };

export function inBCBox(p: LatLon): boolean {
  return p.lat >= BC_BBOX.minLat && p.lat <= BC_BBOX.maxLat && p.lon >= BC_BBOX.minLon && p.lon <= BC_BBOX.maxLon;
}

export type ParseResult =
  | { ok: true; point: LatLon; format: string; note?: string }
  | { ok: false; error: string };

const NUM = /[-+]?\d+(?:\.\d+)?/g;

/**
 * Parse coordinates in any common format (PRD 2.2): decimal degrees, degrees-minutes(-seconds),
 * UTM zones 7 to 11, Google Maps and Apple Maps links, and geo: URIs. Swapped lat/lon and missing
 * minus signs are repaired when the literal reading would fall outside BC; the caller must show
 * the interpreted point before checking.
 */
export function parseCoordinates(input: string): ParseResult {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "Enter coordinates or paste a map link." };

  const url = parseMapLink(raw);
  if (url) return url.ok ? fixForBC(url.point, url.format) : url;

  const utm = parseUtm(raw);
  if (utm) return utm;

  const pair = parseDegreePair(raw);
  if (!pair.ok) return pair;
  return fixForBC(pair.point, pair.format, pair.explicitHemispheres);
}

function fixForBC(p: LatLon, format: string, explicit = false): ParseResult {
  if (!isFinite(p.lat) || !isFinite(p.lon) || Math.abs(p.lat) > 90 || Math.abs(p.lon) > 180) {
    // Maybe swapped so that longitude sits in the latitude slot.
    if (Math.abs(p.lon) <= 90 && Math.abs(p.lat) <= 180) {
      const swapped = fixForBC({ lat: p.lon, lon: p.lat }, format, explicit);
      if (swapped.ok) swapped.note = swapped.note ? `Swapped latitude and longitude. ${swapped.note}` : "Swapped latitude and longitude.";
      return swapped;
    }
    return { ok: false, error: "Those numbers are not valid coordinates." };
  }
  if (inBCBox(p) || explicit) return { ok: true, point: round(p), format };
  const candidates: { p: LatLon; note: string }[] = [
    { p: { lat: p.lat, lon: -Math.abs(p.lon) }, note: "Added the missing minus sign on longitude (BC is west of Greenwich)." },
    { p: { lat: p.lon, lon: p.lat }, note: "Swapped latitude and longitude." },
    { p: { lat: Math.abs(p.lon), lon: -Math.abs(p.lat) }, note: "Swapped latitude and longitude and added the minus sign on longitude." },
  ];
  for (const c of candidates) {
    if (inBCBox(c.p)) return { ok: true, point: round(c.p), format, note: c.note };
  }
  return { ok: true, point: round(p), format, note: "This point is outside British Columbia." };
}

function round(p: LatLon): LatLon {
  return { lat: Math.round(p.lat * 1e6) / 1e6, lon: Math.round(p.lon * 1e6) / 1e6 };
}

function parseMapLink(raw: string): ParseResult | null {
  const isUrl = /^(https?:\/\/|www\.|maps\.|geo:)/i.test(raw) || /google\.[a-z.]+\/maps|maps\.apple\.com|goo\.gl/i.test(raw);
  if (!isUrl) return null;
  let s = raw;
  try {
    s = decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    // keep raw
  }
  const apple = /maps\.apple\.com/i.test(s);
  const format = apple ? "Apple Maps link" : /geo:/i.test(s) ? "geo: link" : "Google Maps link";

  if (/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(s)) {
    return {
      ok: false,
      error: "Short map links can't be read directly. Open the link, then copy the full address from your browser.",
    };
  }
  const patterns: RegExp[] = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // Google place pin
    /[?&](?:q|query|ll|sll|coordinate|daddr|destination|center)=\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i,
    /\/(?:search|place|dir)\/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i,
    /geo:(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // map centre, last resort
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return { ok: true, point: { lat: Number(m[1]), lon: Number(m[2]) }, format };
  }
  return { ok: false, error: "That link has no coordinates in it. Drop a pin in the map app and share that link instead." };
}

function parseUtm(raw: string): ParseResult | null {
  const s = raw.toUpperCase().replace(/,/g, " ").replace(/\s+/g, " ").trim();
  const m = s.match(
    /^(?:UTM\s*)?(?:ZONE\s*)?(\d{1,2})\s*([C-HJ-NP-X])?\s+(?:E\s*)?(\d{6}(?:\.\d+)?)\s*(?:M\s*)?(?:E\b)?\s*(?:N\s*)?(\d{7}(?:\.\d+)?)\s*(?:M\s*)?(?:N\b)?$/,
  );
  if (!m) return null;
  const zone = Number(m[1]);
  const easting = Number(m[3]);
  const northing = Number(m[4]);
  if (zone < 7 || zone > 11) {
    return { ok: false, error: `UTM zone ${zone} does not cover British Columbia. BC uses zones 7 to 11.` };
  }
  const band = m[2];
  if (band && band < "N") return { ok: false, error: "That UTM point is in the southern hemisphere." };
  const [lon, lat] = proj4(`+proj=utm +zone=${zone} +datum=NAD83 +units=m +no_defs`, "EPSG:4326", [easting, northing]) as [number, number];
  const point = round({ lat, lon });
  const res: ParseResult = { ok: true, point, format: `UTM zone ${zone}` };
  if (!inBCBox(point)) res.note = "This point is outside British Columbia.";
  return res;
}

interface DegreePair {
  ok: true;
  point: LatLon;
  format: string;
  explicitHemispheres: boolean;
}

function parseDegreePair(raw: string): DegreePair | { ok: false; error: string } {
  const s = raw
    .toUpperCase()
    .replace(/[°º˚]/g, "°")
    .replace(/''/g, '"')
    .replace(/[′’‘`´]/g, "'")
    .replace(/[″“”]/g, '"')
    .replace(/\bDEG(REES)?\b/g, "°")
    .replace(/\b(LAT(ITUDE)?|LON(G(ITUDE)?)?)\b[:=]?/g, " ")
    .trim();

  if (/[^0-9NSEW°'".,;:\s/+\-]/.test(s)) {
    return { ok: false, error: "Couldn't read that. Try 49.41474, -121.75470 or paste a Google Maps link." };
  }

  const parts = splitPair(s);
  if (!parts) return { ok: false, error: "Couldn't find two coordinates. Try 49.41474, -121.75470." };

  const a = parseComponent(parts[0]);
  const b = parseComponent(parts[1]);
  if (!a.ok) return a;
  if (!b.ok) return b;

  let lat: number;
  let lon: number;
  const aIsLon = a.hemi === "E" || a.hemi === "W";
  const bIsLat = b.hemi === "N" || b.hemi === "S";
  if (aIsLon || bIsLat) {
    lat = b.value;
    lon = a.value;
  } else {
    lat = a.value;
    lon = b.value;
  }
  const format = a.parts > 1 || b.parts > 1 ? (a.parts === 3 || b.parts === 3 ? "degrees-minutes-seconds" : "degrees and decimal minutes") : "decimal degrees";
  return { ok: true, point: { lat, lon }, format, explicitHemispheres: a.hemi !== null && b.hemi !== null };
}

function splitPair(s: string): [string, string] | null {
  // Hemisphere letters split the pair: trailing (49N 121W) or leading (N49 W121).
  const letters = [...s.matchAll(/[NSEW]/g)];
  if (letters.length === 2) {
    const first = letters[0]!;
    const leading = s.trimStart().startsWith(first[0]);
    if (leading) {
      const idx = letters[1]!.index!;
      return [s.slice(0, idx), s.slice(idx)];
    }
    const idx = first.index! + 1;
    return [s.slice(0, idx), s.slice(idx)];
  }
  if (letters.length !== 0) return null;

  // An explicit separator.
  const sep = s.split(/\s*[,;/]\s*/).filter(Boolean);
  if (sep.length === 2) return [sep[0]!, sep[1]!];

  // Otherwise split the numbers in half: 2 (DD), 4 (DM) or 6 (DMS).
  const nums = [...s.matchAll(NUM)];
  if (nums.length === 2 || nums.length === 4 || nums.length === 6) {
    const half = nums.length / 2;
    const idx = nums[half]!.index!;
    return [s.slice(0, idx), s.slice(idx)];
  }
  return null;
}

function parseComponent(part: string):
  | { ok: true; value: number; hemi: "N" | "S" | "E" | "W" | null; parts: number }
  | { ok: false; error: string } {
  const hemiMatch = part.match(/[NSEW]/);
  const hemi = (hemiMatch?.[0] as "N" | "S" | "E" | "W" | undefined) ?? null;
  const nums = [...part.matchAll(NUM)].map((m) => m[0]);
  if (nums.length < 1 || nums.length > 3) return { ok: false, error: "Couldn't read one of the coordinates." };
  const [d, m = "0", sec = "0"] = nums;
  const deg = Number(d);
  const min = Number(m);
  const s = Number(sec);
  if (nums.length > 1 && !Number.isInteger(deg)) return { ok: false, error: "Degrees with minutes must be a whole number." };
  if (min >= 60 || s >= 60 || min < 0 || s < 0) return { ok: false, error: "Minutes and seconds must be under 60." };
  let value = Math.abs(deg) + min / 60 + s / 3600;
  const negative = d!.startsWith("-") || hemi === "S" || hemi === "W";
  if (negative) value = -value;
  return { ok: true, value, hemi, parts: nums.length };
}

export function formatLatLon(p: LatLon, digits = 5): string {
  return `${p.lat.toFixed(digits)}, ${p.lon.toFixed(digits)}`;
}

export function formatDms(p: LatLon): string {
  const f = (v: number, pos: string, neg: string) => {
    const a = Math.abs(v);
    const d = Math.floor(a);
    const mFloat = (a - d) * 60;
    const m = Math.floor(mFloat);
    const s = (mFloat - m) * 60;
    return `${d}°${String(m).padStart(2, "0")}'${s.toFixed(1).padStart(4, "0")}"${v >= 0 ? pos : neg}`;
  };
  return `${f(p.lat, "N", "S")} ${f(p.lon, "E", "W")}`;
}

/** UTM (NAD83) for display. BC spans zones 7 to 11. */
export function toUtm(p: LatLon): { zone: number; easting: number; northing: number } {
  const zone = Math.min(11, Math.max(7, Math.floor((p.lon + 180) / 6) + 1));
  const [e, n] = proj4("EPSG:4326", `+proj=utm +zone=${zone} +datum=NAD83 +units=m +no_defs`, [p.lon, p.lat]) as [number, number];
  return { zone, easting: Math.round(e), northing: Math.round(n) };
}
