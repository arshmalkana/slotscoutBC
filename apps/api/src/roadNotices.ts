import type { RoadNotice, RoadNoticeData } from "@slotscout/engine";
import { config } from "./config.js";
import { errorText, getText } from "./http.js";

/**
 * District resource road safety pages (PRD 4.3, 6.2). One page per natural resource district,
 * allowed by www2.gov.bc.ca robots.txt. Fetched at most once per district per 6 hours, at least
 * 2 seconds apart, with a descriptive user agent.
 */
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

const TTL = 6 * 3600_000;

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

function text(html: string): string {
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

function classify(section: RoadNotice["section"], body: string): RoadNotice["kind"] {
  const t = body.toLowerCase();
  if (section === "deactivation" || /deactivat/.test(t)) return "deactivated";
  if (/\bclosed\b|no access|no vehicle access|impassable|not drivable|bridge out|condemned|washed out|downrated to 0/.test(t)) return "closed";
  if (/restrict|gate|access control/.test(t)) return "restricted";
  if (section === "closure") return "restricted";
  if (/caution|hazard|be aware|narrow|crack|cross-ditch|rough/.test(t)) return "caution";
  return "info";
}

/** "5748.01", "5127.4" -> "5127.04", "7972 04" -> "7972.04". */
function fileSectionOf(s: string): string | undefined {
  const m = s.match(/\b(\d{3,5})[.\s](\d{1,3})(?:\b|[A-Z])/);
  if (!m) return undefined;
  const sec = m[2]!.length === 1 ? `0${m[2]}` : m[2]!;
  return `${m[1]}.${sec}`;
}

const DATE_RE = /\(((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})\)\s*$/;

export function parseNoticesPage(html: string, district: string, pageUrl: string): RoadNotice[] {
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  const blocks = [...main.matchAll(/<(h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  const notices: RoadNotice[] = [];
  let section: RoadNotice["section"] = "other";
  let current: RoadNotice | null = null;
  let listRoads: string[] = [];

  const flush = () => {
    if (!current) return;
    current.kind = classify(current.section, current.text);
    if (listRoads.length) {
      // A single notice that closes a list of roads: one notice per road so each can match.
      for (const r of listRoads) {
        notices.push({ ...current, road: r.replace(/\s*\([^)]*\)\s*$/, "").trim(), fileSection: fileSectionOf(r) });
      }
    } else {
      notices.push(current);
    }
    current = null;
    listRoads = [];
  };

  for (const b of blocks) {
    const tag = b[1]!.toLowerCase();
    const inner = b[2]!;
    if (tag === "h2" || tag === "h3") {
      flush();
      section = sectionOf(text(inner));
      continue;
    }
    if (section === "other") continue;
    const strong = inner.match(/^\s*(?:<span[^>]*>\s*)?<strong>([\s\S]*?)<\/strong>/i);
    const title = strong ? text(strong[1]!) : "";
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
        text: text(inner.slice(strong![0].length)),
        kind: "info",
        url: href ? new URL(decode(href), pageUrl).toString() : pageUrl,
      };
      continue;
    }
    if (!current) continue;
    const t = text(inner);
    if (!t) continue;
    if (tag === "li" && /\(\d{3,5}[.\s]\d{1,3}\)/.test(t)) listRoads.push(t);
    else current.text = `${current.text} ${t}`.trim().slice(0, 1200);
  }
  flush();
  return notices;
}

export async function fetchRoadNotices(orgUnit: string | undefined, districtName: string | undefined): Promise<RoadNoticeData> {
  const district = (districtName ?? orgUnit ?? "Unknown district").replace(/ Natural Resource District$/, "");
  const slug = orgUnit ? DISTRICT_PAGES[orgUnit] : undefined;
  if (!slug) {
    return { district, status: "missing", notices: [], error: orgUnit ? "this district has no road safety page" : "district not found" };
  }
  const pageUrl = `${config.roadNoticesBase}/${slug}`;
  try {
    const res = await getText(pageUrl, { ttlMs: TTL, accept: "text/html" });
    return { district, status: "ok", fetchedAt: res.fetchedAt, pageUrl, notices: parseNoticesPage(res.body, district, pageUrl) };
  } catch (e) {
    return { district, status: "error", pageUrl, notices: [], error: errorText(e) };
  }
}
