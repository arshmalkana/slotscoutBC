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
import { log, progress, readJsonIf, writeJson } from "../lib/util.js";
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

export async function buildNotices(month: string, units: Unit[], tasks: Task[]) {
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
    if (old.origin === "dm_notice" || current.has(old.id) || old.listing === "removed_approved") continue;
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
  const dm = await buildDmNotices(month, units, tasks, store, prev, pagesRead, section);
  store.notices.sort((a, b) => a.orgUnit.localeCompare(b.orgUnit) || a.road.localeCompare(b.road));
  writeJson(STORE(), store);
  log("build", `road notices: ${store.notices.length} kept (${removed} gone from their page, held for a person), ${placed} km points placed, ${aiRead} AI-read; District Manager PDFs: ${dm.read} read, ${dm.roads} road(s) closed or restricted in them, ${dm.waiting} waiting for extraction, ${dm.unreadable} unreadable`);
  return { notices: store.notices.length, placed, removed, aiRead, dmNotices: dm };
}

type DmPoint = { km: number | null; km_end: number | null; extent: string; status: NoticePoint["status"]; seen_on: "text" | "map"; quote: string };
type DmRoad = { name: string; file_section: string | null; quote: string; effective_from: string | null; effective_to: string | null; points: DmPoint[] };

const roadKey = (r: { name: string; file_section: string | null }) => (r.file_section ?? r.name).toLowerCase().replace(/\b(forest service road|fsr)\b/g, "fsr").replace(/[^a-z0-9.]+/g, " ").trim();

/**
 * District Manager PDFs linked from the district pages (Addendum A 2, 5.2): letters, bulletins and
 * gate maps, read from their text, OCR text and page images. Every road they close or restrict goes
 * into the store as an AI reading. It counts on the map only after a person approves it; until then
 * a closing reading keeps P6 grey on that road ("not yet checked"), never green. A PDF goes to a
 * person as unreadable only when OCR found no text and the page images could not be read either.
 */
async function buildDmNotices(
  month: string,
  units: Unit[],
  tasks: Task[],
  store: NoticeStore,
  prev: NoticeStore,
  pagesRead: Set<string>,
  section: (fs: string) => Promise<Geometry | null>,
): Promise<{ read: number; roads: number; waiting: number; unreadable: number; disagree: number }> {
  const now = today();
  const prevById = new Map(prev.notices.filter((n) => n.origin === "dm_notice").map((n) => [n.id!, n]));
  const made = new Set<string>();
  const out = { read: 0, roads: 0, waiting: 0, unreadable: 0, disagree: 0 };
  const dmUnits = units.filter((x) => x.kind === "dm_notice");
  for (const [i, u] of dmUnits.entries()) {
    progress("build", "District Manager PDFs", i + 1, dmUnits.length, u.title.replace(/^District Manager notice /, ""));
    const org = String(u.meta.org);
    const pdfLinks = u.url ? [{ label: "Notice PDF", href: u.url }] : [];
    const t = tasks.find((x) => x.kind === "dm_notice" && x.unit_ids.includes(u.id));
    const unreadable = (why: string[]) => {
      out.unreadable++;
      upsertItem({
        item_id: itemId("dm_notice", `notext|${u.id}`),
        month,
        kind: "dm_notice",
        title: `${u.title} (could not be read)`,
        change_type: "unclear",
        decision: "OCR and the page images could not be read. Open the PDF and add any closure it shows to rules/road-notices.json as a person-read notice, then approve.",
        why,
        source: { text: u.text.trim() || `No text in ${u.file}`, url: u.url, version: u.version, confirmed: true, file: u.file },
        images: (u.meta.images as string[] | undefined) ?? [],
        links: pdfLinks,
      });
    };
    if (!t) {
      // queue only skips a PDF that has neither text (layer or OCR) nor a page image.
      unreadable([`read as: ${String(u.meta.read ?? "no text layer")}`, "OCR found no text and no page image could be made, so there is nothing to read or quote"]);
      continue;
    }
    const r1 = loadAnswer(1, t.task_id);
    const r2 = loadAnswer(2, t.task_id);
    if (!r1 || !r2) {
      out.waiting++;
      continue;
    }
    if (!r1.answer || !r2.answer || schemaErrors(t.schema, r1.answer).length || schemaErrors(t.schema, r2.answer).length) {
      unreadable([
        `read as: ${String(u.meta.read)}`,
        ...[r1, r2].map((r, k) => (!r.answer ? `run ${k + 1} gave no answer${r.error ? ` (${r.error})` : ""}` : `run ${k + 1} answer rejected by the schema: ${schemaErrors(t.schema, r.answer).slice(0, 3).join("; ")}`)),
      ]);
      continue;
    }
    if (!r1.answer.legible && !r2.answer.legible) {
      unreadable([`read as: ${String(u.meta.read)}`, "both independent readings of the text, the OCR text and the page images found them illegible"]);
      continue;
    }
    out.read++;
    const q1 = checkQuotes("dm_notice", r1.answer, t.source_text);
    const q2 = checkQuotes("dm_notice", r2.answer, t.source_text);
    const dis = disagreements("dm_notice", q1.cleaned, q2.cleaned);
    if (dis.length) out.disagree++;
    const rescinded = !!q1.cleaned.rescinded;
    const signed = (q1.cleaned.signed_on as string | null) ?? null;
    const roads = (q1.cleaned.roads as DmRoad[]) ?? [];
    const rejected = [...new Set([...q1.rejected, ...q2.rejected])];
    const mapOnly = ((r1.answer.roads as DmRoad[]) ?? []).flatMap((r, k) => [
      ...(q1.rejected.includes(`roads[${k}]`) ? [`${r.name}: "${r.quote}"`] : []),
      ...r.points.filter((_, j) => q1.rejected.includes(`roads[${k}].points[${j}]`)).map((p) => `${r.name} ${p.status}${p.km !== null ? ` at km ${p.km}` : ""}: "${p.quote}" (${p.seen_on})`),
    ]);
    const placements: unknown[] = [];
    for (const r of roads) {
      const pts: NoticePoint[] = r.points.map((p) => ({ km: p.km ?? null, ...(p.km_end != null ? { kmEnd: p.km_end } : {}), extent: p.extent === "whole_road" ? "unknown" : (p.extent as NoticePoint["extent"]), status: p.status, quote: p.quote }));
      if (!pts.length) pts.push({ km: null, extent: "unknown", status: "closed", quote: r.quote });
      // Code, not the reading, places km points: along the FTEN section named in the PDF.
      let note = r.file_section ? `file ${r.file_section}` : "no file and section number in the PDF";
      if (r.file_section?.includes(".") && pts.some((p) => p.km !== null)) {
        const g = await section(r.file_section);
        if (g) {
          note = `section ${r.file_section} is ${(lineLengthM(g) / 1000).toFixed(1)} km long as mapped`;
          for (const p of pts) {
            if (p.km === null) continue;
            const at = pointAlong(g, p.km * 1000);
            if (at) Object.assign(p, { lat: Number(at.lat.toFixed(6)), lon: Number(at.lon.toFixed(6)) });
            else note += `; km ${p.km} is past the mapped end`;
          }
        } else note = `FTEN section ${r.file_section} not found`;
      }
      placements.push({ road: r.name, file_section: r.file_section, points: pts, placement: note });
      if (rescinded) continue;
      const id = `dm|${org}|${u.id.replace(/^dm:/, "")}|${roadKey(r)}`;
      if (made.has(id)) continue;
      made.add(id);
      out.roads++;
      const old = prevById.get(id);
      const bare = (ps: NoticePoint[] | undefined) => JSON.stringify((ps ?? []).map(({ lat: _a, lon: _b, ...p }) => p));
      const approved = !!old?.approvedBy && bare(old.ai?.points) === bare(pts);
      const blocking = pts.some((p) => isBlockingStatus(p.status));
      store.notices.push({
        id,
        district: store.notices.find((n) => n.orgUnit === org && n.origin !== "dm_notice")?.district ?? org,
        section: blocking ? "closure" : "warning",
        road: r.name,
        ...(r.file_section ? { fileSection: r.file_section } : {}),
        ...(signed ? { postedOn: signed, date: signed } : {}),
        text: [r.quote, ...pts.map((p) => p.quote)].filter((x, k, a) => a.indexOf(x) === k).join(" "),
        kind: blocking ? "closed" : "caution",
        url: u.url ?? "",
        points: approved ? pts : [],
        needsAi: !approved && blocking,
        extraction: "ai",
        origin: "dm_notice",
        listing: "listed",
        orgUnit: org,
        firstSeen: old?.firstSeen ?? now,
        lastSeen: now,
        approvedBy: approved ? old!.approvedBy : null,
        approvedOn: approved ? old!.approvedOn : null,
        placement: { sectionLengthKm: null, note },
        ai: { task_id: t.task_id, agreed: !dis.length, points: pts, rescinded },
      });
    }
    const roadList = roads.map((r) => r.name).join(", ");
    if (!roads.length && !dis.length && !rescinded && !mapOnly.length) continue;
    const allApproved = roads.length > 0 && !rescinded && roads.every((r) => store.notices.find((n) => n.id === `dm|${org}|${u.id.replace(/^dm:/, "")}|${roadKey(r)}`)?.approvedBy);
    if (allApproved) continue;
    upsertItem({
      item_id: itemId("dm_notice", t.task_id),
      month,
      kind: "dm_notice",
      title: `${u.title}: ${rescinded ? "rescinds a closure" : roads.length ? `${roads.length} road${roads.length > 1 ? "s" : ""} closed or restricted (${roadList.slice(0, 120)})` : "no road closure read"}`,
      change_type: rescinded ? "looser" : roads.some((r) => r.points.some((p) => isBlockingStatus(p.status)) || !r.points.length) ? "stricter" : "unclear",
      decision: rescinded
        ? "This District Manager document rescinds a closure. Check it; approve the removal of the matching web notice only if the closure is really lifted."
        : "Check each road and km point against the PDF and its page images. Approving lets these closures count on the map; until then P6 shows Cannot confirm on these roads.",
      why: [
        `read from: ${String(t.meta.read ?? "text layer")}${(t.images ?? []).length ? `, and ${t.images!.length} page image(s) looked at by both readings` : ""}`,
        "a person checks every AI reading before it counts (Addendum A 7.2: the gold set has not passed yet)",
        ...(dis.length ? [`AI runs disagree: ${dis.join("; ")}`] : []),
        ...(mapOnly.length ? [`read from the map image but not found in the text or OCR text, so not counted: ${mapOnly.join("; ")}`] : []),
        ...(rejected.length && !mapOnly.length ? [`quotes not found verbatim: ${rejected.join(", ")}`] : []),
      ],
      source: { text: t.source_text.slice(0, 8000), url: u.url, version: u.version, confirmed: true, file: u.file },
      runs: { run1: r1, run2: r2 },
      disagreements: dis,
      rejected_quotes: rejected,
      placements,
      images: t.images ?? [],
      links: pdfLinks,
    });
  }
  // Roads from a PDF that is no longer linked: an approved one stays until a person approves its
  // removal (looser); an unapproved reading never counted and goes with its PDF.
  for (const old of prev.notices.filter((n) => n.origin === "dm_notice" && !made.has(n.id!))) {
    if (!pagesRead.has(old.orgUnit)) store.notices.push(old);
    else if (old.approvedBy && old.listing !== "removed_approved") {
      store.notices.push({ ...old, listing: "removed_pending_review" });
      upsertItem({
        item_id: itemId("road_notice_removed", old.id!),
        month,
        kind: "road_notice_removed",
        title: `${old.road}: District Manager notice no longer linked from the ${old.district} page`,
        change_type: "looser",
        decision: "Check whether the closure was lifted. Approve the removal only if it was; until then it stays on the map.",
        why: ["a closure that disappears is a looser change (Addendum A 5.2 step 4)"],
        source: { text: old.text, url: old.url ?? null, version: `last seen ${old.lastSeen}`, confirmed: true, file: null },
      });
    }
  }
  return out;
}
