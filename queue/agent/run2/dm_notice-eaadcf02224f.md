# Extraction task dm_notice-eaadcf02224f (run 2)

Write your answer to `queue/answers/run2/dm_notice-eaadcf02224f.json` as:

```json
{ "task_id": "dm_notice-eaadcf02224f", "run": 2, "mode": "agent", "model": "Claude Code agent mode, fresh subagent", "prompt_version": "dm_notice.v1", "schema_id": "dm_notice.v1", "produced_at": "<ISO time>", "answer": { ...matching schema/dm_notice.v1.json... } }
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

- `raw/2026-10/dm_notices/images/DCK-668dd9ac-rup_obligations_and_expectations_-_august_18_2021_signed.p9.jpg` (page 9)
- `raw/2026-10/dm_notices/images/DCK-668dd9ac-rup_obligations_and_expectations_-_august_18_2021_signed.p11.jpg` (page 11)

## Source

Source: District Manager notice DCK-668dd9ac-rup_obligations_and_expectations_-_august_18_2021_signed (2026-10-19T19:58:30.503Z)

<source_text>
Source: https://www2.gov.bc.ca/assets/gov/farming-natural-resources-and-industry/natural-resource-use/resource-roads/local-road-safety-information/chilliwack/rup_obligations_and_expectations_-_august_18_2021_signed.pdf
Fetched: 2026-10-19T19:58:30.503Z
SHA-256: 0d48f067da9ad4230fb01b2d92e9f3efd6470accfab85e871ded967037eddaf0
Read: text layer (11 pages); OCR by tesseract 5.3.4 on pages 9, 11; 2 map or scan page images for reading
Images: raw/2026-10/dm_notices/images/DCK-668dd9ac-rup_obligations_and_expectations_-_august_18_2021_signed.p9.jpg raw/2026-10/dm_notices/images/DCK-668dd9ac-rup_obligations_and_expectations_-_august_18_2021_signed.p11.jpg

  August 18, 2021




  Obligations and Expectations of Road Use Permit Holders


  I am writing to Licensees regarding Road Use Permits (RUP) in the Chilliwack Natural
  Resource District, as a follow-up to enquiries for clarification on the role of licensees in
  government’s legal obligation around consultation and specifically associated to road
  maintenance activities. The purpose of this communication is to outline my expectations
  regarding road maintenance and to clarify the roles, obligations and expectations of RUP
  holders including the designated maintainer.

  Within the context of the above, my expectations are categorized into various subheadings
  from Engagement with First Nations to Expectations for RUP holders, Designated Maintainer,
  and Secondary User, as follows:


  Engagement with First Nations for Road Maintenance Activities

  Consultation is required “When the Crown has knowledge, real or constructive, of the
  potential existence of an Aboriginal RIGHT or TITLE and contemplates a decision that
  might adversely affect it.” (Haida)
  The Province is legally obligated to consult and accommodate First Nations, where
  required, on land and resource decisions that could impact their Indigenous Interests.
  While the Province is responsible for ensuring adequate and appropriate consultation
  and accommodation, it may involve Licensees in the procedural aspects of
  consultation. Licensees are generally encouraged to engage with First Nations as
  early as possible in the planning stages. Early engagement can help to build
  relationships, aid the information sharing process and provide practical, timely and
  cost-effective opportunities to address any potential issues in support of the
  consultation process.




Ministry of Forests, Lands,  Chilliwack Natural Resource District  46360 Airport Road
Natural Resource Operations  Chilliwack, BC V2P 1A5
and Rural Development  Phone: (604)702-5700
  Fax: (604) 702-5711

  When ground disturbance is expected to happen while carrying out road
  maintenance activities on Forest Service Roads (i.e. new road construction, road re-
  alignment, road deactivation) and the ground disturbance may pose a potential
  impact to Indigenous Interests, the Licensee is advised to notify the District
  Manager (DM) of the proposed/ongoing road maintenance activities. The DM will
  consider all aspects of the proposed activities and determine whether to share any of
  the procedural aspects of consultation to the Licensee.
  The Chilliwack Natural Resource District has developed a guidance document for
  when First Nation consultation is triggered based on various road maintenance
  activities. Please refer to Appendix A – Road Maintenance Flowsheet: A guide to
  advise if First nations consultation is required for road maintenance activities.


  Professional Reliance
  Legislation that applies to bridge and road practices is not limited to forest legislation (Forest
  Act, Forest and Range Practices Act and their Regulations), but includes conformance to
  other legislation as well.
  The Forest and Range Practices Act (FRPA) includes an underlying expectation of appropriate
  application of professional reliance. Two key acts related to resource roads and bridges are the
  Foresters Act and The Engineers and Geoscientists Act. These professional practice acts
  basically require that the appropriate professionals are engaged where and when required. There
  is an expectation that permit holders will conduct their activities consistent with all applicable
  legislation including engagement of appropriate professionals.
  To this end, it is expected that all RUP holders and their employees, agents and contractors will
  conduct their activities consistent with professional practice guidelines from the Associations of
  BC Forest Professionals and Engineers and Geoscientists of BC including:
  •  Guidelines for Professional Services in the Forest Sector — Crossings
  •  Guidelines for Professional Services in the Forest Sector –Forest Roads

  1
  Forest Practices Board Reports:

  “Road and Bridge Maintenance Obligations within Three Forest Districts, Coast Forest Region”,
  FPB/SIR/31 April 2011
  https://www.bcfpb.ca/wp-content/uploads/2016/04/SIR31-Road-Bridge-Maintenance-WEB.pdf

  “Bridge Planning, Design and Construction”, Special Investigation, FPB/SIR/38, March 2014,
  https://www.bcfpb.ca/wp-content/uploads/2016/04/SIR38-Bridge-Planning-Design-and-Construction.pdf

  “Road and Bridge Practices Board Audit Findings 2005-2011”, Special Report, FPB/SR/43, February
  2013,
  https://www.bcfpb.ca/wp-content/uploads/2016/04/SR43-Road-and-Bridge-WEB.pdf

  Page 2 of 8
Ministry of Forests, Lands,  Chilliwack Natural Resource District  46360 Airport Road
Natural Resource Operations  Chilliwack, BC V2P 1A5
and Rural Development  Phone: (604)702-5700
  Fax: (604) 702-5711

  Road Use Permit’s for Industrial Use
  i.  Per the Forest Act (FA) 115, a person who has the right to harvest timber
  under a specified forest tenure, may apply to the DM for a RUP to use a
  forest service road. Subject to the conditions of the Act, the DM must grant
  the applicant an RUP.
  ii. Per the Forest Act 117 a person who wishes to use a forest service road for
  an industrial purpose (that is not forest harvest related), may apply to the
  DM for a road use permit and subject to conditions the DM may grant an
  RUP.
  iii. The FRPA 22.1 and 22.2 specify conditions in which the DM may exempt an
  industrial user from the requirement of an RUP.
  iv. The Forest Practice and Planning Regulation (FPPR) 79(4) provides for the
  DM to order the holder of an RUP that authorizes the use of a forest service
  road to assume all or part of the responsibility to maintain the road,
  including bridges, culverts, fords and other structures associated with the
  road. (i.e. the designated maintainer). Designated maintainers are typically
  assigned based on greatest demonstrated future requirement for access to
  natural resources; e.g. long-term timber harvesting tenures, clean energy
  infrastructures (power poles, penstocks etc.) within the FSR right of way.
  There will only be one designated maintainer for a given FSR.
  v. RUP holders are informed within their RUP who the DM has designated
  responsibility for maintenance. Subject to FRPA 22.1(7), RUP holders must
  give at least 5 days notice to the designated maintainer of the date on which
  they will begin to use the road.
  vi. Per limitations specified in FRPA 22.3 the designated maintainer may, by
  written notice to a person who has caused damage to the FSR, require
  payment as contribution towards maintaining, modifying and repairing
  damage caused by the person’s use and the person is liable for the
  payment specified.
  vii. It is expected that RUP holders will restrict their loads to the Gross Vehicle
  Weights (GVWs) and dimension limits stated in Road Use Permits or as
  posted. RUP holders should be aware of the limitations associated with
  GVW load limits and that they are intended for log haul vehicle
  configurations and do not apply to equipment loads. It is suggested that

  Page 3 of 8
Ministry of Forests, Lands,  Chilliwack Natural Resource District  46360 Airport Road
Natural Resource Operations  Chilliwack, BC V2P 1A5
and Rural Development  Phone: (604)702-5700
  Fax: (604) 702-5711

  RUP holders review and be familiar with: Engineering Bulletin #1 -
  Clarification of GVW as Applicable to Bridge Load Rating. The RUP
  holder must consult with the ministry prior to transporting any loads which
  may exceed or potentially exceed safe load limits or dimensions.



 District Manager (DM) Expectations of RUP Holders

  i. RUP holders are responsible for communicating requirements of the
  RUP with their employees, agents and contractors.
  ii. RUP holders are responsible for compliance of their employees, agents and
  contractors with the requirements of their RUP.
  iii. Industrial operators are expected to self-monitor and avoid damage to the
  FSR such as during spring freshet or wet weather. A person must not use an
  FSR, or operate, or cause to be operated, a motor vehicle, or other
  equipment on an FSR, in a manner that damages the FSR [Forest Service
  Road Use Regulations (FSRUR) 10(1)]. The DM may order the user causing
  damage to pay for remediating the damages [FSRUR10(2)].
  iv. Where industrial users observe significant structural or potential
  environmental safety problems with bridges, major culverts, fish stream
  culverts or other road structures, they should notify the designated
  maintainer.
  v. During periods when multiple industrial users are operating, RUP holders
  are encouraged to establish and participate in a local road user group to co-
  ordinate hauling activities, discuss shared costs and maintenance standards,
  and ensure a safe transport route for all users.
  vi.  It is the DM’s expectation that a fair Shared Road Maintenance Agreement
  is negotiated prior to hauling activities between the designated maintainer
  and other industrial parties for periods of road use.
  vii. Industrial users are expected to adequately maintain signs on Forest
  Service Roads. Signs may not be erected on a Forest Service right-of-way
  without the approval of the District Manager. Standard informational and
  resource road radio communication signage has been developed by
  government for use on Forest Service roads. (Forest Service Road Sign
  Standards).

  Page 4 of 8
Ministry of Forests, Lands,  Chilliwack Natural Resource District  46360 Airport Road
Natural Resource Operations  Chilliwack, BC V2P 1A5
and Rural Development  Phone: (604)702-5700
  Fax: (604) 702-5711

  viii. All road users, when using mobile radios for communicating location and
  position must use the posted channels and protocols. Resource Road (RR)
  channels shall only be used, with exception of emergency situations, for the
  purposes of communicating location and position (RR — British Columbia
  Resource Road Channels). RR channels are not to be used for business or
  other communication.


  ix.  Subject to Forest Practices Planning Regulations Section 79 (6), RUP
  holders are expected to maintain the road to be used safely by industrial
  users. During timber hauling operations in dry conditions, dust control
  must be carried out using water or a product that meets Ministry standards.


  DM Expectations of the Designated Maintainer


  i.  The designated maintainer must maintain the FSR to one of two levels:
  1. Industrial Use – Subject to FRPA 22, a and FPPR 79 (6) to (9) the
  designated maintainer of the FSR must ensure that the structural
  integrity of the road prism and clearing width are protected; the
  drainage systems of the road are functional; and the road can be used
  safely by industrial users.
  2. Wilderness Level Maintenance - During periods of no industrial
  activity, subject to FRPA 22 and FPPR 81, the designated maintainer
  must ensure the structural integrity of the road prism and clearing
  width are protected and that the drainage systems of the road are
  functional only to the extent necessary to ensure there is no material
  adverse effect on a forest resource.
  ii.  It is expected that the designated maintainer will maintain the FSR and associated
  structures to provide for safe industrial use and protection of the environment
  consistent
  with all legislative requirements inclusive of Work Safe BC requirements.
  iii.  Designated maintainers are expected to conduct and document regular road
  inspections, rectifying any deficiencies discovered during those inspections.
  iv.  Safety issues for industrial users and negative impacts on forest
  values are to be addressed immediately.


  Page 5 of 8
Ministry of Forests, Lands,  Chilliwack Natural Resource District  46360 Airport Road
Natural Resource Operations  Chilliwack, BC V2P 1A5
and Rural Development  Phone: (604)702-5700
  Fax: (604) 702-5711

  v.  Repairs will be completed in a timely manner to maintain the structural
  integrity of the road prism, including the sub-grade and structures, and to
  protect the environment.
  vi.  Forest Tenure holders are expected to conduct road management and
  maintenance consistent with Coast Appraisal Manual section 5.4. Coast
  Appraisal Manual - Timber Pricing Branch Manuals - Ministry of Forests,
  Lands and Natural Resource Operations - Province of B.C.
  vii.  The DM may close an FSR if continued use may cause significant damage
  to the road, cause significant sediment delivery, or endanger property, public
  health or public safety [FRPA 22.2(2)(c)].
  viii. Ensure all maintenance and repairs are carried out in a timely fashion
  regardless of who is responsible for damage.
  ix.  Report to the DM any significant structural, user safety, or
  environmental safety concerns on FSRs or FSR structures.



  DM Expectations for Designated Maintainer for FSR Structures


  The designated maintainer is responsible for maintenance of FSR structures including:
  bridges, major culverts, retaining walls, fords, and other engineered structures.
  i. The designated maintainer shall complete and document on at least an annual
  basis, or more frequent as may be warranted, during industrial operations, or
  prior to commencement of industrial activity, condition inspections on FSR
  bridges.
  ii. Where significant structural and/or potential safety issues are observed, the
  designated maintainer shall take appropriate and timely action to address
  safety of users.
  iii. The Ministry co-ordinates routine condition inspections on all FSR bridges and
  major structures. Inspections carried out are provided through the district
  manager to designated maintainers for FSRs. These inspection results include
  load ratings assigned to each structure. Designated maintainers should not be
  solely relying on inspections results from the ministry but are expected to
  conduct their own inspections as well.
  For your convenience, bridge inspections are posted on Chilliwack District’s ftp
  site at: http://www.for.gov.bc.ca/ftp/DCK/external/!publish/ENGINEERING/
  Page 6 of 8
Ministry of Forests, Lands,  Chilliwack Natural Resource District  46360 Airport Road
Natural Resource Operations  Chilliwack, BC V2P 1A5
and Rural Development  Phone: (604)702-5700
  Fax: (604) 702-5711

  iv. Repair defects or deficiencies that have been identified through inspections,
  in a timely fashion. [FPPR 75]
  v. All repairs and the materials used to complete the repairs must conform to
  ministry standards and specifications which can be found through the
  ministry Bridges and Major Culverts webpage.
  vi. With the exception of emergency works, provide the DM notice at least 30 days
  in advance of any bridge, major culvert, fish stream culvert installation or
  works of a structural nature [FPPR 79(7)]. This notice requirement applies to
  structural repairs on Forest Service road bridges. Upon receiving notice the
  DM may issue a FS 1229 (District Manager Requirements – Building of any
  Forest Service Road Bridges, Major Culverts, or installation of Fish Stream
  Culverts by a Road Use Permit Holder) which will specify the design and
  construction standards to which the designated maintainer will be held [FPPR
  79(8)]. It is recommended to bring forward any proposals for bridges, major
  culverts, fish stream culverts or works of a structural nature as soon as possible
  such that the designated maintainer has adequate time to incorporate DM
  requirements.
  vii. Notify the district manager once bridge repairs and maintenance are completed.
  This information is used to update the Corporate Bridge Registry which is used
  to administer and monitor FSR bridge and major culvert infrastructure. Pictures
  of the completed works are expected to be included with submitted
  documentations. As-built record drawings and documentation must be provided
  for new bridges, major culverts, and fish stream culverts [FPPR 79(8)].

  DM Expectations of the Secondary User (when you are not the Designated
  Maintainer)

  Where you are not the designated maintainer for all or some portions of the FSR identified in
  Schedule A, you are obliged to make contact with designated maintainer, outline your
  activities and scheduling and reach agreement as to an appropriate sharing of the road
  maintenance costs or activities.


  Relief of Obligations from a Road Use Permit

  When a RUP holder wishes to be relieved from further obligations of a Road Use Permit
  or any of its branches, they must apply in writing to the DM. The DM will need to be
  satisfied that obligations of the RUP holder have been met.
  Page 7 of 8
Ministry of Forests, Lands,  Chilliwack Natural Resource District  46360 Airport Road
Natural Resource Operations  Chilliwack, BC V2P 1A5
and Rural Development  Phone: (604)702-5700
  Fax: (604) 702-5711

  The Statement of General Conformance form must be completed and submitted
  to the DM - “Statement of General Conformance RUP – Road Use Permit
  Closure Request”. This letter is integral to Road Use Permit FS102, Schedule A
  and cover letter documents and should be attached thereto.


  If you have any questions on the above, please contact our engineering department by
  phone at 604- 702-5700 or email at: Forests.ChilliwackDistrictOffice@gov.bc.ca

  Sincerely,
  Digitally signed
  by Mike Peters
  Date:
  2021.08.18
  11:40:06 -07'00'

  Mike Peters
  District Manager
  Chilliwack Natural Resource District




  Page 8 of 8
Ministry of Forests, Lands,  Chilliwack Natural Resource District  46360 Airport Road
Natural Resource Operations  Chilliwack, BC V2P 1A5
and Rural Development  Phone: (604)702-5700
  Fax: (604) 702-5711


  EMERGENCY REPAIRS




  Proposed road maintenance activities resulting from a natural event
  should be identified as “Emergency Repairs” if any of the following
  statements apply:


  a) Poses an immediate threat to life, health, property, or environment;

  b) Has already caused loss of life, health detriments, property damage, or
  environmental damage.

  c) Has a high probability of escalating to cause immediate threat to life,
  health, property, or environmental damage




Road Maintenance Flowsheet: A guide to advise if First Nation consultation is required for road
maintenance activities.
Chilliwack Natural Resource District
April 14, 2021
  Page 2

Road Maintenance Flowsheet: A guide to advise if First Nation consultation is required for road
maintenance activities.
Chilliwack Natural Resource District
April 14, 2021
  Page 3

[Page 9: text read by OCR from the page image]
Road Maintenance Flowsheet: A guide to advise if First Nation
consultation is required for road maintenance activities in the

Chilliwack Natural Resource District

YES
*Does the
proposed
activity cause
ground
disturbance? YES
See Road
Maitenance YES
Lil Activities J
Table1 Ground ~~ i
Disturbance vs YES
Non-ground
Disturbance *Has Previous : -
Maintenance Consultation *Does the
Activities on been completed? previous
page 3 of the Or has an consultation or / YES
archeological ~« Archeological - -- . rv
assessment «if previously
Assessment consulted
been conducted? adequately cover) were ail’
the area in outstanding
question and comments from
have concerns
First Nations
been addressed? addressed?
. . : FN Consultation is
required
NO

NO.

[Page 11: text read by OCR from the page image]
Table 1: Ground Disturbance versus Non-Ground Disturbance Maintenance Activities:

Ground Disturbance (triggers consultation)

Non-ground disturbance (does not trigger consultation)

Bridge installation/replacement

Existing culvert repairs/replacement (same size culvert) *

Major Culvert installation/replacement (arch culverts, culverts >2000mm)

Culvert maintenance (clean up inlet/outlet)

Retaining wall construction: Engineered structure vs. non-engineered structure

Brushing (5m upslope/fillslope)

Armoured ford construction Ditching
Log/woodbox culvert construction Surfacing
New installation of open & closed bottom metal culvert on non-fish streams Grading

Upgrade open & closed bottom metal culvert size *

Dangerous Tree Falling

Rock source material extraction

Sign Installation

Road reactivation/deactivation

Gate installation

FSR construction

Cross-ditches and waterbars re-establishment

FSR re-alignment

Snow plowing

Temporary stream crossing construction

Dust control application

Road prism stabilization due to road washouts, landslides, rock fall events
(includes addition of rip rap)

Construction of spoil sites and/or laydown areas

*Best Management Practices must be followed

Road Maintenance Flowsheet: A guide to advise if First Nation consultation is required for road

maintenance activities.
Chilliwack Natural Resource District
April 14, 2021

Page 3
</source_text>

Page images of the map or scan pages are attached (page 9, page 11). Look at them as well as the text.

Return the JSON for this document.
