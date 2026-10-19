import { join } from "node:path";
import type { BylawEntry } from "@slotscout/engine";
import { checkQuotes, disagreements, schemaErrors } from "../lib/answers.js";
import { today } from "../lib/config.js";
import { P } from "../lib/paths.js";
import { itemId, upsertItem } from "../lib/review.js";
import { log, readJson, writeJson } from "../lib/util.js";
import type { BylawSite } from "../steps/bylaws.js";
import { loadAnswer } from "../steps/extract.js";
import type { Task } from "../steps/queue.js";

/**
 * Bylaw rule lists (Addendum A 5.3): the extracted definitions, prohibitions, exceptions,
 * distance rules and schedule maps per bylaw, kept as a candidate in rules/bylaws/ until a person
 * checks every rule against the bylaw. The register entry moves to "in progress" (still grey); only
 * a person's approval marks it reviewed.
 */
const slug = (s: string) => s.replace(/^[a-z]+:/, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

export function buildBylaws(month: string, tasks: Task[]): { docs: number; agreed: number } {
  const sites = readJson<{ sites: BylawSite[] }>(join(P.data, "bylaw-sites.json")).sites;
  const reg = readJson<{ entries: BylawEntry[] } & Record<string, unknown>>(join(P.data, "bylaws.json"));
  const byDoc = new Map<string, Task[]>();
  for (const t of tasks.filter((x) => x.kind === "bylaw")) byDoc.set(String(t.meta.doc), [...(byDoc.get(String(t.meta.doc)) ?? []), t]);
  let agreedDocs = 0;
  let touchedRegister = false;
  for (const [doc, parts] of byDoc) {
    const jurisdiction = String(parts[0]!.meta.jurisdiction);
    const site = sites.find((s) => s.key === jurisdiction);
    const results = parts.map((t) => {
      const r1 = loadAnswer(1, t.task_id);
      const r2 = loadAnswer(2, t.task_id);
      if (!r1?.answer || !r2?.answer) return { task_id: t.task_id, state: "waiting for extraction" as const };
      const e = [...schemaErrors(t.schema, r1.answer), ...schemaErrors(t.schema, r2.answer)];
      if (e.length) return { task_id: t.task_id, state: "rejected" as const, errors: e, r1, r2 };
      const q1 = checkQuotes("bylaw", r1.answer, t.source_text);
      const q2 = checkQuotes("bylaw", r2.answer, t.source_text);
      const dis = disagreements("bylaw", q1.cleaned, q2.cleaned);
      return { task_id: t.task_id, state: dis.length ? ("disagree" as const) : ("agreed" as const), answer: q1.cleaned, rejected: [...new Set([...q1.rejected, ...q2.rejected])], disagreements: dis, r1, r2 };
    });
    if (results.some((r) => r.state === "waiting for extraction")) continue;
    const agreed = results.every((r) => r.state === "agreed");
    if (agreed) agreedDocs++;
    const covers = site ? [...site.covers, ...reg.entries.filter((e) => site.coversElectoralAreasOf && e.kind === "electoral_area" && e.regionalDistrict === site.coversElectoralAreasOf).map((e) => e.key)] : [jurisdiction];
    const first = results.find((r) => "answer" in r && r.answer) as { answer: Record<string, any> } | undefined;
    const title = first?.answer?.bylaw?.title ?? parts[0]!.title;
    const number = first?.answer?.bylaw?.number ?? null;
    writeJson(join(P.rules, "bylaws", `${slug(jurisdiction)}--${doc.split(":").pop()}.json`), {
      jurisdiction,
      covers,
      doc,
      title,
      number,
      url: parts[0]!.source.url,
      source_version: parts[0]!.source.version,
      status: "candidate",
      run_agreement: agreed,
      extracted_on: today(),
      parts: results.map((r) => ({ task_id: r.task_id, state: r.state, ...("answer" in r ? { answer: r.answer, rejected_quotes: r.rejected, disagreements: r.disagreements } : {}), ...("errors" in r ? { errors: r.errors } : {}) })),
    });
    upsertItem({
      item_id: itemId("bylaw", doc),
      month,
      kind: "bylaw",
      title: `${site?.name ?? jurisdiction}: ${title}${number ? ` (Bylaw ${number})` : ""}`,
      change_type: "new_source",
      decision: "Check every extracted rule against the bylaw before first use (Addendum A 5.3). Zone maps are traced by hand. Approving marks the register entry reviewed today.",
      why: [
        "a person checks every extracted bylaw rule before first use",
        ...results.flatMap((r) => ("disagreements" in r && r.disagreements?.length ? [`part ${r.task_id}: AI runs disagree: ${r.disagreements.join("; ")}`] : [])),
        ...results.flatMap((r) => ("rejected" in r && r.rejected?.length ? [`part ${r.task_id}: quotes not found verbatim, dropped: ${r.rejected.slice(0, 8).join(", ")}${r.rejected.length > 8 ? " …" : ""}`] : [])),
        ...results.flatMap((r) => ("errors" in r ? [`part ${r.task_id}: answer rejected by the schema: ${r.errors!.slice(0, 3).join("; ")}`] : [])),
      ],
      source: { text: parts.map((p) => p.source_text).join("\n").slice(0, 12000), url: parts[0]!.source.url, version: parts[0]!.source.version, confirmed: true, file: parts[0]!.source.file },
      runs: { run1: results.map((r) => ("r1" in r ? r.r1 : null)), run2: results.map((r) => ("r2" in r ? r.r2 : null)) },
      links: parts[0]!.source.url ? [{ label: "Bylaw document", href: parts[0]!.source.url }] : [],
    });
    for (const key of covers) {
      const e = reg.entries.find((x) => x.key === key);
      if (!e || e.status === "reviewed" || e.status === "not_applicable") continue;
      e.status = "in_progress";
      e.bylaw = { ...(e.bylaw ?? {}), title: e.bylaw?.title ?? title, number: e.bylaw?.number ?? number ?? undefined, url: parts[0]!.source.url ?? e.bylaw?.url } as BylawEntry["bylaw"];
      const note = `Bylaw document found by the pipeline ${today()}; extracted rules wait for a person (review ${month}).`;
      e.notes = e.notes?.includes("found by the pipeline") ? e.notes.replace(/Bylaw document found by the pipeline[^.]*\.[^.]*\)\./, note) : [e.notes, note].filter(Boolean).join(" ");
      touchedRegister = true;
    }
  }
  if (touchedRegister) writeJson(join(P.data, "bylaws.json"), reg);
  log("build", `bylaws: ${byDoc.size} document(s), ${agreedDocs} with agreeing runs; all wait for a person`);
  return { docs: byDoc.size, agreed: agreedDocs };
}

