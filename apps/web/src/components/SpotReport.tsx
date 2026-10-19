import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LIGHTS, RULES_BY_ID, compass8, describeProfile, formatDms, toUtm, type CheckResult, type SpotReport as Report } from "@slotscout/engine";
import { shareUrl } from "../lib/state";
import { STATE_GLYPH, STATUS_LABEL, bearingText, dateOnly, dateTime, formatDistance, statusState } from "../lib/format";
import { Compass } from "./Compass";
import { ProblemForm } from "./ProblemForm";

interface Props {
  report: Report;
  /** Release the shared link was made with, when it differs from the current one (PRD 8.6). */
  linkRelease?: string;
  date?: string;
  onSave(): void;
  saved: boolean;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.slice(0, 40);
  }
}

function CheckRow({ c, open, onToggle }: { c: CheckResult; open: boolean; onToggle(): void }) {
  const state = statusState(c.status);
  const def = RULES_BY_ID[c.ruleId] ?? RULES_BY_ID[c.ruleId.split(/[–-]/)[0]!];
  const title = c.ruleId === "W1–W12" ? "Closed Areas Regulation, Schedules 1 to 13" : def?.title ?? c.ruleId;
  const detailId = `d-${c.ruleId}`;
  return (
    <li className={`check v-${state}`} data-open={open}>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={detailId}>
        <span className="glyph" aria-hidden="true">
          {state === "na" ? (c.status === "note" ? "i" : "–") : STATE_GLYPH[state]}
        </span>
        <span>
          <span className="rid">{c.ruleId}</span>
          <span className="title">{title}</span>
          <span className="sr-only">: {STATUS_LABEL[c.status]}.</span>
          <span className="reason">{c.reason}</span>
        </span>
        <span className="chev" aria-hidden="true">
          ›
        </span>
      </button>
      {open && (
        <div className="check-detail" id={detailId}>
          <dl>
            <dt>Status</dt>
            <dd>{STATUS_LABEL[c.status]}</dd>
            <dt>Authority</dt>
            <dd>
              {c.citation}
              {c.sourceUrl && (
                <>
                  {" "}
                  ·{" "}
                  <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                    read the law
                  </a>
                </>
              )}
            </dd>
            {def && (
              <>
                <dt>Rule</dt>
                <dd>
                  {def.summary} <Link to={`/rules/${def.id}`}>Rule page</Link>
                </dd>
              </>
            )}
            <dt>Data date</dt>
            <dd>{c.dataDate ? dateTime(c.dataDate) : "not applicable"}</dd>
            {c.nearestM !== undefined && (
              <>
                <dt>Nearest boundary</dt>
                <dd>
                  {formatDistance(c.nearestM)}
                  {c.nearestBearingDeg !== undefined ? ` to the ${compass8(c.nearestBearingDeg)} (${c.nearestBearingDeg}° true)` : ""}
                </dd>
              </>
            )}
            {c.changesOn && (
              <>
                <dt>{c.changesText ?? "Changes"}</dt>
                <dd>{dateOnly(c.changesOn)}</dd>
              </>
            )}
            {c.moreUrl && (
              <>
                <dt>More</dt>
                <dd>
                  {c.moreUrl.startsWith("/") ? (
                    <Link to={c.moreUrl}>Read more</Link>
                  ) : (
                    <a href={c.moreUrl} target="_blank" rel="noreferrer">
                      {hostOf(c.moreUrl)}
                    </a>
                  )}
                </dd>
              </>
            )}
          </dl>
          {c.notes?.map((n) => (
            <p key={n} style={{ margin: "6px 0 0" }}>
              {n}
            </p>
          ))}
          {c.sourceText && <div className="source-text">{c.sourceText}</div>}
          {c.hits && c.hits.length > 1 && (
            <ul className="findings">
              {c.hits.slice(0, 6).map((h, i) => (
                <li key={i}>
                  {h.inside ? "Here: " : ""}
                  {h.kind}
                  {h.name && h.name !== h.kind ? ` (${h.name})` : ""}
                  {!h.inside ? `, ${formatDistance(h.distanceM)} ${compass8(h.bearingDeg)}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

export function SpotReport({ report, linkRelease, date, onSave, saved }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [showProblem, setShowProblem] = useState(false);
  const [showFrontCounter, setShowFrontCounter] = useState(false);
  const { verdict, point } = report;
  const vClass = `v-${verdict.state}`;
  const counts = report.lightCounts;
  const total = report.lights.length;
  const utm = toUtm(point);
  const coords = `${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}`;
  const link = shareUrl(point, report.profile, report.release.id, date);

  const groups = useMemo(
    () =>
      LIGHTS.map((l) => ({ ...l, checks: report.checks.filter((c) => c.light === l.id), light: report.lights.find((x) => x.id === l.id)! })).filter(
        (g) => g.checks.length,
      ),
    [report],
  );

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const jumpTo = (lightId: string) => {
    const el = document.getElementById(`g-${lightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    const first = report.checks.find((c) => c.light === lightId && c.status !== "pass" && c.status !== "not_applicable") ?? report.checks.find((c) => c.light === lightId);
    if (first) setOpen((s) => new Set(s).add(first.ruleId));
  };

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      window.prompt("Copy this:", text);
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "SlotScout spot report", text: `${verdict.headline}: ${verdict.reason}`, url: link });
        return;
      } catch {
        // fall through to copy
      }
    }
    copy("link", link);
  };

  const fcText = `Hello FrontCounter BC,

I am planning recreational target shooting with a ${describeProfile(report.profile)} at ${coords} (UTM ${utm.zone} ${utm.easting}E ${utm.northing}N).
SlotScout (slotscout.ca, release ${report.release.id}) reported: "${verdict.headline}. ${verdict.reason}"

Could you confirm whether target shooting is permitted at this location, and whether any closures, tenures or orders apply?

Thank you.`;

  const fz = report.fallZone;
  // One line per distinct feature name, nearest first.
  const findings = fz.findings.filter((h, i, all) => all.findIndex((o) => (o.name || o.kind) === (h.name || h.kind)) === i);
  const imageryDate = report.imagery.captureDate
    ? new Date(`${report.imagery.captureDate}T12:00:00Z`).toLocaleDateString("en-CA", { month: "short", year: "numeric", timeZone: "UTC" })
    : null;

  return (
    <article aria-labelledby="verdict-title">
      {linkRelease && linkRelease !== report.release.id && (
        <p className="error-box" style={{ marginBottom: 10 }}>
          This link was made with release {linkRelease}. The answer below uses the current release ({report.release.id}) and may differ.
        </p>
      )}

      <div className={`verdict ${vClass}`} role="status" aria-live="polite">
        <h2 id="verdict-title">
          <span className="glyph" aria-hidden="true">
            {STATE_GLYPH[verdict.state]}
          </span>
          {verdict.headline}
        </h2>
        <p>{verdict.reason}</p>
        {verdict.alsoUnknown.length > 0 && <p className="also">Also cannot confirm: {verdict.alsoUnknown.join(", ")}.</p>}
        <p className="meta">
          {coords} · checked {dateTime(report.checkDate)} · release {report.release.id}
        </p>
      </div>
      <p className="disclaimer">{report.disclaimer}</p>

      <section className="section" aria-labelledby="lights-h">
        <h3 id="lights-h">Green lights</h3>
        <p className="lights-head">
          {counts.green} of {total} green
          {counts.amber ? `, ${counts.amber} amber` : ""}
          {counts.red ? `, ${counts.red} red` : ""}
          {counts.grey ? `, ${counts.grey} cannot confirm` : ""}
        </p>
        <div className="lights">
          {report.lights.map((l) => (
            <button key={l.id} type="button" className={`light v-${l.state}`} onClick={() => jumpTo(l.id)}>
              <span className="glyph" aria-hidden="true">
                {STATE_GLYPH[l.state]}
              </span>
              <span className="lbl">
                {l.label}
                <span className="state">
                  {l.state === "green" ? "Clear" : l.state === "amber" ? "Condition or hazard" : l.state === "red" ? "Not allowed" : "Cannot confirm"}
                  {l.partlyUnknown ? ", part unconfirmed" : ""}
                  {l.informational ? " · info only" : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="fz-h">
        <h3 id="fz-h">Fall zone ({formatDistance(fz.radiusM)})</h3>
        <div className="compass-wrap">
          <div className="compass">
            <Compass fz={fz} />
          </div>
          <div className="compass-text">
            {fz.bestBearingDeg !== null ? (
              <p style={{ margin: 0 }}>
                Suggested throw:
                <br />
                <span className="throw">{bearingText(fz.bestBearingDeg, fz.bestBearingMagneticDeg)}</span>
              </p>
            ) : fz.sectors.every((s) => s.safe) ? (
              <p style={{ margin: 0 }}>Nothing mapped inside the fall zone in any direction.</p>
            ) : (
              <p style={{ margin: 0 }}>No 70° fan is clear. Do not shoot here with this profile.</p>
            )}
            {fz.declinationDeg !== null && <p className="hint" style={{ margin: "6px 0 0" }}>Declination {fz.declinationDeg}° E (WMM 2025).</p>}
            {fz.incomplete && <p className="hint" style={{ margin: "6px 0 0", color: "var(--v-amber-ink)" }}>Some layers could not be read, so the compass may be missing hazards.</p>}
          </div>
        </div>
        {findings.length > 0 && (
          <ul className="findings">
            {findings.slice(0, 6).map((h, i) => (
              <li key={i}>
                {h.inside ? <b>Here: </b> : null}
                {h.name && h.name !== h.kind ? h.name : h.kind}
                {h.inside ? "" : `, ${formatDistance(h.distanceM)} ${compass8(h.bearingDeg)}`}
              </li>
            ))}
            {findings.length > 6 && <li className="hint">and {findings.length - 6} more inside the fall zone</li>}
          </ul>
        )}
        <p className="hint" style={{ marginBottom: 0 }}>
          The fall-zone radius is a planning default for your profile, not a safety guarantee. Change it in your profile.
        </p>
      </section>

      <section className="section" aria-labelledby="checks-h">
        <h3 id="checks-h">Checklist</h3>
        {groups.map((g) => (
          <div key={g.id}>
            <div className={`group-head v-${g.light.state}`} id={`g-${g.id}`}>
              <span className="glyph" aria-hidden="true">
                {STATE_GLYPH[g.light.state]}
              </span>
              {g.label}
            </div>
            <ul className="checks">
              {g.checks.map((c) => (
                <CheckRow key={c.ruleId} c={c} open={open.has(c.ruleId)} onToggle={() => toggle(c.ruleId)} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="section" aria-labelledby="access-h">
        <h3 id="access-h">Access</h3>
        <div className="card">
          <dl className="kv">
            <dt>Nearest road</dt>
            <dd>
              {report.access.nearestPublicRoad
                ? `${report.access.nearestPublicRoad.name} (${report.access.nearestPublicRoad.roadClass}${report.access.nearestPublicRoad.surface ? `, ${report.access.nearestPublicRoad.surface}` : ""}), ${formatDistance(report.access.nearestPublicRoad.distanceM)} ${compass8(report.access.nearestPublicRoad.bearingDeg)}`
                : "None mapped within 2 km"}
            </dd>
            <dt>Resource road</dt>
            <dd>
              {report.access.nearestResourceRoad
                ? `${report.access.nearestResourceRoad.name}, ${formatDistance(report.access.nearestResourceRoad.distanceM)} ${compass8(report.access.nearestResourceRoad.bearingDeg)}${report.access.nearestResourceRoad.holder ? `. Controlled by ${report.access.nearestResourceRoad.holder}` : ""}${report.access.nearestResourceRoad.lifeCycle === "RETIRED" ? " (retired)" : ""}`
                : "None within 2 km"}
            </dd>
            <dt>Vehicle</dt>
            <dd>
              {report.access.vehicle} <span className="hint">({report.access.vehicleReason})</span>
            </dd>
            <dt>Drive time</dt>
            <dd className="hint">Route planning is coming. Check the route yourself.</dd>
          </dl>
          {report.access.notices.map((n, i) => (
            <div key={i} className={`notice ${n.kind === "closed" ? "v-red" : n.kind === "restricted" || n.kind === "deactivated" ? "v-amber" : "v-na"}`}>
              <span className="tag">{n.kind}</span>
              <b>{n.road}</b> {n.date && <span className="hint">({n.date})</span>}
              <div>{n.text}</div>
              <a href={n.url} target="_blank" rel="noreferrer">
                District notice
              </a>
            </div>
          ))}
          {report.access.noticesPageUrl && (
            <p className="hint" style={{ margin: "8px 0 0" }}>
              Road notices from the{" "}
              <a href={report.access.noticesPageUrl} target="_blank" rel="noreferrer">
                district road safety page
              </a>
              , read {dateTime(report.access.noticesFetchedAt)}. Gates are not mapped yet: expect locked gates on permit roads.
            </p>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="img-h">
        <h3 id="img-h">Imagery</h3>
        <div className="card">
          {imageryDate ? (
            <p style={{ margin: 0 }}>
              Imagery: {imageryDate}
              {report.imagery.source ? `, ${report.imagery.source}` : ""}
              {report.imagery.resolutionM ? `, ${report.imagery.resolutionM} m` : ""}.
            </p>
          ) : (
            <p style={{ margin: 0 }}>Imagery date unknown.</p>
          )}
          {report.imagery.notes.map((n) => (
            <p key={n} style={{ margin: "4px 0 0" }}>
              {n}
            </p>
          ))}
          <p className="hint" style={{ margin: "4px 0 0" }}>
            Imagery never changes the verdict. Cutblocks, burns and roads may have changed since it was taken.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="sc-h">
        <h3 id="sc-h">You must still check</h3>
        <ul className="standing">
          {report.standingChecks.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="section no-print" aria-labelledby="act-h">
        <h3 id="act-h">Actions</h3>
        <div className="actions">
          <button className="btn btn-sm" type="button" onClick={() => copy("coords", `${coords}\n${formatDms(point)}\nUTM ${utm.zone} ${utm.easting}E ${utm.northing}N`)}>
            {copied === "coords" ? "Copied" : "Copy coordinates"}
          </button>
          <a className="btn btn-sm" href={`https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lon}`} target="_blank" rel="noreferrer">
            Google Maps
          </a>
          <a className="btn btn-sm" href={`https://maps.apple.com/?ll=${point.lat},${point.lon}&q=SlotScout%20spot`} target="_blank" rel="noreferrer">
            Apple Maps
          </a>
          <button className="btn btn-sm" type="button" onClick={share}>
            {copied === "link" ? "Link copied" : "Share link"}
          </button>
          <button className="btn btn-sm" type="button" onClick={() => window.print()}>
            Download PDF
          </button>
          <button className="btn btn-sm" type="button" onClick={onSave} disabled={saved}>
            {saved ? "Saved to trip" : "Save to trip list"}
          </button>
          <button className="btn btn-sm" type="button" onClick={() => setShowFrontCounter((v) => !v)} aria-expanded={showFrontCounter}>
            Ask FrontCounter BC
          </button>
          <button className="btn btn-sm" type="button" onClick={() => setShowProblem((v) => !v)} aria-expanded={showProblem}>
            Report a problem
          </button>
        </div>
        {showFrontCounter && (
          <div>
            <p className="hint" style={{ margin: "8px 0 0" }}>
              Email <a href="mailto:FrontCounterBC@gov.bc.ca">FrontCounterBC@gov.bc.ca</a> or call 1-877-855-3222. Copy this message:
            </p>
            <div className="copy-block">{fcText}</div>
            <button className="btn btn-sm" type="button" style={{ marginTop: 6 }} onClick={() => copy("fc", fcText)}>
              {copied === "fc" ? "Copied" : "Copy message"}
            </button>
          </div>
        )}
        {showProblem && <ProblemForm report={report} onDone={() => setShowProblem(false)} />}
        <p className="hint" style={{ margin: "8px 0 0" }}>
          {coords} · {formatDms(point)} · UTM {utm.zone} {utm.easting}E {utm.northing}N
        </p>
      </section>

      <section className="section" aria-labelledby="src-h">
        <h3 id="src-h">Sources and data dates</h3>
        <table className="sources-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Read</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {report.sources.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.url.startsWith("/") ? (
                    <Link to={s.url}>{s.name}</Link>
                  ) : (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.name}
                    </a>
                  )}
                </td>
                <td>{s.fetchedAt ? dateTime(s.fetchedAt) : "register"}</td>
                <td>{s.status === "ok" ? (s.fresh ? "fresh" : "stale") : s.status === "register" ? "see coverage" : s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">
          Release {report.release.id}: {report.release.notes} <Link to="/sources">Source register</Link>
        </p>
      </section>
    </article>
  );
}
