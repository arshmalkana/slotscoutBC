import type { NoticePoint, RoadNotice } from "./types.js";

/**
 * District resource road notices (main spec 4.3, 6.2; Addendum A 5.2). District pages use a
 * near-fixed pattern: road name, file number, date in brackets, then sentences with km points and
 * a status. This rule-based parser reads most notices; ones it cannot read are flagged for AI.
 */

export const ROAD_NOTICES_BASE = "https://www2.gov.bc.ca/gov/content/industry/natural-resource-use/resource-roads/local-road-safety-information";

/** Road safety page slug for each natural resource district (ORG_UNIT from ADM_NR_DISTRICTS_SPG). */
export const DISTRICT_PAGES: Record<string, string> = {
  DMH: "100-mile-house-road-safety-information",
  DCR: "campbell-river-road-safety-information",
  DCC: "cariboo-chilcotin-road-safety-information",
  DCS: "cascades-road-safety-information",
  DCK: "chilliwack-natural-resource-district-district-road-safety-information",
  DKM: "coast-mountain-road-safety-information",
  DFN: "fort-nelson-natural-resource-district-road-safety-information",
  DQC: "haida-gwaii-natural-resource-district-road-safety-information",
  DMK: "mackenzie-road-safety-information",
  DND: "nadina-natural-resource-district-road-safety-information",
  DNI: "noth-island-natural-resource-district-road-safety-information",
  DOS: "okanagan-shuswap-road-safety-information",
  DPG: "prince-george-natural-resource-district-road-safety-information",
  DQU: "quesnel-road-safety-information",
  DRM: "rocky-mountain-natural-resource-district-road-safety-information",
  DSQ: "sea-to-sky-natural-resource-district-road-safety-information",
  DSE: "selkirk-natural-resource-district-road-safety-information",
  DSS: "skeena-stikine-natural-resource-district-road-safety-information",
  DSI: "south-island-natural-resource-district-road-safety-information",
  DVA: "stuart-nechako-natural-resource-district-road-safety-information",
  DSC: "sunshine-coast-road-safety-information",
  DKA: "thompson-rivers-natural-resource-district-road-safety-information",
};

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&lsquo;|&rsquo;|&#39;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));
}

/** Resolves a link on a district page against the page URL (the engine runs without DOM or Node URL types). */
export function resolveUrl(href: string, base: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  const origin = base.match(/^[a-z]+:\/\/[^/]+/i)?.[0] ?? "";
  if (href.startsWith("//")) return `${base.split(":")[0]}:${href}`;
  if (href.startsWith("/")) return origin + href;
  const dir = base.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  const parts = (dir + href).slice(origin.length).split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") out.pop();
    else if (p !== ".") out.push(p);
  }
  return origin + out.join("/");
}

export function htmlToText(html: string): string {
  return decode(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function sectionOf(heading: string): RoadNotice["section"] {
  const h = heading.toLowerCase();
  if (/closure|restriction/.test(h)) return "closure";
  if (/notice|warning/.test(h)) return "warning";
  if (/structure|bridge/.test(h)) return "structure";
  if (/deactivat/.test(h)) return "deactivation";
  if (/work/.test(h)) return "work";
  return "other";
}

export function classifyNotice(section: RoadNotice["section"], body: string): RoadNotice["kind"] {
  const t = body.toLowerCase();
  if (section === "deactivation" || /deactivat/.test(t)) return "deactivated";
  if (/\bclosed\b|no access|no vehicle access|impassable|not drivable|bridge out|condemned|washed out|downrated to 0/.test(t)) return "closed";
  if (/restrict|gate|access control/.test(t)) return "restricted";
  if (section === "closure") return "restricted";
  if (/caution|hazard|be aware|narrow|crack|cross-ditch|rough/.test(t)) return "caution";
  return "info";
}

/** "5748.01", "5127.4" -> "5127.04", "7972 04" -> "7972.04". */
export function fileSectionOf(s: string): string | undefined {
  const m = s.match(/\b(\d{3,5})[.\s](\d{1,3})(?:\b|[A-Z])/);
  if (!m) return undefined;
  const sec = m[2]!.length === 1 ? `0${m[2]}` : m[2]!;
  return `${m[1]}.${sec}`;
}

const DATE_RE = /\(((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})\)\s*$/;
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** "December 17, 2021" -> "2021-12-17". */
export function isoFromLongDate(s: string | undefined): string | undefined {
  const m = s?.match(/^(\w+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!m) return undefined;
  const mo = MONTHS.indexOf(m[1]!.toLowerCase());
  if (mo < 0) return undefined;
  return `${m[3]}-${String(mo + 1).padStart(2, "0")}-${m[2]!.padStart(2, "0")}`;
}

function normaliseRoad(s: string): string {
  return s.toLowerCase().replace(/\b(fsr|forest service road|road|rd)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Stable identity for a notice: district, road (file section if given) and posted date. */
export function noticeId(n: Pick<RoadNotice, "district" | "road" | "fileSection" | "date">): string {
  return `${n.district}|${n.fileSection ?? normaliseRoad(n.road)}|${isoFromLongDate(n.date) ?? n.date ?? "undated"}`;
}

export function parseNoticesPage(html: string, district: string, pageUrl: string): RoadNotice[] {
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  const blocks = [...main.matchAll(/<(h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  const notices: RoadNotice[] = [];
  let section: RoadNotice["section"] = "other";
  let current: RoadNotice | null = null;
  let listRoads: string[] = [];

  const finish = (n: RoadNotice): RoadNotice => {
    const parsed = extractNoticePoints(n.text, n.kind);
    return { ...n, id: noticeId(n), points: parsed.points, needsAi: parsed.needsAi, postedOn: isoFromLongDate(n.date) };
  };

  const flush = () => {
    if (!current) return;
    current.kind = classifyNotice(current.section, current.text);
    if (listRoads.length) {
      // A single notice that closes a list of roads: one notice per road so each can match.
      for (const r of listRoads) {
        notices.push(finish({ ...current, road: r.replace(/\s*\([^)]*\)\s*$/, "").trim(), fileSection: fileSectionOf(r) }));
      }
    } else {
      notices.push(finish(current));
    }
    current = null;
    listRoads = [];
  };

  for (const b of blocks) {
    const tag = b[1]!.toLowerCase();
    const inner = b[2]!;
    if (tag === "h2" || tag === "h3") {
      flush();
      section = sectionOf(htmlToText(inner));
      continue;
    }
    if (section === "other") continue;
    const strong = inner.match(/^\s*(?:<span[^>]*>\s*)?<strong>([\s\S]*?)<\/strong>/i);
    const title = strong ? htmlToText(strong[1]!) : "";
    const dateMatch = title.match(DATE_RE);
    if (tag === "p" && dateMatch) {
      flush();
      const road = title.replace(DATE_RE, "").trim();
      const href = inner.match(/href="([^"]+)"/)?.[1];
      current = {
        district,
        section,
        road,
        fileSection: fileSectionOf(road),
        date: dateMatch[1],
        text: htmlToText(inner.slice(strong![0].length)),
        kind: "info",
        url: href ? resolveUrl(decode(href), pageUrl) : pageUrl,
        pdfs: [...inner.matchAll(/href="([^"]+\.pdf)"/gi)].map((m) => resolveUrl(decode(m[1]!), pageUrl)),
      };
      continue;
    }
    if (!current) continue;
    const t = htmlToText(inner);
    if (!t) continue;
    for (const m of inner.matchAll(/href="([^"]+\.pdf)"/gi)) current.pdfs = [...(current.pdfs ?? []), resolveUrl(decode(m[1]!), pageUrl)];
    if (tag === "li" && /\(\d{3,5}[.\s]\d{1,3}\)/.test(t)) listRoads.push(t);
    else current.text = `${current.text} ${t}`.trim().slice(0, 1200);
  }
  flush();
  return notices;
}

const STATUS_PATTERNS: [NoticePoint["status"], RegExp][] = [
  ["bridge_out", /bridge (?:is )?out|condemned|downrated to 0|structure .* closed|ck-? ?\d+ is closed/i],
  ["closed", /\bclosed\b|no access|no vehicle access|impassable|not drivable|no through|road ends/i],
  ["washout", /wash ?out|washed out/i],
  ["deactivated", /deactivat/i],
  ["gated", /\bgated?\b|locked/i],
  ["restricted", /restrict|access control/i],
  ["caution", /caution|hazard|be aware|narrow|crack|cross-?ditch|debris|erosion|slide|rockfall|rough|drive with care|watch for/i],
];

const BLOCKING: NoticePoint["status"][] = ["closed", "bridge_out", "washout", "deactivated", "gated", "restricted"];

export function isBlockingStatus(s: NoticePoint["status"]): boolean {
  return BLOCKING.includes(s);
}

function sentenceStatus(s: string): NoticePoint["status"] | null {
  // A washout that blocks travel is a closure; one to drive around is a caution.
  const hasNoAccess = /no access|impassable|not drivable|\bclosed\b|no vehicle access/i.test(s);
  for (const [status, re] of STATUS_PATTERNS) {
    if (re.test(s)) {
      if (status === "washout" && !hasNoAccess) return /caution|watch|care/i.test(s) ? "caution" : "washout";
      return status;
    }
  }
  return null;
}

const KM = String.raw`(\d+(?:\.\d+)?)\s*(?:km|kms|kilometres?|kilometers?)\b`;
const KM_NUM = String.raw`(\d+(?:\.\d+)?)`;

/**
 * Km points and their status from a notice's text (Addendum A 5.2). Each point keeps the exact
 * sentence it came from. needsAi is set when a sentence names km points but no status, or a notice
 * says it is closed without saying where.
 */
export function extractNoticePoints(text: string, kind?: RoadNotice["kind"]): { points: NoticePoint[]; needsAi: boolean } {
  const points: NoticePoint[] = [];
  let needsAi = false;
  // Split into sentences, but not on decimal points ("1. 3 km" typos are joined first).
  const clean = text.replace(/(\d)\.\s+(\d)/g, "$1.$2");
  const sentences = clean.split(/(?<=[.!?])\s+(?=[A-Z"“])/);
  for (const sentence of sentences) {
    const status = sentenceStatus(sentence);
    const ranges = [...sentence.matchAll(new RegExp(String.raw`between\s+(?:approximately\s+|km\s+)?${KM_NUM}\s*(?:km|kms)?\s+(?:and|to)\s+(?:approximately\s+)?${KM}`, "gi"))];
    const fromTo = [...sentence.matchAll(new RegExp(String.raw`from\s+(?:approximately\s+|km\s+)?${KM_NUM}\s*(?:km|kms)?\s+to\s+(?:approximately\s+|km\s+)?${KM}`, "gi"))];
    const beyond = [...sentence.matchAll(new RegExp(String.raw`(?:past|beyond|after)\s+(?:approximately\s+|the\s+)?${KM}`, "gi"))];
    const used = new Set<number>();
    const add = (p: NoticePoint, idx: number[]) => {
      idx.forEach((i) => used.add(i));
      points.push(p);
    };
    for (const m of [...ranges, ...fromTo]) {
      if (!status) continue;
      add({ km: Number(m[1]), kmEnd: Number(m[2]), extent: "range", status, quote: sentence.trim() }, [m.index!, m.index! + m[0].length]);
    }
    for (const m of beyond) {
      if (!status) continue;
      add({ km: Number(m[1]), extent: "beyond", status, quote: sentence.trim() }, [m.index!]);
    }
    const singles = [...sentence.matchAll(new RegExp(KM, "gi"))].filter((m) => {
      const inRange = [...ranges, ...fromTo, ...beyond].some((r) => m.index! >= r.index! && m.index! < r.index! + r[0].length);
      return !inRange;
    });
    if (!status && (singles.length || ranges.length || fromTo.length || beyond.length)) {
      // Km points with no status word the parser knows: the AI (or a person) reads this sentence.
      needsAi = true;
      continue;
    }
    for (const m of singles) {
      // A closure "at" a km point blocks travel past it.
      const extent: NoticePoint["extent"] = status && isBlockingStatus(status) ? "beyond" : "at";
      add({ km: Number(m[1]), extent, status: status!, quote: sentence.trim() }, [m.index!]);
    }
  }
  // Lists of several km points after one status word ("at 21.3 km, 22.1 km and 22.8 km") are covered above.
  if (!points.length && (kind === "closed" || kind === "restricted" || kind === "deactivated")) {
    // Closed with no km point: it may block any spot on this road. The engine treats it as blocking.
    points.push({ km: null, extent: "unknown", status: kind === "deactivated" ? "deactivated" : kind === "restricted" ? "restricted" : "closed", quote: text.slice(0, 300) });
  }
  return { points, needsAi };
}
