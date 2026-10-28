import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Geometry, LineString, MultiPolygon, Polygon, Position } from "geojson";

/**
 * Closed-area maps the Province publishes (GeoBC georeferenced PDFs, linked from the hunting synopsis
 * page). Code reads each map's own coordinates. When the PDF keeps the closed-area layer, that layer is
 * the official outline. Otherwise the map frame is rendered with its georeferencing and the closed-area
 * symbol is picked out by colour (yellow-highlighted roads buffered by the distance the legend gives, or
 * a red outline filled in) and turned into polygons; those outlines are marked approximate.
 */
export interface MapRead {
  mapId: string | null;
  method: "layer" | "image" | null;
  style: "outline" | "highlight" | null;
  bufferM: number | null;
  /** How far the read outline can be off (metres): about ten pixels of the rendered map. */
  toleranceM: number | null;
  geometry: Polygon | MultiPolygon | null;
  problems: string[];
}

const run = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, {
    maxBuffer: 512 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }).toString("utf8");

export function gdalAvailable(): boolean {
  try {
    return /pdf/i.test(run("ogrinfo", ["--formats"]));
  } catch {
    return false;
  }
}

/** "closed_areas_reg_3-69_26.pdf" -> "3-69"; "closed_area_51-14_22.pdf" -> "5.1-14"; "nsa_5_139.pdf" -> "5-139". */
export function mapIdFromFile(name: string): string | null {
  const m = name.match(/closed_areas?(?:_reg)?_(\d+)-(\d+)[a-z]?_\d{2}\.pdf$/i) ?? name.match(/^nsa_(\d+)_(\d+)\.pdf$/i);
  if (!m) return null;
  const sched = m[1] === "51" ? "5.1" : m[1] === "81" ? "8.1" : m[1]!;
  return `${sched}-${m[2]}`;
}

interface Symbol {
  colour: "yellow" | "red" | "orange" | "purple";
  bufferM: number | null;
}

/** What the legend says the closed area is drawn as. */
export function legendSymbols(text: string): Symbol[] {
  const flat = text.replace(/\s+/g, " ");
  const out: Symbol[] = [];
  for (const m of flat.matchAll(/within (\d[\d,]*) ?m(?:etres)?\b[^.]{0,120}?highlighted in (yellow|red|orange|purple)/gi))
    out.push({
      colour: m[2]!.toLowerCase() as Symbol["colour"],
      bufferM: Number(m[1]!.replace(/,/g, "")),
    });
  // "within 800 m to the west and 400 m to the east … orange": the larger distance, both sides.
  for (const m of flat.matchAll(
    /within (\d+) ?m (?:to|on) the \w+(?: side)? and (\d+) ?m (?:to|on) the \w+(?: side)?[^.]{0,120}?highlighted in (yellow|red|orange|purple)/gi,
  )) {
    const c = m[3]!.toLowerCase() as Symbol["colour"];
    const d = Math.max(Number(m[1]), Number(m[2]));
    const s = out.find((x) => x.colour === c);
    if (s) s.bufferM = Math.max(s.bufferM ?? 0, d);
    else out.push({ colour: c, bufferM: d });
  }
  if (!out.length && /no (shooting|hunting)/i.test(flat)) out.push({ colour: "red", bufferM: null });
  return out;
}

const RGB: Record<Symbol["colour"], string> = {
  yellow: "logical_and(logical_and(A>225,B>215),C<110)",
  red: "logical_and(logical_and(A>190,B<90),C<90)",
  orange: "logical_and(logical_and(A>220,logical_and(B>110,B<190)),C<80)",
  purple: "logical_and(logical_and(A>110,A<200),logical_and(B<100,C>120))",
};

/** The official closed-area layer, when the PDF keeps one. */
function readLayer(pdf: string): Feature<Polygon | MultiPolygon> | null {
  let layers: string[];
  try {
    layers = run("ogrinfo", ["-ro", "-q", pdf])
      .split("\n")
      .map((l) =>
        l
          .replace(/^\d+: /, "")
          .replace(/ \(.*\)$/, "")
          .trim(),
      );
  } catch {
    return null;
  }
  const layer = layers.find((l) => /closed_areas_regulation_areas/i.test(l));
  if (!layer) return null;
  const fc = JSON.parse(run("ogr2ogr", ["-f", "GeoJSON", "-t_srs", "EPSG:4326", "/vsistdout/", pdf, layer])) as FeatureCollection<Geometry>;
  const polys: Feature<Polygon>[] = [];
  const lines: Position[][] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") polys.push(turf.polygon(g.coordinates));
    else if (g.type === "MultiPolygon") for (const c of g.coordinates) polys.push(turf.polygon(c));
    else if (g.type === "LineString") lines.push(g.coordinates);
    else if (g.type === "MultiLineString") lines.push(...g.coordinates);
  }
  // Outlines drawn as lines: each closed ring is an area.
  for (const l of lines)
    if (l.length > 3 && turf.distance(l[0]!, l[l.length - 1]!, { units: "meters" }) < 5) polys.push(turf.polygon([[...l.slice(0, -1), l[0]!]]));
  if (!polys.length && lines.length) {
    const pg = turf.polygonize(turf.featureCollection(lines.map((l) => turf.lineString(l)) as Feature<LineString>[]));
    polys.push(...(pg.features as Feature<Polygon>[]));
  }
  if (!polys.length) return null;
  return polys.length > 1 ? (turf.union(turf.featureCollection(polys)) as Feature<Polygon | MultiPolygon>) : polys[0]!;
}

const DPI = 150;

/**
 * The map frame warped north-up at 150 dpi with its own georeferencing, the symbol colour picked out,
 * specks removed and the pixels turned into polygons. Buffering and joining run in GDAL, in the map's
 * metres; outlines are closed (30 m) and filled in code, rings under 1% of the largest dropped.
 */
function readImage(
  pdf: string,
  symbols: Symbol[],
  work: string,
): { shape: Feature<Polygon | MultiPolygon> | null; toleranceM: number | null; problems: string[] } {
  const problems: string[] = [];
  const info = JSON.parse(run("gdalinfo", ["-json", pdf])) as {
    geoTransform?: number[];
    metadata?: Record<string, Record<string, string>>;
  };
  const neat = info.metadata?.[""]?.NEATLINE;
  const gt = info.geoTransform;
  if (!neat || !gt) return { shape: null, toleranceM: null, problems: ["the map has no georeferenced map frame"] };
  const xy = [...neat.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const xs = xy.map((p) => p[0]!);
  const ys = xy.map((p) => p[1]!);
  const px = (Math.hypot(gt[1]!, gt[2]!) * 72) / DPI;
  const tif = join(work, "map.tif");
  run("gdalwarp", [
    "-q",
    "--config",
    "GDAL_PDF_DPI",
    String(DPI),
    "-te",
    String(Math.min(...xs)),
    String(Math.min(...ys)),
    String(Math.max(...xs)),
    String(Math.max(...ys)),
    "-tr",
    String(px),
    String(px),
    pdf,
    tif,
  ]);
  const shapes: Feature<Polygon | MultiPolygon>[] = [];
  for (const s of symbols) {
    try {
      const mask = join(work, `${s.colour}.tif`);
      const gpkg = join(work, `${s.colour}.gpkg`);
      const out = join(work, `${s.colour}.geojson`);
      run("gdal_calc.py", [
        "--quiet",
        "-A",
        tif,
        "--A_band=1",
        "-B",
        tif,
        "--B_band=2",
        "-C",
        tif,
        "--C_band=3",
        `--calc=${RGB[s.colour]}`,
        "--type=Byte",
        "--NoDataValue=0",
        `--outfile=${mask}`,
      ]);
      run("gdal_sieve.py", ["-q", "-st", "40", "-4", mask]);
      run("gdal_polygonize.py", ["-q", mask, "-f", "GPKG", gpkg, "sym", "DN"]);
      const sql = s.bufferM
        ? `SELECT ST_Union(ST_Buffer(geom, ${s.bufferM + 10})) AS geom FROM sym WHERE DN=1`
        : "SELECT ST_Union(ST_Buffer(geom, 30)) AS geom FROM sym WHERE DN=1";
      run("ogr2ogr", ["-f", "GeoJSON", "-t_srs", "EPSG:4326", "-dialect", "SQLite", "-sql", sql, out, gpkg]);
      const fc = JSON.parse(readFileSync(out, "utf8")) as FeatureCollection<Polygon | MultiPolygon>;
      const g = fc.features[0]?.geometry;
      if (!g) {
        problems.push(`no ${s.colour} symbol found in the map frame`);
        continue;
      }
      if (s.bufferM) {
        // Highlighted roads or streams: the closed area reaches the stated distance from the highlight.
        shapes.push(turf.feature(g));
        continue;
      }
      // A coloured outline: fill each closed ring, keep rings at least 1% of the largest, step back in 30 m.
      const rings = (g.type === "Polygon" ? [g.coordinates] : g.coordinates).map((c) => turf.polygon([c[0]!]));
      const big = Math.max(...rings.map((r) => turf.area(r)));
      const keep = rings.filter((r) => turf.area(r) >= big * 0.01 && turf.area(r) > 10_000);
      const u = keep.length > 1 ? turf.union(turf.featureCollection(keep)) : keep[0];
      const inner = u ? turf.buffer(u, -30, { units: "meters" }) : null;
      if (inner) shapes.push(inner as Feature<Polygon | MultiPolygon>);
      else problems.push(`the ${s.colour} outline did not close`);
    } catch (e) {
      problems.push(`${s.colour} symbol: ${(e as Error).message.split("\n")[0]!.slice(0, 160)}`);
    }
  }
  const shape = shapes.length > 1 ? (turf.union(turf.featureCollection(shapes)) as Feature<Polygon | MultiPolygon>) : (shapes[0] ?? null);
  return { shape, toleranceM: Math.max(50, Math.round(px * 10)), problems };
}

/** The legend read by OCR, for maps whose text layer is unreadable (fonts without a text map). */
function ocrText(pdf: string, work: string): string {
  try {
    run("pdftoppm", ["-r", "150", "-gray", "-png", "-singlefile", pdf, join(work, "page")]);
    return run("tesseract", [join(work, "page.png"), "-", "-l", "eng", "--psm", "3"]);
  } catch {
    return "";
  }
}

/** Reads one map PDF into a closed-area outline. */
export function readClosedAreaMap(pdf: string, fileName: string): MapRead {
  const mapId = mapIdFromFile(fileName);
  const problems: string[] = [];
  const none = (why: string[]): MapRead => ({
    mapId,
    method: null,
    style: null,
    bufferM: null,
    toleranceM: null,
    geometry: null,
    problems: [...problems, ...why],
  });
  const work = mkdtempSync(join(tmpdir(), "camap-"));
  try {
    try {
      const layer = readLayer(pdf);
      if (layer)
        return {
          mapId,
          method: "layer",
          style: "outline",
          bufferM: null,
          toleranceM: null,
          geometry: layer.geometry,
          problems,
        };
    } catch (e) {
      problems.push(`closed-area layer: ${(e as Error).message.split("\n")[0]}`);
    }
    let text = "";
    try {
      text = run("pdftotext", [pdf, "-"]);
    } catch {
      problems.push("the legend text could not be read");
    }
    let symbols = legendSymbols(text);
    if (!symbols.length) symbols = legendSymbols(ocrText(pdf, work));
    if (!symbols.length) return none(["the legend does not say how the closed area is drawn"]);
    const r = readImage(pdf, symbols, work);
    const hl = symbols.find((s) => s.bufferM);
    return {
      mapId,
      method: r.shape ? "image" : null,
      style: hl ? "highlight" : "outline",
      bufferM: hl?.bufferM ?? null,
      toleranceM: r.toleranceM,
      geometry: r.shape?.geometry ?? null,
      problems: [...problems, ...r.problems],
    };
  } catch (e) {
    return none([`map image: ${(e as Error).message.split("\n")[0]}`]);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

const STOP = new Set([
  "no",
  "hunting",
  "shooting",
  "area",
  "areas",
  "closed",
  "the",
  "and",
  "road",
  "roads",
  "fsr",
  "forest",
  "service",
  "park",
  "map",
  "pdf",
  "within",
  "single",
  "projectile",
]);

/** The distinctive words of a name ("Chilko — Newton" -> chilko, newton), for matching a map to its section. */
export function nameWords(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w.length >= 3 && !STOP.has(w) && !/\d/.test(w)),
  );
}
