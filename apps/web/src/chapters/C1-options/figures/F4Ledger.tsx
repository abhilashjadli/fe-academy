import "./figures.css";
import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Ledger, type LedgerRow } from "../../../ui/Ledger";
import { HLine, Label, Plot, Points, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { impliedForward } from "../../../engine/options";
import { n0, n2, rowAt, rows } from "./chain";

const DETAIL = [22250, 22500, 22600, 23000];

/** Figure 4 — the law in the chain's own numbers. One row per click: buy the call, sell the put, add the strike; every row says the same index. */
export function F4Ledger() {
  const f = useMemo(() => impliedForward(rows), []);
  const spread = f.max - f.min;
  const ledgerRows: LedgerRow[] = DETAIL.map((K, i) => {
    const r = rowAt(K);
    const paid = r.call - r.put;
    const F = f.perRow[rows.indexOf(r)];
    const label =
      i === 0 ? (
        <>
          Row {n0(K)}: buy the call at {n2(r.call)}, sell the put at {n2(r.put)}
        </>
      ) : (
        <>Row {n0(K)}: buy the call, sell the put</>
      );
    return {
      label,
      work:
        paid >= 0 ? (
          <>
            {n2(r.call)} − {n2(r.put)} = {n2(paid)} paid for "index − {n0(K)}, whatever happens"; so {n0(K)} + {n2(paid)}
          </>
        ) : (
          <>
            {n2(r.call)} − {n2(r.put)} = −{n2(-paid)}: you are <em>paid</em> {n2(-paid)} to hold "index − {n0(K)}, whatever happens"; so {n0(K)} −{" "}
            {n2(-paid)}
          </>
        ),
      value: n2(F),
      role: "truth",
      note:
        i === 0 ? (
          <>
            You just paid {n2(paid)} for a straight line (Figure 3) that pays index − {n0(K)} on expiry day. So the chain thinks the index delivered
            then is worth {n0(K)} + {n2(paid)} = {n2(F)}.
          </>
        ) : i === 2 ? (
          <>
            Here the put is dearer than the call, so holding the line pays you {n2(-paid)} today — and the row says {n2(F)}, a touch under the strike.
          </>
        ) : i === DETAIL.length - 1 ? (
          <>Four rows, four strikes, one index. Now the other thirteen.</>
        ) : undefined,
    };
  });
  ledgerRows.push({
    label: <>The other thirteen rows, the same way</>,
    work: <>lowest {n2(f.min)}, highest {n2(f.max)}, median {n2(f.F)}</>,
    value: `${n2(f.min)} – ${n2(f.max)}`,
    role: "approx",
    note: (
      <>
        All seventeen land within {n2(spread)} points of each other — {((100 * spread) / f.F).toFixed(3)} % of the index — from trades done at
        different seconds. Below, every row as a dot.
      </>
    ),
  });

  const pts: Pt[] = rows.map((r, i) => [r.K, f.perRow[i]]);
  return (
    <Figure
      n="4"
      prompt={
        <>
          Buy the call, sell the put, add the strike. Do it for one row, then the next. What number does each row hand you?
        </>
      }
      controls={
        <Readouts
          items={[
            ["median over 17 rows", n2(f.F)],
            ["lowest row", n2(f.min)],
            ["highest row", n2(f.max)],
          ]}
        />
      }
      observe={
        <>
          Every row lands between {n2(f.min)} and {n2(f.max)}: twelve points on 22,600, five hundredths of a percent.{" "}
          <strong>Call − put = index − strike</strong> in every row, because two bundles worth the same whatever happens must cost the same. The
          22,603 is today's index grown at the interest rate to expiry; that growth is the discounting.
        </>
      }
    >
      <Ledger rows={ledgerRows} nextLabel="next row" />
      <div className="c1-strip">
        <Plot xDomain={[22200, 23100]} yDomain={[22590, 22615]} width={560} height={150} xLabel="strike" yLabel="call − put + strike" xTicks={5} yTicks={3} axisY={22590} ariaLabel="Seventeen dots, one per strike, all within thirteen points of 22,603">
          <HLine at={f.F} />
          <Label at={[23100, f.F]} text={`median ${n2(f.F)}`} anchor="end" dx={-6} dy={-6} />
          <Points pts={pts} role="truth" r={4.5} opacity={0.9} />
        </Plot>
      </div>
    </Figure>
  );
}
