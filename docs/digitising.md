# Digitising closed areas and bylaws

The Wildlife Act Closed Areas Regulation (B.C. Reg. 76/84) and most local firearm bylaws exist only as legal text or scanned maps. Each area must become a reviewed polygon with its source text attached before SlotScout can show green anywhere near it (PRD 5).

## Where the data goes

* `rules/<rule_id>.geojson`: one file per rule ID, holding every version of that area (Addendum A 10.2). `rule_id` starts with the schedule's rule: `W5-085` is Schedule 5, section 85; bylaw zones start with `L1-`, `L2-` or `L3-`. The pipeline writes AI-prefilled candidates here; a digitiser can also add a feature by hand with `extraction_method: "manual"` and `status: "candidate"`.
* `rules/road-notices.json` and `rules/bylaws/`: the road notice store and bylaw rule lists the pipeline keeps.
* `data/wildlife-coverage.json`: per hunting region status. A region only stops being grey when its status is `reviewed` and `confirmedOn` is within 45 days.
* `data/bylaws.json`: per jurisdiction status, bylaw link and reviewed summary (`prohibited`, `permitted_with_zones` or `no_bylaw`).

Features are WGS84 GeoJSON polygons. Run `make validate` before committing. Only a person approves a feature (`make approve ITEM=<id> BY=<initials>` from the review packet), which sets `status: "approved"`, `reviewed_by` and `reviewed_on`.

## Feature schema (PRD 5.2)

Every field is required.

| Field | Example |
| --- | --- |
| `rule_id` | `W5-085` |
| `authority` | `Closed Areas Regulation, Sch. 5, s. 85` |
| `source_url` | BC Laws page, with anchor |
| `source_text` | The full legal description, verbatim |
| `source_version` | `Consolidation current to October 13, 2026` |
| `effect` | `no_shooting`, `no_shooting_seasonal`, `shot_only`, `shot_only_seasonal`, `no_rifle`, `non_toxic`, `no_shooting_hunting_exempt`, `no_hunting` |
| `period` | `{ "start": "03-11", "end": "saturday_after_labour_day" }` or `null` |
| `exemptions` | `["lawful_hunting", "trapping", "permit"]` |
| `geometry_method` | `admin_boundary`, `road_buffer`, `metes_and_bounds`, `georeferenced_map`, `contour` |
| `buffer_m` | `400` or `null` |
| `partial_extent` | `true` when only part of a road is covered (describe from and to in `notes`) |
| `conservative` | `true` when the drawn shape is deliberately larger than the law |
| `digitised_by`, `digitised_on` | Initials, `YYYY-MM-DD` |
| `reviewed_by`, `reviewed_on` | A second person, never the digitiser; `null` until reviewed |
| `confidence` | `high`, `medium`, `low` |
| `notes` | Ambiguities and how they were resolved |

Addendum A 9 adds: `extraction_method` (`manual`, `rule`, `ai`), `model_version`, `prompt_version`, `quotes` (field to exact words), `run_agreement`, plus `status` (`candidate`, `provisional`, `approved`, `retired`), `change_type` (`new`, `stricter`, `looser`, `unclear`, `cosmetic`), `version` and `unit_hash`. A candidate holds its area grey; a looser candidate leaves the older, stricter approved version live; a provisional feature may only restrict.

Period endpoints are `MM-DD` or a named rule: `labour_day`, `saturday_after_labour_day`, `thanksgiving`, or `1st_monday_of_september` style (`1st` to `4th` or `last`).

## Methods (PRD 5.3)

1. **Whole administrative area** ("Electoral Area H of the Fraser Valley Regional District"): copy the ABMS boundary. Confidence high.
2. **Road corridor** ("within 400 m of the midline of X Road from A to B"): select the road from FTEN or the Digital Road Atlas by name and ID, clip to the stated end points, buffer by the stated distance. "Including any spur roads" follows dead-end branches only (the regulation's definition of a spur road).
3. **Metes and bounds**: build the line step by step from named roads, creeks (FWA stream network), contours (DEM), lot lines (ParcelMap) and coordinates. Keep each step as a separate segment so the reviewer can check it against its sentence. Confidence medium until checked against the synopsis map.
4. **Map-defined** (Schedule 15, synopsis maps, bylaw schedules): georeference with at least 6 control points and RMS error under 50 m, trace, then rebuild from real road geometry. Confidence medium.
5. **Contour-defined** ("above the 300 m contour"): derive from the DEM. Confidence medium.
6. **Highway corridors**: Digital Road Atlas route, clipped to the named boundary.

Where a description is ambiguous or contradicts the synopsis map, draw the larger reading, set `conservative: true`, and log the question for the legal reviewer and a written query to the Fish and Wildlife Branch.

## Quality bar (PRD 5.5)

* Every feature is checked by a second person before publishing. The engine ignores unreviewed features and turns their area grey.
* Overlay every metes-and-bounds feature on the synopsis regional map; resolve any visible mismatch over 100 m before publishing.
* Each quarter a third person re-digitises a random 5% from scratch. Disagreement over 2% of the sample's area triggers a full re-review of that schedule.
* Add regression points for every area: 3 inside, 3 just outside (10 to 50 m) and 1 on the boundary (`data/regression/points.json`).

## Bylaws (PRD 5.4)

1. Find the current firearm or discharge bylaw and every amendment; store the PDF and its hash.
2. Record its structure: full ban, ban with exception zones, shotgun-only zones, hunting-only zones, permit areas, distance rules.
3. Distance rules ("no discharge within 150 m of a dwelling") become dynamic checks.
4. Digitise zone maps as in method 4.
5. Until reviewed, the whole jurisdiction stays grey with a link to the bylaw. A municipality never defaults to green.

Mission (Bylaw 5433-2014) is the template case and is seeded in the register as `in_progress`.
