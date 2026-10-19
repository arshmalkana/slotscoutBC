/**
 * robots.txt reading (main spec 10.3; Addendum A 6.4). Groups are matched by the most specific
 * user-agent token, then the longest matching Allow/Disallow path wins (RFC 9309).
 */
export interface RobotsRules {
  groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[];
}

export function parseRobots(text: string): RobotsRules {
  const groups: RobotsRules["groups"] = [];
  let current: RobotsRules["groups"][number] | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const value = m[2]!.trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === "allow" || key === "disallow") {
      if (key === "disallow" && value === "") continue;
      current.rules.push({ allow: key === "allow", path: value });
    }
  }
  return { groups };
}

function pathMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern).split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`).test(path);
}

/** True when the robots rules allow this user agent (its product token) to fetch the path. */
export function robotsAllows(rules: RobotsRules, userAgent: string, path: string): boolean {
  const token = userAgent.split("/")[0]!.toLowerCase();
  const named = rules.groups.filter((g) => g.agents.some((a) => a !== "*" && token.includes(a)));
  const group = named.length ? named : rules.groups.filter((g) => g.agents.includes("*"));
  const all = group.flatMap((g) => g.rules).filter((r) => pathMatches(r.path, path));
  if (!all.length) return true;
  all.sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return all[0]!.allow;
}
