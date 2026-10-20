# Extraction task dm_notice-22dd748d910e (run 2)

Write your answer to `queue/answers/run2/dm_notice-22dd748d910e.json` as:

```json
{ "task_id": "dm_notice-22dd748d910e", "run": 2, "mode": "agent", "model": "Claude Code agent mode, fresh subagent", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
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

- `raw/2026-10/dm_notices/images/DQC-8d4c7fb4-bonanza_fsr_822907_closure.p2.jpg` (page 2)
- `raw/2026-10/dm_notices/images/DQC-8d4c7fb4-bonanza_fsr_822907_closure.p3.jpg` (page 3)

## Source

Source: District Manager notice DQC-8d4c7fb4-bonanza_fsr_822907_closure (2026-10-19T19:59:04.156Z)

<source_text>
Source: https://www2.gov.bc.ca/assets/gov/farming-natural-resources-and-industry/natural-resource-use/resource-roads/local-road-safety-information/haida-gwaii/bonanza_fsr_822907_closure.pdf
Fetched: 2026-10-19T19:59:04.156Z
SHA-256: d2c5d8259dec08390a02e5b1caf65ed57c548781e83408e27505d84ba2b8e7d6
Read: text layer (3 pages); OCR by tesseract 5.3.4 on pages 2, 3; 2 map or scan page images for reading
Images: raw/2026-10/dm_notices/images/DQC-8d4c7fb4-bonanza_fsr_822907_closure.p2.jpg raw/2026-10/dm_notices/images/DQC-8d4c7fb4-bonanza_fsr_822907_closure.p3.jpg

File:11250-32/8229.07 Bonanza


October 28, 2024


Notice is given under Section 22.2(3) of the Forest and Range Practices Act that the Bonanza
FSR (8229.07) is hereby closed at 14.0 km effective immediately until further notice.


Forest and Range Practices Act
Non-industrial use of a road

  22.2 (1)Subject to subsections (2) to (4) and to regulations respecting roads made
  under the Industrial Roads Act, a road that is
  (a)a forest service road, or
  (b)authorized under a road permit or a woodlot licence

  may be used by any person without charge for a purpose other than a timber harvesting
  purpose, silviculture purpose or natural resource development purpose.
  (2)The
  (a)district manager, for a forest service road, or
  (b)holder of a road permit or a woodlot licence, for a road under the permit
  or licence,

  may take action under subsection (3) if
  (c)use of the road under subsection (1) would likely
  (i)cause significant damage to the road,
  (ii)cause significant sediment delivery, or
  (iii)endanger property, public health or public safety, or
  (d)the presence on the road of a vehicle or animal would likely cause
  damage to the road or environment or endanger life or property.
  (3)In the circumstances described in subsection (2),
  (a)the district manager, for a forest service road, may
  (i)close the road or restrict its use, or
  (ii)remove a vehicle or an animal from the road at the expense of
  the owner of the vehicle or animal, and


Ministry of Forests  Haida Gwaii Natural Resource  Location:  Mailing Address:
  District  1229 Oceanview Drive  Box 39
  Daajing Giids BC  Gaajing Giids BC V0T 1S0
  Tel:  (250) 559-6200
  Fax:  (250) 559-8342

  (b)the holder of a road permit or a woodlot licence, for a road under the
  permit or licence,
  (i)with the prior consent of the minister, may close the road or
  restrict its use, or
  (ii)may remove a vehicle or an animal from the road at the expense
  of the owner of the vehicle or animal.

This action is in response to the washout of a creek crossing located at 14km posing a safety risk
to road users.
Thank you for your cooperation during this time.




Risha Rushton
District Manager




  Page 2 of 2

  Bonanza FSR 8229.07 CLOSURE


  ±
  NAD 1983 BC Albers
  Scale: 1:35,000
  District: DHG




  Bo
  Region: RWC




  na
  Location: Haida Gwaii




  nza
  FS
  R8
  Legend




  22
  9.0
  Closure Location




  7
  !

  Roads
  Hangover_closure
  Caveat:
  Road  Closure
  The Province of British Columbia
  makes no representation or
  warranties
  regarding the accuracy,
  merchantability, fitness for a
  particular purpose, or
  completeness of any information
FSR
 Han 229.06




  contained in or otherwise
  comprising this map.
  8
  gov




  Without limiting the foregoing, you
  er




  are warned not
  to use this map for navigational
  purposes.
  This map may be generalized and
  may not reflect current conditions.
  Uncharted hazards may exist.

  !




  State of Alaska,
  Esri Canada, Esri,
  TomTom,


  0  1  2
  Kilometers
  Date: Oct 28, 2024
  Drawn by: HGNRD

[Page 2: text read by OCR from the page image]
(b)the holder of a road permit or a woodlot licence, for a road under the
permit or licence,
(i)with the prior consent of the minister, may close the road or
restrict its use, or
(ii)may remove a vehicle or an animal from the road at the expense

of the owner of the vehicle or animal.
This action is in response to the washout of a creek crossing located at 14km posing a safety risk

to road users.

Thank you for your cooperation during this time.

Risha Rushton
District Manager

Page 2 of 2

[Page 3: text read by OCR from the page image]
Bonanza FSR 8229.07 CLOSURE

NAD 1983 BC Albers
Scale: 1:35,000
District: DHG

Region: RWC
Location: Haida Gwaii

Legend

ZA\ Closure Location
Roads

Hangover_closure

Caveat:

The Province of British Columbia
makes no representation or
warranties
regarding the accuracy,
merchantability, fitness for a
particular purpose, or
completeness of any information
contained in or otherwise
comprising this map.
Without limiting the foregoing, you
are warned not
to use this map for navigational
purposes.

This map may be generalized and
may not reflect current conditions.
Uncharted hazards may exist.

Kilometers
Date: Oct 28, 2024
Drawn by: HGNRD

h
</source_text>

Page images of the map or scan pages are attached (page 2, page 3). Look at them as well as the text.

Return the JSON for this document.
