import type { FallZoneSummary } from "@slotscout/engine";

const R = 80;
const C = 90;

function polar(deg: number, r: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

function wedge(from: number, to: number, r0: number, r1: number): string {
  const [x0, y0] = polar(from, r1);
  const [x1, y1] = polar(to, r1);
  const [x2, y2] = polar(to, r0);
  const [x3, y3] = polar(from, r0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3} Z`;
}

/** Fall-zone compass (PRD 8.3 step 5): 36 sectors, safe ones in blue, the suggested throw as an arrow. */
export function Compass({ fz }: { fz: FallZoneSummary }) {
  const best = fz.bestBearingDeg;
  const safeCount = fz.sectors.filter((s) => s.safe).length;
  return (
    <svg viewBox="0 0 180 180" role="img" aria-label={`Fall-zone compass: ${safeCount} of 36 directions clear${best !== null ? `, suggested throw ${best} degrees true` : ""}.`}>
      <defs>
        <pattern id="blocked" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="#d9dee5" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="#5f6b7a" strokeWidth="1.6" />
        </pattern>
      </defs>
      {fz.sectors.map((s) => (
        <path key={s.centreDeg} d={wedge(s.centreDeg - 5, s.centreDeg + 5, 34, R)} fill={s.safe ? "#8cc8ff" : "url(#blocked)"} stroke="var(--surface)" strokeWidth="1">
          <title>{`${s.centreDeg}°: ${s.safe ? "clear 70° fan" : "something in this fan"}`}</title>
        </path>
      ))}
      <circle cx={C} cy={C} r={33} fill="var(--surface)" stroke="var(--line-2)" />
      {(["N", "E", "S", "W"] as const).map((d, i) => {
        const [x, y] = polar(i * 90, R + 8);
        return (
          <text key={d} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="var(--ink-2)">
            {d}
          </text>
        );
      })}
      {best !== null ? (
        <g>
          <line x1={C} y1={C} x2={polar(best, R - 4)[0]} y2={polar(best, R - 4)[1]} stroke="#0e2a47" strokeWidth="4" strokeLinecap="round" />
          <circle cx={polar(best, R - 4)[0]} cy={polar(best, R - 4)[1]} r="5" fill="#0e2a47" />
          <text x={C} y={C} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="800" fill="var(--ink)">
            {best}°
          </text>
        </g>
      ) : (
        <text x={C} y={C} textAnchor="middle" dominantBaseline="central" fontSize="11" fill="var(--ink-2)">
          {safeCount === 36 ? "all clear" : "no clear fan"}
        </text>
      )}
    </svg>
  );
}
