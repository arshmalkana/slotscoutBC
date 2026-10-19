import { compass8, formatDistance, type CheckStatus, type VerdictState } from "@slotscout/engine";

export { formatDistance };

export function bearingText(trueDeg: number, magneticDeg?: number | null): string {
  return `${Math.round(trueDeg)}° true${magneticDeg !== null && magneticDeg !== undefined ? ` (${Math.round(magneticDeg)}° magnetic)` : ""}, ${compass8(trueDeg)}`;
}

export function dateTime(iso: string | undefined): string {
  if (!iso) return "unknown";
  const d = new Date(iso);
  return d.toLocaleString("en-CA", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Vancouver" });
}

export function dateOnly(iso: string | undefined): string {
  if (!iso) return "unknown";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric", timeZone: "America/Vancouver" });
}

export const STATE_LABEL: Record<VerdictState, string> = { red: "Not allowed", amber: "Condition or hazard", grey: "Cannot confirm", green: "No restriction found" };
export const STATE_GLYPH: Record<VerdictState, string> = { red: "✕", amber: "!", grey: "?", green: "✓" };

export function statusState(s: CheckStatus): VerdictState | "na" {
  switch (s) {
    case "fail":
      return "red";
    case "conditional":
      return "amber";
    case "unknown":
      return "grey";
    case "pass":
      return "green";
    default:
      return "na";
  }
}

export const STATUS_LABEL: Record<CheckStatus, string> = {
  fail: "Not allowed",
  conditional: "Condition or hazard",
  unknown: "Cannot confirm",
  pass: "Pass",
  not_applicable: "Does not apply",
  note: "Note",
};
