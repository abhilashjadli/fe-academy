import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented } from "../../../ui/controls";
import { HULL, HULL_P, getHull, hullMonths, n2, useNarrow } from "./f1";

/**
 * Figure 3 — Hull Example 18.1 (textbook, labelled): the American put S 50, K 50, r 10 %, σ 40 %, 5 months on Hull's own
 * 21 × 11 S-grid, implicit scheme, as coloured cells (rows S = 100 … 0 top-down as Hull prints, columns 5 → 0 months to expiry).
 * Toggle American / European: the American grid shades the cells where the value equals the payoff and draws the exercise
 * boundary as a staircase; hover a cell for its value to the cent. Inset: the explicit scheme's top-left corner with Hull's
 * negative cells. Live hullGrid (equals key.hull grids). One control; three readouts.
 */

type Mode = "american" | "european";
const K = HULL_P.K;
const months = (i: number) => {
  const m = hullMonths(i);
  return Number.isInteger(Math.round(m * 2) / 2) ? String(Math.round(m)) : m.toFixed(1);
};
const NAME: Record<Mode, string> = { american: "American", european: "European" };
const binds = (v: number, S: number) => K - S > 0 && Math.abs(v - (K - S)) < 1e-9;

interface Cell {
  i: number;
  j: number;
}

/** one grid as cells: colour = value (hot = worth more), text on wide screens; the American grid shaded where exercise binds */
function Cells({ grid, S, cols, rowsJ, american, hover, onHover, negatives, narrow, cw, ch }: { grid: Float64Array[]; S: number[]; cols: number[]; rowsJ: number[]; american: boolean; hover: Cell | null; onHover: (c: Cell | null) => void; negatives?: boolean; narrow: boolean; cw: number; ch: number }) {
  const left = 34;
  const top = 30;
  const W = left + cols.length * cw + 4;
  const H = top + rowsJ.length * ch + 4;
  const vmax = K;
  // the staircase: for each column, the top edge of the highest binding cell
  const stair: string[] = [];
  if (american) {
    let prevY: number | null = null;
    cols.forEach((i, ci) => {
      const top0 = rowsJ.find((j) => binds(grid[i][j], S[j]));
      if (top0 === undefined) return;
      const ry = top + rowsJ.indexOf(top0) * ch;
      const x0 = left + ci * cw;
      const x1 = x0 + cw;
      if (prevY !== null && prevY !== ry) stair.push(`M${x0},${prevY}L${x0},${ry}`);
      stair.push(`M${x0},${ry}L${x1},${ry}`);
      prevY = ry;
    });
  }
  return (
    <svg className="f1-grid" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${american ? "American" : "European"} put values on Hull's grid, ${rowsJ.length} prices by ${cols.length} times${american ? ", the early-exercise region shaded and its boundary drawn as a staircase" : ""}`} onPointerLeave={() => onHover(null)}>
      <text className="f1-grid-head" x={left - 4} y={12} textAnchor="end">
        S
      </text>
      <text className="f1-grid-head" x={left} y={12}>
        months to expiry →
      </text>
      {cols.map((i, ci) => (
        <text key={i} className="f1-grid-head" x={left + ci * cw + cw / 2} y={top - 6} textAnchor="middle">
          {months(i)}
        </text>
      ))}
      {rowsJ.map((j, rj) => (
        <text key={j} className="f1-grid-head" x={left - 4} y={top + rj * ch + ch / 2 + 3.5} textAnchor="end">
          {S[j]}
        </text>
      ))}
      {rowsJ.map((j, rj) =>
        cols.map((i, ci) => {
          const v = grid[i][j];
          const t = Math.sqrt(Math.max(0, Math.min(1, v / vmax)));
          const ex = american && binds(v, S[j]);
          const isNeg = v <= -0.005; // prints as negative at the cent
          const isHover = hover !== null && hover.i === i && hover.j === j;
          const x = left + ci * cw;
          const y = top + rj * ch;
          return (
            <g key={i + ":" + j} onPointerEnter={() => onHover({ i, j })} onPointerDown={() => onHover({ i, j })}>
              <rect x={x} y={y} width={cw} height={ch} fill="var(--surface-raised)" />
              <rect x={x} y={y} width={cw} height={ch} fill={isNeg ? "var(--error)" : "var(--truth)"} opacity={isNeg ? 0.35 : t * 0.85} />
              {ex && <rect x={x} y={y} width={cw} height={ch} fill="var(--approx)" opacity={0.38} />}
              <rect x={x} y={y} width={cw} height={ch} fill="none" stroke={isHover ? "var(--ink)" : "var(--surface-figure)"} strokeWidth={isHover ? 2 : 0.8} />
              {(!narrow || negatives) && (
                <text className={"f1-cell" + (isNeg ? " f1-cell-neg" : t > 0.55 ? " f1-cell-light" : "")} x={x + cw / 2} y={y + ch / 2 + 3.5} textAnchor="middle">
                  {n2(Math.abs(v) < 0.005 ? 0 : v).replace("-", "−")}
                </text>
              )}
            </g>
          );
        }),
      )}
      {american && <path d={stair.join("")} fill="none" stroke="var(--ink)" strokeWidth={2.2} strokeLinejoin="miter" />}
    </svg>
  );
}

export function F3American() {
  const narrow = useNarrow();
  const [mode, setMode] = useState<Mode>("american");
  const [hover, setHover] = useState<Cell | null>(null);
  const [hoverX, setHoverX] = useState<Cell | null>(null);
  const am = getHull("implicit", true);
  const eu = getHull("implicit", false);
  const ex = getHull("explicit", true);
  const g = mode === "american" ? am : eu;
  const S = g.S;
  const cols = g.grid.map((_, i) => i);
  const rowsJ = S.map((_, j) => S.length - 1 - j);
  const c = hover ?? { i: 0, j: Math.round(HULL_P.S0 / (HULL_P.Smax / HULL_P.M)) };
  const cv = g.grid[c.i][c.j];
  const cx = hoverX ?? { i: 0, j: 19 };
  const premium = am.atS0 - eu.atS0;
  const exCols = [0, 1, 2, 3];
  const exRows = [20, 19, 18, 17, 16, 15, 14, 13];
  const B = HULL.book;

  return (
    <Figure
      n="3"
      prompt={
        <>
          Textbook, not the chain: Hull's Example 18.1, an American put on a stock at 50, strike 50, 10 % rate, 40 % volatility, five months, on his 21 × 11 grid. One extra line after each
          step — never let a value fall below what exercising pays. Switch it off and see what it was worth.
        </>
      }
      controls={
        <>
          <Segmented<Mode> label="exercise" options={[{ id: "american", label: "American" }, { id: "european", label: "European" }]} value={mode} onChange={setMode} />
          <Readouts items={[[`${NAME[mode]} at S = ${HULL_P.S0}`, n2(g.atS0)], [`${NAME[mode === "american" ? "european" : "american"]} at S = ${HULL_P.S0}`, n2(mode === "american" ? eu.atS0 : am.atS0)], ["early-exercise premium", n2(premium)]]} />
        </>
      }
      observe={
        <>
          Hull Tables 18.1 and 18.2 reproduced to the cent (key): implicit American {n2(am.atS0)} against European {n2(eu.atS0)}; Black–Scholes gives {n2(HULL.bs_european)}, and Hull's control variate —
          American plus the formula's correction of the European error — {n2(B.control_variate)} (Hull; {n2(HULL.control_variate)} from the unrounded cells, key); the converged American put on a 400 × 3,200 Crank–Nicolson grid is {n2(HULL.converged_american)}. The shaded cells are
          where the value <em>is</em> the payoff; their top edge is the exercise boundary, and it climbs toward the strike as expiry nears. The explicit scheme's corner prints {B.table18_2_top_left.map((v) => n2(v).replace("-", "−")).join(", ")}{" "}
          at S = 95 to 80 and five months (Hull), because for j ≥ {HULL.negative_weight_from_j} (S ≥ {HULL.negative_weight_from_j * (HULL_P.Smax / HULL_P.M)}) the middle weight 1 − σ²j²δt is negative — Figure 1's failure in
          miniature. NSE's index options are European; this is the one figure on the page that is not the real call.
        </>
      }
    >
      <div className="f1-american">
        <div className="f1-american-two">
          <div className="f1-panel">
            <div className="f1-panel-title">
              <strong>Hull Table 18.1 · implicit, {NAME[mode]}</strong>{" "}
              <span>{mode === "american" ? "shaded: exercise binds (value = payoff); the line is the boundary" : "no exercise line: the plain equation"}; hover or tap a cell</span>
            </div>
            <Cells grid={g.grid} S={S} cols={cols} rowsJ={rowsJ} american={mode === "american"} hover={hover} onHover={setHover} narrow={narrow} cw={narrow ? 32 : 56} ch={narrow ? 13 : 16} />
            <div className="f1-rule" role="status">
              <strong>
                S = {S[c.j]}, {months(c.i)} months to expiry
              </strong>
              <span>
                {NAME[mode]} value {n2(cv)} · payoff {n2(Math.max(K - S[c.j], 0))}
                {mode === "american" && binds(cv, S[c.j]) ? " — exercise binds here" : ""}
                {mode === "american" && !binds(cv, S[c.j]) && S[c.j] < K ? " — worth more alive" : ""}
              </span>
            </div>
          </div>
          <div className="f1-panel f1-inset">
            <div className="f1-panel-title">
              <strong>Hull Table 18.2 · explicit, top-left</strong> <span>S 100 → 65, 5 → 3.5 months; red cells are negative</span>
            </div>
            <Cells grid={ex.grid} S={ex.S} cols={exCols} rowsJ={exRows} american={false} hover={hoverX} onHover={setHoverX} negatives narrow={narrow} cw={narrow ? 48 : 56} ch={narrow ? 15 : 16} />
            <div className="f1-rule" role="status">
              <strong>
                S = {ex.S[cx.j]}, {months(cx.i)} months
              </strong>
              <span>
                explicit {n2(ex.grid[cx.i][cx.j]).replace("-", "−")} · implicit {n2(am.grid[cx.i][cx.j])}
                {ex.grid[cx.i][cx.j] < 0 ? " — a negative price for a put" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Figure>
  );
}
