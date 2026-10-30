import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID, timingSafeEqual } from "node:crypto";
import type { Contribution, ContributionReview, ContributionView } from "@slotscout/engine";
import { config } from "./config.js";

/**
 * Community contributions from the map editor (see the engine's Contribution type). Anyone can send a drawing or a
 * bylaw answer; a reviewer (a person holding a reviewer key) confirms or rejects it; the pipeline publishes what was
 * confirmed. Records are append-only: a contribution is written once, and its review is a separate file written
 * once, so nothing is ever edited in place.
 *
 * Storage: Vercel Blob when BLOB_READ_WRITE_TOKEN is set (the live site), a local folder otherwise
 * (CONTRIBUTIONS_DIR, or contributions/ outside production). With neither, contributions are switched off.
 */
interface Store {
  name: string;
  list(prefix: "c/" | "r/"): Promise<string[]>;
  read(path: string): Promise<string | null>;
  /** Writes once; false when the file already exists. */
  create(path: string, body: string): Promise<boolean>;
}

function dirStore(dir: string): Store {
  return {
    name: `folder ${dir}`,
    async list(prefix) {
      const d = join(dir, prefix);
      if (!existsSync(d)) return [];
      return (await readdir(d)).filter((f) => f.endsWith(".json")).map((f) => `${prefix}${f}`);
    },
    async read(path) {
      return readFile(join(dir, path), "utf8").catch(() => null);
    },
    async create(path, body) {
      await mkdir(join(dir, path, ".."), { recursive: true });
      try {
        await writeFile(join(dir, path), body, { flag: "wx" });
        return true;
      } catch {
        return false;
      }
    },
  };
}

function blobStore(): Store {
  const access = (process.env.BLOB_ACCESS === "public" ? "public" : "private") as "public" | "private";
  const root = "contributions/";
  return {
    name: "Vercel Blob",
    async list(prefix) {
      const { list } = await import("@vercel/blob");
      const out: string[] = [];
      let cursor: string | undefined;
      do {
        const r = await list({ prefix: root + prefix, cursor, limit: 1000 });
        out.push(...r.blobs.map((b) => b.pathname.slice(root.length)));
        cursor = r.hasMore ? r.cursor : undefined;
      } while (cursor);
      return out;
    },
    async read(path) {
      const { get } = await import("@vercel/blob");
      const r = await get(root + path, { access });
      if (!r || r.statusCode !== 200 || !r.stream) return null;
      return new Response(r.stream).text();
    },
    async create(path, body) {
      const { put, BlobError } = await import("@vercel/blob");
      try {
        await put(root + path, body, { access, contentType: "application/json", addRandomSuffix: false, allowOverwrite: false });
        return true;
      } catch (e) {
        if (e instanceof BlobError && /exist/i.test(e.message)) return false;
        throw e;
      }
    },
  };
}

function pickStore(): Store | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return blobStore();
  if (process.env.CONTRIBUTIONS_DIR) return dirStore(process.env.CONTRIBUTIONS_DIR);
  if (process.env.NODE_ENV !== "production") return dirStore(resolve(config.repoRoot, "contributions"));
  return null;
}

let store: Store | null | undefined;
const getStore = () => (store === undefined ? (store = pickStore()) : store);
export const contributionsEnabled = () => !!getStore();
export const storeName = () => getStore()?.name ?? "off";

/** For tests: use a folder store. */
export function useFolderStore(dir: string): void {
  store = dirStore(dir);
  cache.c.clear();
  cache.r.clear();
  cache.listedAt = 0;
}

// Records never change once written, so each is read once per server.
const cache = { c: new Map<string, Contribution>(), r: new Map<string, ContributionReview>(), listedAt: 0 };
const LIST_EVERY_MS = 10_000;

async function refresh(force = false): Promise<void> {
  const s = getStore();
  if (!s || (!force && Date.now() - cache.listedAt < LIST_EVERY_MS)) return;
  const [cs, rs] = await Promise.all([s.list("c/"), s.list("r/")]);
  const load = async <T>(paths: string[], into: Map<string, T>) => {
    const missing = paths.filter((p) => !into.has(p.slice(2, -5)));
    for (let i = 0; i < missing.length; i += 16)
      await Promise.all(
        missing.slice(i, i + 16).map(async (p) => {
          const body = await s.read(p);
          if (body) into.set(p.slice(2, -5), JSON.parse(body) as T);
        }),
      );
  };
  await load(cs, cache.c);
  await load(rs, cache.r);
  cache.listedAt = Date.now();
}

/** Contributions the pipeline has already put into the live data (data/contributions-applied.json). */
async function published(): Promise<Set<string>> {
  try {
    const a = JSON.parse(await readFile(join(config.dataDir, "contributions-applied.json"), "utf8")) as { applied: Record<string, { result: string }> };
    return new Set(Object.entries(a.applied).filter(([, v]) => v.result.startsWith("published")).map(([k]) => k));
  } catch {
    return new Set();
  }
}

export async function listContributions(filter: { target?: string; kind?: string; status?: string } = {}): Promise<ContributionView[]> {
  await refresh();
  const pub = await published();
  return [...cache.c.values()]
    .map((c): ContributionView => {
      const review = cache.r.get(c.id);
      const status = pub.has(c.id) ? "published" : review ? review.decision : "waiting";
      return { ...c, status, ...(review ? { review } : {}) };
    })
    .filter((c) => (!filter.target || c.target === filter.target) && (!filter.kind || c.kind === filter.kind) && (!filter.status || c.status === filter.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// --- Checks on what people send ---------------------------------------------------------------------------------

const BC = { minX: -140, minY: 48, maxX: -113, maxY: 61 };
const MAX_VERTICES = 20_000;
const NOT_A_PERSON = /claude|anthropic|\bai\b|pipeline|\bbot\b|agent|gpt/i;

const text = (v: unknown, min: number, max: number, what: string): string => {
  const s = String(v ?? "")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .trim();
  if (s.length < min) throw new Error(min > 1 ? `${what} needs at least ${min} characters` : `${what} is required`);
  if (s.length > max) throw new Error(`${what} is too long (at most ${max} characters)`);
  return s;
};

/** A person's display name: what approvals and drawings are recorded under. */
export function personName(v: unknown): string {
  const n = text(v, 2, 60, "Your name");
  if (NOT_A_PERSON.test(n)) throw new Error("Use your own name: contributions record which person drew or confirmed them");
  return n;
}

function ring(r: unknown, count: { n: number }): number[][] {
  if (!Array.isArray(r) || r.length < 4) throw new Error("each ring needs at least three corners");
  const out = r.map((p) => {
    if (!Array.isArray(p) || p.length < 2) throw new Error("bad coordinate");
    const [x, y] = [Number(p[0]), Number(p[1])];
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < BC.minX || x > BC.maxX || y < BC.minY || y > BC.maxY) throw new Error("the shape must be inside British Columbia");
    return [Math.round(x * 1e7) / 1e7, Math.round(y * 1e7) / 1e7];
  });
  const [a, b] = [out[0]!, out[out.length - 1]!];
  if (a[0] !== b[0] || a[1] !== b[1]) throw new Error("each ring must close (last corner equal to the first)");
  count.n += out.length;
  if (count.n > MAX_VERTICES) throw new Error(`the shape has more than ${MAX_VERTICES} corners; simplify it`);
  return out;
}

export function checkGeometry(g: unknown): NonNullable<Contribution["geometry"]> {
  const geom = g as { type?: string; coordinates?: unknown };
  const count = { n: 0 };
  const poly = (p: unknown) => {
    if (!Array.isArray(p) || !p.length || p.length > 200) throw new Error("bad polygon");
    return p.map((r) => ring(r, count));
  };
  if (geom?.type === "Polygon") return { type: "Polygon", coordinates: poly(geom.coordinates) };
  if (geom?.type === "MultiPolygon" && Array.isArray(geom.coordinates) && geom.coordinates.length && geom.coordinates.length <= 500)
    return { type: "MultiPolygon", coordinates: geom.coordinates.map(poly) };
  throw new Error("draw at least one closed shape (a Polygon or MultiPolygon)");
}

export function checkContribution(body: Record<string, unknown>, targets: { closedAreas: Set<string>; bylaws: Set<string> }): Contribution {
  const kind = String(body.kind ?? "");
  if (!["closed_area", "bylaw", "bylaw_zone"].includes(kind)) throw new Error("kind must be closed_area, bylaw or bylaw_zone");
  const target = String(body.target ?? "");
  if (kind === "closed_area" ? !targets.closedAreas.has(target) : !targets.bylaws.has(target)) throw new Error("unknown target");
  const c: Contribution = {
    id: randomUUID(),
    kind: kind as Contribution["kind"],
    target,
    author: personName(body.author),
    note: body.note ? text(body.note, 0, 2000, "Note") : "",
    createdAt: new Date().toISOString(),
  };
  if (kind === "closed_area" || kind === "bylaw_zone") {
    c.geometry = checkGeometry(body.geometry);
    c.exact = body.exact === true;
  }
  if (kind === "bylaw_zone") {
    const z = (body.zone ?? {}) as Record<string, unknown>;
    const effect = String(z.effect ?? "no_shooting");
    if (!["no_shooting", "no_rifle", "shot_only"].includes(effect)) throw new Error("zone effect must be no_shooting, no_rifle or shot_only");
    c.zone = { schedule: text(z.schedule, 1, 120, "Schedule or zone name"), effect: effect as "no_shooting" };
  }
  if (kind === "bylaw") {
    const b = (body.bylaw ?? {}) as Record<string, unknown>;
    const url = text(b.url, 8, 500, "Bylaw link");
    if (!/^https?:\/\//i.test(url)) throw new Error("Bylaw link must start with http:// or https://");
    const ts = String(b.targetShooting ?? "");
    if (!["prohibited", "zoned", "no_bylaw"].includes(ts)) throw new Error("Say whether the bylaw bans discharge everywhere, only in zones, or there is no bylaw");
    c.bylaw = { url, title: text(b.title, 2, 200, "Bylaw title"), number: b.number ? text(b.number, 0, 60, "Bylaw number") : "", targetShooting: ts as "prohibited", quote: text(b.quote, 10, 2000, "The bylaw's own words") };
  }
  return c;
}

export async function addContribution(c: Contribution): Promise<void> {
  const s = getStore();
  if (!s) throw Object.assign(new Error("Contributions are switched off on this server"), { statusCode: 503 });
  if (!(await s.create(`c/${c.id}.json`, JSON.stringify(c)))) throw new Error("could not store the contribution");
  cache.c.set(c.id, c);
}

// --- Reviewers ----------------------------------------------------------------------------------------------------

/** REVIEWER_KEYS="Name=key,Other Name=key2" (each key at least 16 characters). */
function reviewers(): { name: string; key: Buffer }[] {
  return (process.env.REVIEWER_KEYS ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const i = p.lastIndexOf("=");
      return { name: p.slice(0, i).trim(), key: Buffer.from(p.slice(i + 1).trim()) };
    })
    .filter((r) => r.name && r.key.length >= 16);
}

export function reviewerFor(key: string | undefined): string | null {
  if (!key) return null;
  const k = Buffer.from(key);
  for (const r of reviewers()) if (r.key.length === k.length && timingSafeEqual(r.key, k)) return r.name;
  return null;
}

export async function reviewContribution(id: string, reviewer: string, decision: string, note: unknown): Promise<ContributionReview> {
  const s = getStore();
  if (!s) throw Object.assign(new Error("Contributions are switched off on this server"), { statusCode: 503 });
  if (!["confirmed", "rejected"].includes(decision)) throw new Error("decision must be confirmed or rejected");
  await refresh(true);
  const c = cache.c.get(id);
  if (!c) throw Object.assign(new Error("no such contribution"), { statusCode: 404 });
  if (cache.r.has(id)) throw Object.assign(new Error("this contribution was already reviewed"), { statusCode: 409 });
  if (decision === "confirmed" && c.author.trim().toLowerCase() === reviewer.trim().toLowerCase())
    throw Object.assign(new Error("a second person must confirm: you drew or sent this one"), { statusCode: 409 });
  const r: ContributionReview = { id, decision: decision as ContributionReview["decision"], by: reviewer, note: note ? text(note, 0, 1000, "Note") : "", at: new Date().toISOString() };
  if (!(await s.create(`r/${id}.json`, JSON.stringify(r)))) throw Object.assign(new Error("this contribution was already reviewed"), { statusCode: 409 });
  cache.r.set(id, r);
  return r;
}
