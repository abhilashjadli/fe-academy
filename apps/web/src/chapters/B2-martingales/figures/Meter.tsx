import { optionalStoppingCheck, type Replay } from "../../../engine/martingale";
import { f2, n0, n2 } from "./table";

/**
 * The meter: the average final chips over all players of the last replay. It is the chapter's one instrument and is on
 * screen in every figure. The needle sits on a −scale…+scale gauge with a faint ±2 s.e. band around it; a reading within
 * three standard errors of zero is "pinned", anything else has "moved" (engine optionalStoppingCheck). Before a replay it reads "—".
 */
export function Meter({ replay, scale = 20, label = "average over all players", unit = "chips", compact, per }: { replay: Replay | null; scale?: number; label?: string; unit?: string; compact?: boolean; per?: string }) {
  const W = 260,
    H = 44;
  const left = 12,
    right = W - 12;
  const x = (v: number) => left + ((Math.max(-scale, Math.min(scale, v)) + scale) / (2 * scale)) * (right - left);
  const check = replay ? optionalStoppingCheck(replay, 3) : null;
  const moved = check ? !check.ok : false;
  const off = replay ? Math.abs(replay.mean) > scale : false;
  const mean = replay?.mean ?? 0;
  const se = replay?.se ?? 0;
  return (
    <div className={"b2-meter " + (moved ? "moved " : replay ? "pinned " : "idle ") + (compact ? "compact" : "")} role="group" aria-label={label}>
      <div className="b2-meter-head">
        <span className="b2-meter-label">{label}</span>
        {replay && <span className={"b2-meter-tag " + (moved ? "moved" : "pinned")}>{moved ? "moved" : "pinned at zero"}</span>}
      </div>
      <svg className="b2-gauge" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <line className="b2-gauge-rail" x1={left} x2={right} y1={26} y2={26} />
        {[-scale, -scale / 2, 0, scale / 2, scale].map((t) => (
          <g key={t}>
            <line className="b2-gauge-tick" x1={x(t)} x2={x(t)} y1={t === 0 ? 14 : 21} y2={t === 0 ? 38 : 31} />
            <text className="b2-gauge-num" x={x(t)} y={H - 2} textAnchor="middle">
              {t > 0 ? "+" + n0(t) : n0(t)}
            </text>
          </g>
        ))}
        {replay && !off && <rect className="b2-gauge-band" x={x(mean - 2 * se)} width={Math.max(2, x(mean + 2 * se) - x(mean - 2 * se))} y={19} height={14} rx={2} />}
        {replay && (
          <g className="b2-needle" transform={`translate(${x(mean)} 26)`}>
            {off ? <path d={mean > 0 ? "M-8 -9 L4 0 L-8 9 Z" : "M8 -9 L-4 0 L8 9 Z"} /> : <path d="M0 -12 L4 0 L0 12 L-4 0 Z" />}
          </g>
        )}
      </svg>
      <div className="b2-meter-read">
        {replay ? (
          <>
            <span className="b2-meter-v">{f2(mean)}</span>
            <span className="b2-meter-u">
              {unit}
              {per ? ` ${per}` : ""} · noise ±{n2(2 * se)}
            </span>
          </>
        ) : (
          <>
            <span className="b2-meter-v">—</span>
            <span className="b2-meter-u">replay to read it</span>
          </>
        )}
      </div>
    </div>
  );
}
