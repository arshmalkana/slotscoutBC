# Extraction task road_notice-31b09c8a8471 (run 1)

Write your answer to `queue/answers/run1/road_notice-31b09c8a8471.json` as:

```json
{ "task_id": "road_notice-31b09c8a8471", "run": 1, "mode": "agent", "model": "<your model id> (Claude Code)", "prompt_version": "road_notice.v1", "schema_id": "road_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/road_notice.v1.json... } }
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

Source: District Manager notice DCK-1379e235-radium_fsr_fs301 (2026-10-19T17:14:38.684Z)

<source_text>
FS301 Form

                                         Forest Service Road Discontinue and Close Form

    This form is used to Discontinue and Close a Forest Service Road in accordance
                  with the provisions of Section 121 (9) of the Forest Act.
                                                                               File No._______________
                                                                                       11250-32/5127.19
                                                                       FSR Project No. _______________
                                                                                       5127.19



RESPONSIBLE PROGRAM:                                   Natural Resource Operations ____
                                                                                   X                BCTS ____

Forest District __________________________________________________________
                 CHILLIWACK

Natural Resource District _________________________________________________
                           CHILLIWACK

FSR NAME ____________________________________________________________
              RADIUM
and identified in the following manner:
5127.19


on the attached document or Exhibit A sketch dated __________________
                                                   January 2, 2019



DISCONTINUANCE AND CLOSURE APPROVED
Please check to indicate the type of notice[s] that was given.
Please indicate the date or dates of notification: __________________________.
_____ District website                             ______ District Notice Board   _____ Press Release /
_____ Stakeholder letter                           ______ On-Site Signage               Press Package
_____ Newspaper                                    ______ Email Distribution List _____ Radio
_____ TV ad                                        ______ FLNR website              ✔
                                                                                  _____ Gov BC Website
_____ Other [Please summarize]                     _______________________________________________


Mike Peters                                                              January 2, 2019
----------------------------------------------------------               ---------------------------------------------
District Manager                                                         Effective Date
             Digitally signed by Mike Peters
             Date: 2019.01.02 15:57:36 -08'00'

___________________________________
Date Signed

Distribution: Senior Project Manager, Forest Land Acquisitions, Forest Tenures Branch, Victoria.
Please attach a copy, photograph or summary of the Notice.
FS 301 HTH
                                                                                                                        EXHIBIT A
MAP OF : FSR 5127 Retirement (shown in bold black)

FOREST REGION : RSC                     TSA :                           PULPWOOD AGREEMENT :   MGT UNIT TYPE : TIMBER SUPPLY
FOREST DISTRICT : DCK                   LAND DISTRICT : YDYD                                   AREA
                                                                                               MGT UNIT NO : 30

ESF SUBMISSION ID : 0                   SCALE : 1:5000 at ANSI A Size   UTM : 10               DRAWN BY : FTA
BCGS MAPSHEET NO : 92H.003              Length (Km): 1.003              NAD : NAD83            DATE : Jan 02, 2019



                                                                                                                                           Legend




                                                                                                                                5127.19 CHILLIWACK RIVER RADIUM (
                                                                                                                                Length: 1.0031 Km, R/W: 75 m )
                                                                                                                                PofC UTM10 611088, 5438849
                                                                                                                                PofT UTM10 611722, 5438170
</source_text>

Return the JSON for this text.
