import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Artefact } from "../../../ui/Artefact";
import { lotCost } from "../../../engine/options";
import { ATM_K, CHAIN_IMG, LOT, n0, n2, rowAt, rows, rs } from "./chain";

/** Figure 0 — the real chain, annotated. Five hotspots, no bet: the reader meets the screen before any definition. */
export function F0Chain() {
  const atm = rowAt(ATM_K);
  const first = rows[0];
  const last = rows[rows.length - 1];
  const perLot = lotCost(atm.call, LOT);
  return (
    <Figure
      n="0"
      prompt={
        <>
          The NSE option chain for NIFTY, 23 October 2026, as a desk sees it. Nothing here is simulated. Click a number, or walk the five things to
          notice.
        </>
      }
      observe={
        <>
          You are looking at forty numbers a row and one law you cannot see yet. Hold on to two of them: the strike is <strong>not</strong> the price of
          the option, and one lot is {LOT} units — so the at-the-money call costs {n2(atm.call)} × {LOT} = <strong>{rs(perLot)}</strong>.
        </>
      }
    >
      <Artefact
        src={CHAIN_IMG.src}
        alt={CHAIN_IMG.alt}
        width={CHAIN_IMG.width}
        height={CHAIN_IMG.height}
        caption={
          <>
            One row per strike, {n0(first.K)} to {n0(last.K)}. Calls on the left, puts on the right, the strike down the middle. The day's spot and expiry
            are not in the crop; the index is inferred from the chain, ≈ 22,603.
          </>
        }
        hotspots={[
          {
            x: 46.6,
            y: 16.5,
            w: 5.8,
            h: 81,
            title: "① The strike.",
            note: (
              <>
                The level written into the contract — where it lets you buy (a call) or sell (a put) the index on expiry day. It is <em>not</em> the
                price of the option. The table is sorted by it, {n0(first.K)} to {n0(last.K)}.
              </>
            ),
          },
          {
            x: 23.3,
            y: 16.5,
            w: 3.9,
            h: 81,
            title: "② Call LTP.",
            note: (
              <>
                The last price someone paid for the call, per unit of index. It falls down the column, {n2(first.call)} → {n2(last.call)}: the right to
                buy at {n0(last.K)} is worth less than the right to buy at {n0(first.K)}.
              </>
            ),
          },
          {
            x: 71.7,
            y: 16.5,
            w: 4,
            h: 81,
            title: "③ Put LTP.",
            note: (
              <>
                The last price of the put. It rises down the column, {n2(first.put)} → {n2(last.put)}: the right to sell high is worth more. The two
                columns run in opposite directions.
              </>
            ),
          },
          {
            x: 23,
            y: 51.6,
            w: 56,
            h: 4.6,
            title: "④ The row where call ≈ put.",
            note: (
              <>
                Strike {n0(ATM_K)}: call {n2(atm.call)}, put {n2(atm.put)} — almost equal. The chain never prints the index, but this row says where
                it is. "At the money" means this row.
              </>
            ),
          },
          {
            x: 31.1,
            y: 16.5,
            w: 15.4,
            h: 81,
            title: "⑤ Bid, ask, and how many.",
            note: (
              <>
                Around each LTP sit what buyers offer and what sellers want — for the {n0(ATM_K)} call, 248.20 / 252.00. The quantities step in {LOT}s
                because one lot is {LOT} units: that call costs {n2(atm.call)} × {LOT} = {rs(perLot)} a lot.
              </>
            ),
          },
        ]}
      />
    </Figure>
  );
}
