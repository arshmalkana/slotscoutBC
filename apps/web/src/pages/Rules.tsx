import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RULES, RULES_BY_ID, type RuleDefinition } from "@slotscout/engine";
import { Header } from "../components/Header";
import { fetchRule, type RegisterSource } from "../lib/api";
import { Footer } from "./Footer";

const GROUPS: { id: RuleDefinition["group"]; label: string }[] = [
  { id: "federal", label: "Federal law" },
  { id: "wildlife", label: "Wildlife Act: Closed Areas Regulation (B.C. Reg. 76/84)" },
  { id: "provincial", label: "Other provincial land rules" },
  { id: "local", label: "Local government" },
  { id: "indigenous", label: "Indigenous lands" },
  { id: "ownership", label: "Ownership" },
  { id: "safety", label: "Safety and context (not law, always shown)" },
];

export function Rules() {
  useEffect(() => {
    document.title = "Rule catalogue · SlotScout";
  }, []);
  return (
    <>
      <Header />
      <main className="page" id="main">
        <h1>Rule catalogue</h1>
        <p className="lede">Every rule SlotScout checks, its legal authority and its effect on the verdict. Citations marked "pending review" are being confirmed by the project's legal reviewer.</p>
        <p>
          Effects: <b>R</b> red (prohibited or not public land), <b>A</b> amber (allowed only under a condition, or a hazard), <b>G?</b> grey (data missing or stale), <b>N</b> note only.
        </p>
        {GROUPS.map((g) => (
          <section key={g.id}>
            <h2>{g.label}</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Rule</th>
                  <th>Authority</th>
                  <th>Effect</th>
                </tr>
              </thead>
              <tbody>
                {RULES.filter((r) => r.group === g.id).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/rules/${r.id}`}>{r.id}</Link>
                    </td>
                    <td>{r.title}</td>
                    <td>
                      {r.authority}
                      {r.verify ? " (pending review)" : ""}
                    </td>
                    <td>{r.effectText}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
        <Footer />
      </main>
    </>
  );
}

export function RuleDetail() {
  const { id = "" } = useParams();
  const rule = RULES_BY_ID[id.toUpperCase()];
  const [extra, setExtra] = useState<{ sources: RegisterSource[]; digitisedCount: number; mapLayers: string[] } | null>(null);
  useEffect(() => {
    if (!rule) return;
    document.title = `${rule.id}: ${rule.title} · SlotScout`;
    fetchRule(rule.id)
      .then((r) => setExtra({ sources: r.sources, digitisedCount: r.digitised.features.length, mapLayers: r.mapLayers }))
      .catch(() => setExtra(null));
  }, [rule]);
  if (!rule)
    return (
      <>
        <Header />
        <main className="page" id="main">
          <h1>Rule not found</h1>
          <p>
            <Link to="/rules">See all rules</Link>
          </p>
        </main>
      </>
    );
  return (
    <>
      <Header />
      <main className="page" id="main">
        <p>
          <Link to="/rules">← All rules</Link>
        </p>
        <h1>
          {rule.id}: {rule.title}
        </h1>
        <p className="lede">{rule.summary}</p>
        <table>
          <tbody>
            <tr>
              <th>Authority</th>
              <td>
                {rule.authority}
                {rule.verify ? " (citation pending written confirmation by the legal reviewer)" : ""}
                {rule.citationUrl && (
                  <>
                    {" "}
                    ·{" "}
                    <a href={rule.citationUrl} target="_blank" rel="noreferrer">
                      Read the law
                    </a>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <th>Effect</th>
              <td>{rule.effectText}</td>
            </tr>
            <tr>
              <th>Map-based</th>
              <td>{rule.spatial === "yes" ? "Yes" : rule.spatial === "partly" ? "Partly" : "No: depends on your profile"}</td>
            </tr>
            {rule.group === "wildlife" && (
              <tr>
                <th>Digitised areas</th>
                <td>{extra ? `${extra.digitisedCount} reviewed areas published` : "…"}</td>
              </tr>
            )}
          </tbody>
        </table>
        {extra && extra.sources.length > 0 && (
          <>
            <h2>Data sources</h2>
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Owner</th>
                  <th>Refresh</th>
                  <th>Turns grey after</th>
                </tr>
              </thead>
              <tbody>
                {extra.sources.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.name}
                      </a>
                    </td>
                    <td>{s.owner}</td>
                    <td>{s.cadence}</td>
                    <td>{s.freshnessHours >= 48 ? `${Math.round(s.freshnessHours / 24)} days` : `${s.freshnessHours} hours`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <h2>Known issues</h2>
        <p>
          Report anything wrong from any spot report with <b>Report a problem</b>. Corrections are logged publicly in the change log.
        </p>
        <Footer />
      </main>
    </>
  );
}
