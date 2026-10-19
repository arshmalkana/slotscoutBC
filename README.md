# SlotScout

**slotscout.ca** · Check any spot in British Columbia, rule by rule, before you shoot.

Drop a pin or paste coordinates anywhere in BC and SlotScout shows whether recreational target shooting is restricted there, with the law, the source and the date behind every answer. It never shows green unless every check passed on current data.

This repository builds the site described in *BC Shoot Check: Product Requirements* (October 18, 2026), branded as SlotScout.

## What is in this repository

```
packages/engine   Shared evaluation engine: rule catalogue, coordinate parser, fall-zone compass,
                  seasonal periods and verdict precedence. Pure TypeScript, used by the API and the app.
apps/api          Check API (Fastify). Reads live official data and runs the engine. Also serves the web app.
apps/web          The website (React + MapLibre): map, spot report, spot finder, rule and source pages.
data/             Source register, release, Wildlife Act coverage, bylaw register, digitised rule areas,
                  regression set and public change log.
scripts/          Data validator, regression gate, monthly WFS pull, bylaw register and sitemap builders.
docs/             Digitising guide.
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
npm run validate:data  # schema checks for data/ (run before every release)
npm run regression     # release gate against live data: fails on any false green
npm run pipeline:pull -- --hits   # monthly change report: layer counts vs last month
npm run register:bylaws           # refresh the bylaw register from official boundaries
npm run sitemap                   # regenerate apps/web/public/sitemap.xml
```

Docker: `docker build -t slotscout . && docker run -p 8787:8787 slotscout`. Settings are in `.env.example`.

## How a check works

`GET /v1/check?lat=49.41474&lon=-121.7547&type=shotgun_shot&fz=250` gathers, in parallel:

* one bundled WFS request to the BC Data Catalogue asking which boundary features contain the pin (municipality, electoral area, wildlife management unit, ParcelMap owner type, tenures, bans and more);
* one WFS request per "nearby" layer for features inside the fall zone (parks, reserves, treaty lands, non-Crown parcels, roads, trails, rec sites, buildings, railways, power lines, pipelines, cutblocks, fires);
* ECCC's protected areas database for federal bird sanctuaries and national wildlife areas;
* the natural resource district's road safety page for closures on nearby resource roads;
* the imagery capture date under the pin, and the magnetic declination (WMM 2025).

The engine then evaluates every rule in the catalogue (F1 to F6, W1 to W13, P1 to P9, L1 to L4, I1 to I3, O1 to O4, S1 to S7), applies freshness limits from the source register, finds the safe throw directions, and returns the verdict, the 12 green lights and the full checklist. Responses are cached per layer (15 minutes for wildfire layers, hours for the rest), and coordinates are never logged.

Other endpoints: `POST /v1/check/batch` (up to 100 points), `GET /v1/finder`, `/v1/rules`, `/v1/rules/{id}`, `/v1/releases`, `/v1/sources`, `/v1/coverage`, `/v1/search`, `/v1/map-layers`, `/v1/tiles/{layer}/{z}/{x}/{y}.png`, `POST /v1/reports`. Public and rate-limited to 60 requests per minute per IP.

## What works today, and what is still to do

Working now, against live data:

* All four entry points: paste coordinates (decimal, DMS, UTM 7 to 11, Google and Apple Maps links, with swapped or unsigned values repaired and shown), drop or drag a pin (long-press on phones), browse rule layers, and a spot finder preview.
* Every machine-readable rule in the catalogue. Red answers from parks, reserves, treaty lands, private and other titled land, federal land, railways, road allowances, recreation sites and wildfire orders are live.
* The fall-zone compass with a suggested throw direction in true and magnetic degrees.
* District road notices (P6), motor vehicle closures, tenures, recent burns and active logging.
* Shareable report links stamped with the release ID, PDF via print, trip list export (GPX, CSV), report-a-problem.

Still to do before a region can turn green (PRD 13):

* **Wildlife Act closed areas (W1 to W12)** must be digitised, reviewed by a second person and tested, region by region. No region is done, so every spot is "Cannot confirm" for the Wildlife Act today. See [docs/digitising.md](docs/digitising.md).
* **Local bylaws (L1 to L3)** for 160 municipalities, 159 electoral areas and 13 local trust areas: the register exists (`data/bylaws.json`); each bylaw must be found, digitised and reviewed.
* **Legal review** of every citation marked "pending review" (PRD 11.4).
* **Imagery licence.** The default satellite and capture-date service is Esri World Imagery; a public launch needs a licence that allows that use (PRD 7.1), or a switch to provincial orthophotos and Sentinel-2.
* **Release database and verdict tiles.** Checks read live official services today (5 to 6 s uncached, under 1 s cached). The PRD's PostGIS release database, precomputed verdict tiles and spot-finder tables are the next step for the 1.5 s target and the province-wide colour map.
* Route planning and drive distances, gates, the elevation backstop check (S5), Sentinel-2 ground checks, accounts and alerts, offline regions, and French.

## Design notes

* Brand: navy and fjord blue on warm paper, with the pin-and-reticle mark. Red, amber, grey and green are reserved for verdicts and always carry a second cue (hatching, dots, crosshatch, glyph) for colour-blind users. Map overlays are rendered by the BC WMS with our own SLD so they never use verdict colours.
* No modal blocks the map. Every report carries "Not legal advice. Signs and conditions on site come first."
* Privacy: no account needed; the shooting profile and trip list stay in the browser; problem reports never store IP addresses.

## Data and licences

Contains information licensed under the Open Government Licence – British Columbia and the Open Government Licence – Canada. BC Laws text is never crawled automatically (BC Laws disallows it); the monthly consolidation is downloaded by a person until written permission is in place. Base maps and imagery are provided by their owners under their own terms.
