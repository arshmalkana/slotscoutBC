# Hand-off report: Addendum A one-time job, October 2026

Prepared by Claude Code on 2026-10-19 (Addendum A 10.3 step 13). Nothing in this job was approved, signed off or published by Claude Code. Every item below that changes what the map shows is waiting for a person.

## 1. What was built

| Part | Where | What it does |
| --- | --- | --- |
| Hard rules and runbook | `CLAUDE.md`, `RUNBOOK.md` | Addendum A 10.6 rules for every Claude Code session; the monthly steps as commands |
| Settings | `config.toml`, `.env.example` | Model, prompts, thresholds, validation limits, storage limits; the API key lives only in `.env` |
| Source register | `sources/registry.yaml` | 41 sources, each with owner, URL, method, cadence and freshness limit (site and pipeline both read it) |
| Pipeline CLI | `packages/pipeline` | `pull`, `split`, `queue`, `extract`, `build`, `validate`, `review-packet`, `test`, `report`, `status`, `monthly`, `release`; `approve` and `signoff` refuse to run inside Claude Code |
| Prompts and schemas | `prompts/`, `schema/` | `closed_area.v1`, `road_notice.v1`, `bylaw.v1`, `change.v1` |
| Extraction modes | `packages/pipeline/src/steps/extract.ts` | `api` (Claude API, structured JSON output, server-side refusal fallbacks), `agent` (briefs for Claude Code and fresh subagents), `manual` (a person fills the same files) |
| Checks | `packages/pipeline/src/lib/answers.ts`, `geometry.ts` | Schema, verbatim quotes, two-run agreement, gazetteer lookups in official layers, deterministic road-buffer geometry, validation 4.5 |
| Engine changes | `packages/engine` | Review states (candidate, provisional, approved, retired) and the one-way rule; road notice parser with km points and quotes; P6 places km points along the FTEN section; unread page text keeps P6 grey |
| Site changes | `apps/web`, `apps/api` | Sixth accuracy promise, "how legal text becomes map shapes", privacy line on the model, Sources page "Monthly update" panel, `/v1/pipeline-status`; data reloads when the pipeline writes |
| Docker | `docker-compose.yml`, `Dockerfile`, `Dockerfile.ingest` | `web` serves the site from the bind-mounted rules and registers; `ingest` runs the pipeline with Playwright, Chromium and poppler. Every step of this job ran in the ingest container |

## 2. What was run, with counts

| Step (10.3) | Result |
| --- | --- |
| 2 Source register | 41 sources; `make validate` checks each has owner, URL, method, cadence and freshness limit |
| 3 GIS pull | 33 layers, 4,135,499 features, every pulled count equals the server's count; content hashes in `raw/2026-10/manifest.json` |
| 4 Legal text | **Not available.** BC Laws' robots.txt disallows automated clients and API use is not confirmed, so no regulation was fetched. Only Addendum A 4.1's quote of Closed Areas Sch. 5 s. 85 exists, saved as an unconfirmed excerpt |
| 5 Split | 396 units: 327 road notices, 24 District Manager notice PDFs, 31 bylaw clauses, 13 unread page texts, 1 regulation section |
| 6 Rule-based parsing | 295 units read by rules (most road notices, and the s. 85 corridor) |
| 7 AI extraction | Agent mode (no API key): 61 tasks, two independent runs each (run 2 always by a fresh subagent that saw only the source, prompt and schema) |
| 8 Lookups, shapes, validation | Sch. 5 s. 85: FVRD, Sylvester Rd, Farms Rd and Dale Rd each matched exactly one official feature; a 1.8 km corridor (0.235 km²) passed ring, area, inside-FVRD and agreement checks. The synopsis check could not run (no synopsis shape) |
| 9 Bylaws | Headless browser visited 34 Region 2 sites: 3 jurisdictions found (Richmond 4183, SLRD Areas A and D, Belcarra 498-2016), 30 not found by navigation, 1 not reachable (Bowen Island). The dry run found 2 more (Chilliwack 2740, City of Langley 2961) |
| 10 Road notices | 22 of 22 district pages read; 327 notices; 24 linked District Manager PDFs; 183 km points placed along FTEN sections |
| 11 Review packet | `review/2026-10/index.html`: 70 open items (below) |
| 12 Release candidate | `releases/2026-10/` is `2026-10-rc`, not published (needs legal sign-off). 100 unit tests pass; regression set: 0 false greens; gold set: none yet |
| 10.4 First monthly run | `make monthly MONTH=2026-10-dryrun` in the ingest container. GIS: all 33 layers re-pulled with matching counts; only `fire_current` changed (same 314 features, new content hash). Text: 396 units unchanged, 0 changed, 0 removed. New: 22 District Manager PDFs reachable through the fixed parser, and the Chilliwack (2740) and City of Langley (2961) bylaws. 22 tasks extracted twice and built; 22 more review items; no looser change; regression passed. Report: `reports/2026-10-dryrun-monthly.md` |

## 3. Open items waiting for a person (92)

Open `review/2026-10/index.html` (70 items) and `review/2026-10-dryrun/index.html` (22 more: 20 District Manager PDFs, mostly gate and closure maps, and the Chilliwack and Langley bylaws). Approve or reject each with `make approve ITEM=<id> BY=<initials>` (add `DECISION=reject NOTE="why"` to reject). The table covers the one-time packet.

| Kind | Count | What to decide |
| --- | ---: | --- |
| `road_notice_reading` | 33 | km points and status the AI read from notices the parser could not read (runs agree on 14). Approving lets the reading count on the map |
| `dm_notice` | 19 | District Manager PDFs that disagree with, or have no matching, web notice. Several PDFs close many roads at once; the v1 notice schema holds one road, so these need a person |
| `road_notice_block` | 13 | Closure or deactivation text on 9 district pages that names no road (mostly links to lists, maps and PDFs). **P6 shows "Cannot confirm" in DCC, DCK, DCR, DCS, DKA, DMH, DQC, DSQ and DSS until these are read.** This is the fastest way to restore P6 answers |
| `bylaw` | 4 | Richmond 4183 (runs disagree on how finely to split rules), SLRD Area D 1294-2013, SLRD Area A 1293-2013 (only the summary page was captured), Belcarra 498-2016 (scanned PDF with no text layer) |
| `closed_area` | 1 | Sch. 5 s. 85 corridor. Check it against the current BC Laws consolidation first: its text is an unconfirmed excerpt |

## 4. Failed or missing sources

- **BC Laws (Closed Areas, Motor Vehicle Prohibition, Hunting and the other regulations in `config.toml`)**: waiting for a person to save copies into `inbox/bclaws/` (see `inbox/README.md`), or for the King's Printer's written confirmation of API use (then set `bclaws.api_confirmed = true`). Until then the Wildlife Act checks stay "Cannot confirm" everywhere.
- **Bowen Island Municipality**: its robots.txt could not be read, so the browser did not visit; a person saves the bylaw into `inbox/bylaws/muni:Bowen Island Municipality/`.
- **28 Region 2 jurisdictions** (30 after the one-time run, 28 after the dry run): no firearm bylaw link found in up to 10 pages of each site's bylaw section. Add the document URL under `documents` in `data/bylaw-sites.json`, or save a copy in `inbox/bylaws/<register key>/`.
- **CivicInfo BC bylaw directory**: refuses automated clients (403) and reserves AI use in its robots.txt content signals. Not used; ask CivicInfo BC for permission if it would help.
- **Synopsis maps**: none in `inbox/synopsis/`, so the 90% overlap check could not run.
- 5 District Manager PDFs over 2 MB keep only their SHA-256 in the manifest (files git-ignored).

## 5. Problems found and fixed during the job

- **Road notice parser (affects the live site too):** it read only one page layout, so 9 of 22 district pages returned no notices and P6 could have passed spots next to closed roads. It now reads date ranges, abbreviated dates, undated titles, road-named sub-headings and closures stated in a heading (327 notices, up from 145). Text it still cannot tie to a road keeps P6 grey for that district.
- **km placement margin:** a closure now clears a spot only when it is more than 1 km or 25% further up the road, instead of changing the regression expectation for Slollicum spot D.
- **Run independence:** run-2 subagents' summaries reached the main session before run 1 was finished, so the remaining 12 run-1 answers were written by fresh subagents. CLAUDE.md now says run-2 subagents reply with file paths only.
- **Bylaw finder:** a sewage-discharge bylaw matched "discharge" (now ignored); a regional district bylaw naming one electoral area no longer covers the others.
- **Found by the dry run:** a dropped connection lost the Digital Road Atlas mid-pull (it was logged as failed, and pages are now retried); capture headers made an unchanged bylaw page look changed (now stripped); District Manager PDFs with no text layer now go to a person instead of the AI; a task shared by two months now belongs to the earliest.

## 6. Known limits (not fixed here)

- **Gold set:** none yet. Region 2 must be digitised by hand first (Addendum A 7.1); until every threshold passes, AI output only pre-fills a person's work (`ai.autopublish = false`).
- **Geometry builder:** draws road buffers and whole-area boundaries. Metes-and-bounds walks, creek buffers and contours go to a person with the extracted steps pre-filled.
- **Multi-road notices:** the v1 road notice schema holds one road; notices closing many roads go to a person. A v2 schema with a list of roads needs a new prompt version and a gold-set re-run.
- **Scanned bylaws:** there is no OCR in the ingest image.
- **Rule parser:** "closure in place at 21.7 km" style sentences go to the AI rather than the parser. A small pattern change would let rules read them.

## 7. Model use

- `api` mode is ready but did not run (no `ANTHROPIC_API_KEY`). When it runs it calls `claude-opus-5-5` with structured JSON output, effort `high`, two independent requests per task, and **server-side refusal fallbacks enabled** (`fallbacks: "default"`; turn off with `ai.server_side_fallback = false`). Each answer file records the model that actually served it.
- Claude Opus 5.5 takes no temperature setting, so "temperature 0" (Addendum A 7.5) cannot be set. Determinism comes from fixed prompts, schemas, quote checks and the two-run agreement check instead.
- Models receive public legal text and notices only, never user data.

## 8. Checklist for the person (Addendum A 10.7)

- [ ] Save the BC Laws regulations into `inbox/bclaws/` (names in `inbox/README.md`), and email the King's Printer about scheduled API use
- [ ] Read the 13 `road_notice_block` items first (they keep P6 grey in 9 districts)
- [ ] Work through `review/2026-10/index.html`; approve only what you have checked against the source
- [ ] Add Region 2 bylaw document URLs or copies for the 29 jurisdictions still not found (28 by navigation, plus Bowen Island)
- [ ] Hand-digitise Region 2 closed areas for the gold set; put people's answers in `gold/answers/`
- [ ] Legal reviewer sign-off (`make signoff BY=<name> MONTH=2026-10`), then `make release MONTH=2026-10`
- [ ] Decide when to add `ANTHROPIC_API_KEY` to `.env` (switches to `api` mode) and confirm the imagery licence
