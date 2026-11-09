import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Toggle } from "../../../ui/controls";
import { fitChain, invalidRow } from "../../../engine/markov";
import { DAYS, SEASON, STATE_SHORT, f2, type State } from "./rain";
import { DayStrip, StateLegend, stateClass } from "./strip";

/**
 * Figure 1 — the ledger, by hand then automatic. Each click walks one day along the strip and drops a tally into the
 * 3 × 3 table "yesterday → today". After ten clicks the reader may count the rest. One toggle turns counts into
 * fractions; a fraction can be edited, and a row that no longer sums to 1 turns red (the engine's own check).
 */

type Mode = "counts" | "fractions";

export function F1Ledger() {
  const [n, setN] = useState(0); // transitions tallied so far: days 0..n are on the table
  const [mode, setMode] = useState<Mode>("counts");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const done = n >= DAYS - 1;

  const fit = useMemo(() => fitChain(SEASON.states.slice(0, n + 1), 3), [n]);
  const last = n > 0 ? ([SEASON.states[n - 1], SEASON.states[n]] as [State, State]) : null;

  // the table shown: counts, or fractions with the reader's edits laid over
  const P = fit.P.map((row, i) => row.map((v, j) => (edits[`${i}${j}`] !== undefined ? parseFloat(edits[`${i}${j}`]) || 0 : v)));
  // the engine's own check, with a tolerance that forgives the two-decimal rounding of the shown fractions
  const bad = mode === "fractions" && n > 0 ? invalidRow(P, 0.0051) : -1;
  const edited = Object.keys(edits).length > 0;

  const rowTotal = (i: number) => fit.counts[i].reduce((s, c) => s + c, 0);
  const stay = [0, 1, 2].map((i) => (rowTotal(i) > 0 ? fit.P[i][i] : NaN));

  return (
    <Figure
      n="1"
      prompt={
        <>
          Take the strip apart. Each click moves one day along it and drops a tally into the table: the row is yesterday's colour, the column is today's. Do ten by hand,
          then let the page count the rest.{SEASON.real ? "" : " (Same simulated season as above.)"}
        </>
      }
      controls={
        <>
          <span className="ctl">
            <span className="seg" role="group" aria-label="walk the strip">
              <button type="button" disabled={done} onClick={() => setN((k) => Math.min(DAYS - 1, k + 1))}>
                next day
              </button>
              <button type="button" disabled={done || n < 10} title={n < 10 ? "ten by hand first" : "tally every remaining day"} onClick={() => setN(DAYS - 1)}>
                count the rest
              </button>
              <button type="button" disabled={n === 0 && !edited} onClick={() => { setN(0); setEdits({}); setMode("counts"); }}>
                start over
              </button>
            </span>
          </span>
          <Toggle label={mode === "counts" ? "counts → fractions" : "fractions → counts"} on={mode === "fractions"} onChange={(v) => { setMode(v ? "fractions" : "counts"); if (!v) setEdits({}); }} />
          <Readouts
            items={[
              ["days tallied", `${n} of ${DAYS - 1}`],
              ["stay, dry → dry", Number.isFinite(stay[0]) ? f2(stay[0]) : "—"],
              ["stay, heavy → heavy", Number.isFinite(stay[2]) ? f2(stay[2]) : "—"],
            ]}
          />
        </>
      }
      observe={
        bad >= 0 ? (
          <>
            That row no longer sums to 1. A row is a list of tomorrows for one kind of today, and tomorrow must be <em>something</em> — so the three fractions in a row
            must add to exactly 1. The engine refuses the table (red) until they do. Press "start over" or edit it back.
          </>
        ) : done ? (
          <>
            {DAYS - 1} days collapsed into nine numbers. Each row adds to 1. The diagonal is the stickiness: a dry day is followed by a dry day {f2(stay[0])} of the time, a
            heavy day by another heavy day {f2(stay[2])} of the time. This table is your own tally — nobody typed it in. Try the toggle, then change one fraction.
          </>
        ) : n < 10 ? (
          <>
            Yesterday's colour picks the row, today's the column; one tick lands. Ten by hand and you will have felt the whole method. It never looks further back than
            yesterday.
          </>
        ) : (
          <>
            You know the move now. "Count the rest" does the other {DAYS - 1 - n} days the same way — one look back, one tick.
          </>
        )
      }
    >
      <div className="b1-ledger">
        <div className="b1-ledger-strip">
          <DayStrip
            states={SEASON.states}
            perRow={30}
            ariaLabel={`The season's ${DAYS} days; days up to ${n + 1} are tallied, the rest are faded`}
            mark={(i) => (i === n ? "b1-today" : i === n - 1 ? "b1-yesterday" : i > n ? "b1-dim" : undefined)}
          />
          <StateLegend extra={<span className="b1-legend-note">{n > 0 ? <>yesterday ◻ · today ■</> : <>press "next day"</>}</span>} />
        </div>
        <div className={"b1-table-wrap " + (bad >= 0 ? "b1-broke" : "")}>
          <table className="table b1-table" aria-label="tally of yesterday to today transitions">
            <thead>
              <tr>
                <th className="b1-corner">
                  <span>yesterday ↓</span>
                  <span>today →</span>
                </th>
                {STATE_SHORT.map((s, j) => (
                  <th key={j}>
                    <i className={"b1-sw " + stateClass(j)} /> {s}
                  </th>
                ))}
                <th className="b1-sum">{mode === "counts" ? "days" : "sum"}</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2].map((i) => {
                const total = rowTotal(i);
                const sum = P[i].reduce((s, v) => s + v, 0);
                const rowBad = mode === "fractions" && n > 0 && (Math.abs(sum - 1) > 0.0051 || P[i].some((v) => v < 0));
                return (
                  <tr key={i} className={rowBad ? "b1-row-bad" : ""}>
                    <th>
                      <i className={"b1-sw " + stateClass(i)} /> {STATE_SHORT[i]}
                    </th>
                    {[0, 1, 2].map((j) => {
                      const hit = last && last[0] === i && last[1] === j;
                      return (
                        <td key={j} className={"num " + (hit ? "b1-hit" : "") + (i === j ? " b1-diag" : "")}>
                          {mode === "counts" ? (
                            fit.counts[i][j]
                          ) : (
                            <input
                              className="b1-cell"
                              type="number"
                              inputMode="decimal"
                              step={0.01}
                              min={0}
                              max={1}
                              aria-label={`fraction ${STATE_SHORT[i]} to ${STATE_SHORT[j]}`}
                              value={edits[`${i}${j}`] !== undefined ? edits[`${i}${j}`] : total > 0 ? fit.P[i][j].toFixed(2) : "0.33"}
                              onChange={(e) => setEdits((d) => ({ ...d, [`${i}${j}`]: e.target.value }))}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className={"num b1-sum " + (rowBad ? "b1-bad" : "")}>{mode === "counts" ? total : total > 0 ? f2(sum) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="b1-hint">
            {mode === "counts"
              ? "rows: what yesterday was · columns: what today turned out to be"
              : edited
                ? "edited — press start over to get your tally back"
                : "each fraction is that cell's count over its row's days · tap one and change it"}
          </div>
        </div>
      </div>
    </Figure>
  );
}
