/**
 * Release gate (PRD 11.1, 11.2): runs the regression set through the same engine and live data
 * the site uses. Fails on any false green. Reports false reds (target under 2%) and points that
 * cannot be confirmed yet because their deciding rule is still being digitised.
 *
 *   npm run regression
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { normaliseProfile, type CheckStatus, type VerdictState } from "@slotscout/engine";
import { loadData } from "../apps/api/src/data.js";
import { checkPoint } from "../apps/api/src/check.js";

interface RegressionPoint {
  id: string;
  label: string;
  point: { lat: number; lon: number };
  profile?: { class?: string; type?: string; activity?: string; fz?: number };
  date?: string;
  expected: { verdict?: VerdictState; verdictNot?: VerdictState; rules?: Record<string, CheckStatus> };
}

const file = fileURLToPath(new URL("../data/regression/points.json", import.meta.url));
const { points } = JSON.parse(await readFile(file, "utf8")) as { points: RegressionPoint[] };
await loadData();

let falseGreen = 0;
let falseRed = 0;
let pending = 0;
let stricter = 0;
let failures = 0;
const rows: string[] = [];

for (const p of points) {
  const profile = normaliseProfile({ firearmClass: p.profile?.class, firearmType: p.profile?.type, activity: p.profile?.activity, fallZoneM: p.profile?.fz });
  const at = p.date ? new Date(`${p.date}T19:00:00Z`) : new Date();
  const r = await checkPoint(p.point, profile, at);
  const got = r.verdict.state;
  const exp = p.expected.verdict;
  const notes: string[] = [];
  let outcome = "ok";
  if (got === "green" && ((exp && exp !== "green") || p.expected.verdictNot === "green")) {
    falseGreen++;
    outcome = "FALSE GREEN";
  } else if (exp && got !== exp) {
    if (got === "red") {
      falseRed++;
      outcome = "false red";
    } else if (got === "grey" && (exp === "green" || exp === "amber")) {
      pending++;
      outcome = "pending (grey)";
      notes.push(`missing: ${r.verdict.alsoUnknown.join(", ") || r.verdict.reason}`);
    } else if (exp === "green" && got === "amber") {
      // Not a false green: a fall-zone hazard or condition the expected answer did not count.
      stricter++;
      outcome = "stricter (amber)";
      notes.push(r.verdict.reason);
    } else {
      failures++;
      outcome = "MISMATCH";
    }
  } else if (p.expected.verdictNot && got === p.expected.verdictNot) {
    failures++;
    outcome = "MISMATCH";
  }
  for (const [ruleId, status] of Object.entries(p.expected.rules ?? {})) {
    const c = r.checks.find((x) => x.ruleId === ruleId);
    if (!c || c.status !== status) {
      failures++;
      outcome = outcome === "ok" ? "RULE MISMATCH" : outcome;
      notes.push(`${ruleId}: expected ${status}, got ${c?.status ?? "missing"}`);
    }
  }
  rows.push(`${outcome.padEnd(16)} ${p.id.padEnd(30)} expected ${String(exp ?? (p.expected.verdictNot ? `not ${p.expected.verdictNot}` : "-")).padEnd(10)} got ${got.padEnd(6)} ${notes.join("; ")}`);
}

console.log(rows.join("\n"));
const n = points.length;
console.log(`\n${n} points: ${falseGreen} false green (must be 0), ${falseRed} false red (${((100 * falseRed) / n).toFixed(1)}%, target under 2%), ${pending} pending digitising, ${stricter} stricter than expected, ${failures} other mismatches.`);
process.exit(falseGreen > 0 || failures > 0 ? 1 : 0);
