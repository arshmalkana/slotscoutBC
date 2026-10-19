# Extraction task road_notice-b22a04d8b8a1 (run 1)

Write your answer to `queue/answers/run1/road_notice-b22a04d8b8a1.json` as:

```json
{ "task_id": "road_notice-b22a04d8b8a1", "run": 1, "mode": "agent", "model": "<your model id> (Claude Code)", "prompt_version": "road_notice.v1", "schema_id": "road_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/road_notice.v1.json... } }
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

Source: District Manager notice DSI-5f111aca-kmu_gate_location_overview_map (2026-10-19T18:10:22.979Z)

<source_text>
0                                                                                              L1
                                                                                                                                                                                                            30                                                                                                                                                                                                                                              50 0




                                                                                                     SUB2300




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        KMU Gate Location
                                                                                                                                                                                                                                                                                                                                                                                        CE083
                                                                                                                                                                                                                                                                                                                                             CE300




         ±
                                                                                                                                                                                                                                                                                                                  BM                                                                                                                                                                                  2F
                                                                                                                            Port Alberni                                                                       0                                                                                                    22                                                                                                                                                                          20                                                                 CE210
SUL


                                                                                                                                                                                                            10                                                                                                             01
                                                                                                                ^                                                                                     BM
                                                                                                                                                                                                        2                                                                                                                                                                                                                                                                                     CE




                                                              1 00




                                                                                                                                                                                                                                                                                                            BM2200A
                                              L1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                0D
                    1: 300,000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             500                                                                             21
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         CE




                                                                                                                                                                                                                                                                                                                                           0
                                                                                                                                                                                                                                                                                                                        1 00




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     CE210
                                                                                                                                                                                                                                                                                                                                         40
                    Inset Map




                                                                                                                                                                                                                                                                                                                                       CE
                                                                                                                        SUB2




                                                                                                                                                                                                                                                           10
                                                                                                                             300                                                               20 0                                                                                                                                                                                                                                                                              CE202E
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   LOCATION MAP




                                                                                                                                                                                                                                                         21
                                    SU91                                                                                                                                                                                                                                                                              100




                                                                                                                                                                                                                                                                                                                                                              01
                                         0




                                                                                                                                                                                                                                                       BM




                                                                                                                                                                                                                                                                                                                                                          CE2
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 KMU10 Gate Location
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      5
          ^       Point of Interest
         SU912 HFN Traditional Territory                                                                                                                                           BM2
                                                                                                                                                                                       300                                                                                                                                                                                                                                                                    CE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                202                                                          CE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               21
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    0A




                                                                                                                                                            40
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      D                                                                          ForestCRegion:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        E2        Coast



                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ±


                                                                                                                                                     23
                                                                                                                                                                                                                                                        100




                                                                                                                                                                                                                                                                         80
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   6                                             Forest District: South Island   Scale:




                                                                                                         SU941A




                                                                                                                                                   BM
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                10A




                                                                                                                                                                                                                                                                     22
                                                                                                                        SU941                                                                                                                                                                                                                                           0   2                                                                                                               2                                                    Land District: Barclay




                                                                                                                                                                                                                                                                   BM
                                                                                                                                                                                                                                                                                                                                                                     E2                                                                                                                   CE
                                                                                                                                                                                                                          BM2320                                                                                                                                    C                                                                                                                                                                            Cascades: West C
                           SU922A




                                            SU9
                                                20                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               Tenure: N1A                     1:20,000 CE211C




                                                                                                                                                                                                                                                                                                                                                                                                                                                                          CE21




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               CE2
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 Geographic Coordinates:
             SU913




                                                                                                                                                                                                                                                                                                                                                                                                                                               CE202B
                                                                                                                                                                    5                                                                                                                                                                                                                                                                                                                                                                            Lat: 48° 49' 03"
                                                                                                                                                              94                                                                                                                                                                                                                                                                                                                                                                                                                  Datum: NAD83




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   10
                                                                                          SU900




                                                                                                                                                                                                                                     BM
                                                                                                                                 L1                                                                                                                                                                                                                                                                        5 00
                1




                                                                                                                                                                                                                                                                                                                                                                                                                                                                               0A7
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            CE210A4
              2A




                                                                                                                                                            SU                                                                                                                                              Pachena Lake                                                                                                          CE                                                                                                                                           Mapsheet: 92C.085




                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    A3
                                                                                                                                                                                                                                       23
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 Long: 125° 01' 18"
           92




                                                                                                                                                                                                                                                                                                                                                                                                                                    20
                                                                                                                                                                                                                                          10




                                                                                                                                                                                                                                               11
                                                                                                                                                                                                                                                                                                                                                                                                                                         2B                                                                                                      Author:D. Hiller              Map Revision: 1a
         SU




                                      SU                                                                       SU




                   
</source_text>

Return the JSON for this text.
