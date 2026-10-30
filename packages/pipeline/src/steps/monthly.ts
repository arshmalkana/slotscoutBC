import { currentMonth } from "../lib/config.js";
import { log, progress } from "../lib/util.js";
import { build } from "./build.js";
import { contributions } from "./contributions.js";
import { extract } from "./extract.js";
import { pull } from "./pull.js";
import { queue } from "./queue.js";
import { report } from "./report.js";
import { reviewPacket } from "./reviewPacket.js";
import { split } from "./split.js";
import { test } from "./test.js";
import { validate } from "./validate.js";
import { workbench } from "./workbench.js";

/**
 * `make monthly` (Addendum A 10.4, 10.5): steps 1 to 9, stopping before anything a person must do.
 * Stops and reports if validation fails or a false green appears.
 */
export async function monthly(opts: { month?: string; only?: string[]; skip?: string[]; force?: boolean } = {}) {
  const month = currentMonth(opts.month);
  const steps = ["pull", "split", "queue", "extract", "build", "contributions", "validate", "review-packet", "workbench", "test", "report"];
  const step = (n: number) => progress("monthly", "steps", n, steps.length, n < steps.length ? `next: ${steps[n]}` : "cycle finished");
  log("monthly", `starting the monthly cycle for ${month}`);
  step(0);
  await pull({ month, only: opts.only, skip: opts.skip, force: opts.force });
  step(1);
  split({ month });
  step(2);
  queue({ month });
  step(3);
  await extract({ month });
  step(4);
  await build({ month });
  step(5);
  // Map editor work a second person confirmed goes in before the checks, like any other approved shape.
  await contributions({ month });
  step(6);
  const v = validate({ month });
  step(7);
  reviewPacket({ month });
  step(8);
  await workbench({ month });
  step(9);
  const t = v.exitCode ? { exitCode: 1 } : test({ month });
  step(10);
  report({ month });
  step(11);
  if (v.exitCode) log("monthly", "STOPPED: validation errors (see the log above); nothing goes forward until they are fixed");
  else if (t.exitCode) log("monthly", "STOPPED: the regression set failed; see the test report");
  else log("monthly", `done. Waiting for a person: review/${month}/index.html, then make signoff and make release`);
  return { exitCode: v.exitCode || t.exitCode };
}
