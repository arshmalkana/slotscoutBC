# Extraction task road_notice-44f890b070df (run 2)

Write your answer to `queue/answers/run2/road_notice-44f890b070df.json` as:

```json
{ "task_id": "road_notice-44f890b070df", "run": 2, "mode": "agent", "model": "<your model id> (Claude Code subagent)", "prompt_version": "road_notice.v1", "schema_id": "road_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/road_notice.v1.json... } }
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

Source: District Manager notice DSE-c3a0aaa8-incomappleux_road_deactivation_prescription_overview_2024_contour_new (2026-10-19T17:14:43.440Z)

<source_text>
114D




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          N
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     50°51'
                                                                                                                                               R0691
                  449500
                    117°43'
                          W   450000
                                   117°42'
                                         30"
                                           W   450500      1
                                                           17°42'
                                                                W          451000           1
                                                                                            17°41'
                                                                                                 30"
                                                                                                   W   451500             17°41452000
                                                                                                                          1    '
                                                                                                                               W                           1
                                                                                                                                                           17452500
                                                                                                                                                              ° 40'
                                                                                                                                                                  30"
                                                                                                                                                                    W                                 453000
                                                                                                                                                                                                         117°40'
                                                                                                                                                                                                               W                                       453500117°39'
                                                                                                                                                                                                                                                                   30"
                                                                                                                                                                                                                                                                     W                                                     454000                   1
                                                                                                                                                                                                                                                                                                                                                    17°39'
                                                                                                                                                                                                                                                                                                                                                         W            454500                 1
                                                                                                                                                                                                                                                                                                                                                                                             17°38' W 455000
                                                                                                                                                                                                                                                                                                                                                                                                  30"                                    1  455500
                                                                                                                                                                                                                                                                                                                                                                                                                                         17°38'
                                                                                                                                                                                                                                                                                                                                                                                                                                              W                       456000
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      1
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      17°37'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                           30"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                             W                 456500
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   117°37'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         W           457000 117°36'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  30"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    W      457500      1
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       17°36'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            W   458000                                1
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      17°35'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           30"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             W458500                              17°459000
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  1  35'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       W                                      459500
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              117°34'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    30"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      W                460000
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            1
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            17°34'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 W                                 460500              1
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       17°33'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            30"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              W




                                                                                                                                                                                                 4B
                                                                                                                                                                                               11
                                                                                                                                                                                             691




                                                                                                                                                                                                                                                                                                                                                                                                                  13A
                                                                                                                                                                                                                                                                                                                                                                             R0
                                                                                                                                                                                           R0




                                                                                                                                                                                                                                                                                                                                                                                                                RB
                                                                                                                                                                                                                                                                                                                                                                               691




                                                                                                                                                                                                                                                                                                                                                                                                               911
5633000




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  5633000
                                                                                                                                                                                                                           R
                                                                                                                                                                                                                            06




                                                                                                                                                                                                                                                                                                                                                                                 11
                                                                                                                                                                                                                                                                                                                                                                                                                                    Stephney




                                                                                                                                                                                                                                                                                                                                                                                                           R06
                                                                                                                                                                                                                              91
                                                                                                                                                                                                                              BR




                                                                                                                                                                                                                                                                                                                                                                                                           S PU
                                                                                                                                                                                                                                                                                                                                                                                   3B
                                                                                                                                                                                                                               1
                                                                                                                                                                                                                                AN


                                                                                                                                                                                                                                 14
                                                                                                                                                                                                                                                                                                                                                                                                                                      Creek                           Road Previousl
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   y Deactivated




                                                                                                                                                                                                                                  C




                                            
</source_text>

Return the JSON for this text.
