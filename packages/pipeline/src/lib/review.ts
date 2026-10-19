import { join } from "node:path";
import { P } from "./paths.js";
import { listFiles, readJson, readJsonIf, sha256, writeJson } from "./util.js";

/**
 * Review items (Addendum A 3, 10.3 step 11): everything a person must look at, with the source
 * quote, both runs, the lookups, the built shape, validation results and what changed. Only a
 * person changes an item's status (make approve).
 */
export interface ReviewItem {
  item_id: string;
  month: string;
  kind: "closed_area" | "road_notice_reading" | "road_notice_removed" | "road_notice_rescinded" | "road_notice_block" | "dm_notice" | "bylaw" | "change" | "unconfirmed_source";
  title: string;
  rule_id?: string;
  /** new, stricter, looser, unclear, cosmetic, new_source, or n/a */
  change_type: string;
  /** What the person is asked to decide. */
  decision: string;
  /** Why it is here (failed checks, disagreements, policy). */
  why: string[];
  source: { text: string; url: string | null; version: string; confirmed: boolean; file: string | null };
  runs?: { run1?: unknown; run2?: unknown; rule?: unknown };
  quotes?: Record<string, string>;
  rejected_quotes?: string[];
  disagreements?: string[];
  lookups?: unknown[];
  validation?: { check: string; passed: boolean | null; detail: string }[];
  construction?: unknown[];
  feature?: unknown;
  previous_feature?: unknown;
  placements?: unknown[];
  diff?: string | null;
  links?: { label: string; href: string }[];
  status: "open" | "approved" | "rejected";
  decided_by?: string;
  decided_on?: string;
  note?: string;
  created: string;
  updated: string;
}

export const itemsDir = (month: string) => join(P.review, month, "items");
export const itemPath = (month: string, id: string) => join(itemsDir(month), `${id}.json`);

export function itemId(kind: string, key: string): string {
  return `${kind.replace(/_/g, "-")}-${sha256(key).slice(0, 10)}`;
}

/** Writes or refreshes an item; a person's decision on it is never overwritten. */
export function upsertItem(item: Omit<ReviewItem, "status" | "created" | "updated">): ReviewItem {
  // The same item from an earlier month (open or decided) stands; it is not raised again.
  const earlier = allItems().find((i) => i.item_id === item.item_id && i.month !== item.month && i.month < item.month);
  if (earlier) return earlier;
  const path = itemPath(item.month, item.item_id);
  const old = readJsonIf<ReviewItem | null>(path, null);
  const now = new Date().toISOString();
  const merged: ReviewItem = old && old.status !== "open" ? old : { ...item, status: "open", created: old?.created ?? now, updated: now };
  writeJson(path, merged);
  return merged;
}

export function loadItems(month: string): ReviewItem[] {
  return listFiles(itemsDir(month), (f) => f.endsWith(".json")).map((f) => readJson<ReviewItem>(f));
}

/** All items across months, newest month first. */
export function allItems(): ReviewItem[] {
  return listFiles(P.review, (f) => f.includes("/items/") && f.endsWith(".json"))
    .map((f) => readJson<ReviewItem>(f))
    .sort((a, b) => b.month.localeCompare(a.month));
}
