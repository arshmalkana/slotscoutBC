# Extraction task closed_area-afbefd3a9a25 (run 2)

Write your answer to `queue/answers/run2/closed_area-afbefd3a9a25.json` as:

```json
{ "task_id": "closed_area-afbefd3a9a25", "run": 2, "mode": "agent", "model": "Claude Code agent mode, fresh subagent", "prompt_version": "closed_area.v1", "schema_id": "closed_area.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/closed_area.v1.json... } }
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

Source: Closed Areas Regulation, Schedule 3, section 30 (Garibaldi Park) (BC Laws consolidation current to October 13, 2026)

<source_text>
Schedule 3 No Shooting or Hunting Areas (Section 4)
Garibaldi Park
30 All Crown land and land covered by water in Group l, New Westminster Land District and Lillooet Land District described as: Commencing at a point lying 4.023 km south and 201.1 m east of the southeast corner of District Lot 5316, New Westminster District; thence due South 3.25 km; thence due West 5.631 km; thence due South 4.827 km, more or less; thence due West to the southeast corner of District Lot 7224, Group 1, New Westminster District; thence west along the southerly boundary and the westerly production of the southerly boundary of said Lot 7224 a distance of 2.575 km; thence due South to a point, said point lying 1.65 km east and 1.85 km south of the southeast corner of Lot 3113, Group l, New Westminster District; thence in a northwesterly direction to the most easterly southeast corner of Lot 6421, Group l, New Westminster District; thence westerly, then southerly, then westerly along the easterly and southerly boundaries of said Lot 6421 to a point of intersection with the easterly boundary of Lot 3116, Group 1, New Westminster District; thence southerly along the easterly boundary of said Lot 3116 to the southeast corner and a point thereon; thence in a southerly direction to a point, said point lying 1.65 km east and 4.445 km south of the southeast corner of Lot 3113, Group 1, New Westminster District; thence due South 7.230 km; thence east 4.827 km; thence due South 9.654 km; thence due West 980 m; thence due South 985 m; thence due West 842 m, more or less, to a point due North of the northeast corner of District Lot 7132, Group 1, New Westminster District; thence due South 1.420 km, said point lying 500 m north of the northeast corner of Lot 7132, Group 1, New Westminster District; thence due West 200 m; thence due South 500 m to the northerly boundary of Lot 7132, Group 1, New Westminster District; thence due West 500 m along the said northerly boundary of Lot 7132 and the westerly prolongation thereof; thence due South 480 m; thence in a southeasterly direction 860 m to a point, said point lying 1.02 km south of the northeast corner of Lot 7132, Group 1, New Westminster District; thence due South 300 m; thence due East 804 m; thence due South 342 m; thence due East 3.226 km; thence due North 1.811 km; thence due East 1.609 km; thence due North 804 m; thence due East 1.609 km; thence due North 2 km; thence due East 3.5 km; thence due South 4.827 km; thence due East 38.5 km; thence due North 10.49 km; thence due West 5.705 km; thence north 2.415 km, more or less, to the southeast corner of District Lot 5533, being Indian Reserve No. 12 "Glazier Creek", Group 1, New Westminster District; thence east, and then in a general northerly then southeasterly direction along the south, west and north boundaries of said District Lot 5533 to the northeast corner thereof, said corner lying on the natural boundary of Glacier Lake, on the easterly shore thereof; thence in a general northerly, westerly then southerly direction along the natural boundary of Glacier Lake on the easterly, northerly and westerly shores thereof to a point thereon, said point lying 5.02 km north and 935 m east of the southeast corner of aforesaid District Lot 5533; thence due West 3.195 km; thence due North 7.242 km; thence due West 6.437 km; thence due North 30.578 km, more or less, to the 50 degree 14 minutes parallel of north latitude; thence west 19.312 km along said parallel; thence due South 9.254 km; thence due West 4.705 km; thence due South to a point of intersection with the natural boundary of Blackcomb Creek, on the left bank thereof; thence due South 50 m; thence in a general southerly direction parallel to and 50 m perpendicularly distant from the left bank of the natural boundary of Blackcomb Creek to a point lying due East of the northeast corner of Lot 4750 as shown on NTS Map 92J/2; thence due South 1.15 km; thence due East 100 m; thence due 325 m; thence due East 130 m; thence due South 370 m; thence due East 220 m; thence due South 1.3 km. thence due West 300 m; thence due South 700 m; thence due West 1.75 km; thence due South 1.5 km; thence due West 1.1 km; thence due South 545 m; thence due East 350 m; thence southerly and westerly along the height of land to Flute Peak; thence northwest in a straight line to Piccolo Peak; thence continuing northwest along the production of said straight line 1.86 km; thence west in a straight line to the point of commencement. EXCEPT Block A of District Lot 7132. The whole containing 194,904 hectares, more or less. [en. B.C. Reg. 185/90, s. 2.]
</source_text>

Return the JSON for this text.
