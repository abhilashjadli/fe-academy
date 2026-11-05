import { useMemo, useState } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { Who } from "../../../ui/Comic";
import { Curve, Label, Plot, VLine, usePlot, type Pt } from "../../../ui/Plot";
import { exactMeans, lognormalQuantiles, marketPriceOfRisk, reweight, type GBMWorld } from "../../../engine/measure";
import "./figures.css";

/**
 * Figure 3 — same futures, different weights. 2,000 equally likely year-end prices (exact lognormal quantiles; riskhub's example:
 * S0 = 100, μ = 9 %, σ = 20 %, r = 4 %, T = 1) as a dot histogram. One dial, θ. The dots never move; each dot fattens or thins with its
 * weight, a thin line re-draws the bars, and the needle (discounted weighted mean) lands on 100.00 at θ = 0.25 — Raj's weighting.
 */

const WORLD: GBMWorld = { S0: 100, mu: 0.09, sigma: 0.2, r: 0.04, T: 1 };
const K = 100;
const N = 2000;
const BIN = 5,
  LO = 45,
  HI = 225,
  COLS = 3;
const f2 = format(".2f");
const pct2 = format(".2%");

interface Dot {
  i: number;
  x: number;
  row: number;
}

/** Lay the 2,000 futures out once: bin of width 5, three dot-columns per bin, dots stacked upward. */
function layout(futures: number[]): { dots: Dot[]; counts: number[]; rows: number } {
  const nb = Math.round((HI - LO) / BIN);
  const counts = new Array<number>(nb).fill(0);
  const dots: Dot[] = [];
  for (let i = 0; i < futures.length; i++) {
    const b = Math.max(0, Math.min(nb - 1, Math.floor((futures[i] - LO) / BIN)));
    const k = counts[b]++;
    dots.push({ i, x: LO + b * BIN + ((k % COLS) + 0.5) * (BIN / COLS), row: Math.floor(k / COLS) });
  }
  return { dots, counts, rows: Math.ceil(Math.max(...counts) / COLS) };
}

function Dots({ dots, weights }: { dots: Dot[]; weights: number[] }) {
  const { x, y, inner } = usePlot();
  const pitchX = inner.width / ((HI - LO) / BIN) / COLS;
  const pitchY = inner.height / (y.domain()[1] - y.domain()[0]);
  const base = Math.max(1.2, Math.min(2.2, Math.min(pitchX, pitchY) * 0.45));
  return (
    <g className="b5-dots">
      {dots.map((d) => {
        const w = weights[d.i];
        const s = Math.max(0.45, Math.min(1.6, Math.sqrt(w)));
        return <circle key={d.i} className="dot" cx={x(d.x)} cy={y(d.row + 0.5)} r={base * s} style={{ opacity: Math.max(0.08, Math.min(1, 0.12 + 0.6 * w)) }} />;
      })}
    </g>
  );
}

export function F3Weights() {
  const [theta, setTheta] = useState(0);
  const futures = useMemo(() => lognormalQuantiles(WORLD, N), []);
  const lay = useMemo(() => layout(futures), [futures]);
  const rw = useMemo(() => reweight(WORLD, futures, theta, K, 80), [futures, theta]);
  const raw = useMemo(() => rw.weights.map((w) => w * N), [rw]); // ≈ the un-normalised tilt: 1.40 at 80, 1.06 at 100, 0.80 at 125 when θ = 0.25
  const exact = useMemo(() => exactMeans(WORLD, K), []);
  const thetaRaj = marketPriceOfRisk(WORLD); // 0.25
  const isPriya = Math.abs(theta) < 1e-9;
  const isRaj = Math.abs(theta - thetaRaj) < 0.005;

  // the thin line: re-weighted bar heights, in dot-rows
  const outline = useMemo(() => {
    const nb = lay.counts.length;
    const acc = new Array<number>(nb).fill(0);
    for (const d of lay.dots) acc[Math.floor((d.x - LO) / BIN)] += raw[d.i];
    const pts: Pt[] = [];
    for (let b = 0; b < nb; b++) {
      const h = acc[b] / COLS;
      pts.push([LO + b * BIN, h], [LO + (b + 1) * BIN, h]);
    }
    return pts;
  }, [lay, raw]);

  return (
    <Figure
      n="3"
      prompt={
        <>
          A stock at <strong>100</strong>. One year on, 2,000 equally likely futures — laid out once (not real data: 9 % expected return, 20 % wobble, 4 % interest) and never redrawn. A ticket pays what the stock is above 100. Turn θ: the dots stay put; their weights change.
        </>
      }
      controls={<Slider label="the tilt θ" value={theta} min={0} max={0.5} step={0.01} onChange={setTheta} role="error" fmt={f2} width={140} />}
      observe={
        <>
          The dots never move. At θ = 0.25 the needle reads 100.00 — the only setting at which the stock is a fair bet after interest — and the ticket reads 9.93, Black–Scholes' {f2(exact.callQ)}. The spread of log-returns stays {f2(rw.logSd)} at every θ. The drift moved; the wobble did not.
        </>
      }
    >
      <div className="b5-stage b5-stage-col">
        <div className="b5-who-row">
          <span className={"b5-chip " + (isPriya ? "on" : "")}>
            <Who name="Priya" mood="happy" />
            <span className={isPriya ? "b5-priya" : ""}>θ = 0 — every future counts once: her forecast</span>
          </span>
          <span className={"b5-chip " + (isRaj ? "on" : "")}>
            <Who name="Raj" />
            <span className={isRaj ? "b5-raj" : ""}>θ = 0.25 — the low futures count more: his book</span>
          </span>
        </div>
        <Plot xDomain={[LO, HI]} yDomain={[0, lay.rows + 9]} width={640} height={400} xLabel="the stock in one year" yTicks={0} grid={false} ariaLabel="2,000 futures as a dot histogram; a thin line shows the re-weighted bars and a needle the discounted weighted average">
          <Dots dots={lay.dots} weights={raw} />
          <Curve pts={outline} role="error" width={1.5} smooth={false} />
          <VLine at={100} />
          {/* left of the 100 line and above the dots, so it never sits on the needle (which lands on 100 at θ = 0.25) */}
          <Label at={[100, lay.rows + 3]} text="100 = fair after interest" anchor="end" dx={-5} dy={0} />
          <VLine at={80} />
          <Label at={[80, lay.rows * 0.92]} text="80: a 20 % fall" anchor="end" dx={-5} dy={0} />
          <VLine at={rw.discountedMean} role={isPriya ? "truth" : "error"} />
          <Label at={[rw.discountedMean, lay.rows + 7.5]} text={`needle ${f2(rw.discountedMean)}`} role={isPriya ? "truth" : "error"} dx={6} dy={4} />
        </Plot>
        <Readouts
          items={[
            [
              "needle: discounted average of the futures",
              <span key="needle" className={isPriya ? "b5-priya" : "b5-raj"}>
                {f2(rw.discountedMean)}
              </span>,
            ],
            ["the ticket (discounted, re-weighted)", f2(rw.call)],
            ["weight on a 20 % fall, P(S < 80)", pct2(rw.pBelow)],
          ]}
        />
      </div>
      <details className="b5-more">
        <summary>What the dial does to one dot</summary>
        <p>
          Each future gets the weight 1.06 × (S / 100)^(−θ / 0.2) when θ = 0.25: about 1.40 at 80, 1.06 at 100, 0.80 at 125. The weights average to 1 over the 2,000 dots, so the dial moves weight from the high futures to the low ones without adding any — the same exchange rate as Figure 2's Z, with 2,000 futures instead of two. θ = (9 % − 4 %) / 20 % is the one setting that makes a share, held for a year, a fair bet after interest.
        </p>
      </details>
    </Figure>
  );
}
