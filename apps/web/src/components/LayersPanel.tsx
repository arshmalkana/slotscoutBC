import { LIGHTS } from "@slotscout/engine";
import type { MapLayerInfo } from "../lib/api";
import type { BaseLayer } from "./MapView";

interface Props {
  base: BaseLayer;
  onBase(b: BaseLayer): void;
  layers: MapLayerInfo[];
  visible: Set<string>;
  onVisible(v: Set<string>): void;
  opacity: number;
  onOpacity(o: number): void;
  zoom: number;
}

const BASES: { id: BaseLayer; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "satellite", label: "Satellite" },
  { id: "topo", label: "Topographic" },
  { id: "light", label: "Plain light" },
  { id: "dark", label: "Plain dark" },
];

/** Filter panel (PRD 2.4, 9.1): every rule layer can be shown, hidden, or shown alone. */
export function LayersPanel({ base, onBase, layers, visible, onVisible, opacity, onOpacity, zoom }: Props) {
  const groups = LIGHTS.map((l) => ({ ...l, layers: layers.filter((x) => x.light === l.id) })).filter((g) => g.layers.length);
  const toggle = (id: string) => {
    const n = new Set(visible);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    onVisible(n);
  };
  return (
    <div>
      <section>
        <h3 className="section" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-3)", margin: "0 0 8px" }}>
          Base map
        </h3>
        <div className="base-grid" role="radiogroup" aria-label="Base map">
          {BASES.map((b) => (
            <label key={b.id} className="choice">
              <input type="radio" name="base" checked={base === b.id} onChange={() => onBase(b.id)} />
              <span style={{ display: "block", textAlign: "center" }}>{b.label}</span>
            </label>
          ))}
        </div>
        <p className="hint">Auto shows the BC topographic map when zoomed out and satellite from zoom 11.</p>
      </section>

      <section className="section">
        <h3>Rule layers</h3>
        <div className="card" style={{ marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            The full verdict colour map arrives with the first reviewed release. Until then these layers show each rule's land, and a pin gives the full answer.
          </p>
        </div>
        <label className="field">
          <span>Layer opacity: {Math.round(opacity * 100)}%</span>
          <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => onOpacity(Number(e.target.value))} />
        </label>
        <div className="actions" style={{ marginBottom: 6 }}>
          <button className="btn btn-sm" type="button" onClick={() => onVisible(new Set(layers.map((l) => l.id)))}>
            Show all
          </button>
          <button className="btn btn-sm" type="button" onClick={() => onVisible(new Set(layers.filter((l) => l.defaultOn).map((l) => l.id)))}>
            Default
          </button>
          <button className="btn btn-sm" type="button" onClick={() => onVisible(new Set())}>
            Hide all
          </button>
        </div>
        {groups.map((g) => (
          <div key={g.id} className="layer-group">
            <h4>{g.label}</h4>
            {g.layers.map((l) => {
              const tooFar = zoom < l.minzoom;
              return (
                <div key={l.id} className="layer-row">
                  <input id={`lay-${l.id}`} type="checkbox" checked={visible.has(l.id)} onChange={() => toggle(l.id)} />
                  <div>
                    <label htmlFor={`lay-${l.id}`}>{l.label}</label>
                    <div className="desc">
                      {l.description}
                      {tooFar && visible.has(l.id) ? ` Zoom in to see it (from zoom ${l.minzoom}).` : ""}
                    </div>
                    <div className="legend">
                      {l.legend.map((e) => (
                        <span key={e.label}>
                          <span className={`swatch ${e.pattern ?? ""}`} style={{ background: e.color, color: e.color }} aria-hidden="true" />
                          {e.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => onVisible(new Set([l.id]))} aria-label={`Show only ${l.label}`}>
                    Only
                  </button>
                </div>
              );
            })}
          </div>
        ))}
        <p className="hint">
          Layer colours never use red, amber, grey or green; those are kept for verdicts. Data: BC Data Catalogue, Open Government Licence – British Columbia.
        </p>
      </section>
    </div>
  );
}
