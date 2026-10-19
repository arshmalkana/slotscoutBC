# Extraction task road_notice-8bfa3fcaf53d (run 2)

Write your answer to `queue/answers/run2/road_notice-8bfa3fcaf53d.json` as:

```json
{ "task_id": "road_notice-8bfa3fcaf53d", "run": 2, "mode": "agent", "model": "<your model id> (Claude Code subagent)", "prompt_version": "road_notice.v1", "schema_id": "road_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/road_notice.v1.json... } }
```

The answer must match `schema/road_notice.v1.json` exactly. Use only the source text below. Never write coordinates. Every filled field needs its exact quote.

## Instructions

# road_notice.v1

You read one resource road notice from a British Columbia natural resource district road safety page (or a District Manager notice linked from it) and return the road and each km point with its status, in the JSON schema `road_notice.v1`. Code places the km points on the official road line; a closure that is lifted or a notice that disappears always waits for a person.

Read only the notice text. Do not use anything you know about the road from elsewhere.

How to fill the fields:

- `road.name`: the road name as written (for example "Harrison East FSR"). `road.file_section`: the file and section number if given ("5748.01"), else null.
- `posted_on`: the date in brackets after the road name, as YYYY-MM-DD, or null.
- `rescinded`: true only if the notice says it is rescinded, lifted, cancelled or that the road has reopened.
- `points`: one entry per km point or stretch the notice names, with:
  - `km` (number) and, for a stretch, `km_end`;
  - `extent`: `at` for a hazard at a point, `beyond` for "past", "beyond" or "no access at" a point (travel past it is blocked), `range` for "between X and Y km" or "from X to Y km", `whole_road` when the notice closes the whole road, `unknown` if the text does not say;
  - `status`: `closed` (closed, no access, impassable), `restricted` (restricted access, access control), `gated`, `washout` (a washout that blocks travel), `bridge_out` (bridge or structure out or closed), `deactivated`, or `caution` (hazards to drive with care: cracks, erosion, rockfall, debris, narrow road, a washout you can drive around);
  - `quote`: the full sentence the point comes from, copied exactly.
  A closure with no km point gets one entry with `km` null and `extent` `whole_road` or `unknown`.

Rules:

1. Every field you fill must have an entry in `quotes` (`road.name`, `road.file_section`, `posted_on`, `rescinded`) with the exact words it came from; each point carries its own `quote`. A value whose quote is not found in the text is thrown away.
2. Never write coordinates or place km points yourself.
3. If a sentence names km points but you cannot tell the status, use the stricter reading only if the text supports it; otherwise leave the point out and add `points` to `uncertain`.
4. Return only the JSON.


## Schema

```json
{
 "type": "object",
 "properties": {
  "road": {
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
    }
   },
   "required": [
    "name",
    "file_section"
   ],
   "additionalProperties": false
  },
  "posted_on": {
   "type": [
    "string",
    "null"
   ]
  },
  "rescinded": {
   "type": "boolean"
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
     "quote": {
      "type": "string"
     }
    },
    "required": [
     "km",
     "km_end",
     "extent",
     "status",
     "quote"
    ],
    "additionalProperties": false
   }
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
  "road",
  "posted_on",
  "rescinded",
  "points",
  "quotes",
  "uncertain"
 ],
 "additionalProperties": false
}
```

## Source

Source: District Manager notice DQC-8d4c7fb4-bonanza_fsr_822907_closure (2026-10-19T18:09:51.041Z)

<source_text>
File:11250-32/8229.07 Bonanza


October 28, 2024


Notice is given under Section 22.2(3) of the Forest and Range Practices Act that the Bonanza
FSR (8229.07) is hereby closed at 14.0 km effective immediately until further notice.


Forest and Range Practices Act
Non-industrial use of a road

                      22.2 (1)Subject to subsections (2) to (4) and to regulations respecting roads made
                      under the Industrial Roads Act, a road that is
                                    (a)a forest service road, or
                                    (b)authorized under a road permit or a woodlot licence

                      may be used by any person without charge for a purpose other than a timber harvesting
                      purpose, silviculture purpose or natural resource development purpose.
                      (2)The
                                    (a)district manager, for a forest service road, or
                                    (b)holder of a road permit or a woodlot licence, for a road under the permit
                                    or licence,

                      may take action under subsection (3) if
                                    (c)use of the road under subsection (1) would likely
                                               (i)cause significant damage to the road,
                                               (ii)cause significant sediment delivery, or
                                               (iii)endanger property, public health or public safety, or
                                    (d)the presence on the road of a vehicle or animal would likely cause
                                    damage to the road or environment or endanger life or property.
                      (3)In the circumstances described in subsection (2),
                                    (a)the district manager, for a forest service road, may
                                               (i)close the road or restrict its use, or
                                               (ii)remove a vehicle or an animal from the road at the expense of
                                               the owner of the vehicle or animal, and


Ministry of Forests            Haida Gwaii Natural Resource   Location:                    Mailing Address:
                               District                       1229 Oceanview Drive         Box 39
                                                              Daajing Giids BC             Gaajing Giids BC V0T 1S0
                                                                                           Tel:      (250) 559-6200
                                                                                           Fax:      (250) 559-8342
                              (b)the holder of a road permit or a woodlot licence, for a road under the
                              permit or licence,
                                      (i)with the prior consent of the minister, may close the road or
                                      restrict its use, or
                                      (ii)may remove a vehicle or an animal from the road at the expense
                                      of the owner of the vehicle or animal.

This action is in response to the washout of a creek crossing located at 14km posing a safety risk
to road users.
Thank you for your cooperation during this time.




Risha Rushton
District Manager




                                                                                               Page 2 of 2
              Bonanza FSR 8229.07 CLOSURE


                                                                 ±
                                                  NAD 1983 BC Albers
                                                  Scale: 1:35,000
                                                  District: DHG




                                   Bo
                                                  Region: RWC




                                   na
                                                  Location: Haida Gwaii




                                    nza
                                        FS
                                        R8
                                                          Legend




                                          22
                                            9.0
                                                           Closure Location




                                             7
                                                      !

                                                                 Roads
                                                          Hangover_closure
                                                                Caveat:
                                                             Road    Closure
                                                   The Province of British Columbia
                                                     makes no representation or
                                                              warranties
                                                       regarding the accuracy,
                                                     merchantability, fitness for a
                                                        particular purpose, or
                                                   completeness of any information
FSR
 Han 229.06




                                                      contained in or otherwise
                                                        comprising this map.
    8
    gov




                                                  Without limiting the foregoing, you
       er




                                                            are warned not
                                                   to use this map for navigational
                                                               purposes.
                                                  This map may be generalized and
                                                  may not reflect current conditions.
                                                    Uncharted hazards may exist.

                           !




                                                                   State of Alaska,
                                                                  Esri Canada, Esri,
                                                                          TomTom,


                                                  0              1                     2
                                                            Kilometers
                                                  Date: Oct 28, 2024
                                                  Drawn by: HGNRD
</source_text>

Return the JSON for this text.
