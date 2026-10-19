#!/usr/bin/env -S npx tsx
import { currentMonth } from "./lib/config.js";
import { setLogMonth } from "./lib/util.js";

/**
 * SlotScout pipeline CLI (Addendum A 10.2). Every command can be re-run safely and picks up where
 * it stopped. `approve` and `signoff` are for people only.
 *
 *   tsx packages/pipeline/src/cli.ts <command> [--month YYYY-MM] [--only a,b] [--skip a,b] [--force]
 */
function args(argv: string[]): { cmd: string; flags: Record<string, string | true> } {
  const [cmd = "help", ...rest] = argv;
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!;
    if (!a.startsWith("--")) continue;
    const [k, v] = a.slice(2).split("=", 2) as [string, string | undefined];
    if (v !== undefined) flags[k] = v;
    else if (rest[i + 1] && !rest[i + 1]!.startsWith("--")) flags[k] = rest[++i]!;
    else flags[k] = true;
  }
  return { cmd, flags };
}

const list = (v: string | true | undefined) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined);
const str = (v: string | true | undefined) => (typeof v === "string" ? v : undefined);

const { cmd, flags } = args(process.argv.slice(2));
const month = currentMonth(str(flags.month));
setLogMonth(month);
const common = { month, only: list(flags.only), skip: list(flags.skip), force: flags.force === true };

const commands: Record<string, () => Promise<unknown>> = {
  pull: async () => (await import("./steps/pull.js")).pull(common),
  split: async () => (await import("./steps/split.js")).split(common),
  queue: async () => (await import("./steps/queue.js")).queue(common),
  extract: async () => (await import("./steps/extract.js")).extract(common),
  build: async () => (await import("./steps/build.js")).build(common),
  validate: async () => (await import("./steps/validate.js")).validate(common),
  "review-packet": async () => (await import("./steps/reviewPacket.js")).reviewPacket(common),
  test: async () => (await import("./steps/test.js")).test({ ...common, regression: flags["no-regression"] !== true }),
  report: async () => (await import("./steps/report.js")).report(common),
  status: async () => (await import("./steps/status.js")).status(common),
  monthly: async () => (await import("./steps/monthly.js")).monthly(common),
  release: async () => (await import("./steps/release.js")).release(common),
  approve: async () =>
    (await import("./steps/approve.js")).approve({ ...common, item: str(flags.item), by: str(flags.by), decision: str(flags.decision), note: str(flags.note) }),
  signoff: async () => (await import("./steps/approve.js")).signoff({ ...common, by: str(flags.by), note: str(flags.note) }),
};

if (!commands[cmd]) {
  console.log(`Commands: ${Object.keys(commands).join(", ")}\nOptions: --month YYYY-MM --only a,b --skip a,b --force`);
  process.exit(cmd === "help" ? 0 : 2);
}

try {
  const result = await commands[cmd]!();
  if (result && typeof result === "object" && "exitCode" in result && typeof result.exitCode === "number") process.exit(result.exitCode);
  process.exit(0);
} catch (e) {
  console.error(e instanceof Error ? (e.stack ?? e.message) : e);
  process.exit(1);
}
