import { describe, expect, it } from "vitest";
import { destination, evaluate, type LayerKey } from "../src/index.js";
import { AT, ALL_KEYS, PIN, baseInput, digitised, feature, okLayer, square } from "./fixtures.js";

function check(report: ReturnType<typeof evaluate>, id: string) {
  const c = report.checks.find((c) => c.ruleId === id);
  if (!c) throw new Error(`no check ${id}`);
  return c;
}

describe("evaluate: verdict precedence (PRD 3.9)", () => {
  it("is green only when every check passes on fresh data", () => {
    const r = evaluate(baseInput());
    expect(r.verdict.state).toBe("green");
    expect(r.verdict.headline).toBe("No restriction found");
    expect(r.verdict.reason).not.toMatch(/legal|allowed/i);
    expect(r.lights.find((l) => l.id === "fallzone")!.state).toBe("green");
  });

  it("turns red on private land and names the owner type, not the owner", () => {
    const input = baseInput();
    input.layers.parcels_point = okLayer("parcels_point", [feature(square(PIN, 50), { OWNER_TYPE: "Private" })]);
    const r = evaluate(input);
    expect(r.verdict.state).toBe("red");
    expect(r.verdict.headline).toBe("Not allowed here");
    expect(check(r, "O1").status).toBe("fail");
  });

  it("lists federal reasons before ownership reasons", () => {
    const input = baseInput({}, { firearmClass: "restricted" });
    input.layers.parcels_point = okLayer("parcels_point", [feature(square(PIN, 50), { OWNER_TYPE: "Private" })]);
    const r = evaluate(input);
    expect(r.verdict.reason).toMatch(/approved shooting range/);
  });

  it("is red everywhere for restricted and prohibited firearms (F1)", () => {
    for (const firearmClass of ["restricted", "prohibited"] as const) {
      const r = evaluate(baseInput({}, { firearmClass }));
      expect(r.verdict.state).toBe("red");
      expect(check(r, "F1").moreUrl).toBe("/ranges");
    }
  });

  it("is grey when the region's closed areas are not digitised", () => {
    const r = evaluate(baseInput({ wildlifeCoverage: [{ region: "3", name: "Thompson", status: "not_started" }] }));
    expect(r.verdict.state).toBe("grey");
    expect(r.verdict.headline).toBe("Cannot confirm");
    expect(check(r, "W1–W12").reason).toMatch(/not yet digitised/);
  });

  it("is grey when a local bylaw has not been reviewed, and links to it", () => {
    const r = evaluate(
      baseInput({
        bylaws: [
          {
            key: "ea:Test Electoral Area Z",
            kind: "electoral_area",
            name: "Test Electoral Area Z",
            status: "not_started",
            bylaw: { title: "Firearms Discharge Bylaw", number: "123", url: "https://example.test/bylaw.pdf" },
          },
        ],
      }),
    );
    expect(r.verdict.state).toBe("grey");
    const l2 = check(r, "L2");
    expect(l2.status).toBe("unknown");
    expect(l2.moreUrl).toBe("https://example.test/bylaw.pdf");
  });

  it("red beats amber and grey", () => {
    const input = baseInput({ wildlifeCoverage: [] });
    input.layers.bc_parks = okLayer("bc_parks", [feature(square(PIN, 200), { PROTECTED_LANDS_NAME: "TEST PARK", PROTECTED_LANDS_CODE: "PP", PROTECTED_LANDS_DESIGNATION: "PROVINCIAL PARK" })]);
    input.layers.buildings = okLayer("buildings", [feature(square(PIN, 5, 100), { FEATURE_TYPE: "barn" })]);
    const r = evaluate(input);
    expect(r.verdict.state).toBe("red");
    expect(r.verdict.reason).toMatch(/Test Park/);
  });
});

describe("evaluate: no false green", () => {
  it("never shows green when any layer failed to load", () => {
    for (const key of ALL_KEYS) {
      if (key === "province") continue;
      const input = baseInput();
      input.layers[key] = { sourceId: input.layers[key]!.sourceId, status: "error", error: "timeout", features: [] };
      const r = evaluate(input);
      expect(r.verdict.state, `layer ${key}`).not.toBe("green");
    }
  });

  it("never shows green when any layer is stale", () => {
    for (const key of ALL_KEYS) {
      if (key === "province") continue;
      const input = baseInput();
      input.layers[key] = { ...input.layers[key]!, fetchedAt: new Date(AT.getTime() - 400 * 86400_000).toISOString() };
      const r = evaluate(input);
      expect(r.verdict.state, `layer ${key}`).not.toBe("green");
    }
  });

  it("never shows green outside BC or when BC membership is unknown", () => {
    expect(evaluate(baseInput({ inBC: false })).verdict.state).toBe("grey");
    expect(evaluate(baseInput({ inBC: null })).verdict.state).toBe("grey");
  });

  it("never shows green when road notices could not be read and a resource road is nearby", () => {
    const input = baseInput({ roadNotices: { district: "Test", status: "error", notices: [], error: "503" } });
    const line = { type: "LineString" as const, coordinates: [[PIN.lon + 0.03, PIN.lat - 0.01], [PIN.lon + 0.03, PIN.lat + 0.01]] };
    input.layers.fsr_roads = okLayer("fsr_roads", [feature(line, { FOREST_FILE_ID: "1", ROAD_SECTION_ID: "01", ROAD_SECTION_NAME: "TEST" })]);
    expect(evaluate(input).verdict.state).not.toBe("green");
  });

  it("ignores digitised areas that were not reviewed by a second person, and goes grey", () => {
    const input = baseInput({ digitised: [digitised(square(PIN, 300), { reviewed_by: "AA" })] });
    const r = evaluate(input);
    expect(r.verdict.state).toBe("grey");
    expect(check(r, "W1–W12").reason).toMatch(/not yet reviewed/);
  });

  it("goes grey when a reviewed region was not re-confirmed recently", () => {
    const r = evaluate(baseInput({ wildlifeCoverage: [{ region: "3", name: "Thompson", status: "reviewed", confirmedOn: "2026-01-01" }] }));
    expect(r.verdict.state).toBe("grey");
  });

  it("treats unclassified parcel ownership as unknown", () => {
    const input = baseInput();
    input.layers.parcels_point = okLayer("parcels_point", [feature(square(PIN, 50), { OWNER_TYPE: "Unclassified" })]);
    expect(evaluate(input).verdict.state).toBe("grey");
  });
});

describe("evaluate: profile-dependent Closed Areas rules", () => {
  it("Schedule 9 shot-only area: green for shot, red for rifle (PRD 11.2)", () => {
    const area = digitised(square(PIN, 300), { rule_id: "W9-001", effect: "shot_only" });
    expect(evaluate(baseInput({ digitised: [area] }, { firearmType: "shotgun_shot", fallZoneM: 250 })).verdict.state).toBe("green");
    const rifle = evaluate(baseInput({ digitised: [area] }, { firearmType: "centrefire", fallZoneM: 250 }));
    expect(rifle.verdict.state).toBe("red");
    expect(check(rifle, "W9").status).toBe("fail");
  });

  it("Schedule 11 no rifles: shotgun passes, rimfire fails", () => {
    const area = digitised(square(PIN, 2000), { rule_id: "W11-001", effect: "no_rifle" });
    expect(check(evaluate(baseInput({ digitised: [area] }, { firearmType: "shotgun_slug" })), "W11").status).toBe("pass");
    expect(check(evaluate(baseInput({ digitised: [area] }, { firearmType: "rimfire" })), "W11").status).toBe("fail");
  });

  it("Schedule 13 non-toxic shot is amber for shot profiles", () => {
    const area = digitised(square(PIN, 300), { rule_id: "W12-001", effect: "non_toxic" });
    const r = evaluate(baseInput({ digitised: [area] }));
    expect(r.verdict.state).toBe("amber");
    expect(r.verdict.headline).toBe("Only if…");
    expect(r.verdict.reason).toMatch(/non-toxic/);
  });

  it("Schedule 5.1 hunting-exempt areas: red for target shooting, amber (never green) for hunting", () => {
    const area = digitised(square(PIN, 300), { rule_id: "W6-001", effect: "no_shooting_hunting_exempt" });
    expect(evaluate(baseInput({ digitised: [area] })).verdict.state).toBe("red");
    const hunt = evaluate(baseInput({ digitised: [area] }, { activity: "hunting" }));
    expect(hunt.verdict.state).toBe("amber");
    expect(check(hunt, "W6").notes?.join(" ")).toMatch(/exempt/);
  });

  it("seasonal closures are red inside the period and a note outside it", () => {
    const area = digitised(square(PIN, 300), { rule_id: "W7-001", effect: "no_shooting_seasonal", period: { start: "09-01", end: "12-31" } });
    const inside = evaluate(baseInput({ digitised: [area] }));
    expect(check(inside, "W7").status).toBe("fail");
    expect(check(inside, "W7").changesOn).toBe("2027-01-01");
    const outside = evaluate(baseInput({ digitised: [area], at: new Date("2026-06-15T18:00:00Z") }));
    expect(check(outside, "W7").status).toBe("note");
    expect(outside.verdict.state).toBe("green");
  });
});

describe("evaluate: fall zone", () => {
  it("lists private land inside the fall zone with distance and bearing, and suggests a throw direction", () => {
    const input = baseInput({}, { fallZoneM: 250 });
    // Private parcel 180 m to the south-west.
    const sw = destination(PIN, 225, 180);
    input.layers.parcels_nearby = okLayer("parcels_nearby", [feature(square(sw, 20), { OWNER_TYPE: "Private" })]);
    const r = evaluate(input);
    expect(r.verdict.state).toBe("amber");
    const fz = check(r, "FZ");
    expect(fz.status).toBe("conditional");
    expect(fz.reason).toMatch(/Private land .* to the SW/);
    expect(r.fallZone.sectors.find((s) => s.centreDeg === 220)!.safe).toBe(false);
    expect(r.fallZone.sectors.find((s) => s.centreDeg === 40)!.safe).toBe(true);
    expect(r.fallZone.bestBearingDeg).toBe(40);
    expect(r.fallZone.bestBearingMagneticDeg).toBe(24);
  });

  it("is amber when a road is inside the fall zone and red inside the road allowance", () => {
    const near = baseInput({}, { fallZoneM: 250 });
    const road = (offsetM: number) => ({ type: "LineString" as const, coordinates: [destination(destination(PIN, 90, offsetM), 0, -500), destination(destination(PIN, 90, offsetM), 0, 500)].map((p) => [p.lon, p.lat]) });
    near.layers.dra_roads = okLayer("dra_roads", [feature(road(100), { ROAD_NAME_FULL: "Test Rd", ROAD_CLASS: "local", NUMBER_OF_LANES: 2 })]);
    const r1 = evaluate(near);
    expect(check(r1, "W13").status).toBe("conditional");
    expect(check(r1, "S2").status).toBe("conditional");
    expect(r1.fallZone.sectors.find((s) => s.centreDeg === 90)!.safe).toBe(false);
    expect(r1.fallZone.sectors.find((s) => s.centreDeg === 270)!.safe).toBe(true);

    const on = baseInput({}, { fallZoneM: 250 });
    on.layers.dra_roads = okLayer("dra_roads", [feature(road(10), { ROAD_NAME_FULL: "Test Rd", ROAD_CLASS: "local", NUMBER_OF_LANES: 2 })]);
    expect(check(evaluate(on), "W13").status).toBe("fail");
  });

  it("marks the compass incomplete when a hazard layer failed", () => {
    const input = baseInput();
    input.layers.buildings = { sourceId: "buildings", status: "error", features: [] };
    expect(evaluate(input).fallZone.incomplete).toBe(true);
  });
});

describe("evaluate: report shape", () => {
  it("has 12 lights in the PRD order, and imagery never changes the verdict", () => {
    const r = evaluate(baseInput({ imagery: { provider: "x" } }));
    expect(r.lights.map((l) => l.id)).toEqual(["federal", "wildlife", "parks", "indigenous", "ownership", "local", "recsites", "wildfire", "access", "fallzone", "imagery", "freshness"]);
    expect(r.lights.find((l) => l.id === "imagery")!.state).toBe("grey");
    expect(r.verdict.state).toBe("green");
    expect(r.imagery.notes[0]).toMatch(/Imagery date unknown/);
  });

  it("every check carries a citation and a plain reason", () => {
    const r = evaluate(baseInput());
    for (const c of r.checks) {
      expect(c.reason.length, c.ruleId).toBeGreaterThan(5);
      expect(c.citation.length, c.ruleId).toBeGreaterThan(2);
    }
    expect(r.standingChecks.length).toBeGreaterThan(3);
    expect(r.disclaimer).toMatch(/Not legal advice/);
  });

  it("flags road closures on nearby resource roads (P6) as amber", () => {
    const input = baseInput();
    const line = { type: "LineString" as const, coordinates: [[PIN.lon + 0.01, PIN.lat - 0.01], [PIN.lon + 0.01, PIN.lat + 0.01]] };
    input.layers.fsr_roads = okLayer("fsr_roads" as LayerKey, [feature(line, { FOREST_FILE_ID: "5748", ROAD_SECTION_ID: "04", ROAD_SECTION_NAME: "SLOLLICUM", FILE_TYPE_DESCRIPTION: "Forest Service Road" })]);
    input.roadNotices = {
      district: "Chilliwack",
      status: "ok",
      fetchedAt: new Date(AT.getTime() - 3600_000).toISOString(),
      pageUrl: "https://example.test",
      notices: [{ district: "Chilliwack", section: "closure", road: "Slollicum FSR", fileSection: "5748.04", date: "December 17, 2021", text: "No access at 2 km due to washout.", kind: "closed", url: "https://example.test" }],
    };
    const r = evaluate(input);
    expect(check(r, "P6").status).toBe("conditional");
    expect(r.access.vehicle).toBe("high clearance recommended");
  });
});
