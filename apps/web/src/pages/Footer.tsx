import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="footer">
      <p>
        SlotScout · slotscout.ca · Not legal advice. Signs and conditions on site come first. <Link to="/terms">Terms and privacy</Link> ·{" "}
        <Link to="/sources">Sources</Link> · <a href="mailto:hello@slotscout.ca">hello@slotscout.ca</a>
      </p>
      <p>Contains information licensed under the Open Government Licence – British Columbia and the Open Government Licence – Canada.</p>
    </footer>
  );
}
