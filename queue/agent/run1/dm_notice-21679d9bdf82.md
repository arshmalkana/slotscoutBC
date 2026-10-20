# Extraction task dm_notice-21679d9bdf82 (run 1)

Write your answer to `queue/answers/run1/dm_notice-21679d9bdf82.json` as:

```json
{ "task_id": "dm_notice-21679d9bdf82", "run": 1, "mode": "agent", "model": "Claude Code agent mode", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
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

- `raw/2026-10/dm_notices/images/DSI-5f111aca-kmu_gate_location_overview_map.p1.jpg` (page 1)

## Source

Source: District Manager notice DSI-5f111aca-kmu_gate_location_overview_map (2026-10-19T20:01:16.597Z)

<source_text>
0  L1
  30  50 0




  SUB2300




  KMU Gate Location
  CE083
  CE300




  ±
  BM  2F
  Port Alberni  0  22  20  CE210
SUL


  10  01
  ^  BM
  2  CE




  1 00




  BM2200A
  L1  0D
  1: 300,000  500  21
  CE




  0
  1 00




  CE210
  40
  Inset Map




  CE
  SUB2




  10
  300  20 0  CE202E
  LOCATION MAP




  21
  SU91  100




  01
  0




  BM




  CE2
  KMU10 Gate Location
  5
  ^  Point of Interest
  SU912 HFN Traditional Territory  BM2
  300  CE
  202  CE
  21
  0A




  40
  D  ForestCRegion:
  E2  Coast



  ±


  23
  100




  80
  6  Forest District: South Island  Scale:




  SU941A




  BM
  10A




  22
  SU941  0  2  2  Land District: Barclay




  BM
  E2  CE
  BM2320  C  Cascades: West C
  SU922A




  SU9
  20  Tenure: N1A  1:20,000 CE211C




  CE21




  CE2
  Geographic Coordinates:
  SU913




  CE202B
  5  Lat: 48° 49' 03"
  94  Datum: NAD83




  10
  SU900




  BM
  L1  5 00
  1




  0A7
  CE210A4
  2A




  SU  Pachena Lake  CE  Mapsheet: 92C.085




  A3
  23
  Long: 125° 01' 18"
  92




  20
  10




  11
  2B  Author:D. Hiller  Map Revision: 1a
  SU




  SU  SU




  CE211C1
  92  94  BM  23  3  Map Date: 07 -Jul -2026  Revised Date: dd-mmm-yyyy
  3  0  SU940
  231
  0A  BM
  2




  1  0
  92




  92  93
  SU
  SU




  SU




  CE209F
  BM2
  2
  94
  SU  -ext
  06  MAP LEGEND




  31
  0  CE2  CE209
  30  200
  SU924




  CE202B2




  3E
  Boundary Features:




  BM
  400




  100
  0




  100
  0




  Pachena River  06
  62
  2
  95




  CE
  208Falling Boundary




  KM100
  261
  2
  CE




  CE
  BM23
  SU




  BM2
  Hardline




  C
  )
  "
  1




  20
  0




  E2
  A  B
  10 0  202  206  Adjacent Block-Planned




  2I
  E




  0
  CE  CE




  312
  6C




  13




  9G
  0
  !  !
  621




  CE206A
  20




  0
  BM26
  Harvested
  !  !  !




  !
  21  CE




  BM2
  !  !
  BM2




  Legal Boundary
  !  !  !




  !
  00
  BM26
  33
  24  MAIN
  (CE)
  Rosseau Lake-L1B  Pruning
  B
  M
  CENT
  RAL  Feathering
  BM2621A  10  0
  CE207C Road Features:




  BM2460
  0




  A1




  9
  632  Built Road  209




  9A
  BM2  CE207B




  10
  10 0  3  CE20  CE




  20
  0  5  07  B1  Deactivated Road
  E2  CE2




  CE
  BM2520  C
  A
  07  B4
  KM  CE2  Resource Features:




  BM2500




  0
  BM2  4
  530




  KM5
  BM  12  Index Contour  200
  26  KM
  Intermediate Contour
  BM26




  CE209A3
  30
  1
  263  Riparian Features:




  B
  BM  BM25  KM122




  KM
  Pachena River
  00



  10
  Fish Streams (S1-S4)  S1




  A
  BM2750




  209
  Non Fish streams (S5, S6) S 5
  852229  KM  KM
  12
  0  Unclassified Creek




  CE
  BM  272  90  1
  260
  CP025  BM  KM
  Non Classified Drainage




  1
  0B




  110




  KM
  C1




  16
  15
  40  KM  0  Gully




  KM
  27




  KM
  100




  17
  30  BM  FSZ Stream  0




  0
  CE
  00
  A
  BM2700  BM27  KM  20 0  16
  2
  Reach Break/Fish Barrier  209  40
  26
  D  30  120
  A2




  0
  0  C1
  81  A  KM  KM  Stream IDK  1 "  1
  BM  !
  BM




  2




  200
  M163
  BM  Lakes/Wetlands:
  200
  27




  200  KM141
  Lakes
  KM164Class 1, 2, 3, 4
  10




  L1
  Sarita  Wetlands Class 1, 2, 3, 4, 5  W1
  B
BM




  BM
  M




  KM131
  1A1  Sensitive andKDesignated Areas:
  28




  Dryland Sort
  260




  28
  KMC



  H
  10




  11  KM  KM14  M16


  00
  20  3  WTRA  (((((




  C
  5
  0




  27
  ^  1
  Gate Location KM132




  KM
  BM  Timber Leave Area  (((((




  A
  0+050 KMU




  131
  BM
  Gross Area




  2
  B




  14
  11




  Lat:48 48 03 N




  KM
  276




  KM
  KM
  28




  Net Area
  BM




  0
  66
  Long: 125 01 18 W




  13
  0  31
  3  KM1
  280




  0
  852236  12
  A  BM  KM  852236  (K
  M)  HFN Private Lands
  28
  BM  CP024  MA
  IN
  BM281




  A  Treaty Settlement Lands
  W




  8
  KM310




  NA




  16
  A  400  HFN Community Forest K3N




  KM
  KM200B
  BM2812




  3




  KL
  M)  First Nations




  KM212
  (B
  IN
  MA  Woodland Licence N1A




  0
  KM




  KM16
  D  KM211
  IEL  4




  215
  MF  14
  BA  KM
  BM2905
  6
  30




  KM




  KM
  KM




  20
  KM



  32F




  210
  KM3




  0




  144
  0  08
  BM29
  301




  0  E  KM




  KM
  29  332  200




  C
  KM  C
  BM
  20  KM330  KM
  0




  D  33
  0




  00
  32




  1
  300




  3
  KM




  KM
  KM




  0D
  20
  0




  KM
  293




  KM




  KM340
  KM
  32
  BM




  5 00  KM  600
  2




  4  22
  MI11
  33




  KM3
  1
  81
  2E




  1




  220
  MI
  A  MI
  1




  32C
  34




  KM
  200




  8  0




  KM
  MI1
  KM




  0  0  14
  0
  MI1
  300




  MI110
  12




  113
  MI160
  I1




  KM




  MI
  M
  (MI)




  400




  300
  D




  240
  KM333




  KM353  L1  KM
  0
  MAIN




  MI100A
BL1




  500
  400
  21




  40
  4F




  350  261 0 0
  00




  A
  I1
  IGAN




  KM  KM  6
  33
  M




  332




  MAP 1 of 1
  KM




  32




  KM




  KM
  1B
  KM3




  26
  MICH




  35  Prepared By:
  1




  0
  KM351




  1B




  KM




  700
  02




  55
  35




  KM3
  MI1




  1A  8 00
  KM
  6




  35
  35




  KM
  0




  7
  KM
  15




  00
  L1
  MI100C




  MI




  PO Box 275
  MI14




  300




  #15-1010 Shearme Road
  0
  50  www.meridianforest.ca  Coombs, BC V0R 1M0  60
  0
  0




  KM
  206
</source_text>

Page images of the map or scan pages are attached (page 1). Look at them as well as the text.

Return the JSON for this document.
