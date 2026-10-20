# Extraction task dm_notice-dc364be6d8dc (run 2)

Write your answer to `queue/answers/run2/dm_notice-dc364be6d8dc.json` as:

```json
{ "task_id": "dm_notice-dc364be6d8dc", "run": 2, "mode": "agent", "model": "Claude Code agent mode, fresh subagent", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
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

- `raw/2026-10/dm_notices/images/DCK-42f99435-1045201_-_discontinue_and_close_with_exhibit_a.p1.jpg` (page 1)
- `raw/2026-10/dm_notices/images/DCK-42f99435-1045201_-_discontinue_and_close_with_exhibit_a.p2.jpg` (page 2)

## Source

Source: District Manager notice DCK-42f99435-1045201_-_discontinue_and_close_with_exhibit_a (2026-10-19T19:58:54.413Z)

<source_text>
FS301 Form

  Forest Service Road Discontinue and Close Form

  This form is used to Discontinue and Close a Forest Service Road in accordance
  with the provisions of Section 121 (9) of the Forest Act.
  File No._______________
  11250-32
  FSR Project No. _______________
  10452.01



RESPONSIBLE PROGRAM:  Natural Resource Operations ____
  x  BCTS ____

Forest District __________________________________________________________
  Chilliwack

Natural Resource District _________________________________________________
  Chilliwack

FSR NAME ____________________________________________________________
  Fifteen Mile
and identified in the following manner:
10452.01


on the attached document or Exhibit A sketch dated __________________
  2025-01-28



DISCONTINUANCE AND CLOSURE APPROVED
Please check to indicate the type of notice[s] that was given.
Please indicate the date or dates of notification: __________________________.
  2025-02-17

 ✔
_____ District website  ______ District Notice Board  _____ Press Release /
_____ Stakeholder letter  ______ On-Site Signage  Press Package
_____ Newspaper  ______ Email Distribution List _____ Radio
_____ TV ad  ______ FLNR website  _____ Gov BC Website
_____ Other [Please summarize]  _______________________________________________


----------------------------------------------------------  February 13, 2025
District Manager  ---------------------------------------------
  Effective Date
February 13, 2025
___________________________________
Date Signed

Distribution: Senior Project Manager, Forest Land Acquisitions, Forest Tenures Branch, Victoria.
Please attach a copy, photograph or summary of the Notice.
FS 301 HTH

  Exhibit A
  Province of British Columbia
MAP OF : 10452.01 (shown in bold black)  Legend
FOREST REGION : RSC  TSA : 30  APPLICANT : DCK  USE TYPE : Forest
FOREST DISTRICT : DCK  LAND DISTRICT : YDYD

BCGS MAPSHEET NO : 92H.044  SCALE : 1:5000 at ANSI A Size  UTM : 10  DRAWN BY : RRS
  NAD : NAD 83  DATE : 2025-01-28




  10452.01
  Station From: 0
  Station To: 0.517




  May not show all sections on Road Use Permit.
  Shows new or amended sections only.

[Page 2: text read by OCR from the page image]
BRITISH

Gea COLUMBIA

Province of British Columbia

Exhibit A

x |
|
oO |
el
ity
in
i,
g y
7
ov
ot
8
ir

DL 1674
4645380

570804

=,
i

/ Chilliwack Nat
2404267/o/ +610 /

/ forse /| /
/ / i‘ | F /

/ | Piaz39~ ||
/ [p5e47461 ||
of 14, TP 6, Roe 24

' 4501730)

i

|| | 2408507

Fy Ml TE
/ / 2490159 |

36167304 ||
9000673)

MAP OF : 10452.01 (shown in bold black) Legend
FOREST REGION : RSC TSA : 30 APPLICANT : DCK USE TYPE : Forest
FOREST DISTRICT : DCK LAND DISTRICT : YDYD
@¢~ = Road Use Permit Application
BCGS MAPSHEET NO : 92H.044 | SCALE : 1:5000 at ANSI A Size UTM : 10 DRAWN BY : RRS tt Retired Road Use Permit
NAD : NAD 83 DATE : 2025-01-28 < Station From
<@ Station To
([ _sTenure Feature
: ([_sRange
Seq 24, TP Om
Se {— - #570 (1 sProvincial Forest
a ri F) 77 Forest Service Road
ae im {> i . ~~ Highway
| ' ~~ Municipal Road
\ | 77 Non Status Road
ye, ~~ Recreation Trails
| 77 Road Permit
72 SUP Road
77 Right of Way
] 7/7 Schedule B CP Road
@ = Mineral Tenure Points
2400002 ome
| [=] | Waterbodies
| /~ — River/Stream
| “Coastline / Island
10452.01

Station From: 0
Station To: 0.517

May not show all sec
Shows new or amended sections only.

i i
tions on Road Use Permit.

Fl gio df

a a
</source_text>

Page images of the map or scan pages are attached (page 1, page 2). Look at them as well as the text.

Return the JSON for this document.
