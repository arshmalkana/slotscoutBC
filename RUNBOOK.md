# SlotScout runbook

Every command can be re-run safely and picks up where it stopped. Run them on the host (`make <cmd>`) or in the ingest container (`docker compose run --rm ingest make <cmd>`, or `make in-docker CMD=<cmd>`). Output lands in this repository, so commit after each step.

## Each month (Addendum A 10.5)

Open Claude Code and say "Run the monthly update in RUNBOOK.md", or let `api` mode run it on a schedule. The steps:

| Step | Command | What it does | Done when |
| --- | --- | --- | --- |
| 1 | `make pull` | Pulls every GIS layer (count + SHA-256), every district road page and linked notice PDF, every bylaw page (headless browser, robots.txt respected), and copies new files from `inbox/` | `raw/<YYYY-MM>/manifest.json` lists every source; failures are logged, not hidden |
| 2 | `make split` | Splits text into units (one regulation section, bylaw clause or road notice), normalises and hashes each, and writes the change report | `reports/<YYYY-MM>-changes.md` |
| 3 | `make queue` | Rule-based parsing first; anything free-form or needing a cross-check becomes a task in `queue/pending/` | |
| 4 | `make extract` | `api` mode: two independent model runs per task. `agent` mode: writes `queue/AGENT_TASKS.md` and one brief per task in `queue/agent/run1/` (Claude Code) and `queue/agent/run2/` (a fresh subagent given only that brief) | every task has run1 and run2 answers |
| 5 | `make build` | Quote checks, run agreement, gazetteer lookups, geometry, validation; classifies each change (cosmetic, stricter, looser, unclear, new source) | candidates in `rules/`, items in `review/<YYYY-MM>/` |
| 6 | `make validate` | Schema checks for every register and rule file | no errors |
| 7 | `make review-packet` | Writes `review/<YYYY-MM>/index.html`: each item with its source quote, map, both runs and what changed | |
| 8 | `make test` | Unit tests, gold-set metrics, regression set; stops on any false green | `reports/<YYYY-MM>-test.md` |
| 9 | `make report` | Monthly report: changes, test results, open review items, failed sources, sign-off checklist | `reports/<YYYY-MM>-monthly.md` |
| 10 | person | Approves review items (`make approve ITEM=<id> BY=<initials>`), legal reviewer signs off (`make signoff BY=<name>`) | |
| 11 | `make release` | Builds `releases/<YYYY-MM>/` only when every included change is approved and signed off; never publishes alone | |

`make monthly` runs steps 1 to 9 and stops before anything a person must do. To run an extra cycle in the same month (a dry run), give it a labelled month: `make monthly MONTH=2026-10-dryrun`. It is compared with the plain month and items already raised there are not raised again.

## One-way rule (Addendum A 5.1, 9)

Stricter changes (a new closure, a bigger buffer, a new road) may go live at once as red or amber and a person confirms within 24 hours, but only after the gold set passes (`ai.autopublish` in `config.toml`, checked against `reports/gold-metrics.json`). Looser changes (a closure lifted, an area removed, a boundary shrinking) never go live without a person: the live map keeps the old, stricter version. Unclear changes hold the area grey.

## What a person still does (Addendum A 10.7)

- Approves review packets and anything that loosens a rule.
- Arranges the legal reviewer's sign-off before each release.
- Emails the King's Printer for BC Laws API permission and saves regulation copies into `inbox/` until then (see `inbox/README.md`).
- Signs the imagery licence and adds keys to `.env`.
- Decides when to switch from `agent` to `api` mode (`extractor` in `config.toml`).
