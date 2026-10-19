import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Browser, BrowserContext, Page } from "playwright";
import { config } from "./config.js";
import { robotsCheck, userAgent } from "./http.js";
import { ensureDir, log, sha256, sleep, writeJson, writeText } from "./util.js";

/**
 * Headless browser capture (Addendum A 6.3, 6.4): one page at a time per site, at least
 * min_request_spacing_s apart, robots.txt checked first. Consent banners get "necessary only" at
 * most. No logins, no CAPTCHA solving, no IP rotation: a blocked page turns its source grey.
 */
let browser: Browser | null = null;
let context: BrowserContext | null = null;
const lastVisit = new Map<string, number>();

function chromiumPath(): string | undefined {
  // The sandbox and the ingest image both ship Chromium; let Playwright find it unless pinned.
  const pinned = process.env.CHROMIUM_PATH;
  return pinned && existsSync(pinned) ? pinned : undefined;
}

async function ctx(): Promise<BrowserContext> {
  if (context) return context;
  const { chromium } = await import("playwright");
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  browser = await chromium.launch({
    headless: true,
    executablePath: chromiumPath(),
    proxy: proxy ? { server: proxy, bypass: "localhost,127.0.0.1" } : undefined,
  });
  context = await browser.newContext({ userAgent: userAgent(), viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: false });
  return context;
}

export async function closeBrowser(): Promise<void> {
  await context?.close().catch(() => undefined);
  await browser?.close().catch(() => undefined);
  context = null;
  browser = null;
}

export interface Capture {
  url: string;
  finalUrl: string;
  status: number | null;
  title: string;
  capturedAt: string;
  textFile: string;
  htmlFile: string;
  screenshotFile: string;
  textSha256: string;
  htmlSha256: string;
  links: { text: string; href: string }[];
  /** Background data services the page called (ArcGIS REST, JSON feeds): prefer these as data (6.4). */
  services: string[];
  consent: string | null;
}

const CONSENT = /^(necessary only|only necessary|essential only|reject all|reject|decline|decline all|use necessary cookies only)$/i;

async function minimalConsent(page: Page): Promise<string | null> {
  for (const b of await page.getByRole("button").all()) {
    const label = ((await b.textContent().catch(() => "")) ?? "").trim();
    if (CONSENT.test(label)) {
      await b.click({ timeout: 3000 }).catch(() => undefined);
      return label;
    }
  }
  return null;
}

/** Captures a page as evidence: rendered text, HTML and a full-page screenshot, with a timestamp. */
export async function capturePage(url: string, outDir: string, name: string): Promise<Capture> {
  const rc = await robotsCheck(url);
  if (!rc.allowed) throw new Error(rc.why);
  const host = new URL(url).host;
  const gap = config().pipeline.min_request_spacing_s * 1000;
  const wait = (lastVisit.get(host) ?? 0) + gap - Date.now();
  if (wait > 0) await sleep(wait);
  lastVisit.set(host, Date.now());

  const page = await (await ctx()).newPage();
  const services = new Set<string>();
  page.on("request", (req) => {
    const u = req.url();
    if (/\/arcgis\/rest\/services\/|\/MapServer\/|\/FeatureServer\/|[?&]f=(p?json|geojson)|\.geojson(\?|$)|\/wfs\?/i.test(u)) services.add(u.split("?")[0]!);
  });
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
    const consent = await minimalConsent(page);
    if (consent) await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
    const dir = ensureDir(outDir);
    const html = await page.content();
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map((a) => ({ text: (a.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 200), href: (a as HTMLAnchorElement).href })),
    );
    const { screenshot_quality: quality, screenshot_max_height_px: maxH } = config().storage;
    const height = Math.min(maxH, await page.evaluate(() => document.documentElement.scrollHeight));
    await page.setViewportSize({ width: 1280, height: Math.max(900, Math.min(height, maxH)) });
    const shot = await page.screenshot({ type: "jpeg", quality, fullPage: false });
    const capturedAt = new Date().toISOString();
    const files = { textFile: join(dir, `${name}.txt`), htmlFile: join(dir, `${name}.html`), screenshotFile: join(dir, `${name}.jpg`) };
    writeText(files.textFile, `Captured: ${capturedAt}\nURL: ${page.url()}\n\n${text}`);
    writeText(files.htmlFile, html);
    writeText(files.screenshotFile, shot);
    const cap: Capture = {
      url,
      finalUrl: page.url(),
      status: resp?.status() ?? null,
      title: await page.title(),
      capturedAt,
      ...files,
      textSha256: sha256(text),
      htmlSha256: sha256(html),
      links,
      services: [...services],
      consent,
    };
    writeJson(join(dir, `${name}.capture.json`), { ...cap, links: cap.links.slice(0, 500) });
    log("capture", `${name}: ${cap.status} ${cap.title.slice(0, 80)} (${links.length} links${services.size ? `, ${services.size} data services` : ""})`);
    return cap;
  } finally {
    await page.close().catch(() => undefined);
  }
}
