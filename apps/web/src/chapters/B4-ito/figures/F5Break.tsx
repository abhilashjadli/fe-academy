import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, HLine, Label, Plot, fmt, type Pt } from "../../../ui/Plot";
import { Slider, Toggle, Readouts } from "../../../ui/controls";
import { brownianPath, gbmMean, gbmTerminal, gbmTerminalNoCorrection, gbmMedian } from "../../../engine/ito";
import { rng } from "../../../engine/random";

const S0 = 100,
  MU = 0.1,
  T = 1,
  STEPS = 60,
  SHOWN = 60,
  N = 2000;

/** Figure 5 — break it: forget the −½σ² and watch the simulated average drift away from the truth. */
export function F5Break() {
  const [sigma, setSigma] = useState(0.4);
  const [forget, setForget] = useState(false);
  const paths = useMemo(() => {
    const r = rng(31);
    return Array.from({ length: N }, () => brownianPath(STEPS, T, r).W);
  }, []);
  const f = forget ? gbmTerminalNoCorrection : gbmTerminal;
  const curves: Pt[][] = useMemo(
    () => paths.slice(0, SHOWN).map((W) => W.map((w, i) => [(i / STEPS) * T, f(S0, MU, sigma, (i / STEPS) * T, w)] as Pt)),
    [paths, sigma, f],
  );
  const meanEnd = useMemo(() => paths.reduce((s, W) => s + f(S0, MU, sigma, T, W[STEPS]), 0) / N, [paths, sigma, f]);
  const truth = gbmMean(S0, MU, T);
  const ratio = meanEnd / truth;
  const yMax = Math.max(220, Math.min(400, Math.ceil(S0 * Math.exp(MU + 2.2 * sigma) / 20) * 20));

  return (
    <Figure
      n="5"
      prompt="Two thousand simulated years of one stock, the same coin flips each time. Flip the switch and forget Ada's square."
      controls={
        <>
          <Slider label="σ, the yearly wobble" value={sigma} min={0.1} max={0.6} step={0.05} onChange={setSigma} fmt={fmt.pct(0)} />
          <Toggle label="forget the −½σ²" on={forget} onChange={setForget} />
          <Readouts
            items={[
              ["true average after a year", fmt.n(2)(truth)],
              ["simulated average", fmt.n(2)(meanEnd)],
              ["simulated ÷ true", <span className={ratio > 1.005 ? "b4-bad" : "b4-good"}>{fmt.n(3)(ratio)}</span>],
            ]}
          />
        </>
      }
      observe={
        <>
          With the square in the books the simulated average sits on the true one, whatever σ you choose. Forget it, and the ratio climbs with σ — 2 % at
          20 %, 8 % at 40 %, 20 % at 60 %. Every option priced off that simulation is too expensive. A fresher can write this bug in week two; now you can
          spot it.
        </>
      }
    >
      <Plot xDomain={[0, T]} yDomain={[0, yMax]} width={820} height={380} xLabel="years" yLabel="price" xTicks={5} yTicks={5} ariaLabel="A fan of simulated price paths with the true and simulated averages">
        {curves.map((c, i) => (
          <Curve key={i} pts={c} role={forget ? "error" : "approx"} width={1} opacity={0.35} smooth={false} />
        ))}
        <HLine at={truth} />
        <Label at={[T, truth]} text={`true average ${fmt.n(1)(truth)}`} anchor="end" dy={-8} />
        <Curve pts={[[0, S0], [T, gbmMedian(S0, MU, sigma, T)]]} role="ghost" dash="4 3" width={1.5} smooth={false} />
        <Label at={[T, gbmMedian(S0, MU, sigma, T)]} text={`typical year ${fmt.n(1)(gbmMedian(S0, MU, sigma, T))}`} role="ghost" anchor="end" dy={14} />
        <Curve pts={[[0, S0], [T, meanEnd]]} role={forget ? "error" : "truth"} width={2.5} smooth={false} />
        <Label at={[T, meanEnd]} text={`simulated ${fmt.n(1)(meanEnd)}`} role={forget ? "error" : "truth"} anchor="end" dy={forget ? -22 : -8} />
      </Plot>
    </Figure>
  );
}
