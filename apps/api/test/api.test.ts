import { beforeAll, describe, expect, it } from "vitest";
import { parseNoticesPage, parseNoticesPageFull } from "@slotscout/engine";
import { loadData, type StoredNotice } from "../src/data.js";
import { displayFeature } from "../src/display.js";
import { MAP_LAYERS, sldFor, tileBounds } from "../src/maplayers.js";
import { mergeWithStore, unreadBlocks } from "../src/roadNotices.js";
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

  it("reads km points with their status and the exact sentence", () => {
    const slollicum = notices.find((n) => n.fileSection === "5748.04")!;
    expect(slollicum.points?.[0]).toMatchObject({ km: 2, extent: "beyond", status: "closed" });
    expect(slollicum.text).toContain(slollicum.points![0]!.quote);
    expect(notices.find((n) => n.fileSection === "8126.01")!.points?.[0]).toMatchObject({ km: 1.7, status: "restricted" });
    const harrison = notices.find((n) => n.fileSection === "5748.01")!;
    expect(harrison.points?.[0]).toMatchObject({ km: 13, extent: "at", status: "caution" });
    expect(harrison.postedOn).toBe("2021-07-06");
  });
});

describe("district page layouts", () => {
  const OTHER = `<main><h2>Road closures and restrictions</h2>
<h3>FSRs closed due to fire activity (updated Sept 3, 2026)</h3>
<p><strong>Mud Creek 5496.01 -</strong> Entire FSR</p>
<p><strong>Slim Creek 8151</strong> - Entire FSR</p>
<h3>Planned Bridge Maintenance (updated Sept 3, 2026)</h3>
<p>Moosecamp 21km - Estimated Outages September 1 to September 30</p>
<h2>Road notices and warnings</h2>
<p><strong>Scottie Creek FSR 5451.01&nbsp;(September 1 - September 25, 2026)</strong> No access through the worksite at 4km to 5km.</p>
<p><strong>Beaver 7753.1 (Aug 12, 2013)</strong> Road Closed at 42 km.</p>
<h2>Road deactivation</h2>
<p>Discontinued and Closed FSRs with BCTS (Updated Regularly)</p>
<p>There are no closures at this time.</p>
<h2>Contact information</h2><p>Closed on weekends.</p></main>`;
  const r = parseNoticesPageFull(OTHER, "DCS", "https://www2.gov.bc.ca/x");

  it("reads undated road titles, date ranges and abbreviated dates", () => {
    expect(r.notices.map((n) => n.fileSection ?? n.road)).toEqual(["5496.01", "Slim Creek 8151", "Planned Bridge Maintenance", "5451.01", "7753.01"]);
    expect(r.notices.find((n) => n.fileSection === "5451.01")!.postedOn).toBe("2026-09-01");
    expect(r.notices.find((n) => n.fileSection === "7753.01")!.postedOn).toBe("2013-08-12");
  });

  it("carries a closure stated in the sub-heading to each road under it", () => {
    expect(r.notices.find((n) => n.fileSection === "5496.01")!.kind).toBe("closed");
    expect(r.notices.find((n) => n.road === "Slim Creek 8151")!.kind).toBe("closed");
    expect(r.notices.find((n) => n.road === "Planned Bridge Maintenance")!.kind).not.toBe("closed");
  });

  it("reports closure text it cannot tie to a road, and ignores contact sections", () => {
    expect(r.unparsed.map((u) => u.text)).toEqual(["Discontinued and Closed FSRs with BCTS (Updated Regularly)"]);
    const key = r.unparsed[0]!.key;
    expect(unreadBlocks("DCS", r.unparsed, [{ orgUnit: "DCS", key, text: "", status: "open" }])).toHaveLength(1);
    expect(unreadBlocks("DCS", r.unparsed, [{ orgUnit: "DCS", key, text: "", status: "read", readBy: "AB" }])).toHaveLength(0);
  });
});

describe("road notice store (one-way rule)", () => {
  const live = parseNoticesPage(PAGE, "Chilliwack", "https://www2.gov.bc.ca/gov/content/x");
  const gone: StoredNotice = {
    ...live.find((n) => n.fileSection === "5748.04")!,
    id: "Chilliwack|9999.01|2026-01-01",
    road: "Gone FSR 9999.01",
    fileSection: "9999.01",
    orgUnit: "DCK",
    firstSeen: "2026-01-01",
    lastSeen: "2026-09-01",
    listing: "removed_pending_review",
  };

  it("keeps a closure that left the page until a person approves the removal", () => {
    const merged = mergeWithStore("DCK", live, [gone]);
    expect(merged.find((n) => n.fileSection === "9999.01")?.listing).toBe("removed_pending_review");
    expect(mergeWithStore("DCK", live, [{ ...gone, listing: "removed_approved" }]).some((n) => n.fileSection === "9999.01")).toBe(false);
    expect(mergeWithStore("DSQ", live, [gone]).some((n) => n.fileSection === "9999.01")).toBe(false);
  });

  it("only uses an AI reading of km points once a person approved it", () => {
    const harrison = live.find((n) => n.fileSection === "5748.01")!;
    const ai: StoredNotice = { ...harrison, orgUnit: "DCK", firstSeen: "x", lastSeen: "x", extraction: "ai", points: [{ km: 1, extent: "beyond", status: "closed", quote: "x" }] };
    expect(mergeWithStore("DCK", live, [ai]).find((n) => n.fileSection === "5748.01")!.points?.[0]?.status).toBe("caution");
    const approved = mergeWithStore("DCK", live, [{ ...ai, approvedBy: "AB" }]);
    expect(approved.find((n) => n.fileSection === "5748.01")!.points?.[0]?.status).toBe("closed");
  });

  it("counts a road closed in a District Manager PDF only after approval, and keeps P6 grey until then", () => {
    const dm: StoredNotice = {
      id: "dm|DCK|DCK-1-gate_map|5833.01",
      district: "Chilliwack",
      section: "closure",
      road: "Map FSR",
      fileSection: "5833.01",
      text: "Gate",
      kind: "closed",
      url: "https://example.org/map.pdf",
      points: [],
      needsAi: true,
      extraction: "ai",
      origin: "dm_notice",
      listing: "listed",
      orgUnit: "DCK",
      firstSeen: "x",
      lastSeen: "x",
      approvedBy: null,
      ai: { task_id: "dm_notice-1", agreed: true, points: [{ km: null, extent: "unknown", status: "gated", quote: "Gate" }], rescinded: false },
    };
    const pending = mergeWithStore("DCK", live, [dm]).find((n) => n.fileSection === "5833.01")!;
    expect(pending.needsAi).toBe(true);
    expect(pending.points).toEqual([]);
    expect(pending.extraction).toBeUndefined();
    const approved = mergeWithStore("DCK", live, [{ ...dm, approvedBy: "AB", points: dm.ai!.points, needsAi: false }]).find((n) => n.fileSection === "5833.01")!;
    expect(approved.needsAi).toBe(false);
    expect(approved.points?.[0]?.status).toBe("gated");
    const caution = { ...dm, ai: { ...dm.ai!, points: [{ km: 2, extent: "at" as const, status: "caution" as const, quote: "x" }] } };
    expect(mergeWithStore("DCK", live, [caution]).some((n) => n.fileSection === "5833.01")).toBe(false);
  });

  it("still counts stored closures when the live page cannot be read", () => {
    const stored: StoredNotice = { ...live.find((n) => n.fileSection === "5748.04")!, orgUnit: "DCK", firstSeen: "x", lastSeen: "x", listing: "listed" };
    expect(mergeWithStore("DCK", null, [stored])).toHaveLength(1);
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

describe("closed-area shapes for the map", () => {
  it("sends a light copy: few properties, outlines simplified, rings still closed", () => {
    const ring = [...Array.from({ length: 200 }, (_, i) => [-122 + i * 0.00001, 49]), [-121.99, 49.01], [-122, 49.01], [-122, 49]];
    const f = displayFeature({ type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: { rule_id: "W5-001", effect: "no_shooting", authority: "s. 1", approximate: true, approximate_quality: "vicinity", source_text: "x".repeat(5000) } as never });
    const out = (f.geometry as { coordinates: number[][][] }).coordinates[0]!;
    expect(out.length).toBeLessThan(10);
    expect(out[0]).toEqual(out[out.length - 1]);
    expect(f.properties).toEqual({ rule_id: "W5-001", effect: "no_shooting", authority: "s. 1", approximate: true, approximate_quality: "vicinity" });
  });
});
