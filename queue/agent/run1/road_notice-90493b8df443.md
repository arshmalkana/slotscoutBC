# Extraction task road_notice-90493b8df443 (run 1)

Write your answer to `queue/answers/run1/road_notice-90493b8df443.json` as:

```json
{ "task_id": "road_notice-90493b8df443", "run": 1, "mode": "agent", "model": "<your model id> (Claude Code)", "prompt_version": "road_notice.v1", "schema_id": "road_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/road_notice.v1.json... } }
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

Source: District Manager notice DCR-13a23bfb-johnhart_cw_nocamporder (2026-10-19T18:08:59.279Z)

<source_text>
Ministry of Forests, Lands, Natural Resource Operations and Rural Development



                                                               JOHN HART LAKE
                                                            COMMUNITY WATERSHED
                                      By Order of the Province of British Columbia, October 15, 2001




                                                                                                                 µ
        JOHN HART LAKE NO CAMPING AREA - DAY USE ONLY

        ROAD CLOSURE - NO MOTORIZED VEHICLE ACCESS
                                                                                                                                                                                                            0                  500                 1,000                                                   2,000
                                                                                                                                                                                                                                                                                                              m
        JOHN HART LAKE COMMUNITY WATERSHED
                                                                                                                                                                                                                                              1:35,000
!   !   TRANSMISSION LINES



                                                                                                                                                                                                                                                                                     Sn
                                                                                                                                                                                                                                                                                        o    wd
                                                                                                                                                                                        S now                                                                                                   e
                                                                                                                                                                                                        den
                                                                                                                                                                                                            F       o rest Trai l                                                                          d




                                                                                                                                                                                                                                                                                                     n
                                                                                                                                                                                                                                                                                                       R
                                                                                                                                                                                                                V              A          N                C             O                   U                     V


                                                                                                                                                                      L o s t

                                                                                                                                                                      L a k e




                                                                                                                                                   r L a ke
                                                                                                                                          s   te
                                                                                                                                       ew
                                                                                                                                  Br
                                                                                                                                                          Rd
                                                                                                                              d
                                                                                                                           yR
                                                                                                                      Ba
                                                                                                                  d
                                                                                                           la n
                                                                                                     o   ve
                                                                                             L




                                                                                                                                                                                                                                                                                                d
                                                                                                                                                                                                                                                     ELK FALLS




                                                                                                                                                                                                                                                                                              eR
                                                                                                                                                                                                                                                    PROVINCIAL




                                                                                                                                                                                                                                                                                           Lak
                                                                                                                                                                                                                                                       PARK




                                                                                                                                                                                                                                                                                        t er
                                                                                                                                                                                                                                                                                   ws
                                                                                                                                                                  H         A       R




                                                                                                                                                                                                                                                                               B re
                                                                                                                                                                                                T
                                                                                                                                                                                                                                                                                                                               C
                                                                                                                           N                                                                                                              L                                                M oo se
                                                                                                                                                                                                                                               A                                           F a l l s           D eer

                                                                                                                  H                                                                                                                                    K                                                       F a l l s
                                                                                                                                                                                                                                                               E
                                                                                                             O
                                                                                                                                                                                                                                                                       JOHN          HA RT
                                                                                                     J




                                                                                                                                                                                                                                                                                     D A M




                                  J     o h         n




                              H   a     r       t



                                  L a       k       e

                                                                                                                                                                                                                        I           S          L                A              N                       D
                                                                                                                                                                                                                                                                                                                                   !
                                                                                                                                                                                                                                                                                                 y
                                                                                                                                                                                                                                                                                       r   Hw
                                                                                                                                                                                                                                                                                                            !


                                                                                                                                                                                                                                                                               R   ive
                                                                                                                                                                                                                                                                          ld
                                                                                                                                                                                                                                                                                        !

                                                                                                                                                                                                                                                                       Go
                                                                                                                                                                                                                                                                        !
                                                                                                                                                                                                                                                                 8
                                                                                                                                                                                                                                                               y2
                                                                          C
                                                                                 A

                                                                                                                                                                                                                                                       Hw
                                                                                     M
                                                                                                                                                                                                                                                           !
                                                                                                                                                                                                                                                                       Pa




                                                                                         P
                                                                                             B
                                                                                                                                                                                                                                                                               i de
                                                                                                                                                                                                                                          !
                                                                                                 E
                                                                                                                                                                                                                                                                         rk




                                                                                                     L
                                                                                                                                                                                                                                                                                        Dr
                                                                                                                                                                                                                                                                             s




                                                                                                         L                                                                                                                      !
                                                                                                                                                                                                                                                   F               l     i          n
                                                                                                                                                                                                                    !
                                                                                                                                                                                                                                                                                                 t
                                                                                                                                                                                                    !
                                                                                                                                                                                                                                                                                                               o
                                                                                                                                                                                !                                                                                                                                          f


                                                                                                                                                                                                                            J ohn          d
                                                                                                                                                                                                                                    H art R
                                                                     R I V




                                                                                                                                                              !

                                                                                                                                                   !
                                                                           E R




                                                                                                                                  !

                                                                                                                  !
                                                                                                                                                                                                                                                                                                            d
                                                                                                 !! !




                                                                                             !
                                                                                                                                                                                                                                                                                                       tR




                                                                                             !

                                                                                                                                                                                    M cI v o
                                                                                                                                                                                                                                                                                                  u




                                                                                                                                                                                            rL
                                                                                                                                                                                                                                                                                                na




                                                                                                                                                                  CAMPGROUND


                                                                                                                                                                                                         ake
                                                                                                                                                                                                                                                                                              go




                                                                                                                                                                                                                    Rd
                                                                                                                                                                                                                                                                                           Ar
                                                                                         !




                                                                                 L A D ORE
                                                                                                                                                                        M       C       I       V       O       R
                                                                           !




                                                                                       D A M
                                                                 !




                                                                                                                                                                                    L       A   K        E                                             DUMP
                                                             !




                                                        !
</source_text>

Return the JSON for this text.
