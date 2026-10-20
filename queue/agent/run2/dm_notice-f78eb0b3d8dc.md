# Extraction task dm_notice-f78eb0b3d8dc (run 2)

Write your answer to `queue/answers/run2/dm_notice-f78eb0b3d8dc.json` as:

```json
{ "task_id": "dm_notice-f78eb0b3d8dc", "run": 2, "mode": "agent", "model": "Claude Code agent mode, fresh subagent", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
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

- `raw/2026-10/dm_notices/images/DCK-1f93b9e0-cypress_lake_fsr_fs301.p1.jpg` (page 1)
- `raw/2026-10/dm_notices/images/DCK-1f93b9e0-cypress_lake_fsr_fs301.p2.jpg` (page 2)

## Source

Source: District Manager notice DCK-1f93b9e0-cypress_lake_fsr_fs301 (2026-10-19T19:58:47.048Z)

<source_text>
Source: https://www2.gov.bc.ca/assets/gov/farming-natural-resources-and-industry/natural-resource-use/resource-roads/local-road-safety-information/chilliwack/cypress_lake_fsr_fs301.pdf
Fetched: 2026-10-19T19:58:47.048Z
SHA-256: e7ed9ce03e5fe1b67ae7ed4c965b60d5475b499d7fce3cb8f2caa78547868334
Read: text layer (2 pages); OCR by tesseract 5.3.4 on page 2; 2 map or scan page images for reading
Images: raw/2026-10/dm_notices/images/DCK-1f93b9e0-cypress_lake_fsr_fs301.p1.jpg raw/2026-10/dm_notices/images/DCK-1f93b9e0-cypress_lake_fsr_fs301.p2.jpg

  FS301 Form

  Forest Service Road Discontinue and Close Form

  This form is used to Discontinue and Close a Forest Service Road in accordance
  with the provisions of Section 121 (9) of the Forest Act.
  File No._______________
  11250-32/8337.01
  FSR Project No. _______________
  8337.01



RESPONSIBLE PROGRAM:  Natural Resource Operations ____
  X  BCTS ____

Forest District __________________________________________________________
  CHILLIWACK

Natural Resource District _________________________________________________
  CHILLIWACK

FSR NAME ____________________________________________________________
  CYPRESS LAKE
and identified in the following manner:
8337.01


on the attached document or Exhibit A sketch dated __________________
  December 18, 2018



DISCONTINUANCE AND CLOSURE APPROVED
Please check to indicate the type of notice[s] that was given.
Please indicate the date or dates of notification: __________________________.
_____ District website  ______ District Notice Board  _____ Press Release /
_____ Stakeholder letter  ______ On-Site Signage  Press Package
_____ Newspaper  ______ Email Distribution List _____ Radio
_____ TV ad  ______ FLNR website  ✔
  _____ Gov BC Website
_____ Other [Please summarize]  _______________________________________________


Mike Peters  January 2, 2019
----------------------------------------------------------  ---------------------------------------------
District Manager  Effective Date
  Digitally signed by Mike Peters
  Date: 2019.01.02 14:12:55
  -08'00'
___________________________________
Date Signed

Distribution: Senior Project Manager, Forest Land Acquisitions, Forest Tenures Branch, Victoria.
Please attach a copy, photograph or summary of the Notice.
FS 301 HTH

  EXHIBIT A
MAP OF : FSR 8337 Retirement Amendment # 4 (shown in bold black)

FOREST REGION : RSC  TSA :  PULPWOOD AGREEMENT :  MGT UNIT TYPE : TIMBER
FOREST DISTRICT : DCK  LAND DISTRICT : NEW  SUPPLY AREA
  WESTMINSTER DISTRICT  MGT UNIT NO : 30

ESF SUBMISSION ID : 0  SCALE : 1:20000 at ANSI A Size  UTM : 10  DRAWN BY : FTA
BCGS MAPSHEET NO : 92G.036  Length (Km): 6.375  NAD : NAD83  DATE : Dec 18, 2018




  Legend




  8337.01 CYPRESS LAKE CYPRESS
  LAKE ( Length: 6.3745 Km, R/W: 75 m )
  PofC UTM10 514900, 5463319
  PofT UTM10 512712, 5465563

[Page 2: text read by OCR from the page image]
BRITISH

Saag COLUMBIA

EXHIBIT A

| Ne
prnete ce att "
=f ead Fd
! 12497421 fs
= $325691 963407
95425721
330931
6225851
325081 &
6326051
seit (pas Sec23,TP 39 10790481 =
6326211 ae / rm Ls
6327251 é£ ee } g
%e aps 16) ‘a 32
He a 6327381 iS =
F ; 6x27411 wh 7 A
faz70a1 6327541 / = = | xz]
6326921 6327871 6 & Fi
6327701 10862341 °/ : u =
exeagt o} 7 my ie
7 ro) &\|2
a a3
11492581 S00 16, TF 38 \ i) 2/3
\ 17, 1P.39 7 } |
a a = 7 1oa6a071 a
7256771 |e z | oisass |S
5 Sec 15,TP.39 ° | She 14,1P 39 Sec 13,7? HH
10792621 \ |
Sy 10871481 = r 7 mm =
o J 53 axqiat
- 2 =
y ~
2505451 ‘% § s2ca27{ 0792591 = Dt 4838
TASTE 1 % ’ bs 1
_ 12108061 \z \ cer) 632)50 1]
December 18, 2018 1:20,000
t) 0.25 05 1 mi
t + + t + t t t 1
° 0.4 0.8 1.6 kn

FTAAppication
Copyright BC Gov

MAP OF : FSR 8337 Retirement Amendment # 4 (shown in bold black) N
FOREST REGION : RSC TSA: PULPWOOD AGREEMENT : MGT UNIT TYPE : TIMBER
FOREST DISTRICT : DCK LAND DISTRICT : NEW SUPPLY AREA Ww E
WESTMINSTER DISTRICT MGT UNIT NO: 30
ESF SUBMISSION ID : 0 SCALE : 1:20000 at ANSI A Size UTM: 10 DRAWN BY : FTA s
BCGS MAPSHEET NO: 92G.036 Length (Km): 6.375 NAD : NAD83 DATE : Dec 18, 2018
Legend
= y | 6749721
ga | | CE] Ss Tenure Application
_ 2 } { omy - ) oy nw Tenure Road Application
@ om —\ —— 1 : Coquitlam Lak “\ cant ht Retired Tenure Road
% se _ X \\| e7aaea4 <X Pofc
2 ‘, Sec 5, TP5,Rge 6 ee
3 , <@ PofT
ee & ‘y ([] ‘Tenure Feature
([)_sRange
rs CO Tri
———— \ [-) | sProvincial Forest
sa - = 77 Forest Service Road
= Wig 90089417 Se: Noise)
| Pn ~~ Municipal Road
4 77 Non Status Road
a | _™ Recreation Trails
_}— eee i 77 Road Permit
ais ge maine 77 SUP Road
y } ¥ Yoong Cre, go0aa418 77 Right of Way
{ By = 7/7 Schedule B CP Road
y
yt WN 7 @ Mineral Tenure Points
yereas _ — Cities
\ pon NY , iL (- _ Waterbodies
1 a eee | /~ — River/Stream
dj : x
\ ie - soneed14_—_t Coastline / Island
\ F 5 y CYPRESS 8337.01 CYPRESS LAKE CYPRESS
9 , Si get LAKE ( Length: 6.3745 Km, R/W: 75 m)
; \ 7. :
ais shan tele, uw PofC UTM10 514900, 5463319
penal c=) Hy | : 8337.01 CYPRESS LAKE CYP! = Poff UTM10 512712, 5465563
: g) \ | if Py 15711471 173472 a
ef | ) Fy ~_0L 2677 ——
R : g
B
</source_text>

Page images of the map or scan pages are attached (page 1, page 2). Look at them as well as the text.

Return the JSON for this document.
