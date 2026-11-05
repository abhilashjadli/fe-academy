import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { ResultCard } from "../../../ui/Bet";
import { Bars, Label, Plot, VLine } from "../../../ui/Plot";
import { Readouts, Toggle } from "../../../ui/controls";
import { PICK_LABEL, type Pick } from "./F0Comic";
import { POS, WEEK, dayLabel, dayShort, lakh, n0, n1, n2, n3, rs, rsSigned, short, shortSigned, useNarrow, type WeekRow } from "./week";

/**
 * Figure 1 — the ledger game. One press per trading day: the close lands, the slope updates, Raj trades the difference
 * after the move, the row and its narration appear, and two bars grow under the ledger (clock earned, bend paid).
 * Toggle: hedge daily / never (the naked book's P&L in a column and a ghost bar). Result card at expiry against
 * Figure 0's bet. Rows past the data file are simulated and tagged.
 */

const ROWS = WEEK.rows;
const WITHIN = 10000; // "within a few thousand" = |gap| < ₹10,000

export function F1Ledger() {
  const [shown, setShown] = useState(1); // rows revealed; row 0 is Friday
  const [never, setNever] = useState(false);
  const done = shown >= ROWS.length;
  const cur = ROWS[shown - 1];
  const pick: Pick | null = done ? readBet() : null;

  const visible = ROWS.slice(0, shown);
  const clock = visible.reduce((s, r) => s + r.clock, 0);
  const bend = visible.reduce((s, r) => s + r.bend, 0);
  const pnl = cur.pnl;
  const arithmetic = clock + bend;
  const gap = pnl - arithmetic;
  const outcome: Pick = Math.abs(gap) < WITHIN ? "within" : gap > 0 ? "ahead" : "behind";
  // scored only once the whole week is real; on a simulated tail the card is provisional
  const verdict = pick && WEEK.complete ? (pick === outcome ? "right" : "miss") : "none";
  const narrow = useNarrow();
  const simFrom = WEEK.complete ? null : WEEK.nReal; // index of the first simulated row
  const simShown = simFrom !== null && shown > simFrom;

  // y-range fixed over the whole week so the bars do not rescale press by press
  const yDom = useMemo<[number, number]>(() => {
    let lo = 0,
      hi = 0;
    // the real days always; the simulated tail only once it is on screen
    for (const r of ROWS.slice(1, Math.max(WEEK.nReal, shown))) {
      lo = Math.min(lo, r.bend, never ? r.nakedDay : 0);
      hi = Math.max(hi, r.clock, never ? r.nakedDay : 0);
    }
    const pad = 0.14 * (hi - lo);
    return [(lo - pad) / 1e5, (hi + pad) / 1e5];
  }, [never, shown]);
  const n = ROWS.length - 1;
  const bw = never ? 0.26 : 0.36;
  const off = never ? 0.28 : 0.2;
  const dayRows = visible.slice(1);
  // no value label on a bar too short to carry one
  const big = (v: number) => Math.abs(v / 1e5) > 0.04 * (yDom[1] - yDom[0]);
  const bar = (r: WeekRow, i: number, k: "clock" | "bend" | "nakedDay") => ({ x: i + 1 + (k === "clock" ? -off : k === "bend" ? (never ? 0 : off) : off), y: r[k] / 1e5, w: bw });

  return (
    <Figure
      n="1"
      prompt={
        <>
          The week, one press per trading day. Each day the real close lands, the slope moves, and Raj buys or sells the difference <em>after</em> the move.
          Under the ledger: what the clock paid him and what the bend charged him.
        </>
      }
      controls={
        <>
          <button type="button" className={"btn " + (done ? "" : "primary")} onClick={() => setShown(done ? 1 : shown + 1)}>
            {done ? "start the week again" : shown === 1 ? "Monday →" : `next day → ${dayShort(ROWS[shown].date)}`}
          </button>
          <Toggle label="also show: never hedged" on={never} onChange={setNever} />
          <Readouts
            items={[
              ["clock so far", <span className="d1-truth">{rsSigned(clock)}</span>],
              ["bend so far", <span className="d1-approx">{rsSigned(bend)}</span>],
              [done ? "P&L at expiry" : "P&L so far", <strong>{rsSigned(pnl)}</strong>],
            ]}
          />
        </>
      }
      observe={
        shown === 1 ? (
          <>
            Friday: {rs(POS.premium)} in, {n0(ROWS[0].hedgeUnits)} index units bought at {n0(ROWS[0].close)}. Press <em>Monday</em>.
          </>
        ) : !done ? (
          <>
            {dayLabel(cur.date)}: the clock paid <strong>{short(cur.clock)}</strong> for {cur.dtDays} {cur.dtDays === 1 ? "day" : "days"}; the bend charged{" "}
            <strong>{short(-cur.bend)}</strong> on a {n0(Math.abs(cur.dS))}-point move; the hedged book made <strong>{shortSigned(cur.exactDay)}</strong>.
            {never && (
              <>
                {" "}
                Unhedged it would have made {shortSigned(cur.nakedDay)} on the day and stand at {shortSigned(cur.naked)} since Friday.
              </>
            )}{" "}
            {Math.abs(cur.tradeLots) >= 1 ? (
              <>
                And Raj {cur.tradeLots > 0 ? "bought" : "sold"} {n1(Math.abs(cur.tradeLots))} lots <em>after</em> the {cur.dS > 0 ? "rise" : "fall"} — buy high, sell low, a day late every day.
              </>
            ) : (
              <>A quiet day: almost nothing to re-hedge.</>
            )}
          </>
        ) : (
          <>
            Theta arrived in a trickle, {rs(clock)} over the week; gamma took its {rs(-bend)} in lumps. The arithmetic says {rsSigned(arithmetic)}; the ledger says{" "}
            <strong>{rsSigned(pnl)}</strong>. The {rs(Math.abs(gap))} between them is the hedger being a day late — the leak. Figure 3 asks whether a week like this
            is luck or design.
          </>
        )
      }
    >
      <div className="d1-game">
        <div className="d1-table-wrap">
          <table className="d1-ledger" aria-label="Raj's hedge ledger">
            <thead>
              <tr>
                <th>day</th>
                <th>close</th>
                <th>slope</th>
                <th>
                  lots
                  <br />
                  <small>traded</small>
                </th>
                <th>
                  cash
                  <br />
                  <small>₹ lakh</small>
                </th>
                <th>
                  P&L
                  <br />
                  <small>₹ lakh</small>
                </th>
                {never && (
                  <th>
                    never
                    <br />
                    <small>hedged</small>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={r.date} className={(i === shown - 1 ? "hl " : "") + (r.simulated ? "sim" : "")}>
                  <td>{dayShort(r.date)}</td>
                  <td>{n2(r.close)}</td>
                  <td>{n3(r.delta)}</td>
                  <td className={r.tradeLots > 0.05 ? "pos" : r.tradeLots < -0.05 ? "neg" : ""}>{(r.tradeLots > 0 ? "+" : "") + n1(r.tradeLots)}</td>
                  <td>{n2(r.cash / 1e5)}</td>
                  <td className={r.pnl > 0 ? "pos" : r.pnl < 0 ? "neg" : ""}>{signed2(r.pnl / 1e5)}</td>
                  {never && <td className={r.naked > 0 ? "pos" : r.naked < 0 ? "neg" : ""}>{signed2(r.naked / 1e5)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d1-narr" aria-live="polite">
          {cur.narration}
          {shown > 1 && (
            <span className="d1-quiet">
              clock {shortSigned(cur.clock)} · bend {shortSigned(cur.bend)} · day {shortSigned(cur.exactDay)}
            </span>
          )}
          {simShown && <span className="d1-simnote">simulated from {dayShort(ROWS[simFrom!].date)} — the data file ends at {dayShort(ROWS[simFrom! - 1].date)}; seeded path at {(100 * POS.sigmaSold).toFixed(1)} %</span>}
        </div>
        <div className="d1-bars">
          <Plot xDomain={[0.4, n + 0.6]} yDomain={yDom} width={narrow ? 380 : 720} height={narrow ? 260 : 240} xTicks={0} yTicks={5} yLabel="₹ lakh, per day" axisY={0} margin={{ top: 16, right: 10, bottom: 10, left: narrow ? 36 : 46 }} ariaLabel="Per day: what the clock paid Raj and what the bend charged him">
            {dayRows.filter((r) => !r.simulated).length > 0 && <Bars bars={dayRows.filter((r) => !r.simulated).map((r, i) => bar(r, i, "clock"))} role="truth" />}
            {dayRows.filter((r) => !r.simulated).length > 0 && <Bars bars={dayRows.filter((r) => !r.simulated).map((r, i) => bar(r, i, "bend"))} role="approx" />}
            {never && dayRows.filter((r) => !r.simulated).length > 0 && <Bars bars={dayRows.filter((r) => !r.simulated).map((r, i) => bar(r, i, "nakedDay"))} role="ghost" opacity={0.7} />}
            {simShown && (
              <>
                <Bars bars={dayRows.filter((r) => r.simulated).map((r, i) => bar(r, i + WEEK.nReal - 1, "clock"))} role="truth" opacity={0.3} />
                <Bars bars={dayRows.filter((r) => r.simulated).map((r, i) => bar(r, i + WEEK.nReal - 1, "bend"))} role="approx" opacity={0.3} />
                {never && <Bars bars={dayRows.filter((r) => r.simulated).map((r, i) => bar(r, i + WEEK.nReal - 1, "nakedDay"))} role="ghost" opacity={0.3} />}
                <VLine at={WEEK.nReal - 0.5} />
                <Label at={[WEEK.nReal - 0.5, yDom[1]]} text="simulated from here" role="ghost" dx={5} dy={12} />
              </>
            )}
            {ROWS.slice(1).map((r, i) => (
              <Label key={r.date} at={[i + 1, yDom[0]]} text={narrow ? dayTiny(r.date) : dayShort(r.date)} role={i + 1 < shown ? undefined : "ghost"} dy={-4} dx={0} anchor="middle" />
            ))}
            {shown > 1 && big(cur.clock) && <Label at={[shown - 1 - off, Math.max(0, cur.clock / 1e5)]} text={shortSigned(cur.clock)} role="truth" anchor="middle" dx={0} dy={cur.clock >= 0 ? -5 : 13} />}
            {shown > 1 && big(cur.bend) && <Label at={[shown - 1 + (never ? 0 : off), Math.min(0, cur.bend / 1e5)]} text={shortSigned(cur.bend)} role="approx" anchor="middle" dx={0} dy={13} />}
            {shown > 1 && never && big(cur.nakedDay) && <Label at={[shown - 1 + off, cur.nakedDay / 1e5]} text={shortSigned(cur.nakedDay)} role="ghost" anchor="middle" dx={0} dy={cur.nakedDay < 0 ? 13 : -5} />}
          </Plot>
          <div className="d1-legend">
            <span>
              <i className="sw-truth" />
              clock earned
            </span>
            <span>
              <i className="sw-approx" />
              bend paid
            </span>
            {never && (
              <span>
                <i className="sw-ghost" />
                never hedged, the day's P&L
              </span>
            )}
          </div>
        </div>
        {done && (
          <div className="d1-result">
            <ResultCard yours={pick ? PICK_LABEL[pick] : "no bet placed at Figure 0"} answer={`${PICK_LABEL[outcome]} — the ledger ${rsSigned(pnl)} against ${rsSigned(arithmetic)} by the arithmetic, a gap of ${rsSigned(gap)}`} verdict={verdict}>
              {!WEEK.complete ? (
                <>
                  <strong>Provisional:</strong> the closes after {dayLabel(ROWS[WEEK.nReal - 1].date)} are a simulated path, not the market. The card settles itself the day the
                  real closes reach the data file. On the three real days the gap was {rsSigned(ROWS[WEEK.nReal - 1].pnl - ROWS.slice(0, WEEK.nReal).reduce((s, r) => s + r.clock + r.bend, 0))}.
                </>
              ) : (
                <>
                  Clock {rsSigned(clock)}, bend {rsSigned(bend)}, and the rest is the slope being a day late on every move. Hedged once a day, that leftover is small and random; Figure 3
                  shows how small.
                </>
              )}
              {never && (
                <>
                  {" "}
                  Never hedged, the same week would have ended at <strong>{lakh(WEEK.totals.naked)}</strong>.
                </>
              )}
            </ResultCard>
          </div>
        )}
      </div>
    </Figure>
  );
}

/** "M 26" for the phone-width axis */
const dayTiny = (d: string) => dayShort(d).replace(/^(\w)\w+ /, "$1 ");
const signed2 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

function readBet(): Pick | null {
  try {
    const v = localStorage.getItem("fe-bet:D1-F0");
    return v === "ahead" || v === "behind" || v === "within" ? v : null;
  } catch {
    return null;
  }
}
