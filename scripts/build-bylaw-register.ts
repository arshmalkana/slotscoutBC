/**
 * Builds or refreshes data/bylaws.json (PRD Appendix A) from the official boundary layers:
 * one row per municipality, regional district electoral area and Islands Trust local trust area.
 * Existing rows keep their status, bylaw links and review dates; new jurisdictions start at
 * "not_started", which shows grey on the map.
 *
 *   npm run register:bylaws
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { BylawEntry } from "@slotscout/engine";

const WFS = "https://openmaps.gov.bc.ca/geo/pub/wfs";
const OUT = fileURLToPath(new URL("../data/bylaws.json", import.meta.url));
const UA = "SlotScoutBot/0.1 (+https://slotscout.ca/about; data@slotscout.ca)";

async function names(typeName: string): Promise<{ name: string; group: string; website?: string }[]> {
  const url = `${WFS}?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json&typeNames=pub:${typeName}&propertyName=ADMIN_AREA_NAME,ADMIN_AREA_GROUP_NAME,WEBSITE_URL&sortBy=ADMIN_AREA_NAME`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${typeName}: HTTP ${res.status}`);
  const json = (await res.json()) as { features: { properties: Record<string, string | null> }[] };
  const seen = new Set<string>();
  const out: { name: string; group: string; website?: string }[] = [];
  for (const f of json.features) {
    const name = f.properties.ADMIN_AREA_NAME ?? "";
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, group: f.properties.ADMIN_AREA_GROUP_NAME ?? "", website: f.properties.WEBSITE_URL ?? undefined });
  }
  return out;
}

/** Facts given in the product requirements (PRD 5.4). Still "in_progress" until digitised and reviewed. */
const SEED: Record<string, Partial<BylawEntry>> = {
  "muni:City of Mission": {
    status: "in_progress",
    bylaw: { title: "Discharge of Firearms Regulation Bylaw", number: "5433-2014" },
    notes:
      "Template case: Area A full ban; Area B shotgun with shot while hunting; Area C shotgun with shot or slug while hunting; Area D rifle or shotgun while hunting; plus section 7 limits. All four areas are red for target shooting once reviewed.",
  },
};

async function main() {
  let existing: BylawEntry[] = [];
  try {
    existing = (JSON.parse(await readFile(OUT, "utf8")) as { entries: BylawEntry[] }).entries;
  } catch {
    // first run
  }
  const byKey = new Map(existing.map((e) => [e.key, e]));

  const [munis, eas, ltas] = await Promise.all([
    names("WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP"),
    names("WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_ELECTORAL_AREAS_SP"),
    names("WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_LOCAL_TRUST_AREAS_SP"),
  ]);

  const rows: BylawEntry[] = [];
  const add = (key: string, kind: BylawEntry["kind"], name: string, rd: string) => {
    const prev = byKey.get(key);
    rows.push({ key, kind, name, regionalDistrict: rd || undefined, status: "not_started", ...SEED[key], ...prev });
  };
  for (const m of munis) add(`muni:${m.name}`, "municipality", m.name, m.group);
  for (const e of eas) add(`ea:${e.name}`, "electoral_area", e.name, e.group);
  for (const l of ltas) add(`lta:${l.name}`, "local_trust_area", l.name, "Islands Trust");

  const counts = rows.reduce<Record<string, number>>((acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc), {});
  await writeFile(
    OUT,
    JSON.stringify(
      {
        $comment:
          "Local government firearm bylaw register (PRD Appendix A). A jurisdiction shows grey until its bylaw is digitised, reviewed by a second person and re-confirmed within 45 days. Regenerate with `npm run register:bylaws`; existing rows are kept.",
        generatedOn: new Date().toISOString().slice(0, 10),
        counts,
        entries: rows,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Wrote ${rows.length} rows (${munis.length} municipalities, ${eas.length} electoral areas, ${ltas.length} local trust areas)`, counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
