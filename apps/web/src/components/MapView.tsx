import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { AttributionControl, Map as MlMap, Marker, NavigationControl, ScaleControl, GeolocateControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre 6 loads its worker from a separate module; let the bundler emit it and point MapLibre at it.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { circlePolygon, destination, type LatLon, type SpotReport, type VerdictState } from "@slotscout/engine";
import type { FinderCandidate, MapLayerInfo } from "../lib/api";
import { loadView, saveView } from "../lib/state";

setWorkerUrl(workerUrl);

export type BaseLayer = "auto" | "satellite" | "topo" | "light" | "dark";

export interface MapViewHandle {
  /** Fly to a point; with a radius, zoom out far enough to show the whole fall zone. */
  flyTo(point: LatLon, zoom?: number, radiusM?: number): void;
  fitBounds(b: [number, number, number, number]): void;
  center(): LatLon;
  zoom(): number;
}

interface Props {
  base: BaseLayer;
  overlays: MapLayerInfo[];
  visible: Set<string>;
  overlayOpacity: number;
  pin: LatLon | null;
  report: SpotReport | null;
  loading: boolean;
  previewRadiusM: number;
  candidates: FinderCandidate[];
  onPick(p: LatLon): void;
  onCandidate(c: FinderCandidate): void;
  onZoom?(z: number): void;
}

type StyleInput = Exclude<Parameters<MlMap["setStyle"]>[0], null | string>;

const VERDICT_COLOR: Record<VerdictState, string> = { red: "#b42318", amber: "#b77400", grey: "#5f6b7a", green: "#1e7a3c" };
const BC_BOUNDS: [[number, number], [number, number]] = [
  [-139.1, 48.2],
  [-114.0, 60.0],
];

const SAT_ATTR = 'Imagery © <a href="https://www.esri.com/">Esri</a>, Vantor, Earthstar Geographics';
const BC_ATTR = 'BC Basemap © <a href="https://www2.gov.bc.ca/gov/content/data/open-data/open-government-licence-bc">Province of British Columbia</a>';
const RULES_ATTR = 'Rule layers: <a href="https://catalogue.data.gov.bc.ca/">BC Data Catalogue</a> (OGL-BC)';

/** Raster base styles. "auto" shows topo when zoomed out and satellite from zoom 11 (PRD 9.1). */
function rasterStyle(base: "auto" | "satellite" | "topo"): StyleInput {
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      topo: {
        type: "raster",
        tiles: ["https://maps.gov.bc.ca/arcgis/rest/services/province/web_mercator_cache/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
        maxzoom: 16,
        attribution: BC_ATTR,
      },
      satellite: {
        type: "raster",
        tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
        maxzoom: 19,
        attribution: SAT_ATTR,
      },
      places: {
        type: "raster",
        tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
        maxzoom: 19,
      },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": "#e8e4da" } },
      { id: "topo", type: "raster", source: "topo", layout: { visibility: base === "satellite" ? "none" : "visible" } },
      {
        id: "satellite",
        type: "raster",
        source: "satellite",
        minzoom: base === "auto" ? 11 : 0,
        layout: { visibility: base === "topo" ? "none" : "visible" },
        paint: { "raster-fade-duration": 200 },
      },
      {
        id: "places",
        type: "raster",
        source: "places",
        minzoom: base === "auto" ? 11 : 0,
        layout: { visibility: base === "topo" ? "none" : "visible" },
      },
    ],
  } as StyleInput;
}

function styleFor(base: BaseLayer): StyleInput | string {
  if (base === "light") return "https://tiles.openfreemap.org/styles/positron";
  if (base === "dark") return "https://tiles.openfreemap.org/styles/dark";
  return rasterStyle(base);
}

function pinSvg(state: VerdictState | "pending"): string {
  const fill = state === "pending" ? "#0e2a47" : VERDICT_COLOR[state];
  return `<svg viewBox="0 0 32 40" class="pin-svg" aria-hidden="true"><path d="M16 1C8.3 1 2 7.3 2 15c0 10.2 14 24 14 24s14-13.8 14-24C30 7.3 23.7 1 16 1z" fill="${fill}" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15" r="5" fill="#fff"/></svg>`;
}

function fanPolygon(center: LatLon, bearing: number, radius: number): GeoJSON.Polygon {
  const pts: [number, number][] = [[center.lon, center.lat]];
  for (let b = bearing - 35; b <= bearing + 35; b += 5) {
    const p = destination(center, b, radius);
    pts.push([p.lon, p.lat]);
  }
  pts.push([center.lon, center.lat]);
  return { type: "Polygon", coordinates: [pts] };
}

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

export const MapView = forwardRef<MapViewHandle, Props>(function MapView(props, ref) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  /** True once the current base style has loaded and our layers are installed. */
  const styleReady = useRef(false);

  useImperativeHandle(ref, () => ({
    flyTo(point, zoom = 14, radiusM) {
      const map = mapRef.current;
      if (!map) return;
      const el = map.getContainer();
      // On phones the report sheet covers the lower part of the map: keep the pin in the visible part.
      const phone = window.matchMedia("(max-width: 820px)").matches;
      const bottom = phone ? Math.round(el.clientHeight * 0.55) : 0;
      let z = Math.max(zoom, map.getZoom());
      if (radiusM) {
        const visible = Math.min(el.clientWidth, el.clientHeight - bottom) * 0.8;
        const fit = Math.log2((156543.03 * Math.cos((point.lat * Math.PI) / 180) * visible) / (2 * radiusM));
        z = Math.min(zoom, fit);
      }
      map.flyTo({ center: [point.lon, point.lat], zoom: z, padding: { top: 0, left: 0, right: 0, bottom }, essential: true });
    },
    fitBounds(b) {
      mapRef.current?.fitBounds([b[0], b[1], b[2], b[3]], { padding: 40, maxZoom: 14 });
    },
    center() {
      const c = mapRef.current?.getCenter();
      return c ? { lat: c.lat, lon: c.lng } : { lat: 53.7, lon: -127.6 };
    },
    zoom() {
      return mapRef.current?.getZoom() ?? 5;
    },
  }));

  // Create the map once.
  useEffect(() => {
    if (!container.current) return;
    const view = loadView();
    const map = new MlMap({
      container: container.current,
      style: styleFor(props.base),
      ...(view ? { center: view.center, zoom: view.zoom } : { bounds: BC_BOUNDS, fitBoundsOptions: { padding: 20 } }),
      maxZoom: 19,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    map.addControl(new AttributionControl({ compact: true, customAttribution: RULES_ATTR }), "bottom-left");
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), "top-right");
    map.addControl(new ScaleControl({ unit: "metric" }), "bottom-right");
    map.touchZoomRotate.disableRotation();

    map.on("style.load", () => {
      styleReady.current = true;
      installOverlays(map);
    });
    map.on("moveend", () => {
      const c = map.getCenter();
      saveView({ center: [c.lng, c.lat], zoom: map.getZoom() });
      propsRef.current.onZoom?.(map.getZoom());
    });
    map.once("load", () => propsRef.current.onZoom?.(map.getZoom()));

    // Desktop: click drops the pin. Phone: long-press, so panning is never mistaken for a drop (PRD 2.3).
    let touchTimer: ReturnType<typeof setTimeout> | null = null;
    let touchStart: { x: number; y: number } | null = null;
    let lastTouch = 0;
    const canvas = map.getCanvasContainer();
    const onTouchStart = (e: TouchEvent) => {
      lastTouch = Date.now();
      if (e.touches.length !== 1) {
        if (touchTimer) clearTimeout(touchTimer);
        return;
      }
      const t = e.touches[0]!;
      touchStart = { x: t.clientX, y: t.clientY };
      touchTimer = setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        const ll = map.unproject([touchStart!.x - rect.left, touchStart!.y - rect.top]);
        navigator.vibrate?.(15);
        propsRef.current.onPick({ lat: ll.lat, lon: ll.lng });
        touchTimer = null;
      }, 550);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (touchTimer && t && touchStart && Math.hypot(t.clientX - touchStart.x, t.clientY - touchStart.y) > 10) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    };
    const onTouchEnd = () => {
      lastTouch = Date.now();
      if (touchTimer) clearTimeout(touchTimer);
      touchTimer = null;
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);
    map.on("click", (e) => {
      if (Date.now() - lastTouch < 800) return;
      const hit = map.getLayer("candidates") ? map.queryRenderedFeatures(e.point, { layers: ["candidates"] })[0] : undefined;
      if (hit) {
        const i = Number(hit.properties?.i);
        const c = propsRef.current.candidates[i];
        if (c) return propsRef.current.onCandidate(c);
      }
      propsRef.current.onPick({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    });
    map.on("mouseenter", "candidates", () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", "candidates", () => (map.getCanvas().style.cursor = ""));

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** (Re)create our sources and layers on top of whatever base style is loaded. */
  function installOverlays(map: MlMap) {
    const p = propsRef.current;
    for (const l of p.overlays) {
      const id = `ov-${l.id}`;
      if (!map.getSource(id)) {
        map.addSource(id, {
          type: "raster",
          tiles: [`${location.origin}${l.tiles}`],
          tileSize: 256,
          minzoom: l.minzoom,
          maxzoom: 19,
        });
      }
      if (!map.getLayer(id)) {
        map.addLayer({
          id,
          type: "raster",
          source: id,
          minzoom: l.minzoom,
          layout: { visibility: p.visible.has(l.id) ? "visible" : "none" },
          paint: { "raster-opacity": p.overlayOpacity, "raster-fade-duration": 150 },
        });
      }
    }
    if (!map.getSource("digitised")) map.addSource("digitised", { type: "geojson", data: `${location.origin}/v1/digitised.geojson` });
    if (!map.getLayer("digitised-fill")) {
      map.addLayer({ id: "digitised-fill", type: "fill", source: "digitised", paint: { "fill-color": "#be185d", "fill-opacity": 0.18 } });
      map.addLayer({ id: "digitised-line", type: "line", source: "digitised", paint: { "line-color": "#9d174d", "line-width": 1.5, "line-dasharray": [3, 2] } });
    }
    for (const id of ["fz", "fan", "candidates-src"]) if (!map.getSource(id)) map.addSource(id, { type: "geojson", data: EMPTY });
    if (!map.getLayer("fz-fill")) {
      map.addLayer({ id: "fz-fill", type: "fill", source: "fz", paint: { "fill-color": ["get", "color"], "fill-opacity": 0.07 } });
      map.addLayer({ id: "fz-line", type: "line", source: "fz", paint: { "line-color": ["get", "color"], "line-width": 2.5, "line-dasharray": [4, 2] } });
      map.addLayer({ id: "fan-fill", type: "fill", source: "fan", paint: { "fill-color": "#1f6feb", "fill-opacity": 0.22 } });
      map.addLayer({ id: "fan-line", type: "line", source: "fan", paint: { "line-color": "#1f6feb", "line-width": 2 } });
      map.addLayer({
        id: "candidates",
        type: "circle",
        source: "candidates-src",
        paint: {
          "circle-radius": 9,
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5,
        },
      });
    }
    syncFallZone(map);
    syncCandidates(map);
  }

  function syncFallZone(map: MlMap) {
    const p = propsRef.current;
    const fz = map.getSource("fz") as { setData?: (d: GeoJSON.GeoJSON) => void } | undefined;
    const fan = map.getSource("fan") as { setData?: (d: GeoJSON.GeoJSON) => void } | undefined;
    if (!fz?.setData || !fan?.setData) return;
    if (!p.pin) {
      fz.setData(EMPTY);
      fan.setData(EMPTY);
      return;
    }
    const state = p.report && !p.loading ? p.report.verdict.state : null;
    const radius = p.report && !p.loading ? p.report.fallZone.radiusM : p.previewRadiusM;
    const ring = circlePolygon(p.pin, radius, 96).map((q) => [q.lon, q.lat]);
    fz.setData({
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: { color: state ? VERDICT_COLOR[state] : "#0e2a47" }, geometry: { type: "Polygon", coordinates: [ring] } }],
    });
    const best = p.report && !p.loading ? p.report.fallZone.bestBearingDeg : null;
    fan.setData(
      best !== null && p.report
        ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: fanPolygon(p.pin, best, p.report.fallZone.radiusM) }] }
        : EMPTY,
    );
  }

  function syncCandidates(map: MlMap) {
    const src = map.getSource("candidates-src") as { setData?: (d: GeoJSON.GeoJSON) => void } | undefined;
    src?.setData?.({
      type: "FeatureCollection",
      features: propsRef.current.candidates.map((c, i) => ({
        type: "Feature",
        properties: { i, color: VERDICT_COLOR[c.verdict.state] },
        geometry: { type: "Point", coordinates: [c.point.lon, c.point.lat] },
      })),
    });
  }

  // Base layer switch.
  const firstBase = useRef(true);
  useEffect(() => {
    if (firstBase.current) {
      firstBase.current = false;
      return;
    }
    styleReady.current = false;
    mapRef.current?.setStyle(styleFor(props.base));
  }, [props.base]);

  // Overlay list arrives after the map is created.
  useEffect(() => {
    const map = mapRef.current;
    if (map && styleReady.current) installOverlays(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.overlays]);

  // Overlay visibility and opacity.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady.current) return;
    for (const l of props.overlays) {
      const id = `ov-${l.id}`;
      if (!map.getLayer(id)) continue;
      map.setLayoutProperty(id, "visibility", props.visible.has(l.id) ? "visible" : "none");
      map.setPaintProperty(id, "raster-opacity", props.overlayOpacity);
    }
  }, [props.visible, props.overlayOpacity, props.overlays]);

  // Pin marker, draggable; the report re-runs on release (PRD 2.3).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!props.pin) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const state = props.report && !props.loading ? props.report.verdict.state : "pending";
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = "pin";
      el.setAttribute("role", "img");
      markerRef.current = new Marker({ element: el, anchor: "bottom", draggable: true }).setLngLat([props.pin.lon, props.pin.lat]).addTo(map);
      markerRef.current.on("dragend", () => {
        const ll = markerRef.current!.getLngLat();
        propsRef.current.onPick({ lat: ll.lat, lon: ll.lng });
      });
    } else {
      markerRef.current.setLngLat([props.pin.lon, props.pin.lat]);
    }
    const el = markerRef.current.getElement();
    el.innerHTML = pinSvg(state);
    el.classList.toggle("loading", props.loading);
    el.setAttribute("aria-label", state === "pending" ? "Checking this spot" : `Spot verdict: ${props.report?.verdict.headline}`);
  }, [props.pin, props.report, props.loading]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && styleReady.current) syncFallZone(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.pin, props.report, props.loading, props.previewRadiusM]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && styleReady.current) syncCandidates(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.candidates]);

  return <div ref={container} className="map" aria-label="Map of British Columbia. Click, or long-press on a phone, to check a spot." role="application" />;
});
