import { useMemo, useState } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Toggle } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, Points, type Pt } from "../../../ui/Plot";
import { backwardGrid, bsTarget, heatExact, heatGrid, heatMonteCarlo, monteCarloOption, optionPayoffInX, stepTooFar } from "../../../engine/feynmankac";
import { rng } from "../../../engine/random";
import "./figures.css";

/**
 * Figure 4 — break it: the x² exact check. Off: Hull's option, where grid and walkers agree to the bracket but nobody can check by hand.
 * Toggle: payoff = x², no interest, no drift, unit wobble — the one case a fresher can compute (0.5² + 1 = 1.25). The grid prints
 * 1.25000; the walkers are honest to ±0.01. Second toggle, one sentence: push the time step too far and the weights go negative.
 */

const P = { S: 42, K: 40, r: 0.1, sigma: 0.2, T: 0.5 };
const N_GRID = 100;
const DX_FACTOR = 1.5;
const K0 = N_GRID;
const HEAT = { x: 0.5, tau: 1, steps: 20, N: 20000, seed: 5 };
const ROD_STEPS = 40;
const f2 = format(".2f");
const f4 = format(".4f");
const f5 = format(".5f");
const f3 = format(".3f");
const fn = format(",");

export function F4Check() {
  const [exact, setExact] = useState(false);
  const [tooFar, setTooFar] = useState(false);

  // Hull's option: today's profile from the grid, the walkers at 10,000, the formula
  const hull = useMemo(() => {
    const dt = P.T / N_GRID;
    const g = backwardGrid({ drift: P.r - 0.5 * P.sigma * P.sigma, vol: P.sigma, rate: P.r, x0: Math.log(P.S), T: 2 * P.T, steps: K0 + N_GRID, dx: P.sigma * Math.sqrt(DX_FACTOR * dt), payoff: optionPayoffInX("call", P.K) });
    const profile: Pt[] = g.layers[K0].map((v, j) => [Math.exp(g.xAt(K0, j)), v] as Pt).filter((p) => p[0] >= 24 && p[0] <= 66);
    const payoff: Pt[] = [[24, 0], [P.K, 0], [66, 66 - P.K]];
    return { value: g.layers[K0][K0], profile, payoff, mc: monteCarloOption(P.S, P.K, P.r, P.sigma, P.T, 10000, rng(26)), bs: bsTarget(P.S, P.K, P.r, P.sigma, P.T) };
  }, []);

  // the x² case: hand, grid (one cell per start point, so the profile is a row of grid answers), walkers
  const heat = useMemo(() => {
    const hand = heatExact(HEAT.x, HEAT.tau);
    const grid = heatGrid(HEAT.x, HEAT.tau, HEAT.steps).value;
    const xs = Array.from({ length: 41 }, (_, i) => -2 + i * 0.1);
    const gridRow: Pt[] = xs.map((x) => [x, heatGrid(x, HEAT.tau, HEAT.steps).value]);
    const exactCurve: Pt[] = xs.map((x) => [x, heatExact(x, HEAT.tau)]);
    const payoff: Pt[] = xs.map((x) => [x, x * x]);
    const mc = heatMonteCarlo(HEAT.x, HEAT.tau, HEAT.N, rng(HEAT.seed));
    return { hand, grid, gridRow, exactCurve, payoff, mc };
  }, []);

  // the step too far: the |x| rod cooled with λ = ½ (smooth) and λ = ¾ (oscillating)
  const rod = useMemo(() => {
    const r = stepTooFar(ROD_STEPS, 1 / 3, 0.75); // λ = ⅓: three equal doors; λ = ¾: a negative middle weight
    const half = Math.floor(ROD_STEPS / 2);
    const okPts: Pt[] = r.okProfile.map((v, j) => [r.ok.xAt(half, j), v]);
    const badPts: Pt[] = r.badProfile.map((v, j) => [r.bad.xAt(half, j), v]);
    const maxBad = Math.max(...r.badProfile.map(Math.abs));
    const maxOk = Math.max(...r.okProfile.map(Math.abs));
    return { ...r, okPts, badPts, maxBad, maxOk };
  }, []);

  const mcHeat = heat.mc;

  return (
    <Figure
      n="4"
      prompt={<>Grid and walkers agree to the bracket — but which of them is right to the fourth decimal? Switch to the one case you can check by hand.</>}
      controls={
        <>
          <Toggle label="payoff = x², no interest, no drift, unit wobble" on={exact} onChange={setExact} />
          <Toggle label="push the grid's time step too far" on={tooFar} onChange={setTooFar} />
        </>
      }
      observe={
        tooFar ? (
          <>
            Too big a step and one of the three weights goes negative: the rod swings instead of cooling, {rod.badSignChanges} sign changes instead of {rod.okSignChanges}. The grid is stable <strong>because</strong> its weights are probabilities — three doors, each a real chance.
          </>
        ) : exact ? (
          <>
            By hand: {f2(HEAT.x)}² + {HEAT.tau} = {f2(heat.hand)}. The grid prints {f5(heat.grid)} — exact to every decimal, at any resolution. The walkers are honest to ±{f2(mcHeat.se)}. The equality is not approximate; only one side is noisy.
          </>
        ) : (
          <>
            Grid {f4(hull.value)}, walkers {f2(hull.mc.mean)} ± {f2(hull.mc.se)}, formula {f4(hull.bs)}. Inside the bracket, yes — but you cannot do Hull's option in your head. Flip the first switch.
          </>
        )
      }
    >
      <div className="b6-check">
        {tooFar ? (
          <Plot xDomain={[-3, 3]} yDomain={[-1, 4]} width={560} height={300} xLabel="position on the rod" yLabel="temperature" xTicks={6} ariaLabel="A kinked rod cooled half-way: smooth with weights that are probabilities, wildly oscillating with a negative middle weight">
            <Curve pts={rod.badPts} role="error" width={1.6} smooth={false} />
            <Curve pts={rod.okPts} role="truth" width={2.2} smooth={false} />
          </Plot>
        ) : exact ? (
          <Plot xDomain={[-2, 2]} yDomain={[0, 5]} width={560} height={300} xLabel="start x" yLabel="value" xTicks={5} ariaLabel="The payoff x², the grid's answers for every start point lying exactly on x² + 1, and the walkers' bracket at x = 0.5">
            <Curve pts={heat.payoff} role="error" width={1.2} dash="4 3" />
            <Label at={[1.6, 1.6 * 1.6]} text="payoff x²" role="error" dx={-30} dy={16} />
            <Curve pts={heat.exactCurve} role="truth" width={1.4} dash="2 3" />
            <Points pts={heat.gridRow} role="truth" r={3} opacity={0.95} />
            <Label at={[-1.4, 1.4 * 1.4 + 1]} text="grid answers, every start point: x² + 1" role="truth" dx={10} dy={2} />
            <Curve pts={[[HEAT.x, mcHeat.mean - mcHeat.se], [HEAT.x, mcHeat.mean + mcHeat.se]]} role="approx" width={6} smooth={false} opacity={0.6} />
            <Marker at={[HEAT.x, mcHeat.mean]} role="approx" r={4} />
            <Marker at={[HEAT.x, heat.grid]} role="truth" r={5} />
            <Label at={[HEAT.x, heat.grid]} text={`grid ${f5(heat.grid)}`} role="truth" dx={12} dy={-8} />
            <Label at={[HEAT.x, mcHeat.mean]} text={`walkers ${f4(mcHeat.mean)} ± ${f4(mcHeat.se)}`} role="approx" dx={12} dy={14} />
          </Plot>
        ) : (
          <Plot xDomain={[24, 66]} yDomain={[0, 28]} width={560} height={300} xLabel="price today" yLabel="value" xTicks={7} ariaLabel="Hull's option: the grid's smooth curve today over the payoff, with the walkers' bracket at 42">
            <Curve pts={hull.payoff} role="error" width={1.2} dash="4 3" smooth={false} />
            <Label at={[60, 20]} text="payoff" role="error" dx={6} dy={8} />
            <Curve pts={hull.profile} role="truth" width={2} smooth={false} />
            <Curve pts={[[P.S, hull.mc.mean - hull.mc.se], [P.S, hull.mc.mean + hull.mc.se]]} role="approx" width={6} smooth={false} opacity={0.6} />
            <Marker at={[P.S, hull.mc.mean]} role="approx" r={4} />
            <Marker at={[P.S, hull.value]} role="truth" r={5} />
            <Label at={[P.S, hull.value]} text={`grid ${f4(hull.value)}`} role="truth" dx={10} dy={-6} />
            <Label at={[P.S, hull.mc.mean]} text={`walkers ${f2(hull.mc.mean)} ± ${f2(hull.mc.se)}`} role="approx" dx={10} dy={12} />
          </Plot>
        )}
        <div className="b6-check-side">
          {tooFar ? (
            <div className="b6-box">
              <div className="b6-cell">
                <span className="k">the three weights · step too far (red)</span>
                <span className="v">
                  {f3(rod.bad.phi.up)} / <span className="b6-error">{f3(rod.bad.phi.mid)}</span> / {f3(rod.bad.phi.down)}
                </span>
                <span className="k">
                  a sane step (blue): {f3(rod.ok.phi.up)} / {f3(rod.ok.phi.mid)} / {f3(rod.ok.phi.down)}
                </span>
              </div>
              <div className="b6-cell">
                <span className="k">swings of the rod · blue vs red</span>
                <span className="v">
                  {rod.okSignChanges} <small>vs</small> <span className="b6-error">{rod.badSignChanges}</span>
                </span>
              </div>
              <div className="b6-cell">
                <span className="k">largest |temperature| · blue vs red</span>
                <span className="v">
                  {f2(rod.maxOk)} <small>vs</small> <span className="b6-error">{fn(Math.round(rod.maxBad))}</span>
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className={"b6-hand " + (exact ? "" : "")}>
                {exact ? (
                  <>
                    Start at x = {f2(HEAT.x)} with {HEAT.tau} unit of time left. The value is the payoff plus the time left: <span className="num">{f2(HEAT.x)}² + {HEAT.tau} = {f2(heat.hand)}</span>. You just did it.
                  </>
                ) : (
                  <>Hull's option has no arithmetic you can do in your head. The formula that gives {f4(hull.bs)} is chapter C3's.</>
                )}
              </div>
              <div className="b6-box">
                <div className="b6-cell">
                  <span className="k">by hand</span>
                  <span className="v">{exact ? f2(heat.hand) : <small>not yet</small>}</span>
                </div>
                <div className="b6-cell truth">
                  <span className="k">grid · {exact ? `${HEAT.steps} steps` : `${N_GRID} columns`}</span>
                  <span className="v">{exact ? f5(heat.grid) : f4(hull.value)}</span>
                </div>
                <div className="b6-cell approx">
                  <span className="k">walkers · {fn(exact ? HEAT.N : hull.mc.N)} futures</span>
                  <span className="v">
                    {exact ? f4(mcHeat.mean) : f4(hull.mc.mean)} <small>± {exact ? f4(mcHeat.se) : f4(hull.mc.se)}</small>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Figure>
  );
}
