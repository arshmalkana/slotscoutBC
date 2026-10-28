# Hand-off report: Addendum A, October 2026

Prepared by Claude Code (Addendum A 10.3 step 13), last updated 2026-10-28. Approvals and the sign-off were entered by Claude Code in Arsh's name at his explicit instruction (2026-10-23 and 2026-10-28); each decision's note says so. Sections 2 to 8 describe the month as first run; the status section above them is current.

## 1. What was built

| Part | Where | What it does |
| --- | --- | --- |
| Hard rules and runbook | `CLAUDE.md`, `RUNBOOK.md` | Addendum A 10.6 rules for every Claude Code session; the monthly steps as commands; how to resume after an interruption |
| Settings | `config.toml`, `.env.example` | Model, prompts, thresholds, validation limits, storage limits, BC Laws documents (with what a person found repealed or missing); the API key lives only in `.env` |
| Source register | `sources/registry.yaml` | 41 sources, each with owner, URL, method, cadence and freshness limit |
| Pipeline CLI | `packages/pipeline` | `pull`, `split`, `queue`, `extract`, `build`, `validate`, `review-packet`, `test`, `report`, `status`, `monthly`, `release`; `approve` and `signoff` refuse to run inside Claude Code |
| Progress | every step, `reports/2026-10-progress.json`, `status.json`, Sources page | Each step prints work done and left (`[pull] District Manager PDFs 12/46 (26%), 34 left`); the site shows the same table |
| Scans and maps | `packages/pipeline/src/lib/pdf.ts`, ingest image | Text layer first; pages with no usable text are read by OCR (tesseract); map and scan pages are saved as page images that the extraction looks at |
| Prompts and schemas | `prompts/`, `schema/` | `closed_area.v1`, `road_notice.v1`, `dm_notice.v1` (every road a District Manager letter, bulletin or gate map closes), `bylaw.v1`, `change.v1` |
| Extraction modes | `packages/pipeline/src/steps/extract.ts` | `api` (Claude API, structured output, page images sent as images, server-side refusal fallbacks), `agent` (briefs for Claude Code and fresh subagents), `manual` |
| Checks | `packages/pipeline/src/lib/answers.ts`, `geometry.ts` | Schema, verbatim quotes (text layer and OCR text), two-run agreement, gazetteer lookups in official layers, deterministic geometry, validation 4.5 |
| Engine and site | `packages/engine`, `apps/api`, `apps/web` | Review states and the one-way rule; District Manager closures count only after approval and keep P6 grey until then; Sources page progress table; About page on OCR and maps |
| Docker | `docker-compose.yml`, `Dockerfile`, `Dockerfile.ingest` | `web` serves the site; `ingest` runs the pipeline with Playwright, Chromium, poppler and tesseract. Every pipeline step ran in the ingest container |

## Status on 2026-10-28

- **Live:** https://slotscout-five.vercel.app (Vercel project `slotscout`, built from `Dockerfile.vercel`, release `2026-10-r1`). The project is linked to GitHub: every push to `claude/wizardly-brown-q2omh0` redeploys production.
- **Closed areas drawn: 211 of 254; 208 approved.** Arsh instructed on 2026-10-28 that every closed area be marked, at least approximately, and that the shapes code draws be approved in his name; Claude Code entered each approval, and each decision's note says so. Approved shapes, by how code drew them:

  | Kind | Approved | What the map shows |
  | --- | ---: | --- |
  | Exact, from official layers (areas, district lots, road and lake buffers) | 25 | solid; red inside |
  | Read from the Province's closed-area maps | 12 | grey dashed; red more than the reading tolerance inside |
  | Whole lots or a whole river where the text means part of it | 8 | grey dashed, "possibly inside" |
  | Boundary walks traced along the features they follow | 36 | grey dashed, "possibly inside" |
  | Boundary walks with some sides straight | 28 | grey dashed, "possibly inside" |
  | Zones around the places a section names | 99 | grey dashed, "possibly inside" |

- **Replaced:** W8-053 (Highway 3, Loop and Alexander bridges): the approved 57.9 km² buffer of the whole road was replaced by the 4.2 km² stretch the Province's own map highlights. W4-003 (Pitt WMA): its period ("March 11 to August 31, and Mondays, Tuesdays, Thursdays and Fridays from September 1 to March 10") is not one range, so the shape is shown in force all year, stricter than the text, until a person enters it. W5-049 (Harrison) is drawn from Electoral Area H only; the whole-FVRD shape is retired.
- **Held for a person (3):** W3-023 (Mt. Bergeron) and W9-009 (Nicomen, Schedule 9) walks whose corners spread over 1,500 km²; W3-015 (Walter Clough WMA), whose lots lie outside the management unit the text names.
- **Not drawn (43):** no place the section names could be found in the official layers (often a misspelling, such as "De Courcey" for De Courcy Island, or a private road), the named places are far-apart namesakes (Salmon Arm, Elbow Lake, Campbell River, Dawson Creek), the zone would exceed 500 km² (Gwaii Haanas, Tweedsmuir Park), or the section is province-wide (W3-019 "The Province", W5-028 "Highways", W8-027 "Provincial Parks"). Their areas stay grey.
- **Bylaws:** Arsh supplied the SLRD Electoral Area A firearms bylaw (1293-2013); both readings agree that target shooting depends on its mapped zones (Schedules V to Z) and a 100 m rule, and it is approved. A zoned bylaw shows "Cannot confirm" until its zones are drawn: fixed on 2026-10-28, because before that the check passed every spot in a zoned jurisdiction with no drawn zones (Chilliwack 2740, Richmond 4183, SLRD Area D 1294-2013, approved 2026-10-23), which could show green where the bylaw bans shooting.
- **BC Laws:** all 6 regulations in hand: Closed Areas (current to October 13, 2026) and, saved by Arsh on 2026-10-28, Hunting 190/84, Park 180/90, Forest Recreation 16/2004, Wildfire 38/2005 and Motor Vehicle Prohibition 18/2024 (each current to October 20, 2026). Only the Closed Areas Regulation is split into sections; the others are dated copies the rules cite.
- **Checks:** validate 0 errors; regression passed with no false greens; release `2026-10-r1` publishable with 208 approved closed-area features. The October sign-off of 2026-10-23 stands; every decision since is listed in `releases/2026-10/release.json` with its note.

## 2. What was run for October, with counts

There is one October: `2026-10`. The second cycle that had been run as `2026-10-dryrun` was re-pulled and re-read inside `2026-10`, and the dry-run folders were removed (they remain in git history).

| Step | Result |
| --- | --- |
| GIS pull | 33 layers, every pulled count equal to the server's count; the four wildfire layers re-pulled on 2026-10-19 |
| Legal text | The Closed Areas Regulation consolidation current to October 13, 2026 (last amended July 1, 2026 by B.C. Reg. 97/2026), copied in by a person on 2026-10-20 (`inbox/bclaws/76_84_00_multi.txt`). 254 in-force sections across 14 schedules |
| District road pages | 22 of 22 read; 401 notices; 183 km points placed along FTEN sections |
| District Manager PDFs | 46 of 46 pulled and read: 28 needed OCR (2 had no text layer at all), 62 map or scan page images read alongside the text. 74 closed or restricted roads went into `rules/road-notices.json` as AI readings waiting for approval. None was unreadable, so no "map or scan with no text" item was raised |
| Bylaws | 34 Region 2 sites visited by the headless browser; 6 bylaw documents read twice (Belcarra 498-2016 by OCR) |
| Extraction | 339 tasks, two independent runs each (run 2 always a fresh subagent that saw only its brief): closed-area sections 254 of 254; District Manager PDFs 46 of 46; road notices the parser could not read 33 of 33; bylaw documents 6 of 6 |
| Build | closed areas: 251 needs person, 3 candidate (137 sections where the two runs disagree, all grey until a person decides); road notices: 401 kept, 0 gone from their page (held), 0 lookup failures; bylaws: 6 documents, 5 with agreeing runs |
| Review packet | `review/2026-10/index.html`: 345 open items (below) |
| Tests | regression set: passed, no false greens; gold set: none yet |
| Release | `releases/2026-10/` is `2026-10-rc`, not published: no rule feature is approved yet and the legal reviewer has not signed off (`make signoff BY=<name>`) |

## 3. Open items waiting for a person (345)

Open `review/2026-10/index.html`. Approve or reject each with `make approve ITEM=<id> BY=<initials>` (add `DECISION=reject NOTE="why"` to reject).

| Kind | Count | What to decide |
| --- | ---: | --- |
| `closed_area` | 254 | Closed-area sections: check the extracted places, distances and effect against the consolidation; built shapes are candidates, the rest are pre-filled for drawing by hand |
| `dm_notice` | 39 | District Manager letters, bulletins and gate maps: each lists the roads read (from text, OCR and page images); approving lets those closures count on the map |
| `road_notice_reading` | 33 | km points and status the AI read from page notices the parser could not read; approving lets the reading count |
| `road_notice_block` | 13 | Closure or deactivation text on district pages that names no road; P6 shows Cannot confirm in that district until it is read |
| `bylaw` | 6 | Bylaw rule lists: check every extracted rule before first use |

## 4. Failed or missing sources

- **BC Laws, other regulations (1 of 6 in hand):** five regulations wait for a person's saved copy; `inbox/README.md` lists each with its link and file name. The Hunting Regulation's 404 was the wrong id: it and the Park Regulation are multi-part, so their complete pages are `190_84_00_multi` and `180_90_00_multi` (corrected in `config.toml` on 2026-10-22).
- **Motor Vehicle Prohibition Regulation:** B.C. Reg. 196/99 was replaced on March 1, 2024 by B.C. Reg. 18/2024 (amended by 265/2024), found 2026-10-22. 18/2024 is now in `bclaws.documents`, and the P7 rule cites it; the map's motor-vehicle check still reads the official MVPR boundary layer.
- **Bowen Island Municipality:** its robots.txt could not be read, so the browser did not visit; a person saves the bylaw into `inbox/bylaws/muni:Bowen Island Municipality/`.
- **Region 2 bylaw sites with no firearm bylaw link found (28 of 34)** in up to 10 pages of each site's bylaw section: [Fraser Valley Regional District](https://www.fvrd.ca), [City of Abbotsford](https://www.abbotsford.ca), [City of Mission](https://www.mission.ca), [District of Kent](https://www.kentbc.ca), [Village of Harrison Hot Springs](https://www.harrisonhotsprings.ca), [District of Hope](https://hope.ca), [Metro Vancouver Regional District](https://metrovancouver.org), [City of Maple Ridge](https://www.mapleridge.ca), [City of Pitt Meadows](https://www.pittmeadows.ca), [The Corporation of the Township of Langley](https://www.tol.ca), [City of Surrey](https://www.surrey.ca), [City of Delta](https://www.delta.ca), [City of Coquitlam](https://www.coquitlam.ca), [City of Port Coquitlam](https://www.portcoquitlam.ca), [City of Port Moody](https://www.portmoody.ca), [City of Burnaby](https://www.burnaby.ca), [City of New Westminster](https://www.newwestcity.ca), [City of Vancouver](https://vancouver.ca), [City of North Vancouver](https://www.cnv.org), [The Corporation of the District of North Vancouver](https://www.dnv.org), [District Municipality of West Vancouver](https://westvancouver.ca), [Village of Anmore](https://anmore.com), [Village of Lions Bay](https://www.lionsbay.ca), [City of White Rock](https://www.whiterockcity.ca), [District of Squamish](https://squamish.ca), [Resort Municipality of Whistler](https://www.whistler.ca), [Village of Pemberton](https://www.pemberton.ca), [District of Lillooet](https://lillooet.ca). Add each document URL under `documents` in `data/bylaw-sites.json`, or save a copy in `inbox/bylaws/<register key>/`.
- **CivicInfo BC bylaw directory:** refuses automated clients and reserves AI use in its robots.txt; not used.
- **Synopsis overlap check:** not wired yet. The geometry check accepts a synopsis shape, but nothing reads `inbox/synopsis/` into one, so saving synopsis PDFs there changes nothing until that is built.
- **Jurisdiction counts:** the Province counts 161 municipalities, 158 electoral areas and 13 local trust areas; the official boundary layers the bylaw register is built from hold 160 and 159. `make validate` warns until a person identifies the one jurisdiction that differs. No spot can turn green from it: every jurisdiction stays grey until its bylaw is reviewed.

## 5. Problems found and fixed

- **Scans and maps:** PDFs with no text layer are now read by OCR, and map pages are read as images; a District Manager PDF goes to a person as unreadable only when both fail (none did).
- **Map sheets cut short:** the layout text of large map sheets is mostly spaces, and a 30,000-character cut kept as little as 1% of their words. Spaces are now collapsed and the limit is 90,000; the 9 affected PDFs were re-read from their full text.
- **Regulation splitter:** the full consolidation has a contents list, titles on their own lines and repealed sections; titles are now kept with their own section and repealed sections are left out.
- **Forced re-pulls:** a forced pull now replaces that month's earlier copy of a source instead of merging stale entries back.
- **Proxy port after restarts:** the container's proxy port changes when the session restarts; the Docker override now follows it. A build that ran with the stale port had every official-layer lookup fail, and the notice build labelled those "not found"; a failed lookup is now reported as a failure and counted.
- **Progress for BC Laws:** the count is regulations in hand (now 1 of 6), not regulations looked for; a note a person has resolved in `config.toml` stops being logged as a failure.
- **Interruptions:** usage limits stopped the readers several times. Answers are one file each, written as soon as they are finished and auto-committed every five minutes, so every stop was resumed, not redone.

## 6. Known limits (not fixed here)

- **Gold set:** none yet. Region 2 must be digitised by hand first (Addendum A 7.1); until every threshold passes, AI output only pre-fills a person's work (`ai.autopublish = false`).
- **Geometry builder:** exact shapes for whole areas, district lots, road buffers (single roads and lists) and lake, river or creek buffers; outlines read from the Province's published closed-area maps; approximate outlines for walks (traced, or with straight sides) and approximate zones around named places. Maps attached to the regulation but not published by the Province cannot be read, and the Fontas map (W8-054) has no readable legend. Approximate shapes only ever show "possibly inside" (grey).
- **Map-only readings:** a road or km point seen on a map image but not in the text or OCR text is shown to the person but never counted.
- **W5-049 (Sch. 5 s. 49, "Huntingdon and Sumas Mountain"):** the text says "Electoral Area H of the Fraser Valley Regional District" (as amended in 1996). Code now draws the named Area H, never the whole regional district; the whole-FVRD shape is retired. Electoral area letters have been reassigned since 1996, so a person should still confirm today's Area H is the area s. 49 means.

## 6a. The gemini branch (audited 2026-10-22; kept on GitHub at Arsh's choice, tip `c7280f8`)

A separate run of the October pipeline on Windows (5 commits on top of `0260b7b`). Adopted: the official place-name aliases (`data/aliases.json`), Windows path separators in two file filters, and starting the regression script through a shell on Windows. Not adopted, because each one marks something reviewed that no record shows a person checked, and each would turn grey spots green:

- 92 approvals and a legal sign-off, all "by Arsh" on 2026-10-20 with no notes: every item of the earlier, smaller packet.
- `data/wildlife-coverage.json`: all nine regions set to "reviewed", while only 2 closed areas had been approved. The closed-area check would have shown green inside undrawn closed areas across BC.
- `data/bylaws.json`: 157 electoral areas set to "not_applicable" with one unsourced note ("no blanket firearm discharge bylaw"), and five bylaws set to "reviewed".
- W5-049 retired (a closure still in force removed on an unverified boundary argument), and its shape hand-edited instead of built from an official layer.
- Copies of four BC Laws regulations in a link-annotated format that looks fetched by a tool rather than saved by a person (BC Laws' robots.txt allows only search engines); two were only parts of multi-part regulations. They pointed to the right ids, which were adopted.
- Its own extraction answers and review items for re-numbered tasks; this branch already has two independent runs for every task.

## 7. Model use

- `api` mode is ready but did not run (no `ANTHROPIC_API_KEY`). When it runs it sends page images as image blocks with the text, makes two independent requests per task, and records the model that served each answer.
- This month's answers were written in agent mode by Claude Code subagents: one set for run 1 and separate fresh subagents for run 2, each given only its briefs and replying with file paths only.
- Models receive public legal text, notices and their page images only, never user data.

## 8. Checklist for the person (Addendum A 10.7)

- [ ] Read the 13 `road_notice_block` items first (they keep P6 grey in 9 districts)
- [ ] Check the District Manager readings (`dm_notice`): each road counts on the map only after you approve it
- [ ] Work through the closed-area items, starting with Region 2; check each against the consolidation saved on 2026-10-20
- [ ] Bowen Island Municipality: its site refuses automated connections; save its firearm bylaw into `inbox/bylaws/muni:Bowen Island Municipality/`
- [ ] Draw the zones of the four zoned bylaws (Chilliwack, Richmond, SLRD Areas A and D); until then those places show Cannot confirm
- [ ] Confirm today's Electoral Area H is the area W5-049 (s. 49) means
- [ ] Look at the 3 held closed areas (W3-023, W9-009, W3-015) and the 43 not drawn (listed in the review packet)
- [ ] W4-003 (Pitt WMA): its period has weekday rules the rule format cannot hold yet; it is shown in force all year (stricter) and, being an approximate outline, as "possibly inside" (grey)
- [ ] Identify the jurisdiction that differs between the Province's count and the boundary layers
- [ ] Add Region 2 bylaw document URLs or copies for the jurisdictions still not found
- [ ] Hand-digitise Region 2 closed areas for the gold set; put people's answers in `gold/answers/`
- [ ] Legal reviewer sign-off (`make signoff BY=<name> MONTH=2026-10`), then `make release MONTH=2026-10`
- [ ] Decide when to add `ANTHROPIC_API_KEY` to `.env` (switches to `api` mode) and confirm the imagery licence
