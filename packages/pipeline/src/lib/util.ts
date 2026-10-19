import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { P } from "./paths.js";

export function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** JSON with sorted keys at every level, so the same content always hashes and diffs the same. */
export function stableStringify(v: unknown, indent = 2): string {
  const sort = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(sort);
    if (x && typeof x === "object") return Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, sort((x as Record<string, unknown>)[k])]));
    return x;
  };
  return JSON.stringify(sort(v), null, indent);
}

export function writeJson(file: string, v: unknown, opts: { stable?: boolean } = {}): void {
  ensureDir(dirname(file));
  writeFileSync(file, (opts.stable ? stableStringify(v) : JSON.stringify(v, null, 2)) + "\n");
}

export function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

export function readJsonIf<T>(file: string, fallback: T): T {
  return existsSync(file) ? readJson<T>(file) : fallback;
}

export function writeText(file: string, text: string | Buffer): void {
  ensureDir(dirname(file));
  writeFileSync(file, text);
}

export function listFiles(dir: string, filter: (f: string) => boolean = () => true): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, filter));
    else if (filter(p) && e.name !== ".gitkeep") out.push(p);
  }
  return out.sort();
}

export const rel = (p: string) => relative(P.root, p);

/**
 * Normalises a text unit before hashing (Addendum A 5.1 step 2): whitespace, quote and dash
 * variants, and leading numbering. Words and numbers that carry meaning are kept.
 */
export function normaliseUnit(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[‘’′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/ /g, " ")
    .replace(/^\s*\(?\d+(\.\d+)*\)?[.)]?\s+/, "")
    .replace(/\s*([,;:.])\s*/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Whitespace-insensitive verbatim check for quotes (Addendum A 4.1). */
export function quoteFound(quote: string, source: string): boolean {
  const squash = (s: string) =>
    s
      .normalize("NFKC")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[‐-―]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  const q = squash(quote);
  return q.length > 0 && squash(source).includes(q);
}

let logFile: string | null = null;

export function setLogMonth(month: string): void {
  logFile = join(ensureDir(P.reports), `${month}-run.log`);
}

export function log(step: string, msg: string): void {
  const line = `${new Date().toISOString()} [${step}] ${msg}`;
  console.log(line);
  if (logFile) appendFileSync(logFile, line + "\n");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
