import { rmSync } from "node:fs";
import { join } from "node:path";
import { config, currentMonth } from "../lib/config.js";
import { P } from "../lib/paths.js";
import { parseClosedArea } from "../lib/ruleparse.js";
import { ruleIdFor, type Unit } from "../lib/units.js";
import { listFiles, log, readJsonIf, sha256, writeJson } from "../lib/util.js";
import { EFFECT_BY_RULE } from "../lib/effects.js";
import type { UnitChange } from "./split.js";
import { loadUnits } from "./split.js";
import { monthDir } from "../lib/paths.js";

/**
 * Step 3 (Addendum A 3, 10.3 steps 6-7): rule-based parsing first; everything free-form, and
 * every permanent boundary (as a cross-check), becomes a task in queue/pending/. Tasks hold only
 * public source text: never user data (Addendum A 7.5).
 */
export type TaskKind = "closed_area" | "road_notice" | "bylaw" | "change";

export interface Task {
  task_id: string;
  kind: TaskKind;
  schema: string;
  prompt: string;
  month: string;
  unit_ids: string[];
  unit_hash: string;
  title: string;
  source: { url: string | null; version: string; file: string; confirmed: boolean };
  source_text: string;
  created: string;
  meta: Record<string, unknown>;
}

const BYLAW_MAX_CHARS = 90_000;

export function taskPath(id: string): string {
  return join(P.pending, `${id}.json`);
}

export function loadTasks(): Task[] {
  return listFiles(P.pending, (f) => f.endsWith(".json")).map((f) => readJsonIf<Task>(f, null as unknown as Task)).filter(Boolean);
}

function makeTask(month: string, kind: TaskKind, units: Unit[], text: string, title: string, meta: Record<string, unknown> = {}): Task {
  const prompts = config().ai.prompts as Record<string, string>;
  const hash = sha256(units.map((u) => `${u.id}:${u.hash}`).join("|") + kind);
  return {
    task_id: `${kind}-${hash.slice(0, 12)}`,
    kind,
    schema: prompts[kind]!,
    prompt: prompts[kind]!,
    month,
    unit_ids: units.map((u) => u.id),
    unit_hash: hash,
    title,
    source: { url: units[0]!.url, version: units[0]!.version, file: units[0]!.file, confirmed: units.every((u) => u.confirmed) },
    source_text: text,
    created: new Date().toISOString(),
    meta,
  };
}

export function queue(opts: { month?: string } = {}) {
  const month = currentMonth(opts.month);
  const units = loadUnits(month);
  const { changes } = readJsonIf<{ changes: UnitChange[] }>(join(monthDir(month), "changes.json"), { changes: [] });
  const status = new Map(changes.map((c) => [c.id, c]));
  const work = units.filter((u) => ["new", "changed"].includes(status.get(u.id)?.status ?? "new"));
  const tasks: Task[] = [];
  let ruleParsed = 0;

  for (const u of work.filter((x) => x.kind === "regulation_section")) {
    const ruleId = (u.meta.ruleId as string | null) ?? ruleIdFor(String(u.meta.schedule), String(u.meta.section));
    const effect = ruleId ? EFFECT_BY_RULE[ruleId.split("-")[0]!] ?? null : null;
    const rule = parseClosedArea(u.text, effect);
    const t = makeTask(month, "closed_area", [u], u.text, u.title, { ruleId, schedule: u.meta.schedule, section: u.meta.section, scheduleEffect: effect });
    if (rule) {
      ruleParsed++;
      const rulePath = join(P.queue, "rule", `${t.task_id}.json`);
      const prevRule = readJsonIf<{ answer: unknown } | null>(rulePath, null);
      if (JSON.stringify(prevRule?.answer) !== JSON.stringify(rule)) writeJson(rulePath, { task_id: t.task_id, mode: "rule", parser: "ruleparse.v1", produced_at: new Date().toISOString(), answer: rule });
    }
    tasks.push(t);
  }

  for (const u of work.filter((x) => x.kind === "road_notice")) {
    const n = u.meta.notice as { needsAi?: boolean; points?: unknown[] };
    if (n.needsAi) tasks.push(makeTask(month, "road_notice", [u], u.text, u.title, { org: u.meta.org, noticeId: u.id.replace(/^notice:/, "") }));
    else ruleParsed++;
  }
  for (const u of work.filter((x) => x.kind === "dm_notice")) {
    tasks.push(makeTask(month, "road_notice", [u], u.text.slice(0, 30_000), u.title, { org: u.meta.org, pdf: u.url }));
  }

  // Bylaws: one task per document when any clause is new or changed (5.3).
  const byDoc = new Map<string, Unit[]>();
  for (const u of units.filter((x) => x.kind === "bylaw_clause")) byDoc.set(String(u.meta.doc), [...(byDoc.get(String(u.meta.doc)) ?? []), u]);
  for (const [doc, us] of byDoc) {
    if (!us.some((u) => work.includes(u))) continue;
    const text = us.map((u) => u.text).join("\n");
    const parts = Math.ceil(text.length / BYLAW_MAX_CHARS);
    for (let i = 0; i < parts; i++) {
      tasks.push(makeTask(month, "bylaw", us, text.slice(i * BYLAW_MAX_CHARS, (i + 1) * BYLAW_MAX_CHARS), `${us[0]!.title}${parts > 1 ? ` (part ${i + 1} of ${parts})` : ""}`, { doc, jurisdiction: us[0]!.meta.jurisdiction, part: i + 1, parts }));
    }
  }

  // Changed wording: classify the change (5.1 step 4).
  const prevUnits = new Map<string, Unit>();
  for (const c of changes.filter((x) => x.status === "changed")) {
    const u = units.find((x) => x.id === c.id)!;
    if (!prevUnits.size) {
      const prevMonth = (readJsonIf<{ comparedWith: string | null }>(join(monthDir(month), "changes.json"), { comparedWith: null })).comparedWith;
      if (prevMonth) for (const p of loadUnits(prevMonth)) prevUnits.set(p.id, p);
    }
    const old = prevUnits.get(c.id);
    if (!old) continue;
    tasks.push(makeTask(month, "change", [u], `OLD WORDING:\n${old.text}\n\nNEW WORDING:\n${u.text}`, `Change: ${u.title}`, { unitId: u.id, oldHash: old.hash }));
  }

  // Tasks for this month whose units have since changed are moved out of the queue; their answers stay.
  const keep = new Set(tasks.map((t) => t.task_id));
  let superseded = 0;
  for (const old of loadTasks().filter((t) => t.month === month && !keep.has(t.task_id))) {
    writeJson(join(P.queue, "superseded", `${old.task_id}.json`), { ...old, superseded_on: new Date().toISOString(), reason: "the unit's text changed or it is no longer queued (re-split)" });
    rmSync(taskPath(old.task_id));
    superseded++;
  }
  if (superseded) log("queue", `${superseded} task(s) moved to queue/superseded because their units changed`);

  let created = 0;
  for (const t of tasks) {
    const existing = readJsonIf<Task | null>(taskPath(t.task_id), null);
    if (existing) continue;
    writeJson(taskPath(t.task_id), t);
    created++;
  }
  log("queue", `${work.length} new or changed units; ${ruleParsed} read by rules; ${tasks.length} AI tasks (${created} new in queue/pending)`);
  return { tasks, created };
}
