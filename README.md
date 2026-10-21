# SlotScout

**slotscout.ca** · Check any spot in British Columbia, rule by rule, before you shoot.

Drop a pin or paste coordinates anywhere in BC and SlotScout shows whether recreational target shooting is restricted there, with the law, the source and the date behind every answer. It never shows green unless every check passed on current data.

This repository builds the site described in *BC Shoot Check: Product Requirements* (October 18, 2026) and *Addendum A, Text-to-Map and Browser Capture*, branded as SlotScout. Claude Code sessions start from [CLAUDE.md](CLAUDE.md) (hard rules); the monthly steps are in [RUNBOOK.md](RUNBOOK.md).

## What is in this repository

```
packages/engine     Shared evaluation engine: rule catalogue, coordinate parser, fall-zone compass,
                    seasonal periods, road notice parser and verdict precedence. Used by the API, app and pipeline.
packages/pipeline   Text-to-map pipeline CLI (Addendum A): pull, split, queue, extract, build, validate,
                    review-packet, test, report, monthly, release. approve and signoff are for people only.
apps/api            Check API (Fastify). Reads live official data and runs the engine. Also serves the web app.
apps/web            The website (React + MapLibre): map, spot report, spot finder, rule and source pages.
sources/            registry.yaml: every source with owner, URL, method, cadence and freshness limit.
config.toml         Pipeline settings (model, thresholds, validation limits). Secrets live only in .env.
inbox/              Files a person drops in by hand (BC Laws copies until API permission arrives).
raw/<YYYY-MM>/      Every pulled file with its SHA-256; GIS layers keep counts and content hashes in manifest.json.
queue/              One task per text unit; answers/run1 and run2 hold the two independent extractions.
prompts/, schema/   Versioned extraction prompts and JSON schemas.
rules/              Built rule features (one file per rule ID), the road notice store and bylaw rule lists.
review/<YYYY-MM>/   Review packets for a person (index.html), decisions and sign-off.
releases/<YYYY-MM>/ Release packages; publishable only after approvals and legal sign-off.
reports/            Change reports, test reports, monthly reports, run logs, status.json.
data/               Release pointer, Wildlife Act coverage, bylaw register, bylaw sites, aliases, regression set.
scripts/            Regression gate, bylaw register and sitemap builders.
docs/               Digitising guide.
```

The engine is the same code for a single pin, the spot finder and (later) the colour map, so they can never disagree (PRD 8).

## Run it

Requires Node 22.

```sh
npm install
npm run dev            # API on :8787 and the web app on :5173 (proxying /v1 to the API)
```

Open http://localhost:5173. Other commands:

```sh
npm test               # engine and API tests, including the no-false-green suite
npm run typecheck
npm run build          # apps/api/dist/server.mjs and apps/web/dist
npm start              # production server on :8787, serving the API and the built site
npm run validate:data  # schema checks for registers and rules (make validate)
npm run regression     # release gate against live data: fails on any false green
npm run pipeline -- status        # the pipeline CLI (see RUNBOOK.md)
npm run register:bylaws           # refresh the bylaw register from official boundaries
npm run sitemap                   # regenerate apps/web/public/sitemap.xml
```

## Docker

```sh
docker compose up -d web                               # site and API on http://localhost:8787
docker compose run --rm ingest make monthly            # the monthly pipeline (Playwright + Chromium)
docker compose run --rm ingest make status
```

Both services bind-mount this repository: the site reads `rules/`, `sources/`, `data/` and `reports/` as the pipeline writes them (it reloads within a minute), and everything the pipeline produces lands in the repository so it can be committed and traced. Settings are in `.env.example`; behind a TLS-inspecting proxy set `HTTPS_PROXY` and `EXTRA_CA_CERTS` (a CA bundle mounted into the container), and build with `--build-arg HTTPS_PROXY=... --secret id=extra_ca,src=<ca.crt>`.

## Text-to-map pipeline (Addendum A)

```sh
make pull split queue extract build validate review-packet test report   # or: make monthly
make release                                                             # candidate until signed off
```

* **AI proposes, code builds, people approve.** The model only names roads, creeks, distances, dates and effects, each with the exact quote; quotes are checked verbatim, every item is read twice independently, code finds the names in official layers and draws the shape, and validation failures, disagreements or missing places go to a person with the area grey.
* **Three modes** (`config.toml` `extractor`): `api` when `ANTHROPIC_API_KEY` is in `.env` (Claude API, structured JSON output, server-side refusal fallbacks), `agent` (Claude Code reads the queue and a fresh subagent does the second run), `manual` (a person fills the same answer files).
* **One-way rule.** A stricter change may publish at once only after the gold set passes every threshold; until then AI output only pre-fills a person's work. A looser change (a closure lifted, a notice gone from its page) always waits for a person, and the older, stricter answer stays on the map.
* **BC Laws** is read only through its official API once the King's Printer confirms scheduled use in writing (`bclaws.api_confirmed`); until then a person saves copies into `inbox/bclaws/`.
* **Scans and maps.** PDF pages with no text layer are read by OCR, and map pages are saved as images that the extraction reads alongside the text; quotes are still checked against the text and OCR text.
* **Progress and resuming.** Every step prints work done and left, also shown on the Sources page; extraction answers are saved one file at a time, so an interrupted run resumes where it stopped (`RUNBOOK.md`).

## How a check works

`GET /v1/check?lat=49.41474&lon=-121.7547&type=shotgun_shot&fz=250` gathers, in parallel:

* one bundled WFS request to the BC Data Catalogue asking which boundary features contain the pin (municipality, electoral area, wildlife management unit, ParcelMap owner type, tenures, bans and more);
* one WFS request per "nearby" layer for features inside the fall zone (parks, reserves, treaty lands, non-Crown parcels, roads, trails, rec sites, buildings, railways, power lines, pipelines, cutblocks, fires);
* ECCC's protected areas database for federal bird sanctuaries and national wildlife areas;
* the natural resource district's road safety page for closures on nearby resource roads;
* the imagery capture date under the pin, and the magnetic declination (WMM 2025).

The engine then evaluates every rule in the catalogue (F1 to F6, W1 to W13, P1 to P9, L1 to L4, I1 to I3, O1 to O4, S1 to S7), applies freshness limits from the source register, finds the safe throw directions, and returns the verdict, the 12 green lights and the full checklist. Responses are cached per layer (15 minutes for wildfire layers, hours for the rest), and coordinates are never logged.

Other endpoints: `POST /v1/check/batch` (up to 100 points), `GET /v1/finder`, `/v1/rules`, `/v1/rules/{id}`, `/v1/releases`, `/v1/sources`, `/v1/coverage`, `/v1/pipeline-status`, `/v1/search`, `/v1/map-layers`, `/v1/tiles/{layer}/{z}/{x}/{y}.png`, `POST /v1/reports`. Public and rate-limited to 60 requests per minute per IP.

## What works today, and what is still to do

Working now, against live data:

* All four entry points: paste coordinates (decimal, DMS, UTM 7 to 11, Google and Apple Maps links, with swapped or unsigned values repaired and shown), drop or drag a pin (long-press on phones), browse rule layers, and a spot finder preview.
* Every machine-readable rule in the catalogue. Red answers from parks, reserves, treaty lands, private and other titled land, federal land, railways, road allowances, recreation sites and wildfire orders are live.
* The fall-zone compass with a suggested throw direction in true and magnetic degrees.
* District road notices (P6), motor vehicle closures, tenures, recent burns and active logging.
* Shareable report links stamped with the release ID, PDF via print, trip list export (GPX, CSV), report-a-problem.

Still to do before a region can turn green (PRD 13):

* **Wildlife Act closed areas (W1 to W12)** must be digitised, reviewed by a second person and tested, region by region. The pipeline pre-fills candidates from the legal text, but no region is approved yet, so every spot is "Cannot confirm" for the Wildlife Act today. The Region 2 gold set (Addendum A 7.1) is built by hand first. See [docs/digitising.md](docs/digitising.md) and `reports/` for the latest hand-off report.
* **Local bylaws (L1 to L3)** for the Province's 161 municipalities, 158 electoral areas and 13 local trust areas: the register exists (`data/bylaws.json`); each bylaw must be found, digitised and reviewed. The register is built from the official boundary layers, which currently hold 160 municipalities and 159 electoral areas; `make validate` reports the difference until a person identifies the jurisdiction concerned.
* **Legal review** of every citation marked "pending review" (PRD 11.4).
* **Imagery licence.** The default satellite and capture-date service is Esri World Imagery; a public launch needs a licence that allows that use (PRD 7.1), or a switch to provincial orthophotos and Sentinel-2.
* **Release database and verdict tiles.** Checks read live official services today (5 to 6 s uncached, under 1 s cached). The PRD's PostGIS release database, precomputed verdict tiles and spot-finder tables are the next step for the 1.5 s target and the province-wide colour map.
* Route planning and drive distances, gates, the elevation backstop check (S5), Sentinel-2 ground checks, accounts and alerts, offline regions, and French.

## Design notes

* Brand: navy and fjord blue on warm paper, with the pin-and-reticle mark. Red, amber, grey and green are reserved for verdicts and always carry a second cue (hatching, dots, crosshatch, glyph) for colour-blind users. Map overlays are rendered by the BC WMS with our own SLD so they never use verdict colours.
* No modal blocks the map. Every report carries "Not legal advice. Signs and conditions on site come first."
* Privacy: no account needed; the shooting profile and trip list stay in the browser; problem reports never store IP addresses.

## Data and licences

Contains information licensed under the Open Government Licence – British Columbia and the Open Government Licence – Canada. BC Laws text is never crawled automatically (BC Laws' robots.txt disallows it); a person saves the monthly consolidation into `inbox/` until the King's Printer confirms API use in writing. The language model receives public legal text only, never user data. Base maps and imagery are provided by their owners under their own terms.
