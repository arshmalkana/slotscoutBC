import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { describeProfile, type LatLon, type Profile, type SpotReport as Report } from "@slotscout/engine";
import { Header } from "../components/Header";
import { MapView, type BaseLayer, type MapViewHandle } from "../components/MapView";
import { SearchBox } from "../components/SearchBox";
import { SpotReport } from "../components/SpotReport";
import { ProfileEditor } from "../components/ProfileEditor";
import { LayersPanel } from "../components/LayersPanel";
import { FinderPanel } from "../components/FinderPanel";
import { fetchMapLayers, fetchReport, type FinderCandidate, type MapLayerInfo, type SearchResult } from "../lib/api";
import { loadProfile, readUrl, saveProfile, writeUrl } from "../lib/state";
import { loadTrip, saveTrip, type TripSpot } from "../lib/trip";
import { load, save } from "../lib/storage";

type Tab = "report" | "find" | "layers" | "profile";

const EXAMPLES: { label: string; q: LatLon; why: string }[] = [
  { label: "Harrison East FSR, km 9", q: { lat: 49.41474, lon: -121.7547 }, why: "Crown land beside a permit road" },
  { label: "Sts'ailes FSR, km 15", q: { lat: 49.43053, lon: -121.846 }, why: "On the road allowance" },
  { label: "Golden Ears Park", q: { lat: 49.3567, lon: -122.4705 }, why: "Provincial park" },
];

export function MapPage() {
  const initialUrl = useMemo(readUrl, []);
  const stored = useMemo(loadProfile, []);
  const [profile, setProfile] = useState<Profile>(initialUrl.profile ?? stored.profile);
  const [tab, setTab] = useState<Tab>(stored.isNew && !initialUrl.point ? "profile" : "report");
  const [pin, setPin] = useState<LatLon | null>(initialUrl.point ?? null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [base, setBase] = useState<BaseLayer>(() => load<BaseLayer>("slotscout.base.v1", "auto"));
  const [overlays, setOverlays] = useState<MapLayerInfo[]>([]);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [opacity, setOpacity] = useState(() => load<number>("slotscout.opacity.v1", 0.85));
  const [candidates, setCandidates] = useState<FinderCandidate[]>([]);
  const [trip, setTrip] = useState<TripSpot[]>(loadTrip);
  const [zoom, setZoom] = useState(5);
  const [sheetH, setSheetH] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const mapRef = useRef<MapViewHandle>(null);
  const reqRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const linkRelease = initialUrl.release;
  const date = initialUrl.date;

  useEffect(() => {
    fetchMapLayers()
      .then((ls) => {
        setOverlays(ls);
        const saved = load<string[] | null>("slotscout.layers.v1", null);
        setVisible(new Set(saved ?? ls.filter((l) => l.defaultOn).map((l) => l.id)));
      })
      .catch(() => setOverlays([]));
  }, []);

  useEffect(() => save("slotscout.base.v1", base), [base]);
  useEffect(() => save("slotscout.opacity.v1", opacity), [opacity]);
  useEffect(() => {
    if (overlays.length) save("slotscout.layers.v1", [...visible]);
  }, [visible, overlays.length]);
  useEffect(() => saveTrip(trip), [trip]);

  const runCheck = useCallback(
    async (p: LatLon, prof: Profile) => {
      reqRef.current?.abort();
      const c = new AbortController();
      reqRef.current = c;
      setLoading(true);
      setError(null);
      try {
        const r = await fetchReport(p, prof, date, c.signal);
        if (c.signal.aborted) return;
        setReport(r);
        writeUrl(p, prof, r.release.id);
        // On phones, lift the sheet so the verdict is in view.
        if (window.matchMedia("(max-width: 820px)").matches) setSheetH((h) => Math.max(h ?? 0, Math.round(window.innerHeight * 0.55)));
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message || "The check failed.");
        setReport(null);
      } finally {
        if (!c.signal.aborted) setLoading(false);
      }
    },
    [date],
  );

  // A shared link opens straight on its report.
  useEffect(() => {
    if (initialUrl.point) {
      setTimeout(() => mapRef.current?.flyTo(initialUrl.point!, 14, profile.fallZoneM), 300);
      runCheck(initialUrl.point, profile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = useCallback(
    (p: LatLon) => {
      const q = { lat: Math.round(p.lat * 1e6) / 1e6, lon: Math.round(p.lon * 1e6) / 1e6 };
      setPin(q);
      setTab("report");
      runCheck(q, profile);
    },
    [profile, runCheck],
  );

  const changeProfile = (p: Profile) => {
    setProfile(p);
    saveProfile(p);
  };

  // Re-run the report when the profile changes.
  const lastProfile = useRef(profile);
  useEffect(() => {
    if (lastProfile.current === profile) return;
    lastProfile.current = profile;
    if (!pin) return;
    const t = setTimeout(() => runCheck(pin, profile), 400);
    return () => clearTimeout(t);
  }, [profile, pin, runCheck]);

  const onSearch = (r: SearchResult) => {
    if (r.kind === "coordinates" || r.kind === "km_marker") {
      mapRef.current?.flyTo({ lat: r.lat, lon: r.lon }, 14, profile.fallZoneM);
      if (base !== "satellite" && base !== "auto") setBase("auto");
      pick({ lat: r.lat, lon: r.lon });
    } else if (r.bbox) mapRef.current?.fitBounds(r.bbox);
    else mapRef.current?.flyTo({ lat: r.lat, lon: r.lon }, 13);
  };

  const saveToTrip = () => {
    if (!report) return;
    const label = `Spot ${trip.length + 1} (${report.point.lat.toFixed(4)}, ${report.point.lon.toFixed(4)})`;
    setTrip([
      ...trip,
      {
        id: `${Date.now()}`,
        point: report.point,
        label,
        verdict: report.verdict.state,
        headline: report.verdict.headline,
        savedAt: new Date().toISOString(),
        release: report.release.id,
        bestBearingDeg: report.fallZone.bestBearingDeg,
      },
    ]);
  };
  const saved = !!report && trip.some((t) => t.point.lat === report.point.lat && t.point.lon === report.point.lon);

  // Bottom-sheet drag on phones.
  const onHandleDown = (e: React.PointerEvent) => {
    const panel = panelRef.current;
    if (!panel) return;
    const parent = panel.parentElement!.getBoundingClientRect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const h = Math.min(parent.height - 8, Math.max(90, parent.bottom - ev.clientY));
      setSheetH(h);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "report", label: "Spot report" },
    { id: "find", label: "Find spots" },
    { id: "layers", label: "Layers" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <>
      <Header>
        <SearchBox onSelect={onSearch} />
      </Header>
      <main className="map-page" id="main">
        <div className="map-wrap">
          <MapView
            ref={mapRef}
            base={base}
            overlays={overlays}
            visible={visible}
            overlayOpacity={opacity}
            pin={pin}
            report={report}
            loading={loading}
            previewRadiusM={profile.fallZoneM}
            candidates={candidates}
            onPick={pick}
            onCandidate={(c) => pick(c.point)}
            onZoom={setZoom}
          />
          <div className="map-controls no-print">
            <button className="btn btn-sm" type="button" onClick={() => pick(mapRef.current!.center())} title="Check the spot at the centre of the map">
              ⊕ Check map centre
            </button>
          </div>
          {!pin && (
            <div className="map-hint" aria-hidden="true">
              <span className="desktop-only">Click the map to check a spot</span>
              <span className="phone-only">Long-press the map to check a spot</span>
            </div>
          )}
        </div>
        <aside
          ref={panelRef}
          className={`panel${dragging ? " dragging" : ""}`}
          style={sheetH ? ({ "--sheet-h": `${sheetH}px` } as React.CSSProperties) : undefined}
          aria-label="Spot report and tools"
        >
          <button className="sheet-handle" type="button" aria-label="Drag to resize the report" onPointerDown={onHandleDown} />
          <div className="panel-tabs" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="panel-body" role="tabpanel">
            {tab === "profile" && (
              <div>
                {stored.isNew && (
                  <div className="intro">
                    <h2>Welcome to SlotScout</h2>
                    <p>Check any spot in British Columbia, rule by rule, before you shoot. First, three questions. Your answers stay on this device.</p>
                  </div>
                )}
                <ProfileEditor profile={profile} onChange={changeProfile} />
                <button className="btn btn-primary" type="button" style={{ width: "100%" }} onClick={() => setTab("report")}>
                  {pin ? "Back to the report" : "Done: check a spot"}
                </button>
              </div>
            )}

            {tab === "report" && (
              <div>
                <p className="hint" style={{ marginTop: 0 }}>
                  Profile: {describeProfile(profile)}.{" "}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab("profile")}>
                    Change
                  </button>
                </p>
                {loading && (
                  <div className="loading-box" role="status">
                    <span className="spinner" aria-hidden="true" /> Checking every rule against current official data…
                  </div>
                )}
                {error && !loading && (
                  <div className="error-box" role="alert">
                    <b>Cannot confirm.</b> {error}{" "}
                    {pin && (
                      <button className="btn btn-sm" type="button" onClick={() => runCheck(pin, profile)}>
                        Try again
                      </button>
                    )}
                  </div>
                )}
                {report && !loading && <SpotReport report={report} linkRelease={linkRelease} date={date} onSave={saveToTrip} saved={saved} />}
                {!pin && !loading && (
                  <div className="intro">
                    <h2>Where can I shoot?</h2>
                    <p>Drop a pin anywhere in BC. SlotScout checks federal law, the Wildlife Act, parks, Indigenous lands, ownership, local bylaws, rec sites, wildfire orders, road access and your fall zone, and shows the source and date for every answer.</p>
                    <ol className="steps">
                      <li>Click the map, or long-press on a phone.</li>
                      <li>Or paste coordinates, a Google or Apple Maps link, or search an FSR and km, like "Harrison East FSR km 9".</li>
                      <li>Read the verdict, then open any row to see the law behind it.</li>
                    </ol>
                    <div className="card">
                      <p style={{ margin: 0, fontSize: 14 }}>
                        <b>Early preview.</b> Wildlife Act closed areas and local bylaws are still being digitised and reviewed, so most spots show <b>Cannot confirm</b> for now. Red answers are already reliable. SlotScout never shows green unless every check passed.{" "}
                        <Link to="/about">How it works</Link>
                      </p>
                    </div>
                    <h3 className="section" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-3)" }}>
                      Try a spot
                    </h3>
                    <div className="list">
                      {EXAMPLES.map((e) => (
                        <button
                          key={e.label}
                          className="btn"
                          type="button"
                          style={{ justifyContent: "flex-start" }}
                          onClick={() => {
                            mapRef.current?.flyTo(e.q, 14, profile.fallZoneM);
                            pick(e.q);
                          }}
                        >
                          {e.label} <span className="hint">· {e.why}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "find" && (
              <FinderPanel
                profile={profile}
                pin={pin}
                mapCenter={() => mapRef.current!.center()}
                candidates={candidates}
                onCandidates={setCandidates}
                onPick={(c) => {
                  mapRef.current?.flyTo(c.point, 14, profile.fallZoneM);
                  pick(c.point);
                }}
                trip={trip}
                onTrip={setTrip}
                onTripPick={(p) => {
                  mapRef.current?.flyTo(p, 14, profile.fallZoneM);
                  pick(p);
                }}
              />
            )}

            {tab === "layers" && (
              <LayersPanel base={base} onBase={setBase} layers={overlays} visible={visible} onVisible={setVisible} opacity={opacity} onOpacity={setOpacity} zoom={zoom} />
            )}
          </div>
        </aside>
      </main>
    </>
  );
}
