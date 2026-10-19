# Extraction task road_notice-9da559da056d (run 2)

Write your answer to `queue/answers/run2/road_notice-9da559da056d.json` as:

```json
{ "task_id": "road_notice-9da559da056d", "run": 2, "mode": "agent", "model": "<your model id> (Claude Code subagent)", "prompt_version": "road_notice.v1", "schema_id": "road_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/road_notice.v1.json... } }
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

Source: District Manager notice DCK-79c52629-fs301_december_13_2024 (2026-10-19T17:14:34.825Z)

<source_text>
FS301 Form

                     Forest Service Road Discontinue and Close Form

      This form is used to Discontinue and Close a Forest Service Road in accordance
                   with the provisions of Section 121 (9) of the Forest Act.
                                                                     File No. FSR Project No.
                                                                           FOR-11250-32/8124.03
                                                                           FOR-11250-32/8144.02
                                                                           FOR-11250-32/9352.01
                                                                           FOR-11250-32/9703.02


RESPONSIBLE PROGRAM:                  Natural Resource Operations                BCTS X

Chilliwack Forest Natural Resource District / Chinook Business Area

FSR NAME and identified in the following manner:

       CANTELON 8400 - (8124.03): 0+000 to 1+861
       EIGHT MILE 5700 - (8144.02): 0+000 to 0+700
       ELEVEN MILE – (9352.01): 0+000 to 3+580
       SOUTH AINSLIE TWO – (9703.02): 0+000 to 2+418

on the attached documents or Exhibit A sketch dated December 12, 2024

DISCONTINUANCE AND CLOSURE APPROVED
Please check to indicate the type of notice[s] that was given.
Please indicate the date or dates of notification: December 13, 2024.
_x_     District website           ____    District Notice Board     _____ Press Release /
__      Stakeholder letter         ____    On-Site Signage                  Press Package
__      Newspaper                  _ ___   Email Distribution List   _____ Radio
__      TV ad                      ____    FLNR website              _ ____ Gov BC Website
__      Other [Please summarize]




District Manager                                            Effective Date
    Dec 17, 2024
Date Signed

Distribution: Senior Project Manager, Forest Land Acquisitions, Forest Tenures Branch, Victoria.
Please attach a copy, photograph or summary of the Notice.
FS 301 HTH
                     Exhibit A
                      Legend

         Active Forest Road Sections - Colour Th
         tilecache



     CANTELON 8400 - (8124.03):
     Discontinue and Close Section
            0+000 to 1+861




0                      0.20                  0.41 km



    1: 10,000

           Copyright/Disclaimer
The material contained in this web site is owned by the
Government of British Columbia and protected by
copyright law. It may not be reproduced or redistributed
without the prior written permission of the Province of
British Columbia. To request permission to reproduce
all or part of the material on this web site please
complete the Copyright Permission Request Form
which can be accessed through the Copyright
Information Page.
CAUTION: Maps obtained using this site are not
designed to assist in navigation. These maps may be
generalized and may not reflect current conditions.
Uncharted hazards may exist. DO NOT USE THESE
MAPS FOR NAVIGATIONAL PURPOSES.



Datum:      NAD83
Projection: WGS_1984_Web_Mercator_Auxiliary
            _Sphere


      Key Map of British Columbia
                     Exhibit A

                     Legend

          Active Forest Road Sections - Colour Th
          tilecache


     EIGHT MILE 5700 - (8144.02):
     Discontinue and Close Section
            0+000 to 0+700




0                       0.18                    0.4 km



    1: 9,028


              Copyright/Disclaimer
The material contained in this web site is owned by the
Government of British Columbia and protected by
copyright law. It may not be reproduced or redistributed
without the prior written permission of the Province of
British Columbia. To request permission to reproduce all
or part of the material on this web site please complete
the Copyright Permission Request Form which can be
accessed through the Copyright Information Page.

CAUTION: Maps obtained using this site are not designed
to assist in navigation. These maps may be generalized
and may not reflect current conditions. Uncharted hazards
may exist. DO NOT USE THESE MAPS FOR
NAVIGATIONAL PURPOSES.



Datum:          NAD83
Projection:     WGS_1984_Web_Mercator_Auxiliary_Sp
                here



      Key Map of British Columbia
                     Exhibit A

                     Legend

          Active Forest Road Sections - Colour Th
          tilecache



      ELEVEN MILE – (9352.01):
     Discontinue and Close Section
            0+000 to 3+580




0                       0.41                    0.8 km



    1: 20,000


              Copyright/Disclaimer
The material contained in this web site is owned by the
Government of British Columbia and protected by
copyright law. It may not be reproduced or redistributed
without the prior written permission of the Province of
British Columbia. To request permission to reproduce all
or part of the material on this web site please complete
the Copyright Permission Request Form which can be
accessed through the Copyright Information Page.

CAUTION: Maps obtained using this site are not designed
to assist in navigation. These maps may be generalized
and may not reflect current conditions. Uncharted hazards
may exist. DO NOT USE THESE MAPS FOR
NAVIGATIONAL PURPOSES.



Datum:          NAD83
Projection:     WGS_1984_Web_Mercator_Auxiliary_Sp
                here



      Key Map of British Columbia
                       Exhibit A

                       Legend

              Active Forest Road Sections - Colour Th
              tilecache


        SOUTH AINSLIE TWO –
               (9703.02):
     Discontinue and Close Section
            0+000 to 2+418




 0                       0.41                  0.8 km



     1: 20,000.00

               Copyright/Disclaimer
 The material contained in this web site is owned by the
 Government of British Columbia and protected by
 copyright law. It may not be reproduced or redistributed
 without the prior written permission of the Province of
 British Columbia. To request permission to reproduce
 all or part of the material on this web site please
 complete the Copyright Permission Request Form
 which can be accessed through the Copyright
 Information Page.

 CAUTION: Maps obtained using this site are not
 designed to assist in navigation. These maps may be
 generalized and may not reflect current conditions.
 Uncharted hazards may exist. DO NOT USE THESE
 MAPS FOR NAVIGATIONAL PURPOSES.


Datum:         NAD83
Projection:    WGS_1984_Web_Mercator_Auxiliary_Spher
               e



       Key Map of British Columbia
</source_text>

Return the JSON for this text.
