import { describe, expect, it } from "vitest";
import { formatDms, parseCoordinates, toUtm } from "../src/index.js";

function ok(input: string) {
  const r = parseCoordinates(input);
  if (!r.ok) throw new Error(`${input}: ${r.error}`);
  return r;
}

describe("parseCoordinates (PRD 2.2)", () => {
  const spotA = { lat: 49.41474, lon: -121.7547 };

  it.each([
    "49.41474, -121.75470",
    "49.41474 -121.75470",
    "49.41474N 121.75470W",
    "N49.41474 W121.75470",
    "49.41474° N, 121.75470° W",
  ])("reads decimal degrees: %s", (s) => {
    const r = ok(s);
    expect(r.point.lat).toBeCloseTo(spotA.lat, 5);
    expect(r.point.lon).toBeCloseTo(spotA.lon, 5);
    expect(r.note).toBeUndefined();
  });

  it("repairs a missing minus sign and says so", () => {
    const r = ok("49.41474, 121.75470");
    expect(r.point).toEqual(spotA);
    expect(r.note).toMatch(/minus/);
  });

  it("repairs swapped latitude and longitude", () => {
    const r = ok("-121.75470, 49.41474");
    expect(r.point).toEqual(spotA);
    expect(r.note).toMatch(/Swapped/);
  });

  it("reads degrees-minutes-seconds", () => {
    const r = ok(`49°24'53.1"N 121°45'16.9"W`);
    expect(r.format).toBe("degrees-minutes-seconds");
    expect(r.point.lat).toBeCloseTo(49.41475, 4);
    expect(r.point.lon).toBeCloseTo(-121.75469, 4);
  });

  it("reads space-separated DMS and decimal minutes", () => {
    expect(ok("49 24 53.1 N 121 45 16.9 W").point.lat).toBeCloseTo(49.41475, 4);
    const ddm = ok("49°24.884' N, 121°45.282' W");
    expect(ddm.format).toBe("degrees and decimal minutes");
    expect(ddm.point.lon).toBeCloseTo(-121.7547, 4);
  });

  it("round-trips UTM zone 10", () => {
    const u = toUtm(spotA);
    expect(u.zone).toBe(10);
    const r = ok(`10U ${u.easting} ${u.northing}`);
    expect(r.format).toBe("UTM zone 10");
    expect(r.point.lat).toBeCloseTo(spotA.lat, 4);
    expect(r.point.lon).toBeCloseTo(spotA.lon, 4);
    expect(ok(`Zone 10 ${u.easting}E ${u.northing}N`).point.lat).toBeCloseTo(spotA.lat, 4);
  });

  it("reads UTM zone 11", () => {
    const r = ok("11 500000 5500000");
    expect(r.point.lon).toBeCloseTo(-117, 3);
  });

  it("rejects UTM zones outside BC", () => {
    const r = parseCoordinates("17 500000 5500000");
    expect(r.ok).toBe(false);
  });

  it.each([
    ["https://www.google.com/maps/@49.41474,-121.7547,15z", spotA],
    ["https://www.google.com/maps/place/Harrison/@49.4,-121.7,12z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d49.41474!4d-121.7547", spotA],
    ["https://www.google.com/maps/search/?api=1&query=49.41474,-121.7547", spotA],
    ["https://maps.google.com/?q=49.41474,-121.7547", spotA],
    ["https://maps.apple.com/?ll=49.41474,-121.7547&q=Dropped%20Pin", spotA],
    ["https://maps.apple.com/?coordinate=49.41474,-121.7547", spotA],
    ["geo:49.41474,-121.7547", spotA],
  ])("reads map links: %s", (s, expected) => {
    expect(ok(s).point).toEqual(expected);
  });

  it("explains short links instead of guessing", () => {
    const r = parseCoordinates("https://maps.app.goo.gl/abc123");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Short map links/);
  });

  it("rejects text that is not coordinates", () => {
    expect(parseCoordinates("Harrison East FSR km 9").ok).toBe(false);
    expect(parseCoordinates("").ok).toBe(false);
  });

  it("notes when a point is outside BC", () => {
    expect(ok("45.5, -73.6").note).toMatch(/outside British Columbia/);
  });

  it("formats DMS", () => {
    expect(formatDms(spotA)).toBe(`49°24'53.1"N 121°45'16.9"W`);
  });
});
