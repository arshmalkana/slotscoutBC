import { useEffect, useState } from "react";
import { ACTIVITIES, DEFAULT_FALL_ZONE_M, FIREARM_CLASSES, FIREARM_TYPES, MAX_FALL_ZONE_M, MIN_FALL_ZONE_M, type Profile } from "@slotscout/engine";
import { formatDistance } from "../lib/format";

const WHY: Record<string, string> = {
  class: "Restricted and prohibited firearms may only be fired at an approved range.",
  type: "Some areas are shot-only, ban rifles, or need non-toxic shot. The type also sets your fall zone.",
  activity: "SlotScout checks target shooting by default. Hunting exemptions show as notes, never as green.",
};

/** The three profile questions (PRD 2.1). Saved on this device only. */
export function ProfileEditor({ profile, onChange }: { profile: Profile; onChange(p: Profile): void }) {
  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch });
  const [fzText, setFzText] = useState(String(profile.fallZoneM));
  useEffect(() => setFzText(String(profile.fallZoneM)), [profile.fallZoneM]);
  const commitFz = () => {
    const v = Number(fzText);
    if (!Number.isFinite(v) || fzText.trim() === "") return setFzText(String(profile.fallZoneM));
    const clamped = Math.max(MIN_FALL_ZONE_M, Math.min(MAX_FALL_ZONE_M, Math.round(v)));
    setFzText(String(clamped));
    if (clamped !== profile.fallZoneM) set({ fallZoneM: clamped });
  };
  const isDefaultFz = profile.fallZoneM === DEFAULT_FALL_ZONE_M[profile.firearmType];
  return (
    <form onSubmit={(e) => e.preventDefault()} aria-label="Shooting profile">
      <fieldset>
        <legend className="field">
          <span>Firearm class</span>
        </legend>
        <div className="choice-row">
          {FIREARM_CLASSES.map((c) => (
            <label key={c.id} className="choice">
              <input type="radio" name="class" checked={profile.firearmClass === c.id} onChange={() => set({ firearmClass: c.id })} />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
        <p className="hint">{WHY.class}</p>
      </fieldset>
      <fieldset>
        <legend className="field">
          <span>Firearm and ammunition</span>
        </legend>
        <div className="choice-row">
          {FIREARM_TYPES.map((t) => (
            <label key={t.id} className="choice">
              <input
                type="radio"
                name="type"
                checked={profile.firearmType === t.id}
                onChange={() => set({ firearmType: t.id, fallZoneM: isDefaultFz ? DEFAULT_FALL_ZONE_M[t.id] : profile.fallZoneM })}
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
        <p className="hint">{WHY.type}</p>
      </fieldset>
      <fieldset>
        <legend className="field">
          <span>Activity</span>
        </legend>
        <div className="choice-row">
          {ACTIVITIES.map((a) => (
            <label key={a.id} className="choice">
              <input type="radio" name="activity" checked={profile.activity === a.id} onChange={() => set({ activity: a.id })} />
              <span>{a.label}</span>
            </label>
          ))}
        </div>
        <p className="hint">{WHY.activity}</p>
      </fieldset>
      <label className="field">
        <span>Fall-zone radius (metres)</span>
        <input
          type="number"
          min={MIN_FALL_ZONE_M}
          max={MAX_FALL_ZONE_M}
          step={50}
          value={fzText}
          onChange={(e) => setFzText(e.target.value)}
          onBlur={commitFz}
          onKeyDown={(e) => e.key === "Enter" && commitFz()}
        />
        <small>
          {isDefaultFz ? "Planning default" : "Your own value"} for {FIREARM_TYPES.find((t) => t.id === profile.firearmType)?.label.toLowerCase()}:{" "}
          {formatDistance(DEFAULT_FALL_ZONE_M[profile.firearmType])}. Defaults: shot 250 m, slug 900 m, .22 LR 1.5 km, centrefire 4 km.
          {!isDefaultFz && (
            <>
              {" "}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ fallZoneM: DEFAULT_FALL_ZONE_M[profile.firearmType] })}>
                Reset
              </button>
            </>
          )}
        </small>
      </label>
    </form>
  );
}
