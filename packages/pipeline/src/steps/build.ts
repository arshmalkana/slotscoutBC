import { join } from "node:path";
import { disagreements, schemaErrors } from "../lib/answers.js";
import { currentMonth } from "../lib/config.js";
import { monthDir } from "../lib/paths.js";
import { withdrawStale } from "../lib/review.js";
import { log, progress, writeJson } from "../lib/util.js";
import { buildBylaws } from "../build/bylaws.js";
import { buildClosedArea } from "../build/closedAreas.js";
import { buildNotices } from "../build/notices.js";
import { loadAnswer } from "./extract.js";
import { loadTasks } from "./queue.js";
import { loadUnits } from "./split.js";

/**
 * Step 5 (Addendum A 3-5, 10.3 step 8): quote checks, run agreement, place lookups, geometry,
 * validation and the one-way rule. Output: candidates in rules/, the road notice store, and review
 * items in review/<YYYY-MM>/items/. Never approves anything.
 */
export async function build(opts: { month?: string } = {}) {
  const month = currentMonth(opts.month);
  const units = loadUnits(month);
  const unitIds = new Set(units.map((u) => u.id));
  const tasks = loadTasks().filter((t) => t.month === month || t.unit_ids.some((id) => unitIds.has(id)));
  const summary: Record<string, unknown> = { month, builtAt: new Date().toISOString() };

  const parts = ["closed areas", "road notices and District Manager PDFs", "bylaws", "change classes"];
  progress("build", "parts", 0, parts.length, parts[0]);
  const closed: Record<string, number> = {};
  const closedTasks = tasks.filter((x) => x.kind === "closed_area" && x.month === month);
  for (const [i, t] of closedTasks.entries()) {
    const { state } = await buildClosedArea(t, month);
    closed[state] = (closed[state] ?? 0) + 1;
    progress("build", "closed areas", i + 1, closedTasks.length, `${t.title}: ${state}`);
  }
  summary.closedAreas = closed;
  progress("build", "parts", 1, parts.length, parts[1]);
  summary.roadNotices = await buildNotices(month, units, tasks);
  progress("build", "parts", 2, parts.length, parts[2]);
  summary.bylaws = buildBylaws(month, tasks);
  progress("build", "parts", 3, parts.length, parts[3]);

  // Change classes for changed wording (5.1 step 4); the closed-area build re-checks them field by field.
  const classes: Record<string, { change_type: string; agreed: boolean; reason?: string }> = {};
  for (const t of tasks.filter((x) => x.kind === "change" && x.month === month)) {
    const r1 = loadAnswer(1, t.task_id);
    const r2 = loadAnswer(2, t.task_id);
    if (!r1?.answer || !r2?.answer || schemaErrors(t.schema, r1.answer).length || schemaErrors(t.schema, r2.answer).length) continue;
    const agreed = !disagreements("change", r1.answer, r2.answer).length;
    classes[String(t.meta.unitId)] = { change_type: agreed ? String(r1.answer.change_type) : "unclear", agreed, reason: String(r1.answer.reason ?? "") };
  }
  writeJson(join(monthDir(month), "change-classes.json"), classes);
  summary.changeClasses = Object.keys(classes).length;
  const withdrawn = withdrawStale(month);
  if (withdrawn.length) log("build", `${withdrawn.length} open item(s) from an earlier build of ${month} withdrawn: their source changed or went away`);
  summary.withdrawnItems = withdrawn.length;
  writeJson(join(monthDir(month), "build-summary.json"), summary);
  progress("build", "parts", parts.length, parts.length, "build summary written");
  log("build", `done: ${JSON.stringify(summary)}`);
  return summary;
}
