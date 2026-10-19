import type { Activity, FirearmClass, FirearmType, Profile } from "./types.js";

export const FIREARM_CLASSES: { id: FirearmClass; label: string }[] = [
  { id: "non_restricted", label: "Non-restricted long gun" },
  { id: "restricted", label: "Restricted" },
  { id: "prohibited", label: "Prohibited" },
];

export const FIREARM_TYPES: { id: FirearmType; label: string; shot: boolean; rifle: boolean }[] = [
  { id: "shotgun_shot", label: "Shotgun with shot", shot: true, rifle: false },
  { id: "shotgun_slug", label: "Shotgun with slug", shot: false, rifle: false },
  { id: "rimfire", label: "Rimfire rifle", shot: false, rifle: true },
  { id: "centrefire", label: "Centrefire rifle", shot: false, rifle: true },
  { id: "muzzleloader", label: "Muzzleloader", shot: false, rifle: true },
  { id: "airgun", label: "Air gun", shot: false, rifle: true },
];

export const ACTIVITIES: { id: Activity; label: string }[] = [
  { id: "target", label: "Target or clay shooting" },
  { id: "hunting", label: "Lawful hunting" },
];

/**
 * Planning defaults for the fall-zone radius (PRD 2.1). The PRD fixes the first four.
 * Muzzleloader and air gun values are conservative project defaults and are labelled as such.
 */
export const DEFAULT_FALL_ZONE_M: Record<FirearmType, number> = {
  shotgun_shot: 250,
  shotgun_slug: 900,
  rimfire: 1500,
  centrefire: 4000,
  muzzleloader: 2500,
  airgun: 800,
};

export const MAX_FALL_ZONE_M = 6000;
export const MIN_FALL_ZONE_M = 50;

export const DEFAULT_PROFILE: Profile = {
  firearmClass: "non_restricted",
  firearmType: "shotgun_shot",
  activity: "target",
  fallZoneM: DEFAULT_FALL_ZONE_M.shotgun_shot,
};

export function isShot(profile: Profile): boolean {
  return profile.firearmType === "shotgun_shot";
}

/** Rifle profiles for Schedule 11 ("no rifles"). Muzzleloaders and air rifles are treated as rifles, conservatively. */
export function isRifle(profile: Profile): boolean {
  return FIREARM_TYPES.find((t) => t.id === profile.firearmType)?.rifle ?? true;
}

export function firearmTypeLabel(type: FirearmType): string {
  return FIREARM_TYPES.find((t) => t.id === type)?.label ?? type;
}

export function normaliseProfile(input: Partial<Record<keyof Profile, unknown>>): Profile {
  const firearmClass = FIREARM_CLASSES.some((c) => c.id === input.firearmClass)
    ? (input.firearmClass as FirearmClass)
    : DEFAULT_PROFILE.firearmClass;
  const firearmType = FIREARM_TYPES.some((t) => t.id === input.firearmType)
    ? (input.firearmType as FirearmType)
    : DEFAULT_PROFILE.firearmType;
  const activity = ACTIVITIES.some((a) => a.id === input.activity)
    ? (input.activity as Activity)
    : DEFAULT_PROFILE.activity;
  const raw = Number(input.fallZoneM);
  const fallZoneM = Number.isFinite(raw) && raw > 0
    ? Math.min(MAX_FALL_ZONE_M, Math.max(MIN_FALL_ZONE_M, Math.round(raw)))
    : DEFAULT_FALL_ZONE_M[firearmType];
  return { firearmClass, firearmType, activity, fallZoneM };
}

export function describeProfile(p: Profile): string {
  const cls = FIREARM_CLASSES.find((c) => c.id === p.firearmClass)?.label ?? p.firearmClass;
  const act = ACTIVITIES.find((a) => a.id === p.activity)?.label ?? p.activity;
  return `${cls}, ${firearmTypeLabel(p.firearmType).toLowerCase()}, ${act.toLowerCase()}, ${formatDistance(p.fallZoneM)} fall zone`;
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  const km = m / 1000;
  return `${km < 10 ? km.toFixed(1).replace(/\.0$/, "") : Math.round(km)} km`;
}
