# Extraction task dm_notice-db32d58132a3 (run 1)

Write your answer to `queue/answers/run1/dm_notice-db32d58132a3.json` as:

```json
{ "task_id": "dm_notice-db32d58132a3", "run": 1, "mode": "agent", "model": "Claude Code agent mode", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
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

- `raw/2026-10/dm_notices/images/DCS-8f7c4b60-cascades_bridges2011dli.p1.jpg` (page 1)

## Source

Source: District Manager notice DCS-8f7c4b60-cascades_bridges2011dli (2026-10-19T19:57:36.706Z)

<source_text>
e  MTN  W  Cr  FLAPJACK  MTN  Beaverdam  Lake




  e
  c e  e  "  L




  Ck
  s t  PEAK  L




  e s
  R




  V
  Ch u r n
  "  n
  Taseko  i  56
  E




  W
  b  8
  02 7




  56 3
  62-015  r
  Jesmond  V  C




  87
  B




  12 2
  0
  5.9 km 62-016




  a




  1
  r  I  64-087




  57
  97




  C
  l




  5712
  62-0177 km
  "
  C  T
  S  64-011  a  1 km




  15
  Cr
  Lake




  571
  o




  E
  7.8 km  25 km  R  C




  02
  "  "
  2




  2
  16  S  571  12
  57 1
  "
  64 2  106
  "
  t  06




  5712
  571
  Tuzcha  a  5  1
  0  5848  01 0




  09
  b  e  Chasm




  r




  10
  64-038




  e
  l e




  a
  h




  GUN
  i n




  2
  Lake  9862




  C r
  06 K1349




  B
  s  7 km
  E




  o n
  62-019  112 km B a r 5848
  C k  n

  R T
  y n




  64 7
  a  62-020
  Bi
  g  64-134  64-012  01  o  " Cr
  f t
  54.7 km  Cr  t 64-113




  16
  12




  0




  R
  55.2 km  h
  F i




  L
  A
  Fr enc  1.6 km  36 km




  N
  Upper
  "




  D
  "9.9 km  Vidette




  e
  P




  l
  ""
  C r e e k
  "
  5848  10




  i
  "




  09 8
  DIL-DIL  Loon L




  e
  A
  Nadila




  VA




  4
  MT  r




  H a m
  6




  58
  05  03 50




  k
  Lake  K564  C




  20 6
  KOSTERING  N




  e e k
  1
  LL
  7 km  4648  Mt  3




  64
  TASEKO  843  827
  Yohetta  9780  PLATEAU  RED  5848  01  O  7




  EY
  "
  Big Bar  Bowman  02




  82 04
  MTN  K  n
  Lake  r
  48  31
  MTN  e  B




  77
  58 0  os




  C r
  DASH  FRENCH  K919  Creek  v  B
  1  8122




  C




  9141
  t  e




  9141
  r
  D




  914
  HILL




  06
  MTN  102 km  s  i g




  02
  01
  MT VIC  y  8277




  03
  K630  e  a d  64-013




  k
  t




  1
  e




  e
  G  Lo  r  e
  "
  ne  99.5 km  f  01  50.6 km
  a  C r




  r
  ey  B  i  C r




  i
  Va l l  F  i n t  9141
  C l
  e e




  r
  Dorothy  "  "




  n
  o  k




  a
  Moore
  R e l a y  01




  8277
  "62-031




  g
  CHINA HEAD  n




  ve
  Lake  h




  03
  Upper  65.5 km  8  c
  Lake  K629  5848
  811




  57 1
  MTN  n




  ya r d
  J ones  95.1 km 04  64-050  Loon
  01  e  Cr




  12
  y
  F r




  0
  ve  Cr  19 km
  r




  Taseko  a  e  C
  C




  e
  "
  w  D
  h
  "
  Snohoosh




  35 91
 b o  POISON


  R
  Lake  52




  11 8
  t




  6




  85
  4




  r
  S o u  8




  549




  k
  58
  E
  01 1




  Cr
  L




  06
  TEPEE  MTN
  I  C r  K917
  V
  MTN  83.1 km
  R  Lake




  C
  6250  64-079
  "
  Clinton




  r
  SPECTRUM




  St
  ll  54 K510  Hihium




  6
  9  62.5 km  Cri
  A N




  e
  08 6 14.8 km




  F
  K1130




  975
  e  e




  01
  PEAK




  i r
  Z  i s




  e
  w




  R
  Lake
  K A
  0.1 km




  Y
  o  d




  5496
  " C  "




  k
  r a  Cree




  A
  r
  r  2898
  I




  12




  A
  K519  r
  "




  u
  Mowich




  S
  a




  P
  "
  "K836  C




  p
  P




  L
  Cr
  K920
  A  T A  K509  QUARTZ  37.5 km




  E
  14 km




  6818
  S E  L




  A




  T
  77.8 km




  02
  R
  0.2 km




  C
  R
  KO  MTN  C r e e k"  n  Cr




  r i
  WA  m




  K
  CARDTABLE  W a t s o n




  r
  RN  o  h i u
  H




  r  o  H i




  m
  "




  O




  P o




  y
  ER  MTN  a  L
  B




  bl
  T C




  M




  e
  6817




  M ud
  R




  l
  e
  r  K910  01




  r
  I  K504  C




  l
  R
  8878  5496  29.5 km




  c




  a
  15.9 km  p




  54 05




  545
  14




  u




  V
  D
  i




  96
  "




  R
  n




  06
  G
  T  K518 YALAKOM
  "
  C r




  C
  e




  1
  e e  7853




  I V




  R
  S




  E
  MT  f




  r
  y
  L




  MTN




  5496
  26.9 km
  " k




  I
  a  f
  L




  02
  McCLURE




  ER
  u g




  V
  K619"  o
  A




  " K517




  5451
  o n




  Cr
  h t  C u t




  5451
  K620




  E
  F




  1.6 km




  04



  5451
  76 24.8 km




  05
  6818
  0.9 km




  R
  e




  02
  4  1




  01
  06 9  Kelly Lake  545




  a x
  "
  K506  R  01  5451




  k
  Warner  BIG SHEEP  K921




  No




  ee
  107.5 km  9  I  HOGBACK  08
  RD




  Lake  4  V E  48 km  A
  " K503  MTN  76 3  R  MTN
  l l




  C r
  e n
  0  K838  C r e e k  S c o t t i e
  LO




  "
  Pavillion  C r e e k
  "




  54 1
  24.9 km  K880
  n  0 km




  96
  Gu  15.6 km  K177




  1
  B




  C r
  K918  c a d e
  "
 ED  ELDORADO  r i
  M  r  C  K505  764  O  a r
  23.3 km




  5848
  9
  "
  O  C  PORTEAU  r  60 km  N




  r
  B




  03
  CORNER  MTN  1.6 km  r  02  o n  C r  Mountain




  76 1
  8810
  "




  y
  r




  C
  C




  C
  n  MTN  e
  48
  e
  "
  N




  49




  l
  PEAK




  0
  a  L  e  e k
  58 9  Hudson Bay
  D




  "




  l
  R  pm




  A




  D E A
  n
  K
  58




  54 3
  ha  1  d




  549




  e
  4




  P
  22 8
  i




  17 8
  Y
  96




  t
  C




  0
  C




  01




  4
  a




  A
  i
  K1131  l




  A




  58
  6
  A 8.2 km  M
  COPPER  em




  k
  e r




  01 9
  r
  k i e




  L




  R
  e c  l d




  2
  s
  C  K  8452  e s  s




  D M

  75
  L  48
  o




  a
  C r  s
  MTN




  M




  5482
  T
  C  58 4
  i
  01




  t
  MONMOUTH  K601
  "




  01
  c
  r  K514  87  r
  "




  e




  584
  h
  2




  G i




  E
  K863




  A
  e  14.1 km  0




  K a
  R
  Red




  A N
  SHULAPS  23 6




  k
  MTN




  27
  e  Liza  7.7 km




  M




  C




  8533
  0.7 km




  9473
  A
  8
  k




  r




  l l




  08


  01
  L
  "




  873
  y




  r
  7649 K911




  u
  R
  PEAK  Lake




  8706
  8706
  "




  r
  B




  01
  02
  2.8 km  SLOK  C r e e




  870
  o




  o w




  5
  07 "




  853
  G
  01




  n




  21
  K1311  k




  6




  07
  u
  Tyaughton  K602  e  Carquile




  s
  k
  HILL




  03 3
  K512




  3
  k 18.8 km  e  C




  3
  58 1
  n




  t o
  3.2 km  C r  C r




  85
  e "  a




  C
  N i c h o
  L  0.1 km




  48
  0
  S  e




  r




  85 1
  n e




  k
  "
  r  S h




  r
  l
  "




  33
  0
  e
  RD




  u  S l o k




  a
  n  Sabiston




  R
  K539
  K540 C  o




  853
  l a




  b
  e
  l i




  M




  k
  I




  04



  i
  9.3 km  p
  O




  C r
  i  Lake




  a
  24.3 km  s  s




  n
  e e
  v




  3
  S
  i
  h




  V
  r
  L




  C r  Pa




  k




  e
  a l  REX




  a
  e e k
  "




  E
  m




  C r
  8457 C  l  76  Pavilion
  l




  b
  "




  r
  R
  e
  81  A




  C
  01 70




  R




  i
  C
  s




  5  01  R  PEAK




  r




  B a t t l e
  01 1




  s
  r e
  P  Lake




  e




  I
  MOHA  Pavilion




  t
  e
  E




  88 1

  o
  9711




  k




  V
  N




  n
  34
  0
  01
  Tsotin




  C
  T  E  e




  E
  76 2




  C
  D
  C r
  h  Lake
  MT  E  c




  70
  8369




  R




  r
  R
  0
  a




  01
  R




  C
  S t a  MT  Gun  C
  Coppe




  9019
  I V
  n  SAWT




  r




  I
  8778




  01
  L  K541  Cree
  C




  R
  PENROSE  01




  03 70
  8.7 km  Cache
  l




  E
  SCHERLE
  r




  B
  K1168
  e




  76
  e




  R




  R
  y




  1.5 km L  8502  Creek
  "
  K543  I
  e




  PEAK  803  K520
  B  9  A  K  V
  k




  R  0.6 km  9.7 km  E  03
  02  GOLD BRIDGE  E
  S
  "
  I D  R
  02




  T r u a x
  m
  GE  R I
  85 7
  "
  McLean
  "
  i




  9856
  t  V E R  849  K1304  0
  0




  8060




  01
  K530  8039  Boston




  01
  K531  01  BREXTON  2.7 km  C r  Lake
 h o




  9.7 kmK618  01  1+97
  S a l l u s
  S
  T
  h




  Savona




  8502
  G l a c i e r  17.4 km  MT  850  Flats
  R
  7.9 km




  05
  "




  8536




  G u lch
  r  K528
  E
  p




  C o
  e  "D O W N T O N  99  2




  03
  "
  i  TRUAX  T
  S  01
  V
  5 km
  "
  c  K834




  85 4
  a




  r n
  E"  Walhachin
  I
  l  K




  02
  29.4 km  A




  0
  G  L  8536
  853  e  C




  I n
  B




  w




  s s y
  6  17  i n
  "
  R
  Terzaghi




  R




  a
  Fountain  09  i c




  d i
  I
  0
  844




  r
  R




  l
  e d  Pennie




  D
  e
  Dam




  01 4
  g




  l
  G
  M
  01




  9
  i d




  a n
  8536  Lake




  E
  1




  101




  a
  934
  r
  Chipuin  84
  36
  B  B
  02




  r
  BRALORNE  01  85 05
  C  Ashcroft  B  4
  02 0
  Keary




  R
 ETSLAKA  K1392  8536  r  a
  R  L  Mountain  e  r n




  G a
  VE
  WHITE CROSS  e




  8536
  15




  H a t
  KETA  BRIDGE  MT  "0.8 km  k  e
  s




  06
  MTN  I  K1023  MT  Fountain  e k




  r d
  84 3
  e
  PEAK  VAYU  R  C  Valley  C r  5483




  40
  11.2
  a km




  9177




  0
  K617  K637
  d wK1344  SHALALTH  McLEAN  C  14




  e
  r e




  01
  K639 "  6
  14.4 km  SOUTH SHALALTH  831
  p




  n




  n
  14.6 km  12.5 km"  a  c  a  s  e
  " lkml K1345  C




  o
  C r e  K640 14.1  Wh i t e  Cornwall  k  01




  8536
  L i l l o  K1393  r  r
  Mount  k
  o  e k  a km




  C
  01
  e
  "
  12.6 km  e
  MT  t  5.4 km  " 12.6
  d  d  1
  K522  Hills
  "
  K1342  e  S
  E  A
  n  T
  S  Fehr
  G  K1000 16.5 km  r  K638
  "  "
  TISIPHONE  l  K1394  16 km  WHITECAP  T
  a  17.5 km
  "  19.1 km  SETON PORTAGE  Lillooet
  l




  c  7.9 km
  i  MTN
  l a




  O
  LILLOOET  e  " K1300
  "  "
  r
  MT




  N
  12




  805 C r e
  Y
  Silt  "8.3 km  T
  S
  K1002  Seton
  S a




  01
  MTN  L A




  E
  L  R




  9
  McGILLIVRAY




  5471
  20.5 km  77  K E




  r




  01
  Leighton




  5483
  91 2  L  N



  R L
  e k  Kwotlenemo




  C
  S E TO  Glossy




  04
  0  L
  "
  e
  MT  C r  K1006  E  (Fountain)
  HU  K  Mountain




  9350
  24 km "  Carin




  05
  K524  R  A  Lake  J a c  Tunkwa




  e k
  r
  ATHELSTAN  BC  L  k




  F
  e  23.3 km  K1007  O  548
  "
  d  24.4 km
  Peak  r e
  g o n  3  Lake
  l  23




  5483
  M
  "




  l
  k  r
  1019
  r




  e e




  24
  u




  e




  C
  c
  K535




  C r
  e
  C




  C r
  83




  o
  e k




  G i l
  03




  4.3 km  54 2




  R
  N




  9350
  4
  o




  K1021
  L




  915




  01
  k  B  White  0
  B




  5.1 km  93
  "
  c
  01



  l u  54




  90 3
  K525  E a r t  5




  l i
  o  e  83
  0



  04 0




  e y
  h




  85
  c  Mountain




  1
  SESSEL  28.8 km  08




  O N
  "
  o  Forge
  e




  A
  v r
  GROUTY  C r e e k




  5483
  P




  5
  K1547




  l l
  MTN
B A




  t e




  01 9




  908
  E




  SUGUS  K3005
  "
  C r
  I




  90




  P h a




  01
  7




  02
  85  Mountain  0 km
  A




  a




  C




  85
  S o c k e




  68 8
  PEAK  0 km




  D E R S
  K3007




  V a
  K3006  14
  n a




  MTN
  S




  y




  i n
  K533 K534  r




  79
  0
  9150  0 km  0 km  C  "
  T




  "
  7.3 km7.5 km  6




  S
  i r
  1080
  M a




  q




  01 2
  03




  y e




  835 8 2




  64
  K532 ""
  "
  L




  Venables




  u
  Spatsum
  "
  01  y  97C
  T
  S




  06
  N




  10
  8354




  e
  8.5 km"




  1059
  C r  e
  MT




  4 354
  04
  l
  o




  K914




  f o
  o n  i  Lake




  01
  A N




  84 01
  R
  06
  r t




  9.8 km  t




  E
  JOB  108
  n  K563




  04




  4
  H
  i




  e k
  T




  C
  0
  w
  02




  i
  o  K551  10531
  L




  h




  l
  FACE  7 km




  r
  O




  "




  g
  t
  O




  r e
  0.2 km




  h
  01
  B




  L o s




  D
  MTN




  l
  "




  k
  A




  C
  R
  03 3




  a
  SIRENIA




  Tw
  C
  K552
  "
  2




  n
  r
  O
  61




  MT




  d
  2.2 kmK553
  B




  MTN




  e




  a a
  8777




  6879
  E




  9098
  " 3 km




  01
  57  Logan Lake




  05
  01
  R  33




  415
  7977
  I




  JOHN DECKER




  l
  "K554
  r




  83 07
  e
  T




  e
  10
  k




  K




  02
  e  D'ARCY
  01
  C




  54




  06 0 61
  4.4 km




  6
  v r a y
  r
  C r




  E  V




  C
  e




  1
  K1161




  1
  C  83  K570  a




  5694 9
  N  e  54  I n k i k u h




  r
  R




  "
  17 km  18 km  l
  H  k  Quiltanton
  3




  01  K555  Big  l
  I




  612




  7973  E  Martel  e




  k
  04




  M u
  4156
  M e
  V




  57  8.6 km  Lake  y




  C
  A  92  8777
  "
  7973




  o
  l i
  a g e r
  "




  N
  e k




  12
  01  D  3  C
  Ok K888
  E R




  9
  02




  r e
  02 3




  r o
  687
  6123  Birkenhead  01 8  5694  "
  e  i  02  r




  l
  56




  09 9



  03
  57  r  G
  Lake 46 km K1512




  r r
  7




  B
  Wi




  e k
  02  9




  9
  c
  3




  68
  01  01 3  9  08 4  C  M  t c h




  6879
  L  DEVINE 03  "
  0 km  e s
  4 Ha  Gump




  02
  a
  R
  01




  O
  y  K558K557  Askom  68  Lake
  OVERSEER
  "
  P




  y
  01 79  10151
  l  0.3 km
  0.2 km
  r  K559  i m




  h
  s
  C
  MTN  " 1.6 km  a  02




  m
  3  Mountain  i
  573




  o
  n
  61
  573

  o  I n t l  u




  r
  "
  0814




  I




  S
  s
  02 23  08  p a  s
  05


  h




  e
  m




  a
  t
  3 57 3


  o  L a u w is s i  44
  l
  u  K556  K568K567
  K569
  K1401 Gnawed




  x
  o  C  n
  MT  BIRKEN 9300  r




  r
  S  5.2
  4.9 km 4.8km
  km




  415
  17.3 km  C




  e




  0814
  C
  5733




  r e  33 km
  33




  C
  0




  tain
  Moun




  T
  e ek
  04




  r




  41
  11
  THE  01  Spences
  R




  36 14
  P
  e k




  V




  6
  MORRISON  r  415
  """




  56 3




  y
  "
  C  C




  08
  6  0814
  "




  94
  r

  01 1
  Bridge




  0




  4156




  0814
  09
  0
  CAMELS BACK  e




  01




  09
  MT  93  11




  a
  e  K484
  MT




  92 2
  R  k




  M
  5694
  24.1 km




  99
  0
  8015  K1514
  R




  RONAYNE
  I




  929
  E  Arthur




  01
  Cascades District (Lillooet Portion)




  C




  E




  0814
  8015 02  K1495  0 km
  e




  081
  l
  O




  07
  01
  C  V
  "
  n




  t
  MARRIOTT  Spaist  Mam




  9
  0.3 km"
  d  01
  I V




  I




  35
  R  Seat




  G o t
  e
  "




  4
  K1469
  n  A N  e k
  H
  0 km  Mountain
  P




  C r
  n
  e  Dot




  4
  Y  C r  S
  081  14




  08 3
  E R
  V




  k o




  081
  R
  i  R  08 8




  37
  930




  S i w h e  o n k  C  4
  "
  T




  14
  E




  Lake




  8459
  a




  0
  n
  r
  Soap  02  1
  02




  01
  2
  M




  C r




  S k u h o s t
  Duffy  L  Gypsum




  10 1
  L




  All Bridges




  58
  Mountain
  g




  B




  K1117




  0
  Skwilkwakwil
  E




  C k




  1
  Botanie




  d
  CAYOOSH  29 km
  E




  o




  o
  i k  Mountain
  9302




  I n k o




  o
  HOWITZER  MTN  Mountain
  01




  SUGARLOAF  CREEKSIDE
  "
  n




  w
  R




  o  K423
  PEMBERTON  GOTT  t
  O




  97  o t




  C r e e k
  PEAK  MTN  84  C  Siwhe  K421  10.5 km
  R




  1
  w
  T




  MEADOWS  01 7  5  Clapperton  13 km
  l




  01 8  V
  PEAK  081
  "
  O




  Mountain  r  k  4
  a  C r e e
  E




  "
  C  30
  C r
  n  4
  N




  C  C  MT CHIEF  Stein
  i s  081




  C
  r  LONGSPUR  s  01  081
  8675




  3
  e t  4




  o
  e  Mountain




  845
  01
  L




  PASCALL  e  26
  r




  PIVOTAL  S l




  01
  t
  e  PEAK




  Ho
  8
  818  8675




  t




  0814 05
  MTN
  I
 T




  02  S k




  o
  n




  8454




  04
  78 01




  03  u h u
  T




  KWTAMTS




  r l i c k




  01
  n
  67
  L




  C




  03 5
  A




  S T E I N
  k




  t a n i e




  5
  w
  T
  E




  OWL CREEK




  0814
  T




  84
  C
  PEAK  78  y
  e
  E




  O




  o
  5  n
  R




  B  6  845
  r




  02 7




  r
  K667  e




  o
  A  MT




  G
  F




  f




  01




  d
  R  2 km  Gordon
  f




  E
  H




  r
  MOUNT  I V  k
  o
  I




  POLLOCK  K439
  L  K922  C r
  J




  IPSOOT  E  Lake
  "




  B o
  CURRIE




  e
  D  PEMBERTON  R  0 km  0.1 km




  Ke
  d am o r  e k




  r e
  SISQA  MTN  8150  n  k  7726
  u  e  e
  O




  t
  "




  r
  "
  S c




  C
  01  7979  r  01


  C
  PEAK  C
  01




  e




  N I C
  e




  n
  TWIN GOAT




  k a
  R




  C r
  e
  4767
  L
  u




  MT  h  n  N




  C r
  MT  5673




  Sh a
  e  O
  4670
  t




  l




  OAM
  MTN  e  04
  S i




  r f
  i




  o r d  01




  C
  TINNISWOOD  l  03




  e e
  WILSON  C




  ls
  r e
  r e  o




  s
  R  Akasik  Lytton




  7




  EN
  n
  m




  e k




  l
  b
  0




  476
  o




  4767
  467
  C r




  k




  03




  i
  NOR
  s




  i




  02
  w
  e
  RI VE




  e k
  Mountain




  H
  04
  i




  r l
  T  T
  K1094




  t
  H
  r
  t




  y
  C
  S




  t
  16.2 km




  R I
  EXODUS  MT




  R




  E a
  TWIN TWO  3884




  r
  O  Petlushkwohap  Mount




  o
  4670




  E
  n
  01
  "
  C r




  VE
  PEAK




  t
  CURRIE  o
  Mountain
  104




  e e k  01




  V
  PEAK  Roach  m




  r
  L




  R
  o
  01




  S




  46 2
  I




  C
  80




  Mimenuh  r




  T
  O




  R




  70
  P
  BASTION




  4767




  0
  R




  E
  a




  0
  791
  i n




  C r e
  I  Mountain




  01
  MT  V  Lower Nicola




  I N
  E
  e




  7910  R 01




  a
  PEAK  h
  t c
  k
  r
  c h




  C r
  a
  U




  VICTORIA
  N




  N o r t h




  i
  02  i
  MT  Nikaia  k  Mount




  e
  73
  e




  i
  e




  K682 Canford  8
  E E




  a
  n  4  S
  T
  a




  k
  03 3  K  N  Coyle




  Nu
  u
  ALBERT  Mtn  Zakwaski
  H  w  Lytton  0.5 km
  N  o  Klowa




  R
  I  i  Mountain
  R




  E
  "
  e  Mountain
  L i




  Callaghan  79  S T  k
  G
  R




  L
  04 10 791
  3




  C r e e k
  z z




  RAINBOW
  734




  K547
  03 0
  01




  Princess  92  12.6 km
  i




  MTN  8
  e
  8723




  01 4
  K
  I




  e e k
  01




  a
  4768
  "
  Louisa  k  N2-209  K890 K544
  C




  i
  0 km  01  K546
  r




  l
  Q  a
  Kwo i  4.7 km
  3.8 km2 km  Kanaka Mountain
  C r
  u  In  ek
  V




  PYRAMIDAL
  9284




  K882 Kanaka




  C r
  "
  610 B




  " "
  e
  02




  k
  "
  01




  e  0.1 km
  61  ALPINE  C r e e  Bar
  2




  n  0  PEAK  Cr
  s  05 2
  6102




  80
  E




  "
  r
  MEADOWS  e  Jackass
  04




  86
  C  ARROWHEAD
  C




  Pyramid
  W




  F I




  d




  19
  03
  MALIBU  POWDER  g e  GUNSIGHT  MT
  a




  73
  01
  R  MT  P
  l




  MTN  r
  NG
  S Q




  C r
  e  Mountain  Mountain
  R




  8673
  MTN
  R




  g  o
  l




  a  PEARKES  R




  03
  h  SKOOK JIM  s
  a
  i t




  19
  P  PEAK
  E




  a
  c  n  OS  p
  e c
  8407




  h  Kwoiek




  80
  02
  T
  01




  t




  4332
  Sm a n




  86  ALTA  R I D
  CLOUDRAKER  Needle  Cowhead




  05
  5  t l
  C
  80 B
  U
  D




  GE
  01 0  Little
  840
  7  K870
  r




  a
  02
  E




  79




  R  WHISTLER  h  Pass  13.7 km
  T




  LAKE  03  MTN
  86 2




  A




  m
  E
  B i  e  Chochiwa  ""K434




  y
  865  S
  M  4  C




  u s
  a
  50




  13.6 km 669
  0




  0  D E  l l  C




  d a
  M




  k
  03  WHISTLER  C r e e  r
  6102




  y g  Lillooet  01
  8407




  h
  k




  o
  B




  e
  01




  JERVIS  TAMARISK  w
  05




  N A




  n  C  i
  r




  o




  d
  p i
  I




  CREEK  s  Glacier  o  M
  a




  F




  M  r
  BLACKCOMB  r  e
  C r




  C r
  i
  S




  H A




  e k



  e
  e
  d




  w




  S
  t




  8019
  a




  k
  77
  S q
  y




  i  SPROATT
  z




  n e  Lake
  H




  30 4  PEAK
  t




  T




  u
  s




  m  01
  T




  Keefers  Mount
  g
  3077




  L




  807  0
  i
  s




  m




  466
  o




  MT
  05




  9
  A
  3077
  u




  o




  a
  A  Hewitt




  02
  01  R
  R




  e k




  h a t l
  MT  C r
  T
  02




  n
  a




  C
  r e
  s
  CH




  7443




  9
  k u




  M
  s  H  i
  9




  A TC
  C




  INLET  B
  h




  CRERAR  Bostock  d
  807




  TL  R I VE R
  d




  H




  WHISTLER  C
  02




  FREDERICK  01  STOYOMA  K1437  d




  m
  Inkitsaph
  E A




  C r  A
  h




  a y
  i




  L




  H  23.6 km
  307
  l u




  C r  MTN  C  A
  L  MTN  C r
  I L




  WILLIAM  r
  K




  M  N
  Nahatlatch
  09




  M e




  r
  69  K427
  9160




  US




  3
  K1438
  S




  7




  A




  "
  9




  508
  01




  R




  14 6
  L O




  c  H
  10.3 km




  N
  h




  10490
  t




  01
  A  25.5 km




  C
  43 03
  A
  a  ICECAP  t h
  a




  01




  N o r




  32
  R
  OE




  e
  k




  03 7




  T
  "
  7976




  NAHATLATCH  6
  7




  "
  699
  a




  R  PEAK




  L
  01
  30




  K476
  R




  Nahatlatch
  TC
  9281




  A
  CYPRESS
  w




  H
  02
  01




  T




  R  NEEDLE  6  R  12.5 km
  u




  l  699  r




  60 2
  Cheakamus
  s




  I




  a  PEAK  N
  01  Lake




  69 03
  C  K487




  69
  BOOTHROYD
  "
  y  4332 K486 K714




  0
  A
  C




  L




  96
  r
  o  H
  96  24.3
  kmkm
  M
  V E




  CHEAKAMUS PEAK  6069
  r




  K1057  14.5 km 14.3
  r




  R  A  69 7  a  K1058
  u s  01




  C




  R
  Daisy  i
  A  l  i km
  p 31.3  01
  C




  0  22.9 km S
  e




  s  T  R  i  n  s  "" "
  s  L  C
  h




  H E  L
  e
  L
  "
  R  THE NIPPLE
  "
  Cheakamus
  C r




  A K  A M
  "
  c
  R




  U  A
  n




  a




  n




  E
  Daisy  L  S
  i  T  H
  k




  r  MT  MT  r
  a




  I
  t




  P  Lake
  C
  C  C  K
  H  CANYON ALPINE
  e




  w




  T  LAUGHLAN
  l




  i




  V
  WIDDESS


  LEGEND
  m
  THE BLACK
  L
  C r




  A  y  u




  r
  o




  p
  S  p  e
  e




  L



  Map Information
  r
  TUSK
  C




  A s  Garibaldi  T
  L
  G




  C
  R




  i
  h  A
  r




  O




  I
  Bridges
  H  o m a
  s




  k
  l l




  y
  A  S t o




  E
  O
  R
  C




  CASTLE
  "
  Garibaldi
  l




  Bridge Label
  N
  a




  o
  u




  s  r




  R
  Moorsam  u
  F




  ig h  s




  C
  TOWERS  a
  Lake  E  Indian Reserves




  o
  H  w  NORTH BEND
  Bluff  R  u
  C r  CLOUDBURST
  Bridge Identifer #




  K
  Sourcedata: Corporate CBridge
  E
  Registry
  V  R  e e  MT
  T
  M U S




  r
  Parks and Rec
  U  k  MTN  s  C


  1:200,000
  O
  r




  WHISTLEPIG  u
  T




  "
  C




  i
  D




  Date: April 21, 2011V A  Km point on Road
  N  SCUZZY  BOSTON BAR  S
  l
  K A




  o




  <all other values>
  Created by: Cascades Geomatics
  File:W:\FOR\RSI\DCS\Projects\2011\23_road_bridgeinspections
  0 2.5 5  10  15  20  Prov. Park
  Lake

  \Cascades_Bridges2011.mxd  Kilometers  Ecological Reserves
  Projection: Albers Units: Meters  Active Forest Road Sections  District or Portion of
  District Boundary
  Forest Service Road
  Road Permit
</source_text>

Page images of the map or scan pages are attached (page 1). Look at them as well as the text.

Return the JSON for this document.
