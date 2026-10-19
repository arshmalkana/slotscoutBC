import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { P } from "./paths.js";

export interface Source {
  id: string;
  name: string;
  owner: string;
  url: string;
  access: string;
  endpoint: string;
  layer: string;
  licence: string;
  robots: string;
  cadence: string;
  freshness_hours: number;
  rules: string[];
  contact: string;
  pull?: "gis" | "district_pages" | "bclaws" | "bylaws" | "advisories";
  unit?: string;
  method?: string;
  status?: string;
  /** ArcGIS REST where clause for sources pulled from an ArcGIS layer. */
  where?: string;
}

export function loadRegistry(): { version: number; checked_on: string; sources: Source[] } {
  return parse(readFileSync(P.registry, "utf8"));
}
