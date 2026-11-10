import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Toggle } from "../../../ui/controls";
import { pnlGrid } from "../../../engine/greeks2";
import { lakh, n0 } from "../../C4-greeks/figures/row";
import { KEY, ROW, at, f3, pct1 } from "./c5";

/**
 * Figure 2 — the desk grid. Raj's book from C4 (short 100 lots = 6,500 units of the 22,600 call, hedged at Friday's
 * slope 0.506) re-priced on the grid every desk looks at: rows the wobble (12 / 15.9 / 20 %), columns the index
 * (−2 % … +2 %), each cell the model P&L in ₹ lakh. One toggle, "read the diagonal", lights the corner-to-corner cells
 * and the centre row and column and prints what the higher Greeks are on this table.
 */

const G = KEY.grid;
const VOLS = G.vols;
const MOVES = G.moves;
const UNITS = G.units; // −6,500
const CENTRE = { i: 1, j: 2 };

/** ₹ lakh with sign, one decimal; the centre prints 0 */
const cell = (v: number) => (Math.abs(v) < 500 ? "0" : (v > 0 ? "+" : "") + lakh(v, 2).replace(" lakh", ""));

export function F2Grid() {
  const [diag, setDiag] = useState(false);
  const grid = useMemo(() => pnlGrid(at(ROW.atmK, ROW.days, ROW.atmIv), UNITS, VOLS, MOVES), []);
  const pnl = grid.pnl;
  const max = Math.max(...pnl.flat().map(Math.abs));
  const hedgeDelta = grid.hedgeUnits / -UNITS; // 0.506
  const centre = pnl[CENTRE.i][CENTRE.j];
  const corner = pnl[2][0]; // wobble up, index down
  const up = pnl[2][CENTRE.j],
    down = pnl[0][CENTRE.j];
  const onDiag = (i: number, j: number) => (i === 0 && j === 0) || (i === 1 && j === 2) || (i === 2 && j === 4);
  const onAnti = (i: number, j: number) => (i === 0 && j === 4) || (i === 1 && j === 2) || (i === 2 && j === 0);
  const onCentre = (i: number, j: number) => i === CENTRE.i || j === CENTRE.j;

  return (
    <Figure
      n="2"
      prompt={
        <>
          Raj's book from C4 (short {n0(-UNITS)} units of the {n0(ROW.atmK)} call, hedged at {f3(hedgeDelta)}) — model P&L on a real position, on the grid every desk prints each morning: the
          index across, the wobble down.
        </>
      }
      controls={
        <>
          <Toggle label="read the diagonal" on={diag} onChange={setDiag} />
          <Readouts
            items={[
              ["centre", `${Math.abs(centre) < 1 ? "₹0 to the rupee" : lakh(centre)} at ${pct1(VOLS[1])}, index unchanged`],
              ["the corner Raj hates", `${lakh(corner)} — wobble ${pct1(VOLS[2])}, index −2 %`],
              ["down the centre column", `${lakh(up)} for wobble up, +${lakh(down)} for wobble down`],
            ]}
          />
        </>
      }
      observe={
        diag ? (
          <>
            A desk already has this grid; the higher Greeks are the shape of a table it reads every morning. <strong>Vanna</strong> is how fast the numbers change along the diagonal — wobble and index
            moving together; <strong>volga</strong> is how fast they change down a column — the wobble alone, +{lakh(down)} above the centre and {lakh(up)} below it; <strong>gamma</strong>{" "}
            across a row — the index alone, {lakh(pnl[1][0])} and {lakh(pnl[1][4])} at the two ends of the middle row. The double-trouble corner, wobble up and index down, is {lakh(corner)}: a
            short-call book hedged flat is hurt by each on its own and more than twice by both.
          </>
        ) : (
          <>
            Zero at the centre to the rupee: that is what "hedged at Friday's slope" means. Every step away is a loss on the middle row — the bend you met in C4 — and the whole row sinks when the
            wobble rises. Key: {lakh(KEY.grid.pnl[1][0])} / {lakh(KEY.grid.pnl[1][4])} at ±2 % on the middle row; {lakh(KEY.grid.pnl[2][2])} for the wobble at {pct1(VOLS[2])}, +{lakh(KEY.grid.pnl[0][2])} at{" "}
            {pct1(VOLS[0])}. Switch the toggle on to read it the way the chapter does.
          </>
        )
      }
    >
      <div className={"c5-grid-wrap " + (diag ? "diag" : "")}>
        <div className="c5-grid-head">
          <span>model P&L, ₹ lakh · {ROW.days} days left · forward {n0(ROW.F)}</span>
          <span>short {n0(-UNITS)} units · long {n0(grid.hedgeUnits)} index</span>
        </div>
        <table className="c5-grid" aria-label="P&L of Raj's hedged book over index move and wobble">
          <thead>
            <tr>
              <th className="c5-grid-corner">
                wobble ↓ <span>index →</span>
              </th>
              {MOVES.map((m) => (
                <th key={m} className={diag && m === 0 ? "lit-axis" : ""}>
                  {m === 0 ? "unchanged" : (m > 0 ? "+" : "−") + Math.abs(m * 100) + " %"}
                  <span className="c5-grid-level">{n0(ROW.F * (1 + m))}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VOLS.map((s, i) => (
              <tr key={s}>
                <th className={diag && i === 1 ? "lit-axis" : ""}>
                  {pct1(s)}
                  {i === 1 && <span className="c5-grid-level">Friday's</span>}
                </th>
                {MOVES.map((m, j) => {
                  const v = pnl[i][j];
                  const u = Math.sqrt(Math.abs(v) / max);
                  const pct = Math.round((0.06 + 0.7 * u) * 100);
                  const hue = v >= 0 ? "var(--truth)" : "var(--error)";
                  const cls = ["c5-cell", v > 500 ? "pos" : v < -500 ? "neg" : "zero", diag && onDiag(i, j) ? "diag1" : "", diag && onAnti(i, j) ? "diag2" : "", diag && onCentre(i, j) ? "axis" : "", diag && i === 2 && j === 0 ? "trouble" : ""]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <td key={m} className={cls} style={{ background: Math.abs(v) < 500 ? undefined : `color-mix(in srgb, ${hue} ${pct}%, var(--surface-raised))` }}>
                      {cell(v)}
                      {diag && i === 2 && j === 0 && <span className="c5-cell-tag">double trouble</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {diag && (
          <div className="c5-grid-read">
            <span className="d1">
              <i /> along the diagonal: <strong>vanna</strong>
            </span>
            <span className="d2">
              <i /> down a column: <strong>volga</strong>
            </span>
            <span className="d3">
              <i /> across a row: <strong>gamma</strong>
            </span>
          </div>
        )}
      </div>
    </Figure>
  );
}
