import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Map as MlMap, NavigationControl, ScaleControl, type GeoJSONSource, type ImageSource, type MapLayerMouseEvent, type MapLayerTouchEvent, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Position } from "geojson";
import type { MapLayerInfo } from "../lib/api";
import { handles, moveVertex, insertVertex, type Draft, type VertexPath } from "../lib/geoedit";
import { BC_BOUNDS, rasterStyle } from "./MapView";

/**
 * The map editor's map: base map, official reference layers, the Province's own closed-area map laid over it,
 * the shapes that exist now, people's contributions, official features found by name, and the draft being
 * drawn, with corner handles to drag (mouse or touch), side handles to add a corner, and click-to-draw modes.
 */
export type Mode = "view" | "edit" | "polygon" | "hole" | "line" | "circle" | "pick";

export interface EditorMapHandle {
  fitBounds(b: [number, number, number, number]): void;
  bounds(): [number, number, number, number] | null;
}

interface Props {
  base: "topo" | "satellite";
  refLayers: MapLayerInfo[];
  visibleRefs: Set<string>;
  shapes: GeoJSON.FeatureCollection | null;
  contributions: GeoJSON.FeatureCollection | null;
  focus: GeoJSON.FeatureCollection | null;
  overlay: { image: string; corners: number[][]; opacity: number } | null;
  lookup: GeoJSON.FeatureCollection | null;
  draft: Draft;
  selectedVertex: VertexPath | null;
  mode: Mode;
  sketch: Position[];
  /** While dragging, `before` is null; when the drag ends it is the drawing from before it (the undo point). */
  onDraftChange(d: Draft, before: Draft | null): void;
  onSelectVertex(v: VertexPath | null): void;
  onSketchChange(pts: Position[]): void;
  onSketchFinish(): void;
  onCircle(center: Position): void;
  onLookupPick(i: number): void;
}

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
const VECTOR_SOURCES = ["focus", "shapes", "contribs", "lookup", "draft", "sketch", "mid", "vertex"] as const;

function sketchFc(mode: Mode, pts: Position[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = pts.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: p }, properties: {} }));
  if (pts.length >= 2) {
    const ring = mode === "line" ? pts : [...pts, pts[0]!];
    features.push({ type: "Feature", geometry: { type: "LineString", coordinates: ring }, properties: {} });
  }
  return { type: "FeatureCollection", features };
}

export const EditorMap = forwardRef<EditorMapHandle, Props>(function EditorMap(props, ref) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const ready = useRef(false);
  const p = useRef(props);
  p.current = props;
  const drag = useRef<{ path: VertexPath; start: Draft; moved: boolean; current: Draft } | null>(null);

  useImperativeHandle(ref, () => ({
    fitBounds(b) {
      mapRef.current?.fitBounds(
        [
          [b[0], b[1]],
          [b[2], b[3]],
        ],
        { padding: 48, maxZoom: 15, duration: 600 },
      );
    },
    bounds() {
      const b = mapRef.current?.getBounds();
      return b ? [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] : null;
    },
  }));

  useEffect(() => {
    const map = new MlMap({ container: container.current!, style: rasterStyle("topo"), bounds: BC_BOUNDS, attributionControl: { compact: true }, dragRotate: false });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");
    map.touchZoomRotate.disableRotation();

    map.on("load", () => {
      for (const id of VECTOR_SOURCES) map.addSource(id, { type: "geojson", data: EMPTY });
      const approx = ["==", ["get", "approximate"], true];
      map.addLayer({ id: "focus-line", type: "line", source: "focus", paint: { "line-color": "#0e2a47", "line-width": 2, "line-dasharray": [3, 2], "line-opacity": 0.7 } });
      map.addLayer({
        id: "shapes-fill",
        type: "fill",
        source: "shapes",
        paint: { "fill-color": ["case", ["==", ["get", "status"], "candidate"], "#7c3aed", approx as never, "#6b7280", "#be185d"], "fill-opacity": 0.14 },
      });
      map.addLayer({
        id: "shapes-line",
        type: "line",
        source: "shapes",
        paint: { "line-color": ["case", ["==", ["get", "status"], "candidate"], "#7c3aed", approx as never, "#4b5563", "#9d174d"], "line-width": 2, "line-dasharray": ["case", ["any", approx as never, ["==", ["get", "status"], "candidate"]], ["literal", [3, 2]], ["literal", [1, 0]]] as never },
      });
      map.addLayer({ id: "contribs-fill", type: "fill", source: "contribs", paint: { "fill-color": ["case", ["==", ["get", "status"], "waiting"], "#d97706", "#16a34a"], "fill-opacity": ["case", ["==", ["get", "highlight"], true], 0.25, 0.08] } });
      map.addLayer({
        id: "contribs-line",
        type: "line",
        source: "contribs",
        paint: { "line-color": ["case", ["==", ["get", "status"], "waiting"], "#d97706", "#16a34a"], "line-width": ["case", ["==", ["get", "highlight"], true], 3.5, 1.5], "line-dasharray": [2, 1.5] },
      });
      map.addLayer({ id: "lookup-fill", type: "fill", source: "lookup", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "#ea580c", "fill-opacity": ["case", ["==", ["get", "selected"], true], 0.3, 0.1] } });
      map.addLayer({ id: "lookup-line", type: "line", source: "lookup", paint: { "line-color": "#ea580c", "line-width": ["case", ["==", ["get", "selected"], true], 5, 2.5] } });
      map.addLayer({ id: "lookup-point", type: "circle", source: "lookup", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": ["case", ["==", ["get", "selected"], true], 8, 5], "circle-color": "#ea580c", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
      map.addLayer({ id: "draft-fill", type: "fill", source: "draft", paint: { "fill-color": "#1f6feb", "fill-opacity": 0.22 } });
      map.addLayer({ id: "draft-line", type: "line", source: "draft", paint: { "line-color": "#1f6feb", "line-width": 2.5 } });
      map.addLayer({ id: "sketch-line", type: "line", source: "sketch", paint: { "line-color": "#0ea5e9", "line-width": 2.5, "line-dasharray": [2, 1] } });
      map.addLayer({ id: "sketch-point", type: "circle", source: "sketch", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 5, "circle-color": "#0ea5e9", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
      map.addLayer({ id: "mid", type: "circle", source: "mid", paint: { "circle-radius": 4, "circle-color": "#fff", "circle-stroke-color": "#1f6feb", "circle-stroke-width": 1.5, "circle-opacity": 0.85 } });
      map.addLayer({
        id: "vertex",
        type: "circle",
        source: "vertex",
        paint: { "circle-radius": ["case", ["==", ["get", "selected"], true], 8, 5.5], "circle-color": ["case", ["==", ["get", "selected"], true], "#f59e0b", "#1f6feb"], "circle-stroke-color": "#fff", "circle-stroke-width": 2 },
      });
      ready.current = true;
      syncAll();
    });

    const lngLat = (e: MapMouseEvent | MapLayerTouchEvent): Position => [e.lngLat.lng, e.lngLat.lat];
    const startDrag = (path: VertexPath, start: Draft) => {
      drag.current = { path, start, moved: false, current: start };
      map.dragPan.disable();
    };
    const onVertexDown = (e: MapLayerMouseEvent | MapLayerTouchEvent) => {
      if (p.current.mode !== "edit" || !e.features?.length) return;
      e.preventDefault();
      const f = e.features[0]!.properties as { p: number; r: number; i: number };
      startDrag([f.p, f.r, f.i], p.current.draft);
    };
    const onMidDown = (e: MapLayerMouseEvent | MapLayerTouchEvent) => {
      if (p.current.mode !== "edit" || !e.features?.length) return;
      e.preventDefault();
      const f = e.features[0]!.properties as { p: number; r: number; i: number };
      const before = p.current.draft;
      const d = insertVertex(before, [f.p, f.r, f.i], lngLat(e));
      startDrag([f.p, f.r, f.i + 1], before);
      drag.current!.current = d;
      drag.current!.moved = true;
      p.current.onDraftChange(d, null);
    };
    const onMove = (e: MapMouseEvent | MapLayerTouchEvent) => {
      const d = drag.current;
      if (!d) return;
      d.moved = true;
      d.current = moveVertex(d.current, d.path, lngLat(e));
      p.current.onDraftChange(d.current, null);
    };
    const onUp = () => {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      map.dragPan.enable();
      if (d.moved) p.current.onDraftChange(d.current, d.start);
      p.current.onSelectVertex(d.path);
    };
    map.on("mousedown", "vertex", onVertexDown);
    map.on("touchstart", "vertex", onVertexDown);
    map.on("mousedown", "mid", onMidDown);
    map.on("touchstart", "mid", onMidDown);
    map.on("mousemove", onMove);
    map.on("touchmove", onMove);
    map.on("mouseup", onUp);
    map.on("touchend", onUp);

    map.on("click", (e) => {
      const { mode, sketch } = p.current;
      if (mode === "polygon" || mode === "hole" || mode === "line") {
        // Clicking the first corner again closes a ring.
        if (mode !== "line" && sketch.length >= 3) {
          const first = map.project(sketch[0] as [number, number]);
          if (Math.hypot(first.x - e.point.x, first.y - e.point.y) < 12) return p.current.onSketchFinish();
        }
        p.current.onSketchChange([...sketch, lngLat(e)]);
      } else if (mode === "circle") p.current.onCircle(lngLat(e));
      else if (mode === "pick") {
        const hit = map.queryRenderedFeatures(e.point, { layers: ["lookup-fill", "lookup-line", "lookup-point"] })[0];
        if (hit) p.current.onLookupPick(Number(hit.properties?.idx));
      } else if (mode === "edit") {
        const hit = map.queryRenderedFeatures(e.point, { layers: ["vertex"] })[0];
        if (!hit) p.current.onSelectVertex(null);
      }
    });
    map.on("dblclick", (e) => {
      if (["polygon", "hole", "line"].includes(p.current.mode)) {
        e.preventDefault();
        p.current.onSketchFinish();
      }
    });
    for (const layer of ["vertex", "mid", "lookup-fill", "lookup-line", "lookup-point"]) {
      map.on("mouseenter", layer, () => {
        if ((layer === "vertex" || layer === "mid") && p.current.mode !== "edit") return;
        if (layer.startsWith("lookup") && p.current.mode !== "pick") return;
        map.getCanvas().style.cursor = layer === "mid" ? "copy" : "pointer";
      });
      map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = cursorFor(p.current.mode)));
    }
    return () => {
      ready.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cursorFor = (mode: Mode) => (["polygon", "hole", "line", "circle"].includes(mode) ? "crosshair" : "");

  function setData(id: string, fc: GeoJSON.FeatureCollection | null) {
    (mapRef.current?.getSource(id) as GeoJSONSource | undefined)?.setData(fc ?? EMPTY);
  }

  function syncDraft() {
    const { draft, selectedVertex, mode } = p.current;
    setData("draft", { type: "FeatureCollection", features: draft.length ? [{ type: "Feature", geometry: draft.length === 1 ? { type: "Polygon", coordinates: draft[0]! } : { type: "MultiPolygon", coordinates: draft }, properties: {} }] : [] });
    const h = handles(draft);
    if (selectedVertex) for (const f of h.vertices.features) {
      const q = f.properties as { p: number; r: number; i: number; selected?: boolean };
      q.selected = q.p === selectedVertex[0] && q.r === selectedVertex[1] && q.i === selectedVertex[2];
    }
    setData("vertex", mode === "edit" ? h.vertices : null);
    setData("mid", mode === "edit" ? h.midpoints : null);
  }

  function syncOverlay() {
    const map = mapRef.current!;
    const o = p.current.overlay;
    const src = map.getSource("official-map") as ImageSource | undefined;
    if (!o) {
      if (map.getLayer("official-map")) map.removeLayer("official-map");
      if (src) map.removeSource("official-map");
      return;
    }
    const coordinates = o.corners as [[number, number], [number, number], [number, number], [number, number]];
    if (src && (src as unknown as { url?: string }).url === o.image) src.setCoordinates(coordinates);
    else {
      if (map.getLayer("official-map")) map.removeLayer("official-map");
      if (src) map.removeSource("official-map");
      map.addSource("official-map", { type: "image", url: o.image, coordinates });
      map.addLayer({ id: "official-map", type: "raster", source: "official-map", paint: { "raster-opacity": o.opacity, "raster-fade-duration": 0 } }, "focus-line");
    }
    map.setPaintProperty("official-map", "raster-opacity", o.opacity);
  }

  function syncRefs() {
    const map = mapRef.current!;
    const { refLayers, visibleRefs } = p.current;
    for (const l of refLayers) {
      const id = `ref-${l.id}`;
      const on = visibleRefs.has(l.id);
      if (on && !map.getSource(id)) {
        map.addSource(id, { type: "raster", tiles: [`${location.origin}${l.tiles}`], tileSize: 256, minzoom: l.minzoom });
        map.addLayer({ id, type: "raster", source: id, paint: { "raster-opacity": 0.85 } }, map.getLayer("official-map") ? "official-map" : "focus-line");
      } else if (!on && map.getSource(id)) {
        map.removeLayer(id);
        map.removeSource(id);
      }
    }
  }

  function syncAll() {
    if (!ready.current) return;
    const map = mapRef.current!;
    const { base, shapes, contributions, focus, lookup, mode, sketch } = p.current;
    map.setLayoutProperty("topo", "visibility", base === "satellite" ? "none" : "visible");
    for (const id of ["satellite", "places"]) {
      map.setLayoutProperty(id, "visibility", base === "satellite" ? "visible" : "none");
      map.setLayerZoomRange(id, 0, 24);
    }
    syncRefs();
    syncOverlay();
    setData("focus", focus);
    setData("shapes", shapes);
    setData("contribs", contributions);
    setData("lookup", lookup);
    setData("sketch", ["polygon", "hole", "line"].includes(mode) ? sketchFc(mode, sketch) : null);
    syncDraft();
    map.getCanvas().style.cursor = cursorFor(mode);
    if (["polygon", "hole", "line"].includes(mode)) map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
  }

  useEffect(syncAll, [props.base, props.shapes, props.contributions, props.focus, props.lookup, props.mode, props.sketch, props.refLayers, props.visibleRefs, props.overlay]);
  useEffect(() => {
    if (ready.current) syncDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.draft, props.selectedVertex, props.mode]);

  return <div ref={container} className="editor-map" aria-label="Editing map" />;
});
