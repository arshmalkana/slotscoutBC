import { appendFileSync } from "node:fs";
import { join } from "node:path";
import type { BylawEntry } from "@slotscout/engine";
import { currentMonth, today } from "../lib/config.js";
import { P } from "../lib/paths.js";
import { allItems, itemPath, type ReviewItem } from "../lib/review.js";
import { ensureDir, listFiles, log, readJson, readJsonIf, writeJson } from "../lib/util.js";
import type { NoticeStore } from "../build/notices.js";

/**
 * People only (Addendum A 10.6, 10.7): `make approve` records a person's decision on a review item
 * and `make signoff` records the legal reviewer's sign-off. Both refuse to run inside a Claude Code
 * session or for a non-person name: Claude Code never approves, including its own extractions.
 */
function refuseAutomation(by: string | undefined): string {
  if (process.env.CLAUDECODE || process.env.CLAUDE_CODE_SESSION_ID || process.env.CLAUDE_CODE_ENTRYPOINT) {
    throw new Error("approve and signoff are for people only. Claude Code never approves anything (CLAUDE.md, Addendum A 10.6). Run this yourself in your own terminal.");
  }
  if (!by || by.trim().length < 2) throw new Error("BY=<your initials or name> is required");
  if (/claude|anthropic|\bai\b|pipeline|bot|agent|gpt/i.test(by)) throw new Error(`"${by}" is not a person; approvals record who approved`);
  return by.trim();
}

type RuleFile = { type: string; name: string; features: { geometry: unknown; properties: Record<string, any> }[] };

function applyClosedArea(it: ReviewItem, by: string, approve: boolean): void {
  if (!it.rule_id) return;
  const path = join(P.rules, `${it.rule_id}.geojson`);
  const file = readJson<RuleFile>(path);
  const taskId = (it.feature as { properties?: { task_id?: string } } | undefined)?.properties?.task_id;
  const cand = file.features.find((f) => f.properties.status === "candidate" && f.properties.task_id === taskId);
  if (!cand) throw new Error(`no candidate for ${it.rule_id} from task ${taskId} in ${path}`);
  if (approve) {
    if (cand.properties.digitised_by === by) throw new Error("the reviewer must be a second person, never the digitiser");
    for (const f of file.features) if (f !== cand && (f.properties.status === "approved" || f.properties.status === "provisional")) f.properties.status = "retired";
    Object.assign(cand.properties, { status: "approved", reviewed_by: by, reviewed_on: today(), confidence: cand.properties.confidence === "low" ? "medium" : "high" });
  } else cand.properties.status = "retired";
  writeJson(path, file);
}

function applyNotice(it: ReviewItem, by: string, approve: boolean): void {
  const path = join(P.rules, "road-notices.json");
  const store = readJson<NoticeStore>(path);
  const src = it.source.text;
  if (it.kind === "road_notice_block") {
    const b = store.blocks?.find((x) => x.text === src);
    if (b && approve) Object.assign(b, { status: "read", readBy: by, readOn: today() });
    writeJson(path, store);
    return;
  }
  for (const n of store.notices) {
    const match = it.kind === "road_notice_reading" ? n.ai && it.runs && (it.runs.run1 as { task_id?: string })?.task_id === n.ai.task_id : it.title.startsWith(n.road) && (n.text === src || src.includes(n.text.slice(0, 80)));
    if (!match) continue;
    if (!approve) continue;
    if (it.kind === "road_notice_reading" && n.ai) Object.assign(n, { points: n.ai.points, needsAi: false, extraction: "ai", approvedBy: by, approvedOn: today() });
    if (it.kind === "road_notice_removed" || it.kind === "road_notice_rescinded") Object.assign(n, { listing: "removed_approved", approvedBy: by, approvedOn: today() });
  }
  writeJson(path, store);
}

function applyBylaw(it: ReviewItem, by: string, approve: boolean): void {
  if (!approve) return;
  const files = listFiles(join(P.rules, "bylaws"), (f) => f.endsWith(".json"));
  const file = files.find((f) => readJson<{ url: string | null }>(f).url === it.source.url);
  if (!file) throw new Error("bylaw rule list not found");
  const b = readJson<{ covers: string[]; status: string; parts: { answer?: { target_shooting?: string } }[]; title: string; number: string | null; url: string }>(file);
  const target = b.parts.map((p) => p.answer?.target_shooting).find((x) => x && x !== "unclear");
  if (!target) throw new Error("the extraction does not settle target_shooting; set it in the rule list by hand before approving");
  b.status = "approved";
  writeJson(file, { ...b, reviewed_by: by, reviewed_on: today() });
  const regPath = join(P.data, "bylaws.json");
  const reg = readJson<{ entries: BylawEntry[] }>(regPath);
  for (const key of b.covers) {
    const e = reg.entries.find((x) => x.key === key);
    if (!e) continue;
    Object.assign(e, { status: "reviewed", targetShooting: target, confirmedOn: today(), bylaw: { ...(e.bylaw ?? {}), title: b.title, number: b.number ?? e.bylaw?.number, url: b.url } });
  }
  writeJson(regPath, reg);
}

export function approve(opts: { month?: string; item?: string; by?: string; decision?: string; note?: string }) {
  const by = refuseAutomation(opts.by);
  if (!opts.item) throw new Error("ITEM=<item id> is required (see the review packet)");
  const it = allItems().find((i) => i.item_id === opts.item);
  if (!it) throw new Error(`no review item ${opts.item}`);
  if (it.status !== "open") throw new Error(`item ${it.item_id} was already ${it.status} by ${it.decided_by} on ${it.decided_on}`);
  const yes = (opts.decision ?? "approve") === "approve";
  if (!yes && opts.decision !== "reject") throw new Error("DECISION must be approve or reject");
  if (it.kind === "closed_area") applyClosedArea(it, by, yes);
  if (it.kind.startsWith("road_notice")) applyNotice(it, by, yes);
  if (it.kind === "bylaw") applyBylaw(it, by, yes);
  const decided: ReviewItem = { ...it, status: yes ? "approved" : "rejected", decided_by: by, decided_on: today(), note: opts.note || undefined, updated: new Date().toISOString() };
  writeJson(itemPath(it.month, it.item_id), decided);
  ensureDir(join(P.review, it.month));
  appendFileSync(join(P.review, it.month, "decisions.jsonl"), JSON.stringify({ item: it.item_id, kind: it.kind, change_type: it.change_type, decision: decided.status, by, on: decided.decided_on, note: opts.note ?? null }) + "\n");
  log("approve", `${it.item_id} ${decided.status} by ${by}`);
  return decided;
}

export function signoff(opts: { month?: string; by?: string; note?: string }) {
  const by = refuseAutomation(opts.by);
  const month = currentMonth(opts.month);
  const path = join(P.review, month, "signoff.json");
  const prev = readJsonIf<unknown>(path, null);
  if (prev) throw new Error(`${month} is already signed off: ${JSON.stringify(prev)}`);
  const decided = allItems().filter((i) => i.month === month && i.status !== "open");
  writeJson(path, { month, by, on: today(), at: new Date().toISOString(), note: opts.note ?? null, decidedItems: decided.map((i) => ({ item: i.item_id, decision: i.status, by: i.decided_by })) });
  log("signoff", `${month} signed off by ${by}`);
  return { month, by };
}
