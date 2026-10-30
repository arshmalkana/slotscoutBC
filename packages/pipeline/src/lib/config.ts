import { existsSync, readFileSync } from "node:fs";
import { parse } from "smol-toml";
import { P } from "./paths.js";

export interface PipelineConfig {
  pipeline: { extractor: "auto" | "api" | "agent" | "manual"; user_agent: string; min_request_spacing_s: number; month: string };
  ai: { model: string; effort: "low" | "medium" | "high" | "xhigh" | "max"; max_tokens: number; runs: number; server_side_fallback: boolean; autopublish: boolean; prompts: Record<string, string> };
  thresholds: { field_accuracy: number; shape_agreement_share: number; shape_agreement_overlap: number; effect_accuracy: number; looser_errors: number; notice_status_accuracy: number };
  validation: {
    ring_close_m: number;
    synopsis_overlap_min: number;
    direction_tolerance_deg: number;
    max_area_km2_road_buffer: number;
    max_area_km2_metes_and_bounds: number;
    conservative_pad_m: number;
  };
  gis: { page_size: number; max_count_change: number; store_bodies_up_to_features: number };
  bclaws: { api_confirmed: boolean; api_document_url: string; documents: string[]; repealed?: Record<string, string>; not_found?: Record<string, string> };
  storage: { commit_pdf_max_mb: number; screenshot_quality: number; screenshot_max_height_px: number };
  /** The map editor's community contributions: the live site whose confirmed contributions the pipeline publishes. */
  community?: { api_url?: string };
}

let cached: PipelineConfig | null = null;

export function config(): PipelineConfig {
  if (!cached) cached = parse(readFileSync(P.config, "utf8")) as unknown as PipelineConfig;
  return cached;
}

/** Loads .env once (the API key lives only there, Addendum A 10.6). */
export function loadEnv(): void {
  if (existsSync(P.env)) process.loadEnvFile(P.env);
}

export type Mode = "api" | "agent" | "manual";

export function extractorMode(): Mode {
  loadEnv();
  const want = config().pipeline.extractor;
  if (want === "auto") return process.env.ANTHROPIC_API_KEY ? "api" : "agent";
  return want;
}

/** Working month, YYYY-MM in Pacific time, unless config or --month overrides it. */
export function currentMonth(argMonth?: string): string {
  const m = argMonth || process.env.PIPELINE_MONTH || config().pipeline.month;
  if (m) {
    // YYYY-MM, or YYYY-MM-<label> for an extra run in the same month, compared with the plain month.
    if (!/^\d{4}-\d{2}(-[a-z0-9]+)?$/.test(m)) throw new Error(`month must be YYYY-MM or YYYY-MM-<label>, got ${m}`);
    return m;
  }
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}`;
}

/** Today in Pacific time, YYYY-MM-DD. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
