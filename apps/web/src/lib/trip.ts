import type { LatLon, VerdictState } from "@slotscout/engine";
import { load, save } from "./storage";

export interface TripSpot {
  id: string;
  point: LatLon;
  label: string;
  verdict: VerdictState;
  headline: string;
  savedAt: string;
  release: string;
  bestBearingDeg: number | null;
}

const KEY = "slotscout.trip.v1";

export const loadTrip = () => load<TripSpot[]>(KEY, []);
export const saveTrip = (spots: TripSpot[]) => save(KEY, spots);

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function tripToGpx(spots: TripSpot[]): string {
  const wpts = spots
    .map(
      (s) =>
        `  <wpt lat="${s.point.lat.toFixed(6)}" lon="${s.point.lon.toFixed(6)}">\n    <name>${esc(s.label)}</name>\n    <desc>${esc(`${s.headline} (SlotScout release ${s.release}, saved ${s.savedAt.slice(0, 10)}). Not legal advice. Signs and conditions on site come first.`)}</desc>\n  </wpt>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="SlotScout (slotscout.ca)" xmlns="http://www.topografix.com/GPX/1/1">\n${wpts}\n</gpx>\n`;
}

export function tripToCsv(spots: TripSpot[]): string {
  const rows = [["label", "lat", "lon", "verdict", "headline", "best_throw_true_deg", "release", "saved_at"]];
  for (const s of spots) rows.push([s.label, String(s.point.lat), String(s.point.lon), s.verdict, s.headline, s.bestBearingDeg === null ? "" : String(s.bestBearingDeg), s.release, s.savedAt]);
  return rows.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n") + "\n";
}

export function download(filename: string, text: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
