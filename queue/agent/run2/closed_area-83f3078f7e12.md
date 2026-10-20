# Extraction task closed_area-83f3078f7e12 (run 2)

Write your answer to `queue/answers/run2/closed_area-83f3078f7e12.json` as:

```json
{ "task_id": "closed_area-83f3078f7e12", "run": 2, "mode": "agent", "model": "Claude Code agent mode, fresh subagent", "prompt_version": "closed_area.v1", "schema_id": "closed_area.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/closed_area.v1.json... } }
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

Source: Closed Areas Regulation, Schedule 5, section 60 (Whistler) (BC Laws consolidation current to October 13, 2026)

<source_text>
Schedule 5 No Shooting Areas (Section 6)
Whistler
60 Those portions of the Province of British Columbia in the vicinity of the Resort Municipality of Whistler within the following described boundaries: (1)and (2) Repealed. [B.C. Reg. 72/2014, App. 1, s. 3 (b).] (3)Commencing at the center line of Highway 99 at its junction with the easterly boundary of the Resort Municipality of Whistler, hereinafter referred to as Whistler, and proceeding in a northerly and westerly direction along the boundary of Whistler to its intersection with the 1 200 m contour line immediately east of Nineteen Mile Creek; thence easterly and northerly along the contour line approximately 2 km to a point on the contour line, above Sixteen Mile Creek, at the junction of the easterly and southerly slopes of Rainbow Mountain; thence due northeast in a straight line across Sixteen Mile Creek to the 1 050 m contour line; thence easterly and northerly along the contour line to a point due West of the intersection of the power line and Highway 99 approximately 3 km northeast of the point of commencement; thence due East to that intersection; thence along the southerly and the easterly boundary of Highway 99 to a point due North of the junction of Rethel Creek and the Green River; thence across the Green River and up the northern and eastern natural boundary of Rethel Creek to its intersection with the boundary of Garibaldi Provincial Park; thence westerly along the boundary of the park to its intersection with the eastern boundary of Whistler; thence northerly and easterly and northerly along the boundary of Whistler to the point of commencement. (4)Commencing at the southwest corner of the Brandywine Falls Provincial Park boundary; thence due West up the slope of Mount Brew to the 3 000 ft. (900 m) contour line; thence in a southerly direction along that contour line to the point of its intersection with the unnamed creek originating at Brew Lake; thence in a southerly direction downstream to the confluence of the unnamed creek with Roe Creek; thence in an easterly direction, downstream to the mouth of Roe Creek at Shadow Lake; thence in an easterly direction, along the high water mark of the northerly shore of Shadow Lake to the point of intersection of the high water mark with a perpendicular, downward projection of the centerline of Highway 99 from the center of the Highway 99 bridge across the connecting waterway between Daisy Lake and Shadow Lake; thence northerly along the centerline of Highway 99 to the point of intersection with Brandywine Falls Provincial Park boundary; thence westerly along the southern boundary of Brandywine Falls Provincial Park to the southwest corner of Brandywine Falls Provincial Park, being the point of commencement. [am. B.C. Regs. 225/98, s. 4 (b); 72/2014, App. 1, s. 3.]
</source_text>

Return the JSON for this text.
