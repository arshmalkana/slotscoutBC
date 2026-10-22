# Monthly report 2026-10

Written 2026-10-22T05:30:35.698Z. Extraction mode: **agent**. AI auto-publishing: **off** (gold set: 0 item(s), not passing yet).

## Sources

| Source | Status | Detail |
| --- | --- | --- |
| bc_parks | ok | 930 features, count matches the server |
| bcparks_advisories | **skipped** | planned source, not pulled yet |
| buildings | ok | 433681 features, count matches the server |
| bylaws | **partial** | 5 of 34 starter-set jurisdictions with a bylaw document found; the rest need a person |
| closed_areas | **partial** | 1 of 6 regulations from copies a person saved in inbox/bclaws; waiting for 190_84_00_multi, 180_90_00_multi, 16_2004, 38_2005, 18_2024; 1 unconfirmed excerpt(s) in inbox/excerpts |
| community_watersheds | ok | 466 features, count matches the server |
| crown_tenures | ok | 66843 features, count matches the server |
| cutblocks | ok | 596129 features, count matches the server |
| dm_notices | ok | 46 of 46 linked notice PDFs |
| dra_roads | ok | 1882029 features, count matches the server |
| electoral_areas | ok | 159 features, count matches the server |
| federal_protected | ok | 21 features, count matches the server |
| fire_bans | ok | 0 features, count matches the server |
| fire_current | ok | 314 features, count matches the server |
| fire_history | ok | 24751 features, count matches the server |
| fire_restrictions | ok | 0 features, count matches the server |
| fsr_roads | ok | 286301 features, count matches the server |
| licensee_notices | **skipped** | planned source, not pulled yet |
| local_parks | ok | 9488 features, count matches the server |
| local_trust_areas | ok | 13 features, count matches the server |
| mineral_tenures | ok | 42281 features, count matches the server |
| municipalities | ok | 160 features, count matches the server |
| mvpr | ok | 347 features, count matches the server |
| national_parks | ok | 102 features, count matches the server |
| nr_districts | ok | 23 features, count matches the server |
| parcels | ok | 740686 features, count matches the server |
| pipelines | ok | 6144 features, count matches the server |
| province | ok | 1 features, count matches the server |
| railways | ok | 10055 features, count matches the server |
| range_tenures | ok | 4333 features, count matches the server |
| rec_sites | ok | 4525 features, count matches the server |
| rec_trails | ok | 19915 features, count matches the server |
| regional_districts | ok | 28 features, count matches the server |
| reserves | ok | 1602 features, count matches the server |
| road_notices | ok | 22 of 22 district pages |
| transmission | ok | 3730 features, count matches the server |
| treaty_areas | ok | 69 features, count matches the server |
| treaty_lands | ok | 148 features, count matches the server |
| wmu | ok | 225 features, count matches the server |

GIS layers: 33 of 33 pulled in full with counts matching the server.

## Changes

First pull (baseline): 699 units. Details: `reports/2026-10-changes.md`.

## Progress

| Step | Part | Done | Total | Left | |
| --- | --- | ---: | ---: | ---: | --- |
| pull | BC Laws regulations in hand | 1 | 6 | 5 | 16% |
| pull | bylaw sites | 34 | 34 | 0 | 100% |
| pull | District Manager PDFs | 46 | 46 | 0 | 100% |
| pull | District Manager PDFs re-read | 46 | 46 | 0 | 100% |
| pull | district road pages | 22 | 22 | 0 | 100% |
| pull | GIS layers | 4 | 4 | 0 | 100% |
| pull | inbox files | 4 | 4 | 0 | 100% |
| split | bylaw sites | 34 | 34 | 0 | 100% |
| split | District Manager PDFs | 46 | 46 | 0 | 100% |
| split | district road pages | 22 | 22 | 0 | 100% |
| queue | AI tasks written | 339 | 339 | 0 | 100% |
| extract | run 1 answers | 339 | 339 | 0 | 100% |
| extract | run 2 answers | 339 | 339 | 0 | 100% |
| build | closed areas | 254 | 254 | 0 | 100% |
| build | District Manager PDFs | 46 | 46 | 0 | 100% |
| build | parts | 4 | 4 | 0 | 100% |

## Extraction and rules

339 extraction task(s) this month (37 with map or scan page images); run 1 339 of 339 done, run 2 339 of 339 done; 0 still waiting for both runs (see `queue/AGENT_TASKS.md`).
Rule features: 0 approved, 0 provisional, 4 candidate(s) waiting for a person, 0 retired.

## Tests

Regression set passed: no false greens.
Details: `reports/2026-10-test.md`.

## Open review items

345 open (6 bylaw, 254 closed area, 39 dm notice, 13 road notice block, 33 road notice reading). Packet: `review/2026-10/index.html`.

1 looser change(s) wait for a person; the live map keeps the older, stricter version until then.

## Failed or missing sources

- **bylaws** muni:Bowen Island Municipality: robots.txt for www.bimbc.ca could not be read, so automated access is not assumed
- **closed_areas** legal text: no dated copy of 190_84_00_multi, 180_90_00_multi, 16_2004, 38_2005, 18_2024: waiting for the person to save them into inbox/bclaws (BC Laws robots.txt disallows automated clients)

## Sign-off checklist (people only)

- [ ] Review packet `review/2026-10/index.html` checked; each item approved or rejected with `make approve ITEM=<id> BY=<initials>`
- [ ] Every looser change checked against its source (District Manager notice, consolidation or bylaw)
- [ ] BC Laws: current copies saved in `inbox/bclaws/` (until the King's Printer confirms API use in writing)
- [ ] Regression set passed (`reports/2026-10-test.md`)
- [ ] Legal reviewer sign-off: `make signoff BY=<name> MONTH=2026-10`
- [ ] `make release MONTH=2026-10` builds the release only after all of the above
