# Extraction task closed_area-b6dad8f5fdc9 (run 1)

Write your answer to `queue/answers/run1/closed_area-b6dad8f5fdc9.json` as:

```json
{ "task_id": "closed_area-b6dad8f5fdc9", "run": 1, "mode": "agent", "model": "Claude Code agent mode", "prompt_version": "closed_area.v1", "schema_id": "closed_area.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/closed_area.v1.json... } }
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

Source: Closed Areas Regulation, Schedule 9, section 22 (Highways) (BC Laws consolidation current to October 13, 2026)

<source_text>
Schedule 9 Firearms Using Shot Only Areas (Section 10 (1) (a))
Highways
22 Those portions of the Province of British Columbia being all areas within 0.4 km (0.25 mile) of either side of the road allowance of portions of the following highways and roads in British Columbia: (a)Highway 16 between the boundary of the City of Prince Rupert and the British Columbia-Alberta interprovincial boundary; (b)Highway 37 between the Skeena River Bridge at Kitwanga Post Office, Cassiar Land District, and the British Columbia-Yukon boundary; (c)Highway 97, including those portions of the Cariboo Highway from Cottonwood River to Prince George, the John Hart Highway from Prince George to Dawson Creek, and the Alaska Highway from Dawson Creek to Lower Post; (d)Highway 37 between the intersection of Highway 37 with Highway 16 and the boundary of the District of Kitimat; (e)Highway 29 between the intersection of Highway 29 with Highway 97 in the vicinity of the village of Chetwynd and the intersection of Highway 29 with Highway 97 in the vicinity of Charlie Lake, Peace River Land District; (f)Repealed. [B.C. Reg. 169/2020, App. 1, s. 4.] (g)Highway 35 between Francois Lake and Burns Lake; (h)Highway 6 between Bench Creek and Banting Creek; (i)Tibbles Road in M.U. 5-13 from Nazko Road to 2000 Road; (j)Highway 5 (Coquihalla Highway) between Hope and the junction of Highways 1 and 5 at Kamloops; (k)Canyon Drive (Road 520) between Hudson's Hope and the W.A.C. Bennett Dam; (l)Twelve Mile Road (Road 190) between Canyon Drive (Road 520) and the boat ramp on Dunlevy inlet, and the unnamed road (formerly known as the 190A Road) from Twelve Mile Road (Road 190) to the bridge on Dunlevy Creek; (m)Highway 27, from the junction with Route 16 (Yellowhead) west of Vanderhoof to Fort St. James; (n)Highway 39, from the junction with Highway 97 north of McLeod Lake to its intercept with the municipal boundaries of the City of Mackenzie; (o)Tatlayoko Road (Project #405) from its intersection with the Eagle Main Road (Project #693) southerly to its end; (p)Robertson Road (Project #249), and any side roads to Robertson Road, from its intersection with Highway 97 at District Lot 61, Cariboo Land District, northerly to its intersection again with Highway 97 at the village of McLeese Lake; (q)Horn-Bluff Lakes Road (Highway #341) from a point south 89° 29' 20" east of the southwest corner of Lot 172, Range 2, Coast Land District, along the midline of Highway #341 to the point of intersection with the south boundary of Lot 791; (r)Highway 37A between the intersection of said highway and Highway 37 at Meziadin Junction and the boundary of the District of Stewart at Bitter Creek; (s)Topley Landing Road (Highway 118) between Topley and Granisle; (t)West Fraser Road from City of Quesnel city limits southerly to Grouse Road and those portions of M.U. 5-2 and M.U. 5-14 on the east side of the Fraser River in the vicinity of West Fraser Road all of which are highlighted in yellow on the attached map 'Closed Area No. 9-22t/26'; (u)Highway 113 between Terrace and Sterling Mountain Parking Lot Recreation Site as shown highlighted in red on the attached map 'Closed Area 9-22u/26'. [en. B.C. Reg. 211/93, s. 10; am. B.C. Regs. 205/94, s. 29; 235/97, s. 5 (c); 225/98, s. 6 (b); 170/2001, s. 4; 221/2005, s. 4; 130/2016, App. 1, s. 5; 169/2020, App. 1, s. 4; 97/2026, App. 1, s. 4.]
</source_text>

Return the JSON for this text.
