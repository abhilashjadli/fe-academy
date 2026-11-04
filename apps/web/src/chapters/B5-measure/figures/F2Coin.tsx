import { useMemo } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Ledger, type LedgerRow } from "../../../ui/Ledger";
import { Avatar, Says } from "../../../ui/Comic";
import { impliedDiscountRate, oneStep, realWorldProbability } from "../../../engine/binomial";
import { finiteTilt } from "../../../engine/measure";
import "./figures.css";

/**
 * Figure 2 — "But 0.633 is still an average of something." One row per click: the weight that makes the stock itself a fair bet at 12 %
 * (0.6523), the ticket under that weight discounted (0.633 — the same number by the other road), and, greyed, Priya's 70 % which also works
 * if she discounts at 42.6 % — a rate she can only find after knowing the price. Beside the ledger: Raj's coin and Priya's, with their faces.
 */

const HULL = { S0: 20, u: 1.1, d: 0.9, K: 21, r: 0.12, T: 0.25 } as const;
const MU = 0.16; // Hull p. 205: a 16 %-a-year stock makes the up-move 70 % likely
const f2 = format(".2f");
const f3 = format(".3f");
const f4 = format(".4f");
const pct1 = format(".1%");
const pct2 = format(".2%");

export function F2Coin() {
  const step = useMemo(() => oneStep(HULL), []);
  const q = useMemo(() => realWorldProbability(HULL.u, HULL.d, MU, HULL.T), []); // 0.7041
  const tilt = useMemo(() => finiteTilt(HULL, q), [q]); // Z(up) 0.9265, Z(down) 1.1750, E_q[Z] = 1
  const real = impliedDiscountRate(step, q, HULL.T); // rate 0.4256
  const grown = HULL.S0 * Math.exp(HULL.r * HULL.T); // 20.609

  const rows: LedgerRow[] = [
    {
      label: "Grow 20 at 12 % for three months — what a fair bet on the stock must average",
      work: <span className="num">20 × e^(0.12 × 0.25)</span>,
      value: f2(grown),
      note: "Not a forecast. Twenty, plus three months of interest.",
    },
    {
      label: "Raj's weight on 22: the one that makes 22 / 18 average to exactly that",
      work: (
        <span className="num">
          22 p + 18 (1 − p) = {f2(grown)} → p = ({f2(grown)} − 18) / 4
        </span>
      ),
      value: <span className="b5-raj">{f4(step.p)}</span>,
      role: "error",
      note: "Fixed by 22, 18 and 12 %. Nothing about the company, nothing about Priya.",
    },
    {
      label: "The ticket under Raj's weight, discounted at 12 %",
      work: (
        <span className="num">
          e^(−0.03) × ({f4(step.p)} × 1 + {f4(1 - step.p)} × 0)
        </span>
      ),
      value: <span className="b5-raj">{f3(step.fRiskNeutral)}</span>,
      role: "error",
      note: "0.633 — the drawing's number, by the other road. A price is an average after all; just not under Priya's odds.",
    },
    {
      label: "Priya's 70 % works too — if she discounts at 42.6 %",
      work: (
        <span className="num">
          e^(−{f4(real.rate)} × 0.25) × ({f4(q)} × 1 + {f4(1 - q)} × 0)
        </span>
      ),
      value: <span className="b5-priya">{f3(Math.exp(-real.rate * HULL.T) * real.expectedPayoff)}</span>,
      role: "approx",
      note: `Her average payout is ${f4(real.expectedPayoff)}; to land on 0.633 she must discount at ${pct2(real.rate)} a year — a rate she can only find after she already knows the price. True, and useless.`,
    },
  ];

  return (
    <Figure
      n="2"
      prompt={<>Priya is not done. One row per click: which average is 0.633 the average of?</>}
      observe={
        <>
          Raj's coin reads {pct1(step.p)}, Priya's {pct1(q)}. His is not a forecast. It is the only weight under which today's price is an honest average — fixed by the board, not by anyone's view. Price with it and you get 0.633 again.
        </>
      }
    >
      <div className="b5-stage b5-stage-col">
        <Says who="Priya" mood="thinking">
          But 0.633 is still an average of <em>something</em>.
        </Says>
        <div className="b5-stage">
          <div className="b5-coins" role="img" aria-label={`Two coins: Raj's weight ${f4(step.p)} on 22, Priya's odds ${f4(q)} on 22`}>
            <div className="b5-coin raj">
              <Avatar name="Raj" size={40} />
              <span className="v">{f4(step.p)}</span>
              <span className="k">Raj's weight on 22 — balances his book</span>
            </div>
            <div className="b5-coin priya">
              <Avatar name="Priya" mood="happy" size={40} />
              <span className="v">{f4(q)}</span>
              <span className="k">Priya's odds on 22 — her forecast</span>
            </div>
          </div>
          <div className="b5-ledger">
            <Ledger rows={rows} nextLabel="next row" />
          </div>
        </div>
        <div className="b5-aside">
          A bookmaker's odds are set so that his book balances whichever horse wins, not to say which horse will. Raj's {pct1(step.p)} is that kind of number. Priya's {pct1(q)} is the other kind.
        </div>
      </div>
      <details className="b5-more">
        <summary>The exchange rate between the two coins</summary>
        <p>
          Raj's weights are Priya's odds times a factor on each future: Z(22) = {f4(tilt.Zup)}, Z(18) = {f4(tilt.Zdown)} — shrink the up-future, grow the down-future. Under Priya's odds the factor averages to exactly {f2(tilt.EqZ)}, so it moves weight around without adding any. Price Priya's way with the factor attached and you get {f3(tilt.priceViaZ)}: the same number. That factor is the whole of "changing the measure".
        </p>
      </details>
    </Figure>
  );
}
