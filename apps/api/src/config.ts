import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// src/ in development and dist/ in production are both two levels below the repo root's apps/api.
const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");

export const config = {
  port: Number(process.env.PORT ?? 8787),
  host: process.env.HOST ?? "0.0.0.0",
  siteUrl: process.env.SITE_URL ?? "https://slotscout.ca",
  repoRoot,
  dataDir: process.env.DATA_DIR ?? resolve(repoRoot, "data"),
  /** Source register shared with the pipeline (Addendum A 10.2). */
  registryFile: process.env.REGISTRY_FILE ?? resolve(repoRoot, "sources/registry.yaml"),
  /** Rule files the pipeline builds: digitised areas (*.geojson) and the road notice store. */
  rulesDir: process.env.RULES_DIR ?? resolve(repoRoot, "rules"),
  /** Pipeline reports; status.json there feeds /v1/pipeline-status. */
  pipelineReportsDir: process.env.PIPELINE_REPORTS_DIR ?? resolve(repoRoot, "reports"),
  /** How often to look for new data from the pipeline. */
  reloadMs: Number(process.env.DATA_RELOAD_MS ?? 60_000),
  webDist: process.env.WEB_DIST ?? resolve(repoRoot, "apps/web/dist"),
  /** Directory for report-a-problem submissions. Never committed. */
  reportsDir: process.env.FEEDBACK_DIR ?? process.env.REPORTS_DIR ?? resolve(repoRoot, "data/feedback"),
  wfsUrl: process.env.BC_WFS_URL ?? "https://openmaps.gov.bc.ca/geo/pub/wfs",
  wmsUrl: process.env.BC_WMS_URL ?? "https://openmaps.gov.bc.ca/geo/pub/ows",
  cpcadUrl: "https://maps-cartes.ec.gc.ca/arcgis/rest/services/CWS_SCF/CPCAD/MapServer/0/query",
  imageryIdentifyUrl: "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/identify",
  geocoderUrl: "https://geocoder.api.gov.bc.ca/addresses.json",
  geonamesUrl: "https://apps.gov.bc.ca/pub/bcgnws/names/search",
  userAgent: process.env.USER_AGENT ?? "SlotScoutBot/0.1 (+https://slotscout.ca/about; data@slotscout.ca)",
  trustProxy: process.env.TRUST_PROXY === "true",
  rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60),
  /** Upstream request timeout. */
  timeoutMs: Number(process.env.UPSTREAM_TIMEOUT_MS ?? 20000),
};
