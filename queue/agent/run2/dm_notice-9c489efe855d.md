# Extraction task dm_notice-9c489efe855d (run 2)

Write your answer to `queue/answers/run2/dm_notice-9c489efe855d.json` as:

```json
{ "task_id": "dm_notice-9c489efe855d", "run": 2, "mode": "agent", "model": "Claude Code agent mode, fresh subagent", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
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

- `raw/2026-10/dm_notices/images/DSI-a9fec493-walbran700_gate_location_map_2026mar9.p1.jpg` (page 1)

## Source

Source: District Manager notice DSI-a9fec493-walbran700_gate_location_map_2026mar9 (2026-10-19T20:01:18.207Z)

<source_text>
Source: https://www2.gov.bc.ca/assets/gov/farming-natural-resources-and-industry/natural-resource-use/resource-roads/local-road-safety-information/south-island/walbran700_gate_location_map_2026mar9.pdf
Fetched: 2026-10-19T20:01:18.207Z
SHA-256: f6589c831ae56463f425d636378f69ae1eba5227c16ef641b7324a1cf9ada8dc
Read: text layer (1 page); 1 map or scan page image for reading
Images: raw/2026-10/dm_notices/images/DSI-a9fec493-walbran700_gate_location_map_2026mar9.p1.jpg

  Temporary Gate Locations Map  ±
  1:25,000
  WA721A
  A
  23




  0- PA O
  W A 723
  W  A7




  1 0 A -P A O
  WA




  MA LURE
  )
  A7
  60




  MC
  721  W




  08
  22  A
  24
  70
  WA




  C



  A1
  A7




  IN (
  7  A  W




  71
  WA


  10




  MC
  2




  W
  W  W
  WA
  A6




  PAO
  1
  W




  A7
  A6




  A7
  WA
  W  724




  21
  WA 600-




  WA703

  W
  WA7
  Gate on WA700 - Station 0+010  25




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
  A7  WA729




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
  A  WA




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
  0  WA106A




  WA73
  A9




  B
  W  W
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




  WA104  WA
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




  0  62  WA




  WA73
  PA




  10  A7




  730
  A  40
  -




  WA781A
  00




  W  W  WA773B
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




  A  776
  A7
  WA
 WA




  62D
  W A1




  C
  -BS




  80
  W
  62




  A
  102




  B7
  W
  WA 7
  T




  A7




  6B  D6
  A7
  O




  2
  A




  W




  D
  22  92
  73




  781218
  0-
  PA




  W A 85  WA
  WA




  A




  O
  W




  1
  2D6C
  A9
  A3




  WA92
  762
  A




  W
  WA300-P




  00




  1




  9 22D6C
  6B
  C2
  A




  W
  D
  22
  A910




  W
  W A 922D6


  D8
  A9




  A
  W A910-PAO




  781218
  W




  22
  A
  W




  WA92
  05
  WA9




  2D
  A9




  A3
  12




  W  WA922D4
  W A92 AO




  WA922
  0-P
  W
  A8




  A
  22  WA922B
  60




  A9  W A9
  W  22F
  W
  WA31




  A9
  W A90




  22
  WA




  WA311-PAO




  923
  F1




  WA
  2-PAO
  315




  W
  0-PAO




  A9
  B




  W A9




  22
  H2
  34
  W A3



  B




  A9
  311




  H
 Gate on WA900 - Station 0+372
  22  WA
  31




  W  9  92
  WA
  WA
  15




  WA932  2H
  1
  O
  A
  WA314A
  AO




  0-P
  W A 310-P




  100




  Legend  A1001
  W




  5
  WA934A




  WA  W  93
  A9
  WA




  WA
  34




  Constructed
  B1
  12
  40




  Located
  0
  Streams  13
  W




  250  A1
  WA1
  A1




  WA




  W
  0A




  W
  A1
  13 100




  Adjacent Blocks
  10




  940
  1
  A1
  W




  Parks & Protected Areas
  1




  WA
  18




  112


  0




  WA




  Waterbody  WA114
  12
WA3




  94




  0
  Date: 2026-03-18
  A1
  WA




  95
  1
  W




  0
</source_text>

Page images of the map or scan pages are attached (page 1). Look at them as well as the text.

Return the JSON for this document.
