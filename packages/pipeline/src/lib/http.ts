import { EnvHttpProxyAgent, fetch as undiciFetch, type Dispatcher } from "undici";
import { config } from "./config.js";
import { parseRobots, robotsAllows, type RobotsRules } from "./robots.js";
import { log, sleep } from "./util.js";

/**
 * Polite HTTP for the pipeline: a descriptive user agent on every request, robots.txt checked
 * before every scraped page, at least min_request_spacing_s between requests to the same host for
 * pages and files (APIs get a shorter gap), and a few retries on network errors and 5xx.
 */
const lastHit = new Map<string, number>();

// Honour HTTPS_PROXY / NO_PROXY (corporate proxies, the ingest container behind one).
const dispatcher: Dispatcher | undefined = process.env.HTTPS_PROXY || process.env.https_proxy ? new EnvHttpProxyAgent() : undefined;

function get(url: string, init: { headers: Record<string, string>; signal: AbortSignal }) {
  return undiciFetch(url, { ...init, dispatcher });
}

type Res = Awaited<ReturnType<typeof undiciFetch>>;
const robotsCache = new Map<string, RobotsRules | "unavailable">();

export class FetchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export function userAgent(): string {
  return process.env.USER_AGENT ?? config().pipeline.user_agent;
}

async function space(host: string, ms: number): Promise<void> {
  const wait = (lastHit.get(host) ?? 0) + ms - Date.now();
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
}

export async function robotsFor(origin: string): Promise<RobotsRules | "unavailable"> {
  if (robotsCache.has(origin)) return robotsCache.get(origin)!;
  let rules: RobotsRules | "unavailable";
  try {
    const r = await get(`${origin}/robots.txt`, { headers: { "User-Agent": userAgent() }, signal: AbortSignal.timeout(20000) });
    // RFC 9309: 4xx means no restrictions; 5xx or a network error means assume full disallow.
    rules = r.ok ? parseRobots(await r.text()) : r.status >= 400 && r.status < 500 ? { groups: [] } : "unavailable";
  } catch {
    rules = "unavailable";
  }
  robotsCache.set(origin, rules);
  return rules;
}

export async function robotsCheck(url: string): Promise<{ allowed: boolean; why: string }> {
  const u = new URL(url);
  const rules = await robotsFor(u.origin);
  if (rules === "unavailable") return { allowed: false, why: `robots.txt for ${u.host} could not be read, so automated access is not assumed` };
  const allowed = robotsAllows(rules, userAgent(), u.pathname + u.search);
  return { allowed, why: allowed ? "allowed by robots.txt" : `disallowed by ${u.host} robots.txt for ${userAgent().split(" ")[0]}` };
}

export interface FetchOpts {
  /** "page" (scraped page or file: robots + full spacing) or "api" (documented API: short spacing). */
  kind: "page" | "api";
  accept?: string;
  timeoutMs?: number;
  retries?: number;
}

export async function politeFetch(url: string, opts: FetchOpts): Promise<Res> {
  const u = new URL(url);
  if (opts.kind === "page") {
    const rc = await robotsCheck(url);
    if (!rc.allowed) throw new FetchError(rc.why, 999);
  }
  const gap = opts.kind === "page" ? config().pipeline.min_request_spacing_s * 1000 : 250;
  const retries = opts.retries ?? 3;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    await space(u.host, gap * (attempt + 1));
    try {
      const r = await get(url, { headers: { "User-Agent": userAgent(), Accept: opts.accept ?? "*/*" }, signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000) });
      if (r.status >= 500 || r.status === 429) {
        lastErr = new FetchError(`HTTP ${r.status}`, r.status);
        await r.body?.cancel();
        continue;
      }
      if (!r.ok) throw new FetchError(`HTTP ${r.status}`, r.status);
      return r;
    } catch (e) {
      if (e instanceof FetchError && e.status && e.status < 500 && e.status !== 429) throw e;
      lastErr = e;
      log("http", `retry ${attempt + 1}/${retries} for ${u.host}${u.pathname}: ${(e as Error).message}`);
    }
  }
  throw lastErr instanceof Error ? lastErr : new FetchError(String(lastErr));
}

export async function fetchText(url: string, opts: FetchOpts): Promise<{ text: string; contentType: string; fetchedAt: string }> {
  const r = await politeFetch(url, opts);
  return { text: await r.text(), contentType: r.headers.get("content-type") ?? "", fetchedAt: new Date().toISOString() };
}

export async function fetchBuffer(url: string, opts: FetchOpts): Promise<{ body: Buffer; contentType: string; fetchedAt: string }> {
  const r = await politeFetch(url, opts);
  return { body: Buffer.from(await r.arrayBuffer()), contentType: r.headers.get("content-type") ?? "", fetchedAt: new Date().toISOString() };
}
