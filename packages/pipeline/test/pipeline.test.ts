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
import { classifyAgainst, partsInside } from "../src/build/closedAreas.js";
import { landDistrictName, muIds } from "../src/lib/gazetteer.js";
import { legendSymbols, mapIdFromFile, nameWords } from "../src/lib/mapimage.js";
import { parseRoadList } from "../src/lib/roadlist.js";

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

  it("splits a BC Laws consolidation: skips the contents list and repealed sections, keeps each title", () => {
    const text = [
      "Contents", "1\tInterpretation", "Schedule 1", "Schedule 3", "Schedule 5",
      "Interpretation", "1  In this regulation:",
      "Schedule 3", "", "No Shooting or Hunting Areas", "", "(Section 4)", "",
      "Repealed", "1  Repealed. [B.C. Reg. 224/92, s. 3.]", "",
      "Highway 3", "9  ", "", "(a)All areas within 0.4 km of the centerline of Highway 3.", "",
      "Schedule 5", "", "No Shooting Areas", "", "(Section 6)", "",
      "Sylvester Road", "85  That portion of Fraser Valley Regional District being 50 m either side of the centreline of Sylvester Road.", "",
      "[en. B.C. Reg. 172/86, s. 2.]", "",
      "Lot 495 N.W.D.", "86  That portion of M.U. 2-4 being Lot 495.",
    ].join("\n");
    const us = splitRegulation(text, { source: "closed_areas", url: null, file: "x", fileSha256: "x", version: "test", confirmed: true });
    expect(us.map((u) => u.id)).toEqual(["car:sch3:s9", "car:sch5:s85", "car:sch5:s86"]);
    expect(us[0]!.text).toBe("Schedule 3 No Shooting or Hunting Areas (Section 4)\nHighway 3\n9 (a)All areas within 0.4 km of the centerline of Highway 3.");
    expect(us[1]!.meta.sectionTitle).toBe("Sylvester Road");
    expect(us[1]!.text).not.toContain("Lot 495");
    expect(us[2]!.meta.sectionTitle).toBe("Lot 495 N.W.D.");
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

  it("buffers a whole road segment by segment, never across the gap between two pieces", () => {
    // Two pieces of one forest road 10 km apart: the buffer must not bridge them.
    const a = turf.lineString([[-122.0, 49.0], [-122.0, 49.01]], { FOREST_FILE_ID: "9175", ROAD_SECTION_ID: "01" });
    const b = turf.lineString([[-121.86, 49.0], [-121.86, 49.01]], { FOREST_FILE_ID: "9175", ROAD_SECTION_ID: "02" });
    const built = buildRoadBuffer({ road: [a, b] as never[], from: null, to: null, bufferM: 400, quotes: {}, roadLayer: "FTEN" });
    expect(built.geometry).not.toBeNull();
    const km2 = turf.area(turf.feature(built.geometry!)) / 1e6;
    expect(km2).toBeLessThan(5); // two ~1.1 km stretches, not a 10 km wide band
    expect(turf.booleanPointInPolygon([-121.93, 49.005], turf.feature(built.geometry!))).toBe(false);
  });

  it("keeps only the named area's parts inside the district the text names, never the district itself", () => {
    // Two "Electoral Area H" polygons in different regional districts; the text names the one in the first.
    const district = turf.bboxPolygon([-122.2, 49.0, -121.8, 49.4]) as Feature<Polygon>;
    const ownH = turf.bboxPolygon([-122.1, 49.1, -122.0, 49.2]);
    const otherH = turf.bboxPolygon([-120.1, 50.1, -120.0, 50.2]);
    const parts = partsInside([ownH, otherH], district);
    expect(parts).toHaveLength(1);
    expect(turf.area(parts[0]!)).toBeCloseTo(turf.area(ownH), -3);
    expect(turf.area(parts[0]!)).toBeLessThan(turf.area(district) / 10);
    // An area named but not found inside the district gives nothing to draw.
    expect(partsInside([otherH], district)).toEqual([]);
  });
});

describe("reading names and road lists from the official text", () => {
  it("reads management units however the regulation writes them", () => {
    expect(muIds("M.U. 1-1")).toEqual(["1-1"]);
    expect(muIds("M.U.s 2-06, 2-07, 2-08 and 2-09")).toEqual(["2-6", "2-7", "2-8", "2-9"]);
    expect(muIds("4-17")).toEqual(["4-17"]);
    expect(muIds("Range 5, Coast District")).toEqual([]);
    expect(landDistrictName("Cariboo Land District")).toBe("CARIBOO DISTRICT");
  });

  it("reads a lettered list of roads, with junction limits, vague limits and spur roads", () => {
    const list = parseRoadList(
      "4 Those portions of M.U. 2-3 being all Crown land within 400 m of the midline of the following roads, including any spur roads: (a)Jones Lake Forest Service Road; (b)Gillies Bay Road between its junction with Blubber Bay Road and Shelter Point Road; (c)McGuire Forest Service Road from the junction with the Tamihi Creek Forest Service Road to the crossing of an unnamed creek. [am. B.C. Reg. 115/2018, App. 1, s. 3.]",
    )!;
    expect(list.map((r) => r.name)).toEqual(["Jones Lake Forest Service Road", "Gillies Bay Road", "McGuire Forest Service Road"]);
    expect(list[1]).toMatchObject({ from: "Blubber Bay Road", to: "Shelter Point Road", partial: null });
    expect(list[2]!.partial).toMatch(/^from the junction/);
    expect(list.every((r) => r.spurs)).toBe(true);
  });

  it("reads the Province's closed-area maps: map number, legend symbol and name", () => {
    expect(mapIdFromFile("closed_areas_reg_3-69_26.pdf")).toBe("3-69");
    expect(mapIdFromFile("closed_area_51-14_22.pdf")).toBe("5.1-14");
    expect(mapIdFromFile("closed_areas_reg_9-22t_26.pdf")).toBe("9-22");
    expect(mapIdFromFile("nsa_5_139.pdf")).toBe("5-139");
    expect(mapIdFromFile("nsha_kalamalka_lake_park.pdf")).toBeNull();
    expect(legendSymbols("No shooting within 400m of the roads/streams highlighted in yellow")).toEqual([{ colour: "yellow", bufferM: 400 }]);
    expect(legendSymbols("No shooting within 400m on the east side and 800m on the west side of the roads highlighted in orange")).toEqual([{ colour: "orange", bufferM: 800 }]);
    expect(legendSymbols("No Shooting or Hunting Area")).toEqual([{ colour: "red", bufferM: null }]);
    expect([...nameWords("Chilko — Newton")]).toEqual(["chilko", "newton"]);
    expect(nameWords("no_hunting_area_-_400m_chilko-newton_road_mu_5-4_and_5-5.pdf").has("lord")).toBe(false);
  });

  it("gives up on a list it cannot read rather than drawing part of it", () => {
    expect(parseRoadList("within 400 m of the midline of any road highlighted in red on the attached map")).toBeNull();
    expect(parseRoadList("the following roads: (a)the area outlined on the attached map; (b)Jones Lake Forest Service Road.")).toBeNull();
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
