import { useEffect, useMemo, useState } from "react";
import { Header } from "../components/Header";
import { fetchCoverage, fetchSources, type CoverageResponse, type RegisterSource } from "../lib/api";
import { dateTime } from "../lib/format";
import { Footer } from "./Footer";

function limit(h: number): string {
  return h >= 48 ? `${Math.round(h / 24)} days` : `${h} hours`;
}

export function Sources() {
  const [sources, setSources] = useState<RegisterSource[] | null>(null);
  const [cov, setCov] = useState<CoverageResponse | null>(null);
  const [filter, setFilter] = useState("");
  const [err, setErr] = useState(false);
  useEffect(() => {
    document.title = "Source register · SlotScout";
    fetchSources()
      .then((r) => setSources(r.sources))
      .catch(() => setErr(true));
    fetchCoverage()
      .then(setCov)
      .catch(() => setErr(true));
  }, []);
  const bylaws = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return (cov?.bylaws ?? []).filter((b) => !f || b.name.toLowerCase().includes(f) || (b.regionalDistrict ?? "").toLowerCase().includes(f));
  }, [cov, filter]);

  return (
    <>
      <Header />
      <main className="page" id="main">
        <h1>Source register</h1>
        <p className="lede">Every source has an owner, a licence, a refresh schedule and a freshness limit. When a source is older than its limit, the checks that use it turn grey.</p>
        {err && <p className="error-box">Some register data could not be loaded.</p>}

        <h2>Data sources</h2>
        {!sources ? (
          <p className="hint">Loading…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Access and licence</th>
                  <th>Refresh</th>
                  <th>Rules</th>
                  <th>Last read here</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.url.startsWith("/") ? (
                        <b>{s.name}</b>
                      ) : (
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.name}
                        </a>
                      )}
                      <div className="hint">
                        {s.owner} · <code>{s.layer}</code>
                      </div>
                    </td>
                    <td>
                      {s.access.toUpperCase()}. {s.licence}
                      <div className="hint">{s.robots}</div>
                    </td>
                    <td>
                      {s.cadence}
                      <div className="hint">Grey after {limit(s.freshnessHours)}</div>
                    </td>
                    <td>{s.rules.join(", ")}</td>
                    <td>
                      {s.live?.lastOk ? dateTime(s.live.lastOk) : "—"}
                      {s.live?.failures ? <div className="hint">{s.live.failures} recent failures</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 id="closed-areas">Wildlife Act closed areas</h2>
        {cov && (
          <>
            <p>
              Closed Areas Regulation (B.C. Reg. 76/84), consolidation current to {cov.consolidation.currentTo}, last amended {cov.consolidation.lastAmended} ({cov.consolidation.amendingRegulation}). BC Laws does not allow
              automated crawling, so the consolidation is downloaded by a person each month until written permission or an official bulk service is in place.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Status</th>
                  <th>Re-confirmed</th>
                </tr>
              </thead>
              <tbody>
                {cov.wildlife.map((r) => (
                  <tr key={r.region}>
                    <td>
                      {r.region} {r.name}
                    </td>
                    <td>{r.status.replace("_", " ")}</td>
                    <td>{r.confirmedOn ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <h2 id="bylaws">Local government bylaw register</h2>
        <p>One row per municipality, electoral area and Islands Trust local trust area. Every jurisdiction shows grey, with a link to its bylaw, until the bylaw is digitised and reviewed.</p>
        <label className="field" style={{ maxWidth: 360 }}>
          <span>Filter</span>
          <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Name or regional district" />
        </label>
        {cov && (
          <table>
            <thead>
              <tr>
                <th>Jurisdiction</th>
                <th>Regional district</th>
                <th>Bylaw</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bylaws.map((b) => (
                <tr key={b.key}>
                  <td>{b.name}</td>
                  <td>{b.regionalDistrict ?? ""}</td>
                  <td>
                    {b.bylaw ? (
                      b.bylaw.url ? (
                        <a href={b.bylaw.url} target="_blank" rel="noreferrer">
                          {b.bylaw.title} {b.bylaw.number}
                        </a>
                      ) : (
                        `${b.bylaw.title ?? ""} ${b.bylaw.number ?? ""}`
                      )
                    ) : (
                      <span className="hint">not yet found</span>
                    )}
                  </td>
                  <td>{b.status.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Footer />
      </main>
    </>
  );
}
