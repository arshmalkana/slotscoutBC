import { LRUCache } from "lru-cache";
import { config } from "./config.js";

/** A small per-host concurrency limit so one busy page never floods a government server. */
class Semaphore {
  private active = 0;
  private readonly queue: (() => void)[] = [];
  constructor(private readonly max: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) await new Promise<void>((r) => this.queue.push(r));
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      this.queue.shift()?.();
    }
  }
}

const HOST_LIMITS: Record<string, number> = {
  "openmaps.gov.bc.ca": 8,
  "www2.gov.bc.ca": 1,
};
const semaphores = new Map<string, Semaphore>();
function semaphoreFor(url: string): Semaphore {
  const host = new URL(url).host;
  let s = semaphores.get(host);
  if (!s) {
    s = new Semaphore(HOST_LIMITS[host] ?? 4);
    semaphores.set(host, s);
  }
  return s;
}

/** Last request time per host for sites that ask for spacing between requests (PRD 10.3). */
const lastHit = new Map<string, number>();
const MIN_SPACING_MS: Record<string, number> = { "www2.gov.bc.ca": 2000 };

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

interface Cached {
  body: string;
  contentType: string;
  fetchedAt: string;
}

const cache = new LRUCache<string, Cached>({
  maxSize: 200 * 1024 * 1024,
  sizeCalculation: (v) => v.body.length + 64,
  ttlAutopurge: false,
});

export interface FetchResult {
  body: string;
  contentType: string;
  fetchedAt: string;
  fromCache: boolean;
}

/** GET with a descriptive user agent, timeout, one retry on network or 5xx errors, and an LRU cache. */
export async function getText(url: string, opts: { ttlMs: number; accept?: string; timeoutMs?: number } = { ttlMs: 0 }): Promise<FetchResult> {
  if (opts.ttlMs > 0) {
    const hit = cache.get(url);
    if (hit) return { ...hit, fromCache: true };
  }
  const host = new URL(url).host;
  const res = await semaphoreFor(url).run(async () => {
    const spacing = MIN_SPACING_MS[host];
    if (spacing) {
      const wait = (lastHit.get(host) ?? 0) + spacing - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      lastHit.set(host, Date.now());
    }
    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(url, {
          headers: { "User-Agent": config.userAgent, Accept: opts.accept ?? "*/*" },
          signal: AbortSignal.timeout(opts.timeoutMs ?? config.timeoutMs),
        });
        if (r.status >= 500 && attempt === 0) {
          lastErr = new UpstreamError(`HTTP ${r.status}`, r.status);
          continue;
        }
        if (!r.ok) throw new UpstreamError(`HTTP ${r.status}`, r.status);
        return { body: await r.text(), contentType: r.headers.get("content-type") ?? "" };
      } catch (e) {
        lastErr = e;
        if (e instanceof UpstreamError && e.status && e.status < 500) break;
      }
    }
    throw lastErr instanceof Error ? lastErr : new UpstreamError(String(lastErr));
  });
  const value: Cached = { ...res, fetchedAt: new Date().toISOString() };
  if (opts.ttlMs > 0) cache.set(url, value, { ttl: opts.ttlMs });
  return { ...value, fromCache: false };
}

export async function getJson<T>(url: string, opts: { ttlMs: number; timeoutMs?: number }): Promise<{ data: T; fetchedAt: string }> {
  const r = await getText(url, { ...opts, accept: "application/json" });
  try {
    return { data: JSON.parse(r.body) as T, fetchedAt: r.fetchedAt };
  } catch {
    throw new UpstreamError(`Invalid JSON from ${new URL(url).host}: ${r.body.slice(0, 120)}`);
  }
}

const binCache = new LRUCache<string, { buf: Buffer; type: string }>({
  maxSize: 300 * 1024 * 1024,
  sizeCalculation: (v) => v.buf.length + 64,
});

export async function getBinary(url: string, ttlMs: number): Promise<{ buf: Buffer; type: string }> {
  const hit = binCache.get(url);
  if (hit) return hit;
  const res = await semaphoreFor(url).run(async () => {
    const r = await fetch(url, { headers: { "User-Agent": config.userAgent }, signal: AbortSignal.timeout(config.timeoutMs) });
    if (!r.ok) throw new UpstreamError(`HTTP ${r.status}`, r.status);
    return { buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get("content-type") ?? "application/octet-stream" };
  });
  if (res.type.startsWith("image/")) binCache.set(url, res, { ttl: ttlMs });
  return res;
}

export function errorText(e: unknown): string {
  if (e instanceof Error) {
    if (e.name === "TimeoutError" || e.name === "AbortError") return "timed out";
    return e.message.slice(0, 160);
  }
  return String(e).slice(0, 160);
}
