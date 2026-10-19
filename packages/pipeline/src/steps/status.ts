import { currentMonth } from "../lib/config.js";
import { pipelineStatus } from "./report.js";

/** Prints where the pipeline stands this month and refreshes reports/status.json. */
export function status(opts: { month?: string } = {}) {
  const s = pipelineStatus(currentMonth(opts.month));
  console.log(JSON.stringify(s, null, 2));
  return s;
}
