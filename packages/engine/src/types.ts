import type { Feature, Geometry } from "geojson";

export interface LatLon {
  lat: number;
  lon: number;
}

export type FirearmClass = "non_restricted" | "restricted" | "prohibited";
export type FirearmType =
  | "shotgun_shot"
  | "shotgun_slug"
  | "rimfire"
  | "centrefire"
  | "muzzleloader"
  | "airgun";
export type Activity = "target" | "hunting";

export interface Profile {
  firearmClass: FirearmClass;
  firearmType: FirearmType;
  activity: Activity;
  /** Fall-zone radius in metres. Planning default from the firearm type, editable by the user. */
  fallZoneM: number;
}

/** Effect a rule has on the verdict (PRD section 3): R red, A amber, G? grey, N note only. */
export type Effect = "R" | "A" | "G?" | "N";

export type CheckStatus =
  | "fail" // R: prohibited here, or not public land
  | "conditional" // A: allowed only under a condition, or a hazard
  | "unknown" // G?: data missing, stale, or not yet digitised
  | "pass"
  | "not_applicable"
  | "note"; // N: information only

export type VerdictState = "red" | "amber" | "grey" | "green";

export type LightId =
  | "federal"
  | "wildlife"
  | "parks"
  | "indigenous"
  | "ownership"
  | "local"
  | "recsites"
  | "wildfire"
  | "access"
  | "fallzone"
  | "imagery"
  | "freshness";

export type CatalogueGroup =
  | "federal"
  | "wildlife"
  | "provincial"
  | "local"
  | "indigenous"
  | "ownership"
  | "safety"
  | "system";

/** Severity order used to list red reasons (PRD 3.9). Lower sorts first. */
export type SeverityClass =
  | "federal"
  | "wildlife"
  | "park"
  | "indigenous"
  | "ownership"
  | "local"
  | "recsite"
  | "access"
  | "safety"
  | "system";

export interface RuleDefinition {
  id: string;
  group: CatalogueGroup;
  light: LightId;
  severity: SeverityClass;
  title: string;
  /** Plain-English summary, grade 8 reading level. */
  summary: string;
  authority: string;
  /** True while the citation awaits written confirmation by the legal reviewer (PRD 11.4). */
  verify: boolean;
  /** Effect as written in the catalogue. */
  effectText: string;
  /** Source register IDs this rule depends on. */
  sources: string[];
  citationUrl?: string;
  spatial: "yes" | "partly" | "no";
}

export interface FeatureHit {
  /** Display name, e.g. "Golden Ears Park". */
  name: string;
  /** Short label of what it is, e.g. "Provincial park" or "Private land". */
  kind: string;
  distanceM: number;
  /** True bearing from the pin to the nearest point of the feature, degrees. */
  bearingDeg: number;
  inside: boolean;
  properties?: Record<string, unknown>;
}

export interface CheckResult {
  ruleId: string;
  light: LightId;
  status: CheckStatus;
  /** One plain-English sentence. */
  reason: string;
  citation: string;
  sourceUrl?: string;
  /** Source IDs whose data this check used. */
  sources: string[];
  /** Date the data was last pulled or confirmed (ISO). */
  dataDate?: string;
  /** Distance to the nearest boundary of this rule's features, metres, when known. */
  nearestM?: number;
  nearestBearingDeg?: number;
  hits?: FeatureHit[];
  /** Exact source text excerpt, when the rule came from a digitised regulation or bylaw. */
  sourceText?: string;
  /** Seasonal rules: when the status will next change (ISO date) and how it reads. */
  changesOn?: string;
  changesText?: string;
  /** Extra notes, e.g. hunting exemptions. Never turn a light green. */
  notes?: string[];
  /** Link for the user to read more or confirm, e.g. the bylaw PDF. */
  moreUrl?: string;
}

/** A layer of features fetched for one source, already in WGS84. */
export interface LayerData {
  sourceId: string;
  status: "ok" | "error" | "missing";
  /** When this data was pulled from the source (ISO timestamp). */
  fetchedAt?: string;
  /** True when the server capped the result, so absence of a feature cannot be trusted. */
  truncated?: boolean;
  features: Feature<Geometry | null, Record<string, unknown>>[];
  error?: string;
}

export interface SourceInfo {
  id: string;
  name: string;
  owner: string;
  /** Freshness limit in hours after which checks using it turn grey. */
  freshnessHours: number;
  url: string;
  licence: string;
}

/** A digitised rule area (PRD 5.2). Only reviewed features are ever evaluated. */
export interface DigitisedRuleProps {
  rule_id: string;
  authority: string;
  source_url: string;
  source_text: string;
  source_version: string;
  effect:
    | "no_shooting"
    | "no_shooting_seasonal"
    | "shot_only"
    | "shot_only_seasonal"
    | "no_rifle"
    | "non_toxic"
    | "no_shooting_hunting_exempt"
    | "no_hunting";
  period?: { start: string; end: string } | null;
  exemptions: string[];
  geometry_method:
    | "admin_boundary"
    | "road_buffer"
    | "metes_and_bounds"
    | "georeferenced_map"
    | "contour"
    /** An approximate zone around the places the text names, when no outline could be drawn. */
    | "named_places";
  buffer_m: number | null;
  partial_extent: boolean;
  conservative: boolean;
  digitised_by: string;
  digitised_on: string;
  reviewed_by: string | null;
  reviewed_on: string | null;
  confidence: "high" | "medium" | "low";
  notes: string;
  /** Addendum A 9 (5.2 schema additions). */
  extraction_method?: "manual" | "rule" | "ai";
  model_version?: string | null;
  prompt_version?: string | null;
  /** Field name -> exact words from source_text it came from. */
  quotes?: Record<string, string>;
  /** True when both independent extraction runs agreed. */
  run_agreement?: boolean | null;
  /**
   * candidate: built, waiting for a person. provisional: an AI-read stricter change published at once
   * (only after the gold set passes) and confirmed by a person within 24 h. approved: reviewed by a
   * second person. retired: replaced or removed after approval.
   */
  status?: "candidate" | "provisional" | "approved" | "retired";
  /** How this version differs from the approved one before it (Addendum A 5.1). */
  change_type?: "new" | "stricter" | "looser" | "unclear" | "cosmetic";
  version?: number;
  unit_hash?: string;
  /**
   * An outline placed approximately from the places the text names (a metes-and-bounds walk traced by code,
   * or a zone around the named place). A spot inside reads "possibly inside", never a firm answer.
   */
  approximate?: boolean;
  approximate_quality?: "traced" | "corners" | "vicinity" | "map_image" | "whole_feature";
  /** For an outline read from an official map image: how far it can be off. Deeper inside than this is a firm answer. */
  approximate_tolerance_m?: number;
}

export type CoverageStatus = "not_started" | "in_progress" | "digitised" | "reviewed";

/** Wildlife Act closed-area coverage per hunting region. */
export interface RegionCoverage {
  region: string;
  name: string;
  status: CoverageStatus;
  /** Last date the digitised set was confirmed against the current consolidation. */
  confirmedOn?: string;
}

export interface BylawEntry {
  /** Stable key, e.g. "muni:District of Mission" or "ea:FVRD Electoral Area H". */
  key: string;
  kind: "municipality" | "electoral_area" | "local_trust_area";
  name: string;
  regionalDistrict?: string;
  status: CoverageStatus | "not_applicable";
  bylaw?: { number?: string; title?: string; url?: string };
  /** Reviewed summary for the whole jurisdiction. Only used when status is "reviewed". */
  targetShooting?: "prohibited" | "permitted_with_zones" | "no_bylaw";
  confirmedOn?: string;
  notes?: string;
}

export interface ImageryInfo {
  provider: string;
  captureDate?: string;
  resolutionM?: number;
  source?: string;
  error?: string;
}

/** One km point of a road notice, placed on the road by measuring along its FTEN geometry (Addendum A 5.2). */
export interface NoticePoint {
  /** Km from the start of the road section; null when the notice gives none. */
  km: number | null;
  kmEnd?: number;
  /** "beyond": blocks travel past km; "range": km to kmEnd; "at": a single spot; "unknown": somewhere on the road. */
  extent: "at" | "beyond" | "range" | "unknown";
  status: "closed" | "restricted" | "gated" | "washout" | "bridge_out" | "deactivated" | "caution";
  /** The sentence the point came from, verbatim. */
  quote: string;
  lat?: number;
  lon?: number;
}

export interface RoadNotice {
  /** district | file section or road | posted date. */
  id?: string;
  district: string;
  section: "warning" | "closure" | "structure" | "work" | "deactivation" | "other";
  road: string;
  /** FSR file and section, e.g. "5748.01", when the notice gives one. */
  fileSection?: string;
  date?: string;
  /** Posted date as YYYY-MM-DD, when it could be read. */
  postedOn?: string;
  text: string;
  kind: "closed" | "restricted" | "caution" | "deactivated" | "info";
  url: string;
  pdfs?: string[];
  points?: NoticePoint[];
  /** True when the rule-based parser could not read every km point; the pipeline queues it for AI. */
  needsAi?: boolean;
  /** How the km points were read. */
  extraction?: "rule" | "ai" | "person";
  /**
   * "page": a notice on the district road safety page. "dm_notice": a road closed in a District
   * Manager PDF (letter, bulletin or gate map) linked from the page, read by the pipeline.
   */
  origin?: "page" | "dm_notice";
  /**
   * "listed": on the district page now. "removed_pending_review": no longer on the page, but kept
   * until a person confirms it was lifted (looser changes wait for a person, Addendum A 5.2).
   */
  listing?: "listed" | "removed_pending_review" | "removed_approved";
}

/** Text on a district page that looks like a closure but could not be tied to a road. */
export interface UnparsedBlock {
  /** SHA-like key of the normalised text, so a reading can be matched later. */
  key: string;
  section: RoadNotice["section"];
  text: string;
}

export interface RoadNoticeData {
  district: string;
  status: "ok" | "error" | "missing";
  /** Closure-like text the parser could not read; until it is read and approved, P6 stays grey for the district. */
  unparsed?: UnparsedBlock[];
  fetchedAt?: string;
  pageUrl?: string;
  notices: RoadNotice[];
  error?: string;
}

export interface ReleaseInfo {
  id: string;
  label: string;
  publishedOn: string;
  notes: string;
}

export interface EvaluationInput {
  point: LatLon;
  profile: Profile;
  /** Date and time the check is for (seasonal rules). May be in the future. */
  at: Date;
  /** Wall-clock time used for freshness limits. Defaults to `at`. */
  now?: Date;
  release: ReleaseInfo;
  /** Whether the point is inside the provincial boundary. */
  inBC: boolean | null;
  layers: Record<string, LayerData>;
  sources: Record<string, SourceInfo>;
  /** Reviewed digitised rule areas near the point. */
  digitised: Feature<Geometry, DigitisedRuleProps>[];
  wildlifeCoverage: RegionCoverage[];
  bylaws: BylawEntry[];
  imagery?: ImageryInfo;
  roadNotices?: RoadNoticeData;
  /** Magnetic declination at the point, degrees east positive. */
  declinationDeg?: number;
}

export interface Light {
  id: LightId;
  label: string;
  state: VerdictState;
  ruleIds: string[];
  /** True for lights that inform but never change the verdict (imagery). */
  informational?: boolean;
  /** True when a red or amber light also has checks that could not be confirmed. */
  partlyUnknown?: boolean;
}

export interface Sector {
  /** Centre bearing of the 10 degree sector, true degrees. */
  centreDeg: number;
  /** True when a 70 degree fan centred here touches no red area, road, trail, building or rec site. */
  safe: boolean;
}

export interface FallZoneSummary {
  radiusM: number;
  findings: FeatureHit[];
  sectors: Sector[];
  /** Suggested throw direction, true degrees, or null when no sector is clear. */
  bestBearingDeg: number | null;
  bestBearingMagneticDeg: number | null;
  declinationDeg: number | null;
  /** True when some layer could not be read, so the compass may be missing hazards. */
  incomplete: boolean;
}

export interface AccessSummary {
  nearestPublicRoad?: { name: string; roadClass: string; surface?: string; distanceM: number; bearingDeg: number };
  nearestResourceRoad?: {
    name: string;
    fileSection: string;
    type: string;
    holder?: string;
    lifeCycle?: string;
    distanceM: number;
    bearingDeg: number;
  };
  notices: RoadNotice[];
  vehicle: "2WD gravel" | "high clearance recommended" | "4x4" | "unknown";
  vehicleReason: string;
  noticesPageUrl?: string;
  noticesFetchedAt?: string;
}

export interface SpotReport {
  release: ReleaseInfo;
  generatedAt: string;
  checkDate: string;
  point: LatLon;
  profile: Profile;
  inBC: boolean | null;
  verdict: {
    state: VerdictState;
    headline: string;
    reason: string;
    /** Checks that could not be confirmed. Shown under any non-grey banner so amber never hides a gap. */
    alsoUnknown: string[];
  };
  lights: Light[];
  lightCounts: Record<VerdictState, number>;
  checks: CheckResult[];
  fallZone: FallZoneSummary;
  access: AccessSummary;
  imagery: ImageryInfo & { loggedSinceImage?: boolean; notes: string[] };
  standingChecks: string[];
  sources: { id: string; name: string; fetchedAt?: string; status: string; fresh: boolean; url: string }[];
  disclaimer: string;
}
