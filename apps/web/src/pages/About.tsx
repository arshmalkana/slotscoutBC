import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { fetchCoverage, type CoverageResponse } from "../lib/api";
import { STATE_GLYPH } from "../lib/format";
import { Footer } from "./Footer";

export function About() {
  const [cov, setCov] = useState<CoverageResponse | null>(null);
  useEffect(() => {
    document.title = "How SlotScout works · SlotScout";
    fetchCoverage().then(setCov).catch(() => setCov(null));
  }, []);
  return (
    <>
      <Header />
      <main className="page" id="main">
        <h1>How SlotScout works</h1>
        <p className="lede">
          The rules for where you can shoot in BC are spread across at least eight layers of law and dozens of agencies. No single official map combines them. SlotScout checks them for you, rule by rule, and shows where every answer came from.
        </p>

        <h2>Four answers, never a guess</h2>
        <div className="verdict-legend">
          {(
            [
              ["red", "Not allowed here", "At least one rule prohibits target shooting, or the land is not public."],
              ["amber", "Only if… / Clear here, but…", "Allowed only under a condition (shot only, non-toxic shot, hunting only), or a hazard or closed area is inside your fall zone."],
              ["grey", "Cannot confirm", "A check could not run: data missing or stale, or the local bylaw or closed areas are not digitised yet."],
              ["green", "No restriction found", "Every check passed on fresh data and nothing prohibited is inside the fall zone. Green never says legal."],
            ] as const
          ).map(([s, h, t]) => (
            <div key={s} className={`verdict v-${s}`}>
              <h2>
                <span className="glyph" aria-hidden="true">
                  {STATE_GLYPH[s]}
                </span>
                {h}
              </h2>
              <p style={{ fontSize: 14 }}>{t}</p>
            </div>
          ))}
        </div>
        <p>Any red makes the spot red. With no red, any amber makes it amber. With no red or amber, any grey makes it grey. Only when every rule passes on fresh data is it green.</p>

        <h2>The accuracy promise</h2>
        <ol className="promise">
          <li>
            <b>No false green.</b> Green only shows when every check passed on data inside its freshness limit. Missing, stale, failed or unclear checks turn the result grey or amber.
          </li>
          <li>
            <b>Conservative shapes.</b> Where a boundary is uncertain it is drawn larger than the law, never smaller. Recreation sites get an extra 100 m.
          </li>
          <li>
            <b>Every answer is sourced.</b> Each check shows its law, source link, and the date the data was read.
          </li>
          <li>
            <b>Known gaps are shown.</b> Signs, gates on the day, people nearby and weather appear on every report as a list you must still check.
          </li>
          <li>
            <b>Errors are fixed fast.</b> A reported error that could cause a false green is triaged within 24 hours and the area is set to grey until fixed.
          </li>
        </ol>

        <h2>What is checked</h2>
        <p>
          Federal law (restricted firearms, national parks, federal land, railways, bird sanctuaries), the Wildlife Act Closed Areas Regulation and road allowance rule, provincial parks and ecological reserves, recreation sites and trails, wildfire orders and bans, resource road closures, motor vehicle closures, community watersheds, Crown tenures, municipal, regional district and Islands Trust bylaws, local parks, reserves and treaty lands, private and other titled land, utility lines, buildings, roads, recent burns and active logging. See the <Link to="/rules">rule catalogue</Link>.
        </p>

        <h2>Where the data comes from</h2>
        <p>
          Most layers are read live from the BC Data Catalogue (Open Government Licence – British Columbia). Federal sanctuaries come from Environment and Climate Change Canada. Road closures come from each natural resource district's road safety page. The closed areas and local bylaws exist only as legal text, so each one must be drawn by a person, checked by a second person, and tested before it can count. See the <Link to="/sources">source register</Link>.
        </p>

        <h2>What is ready today</h2>
        {cov ? (
          <>
            <p>
              Closed Areas Regulation consolidated to {cov.consolidation.currentTo} (last amended {cov.consolidation.lastAmended} by {cov.consolidation.amendingRegulation}).
            </p>
            <table>
              <thead>
                <tr>
                  <th>Hunting region</th>
                  <th>Wildlife Act closed areas</th>
                </tr>
              </thead>
              <tbody>
                {cov.wildlife.map((r) => (
                  <tr key={r.region}>
                    <td>
                      Region {r.region}, {r.name}
                    </td>
                    <td>{r.status === "reviewed" ? `Reviewed (confirmed ${r.confirmedOn})` : r.status.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Local bylaws: {Object.entries(cov.bylawCounts)
                .map(([k, v]) => `${v} ${k.replace("_", " ")}`)
                .join(", ")}{" "}
              of {cov.bylaws.length} jurisdictions.
            </p>
            <p>A region goes green-capable only when every rule in it is digitised, reviewed and tested. Until then it shows grey, never a partial answer.</p>
          </>
        ) : (
          <p className="hint">Loading coverage…</p>
        )}

        <h2>What SlotScout is not</h2>
        <ul>
          <li>Not legal advice, and not an official determination. Confirm with FrontCounter BC or the Conservation Officer Service.</li>
          <li>Not a hunting regulations tool. Hunting exemptions are shown as notes, never as green.</li>
          <li>
            No advice on restricted or prohibited firearms outside approved ranges. See <Link to="/ranges">ranges</Link>.
          </li>
        </ul>

        <h2>Privacy</h2>
        <p>No account is needed. Pins and coordinates are processed in memory and never logged with IP addresses. Your profile and trip list stay on your device. We never publish popular shooting spots.</p>
        <Footer />
      </main>
    </>
  );
}
