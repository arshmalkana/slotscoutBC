import { currentMonth } from "../lib/config.js";
import { log } from "../lib/util.js";
import { build } from "./build.js";
import { extract } from "./extract.js";
import { pull } from "./pull.js";
import { queue } from "./queue.js";
import { report } from "./report.js";
import { reviewPacket } from "./reviewPacket.js";
import { split } from "./split.js";
import { test } from "./test.js";
import { validate } from "./validate.js";

/**
 * `make monthly` (Addendum A 10.4, 10.5): steps 1 to 9, stopping before anything a person must do.
 * Stops and reports if validation fails or a false green appears.
 */
export async function monthly(opts: { month?: string; only?: string[]; skip?: string[]; force?: boolean } = {}) {
  const month = currentMonth(opts.month);
  log("monthly", `starting the monthly cycle for ${month}`);
  await pull({ month, only: opts.only, skip: opts.skip, force: opts.force });
  split({ month });
  queue({ month });
  await extract({ month });
  await build({ month });
  const v = validate({ month });
  reviewPacket({ month });
  const t = v.exitCode ? { exitCode: 1 } : test({ month });
  report({ month });
  if (v.exitCode) log("monthly", "STOPPED: validation errors (see the log above); nothing goes forward until they are fixed");
  else if (t.exitCode) log("monthly", "STOPPED: the regression set failed; see the test report");
  else log("monthly", `done. Waiting for a person: review/${month}/index.html, then make signoff and make release`);
  return { exitCode: v.exitCode || t.exitCode };
}
