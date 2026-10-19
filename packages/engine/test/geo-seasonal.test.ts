import { describe, expect, it } from "vitest";
import { compass8, destination, distanceM, markBlockedBearings, periodStatus, relate, resolveEndpoint, safeSectors } from "../src/index.js";
import { PIN, square } from "./fixtures.js";

describe("geometry", () => {
  it("relates points to polygons and lines", () => {
    const inside = relate(square(PIN, 100), PIN)!;
    expect(inside.inside).toBe(true);
    expect(inside.edgeDistanceM).toBeCloseTo(100, 0);

    const away = relate(square(PIN, 10, 0, 200), PIN)!;
    expect(away.inside).toBe(false);
    expect(away.distanceM).toBeCloseTo(190, 0);
    expect(compass8(away.bearingDeg)).toBe("N");
  });

  it("measures distance and bearing", () => {
    const p = destination(PIN, 135, 1000);
    expect(distanceM(PIN, p)).toBeCloseTo(1000, 0);
    expect(compass8(135)).toBe("SE");
  });

  it("blocks the bearings a feature subtends and keeps the opposite fan safe", () => {
    const bins = new Array<boolean>(360).fill(false);
    markBlockedBearings(square(PIN, 20, 0, 150), PIN, 250, bins);
    const sectors = safeSectors(bins);
    expect(sectors.find((s) => s.centreDeg === 0)!.safe).toBe(false);
    expect(sectors.find((s) => s.centreDeg === 180)!.safe).toBe(true);
    // A 70 degree fan centred 40 degrees off still touches a feature 8 degrees wide at north.
    expect(sectors.find((s) => s.centreDeg === 40)!.safe).toBe(false);
    expect(sectors.find((s) => s.centreDeg === 50)!.safe).toBe(true);
  });

  it("ignores features beyond the radius and blocks everything when inside", () => {
    const far = new Array<boolean>(360).fill(false);
    markBlockedBearings(square(PIN, 20, 0, 400), PIN, 250, far);
    expect(far.some(Boolean)).toBe(false);
    const inside = new Array<boolean>(360).fill(false);
    markBlockedBearings(square(PIN, 20), PIN, 250, inside);
    expect(inside.every(Boolean)).toBe(true);
  });
});

describe("seasonal periods", () => {
  it("resolves named endpoints", () => {
    expect(resolveEndpoint("labour_day", 2026).toISOString().slice(0, 10)).toBe("2026-09-07");
    expect(resolveEndpoint("saturday_after_labour_day", 2026).toISOString().slice(0, 10)).toBe("2026-09-12");
    expect(resolveEndpoint("thanksgiving", 2026).toISOString().slice(0, 10)).toBe("2026-10-12");
    expect(resolveEndpoint("last_sunday_of_march", 2026).toISOString().slice(0, 10)).toBe("2026-03-29");
  });

  it("evaluates the PRD example period (Mar 11 to the Saturday after Labour Day)", () => {
    const period = { start: "03-11", end: "saturday_after_labour_day" };
    const summer = periodStatus(period, new Date("2026-07-01T19:00:00Z"));
    expect(summer.active).toBe(true);
    expect(summer.nextChange).toBe("2026-09-13");
    expect(summer.text).toBe("from Mar 11 to the Saturday after Labour Day");
    const fall = periodStatus(period, new Date("2026-10-19T19:00:00Z"));
    expect(fall.active).toBe(false);
    expect(fall.nextChange).toBe("2027-03-11");
  });

  it("handles periods that wrap the new year, in Pacific time", () => {
    const period = { start: "09-10", end: "03-31" };
    expect(periodStatus(period, new Date("2027-01-15T19:00:00Z")).active).toBe(true);
    expect(periodStatus(period, new Date("2026-06-15T19:00:00Z")).active).toBe(false);
    // 2026-09-10 05:00 UTC is still Sep 9 in Vancouver.
    expect(periodStatus(period, new Date("2026-09-10T05:00:00Z")).active).toBe(false);
  });
});
