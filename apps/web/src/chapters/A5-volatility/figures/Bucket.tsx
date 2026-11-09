/**
 * The leaky bucket — the chapter's one metaphor machine. Its water level is today's variance; the drawing is full at
 * BUCKET_CAP %² (the ten-year average cup is about 1 %², the March 2020 peak 24 %², which pours over the brim). A cup above
 * holds the day's square; a hole in the bottom leaks a fixed fraction of the level each day; a thin tap (Figure 4) drips a
 * constant. A dashed line marks the 250-cup average, barely moving.
 */
export const BUCKET_CAP = 6; // %² — full at a volatility of √6 ≈ 2.45 % a day
const CUP_CAP = 36; // a 6 % day fills the cup drawing

export function Bucket({ level, cup, hole, ghost, drip = 0, label }: { level: number; cup: number; hole: number; ghost?: number; drip?: number; label?: string }) {
  const W = 190,
    H = 228;
  const bx0 = 36,
    bx1 = 128,
    by0 = 66,
    by1 = 200; // bucket walls
  const frac = (v: number) => Math.max(0, Math.min(1, v / BUCKET_CAP));
  const yAt = (v: number) => by1 - frac(v) * (by1 - by0);
  const over = level > BUCKET_CAP;
  const lvlY = yAt(level);
  const cf = Math.sqrt(Math.max(0, Math.min(1, cup / CUP_CAP)));
  const cupH = 3 + 26 * cf; // area ∝ the square
  const cupW = 6 + 40 * cf;
  const holeW = 4 + 36 * Math.min(1, hole / 0.3);
  const cx = (bx0 + bx1) / 2;
  const ghostY = ghost !== undefined && Number.isFinite(ghost) ? yAt(ghost) : NaN;
  return (
    <svg className="a5-bucket" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`A bucket filled to ${level.toFixed(2)} squared percent${over ? ", over the brim" : ""}; a cup of ${cup.toFixed(2)} pours in; a hole of ${(100 * hole).toFixed(0)} percent leaks`}>
      {/* the cup, pouring */}
      <text x={cx} y={11} textAnchor="middle" className="a5-bucket-txt">
        cup = today's square
      </text>
      <g className="a5-cup">
        <rect x={cx - cupW / 2} y={46 - cupH} width={cupW} height={cupH} rx={1.5} />
        {cup > 0 && <line x1={cx} x2={cx} y1={48} y2={Math.max(50, Math.min(lvlY, by1) - 2)} className="a5-pour" strokeDasharray="3 3" />}
      </g>
      {/* the drip tap (Figure 4) */}
      {drip > 0 && (
        <g className="a5-tap">
          <line x1={bx1 + 18} x2={bx1 + 18} y1={by0 - 12} y2={by0 + 14} />
          <line x1={bx1 + 18} x2={bx1 - 10} y1={by0 + 14} y2={by0 + 14} />
          <line x1={bx1 - 10} x2={bx1 - 10} y1={by0 + 17} y2={Math.max(by0 + 20, Math.min(lvlY, by1) - 2)} strokeDasharray="1.5 4" />
          <text x={bx1 + 22} y={by0 - 16} textAnchor="end" className="a5-bucket-txt approx">
            drip
          </text>
        </g>
      )}
      {/* water */}
      <rect className={"a5-water " + (over ? "overflow" : "")} x={bx0 + 1} y={lvlY} width={bx1 - bx0 - 2} height={Math.max(0, by1 - lvlY)} />
      {over && (
        <g className="a5-over">
          <path d={`M${bx0 - 1},${by0} q-6,10 -5,22 M${bx1 + 1},${by0} q6,10 5,22`} />
          <text x={cx} y={by0 - 6} textAnchor="middle" className="a5-bucket-txt error">
            over the brim: {level.toFixed(1)} %²
          </text>
        </g>
      )}
      {/* ghost: the 250-cup average */}
      {Number.isFinite(ghostY) && (
        <g className="a5-ghost">
          <line x1={bx0 - 8} x2={bx1 + 8} y1={ghostY} y2={ghostY} strokeDasharray="4 3" />
          <text x={bx0 - 6} y={ghostY - 3} textAnchor="start" className="a5-bucket-txt ghost">
            250-cup average
          </text>
        </g>
      )}
      {/* walls */}
      <path className="a5-wall" d={`M${bx0},${by0} L${bx0},${by1} L${bx1},${by1} L${bx1},${by0}`} />
      <text x={bx0 - 4} y={by0 + 4} textAnchor="end" className="a5-bucket-txt">
        {BUCKET_CAP} %²
      </text>
      <text x={bx0 - 4} y={by1 + 1} textAnchor="end" className="a5-bucket-txt">
        0
      </text>
      {/* hole + leak */}
      <rect className="a5-hole" x={cx - holeW / 2} y={by1 - 1.5} width={holeW} height={3} />
      <g className="a5-leak">
        {[0, 1, 2].map((k) => (
          <line key={k} x1={cx - holeW / 3 + (k * holeW) / 3} x2={cx - holeW / 3 + (k * holeW) / 3 + 1} y1={by1 + 4 + k * 3} y2={by1 + 11 + k * 3} />
        ))}
      </g>
      <text x={cx} y={H - 3} textAnchor="middle" className="a5-bucket-txt">
        hole leaks {(100 * hole).toFixed(0)} % a day
      </text>
      {/* level label */}
      <text x={bx1 + 5} y={Math.min(by1 - 2, Math.max(by0 + 30, lvlY + 4))} className="a5-bucket-txt truth">
        {label ?? "level"}
      </text>
    </svg>
  );
}
