# Extraction task road_notice-9ffa3ffacbe0 (run 1)

Write your answer to `queue/answers/run1/road_notice-9ffa3ffacbe0.json` as:

```json
{ "task_id": "road_notice-9ffa3ffacbe0", "run": 1, "mode": "agent", "model": "<your model id> (Claude Code)", "prompt_version": "road_notice.v1", "schema_id": "road_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/road_notice.v1.json... } }
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

Source: District Manager notice DSI-a9fec493-walbran700_gate_location_map_2026mar9 (2026-10-19T18:10:24.887Z)

<source_text>
Temporary Gate Locations Map                                                                                                                                                 ±
                                                                                                                                                                                                                                            1:25,000
                                                                                                                                                                                                      WA721A
                                                                                                                                                                                                                                                                A
                                                                                                                                                                                                                                                             23




                                                                                                                                                                                       0- PA O
                                                                                                                                                                                                                                          W A 723
                                                                                                                                                                                                                         W                                A7




                                                                                                                                                                       1 0 A -P A O
                                                                                                                                                                                                                 WA




                                                                                                                                        MA LURE
                                                                                                                                                )
                                                                                                                                                                                                                          A7
                                   60




                                                                                                                                              MC
                                                                                                                                                                                                                   721                                   W




                                                                         08
                                                                                                                                                                                                                             22                                   A
                                                                                                                                                                                                                                                                24
                                                  70
                                 WA




                                                                                                                                                                                                                       C



                                                                       A1
                                                                                                                                                                                                                                                             A7




                                                                                                                                          IN (
                                                                                        7                                                                                                 A                      W




                                                                                                                                                                                      71
                                                WA


                                                                                      10




                                                                                                                                         MC
                     2




                                                                    W
                                                                                                                                                                                      W                                                                    W
                                                                                    WA
                  A6




                                                                                                                                  PAO
                                1
                 W




                                                                                                                                                                                                                  A7
                             A6




                                                                                                                                                                     A7
                                                                                                                                                                                                                                                           WA
                            W                                                                                                                                                                                                                                   724




                                                                                                                                                                                                                    21
                                                                                                                           WA 600-




                                                                                                                                                          WA703

                                                                                                                                                                    W
                                                                                                                                                                                                                                                    WA7
                                                                                                                                                                             Gate on WA700 - Station 0+010                                             25




                                                                                                                                                                                                                                                                 WA
                                                                                                                                                                                                                                                                   725
                                                                                                                                                                                                                                                 B3
            Gate on Walbran Main - Station 11+600




                                                                                                                                                                                        1
                                                                                                                                                                                                         A




                                                                                                                                                                                      73




                                                                                                                                                                                                                                                                   A
                                                                                                                                                                                                      32




                                                                                                                                                                                                                                              29
                                                                                                                                                                                                                                                           B5
                                                                                                                                                                                                   A7                                                WA729




                                                                                                                                                                                 WA




                                                                                                                                                                                                                                           A7
                                                                                                                                    2
                                                                                                                                  70




                                                                                                                                                                         O
                                                                                                                                                                                                  W




                                                                                                                                                                                                                                          W
                                                                                                                                                                                       WA




                                                                                                                                                                                                                             8A WA728
                                                                                                                                                                     -PA
                                                                                                                               WA
                                                                                                                                                                                         73




                                                                                                                                                                                                                                                    W A 729B 4
                                                                                                                                                                                           1A


                                                                                                                            WA8




                                                                                                                                                                  700




                                                                                                                                                                                                    WA7 2
                                                                                                                                                                                                                         A
                                                                                                                                                                                                                  730




                                                                                                                                                                                                       3
                                                                                                        O




                                                                                                                                                                                                                                                                 WA
                                                                                                                                                   A                                                            WA




                                                                                                                                                             WA
                                                                                                     -PA



                                                                                                                                                 60
                                                                                                                                10-
                                                                                                                                               A7




                                                                                                                                                                                                                                            WA
                                                                                                                                                                     WA755




                                                                                                                                                                                                                                                                  729
                                                                                                                               PAO
                                                                                                500




                                                                                                                                                                                                                         WA72
                                                                                                                                                     0
                                                                                                                                                   76




                                                                                                                                                                                                                                             729
                                                                                                                                                                                                                                    WA729




                                                                                                                                                                                                                                                                     B 6A
                                                                                                                                         W
                                                                                              WA




                                                                                                                                                 WA
                 0               WA106A




                                                                                                                                                                                                    WA73
               A9




                                                                                                                                                                                                                                                 B
           W                                                                                                                                                                                  W
                                                                                                        O




                            WA106




                                                                                                                                                                                                                                        W
                                                                                                                                                                  WA770A
                                                                                                      -PA




                                                                                                                                                                                                                      WA7




                                                                                                                                                                                                        2B
                                                                                                                                            W A 761




                                                                                                                                                                                                                                         A7
                                                                                                                                                                                                                          36
                                                                                                                          2A




                                                                                                                                                                                              A7




                                                                                                                                                                                                                                            29
                                                                                                                        76
                                                                                                  820




                                                                                                                      WA




                                                                                                                                                                                                75




                                                                                                                                                                                                                                               A
                                                                                                WA
             WA103




                              105




                                                                                                                                                                                                       734
                                                      (W AN




                                                                                                                                 WA76




                           WA
                                                        A)




                                                                                                                                                  770
                                                                                                                                                             WA77




                                                                                                                                                                                                     WA
                                                  AI B R




                          WA104                                                                                                                                                                                                    WA
                                      B1




                                                                                                                                                                                                                                                    WA
                                                                                                                                                WA
                                                 M AL




                                                                                                                                                                                                                                     73
                                                                                                                                     2B
                                    10




                                                    N




                                                                                                                                                                                                                                       8



                                                                                                                                                                                              WA
                                                  W




                                                                                                                                                                                                                                                      720
                                                                                                                                                                 1B

                                                                                                                                               74
                                  A1




                                                                                                                                           W A7




                                                                                                                                                                                                                                             WA
                                                                                                                                                                       781


                                                                                                                                                                                                780
                                 W




                                                                                  O




             0                                                                                                        62                                             WA




                                                                                                                                                                                                                                                                 WA73
                                                                               PA




           10                                                                                                      A7




                                                                                                                                                                                                                                               730
       A                                                       40
                                                                         -




                                                                                                                                                                        WA781A
                                                                      00




   W                                                                                                              W                 WA773B
                 1
                                                                   A8
                   02




       WA
                                                             8




                                                                                                                                                                                                                                                                     9
            WA110A




                                                                                                                                 73
                                                           WA


                                                                  W
               10B




                                                                                                                                                                                                       W
                                                                                                                                                                                      781222
                                                                                                                                7
                                              WA




                                                                                                                              A      776
                                                                                                                                                                                                        A7
                                                                                                                                  WA
 WA




                                                                                                   62D
           W A1




                                                                                          C
                                                -BS




                                      
</source_text>

Return the JSON for this text.
