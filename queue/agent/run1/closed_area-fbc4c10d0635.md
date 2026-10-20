# Extraction task closed_area-fbc4c10d0635 (run 1)

Write your answer to `queue/answers/run1/closed_area-fbc4c10d0635.json` as:

```json
{ "task_id": "closed_area-fbc4c10d0635", "run": 1, "mode": "agent", "model": "Claude Code agent mode", "prompt_version": "closed_area.v1", "schema_id": "closed_area.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/closed_area.v1.json... } }
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

Source: Closed Areas Regulation, Schedule 7, section 48 (Beaver Lodge Trust Lands) (BC Laws consolidation current to October 13, 2026)

<source_text>
Schedule 7 No Hunting Areas (Section 8)
Beaver Lodge Trust Lands
48 That portion of M.U. 1-06 in the vicinity of Campbell River known as the Beaver Lodge Trust Lands and described as follows: Commencing at the northwest corner of the intersection of Merecroft Road and Trask Road; thence south along the west boundary of Trask Road to the north boundary of the SW 1/4 of Section 31, Township 1; thence east along said boundary approximately 405 m; thence approximately 15 m at 209° (Azimuth Bearing); thence approximately 9 m at 355°; thence approximately 60 m at 300°; thence approximately 10 m at 210°; thence approximately 125 m at 300°; thence approximately 34 m at 195°; thence approximately 125 m at 246°; thence approximately 105 m at 295°; thence approximately 130 m at 8°; thence approximately 70 m at 70°; thence approximately 13 m at 345°; thence approximately 220 m at 300° to the west boundary of Dogwood Street; thence south along said boundary to the northwest corner of North Simms Creek bridge; thence approximately 165 m at 357°; thence approximately 95 m at 267° to the southerly boundary of the watershed of North Simms Creek; thence in a general southeasterly direction along said boundary to the northern boundary of Rockland Road; thence west along said boundary to the northeast corner of South Simms Creek bridge; thence south along the east boundary of said bridge to the southern boundary of the watershed of South Simms Creek; thence southeast along said boundary to a point on the northern boundary of the SW 1/4 of Section 29, Township 1; thence west along said boundary to the west side of Dogwood Street; thence south along said street to the north boundary of the SW 1/4 of Section 20, Township 1; thence approximately 245 m west along said boundary; thence approximately 85 m at 119°; thence approximately 195 m west; thence approximately 65 m south to the boundary of Section 20, Township 1; thence west approximately 410 m; thence north approximately 810 m; thence approximately 140 m at 265° to the east boundary of the new Island Highway; thence north along said boundary to the south boundary of Block 24; thence south, north and west along the boundary of Block 24 to the west boundary of the SE 1/4 of Section 36, Township 2; thence north along said boundary of Section 36 to the northwest corner of the NE 1/4 of Section 36, Township 2; thence east to the point of commencement and including the following properties: (a) (i)the east 1/2 of the northeast 1/4 of Section 19; (ii)the northwest 1/4 of Section 20; (iii)the west 1/2 of the southwest 1/4 of Section 29; (iv)the east 1/2 of Section 30; (v)the east 1/2 of the west 1/2 of Section 30; (vi)the southeast 1/4 of Section 31; (vii)the east 1/2 of the northeast 1/4 of the southwest 1/4 of Section 31; (viii)the southeast 1/4 of the southwest 1/4 of Section 31, all in Township 1, Comox District, Plan 552; (b)Lot 3 of the northwest 1/4 of Section 20, Township 1, Comox District, Plan 33674; (c)Lot A of the northwest 1/4 of Section 20, Township 1, Comox District, Plan 33675; (d)Lot 1 of Section 20, Township 1, Comox District, Plan 47410; (e)Lot 1 of the northwest 1/4 of Section 20, Township 1, Comox District, Plan 50686; (f)that part of the northwest 1/4 of Section 20, Township 1, Comox District, Plan 552, shown outlined on Plan 50687; (g)Lot 1 of the southeast 1/4 of the southwest 1/4 of Section 31 and of the east 1/2 of the west 1/2 of Section 30, Township 1, Comox District, Plan 33674; (h)Lot 2 of the east 1/2 of Section 30, Township 1, Comox District, Plan 33674; (i)that part of the southeast 1/4 of Section 31, Township 1, Comox District, Plan 552, shown outlined on Plan 40784; (j)the 1.314 hectare portion of the southeast 1/4 of Section 31, Township 1, Comox District, Plan 552, dedicated as "Park" on Plan 47530; (k)Lot 1 of Section 31, Township 1, Comox District, Plan 47573; (l)Lot 1 of Section 31, Township 1, Comox District, Plan 51073; (m)Lot 2 of Section 31, Township 1, Comox District, Plan 51073; (n)Lot 3 of Section 31, Township 1, Comox District, Plan 51073; (o)Lot 4 of Section 31, Township 1, Comox District, Plan 51073; (p)Lot 5 of Section 31, Township 1, Comox District, Plan 51073; (q)Lot 6 of Section 31, Township 1, Comox District, Plan 51073, except that part shown on Plan VIP53432; (r)Lot A of the southeast 1/4 of Section 31, Township 1, Comox District, Plan VIP53432; (s)Lot B of the southeast 1/4 of Section 31, Township 1, Comox District, Plan VIP53432; (t)Lot 1 of the southeast 1/4 of Section 31, Township 1, Comox District, Plan 47530; (u)Lot 7 of Section 31, Township 1, Comox District, Plan 51073, except that part shown on Plan VIP53432; (v)that part of the west 1/2 of the southwest 1/4 of Section 29, Township 1, Comox District, Plan 552, lying to the east of the easterly boundary of the proposed Dogwood Street extension, with said easterly boundary as shown on Plan 7 Tube 1621 on deposit with the Surveyor General Branch of the Ministry of Water, Land and Air Protection, Victoria; (w)that part of the northwest 1/4 of Section 20, Township 1, Comox District, Plan 552, lying to the east of the easterly boundary of the proposed Dogwood Street extension, with said easterly boundary as shown on Plans 6 Tube 1621 and 7 Tube 1621 both on deposit with the Surveyor General Branch of the Ministry of Water, Land and Air Protection, Victoria, except Plans 33674, 33675 and 47410. [en. B.C. Reg. 194/99, s. 6 (d); am. B.C. Reg. 109/2002, s. 1.]
</source_text>

Return the JSON for this text.
