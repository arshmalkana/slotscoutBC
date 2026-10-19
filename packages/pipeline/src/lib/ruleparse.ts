/**
 * Rule-based reading of standard Closed Areas wordings (Addendum A 2, 10.3 step 6): road
 * corridors and whole areas. Produces the same answer shape as closed_area.v1, with quotes, so it
 * goes through the same checks and must agree with the AI runs.
 */
export interface Quote {
  field: string;
  quote: string;
}

export interface ClosedAreaAnswer {
  effect: string | null;
  exemptions: string[];
  period: { start: string; end: string } | null;
  within: { type: string; name: string } | null;
  geometry: {
    method: string;
    road: { name: string; source_hint: string } | null;
    feature: { type: string; name: string } | null;
    buffer_m: number | null;
    side: string | null;
    from: { type: string; road: string | null; name: string | null } | null;
    to: { type: string; road: string | null; name: string | null } | null;
    steps: { start: string | null; direction: string | null; follow: string | null; feature: string | null; side_or_bank: string | null; until: string | null; distance: string | null; quote: string }[];
  };
  quotes: Quote[];
  uncertain: string[];
}

const WITHIN = /(That portion|Those portions|All) of (?:the )?((?:[A-Z][\w'.-]*\s?)+?(?:Regional District|District of [A-Z][\w-]*|City of [A-Z][\w-]*|Village of [A-Z][\w-]*|Management Unit \d+-\d+))/;
const ROAD = String.raw`(?:[A-Z0-9][\w'.-]*\s?)+?(?:Road|Rd|Highway|Hwy|Forest Service Road|FSR|Avenue|Ave|Street|St|Drive|Way|Trail)(?:\s+No\.\s*\d+)?`;
const LINE = String.raw`(?:midline|centre ?line|center ?line|intersection)`;
const CORRIDOR = new RegExp(
  String.raw`(?<bufq>(?<n>\d+(?:\.\d+)?)\s*(?<unit>m|metres|meters|km)\s+(?<side>(?:on\s+)?(?:either|each|both)\s+sides?)\s+of\s+the\s+(?:centre ?line|center ?line|midline))\s+of\s+(?<road>${ROAD})` +
    String.raw`(?:\s+(?<fromq>between\s+the\s+${LINE}\s+of\s+(?<from>${ROAD}))\s+(?<toq>and\s+the\s+${LINE}\s+of\s+(?<to>${ROAD})))?`,
);

const kindOf = (name: string) => (/regional district/i.test(name) ? "regional_district" : /management unit/i.test(name) ? "wildlife_management_unit" : /district of|city of|village of/i.test(name) ? "municipality" : "other");
const hint = (road: string) => (/highway|hwy/i.test(road) ? "highway" : /fsr|forest service/i.test(road) ? "FTEN" : "DRA");

/** Returns an answer when the section matches a standard pattern, else null (it goes to the AI). */
export function parseClosedArea(text: string, effect: string | null): ClosedAreaAnswer | null {
  const body = text.split("\n").slice(1).join(" ").replace(/\s+/g, " ");
  const quotes: Quote[] = [];
  const w = body.match(WITHIN);
  const within = w ? { type: kindOf(w[2]!), name: w[2]!.trim() } : null;
  if (w) quotes.push({ field: "within", quote: w[0]!.trim() });
  const c = body.match(CORRIDOR);
  if (!c?.groups) return null;
  const g = c.groups as Record<string, string | undefined>;
  const buffer = Number(g.n) * (g.unit === "km" ? 1000 : 1);
  const road = g.road!.trim();
  quotes.push({ field: "geometry.buffer_m", quote: g.bufq! });
  quotes.push({ field: "geometry.side", quote: g.side! });
  quotes.push({ field: "geometry.road", quote: road });
  const from = g.from ? { type: "road_intersection", road: g.from.trim(), name: null } : null;
  const to = g.to ? { type: "road_intersection", road: g.to.trim(), name: null } : null;
  if (g.fromq) quotes.push({ field: "geometry.from", quote: g.fromq.trim() });
  if (g.toq) quotes.push({ field: "geometry.to", quote: g.toq.trim() });
  return {
    effect,
    exemptions: [],
    period: null,
    within,
    geometry: { method: "road_buffer", road: { name: road, source_hint: hint(road) }, feature: null, buffer_m: buffer, side: "both", from, to, steps: [] },
    quotes,
    uncertain: effect ? [] : ["effect"],
  };
}
