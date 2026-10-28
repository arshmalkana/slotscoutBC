import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { diffWords } from "diff";
import { currentMonth } from "../lib/config.js";
import type { Manifest } from "../lib/manifest.js";
import { manifestPath } from "../lib/manifest.js";
import { P, monthDir } from "../lib/paths.js";
import { legalText, makeUnit, noticeUnits, splitBylaw, splitRegulation, type Unit } from "../lib/units.js";
import { PDF_HEADER, existingImages, pdfImagesFrom, readPdf } from "../lib/pdf.js";
import { listFiles, log, progress, readJsonIf, rel, sha256, writeJson, writeText } from "../lib/util.js";
import { previousManifest } from "./pull.js";
import type { BylawFind } from "./bylaws.js";

/**
 * Step 2 (Addendum A 5.1, 10.3 step 5): split every pulled text into units, normalise and hash
 * them, compare with the last month that has units, and write the change report.
 */
export type UnitStatus = "new" | "unchanged" | "changed" | "removed";

export interface UnitChange {
  id: string;
  kind: Unit["kind"];
  title: string;
  status: UnitStatus;
  /** Preliminary change type; changed units are classified by change.v1 and checked field by field in build. */
  changeType: "new" | "new_source" | "looser" | "pending_classification" | "none";
  oldHash: string | null;
  newHash: string | null;
  diff: string | null;
}

export function unitsPath(month: string): string {
  return join(monthDir(month), "units.json");
}

export function loadUnits(month: string): Unit[] {
  return readJsonIf<Unit[]>(unitsPath(month), []);
}

function previousUnitsMonth(month: string): string | null {
  const months = listFiles(P.raw, (f) => basename(f) === "units.json")
    .map((f) => basename(join(f, "..")))
    .filter((m) => m < month)
    .sort();
  return months.at(-1) ?? null;
}

function collect(month: string): Unit[] {
  const dir = monthDir(month);
  const m = readJsonIf<Manifest | null>(manifestPath(month), null);
  const fileMeta = new Map((m?.files ?? []).map((f) => [f.path, f]));
  const units: Unit[] = [];
  const seen = new Set<string>();
  const add = (us: Unit[]) => {
    for (const u of us) {
      if (seen.has(u.id)) continue;
      seen.add(u.id);
      units.push(u);
    }
  };

  // Regulations: official copies first (BC Laws API or a person's saved copy), then unconfirmed excerpts. Only the
  // Closed Areas Regulation is split into sections; the others (Hunting, Parks, Wildfire, Forest Recreation, Motor
  // Vehicle Prohibition) are kept as dated copies the rules cite. Their own schedules must not read as closed areas.
  for (const f of listFiles(join(dir, "bclaws"), (p) => /\.(html?|xml|txt)$/i.test(p) && basename(p).startsWith("76_84"))) {
    const raw = readFileSync(f, "utf8");
    const meta = fileMeta.get(rel(f));
    const current = raw.match(/current to\s+([A-Z][a-z]+ \d{1,2}, \d{4})/i)?.[1];
    add(
      splitRegulation(legalText(raw, f), {
        source: "closed_areas",
        url: meta?.url ?? `https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/${basename(f).replace(/\.\w+$/, "")}`,
        file: rel(f),
        fileSha256: sha256(raw),
        version: current ? `BC Laws consolidation current to ${current}` : `copy saved ${meta?.fetchedAt?.slice(0, 10) ?? month}`,
        confirmed: true,
      }),
    );
  }
  for (const f of listFiles(join(dir, "inbox", "excerpts"), (p) => p.endsWith(".txt"))) {
    const raw = readFileSync(f, "utf8");
    const source = raw.match(/^Source:\s*(.*)$/m)?.[1] ?? "unknown";
    add(
      splitRegulation(raw.replace(/^Source:.*\n/m, ""), {
        source: "closed_areas",
        url: null,
        file: rel(f),
        fileSha256: sha256(raw),
        version: `Unconfirmed excerpt: ${source}`,
        confirmed: false,
      }),
    );
  }

  // Road notices from every district page.
  const pages = listFiles(join(dir, "district_pages"), (p) => p.endsWith(".html"));
  for (const [i, f] of pages.entries()) {
    progress("split", "district road pages", i + 1, pages.length, basename(f, ".html"));
    const html = readFileSync(f, "utf8");
    const meta = fileMeta.get(rel(f));
    const org = basename(f, ".html");
    add(
      noticeUnits(html, org, meta?.url ?? "", { source: "road_notices", file: rel(f), fileSha256: sha256(html), version: `District page fetched ${meta?.fetchedAt ?? month}`, confirmed: true }).units,
    );
  }
  const dmFiles = listFiles(join(dir, "dm_notices"), (p) => p.endsWith(".txt"));
  for (const [i, f] of dmFiles.entries()) {
    if ((i + 1) % 10 === 0 || i + 1 === dmFiles.length) progress("split", "District Manager PDFs", i + 1, dmFiles.length, basename(f, ".txt"));
    const text = readFileSync(f, "utf8");
    const url = text.match(/^Source:\s*(.*)$/m)?.[1] ?? null;
    add([
      makeUnit({
        id: `dm:${basename(f, ".txt")}`,
        kind: "dm_notice",
        source: "dm_notices",
        title: `District Manager notice ${basename(f, ".txt")}`,
        url,
        file: rel(f),
        fileSha256: sha256(text),
        version: text.match(/^Fetched:\s*(.*)$/m)?.[1] ?? month,
        text: text.replace(PDF_HEADER, "").trim(),
        confirmed: true,
        // Map and scan pages rendered at pull time; the extraction looks at them as well as the text.
        meta: { org: basename(f).split("-")[0], read: text.match(/^Read:\s*(.*)$/m)?.[1] ?? "text layer", images: existingImages(pdfImagesFrom(text)) },
      }),
    ]);
  }

  // Bylaws the browser found.
  const finds = readJsonIf<BylawFind[]>(join(dir, "bylaws", "finds.json"), []);
  progress("split", "bylaw sites", 0, finds.length);
  for (const [i, find] of finds.entries()) {
    if ((i + 1) % 10 === 0 || i + 1 === finds.length) progress("split", "bylaw sites", i + 1, finds.length, find.name);
    for (const d of find.documents) {
      if (!d.textFile) continue;
      const path = join(P.root, d.textFile);
      if (!existsSync(path)) continue;
      const text = readFileSync(path, "utf8");
      // A document the finder matched on a loose word (a sewage discharge bylaw) is kept as evidence but not read.
      if (!/firearm|weapon/i.test(text)) continue;
      const docId = `${find.key}:${sha256(d.url).slice(0, 8)}`;
      add(splitBylaw(text, docId, { source: "bylaws", title: `${find.name}: ${d.title}`, url: d.url, file: d.textFile, fileSha256: sha256(text), version: `Captured ${find.checkedAt.slice(0, 10)}`, confirmed: true }).map((u) => ({ ...u, meta: { ...u.meta, jurisdiction: find.key, docTitle: d.title } })));
    }
  }
  // Bylaw copies a person saved in inbox/bylaws/<jurisdiction>/ (sites that block automation).
  for (const f of listFiles(join(dir, "inbox", "bylaws"), (p) => /\.(txt|pdf)$/i.test(p))) {
    const jur = basename(join(f, ".."));
    let text: string | null = null;
    if (f.toLowerCase().endsWith(".pdf")) text = readPdf(f, null).text;
    else text = readFileSync(f, "utf8");
    if (!text) continue;
    const docId = `inbox:${jur}:${sha256(text).slice(0, 8)}`;
    add(
      splitBylaw(text, docId, { source: "bylaws", title: `${jur}: ${basename(f)}`, url: null, file: rel(f), fileSha256: sha256(text), version: `Copy saved by a person (${month})`, confirmed: true }).map((u) => ({
        ...u,
        meta: { ...u.meta, jurisdiction: jur.includes(":") ? jur : `muni:${jur}`, docTitle: basename(f) },
      })),
    );
  }
  return units;
}

function wordDiff(a: string, b: string): string {
  return diffWords(a, b)
    .map((p) => (p.added ? `{+${p.value}+}` : p.removed ? `[-${p.value}-]` : p.value.length > 120 ? `${p.value.slice(0, 50)} … ${p.value.slice(-50)}` : p.value))
    .join("");
}

export function split(opts: { month?: string } = {}) {
  const month = currentMonth(opts.month);
  const units = collect(month);
  writeJson(unitsPath(month), units);
  const prevMonth = previousUnitsMonth(month);
  const prev = prevMonth ? loadUnits(prevMonth) : [];
  const prevById = new Map(prev.map((u) => [u.id, u]));
  const prevSources = new Set(prev.map((u) => String(u.meta.jurisdiction ?? u.source)));
  const changes: UnitChange[] = [];
  for (const u of units) {
    const old = prevById.get(u.id);
    if (!old) {
      const isNewSource = !!prevMonth && !prevSources.has(String(u.meta.jurisdiction ?? u.source));
      changes.push({ id: u.id, kind: u.kind, title: u.title, status: "new", changeType: isNewSource ? "new_source" : "new", oldHash: null, newHash: u.hash, diff: null });
    } else if (old.hash !== u.hash) {
      changes.push({ id: u.id, kind: u.kind, title: u.title, status: "changed", changeType: "pending_classification", oldHash: old.hash, newHash: u.hash, diff: wordDiff(old.text, u.text) });
    } else changes.push({ id: u.id, kind: u.kind, title: u.title, status: "unchanged", changeType: "none", oldHash: old.hash, newHash: u.hash, diff: null });
  }
  const ids = new Set(units.map((u) => u.id));
  for (const old of prev) {
    if (ids.has(old.id)) continue;
    // A unit that disappears may lift a rule: looser, so a person decides (Addendum A 5.1, 5.2 step 4).
    changes.push({ id: old.id, kind: old.kind, title: old.title, status: "removed", changeType: "looser", oldHash: old.hash, newHash: null, diff: null });
  }
  writeJson(join(monthDir(month), "changes.json"), { month, comparedWith: prevMonth, changes });
  writeReport(month, prevMonth, units, changes);
  const count = (s: UnitStatus) => changes.filter((c) => c.status === s).length;
  log("split", `${units.length} units; ${count("new")} new, ${count("changed")} changed, ${count("removed")} removed, ${count("unchanged")} unchanged${prevMonth ? ` vs ${prevMonth}` : " (first pull: baseline)"}`);
  return { units, changes };
}

function writeReport(month: string, prevMonth: string | null, units: Unit[], changes: UnitChange[]): void {
  const m = readJsonIf<Manifest | null>(manifestPath(month), null);
  const pm = previousManifest(month);
  const L: string[] = [];
  L.push(`# Change report ${month}`, "");
  L.push(prevMonth ? `Compared with ${prevMonth}.` : "First pull: this is the baseline every later month is compared with.", "");
  L.push("## GIS layers", "", "| Layer | Features | Server count | Count matches | Change vs last month | Content hash |", "| --- | ---: | ---: | --- | --- | --- |");
  for (const [id, l] of Object.entries(m?.layers ?? {}).sort()) {
    const old = pm?.layers[id];
    const change = !old ? "first pull" : old.sha256 === l.sha256 ? "no change" : `changed (${l.countChange !== null ? `${(l.countChange * 100).toFixed(2)}% count` : "content"})`;
    const flag = l.countChange !== null && Math.abs(l.countChange) > 0.05 ? " **over 5%: hold for review**" : "";
    L.push(`| ${id} | ${l.pulledCount.toLocaleString("en-CA")} | ${l.serverCount?.toLocaleString("en-CA") ?? "?"} | ${l.countMatches ? "yes" : "**no**"} | ${change}${flag} | \`${l.sha256?.slice(0, 16) ?? "-"}\` |`);
  }
  L.push("", "## Text units", "", "| Kind | Units | New | Changed | Removed | Unchanged |", "| --- | ---: | ---: | ---: | ---: | ---: |");
  const kinds = [...new Set([...units.map((u) => u.kind), ...changes.map((c) => c.kind)])].sort();
  for (const k of kinds) {
    const c = changes.filter((x) => x.kind === k);
    const n = (s: UnitStatus) => c.filter((x) => x.status === s).length;
    L.push(`| ${k} | ${units.filter((u) => u.kind === k).length} | ${n("new")} | ${n("changed")} | ${n("removed")} | ${n("unchanged")} |`);
  }
  const changed = changes.filter((c) => c.status === "changed");
  if (changed.length) {
    L.push("", "## Changed wording", "", "Each is re-read and classified (cosmetic, stricter, looser, unclear); the class is checked by re-extracting the fields.", "");
    for (const c of changed.slice(0, 200)) L.push(`### ${c.title}`, "", "```", c.diff ?? "", "```", "");
  }
  const removed = changes.filter((c) => c.status === "removed");
  if (removed.length) {
    L.push("", "## Removed (looser: waits for a person)", "", ...removed.map((c) => `- ${c.title} (\`${c.id}\`)`));
  }
  const unconfirmed = units.filter((u) => !u.confirmed);
  if (unconfirmed.length) L.push("", "## Unconfirmed text", "", ...unconfirmed.map((u) => `- ${u.title}: ${u.version}. Nothing built from it can be approved until it is checked against the official consolidation.`));
  if (m?.failures.length) L.push("", "## Failed or missing sources", "", ...m.failures.map((f) => `- **${f.source}** ${f.what}: ${f.error}`));
  writeText(join(P.reports, `${month}-changes.md`), L.join("\n") + "\n");
}

