import { beforeAll, describe, expect, it } from "vitest";
import { loadData } from "../src/data.js";
import { MAP_LAYERS, sldFor, tileBounds } from "../src/maplayers.js";
import { parseNoticesPage } from "../src/roadNotices.js";
import { buildApp } from "../src/server.js";

const PAGE = `<html><body><main>
<h2 class="bc_h2">Road notices and warnings</h2>
<div class="callout"><p>Due to severe wildfires in the region, drive carefully.</p></div>
<p><strong>Harrison East FSR 5748.01&nbsp;(July 6, 2021)</strong><br />
&ldquo;Please be aware of Rockfall Hazard &ndash; No Stopping&rdquo; warning signs at 13.0 km. See the <a href="/assets/notice.pdf">District Manager Notice.</a></p>
<p><strong><span>Liumchen East FSR 5127.4&nbsp;(December 22, 2025)</span></strong><br /><span>Please drive with caution. Tension cracks at 3.9 km.</span></p>
<h2 class="bc_h2">Road closures and restrictions</h2>
<p><strong>Wildfire Activity Closure Notice (July 23, 2026)</strong><br />The following Forest Service Roads are CLOSED until further notice:</p>
<ul><li>NAHATLATCH RIVER (6996.01)</li><li>STOYOMA 3400 (7972 04)</li></ul>
<p><strong>Slollicum FSR 5748.04 (December 17, 2021)</strong><br />No access at 2 km due to washout. Only drivable for the first 2 kms up to washout.</p>
<p><strong>Peers FSR 8126.01 (September 22, 2026)</strong><br />Restricted access at 1.7 km. For further details see Access Control Authorization AC8126-19-01 (PDF, 1MB)</p>
<h2>Structure information</h2><p>For information about downrated structures, visit the page.</p>
</main></body></html>`;

describe("district road notices parser", () => {
  const notices = parseNoticesPage(PAGE, "Chilliwack", "https://www2.gov.bc.ca/gov/content/x");

  it("reads each notice with road, file section, date and kind", () => {
    const harrison = notices.find((n) => n.fileSection === "5748.01")!;
    expect(harrison.section).toBe("warning");
    expect(harrison.date).toBe("July 6, 2021");
    expect(harrison.kind).toBe("caution");
    expect(harrison.text).toMatch(/Rockfall Hazard – No Stopping/);
    expect(harrison.url).toBe("https://www2.gov.bc.ca/assets/notice.pdf");
    expect(notices.find((n) => n.road.startsWith("Liumchen"))!.fileSection).toBe("5127.04");
  });

  it("classifies closures and restrictions", () => {
    expect(notices.find((n) => n.fileSection === "5748.04")!.kind).toBe("closed");
    expect(notices.find((n) => n.fileSection === "8126.01")!.kind).toBe("restricted");
  });

  it("splits a notice that closes a list of roads into one notice per road", () => {
    const listed = notices.filter((n) => n.date === "July 23, 2026");
    expect(listed.map((n) => n.fileSection)).toEqual(["6996.01", "7972.04"]);
    expect(listed.every((n) => n.kind === "closed")).toBe(true);
  });

  it("skips intro callouts and sections without dated notices", () => {
    expect(notices.some((n) => /severe wildfires/.test(n.text))).toBe(false);
    expect(notices).toHaveLength(6);
  });
});

describe("map layers", () => {
  it("never uses the reserved verdict colours", () => {
    const reserved = [/^#(?:dc2626|ef4444|b91c1c|f59e0b|d97706|fbbf24|16a34a|22c55e|15803d|9ca3af|6b7280)$/i];
    for (const l of MAP_LAYERS) {
      for (const e of l.legend) for (const r of reserved) expect(r.test(e.color), `${l.id} ${e.color}`).toBe(false);
      expect(sldFor(l)).toContain(`pub:${l.typeName}`);
    }
  });

  it("computes web mercator tile bounds", () => {
    const [minx, miny, maxx, maxy] = tileBounds(0, 0, 0);
    expect(minx).toBeCloseTo(-20037508.34, 0);
    expect(maxy).toBeCloseTo(20037508.34, 0);
    expect(maxx - minx).toBeCloseTo(maxy - miny, 3);
  });
});

describe("HTTP API", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  beforeAll(async () => {
    await loadData();
    app = await buildApp();
  });

  it("reports health and release", async () => {
    const r = await app.inject({ url: "/v1/health" });
    expect(r.statusCode).toBe(200);
    expect(r.json().release).toBeTruthy();
  });

  it("validates check inputs", async () => {
    expect((await app.inject({ url: "/v1/check" })).statusCode).toBe(400);
    expect((await app.inject({ url: "/v1/check?lat=91&lon=0" })).statusCode).toBe(400);
    expect((await app.inject({ url: "/v1/check?lat=49&lon=-121&date=notadate" })).statusCode).toBe(400);
    const batch = await app.inject({ method: "POST", url: "/v1/check/batch", payload: { points: new Array(101).fill({ lat: 49, lon: -121 }) } });
    expect(batch.statusCode).toBe(400);
  });

  it("lists rules, lights and map layers", async () => {
    const rules = (await app.inject({ url: "/v1/rules" })).json();
    expect(rules.rules.length).toBeGreaterThan(40);
    expect(rules.lights).toHaveLength(12);
    const rule = (await app.inject({ url: "/v1/rules/w13" })).json();
    expect(rule.rule.id).toBe("W13");
    expect((await app.inject({ url: "/v1/rules/ZZ" })).statusCode).toBe(404);
    const layers = (await app.inject({ url: "/v1/map-layers" })).json();
    expect(layers.layers[0].tiles).toMatch(/^\/v1\/tiles\//);
  });

  it("serves the source register and coverage", async () => {
    const s = (await app.inject({ url: "/v1/sources" })).json();
    expect(s.sources.find((x: { id: string }) => x.id === "parcels").freshnessHours).toBeGreaterThan(0);
    const c = (await app.inject({ url: "/v1/coverage" })).json();
    expect(c.wildlife.length).toBe(9);
    expect(c.bylaws.length).toBeGreaterThan(300);
  });

  it("returns a transparent tile below a layer's minimum zoom without calling upstream", async () => {
    const r = await app.inject({ url: "/v1/tiles/private_land/5/5/10.png" });
    expect(r.statusCode).toBe(200);
    expect(r.headers["content-type"]).toBe("image/png");
    expect((await app.inject({ url: "/v1/tiles/nope/5/5/10.png" })).statusCode).toBe(404);
  });

  it("rejects empty problem reports", async () => {
    const r = await app.inject({ method: "POST", url: "/v1/reports", payload: { message: "" } });
    expect(r.statusCode).toBe(400);
  });
});
