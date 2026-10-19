/** Effect each Closed Areas schedule carries (main spec 3.2, catalogue W1-W12). */
export const EFFECT_BY_RULE: Record<string, string> = {
  W1: "no_shooting",
  W2: "no_shooting_seasonal",
  W3: "no_shooting",
  W4: "no_shooting_seasonal",
  W5: "no_shooting",
  W6: "no_shooting_hunting_exempt",
  W7: "no_shooting_seasonal",
  W8: "no_hunting",
  W9: "shot_only",
  W10: "shot_only_seasonal",
  W11: "no_rifle",
  W12: "non_toxic",
};
