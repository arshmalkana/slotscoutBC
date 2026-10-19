import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020Module, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import { P } from "./paths.js";
import { quoteFound } from "./util.js";

/**
 * Answer checks (Addendum A 4.1, 4.5, 7.3): schema, verbatim quotes, and agreement between the
 * two independent runs. A field whose quote is not in the source is dropped; any disagreement
 * sends the item to a person.
 */
// ajv ships CommonJS; under ESM the class sits on .default.
const Ajv2020 = ((Ajv2020Module as unknown as { default?: typeof Ajv2020Module }).default ?? Ajv2020Module) as typeof Ajv2020Module;
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validators = new Map<string, ValidateFunction>();

export function schemaErrors(schemaId: string, answer: unknown): string[] {
  let v = validators.get(schemaId);
  if (!v) {
    const s = JSON.parse(readFileSync(join(P.schema, `${schemaId}.json`), "utf8")) as Record<string, unknown>;
    delete s.$schema;
    v = ajv.compile(s);
    validators.set(schemaId, v);
  }
  return v(answer) ? [] : (v.errors ?? []).map((e: ErrorObject) => `${e.instancePath || "/"} ${e.message}`);
}

type Q = { field: string; quote: string };

const get = (o: unknown, path: string): unknown =>
  path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce<unknown>((x, k) => (x && typeof x === "object" ? (x as Record<string, unknown>)[k] : undefined), o);

/** Field paths that must carry a quote when filled, per schema. */
function quotedFields(kind: string, a: Record<string, unknown>): string[] {
  if (kind === "closed_area") {
    const g = (a.geometry ?? {}) as Record<string, unknown>;
    const f = ["within", "period", "geometry.road", "geometry.feature", "geometry.buffer_m", "geometry.from", "geometry.to"].filter((p) => get(a, p) !== null && get(a, p) !== undefined);
    if (a.effect) f.push("effect");
    if (g.side && g.side !== "unknown") f.push("geometry.side");
    ((a.exemptions as string[]) ?? []).forEach((_, i) => f.push(`exemptions[${i}]`));
    return f;
  }
  if (kind === "road_notice") {
    const f = ["road.name"];
    if (get(a, "road.file_section")) f.push("road.file_section");
    if (a.posted_on) f.push("posted_on");
    if (a.rescinded) f.push("rescinded");
    return f;
  }
  if (kind === "bylaw") {
    const f: string[] = [];
    for (const k of ["title", "number", "adopted_on"]) if (get(a, `bylaw.${k}`)) f.push(`bylaw.${k}`);
    if (a.target_shooting && a.target_shooting !== "unclear") f.push("target_shooting");
    return f;
  }
  return [];
}

/** Lists of items that carry their own quote. */
function itemQuotes(kind: string, a: Record<string, unknown>): { path: string; quote: string }[] {
  const lists: Record<string, string[]> = {
    closed_area: ["geometry.steps"],
    road_notice: ["points"],
    bylaw: ["definitions", "prohibitions", "exceptions", "distance_rules", "schedule_maps"],
  };
  const out: { path: string; quote: string }[] = [];
  for (const l of lists[kind] ?? []) ((get(a, l) as { quote: string }[] | undefined) ?? []).forEach((it, i) => out.push({ path: `${l}[${i}]`, quote: it.quote }));
  return out;
}

export interface QuoteCheck {
  /** Fields whose quote was missing or not found verbatim; they are treated as not extracted. */
  rejected: string[];
  /** The answer with rejected fields set to null (lists: the item removed). */
  cleaned: Record<string, unknown>;
  quotes: Record<string, string>;
}

function setNull(o: Record<string, unknown>, path: string): void {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  const last = parts.pop()!;
  const parent = parts.reduce<unknown>((x, k) => (x as Record<string, unknown>)?.[k], o) as Record<string, unknown> | unknown[] | undefined;
  if (!parent) return;
  if (Array.isArray(parent)) parent[Number(last)] = null;
  else parent[last] = null;
}

export function checkQuotes(kind: string, answer: Record<string, unknown>, source: string): QuoteCheck {
  const cleaned = structuredClone(answer);
  const quotes = (answer.quotes as Q[] | undefined) ?? [];
  const byField = new Map<string, string[]>();
  for (const q of quotes) byField.set(q.field, [...(byField.get(q.field) ?? []), q.quote]);
  const rejected: string[] = [];
  const kept: Record<string, string> = {};
  for (const f of quotedFields(kind, answer)) {
    const qs = (byField.get(f) ?? []).concat(f.startsWith("geometry.") ? (byField.get(f.replace(/^geometry\./, "")) ?? []) : []);
    const good = qs.find((q) => quoteFound(q, source));
    if (good) kept[f] = good;
    else {
      rejected.push(f);
      setNull(cleaned, f);
    }
  }
  for (const it of itemQuotes(kind, answer)) {
    if (quoteFound(it.quote, source)) kept[it.path] = it.quote;
    else {
      rejected.push(it.path);
      setNull(cleaned, it.path);
    }
  }
  // Remove nulled list items.
  for (const l of ["geometry.steps", "points", "definitions", "prohibitions", "exceptions", "distance_rules", "schedule_maps", "exemptions"]) {
    const arr = get(cleaned, l);
    if (Array.isArray(arr)) {
      const parts = l.split(".");
      const last = parts.pop()!;
      const parent = parts.reduce<Record<string, unknown>>((x, k) => x[k] as Record<string, unknown>, cleaned);
      parent[last] = arr.filter((x) => x !== null);
    }
  }
  return { rejected, cleaned, quotes: kept };
}

const norm = (v: unknown) =>
  typeof v === "string"
    ? v
        .toLowerCase()
        .replace(/\b(road|rd)\b/g, "rd")
        .replace(/\b(street|st)\b/g, "st")
        .replace(/\b(avenue|ave)\b/g, "ave")
        .replace(/\b(highway|hwy)\b/g, "hwy")
        .replace(/\b(forest service road|fsr)\b/g, "fsr")
        .replace(/[^a-z0-9.]+/g, " ")
        .trim()
    : v;

/** The facts that must match between runs: landmarks, distances, effects (Addendum A 4.5). */
export function comparable(kind: string, a: Record<string, unknown> | null): Record<string, unknown> {
  if (!a) return {};
  if (kind === "closed_area") {
    const g = (a.geometry ?? {}) as Record<string, unknown>;
    const lm = (x: unknown) => (x ? norm((x as { road?: string; name?: string }).road ?? (x as { name?: string }).name ?? null) : null);
    return {
      effect: a.effect ?? null,
      within: norm((a.within as { name?: string } | null)?.name ?? null),
      method: g.method ?? null,
      road: norm((g.road as { name?: string } | null)?.name ?? null),
      feature: norm((g.feature as { name?: string } | null)?.name ?? null),
      buffer_m: g.buffer_m ?? null,
      side: g.side ?? null,
      from: lm(g.from),
      to: lm(g.to),
      period: a.period ? `${(a.period as { start: string }).start}–${(a.period as { end: string }).end}` : null,
      steps: ((g.steps as Record<string, unknown>[]) ?? []).map((s) => [norm(s.feature), norm(s.until), s.distance ?? null, s.follow ?? null].join("|")),
      exemptions: ((a.exemptions as string[]) ?? []).length,
    };
  }
  if (kind === "road_notice") {
    const pts = ((a.points as Record<string, unknown>[]) ?? []).map((p) => `${p.km ?? "?"}-${p.km_end ?? ""}:${p.extent}:${p.status}`).sort();
    return { road: norm((a.road as { name?: string }).name), file_section: (a.road as { file_section?: string }).file_section ?? null, rescinded: a.rescinded ?? false, points: pts };
  }
  if (kind === "bylaw") {
    return {
      target_shooting: a.target_shooting,
      prohibitions: ((a.prohibitions as unknown[]) ?? []).length,
      exceptions: ((a.exceptions as unknown[]) ?? []).length,
      distances: ((a.distance_rules as { distance_m: number | null }[]) ?? []).map((d) => d.distance_m).sort(),
      number: norm((a.bylaw as { number?: string } | null)?.number ?? null),
    };
  }
  if (kind === "change") return { change_type: a.change_type };
  return {};
}

export function disagreements(kind: string, a: Record<string, unknown> | null, b: Record<string, unknown> | null): string[] {
  const x = comparable(kind, a);
  const y = comparable(kind, b);
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
  return [...keys].filter((k) => JSON.stringify(x[k]) !== JSON.stringify(y[k])).map((k) => `${k}: run 1 ${JSON.stringify(x[k])} vs run 2 ${JSON.stringify(y[k])}`);
}
