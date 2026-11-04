import { useMemo } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Avatar, Says } from "../../../ui/Comic";
import { Curve, Plot, type Pt } from "../../../ui/Plot";
import { normalSample, rng } from "../../../engine/random";
import { girsanovDrift, marketPriceOfRisk, radonNikodym, tailProbabilities, type GBMWorld } from "../../../engine/measure";
import "./figures.css";

/**
 * Figure 4 — illustrated text, no controls. Twenty paths of the same stock, drawn twice: under Priya's weighting every path counts once;
 * under Raj's each path is drawn with its weight Z = exp(−θW_T − ½θ²T) as opacity — the same twenty lines, the low ones darker.
 * Girsanov in one sentence, then the break: option-implied probabilities are prices, not forecasts (11.2 % vs 7.1 % for a 20 % fall).
 */

const WORLD: GBMWorld = { S0: 100, mu: 0.09, sigma: 0.2, r: 0.04, T: 1 };
const PATHS = 20,
  STEPS = 52,
  SEED = 1105;
const pct0 = format(".0%");
const pct1 = format(".1%");
const f2 = format(".2f");

/** Twenty GBM paths from a fixed seed (exact log-Euler), each with its Brownian endpoint W_T. */
function paths(): { pts: Pt[]; WT: number }[] {
  const next = rng(SEED);
  const dt = WORLD.T / STEPS;
  const out: { pts: Pt[]; WT: number }[] = [];
  for (let p = 0; p < PATHS; p++) {
    const pts: Pt[] = [[0, WORLD.S0]];
    let W = 0,
      S = WORLD.S0;
    for (let i = 1; i <= STEPS; i++) {
      const dW = Math.sqrt(dt) * normalSample(next);
      W += dW;
      S *= Math.exp((WORLD.mu - 0.5 * WORLD.sigma * WORLD.sigma) * dt + WORLD.sigma * dW);
      pts.push([i * dt, S]);
    }
    out.push({ pts, WT: W });
  }
  return out;
}

function Pane({ who, mood, drift, weights, lines }: { who: "Priya" | "Raj"; mood: "happy" | "neutral"; drift: number; weights: number[]; lines: Pt[][] }) {
  const role = who === "Priya" ? "truth" : "error";
  return (
    <div className="b5-paths">
      <div className="pane-head">
        <Avatar name={who} mood={mood} size={28} />
        <span>
          <span className={who === "Priya" ? "b5-priya" : "b5-raj"}>{who}'s weighting</span> — drift <span className="num">{pct0(drift)}</span>, wobble <span className="num">{pct0(WORLD.sigma)}</span>
        </span>
      </div>
      <Plot xDomain={[0, 1]} yDomain={[50, 180]} width={360} height={240} xTicks={4} yTicks={4} xLabel="years" ariaLabel={`The same twenty paths, each drawn as dark as its weight under ${who}`}>
        {lines.map((pts, i) => (
          <Curve key={i} pts={pts} role={role} width={1 + 0.9 * weights[i]} opacity={Math.max(0.15, Math.min(1, 0.62 * weights[i]))} smooth={false} />
        ))}
      </Plot>
    </div>
  );
}

export function F4Girsanov() {
  const theta = marketPriceOfRisk(WORLD); // 0.25
  const ps = useMemo(() => paths(), []);
  const lines = useMemo(() => ps.map((p) => p.pts), [ps]);
  const priya = useMemo(() => ps.map(() => 1), [ps]);
  const raj = useMemo(() => ps.map((p) => radonNikodym(theta, p.WT, WORLD.T)), [ps, theta]);
  const tail = tailProbabilities(WORLD, 80); // P 7.14 %, Q 11.20 %
  const rajDrift = girsanovDrift(WORLD.mu, WORLD.sigma, theta); // 4 %

  return (
    <Figure
      n="4"
      prompt={<>The same twenty year-long paths of the stock, drawn twice — once with every path counting equally, once with each path as dark as Raj's weight on it.</>}
      observe={
        <>
          Changing the weights re-colours the paths; it does not add, remove or re-shape one. The low paths get darker under Raj, so the drift falls from {pct0(WORLD.mu)} to {pct0(rajDrift)} — and the wobble stays {pct0(WORLD.sigma)}, because the same wobbles are all still there.
        </>
      }
    >
      <div className="b5-twice">
        <Pane who="Priya" mood="happy" drift={WORLD.mu} weights={priya} lines={lines} />
        <Pane who="Raj" mood="neutral" drift={rajDrift} weights={raj} lines={lines} />
      </div>
      <p className="b5-caption">
        A change of measure does not change which paths are possible or how jumpy they are; it changes how much each path counts. Under Raj's weights the same Brownian wobble, with a steady lean of θ = {f2(theta)} a year added to it, is again a fair coin — so the stock's drift is {pct0(WORLD.mu)} to Priya and {pct0(rajDrift)} to Raj, with one and the same wobble. <span className="src">(Girsanov's theorem; Shreve, Stochastic Calculus for Finance II, §5.2.)</span>
      </p>
      <div className="b5-break">
        <Says who="Priya" mood="surprised">
          So the market thinks a 20 % fall is {pct0(tail.Q)} likely?
        </Says>
        <Says who="Raj" mood="neutral">
          Ask her, not me. {pct1(tail.Q)} is my weight; her forecast is {pct1(tail.P)}. I set prices. She predicts.
        </Says>
      </div>
    </Figure>
  );
}
