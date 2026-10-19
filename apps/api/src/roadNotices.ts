import { DISTRICT_PAGES, ROAD_NOTICES_BASE, noticeId, parseNoticesPage, type RoadNotice, type RoadNoticeData } from "@slotscout/engine";
import { data, type StoredNotice } from "./data.js";
import { errorText, getText } from "./http.js";

/**
 * District resource road safety pages (main spec 4.3, 6.2; Addendum A 5.2), allowed by
 * www2.gov.bc.ca robots.txt. Fetched at most once per district per 6 hours, at least 2 seconds
 * apart, with a descriptive user agent.
 */
const TTL = 6 * 3600_000;

/** A km reading a person made, or an AI reading a person approved, replaces the parser's. */
function confirmedReading(s: StoredNotice | undefined): boolean {
  return !!s && (s.extraction === "person" || (s.extraction === "ai" && !!s.approvedBy));
}

/**
 * Live page notices merged with the pipeline's store (one-way rule, Addendum A 5.1–5.2): a closure
 * that has left the page stays until a person approves its removal, and stored notices still count
 * when the live page cannot be read.
 */
export function mergeWithStore(orgUnit: string, live: RoadNotice[] | null, stored: StoredNotice[]): RoadNotice[] {
  const mine = stored.filter((s) => s.orgUnit === orgUnit);
  const byId = new Map(mine.map((s) => [s.id ?? noticeId(s), s]));
  const out: RoadNotice[] = [];
  const liveIds = new Set<string>();
  for (const n of live ?? []) {
    const id = n.id ?? noticeId(n);
    liveIds.add(id);
    const s = byId.get(id);
    out.push(confirmedReading(s) ? { ...n, points: s!.points, needsAi: false, extraction: s!.extraction, listing: "listed" } : { ...n, listing: "listed" });
  }
  for (const s of mine) {
    const id = s.id ?? noticeId(s);
    if (liveIds.has(id)) continue;
    if (s.listing === "removed_pending_review" || (live === null && s.listing === "listed")) {
      out.push({ ...s, listing: live === null ? "listed" : "removed_pending_review" });
    }
  }
  return out;
}

export async function fetchRoadNotices(orgUnit: string | undefined, districtName: string | undefined): Promise<RoadNoticeData> {
  const district = (districtName ?? orgUnit ?? "Unknown district").replace(/ Natural Resource District$/, "");
  const slug = orgUnit ? DISTRICT_PAGES[orgUnit] : undefined;
  if (!slug) {
    return { district, status: "missing", notices: [], error: orgUnit ? "this district has no road safety page" : "district not found" };
  }
  const stored = data().notices.notices;
  const pageUrl = `${ROAD_NOTICES_BASE}/${slug}`;
  try {
    const res = await getText(pageUrl, { ttlMs: TTL, accept: "text/html" });
    return { district, status: "ok", fetchedAt: res.fetchedAt, pageUrl, notices: mergeWithStore(orgUnit!, parseNoticesPage(res.body, district, pageUrl), stored) };
  } catch (e) {
    return { district, status: "error", pageUrl, notices: mergeWithStore(orgUnit!, null, stored), error: errorText(e) };
  }
}
