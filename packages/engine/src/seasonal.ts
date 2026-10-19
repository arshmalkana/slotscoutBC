/**
 * Seasonal periods for Closed Areas Regulation schedules 2, 4, 6 and 10 (PRD 5.2 "period").
 * A period endpoint is either "MM-DD" or a named rule such as "saturday_after_labour_day"
 * or "2nd_monday_of_october". Dates are evaluated in Pacific time.
 */

export interface Period {
  start: string;
  end: string;
}

export interface PeriodStatus {
  active: boolean;
  /** ISO date (YYYY-MM-DD) of the next day the status changes. */
  nextChange: string;
  text: string;
}

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** A calendar date as a UTC-midnight Date (no time-zone drift). */
function ymd(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

export function pacificDate(at: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return ymd(get("year"), get("month") - 1, get("day"));
}

function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  if (n > 0) {
    const first = ymd(year, month, 1);
    const offset = (weekday - first.getUTCDay() + 7) % 7;
    return ymd(year, month, 1 + offset + (n - 1) * 7);
  }
  const last = ymd(year, month + 1, 0);
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return ymd(year, month, last.getUTCDate() - offset);
}

export function resolveEndpoint(spec: string, year: number): Date {
  const s = spec.trim().toLowerCase();
  const fixed = s.match(/^(\d{2})-(\d{2})$/);
  if (fixed) return ymd(year, Number(fixed[1]) - 1, Number(fixed[2]));
  if (s === "labour_day") return nthWeekday(year, 8, 1, 1);
  if (s === "saturday_after_labour_day") {
    const ld = nthWeekday(year, 8, 1, 1);
    return ymd(year, 8, ld.getUTCDate() + 5);
  }
  if (s === "thanksgiving") return nthWeekday(year, 9, 1, 2);
  const nth = s.match(/^(1st|2nd|3rd|4th|last)_(\w+)_of_(\w+)$/);
  if (nth) {
    const n = nth[1] === "last" ? -1 : Number(nth[1]![0]);
    const wd = WEEKDAYS.indexOf(nth[2]!);
    const mo = MONTHS.indexOf(nth[3]!);
    if (wd >= 0 && mo >= 0) return nthWeekday(year, mo, wd, n);
  }
  throw new Error(`Unknown period endpoint "${spec}"`);
}

export function describeEndpoint(spec: string): string {
  const s = spec.trim().toLowerCase();
  const fixed = s.match(/^(\d{2})-(\d{2})$/);
  if (fixed) return `${MONTH_SHORT[Number(fixed[1]) - 1]} ${Number(fixed[2])}`;
  if (s === "labour_day") return "Labour Day";
  if (s === "saturday_after_labour_day") return "the Saturday after Labour Day";
  if (s === "thanksgiving") return "Thanksgiving Monday";
  return s.replace(/_/g, " ");
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

export function periodStatus(period: Period, at: Date): PeriodStatus {
  const d = pacificDate(at);
  const y = d.getUTCFullYear();
  const start = resolveEndpoint(period.start, y);
  const end = resolveEndpoint(period.end, y);
  const text = `from ${describeEndpoint(period.start)} to ${describeEndpoint(period.end)}`;
  if (start.getTime() <= end.getTime()) {
    if (d < start) return { active: false, nextChange: iso(start), text };
    if (d <= end) return { active: true, nextChange: iso(addDays(end, 1)), text };
    return { active: false, nextChange: iso(resolveEndpoint(period.start, y + 1)), text };
  }
  // Period wraps over the new year, e.g. Sep 10 to Mar 31.
  if (d <= end) return { active: true, nextChange: iso(addDays(end, 1)), text };
  if (d >= start) return { active: true, nextChange: iso(addDays(resolveEndpoint(period.end, y + 1), 1)), text };
  return { active: false, nextChange: iso(start), text };
}
