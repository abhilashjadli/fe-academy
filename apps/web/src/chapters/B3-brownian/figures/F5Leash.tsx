import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, HLine, Label, Marker, Plot, VLine, type Pt } from "../../../ui/Plot";
import { Readouts, Segmented, Toggle } from "../../../ui/controls";
import { ouEuler, ouEulerGapFactor, ouEulerStable, ouEulerStationarySd, ouHalfLife, ouMean, ouPath, ouStationarySd } from "../../../engine/brownian";
import { rng } from "../../../engine/random";
import { KEY, n2, pctSp, useNarrow } from "./b3";
import "./figures.css";

/**
 * Figure 5 — the leash, and the clock that was too coarse. A dot on an elastic leash to a post at 4 %: dX = κ(θ − X)dt + σ dW with
 * κ = 2 (fixed — the break is the clock, not the pull), σ = 1 % a year. The fan stops widening at σ/√(2κ) = 0.500 %. Kick it to 6 %
 * and the expected path decays home with half-life ln 2/κ = 0.35 years. The one dial is the clock tick used to simulate it: exact
 * steps (e^{−κΔ}) and stepped (Euler, 1 − κΔ) paths share the same random numbers. At κΔ = 1 the stepped path forgets its start in
 * one step; between 1 and 2 it overshoots; at κΔ ≥ 2 its spread grows without limit while the exact path sits still.
 */

const THETA = KEY.ou.theta,
  SIGMA = KEY.ou.sigma,
  KAPPA = 2,
  HORIZON = 10,
  N_PATHS = 300,
  SHOWN = 36,
  SEED = 777;
const TICKS = KEY.ou.euler.map((e) => e.dt); // 0.10, 0.25, 0.50, 0.75, 1.00, 1.10
const P = 100; // drawn in percent

export function F5Leash() {
  const [tick, setTick] = useState(TICKS[0]);
  const [kick, setKick] = useState(false);
  const narrow = useNarrow();
  const x0 = kick ? 0.06 : THETA;
  const n = Math.round(HORIZON / tick);
  const stable = ouEulerStable(KAPPA, tick);
  const sdExact = ouStationarySd(KAPPA, SIGMA);
  const sdEuler = ouEulerStationarySd(KAPPA, SIGMA, tick);
  const half = ouHalfLife(KAPPA);
  const gap = ouEulerGapFactor(KAPPA, tick); // the stepped gap to the post is multiplied by this each step

  const sim = useMemo(() => {
    const exact: Pt[][] = [],
      euler: Pt[][] = [];
    let spreadExact = 0,
      spreadEuler = 0,
      blew = 0;
    for (let i = 0; i < N_PATHS; i++) {
      const a = ouPath(x0, KAPPA, THETA, SIGMA, n, n * tick, rng(SEED + i));
      const b = ouEuler(x0, KAPPA, THETA, SIGMA, n, tick, rng(SEED + i)); // the same jostles
      const ea = a.W[n] - THETA,
        eb = b.W[n] - THETA;
      spreadExact += ea * ea;
      spreadEuler += eb * eb;
      if (Math.abs(eb) > 0.5) blew++;
      if (i < SHOWN) {
        exact.push(a.t.map((t, k) => [t, P * a.W[k]] as Pt));
        euler.push(b.t.map((t, k) => [t, P * b.W[k]] as Pt));
      }
    }
    return { exact, euler, sdEndExact: Math.sqrt(spreadExact / N_PATHS), sdEndEuler: Math.sqrt(spreadEuler / N_PATHS), blew };
  }, [x0, n, tick]);

  const meanPts: Pt[] = Array.from({ length: 81 }, (_, i) => {
    const t = (i * HORIZON) / 80;
    return [t, P * ouMean(x0, KAPPA, THETA, t)];
  });
  const yDomain: [number, number] = stable ? [P * 0.01, P * 0.08] : [-P * 0.1, P * 0.18];
  const eulerRole = stable ? "approx" : "error";

  return (
    <Figure
      n="5"
      prompt={<>A dot on an elastic leash to a post at 4 % (simulated). Kick it, then change the clock tick the simulation uses — exact steps and stepped ones share the same random numbers.</>}
      controls={
        <>
          <Segmented label="clock tick, years" options={TICKS.map((d) => ({ id: String(d), label: n2(d) }))} value={String(tick)} onChange={(v) => setTick(parseFloat(v))} />
          <Toggle label="kick it to 6 %" on={kick} onChange={setKick} />
          <Readouts
            items={[
              ["pull × tick", <span className={stable ? "" : "b3-error"}>{n2(KAPPA * tick)}</span>],
              [
                "long-run spread, exact vs stepped",
                <>
                  <span className="b3-truth">{pctSp(sdExact, 3)}</span> vs <span className={stable ? "b3-approx" : "b3-error"}>{Number.isFinite(sdEuler) ? pctSp(sdEuler, 3) : "grows without limit"}</span>
                </>,
              ],
              ["half-life of a kick", `${n2(half)} years ≈ ${Math.round(half * 12 * 10) / 10} months`],
            ]}
          />
        </>
      }
      observe={
        !stable ? (
          <>
            Pull × tick is {n2(KAPPA * tick)}, so each stepped move multiplies the gap to the post by {n2(gap)}:{" "}
            {Math.abs(gap) > 1
              ? "it overshoots by more than the whole gap, the gap grows every step, and the red paths leave the frame"
              : "the gap flips sign every step and never shrinks, so the red spread grows like a random walk's, without limit"}{" "}
            while the blue ones sit at ±{pctSp(sdExact, 1)}. <strong>The leash is fine; the clock was too coarse.</strong>
          </>
        ) : KAPPA * tick >= 1 ? (
          <>
            Pull × tick is {n2(KAPPA * tick)}: {KAPPA * tick === 1 ? "the stepped path forgets where it started in a single step" : "the stepped path overshoots the post every step"}
            , and its long-run spread is {pctSp(sdEuler, 3)} against the exact {pctSp(sdExact, 3)}. The leash's strength has not changed — only how often the simulation looks at it.
          </>
        ) : (
          <>
            The fan stops widening: a leash with pull 2 and wobble 1 % a year holds the dot within about ±{pctSp(sdExact, 1)} of the post, for ever, instead of spreading like √t. A kick
            decays home with a half-life of {n2(half)} years. The stepped path, at this tick, is a little too loose ({pctSp(sdEuler, 3)} vs {pctSp(sdExact, 3)}).
          </>
        )
      }
    >
      <div className="b3-leash">
        <Plot xDomain={[0, HORIZON]} yDomain={yDomain} width={narrow ? 380 : 760} height={narrow ? 260 : 340} xLabel="years" yLabel="%" xTicks={5} yTicks={5} ariaLabel="Mean-reverting paths: exact and stepped simulations from the same random numbers, with the post, its long-run band and the half-life of a kick" axisY={yDomain[0]}>
          <HLine at={P * THETA} />
          <Curve pts={[[0, P * (THETA + 2 * sdExact)], [HORIZON, P * (THETA + 2 * sdExact)]]} role="ghost" dash="4 3" width={1} smooth={false} />
          <Curve pts={[[0, P * (THETA - 2 * sdExact)], [HORIZON, P * (THETA - 2 * sdExact)]]} role="ghost" dash="4 3" width={1} smooth={false} />
          {sim.exact.map((c, i) => (
            <Curve key={"x" + i} pts={c} role="truth" width={0.9} opacity={0.45} smooth={false} />
          ))}
          {sim.euler.map((c, i) => (
            <Curve key={"e" + i} pts={c} role={eulerRole} width={0.9} opacity={0.4} smooth={false} />
          ))}
          {kick && <Curve pts={meanPts} role="ink" width={2.2} smooth={false} />}
          {kick && <VLine at={half} />}
          {kick && <Marker at={[half, P * ouMean(x0, KAPPA, THETA, half)]} role="ink" r={3.5} />}
          {kick && <Label at={[half, stable ? P * 0.066 : P * 0.1]} text={`half-life ${n2(half)} y: halfway home`} dx={8} dy={0} />}
          <Label at={[HORIZON, P * THETA]} text="the post, 4 %" anchor="end" dx={-6} dy={stable ? 14 : -6} />
          {stable && <Label at={[HORIZON, P * (THETA + 2 * sdExact)]} text={`± 2 × ${pctSp(sdExact, 1)}, exact`} role="ghost" anchor="end" dx={-6} dy={-6} />}
          {!stable && <Label at={[0.8, yDomain[1]]} text={`stepped paths, pull × tick ${n2(KAPPA * tick)}: the spread grows without limit`} role="error" dx={0} dy={14} />}
        </Plot>
      </div>
    </Figure>
  );
}
