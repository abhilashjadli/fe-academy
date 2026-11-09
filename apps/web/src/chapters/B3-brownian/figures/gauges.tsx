import type { ReactNode } from "react";

/**
 * The dashboard instruments. A Gauge is a drawn dial whose needle and printed decimal are bound to the same value
 * (3b1b's OdometerScene pattern); past its stop the needle pins and a small flag says so. An Odometer is a row of
 * rolling digits. Both are pure SVG and take CSS tokens only.
 */

const FONT = "var(--font-ui)";
type Role = "truth" | "approx" | "error" | "ink";
const stroke = (r: Role) => (r === "ink" ? "var(--ink)" : `var(--${r})`);
const text = (r: Role) => (r === "ink" ? "var(--ink)" : `var(--${r}-text)`);

export function Gauge({
  value,
  min = 0,
  max,
  label,
  sub,
  printed,
  role = "ink",
  mark,
  markLabel,
  width = 150,
  ticks = 4,
}: {
  value: number;
  min?: number;
  max: number;
  label: ReactNode;
  /** a second line under the label (units, "per unit of time") */
  sub?: ReactNode;
  /** the decimal printed under the needle — the same value, formatted by the caller */
  printed: string;
  role?: Role;
  /** a reference mark on the arc (Figure 2: the clock, at 1.0) */
  mark?: number;
  markLabel?: string;
  width?: number;
  ticks?: number;
}) {
  const cx = 70,
    cy = 66,
    R = 52;
  const a0 = Math.PI * 1.1,
    a1 = -Math.PI * 0.1; // 198° sweep, left to right
  const frac = (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min)));
  const ang = (v: number) => a0 + (a1 - a0) * frac(v);
  const pinned = Number.isFinite(value) ? value > max : true;
  const a = ang(Number.isFinite(value) ? value : max);
  const needleEnd = [cx + (R - 8) * Math.cos(a), cy - (R - 8) * Math.sin(a)];
  const arcPt = (t: number, r = R) => [cx + r * Math.cos(t), cy - r * Math.sin(t)];
  const [sx, sy] = arcPt(a0),
    [ex, ey] = arcPt(a1);
  const tickEls = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = min + ((max - min) * i) / ticks;
    const t = ang(v);
    const [x1, y1] = arcPt(t, R),
      [x2, y2] = arcPt(t, R - 7);
    const [lx, ly] = arcPt(t, R + 11);
    return (
      <g key={i}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink-2)" strokeWidth={1.2} />
        <text x={lx} y={ly + 3} textAnchor="middle" fontSize={8.5} fontFamily={FONT} fill="var(--ink-3)">
          {Number.isInteger(v) ? v : v.toFixed(1)}
        </text>
      </g>
    );
  });
  const markEls =
    mark !== undefined
      ? (() => {
          const t = ang(mark);
          const [x1, y1] = arcPt(t, R + 2),
            [x2, y2] = arcPt(t, R - 12);
          const [lx, ly] = arcPt(t, R + 22);
          return (
            <g>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--truth)" strokeWidth={2.4} strokeLinecap="round" />
              {markLabel && (
                <text x={lx} y={ly + 3} textAnchor="middle" fontSize={8} fontFamily={FONT} fill="var(--truth-text)" fontWeight={600}>
                  {markLabel}
                </text>
              )}
            </g>
          );
        })()
      : null;
  return (
    <svg className="b3-gauge" viewBox="0 -14 140 126" width={width} role="img" aria-label={`${typeof label === "string" ? label : "dial"} reading ${printed}`}>
      <path d={`M${sx} ${sy} A${R} ${R} 0 1 1 ${ex} ${ey}`} fill="none" stroke="var(--rule)" strokeWidth={6} strokeLinecap="round" />
      {tickEls}
      {markEls}
      {/* needle */}
      <line x1={cx} y1={cy} x2={needleEnd[0]} y2={needleEnd[1]} stroke={stroke(role)} strokeWidth={2.6} strokeLinecap="round" style={{ transition: "all 450ms ease" }} />
      <circle cx={cx} cy={cy} r={4} fill={stroke(role)} />
      {pinned && (
        <g>
          <rect x={cx - 22} y={cy - R - 26} width={44} height={14} rx={2} fill="var(--surface-raised)" stroke="var(--error)" strokeWidth={1} />
          <text x={cx} y={cy - R - 16} textAnchor="middle" fontSize={8} fontFamily={FONT} fill="var(--error-text)" fontWeight={600} letterSpacing={0.6}>
            PINNED
          </text>
        </g>
      )}
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize={15} fontFamily={FONT} fill={text(role)} fontWeight={600} style={{ fontVariantNumeric: "tabular-nums" }}>
        {printed}
      </text>
      <text x={cx} y={cy + 34} textAnchor="middle" fontSize={9.5} fontFamily={FONT} fill="var(--ink)">
        {label}
      </text>
      {sub && (
        <text x={cx} y={cy + 44} textAnchor="middle" fontSize={8} fontFamily={FONT} fill="var(--ink-3)">
          {sub}
        </text>
      )}
    </svg>
  );
}

/** Rolling digits, like a car's odometer. value ≥ 0; one decimal. */
export function Odometer({ value, label, sub, width = 150, role = "approx" }: { value: number; label: ReactNode; sub?: ReactNode; width?: number; role?: Role }) {
  const s = Math.max(0, value).toFixed(1).padStart(5, "0"); // "003.2" … "203.7"
  const chars = s.split("");
  const boxW = 16,
    gap = 2;
  const total = chars.length * (boxW + gap) - gap;
  const x0 = 70 - total / 2;
  return (
    <svg className="b3-gauge" viewBox="0 -14 140 126" width={width} role="img" aria-label={`${typeof label === "string" ? label : "odometer"} reading ${value.toFixed(1)}`}>
      <rect x={x0 - 6} y={36} width={total + 12} height={34} rx={3} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.3} />
      {chars.map((c, i) => {
        const x = x0 + i * (boxW + gap);
        if (c === ".") return <circle key={i} cx={x + boxW / 2} cy={62} r={1.6} fill="var(--ink)" />;
        return (
          <g key={i}>
            <rect x={x} y={41} width={boxW} height={24} rx={1.5} fill="var(--ink)" opacity={0.9} />
            <text x={x + boxW / 2} y={58} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--surface)" fontWeight={600} style={{ fontVariantNumeric: "tabular-nums" }}>
              {c}
            </text>
          </g>
        );
      })}
      <text x={70} y={86} textAnchor="middle" fontSize={9.5} fontFamily={FONT} fill="var(--ink)">
        {label}
      </text>
      {sub && (
        <text x={70} y={96} textAnchor="middle" fontSize={8} fontFamily={FONT} fill="var(--ink-3)">
          {sub}
        </text>
      )}
      <text x={70} y={26} textAnchor="middle" fontSize={11} fontFamily={FONT} fill={text(role)} fontWeight={600} style={{ fontVariantNumeric: "tabular-nums" }}>
        {value.toFixed(1)}
      </text>
    </svg>
  );
}
