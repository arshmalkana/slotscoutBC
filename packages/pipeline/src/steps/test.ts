import { spawnSync } from "node:child_process";
import { join } from "node:path";
import * as turf from "@turf/turf";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import { checkQuotes, comparable } from "../lib/answers.js";
import { config, currentMonth } from "../lib/config.js";
import { P } from "../lib/paths.js";
import { listFiles, log, readJson, readJsonIf, writeJson, writeText } from "../lib/util.js";
import { loadAnswer } from "./extract.js";
import { loadTasks } from "./queue.js";

/**
 * Step 8 (Addendum A 7, 10.3 step 12): gold-set metrics against the thresholds in config.toml,
 * and the regression set through the live engine. Stops on any false green. AI auto-publishing
 * stays off unless every gold threshold passes (reports/gold-metrics.json).
 */
interface GoldAnswer {
  unit_id: string;
  kind: string;
  answer: Record<string, unknown>;
  by: string;
  on: string;
  rule_id?: string;
}

const EFFECT_RANK: Record<string, number> = { no_shooting: 5, no_shooting_hunting_exempt: 4, no_shooting_seasonal: 3, no_rifle: 2, shot_only: 2, shot_only_seasonal: 1, non_toxic: 1, no_hunting: 0 };

export function goldMetrics() {
  const th = config().thresholds;
  const gold = listFiles(join(P.gold, "answers"), (f) => f.endsWith(".json")).map((f) => readJson<GoldAnswer>(f));
  const tasks = loadTasks();
  let fields = 0;
  let fieldHits = 0;
  let effects = 0;
  let effectHits = 0;
  let looser = 0;
  let notices = 0;
  let noticeHits = 0;
  let shapes = 0;
  let shapeHits = 0;
  const misses: string[] = [];
  for (const g of gold) {
    const t = tasks.find((x) => x.unit_ids.includes(g.unit_id) && x.kind === g.kind);
    const a = t ? loadAnswer(1, t.task_id) : null;
    if (!t || !a?.answer) {
      misses.push(`${g.unit_id}: no AI answer to compare`);
      continue;
    }
    const ai = comparable(g.kind, checkQuotes(g.kind, a.answer, t.source_text).cleaned);
    const ref = comparable(g.kind, g.answer);
    for (const k of Object.keys(ref)) {
      fields++;
      if (JSON.stringify(ai[k]) === JSON.stringify(ref[k])) fieldHits++;
      else misses.push(`${g.unit_id} ${k}: AI ${JSON.stringify(ai[k])} vs gold ${JSON.stringify(ref[k])}`);
    }
    if (g.kind === "closed_area") {
      effects++;
      if (ai.effect === ref.effect) effectHits++;
      const loosened = (EFFECT_RANK[String(ai.effect)] ?? 9) < (EFFECT_RANK[String(ref.effect)] ?? 0) || (typeof ai.buffer_m === "number" && typeof ref.buffer_m === "number" && ai.buffer_m < ref.buffer_m);
      if (loosened) looser++;
      if (g.rule_id) {
        const file = readJsonIf<{ features: Feature<Polygon | MultiPolygon, Record<string, unknown>>[] }>(join(P.rules, `${g.rule_id}.geojson`), { features: [] });
        const goldShape = file.features.find((f) => f.properties.status === "approved");
        const cand = file.features.find((f) => f.properties.status === "candidate" && f.properties.task_id === t.task_id);
        if (goldShape && cand) {
          shapes++;
          const inter = turf.intersect(turf.featureCollection([goldShape, cand]));
          if (inter && turf.area(inter) / turf.area(goldShape) >= th.shape_agreement_overlap) shapeHits++;
        }
      }
    }
    if (g.kind === "road_notice") {
      notices++;
      if (JSON.stringify(ai.points) === JSON.stringify(ref.points)) noticeHits++;
    }
  }
  const ratio = (a: number, b: number) => (b ? a / b : null);
  const m = {
    field_accuracy: ratio(fieldHits, fields),
    effect_accuracy: ratio(effectHits, effects),
    shape_agreement_share: ratio(shapeHits, shapes),
    looser_errors: looser,
    notice_status_accuracy: ratio(noticeHits, notices),
  };
  const pass =
    gold.length > 0 &&
    m.field_accuracy !== null &&
    m.field_accuracy >= th.field_accuracy &&
    m.effect_accuracy !== null &&
    m.effect_accuracy >= th.effect_accuracy &&
    m.shape_agreement_share !== null &&
    m.shape_agreement_share >= th.shape_agreement_share &&
    m.looser_errors <= th.looser_errors &&
    m.notice_status_accuracy !== null &&
    m.notice_status_accuracy >= th.notice_status_accuracy;
  const result = {
    measuredAt: new Date().toISOString(),
    goldItems: gold.length,
    counts: { fields, effects, shapes, notices },
    metrics: m,
    thresholds: th,
    passes: pass,
    autopublishAllowed: pass && config().ai.autopublish,
    note: gold.length
      ? pass
        ? "Every threshold passes."
        : "At least one threshold is not met or not measured: AI output only pre-fills a person's work."
      : "No gold set yet. Region 2 must be digitised by hand first (Addendum A 7.1); until then AI output only pre-fills a person's work and nothing is auto-published.",
    misses: misses.slice(0, 200),
  };
  writeJson(join(P.reports, "gold-metrics.json"), result);
  return result;
}

export function test(opts: { month?: string; regression?: boolean } = {}) {
  const month = currentMonth(opts.month);
  const gold = goldMetrics();
  let regression: { ran: boolean; exitCode: number | null; output: string } = { ran: false, exitCode: null, output: "" };
  if (opts.regression !== false) {
    const r = spawnSync("npx", ["tsx", "scripts/regression.ts"], { cwd: P.root, encoding: "utf8", timeout: 20 * 60_000, env: process.env });
    regression = { ran: true, exitCode: r.status, output: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim() };
  }
  const falseGreen = /false green/i.test(regression.output) && regression.exitCode !== 0;
  const failed = regression.ran && regression.exitCode !== 0;
  const L = [
    `# Test report ${month}`,
    "",
    `Run ${new Date().toISOString()}.`,
    "",
    "## Gold set (Addendum A 7.1, 7.2)",
    "",
    gold.note,
    "",
    "| Measure | Value | Required |",
    "| --- | --- | --- |",
    `| Field accuracy | ${gold.metrics.field_accuracy ?? "not measured"} | ${gold.thresholds.field_accuracy} |`,
    `| Shape agreement (share overlapping ≥ ${gold.thresholds.shape_agreement_overlap}) | ${gold.metrics.shape_agreement_share ?? "not measured"} | ${gold.thresholds.shape_agreement_share} |`,
    `| Effect accuracy | ${gold.metrics.effect_accuracy ?? "not measured"} | ${gold.thresholds.effect_accuracy} |`,
    `| Looser-direction errors | ${gold.goldItems ? gold.metrics.looser_errors : "not measured"} | ${gold.thresholds.looser_errors} |`,
    `| Road notice status | ${gold.metrics.notice_status_accuracy ?? "not measured"} | ${gold.thresholds.notice_status_accuracy} |`,
    "",
    `AI auto-publishing: **${gold.autopublishAllowed ? "allowed" : "off"}** (config ai.autopublish = ${config().ai.autopublish}).`,
    "",
    "## Regression set (main spec 11.1, 11.2)",
    "",
    regression.ran ? (failed ? `**FAILED** (exit ${regression.exitCode})${falseGreen ? ": a false green appeared. Stop: nothing is released until it is fixed without loosening any rule." : "."}` : "Passed: no false greens.") : "Not run (--no-regression).",
    "",
    "```",
    regression.output.slice(-12000),
    "```",
    "",
    "Unit tests run before this step (`make test` runs `vitest run` first).",
    "",
  ];
  writeText(join(P.reports, `${month}-test.md`), L.join("\n"));
  writeJson(join(P.reports, `${month}-test.json`), { month, at: new Date().toISOString(), gold: { passes: gold.passes, goldItems: gold.goldItems, metrics: gold.metrics }, regression: { ran: regression.ran, exitCode: regression.exitCode, falseGreen, passed: regression.ran && !failed } });
  log("test", `gold set: ${gold.goldItems} item(s), ${gold.passes ? "passes" : "not passing"}; regression: ${regression.ran ? (failed ? "FAILED" : "passed") : "not run"}`);
  return { exitCode: failed ? 1 : 0 };
}
