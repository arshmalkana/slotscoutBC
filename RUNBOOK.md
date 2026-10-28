# SlotScout runbook

Every command can be re-run safely and picks up where it stopped. Run them on the host (`make <cmd>`) or in the ingest container (`docker compose run --rm ingest make <cmd>`, or `make in-docker CMD=<cmd>`). Output lands in this repository, so commit after each step.

## Each month (Addendum A 10.5)

Open Claude Code and say "Run the monthly update in RUNBOOK.md", or let `api` mode run it on a schedule. The steps:

| Step | Command | What it does | Done when |
| --- | --- | --- | --- |
| 1 | `make pull` | Pulls every GIS layer (count + SHA-256), every district road page and linked notice PDF (text layer, OCR for scans, page images for maps), every bylaw page (headless browser, robots.txt respected), and copies new files from `inbox/` | `raw/<YYYY-MM>/manifest.json` lists every source; failures are logged, not hidden |
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

`make monthly` runs steps 1 to 9 and stops before anything a person must do. Every step prints work done and work left (`[pull] District Manager PDFs 12/46 (26%), 34 left`), keeps the same counts in `reports/<YYYY-MM>-progress.json`, and `make status` (or the site's Sources page) shows them. To re-run part of a month with fresh copies, add `--force` (`make pull MONTH=2026-10 ARGS="--force --only road_notices,bylaws"`): it replaces that month's earlier copy of those sources, and the steps after it pick up the change.

### Resuming after an interruption (usage limit, restart)

Nothing finished is ever done twice. Every extraction answer is its own file in `queue/answers/run1/` or `run2/`, written the moment it is finished and committed as it lands. To pick up again:

1. `make extract` rewrites `queue/AGENT_TASKS.md` with only the tasks still missing an answer (and the done/left counts).
2. Give those briefs, and only those, to fresh readers in batches (run 1 and run 2 separately). A reader writes each answer file as soon as it is done, keeps any scratch files in a folder of its own, and replies with file paths only.
3. A reader that was stopped part-way can be resumed: it carries on with the briefs it has not written yet.
4. `make build` at any point builds whatever has both runs; the rest stays "waiting for extraction" (grey).

### Scans and maps

PDFs are read by `pdftotext` first. A page with no usable text layer (a scan, or a map saved as a picture) is read by OCR (`tesseract`), marked `[Page N: text read by OCR from the page image]` in the text, and map or scan pages are also saved as page images (`raw/<YYYY-MM>/dm_notices/images/`). The extraction looks at the images as well as the text: District Manager letters, bulletins and gate maps use `dm_notice.v1`, which lists every road the document closes. Quotes are still checked against the text and OCR text; anything seen only on the image is shown to a person but not counted. A PDF goes to a person as unreadable only when OCR and the page images both fail.

### Closed-area shapes: exact, map-read and approximate

`make build` draws each Closed Areas Regulation section the best way the sources allow, in this order:

1. **Exact, from official layers:** whole areas (parks, islands, lakes, reserves, management units, land districts) and road buffers, including sections that list several roads (read by code from the text).
2. **Read from the Province's map:** `make pull` collects the closed-area maps GeoBC publishes on the hunting synopsis page (`raw/<YYYY-MM>/closed_area_maps/`, `index.json`). Code reads each map's georeferencing with GDAL (in the ingest image), picks out the closed-area colour (yellow-highlighted roads buffered by the legend's distance, or a red outline filled in) and clips it to the management units the section names. Used when no text-drawn shape passed its checks.
3. **Approximate, from a boundary walk:** "commencing at …, thence along …" sections. Code finds each followed feature in the official layers, places the corners where they meet (or at the landmark the text names), and traces between them; too few corners gives a zone around the features, none a 1 km zone around the named place.

Map-read and walk outlines carry `approximate: true`. The engine reads a spot inside one as "Cannot confirm: possibly inside …" (grey), except deeper inside a map-read outline than its reading tolerance, where the answer is firm. The map draws them grey and dashed; exact areas are solid. Sections drawn only on a map that is not published (older attached maps) stay grey.

Arsh's instruction of 2026-10-28: the shapes code draws are approved in his name, each decision noting it (`review/<YYYY-MM>/decisions.jsonl`).

## One-way rule (Addendum A 5.1, 9)

Stricter changes (a new closure, a bigger buffer, a new road) may go live at once as red or amber and a person confirms within 24 hours, but only after the gold set passes (`ai.autopublish` in `config.toml`, checked against `reports/gold-metrics.json`). Looser changes (a closure lifted, an area removed, a boundary shrinking) never go live without a person: the live map keeps the old, stricter version. Unclear changes hold the area grey.

## What a person still does (Addendum A 10.7)

- Approves review packets and anything that loosens a rule.
- Arranges the legal reviewer's sign-off before each release.
- Emails the King's Printer for BC Laws API permission and saves regulation copies into `inbox/` until then (see `inbox/README.md`).
- Signs the imagery licence and adds keys to `.env`.
- Decides when to switch from `agent` to `api` mode (`extractor` in `config.toml`).
