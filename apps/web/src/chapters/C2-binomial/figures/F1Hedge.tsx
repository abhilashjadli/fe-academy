import { useMemo, useState } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Segmented, Slider } from "../../../ui/controls";
import { MiniBoard } from "../../0.2-normal/MiniBoard";
import { hedgeMeter, mispricingProfit } from "../../../engine/binomial";
import { LOT, REAL, REAL_DAYS, SELL_AT, f4, n0, n2, pct1, realStep } from "./real";
import "./figures.css";

/**
 * Figure 1 — how the trick is done, on the real row. One dial: units of the index to hold. Two meters, "if up" and "if down", read
 * units × index − ticket payout. They agree at the engine's Δ (both read the same rupee amount); the copy's cost is the ticket's price.
 * Break-it: sell the ticket at a round number above that price.
 */

const f0 = format(",.0f");
type Next = "meters" | "price" | "sell";
/** the dial clicks onto Δ when it is within this of it — a mouse cannot land on four decimals */
const SNAP = 0.003;

function Meter({ label, value, max, lit }: { label: string; value: number; max: number; lit: boolean }) {
  const w = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className={"c2-meter " + (lit ? "lit" : "")}>
      <span className="c2-meter-k">{label}</span>
      <span className="c2-meter-bar" role="img" aria-label={`${label}: ${n2(value)}`}>
        <span className="c2-meter-fill" style={{ width: w + "%" }} />
      </span>
      <span className="c2-meter-v num">{n2(value)}</span>
    </div>
  );
}

export function F1Hedge() {
  const [dial, setDial] = useState(0.6);
  const [next, setNext] = useState<Next>("meters");
  const step = useMemo(realStep, []);
  const h = Math.abs(dial - step.delta) < SNAP ? step.delta : dial; // clicks onto Δ
  const m = hedgeMeter(REAL, h, 0); // cash = 0: the meters read units × index − payout
  const agree = Math.abs(m.spread) < 1e-6;
  const sell = mispricingProfit(step, SELL_AT);
  const paidForIndex = h * REAL.S0;

  return (
    <Figure
      n="1"
      prompt={
        <>
          Hold some of the index and <em>owe</em> one ticket. Each meter reads what that book is worth at one of the two nodes: units × index, minus what the ticket pays
          there. Turn the dial until the two meters agree — then you have a position whose value in {REAL_DAYS} days does not depend on which way the index goes.
        </>
      }
      controls={
        <>
          <Slider label="units to hold" value={dial} min={0.3} max={0.7} step={0.001} onChange={setDial} role="truth" fmt={(v) => f4(Math.abs(v - step.delta) < SNAP ? step.delta : v)} width={140} />
          <Segmented
            label="then"
            value={next}
            onChange={setNext}
            options={[
              { id: "meters", label: "just the meters" },
              { id: "price", label: "price the ticket" },
              { id: "sell", label: `break it: sell at ${n0(SELL_AT)}` },
            ]}
          />
        </>
      }
      observe={
        agree ? (
          <>
            At {f4(step.delta)} units both meters read {n2(step.portfolio)}: the index-minus-ticket book is worth {n2(step.portfolio)} whatever happens. A sure{" "}
            {n2(step.portfolio)} in {REAL_DAYS} days is {n2(step.pv)} today, and the {f4(step.delta)} units cost {n2(step.delta * REAL.S0)}. So the ticket costs{" "}
            {n2(step.delta * REAL.S0)} − {n2(step.pv)} = {n2(step.f)}. The odds were never on the meters.
          </>
        ) : (
          <>
            The meters read what the book is worth at the top node and at the bottom node. While they disagree the book is a bet. Keep turning until they are level —
            the dial clicks in when they are.
          </>
        )
      }
    >
      <div className="c2-stage">
        <MiniBoard
          rows={1}
          width={380}
          height={250}
          bucketLabels="none"
          ariaLabel="The one-row board; under each future, what the index-minus-ticket book is worth there"
          nodeLabel={(r, k) =>
            r === 0 ? [n0(REAL.S0), { text: `${f4(h)} units, owe 1 ticket`, plain: true }] : k === 1 ? [n2(step.Su), { text: "book worth", plain: true }, n2(m.gapUp)] : [n2(step.Sd), { text: "book worth", plain: true }, n2(m.gapDown)]
          }
          nodeState={(r) => (r === 1 ? (agree ? "lit" : "dim") : undefined)}
          edges={() => ({ opacity: 0.6 })}
        />
        <div className="c2-meters">
          <Meter label={`if ${n2(step.Su)} (pays ${n2(step.fu)})`} value={m.gapUp} max={step.Su} lit={agree} />
          <Meter label={`if ${n2(step.Sd)} (pays 0)`} value={m.gapDown} max={step.Su} lit={agree} />
          <div className={"c2-agree " + (agree ? "yes" : "")}>{agree ? "they agree — the book is riskless" : `gap between the meters ${n2(m.spread)} — keep turning`}</div>
        </div>
      </div>

      {next === "price" && (
        <div className="c2-panel">
          {!agree ? (
            <p>Set the dial so the meters agree first — the pricing only works when the two futures are worth the same.</p>
          ) : (
            <table className="table c2-sum">
              <tbody>
                <tr>
                  <td>the book in {REAL_DAYS} days, either way</td>
                  <td className="num">{n2(step.portfolio)}</td>
                </tr>
                <tr>
                  <td>
                    a sure {n2(step.portfolio)} in {REAL_DAYS} days, today (discount at {pct1(REAL.r)})
                  </td>
                  <td className="num">{n2(step.pv)}</td>
                </tr>
                <tr>
                  <td>what you paid for {f4(step.delta)} units of the index today</td>
                  <td className="num">{n2(paidForIndex)}</td>
                </tr>
                <tr className="hl">
                  <td>
                    so the ticket is worth {n2(paidForIndex)} − {n2(step.pv)}
                  </td>
                  <td className="num c2-truth">{n2(step.f)}</td>
                </tr>
              </tbody>
            </table>
          )}
          {agree && (
            <div className="footnote">
              You copied the ticket with {f4(step.delta)} units of the index and {n2(step.pv)} of borrowed money; a copy must cost what the original costs, or someone eats
              the difference. (The one weight on the up node that prices this same copy as a discounted average — the magician's prop — is {f4(step.p)}; the sentence under
              this figure says what it is.)
            </div>
          )}
        </div>
      )}

      {next === "sell" && (
        <div className="c2-panel c2-break">
          <p>
            Someone offers to buy the ticket from you at <span className="num">{n2(SELL_AT)}</span>. Sell it, buy {f4(step.delta)} units of the index, borrow the rest: whatever
            the index does, you are square in {REAL_DAYS} days — and you pocket <span className="num c2-error">{n2(sell.profit)}</span> per unit today. On one lot of {LOT} that is{" "}
            <span className="num c2-error">₹{f0(sell.profit * LOT)}</span> of free money.
          </p>
          <div className="footnote">
            The engine's verdict: {sell.action}. Any price but {n2(step.f)} hands this to whoever is holding the dial — which is why the price is what it is.
          </div>
        </div>
      )}
    </Figure>
  );
}
