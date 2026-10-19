import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "./Footer";

export function Ranges() {
  useEffect(() => {
    document.title = "Shooting ranges · SlotScout";
  }, []);
  return (
    <>
      <Header />
      <main className="page" id="main">
        <h1>Approved ranges and clubs</h1>
        <p className="lede">
          Restricted and prohibited firearms may only be fired at an approved shooting range. SlotScout gives no guidance on using them anywhere else. Ranges are also the safest choice for new shooters and for sighting in.
        </p>
        <h2>Find a range</h2>
        <ul>
          <li>
            <a href="https://bcwf.bc.ca/" target="_blank" rel="noreferrer">
              BC Wildlife Federation
            </a>{" "}
            and its member clubs run many of the province's ranges.
          </li>
          <li>
            The{" "}
            <a href="https://rcmp.ca/en/firearms" target="_blank" rel="noreferrer">
              RCMP Canadian Firearms Program
            </a>{" "}
            sets the conditions on your Authorization to Transport.
          </li>
        </ul>
        <p className="hint">A reviewed, mapped list of approved ranges is planned. Until then SlotScout links to the organisations that keep those lists.</p>
        <p>
          <Link to="/">Back to the map</Link>
        </p>
        <Footer />
      </main>
    </>
  );
}

export function Terms() {
  useEffect(() => {
    document.title = "Terms and privacy · SlotScout";
  }, []);
  return (
    <>
      <Header />
      <main className="page" id="main">
        <h1>Terms of use and privacy</h1>
        <p className="lede">SlotScout is an information tool. It is not legal advice and not permission to shoot.</p>

        <h2>Using SlotScout</h2>
        <ul>
          <li>You are responsible for following the law, for posted signs and for safe firearm handling. Signs and conditions on site come first.</li>
          <li>SlotScout never says a spot is "legal" or "allowed". Green means no restriction was found in the checks listed, on the date shown.</li>
          <li>Every report shows the dataset release and the date each source was read, so what SlotScout said is provable.</li>
          <li>
            For an official answer, contact <a href="mailto:FrontCounterBC@gov.bc.ca">FrontCounter BC</a> (1-877-855-3222) or the Conservation Officer Service.
          </li>
          <li>SlotScout never encourages entry to private or reserve land without permission.</li>
          <li>Community-reported gates and conditions are never presented as official.</li>
        </ul>

        <h2>Data and licences</h2>
        <p>
          Map data contains information licensed under the Open Government Licence – British Columbia and the Open Government Licence – Canada. Imagery and base maps are provided by their owners under their own terms. Law
          is summarised in plain English; the linked legal text is the authority.
        </p>

        <h2>Privacy</h2>
        <ul>
          <li>No account is needed to check a spot.</li>
          <li>Pins and coordinates are processed in memory and are not logged with IP addresses.</li>
          <li>"Use my location" asks your permission and your location is never stored on our servers.</li>
          <li>Your shooting profile, map settings and trip list are stored only in your browser.</li>
          <li>Problem reports store the spot you reported, your message and any contact you choose to give. Never your IP address.</li>
          <li>We publish only aggregate usage counts (per region per month) and never popular shooting coordinates. We never sell or share location data.</li>
          <li>SlotScout follows BC's Personal Information Protection Act and Canada's PIPEDA.</li>
        </ul>

        <h2>Corrections</h2>
        <p>Use "Report a problem" on any spot report. A possible false green is triaged within 24 hours and the area is set to grey until it is fixed. Land managers and First Nations can use the same form; corrections are logged publicly.</p>
        <Footer />
      </main>
    </>
  );
}

export function NotFound() {
  return (
    <>
      <Header />
      <main className="page" id="main">
        <h1>Page not found</h1>
        <p>
          <Link to="/">Back to the map</Link>
        </p>
      </main>
    </>
  );
}
