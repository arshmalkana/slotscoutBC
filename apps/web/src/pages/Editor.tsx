import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { ContributionView } from "@slotscout/engine";
import type { Position } from "geojson";
import { Header } from "../components/Header";
import { EditorMap, type EditorMapHandle, type Mode } from "../components/EditorMap";
import { fetchMapLayers, type MapLayerInfo } from "../lib/api";
import {
  addShape,
  bufferLine,
  bufferShape,
  circleAt,
  clipTo,
  deleteVertex,
  draftStats,
  fromGeometry,
  ringPolygon,
  simplifyDraft,
  subtractShape,
  toGeometry,
  type Draft,
  type VertexPath,
} from "../lib/geoedit";
import {
  FOLDER_HELP,
  FOLDER_LABEL,
  checkReviewer,
  drafts,
  fetchBoundary,
  fetchBylaw,
  fetchClosedArea,
  fetchContributionStatus,
  fetchIndex,
  fetchLookup,
  imgUrl,
  myName,
  reviewContribution,
  reviewerKey,
  sendContribution,
  type BylawDetail,
  type BylawItem,
  type ClosedAreaDetail,
  type ClosedAreaItem,
  type Folder,
  type Kind,
  type MapRef,
  type WorkbenchIndex,
} from "../lib/workbench";

/**
 * The map editor: a community-built map of the rules that exist only as text. Closed areas and local bylaws sit in
 * three folders (not done, not confirmed, confirmed); anyone can pick one, read the exact legal wording beside the
 * Province's own map or the bylaw's pages, draw or fix the shape, and send it. A second person with a reviewer key
 * confirms it, and the next data update puts it on the map. Nothing anyone sends changes a check until then.
 */
const EFFECT: Record<string, string> = {
  no_shooting: "No shooting",
  no_shooting_hunting_exempt: "No shooting (licensed hunting allowed)",
  no_shooting_seasonal: "No shooting, seasonal",
  no_rifle: "No rifles",
  shot_only: "Shotguns only",
  shot_only_seasonal: "Shotguns only, seasonal",
  non_toxic: "Non-toxic shot",
  no_hunting: "No hunting",
};
const KIND_LABEL: Record<BylawItem["kind"], string> = { municipality: "Municipality", electoral_area: "Electoral area", local_trust_area: "Islands Trust area" };
const LOOKUP_TYPES = [
  ["road", "Road"],
  ["water", "Lake, river or creek"],
  ["park", "Park"],
  ["reserve", "Reserve"],
  ["lot", "District lot number"],
  ["place", "Named place"],
] as const;

type Detail = ClosedAreaDetail | BylawDetail;
const isClosed = (d: Detail | null): d is ClosedAreaDetail => !!d && "sourceText" in d;

export function Editor() {
  const params = useParams<{ kind?: string; id?: string }>();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const kind: Kind = params.kind === "bylaws" ? "bylaws" : search.get("tab") === "bylaws" ? "bylaws" : "closed-areas";
  const folder = (search.get("folder") as Folder | "all" | null) ?? "not_done";
  const query = search.get("q") ?? "";
  const filter = search.get("f") ?? "";
  const setParam = (k: string, v: string) => {
    const s = new URLSearchParams(search);
    if (v) s.set(k, v);
    else s.delete(k);
    setSearch(s, { replace: true });
  };

  const [closed, setClosed] = useState<WorkbenchIndex<ClosedAreaItem> | null>(null);
  const [bylaws, setBylaws] = useState<WorkbenchIndex<BylawItem> | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [refLayers, setRefLayers] = useState<MapLayerInfo[]>([]);
  const [visibleRefs, setVisibleRefs] = useState<Set<string>>(new Set(["wmu"]));
  const [base, setBase] = useState<"topo" | "satellite">("topo");
  const [overlayOn, setOverlayOn] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const [focus, setFocus] = useState<GeoJSON.FeatureCollection | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const map = useRef<EditorMapHandle>(null);
  /** The item ("kind:id") the view was last zoomed to: reloading the same item keeps the view. */
  const fitted = useRef<string | null>(null);

  // The draft, with undo and redo.
  const [history, setHistory] = useState<{ past: Draft[]; now: Draft; future: Draft[] }>({ past: [], now: [], future: [] });
  const draft = history.now;
  const commit = useCallback((d: Draft) => setHistory((h) => ({ past: [...h.past.slice(-80), h.now], now: d, future: [] })), []);
  const live = useCallback((d: Draft) => setHistory((h) => ({ ...h, now: d })), []);
  const [mode, setMode] = useState<Mode>("view");
  const [sketch, setSketch] = useState<Position[]>([]);
  const [selected, setSelected] = useState<VertexPath | null>(null);
  const [bufferM, setBufferM] = useState(400);
  const [radiusM, setRadiusM] = useState(1000);
  const [lookup, setLookup] = useState<{ type: string; name: string; results: GeoJSON.Feature[]; note: string | null; picked: number | null; busy: boolean }>({
    type: "road",
    name: "",
    results: [],
    note: null,
    picked: null,
    busy: false,
  });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchIndex<ClosedAreaItem>("closed-areas").then(setClosed, (e: Error) => setIndexError(e.message));
    fetchIndex<BylawItem>("bylaws").then(setBylaws, (e: Error) => setIndexError(e.message));
    fetchMapLayers().then((ls) => setRefLayers(ls), () => setRefLayers([]));
    fetchContributionStatus().then((s) => setEnabled(s.enabled), () => setEnabled(false));
    document.title = "Map editor · SlotScout";
  }, []);

  const reloadIndex = () => {
    fetchIndex<ClosedAreaItem>("closed-areas").then(setClosed, () => undefined);
    fetchIndex<BylawItem>("bylaws").then(setBylaws, () => undefined);
  };

  // Load the selected item; restore an unsent draft for it.
  const loadDetail = useCallback(
    (k: Kind, id: string, fit: boolean) => {
      setDetailError(null);
      (k === "closed-areas" ? fetchClosedArea(id) : fetchBylaw(id)).then(
        (d) => {
          setDetail(d);
          const firstMap = isClosed(d) ? (d.maps.find((m) => m.overlay) ?? d.maps[0] ?? null) : null;
          setMapRef(firstMap);
          // Normally the list already zoomed to the item's area; if not, the shape, else the area's outline (below).
          const b = fit && fitted.current !== `${k}:${id}` ? bboxOf(d.shapes) : null;
          if (b) {
            map.current?.fitBounds(b);
            fitted.current = `${k}:${id}`;
          }
        },
        (e: Error) => setDetailError(e.message),
      );
    },
    [],
  );

  useEffect(() => {
    if (!params.id) {
      setDetail(null);
      return;
    }
    const k: Kind = params.kind === "bylaws" ? "bylaws" : "closed-areas";
    setFocus(null);
    setHighlight(null);
    setMode("view");
    setSketch([]);
    setSelected(null);
    setLookup((l) => ({ ...l, results: [], picked: null, note: null }));
    const saved = drafts.get(k, params.id);
    setHistory({ past: [], now: saved ?? [], future: [] });
    setNotice(saved ? "Your unsent drawing for this item was restored from this browser." : null);
    loadDetail(k, params.id, true);
  }, [params.kind, params.id, loadDetail]);

  // The area the item sits in, drawn as a dashed outline and used to clip.
  useEffect(() => {
    if (!detail) return;
    let req: Promise<GeoJSON.FeatureCollection> | null = null;
    if (isClosed(detail)) {
      const w = detail.extracted.within?.name ?? "";
      const mu = w.match(/(\d{1,2})\s*-\s*0*(\d{1,3})/);
      if (mu) req = fetchBoundary("wmu", `${mu[1]}-${mu[2]}`);
    } else req = fetchBoundary(detail.kind, detail.name);
    if (!req) return;
    let gone = false;
    req.then(
      (fc) => {
        if (gone) return;
        setFocus(fc);
        const key = `${isClosed(detail) ? "closed-areas" : "bylaws"}:${detail.id}`;
        if (fitted.current !== key && fc.features.length) {
          const b = bboxOf(fc);
          if (b) map.current?.fitBounds(b);
          fitted.current = key;
        }
      },
      () => undefined,
    );
    return () => {
      gone = true;
    };
  }, [detail]);

  // Keep the unsent drawing in this browser.
  useEffect(() => {
    if (params.id) drafts.set(kind, params.id, draft);
  }, [draft, kind, params.id]);

  const index = kind === "closed-areas" ? closed : bylaws;
  const filters = useMemo(() => {
    if (kind === "closed-areas") return [...new Set((closed?.items ?? []).map((i) => (i.region ? `${i.region}|Region ${i.region}${i.regionName ? `, ${i.regionName}` : ""}` : "")).filter(Boolean))].sort((a, b) => Number(a.split("|")[0]) - Number(b.split("|")[0]));
    return [...new Set((bylaws?.items ?? []).map((i) => (i.regionalDistrict ? `${i.regionalDistrict}|${i.regionalDistrict}` : "")).filter(Boolean))].sort();
  }, [kind, closed, bylaws]);
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = (index?.items ?? []) as (ClosedAreaItem | BylawItem)[];
    return all.filter((i) => {
      if (folder !== "all" && i.folder !== folder) return false;
      if (filter && ("region" in i ? i.region !== filter : i.regionalDistrict !== filter)) return false;
      if (!q) return true;
      const hay = "title" in i ? `${i.id} ${i.title} ${i.state} ${i.regionName ?? ""} ${i.effect ?? ""}` : `${i.name} ${i.key} ${i.regionalDistrict ?? ""} ${i.state}`;
      return hay.toLowerCase().includes(q);
    });
  }, [index, folder, filter, query]);

  // Picking an item zooms the map to its general area at once (worked out ahead in data/workbench), before its details load.
  const current = useMemo(() => (params.id ? ((index?.items ?? []) as (ClosedAreaItem | BylawItem)[]).find((i) => i.id === params.id) ?? null : null), [index, params.id]);
  const zoomToItem = useCallback(
    (force: boolean) => {
      if (!params.id) return;
      const key = `${kind}:${params.id}`;
      if (!force && fitted.current === key) return;
      const b = current?.bbox ?? (detail ? (bboxOf(detail.shapes) ?? (focus ? bboxOf(focus) : null)) : null);
      if (!b) return;
      map.current?.fitBounds(b);
      fitted.current = key;
    },
    [params.id, kind, current, detail, focus],
  );
  useEffect(() => zoomToItem(false), [current, zoomToItem]);
  const open = (id: string) => {
    if (id === params.id) return zoomToItem(true);
    navigate({ pathname: `/editor/${kind}/${encodeURIComponent(id)}`, search: search.toString() });
  };
  const switchKind = (k: Kind) => {
    const s = new URLSearchParams(search);
    s.set("tab", k);
    s.delete("f");
    navigate({ pathname: "/editor", search: s.toString() });
  };

  // --- Drawing actions ---------------------------------------------------------------------------------------------
  const finishSketch = useCallback(() => {
    setSketch((pts) => {
      if (mode === "line") {
        const g = bufferLine(pts, bufferM);
        if (g) commit(addShape(draft, g));
      } else {
        const g = ringPolygon(pts);
        if (g) commit(mode === "hole" ? subtractShape(draft, g) : addShape(draft, g));
      }
      return [];
    });
  }, [mode, bufferM, draft, commit]);

  const undo = () => setHistory((h) => (h.past.length ? { past: h.past.slice(0, -1), now: h.past[h.past.length - 1]!, future: [h.now, ...h.future] } : h));
  const redo = () => setHistory((h) => (h.future.length ? { past: [...h.past, h.now], now: h.future[0]!, future: h.future.slice(1) } : h));
  const removeCorner = () => {
    if (!selected) return;
    commit(deleteVertex(draft, selected));
    setSelected(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "Escape") {
        setSketch([]);
        setMode((m) => (m === "edit" ? "view" : m === "view" ? "view" : "edit"));
      } else if (e.key === "Enter" && sketch.length) finishSketch();
      else if ((e.key === "Delete" || e.key === "Backspace") && mode === "edit" && selected) {
        e.preventDefault();
        removeCorner();
      } else if (e.key === "Backspace" && sketch.length) setSketch((s) => s.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const runLookup = async () => {
    setLookup((l) => ({ ...l, busy: true, note: null, results: [], picked: null }));
    try {
      const r = await fetchLookup(lookup.type, lookup.name, map.current?.bounds() ?? null);
      setLookup((l) => ({ ...l, busy: false, results: r.features, note: r.features.length ? `${r.features.length} found in ${r.layer?.split(".").pop()}` : (r.note ?? "nothing found") }));
      if (r.features.length) {
        setMode("pick");
        const b = bboxOf({ type: "FeatureCollection", features: r.features });
        if (b) map.current?.fitBounds(b);
      }
    } catch (e) {
      setLookup((l) => ({ ...l, busy: false, note: (e as Error).message }));
    }
  };
  const addLookup = (all: boolean) => {
    const feats = all ? lookup.results : lookup.picked !== null ? [lookup.results[lookup.picked]!] : [];
    let d = draft;
    for (const f of feats) {
      const g = bufferShape(f.geometry, f.geometry.type.includes("Polygon") && bufferM === 0 ? 0 : bufferM);
      if (g) d = addShape(d, g);
    }
    if (d !== draft) commit(d);
  };

  const focusGeom = useMemo(() => {
    const polys = (focus?.features ?? []).map((f) => f.geometry).filter((g): g is GeoJSON.Polygon | GeoJSON.MultiPolygon => !!g && (g.type === "Polygon" || g.type === "MultiPolygon"));
    if (!polys.length) return null;
    return polys.reduce<Draft>((d, g) => addShape(d, g), []);
  }, [focus]);

  const stats = useMemo(() => draftStats(draft), [draft]);
  const contributionsFc = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!detail) return null;
    return {
      type: "FeatureCollection",
      features: detail.contributions
        .filter((c) => c.geometry && c.status !== "rejected")
        .map((c) => ({ type: "Feature", geometry: c.geometry as GeoJSON.Geometry, properties: { id: c.id, status: c.status, highlight: c.id === highlight } })),
    };
  }, [detail, highlight]);
  const lookupFc = useMemo<GeoJSON.FeatureCollection>(
    () => ({ type: "FeatureCollection", features: lookup.results.map((f, idx) => ({ ...f, properties: { ...(f.properties ?? {}), idx, selected: idx === lookup.picked } })) }),
    [lookup.results, lookup.picked],
  );
  const overlay = mapRef?.overlay && overlayOn ? { image: imgUrl(mapRef.overlay.image), corners: mapRef.overlay.corners, opacity: overlayOpacity } : null;

  return (
    <div className="editor-page">
      <Header />
      <div className="editor">
        <aside className="editor-list" aria-label="Items to map">
          <div className="editor-tabs" role="tablist">
            <button role="tab" aria-selected={kind === "closed-areas"} onClick={() => switchKind("closed-areas")}>
              Closed areas
            </button>
            <button role="tab" aria-selected={kind === "bylaws"} onClick={() => switchKind("bylaws")}>
              Local bylaws
            </button>
          </div>
          <div className="editor-folders">
            {(["not_done", "not_confirmed", "confirmed", "all"] as const).map((f) => (
              <button key={f} className={`folder f-${f}${folder === f ? " on" : ""}`} onClick={() => setParam("folder", f)} title={f === "all" ? "Everything" : FOLDER_HELP[f]}>
                <span>{f === "all" ? "All" : FOLDER_LABEL[f]}</span>
                <b>{f === "all" ? (index?.items.length ?? "…") : (index?.counts[f] ?? "…")}</b>
              </button>
            ))}
          </div>
          <p className="hint editor-folder-help">{folder === "all" ? "Everything, in all three folders." : FOLDER_HELP[folder]}</p>
          <input className="editor-search" type="search" placeholder={kind === "closed-areas" ? "Search: W5-049, Harrison, Chilliwack…" : "Search: Mission, Area A, Fraser Valley…"} value={query} onChange={(e) => setParam("q", e.target.value)} />
          <select className="editor-filter" value={filter} onChange={(e) => setParam("f", e.target.value)} aria-label={kind === "closed-areas" ? "Hunting region" : "Regional district"}>
            <option value="">{kind === "closed-areas" ? "All hunting regions" : "All regional districts"}</option>
            {filters.map((f) => {
              const [v, label] = f.split("|");
              return (
                <option key={v} value={v}>
                  {label}
                </option>
              );
            })}
          </select>
          {indexError && <p className="error">The editor's data did not load: {indexError}</p>}
          <ul className="editor-items">
            {items.map((i) => {
              const id = i.id;
              const active = params.id === id;
              return (
                <li key={id}>
                  <button className={active ? "on" : ""} onClick={() => open(id)}>
                    <span className={`dot f-${i.folder}`} aria-hidden="true" />
                    <span className="it-main">
                      <b>{"title" in i ? `${i.id} ${i.title}` : i.name}</b>
                      <small>{i.state}</small>
                    </span>
                    <span className="it-meta">
                      {"km2" in i && i.km2 !== null && <small>{i.km2 < 10 ? i.km2.toFixed(1) : Math.round(i.km2)} km²</small>}
                      {"hasMap" in i && i.hasMap && <small title="The Province's map is attached">map</small>}
                      {"hasPages" in i && i.hasPages && <small title="The bylaw's pages are attached">pages</small>}
                      {!!i.waiting && <small className="waiting" title="Contributions waiting for a second person">{i.waiting} waiting</small>}
                    </span>
                  </button>
                </li>
              );
            })}
            {index && !items.length && <li className="hint">Nothing here matches.</li>}
          </ul>
          <ReviewerBox />
        </aside>

        <section className="editor-mapwrap" aria-label="Map">
          <EditorMap
            ref={map}
            base={base}
            refLayers={refLayers}
            visibleRefs={visibleRefs}
            shapes={detail?.shapes ?? null}
            contributions={contributionsFc}
            focus={focus}
            overlay={overlay}
            lookup={lookup.results.length ? lookupFc : null}
            draft={draft}
            selectedVertex={selected}
            mode={mode}
            sketch={sketch}
            onDraftChange={(d, before) => (before ? setHistory((h) => ({ past: [...h.past.slice(-80), before], now: d, future: [] })) : live(d))}
            onSelectVertex={setSelected}
            onSketchChange={setSketch}
            onSketchFinish={finishSketch}
            onCircle={(c) => commit(addShape(draft, circleAt(c, radiusM)))}
            onLookupPick={(i) => setLookup((l) => ({ ...l, picked: i }))}
          />
          <div className="editor-mapbar">
            <div className="seg">
              <button className={base === "topo" ? "on" : ""} onClick={() => setBase("topo")}>
                Topo
              </button>
              <button className={base === "satellite" ? "on" : ""} onClick={() => setBase("satellite")}>
                Satellite
              </button>
            </div>
            <details className="refs">
              <summary>Reference layers ({visibleRefs.size})</summary>
              {refLayers.map((l) => (
                <label key={l.id}>
                  <input
                    type="checkbox"
                    checked={visibleRefs.has(l.id)}
                    onChange={(e) =>
                      setVisibleRefs((s) => {
                        const n = new Set(s);
                        if (e.target.checked) n.add(l.id);
                        else n.delete(l.id);
                        return n;
                      })
                    }
                  />
                  {l.label}
                </label>
              ))}
            </details>
            {params.id && (
              <button className="zoom-btn" onClick={() => zoomToItem(true)} title="Zoom the map to this item's area">
                Zoom to area
              </button>
            )}
            {current?.zoom === "province" && <span className="zoom-note">Not placed from its text: showing all of BC. Find it from the wording.</span>}
            {mapRef?.overlay && (
              <div className="overlay-ctl">
                <label>
                  <input type="checkbox" checked={overlayOn} onChange={(e) => setOverlayOn(e.target.checked)} /> Province's map
                </label>
                <input type="range" min={0} max={1} step={0.05} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} aria-label="Province's map see-through" />
              </div>
            )}
          </div>
          <div className="editor-legend">
            <span className="lg lg-approved">approved</span>
            <span className="lg lg-approx">approximate</span>
            <span className="lg lg-cand">drawn by code</span>
            <span className="lg lg-wait">sent, waiting</span>
            <span className="lg lg-ok">confirmed</span>
            <span className="lg lg-draft">your drawing</span>
          </div>
        </section>

        <aside className="editor-detail" aria-label="Details and tools">
          {!params.id && <EditorIntro enabled={enabled} />}
          {params.id && !detail && !detailError && <p className="hint">Loading…</p>}
          {detailError && <p className="error">{detailError}</p>}
          {detail && (
            <>
              {isClosed(detail) ? (
                <ClosedAreaPanel d={detail} mapRef={mapRef} onMapRef={setMapRef} onImage={setLightbox} />
              ) : (
                <BylawPanel d={detail} onImage={setLightbox} enabled={!!enabled} onSent={() => (loadDetail("bylaws", detail.id, false), reloadIndex())} />
              )}

              <section className="ed-card">
                <h3>{isClosed(detail) ? "Draw or fix the shape" : "Draw a no-shooting zone from the bylaw's map"}</h3>
                {notice && <p className="hint">{notice}</p>}
                <div className="ed-row">
                  <button
                    className="btn btn-sm"
                    disabled={!detail.shapes.features.length}
                    onClick={() => {
                      const feats = detail.shapes.features.filter((f) => f.properties?.status === "approved");
                      const src = feats.length ? feats : detail.shapes.features;
                      commit(src.reduce<Draft>((d, f) => (f.geometry ? addShape(d, f.geometry as GeoJSON.Polygon) : d), []));
                      setMode("edit");
                    }}
                  >
                    Start from the current shape
                  </button>
                  <button className="btn btn-sm btn-ghost" disabled={!draft.length} onClick={() => (commit([]), setSelected(null))}>
                    Clear
                  </button>
                </div>
                <div className="tools" role="toolbar" aria-label="Drawing tools">
                  {(
                    [
                      ["edit", "Move corners", "Drag a corner; drag a small white dot to add one; select a corner and press Delete to remove it."],
                      ["polygon", "Draw area", "Click each corner; click the first corner, double-click or press Enter to finish."],
                      ["hole", "Cut out", "Draw an area to remove from the shape."],
                      ["line", "Line + buffer", "Click along a road, river or line; finish to add a buffer around it."],
                      ["circle", "Circle", "Click a centre to add a circle of the radius below."],
                    ] as [Mode, string, string][]
                  ).map(([m, label, help]) => (
                    <button key={m} className={`tool${mode === m ? " on" : ""}`} title={help} onClick={() => (setSketch([]), setMode(mode === m ? "view" : m))}>
                      {label}
                    </button>
                  ))}
                </div>
                {mode !== "view" && mode !== "pick" && <p className="hint tool-help">{TOOL_HELP[mode]}</p>}
                {sketch.length > 0 && (
                  <div className="ed-row">
                    <button className="btn btn-sm btn-primary" onClick={finishSketch} disabled={sketch.length < (mode === "line" ? 2 : 3)}>
                      Finish ({sketch.length} points)
                    </button>
                    <button className="btn btn-sm" onClick={() => setSketch((s) => s.slice(0, -1))}>
                      Undo last point
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setSketch([])}>
                      Cancel
                    </button>
                  </div>
                )}
                <div className="ed-row nums">
                  <label>
                    Buffer <input type="number" min={0} max={20000} step={10} value={bufferM} onChange={(e) => setBufferM(Math.max(0, Number(e.target.value)))} /> m
                  </label>
                  <label>
                    Circle <input type="number" min={10} max={20000} step={50} value={radiusM} onChange={(e) => setRadiusM(Math.max(10, Number(e.target.value)))} /> m
                  </label>
                </div>
                <div className="ed-row">
                  <button className="btn btn-sm" onClick={undo} disabled={!history.past.length} title="Ctrl+Z">
                    Undo
                  </button>
                  <button className="btn btn-sm" onClick={redo} disabled={!history.future.length} title="Ctrl+Shift+Z">
                    Redo
                  </button>
                  <button className="btn btn-sm" onClick={removeCorner} disabled={!selected}>
                    Delete corner
                  </button>
                  <button className="btn btn-sm" onClick={() => commit(simplifyDraft(draft, 5))} disabled={stats.corners < 20} title="Fewer corners, within 5 m">
                    Simplify
                  </button>
                  <button className="btn btn-sm" onClick={() => focusGeom && commit(clipTo(draft, toGeometry(focusGeom)!))} disabled={!focusGeom || !draft.length} title="Keep only the part inside the dashed area">
                    Clip to area
                  </button>
                </div>

                <details className="lookup" open={lookup.results.length > 0}>
                  <summary>Add an official feature by name</summary>
                  <div className="ed-row">
                    <select value={lookup.type} onChange={(e) => setLookup((l) => ({ ...l, type: e.target.value }))} aria-label="Feature type">
                      {LOOKUP_TYPES.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder={lookup.type === "lot" ? "e.g. 1855" : "Name as written"}
                      value={lookup.name}
                      onChange={(e) => setLookup((l) => ({ ...l, name: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && runLookup()}
                    />
                    <button className="btn btn-sm" onClick={runLookup} disabled={lookup.busy || lookup.name.trim().length < 2}>
                      {lookup.busy ? "…" : "Find"}
                    </button>
                  </div>
                  <p className="hint">Searches the official layers inside the map view. Roads, rivers and lots need the map zoomed to the area.</p>
                  {lookup.note && <p className="hint">{lookup.note}</p>}
                  {lookup.results.length > 0 && (
                    <>
                      <ul className="lookup-results">
                        {lookup.results.slice(0, 40).map((f, i) => (
                          <li key={i}>
                            <button className={lookup.picked === i ? "on" : ""} onClick={() => setLookup((l) => ({ ...l, picked: i }))}>
                              {String(f.properties?.label ?? `Feature ${i + 1}`)}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="ed-row">
                        <button className="btn btn-sm btn-primary" disabled={lookup.picked === null} onClick={() => addLookup(false)}>
                          Add selected{bufferM ? ` + ${bufferM} m` : ""}
                        </button>
                        <button className="btn btn-sm" onClick={() => addLookup(true)}>
                          Add all {lookup.results.length}
                          {bufferM ? ` + ${bufferM} m` : ""}
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => (setLookup((l) => ({ ...l, results: [], picked: null, note: null })), setMode("view"))}>
                          Clear
                        </button>
                      </div>
                    </>
                  )}
                </details>

                <p className={`ed-stats${stats.crossings ? " warn" : ""}`}>
                  {draft.length ? (
                    <>
                      Your drawing: {stats.km2 < 10 ? stats.km2.toFixed(2) : Math.round(stats.km2)} km², {stats.polygons} part{stats.polygons > 1 ? "s" : ""}, {stats.corners} corners
                      {stats.crossings ? `. It crosses itself in ${stats.crossings} place${stats.crossings > 1 ? "s" : ""}: move the corners apart before sending.` : "."}
                    </>
                  ) : (
                    "Nothing drawn yet."
                  )}
                </p>
                <SendBox
                  key={detail.id}
                  detail={detail}
                  draft={draft}
                  enabled={!!enabled}
                  crossings={stats.crossings}
                  onSent={() => {
                    commit([]);
                    if (params.id) drafts.set(kind, params.id, []);
                    setMode("view");
                    loadDetail(kind, detail.id, false);
                    reloadIndex();
                  }}
                />
              </section>

              <Contributions
                list={detail.contributions}
                highlight={highlight}
                onHighlight={(id) => {
                  setHighlight(id);
                  const c = detail.contributions.find((x) => x.id === id);
                  const b = c?.geometry ? bboxOf({ type: "FeatureCollection", features: [{ type: "Feature", geometry: c.geometry as GeoJSON.Geometry, properties: {} }] }) : null;
                  if (b) map.current?.fitBounds(b);
                }}
                onLoad={(c) => {
                  commit(fromGeometry(c.geometry as GeoJSON.Geometry));
                  setMode("edit");
                }}
                onReviewed={() => (loadDetail(kind, detail.id, false), reloadIndex())}
              />
            </>
          )}
        </aside>
      </div>
      {lightbox && (
        <div className="lightbox" role="dialog" aria-label={lightbox.title} onClick={() => setLightbox(null)}>
          <div className="lb-bar">
            <span>{lightbox.title}</span>
            <a href={lightbox.src} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              Open full size
            </a>
            <button className="btn btn-sm" onClick={() => setLightbox(null)}>
              Close
            </button>
          </div>
          <div className="lb-body" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.title} />
          </div>
        </div>
      )}
    </div>
  );
}

const TOOL_HELP: Record<Exclude<Mode, "view" | "pick">, string> = {
  edit: "Drag a blue corner to move it. Drag a small white dot to add a corner. Click a corner, then Delete corner (or the Delete key), to remove it.",
  polygon: "Click each corner of the area. Click the first corner, double-click or press Enter to finish. Overlapping areas join.",
  hole: "Click each corner of the part to remove, then finish.",
  line: "Click along the line (a road, river or boundary), then finish: the buffer distance is added on both sides.",
  circle: "Click the centre of the circle. Set its radius below.",
};

function bboxOf(fc: GeoJSON.FeatureCollection): [number, number, number, number] | null {
  let b: [number, number, number, number] | null = null;
  const visit = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === "number") {
      const [x, y] = c as number[];
      b = b ? [Math.min(b[0], x!), Math.min(b[1], y!), Math.max(b[2], x!), Math.max(b[3], y!)] : [x!, y!, x!, y!];
    } else if (Array.isArray(c)) c.forEach(visit);
  };
  for (const f of fc.features) if (f.geometry && "coordinates" in f.geometry) visit(f.geometry.coordinates);
  return b;
}

function EditorIntro({ enabled }: { enabled: boolean | null }) {
  return (
    <section className="ed-card intro">
      <h2>Map editor</h2>
      <p>
        Many of BC's shooting rules exist only as legal text: Wildlife Act closed areas and local firearm bylaws. This is where people turn them into map shapes, together. Pick something from the list: start with <b>Not done</b>.
      </p>
      <ol>
        <li>Read the exact wording on the right, with the Province's map or the bylaw's pages beside it.</li>
        <li>Draw the shape, or start from the current one and fix it. Tools can add a road, river, park or district lot by name, with a buffer.</li>
        <li>Send it with your name. A second person with a reviewer key checks and confirms it.</li>
        <li>Confirmed shapes go on the map with the next data update. Nothing anyone sends changes an answer before that.</li>
      </ol>
      <p className="hint">
        Missing a local bylaw? Open it under <b>Local bylaws</b> and send its link and what it says.
      </p>
      {enabled === false && <p className="error">Sending is switched off on this server right now, so drawings can be made but not sent.</p>}
      <p className="hint">
        Shapes here are for reference while they are drawn. The checks on the <Link to="/">map</Link> use only shapes a second person confirmed.
      </p>
    </section>
  );
}

function Pill({ folder, state }: { folder: Folder; state: string }) {
  return (
    <p className={`ed-pill f-${folder}`}>
      <b>{FOLDER_LABEL[folder]}</b> · {state}
    </p>
  );
}

function ClosedAreaPanel({ d, mapRef, onMapRef, onImage }: { d: ClosedAreaDetail; mapRef: MapRef | null; onMapRef(m: MapRef): void; onImage(i: { src: string; title: string }): void }) {
  const x = d.extracted;
  return (
    <>
      <section className="ed-card">
        <h2>
          {d.id} {d.heading}
        </h2>
        <Pill folder={d.folder} state={d.state} />
        <p className="ed-sub">
          {EFFECT[x.effect ?? ""] ?? x.effect ?? "Closed area"}
          {x.period ? `, ${x.period.start} to ${x.period.end}` : ""}
          {x.within ? ` · in ${x.within.name}` : ""}
        </p>
        <h3>Exact wording</h3>
        <blockquote className="legal">{d.sourceText}</blockquote>
        <p className="hint">
          {d.sourceVersion}.{" "}
          {d.sourceUrl && (
            <a href={d.sourceUrl} target="_blank" rel="noreferrer">
              Closed Areas Regulation on BC Laws
            </a>
          )}
        </p>
      </section>

      {d.maps.length > 0 && (
        <section className="ed-card">
          <h3>The Province's map</h3>
          {d.maps.map((m) => (
            <div key={m.file} className="ed-map">
              {m.page && (
                <button className="thumb" onClick={() => onImage({ src: imgUrl(m.page!), title: m.title })} title="Open the map page">
                  <img src={imgUrl(m.page)} alt={`Page of ${m.title}`} loading="lazy" />
                </button>
              )}
              <div>
                <b>{m.title}</b>
                <p className="hint">
                  <a href={m.url} target="_blank" rel="noreferrer">
                    Original PDF
                  </a>
                  {m.overlay && (
                    <>
                      {" · "}
                      {mapRef?.file === m.file ? (
                        "laid over the map (use the slider)"
                      ) : (
                        <button className="linklike" onClick={() => onMapRef(m)}>
                          Lay over the map
                        </button>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="ed-card">
        <h3>What was read from the text</h3>
        <dl className="ed-facts">
          {x.within && (
            <>
              <dt>Area</dt>
              <dd>{x.within.name}</dd>
            </>
          )}
          {x.method && (
            <>
              <dt>Described as</dt>
              <dd>{METHOD[x.method] ?? x.method}</dd>
            </>
          )}
          {x.feature?.name && (
            <>
              <dt>Feature</dt>
              <dd>{x.feature.name}</dd>
            </>
          )}
          {x.road?.name && (
            <>
              <dt>Road</dt>
              <dd>{x.road.name}</dd>
            </>
          )}
          {x.bufferM !== null && (
            <>
              <dt>Distance</dt>
              <dd>{x.bufferM} m</dd>
            </>
          )}
        </dl>
        {x.steps.length > 0 && (
          <details>
            <summary>Boundary walk, step by step ({x.steps.length})</summary>
            <ol className="ed-steps">
              {x.steps.map((s, i) => (
                <li key={i}>
                  {s.follow && s.follow !== "straight_line" ? `along ${s.feature ?? s.follow}` : s.feature ? `${s.feature}` : "straight"}
                  {s.until ? ` → ${s.until}` : ""}
                </li>
              ))}
            </ol>
          </details>
        )}
        {!d.runsAgree && <p className="hint">The two independent readings of the text did not agree on everything; read the wording above carefully.</p>}
        {d.why.length > 0 && (
          <details>
            <summary>Notes from the checks ({d.why.length})</summary>
            <ul className="ed-why">
              {d.why.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </details>
        )}
        {d.construction.length > 0 && (
          <details>
            <summary>How the current shape was made</summary>
            <ul className="ed-why">
              {d.construction.map((c, i) => (
                <li key={i}>{c.what}</li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </>
  );
}

const METHOD: Record<string, string> = {
  admin_boundary: "a named area (park, island, reserve, lots, management unit)",
  road_buffer: "a distance from a road or roads",
  waterbody_buffer: "a distance from a lake, river or creek",
  metes_and_bounds: "a boundary walk (commencing at … thence along …)",
  other: "something else (read the wording)",
};

function BylawPanel({ d, onImage, enabled, onSent }: { d: BylawDetail; onImage(i: { src: string; title: string }): void; enabled: boolean; onSent(): void }) {
  return (
    <>
      <section className="ed-card">
        <h2>{d.name}</h2>
        <Pill folder={d.folder} state={d.state} />
        <p className="ed-sub">
          {KIND_LABEL[d.kind]}
          {d.regionalDistrict ? ` · ${d.regionalDistrict}` : ""}
        </p>
        {d.entry.bylaw?.title && (
          <p>
            <b>{d.entry.bylaw.title}</b>
            {d.entry.bylaw.number ? `, Bylaw ${d.entry.bylaw.number}` : ""}
            {d.entry.bylaw.url && (
              <>
                {" · "}
                <a href={d.entry.bylaw.url} target="_blank" rel="noreferrer">
                  bylaw
                </a>
              </>
            )}
          </p>
        )}
        {d.entry.notes && <p className="hint">{d.entry.notes}</p>}
        <p className="hint">
          Find it:{" "}
          {d.website && (
            <>
              <a href={d.website} target="_blank" rel="noreferrer">
                {d.kind === "electoral_area" ? "regional district site" : "official website"}
              </a>
              {" · "}
            </>
          )}
          <a href={d.searchUrl} target="_blank" rel="noreferrer">
            web search
          </a>
        </p>
      </section>
      {d.docs.map((doc) => (
        <section className="ed-card" key={doc.doc}>
          <h3>
            {doc.title}
            {doc.number ? `, Bylaw ${doc.number}` : ""}
          </h3>
          <p className="hint">
            {doc.url && (
              <a href={doc.url} target="_blank" rel="noreferrer">
                Original
              </a>
            )}{" "}
            · read twice, {doc.runsAgree ? "the readings agree" : "the readings differ"} · answer: {doc.targetShooting ?? "unclear"}
          </p>
          {doc.pages.length > 0 && (
            <div className="ed-pages">
              {doc.pages.map((p, i) => (
                <button key={p} className="thumb" onClick={() => onImage({ src: imgUrl(p), title: `${doc.title}, page ${i + 1}` })}>
                  <img src={imgUrl(p)} alt={`Page ${i + 1}`} loading="lazy" />
                  <small>p. {i + 1}</small>
                </button>
              ))}
            </div>
          )}
          {doc.prohibitions.length > 0 && (
            <details open>
              <summary>Prohibitions ({doc.prohibitions.length})</summary>
              <ul className="ed-why">
                {doc.prohibitions.map((x, i) => (
                  <li key={i}>“{x.quote}”</li>
                ))}
              </ul>
            </details>
          )}
          {doc.distanceRules.length > 0 && (
            <details>
              <summary>Distance rules ({doc.distanceRules.length})</summary>
              <ul className="ed-why">
                {doc.distanceRules.map((x, i) => (
                  <li key={i}>
                    {x.distance_m ? `${x.distance_m} m: ` : ""}“{x.quote}”
                  </li>
                ))}
              </ul>
            </details>
          )}
          {doc.scheduleMaps.length > 0 && (
            <details open>
              <summary>Zone maps the bylaw refers to ({doc.scheduleMaps.length})</summary>
              <ul className="ed-why">
                {doc.scheduleMaps.map((x, i) => (
                  <li key={i}>
                    <b>{x.name}</b>: {x.description}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {doc.text && (
            <details>
              <summary>Full text as read</summary>
              <blockquote className="legal">{doc.text}</blockquote>
            </details>
          )}
        </section>
      ))}
      <BylawAnswer d={d} enabled={enabled} onSent={onSent} />
    </>
  );
}

function BylawAnswer({ d, enabled, onSent }: { d: BylawDetail; enabled: boolean; onSent(): void }) {
  const [f, setF] = useState({ url: d.entry.bylaw?.url ?? "", title: d.entry.bylaw?.title ?? "", number: d.entry.bylaw?.number ?? "", targetShooting: "", quote: "", note: "", author: myName.get() });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const send = async () => {
    setBusy(true);
    setMsg(null);
    try {
      myName.set(f.author);
      await sendContribution({ kind: "bylaw", target: d.key, author: f.author, note: f.note, bylaw: { url: f.url, title: f.title, number: f.number, targetShooting: f.targetShooting, quote: f.quote } });
      setMsg({ ok: true, text: "Sent. A second person will check it against the bylaw." });
      onSent();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="ed-card">
      <h3>Send what the bylaw says</h3>
      <p className="hint">Found the firearm discharge bylaw? Give its link and its own words; a second person checks them.</p>
      <div className="form">
        <label>
          Link to the bylaw <input type="url" value={f.url} onChange={set("url")} placeholder="https://…" />
        </label>
        <label>
          Title <input value={f.title} onChange={set("title")} placeholder="Firearms Discharge Bylaw" />
        </label>
        <label>
          Number <input value={f.number} onChange={set("number")} placeholder="1234" />
        </label>
        <fieldset>
          <legend>Target shooting under this bylaw</legend>
          <label>
            <input type="radio" name="ts" value="prohibited" checked={f.targetShooting === "prohibited"} onChange={set("targetShooting")} /> Banned everywhere the bylaw applies
          </label>
          <label>
            <input type="radio" name="ts" value="zoned" checked={f.targetShooting === "zoned"} onChange={set("targetShooting")} /> Banned only in zones or near places (then draw the zones)
          </label>
          <label>
            <input type="radio" name="ts" value="no_bylaw" checked={f.targetShooting === "no_bylaw"} onChange={set("targetShooting")} /> There is no discharge bylaw here
          </label>
        </fieldset>
        <label>
          The bylaw's own words <textarea rows={4} value={f.quote} onChange={set("quote")} placeholder="Copy the sentence that says so, word for word." />
        </label>
        <label>
          Your name <input value={f.author} onChange={set("author")} autoComplete="name" />
        </label>
        <label>
          Note (optional) <input value={f.note} onChange={set("note")} />
        </label>
        <button className="btn btn-primary" disabled={!enabled || busy || !f.url || !f.targetShooting || f.quote.length < 10 || f.author.trim().length < 2} onClick={send}>
          {busy ? "Sending…" : "Send for checking"}
        </button>
        {msg && <p className={msg.ok ? "ok" : "error"}>{msg.text}</p>}
      </div>
    </section>
  );
}

function SendBox({ detail, draft, enabled, crossings, onSent }: { detail: Detail; draft: Draft; enabled: boolean; crossings: number; onSent(): void }) {
  const closedArea = isClosed(detail);
  const [author, setAuthor] = useState(myName.get());
  const [note, setNote] = useState("");
  const [exact, setExact] = useState(false);
  const [schedule, setSchedule] = useState("");
  const [effect, setEffect] = useState("no_shooting");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const geometry = toGeometry(draft);
  const send = async () => {
    if (!geometry) return;
    setBusy(true);
    setMsg(null);
    try {
      myName.set(author);
      await sendContribution(
        closedArea
          ? { kind: "closed_area", target: detail.id, author, note, geometry, exact }
          : { kind: "bylaw_zone", target: (detail as BylawDetail).key, author, note, geometry, exact, zone: { schedule, effect } },
      );
      setMsg({ ok: true, text: "Sent. It shows on the map in orange until a second person checks it." });
      onSent();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="form send">
      {!closedArea && (
        <>
          <label>
            Zone or schedule name <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Schedule X (Gun Lake)" />
          </label>
          <label>
            In this zone{" "}
            <select value={effect} onChange={(e) => setEffect(e.target.value)}>
              <option value="no_shooting">no shooting</option>
              <option value="no_rifle">no rifles</option>
              <option value="shot_only">shotguns only</option>
            </select>
          </label>
        </>
      )}
      <label className="check">
        <input type="checkbox" checked={exact} onChange={(e) => setExact(e.target.checked)} /> It follows the legal boundary exactly (leave unticked if it is approximate)
      </label>
      <label>
        Your name <input value={author} onChange={(e) => setAuthor(e.target.value)} autoComplete="name" />
      </label>
      <label>
        Note for the checker (optional) <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="How you drew it, what is uncertain" />
      </label>
      <button className="btn btn-primary" disabled={!enabled || busy || !geometry || crossings > 0 || author.trim().length < 2 || (!closedArea && !schedule.trim())} onClick={send}>
        {busy ? "Sending…" : "Send for checking"}
      </button>
      {!enabled && <p className="hint">Sending is switched off on this server.</p>}
      {msg && <p className={msg.ok ? "ok" : "error"}>{msg.text}</p>}
    </div>
  );
}

function ReviewerBox() {
  const [key, setKey] = useState(reviewerKey.get());
  const [name, setName] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (key) checkReviewer(key).then((r) => setName(r.name), () => setName(null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (name)
    return (
      <div className="reviewer on">
        Reviewing as <b>{name}</b>.{" "}
        <button
          className="linklike"
          onClick={() => {
            reviewerKey.set("");
            setKey("");
            setName(null);
            window.dispatchEvent(new Event("slotscout-reviewer"));
          }}
        >
          Sign out
        </button>
      </div>
    );
  return (
    <details className="reviewer">
      <summary>I'm a reviewer</summary>
      <div className="ed-row">
        <input type="password" placeholder="Reviewer key" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
        <button
          className="btn btn-sm"
          onClick={() =>
            checkReviewer(key).then(
              (r) => {
                reviewerKey.set(key);
                setName(r.name);
                setErr(null);
                window.dispatchEvent(new Event("slotscout-reviewer"));
              },
              (e: Error) => setErr(e.message),
            )
          }
        >
          Sign in
        </button>
      </div>
      {err && <p className="error">{err}</p>}
      <p className="hint">Reviewers confirm or reject what others send. The key stays in this browser tab only.</p>
    </details>
  );
}

function useReviewer(): { key: string; name: string | null } {
  const [state, setState] = useState<{ key: string; name: string | null }>({ key: reviewerKey.get(), name: null });
  useEffect(() => {
    const check = () => {
      const key = reviewerKey.get();
      if (!key) return setState({ key: "", name: null });
      checkReviewer(key).then((r) => setState({ key, name: r.name }), () => setState({ key: "", name: null }));
    };
    check();
    window.addEventListener("slotscout-reviewer", check);
    return () => window.removeEventListener("slotscout-reviewer", check);
  }, []);
  return state;
}

const STATUS_LABEL: Record<ContributionView["status"], string> = { waiting: "waiting for a second person", confirmed: "confirmed, goes live with the next update", rejected: "rejected", published: "on the map" };

function Contributions({ list, highlight, onHighlight, onLoad, onReviewed }: { list: ContributionView[]; highlight: string | null; onHighlight(id: string): void; onLoad(c: ContributionView): void; onReviewed(): void }) {
  const reviewer = useReviewer();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  if (!list.length) return null;
  const review = async (id: string, decision: "confirmed" | "rejected") => {
    setErr(null);
    try {
      await reviewContribution(reviewer.key, id, decision, notes[id] ?? "");
      onReviewed();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <section className="ed-card">
      <h3>Contributions ({list.length})</h3>
      {err && <p className="error">{err}</p>}
      <ul className="contribs">
        {list.map((c) => (
          <li key={c.id} className={`c-${c.status}${highlight === c.id ? " on" : ""}`}>
            <p>
              <b>{c.kind === "bylaw" ? "Bylaw answer" : c.kind === "bylaw_zone" ? `Zone: ${c.zone?.schedule ?? ""}` : c.exact ? "Exact outline" : "Approximate outline"}</b> by {c.author}, {c.createdAt.slice(0, 10)}
              <br />
              <small>{STATUS_LABEL[c.status]}</small>
              {c.review && (
                <small>
                  {" "}
                  ({c.review.decision} by {c.review.by}
                  {c.review.note ? `: ${c.review.note}` : ""})
                </small>
              )}
            </p>
            {c.note && <p className="hint">“{c.note}”</p>}
            {c.bylaw && (
              <p className="hint">
                {c.bylaw.targetShooting} ·{" "}
                <a href={c.bylaw.url} target="_blank" rel="noreferrer">
                  {c.bylaw.title} {c.bylaw.number}
                </a>
                <br />“{c.bylaw.quote}”
              </p>
            )}
            <div className="ed-row">
              {c.geometry && (
                <>
                  <button className="btn btn-sm" onClick={() => onHighlight(c.id)}>
                    Show
                  </button>
                  <button className="btn btn-sm" onClick={() => onLoad(c)} title="Copy it into your drawing to improve it">
                    Improve it
                  </button>
                </>
              )}
            </div>
            {reviewer.name && c.status === "waiting" && (
              <div className="ed-row review">
                <input placeholder="Note (optional)" value={notes[c.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))} />
                <button className="btn btn-sm btn-primary" disabled={c.author.trim().toLowerCase() === reviewer.name.trim().toLowerCase()} title={c.author.trim().toLowerCase() === reviewer.name.trim().toLowerCase() ? "A second person must confirm what you sent" : "Checked against the wording: confirm"} onClick={() => review(c.id, "confirmed")}>
                  Confirm
                </button>
                <button className="btn btn-sm" onClick={() => review(c.id, "rejected")}>
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
