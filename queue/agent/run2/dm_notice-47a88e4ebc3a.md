# Extraction task dm_notice-47a88e4ebc3a (run 2)

Write your answer to `queue/answers/run2/dm_notice-47a88e4ebc3a.json` as:

```json
{ "task_id": "dm_notice-47a88e4ebc3a", "run": 2, "mode": "agent", "model": "Claude Code agent mode, fresh subagent", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
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

- `raw/2026-10/dm_notices/images/DCK-79c52629-fs301_december_13_2024.p1.jpg` (page 1)
- `raw/2026-10/dm_notices/images/DCK-79c52629-fs301_december_13_2024.p2.jpg` (page 2)
- `raw/2026-10/dm_notices/images/DCK-79c52629-fs301_december_13_2024.p3.jpg` (page 3)
- `raw/2026-10/dm_notices/images/DCK-79c52629-fs301_december_13_2024.p4.jpg` (page 4)
- `raw/2026-10/dm_notices/images/DCK-79c52629-fs301_december_13_2024.p5.jpg` (page 5)

## Source

Source: District Manager notice DCK-79c52629-fs301_december_13_2024 (2026-10-19T19:58:37.818Z)

<source_text>
Source: https://www2.gov.bc.ca/assets/gov/farming-natural-resources-and-industry/natural-resource-use/resource-roads/local-road-safety-information/chilliwack/fs301_december_13_2024.pdf
Fetched: 2026-10-19T19:58:37.818Z
SHA-256: c829228ee6380245b6e8223eb1e77c1a99847b2f14f49d062f5b90fa528320da
Read: text layer (5 pages); OCR by tesseract 5.3.4 on pages 2, 3, 4; 5 map or scan page images for reading
Images: raw/2026-10/dm_notices/images/DCK-79c52629-fs301_december_13_2024.p1.jpg raw/2026-10/dm_notices/images/DCK-79c52629-fs301_december_13_2024.p2.jpg raw/2026-10/dm_notices/images/DCK-79c52629-fs301_december_13_2024.p3.jpg raw/2026-10/dm_notices/images/DCK-79c52629-fs301_december_13_2024.p4.jpg raw/2026-10/dm_notices/images/DCK-79c52629-fs301_december_13_2024.p5.jpg

  FS301 Form

  Forest Service Road Discontinue and Close Form

  This form is used to Discontinue and Close a Forest Service Road in accordance
  with the provisions of Section 121 (9) of the Forest Act.
  File No. FSR Project No.
  FOR-11250-32/8124.03
  FOR-11250-32/8144.02
  FOR-11250-32/9352.01
  FOR-11250-32/9703.02


RESPONSIBLE PROGRAM:  Natural Resource Operations  BCTS X

Chilliwack Forest Natural Resource District / Chinook Business Area

FSR NAME and identified in the following manner:

  CANTELON 8400 - (8124.03): 0+000 to 1+861
  EIGHT MILE 5700 - (8144.02): 0+000 to 0+700
  ELEVEN MILE – (9352.01): 0+000 to 3+580
  SOUTH AINSLIE TWO – (9703.02): 0+000 to 2+418

on the attached documents or Exhibit A sketch dated December 12, 2024

DISCONTINUANCE AND CLOSURE APPROVED
Please check to indicate the type of notice[s] that was given.
Please indicate the date or dates of notification: December 13, 2024.
_x_  District website  ____  District Notice Board  _____ Press Release /
__  Stakeholder letter  ____  On-Site Signage  Press Package
__  Newspaper  _ ___  Email Distribution List  _____ Radio
__  TV ad  ____  FLNR website  _ ____ Gov BC Website
__  Other [Please summarize]




District Manager  Effective Date
  Dec 17, 2024
Date Signed

Distribution: Senior Project Manager, Forest Land Acquisitions, Forest Tenures Branch, Victoria.
Please attach a copy, photograph or summary of the Notice.
FS 301 HTH

  Exhibit A
  Legend

  Active Forest Road Sections - Colour Th
  tilecache



  CANTELON 8400 - (8124.03):
  Discontinue and Close Section
  0+000 to 1+861




0  0.20  0.41 km



  1: 10,000

  Copyright/Disclaimer
The material contained in this web site is owned by the
Government of British Columbia and protected by
copyright law. It may not be reproduced or redistributed
without the prior written permission of the Province of
British Columbia. To request permission to reproduce
all or part of the material on this web site please
complete the Copyright Permission Request Form
which can be accessed through the Copyright
Information Page.
CAUTION: Maps obtained using this site are not
designed to assist in navigation. These maps may be
generalized and may not reflect current conditions.
Uncharted hazards may exist. DO NOT USE THESE
MAPS FOR NAVIGATIONAL PURPOSES.



Datum:  NAD83
Projection: WGS_1984_Web_Mercator_Auxiliary
  _Sphere


  Key Map of British Columbia

  Exhibit A

  Legend

  Active Forest Road Sections - Colour Th
  tilecache


  EIGHT MILE 5700 - (8144.02):
  Discontinue and Close Section
  0+000 to 0+700




0  0.18  0.4 km



  1: 9,028


  Copyright/Disclaimer
The material contained in this web site is owned by the
Government of British Columbia and protected by
copyright law. It may not be reproduced or redistributed
without the prior written permission of the Province of
British Columbia. To request permission to reproduce all
or part of the material on this web site please complete
the Copyright Permission Request Form which can be
accessed through the Copyright Information Page.

CAUTION: Maps obtained using this site are not designed
to assist in navigation. These maps may be generalized
and may not reflect current conditions. Uncharted hazards
may exist. DO NOT USE THESE MAPS FOR
NAVIGATIONAL PURPOSES.



Datum:  NAD83
Projection:  WGS_1984_Web_Mercator_Auxiliary_Sp
  here



  Key Map of British Columbia

  Exhibit A

  Legend

  Active Forest Road Sections - Colour Th
  tilecache



  ELEVEN MILE – (9352.01):
  Discontinue and Close Section
  0+000 to 3+580




0  0.41  0.8 km



  1: 20,000


  Copyright/Disclaimer
The material contained in this web site is owned by the
Government of British Columbia and protected by
copyright law. It may not be reproduced or redistributed
without the prior written permission of the Province of
British Columbia. To request permission to reproduce all
or part of the material on this web site please complete
the Copyright Permission Request Form which can be
accessed through the Copyright Information Page.

CAUTION: Maps obtained using this site are not designed
to assist in navigation. These maps may be generalized
and may not reflect current conditions. Uncharted hazards
may exist. DO NOT USE THESE MAPS FOR
NAVIGATIONAL PURPOSES.



Datum:  NAD83
Projection:  WGS_1984_Web_Mercator_Auxiliary_Sp
  here



  Key Map of British Columbia

  Exhibit A

  Legend

  Active Forest Road Sections - Colour Th
  tilecache


  SOUTH AINSLIE TWO –
  (9703.02):
  Discontinue and Close Section
  0+000 to 2+418




 0  0.41  0.8 km



  1: 20,000.00

  Copyright/Disclaimer
 The material contained in this web site is owned by the
 Government of British Columbia and protected by
 copyright law. It may not be reproduced or redistributed
 without the prior written permission of the Province of
 British Columbia. To request permission to reproduce
 all or part of the material on this web site please
 complete the Copyright Permission Request Form
 which can be accessed through the Copyright
 Information Page.

 CAUTION: Maps obtained using this site are not
 designed to assist in navigation. These maps may be
 generalized and may not reflect current conditions.
 Uncharted hazards may exist. DO NOT USE THESE
 MAPS FOR NAVIGATIONAL PURPOSES.


Datum:  NAD83
Projection:  WGS_1984_Web_Mercator_Auxiliary_Spher
  e



  Key Map of British Columbia

[Page 2: text read by OCR from the page image]
6)
)
6
at
Dp

gi2*

AL

BRITISH

Ma~ COLUMBIA

Exhibit A
Legend

Active Forest Road Sections
tilecache

CANTELON 8400 - (8124.03):
Discontinue and Close Section
0+000 to 1+861

0 0.20 0.41 km

|

1: 10,000

Copyright/Disclaimer

The material contained in this web site is owned by the
Government of British Columbia and protected by
copyright law. It may not be reproduced or redistributed
without the prior written permission of the Province of
British Columbia. To request permission to reproduce
all or part of the material on this web site please
complete the Copyright Permission Request Form
which can be accessed through the Copyright
Infarmatinn Pane

CAUTION: Maps obtained using this site are not
designed to assist in navigation. These maps may be
generalized and may not reflect current conditions.
Uncharted hazards may exist. DO NOT USE THESE
MAPS FOR NAVIGATIONAL PURPOSES.

Datum: NAD83

Projection: WGS_1984_Web_Mercator_Auxiliary
_Sphere

Key Map of British Columbia

[Page 3: text read by OCR from the page image]
8144-01

an

BRITISH

Raed COLUMBIA
Exhibit A

Legend

Active Forest Road Sections
tilecache

EIGHT MILE 5700 - (8144.02):
Discontinue and Close Section
0+000 to 0+700

0.4 km

Copyright/Disclaimer

The material contained in this web site is owned by the
Government of British Columbia and protected by
copyright law. It may not be reproduced or redistributed
without the prior written permission of the Province of
British Columbia. To request permission to reproduce all
or part of the material on this web site please complete
the Copyright Permission Request Form which can be
accessed through the Copyright Information Page.

CAUTION: Maps obtained using this site are not designed
to assist in navigation. These maps may be generalized
and may not reflect current conditions. Uncharted hazards
may exist. DO NOT USE THESE MAPS FOR
NAVIGATIONAL PURPOSES.

Datum: NAD83

Projection: WGS_1984_Web_Mercator_Auxiliary_Sp
here

Key Map of British Columbia

[Page 4: text read by OCR from the page image]
aw
9
oe

Bm

yo20vo"

naan 4

R229,
03 Ey

BRITISH

Raed COLUMBIA
Exhibit A

Legend

Active Forest Road Sections
tilecache

ELEVEN MILE — (9352.01):
Discontinue and Close Section
0+000 to 3+580

0 0.41 0.8 km

1: 20,000

Copyright/Disclaimer

The material contained in this web site is owned by the
Government of British Columbia and protected by
copyright law. It may not be reproduced or redistributed
without the prior written permission of the Province of
British Columbia. To request permission to reproduce all
or part of the material on this web site please complete
the Copyright Permission Request Form which can be
accessed through the Copyright Information Page.

CAUTION: Maps obtained using this site are not designed
to assist in navigation. These maps may be generalized
and may not reflect current conditions. Uncharted hazards
may exist. DO NOT USE THESE MAPS FOR
NAVIGATIONAL PURPOSES.

Datum: NAD83

Projection: WGS_1984_Web_Mercator_Auxiliary_Sp
here

Key Map of British Columbia
</source_text>

Page images of the map or scan pages are attached (page 1, page 2, page 3, page 4, page 5). Look at them as well as the text.

Return the JSON for this document.
