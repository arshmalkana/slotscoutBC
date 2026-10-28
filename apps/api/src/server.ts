import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import compress from "@fastify/compress";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { LIGHTS, RULES, RULES_BY_ID, featureState, inBCBox, normaliseProfile, type LatLon } from "@slotscout/engine";
import { config } from "./config.js";
import { checkPoint, sourceStats } from "./check.js";
import { data } from "./data.js";
import { displayFeature } from "./display.js";
import { FINDER_MAX_RADIUS_KM, findSpots } from "./finder.js";
import { errorText, getBinary } from "./http.js";
import { MAP_LAYERS, MAP_LAYERS_BY_ID, sldFor, tileBounds } from "./maplayers.js";
import { search } from "./search.js";

const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

function num(v: unknown): number | null {
  const n = Number(v);
  return v === undefined || v === null || v === "" || !Number.isFinite(n) ? null : n;
}

function pointFrom(q: Record<string, unknown>): LatLon | { error: string } {
  const lat = num(q.lat);
  const lon = num(q.lon);
  if (lat === null || lon === null) return { error: "lat and lon are required decimal degrees" };
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return { error: "lat or lon out of range" };
  return { lat, lon };
}

function profileFrom(q: Record<string, unknown>) {
  return normaliseProfile({ firearmClass: q.class, firearmType: q.type, activity: q.activity, fallZoneM: q.fz });
}

function dateFrom(v: unknown): Date | { error: string } {
  if (v === undefined || v === "") return new Date();
  const s = String(v);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T19:00:00Z`) : new Date(s);
  if (Number.isNaN(d.getTime())) return { error: "date must be YYYY-MM-DD or an ISO timestamp" };
  return d;
}

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({
    trustProxy: config.trustProxy,
    logger: opts.logger
      ? {
          // Privacy (PRD 12.5): coordinates are never logged, so the query string is dropped.
          serializers: {
            req: (req) => ({ method: req.method, path: req.url.split("?")[0] }),
          },
        }
      : false,
  });

  await app.register(compress, { global: true, encodings: ["br", "gzip"] });
  await app.register(rateLimit, {
    max: config.rateLimitPerMinute,
    timeWindow: "1 minute",
    allowList: (req) => !req.url.startsWith("/v1/") || req.url.startsWith("/v1/tiles/"),
  });

  app.addHook("onSend", async (req, reply) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("Permissions-Policy", "geolocation=(self), camera=(), microphone=()");
    if (req.url.startsWith("/v1/check") || req.url.startsWith("/v1/finder") || req.url.startsWith("/v1/search")) {
      reply.header("Cache-Control", "no-store");
    }
  });

  app.get("/v1/health", async () => ({ ok: true, release: data().release.id, loadedAt: data().loadedAt }));

  app.get("/v1/check", async (req, reply) => {
    const q = req.query as Record<string, unknown>;
    const point = pointFrom(q);
    if ("error" in point) return reply.code(400).send(point);
    const at = dateFrom(q.date);
    if ("error" in at) return reply.code(400).send(at);
    return checkPoint(point, profileFrom(q), at);
  });

  app.post("/v1/check/batch", { config: { rateLimit: { max: 4, timeWindow: "1 minute" } } }, async (req, reply) => {
    const body = (req.body ?? {}) as { points?: unknown[]; profile?: Record<string, unknown>; date?: string };
    if (!Array.isArray(body.points) || body.points.length === 0) return reply.code(400).send({ error: "points[] is required" });
    if (body.points.length > 100) return reply.code(400).send({ error: "at most 100 points per batch" });
    const points = body.points.map((p) => pointFrom((p ?? {}) as Record<string, unknown>));
    const bad = points.findIndex((p) => "error" in p);
    if (bad >= 0) return reply.code(400).send({ error: `point ${bad}: ${(points[bad] as { error: string }).error}` });
    const at = dateFrom(body.date);
    if ("error" in at) return reply.code(400).send(at);
    const profile = normaliseProfile({
      firearmClass: body.profile?.class,
      firearmType: body.profile?.type,
      activity: body.profile?.activity,
      fallZoneM: body.profile?.fz,
    });
    // Four at a time, in input order, so a batch never floods the government servers.
    const reports = new Array(points.length);
    let next = 0;
    const worker = async () => {
      for (let i = next++; i < points.length; i = next++) reports[i] = await checkPoint(points[i] as LatLon, profile, at);
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    return { reports };
  });

  app.get("/v1/finder", { config: { rateLimit: { max: 6, timeWindow: "1 minute" } } }, async (req, reply) => {
    const q = req.query as Record<string, unknown>;
    const point = pointFrom(q);
    if ("error" in point) return reply.code(400).send(point);
    if (!inBCBox(point)) return reply.code(400).send({ error: "start point is outside British Columbia" });
    const radius = Math.min(FINDER_MAX_RADIUS_KM, num(q.radius_km) ?? 5);
    const at = dateFrom(q.date);
    if ("error" in at) return reply.code(400).send(at);
    try {
      return { radiusKm: radius, ...(await findSpots(point, radius, profileFrom(q), at)) };
    } catch (e) {
      return reply.code(502).send({ error: `Spot finder could not read cutblocks: ${errorText(e)}` });
    }
  });

  app.get("/v1/rules", async () => ({ rules: RULES, lights: LIGHTS }));

  app.get("/v1/rules/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const rule = RULES_BY_ID[id.toUpperCase()];
    if (!rule) return reply.code(404).send({ error: "unknown rule" });
    const d = data();
    const features = d.digitised.filter((f) => f.properties.rule_id.split("-")[0] === rule.id && ["approved", "provisional"].includes(featureState(f)));
    return {
      rule,
      sources: rule.sources.map((s) => d.sources[s]).filter(Boolean),
      digitised: { type: "FeatureCollection", features: features.map(({ bbox: _b, ...f }) => f) },
      mapLayers: MAP_LAYERS.filter((l) => l.ruleIds.includes(rule.id)).map((l) => l.id),
    };
  });

  app.get("/v1/releases", async () => {
    const d = data();
    let changelog = "";
    try {
      changelog = await readFile(join(config.dataDir, "CHANGELOG.md"), "utf8");
    } catch {
      // optional
    }
    return { current: d.release, releases: [d.release], changelog };
  });

  app.get("/v1/sources", async () => {
    const d = data();
    return {
      sources: d.sourceList.map((s) => ({ ...s, live: sourceStats.get(s.id) ?? null })),
      consolidation: d.consolidation,
    };
  });

  // Pipeline state for the Sources page (Addendum A 10.5): last run, open review items, failed sources.
  app.get("/v1/pipeline-status", async (_req, reply) => {
    try {
      return JSON.parse(await readFile(join(config.pipelineReportsDir, "status.json"), "utf8"));
    } catch {
      return reply.code(404).send({ error: "the pipeline has not run yet" });
    }
  });

  app.get("/v1/coverage", async () => {
    const d = data();
    const counts: Record<string, number> = {};
    for (const b of d.bylaws) counts[b.status] = (counts[b.status] ?? 0) + 1;
    return { wildlife: d.wildlifeCoverage, consolidation: d.consolidation, bylawCounts: counts, bylaws: d.bylaws };
  });

  app.get("/v1/map-layers", async () => ({
    layers: MAP_LAYERS.map(({ id, label, light, description, ruleIds, minzoom, defaultOn, legend }) => ({
      id,
      label,
      light,
      description,
      ruleIds,
      minzoom,
      defaultOn: !!defaultOn,
      legend,
      tiles: `/v1/tiles/${id}/{z}/{x}/{y}.png`,
    })),
  }));

  // Display copies, made once per data load (the pipeline's files can change under a running server).
  const shown = new WeakMap<object, unknown>();
  app.get("/v1/digitised.geojson", async (_req, reply) => {
    const all = data().digitised;
    if (!shown.has(all)) {
      // Only shapes that count: approved by a person, or published stricter under the one-way rule.
      const reviewed = all.filter((f) => ["approved", "provisional"].includes(featureState(f)));
      shown.set(all, { type: "FeatureCollection", features: reviewed.map(({ bbox: _b, ...f }) => displayFeature(f)) });
    }
    reply.header("Cache-Control", "public, max-age=3600");
    return shown.get(all);
  });

  app.get("/v1/tiles/:layer/:z/:x/:y.png", { config: { rateLimit: { max: 1200, timeWindow: "1 minute" } } }, async (req, reply) => {
    const p = req.params as { layer: string; z: string; x: string; y: string };
    const layer = MAP_LAYERS_BY_ID[p.layer];
    const z = Number(p.z);
    const x = Number(p.x);
    const y = Number(p.y);
    if (!layer || ![z, x, y].every(Number.isInteger) || z < 0 || z > 20) return reply.code(404).send();
    reply.header("Content-Type", "image/png");
    if (z < layer.minzoom) {
      reply.header("Cache-Control", "public, max-age=86400");
      return reply.send(TRANSPARENT_PNG);
    }
    const [minx, miny, maxx, maxy] = tileBounds(z, x, y);
    const params = new URLSearchParams({
      service: "WMS",
      version: "1.1.1",
      request: "GetMap",
      layers: `pub:${layer.typeName}`,
      format: "image/png",
      transparent: "true",
      srs: "EPSG:3857",
      bbox: `${minx},${miny},${maxx},${maxy}`,
      width: "256",
      height: "256",
      SLD_BODY: sldFor(layer),
    });
    if (layer.cql) params.set("CQL_FILTER", layer.cql);
    try {
      const img = await getBinary(`${config.wmsUrl}?${params}`, layer.ttlMs);
      if (!img.type.startsWith("image/")) throw new Error("WMS returned an error document");
      reply.header("Cache-Control", `public, max-age=${Math.round(layer.ttlMs / 1000)}`);
      return reply.send(img.buf);
    } catch {
      reply.header("Cache-Control", "no-store");
      return reply.code(502).send(TRANSPARENT_PNG);
    }
  });

  app.get("/v1/search", { config: { rateLimit: { max: 40, timeWindow: "1 minute" } } }, async (req) => {
    const q = String((req.query as Record<string, unknown>).q ?? "");
    return search(q);
  });

  app.post("/v1/reports", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (req, reply) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const message = String(b.message ?? "").trim();
    const category = String(b.category ?? "other").slice(0, 40);
    if (message.length < 5) return reply.code(400).send({ error: "Please describe the problem." });
    const lat = num(b.lat);
    const lon = num(b.lon);
    const entry = {
      id: randomUUID(),
      receivedAt: new Date().toISOString(),
      category,
      // Reports carry the point the user is reporting on, never their IP address (PRD 12.5).
      point: lat !== null && lon !== null ? { lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5 } : null,
      ruleId: b.ruleId ? String(b.ruleId).slice(0, 20) : null,
      release: data().release.id,
      verdict: b.verdict ? String(b.verdict).slice(0, 10) : null,
      message: message.slice(0, 4000),
      contact: b.contact ? String(b.contact).slice(0, 200) : null,
      falseGreen: category === "false_green",
    };
    await mkdir(config.reportsDir, { recursive: true });
    await appendFile(join(config.reportsDir, "reports.jsonl"), JSON.stringify(entry) + "\n");
    return { ok: true, id: entry.id };
  });

  app.setErrorHandler((err, req, reply) => {
    req.log.error({ err: errorText(err) }, "request failed");
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    reply.code(status).send({ error: status === 429 ? "Too many requests. Please wait a minute." : status >= 500 ? "Something went wrong on our side." : errorText(err) });
  });

  // The built web app, with client-side routing.
  if (existsSync(join(config.webDist, "index.html"))) {
    await app.register(fastifyStatic, {
      root: config.webDist,
      // Wildcard serving picks up a fresh build without a restart; misses fall through to index.html below.
      setHeaders: (res, path) => {
        if (/\/assets\//.test(path)) res.header("Cache-Control", "public, max-age=31536000, immutable");
        else res.header("Cache-Control", "no-cache");
      },
    });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/v1/") || req.url.startsWith("/assets/")) return reply.code(404).send({ error: "not found" });
      return reply.type("text/html").sendFile("index.html");
    });
  } else {
    app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: "not found" }));
  }

  return app;
}
