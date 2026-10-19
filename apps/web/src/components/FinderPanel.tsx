import { useState } from "react";
import type { LatLon, Profile } from "@slotscout/engine";
import { findSpots, type FinderCandidate } from "../lib/api";
import { STATE_GLYPH, bearingText, formatDistance } from "../lib/format";
import { download, tripToCsv, tripToGpx, type TripSpot } from "../lib/trip";

interface Props {
  profile: Profile;
  pin: LatLon | null;
  mapCenter(): LatLon;
  candidates: FinderCandidate[];
  onCandidates(c: FinderCandidate[]): void;
  onPick(c: FinderCandidate): void;
  trip: TripSpot[];
  onTrip(t: TripSpot[]): void;
  onTripPick(p: LatLon): void;
}

const VEHICLES = [
  { id: "2wd", label: "2WD car" },
  { id: "hc", label: "High-clearance 2WD" },
  { id: "4x4", label: "4x4" },
];

function vehicleOk(vehicle: string, need: string): boolean {
  if (vehicle === "4x4") return true;
  if (vehicle === "hc") return need !== "4x4";
  return need === "2WD gravel" || need === "unknown";
}

/** Find spots near me (PRD 2.5, 8.5). Preview: checks the nearest open cutblocks with the full engine. */
export function FinderPanel({ profile, pin, mapCenter, candidates, onCandidates, onPick, trip, onTrip, onTripPick }: Props) {
  const [radius, setRadius] = useState(5);
  const [vehicle, setVehicle] = useState("hc");
  const [from, setFrom] = useState<"pin" | "map" | "me">(pin ? "pin" : "map");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ screened: number; checked: number } | null>(null);

  const start = async () => {
    setError(null);
    setBusy(true);
    try {
      let s: LatLon;
      if (from === "pin" && pin) s = pin;
      else if (from === "me") {
        s = await new Promise<LatLon>((res, rej) =>
          navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lon: p.coords.longitude }), () => rej(new Error("Location permission was not given.")), {
            enableHighAccuracy: false,
            timeout: 10000,
          }),
        );
      } else s = mapCenter();
      const r = await findSpots(s, radius, profile);
      onCandidates(r.candidates);
      setStats({ screened: r.screened, checked: r.checked });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const shown = candidates.filter((c) => vehicleOk(vehicle, c.vehicle));

  return (
    <div>
      <div className="intro">
        <h2>Find spots near you</h2>
        <p>
          SlotScout looks for open cutblocks harvested 4 to 12 years ago on Crown land, then runs the full check on the nearest ones. Red spots are left out.
        </p>
      </div>
      <fieldset>
        <legend className="field">
          <span>Start from</span>
        </legend>
        <div className="choice-row">
          {(
            [
              ["pin", "My pin", !pin],
              ["map", "Map centre", false],
              ["me", "My location", false],
            ] as const
          ).map(([id, label, disabled]) => (
            <label key={id} className="choice">
              <input type="radio" name="from" checked={from === id} disabled={disabled} onChange={() => setFrom(id)} />
              <span style={disabled ? { opacity: 0.5 } : undefined}>{label}</span>
            </label>
          ))}
        </div>
        {from === "me" && <p className="hint">Your location is used once for this search and is never stored.</p>}
      </fieldset>
      <label className="field">
        <span>Maximum straight-line distance: {radius} km</span>
        <input type="range" min={1} max={10} step={1} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        <small>Preview limit: 10 km. Drive distances arrive with route planning.</small>
      </label>
      <fieldset>
        <legend className="field">
          <span>Vehicle</span>
        </legend>
        <div className="choice-row">
          {VEHICLES.map((v) => (
            <label key={v.id} className="choice">
              <input type="radio" name="vehicle" checked={vehicle === v.id} onChange={() => setVehicle(v.id)} />
              <span>{v.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button className="btn btn-primary" type="button" onClick={start} disabled={busy} style={{ width: "100%" }}>
        {busy ? "Checking candidates…" : "Find spots"}
      </button>
      {busy && (
        <div className="loading-box">
          <span className="spinner" aria-hidden="true" /> Running the full check on each candidate. This takes 10 to 30 seconds.
        </div>
      )}
      {error && (
        <p className="error-box" style={{ marginTop: 10 }}>
          {error}
        </p>
      )}

      {stats && !busy && (
        <section className="section">
          <h3>
            {shown.length} candidate{shown.length === 1 ? "" : "s"}
          </h3>
          <p className="hint">
            {stats.screened} open cutblocks found; the nearest {stats.checked} were checked. Grey spots could not be fully confirmed: open them to see what is missing.
          </p>
          <ul className="list">
            {shown.map((c, i) => (
              <li key={i}>
                <button type="button" className={`candidate v-${c.verdict.state}`} onClick={() => onPick(c)}>
                  <span className="glyph" aria-hidden="true">
                    {STATE_GLYPH[c.verdict.state]}
                  </span>
                  <span>
                    <b>{c.verdict.headline}</b> · {formatDistance(c.distanceM)} {c.direction}
                    <span className="meta" style={{ display: "block" }}>
                      Cutblock harvested {c.harvestYear}, {c.areaHa} ha. {c.lights.filter((l) => l.state === "green").length} of {c.lights.length} green.
                    </span>
                    <span className="meta" style={{ display: "block" }}>
                      {c.bestBearingDeg !== null ? `Throw ${bearingText(c.bestBearingDeg, c.bestBearingMagneticDeg)}. ` : "No clear throw direction. "}
                      {c.nearestRoad ? `${c.nearestRoad}${c.nearestRoadM !== undefined ? `, ${formatDistance(c.nearestRoadM)}` : ""}. ` : ""}
                      Vehicle: {c.vehicle}.{c.notices ? ` ${c.notices} road notice${c.notices > 1 ? "s" : ""}.` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!shown.length && <p className="empty">No candidates suit this vehicle. Try a larger distance or another start point.</p>}
        </section>
      )}

      <section className="section">
        <h3>Trip list</h3>
        {trip.length === 0 ? (
          <p className="empty" style={{ fontSize: 14 }}>
            Save spots from a report to build a trip list. It stays on this device.
          </p>
        ) : (
          <>
            <ul className="list">
              {trip.map((s) => (
                <li key={s.id} className={`v-${s.verdict}`} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="glyph" aria-hidden="true">
                    {STATE_GLYPH[s.verdict]}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "flex-start" }} onClick={() => onTripPick(s.point)}>
                    {s.label}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" aria-label={`Remove ${s.label}`} onClick={() => onTrip(trip.filter((x) => x.id !== s.id))}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="btn btn-sm" type="button" onClick={() => download("slotscout-trip.gpx", tripToGpx(trip), "application/gpx+xml")}>
                Export GPX
              </button>
              <button className="btn btn-sm" type="button" onClick={() => download("slotscout-trip.csv", tripToCsv(trip), "text/csv")}>
                Export CSV
              </button>
            </div>
            <p className="hint">Saved verdicts are from the day you saved them. Check each spot again before you go.</p>
          </>
        )}
      </section>
    </div>
  );
}
