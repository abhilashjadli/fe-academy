import { useMemo, useState } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Segmented, Slider } from "../../../ui/controls";
import { MiniBoard } from "../../0.2-normal/MiniBoard";
import { hedgeMeter, mispricingProfit, oneStep } from "../../../engine/binomial";
import "./figures.css";

/**
 * Figure 1 — how the trick is done. One dial: shares to hold. Two meters, "if 22" and "if 18", read shares × price − ticket payout.
 * They agree at 0.25 shares (both 4.5); the copy's cost is the ticket's price. Break-it: sell it for 0.70.
 */

const HULL = { S0: 20, u: 1.1, d: 0.9, K: 21, r: 0.12, T: 0.25 } as const;
const f2 = format(".2f");
const f3 = format(".3f");
const f0 = format(",.0f");
type Next = "meters" | "price" | "sell";

function Meter({ label, value, max, lit }: { label: string; value: number; max: number; lit: boolean }) {
  const w = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className={"c2-meter " + (lit ? "lit" : "")}>
      <span className="c2-meter-k">{label}</span>
      <span className="c2-meter-bar" role="img" aria-label={`${label}: ${f2(value)}`}>
        <span className="c2-meter-fill" style={{ width: w + "%" }} />
      </span>
      <span className="c2-meter-v num">{f2(value)}</span>
    </div>
  );
}

export function F1Hedge() {
  const [h, setH] = useState(0.6);
  const [next, setNext] = useState<Next>("meters");
  const step = useMemo(() => oneStep(HULL), []);
  const m = hedgeMeter(HULL, h, 0); // cash = 0: the meters read shares × price − payout
  const agree = Math.abs(m.spread) < 1e-9;
  const sell = mispricingProfit(step, 0.7);

  return (
    <Figure
      n="1"
      prompt={
        <>
          Hold some shares and <em>owe</em> one ticket. Turn the dial until the two meters agree — then you have a position whose value in three months does not depend on which way the stock goes.
        </>
      }
      controls={
        <>
          <Slider label="shares to hold" value={h} min={0} max={1} step={0.01} onChange={setH} role="truth" fmt={f2} width={170} />
          <Segmented
            label="then"
            value={next}
            onChange={setNext}
            options={[
              { id: "meters", label: "just the meters" },
              { id: "price", label: "price the ticket" },
              { id: "sell", label: "break it: sell at 0.70" },
            ]}
          />
        </>
      }
      observe={
        <>
          At 0.25 shares both meters read 4.50: the shares-minus-ticket book is worth 4.50 whatever happens. A sure 4.50 in three months is 4.367 today, and the shares cost 5. So the ticket costs 5 − 4.367 = 0.633. The odds were never on the meters.
        </>
      }
    >
      <div className="c2-stage">
        <MiniBoard
          rows={1}
          width={300}
          height={210}
          bucketLabels="none"
          ariaLabel="The one-row board; under each future, what the shares-minus-ticket book is worth there"
          nodeLabel={(r, k) => (r === 0 ? ["20", { text: `${f2(h)} shares, owe 1 ticket`, plain: true }] : k === 1 ? ["22", `book ${f2(m.gapUp)}`] : ["18", `book ${f2(m.gapDown)}`])}
          nodeState={(r) => (r === 1 ? (agree ? "lit" : "dim") : undefined)}
          edges={() => ({ opacity: 0.6 })}
        />
        <div className="c2-meters">
          <Meter label={`if 22: ${f2(h)} × 22 − 1`} value={m.gapUp} max={22} lit={agree} />
          <Meter label={`if 18: ${f2(h)} × 18 − 0`} value={m.gapDown} max={22} lit={agree} />
          <div className={"c2-agree " + (agree ? "yes" : "")}>{agree ? "they agree — the book is riskless" : `gap between the meters ${f2(m.spread)} — keep turning`}</div>
        </div>
      </div>

      {next === "price" && (
        <div className="c2-panel">
          {!agree ? (
            <p>Set the dial to 0.25 first — the pricing only works when the two futures are worth the same.</p>
          ) : (
            <table className="table c2-sum">
              <tbody>
                <tr>
                  <td>the book in three months, either way</td>
                  <td className="num">{f2(step.portfolio)}</td>
                </tr>
                <tr>
                  <td>a sure 4.50 in three months, today (discount at 12 %)</td>
                  <td className="num">{f3(step.pv)}</td>
                </tr>
                <tr>
                  <td>what you paid for 0.25 shares today</td>
                  <td className="num">{f2(0.25 * HULL.S0)}</td>
                </tr>
                <tr className="hl">
                  <td>so the ticket is worth 5 − 4.367</td>
                  <td className="num c2-truth">{f3(step.f)}</td>
                </tr>
              </tbody>
            </table>
          )}
          <div className="footnote">You copied the ticket with 0.25 shares and 4.367 of borrowed money; a copy must cost what the original costs, or someone eats the difference.</div>
        </div>
      )}

      {next === "sell" && (
        <div className="c2-panel c2-break">
          <p>
            Someone offers to buy the ticket from you at <span className="num">0.70</span>. Sell it, buy 0.25 shares, borrow the rest: whatever the stock does, you are square in three months — and you pocket{" "}
            <span className="num c2-error">{f3(sell.profit)}</span> per ticket today. On a 10,000-ticket lot that is <span className="num c2-error">{f0(sell.profit * 10000)}</span> of free money.
          </p>
          <div className="footnote">The engine's verdict: {sell.action}. Any price but 0.633 hands this to whoever is holding the dial — which is why the price is what it is.</div>
        </div>
      )}
    </Figure>
  );
}
