import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import type { DigitisedRuleProps } from "@slotscout/engine";
import { checkQuotes, disagreements, schemaErrors } from "../src/lib/answers.js";
import { buildRoadBuffer, junctions, validateShape } from "../src/lib/geometry.js";
import { parseRobots, robotsAllows } from "../src/lib/robots.js";
import { parseClosedArea } from "../src/lib/ruleparse.js";
import { ruleIdFor, splitBylaw, splitRegulation } from "../src/lib/units.js";
import { normaliseUnit, quoteFound } from "../src/lib/util.js";
import { classifyAgainst } from "../src/build/closedAreas.js";

// Closed Areas Regulation, Schedule 5, section 85, as quoted in Addendum A 4.1.
const S85 = "Schedule 5\n85 That portion of Fraser Valley Regional District being 50 m either side of the centreline of Sylvester Road between the midline of Farms Road and the midline of Dale Road.";

describe("robots.txt", () => {
  const bclaws = parseRobots("User-agent: Googlebot\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: *\nDisallow: /\n");
  it("keeps SlotScout off a site that allows only Googlebot and Bingbot", () => {
    expect(robotsAllows(bclaws, "SlotScoutBot/0.1 (+https://slotscout.ca/about)", "/civix/document/id/complete/statreg/76_84_00_multi")).toBe(false);
    expect(robotsAllows(bclaws, "Googlebot/2.1", "/civix/")).toBe(true);
  });
  it("uses the longest matching rule", () => {
    const r = parseRobots("User-agent: *\nDisallow: /gov/\nAllow: /gov/content/industry/\n");
    expect(robotsAllows(r, "SlotScoutBot/0.1", "/gov/content/industry/natural-resource-use/x")).toBe(true);
    expect(robotsAllows(r, "SlotScoutBot/0.1", "/gov/search")).toBe(false);
  });
});

describe("rule-based reading and answer checks (Addendum A 4.1)", () => {
  const rule = parseClosedArea(S85, "no_shooting")!;

  it("reads the worked example exactly as the addendum expects", () => {
    expect(rule.within).toEqual({ type: "regional_district", name: "Fraser Valley Regional District" });
    expect(rule.geometry).toMatchObject({ method: "road_buffer", road: { name: "Sylvester Road", source_hint: "DRA" }, buffer_m: 50, side: "both", from: { type: "road_intersection", road: "Farms Road" }, to: { type: "road_intersection", road: "Dale Road" } });
    const q = Object.fromEntries(rule.quotes.map((x) => [x.field, x.quote]));
    expect(q["geometry.buffer_m"]).toBe("50 m either side of the centreline");
    expect(q["geometry.from"]).toBe("between the midline of Farms Road");
    expect(q["geometry.to"]).toBe("and the midline of Dale Road");
    expect(schemaErrors("closed_area.v1", rule)).toEqual([]);
  });

  it("drops any field whose quote is not in the source", () => {
    const bad = structuredClone(rule) as unknown as Record<string, any>;
    bad.quotes = bad.quotes.map((q: { field: string; quote: string }) => (q.field === "geometry.buffer_m" ? { ...q, quote: "500 m either side" } : q));
    bad.geometry.buffer_m = 500;
    const c = checkQuotes("closed_area", bad, S85);
    expect(c.rejected).toContain("geometry.buffer_m");
    expect((c.cleaned.geometry as Record<string, unknown>).buffer_m).toBeNull();
  });

  it("finds disagreements in landmarks, distances and effects", () => {
    const other = structuredClone(rule);
    other.geometry.to = { type: "road_intersection", road: "Dale Rd", name: null };
    expect(disagreements("closed_area", rule as never, other as never)).toEqual([]);
    other.geometry.buffer_m = 60;
    expect(disagreements("closed_area", rule as never, other as never)).toEqual(["buffer_m: run 1 50 vs run 2 60"]);
  });

  it("checks quotes ignoring only whitespace", () => {
    expect(quoteFound("50 m  either side", S85)).toBe(true);
    expect(quoteFound("50m either side", S85)).toBe(false);
  });
});

describe("units and hashing (Addendum A 5.1)", () => {
  it("splits a regulation into sections under their schedule", () => {
    const us = splitRegulation(`${S85}\n86 That portion of Fraser Valley Regional District being 100 m either side of the centreline of Test Road.\nSchedule 9\n1 All of Test Municipality.`, { source: "closed_areas", url: null, file: "x", fileSha256: "x", version: "test", confirmed: false });
    expect(us.map((u) => u.id)).toEqual(["car:sch5:s85", "car:sch5:s86", "car:sch9:s1"]);
    expect(us[0]!.meta.ruleId).toBe("W5-085");
    expect(us[0]!.text.startsWith("Schedule 5\n85 That portion")).toBe(true);
    expect(ruleIdFor("5.1", "3")).toBe("W6-003");
  });

  it("hashes wording, not layout", () => {
    expect(normaliseUnit("85  That portion  of X ,being 50 m")).toBe(normaliseUnit("That portion of X, being 50 m"));
    expect(normaliseUnit("centre line")).not.toBe(normaliseUnit("centreline"));
  });

  it("splits bylaws into numbered clauses with unique ids", () => {
    const us = splitBylaw("Title\n1. No person shall discharge a firearm.\n2. Except\n1. Schedule clause", "doc", { source: "bylaws", title: "t", url: null, file: "f", fileSha256: "x", version: "v", confirmed: true });
    expect(us.map((u) => u.id)).toEqual(["bylaw:doc:preamble", "bylaw:doc:1", "bylaw:doc:2", "bylaw:doc:1#2"]);
  });
});

describe("geometry and validation (Addendum A 4.4, 4.5)", () => {
  // A north-south road crossed by two east-west roads 1 km apart.
  const road = [turf.lineString([[-122.0, 49.0], [-122.0, 49.02]], { DIGITAL_ROAD_ATLAS_LINE_ID: 1 })] as never[];
  const farms = [turf.lineString([[-122.01, 49.005], [-121.99, 49.005]], { DIGITAL_ROAD_ATLAS_LINE_ID: 2 })] as never[];
  const dale = [turf.lineString([[-122.01, 49.014], [-121.99, 49.014]], { DIGITAL_ROAD_ATLAS_LINE_ID: 3 })] as never[];

  it("finds where the limits meet the road", () => {
    expect(junctions(road, farms)).toHaveLength(1);
  });

  it("buffers only the stretch between the limits, with a conservative pad", () => {
    const b = buildRoadBuffer({ road, from: farms, to: dale, bufferM: 50, quotes: {}, roadLayer: "DRA" });
    expect(b.problems).toEqual([]);
    const km2 = turf.area(turf.feature(b.geometry!)) / 1e6;
    // 1 km long x 120 m wide (50 m + 10 m pad each side) plus round ends.
    expect(km2).toBeGreaterThan(0.11);
    expect(km2).toBeLessThan(0.14);
    const v = validateShape({ geometry: b.geometry, method: "road_buffer", within: null, synopsis: null, runAgreement: true, disagreements: [] });
    expect(v.filter((x) => x.passed === false)).toEqual([]);
  });

  it("fails a road buffer that comes out too large", () => {
    const b = buildRoadBuffer({ road, from: farms, to: dale, bufferM: 2000, quotes: {}, roadLayer: "DRA" });
    const v = validateShape({ geometry: b.geometry, method: "road_buffer", within: null, synopsis: null, runAgreement: true, disagreements: [] });
    expect(v.find((x) => x.check === "area in expected range")!.passed).toBe(false);
  });

  it("sends a limit that cannot be found to a person instead of guessing", () => {
    const far = [turf.lineString([[-121.5, 49.5], [-121.49, 49.5]], {})] as never[];
    expect(buildRoadBuffer({ road, from: farms, to: far, bufferM: 50, quotes: {}, roadLayer: "DRA" }).geometry).toBeNull();
  });
});

describe("change direction (Addendum A 5.1)", () => {
  const feat = (half: number, effect: DigitisedRuleProps["effect"] = "no_shooting") =>
    ({ ...turf.polygon(turf.bboxPolygon([-122 - half, 49 - half, -122 + half, 49 + half]).geometry.coordinates), properties: { effect, buffer_m: 50, period: null, exemptions: [] } }) as unknown as Feature<Polygon, DigitisedRuleProps>;
  it("classifies growth as stricter, shrinking as looser, same as cosmetic", () => {
    expect(classifyAgainst(feat(0.01), feat(0.02))).toBe("stricter");
    expect(classifyAgainst(feat(0.02), feat(0.01))).toBe("looser");
    expect(classifyAgainst(feat(0.01), feat(0.01))).toBe("cosmetic");
    expect(classifyAgainst(feat(0.01, "no_shooting"), feat(0.02, "shot_only"))).toBe("unclear");
    expect(classifyAgainst(undefined, feat(0.01))).toBe("new");
  });
});
