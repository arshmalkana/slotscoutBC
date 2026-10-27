/**
 * Sections that list several roads ("within 400 m of the midline of the following roads: (a) Jones Lake
 * Forest Service Road; (b) …"). Code reads the list from the official text; each road is then looked up
 * in the official layers like any other. An entry the code cannot read makes the whole list unreadable,
 * so a section is never drawn from part of its list.
 */
export interface ListedRoad {
  /** The entry as the text writes it (its quote). */
  text: string;
  name: string;
  /** Limits that are junctions with other named roads, which the builder can place. */
  from: string | null;
  to: string | null;
  /** Limits the code cannot place ("to the crossing of an unnamed creek approximately 3 km …"). */
  partial: string | null;
  spurs: boolean;
}

const FSR = /\b(forest service road|fsr)\b/i;
const JUNCTION = /^(.+?) (?:from (?:the|its) junction with (?:the )?(.+?) to (?:the|its) junction with (?:the )?(.+)|between (?:the|its) junction with (?:the )?(.+?) and (?:(?:the|its) junction with )?(?:the )?(?!its terminus)(.+))$/i;

export function isForestRoad(name: string): boolean {
  return FSR.test(name);
}

export function parseRoadList(text: string): ListedRoad[] | null {
  const flat = text.replace(/\s+/g, " ");
  const m = flat.match(/(?:the )?following (?:described )?(?:[A-Z][\w'’.-]* ){0,3}(roads|highways and roads|highways)([^:]*):(.*)$/i);
  if (!m) return null;
  const spursAll = /including any spur roads/i.test(m[2]!);
  let body = m[3]!.split(/\[(?:am|en)\./)[0]!.replace(/\([a-z0-9]+\) ?to \([a-z0-9]+\) ?repealed\.? ?(\[[^\]]*\])?/gi, " ");
  // A lettered list ends where the next numbered subsection starts.
  if (/^\s*\([a-z]\)/i.test(body)) body = body.split(/\(\d{1,2}\)/)[0]!;
  const entries = body.split(/\((?:[a-z]|\d{1,2})\) ?/).map((s) => s.trim()).filter(Boolean);
  const out: ListedRoad[] = [];
  for (const raw of entries) {
    if (/^repealed/i.test(raw)) continue;
    let e = raw.replace(/[;.,]? ?(and|or)?$/i, "").replace(/[;.]$/, "").trim();
    const spurs = spursAll || /including any spur roads/i.test(e);
    e = e.replace(/,? ?including any spur roads/i, "").trim();
    if (!e || e.length > 400) return null;
    const j = e.match(JUNCTION);
    if (j) {
      out.push({ text: raw, name: j[1]!.trim(), from: (j[2] ?? j[4])!.trim(), to: (j[3] ?? j[5])!.trim(), partial: null, spurs });
      continue;
    }
    const k = e.match(/^(.+?) (from|between|to|west of|east of|north of|south of) (.+)$/i);
    out.push({ text: raw, name: (k ? k[1]! : e).trim(), from: null, to: null, partial: k ? `${k[2]} ${k[3]}` : null, spurs });
  }
  if (!out.length || out.some((r) => !/\b(road|rd|highway|hwy|fsr|trail|drive|avenue|street)\b/i.test(r.name))) return null;
  return out;
}
