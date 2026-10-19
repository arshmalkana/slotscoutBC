import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { config } from "./config.js";
import { P } from "./paths.js";
import { ensureDir, log, rel, writeText } from "./util.js";

export function pdfToText(file: string): string | null {
  try {
    return execFileSync("pdftotext", ["-layout", "-enc", "UTF-8", file, "-"], { maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Reads a PDF the way a person would. The text layer comes first. Pages with no usable text layer
 * (scans, maps saved as pictures) are read by OCR (tesseract), and pages that are mostly a map or a
 * scan are also rendered as page images, so the extraction can look at the map itself. Quotes are
 * still checked against the text (text layer plus OCR); nothing is placed from a picture.
 */
export interface PdfRead {
  pages: number;
  /** The text layer, then the OCR text of every page read by OCR, each under a page marker. */
  text: string;
  textLayerChars: number;
  ocrPages: number[];
  ocrChars: number;
  /** Map or scan pages rendered for reading (repository paths). */
  images: { page: number; file: string; bytes: number; committed: boolean }[];
  /** How the text was read, for the source header and the review packet. */
  method: string;
  errors: string[];
}

const MAX_IMAGES = 6;
const IMAGE_LONG_EDGE_PX = 1800;
const OCR_DPI = 300;
const MAP_WORDS = /\bmaps?\b|legend|\bscale\b|1\s*:\s*\d{1,3}[ ,]?\d{3}\b|gate location|exhibit/i;

const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
const solid = (s: string) => s.replace(/\s+/g, "").length;

export function tesseractVersion(): string | null {
  try {
    return run("tesseract", ["--version"]).split("\n")[0]!.trim();
  } catch {
    return null;
  }
}

/** Raster images per page with their pixel counts (pdfimages -list). */
function rasterPixels(file: string): Map<number, number> {
  const out = new Map<number, number>();
  try {
    for (const line of run("pdfimages", ["-list", file]).split("\n").slice(2)) {
      const c = line.trim().split(/\s+/);
      if (c.length < 5 || c[2] === "smask") continue;
      const page = Number(c[0]);
      const px = Number(c[3]) * Number(c[4]);
      if (Number.isFinite(page) && Number.isFinite(px)) out.set(page, Math.max(out.get(page) ?? 0, px));
    }
  } catch {
    /* no raster images, or pdfimages missing */
  }
  return out;
}

function ocrPage(file: string, page: number, work: string): string {
  const base = join(work, `ocr-${page}`);
  run("pdftoppm", ["-r", String(OCR_DPI), "-gray", "-png", "-f", String(page), "-l", String(page), "-singlefile", file, base]);
  const png = `${base}.png`;
  // Page layout first; if that finds little (a map with scattered labels), sparse text mode.
  let text = run("tesseract", [png, "-", "-l", "eng", "--psm", "3"]);
  if (solid(text) < 200) {
    const sparse = run("tesseract", [png, "-", "-l", "eng", "--psm", "11"]);
    if (solid(sparse) > solid(text)) text = sparse;
  }
  rmSync(png, { force: true });
  return text.replace(/\f/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function renderPage(file: string, page: number, out: string): void {
  ensureDir(dirname(out));
  const base = out.replace(/\.jpg$/, "");
  run("pdftoppm", ["-jpeg", "-jpegopt", "quality=70", "-scale-to", String(IMAGE_LONG_EDGE_PX), "-f", String(page), "-l", String(page), "-singlefile", file, base]);
}

/**
 * @param file the PDF on disk
 * @param imageBase where page images go, without extension (e.g. raw/2026-10/dm_notices/images/DSI-…);
 *   pages are written as `<imageBase>.p<N>.jpg`. Pass null to skip page images (bylaw text pages).
 */
export function readPdf(file: string, imageBase: string | null): PdfRead {
  const errors: string[] = [];
  let pages = 0;
  try {
    pages = Number(run("pdfinfo", [file]).match(/^Pages:\s+(\d+)/m)?.[1] ?? 0);
  } catch (e) {
    errors.push(`pdfinfo: ${(e as Error).message.split("\n")[0]}`);
  }
  const layer = pdfToText(file) ?? "";
  if (!layer && !pages) errors.push("pdftotext could not read the file");
  const perPage = layer.split("\f");
  const raster = rasterPixels(file);
  const name = basename(file);
  const mapPages: number[] = [];
  const ocrNeeded: number[] = [];
  for (let p = 1; p <= pages; p++) {
    const chars = solid(perPage[p - 1] ?? "");
    const px = raster.get(p) ?? 0;
    const pictureOnly = chars < 300;
    const bigPicture = px >= 500_000 && chars < 1200;
    const vectorMap = chars < 2500 && (MAP_WORDS.test(perPage[p - 1] ?? "") || /map/i.test(name)) && (px >= 200_000 || chars < 1500);
    if (pictureOnly || bigPicture) ocrNeeded.push(p);
    if (pictureOnly || bigPicture || vectorMap) mapPages.push(p);
  }

  const ocrParts: string[] = [];
  const ocrPages: number[] = [];
  const ocrVersion = ocrNeeded.length ? tesseractVersion() : null;
  if (ocrNeeded.length && !ocrVersion) errors.push("tesseract is not installed, so pages with no text layer could not be OCR'd");
  if (ocrNeeded.length && ocrVersion) {
    const work = mkdtempSync(join(tmpdir(), "ocr-"));
    try {
      for (const p of ocrNeeded) {
        try {
          const t = ocrPage(file, p, work);
          if (solid(t) >= 3) {
            ocrPages.push(p);
            ocrParts.push(`[Page ${p}: text read by OCR from the page image]\n${t}`);
          }
        } catch (e) {
          errors.push(`OCR page ${p}: ${(e as Error).message.split("\n")[0]}`);
        }
      }
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  }

  const images: PdfRead["images"] = [];
  if (imageBase) {
    const maxMb = config().storage.commit_pdf_max_mb;
    for (const p of mapPages.slice(0, MAX_IMAGES)) {
      const out = `${imageBase}.p${p}.jpg`;
      try {
        renderPage(file, p, out);
        const bytes = statSync(out).size;
        const big = bytes > maxMb * 1024 * 1024;
        // Over the commit limit: kept beside the PDF in large/ (git-ignored), like large PDFs.
        const kept = big ? join(dirname(out), "large", basename(out)) : out;
        if (big) (ensureDir(dirname(kept)), renameSync(out, kept));
        images.push({ page: p, file: rel(kept), bytes, committed: !big });
      } catch (e) {
        errors.push(`page image ${p}: ${(e as Error).message.split("\n")[0]}`);
      }
    }
  }

  const text = [layer.replace(/\f/g, "\n").trimEnd(), ...ocrParts].filter((s) => s.trim()).join("\n\n");
  const how = [
    solid(layer) ? `text layer (${pages} page${pages === 1 ? "" : "s"})` : "no text layer",
    ocrPages.length ? `OCR by ${ocrVersion} on page${ocrPages.length > 1 ? "s" : ""} ${ocrPages.join(", ")}` : ocrNeeded.length ? `OCR found no text on page${ocrNeeded.length > 1 ? "s" : ""} ${ocrNeeded.join(", ")}` : "",
    images.length ? `${images.length} map or scan page image${images.length > 1 ? "s" : ""} for reading` : "",
  ].filter(Boolean);
  if (ocrNeeded.length || images.length) log("pdf", `${name}: ${how.join("; ")}`);
  return { pages, text, textLayerChars: solid(layer), ocrPages, ocrChars: ocrParts.reduce((n, s) => n + solid(s), 0), images, method: how.join("; "), errors };
}

/** The .txt kept next to a pulled PDF: provenance headers, how it was read, then the text. */
export function pdfTextFile(headers: Record<string, string>, read: PdfRead): string {
  const h = { ...headers, Read: read.method, ...(read.images.length ? { Images: read.images.map((i) => i.file).join(" ") } : {}), ...(read.errors.length ? { Problems: read.errors.join("; ") } : {}) };
  return `${Object.entries(h).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${read.text}`;
}

/** Header lines written by pdfTextFile and the pull steps; stripped before a text is split or hashed. */
export const PDF_HEADER = /^(Source|Title|Fetched|SHA-256|Read|Images|Problems):.*\n/gm;

export function pdfImagesFrom(text: string): string[] {
  return (text.match(/^Images:\s*(.*)$/m)?.[1] ?? "").split(/\s+/).filter(Boolean);
}

/** Page images still on disk (a git-ignored large image may be missing in a fresh checkout). */
export function existingImages(files: string[]): string[] {
  return files.filter((f) => {
    try {
      return statSync(join(P.root, f)).isFile();
    } catch {
      return false;
    }
  });
}

/** Re-reads every PDF already pulled for a month (new OCR or image rules), without fetching again. */
export function rereadPdfs(dir: string, imagesDir: string, onEach?: (done: number, total: number, name: string) => void): number {
  const pdfs = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".pdf"))
    .map((e) => join(e.parentPath, e.name));
  let n = 0;
  for (const f of pdfs) {
    const txt = join(dir, `${basename(f, ".pdf")}.txt`);
    let headers: Record<string, string> = {};
    try {
      const old = readFileSync(txt, "utf8");
      headers = Object.fromEntries([...old.matchAll(/^(Source|Title|Fetched|SHA-256):\s*(.*)$/gm)].map((m) => [m[1]!, m[2]!]));
    } catch {
      /* no earlier text file */
    }
    writeText(txt, pdfTextFile(headers, readPdf(f, join(imagesDir, basename(f, ".pdf")))));
    onEach?.(++n, pdfs.length, basename(f));
  }
  return n;
}
