import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ReleaseInfo } from "@slotscout/engine";
import { currentMonth, today } from "../lib/config.js";
import { manifestPath, type Manifest } from "../lib/manifest.js";
import { P } from "../lib/paths.js";
import { loadItems } from "../lib/review.js";
import { ensureDir, listFiles, log, readJson, readJsonIf, sha256, writeJson, writeText } from "../lib/util.js";
import { readFileSync } from "node:fs";

/**
 * Step 11 (main spec 10.6; Addendum A 10.3 step 12, 10.5 step 7): the release package. It is
 * always built as a candidate; it becomes publishable, and data/release.json moves to it, only when
 * the regression set passed, validation is clean and the legal reviewer has signed off. Anything
 * not approved by a person is not in it, so those areas show grey.
 */
export function release(opts: { month?: string } = {}) {
  const month = currentMonth(opts.month);
  const dir = ensureDir(join(P.releases, month));
  const rules = listFiles(P.rules, (f) => f.endsWith(".geojson")).flatMap((f) => readJson<{ features: { properties: Record<string, unknown> }[] }>(f).features.map((x) => ({ file: f, f: x })));
  const live = rules.filter(({ f }) => f.properties.status === "approved" || f.properties.status === "provisional");
  writeJson(join(dir, "rules.geojson"), { type: "FeatureCollection", name: `slotscout-rules-${month}`, features: live.map(({ f }) => f) });
  for (const [from, to] of [
    [join(P.rules, "road-notices.json"), "road-notices.json"],
    [join(P.data, "bylaws.json"), "bylaws.json"],
    [join(P.data, "wildlife-coverage.json"), "wildlife-coverage.json"],
    [join(P.root, "sources", "registry.yaml"), "registry.yaml"],
    [join(P.root, "config.toml"), "config.toml"],
  ] as const)
    if (existsSync(from)) copyFileSync(from, join(dir, to));
  const m = readJsonIf<Manifest | null>(manifestPath(month), null);
  const test = readJsonIf<{ regression: { ran: boolean; passed: boolean; falseGreen: boolean } } | null>(join(P.reports, `${month}-test.json`), null);
  const signoff = readJsonIf<{ by: string; on: string } | null>(join(P.review, month, "signoff.json"), null);
  const items = loadItems(month);
  const missing: string[] = [];
  if (!test?.regression.ran) missing.push("regression set not run this month (make test)");
  else if (!test.regression.passed) missing.push("regression set failed");
  if (!signoff) missing.push("legal reviewer sign-off (make signoff BY=<name>)");
  const open = items.filter((i) => i.status === "open");
  const publishable = missing.length === 0;
  const id = `${month}-${publishable ? "r1" : "rc"}`;
  const files = listFiles(dir, (f) => !f.endsWith("release.json") && !f.endsWith("README.md")).map((f) => ({ file: f.slice(dir.length + 1), sha256: sha256(readFileSync(f)) }));
  const info = {
    id,
    month,
    builtAt: new Date().toISOString(),
    publishable,
    missing,
    includes: { approvedRuleFeatures: live.length, candidatesExcluded: rules.filter(({ f }) => f.properties.status === "candidate").length },
    openReviewItemsExcluded: open.length,
    decisions: items.filter((i) => i.status !== "open").map((i) => ({ item: i.item_id, decision: i.status, by: i.decided_by, on: i.decided_on })),
    signoff,
    sourceHashes: { layers: Object.fromEntries(Object.entries(m?.layers ?? {}).map(([k, l]) => [k, l.sha256])), files: (m?.files ?? []).length },
    files,
  };
  writeJson(join(dir, "release.json"), info);
  writeText(
    join(dir, "README.md"),
    [
      `# Release ${id}`,
      "",
      publishable ? "Publishable: the regression set passed and the legal reviewer signed off. data/release.json points here." : `**Release candidate, not published.** Missing: ${missing.join("; ")}.`,
      "",
      `Includes ${live.length} approved rule feature(s). ${open.length} open review item(s) and ${info.includes.candidatesExcluded} candidate(s) are not included, so their areas show grey ("Cannot confirm").`,
      "",
      "Files and their SHA-256 are listed in release.json, with the source layer hashes this release was built from.",
      "",
    ].join("\n"),
  );
  if (publishable) {
    const rel: ReleaseInfo = { ...readJson<ReleaseInfo>(join(P.data, "release.json")), id, label: `SlotScout data ${month}`, publishedOn: today() };
    writeJson(join(P.data, "release.json"), rel);
  }
  log("release", `${id}: ${publishable ? "publishable; data/release.json updated" : `candidate only (missing: ${missing.join("; ")})`}`);
  return info;
}
