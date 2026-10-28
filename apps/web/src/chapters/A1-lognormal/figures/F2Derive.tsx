import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Timeline, type Segment } from "../../../ui/Timeline";
import { Curve, Marker, Plot, Label, usePlot } from "../../../ui/Plot";
import { M } from "../../../ui/Math";
import { rng } from "../../../engine/random";

/** Why multiplying becomes adding — and why Mel's typical year is worse than her average one. (v1 figure, kept as the collapsed "watch the derivation" option under Figure 2.) */
export function F2Derive() {
  return (
    <Figure n="2" prompt="Why multiplying becomes adding — and where Mel's missing 1.24 went.">
      <F2DeriveTimeline />
    </Figure>
  );
}

/** The narrated timeline on its own, so Figure 2 can fold it under the ledger. */
export function F2DeriveTimeline() {
  const flips = useMemo(() => {
    const r = rng(9);
    return Array.from({ length: 24 }, () => (r() < 0.5 ? 1 : -1));
  }, []);
  const upLog = Math.log(1.01),
    dnLog = Math.log(0.99);
  const segments: Segment[] = [
    { duration: 9, caption: "Mel's balance after a year is her starting 100 multiplied by 250 factors, each either 1.01 or 0.99. Here are the first twenty-four of them as bars around 1. Multiplying 250 things together is hard to reason about — a sum of many small random steps makes a bell (that was chapter 0.2), but this is a product, not a sum." },
    { duration: 10, caption: "Take the logarithm of everything. A logarithm turns multiplication into addition: the log of the product is the sum of the logs. So log of Mel's balance equals log 100 plus a sum of 250 small random numbers — and sums of small random things make a bell — that was the whole of chapter 0.2." },
    { duration: 9, caption: "That is the whole reason: the logarithm of Mel's balance is normal, so Mel's balance is called lognormal. Ada's balance is a sum from the start, so it is normal without any help." },
    { duration: 12, caption: "Now look closely at the two logs. Log of 1.01 is plus 0.00995. Log of 0.99 is minus 0.01005. The down-step is a little bigger than the up-step. The Taylor series of chapter 0.1 says why: log of one plus r is r minus r squared over two, plus smaller terms — and the r squared over two is subtracted whichever way the coin falls." },
    { duration: 12, caption: "Each toss, win or lose, costs Mel a tiny amount: half of 1 % squared, which is 0.005 % — nothing. But she pays it 250 times, so by year end her typical balance is 98.76, not 100. Her average is still 100, because a few lucky years are very lucky. Traders call this volatility drag." },
    { duration: 7, caption: "To sum up: multiplying becomes adding under a logarithm; adding makes a bell; and the second-order term of the logarithm quietly taxes every wobble. The next figure shows the lognormal curve itself." },
  ];

  return (
    <Timeline
        segments={segments}
        render={(_t, i, u) => (
          <div className="two" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
            <div>
              <Plot xDomain={[0, 25]} yDomain={i === 0 ? [0.97, 1.03] : i <= 2 ? [-0.03, 0.03] : [-0.0102, 0.0102]} xLabel="day" yLabel={i === 0 ? "factor" : "log of factor"} width={440} height={260} xTicks={5} yTicks={4} ariaLabel="Daily factors, then their logarithms">
                <FactorBars flips={flips} mode={i === 0 ? "factor" : "log"} morph={i === 1 ? u : 1} zoom={i >= 3} />
                {i >= 3 && (
                  <>
                    <Label at={[24.5, upLog]} text="+0.00995" role="truth" anchor="end" dy={-6} />
                    <Label at={[24.5, dnLog]} text="−0.01005" role="error" anchor="end" dy={14} />
                  </>
                )}
              </Plot>
              {i >= 3 && <SmallGap u={i === 3 ? u : 1} />}
            </div>
            <div style={{ padding: "0.5rem 0.25rem", fontSize: "0.9em" }}>
              {i === 0 && (<><M block tex="\text{Mel}_{250} = 100 \cdot \tok{approx}{(1+r_1)\cdots(1+r_{250})}" /><M block tex="r_i = \pm 0.01" /></>)}
              {i === 1 && (
                <>
                  <M block tex="\log \text{Mel}_{250} = \log 100 + \tok{approx}{\textstyle\sum_{i=1}^{250} \log(1+r_i)}" />
                  <M block tex="\text{250 small random terms} \Rightarrow \text{a bell (0.2)}" className={u > 0.5 ? "eq-live" : "eq-dim"} />
                </>
              )}
              {i === 2 && (
                <>
                  <M block tex="\log \text{Mel} \sim \text{Normal} \quad\Longleftrightarrow\quad \text{Mel} \sim \textbf{Lognormal}" />
                  <M block tex="\text{Ada}_{250} = 100 + \tok{truth}{s_1 + s_2 + \cdots + s_{250}} \sim \text{Normal}" />
                </>
              )}
              {i === 3 && (
                <>
                  <M block tex="\log(1.01) = +0.00995 \qquad \log(0.99) = -0.01005" />
                  <M block tex="\log(1+r) = r - \tok{error}{\tfrac{r^2}{2}} + \tfrac{r^3}{3} - \cdots" className={u > 0.4 ? "eq-live" : "eq-dim"} />
                </>
              )}
              {i === 4 && (
                <>
                  <M block tex="\mathbb{E}[\log(1+r)] \approx \mathbb{E}[r] - \tfrac12\mathbb{E}[r^2]" /><M block tex="= -\tfrac12(0.01)^2 = -0.00005" />
                  <M block tex="250 \times (-0.00005) = -0.0125" className={u > 0.35 ? "eq-live" : "eq-dim"} /><M block tex="\text{median} = 100\,e^{-0.0125} = 98.76,\; \text{mean} = 100" className={u > 0.35 ? "eq-live" : "eq-dim"} />
                  <M block tex="(1.01 \cdot 0.99)^{125} = 0.9999^{125} = 0.98758" className={u > 0.7 ? "eq-live" : "eq-dim"} />
                </>
              )}
              {i === 5 && (
                <>
                  <M block tex="\text{product} \xrightarrow{\;\log\;} \text{sum} \xrightarrow{\;0.2\;} \text{bell}" />
                  <M block tex="\text{drag per step} \approx -\tfrac12\,\sigma^2" />
                </>
              )}
            </div>
          </div>
        )}
      />
  );
}

function FactorBars({ flips, mode, morph, zoom }: { flips: number[]; mode: "factor" | "log"; morph: number; zoom: boolean }) {
  const { x, y } = usePlot();
  return (
    <g>
      {flips.map((f, i) => {
        const factor = f > 0 ? 1.01 : 0.99;
        const lg = Math.log(factor);
        // morph from factor-around-1 to log-around-0 (both drawn as deviation bars)
        const v = mode === "factor" ? factor - 1 : (1 - morph) * (factor - 1) + morph * lg;
        const base = mode === "factor" ? 1 : 0;
        const top = base + v;
        const yb = y(base),
          yt = y(top);
        const role = f > 0 ? "truth" : "error";
        return <rect key={i} className={`marker ${role}`} x={x(i + 0.6)} y={Math.min(yb, yt)} width={x(i + 1.4) - x(i + 0.6)} height={Math.abs(yb - yt)} style={{ opacity: zoom ? 0.9 : 0.8, stroke: "none" }} />;
      })}
    </g>
  );
}

/** Zoomed view: log(1+r) vs r near 0 with the gap r²/2 highlighted. */
function SmallGap({ u }: { u: number }) {
  const pts = useMemo(() => {
    const a: Array<[number, number]> = [],
      b: Array<[number, number]> = [];
    for (let i = 0; i <= 80; i++) {
      const r = -0.3 + (0.6 * i) / 80;
      a.push([r, r]);
      b.push([r, Math.log(1 + r)]);
    }
    return { line: a, log: b };
  }, []);
  return (
    <Plot xDomain={[-0.3, 0.3]} yDomain={[-0.4, 0.3]} xLabel="r" width={440} height={170} xTicks={4} yTicks={3} margin={{ top: 8, right: 10, bottom: 26, left: 36 }} ariaLabel="log(1+r) lies below r">
      <Curve pts={pts.line} role="ghost" dash="4 3" smooth={false} />
      <Curve pts={pts.log} role="approx" opacity={u} />
      <Marker at={[0.01, Math.log(1.01)]} role="truth" r={3} />
      <Marker at={[-0.01, Math.log(0.99)]} role="error" r={3} />
      <Label at={[0.28, 0.28]} text="r" role="ghost" dy={-4} anchor="end" dx={-4} />
      <Label at={[0.28, Math.log(1.28)]} text="log(1 + r), always below" role="approx" dy={16} anchor="end" dx={-4} />
    </Plot>
  );
}
