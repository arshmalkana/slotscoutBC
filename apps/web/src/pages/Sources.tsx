import { useEffect, useMemo, useState } from "react";
import { Header } from "../components/Header";
import { fetchCoverage, fetchPipelineStatus, fetchSources, type CoverageResponse, type PipelineStatus, type RegisterSource } from "../lib/api";
import { dateTime } from "../lib/format";
import { Footer } from "./Footer";

function limit(h: number): string {
  return h >= 48 ? `${Math.round(h / 24)} days` : `${h} hours`;
}

export function Sources() {
  const [sources, setSources] = useState<RegisterSource[] | null>(null);
  const [cov, setCov] = useState<CoverageResponse | null>(null);
  const [pipe, setPipe] = useState<PipelineStatus | null | undefined>(undefined);
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
    fetchPipelineStatus()
      .then(setPipe)
      .catch(() => setPipe(null));
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

        <h2 id="monthly-update">Monthly update</h2>
        {pipe === undefined ? (
          <p className="hint">Loading…</p>
        ) : pipe === null ? (
          <p className="hint">The monthly update has not run on this server yet.</p>
        ) : (
          <MonthlyUpdate s={pipe} />
        )}

        <h2 id="closed-areas">Wildlife Act closed areas</h2>
        {cov && (
          <>
            <p>
              Closed Areas Regulation (B.C. Reg. 76/84), consolidation current to {cov.consolidation.currentTo}, last amended {cov.consolidation.lastAmended} ({cov.consolidation.amendingRegulation}). BC Laws does not allow
              automated crawling, so a person saves the consolidation each month until the King's Printer confirms in writing that SlotScout may call the official BC Laws API on a schedule.
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
        <p>
          One row per municipality, electoral area and Islands Trust local trust area. Every jurisdiction shows grey, with a link to its bylaw, until the bylaw is digitised and reviewed. The Province counts 161 municipalities,
          158 electoral areas and 13 local trust areas; the official boundary map this register is built from currently has 160 municipalities and 159 electoral areas, and a person is checking which one differs.
        </p>
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

function MonthlyUpdate({ s }: { s: PipelineStatus }) {
  const sources = Object.entries(s.pull?.sources ?? {});
  const bad = sources.filter(([, v]) => v.status !== "ok" && v.status !== "skipped");
  return (
    <>
      <p>
        Month {s.month} (updated {dateTime(s.updatedAt)}). Every source is pulled, split into sections, clauses and notices, and compared with last month; only changed text is read again.{" "}
        {s.changes.comparedWith ? `Since ${s.changes.comparedWith}: ${s.changes.new} new, ${s.changes.changed} changed and ${s.changes.removed} removed units.` : `This is the first month: ${s.changes.new} units form the baseline.`}
      </p>
      <ul>
        <li>
          {s.pull?.layersMatching ?? 0} of {s.pull?.layers ?? 0} GIS layers pulled province-wide with counts matching the server.
        </li>
        <li>
          Rule shapes: {s.rules.approved} approved by a person, {s.rules.candidates} waiting for review (their areas show grey).
        </li>
        <li>
          {s.review.openAllMonths} item(s) waiting for a person{s.review.looserOpen ? `, including ${s.review.looserOpen} looser change(s): the older, stricter answer stays on the map until then` : ""}.
        </li>
        <li>
          AI reading: {s.autopublish.configured && s.autopublish.goldPasses ? "stricter changes publish at once and a person confirms within 24 hours" : "pre-fills a person's work only; nothing it reads counts until a person approves it"} (test set:{" "}
          {s.autopublish.goldItems ? `${s.autopublish.goldItems} items, ${s.autopublish.goldPasses ? "passing" : "not passing yet"}` : "not built yet"}).
        </li>
        <li>{s.tests ? (s.tests.regressionPassed ? "Regression tests passed with no false greens." : "Regression tests did not pass; nothing new is released until they do.") : "Regression tests have not run this month."}</li>
        <li>{s.release ? (s.release.publishable ? `Release ${s.release.id} is published.` : `Release candidate ${s.release.id} waits for: ${s.release.missing.join("; ")}.`) : "No release built this month yet."}</li>
      </ul>
      {!!s.progress?.length && (
        <>
          <h3>Progress this month</h3>
          <table className="progress-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Work</th>
                <th>Done</th>
                <th>Left</th>
                <th aria-label="Share done"></th>
              </tr>
            </thead>
            <tbody>
              {s.progress.map((p) => (
                <tr key={`${p.step}:${p.part}`}>
                  <td>{p.step}</td>
                  <td>{p.part}</td>
                  <td>
                    {p.done.toLocaleString("en-CA")} of {p.total.toLocaleString("en-CA")}
                  </td>
                  <td>{p.left ? p.left.toLocaleString("en-CA") : "none"}</td>
                  <td>
                    <progress max={100} value={p.percent} aria-label={`${p.percent}% done`} /> {p.percent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {bad.length > 0 && (
        <>
          <h3>Sources needing attention</h3>
          <ul>
            {bad.map(([k, v]) => (
              <li key={k}>
                <b>{k}</b>: {v.status.replace(/_/g, " ")}. {v.detail}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
