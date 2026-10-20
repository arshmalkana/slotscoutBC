# Extraction task dm_notice-045a8cf5e8b4 (run 1)

Write your answer to `queue/answers/run1/dm_notice-045a8cf5e8b4.json` as:

```json
{ "task_id": "dm_notice-045a8cf5e8b4", "run": 1, "mode": "agent", "model": "Claude Code agent mode", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
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

- `raw/2026-10/dm_notices/images/DSE-2cb2b189-incomappleux_br2deact.p1.jpg` (page 1)

## Source

Source: District Manager notice DSE-2cb2b189-incomappleux_br2deact (2026-10-19T19:59:39.480Z)

<source_text>
ONE
  452500
  117°40'30"W  453000
  117°40'W  453500117°39'30"W  454000  117°39'W 454500  455000
  117°38'30"W  455500
  117°38'W  456000
  117°37'30"W  456500
  117°37'W  457000 117°36'30"W 457500  117°36'W458000  458500
  117°35'30"W  459000
  117°35'W  459500
  117°34'30"W  460000
  117°34'W  460500 117°33'30"W 461000  117°33'W461500  462000
  117°32'30"W  462500
  117°32'W  463000
  117°31'30"W  463500117°31'W  464000  117°30'30"W 464500  465000
  117°30'W  465500
  117°29'30"W  466000
  117°29'W  466500
  117°28'30"W  467000 117°28'W  467500  117°27'30"W 468000




  R08015 1
  Boyd Creek




  SECTUION_
  5639000




  50°54'N 5639000
50°54'N
5638500




  5638500
  Incomappleux River FSR
  Road Deactivation
5638000




  5638000
50°53'30"N




  Incomappleux River

  Prescription Map




  50°53'30"N
  Section 2




  SE

  R0
  R




  CT
  IVE




  801
  IO N
  XR
  01




  52
5637500




  5637500
  _TW
  EU
  97




  C
  Road Section Length (m)




  33

  PL




  O_
  AP




  C
  OM
  k
  ree




  IN C
  dC


  Secti
  on 2  7
  266m
  l an
  H  igh




  Sec ti
  on 2( to
  50°53'N
5637000




  5637000
  6
  412m




  50°53'N
  be surve ye d )
  McR
  ae
  Legend
  Cre  R0
  ek
5636500




  5636500
  SE  80
  CT  15
  IO  2
  N_
  TW
  O
  A  GPS Point
  50°52'30"N




  #
  *  Point of Commencement (POC)




  50°52'30"N
5636000




  5636000
  1
  $  Cross Ditch




  ek
  Kid Cre
  St
  ep
  h
  Ru
  by
  Sil
  8!
  9  Culvert
  ne  ve
  y  rC
  ree




  Deadsho
  C
  re  k
  à




  2
  X0
  ek  Bridge Removal




  2

  EU
  70
5635500




  5635500
  PL
  339




  t Creek
  AP
  Deactivation Prescription




  OM
  IN C
  / / / / / Pull Back Section
5635000 50°52'N




  To Be Surveyed in 2026




  50°52'N
  5635000
  Disturbed Areas




  k
  ee
  Cr
  FTEN Road Sections - Active




  on
  ny
  WP 2-1 = POC  River




  Ca
  Start of deactivation survey for Section 2




  g
  Bi
  Streams
R06911 14E5634500




  5634500
  Holden Cree
  #
  *  WP 2-2 = RWBC/RNSC/DAM
  Wooden box culvert present at backflow channel that connects
50°51'30"N




  river to wetland feature on the high side. RCRNSC. Create dam
  structure to prevent emptying of wetland feature into river. Rock




  k




  50°51'30"N
  available immediately adjacent for fill material.
  R069
  BRAN
5634000




  5634000
  11
  CH




  WP 2-3 = PFH - start
  14
  13




  Start of full pull back required along a 40m long section of rd.
  14C




  R0




  Some overloading on lip of bank with evidence of recent erosion.
  R06911




  69
  BR




  Lack of vegetation growth to provide stability. River flow is
  11
  AN


  14
  4D




  expected to erode outside bank. Rebuild required to get
  CH


  A
  11




  23




  equipment through- current road surface is 2m wide. Rock  Symbol  Description
  691
  5633500




  5633500
  9!
  8  Armouring recommended. Rock source confirmation required.  A  Ad v er se r  oad g  r ad e
  R0




  ARMOUR  Ar mourto pr  ev  e nte r  osi  on
  A
50°51'N




  BD  BlastDi  tc hli  ne
  A  WP 2-4 = PFH - end  BMC  Bac k up me tal c  ulv  er twi  thc  r oss d i tchand d itchbloc  k




  ek
  4B




  50°51'N
  re
  End of full pullback.  BP  Bur n pi  le
  R0
  1




  oC
  SA
  11




  69




  BPC  Bac k up plasti  cc  ulv  er twi  thc  r oss d i tc
  hand d i tchbloc  k
  B

  11
  69




  -t
  LE




  an
  A
  R0




  13




  BR  Brushr  oad
  13
  RO




  Le
5633000




  5633000
  B




  BRI DGE  Bridg  e c  rossi  ng
  AD


  911

  R
  R0




  SPU




  BWC  Bac k up wood e n c  ulv  er twi  thc  ross d itc hand d itc hbloc  k
  R06
  69




  WP 2-5 = NWR
  11




  CC  Cle an orr  e pai  rc  ulv er t
  No works required other than brushing requirements.
  1
  3B




  CD  Cle an d e br  isf  romd i  tc h
  A  CMP  Cor r ug ate d me tal pi  pe
  CPP  Cor r ug ate d plasti  cpi  pe
  CS  Constr  uc  tswale
  DS  Down S  lope

  à
  5632500




  5632500
  EC  Ex istingc  ulv  er  t
50°50'30"N




  Sa  Le  EDL  Ex istingd e li  ne ator
  xin
  bl
  e  g  ton  WP 2-6 = BRIDGE/RB/RNSC
  EW  Ex istingwate r  bar
  Cr  LEXINGTON CREEK. Remove bridge and restore natural stream




  50°50'30"N
  Cr
  ee  ee  EX  Ex istingc  r oss d i  tch
  k
  k  channel. Bridge is NOT passable Wet crossing required on high  F  Fav  our able r  oad g  rad e
  side. 1.5 hrs of machine time expected to create crossing.  FW  Fill inex  i sti  ngwate rbar
  FX  Fill inex  i sti  ngc  r oss d i tc h
  BRANCH 25

  R06911 15




  GR  Gr ad e r oad
5632000




  5632000
  IAB  Install ac  c e ss bar  rier  /be r m
  I
  BMC  Impr  ov  e bac  k up c  ross d i  tc hf  orame tal c  ulver t
  Carbonate King Creek  IBPC  Impr  ov  e bac  k up c  ross d i  tc haplasti  cc ulv
  ert
  IC  Install c  ulv  er t
  WP 2-7 = RNSC  ID  Impr  ov  e di  tc hli  ne
  No culvert present at small 0.5m wide S6. Water is being  IDL  Install d e li  ne atorpost
  diverted down ditch line and starting to pool on rd surface.  IRW  Impr  ov  e ex  i
  sti  ngr  ev  er  se wate r  bar
5631500




  5631500
  Restore natural stream channel. Expected rehab length of 20m.  IS  In slope r  oad sur  fac e
  50°50'N




  KEY MAP
  ISP  Install si  g npost
  IW  Impr  ov  e ex  i
  sti  ngwate r  bar




  50°50'N
  IX  Impr  ov  e Cr  oss Di  tc h
  JCT  Junc  tion
  WP 2-8 = RC/XD
  8!
  9
  A  Remove culvert and install cross ditch. Culvert is receiving
  L DG
  NDB
  Land i
  No d i
  ng
  tc hbloc  k
  ditchline flow from diverted S6 from station 2-7.  NS C  No si  de c  asti  ngofmate r  ial
5631000




  5631000
  NWR  No Wor  k Re qui  red




  Air
  OPP  Old pi  pe post(  le g al pr  ope r  ty mar  ker )




  po
  OS  Outslope r  oad sur  f ac e
  WP 2-9 = XD




  rt W
  ek  PF H  Pull bac  k si  dec  astf  ill he av  y(  > 6m)
  tt  Cre  Cross ditch required at ephemeral flow NCD.  PF L  Pull bac  k si  dec  astf  ill lig ht(  < 3m)
  Sco




  ay
  PF  M  Pull bac  k si  dec  astf  ill me d i  um(  3‐ 6m)
  $
  1
  50°49'30"N




  POC  Poi ntofComme nc  e me nt
  1
  $  WP 2-10 = XD  POT  Poi ntofT e r  mi  nati  on
5630500




  5630500
  50°49'30"N
  Cross ditch required at ephemeral flow NCD.  PWD  Pull bac  k wood y d e br  i s
  RB  Re mov  e br  idg  e
  WP 2-11 = XD




  /
  RC  Re mov  e c  ulv  er  t
  Incomappleux  Cross ditch required to catch outflow of steep slide path runoff.
  1
  $  RE CON  Re ‐c ontourto natur  al slope ang  le




  Hw
  River  $
  1  RMC  Re mov  e me tal c  ulv  er tand r  e plac  e wi thcross d itchand d i tchbloc
  k.




  /
  WP 2-12 = XD  RNS C  Re stor  e and ar  mournatur  al str e amc  hanne l




  y2
  A  Cross ditch required to catch slide path runoff.  Road %A  Ad v er se Gr  ad e
5630000




  5630000
  A  WP 2-13 = PFL
  Road %F  Fav  our able Gr  ad e




  3S
  RP  Re fer e nc  e Poi  nt




  Rd
  3/4 pullback required. Signs of small active slumping on low  RPC  Re mov  e plasti  cc  ulv  er tand r  e plac  e wi thcross d itchand d i tc
  hblock
  IN C




  side steep slopes. Vegetated slopes only require pullback along




  r
  RS P  Re mov  e si  g npost




  ve
  OMA

  3397




  lip of bank. Safety concerns with rockfall and danger trees above.  RV  Re v eg e tate
  Menhinick




  Ri
  PPL




  RWB  Constr  uc  tr  ev  er  se wate r  bar
  03




  Creek  Catarac
  50°49'N




  sh
  t Creek
  1
  $
  E




  RWC  Re mov  e wood e n c  ulv  er t
  WP 2-14 = PFL
  UX 0




  9!
  8




  Fi
  RWD  Re mov  e wi  nd r  ow/  be r  m
5629500




  5629500
  End of pullback. Erosion along outside riverbank where flow




  50°49'N
  Hw
  3




  RX  Re mov  e ex  isti  ngc  r oss d i  tch
  makes a sharp curve. Full pullback along non vegetated
  y3
  S /B  Swi  tchbac  k
  WP 2-15 = XD  slopes required, partial pullback along gentler side slopes
  1
  SD  Slope d i  stanc  e

  Rd
  Cross ditch required to catch outflow of slide path up the rd.
  Arrow Lake
  where vegetation is currently providing stability.  S M  Re sur  fac  e r  oad
  on
  B1




  Water is currently flowing on rd surface. Main waterflow will
  us
  SP  Sig n post
  R06911 12




  ek
  R0
  re  be dealt with at WP 2-16.
  r g  SS  Spoi  lS ite
  Fe
  69  C
  11
  rk  W  Constr  uc  twate r  bar
  1  2B  lki
  Se  A
5628500 50°48'30"N 5629000




  5629000
  WBC  Wood e n c  ulv  er  t
  WP 2-16 = RC/RNSC




  SR



  y 31
  WR  Wi denr  oad
  Culvert is 1200mm. Build up bank (~8 ft tall) along low side
  E
  12




  XD  Constr  uc  tc  ross d i  tc h




  Bay F
  LV




  8!
  9  of stream channel to encourage natural flow pattern. Install
  11

  W
  69

  TE




  Hw
  R0




  backup cross ditch 15m downslope of bank. Local rock
  N_




  Me  0 100 200  400  600  800  1,000
  Trout Lake
  IO




  nh
  E




  available for armouring and stream rehabilitation.
  CT




  ini
  HRE




  ck
  SE




  r
  C




  50°48'30"N
  Shelte
  ree
  A3
  _A _T




  k
  Meters
  11 12




  5628500
  SECTIO
  R06911 12B2




  ELVE




  04  04  Coordinate System: NAD 1983 UTM Zone 11N
  X  WP 2-17 = NWR
  R069




  97  EU  Projection: Transverse Mercator
  R06911




  33  Small NCD channel flowing across rd in natural low spot in
  PL
  T_TW




  AP
  8!
  9  Datum: North American 1983
  N_TWE




  M  rd grade. No work required.
  CO
  SEC




  December 12, 2025
  12A




  A1
  R06911 12  IN




  £
  LVE




  E_A_O  NE


  1:500,000
  N_TWELV
  SECTIO  Rennie Creek
  _A




  Hwy 23
  SEC




  WP 2-18 =
50°48'N 5628000




  5628000
  Plugged culvert has created wetland area above road.
  TION




  Source: Esri, Maxar, Earthstar Geographics, and the GIS User
  R069




  Retain culvert to maintain wetland feature above. Wetland
  r
  LVE_A_TWO




  Community
  ive
  _
  TWE

  11 12




  WP 2-19 = RC/XD  is now fish bearing. If the plugged culvert was removed the
  xR
  R06911 12A4




  Fe
  wetland area would drain as the level is much higher than  1:20,000
  LVE_




  R06911 12A2




  leu




  600mm. Do not skew cross ditch: maintain current flow pattern
  SPUR C
  A1




  rg
  Pool Cre ek




  u
  the culvert outlet.
  pp




  directly perpendicular to rd.




  so
  A_O




  SECTION_TWE




  ma




  50°48'N
  n
  452500  453000  453500  454000 117°39'W  454500  117°38'30"W455000  455500  456000  456500  457000  457500 117°36'W  458000  458500  459000  459500  460000  460500  461000  461500  462000  462500  463000  463500  464000  464500  465000  465500  466000  466500  467000  467500117°27'30"W  468000




  Cr
117°40'30"W  117°40'W  117°39'30"W  117°38'W  117°37'30"W  117°37'W  117°36'30"W  117°35'30"W  117°35'W  117°34'30"W  117°34'W  117°33'30"W  117°33'W  117°32'30"W  117°32'W  117°31'30"W  117°31'W  117°30'30"W  117°30'W  117°29'30"W  117°29'W  117°28'30"W  117°28'W
  NE




  o




  X:\Road Deactivation\2024\Revelstoke\Incomappleau Road Deactivation\Basemap\Incomappleux Road Deactivation Overview 2025.mxd




  ee
  Inc




  k
</source_text>

Page images of the map or scan pages are attached (page 1). Look at them as well as the text.

Return the JSON for this document.
