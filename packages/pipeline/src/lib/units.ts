import { htmlToText, noticeId, parseNoticesPageFull, type RoadNotice } from "@slotscout/engine";
import { normaliseUnit, sha256 } from "./util.js";

/**
 * Text units (Addendum A 5.1 step 1): one regulation section, one bylaw clause, one road notice.
 * Each unit is normalised and hashed; a new hash means the unit changed.
 */
export type UnitKind = "regulation_section" | "road_notice" | "notice_block" | "dm_notice" | "bylaw_clause";

export interface Unit {
  id: string;
  kind: UnitKind;
  source: string;
  title: string;
  url: string | null;
  /** Where the text came from: a raw file path, plus its own SHA-256. */
  file: string;
  fileSha256: string;
  version: string;
  text: string;
  /** SHA-256 of the normalised text: changes only when the wording does. */
  hash: string;
  confirmed: boolean;
  meta: Record<string, unknown>;
}

export function makeUnit(u: Omit<Unit, "hash">): Unit {
  return { ...u, hash: sha256(normaliseUnit(u.text)) };
}

/** Closed Areas Regulation schedule -> catalogue rule (main spec 3.2). */
export const SCHEDULE_RULE: Record<string, string> = {
  "1": "W1",
  "2": "W2",
  "3": "W3",
  "4": "W4",
  "5": "W5",
  "5.1": "W6",
  "6": "W7",
  "7": "W8",
  "8": "W8",
  "8.1": "W8",
  "9": "W9",
  "10": "W10",
  "11": "W11",
  "13": "W12",
};

/** Rule ID for a section: W5 section 85 -> W5-085; Sch. 8.1 section 3.2 -> W8-8.1-003.2. */
export function ruleIdFor(schedule: string, section: string): string | null {
  const rule = SCHEDULE_RULE[schedule];
  if (!rule) return null;
  const [whole, frac] = section.split(".");
  const sec = `${whole!.padStart(3, "0")}${frac ? `.${frac}` : ""}`;
  return rule === "W8" && schedule !== "7" ? `${rule}-${schedule}-${sec}` : `${rule}-${sec}`;
}

/** Text from a saved BC Laws page or excerpt, one paragraph per line. */
export function legalText(raw: string, file: string): string {
  if (/\.(html?|xml)$/i.test(file)) {
    return raw
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<\/(p|div|h\d|li|tr|section|title|heading|paragraph|subsection)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .split("\n")
      .map((l) => htmlToText(l))
      .filter(Boolean)
      .join("\n");
  }
  return raw;
}

const SCHEDULE_RE = /^\s*Schedule\s+(\d+(?:\.\d+)?)\b\s*[–—:-]?\s*(.*)$/i;
const SECTION_RE = /^\s*(\d+(?:\.\d+)?)\s+(?=[A-Z("“])/;

/**
 * Splits Closed Areas Regulation text into sections under their schedule heading. The heading is
 * kept at the top of every unit so the effect can be read and quoted from the same text.
 */
export function splitRegulation(text: string, base: Omit<Unit, "hash" | "id" | "kind" | "title" | "text" | "meta">): Unit[] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+$/, ""));
  const units: Unit[] = [];
  let schedule: string | null = null;
  let heading = "";
  let sec: { n: string; lines: string[] } | null = null;
  const flush = () => {
    if (!sec || !schedule) return;
    const body = sec.lines.join(" ").replace(/\s+/g, " ").trim();
    const ruleId = ruleIdFor(schedule, sec.n);
    units.push(
      makeUnit({
        ...base,
        id: `car:sch${schedule}:s${sec.n}`,
        kind: "regulation_section",
        title: `Closed Areas Regulation, Schedule ${schedule}, section ${sec.n}`,
        text: `${heading}\n${body}`,
        meta: { schedule, section: sec.n, ruleId },
      }),
    );
    sec = null;
  };
  for (const line of lines) {
    const sm = line.match(SCHEDULE_RE);
    if (sm) {
      flush();
      schedule = sm[1]!;
      heading = line.trim();
      continue;
    }
    if (!schedule) continue;
    const m = line.match(SECTION_RE);
    if (m) {
      flush();
      sec = { n: m[1]!, lines: [line.trim()] };
    } else if (sec && line.trim()) sec.lines.push(line.trim());
  }
  flush();
  return units;
}

export function noticeUnits(html: string, org: string, pageUrl: string, base: Omit<Unit, "hash" | "id" | "kind" | "title" | "text" | "meta" | "url">): { units: Unit[]; notices: RoadNotice[] } {
  const { notices, unparsed } = parseNoticesPageFull(html, org, pageUrl);
  const units = notices.map((n) =>
    makeUnit({
      ...base,
      id: `notice:${n.id ?? noticeId(n)}`,
      kind: "road_notice",
      title: `${n.road}${n.date ? ` (${n.date})` : ""}`,
      url: n.url ?? pageUrl,
      text: `${n.road}${n.date ? ` (${n.date})` : ""}: ${n.text}`,
      meta: { org, notice: n },
    }),
  );
  // Text the parser could not tie to a road: a person reads it (it keeps P6 grey until then).
  for (const b of unparsed)
    units.push(
      makeUnit({
        ...base,
        id: `block:${org}:${b.key}`,
        kind: "notice_block",
        title: `${org} page text not tied to a road (${b.section})`,
        url: pageUrl,
        text: b.text,
        meta: { org, block: b },
      }),
    );
  return { units, notices };
}

const CLAUSE_RE = /^\s*(\d{1,3}(?:\.\d{1,3})*)[.)]?\s+(?=\S)/;

/** Splits bylaw text into numbered clauses; text before the first number is the preamble. */
export function splitBylaw(text: string, docId: string, base: Omit<Unit, "hash" | "id" | "kind" | "text" | "meta">): Unit[] {
  // Capture headers (time, URL, hash) change on every pull and are not part of the bylaw.
  const body = text.replace(/^(Source|Title|Fetched|SHA-256|Captured|URL|Read|Images|Problems):.*\n/gm, "");
  const units: Unit[] = [];
  let cur: { n: string; lines: string[] } = { n: "preamble", lines: [] };
  const flush = () => {
    const t = cur.lines.join(" ").replace(/\s+/g, " ").trim();
    if (t.length > 3) units.push(makeUnit({ ...base, id: `bylaw:${docId}:${cur.n}`, kind: "bylaw_clause", text: t, meta: { doc: docId, clause: cur.n } }));
  };
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(CLAUSE_RE);
    if (m && line.trim().length > 6) {
      flush();
      cur = { n: m[1]!, lines: [line.trim()] };
    } else cur.lines.push(line.trim());
  }
  flush();
  // Repeated clause numbers (schedules restart numbering): keep IDs unique.
  const seen = new Map<string, number>();
  return units.map((u) => {
    const k = seen.get(u.id) ?? 0;
    seen.set(u.id, k + 1);
    return k ? { ...u, id: `${u.id}#${k + 1}` } : u;
  });
}
