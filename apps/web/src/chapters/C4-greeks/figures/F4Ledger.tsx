import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Ledger, type LedgerRow } from "../../../ui/Ledger";
import { ResultCard } from "../../../ui/Bet";
import { Curve, Label, Marker, Plot, VLine, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { taylorSplit } from "../../../engine/bs";
import { G0, MOVE, REAL_DAY, ROW, gammaLot100, indian, lakh, n0, n1, n2, n3, price, rs, s2, thetaDay } from "./row";

/**
 * Figure 4 — the one real day, split three ways. Friday's close 22,600 → Monday's 22,753.2, three calendar days.
 * Rows per unit: slope × move, ½ bend × move², clock × days; the sum against the exact re-price; × 6,500 and short.
 * Result card against Figure 0's bet. One control: Monday / reset.
 */

type Pick = "lose1" | "lose3" | "gain2";
const LABEL: Record<Pick, string> = { lose1: "loses ≈ ₹1 lakh", lose3: "loses ≈ ₹3 lakh", gain2: "gains ≈ ₹2 lakh" };

export function F4Ledger() {
  const [monday, setMonday] = useState(false);
  // Figure 0's bet, read when Monday is pressed (not at mount: the reader may bet after this figure has rendered)
  const pick: Pick | null = monday ? readBet() : null;
  const split = useMemo(() => taylorSplit(G0, MOVE, REAL_DAY.days), []);
  const exact = useMemo(() => price(ROW.F + MOVE, ROW.days - REAL_DAY.days) - G0.price, []);
  const pnl = exact * ROW.units;
  const thDay = thetaDay(G0.thetaYr);
  const verdict = pick === "lose3" ? "right" : pick === "lose1" ? "close" : pick ? "miss" : "none";

  const rows: LedgerRow[] = [
    {
      label: <>The move</>,
      work: (
        <>
          {n0(REAL_DAY.fromClose)} → {n2(REAL_DAY.toClose)} (the real Monday close); Friday 15:30 to Monday 15:30 is {REAL_DAY.days} calendar days
        </>
      ),
      value: `${s2(MOVE)} pts, ${REAL_DAY.days} d`,
      note: <>The clock ran three days, not one — the weekend counts. Everything below is for one unit of the call.</>,
    },
    {
      label: (
        <>
          <span className="c4-err">slope</span> × move
        </>
      ),
      work: (
        <>
          {n3(G0.delta)} × {n1(MOVE)}
        </>
      ),
      value: s2(split.deltaTerm),
      role: "error",
      note: <>Most of it: the straight-line guess, the tangent of Figure 1.</>,
    },
    {
      label: (
        <>
          ½ × <span className="c4-approx">bend</span> × move²
        </>
      ),
      work: (
        <>
          ½ × {G0.gamma.toFixed(5)} × {n1(MOVE)}²
        </>
      ),
      value: s2(split.gammaTerm),
      role: "approx",
      note: <>The curve bends up away from its tangent, so a move either way is worth a little more than the slope says — {n2(gammaLot100(G0.gamma))} units per 100 points per lot, from Figure 2.</>,
    },
    {
      label: <>clock × days</>,
      work: (
        <>
          {rs(thDay, 2)} × {REAL_DAY.days}
        </>
      ),
      value: s2(split.thetaTerm),
      role: "truth",
      note: <>Saturday and Sunday each charged the full {rs(-thDay, 2)}. Theta is per calendar day.</>,
    },
    {
      label: <>Sum of the three, against the exact re-price</>,
      work: (
        <>
          {s2(split.taylor)} by the three rows; {s2(exact)} by re-pricing the call at {n2(ROW.F + MOVE)} with {ROW.days - REAL_DAY.days} days left
        </>
      ),
      value: s2(exact),
      note: (
        <>
          The three rows miss by {n2(Math.abs(split.taylor - exact))} a unit — {((100 * Math.abs(split.taylor - exact)) / Math.abs(exact)).toFixed(0)} % of the
          change. What is left over is the bend's own bend, chapter C5.
        </>
      ),
    },
    {
      label: <>× {indian(-ROW.units)} units, and Raj is short</>,
      work: (
        <>
          {s2(exact)} × ({indian(ROW.units)})
        </>
      ),
      value: lakh(pnl),
      role: "error",
      note: <>Monday morning's P&L for the position that was sold for {rs(-G0.price * ROW.units)} on Friday.</>,
    },
  ];
  const running = (shown: number) => {
    const terms = [0, split.deltaTerm, split.gammaTerm, split.thetaTerm];
    if (shown <= 4) return s2(terms.slice(0, shown).reduce((a, b) => a + b, 0)) + " a unit";
    if (shown === 5) return s2(exact) + " a unit";
    return lakh(pnl);
  };

  // the picture: Friday's curve and Monday's, the two points, the tangent
  const fri: Pt[] = useMemo(() => curve(ROW.days), []);
  const mon: Pt[] = useMemo(() => curve(ROW.days - REAL_DAY.days), []);
  const tangent: Pt[] = [
    [ROW.F - 100, G0.price - 100 * G0.delta],
    [ROW.F + MOVE + 60, G0.price + (MOVE + 60) * G0.delta],
  ];
  const Fm = ROW.F + MOVE;
  const Vm = G0.price + exact;

  return (
    <Figure
      n="4"
      prompt={
        <>
          Friday evening Raj stands at {n0(ROW.F)} with 11 days left. Press <em>Monday</em>: the real close arrives, and the change in one call is split
          into the three readings you just made.
        </>
      }
      controls={
        <>
          <button type="button" className={"btn " + (monday ? "" : "primary")} onClick={() => setMonday(!monday)}>
            {monday ? "back to Friday" : "Monday"}
          </button>
          <Readouts
            items={[
              ["the move", monday ? `${s2(MOVE)} pts in ${REAL_DAY.days} days` : "—"],
              ["one call", monday ? s2(exact) : "—"],
              ["Raj's position", monday ? lakh(pnl) : "—"],
            ]}
          />
        </>
      }
      observe={
        monday ? (
          <>
            The three rows reach {s2(split.taylor)} against the true {s2(exact)}: the ledger is almost exact on a real 153-point day. The slope row is the
            bulk; the bend adds a little; the clock takes back {n1(-split.thetaTerm)} because <strong>the clock ran three days — the weekend counts</strong>.
            Raj is short {indian(-ROW.units)} of these, so the call's gain is his loss: <strong>{lakh(pnl)}</strong>.
          </>
        ) : (
          <>Your bet from Figure 0 is waiting below the ledger.</>
        )
      }
    >
      <div className="c4-ledgerwrap">
        <div className="c4-ledger-pic">
          <Plot xDomain={[22300, 23000]} yDomain={[0, 500]} width={360} height={240} xTicks={3} yTicks={4} xLabel="index" yLabel="call price" axisY={0} margin={{ top: 14, right: 26, bottom: 34, left: 40 }} ariaLabel="Friday's price curve and Monday's, with the two points and the Friday tangent">
            <VLine at={ROW.K} />
            <Curve pts={fri} role={monday ? "ghost" : "truth"} width={2} />
            {monday && <Curve pts={mon} role="truth" width={2} />}
            {monday && <Curve pts={tangent} role="error" width={1.8} smooth={false} />}
            <Marker at={[ROW.F, G0.price]} role="ink" r={4} />
            <Label at={[ROW.F, G0.price]} text={`Fri ${n1(G0.price)}`} dx={-8} dy={-8} anchor="end" />
            {monday && <Marker at={[Fm, Vm]} role="error" r={4.5} />}
            {monday && <Label at={[Fm, Vm]} text={`Mon ${n1(Vm)}`} role="error" dx={8} dy={-8} />}
            <Label at={[23000, (monday ? mon : fri)[(monday ? mon : fri).length - 1][1]]} text={monday ? "8 d" : "11 d"} dx={-4} dy={16} anchor="end" role="truth" />
            {monday && <Label at={[23000, fri[fri.length - 1][1]]} text="11 d" dx={-4} dy={-6} anchor="end" role="ghost" />}
          </Plot>
        </div>
        <div className="c4-ledger-rows">
          {monday ? (
            <Ledger rows={rows} total={running} nextLabel="next row" />
          ) : (
            <div className="c4-friday">
              <div className="c4-friday-k">Friday, 23 October, 15:30</div>
              <div>
                index {n0(REAL_DAY.fromClose)} · call {n2(G0.price)} a unit · {ROW.days} days left
              </div>
              <div className="c4-friday-k">Press Monday.</div>
            </div>
          )}
        </div>
      </div>
      {monday && (
        <div className="c4-result">
          <ResultCard yours={pick ? LABEL[pick] : "no bet placed at Figure 0"} answer={`loses ${lakh(-pnl)}`} verdict={verdict}>
            {pick === "gain2" ? (
              <>
                Short calls lose when the index rises — the slope row alone is {s2(split.deltaTerm)} a unit against Raj. The clock paid him {n1(-split.thetaTerm)} a unit for the
                weekend, and the move took back {n1(split.deltaTerm + split.gammaTerm)}.
              </>
            ) : pick === "lose1" ? (
              <>
                The weekend's income softened it, but not that much: {n1(-split.thetaTerm)} a unit back against {n1(split.deltaTerm + split.gammaTerm)} lost to the move.
              </>
            ) : (
              <>
                Slope × move, plus a little bend, minus three days of clock, times {indian(-ROW.units)} units: that is the whole morning.
              </>
            )}
          </ResultCard>
        </div>
      )}
    </Figure>
  );
}

function readBet(): Pick | null {
  try {
    const v = localStorage.getItem("fe-bet:C4-F0");
    return v === "lose1" || v === "lose3" || v === "gain2" ? v : null;
  } catch {
    return null;
  }
}

function curve(days: number): Pt[] {
  const out: Pt[] = [];
  for (let F = 22300; F <= 23000 + 1e-6; F += 10) out.push([F, price(F, days)]);
  return out;
}
