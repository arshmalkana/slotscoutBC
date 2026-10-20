# Extraction task dm_notice-46ba800f14c9 (run 2)

Write your answer to `queue/answers/run2/dm_notice-46ba800f14c9.json` as:

```json
{ "task_id": "dm_notice-46ba800f14c9", "run": 2, "mode": "agent", "model": "Claude Code agent mode, fresh subagent", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
```

The answer must match `schema/dm_notice.v1.json` exactly. Use only the source text below and the page images listed. Never write coordinates. Every filled field needs its exact quote.

## Instructions

# dm_notice.v1

You read one document linked from a British Columbia natural resource district road safety page: a District Manager closure order, a notice that rescinds one, a gate location map, a road restriction bulletin, a deactivation notice, or something else (an inspection report, a news release, a flyer). Return every road it closes, restricts, gates or deactivates, in the JSON schema `dm_notice.v1`. Code places km points on the official road line; a person checks every reading before it counts on the map.

You get:

- the document's text: its text layer, followed by text read by OCR from pages that are pictures (each OCR page starts with `[Page N: text read by OCR from the page image]`);
- when the PDF has map or scan pages, images of those pages.

Read only this document. Do not use anything you know about the road from elsewhere.

How to use the page images:

- Read printed words the text missed: road names, file and section numbers, km labels, "Gate", "Closed", "Deactivated", legends and titles.
- See what the map marks: a gate symbol on a road, a stretch drawn as closed or deactivated, a closure point.
- Never write coordinates, never measure distances from the map or its scale, and never say where something is except by the words printed on the map. If the map marks a gate or closure with no km label, give the point with `km` null and `extent` `unknown`, and describe the mark in `map_readings`.

How to fill the fields:

- `legible`: false only if neither the text nor the images can be read at all; then leave `roads` empty and add `roads` to `uncertain`.
- `document_type`: what the document is.
- `signed_on`: the date it was signed or issued, as YYYY-MM-DD, or null.
- `rescinded`: true only if the document rescinds, lifts or cancels a closure, or says the road has reopened.
- `roads`: one entry per road the document closes, restricts, gates or deactivates (none for a document that closes nothing), with:
  - `name` as written, `file_section` ("5748.01", or the road file number such as "FSR 5833" written as "5833") or null, and `quote`: the exact words that name the road, from the text or printed on the map;
  - `effective_from` and `effective_to` as YYYY-MM-DD, or null;
  - `points`: one entry per km point or stretch, with `km`, `km_end`, `extent` (`at`, `beyond`, `range`, `whole_road`, `unknown`), `status` (`closed`, `restricted`, `gated`, `washout`, `bridge_out`, `deactivated`, `caution`), `seen_on` (`text` or `map`) and `quote`: the full sentence from the text, or the label printed on the map exactly as printed. A road closed with no km point gets one point with `km` null and `extent` `whole_road` or `unknown`.
- `map_readings`: for each marked place on a map page, the page number, the words printed there, and what the map shows there in plain words.

Rules:

1. Every filled top-level field (`signed_on`, `rescinded`) needs an entry in `quotes` with the exact words it came from. Each road and each point carries its own `quote`. Quotes are checked against the text and the OCR text; a value whose quote is not found is not counted, and a person checks it on the image instead.
2. Never write coordinates or place km points yourself.
3. If you cannot tell a point's status, use the stricter reading only if the document supports it; otherwise leave the point out and add the road's `points` to `uncertain`.
4. Return only the JSON.


## Schema

```json
{
 "type": "object",
 "properties": {
  "legible": {
   "type": "boolean",
   "description": "False only when neither the text nor the page images can be read at all."
  },
  "document_type": {
   "type": "string",
   "enum": [
    "closure_order",
    "closure_rescinded",
    "gate_map",
    "restriction_bulletin",
    "deactivation_notice",
    "other"
   ]
  },
  "signed_on": {
   "type": [
    "string",
    "null"
   ],
   "description": "Date the notice was signed or issued, as YYYY-MM-DD."
  },
  "rescinded": {
   "type": "boolean"
  },
  "roads": {
   "type": "array",
   "description": "Every road the document closes, restricts, gates or deactivates. Empty when it closes nothing.",
   "items": {
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
     },
     "quote": {
      "type": "string",
      "description": "The exact words that name this road, copied from the text or printed on the map."
     },
     "effective_from": {
      "type": [
       "string",
       "null"
      ]
     },
     "effective_to": {
      "type": [
       "string",
       "null"
      ]
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
        "seen_on": {
         "type": "string",
         "enum": [
          "text",
          "map"
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
        "seen_on",
        "quote"
       ],
       "additionalProperties": false
      }
     }
    },
    "required": [
     "name",
     "file_section",
     "quote",
     "effective_from",
     "effective_to",
     "points"
    ],
    "additionalProperties": false
   }
  },
  "map_readings": {
   "type": "array",
   "description": "What the page images show, one entry per marked place: the words printed there and what the map marks.",
   "items": {
    "type": "object",
    "properties": {
     "page": {
      "type": "integer"
     },
     "label": {
      "type": "string",
      "description": "The words printed on the map at that place, exactly as printed."
     },
     "shows": {
      "type": "string",
      "description": "What the map marks there, in plain words (no coordinates)."
     }
    },
    "required": [
     "page",
     "label",
     "shows"
    ],
    "additionalProperties": false
   }
  },
  "quotes": {
   "type": "array",
   "description": "One entry per filled top-level field (signed_on, rescinded): the exact words it came from.",
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
   "description": "Field paths the document does not settle. Leave those fields null.",
   "items": {
    "type": "string"
   }
  }
 },
 "required": [
  "legible",
  "document_type",
  "signed_on",
  "rescinded",
  "roads",
  "map_readings",
  "quotes",
  "uncertain"
 ],
 "additionalProperties": false
}
```

## Page images

Open each image with the Read tool and look at it before answering. Read the words printed on the map; never write coordinates or measure from the map.

- `raw/2026-10/dm_notices/images/DSI-2654b71d-camper_creek_mainline_gate_map.p1.jpg` (page 1)

## Source

Source: District Manager notice DSI-2654b71d-camper_creek_mainline_gate_map (2026-10-19T20:01:11.922Z)

<source_text>
Source: https://www2.gov.bc.ca/assets/gov/farming-natural-resources-and-industry/natural-resource-use/resource-roads/local-road-safety-information/south-island/camper_creek_mainline_gate_map.pdf
Fetched: 2026-10-19T20:01:11.922Z
SHA-256: ac272fba023684cbd2cc33edc0ffcd0b2e3588e71e5d715e92195f8463bfaa1f
Read: text layer (1 page); 1 map or scan page image for reading
Images: raw/2026-10/dm_notices/images/DSI-2654b71d-camper_creek_mainline_gate_map.p1.jpg

  1




  B
  0




  0A
  TR10D
  !
  (




  1
  16
  #
  I




  TR
  R5
  !
  (  Truck Road




  O
  CR EE K-01
  $
  1




  G
  A




  W FI-2 000
  10
  LO UP
  30  11 Blockade




  A
  TR
  T
  !
  (




  1
  R




  TR 1
  .




  WF
  I-2 0 3
  1
  1




  0
  TR.11




  UP
  A IN
  RM N




  OK
  O
  18  (2




  RI O R D
  !
  (  !




  HO
  M/L




  G D-5




  VE




  I
  G




  WF
  AN
  (4
  !


  GL 3
  3




  00
  BR




  0
  GL
  L


  M/L N
  WA

  B RA




  C
  W F I -4 0 0 0




  11
  32




  T R-
  3  -4  !
  (




  G
  Walbran Creek
  WA L
  W  43  30  50  00




  G
  4




  O
  90  G O-  0  00  53




  D
  0  GO  W FI-




  W1




  W F I- 4 00 0
  3
  - 43  1A




  -5 3 0 0
  00  00




  10
  32  41  Gordon River




  0




  R1
  T
  43  GO
  11
  20  O




  0
  W




  FI
  !
  (  G  TR




  A
  34




  4




  5
  0




  00
  00  !
  (




  GO
  0
  00  4




  0
  GO




  GO 4 3 3 2 F
  GO 4
  (4




  00
  WF I4
  !
  7




  A5
  07




  I - 41
  BU G  1A  0
  00




  AB O  11  -412
  T R1  FI  WF
  L-

  L -0




  O  TR
  G




  W
  G




  0 00




  M N
  WFI-4120




  32




  N
  20




  R DO
  0




  AI
  00
  43




  G1
  O




  00
  4 00 0




  R
  G  G E




  2
  (2




  O
  B




  00 U G
  V
  !




  U
  RI  M
  036




  B R3
  0
  00  7165
  (!
  (




  B
  0  20
  Walbran  !  0




  BUG




  5
  BU G
  TR11A5N




  TR11A




  0
  BU
  22




  BUG1
  4733
 L -5




  Creek  !
  (  G  AB




  G 00
 G




  O
  30
  O  BU G
  O  GO  AB O O  Braden Creek 80  !
 26
 !
 (  M
  /L
  BU
  G4  30
  00  M/L  (
  W




  00  0
  12  W FI 4 2 0
  (6
  A L M/L




  M




  0  W F I4 2 0 0
  GL  !
  BR




  7163




  BRADEN
  4732  ED




  9
  AN




  I NB




  M/L
  3200
  G O3 2  U
  M /L R G H




  1 00
  2  0
  (0
  !
  M




  24  GR




  GO 3
  GL




  GO
  !
  (  G
  k !
  L1
  G LAD




  0
  -2 2  12  20  GO  2
  AD




  00
  GL  A  D
  38  (




  BD 11
  GL




  GL
  !
  (  Lonely Doug
  -20




  R
  12




  31
  4
  12 L
  GL




  5
  22 G L 2




  0
  00
  12
  G




  GL
  13




  R
  -




  A
GL




  D
  12  12
  G




  D  D




  ED
  GR
  LA




  LA
  (6
  !




  IN /L
  10
  -2




  GO




  BU
  G
  0




  M
  01




  G ER
  -2




  R




  RG
  O
  50




  IV
  GR 2
  GL 12C4




  RD MA
  GL1 2C  0  0
  10




  H
  6




  ON I N
  GO  BD
  00




  11
  GL 1
  (6
  !  -5
  D
  (8 Braden
  0




  2C  !  4  Creek




  00




  E
  GR-1000  40
  !
  (  ED
  (4
  !  0
  GR 2




  Salamander  00
  G RI E R



  10
  4669  RI
  GR1000  0  !
  (  BD 20
  00  BD
  -2
  Lake
  000
  G




  2
  40 0  1608  00
  D2 0
  S ON




  0  G R -1
  14




  M/ EN
  0
  40
  130




  B
  AD
  S AD




  L
  M /L
  00




  7275




  BR
  (6
  G R I2
  GR 21




  !




  G O-
  Avatar BD 250
  00




  0




  10
  GR  0




  BD
  -1 0
  21




  GO




  00
  -1
  Grove
  0
  R - 11 0




  22
  21  2
  R




  BD  BD
  00
  42k
  !
  (




  00
  G




  G
  G R -1 2  0  2
  SA D 4 0 0




  SA
  D - 4 13  !
  (




  22
  BD
  BR -




  20
  CA  0




  50
  21
  M




  0
  D-4 1 5




  -0  GR -1 2 0




  40
  20




  0
  (4  SA D  0
  (0




  00
  !  MA IN
  !  (2
  !  (0
  44!
  R
  O
  #
  I
  SA




  B
  !
  (  BR
  M WN
  AI
  N S




  BR -30 00
  -  60
  (0  LO




  BR
  !  W
  00




  30
  ER  BR
  -6
  2
  BR




  00
  OW  00
  !
  (  Camper Creek Mainline
  NS
  M/
  BR
  -3  000
  2  L  00




  -3 10 0
  0
  !
  (




  BR
  31
  Gate Location - 1.0 km  BR -
  A M/L
  100 0




  30 0
  (6




  O
  M- 1  !




  WN
  K




  BR
  CA
  IN E E
  M-




  00  GO
  PA ND OR




  SM
  B R -3 0 2 0
  NL CR




  10  R
  E
  CA




  DO
  M-  5  46




  AIN
  10  !
  (  N
  M ER




  CA
  00




  A M -1300  1  RI
  00  P-  VE
  P-
  C




  P -0 80 5
  P




  C A M- 10 0 0
  -12




  CA
  AI




  0  R
  M




  05
  2




  P-1 1  MA
  P -200 0
  CA M




  IN
  70 0
  BR O -0
  C A M- 4 0 0 0
  C AM
  -3 0 00
  00 0
  (4 Camper Creek
  !  P-0
  8
  P-
  20
  1 1 P-2 01
  1


  (2 !
  !  (0  4627
  (0 !
  !  (6  00
  CA
  M2
  00
  21 P
  -  08
  21
  P-08 00 P-0 80 0
  P - 2 0 10
  P- 40 0 0 P-4000
  P-
  4611  P -0 8  4  10
  1 00  0  48
  M 20




  0
  C A 471 0
  4615  8  C
  AM
  2
  !
  (
  70  !
  (  C
  P-0 90  P-0900
  A




  00




  CA M 4  M  0
  0  CA 0  P - 09 0
  50
  50  P - 0 9 00  P-  !
  (  A R IN
  30




  0  P 09
  C AM 4 70  S5  200  20  IC M
  4638  00  Gordon River  PA C IF
  0




  0
  P  P-3
  4629
  S




  09
  20
 C A M 47 0
  0
  (2
  !  4632
  P -1
  03 0

  00
  10 00




  55
  4624
  SS




  P-




  SA NDS
  P-1 000




  TO N
  P-1 06 0
  P -1




  SAN  E M  06
  /L  0
  P-0




  DST  0
  O
  M /L N E
  (4
  !  95
  96




  P- 0  P-1070
  P-1 070
  0




  0  0
  90  0 96
  P-0  P-
  San Juan
  P-1000  River




  Forest Roads
  TFL 46
  Camper Creek Mainline Gate Location


  #
  I  Gate Location
  $
  Mainline  $
  1  Point of Interest
  Secondary Road  k  Cutblocks
  Overgrown Road
  Lake/River
  1:75,000  TFL 46 Boundary  0  0.5  1  2 Kilometers
  May 24, 2024
</source_text>

Page images of the map or scan pages are attached (page 1). Look at them as well as the text.

Return the JSON for this document.
