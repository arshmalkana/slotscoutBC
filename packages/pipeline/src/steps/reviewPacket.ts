import { join } from "node:path";
import type { Feature, Geometry, Position } from "geojson";
import { currentMonth } from "../lib/config.js";
import { P } from "../lib/paths.js";
import { loadItems, type ReviewItem } from "../lib/review.js";
import { log, writeText } from "../lib/util.js";

/**
 * Step 7 (Addendum A 10.2, 10.3 step 11): the review packet for the person. Each item shows the
 * source text with every quote marked, the built shape on a small map, both runs, the lookups,
 * the validation results and what changed. Approving is done with `make approve`, by a person.
 */
const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function highlight(text: string, quotes: string[]): string {
  let html = esc(text);
  for (const q of [...new Set(quotes)].filter((x) => x && x.length > 2).sort((a, b) => b.length - a.length)) {
    const e = esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    html = html.replace(new RegExp(e), (m) => `<mark>${m}</mark>`);
  }
  return html;
}

function coords(g: Geometry | null | undefined): Position[][] {
  if (!g) return [];
  if (g.type === "Polygon") return g.coordinates;
  if (g.type === "MultiPolygon") return g.coordinates.flat();
  if (g.type === "LineString") return [g.coordinates];
  if (g.type === "MultiLineString") return g.coordinates;
  return [];
}

/** A small map: the candidate (red outline), the approved version (grey), placed points. North is up. */
function svgMap(item: ReviewItem): string {
  const cand = (item.feature as Feature | undefined)?.geometry;
  const prev = (item.previous_feature as Feature | undefined)?.geometry;
  const pts = ((item.placements as { lat?: number; lon?: number; km: number | null; status: string }[] | undefined) ?? []).filter((p) => p.lat !== undefined);
  const construction = ((item.construction as { point?: Position; what: string }[] | undefined) ?? []).filter((c) => c.point);
  const all = [...coords(cand).flat(), ...coords(prev).flat(), ...pts.map((p) => [p.lon!, p.lat!]), ...construction.map((c) => c.point!)];
  if (!all.length) return `<div class="nomap">No shape or placed point to draw.</div>`;
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of all) {
    minX = Math.min(minX, x!);
    maxX = Math.max(maxX, x!);
    minY = Math.min(minY, y!);
    maxY = Math.max(maxY, y!);
  }
  const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
  const w = Math.max((maxX - minX) * k, 1e-4);
  const h = Math.max(maxY - minY, 1e-4);
  const W = 520;
  const H = Math.max(160, Math.min(420, (W * h) / w));
  const s = Math.min((W - 40) / w, (H - 40) / h);
  const px = ([x, y]: Position) => `${(20 + ((x! - minX) * k) * s).toFixed(1)},${(H - 20 - (y! - minY) * s).toFixed(1)}`;
  const path = (g: Geometry | undefined) => coords(g).map((r) => `M${r.map(px).join("L")}Z`).join("");
  const metres = (w * 111_320) / 1;
  const bar = metres > 2000 ? 1000 : metres > 400 ? 200 : 50;
  const barPx = (bar / 111_320) * s;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Map of the built shape">
<rect width="${W}" height="${H}" class="bg"/>
${prev ? `<path d="${path(prev)}" class="prev"/>` : ""}
${cand ? `<path d="${path(cand)}" class="cand"/>` : ""}
${construction.map((c) => `<circle cx="${px(c.point!).split(",")[0]}" cy="${px(c.point!).split(",")[1]}" r="5" class="junction"><title>${esc(c.what)}</title></circle>`).join("")}
${pts.map((p) => `<circle cx="${px([p.lon!, p.lat!]).split(",")[0]}" cy="${px([p.lon!, p.lat!]).split(",")[1]}" r="5" class="pt ${esc(p.status)}"><title>km ${p.km} ${esc(p.status)}</title></circle>`).join("")}
<line x1="20" y1="${H - 8}" x2="${(20 + barPx).toFixed(1)}" y2="${H - 8}" class="bar"/><text x="${(24 + barPx).toFixed(1)}" y="${H - 4}" class="lbl">${bar} m</text>
<text x="${W - 16}" y="20" class="lbl">N↑</text>
</svg>`;
}

function badge(t: string): string {
  return `<span class="badge ${esc(t)}">${esc(t.replace(/_/g, " "))}</span>`;
}

function itemHtml(it: ReviewItem): string {
  const quotes = [...Object.values(it.quotes ?? {}), ...(((it.placements as { quote?: string }[]) ?? []).map((p) => p.quote ?? ""))];
  const runs = it.runs ? Object.entries(it.runs).filter(([, v]) => v) : [];
  return `<article id="${esc(it.item_id)}" class="item ${it.status}">
<header><h2>${esc(it.title)}</h2><div>${badge(it.change_type)} ${badge(it.kind)} ${it.rule_id ? `<code>${esc(it.rule_id)}</code>` : ""} <span class="status">${esc(it.status)}${it.decided_by ? ` by ${esc(it.decided_by)} on ${esc(it.decided_on)}` : ""}</span></div></header>
<p class="decision"><strong>Decision needed:</strong> ${esc(it.decision)}</p>
<ul class="why">${it.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
<div class="grid"><section><h3>Source text</h3><p class="meta">${esc(it.source.version)}${it.source.url ? ` · <a href="${esc(it.source.url)}">source</a>` : ""}${it.source.confirmed ? "" : ' · <strong class="warn">unconfirmed excerpt</strong>'}</p>
<blockquote>${highlight(it.source.text, quotes)}</blockquote>
${it.quotes && Object.keys(it.quotes).length ? `<table><tr><th>Field</th><th>Quote</th></tr>${Object.entries(it.quotes).map(([f, q]) => `<tr><td><code>${esc(f)}</code></td><td>${esc(q)}</td></tr>`).join("")}</table>` : ""}
${it.rejected_quotes?.length ? `<p class="warn">Dropped (quote not found verbatim): ${it.rejected_quotes.map((x) => `<code>${esc(x)}</code>`).join(", ")}</p>` : ""}
${it.diff ? `<h3>What changed</h3><pre>${esc(it.diff)}</pre>` : ""}</section>
<section><h3>Map</h3>${svgMap(it)}<p class="legend"><span class="sw cand"></span> candidate (drawn with a conservative pad) <span class="sw prev"></span> approved version <span class="sw junction"></span> limit junction</p>
${it.validation?.length ? `<h3>Validation</h3><table>${it.validation.map((v) => `<tr class="${v.passed === false ? "fail" : v.passed ? "ok" : "na"}"><td>${v.passed === false ? "✗" : v.passed ? "✓" : "–"}</td><td>${esc(v.check)}</td><td>${esc(v.detail)}</td></tr>`).join("")}</table>` : ""}
${it.construction?.length ? `<h3>How the shape was built</h3><ol>${(it.construction as { what: string; quote: string | null; source: string }[]).map((c) => `<li>${esc(c.what)}${c.quote ? ` <q>${esc(c.quote)}</q>` : ""} <span class="meta">(${esc(c.source)})</span></li>`).join("")}</ol>` : ""}
${it.lookups?.length ? `<h3>Place lookups</h3><table><tr><th>Name</th><th>Layer</th><th>Result</th></tr>${(it.lookups as { query: string; layer: string; status: string; matches: number; note?: string }[]).map((l) => `<tr class="${l.status === "ok" ? "ok" : "fail"}"><td>${esc(l.query)}</td><td><code>${esc(l.layer.split(".").pop())}</code></td><td>${esc(l.status)} (${l.matches})${l.note ? ` ${esc(l.note)}` : ""}</td></tr>`).join("")}</table>` : ""}
</section></div>
${runs.length ? `<details><summary>Extractions (${runs.map(([k]) => k).join(", ")})</summary><div class="runs">${runs.map(([k, v]) => `<div><h4>${esc(k)}</h4><pre>${esc(JSON.stringify(v, null, 1))}</pre></div>`).join("")}</div></details>` : ""}
${it.disagreements?.length ? `<p class="warn">Disagreements: ${it.disagreements.map(esc).join("; ")}</p>` : ""}
<p class="cmd">Person only: <code>make approve ITEM=${esc(it.item_id)} BY=&lt;initials&gt;</code> or <code>make approve ITEM=${esc(it.item_id)} BY=&lt;initials&gt; DECISION=reject NOTE="why"</code></p>
</article>`;
}

const CSS = `:root{--bg:#fff;--fg:#1c1917;--mut:#57534e;--line:#e7e5e4;--card:#fafaf9;--accent:#1d4ed8;--warn:#9a3412;--cand:#be185d;--prev:#78716c}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#0c0a09;--fg:#f5f5f4;--mut:#a8a29e;--line:#292524;--card:#1c1917;--accent:#93c5fd;--warn:#fdba74;--cand:#f472b6;--prev:#a8a29e}}
body{background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;margin:0 auto;max-width:1200px;padding:16px}
h1{font-size:1.6rem;margin:.2em 0}h2{font-size:1.15rem;margin:0}h3{font-size:.95rem;margin:1em 0 .3em}a{color:var(--accent)}
.item{border:1px solid var(--line);border-radius:10px;background:var(--card);padding:14px 16px;margin:18px 0}.item.approved{opacity:.7}
header{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:baseline}
.badge{display:inline-block;border:1px solid var(--line);border-radius:99px;padding:0 8px;font-size:.8rem}.badge.looser{border-color:var(--warn);color:var(--warn);font-weight:600}.badge.stricter{font-weight:600}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}@media(max-width:800px){.grid{grid-template-columns:1fr}}
blockquote{margin:0;padding:8px 12px;border-left:3px solid var(--line);white-space:pre-wrap;max-height:340px;overflow:auto}mark{background:#fde68a;color:#1c1917}
table{border-collapse:collapse;width:100%;font-size:.85rem}td,th{border-bottom:1px solid var(--line);padding:3px 6px;text-align:left;vertical-align:top}tr.fail td{color:var(--warn)}
pre{white-space:pre-wrap;font-size:.75rem;max-height:360px;overflow:auto;background:var(--bg);padding:6px;border:1px solid var(--line)}.runs{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}
.warn{color:var(--warn)}.meta{color:var(--mut);font-size:.85rem}.cmd{font-size:.85rem;color:var(--mut)}.decision{margin:.5em 0}
svg .bg{fill:var(--bg)}svg .cand{fill:var(--cand);fill-opacity:.18;stroke:var(--cand);stroke-width:2}svg .prev{fill:none;stroke:var(--prev);stroke-width:2;stroke-dasharray:5 4}
svg .junction{fill:var(--accent)}svg .pt{fill:var(--mut)}svg .pt.closed,svg .pt.bridge_out,svg .pt.washout,svg .pt.deactivated,svg .pt.gated,svg .pt.restricted{fill:var(--warn)}svg .bar{stroke:var(--fg);stroke-width:2}svg .lbl{fill:var(--fg);font-size:11px;text-anchor:start}
.legend{font-size:.8rem;color:var(--mut)}.sw{display:inline-block;width:12px;height:12px;vertical-align:middle;border:2px solid}.sw.cand{border-color:var(--cand)}.sw.prev{border-color:var(--prev);border-style:dashed}.sw.junction{border-color:var(--accent);border-radius:50%}
.nomap{color:var(--mut);font-size:.85rem;padding:20px;border:1px dashed var(--line)}nav a{margin-right:10px}`;

export function reviewPacket(opts: { month?: string } = {}) {
  const month = currentMonth(opts.month);
  const items = loadItems(month).sort((a, b) => Number(a.status !== "open") - Number(b.status !== "open") || a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title));
  const open = items.filter((i) => i.status === "open");
  const byKind = new Map<string, number>();
  for (const i of open) byKind.set(i.kind, (byKind.get(i.kind) ?? 0) + 1);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SlotScout review ${month}</title><style>${CSS}</style></head><body>
<h1>SlotScout review packet, ${month}</h1>
<p>${open.length} open item(s), ${items.length - open.length} decided. Nothing here counts on the map until a person approves it; looser changes keep the older, stricter version live. Claude Code prepares this packet and never approves (CLAUDE.md).</p>
<nav>${[...byKind].map(([k, n]) => `<a href="#k-${esc(k)}">${esc(k.replace(/_/g, " "))} (${n})</a>`).join("")}</nav>
${[...new Set(items.map((i) => i.kind))].map((k) => `<h2 id="k-${esc(k)}" style="margin-top:28px">${esc(k.replace(/_/g, " "))}</h2>${items.filter((i) => i.kind === k).map(itemHtml).join("\n")}`).join("\n")}
</body></html>`;
  writeText(join(P.review, month, "index.html"), html);
  const md = [
    `# Review packet ${month}`,
    "",
    `Open the HTML packet for maps and both runs: \`review/${month}/index.html\`. ${open.length} open item(s). Approve with \`make approve ITEM=<id> BY=<initials>\` (people only).`,
    "",
    "| Item | Kind | Change | Title | Why | Status |",
    "| --- | --- | --- | --- | --- | --- |",
    ...items.map((i) => `| \`${i.item_id}\` | ${i.kind} | ${i.change_type} | ${i.title.replace(/\|/g, "/").slice(0, 80)} | ${i.why[0]?.replace(/\|/g, "/").slice(0, 120) ?? ""} | ${i.status} |`),
    "",
  ].join("\n");
  writeText(join(P.review, month, "README.md"), md);
  log("review-packet", `review/${month}/index.html: ${items.length} item(s), ${open.length} open`);
  return { items: items.length, open: open.length };
}
