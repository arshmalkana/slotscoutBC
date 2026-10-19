import { useState } from "react";
import type { SpotReport } from "@slotscout/engine";
import { sendProblemReport } from "../lib/api";

const CATEGORIES = [
  { id: "false_green", label: "Shown as allowed, but it is not (urgent)" },
  { id: "false_red", label: "Shown as not allowed, but it is" },
  { id: "boundary", label: "A boundary or closed area is wrong" },
  { id: "access", label: "Gate, closure or road condition" },
  { id: "land_manager", label: "I manage this land and it is shown wrongly" },
  { id: "other", label: "Something else" },
];

/** Report a problem (PRD 1.4, 1.5.5). A possible false green is triaged within 24 hours. */
export function ProblemForm({ report, onDone }: { report: SpotReport; onDone(): void }) {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const res = await sendProblemReport({
        category,
        message,
        contact: contact || undefined,
        lat: report.point.lat,
        lon: report.point.lon,
        verdict: report.verdict.state,
      });
      if (res.ok) setState("sent");
      else {
        setError(res.error ?? "Could not send.");
        setState("error");
      }
    } catch {
      setError("Could not send. Check your connection.");
      setState("error");
    }
  };

  if (state === "sent")
    return (
      <div className="card" style={{ marginTop: 8 }}>
        <p style={{ margin: 0 }}>Thank you. A possible false green is reviewed within 24 hours, and the area is set to grey until it is fixed.</p>
        <button className="btn btn-sm" type="button" style={{ marginTop: 6 }} onClick={onDone}>
          Close
        </button>
      </div>
    );

  return (
    <form className="card" style={{ marginTop: 8 }} onSubmit={submit}>
      <label className="field">
        <span>What is wrong?</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="" disabled>
            Choose one
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Details</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={5} placeholder="What did you see on the ground or in the law?" />
      </label>
      <label className="field">
        <span>Email or phone (optional)</span>
        <input type="email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Only used to follow up on this report" />
      </label>
      <p className="hint">We send the spot you checked and your message. We never store your own location or IP address.</p>
      {state === "error" && <p className="error-box">{error}</p>}
      <div className="actions">
        <button className="btn btn-primary btn-sm" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send report"}
        </button>
        <button className="btn btn-sm" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
