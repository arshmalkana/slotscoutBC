import { join } from "node:path";
import { isBlockingStatus, lineLengthM, pointAlong, type NoticePoint, type RoadNotice } from "@slotscout/engine";
import type { Geometry } from "geojson";
import { checkQuotes, disagreements, schemaErrors } from "../lib/answers.js";
import { today } from "../lib/config.js";
import { ftenSection } from "../lib/gazetteer.js";
import type { Manifest } from "../lib/manifest.js";
import { manifestPath } from "../lib/manifest.js";
import { P } from "../lib/paths.js";
import { itemId, upsertItem } from "../lib/review.js";
import type { Unit } from "../lib/units.js";
import { log, readJsonIf, writeJson } from "../lib/util.js";
import { loadAnswer } from "../steps/extract.js";
import type { Task } from "../steps/queue.js";

/**
 * Road notice store (Addendum A 5.2): rule-parsed notices go live as read; AI readings wait for a
 * person until the gold set passes; km points are placed along the FTEN section from its start; a
 * notice that leaves the page, or is marked rescinded, is a looser change and stays until a person
 * checks the District Manager notice. Notices keep their original date.
 */
export interface StoredNotice extends RoadNotice {
  orgUnit: string;
  firstSeen: string;
  lastSeen: string;
  approvedBy?: string | null;
  approvedOn?: string | null;
  placement?: { sectionLengthKm: number | null; note: string };
  ai?: { task_id: string; agreed: boolean; points: NoticePoint[]; rescinded: boolean };
}

export interface StoredBlock {
  orgUnit: string;
  key: string;
  section: string;
  text: string;
  status: "open" | "read";
  firstSeen: string;
  lastSeen: string;
  readBy?: string | null;
  readOn?: string | null;
}

export interface NoticeStore {
  $comment: string;
  updatedAt: string | null;
  month: string | null;
  districts: Record<string, { pageUrl: string; fetchedAt: string | null }>;
  notices: StoredNotice[];
  /** Page text the parser could not tie to a road; P6 stays grey in that district until a person reads it. */
  blocks: StoredBlock[];
}

export const STORE = () => join(P.rules, "road-notices.json");

const emptyStore = (): NoticeStore => ({
  $comment: "District road notices as SlotScout keeps them (Addendum A 5.2). Built by `make build`; the site merges this with the live district pages. A notice that leaves its page stays (listing removed_pending_review) until a person approves the removal.",
  updatedAt: null,
  month: null,
  districts: {},
  notices: [],
  blocks: [],
});

function toPoints(ans: Record<string, any>): NoticePoint[] {
  return ((ans.points ?? []) as Record<string, any>[]).map((p) => ({
    km: p.km ?? null,
    ...(p.km_end != null ? { kmEnd: p.km_end } : {}),
    extent: p.extent === "whole_road" ? "unknown" : p.extent,
    status: p.status,
    quote: p.quote,
  }));
}

export async function buildNotices(month: string, units: Unit[], tasks: Task[]): Promise<{ notices: number; placed: number; removed: number; aiRead: number }> {
  const prev = readJsonIf<NoticeStore>(STORE(), emptyStore());
  const prevById = new Map(prev.notices.map((n) => [n.id!, n]));
  const manifest = readJsonIf<Manifest | null>(manifestPath(month), null);
  const pagesRead = new Set((manifest?.files ?? []).filter((f) => f.source === "road_notices").map((f) => f.path.split("/").pop()!.replace(".html", "")));
  const store = emptyStore();
  store.month = month;
  store.updatedAt = new Date().toISOString();
  for (const f of manifest?.files ?? []) if (f.source === "road_notices") store.districts[f.path.split("/").pop()!.replace(".html", "")] = { pageUrl: f.url ?? "", fetchedAt: f.fetchedAt };

  const sectionCache = new Map<string, Geometry | null>();
  const section = async (fs: string): Promise<Geometry | null> => {
    if (!sectionCache.has(fs)) {
      try {
        const feats = await ftenSection(fs);
        sectionCache.set(fs, feats.length === 1 ? feats[0]!.geometry : feats.length ? { type: "MultiLineString", coordinates: feats.flatMap((f) => (f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [])) } : null);
      } catch {
        sectionCache.set(fs, null);
      }
    }
    return sectionCache.get(fs)!;
  };

  let placed = 0;
  let aiRead = 0;
  const now = today();
  for (const u of units.filter((x) => x.kind === "road_notice")) {
    const n = u.meta.notice as RoadNotice;
    const org = String(u.meta.org);
    const old = prevById.get(n.id!);
    const s: StoredNotice = { ...n, orgUnit: org, firstSeen: old?.firstSeen ?? now, lastSeen: now, listing: "listed", extraction: "rule", approvedBy: old?.approvedBy ?? null, approvedOn: old?.approvedOn ?? null };
    // A person's earlier reading stays.
    if (old?.extraction === "person") Object.assign(s, { points: old.points, needsAi: false, extraction: "person" });

    const task = tasks.find((t) => t.kind === "road_notice" && t.unit_ids.includes(u.id));
    if (task && s.extraction !== "person") {
      const r1 = loadAnswer(1, task.task_id);
      const r2 = loadAnswer(2, task.task_id);
      if (r1?.answer && r2?.answer && !schemaErrors(task.schema, r1.answer).length && !schemaErrors(task.schema, r2.answer).length) {
        const q1 = checkQuotes("road_notice", r1.answer, task.source_text);
        const q2 = checkQuotes("road_notice", r2.answer, task.source_text);
        const dis = disagreements("road_notice", q1.cleaned, q2.cleaned);
        const pts = toPoints(q1.cleaned);
        s.ai = { task_id: task.task_id, agreed: !dis.length, points: pts, rescinded: !!q1.cleaned.rescinded };
        aiRead++;
        const bare = (ps: NoticePoint[] | undefined) => JSON.stringify((ps ?? []).map(({ lat: _a, lon: _b, ...p }) => p));
        const sameReading = old?.extraction === "ai" && !!old.approvedBy && bare(old.points) === bare(pts);
        if (sameReading) Object.assign(s, { points: pts, needsAi: false, extraction: "ai" });
        else {
          // Until the gold set passes, an AI reading only pre-fills the person's work (7.2): it is kept in
          // s.ai for the reviewer, and the notice keeps the parser's reading (unread km points stay grey).
          s.approvedBy = null;
          s.approvedOn = null;
          upsertItem({
            item_id: itemId("road_notice_reading", `${n.id}|${task.task_id}`),
            month,
            kind: "road_notice_reading",
            title: `${n.road}${n.date ? ` (${n.date})` : ""}, ${n.district}`,
            change_type: pts.some((p) => isBlockingStatus(p.status)) ? "stricter" : "new",
            decision: "Check the km points and status the AI read from this notice. Approving lets the reading count on the map.",
            why: [
              "the rule-based parser could not read this notice's km points",
              ...(dis.length ? [`AI runs disagree: ${dis.join("; ")}`] : []),
              ...([...q1.rejected, ...q2.rejected].length ? [`quotes not found verbatim: ${[...new Set([...q1.rejected, ...q2.rejected])].join(", ")}`] : []),
            ],
            source: { text: u.text, url: n.url ?? null, version: u.version, confirmed: true, file: u.file },
            runs: { run1: r1, run2: r2 },
            disagreements: dis,
            placements: pts,
          });
        }
        if (q1.cleaned.rescinded) {
          upsertItem({
            item_id: itemId("road_notice_rescinded", n.id!),
            month,
            kind: "road_notice_rescinded",
            title: `${n.road}: notice says it is rescinded`,
            change_type: "looser",
            decision: "Check the District Manager notice. Approve only if the closure is really lifted; until then it stays on the map.",
            why: ["a rescinded notice lifts a restriction: looser changes wait for a person (Addendum A 5.2 step 4)"],
            source: { text: u.text, url: n.url ?? null, version: u.version, confirmed: true, file: u.file },
          });
        }
      }
    }

    // Place km points along the FTEN section from its start (5.2 step 3).
    if (n.fileSection && s.points?.some((p) => p.km !== null)) {
      const g = await section(n.fileSection);
      if (g) {
        const lenKm = lineLengthM(g) / 1000;
        let note = `section ${n.fileSection} is ${lenKm.toFixed(1)} km long as mapped`;
        s.points = s.points!.map((p) => {
          if (p.km === null) return p;
          const at = pointAlong(g, p.km * 1000);
          if (!at) {
            note += `; km ${p.km} is past the mapped end`;
            return p;
          }
          placed++;
          return { ...p, lat: Number(at.lat.toFixed(6)), lon: Number(at.lon.toFixed(6)) };
        });
        s.placement = { sectionLengthKm: Number(lenKm.toFixed(2)), note };
      } else s.placement = { sectionLengthKm: null, note: `FTEN section ${n.fileSection} not found` };
    }
    store.notices.push(s);
  }

  // Notices gone from their page: looser, so they stay until a person approves (5.2 step 4).
  const current = new Set(store.notices.map((n) => n.id));
  let removed = 0;
  for (const old of prev.notices) {
    if (current.has(old.id) || old.listing === "removed_approved") continue;
    if (!pagesRead.has(old.orgUnit)) {
      // The page could not be read this time: keep the notice as it was.
      store.notices.push(old);
      continue;
    }
    removed++;
    store.notices.push({ ...old, listing: "removed_pending_review" });
    if (old.listing === "listed") {
      upsertItem({
        item_id: itemId("road_notice_removed", old.id!),
        month,
        kind: "road_notice_removed",
        title: `${old.road}${old.date ? ` (${old.date})` : ""} no longer on the ${old.district} page`,
        change_type: "looser",
        decision: "Check the linked District Manager notice. Approve the removal only if the restriction is lifted; until then it stays on the map.",
        why: ["a notice disappearing from the page is a looser change (Addendum A 5.2 step 4)"],
        source: { text: old.text, url: old.url ?? null, version: `last seen ${old.lastSeen}`, confirmed: true, file: null },
      });
    }
  }
  // Unparsed page text (5.2): a person reads each block once; the reading holds while the text is unchanged.
  const prevBlocks = new Map((prev.blocks ?? []).map((b) => [`${b.orgUnit}|${b.key}`, b]));
  for (const u of units.filter((x) => x.kind === "notice_block")) {
    const b = u.meta.block as { key: string; section: string; text: string };
    const org = String(u.meta.org);
    const old = prevBlocks.get(`${org}|${b.key}`);
    const kept: StoredBlock = { orgUnit: org, key: b.key, section: b.section, text: b.text, status: old?.status ?? "open", firstSeen: old?.firstSeen ?? now, lastSeen: now, readBy: old?.readBy ?? null, readOn: old?.readOn ?? null };
    store.blocks.push(kept);
    if (kept.status !== "read") {
      upsertItem({
        item_id: itemId("road_notice_block", `${org}|${b.key}`),
        month,
        kind: "road_notice_block",
        title: `${store.districts[org] ? org : org} road safety page: text not tied to a road`,
        change_type: "unclear",
        decision: "Read this text and anything it links to. Add any closed or restricted road to rules/road-notices.json as a person-read notice, then approve to mark the text read. Until then P6 shows Cannot confirm in this district.",
        why: ["the rule-based parser found closure or deactivation wording it could not tie to a road (Addendum A 5.2)"],
        source: { text: b.text, url: u.url, version: u.version, confirmed: true, file: u.file },
        links: u.url ? [{ label: "District page", href: u.url }] : [],
      });
    }
  }
  store.notices.sort((a, b) => a.orgUnit.localeCompare(b.orgUnit) || a.road.localeCompare(b.road));
  writeJson(STORE(), store);
  log("build", `road notices: ${store.notices.length} kept (${removed} gone from their page, held for a person), ${placed} km points placed, ${aiRead} AI-read`);
  return { notices: store.notices.length, placed, removed, aiRead };
}

/** District Manager notice PDFs must agree with the web notice (Addendum A 2). */
export function checkDmNotices(month: string, tasks: Task[], store: NoticeStore): number {
  let flagged = 0;
  for (const t of tasks.filter((x) => x.kind === "road_notice" && x.meta.pdf)) {
    const r1 = loadAnswer(1, t.task_id);
    const r2 = loadAnswer(2, t.task_id);
    if (!r1?.answer || !r2?.answer) continue;
    const q1 = checkQuotes("road_notice", r1.answer, t.source_text);
    const dis = disagreements("road_notice", q1.cleaned, checkQuotes("road_notice", r2.answer, t.source_text).cleaned);
    const fs = (q1.cleaned.road as { file_section?: string | null })?.file_section;
    const web = store.notices.find((n) => n.orgUnit === t.meta.org && n.fileSection && n.fileSection === fs);
    const pdfBlocking = toPoints(q1.cleaned).some((p) => isBlockingStatus(p.status));
    const webBlocking = !!web?.points?.some((p) => isBlockingStatus(p.status));
    const mismatch = !!web && pdfBlocking !== webBlocking;
    if (!dis.length && !mismatch && web) continue;
    flagged++;
    upsertItem({
      item_id: itemId("dm_notice", t.task_id),
      month,
      kind: "dm_notice",
      title: t.title,
      change_type: pdfBlocking && !webBlocking ? "stricter" : "unclear",
      decision: "Compare the District Manager notice with the web notice and correct the store if they differ.",
      why: [
        ...(dis.length ? [`AI runs disagree: ${dis.join("; ")}`] : []),
        ...(!web ? [`no web notice on the ${t.meta.org} page matches file section ${fs ?? "(none read)"}`] : []),
        ...(mismatch ? [`the PDF ${pdfBlocking ? "closes or restricts" : "does not close"} the road, the web notice ${webBlocking ? "does" : "does not"}`] : []),
      ],
      source: { text: t.source_text.slice(0, 6000), url: (t.meta.pdf as string) ?? null, version: t.source.version, confirmed: true, file: t.source.file },
      runs: { run1: r1, run2: r2 },
      disagreements: dis,
    });
  }
  return flagged;
}
