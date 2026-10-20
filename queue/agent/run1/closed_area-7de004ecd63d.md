# Extraction task closed_area-7de004ecd63d (run 1)

Write your answer to `queue/answers/run1/closed_area-7de004ecd63d.json` as:

```json
{ "task_id": "closed_area-7de004ecd63d", "run": 1, "mode": "agent", "model": "Claude Code agent mode", "prompt_version": "closed_area.v1", "schema_id": "closed_area.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/closed_area.v1.json... } }
```

The answer must match `schema/closed_area.v1.json` exactly. Use only the source text below. Never write coordinates. Every filled field needs its exact quote.

## Instructions

# closed_area.v1

You read one section of British Columbia's Closed Areas Regulation (B.C. Reg. 76/84) and return the named things and numbers in it, in the JSON schema `closed_area.v1`. Code, not you, finds those names in official datasets and draws the shape, and a person reviews every shape before it counts. Your answer is checked word for word against the source.

The text you get has the schedule heading and then the section. Read only that text. Do not use anything you know about the place from elsewhere.

How to fill the fields:

- `effect`: what the schedule heading or the section itself says is not allowed in the area: `no_shooting` (no shooting, or no shooting or hunting), `no_shooting_seasonal` (the same, only between dates), `no_shooting_hunting_exempt` (no shooting, but licensed hunting is allowed), `no_hunting` (closed to hunting only), `shot_only` or `shot_only_seasonal` (shotguns with shot only), `no_rifle` (no rifles), `non_toxic` (non-toxic shot only). Code also derives the effect from the schedule number and the two must agree. If neither heading nor section says it, leave `effect` null and list it in `uncertain`.
- `exemptions`: each exception the text states, in the text's words (for example a firearm type or a permit). Empty if none.
- `period`: only when the text gives dates. Copy them as written (for example "September 10" and "June 30").
- `within`: the regional district, municipality, management unit or region the text names ("That portion of Fraser Valley Regional District").
- `geometry.method`: `road_buffer` for a strip either side of a road, `waterbody_buffer` for a strip along a creek, river or lake, `admin_boundary` when the whole of a named area is closed, `metes_and_bounds` for a description that walks from landmark to landmark ("commencing at … thence …"), `other` otherwise.
- `geometry.road`: the road a buffer follows, with `source_hint` `highway` for numbered highways, `FTEN` for forest service roads, `DRA` for other named roads, `unknown` if unclear.
- `geometry.feature`: the creek, lake, reserve, park, lot or area a buffer or boundary follows.
- `geometry.buffer_m`: the distance in metres, as a number. Convert only when the text gives a unit (for example 0.4 km is 400). Never guess.
- `geometry.side`: `both` for "either side" or "each side".
- `geometry.from`, `geometry.to`: the limits of a road or creek strip ("between the midline of Farms Road and the midline of Dale Road").
- `geometry.steps`: for metes and bounds only, one step per "commencing" or "thence" clause, in order: `start`, `direction` (the direction words), `follow` (what the line follows), `feature` (the named feature), `side_or_bank`, `until` (the next landmark), `distance` (any stated distance, as written), and `quote` (the full clause).

Rules:

1. Every field you fill must have an entry in `quotes`: `field` is the field path (`effect`, `within`, `geometry.road`, `geometry.buffer_m`, `geometry.from`, `geometry.to`, `geometry.feature`, `geometry.side`, `period`, `exemptions[0]`, …) and `quote` is the shortest run of words from the text, copied exactly, that supports it. A field whose quote is not found in the text is thrown away.
2. Never write coordinates, bearings you computed, or place names that are not in the text.
3. Leave a field null when the text does not settle it, and add its path to `uncertain`. An empty answer with a clear `uncertain` list is better than a guess.
4. Do not decide whether the area is safe to shoot in, and do not summarise. Return only the JSON.


## Schema

```json
{
 "type": "object",
 "properties": {
  "effect": {
   "type": [
    "string",
    "null"
   ],
   "enum": [
    "no_shooting",
    "no_shooting_seasonal",
    "shot_only",
    "shot_only_seasonal",
    "no_rifle",
    "non_toxic",
    "no_shooting_hunting_exempt",
    "no_hunting",
    null
   ]
  },
  "exemptions": {
   "type": "array",
   "items": {
    "type": "string"
   }
  },
  "period": {
   "anyOf": [
    {
     "type": "null"
    },
    {
     "type": "object",
     "properties": {
      "start": {
       "type": "string"
      },
      "end": {
       "type": "string"
      }
     },
     "required": [
      "start",
      "end"
     ],
     "additionalProperties": false
    }
   ]
  },
  "within": {
   "anyOf": [
    {
     "type": "null"
    },
    {
     "type": "object",
     "properties": {
      "type": {
       "type": "string",
       "enum": [
        "regional_district",
        "municipality",
        "electoral_area",
        "wildlife_management_unit",
        "region",
        "other"
       ]
      },
      "name": {
       "type": "string"
      }
     },
     "required": [
      "type",
      "name"
     ],
     "additionalProperties": false
    }
   ]
  },
  "geometry": {
   "type": "object",
   "properties": {
    "method": {
     "type": "string",
     "enum": [
      "road_buffer",
      "waterbody_buffer",
      "admin_boundary",
      "metes_and_bounds",
      "other"
     ]
    },
    "road": {
     "anyOf": [
      {
       "type": "null"
      },
      {
       "type": "object",
       "properties": {
        "name": {
         "type": "string"
        },
        "source_hint": {
         "type": "string",
         "enum": [
          "DRA",
          "FTEN",
          "highway",
          "unknown"
         ]
        }
       },
       "required": [
        "name",
        "source_hint"
       ],
       "additionalProperties": false
      }
     ]
    },
    "feature": {
     "anyOf": [
      {
       "type": "null"
      },
      {
       "type": "object",
       "properties": {
        "type": {
         "type": "string",
         "enum": [
          "creek",
          "river",
          "lake",
          "reserve",
          "park",
          "municipality",
          "electoral_area",
          "lot",
          "island",
          "other"
         ]
        },
        "name": {
         "type": "string"
        }
       },
       "required": [
        "type",
        "name"
       ],
       "additionalProperties": false
      }
     ]
    },
    "buffer_m": {
     "type": [
      "number",
      "null"
     ]
    },
    "side": {
     "type": [
      "string",
      "null"
     ],
     "enum": [
      "both",
      "left",
      "right",
      "north",
      "south",
      "east",
      "west",
      "inside",
      "unknown",
      null
     ]
    },
    "from": {
     "anyOf": [
      {
       "type": "null"
      },
      {
       "type": "object",
       "properties": {
        "type": {
         "type": "string",
         "enum": [
          "road_intersection",
          "landmark",
          "km_point",
          "boundary",
          "shoreline",
          "other"
         ]
        },
        "road": {
         "type": [
          "string",
          "null"
         ]
        },
        "name": {
         "type": [
          "string",
          "null"
         ]
        }
       },
       "required": [
        "type",
        "road",
        "name"
       ],
       "additionalProperties": false
      }
     ]
    },
    "to": {
     "anyOf": [
      {
       "type": "null"
      },
      {
       "type": "object",
       "properties": {
        "type": {
         "type": "string",
         "enum": [
          "road_intersection",
          "landmark",
          "km_point",
          "boundary",
          "shoreline",
          "other"
         ]
        },
        "road": {
         "type": [
          "string",
          "null"
         ]
        },
        "name": {
         "type": [
          "string",
          "null"
         ]
        }
       },
       "required": [
        "type",
        "road",
        "name"
       ],
       "additionalProperties": false
      }
     ]
    },
    "steps": {
     "type": "array",
     "items": {
      "type": "object",
      "properties": {
       "start": {
        "type": [
         "string",
         "null"
        ]
       },
       "direction": {
        "type": [
         "string",
         "null"
        ]
       },
       "follow": {
        "type": [
         "string",
         "null"
        ],
        "enum": [
         "road",
         "creek",
         "river",
         "contour",
         "lot_line",
         "reserve_boundary",
         "district_boundary",
         "shoreline",
         "straight_line",
         "other",
         null
        ]
       },
       "feature": {
        "type": [
         "string",
         "null"
        ]
       },
       "side_or_bank": {
        "type": [
         "string",
         "null"
        ]
       },
       "until": {
        "type": [
         "string",
         "null"
        ]
       },
       "distance": {
        "type": [
         "string",
         "null"
        ]
       },
       "quote": {
        "type": "string"
       }
      },
      "required": [
       "start",
       "direction",
       "follow",
       "feature",
       "side_or_bank",
       "until",
       "distance",
       "quote"
      ],
      "additionalProperties": false
     }
    }
   },
   "required": [
    "method",
    "road",
    "feature",
    "buffer_m",
    "side",
    "from",
    "to",
    "steps"
   ],
   "additionalProperties": false
  },
  "quotes": {
   "type": "array",
   "description": "One entry per extracted field: the field path and the exact words of the source text it came from, copied verbatim.",
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
   "description": "Field paths the text does not settle. Leave those fields null.",
   "items": {
    "type": "string"
   }
  }
 },
 "required": [
  "effect",
  "exemptions",
  "period",
  "within",
  "geometry",
  "quotes",
  "uncertain"
 ],
 "additionalProperties": false
}
```

## Source

Source: Closed Areas Regulation, Schedule 3, section 29 (Pacific Rim (Westcoast) National Park) (BC Laws consolidation current to October 13, 2026)

<source_text>
Schedule 3 No Shooting or Hunting Areas (Section 4)
Pacific Rim (Westcoast) National Park
29 That portion of British Columbia in M.U.s 1-3 and 1-8 which is contained within the following described boundaries: PART I All those parcels or tracts of land, together with all that foreshore and land covered by water, situated in Clayoquot District and lying within the following described boundaries: Commencing at the northeast corner of Wya Indian Reserve No. 7; thence westerly along the northerly boundary of Wya Indian Reserve No. 7 and continuing westerly along the westerly production of said northerly boundary to the 20 metre isobath of the bed of the Pacific Ocean as shown on Canadian Hydrographic Service (C.H.S.) Chart 3603 and which indicates depths as being reduced to lowest normal tide, which at Tofino is 2.1 metres below mean water level; thence in a general northwesterly direction along said 20 metre isobath to the westerly production of the northerly boundary of District Lot 1360; thence easterly along said westerly production of the northerly boundary of District Lot 1360 to the northwest corner thereof, being a point on the natural boundary of Cox Bay, and continuing easterly along the northerly boundaries of District Lots 1360 and 256 to the northwest corner of the Northeast 1/4 of District Lot 256; thence southerly and easterly along the westerly and southerly boundaries of said Northeast 1/4 of District Lot 256 to the easterly boundary of District Lot 256; thence southerly along said easterly boundary of District Lot 256 to the southeast corner thereof; thence southerly in a straight line to the northwest corner of District Lot 1966; thence southerly and easterly along the westerly and southerly boundaries of District Lot 1966 and continuing easterly along the easterly production of the southerly boundary of said District Lot 1966 to the westerly boundary of District Lot 242; thence northerly along the westerly boundaries of District Lots 242, 243 and 250 to the northwest corner of said District Lot 250, being a point on the natural boundary of an unnamed arm of Browning Passage on the southerly shore thereon; thence in a general easterly direction along said natural boundary of the unnamed arm, being the northerly boundaries of District Lots 250, 249, 251 and 252 to the northeast corner of said District Lot 252; thence in a general northwesterly direction along said natural boundary of the unnamed arm and continuing in a general easterly direction along the natural boundary of Browning Passage, on the southerly shore thereof, to a point thereon, lying due West of the most westerly point of District Lot 1431; thence in a straight line, on a bearing of 45°, a distance of 221 metres, more or less, to a point thereof, lying due West of the most northerly point of Dinner Island, being part of District Lot 288; thence due East to said northerly point of Dinner Island and continuing due East 101 metres; thence in a straight line, on a bearing of 135°, to a point on the natural boundary of Browning Passage, on the southerly shore thereof, said point lying 704 metres due North and 604 metres due East, more or less, from the most westerly southwest corner of said District Lot 288; thence southeasterly along said natural boundary of Browning Passage to a point thereon, lying due West of the most westerly point of Indian Island; thence due East to said most westerly point of Indian Island; thence in a general northeasterly and southeasterly direction along the natural boundary of said Indian Island to the most easterly point thereon; thence southwesterly in a straight line to a point on the natural boundary of Tofino Inlet, on the southerly shore thereof, said point being 480 metres, more or less, due East of the most southerly point of District Lot 1680, being Indian Island Indian Reserve No. 30; thence in a straight line, on a bearing of 135° to the northerly boundary of the watershed of Grice Bay; thence in a general southeasterly direction along said northerly boundary of the watershed of Grice Bay to the westerly boundary of District Lot 1473; thence southerly along the westerly boundaries of District Lots 1473 and 1472 to the southwest corner of said District Lot 1472; thence due South to the northerly boundary of District Lot 494; thence easterly and southerly along the northerly and easterly boundaries of District Lots 494 and 487A to the northwest corner of District Lot 398; thence easterly along the northerly boundaries of District Lots 398 and 403 to the northwest corner of District Lot 404; thence southerly and easterly along the westerly and southerly boundaries of said District Lot 404 to the northwest corner of District Lot 1385; thence easterly and southerly along the northerly and easterly boundaries of said District Lot 1385 and the West 1/2 of District Lot 1321 to the southwest corner of the East 1/2 of District Lot 1321; thence easterly along the southerly boundaries of District Lot 1321 and 1320 to the northwest corner of the East 1/2 of District Lot 1314; thence southerly and easterly along the westerly and southerly boundaries of said East 1/2 of District Lot 1314 to the northwest corner of District Lot 428; thence easterly and southerly along the northerly and easterly boundaries of District Lot 428 to the southwest corner of District Lot 1313; thence easterly along the southerly boundary of said District Lot 1313 to the northeast corner of District Lot 442; thence southerly along the easterly boundaries of District Lots 442, 441, 447, 461 and 464 to the northeast corner of Lot 1 of District Lot 467, Plan 44818, on deposit in the Victoria Land Title Office; thence southerly and westerly along the easterly and southerly boundaries of said Lot 1, Plan 44818, to the northeast corner of Wya Indian Reserve No. 7, being the point of commencement. EXCEPT FIRSTLY: the whole of Oo-oolth Indian Reserve No. 8, Quisitis Indian Reserve No. 9, Kootowis Indian Reserve No. 4, Esowista Indian Reserve No. 3 and Indian Island Indian Reserve No. 30 SECONDLY: the Tofino Airport, described as: (a)District Lots 167, 168, 169, 170 and 178, Clayoquot District; (b)those portions of District Lots 163, 164 and 165 lying to the north of Tofino-Ucluelet Highway, Plan 1417RW, except thereout, from said District Lot 163, Parcel A, Plan 32328, with both Plans on deposit in the Victoria Land Title Office; (c)those portions of District Lots 113, 166 and 192 lying to the north and east of Tofino-Ucluelet Highway, Plan 1417RW, on deposit in the Victoria Land Title Office; (d)those portions of District Lots 193, 194, 195 and 196 lying to the east of Plan 1371RW, on deposit in the Victoria Land Title Office. PART II All those parcels or tracts of land, together with all that foreshore and land covered by water, situated in Barclay District and lying within the following described boundaries: Commencing at the centre of Sail Rock, being a small islet west of Benson Island, District Lot 43; thence due North 2.735 kilometres; thence in a straight line, on a bearing of 38°, a distance of 8.046 kilometres; thence in a straight line, on a bearing of 115° 30', a distance of 9.334 kilometres; thence in a straight line, on a bearing of 217°, a distance.of 12.391 kilometres; thence in a straight line, on a bearing of 296°, a distance of 6.598 kilometres, more or less, to a point due South of the centre of Sail Rock; thence due North 1.931 kilometres, more or less, to the centre of Sail Rock, being the point of commencement. EXCEPT the whole of each of the following: Cleho Indian Reserve No. 6, Keith Island Indian Reserve No. 7, Nettle Island Indian Reserve No. 5 and Omoah Indian Reserve No. 9. PART III Firstly: Lot A of Section 18, Plan 38380 on deposit in the Victoria Land Title Office, and the West 1/2 of the North 1/2 of the North 1/2 of the Southeast 1/4 of said Section 18, all of Township 1, Barclay District. Secondly: Lot 1 of Sections 1 and 12, Plan 44813, Lot 1 of Section 1, Plan 27489, and Lot A of Section 1, Plan 10982, all of Township 11, Renfrew District, all plans on deposit in the Victoria Land Title Office. Thirdly: All those parcels or tracts of land, together with all that foreshore and land covered by water, situated in Barclay and Renfrew Districts, and lying within the following described boundaries: Commencing at the southwest corner of Oyees Indian Reserve No. 9, Renfrew District, being a point on the natural boundary of Nitinat Lake, on the southeasterly shore thereof; thence easterly along the southerly boundary of said Oyees Indian Reserve No. 9 to the southeast corner thereof; thence due South 1.006 kilometres; thence due East 783 metres; thence southerly in a straight line to the northwest corner of Block A of District Lot 756; thence easterly along the northerly boundary of said Block A of District Lot 756 to the northeast corner thereof; thence southerly along the easterly boundaries of Blocks A and B of District Lot 756 to Pipe Post No. 1, being a point on the easterly boundary of the Reserve for Pacific Rim National Park as shown on Plan 12 Tube 1410 on file with the Surveyor General Branch of the Ministry of Water, Land and Air Protection, Victoria, a duplicate of which is deposited as Plan 71572 in the Canada Lands Surveys Records at Ottawa; thence in general westerly and southwesterly directions along said easterly boundary of the Reserve for Pacific Rim National Park as shown on said Plan 12 Tube 1410 to the northeast corner of Section 56; thence southerly along the easterly boundary of said Section 56 to the southeast corner thereof; thence in a straight line, on a bearing of 190°, a distance of 609 metres; thence southeasterly, in a straight line to the northeast corner of Section 50; thence southeasterly in a straight line to a point on the easterly boundary of District Lot 727, said point being 340 metres due North and 1.319 kilometres due West, more or less, from the northeast corner of District Lot 730; thence due East to the natural boundary of Carmanah Creek, on the right bank thereof; thence in a general southerly direction along said natural boundary of Carmanah Creek to a point 305 metres due South and 230 metres due East, more or less, from the northeast corner of District Lot 729; thence southeasterly in a straight line to the most northerly northeast corner of District Lot 732; thence southerly and easterly along the easterly and northerly boundaries of said District Lot 732 to the northwest corner of District Lot 734; thence easterly and southerly along the northerly and easterly boundaries of said District Lot 734 to the northerly boundary of District Lot 49; thence easterly along the northerly boundaries of District Lots 49 and 736 to the northeast corner of said District Lot 736; thence southerly along the easterly boundary of said District Lot 736 to the northwest corner of District Lot 737; thence easterly along the northerly boundary of said District Lot 737 to the northeast corner thereof; thence in a straight line, on a bearing of 110°, a distance of 7.320 kilometres; thence due East 4.828 kilometres; thence due North 920 metres; thence northeasterly in a straight line to the northwest corner of District Lot 708; thence easterly along the northerly boundary of said District Lot 708 to the northeast corner thereof; thence easterly in a straight line to the southwest corner of the Fractional South 1/2 of Section 11, Township 11; thence northerly and easterly along the westerly and northerly boundaries of said Fractional South 1/2 of Section 11 to a point on the natural boundary of Gordon River, on the right bank thereof, and shown as the most northerly northeast corner of Lot A of said Section 11, Township 11, Renfrew District, Plan 44812, on deposit in the Victoria Land Title Office; thence in a general southerly direction along said natural boundary of Gordon River and continuing southerly along the natural boundary of San Juan River, on the right bank thereof, to the natural boundary of Port San Juan, on the northwesterly shore thereof; thence in a general southwesterly direction along said natural boundary of Port San Juan to a point lying 1.0 metres, more or less, due South of the P. Rock shown on Plan 7 Tube 1550, on file with the Surveyor General Branch of the Ministry of Water, Land and Air Protection, Victoria, a duplicate of which is deposited as Plan 73926, in the Canada Lands Surveys Records at Ottawa, being a survey of part of the easterly boundary of the Reserve for Pacific Rim National Park; thence southerly along said easterly boundary of the Reserve for Pacific Rim National Park, as shown on said Plan 7 Tube 1550 to the P. Rock at the most easterly point of Owen Island, shown on said Plan 7 Tube 1550, and continuing southerly along the southerly production of said easterly boundary to the 20 metre isobath of the bed of Juan de Fuca Strait, as shown on Canadian Hydrographic Service (C.H.S.) Chart 3606 and which indicates depths as being reduced to lowest normal tide, which at Port Renfrew is 2.0 metres below mean water level; thence in a general northwesterly direction along said 20 metre isobath of the bed of Juan de Fuca Strait and continuing in general northwesterly and northeasterly directions along the 20 metre isobath of the bed of the Pacific Ocean as shown on Canadian Hydrographic Service (C.H.S.) Chart 3602 and which indicates depths as being reduced to lowest normal tide, which at Bamfield is 2.0 metres below mean water level, to a point thereon, lying due West of the northwest corner of District Lot 412, Barclay District; thence due East to said northwest corner of District Lot 412, being a point on the natural boundary of Tapaltos Bay, on the northerly shore thereof; thence easterly along the northerly boundaries of District Lot 412, Fractional Section 7 and Fractional Section 8 of Township 1, to the northwest corner of Anacla Indian Reserve No. 12; thence southerly along the westerly boundary of Anacla Indian Reserve No. 12 to the southwest corner thereof, being a point on the natural boundary of Pachena River on the right bank thereof; thence in a straight line, on a bearing of 100°, a distance of 183 metres, more or less, to the natural boundary of Pachena Bay, on the northeasterly shore thereof, being a point on the southerly boundary of said Anacla Indian Reserve No. 12; thence in a general southeasterly direction along said natural boundary of Pachena Bay to the southeast corner of said Anacla Indian Reserve No. 12; thence northerly along the easterly boundary of Anacla Indian Reserve No. 12 to the northwest corner of Lot 1 of Section 9, Township 1, Plan 44819, on deposit in the Victoria Land Title Office; thence easterly and southerly along the northerly and easterly boundaries of said Lot 1, Plan 44819, to the northwest corner of the Northeast 1/4 of Section 4, Township 1; thence southerly along the westerly boundary of said Northeast 1/4 of Section 4 to the southwest corner thereof; thence southwesterly in a straight line to the northeast corner of District Lot 659; thence southwesterly in a straight line to the northwest corner of District Lot 273; thence southerly and easterly along the westerly and southerly boundaries of said District Lot 273 to the northeast corner of District Lot 275; thence southerly along the easterly boundary of said District Lot 275 to the southeast corner thereof; thence southeasterly in a straight line to the northwest corner of District Lot 281; thence easterly along the northerly boundaries of District Lots 281 and 282 to the Pipe Post set as a quarter post on the northerly boundary of said District Lot 282; thence in a straight line, on a bearing of 140°, a distance of 240 metres; thence in a straight line, on a bearing of 108°, a distance of 680 metres; thence in a straight line, on a bearing of 119°, a distance of 1.670 kilometres; thence easterly in a straight line to the northwest corner of District lot 288; thence southeasterly in a straight line to the most northeasterly internal angle of District Lot 103; thence easterly along the northerly boundaries of District Lot 103, 60 and 59 to the northwesterly internal angle of District Lot 59; thence easterly in a straight line to the northwest corner of District Lot 527; thence easterly along the northerly boundary of District Lot 527, Barclay District, a distance of 650 metres, more or less, to the northwesterly boundary of the watershed of Tsusiat Lake; thence in a general northeasterly direction along the northwesterly boundaries of the watersheds of Tsusiat and Hobiton Lakes to a point thereon, being 3.010 kilometres due North and 1.690 kilometres due West, more or less, of the northwest corner of Homitan Indian Reserve No. 8; thence due East 600 metres; thence in a straight line, on a bearing of 139°, a distance of 1.100 kilometres; thence due South to the northwesterly boundary of the watershed of Nitinat Lake; thence in a general southwesterly direction along said northwesterly boundary of the watershed of Nitinat Lake to a point thereon, being 260 metres due North and 860 metres due West, more or less, of the northwest corner of Homitan Indian Reserve No. 8; thence southeasterly in a straight line to the intersection of the natural boundary of Hobiton Creek, on the left bank thereof, with the westerly boundary of Homitan Indian Reserve No. 8; thence southerly and easterly along the westerly and southerly boundaries of Homitan Indian Reserve No. 8 to the southeast corner thereof, being a point on the natural boundary of Nitinat Lake, on the westerly shore thereof; thence in a general southwesterly direction along said natural boundary of Nitinat Lake to a point thereon, lying due North of the northwest corner of District Lot 769, Renfrew District; thence southeasterly in a straight line to the most northerly point of Block A of District Lot 746, Renfrew District, being a point on the natural boundary of Nitinat Lake, on the southerly shore thereof, thence in general easterly and northeasterly directions along said natural boundary of Nitinat Lake, on the southerly and southeasterly shores thereof, to the southwest corner of Oyees Indian Reserve No. 9, being the point of commencement. EXCEPT Firstly: the whole of each of the following: Ahuk Indian Reserve No. 1, Carmanah Indian Reserve No. 6, Cheewat Indian Reserve No. 4A, Claoose Indian Reserve No. 4, Clutus Indian Reserve No. 11, Cullite Indian Reserve No. 3, Iktuksasuk Indian Reserve No. 7, Kich-ha Indian Reserve No. 10, Masit Indian Reserve No. 13, Sarque Indian Reserve No. 5, Tsuquanah Indian Reserve No. 2, and Wyah Indian Reserve No. 3; Secondly: Lot 2 of Block 10, Lots 1 and 2 of Block 16, Lot 8 of Block 18 and Lot 3 of Block 37, all of Section 57, Plan 1771, and Block 7 of District Lot 527, Plan 2008, and Section 63, all in Renfrew District, with both Plans on deposit in the Victoria Land Title Office. PART IV All those parcels or tracts of land, together with all that foreshore and land covered by water, situated in Clayoquot District and lying within the following described boundaries: Commencing at the northeast corner of Section 70, Alberni District (situated in Clayoquot District), being a point on the natural boundary of Kennedy Lake, on the southerly shore thereof; thence southerly along the easterly boundary of said Section 70 to the northwesterly limit of Alberni-Tofino Highway, as shown on Plan 1936RW, on deposit in the Victoria Land Title Office; thence in a general southerly direction along the westerly limit of said Alberni-Tofino Highway to the southeast corner of Lot 1 of Sections 69 And 70, Alberni District (situated in Clayoquot District), Plan 44820, on deposit in the Victoria Land Title Office; thence westerly, northerly, westerly and northerly along the southerly and westerly boundaries of said Lot 1 to the northwest corner thereof, being a point on the natural boundary of Kennedy Lake, on the southerly shore thereof; thence due North 300 metres; thence easterly in a straight line to a point 500 metres due North of the northeast corner of said Section 70; thence due South to said northeast corner of Section 70, being the point of commencement. [en. B.C. Reg. 205/94, s. 6; am. B.C. Reg. 109/2002, s. 1.]
</source_text>

Return the JSON for this text.
