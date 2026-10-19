import type { NoticePoint, RoadNotice, UnparsedBlock } from "./types.js";

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
  if (/closure|closed|restriction/.test(h)) return "closure";
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

const MONTH = "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\\.?";
/** A bracketed date anywhere in a title: "(December 17, 2021)", "(September 1 - September 25, 2026)", "(June 2015)". */
const DATE_PAREN = new RegExp(`\\(([^()]*?\\b${MONTH}\\b[^()]*?\\b(?:19|20)\\d{2}\\b[^()]*?)\\)`, "i");
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** First date in a date text as YYYY-MM-DD: "December 17, 2021", "September 1 - September 25, 2026", "June 2015" (day 1). */
export function isoFromLongDate(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const m = s.match(new RegExp(`\\b(${MONTH})\\s+(\\d{1,2})?\\b`, "i"));
  const y = s.match(/\b((?:19|20)\d{2})\b/);
  if (!m || !y) return undefined;
  const mo = MONTHS.findIndex((x) => x.startsWith(m[1]!.toLowerCase().replace(".", "").slice(0, 3)));
  if (mo < 0) return undefined;
  const day = m[2] && Number(m[2]) <= 31 && !/^(19|20)\d{2}$/.test(m[2]) ? m[2] : "1";
  return `${y[1]}-${String(mo + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normaliseRoad(s: string): string {
  return s.toLowerCase().replace(/\b(fsr|forest service road|road|rd)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Stable identity for a notice: district, road (file section if given) and posted date. */
export function noticeId(n: Pick<RoadNotice, "district" | "road" | "fileSection" | "date">): string {
  return `${n.district}|${n.fileSection ?? normaliseRoad(n.road)}|${isoFromLongDate(n.date) ?? n.date ?? "undated"}`;
}

/** Looks like a road title: names a road type, a file and section, or a road permit number. */
const ROADISH = /\b(FSR|F\.S\.R\.?|Forest Service Road|Main(?:line)?|Branch|Br|Road|Rd|Spur|Connector|Bridge)\b|\b\d{3,5}[.\s-]\d{1,3}\b|\bR\d{4,}|^[A-Z][^.!?]{0,60}\b(?!(?:19|20)\d{2}\b)\d{4,5}\b[^.!?]{0,20}$/i;
/** Text that may close or restrict a road; it must be tied to a road or the page counts as unread. */
const CLOSURE_WORDS = /\bclosed\b(?! areas?\b)|\bclosures?\b(?! areas?\b)|no access|no vehicle access|impassable|not drivable|washed? ?out|deactivat|restricted|\bgated?\b|bridge (?:is )?out|load limit|no through/i;

function blockKey(section: string, text: string): string {
  // Small stable hash (FNV-1a) so a reading of the block can be matched next time.
  let h = 0x811c9dc5;
  const t = `${section}|${text.toLowerCase().replace(/\s+/g, " ").trim()}`;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export function parseNoticesPage(html: string, district: string, pageUrl: string): RoadNotice[] {
  return parseNoticesPageFull(html, district, pageUrl).notices;
}

/**
 * Reads a district road safety page. Notices start at a bold road title in a paragraph or list
 * item, or at a road-named sub-heading, inside a notices, closures, bridge, works or deactivation
 * section. Closure-like text that cannot be tied to a road is returned as unparsed, so the site
 * can stay grey instead of passing a spot the page may close.
 */
export function parseNoticesPageFull(html: string, district: string, pageUrl: string): { notices: RoadNotice[]; unparsed: UnparsedBlock[] } {
  const main = (html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html).replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
  const blocks = [...main.matchAll(/<(h2|h3|h4|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  const notices: RoadNotice[] = [];
  const unparsed: UnparsedBlock[] = [];
  let section: RoadNotice["section"] = "other";
  /** The sub-heading the notice sits under ("FSRs closed due to fire activity"): its words count too. */
  let heading = "";
  let current: RoadNotice | null = null;
  let listRoads: string[] = [];

  const finish = (n: RoadNotice): RoadNotice => {
    // A notice with no text beyond its title is quoted by its title.
    const parsed = extractNoticePoints(n.text || n.road, n.kind);
    return { ...n, id: noticeId(n), points: parsed.points, needsAi: parsed.needsAi, postedOn: isoFromLongDate(n.date) };
  };

  const flush = () => {
    if (!current) return;
    current.kind = classifyNotice(current.section, `${heading} ${current.road} ${current.text}`);
    // A closure stated only in the heading applies to each road listed under it.
    if (/\bclosed\b|\bclosures?\b/i.test(heading) && !/\bclosed\b|no access|impassable/i.test(current.text)) current.text = `${current.text} (Listed under: ${heading}.)`.trim();
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

  const start = (title: string, body: string, inner: string) => {
    flush();
    const dm = title.match(DATE_PAREN);
    const road = (dm ? title.slice(0, dm.index) : title).replace(/[\s:–—-]+$/, "").trim();
    const after = dm ? title.slice(dm.index! + dm[0].length).replace(/^[\s:–—-]+/, "") : "";
    const href = inner.match(/href="([^"]+)"/)?.[1];
    current = {
      district,
      section,
      road: road || title,
      fileSection: fileSectionOf(title),
      date: dm?.[1]?.replace(/\s+/g, " ").trim(),
      text: [after, body].filter(Boolean).join(" ").trim().slice(0, 1200),
      kind: "info",
      url: href ? resolveUrl(decode(href), pageUrl) : pageUrl,
      pdfs: [...inner.matchAll(/href="([^"]+\.pdf)"/gi)].map((m) => resolveUrl(decode(m[1]!), pageUrl)),
    };
  };

  for (const b of blocks) {
    const tag = b[1]!.toLowerCase();
    const inner = b[2]!;
    const text = htmlToText(inner);
    if (tag === "h2") {
      flush();
      section = sectionOf(text);
      heading = "";
      continue;
    }
    if (tag === "h3" || tag === "h4") {
      const sec = sectionOf(text);
      if (section === "other" && sec === "other") continue;
      if (ROADISH.test(text) && text.length < 140 && !/^(fsrs?|roads?)\b/i.test(text)) {
        // A sub-heading naming a road starts a notice; the paragraphs below are its text.
        flush();
        heading = "";
        start(text, "", inner);
        continue;
      }
      flush();
      heading = text;
      if (sec !== "other") section = sec;
      else if (/resources|contact|links|maps?\b|more info|weather|licensee/i.test(text)) section = "other";
      continue;
    }
    if (section === "other") continue;
    const strong = inner.match(/^\s*(?:<span[^>]*>\s*)*<(strong|b)>([\s\S]*?)<\/\1>/i);
    const title = strong ? htmlToText(strong[2]!) : "";
    if (title && (DATE_PAREN.test(title) || (ROADISH.test(title) && title.length < 160))) {
      start(title, htmlToText(inner.slice(strong![0].length)), inner);
      continue;
    }
    if (!text) continue;
    // `current` is set inside start(), which TypeScript's narrowing cannot see.
    const cur = current as RoadNotice | null;
    if (cur) {
      for (const m of inner.matchAll(/href="([^"]+\.pdf)"/gi)) cur.pdfs = [...(cur.pdfs ?? []), resolveUrl(decode(m[1]!), pageUrl)];
      if (tag === "li" && /\(\d{3,5}[.\s]\d{1,3}\)/.test(text)) listRoads.push(text);
      else cur.text = `${cur.text} ${text}`.trim().slice(0, 1200);
      continue;
    }
    if (CLOSURE_WORDS.test(text)) unparsed.push({ key: blockKey(section, text), section, text: text.slice(0, 1500) });
  }
  flush();
  return { notices, unparsed };
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
