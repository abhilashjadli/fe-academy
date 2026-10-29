import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, VLine, type Pt } from "../../../ui/Plot";
import { Readouts, Slider } from "../../../ui/controls";
import { breakEven, callPayoff, positionProfit, profitCurve, strategies } from "../../../engine/options";
import { ATM_K, n0, n2, rowAt, s2 } from "./chain";

const X0 = 21800;
const X1 = 23400;

/** Figure 1 — hotspot ①: the 22,600 call. One knob: where the index ends on expiry day. The payoff draws; two choices appear; the worse one dims. */
export function F1Choice() {
  const row = rowAt(ATM_K);
  const K = row.K;
  const c = row.call;
  const [ST, setST] = useState(K);
  const legs = useMemo(() => strategies.longCall(K, c), [K, c]);
  const be = breakEven("call", K, c);

  const levels = useMemo(() => [X0, K, X1], [K]);
  const payoffAll: Pt[] = levels.map((s) => [s, callPayoff(s, K)]);
  const profitAll: Pt[] = useMemo(() => profitCurve(legs, levels).map((p, i) => [levels[i], p] as Pt), [legs, levels]);
  const drawn: Pt[] = ST <= K ? [[X0, 0], [ST, 0]] : [[X0, 0], [K, 0], [ST, callPayoff(ST, K)]];

  const payoff = callPayoff(ST, K);
  const profit = positionProfit(legs, ST);
  const useIt = ST - K; // what "buy at K, sell at S_T" is worth
  const worse: "use" | "walk" | null = useIt > 0 ? "walk" : useIt < 0 ? "use" : null;

  return (
    <Figure
      n="1"
      prompt={
        <>
          You hold the {n0(K)} call; it cost {n2(c)} a unit. Slide where the index ends on expiry day and watch what the contract is worth.
        </>
      }
      controls={
        <>
          <Slider label="index on expiry day" value={ST} min={X0} max={X1} step={5} onChange={setST} role="truth" fmt={n0} width={220} />
          <Readouts
            items={[
              ["payoff", n2(payoff)],
              [`profit after the ${n2(c)} paid`, s2(profit)],
              ["break-even", n2(be)],
            ]}
          />
        </>
      }
      observe={
        <>
          An option is a paid-for choice you only use when it helps, so its value at the end is a <strong>bent line</strong>: flat at zero, then
          rising one for one. "The index went up" is not enough — it must go up by more than {n2(c)}, past {n2(be)}, before you are ahead.
        </>
      }
    >
      <Plot xDomain={[X0, X1]} yDomain={[-320, 820]} width={600} height={330} xLabel="index on expiry day" yLabel="per unit" xTicks={6} yTicks={5} ariaLabel="Payoff of a long call: zero below the strike, rising one for one above it">
        <VLine at={K} />
        <Curve pts={payoffAll} role="ghost" smooth={false} />
        <Curve pts={profitAll} role="approx" width={1.5} dash="5 4" smooth={false} />
        <Curve pts={drawn} role="truth" width={3} smooth={false} />
        <Marker at={[ST, payoff]} role="truth" r={6} />
        <Marker at={[be, 0]} role="approx" r={4} />
        <Label at={[K, 760]} text={`strike ${n0(K)}`} dx={6} dy={0} />
        <Label at={[be, 0]} text={`break-even ${n2(be)}`} role="approx" dx={8} dy={-10} />
        <Label at={[X1, callPayoff(X1, K) - c]} text="profit" role="approx" anchor="end" dx={-6} dy={18} />
        <Label at={[ST, payoff]} text={n2(payoff)} role="truth" dx={-10} dy={-12} anchor="end" />
      </Plot>
      <div className="c1-choices" aria-live="polite">
        <div className={"c1-choice " + (worse === "use" ? "dim" : "lit")}>
          <span className="c1-choice-k">use it →</span> buy at {n0(K)}, sell at {n0(ST)}: <strong className="num">{s2(useIt)}</strong>
        </div>
        <div className={"c1-choice " + (worse === "walk" ? "dim" : "lit")}>
          <span className="c1-choice-k">walk away →</span> nothing happens: <strong className="num">0.00</strong>
        </div>
        <div className="c1-choice-note">{worse === null ? "a tie — the bend is here" : worse === "use" ? "you walk; the contract is worth 0" : `you use it; the contract is worth ${n2(payoff)}`}</div>
      </div>
    </Figure>
  );
}
