# Extraction task road_notice-30f3536c4b24 (run 1)

Write your answer to `queue/answers/run1/road_notice-30f3536c4b24.json` as:

```json
{ "task_id": "road_notice-30f3536c4b24", "run": 1, "mode": "agent", "model": "<your model id> (Claude Code)", "prompt_version": "road_notice.v1", "schema_id": "road_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/road_notice.v1.json... } }
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

Source: District Manager notice DSE-e4e6b5f8-trout_lake_rady_creek_deactivation_prescription_map (2026-10-19T17:14:51.327Z)

<source_text>
Suite #4, 385 Baker Street
                                                           Nelson, BC, V1L 4H6
                                                                   250 509 1009




     Ministry of Forests – Selkirk Natural Resource District
                                 845 Columbia Avenue
                                     Castlegar, BC
                                      V1N 1H3

                     Rady Forest Service Road (FSR)
                     Road Deactivation Prescription

                                   September 8, 2026




Report Number: 26.510.01.01.16
Distribution:
Ministry of Forests – 1 copy
SNT Geotechnical Ltd. – 1 copy
                                                    Rady FSR Road Deactivation                                          September 8, 2026

Table of Contents
1.  Introduction ........................................................................................................................................... 2
2.  Forest Planning and Practices Regulation – Road Deactivation ........................................................... 3
3.  Road Deactivation Plan......................................................................................................................... 4
4.  General Site Description and Background Information ........................................................................ 5
  4.1. Background Information ............................................................................................................... 5
  4.2. Physiographic Description ............................................................................................................ 5
  4.3. Climate .......................................................................................................................................... 5
  4.4. Aerial Photography and Satellite Orthoimagery Review .............................................................. 7
  4.5. Elements at Risk ........................................................................................................................... 7
5. Field Assessment .................................................................................................................................. 8
6. SNTG Road Deactivation Prescription ................................................................................................. 8
7. Field Reviews During Road Deactivation Works ............................................................................... 18
8. Closure – Report Use and Limitations ................................................................................................ 19

Appendix A: Site Photos……………………………………….…………………………………………A1
Appendix B: Road Deactivation & General Site Location Maps...………………………………………B1
Appendix C: Road Deactivation General Terminology and Descriptions……….……………………….C1




                                                                                                                                                            1
                                    Rady FSR Road Deactivation                        September 8, 2026


1. Introduction
At the request of Michael Ferguson, RFT, of the Ministry of Forests – Selkirk Natural Resource District
(MOF), SNT Geotechnical Ltd. (SNTG) has completed a permanent road deactivation prescription for the
Rady FSR. Road Permit Road R07745 extends off of Highway 31 approximately 15km southeast of the
community of Trout Lake, BC and Rady FSR begins at the end of R07745 approximately 5km upchain of
the highway junction. The road ascends the face unit slopes of the northeast sidewall of the Trout Lake
valley between Rady Creek and an unnamed creek to the north. The location of the Rady FSR is indicated
on Figure 1 below.




                                                                                                          N

                                                                    Rady FSR slated for
                                                                    deactivation




Figure 1 – Location key map.

As per the MOF Engineering Manual, a Qualified Registered Professional (QRP – RFT, RPF, P. Eng., or
P. Geo.) must prepare, sign, and seal a prescription for road deactivation works and provide the results of
the assessment in a letter or report that accompanies the deactivation prescription. This report is intended
to meet this requirement for the Rady FSR.




                                                                                                               2
                                    Rady FSR Road Deactivation                    September 8, 2026


2. Forest Planning and Practices Regulation – Road
   Deactivation
The management of forest roads is regulated by the Forest Planning and Practices Regulation (FPPR) of
the Forest and Range Practices Act (FRPA).

The two main sections of the FPPR related to road deactivation are Sections 37 and 82 (1):

      Section 37

      An authorized person who carries out a primary forest activity must ensure that the primary forest
      activity does not cause a landslide that has a material adverse effect in relation to one or more of
      the subjects listed in Section 149 (1) of the Forest and Range Practices Act.

      Section 82 (1) A person who deactivates a road must do the following:

         (a)    barricade the road surface width in a clearly visible manner to prevent access by motor
                vehicles, other than all-terrain vehicles;
         (b)    remove bridge and log culvert superstructures and stream pipe culverts;
         (c)    remove bridge and log culvert substructures, if the failure of these substructures would
                have a material adverse effect on downstream property, improvements or forest
                resources;
         (d)    stabilization of the road prism or clearing width of the road if the stabilization is
                necessary to reduce the likelihood of a material adverse effect in relation to one or more
                of the subjects listed in section 149 (1) of the Act.

Professional Guidance and Best Management Practices

The following professional practice guidelines and practice advisories are to be used for professional
services related to forest roads including road deactivation prescriptions. Each of these was jointly
released by Engineers and Geoscientists BC (EGBC) and Forest Professionals BC (FPBC).

Guidelines:
   x Professional Services in the Forest Sector: Forest Roads, version 2.0 (2024).
   x Professional Roles and Responsibilities for the Life Cycle of Forests Roads (2022)
   x Professional Services in the Forest Sector - Crossings (2021).
   x Watershed Assessment and Management of Hydrologic and Geomorphic Risk in the Forest Sector
        (2020).
   x Professional Services in the Forest Sector – Terrain Stability Assessments (2010).
   x Management of Terrain Stability in the Forest Sector (2008).

Other indirect EGBC professional practice guidelines that may be required include the following:

                                                                                                             3
                                         Rady FSR Road Deactivation                           September 8, 2026

    x    EGBC Professional Practice Guideline: Retaining Wall Design (2024).
    x    EGBC Professional Practice Guideline: Erosion and Sediment Control (2024).
    x    EGBC Professional Practice Guideline: Landslide Assessments in BC (2023)

Practice Advisories:
    x Professional Roles and Responsibilities for the Life Cycle of Forest Roads (2022).
    x Professional Roles and Responsibilities for the Life Cycle of Forest Road Crossings (2019).

Professional practice guidelines state that other related documents guide professionals in executing their
work. These include:
    x The MOF Engineering Manual (2026), which states that “the intent of road deactivation is to
        place a road in a self-maintaining state that will indefinitely protect adjacent resources.”
    x Hillslope Restoration Guidebook Best Management Practices Handbook (2001):
    x MoF Kamloops Forest Region (1997) – Typical road deactivation prescription drawings and
        figures.

The MOF has indicated that the road is intended to be deactivated to a permanent standard, and
that post-deactivation vehicular access is not required.



3. Road Deactivation Plan
As per the Ministry of Forests (MOF) Engineering Manual, “the intent of road deactivation is to place a
road in a self-maintaining state that will indefinitely protect adjacent resources.” Where vehicle access is
not required and where local slopes are unstable, road deactivation generally consists of returning the
terrain and drainage patterns along the road alignment to as close to a pre-road construction state as is
practical. This will typically reduce the likelihood of a landslide associated with the deactivated road
alignment to Low or Very Low.

EGBC-ABCFP 20241 indicates that Road Deactivation Plans must be prepared by the Road Activity
Professional of Record (POR), and there must be a Coordinating Registered Professional (CRP). The
Road Activity POR and CRP will retain Specialists where required for development of road deactivation
plans. In the case of the Rady FSR Road deactivation, Jordan Pyette, RFT representing the MOF is
acting as the Road Activity POR and the CRP. SNTG is acting as the Specialist for this project.

EGBC-ABCFP 2024 indicates a detailed deactivation plan may include:

    x    dates and details of Road Deactivation works;
    x    proposed deactivation measures for Forest Roads and engineered structures, including those
         specified by Specialists, or by reference to SOPs;
    x    requirements for Field Reviews and professional assurance statements, where required;

1 Professional Services in the Forest Sector – Forest Roads, EGBC-ABCFP, Version 2.0, October 2024.



                                                                                                                  4
                                           Rady FSR Road Deactivation                         September 8, 2026

    x    a station-by-station description of conditions and mitigation measures prescribed;
    x    a map showing the locations of the measures prescribed;
    x    identification of site conditions that may be a concern for worker safety;
    x    identification of special concerns that affect the timing or conduct of the work; and
    x    recommendations for equipment or special work procedures necessary to complete the work.



4. General Site Description and Background Information
4.1.     Background Information

The following background information was reviewed by SNTG:

    x    1:5,000 scale Contour, Ortho, and Road Deactivation Prescription maps of the Rady FSR and
         surrounding terrain. The maps were created by the MOF and are dated August 25, 2025.
    x    Previous road deactivation prescription for the Rady FSR created by the MOF. The deactivation
         prescription is not dated.
    x    iMapBC2: BC provincial government web-based map database (water licenses, bedrock geology,
         biogeoclimatic zones, historic wildfires, etc.).
    x    Google Earth orthoimagery and digital terrain model.
    x    Environment Canada weather station #1145297 (Nakusp)3.
    x    ClimateBC web application4.

4.2.     Physiographic Description

The Rady FSR is situated in the Selkirk Mountains of the Columbia Mountain System of BC (Holland,
1976)5. The topography of the valley sidewall slope where the Rady FSR is located is that of generally
moderate to moderately steep gradient irregular terrain extending out of Trout Lake for approximately
4400m. Upslope of this point, rugged alpine terrain is present making up the west side of Fays NW3
Peak. The portion of the Rady FSR slated for deactivation spans an elevation range of 1570m to 2240m.
The valley bottom adjacent to the road is located at an elevation of 722m while the height of land to the
northeast at the top of Fays NW3 Peak is 2690m.

Bedrock underlying the road is mapped as Cambrian to Devonian limestone, slate, siltstone, and argillite
of the Lardeau Group – Broadview Formation. Bedrock observed in the field consisted of heavily
fractured, weak to medium strong phyllite to schist. The observed lithology is consistent with mid grade
metamorphism of the mapped lithology.

4.3.     Climate

2 Available at: https://www2.gov.bc.ca/gov/content/data/geographic-data-services/web-based-mapping/imapbc
3 Available at: https://climate.weather.gc.ca/climate_normals/index_e.html
4 Available at: https://climatebc.ca/mapVersion
5 Holland, S. 1976. Landforms of British Columbia – A Physiographic Outline. BC Government.



                                                                                                                  5
                                      Rady FSR Road Deactivation                       September 8, 2026


Based on the available biogeoclimatic (BEC – iMapBC) data, the road spans the following BEC zones:
   x Columbia variant of the Wet Hot Engelmann Spruce – Subalpine Fir zone (ESSF wh1).
   x Selkirk variant of the Wet Cold Engelmann Spruce – Subalpine Fir zone (ESSF wc4).
   x Wet Cold Woodland Engelmann Spruce – Subalpine Fir zone (ESSF wcw).
   x Wet Cold parkland Engelmann Spruce – Subalpine Fir zone (ESSF wcp).

The Nakusp weather station, located 48km to the southwest of the road, records a Mean Annual
Precipitation (MAP) of 842mm with 650mm falling as rain and is located at an elevation of 457m. The
ClimateBC web application provides an estimated MAP by interpolating known climate data to the study
area. The ClimateBC estimated MAP ranges from 1275mm at 1570m to 1595mm at 2240m. Given the
differing geographical locations and elevation of the road when compared to the weather station, the MAP
provided by ClimateBC is considered to be more accurate for the Rady FSR.

Based on the ClimateBC data, the road falls mostly within Zone 2 of the MOF Southern Engineering
Group wet weather shutdown criteria (Brayshaw 20216). A summary of the wet weather shutdown criteria
(WWSC) is provided in Table 1 below. The reader is referred to the Brayshaw report for the details of the
shutdown criteria as there are criteria in addition to those listed in Table 1 (such as snowmelt) that require
consideration. SNTG recommends that the Zone 2 WWSC be implemented for the proposed
deactivation of the Rady FSR.

Table 1 – Proposed Shutdown Criteria by Zone
                                                                Time Period
                Zone (annual                          At start of or
   Zone
                precipitation)         One hour       before end of        24-hr             48-hr
                                                      shift (12-hr)
             Very wet (1500 mm
     1                                    n/a             28mm             35mm             60mm
                to 3000 mm)
              Wet (1100 mm to
     2                                    n/a             25mm             30mm             50mm
                  1500 mm)
             Average (600 mm to
     3                                  10mm              22mm             25mm             40mm
                  1100 mm)
             Dry (100 mm to 600
     4                                   8mm              18mm             20mm             30mm
                     mm)
             Identified Unstable
     5                                   6mm              10mm             15mm             20mm
                 Conditions

Note that, in addition to the Wet Weather Shutdown criteria indicated, and the site-specific criteria (if
required) specified in the report, caution must also be exercised when working or parking equipment
adjacent to streams in the vicinity of the road. Streams may be subject to hydrogeomorphic events (i.e.,
debris flow, debris flood, or flood) during periods of prolonged or intense precipitation or snowmelt. As



6 Brayshaw, D. 2021 Wet Weather Shutdown Criteria – MFLNRORD Southern Engineering Group.



                                                                                                             6
                                    Rady FSR Road Deactivation                     September 8, 2026

such, it is recommended that Zone 5 shutdown criteria be implemented when working or parking
equipment within or adjacent to streams in the vicinity of the proposed development.

4.4.    Aerial Photography and Satellite Orthoimagery Review

SNTG reviewed historic aerial photography for the area between 1968 and 2011 to understand the history
of development around the site and to help identify large-scale geologic features that would be difficult to
identify in the field. Identification of features is limited to the resolution and the elevation at which the
photographs were taken. The aerial photographs reviewed as part of this assessment are listed below:

    x   BCD11201                 #071-072                  (2011)
    x   30BCC06066               #015-017                  (2006)
    x   30BCC05035               #116-118                  (2005)
    x   15BCC01009               #164-165                  (2001)
    x   15BCB00032               #020-022                  (2000)
    x   30BCB97098               #039-041                  (1997)
    x   30BCB95114               #056-057                  (1995)
    x   30BC85058                #083-085                  (1985)
    x   15BC81118                #170-172                  (1981)
    x   BC7089                   #084-086                  (1968)

No timber development or road related landslides are visible on the face unit slope where the Rady FSR is
located for the duration of the air photo record or on the 2025 Google Earth orthoimagery for the site. The
landslide incidence on the face unit slope appears to be low.

4.5.    Elements at Risk

The elements at potential risk from a landslide originating on or downslope of the road addressed in this
report were identified by SNTG and include the following:

x   Impact to water quality pertaining to fish habitat in Rady Creek located 300-400m to the southeast of
    the Rady FSR.
x   Impact to water quality pertaining to fish habitat in unnamed creek located 100-400m to the northwest
    of the Rady FSR.
x   Impact to Highway 31 located 1700m downslope of the Rady FSR.
x   Impact to water quality pertaining to fish habitat in Trout Lake located 2400m downslope of the Rady
    FSR.

Highway 31 and Trout Lake are located 1700m and 2400m downslope of the Rady FSR, respectively.
Gentle to moderate gradient benched terrain is present 700m downslope of the lowermost portion of the
Rady FSR extending for 1000m to Highway 31 and 1700m to Trout Lake. Given this separation distance,
a landslide originating on the Rady FSR and propagating down the face unit slope will likely runout prior
to either Highway 31 or Trout Lake. However, a landslide originating on the Rady FSR and entering

                                                                                                            7
                                    Rady FSR Road Deactivation                   September 8, 2026

either the Unnamed Creek to the north or Rady Creek to the south could become entrained and a
subsequent debris flow could propagate to valley bottom potentially impacting either Highway 31 or
Trout Lake.

Other downslope resources which have not been addressed in this report include; timber and soil
resources, wildlife habitat and visual resources.

Note that this report does not include a partial risk assessment for the stated elements at risk due to
a resultant low to very low residual hazard of a road related landslide once the deactivation
recommendations in this report are implemented. Road segments with a residual landslide likelihood
exceeding low are identified in Section 5 of this report.



5. Field Assessment
Fieldwork was completed by Ryan Williams, P.Geo. of SNTG on August 18, 2026. Fieldwork consisted
of a walking traverse of the road. Conditions at the time of fieldwork were warm and sunny with no
recent precipitation. Waypoints were collected at points of interest using a GPS-enabled phone with an
accuracy estimated to be on the order of ±5m. Waypoints were flagged in the field with plain orange
flagging tape.

Note that dead and damaged trees were noted in close proximity to the segment of the Rady FSR
slated for deactivation. SNTG recommends that the MOF retain a Qualified Professional (QP) to
complete a Danger Tree Assessment (DTA) prior to the commencement of road deactivation works.



6. SNTG Road Deactivation Prescription
Details of the road deactivation prescription are provided in Table 2 below. The location of the
deactivation prescription points referenced in Table 2 are also provided in the road deactivation map
contained in Appendix B. The specific locations for the deactivation prescription listed in Table 2 have
been referenced to UTM coordinates in Zone 11U. Culverts are noted as being metal (CMP) or plastic
(CPP) with the diameter provided in mm.

General Deactivation Requirements and Terminology

Pullback Fill 1 (PF1) – Pullback fill for 0-3m slope distance.

Pullback Fill 2 (PF2) – Pullback fill for 3-6m slope distance.

Pullback Fill 3 (PF3) – Pullback fill for >6m slope distance.




                                                                                                           8
                                     Rady FSR Road Deactivation                     September 8, 2026

Cross ditches are required in numerous locations along the road segment proposed for deactivation and
must have a minimum base width of 1m, a minimum depth of 1m, and a sidewall slope not to exceed 50%
(2H:1V). Refer to Map 1 in Appendix B for locations.

Further details of deactivation methods and best practices are contained in Appendix C.

General observations and recommendations are as follows:

∆1 to ∆16
The road is situated on gentle to moderate gradient alpine to subalpine terrain. The road is mostly
constructed on ground with minimal cuts and fills. Proposed deactivation works consist of cross ditching
to better manage water along the alignment. Refer to Table 2 below for the details of the road deactivation
prescription. Implementation of the deactivation prescription will result in an estimated residual very low
likelihood of a road related landslide occurring.

∆16 to ∆18
The road traverses moderately steep gradient terrain to a switchback location at ∆17. Cutslopes extend up
to 15m up the slope and there are several cutslope failures on the order of 50m 3 in size. The road fill at the
switchback location is up to 15m in length and has a small erosion track present. The deactivation
prescription for this road segment consists of recontouring the road prism with pullback of all fill material
within reach of an excavator. Fill must be pulled back to a minimum of 10m length from the running
surface of the road. These works will result in loss of vehicle access along the alignment, including All
Terrain Vehicle (ATV) access. It may be possible to cut a narrow ATV trail across the recontoured road
surface at the time of deactivation works, however, the excess material generated from constructing the
trail will need to be transported to a suitable waste site. This will result in an increased cost for the works
above that of the prescribed recontouring.

Refer to Table 2 below for the details of the road deactivation prescription. Implementation of the
deactivation prescription will result in an estimated residual low likelihood of a road related landslide
occurring.

∆18 to ∆71
The road is situated on mainly moderate with some sections of moderately steep gradient terrain. Cuts and
fills are relatively small for the most part and deactivation works primarily consist of cross ditching for
water management purposes with isolated sections of light pullback. Refer to Table 2 below for the
details of the road deactivation prescription. Implementation of the deactivation prescription will result in
an estimated residual very low to low likelihood of a road related landslide occurring.




                                                                                                             9
                                                               Rady FSR Road Deactivation                                            September 8, 2026


Table 2: Rady FSR Road Deactivation Prescription
 Road Location
                      Existing Road and Adjacent Terrain Conditions                                            Deactivation Prescription
(GPS waypoints)
                    The road is situated on gentle to moderate gradient irregular
                    terrain.

                    The running surface of the road has a width of 3m to 4m. The
                    cutslope of the road has a length of 0m to 1m and a gradient of
                    70%. The fillslope of the road has a length of 0m to 1m and a
                    gradient of 70%.

                    The road prism is intact aside from erosion on the running surface.
      ∆1
                    Drainage paths/structures are present at the following locations:
   475307mE
                    x   ∆2 (UTM 475248mE, 5604563mN) - Cross ditch required.
  5604614mN
                    x   ∆3 (UTM 475191mE, 5604531mN) - Cross ditch required.
                    x   ∆4 (UTM 475139mE, 5604511mN) - Cross ditch required.
        to          x   ∆5 (UTM 475104mE, 5604508mN) - Cross ditch required.              x   Leave the road prism intact.
                    x   ∆6 (UTM 475065mE, 5604489mN) - Cross ditch required.
      ∆16           x   ∆7 (UTM 475066mE, 5604434mN) - Cross ditch required.
   474861mE                                                                               x   Install cross ditches at ∆2, ∆3, ∆4, ∆5, ∆6, ∆7, ∆8, ∆9, ∆10, ∆11,
                    x   ∆8 (UTM 475044mE, 5604384mN) - Cross ditch required.                  ∆12, ∆13, ∆14, ∆15, and ∆16.
  5604230mN         x   ∆9 (UTM 475013mE, 5604325mN) - Cross ditch required.
                    x   ∆10 (UTM 474981mE, 5604309mN) - Cross ditch required.
  (Approximate      x   ∆11 (UTM 474941mE, 5604347mN) - Cross ditch required.
 section length =   x   ∆12 (UTM 474951mE, 5604243mN) - Cross ditch required.
      800m)         x   ∆13 (UTM 474971mE, 5604208mN) - Cross ditch required.
                    x   ∆14 (UTM 474925mE, 5604215mN) - Cross ditch required.
                    x   ∆15 (UTM 474883mE, 5604223mN) - Cross ditch required.
                    x   ∆16 (UTM 474861mE, 5604230mN) - Cross ditch required.

                    The local surficial material consists of a veneer of well drained,
                    compact rubble derived from weathering of local bedrock.
                    Bedrock outcrops are visible in numerous locations and are
                    composed of heavily fractured, weak to medium strong phyllite
                    and schist.




                                                                                                                                                                   10
                                                          Rady FSR Road Deactivation                                          September 8, 2026


Table 2: Rady FSR Road Deactivation Prescription
 Road Location
                     Existing Road and Adjacent Terrain Conditions                                        Deactivation Prescription
(GPS waypoints)
                    The road is situated on moderately steep gradient irregular
                    terrain. The road turns a switchback at ∆17. Large cuts and     x   Pullback and recontour (PF2 to PF3)
                    fills are present at the switchback location.                       o Ensure the road surface is decompacted (0.3m) prior to pullback
                                                                                            of the fill material;
                    The running surface of the road has a width of 3m to 4m.            o Pullback all fill material within reach of the excavator
      ∆16
                    The cutslope of the road has a length of 5m to 15m and a                (estimated at 5-10m slope length) and place the pulled back
   474861mE
                    gradient of 100% to 120%. The fillslope of the road has a               material along the inner edge of the decompacted road surface;
  5604230mN
                    length of 5m to 15m and a gradient of 80% to 120%.                  o Scatter organic material and woody debris across the pulled
                                                                                            back surface; and
        to
                    The road prism is intact for the most part aside from a small       o Consider grass seeding the pulled back surface if replanting is
                    erosion track at the switchback at ∆17 and several cutslope             not expected to occur.
      ∆18
   474828mE         failures up to 50m3 in size between ∆16 and ∆17.
                                                                                    x   Note that some unretrieved fill will likely remain in place at the
  5604271mN
                    Drainage paths/structures are present at the following              switchback location at ∆17. Fill must be pulled back to a minimum
  (Approximate      locations:                                                          of 10m length from the running surface of the road. The volume of
 section length =   x ∆18 (UTM 474828mE, 5604271mN) – Cross ditch                       unretrieved fill will be a small enou
</source_text>

Return the JSON for this text.
