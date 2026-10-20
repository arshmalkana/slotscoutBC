# Extraction task closed_area-78cdb74f80b0 (run 2)

Write your answer to `queue/answers/run2/closed_area-78cdb74f80b0.json` as:

```json
{ "task_id": "closed_area-78cdb74f80b0", "run": 2, "mode": "agent", "model": "Claude Code agent mode, fresh subagent", "prompt_version": "closed_area.v1", "schema_id": "closed_area.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/closed_area.v1.json... } }
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

Source: Closed Areas Regulation, Schedule 5, section 63 (Nicomen) (BC Laws consolidation current to October 13, 2026)

<source_text>
Schedule 5 No Shooting Areas (Section 6)
Nicomen
63 Those 4 portions of the Province of British Columbia in Fraser Valley Regional District within the following described boundaries: (1)Commencing at the intersection of Farms Road and Legace Creek and proceeding northerly along Farms Road to its intersection with Durieu Road; thence easterly along the line of the northerly boundary of Durieu Road right of way to the point of intersection of that line with the easterly boundary of the Sylvester Road right of way and thence southerly along the right of way to the point of its intersection with a line drawn due East from the southerly boundary of the Seux Road right of way; thence westerly along that line of the southerly boundary of the right of way; thence westerly and northerly along the southerly and westerly boundary of the Seux Road right of way to the point of its intersection with Legace Creek; thence westerly along the southerly natural boundary of the creek to the point of commencement. (2)Commencing at the intersection of the westerly natural boundary of Hatzic Slough and Dale Road; thence northeasterly along the northwesterly natural boundary of the slough to its intersection with Farm's Road; thence southerly along the easterly boundary of Farm's Road to its intersection with Hatzic Slough, located approximately 1 000 m south of the intersection of Dale Road and Farm's Road; thence westerly, northerly and northeasterly along the southerly then westerly natural boundary of the slough to the point of commencement. (3)Commencing at the intersection of Eagle Road and Highway 7; thence westerly along the north side of the right of way of Highway 7 to its intersection with the boundary of the Municipality of Mission; thence generally northerly and westerly along the boundary to its intersection with the 20 m contour line south and west of the end of Sward Road; thence along the contour line to a point due West of the most easterly point of the northeast-southwest component of Sward Road; from thence due East to that point of reference; thence southeasterly in a straight line across Hatzic Lake to a point on the natural boundary of the lake 150 m north of a point due West of the east-west portion of Shore Road, thence easterly in a straight line parallel to Shore Road to the intersection of the line and Eagle Road; thence southerly along Eagle Road to the point of commencement. (4)Commencing at the intersection of Ross Road and Highway 7; thence northerly along the westerly boundary of Ross Road; thence due North to Taylor Road; thence easterly along the northerly boundary of the road right of way to the point of its intersection with Deroche Creek; thence up the westerly bank of Deroche Creek to North Nicomen Road; thence westerly along the southerly boundary of the road right of way to a point at the westerly end of a curve located approximately 350 m west of Park Road; thence due North to the 60 m contour line; thence northerly along the contour line to its intersection with Deroche Creek; thence northerly up Deroche Creek to its intersection with the 200 m contour line; thence northeasterly along the contour line to its intersection with Sasin Creek; thence northerly up Sasin Creek to the 305 m contour line; thence easterly and northerly along the contour line to its intersection with an unnamed creek channel whose confluence with Elbow Creek is located approximately 350 m southerly from the outlet of Elbow Lake; thence easterly down the creek channel to the point where it intersects the Elbow Lake Road; thence southerly and easterly along the northerly and easterly boundary of the road right of way to the southerly end of a curve in the road which is located approximately 600 m north of the intersection of Elbow Lake Road and Highway 7; thence due East to the natural boundary of the Harrison River; thence southerly along the natural boundary to the No. 7 Highway Harrison River bridge; thence westerly and southerly along the natural boundary of Harrison Bay to the southeasterly corner of the Squawkum Creek Indian Reserve Number 3; thence due South to the 200 m contour line; thence westerly and southerly along the contour line to the channel of an unnamed creek which crosses Malcolm Road 50 m southeast of the intersection of Malcolm Road and Hodgkin Road; thence southwesterly down the creek channel to Malcolm Road; thence northwesterly along Malcolm Road to its intersection with the Canadian Pacific Railway right of way; thence southwesterly along the southerly boundary of the railway right of way to its intersection with Highway 7; thence southeasterly and southwesterly along the easterly and southerly boundary of the highway right of way to the point of commencement, excepting Indian Reserve lands. (5)Commencing at the intersection of Farms Road and Mountainview Road and proceeding northerly along the westerly boundary of the Mountainview Road right of way to the point of its intersection with Hatzic Slough; thence due North to the northerly natural boundary of Hatzic Slough; thence southwesterly along the natural boundary to its intersection with the southerly boundary of the Farms Road right of way; thence westerly along that boundary to the point of commencement. [am. B.C. Regs. 109/85, s. 3 (g); 235/97, s. 3 (c).]
</source_text>

Return the JSON for this text.
