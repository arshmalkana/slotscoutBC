import { existsSync, readFileSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { config, currentMonth, extractorMode, loadEnv, type Mode } from "../lib/config.js";
import { P } from "../lib/paths.js";
import { listFiles, log, readJsonIf, rel, writeJson, writeText } from "../lib/util.js";
import { loadTasks, type Task } from "./queue.js";

/**
 * Step 4 (Addendum A 7.5, 10.1): two independent extractions per task. All three modes read the
 * same queue, use the same prompt and schema, and write the same answer files, each recording the
 * mode and model that produced it.
 *
 * - api: calls the Claude API twice per task (fresh requests; the second never sees the first).
 * - agent: writes queue/AGENT_TASKS.md for Claude Code (run 1) and one self-contained brief per
 *   task for a fresh subagent (run 2) holding only the prompt, schema and source text.
 * - manual: the same work list, for a person.
 */
export interface Answer {
  task_id: string;
  run: 1 | 2;
  mode: Mode;
  model: string;
  prompt_version: string;
  schema_id: string;
  produced_at: string;
  answer: Record<string, unknown> | null;
  stop_reason?: string | null;
  fallback?: { from: string; to: string } | null;
  error?: string;
}

export const answerPath = (run: 1 | 2, taskId: string) => join(P.answers(run), `${taskId}.json`);
export const loadAnswer = (run: 1 | 2, taskId: string) => readJsonIf<Answer | null>(answerPath(run, taskId), null);

export function promptText(id: string): string {
  return readFileSync(join(P.prompts, `${id}.md`), "utf8");
}

export function schemaFor(id: string): Record<string, unknown> {
  const s = JSON.parse(readFileSync(join(P.schema, `${id}.json`), "utf8")) as Record<string, unknown>;
  const { $schema: _a, $id: _b, title: _c, ...rest } = s;
  return rest;
}

/** The only user content a model ever sees: the public source text (Addendum A 7.5). */
export function userMessage(t: Task): string {
  return `Source: ${t.title}${t.source.version ? ` (${t.source.version})` : ""}\n\n<source_text>\n${t.source_text}\n</source_text>\n\nReturn the JSON for this text.`;
}

async function runApi(client: Anthropic, t: Task, run: 1 | 2): Promise<Answer> {
  const ai = config().ai;
  const base: Omit<Answer, "answer" | "model"> = { task_id: t.task_id, run, mode: "api", prompt_version: t.prompt, schema_id: t.schema, produced_at: new Date().toISOString() };
  try {
    const stream = client.beta.messages.stream({
      model: ai.model,
      max_tokens: ai.max_tokens,
      system: promptText(t.prompt),
      messages: [{ role: "user", content: userMessage(t) }],
      output_config: { effort: ai.effort, format: { type: "json_schema", schema: schemaFor(t.schema) } },
      ...(ai.server_side_fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    const msg = await stream.finalMessage();
    const fb = msg.content.find((b) => (b as { type: string }).type === "fallback") as { from?: { model: string }; to?: { model: string } } | undefined;
    if (msg.stop_reason === "refusal") return { ...base, model: msg.model, answer: null, stop_reason: msg.stop_reason, fallback: fb ? { from: fb.from!.model, to: fb.to!.model } : null, error: "the model declined this text" };
    if (msg.stop_reason === "max_tokens") return { ...base, model: msg.model, answer: null, stop_reason: msg.stop_reason, error: "answer was cut off at max_tokens" };
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    return { ...base, model: msg.model, answer: JSON.parse(text) as Record<string, unknown>, stop_reason: msg.stop_reason, fallback: fb ? { from: fb.from!.model, to: fb.to!.model } : null };
  } catch (e) {
    return { ...base, model: ai.model, answer: null, error: (e as Error).message };
  }
}

function agentBrief(t: Task, run: 1 | 2): string {
  return [
    `# Extraction task ${t.task_id} (run ${run})`,
    "",
    `Write your answer to \`queue/answers/run${run}/${t.task_id}.json\` as:`,
    "",
    "```json",
    `{ "task_id": "${t.task_id}", "run": ${run}, "mode": "agent", "model": "<your model id> (Claude Code${run === 2 ? " subagent" : ""})", "prompt_version": "${t.prompt}", "schema_id": "${t.schema}", "produced_at": "<ISO time>", "answer": { ...matching schema/${t.schema}.json... } }`,
    "```",
    "",
    `The answer must match \`schema/${t.schema}.json\` exactly. Use only the source text below. Never write coordinates. Every filled field needs its exact quote.`,
    "",
    "## Instructions",
    "",
    promptText(t.prompt),
    "",
    "## Schema",
    "",
    "```json",
    JSON.stringify(schemaFor(t.schema), null, 1),
    "```",
    "",
    "## Source",
    "",
    userMessage(t),
    "",
  ].join("\n");
}

export async function extract(opts: { month?: string; only?: string[]; force?: boolean } = {}) {
  currentMonth(opts.month);
  loadEnv();
  const mode = extractorMode();
  const runs = config().ai.runs as 1 | 2;
  const tasks = loadTasks().filter((t) => !opts.only?.length || opts.only.some((o) => t.task_id.startsWith(o) || t.kind === o));
  const missing = (run: 1 | 2) => tasks.filter((t) => opts.force || !existsSync(answerPath(run, t.task_id)));

  if (mode === "api") {
    const client = new Anthropic();
    let done = 0;
    for (const run of [1, 2] as const) {
      if (run > runs) break;
      for (const t of missing(run)) {
        const a = await runApi(client, t, run);
        writeJson(answerPath(run, t.task_id), a);
        done++;
        log("extract", `${t.task_id} run ${run}: ${a.answer ? "ok" : `no answer (${a.error})`}${a.fallback ? ` [served by fallback ${a.fallback.to}]` : ""}`);
      }
    }
    log("extract", `api mode: ${done} answer file(s) written`);
    return { mode, written: done };
  }

  // agent and manual: write the work lists and stop. Claude Code (or a person) fills the answers.
  const need1 = missing(1);
  const need2 = runs >= 2 ? missing(2) : [];
  // Briefs for tasks no longer queued (superseded) are removed so nobody answers them.
  const live = new Set(loadTasks().map((t) => t.task_id));
  for (const run of ["run1", "run2"]) for (const f of listFiles(join(P.queue, "agent", run), (x) => x.endsWith(".md"))) if (!live.has(basename(f, ".md"))) rmSync(f);
  for (const t of need1) writeText(join(P.queue, "agent", "run1", `${t.task_id}.md`), agentBrief(t, 1));
  for (const t of need2) writeText(join(P.queue, "agent", "run2", `${t.task_id}.md`), agentBrief(t, 2));
  const L = [
    `# ${mode === "agent" ? "Agent" : "Manual"}-mode extraction work list`,
    "",
    `Generated ${new Date().toISOString()} by \`make extract\` (mode: ${mode}; no ANTHROPIC_API_KEY in .env${mode === "manual" ? ", manual set in config.toml" : ""}).`,
    "",
    mode === "agent"
      ? "Run 1: Claude Code reads each brief in `queue/agent/run1/` and writes the answer file it names. Run 2: for each brief in `queue/agent/run2/`, start a fresh subagent and give it only that brief (it holds the prompt, schema and source text, never the run-1 answer); it replies with file paths only, so nothing of run 2 reaches run 1. Then run `make build`."
      : "A person fills each answer file named in the briefs, using only the brief. Then run `make build`.",
    "",
    `Run 1 still needed: ${need1.length}. Run 2 still needed: ${need2.length}.`,
    "",
    "| Task | Kind | Title | Run 1 | Run 2 |",
    "| --- | --- | --- | --- | --- |",
    ...tasks.map((t) => `| ${t.task_id} | ${t.kind} | ${t.title.replace(/\|/g, "/").slice(0, 90)} | ${existsSync(answerPath(1, t.task_id)) ? "done" : `[brief](agent/run1/${t.task_id}.md)`} | ${existsSync(answerPath(2, t.task_id)) ? "done" : `[brief](agent/run2/${t.task_id}.md)`} |`),
    "",
  ];
  writeText(join(P.queue, "AGENT_TASKS.md"), L.join("\n"));
  log("extract", `${mode} mode: ${need1.length} run-1 and ${need2.length} run-2 answers needed; see ${rel(join(P.queue, "AGENT_TASKS.md"))}`);
  return { mode, need1: need1.length, need2: need2.length };
}
