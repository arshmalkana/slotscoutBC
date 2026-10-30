import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ContributionView } from "@slotscout/engine";
import { addContribution, checkContribution, listContributions, reviewContribution, reviewerFor, useFolderStore } from "../src/contributions.js";
import { withContributions } from "../src/workbench.js";

const targets = { closedAreas: new Set(["W5-049"]), bylaws: new Set(["ea:SLRD Electoral Area A"]) };
const square = { type: "Polygon", coordinates: [[[-121.8, 49.3], [-121.79, 49.3], [-121.79, 49.31], [-121.8, 49.31], [-121.8, 49.3]]] };

describe("map editor contributions", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "slotscout-contrib-"));
    useFolderStore(dir);
    process.env.REVIEWER_KEYS = "Sam Reviewer=sam-key-0123456789abcdef,Alice Example=alice-key-0123456789abcd,Short=tooshort";
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("checks what people send: a known target, a person's name, a closed shape inside BC, a quoted bylaw answer", () => {
    const ok = checkContribution({ kind: "closed_area", target: "W5-049", author: "Alice Example", geometry: square, exact: true }, targets);
    expect(ok.exact).toBe(true);
    expect(() => checkContribution({ kind: "closed_area", target: "W9-999", author: "Alice", geometry: square }, targets)).toThrow(/unknown target/);
    expect(() => checkContribution({ kind: "closed_area", target: "W5-049", author: "Claude", geometry: square }, targets)).toThrow(/own name/);
    expect(() => checkContribution({ kind: "closed_area", target: "W5-049", author: "Alice", geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } }, targets)).toThrow(/British Columbia/);
    expect(() => checkContribution({ kind: "closed_area", target: "W5-049", author: "Alice", geometry: { type: "Polygon", coordinates: [[[-121.8, 49.3], [-121.79, 49.3], [-121.79, 49.31], [-121.8, 49.311]]] } }, targets)).toThrow(/close/);
    expect(() => checkContribution({ kind: "bylaw", target: "ea:SLRD Electoral Area A", author: "Alice", bylaw: { url: "https://x.ca/b.pdf", title: "Firearms", targetShooting: "prohibited", quote: "short" } }, targets)).toThrow(/own words/);
    const b = checkContribution({ kind: "bylaw", target: "ea:SLRD Electoral Area A", author: "Alice", bylaw: { url: "https://x.ca/b.pdf", title: "Firearms Bylaw", number: "12", targetShooting: "zoned", quote: "No person may discharge a firearm within the areas shown." } }, targets);
    expect(b.bylaw?.targetShooting).toBe("zoned");
  });

  it("needs a second person to confirm, and a review is written only once", async () => {
    expect(reviewerFor("sam-key-0123456789abcdef")).toBe("Sam Reviewer");
    expect(reviewerFor("tooshort")).toBeNull();
    expect(reviewerFor("wrong-key-0123456789abc")).toBeNull();
    const c = checkContribution({ kind: "closed_area", target: "W5-049", author: "Alice Example", geometry: square }, targets);
    await addContribution(c);
    expect((await listContributions({ target: "W5-049" }))[0]!.status).toBe("waiting");
    await expect(reviewContribution(c.id, "alice example", "confirmed", "")).rejects.toThrow(/second person/);
    const r = await reviewContribution(c.id, "Sam Reviewer", "confirmed", "matches the map");
    expect(r.by).toBe("Sam Reviewer");
    await expect(reviewContribution(c.id, "Sam Reviewer", "rejected", "")).rejects.toThrow(/already reviewed/);
    const [v] = await listContributions({ target: "W5-049" });
    expect(v!.status).toBe("confirmed");
    expect(v!.review?.note).toBe("matches the map");
  });

  it("moves an item between folders: sent work lifts 'not done'; only an exact confirmed shape makes it 'confirmed'", () => {
    const item = { id: "W5-065", folder: "not_done" as const, state: "Not drawn" };
    const c = (status: ContributionView["status"], exact: boolean): ContributionView => ({ id: "x", kind: "closed_area", target: "W5-065", author: "A", note: "", createdAt: "2026-10-30", exact, status });
    expect(withContributions(item, []).folder).toBe("not_done");
    expect(withContributions(item, [c("waiting", true)]).folder).toBe("not_confirmed");
    expect(withContributions(item, [c("rejected", true)]).folder).toBe("not_done");
    expect(withContributions(item, [c("confirmed", false)]).folder).toBe("not_confirmed");
    expect(withContributions(item, [c("confirmed", true)]).folder).toBe("confirmed");
  });
});
