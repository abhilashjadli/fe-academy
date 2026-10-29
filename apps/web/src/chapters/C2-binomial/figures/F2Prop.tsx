import { useMemo } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Ledger, type LedgerRow } from "../../../ui/Ledger";
import { MiniBoard } from "../../0.2-normal/MiniBoard";
import { impliedDiscountRate, oneStep, realWorldProbability } from "../../../engine/binomial";
import "./figures.css";

/**
 * Figure 2 — the prop revealed. "But a price is an average of something." One row per click: the weight that makes the stock itself
 * a fair bet at 12 % (0.6523), the ticket at that weight discounted (0.633 — the same number by the other road), and, greyed, a real
 * 70 % belief that also works if you discount at 42.6 % — a rate you can only find after knowing the price.
 */

const HULL = { S0: 20, u: 1.1, d: 0.9, K: 21, r: 0.12, T: 0.25 } as const;
const MU = 0.16; // Hull p. 205: a 16 % expected return on the stock gives the 70 % belief
const f3 = format(".3f");
const f4 = format(".4f");
const pct1 = format(".1%");

export function F2Prop() {
  const step = useMemo(() => oneStep(HULL), []);
  const q = realWorldProbability(HULL.u, HULL.d, MU, HULL.T); // 0.7041
  const real = impliedDiscountRate(step, q, HULL.T); // rate 0.4256
  const grown = HULL.S0 * Math.exp(HULL.r * HULL.T); // 20.609

  const rows: LedgerRow[] = [
    {
      label: "Grow the stock at 12 % for three months — what a fair bet on it must average",
      work: <span className="num">20 × e^(0.12 × 0.25)</span>,
      value: f3(grown),
      note: "Not a forecast. Just 20 with three months of interest on it.",
    },
    {
      label: "The weight on 22 that makes 22 / 18 average to exactly that",
      work: (
        <span className="num">
          22 p + 18 (1 − p) = {f3(grown)} → p = ({f3(grown)} − 18) / 4
        </span>
      ),
      value: f4(step.p),
      role: "truth",
      note: "This is the dial setting the magician used. It is fixed by 22, 18 and 12 % — nothing about you, nothing about the company.",
    },
    {
      label: "The ticket at that weight, discounted at 12 %",
      work: (
        <span className="num">
          e^(−0.03) × ({f4(step.p)} × 1 + {f4(1 - step.p)} × 0)
        </span>
      ),
      value: f3(step.fRiskNeutral),
      role: "truth",
      note: "0.633 — the same number as the copy in Figure 1, by the other road. A price is an average after all; it is just not an average under your odds.",
    },
    {
      label: "Your 70 % belief works too — if you discount at 42.6 %",
      work: (
        <span className="num">
          e^(−{f4(real.rate)} × 0.25) × ({f4(q)} × 1 + {f4(1 - q)} × 0)
        </span>
      ),
      value: f3(Math.exp(-real.rate * HULL.T) * real.expectedPayoff),
      role: "approx",
      note: `A 70 % belief (a 16 %-a-year stock) gives an average payout of ${f4(real.expectedPayoff)}; to land on 0.633 you must discount it at ${pct1(real.rate)} a year — a rate you can only find after you already know the price. Real odds plus the right discount rate is a true sentence and a useless recipe.`,
    },
  ];

  return (
    <Figure
      n="2"
      prompt={<>But a price is an average of <em>something</em>. Which odds was the magician using?</>}
      observe={
        <>
          The weight 0.6523 is the one that makes the <strong>stock itself</strong> a fair bet at the interest rate. It is set by the board — 22, 18, 12 % — not estimated from anything. Price with it and you get 0.633, the copy's cost. B5 is about why such a weight always exists.
        </>
      }
    >
      <div className="c2-stage">
        <MiniBoard
          rows={1}
          width={360}
          height={230}
          bucketLabels="none"
          ariaLabel="The one-row board with the magician's weights, 65.2 % and 34.8 %"
          nodeLabel={(r, k) => (r === 0 ? ["20", { text: `grows to ${f3(grown)}`, plain: true }] : k === 1 ? ["22", "pays 1"] : ["18", "pays 0"])}
          nodeState={(r) => (r === 1 ? "dim" : undefined)}
          edges={(_r, _k, dir) => ({ opacity: 0.25 + 0.75 * (dir ? step.p : 1 - step.p), label: dir ? pct1(step.p) : pct1(1 - step.p) })}
        />
        <div className="c2-ledger">
          <Ledger rows={rows} nextLabel="next row" />
        </div>
      </div>
      <details className="c2-more">
        <summary>Two stocks, one price (Wilmott's aside)</summary>
        <p>
          Take two stocks at 100 that can each go to 101 or 99 over one short step, the first expected to double over a year, the second expected to halve. Same wobble, wildly different odds of going up. A ticket to buy either at 100 costs the same, because the copy — half a share and a little borrowed cash — is the same. The odds of the step never entered the copy.
        </p>
      </details>
    </Figure>
  );
}
