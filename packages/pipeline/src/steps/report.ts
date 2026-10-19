import { existsSync } from "node:fs";
import { join } from "node:path";
import { config, currentMonth, extractorMode } from "../lib/config.js";
import { manifestPath, type Manifest } from "../lib/manifest.js";
import { P, monthDir } from "../lib/paths.js";
import { allItems, loadItems } from "../lib/review.js";
import { listFiles, log, readJsonIf, writeJson, writeText } from "../lib/util.js";
import { answerPath } from "./extract.js";
import { loadTasks } from "./queue.js";
import type { UnitChange } from "./split.js";

/**
 * Step 9 (Addendum A 10.5 step 6): the monthly report (changes, test results, open review items,
 * failed sources and the sign-off checklist) and reports/status.json, which the site shows on its
 * Sources page.
 */
export function pipelineStatus(month: string) {
  const m = readJsonIf<Manifest | null>(manifestPath(month), null);
  const changes = readJsonIf<{ changes: UnitChange[]; comparedWith: string | null }>(join(monthDir(month), "changes.json"), { changes: [], comparedWith: null });
  const tasks = loadTasks().filter((t) => t.month === month);
  const waiting = tasks.filter((t) => !existsSync(answerPath(1, t.task_id)) || !existsSync(answerPath(2, t.task_id)));
  const items = loadItems(month);
  const openAll = allItems().filter((i) => i.status === "open");
  const test = readJsonIf<{ regression: { ran: boolean; passed: boolean; falseGreen: boolean } } | null>(join(P.reports, `${month}-test.json`), null);
  const gold = readJsonIf<{ passes: boolean; goldItems: number } | null>(join(P.reports, "gold-metrics.json"), null);
  const rules = listFiles(P.rules, (f) => f.endsWith(".geojson")).flatMap((f) => readJsonIf<{ features: { properties: { status?: string; reviewed_by?: string | null } }[] }>(f, { features: [] }).features);
  const count = (s: string) => rules.filter((f) => (f.properties.status ?? (f.properties.reviewed_by ? "approved" : "candidate")) === s).length;
  const release = readJsonIf<{ id: string; publishable: boolean; missing: string[] } | null>(join(P.releases, month, "release.json"), null);
  const status = {
    month,
    updatedAt: new Date().toISOString(),
    extractor: extractorMode(),
    autopublish: { configured: config().ai.autopublish, goldPasses: gold?.passes ?? false, goldItems: gold?.goldItems ?? 0 },
    pull: m
      ? {
          startedAt: m.startedAt,
          updatedAt: m.updatedAt,
          sources: Object.fromEntries(Object.entries(m.sources).map(([k, v]) => [k, { status: v.status, detail: v.detail }])),
          layers: Object.keys(m.layers).length,
          layersMatching: Object.values(m.layers).filter((l) => l.countMatches).length,
          failures: m.failures.map((f) => ({ source: f.source, what: f.what, error: f.error })),
        }
      : null,
    changes: {
      comparedWith: changes.comparedWith,
      new: changes.changes.filter((c) => c.status === "new").length,
      changed: changes.changes.filter((c) => c.status === "changed").length,
      removed: changes.changes.filter((c) => c.status === "removed").length,
      unchanged: changes.changes.filter((c) => c.status === "unchanged").length,
    },
    extraction: { tasks: tasks.length, waiting: waiting.length },
    rules: { approved: count("approved"), provisional: count("provisional"), candidates: count("candidate"), retired: count("retired") },
    review: { thisMonth: items.length, open: items.filter((i) => i.status === "open").length, openAllMonths: openAll.length, looserOpen: openAll.filter((i) => i.change_type === "looser").length },
    tests: test ? { regressionRan: test.regression.ran, regressionPassed: test.regression.passed, falseGreen: test.regression.falseGreen } : null,
    release: release ? { id: release.id, publishable: release.publishable, missing: release.missing } : null,
  };
  writeJson(join(P.reports, "status.json"), status);
  return status;
}

export function report(opts: { month?: string } = {}) {
  const month = currentMonth(opts.month);
  const s = pipelineStatus(month);
  const m = readJsonIf<Manifest | null>(manifestPath(month), null);
  const items = loadItems(month);
  const open = items.filter((i) => i.status === "open");
  const kinds = [...new Set(open.map((i) => i.kind))];
  const L = [
    `# Monthly report ${month}`,
    "",
    `Written ${s.updatedAt}. Extraction mode: **${s.extractor}**. AI auto-publishing: **${s.autopublish.configured && s.autopublish.goldPasses ? "on" : "off"}** (gold set: ${s.autopublish.goldItems} item(s), ${s.autopublish.goldPasses ? "passing" : "not passing yet"}).`,
    "",
    "## Sources",
    "",
    "| Source | Status | Detail |",
    "| --- | --- | --- |",
    ...Object.entries(s.pull?.sources ?? {}).sort().map(([k, v]) => `| ${k} | ${v.status === "ok" ? "ok" : `**${v.status}**`} | ${v.detail.replace(/\|/g, "/")} |`),
    "",
    `GIS layers: ${s.pull?.layersMatching ?? 0} of ${s.pull?.layers ?? 0} pulled in full with counts matching the server.`,
    "",
    "## Changes",
    "",
    s.changes.comparedWith ? `Compared with ${s.changes.comparedWith}: ${s.changes.new} new, ${s.changes.changed} changed, ${s.changes.removed} removed, ${s.changes.unchanged} unchanged units. Details: \`reports/${month}-changes.md\`.` : `First pull (baseline): ${s.changes.new} units. Details: \`reports/${month}-changes.md\`.`,
    "",
    "## Extraction and rules",
    "",
    `${s.extraction.tasks} extraction task(s) this month; ${s.extraction.waiting} still waiting for both runs${s.extractor !== "api" ? " (see `queue/AGENT_TASKS.md`)" : ""}.`,
    `Rule features: ${s.rules.approved} approved, ${s.rules.provisional} provisional, ${s.rules.candidates} candidate(s) waiting for a person, ${s.rules.retired} retired.`,
    "",
    "## Tests",
    "",
    s.tests ? (s.tests.regressionRan ? (s.tests.regressionPassed ? "Regression set passed: no false greens." : `**Regression set failed${s.tests.falseGreen ? " with a false green" : ""}.** Nothing is released until it is fixed.`) : "Regression set not run.") : "Not run yet.",
    `Details: \`reports/${month}-test.md\`.`,
    "",
    "## Open review items",
    "",
    open.length ? `${open.length} open (${kinds.map((k) => `${open.filter((i) => i.kind === k).length} ${k.replace(/_/g, " ")}`).join(", ")}). Packet: \`review/${month}/index.html\`.` : "None.",
    ...(s.review.looserOpen ? ["", `${s.review.looserOpen} looser change(s) wait for a person; the live map keeps the older, stricter version until then.`] : []),
    "",
    "## Failed or missing sources",
    "",
    ...(m?.failures.length ? m.failures.map((f) => `- **${f.source}** ${f.what}: ${f.error}`) : ["None."]),
    "",
    "## Sign-off checklist (people only)",
    "",
    `- [ ] Review packet \`review/${month}/index.html\` checked; each item approved or rejected with \`make approve ITEM=<id> BY=<initials>\``,
    "- [ ] Every looser change checked against its source (District Manager notice, consolidation or bylaw)",
    "- [ ] BC Laws: current copies saved in `inbox/bclaws/` (until the King's Printer confirms API use in writing)",
    `- [ ] Regression set passed (\`reports/${month}-test.md\`)`,
    `- [ ] Legal reviewer sign-off: \`make signoff BY=<name> MONTH=${month}\``,
    `- [ ] \`make release MONTH=${month}\` builds the release only after all of the above`,
    "",
  ];
  writeText(join(P.reports, `${month}-monthly.md`), L.join("\n"));
  log("report", `reports/${month}-monthly.md and reports/status.json written`);
  return s;
}
