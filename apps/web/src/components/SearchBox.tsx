import { useEffect, useId, useRef, useState } from "react";
import { parseCoordinates } from "@slotscout/engine";
import { searchPlaces, type SearchResult } from "../lib/api";

interface Props {
  onSelect(r: SearchResult): void;
}

/** One box for coordinates, map links, places, FSR names with km markers and rec sites (PRD 2.2, 2.4). */
export function SearchBox({ onSelect }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const listId = useId();
  const ctrl = useRef<AbortController | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const text = q.trim();
    ctrl.current?.abort();
    if (text.length < 2) {
      setResults([]);
      setMsg(null);
      return;
    }
    // Coordinates are parsed right here, and the interpreted point is shown before checking.
    const parsed = parseCoordinates(text);
    if (parsed.ok) {
      setResults([{ label: `${parsed.point.lat}, ${parsed.point.lon}`, sublabel: `Check this point (${parsed.format})`, kind: "coordinates", lat: parsed.point.lat, lon: parsed.point.lon, note: parsed.note }]);
      setMsg(null);
      setOpen(true);
      return;
    }
    const looksNumeric = /^[\s\d.,°'"NSEWnsew+-]+$/.test(text) || /^https?:/i.test(text);
    if (looksNumeric) {
      setResults([]);
      setMsg(parsed.error);
      setOpen(true);
      return;
    }
    const c = new AbortController();
    ctrl.current = c;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await searchPlaces(text, c.signal);
        setResults(r.results);
        setMsg(r.results.length ? null : r.errors.length ? "Search is partly unavailable right now." : "No matches. Try a place, an FSR name (\"Harrison East FSR km 9\") or coordinates.");
        setActive(0);
        setOpen(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setMsg("Search failed. Try again.");
      } finally {
        setBusy(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      c.abort();
    };
  }, [q]);

  const choose = (r: SearchResult) => {
    onSelect(r);
    setOpen(false);
    setQ(r.kind === "coordinates" ? r.label : r.label);
  };

  return (
    <div className="search" ref={wrap}>
      <span className="search-icon" aria-hidden="true">
        ⌕
      </span>
      <input
        type="search"
        value={q}
        placeholder="Coordinates, map link, place or FSR km"
        aria-label="Search for coordinates, a map link, a place, a forest service road and km, or a recreation site"
        role="combobox"
        aria-expanded={open && (results.length > 0 || !!msg)}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => (results.length || msg) && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && results[active]) {
            e.preventDefault();
            choose(results[active]!);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (results.length > 0 || msg || busy) && (
        <ul className="search-results" id={listId} role="listbox">
          {busy && !results.length && <li className="search-msg">Searching…</li>}
          {msg && <li className="search-msg">{msg}</li>}
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.label}-${i}`}>
              <button type="button" role="option" aria-selected={i === active} onClick={() => choose(r)} onMouseEnter={() => setActive(i)}>
                <span>{r.label}</span>
                <span className="sub">{r.sublabel}</span>
                {r.note && <span className="note">{r.note}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
