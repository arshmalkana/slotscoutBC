# Extraction task road_notice-4743bba44eaf (run 2)

Write your answer to `queue/answers/run2/road_notice-4743bba44eaf.json` as:

```json
{ "task_id": "road_notice-4743bba44eaf", "run": 2, "mode": "agent", "model": "<your model id> (Claude Code subagent)", "prompt_version": "road_notice.v1", "schema_id": "road_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/road_notice.v1.json... } }
```

The answer must match `schema/road_notice.v1.json` exactly. Use only the source text below. Never write coordinates. Every filled field needs its exact quote.

## Instructions

# road_notice.v1

You read one resource road notice from a British Columbia natural resource district road safety page (or a District Manager notice linked from it) and return the road and each km point with its status, in the JSON schema `road_notice.v1`. Code places the km points on the official road line; a closure that is lifted or a notice that disappears always waits for a person.

Read only the notice text. Do not use anything you know about the road from elsewhere.

How to fill the fields:

- `road.name`: the road name as written (for example "Harrison East FSR"). `road.file_section`: the file and section number if given ("5748.01"), else null.
- `posted_on`: the date in brackets after the road name, as YYYY-MM-DD, or null.
- `rescinded`: true only if the notice says it is rescinded, lifted, cancelled or that the road has reopened.
- `points`: one entry per km point or stretch the notice names, with:
  - `km` (number) and, for a stretch, `km_end`;
  - `extent`: `at` for a hazard at a point, `beyond` for "past", "beyond" or "no access at" a point (travel past it is blocked), `range` for "between X and Y km" or "from X to Y km", `whole_road` when the notice closes the whole road, `unknown` if the text does not say;
  - `status`: `closed` (closed, no access, impassable), `restricted` (restricted access, access control), `gated`, `washout` (a washout that blocks travel), `bridge_out` (bridge or structure out or closed), `deactivated`, or `caution` (hazards to drive with care: cracks, erosion, rockfall, debris, narrow road, a washout you can drive around);
  - `quote`: the full sentence the point comes from, copied exactly.
  A closure with no km point gets one entry with `km` null and `extent` `whole_road` or `unknown`.

Rules:

1. Every field you fill must have an entry in `quotes` (`road.name`, `road.file_section`, `posted_on`, `rescinded`) with the exact words it came from; each point carries its own `quote`. A value whose quote is not found in the text is thrown away.
2. Never write coordinates or place km points yourself.
3. If a sentence names km points but you cannot tell the status, use the stricter reading only if the text supports it; otherwise leave the point out and add `points` to `uncertain`.
4. Return only the JSON.


## Schema

```json
{
 "type": "object",
 "properties": {
  "road": {
   "type": "object",
   "properties": {
    "name": {
     "type": "string"
    },
    "file_section": {
     "type": [
      "string",
      "null"
     ]
    }
   },
   "required": [
    "name",
    "file_section"
   ],
   "additionalProperties": false
  },
  "posted_on": {
   "type": [
    "string",
    "null"
   ]
  },
  "rescinded": {
   "type": "boolean"
  },
  "points": {
   "type": "array",
   "items": {
    "type": "object",
    "properties": {
     "km": {
      "type": [
       "number",
       "null"
      ]
     },
     "km_end": {
      "type": [
       "number",
       "null"
      ]
     },
     "extent": {
      "type": "string",
      "enum": [
       "at",
       "beyond",
       "range",
       "whole_road",
       "unknown"
      ]
     },
     "status": {
      "type": "string",
      "enum": [
       "caution",
       "restricted",
       "closed",
       "gated",
       "washout",
       "bridge_out",
       "deactivated"
      ]
     },
     "quote": {
      "type": "string"
     }
    },
    "required": [
     "km",
     "km_end",
     "extent",
     "status",
     "quote"
    ],
    "additionalProperties": false
   }
  },
  "quotes": {
   "type": "array",
   "description": "One entry per extracted field: the field path and the exact words of the source text it came from, copied verbatim.",
   "items": {
    "type": "object",
    "properties": {
     "field": {
      "type": "string"
     },
     "quote": {
      "type": "string"
     }
    },
    "required": [
     "field",
     "quote"
    ],
    "additionalProperties": false
   }
  },
  "uncertain": {
   "type": "array",
   "description": "Field paths the text does not settle. Leave those fields null.",
   "items": {
    "type": "string"
   }
  }
 },
 "required": [
  "road",
  "posted_on",
  "rescinded",
  "points",
  "quotes",
  "uncertain"
 ],
 "additionalProperties": false
}
```

## Source

Source: District Manager notice DCK-d8b34b6d-807402_03_04_05_06_fs_301_-_fsr_discontinue_and_close (2026-10-19T17:14:32.712Z)

<source_text>
File:   FOR-11250-32/8074.02
        FOR-11250-32/8074.03
        FOR-11250-32/8074.04
        FOR-11250-32/8074.05
        FOR-11250-32/8074.05

March 31, 2025

BC Timber Sales Chinook
Business Area 46360
Airport Rd Chilliwack,
BC
V2P 1A5

Dear Trevor Shannon:

We are in receipt of BC Timber Sales, Chinook Business Area “Project Assurance Statements for Forest Service
Road Discontinue and Close FS301 Form” dated for reference March 31, 2025. As all conditions for road tenure
closure therein have been fulfilled for use and deactivation of the Forest Service Roads listed in SCHEDULE “A”
network is hereby Discontinued and Closed.

                            Forest Service Road Discontinue and Close
                                           SCHEDULE “A”
 File: FOR-11250-32/8074.02 FOR-11250-32/8074.03, FOR-11250-32/8074.04, FOR-11250-32/8074.05, FOR-
                                          11250-32/8074.05
                  FSR Name/Project Number                           FSR                      Section
                                                                   Branch
                                                                    No.                      km to km
             Anderson 7300 (8074.02)                                 02
                                                                                     0+000              0+209
             Anderson 7500 (8074.03)                                 03
                                                                                     0+000              0+322
             Anderson 7400 (8074.04)                                 04
                                                                                     0+000              0+378
             Anderson 7600 (8074.05                                  05
                                                                                     0+000              0+794
             Anderson 8900 (8074.06)                                 06
                                                                                     0+000              0+222

If you have any questions regarding this Forest Service Road Discontinue and Closure, please contact the Chilliwack
District Engineering Officer at 604-702-5700.

Sincerely,


Mike Peters
District Manager
Chilliwack Natural Resource District



Ministry of Forests                           Chilliwack Natural Resource District            46360 Airport Road
                                                                                              Chilliwack BC V2P 1A5
                                                                                              Phone: (604) 702-5700
                                                                                              Fax:     (604) 702-5711
CC:
      FLAG@gov.bc.ca
      Brock.Anderson@gov.bc.ca
      ForestTenuresBranch@gov.bc.ca
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       ³
                                                                                                                                                                                                                                                                                                                    !


                                                                                                                                                                                                                                                                                          A nd
                                                                                                                                                                                                                                                                                                 er                                                                          13




                                                                                                                                                                                                                                                                                                                                                            An
                                                                                                                                                                                                                                                                                                      so




                                                                                                                                                                                                                                                                                                                                                              de
                                                                                                                                                                                                                                                                                                                         A nd e
                                                                                                                                                                                                                                                                                                           n
                                                                                                                                                                                                                                                                                                               N




                                                                                                                                                                                                                                                                                                                                                                rs
                                                                                                                                                                                                                                                                                                                i
              T i w a l us
                                                                                                                                                                                                                                                                                                                                                                         12




                                                                                                                                                                                                                                                                                                                                                                  on
                                                                                                                                                                                                                                                                                                                               r so
                                                                                                                                                                                                                                                                                                               ne
                                                                                                                                                                                                                                                                                                                        AN




                                                                                                                                                                                                                                                                                                                                                                    FS
                 k



                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         MINISTRY OF FORESTS




                                                                                                                                                                                                                                                                                                                                   n F
                                                                                                                                                                                                                                                                                                                           D




                                                                                                                                                                                                                                                                                                                    F




                                                                                                                                                                                                                                                                                                                                                                         R
                                                                                                                                                                                                                                                                                                                    S
                                                                                                                                                                                                                                                                                                                     R




                                                                                                                                                                                                                                                                                                                                                                                       A nd er
                                                                                                                                                                                                                                                                                                                                       SR
                                                                                                                                                                                                                                                                                                                                       E 8 07
                                                                                                                                                                                                                                                                                                                                        RS 4 .
                                                                                                                                                                                                                                                                                                                                          -




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       3. 567
                                                                                                                                                                                                                                                                                                                                            O N 09




                                                                                                                                                                                                                                                                                                                                                                                           so n
                                                                                                                                                                                                                                                                                                                                                1 00




                                                                                                                                                                                                                                                                                                                                                                                             R iv




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          7
                                                                                                                                                                                                                                                                                                                                             00




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   R0 1 6
                                                                                                                                                                                                                                                                                                                                                                                                er




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        9
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     56
                                                                                                                                                                                                                                                                                                                                                                                                   F
                                                                                                                                                                                                                                                                                                                                      0




                                                                                                                                                                                                                                                                                                                                                                                                     SR




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  3.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    67
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               Schedule A map




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         1
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      R0
                                                                                                                                                                                                                                                                                                                                   10




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        Occupancy Agreement




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    60
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    3. 5
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     67  1
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      R0




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           7 3. 563
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             4

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        BCTS Responsibility:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 56
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      3.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           67




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              R0




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     R 01 6
                                                                                                                                                                                                                                                         
</source_text>

Return the JSON for this text.
