# Extraction task dm_notice-b993cee8f4fb (run 1)

Write your answer to `queue/answers/run1/dm_notice-b993cee8f4fb.json` as:

```json
{ "task_id": "dm_notice-b993cee8f4fb", "run": 1, "mode": "agent", "model": "Claude Code agent mode", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
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

- `raw/2026-10/dm_notices/images/DSE-c3a0aaa8-incomappleux_road_deactivation_prescription_overview_2024_contour_new.p1.jpg` (page 1)

## Source

Source: District Manager notice DSE-c3a0aaa8-incomappleux_road_deactivation_prescription_overview_2024_contour_new (2026-10-19T19:59:37.580Z)

<source_text>
Source: https://www2.gov.bc.ca/assets/gov/farming-natural-resources-and-industry/natural-resource-use/resource-roads/local-road-safety-information/selkirk/incomappleux_road_deactivation_prescription_overview_2024_contour_new.pdf
Fetched: 2026-10-19T19:59:37.580Z
SHA-256: 12341f6e3ac74d77ed47d978526cf3f9213a3976facd777fad3884ff57a4e73a
Read: text layer (1 page); 1 map or scan page image for reading
Images: raw/2026-10/dm_notices/images/DSE-c3a0aaa8-incomappleux_road_deactivation_prescription_overview_2024_contour_new.p1.jpg

  114D




  N
  50°51'
  R0691
  449500
  117°43'
  W  450000
  117°42'
  30"
  W  450500  1
  17°42'
  W  451000  1
  17°41'
  30"
  W  451500  17°41452000
  1  '
  W  1
  17452500
  ° 40'
  30"
  W  453000
  117°40'
  W  453500117°39'
  30"
  W  454000  1
  17°39'
  W  454500  1
  17°38' W 455000
  30"  1  455500
  17°38'
  W  456000
  1
  17°37'
  30"
  W  456500
  117°37'
  W  457000 117°36'
  30"
  W  457500  1
  17°36'
  W  458000  1
  17°35'
  30"
  W458500  17°459000
  1  35'
  W  459500
  117°34'
  30"
  W  460000
  1
  17°34'
  W  460500  1
  17°33'
  30"
  W




  4B
  11
  691




  13A
  R0
  R0




  RB
  691




  911
5633000




  5633000
  R
  06




  11
  Stephney




  R06
  91
  BR




  S PU
  3B
  1
  AN


  14
  Creek  Road Previousl
  y Deactivated




  C




  R0
  H




  SA


  69
  13




  11
  BL
  BRANC

  R0691




  E


  13
  RO
  AD
  115
  H25
  A
  WP1- 1=POT
  End ofdeactivation Branch 1.
  Bridge Previousl
  y Removed


  Incomappleux River FSR
 5632500




  5632500
  N
  30"




  WP1-  2=X D
  WP1-  3=RC/  X D
  à#
  *
  ° 50'




  Remove existing 500mm cul  vertand installcross ditch
  #
  *  Existing cross ditch – needs tobe cl
  eaned out.




  N
  1
  $




  30"
50




  Road Deactivation




  50°50'
  atjunction ofspurroad atthe ribboned sk ew.  A  !  WP1-
  2A=I
  AB
  8
  9
  Prescription Map
  !
  WP1-  4=RC/  X D
  Remove existing 500mm cul
  vertand instal
  lcross ditch  WP1-  5=NWR
  atthe ribboned sk ew.  Bank is revegetating and stabl
  e.Existing armouring is


  Sections 1, 3, and 4
  w ork ing w el
  l
  .
  8!
  9
5632000




  5632000
  A
  Roa d S ection  L
  ength(m)
  WP1-  6=CS / RNS C
  Ol dl og abutments and culverts are buried.S tream
  WP1-  7=RC/  X D
  9! 9
  8  !
  8  fl
  ow ed here atone pointin time.Constructa sw al  e

  S ect ion 1  10
  431m
  S tartofrock cutarea.Remove existing 500mm cul
  vert  dow n toditch levelfor10m.Restore naturalstream
  and installcross ditch atthe ribboned sk ew.  A  toits originalgeometry (as much as possibl e)matching
  w ith upstream and dow nstream segments.

  S ect ion 3  6
  63m
  N
  50°50'
5631500




  505631500
  1
  $




  N
  ° 50'
  WP1-  8=NWR

  S ect ion 4  2
  25m
  WP1- 9=X D
  S teepbank on fil
  lside w ith rock undersoilthathas
  S hal
  l
  ow armoured cross ditch required.
  been re-vegetated and is providing stabil
  ity.


  WP1-  10=RC/  X D  Legend
  Remove existing 500mm cul  vertand installcross ditch
  atthe ribboned sk ew.K eepcross ditch shal
  low above
5631000




  5631000
  WP1-
  10A=I
  S P/
  IAB
  A
  !
  channeldepth toavoid back fl
  ow ofw aterintocutside.  A GPS Point
  Scott  1
  $
  Creek  #
  *  PointofCommencement(
  POC)

  à  WP1-  11=N5-037RB/
  Bridge Removal
  RNS C
  ,restore naturalstream channel  #
  *  PointofT ermination (
  POT )

  $ Cross Ditch
  1
  N
  30"




  WP3- 2=X D  A  9!
  8
  50°49'




  !
  Cul
  vert
  Cross ditch required,fol
  l
  ow ribboned sk ew.  WP1-
  11A=I
  S P/
  IAB




  N
  30"
5630500




  5630500
  50°49'
  8!
  9  Possibl
  e Burried Cul
  vert


  WP3- 1=X D  Incomappleux




  :
  Cross ditch required,fol
  l
  ow ribboned sk ew.  WaterBar
  River

  à  Bridge Removal
5630000




  5630000
  WP3- 4=W
  WP3- 5=W  Waterbarrequired.
  $$
  11
  1
  $  WP3- 3=X D
  ! Instal
  lDeactivation S ign/
  Postand Access
  Cross ditch required,fol
  l
  ow ribboned sk ew.  A




  : ::
  Waterbarrequired.




  I
  NCO
  Deactivation Prescription
  WP3- 6=W




  339
  M AP
  Menhinick




  703
  Waterbarrequired.
  /////PullBack S ection




  PLE
  N
 50°49'




  Creek




  UX
  03
  Disturbed Areas
  WP1-  12=RC/  X D




  N
  50°49'
  Remove existing 500mm cul
  vertand cross ditch
5629500




  5629500
  atthe ribboned sk ew.
  A$
  1  WP3-  7=I  S P  M ain Road
  Junction w ith Branch 1.I
  nstal
  ldeactivation sign and signpost.
  1
  $  FT EN Road S ections -
  WP1-14=N5-  036RB/  RNS C  WP1-  13=RC/  X D
  R0691




  River
  112B1
  Remove bridge and restore naturalstream channel
  .  Remove existing 500mm cul
  vertand cross ditch
  112B




  R0691  atthe ribboned sk ew.  S treams
  A
  !
  WP1-
  14A=I
  S P/
  IAB  Private Land




  R
  WP1-  15=NWR




  VE
  RI
  à




  01
  Now ork required.Rock and vegetation on fil
  lsl
  ope
5629000




  5629000
  97


  X
  33
  are providing stabil
  ity.




  EU
  PL
  12




  AP
  E
  1  LV  Symbol  Description
  91  EW




  OM
  6
  A  Ad v  ers  eroa  d g  ra  de
  S ECT _ T WEL
  0  A




  NC
  R  _ T  !




  I
  N
  O  ARMOUR  Arm ourt  o prev  enteros  ion
  TI  WP1-
  14B=I
  S P/
  IAB
  N




  C
  30"




  BD  Bla  stDit  chline
  R0691

  SE
 50°48'




  BMC  Ba  ck up m et  a lculv  ertwit  hcros sd it cha  nd d itchblock




  N
  VE_ A_

  112A3




  WP1-
  15C=I
  S P/
  IAB  BP  Burn pile




  30"
  562850050°48'
  A
  !  BPC  Ba  ck up pla  stic culv  ertwit  hcros sd it cha nd d it chblock
  T HREE




  WP1-  15A=N5- 035RB/ RNS C  BR  Brus  hroa  d
  BRI DGE  Brid g  ecros  s ing
5628500




  S ee AppendixAfordeactivation prescription.
  R0691




  04




  S ECT I
  04  BWC  Ba  ck up wood en culv  ertwit  hcros  sd itcha nd d it chblock
  A
  àAA  3397  EUX
  WP4-
  1=Now ork s required on this road  CC  Clea  n orrepa  irculv  ert



  R0691
  PL
  112B2




  ON_ T W
  AP  CD  Clea  n d ebrisf  rom d it  ch
  M
  O


  112A
  C  CMP  Corrug  ated m et  a  lpipe
  !  N
  I
  EL
  WP1-
  15B=I
  S P/
  IAB  CPP  Corrug  ated pla  st ic pipe
  ONE




  VE_ A

  CS  Cons  t ructs  wa  le
  #
  *
  VE_ A_




  WP1-  16=RCX D  DS  Down S lope
  112A1




  2
  X 0
  E C  E xis t ingculv  ert




  02
  Remove existing 500mm cul
  vertand cross ditch
  EL




  1
  $




  EU
  97
  E DL  E xis t ingd elinea  tor
  R0691




  PL
  atthe ribboned sk ew.
  ON_ T W




  33

  AP
  EW  E xis t ingwa  terba  r
  N 5628000




  5628000
  E X  E xis t ingcros  sd it  ch




  OM
  S ECT I




  NC
  F  F a voura  bleroa  d g  ra de




  I
  FW  F illin exis  tingwa  t erba  r
  112A4




  F X  F illin exis  tingcros  sd it ch
50°48'




  VE_ A_ T WO
  S PU RC




  WP1- 17=NWR  GR  Gra  d eroa  d
  R0691




  IAB  Ins t a lla  cces  sba  rrier/  berm




  N
  Fl
  atground,nodrainage structures.Now ork required.




  50°48'
  112A2




  I
  BMC  Im prov  eba  ck up cros  sd it chf oram et  alculv ert
  ON_ T WEL




  IBPC  Im prov  eba  ck up cros  sd it chapla  stic culvert
  WP1-  19=RC/ RNS C
  R0691




  WP1-  18=RC/  RNS C  IC  Ins t a llculv  ert
  Remove 500mm cul  vertand restore natural
  stream toits  Remove cul  vertand restore naturalstream toits  ID  Im prov  ed it  chline
  A
5627500




  5627500
  S ECT I




  originalgeometry (
  as much as possibl e)matching w ith  originalgeometry ( as much as possibl e)matching  IDL  Ins t a lld elinea  torpos  t
  upstream and dow nstream segments  8!
  9  w ith upstream and dow nstream segments  IRW  Im prov  eexis  t ingrev  ers ewa  terba  r




  KEY MAP
  WP1-  20=X D
  9!
  8  I
  IS
  SP
  I
  I
  ns
  ns t
  loperoa
  a lls  ignpos
  d s
  t
  urf a  ce

  IW  Im prov  eexis  t ingwa  terba  r
  Cross ditch required,fol
  low ribboned sk ew.S ome minor  WP1-  21=X D  Sp

  erosion ofroad grade from surface fl
  ow
  1
  $  Cross ditch required,fol low ribboned sk ew (  moved
  il
  l
  im
  a  ch
  IX  Im prov  eCros  sDit  ch
  1
  $  e  en  JCT  Junct  ion
  totow n side toavoid k ick ing offdirty w aterinto  FS
  R  LDG  L and ing
  1
  $  adjacentw etl and feature) .




  Hw y
  NDB  No d it  chblock
  NS C  No s  id eca  s tingofm a  teria l




  23N
  5627000




  5627000
  WP1-  22=RC/  X D  NWR  No Work Required




  Jor
  OPP  Old pipepos  t(  leg  a  lpropert  ym a rker)




  dan
  S uspected buried cul
  vert.Remove and cross ditch
  N
  30"




  OS  Outs  loperoa  d s  urf  ace




  FS
  WP1-
  22B=N5-
  034Bridge  atthe ribboned sk ew.
50°47'




  A




  R
  !  Rd  PF  H  Pullba  ck s id eca  s tf  illhea  vy( >6m )




  N
  y
  l
  Gree




  30"
  wy  PF  L  Pullba  ck s id eca  s tf  illlig ht( <3m )
  aH




  50°47'
  nad  PF  M  Pullba  ck s id eca  s tf  illm ed ium (  3 ‐6m )

  à  -Ca




  M tB
  WP1-
  22A=I
  S P/
  IAB  T  rans  POC  PointofCom m encem ent




  egbi
  POT  PointofT  erm ina  t ion
  PWD  Pullba  ck wood yd ebris




  e Rd
  RB  Rem ov  ebrid g  e




  Air
  A
  !
5626500




  5626500
  po
  RC  Rem ov  eculv  ert




  rtW
  WP1- 23=X D  WP1-
  22C=I
  S P/
  IAB  RE CON  Re‐cont  ourt  o na  t ura  ls lopea  ng le




  ay
  Cross ditch required,fol
  l
  ow ribboned sk ew.  RMC  Rem ov  em et  a  lculv  erta  nd repla  cewit  hcros  sd itchand d it
  chblock.
  WP1-  24=RC/  RNS C  RNS C  Res  torea  nd a  rm ourna  tura lstrea m cha  nnel
  Remove existing 500mm cul  vertand restore natural  Roa d %A  Ad v  ers  eGra  de
  stream toits originalgeometry (
  as much as possibl e)




  Hw
  Roa d %F  F a voura  bleGra  de
  1
  $  matching w ith upstream and dow nstream segments.




  y
  RP  Ref  erencePoint




  23
  /
  Incomappleux  Channel is 1. 5-2m w ide.  RPC  Rem ov  epla  st ic culv  erta  nd repla  cewit  hcros  sd it cha
  nd d itchblock




  d
  rR
  S
  RSP  Rem ov  es  ig npos  t
  River




  ve
  Ri
  WP1-  25=PFM /OS  8! Sumner
  9  RV  Rev  eg  et at e




  sh
  Fi
5626000




  5626000
  S tartofpul
  lback section.Partialpullback required  RWB  Cons  t ructrev  ers  ewa  t erba r




  R
  Hw
  Arrow Lake
  N




  Creek
50°47'




  oversteepened fil
  l.Outsl ope road surface.  y  RWC  Rem ov  ewood en culv  ert




  ak e FS
  31  Rd
  on  RWD  Rem ov  ewind row/  berm
  us




  S ugarL
  Pool




  N
  g




  50°47'
  r  RX  Rem ov  eexis  t ingcros  sd itch
  Fe




  31
  FS R
  S/  B  S wit  chba  ck
  WP1-  28=PFM /  OS  Creek
  Trout Lake
  SD  S loped is  ta nce




  y




  Dun
  rBay
  Old slump,novegetation.Has since been armoured




  Hw
  SM  Res  urf  a ceroa  d
  WP1- 26=X D




  can
  and is show ing nofurthersigns ofinstabil
  ity.Partialpul
  l  A  SP  S ig n pos  t




  te
  S hel
  Cross ditch required,fol
  l
  ow ribboned sk ew.




  Rive
  R
  back on overstepped fillsections.  SS  S poilS it  e




  FS
  $$
  1




  rFS
  e
  1  W  Cons  t ructwa  terba  r
  8
  9




  Lak




  R
  WBC  Wood en culv  ert
5625500




  5625500
  gar
  !




  Hw y 23
  WP1-
  29A=I
  S P/
  IAB  WR  Wid en roa  d




  S u
  WP1- 27=X D  XD  Cons  t ructcros  sd it  ch
  A
  !
  Cross ditch required,fol
  l
  ow ribboned sk ew.
  0 100 200  400  600  800  1,
  000
  à  WP1-29=N5-  125RB




  Hw
  Remove bridge.




  y
  S R




  31
  itk um F  SR
  S
  K ate-
  k F  M eters
  ee
  Cr  Coordinate S ystem:NAD1983U T M Z one 11N
  ar
  pl
  N




  K ate  Projection:T ransverse M ercator
  30"




  -  Po
  Out
  l  Datum:North American 1983
  50°46'




  etF
5625000




  50°5625000
  S R
  WP1- 30=I  S P/IAB  November12,2024




  N
  1:1,000,000




  30"
  Sa
  A


  £
  !  R
  FS




  dd
  Rd




  46'
  I
  nstal
  ldeactivation sign and sign post.  ork  ings




  l
  S pr




  eM
  R0  F
  rth  Hot
  SE  69
  I
  nstal
  llock bl ock w al
  l
  .  No




  ou
  11
  CT  S ource:Esri,M axar,EarthstarGeographics,and the GI
  S U ser




  nta
  I  10
  O
  Community




  in
  N_




  Rd
  TE
  N  R0
  SE  69
  CT  11
  I
  ON  7
  _S
  EV
  EN
  1:15,000
  EN
  7
  11




  R0  X:
  \Road Deactivation\2024\Revel
  stok e\I
  ncomappl
  eau Road Deactivation\Basemap\I
  ncomappl
  euxRoad Deactivation Overview 2024.
  mxd
  EV




  449500  450000  450500 117°4S2  451000  451500  452000  452500  453000  453500  454000 117°39'  454500  455000  W 455500  456000  456500  457000  457500  458000  458500  W459000  459500  460000  460500
  69




  1
  1 7°43'
  W  117°42'
  30"
  W  E'
  W  69  1
  17°41'
  30"
  W  1
  17°41'
  W  1
  17°40'
  30"W  1
  17°40'
  W  1
  17°39'
  30"
  W  W  1
  17°38'
  30"
  W  1
  17°38'  1
  17°37'
  30"
  W  117°37'
  W  1
  17°36'
  30"
  W  1
  17°36'
  W  1
  17°35'
  30"
  W  1
  17°35'  1
  17°34'
  30"
  W  117°34'
  W  1
  17°33'
  30"
  W
  C  11
  R0


  _S




  TI
  ON




  O  9
  N_
  I




  NI
  CT




  NE
  SE
</source_text>

Page images of the map or scan pages are attached (page 1). Look at them as well as the text.

Return the JSON for this document.
