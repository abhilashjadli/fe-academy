import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bars, Curve, Label, Plot, VLine } from "../../../ui/Plot";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { histogram, simulateHedge, summarise, wilmottMarker } from "../../../engine/hedge";
import { POS, REAL_SO_FAR, lakh, pct1, useNarrow } from "./week";

/**
 * Figure 3 — the week run 1,500 times (lognormal paths, labelled so). Two controls: how often Raj hedges, and the index's
 * wobble. Histogram of the final P&L with the zero line, the mean, Wilmott's exact expectation when the wobble is not the
 * sold vol, and a pin for the real week's P&L so far from Figure 1. Readouts: mean ÷ premium, sd ÷ premium, sd shrinks ×.
 */

type Freq = "expiry" | "daily" | "four";
const STEPS: Record<Freq, number> = { expiry: 1 / POS.days, daily: 1, four: 4 };
const PATHS = 1500;
const SEED = 11;
const LO = -15,
  HI = 15,
  BINS = 60;
const SOLD_PCT = 100 * POS.sigmaSold;

function run(freq: Freq, sigmaReal: number) {
  return simulateHedge({ F0: POS.F0, K: POS.K, r: POS.r, sigmaSold: POS.sigmaSold, sigmaReal, days: POS.days, stepsPerDay: STEPS[freq], units: POS.units, paths: PATHS, seed: SEED });
}

export function F3Weeks() {
  const [freq, setFreq] = useState<Freq>("daily");
  const [wob, setWob] = useState(SOLD_PCT); // in %; the slider snaps to its 0.5 grid once moved
  const sigmaReal = Math.abs(wob - SOLD_PCT) < 1e-9 ? POS.sigmaSold : wob / 100;
  const atSold = sigmaReal === POS.sigmaSold;

  const sim = useMemo(() => {
    const x = run(freq, sigmaReal);
    const s = summarise(x);
    const inRange = x.filter((v) => v >= LO * 1e5 && v <= HI * 1e5);
    const bins = histogram(inRange, BINS, LO * 1e5, HI * 1e5);
    let below = 0,
      above = 0;
    for (const v of x) {
      if (v < LO * 1e5) below++;
      else if (v > HI * 1e5) above++;
    }
    return { s, bins, below, above };
  }, [freq, sigmaReal]);
  const sdExpiry = useMemo(() => summarise(run("expiry", sigmaReal)).sd, [sigmaReal]);
  const wil = useMemo(() => wilmottMarker({ F: POS.F0, K: POS.K, r: POS.r, T: POS.days / 365 }, POS.sigmaSold, sigmaReal, POS.units), [sigmaReal]);

  const yMax = Math.max(...sim.bins.map((b) => b.n)) * 1.18;
  const meanL = sim.s.mean / 1e5;
  const wilL = wil / 1e5;
  const pinL = REAL_SO_FAR.pnl / 1e5;
  const shrink = sdExpiry / sim.s.sd;
  const narrow = useNarrow();
  const freqWord = freq === "expiry" ? "hedged only at the start" : freq === "daily" ? "hedged once a day" : "hedged four times a day";

  return (
    <Figure
      n="3"
      prompt={
        <>
          The same position, the same eleven days, {PATHS.toLocaleString("en-US")} <em>simulated</em> weeks. Choose how often Raj re-hedges and what the index wobbles at; the
          picture is where his week ends.
        </>
      }
      controls={
        <>
          <Segmented<Freq>
            label={narrow ? "Raj hedges" : "how often Raj hedges"}
            options={[
              { id: "expiry", label: "expiry only" },
              { id: "daily", label: "daily" },
              { id: "four", label: "4× a day" },
            ]}
            value={freq}
            onChange={setFreq}
          />
          <Slider label="index wobble" value={wob} min={10} max={25} step={0.5} onChange={setWob} fmt={(v) => v.toFixed(1) + " %"} role="approx" />
          <Readouts
            items={[
              ["mean ÷ premium", <span className="d1-truth">{sim.s.mean >= 0 ? "+" : "−"}{(Math.abs(sim.s.mean) / POS.premium).toFixed(2)}</span>],
              ["sd ÷ premium", (sim.s.sd / POS.premium).toFixed(2)],
              ["sd shrinks", freq === "expiry" ? "×1.0 (the reference)" : `×${shrink.toFixed(1)} vs expiry only`],
            ]}
          />
        </>
      }
      observe={
        <>
          {atSold ? (
            <>
              At the {pct1(POS.sigmaSold)} he sold, the mean is a dead heat at every frequency — and each time Raj hedges four times as often the spread roughly halves.
            </>
          ) : (
            <>
              At {wob.toFixed(1)} % the whole histogram slides to {lakh(sim.s.mean)} on average ({lakh(wil)} by Wilmott's exact formula); the spread stays set by how often he hedges.
            </>
          )}{" "}
          Wilmott's sentence under it: {freqWord}, Raj <strong>loses a little on about 68 % of the moves and gains more on the other 32 %</strong>; at the sold vol the two net
          to nothing. The real week's pin is {REAL_SO_FAR.complete ? "where the market put him" : `${REAL_SO_FAR.days} real days in — the rest of the week is still to come`}.
        </>
      }
    >
      <div className="d1-hist">
        <Plot xDomain={[LO, HI]} yDomain={[0, yMax]} width={narrow ? 400 : 760} height={narrow ? 300 : 300} xTicks={7} yTicks={0} xLabel="final P&L, ₹ lakh" grid={false} axisY={0} margin={{ top: 18, right: 10, bottom: 34, left: 10 }} ariaLabel="Histogram of the week's final P&L over simulated weeks, with the mean, the exact expectation and the real week's pin">
          <Bars bars={sim.bins.map((b) => ({ x: (b.x0 + b.x1) / 2e5, y: b.n, w: (b.x1 - b.x0) / 1e5 }))} role={freq === "expiry" ? "ghost" : "truth"} opacity={0.55} gap={1} />
          <VLine at={0} />
          <Curve pts={[[meanL, 0], [meanL, yMax * 0.86]]} role="truth" width={2} smooth={false} />
          <Label at={[meanL, yMax * 0.86]} text={`mean ${lakh(sim.s.mean, 1)}`} role="truth" dx={meanL > 6 ? -6 : 6} dy={-4} anchor={meanL > 6 ? "end" : "start"} />
          {!atSold && (
            <>
              <Curve pts={[[wilL, 0], [wilL, yMax * 0.72]]} role="approx" width={2} dash="5 4" smooth={false} />
              <Label at={[wilL, yMax * 0.72]} text={`exact expectation ${lakh(wil, 1)}`} role="approx" dx={wilL > 6 ? -6 : 6} dy={-4} anchor={wilL > 6 ? "end" : "start"} />
            </>
          )}
          <Curve pts={[[pinL, 0], [pinL, yMax * 0.5]]} role="error" width={2.5} smooth={false} />
          <Label
            at={[pinL, yMax * 0.5]}
            text={`the real week (${REAL_SO_FAR.complete ? "at expiry" : "so far"}) ${lakh(REAL_SO_FAR.pnl, 1)}`}
            role="error"
            dx={pinL > (narrow ? 0 : 4) ? -6 : 6}
            dy={-4}
            anchor={pinL > (narrow ? 0 : 4) ? "end" : "start"}
          />
          {sim.below > 0 && <Label at={[LO, yMax * 0.96]} text={`◂ ${sim.below} weeks below −15 lakh`} role="ghost" dx={4} dy={4} />}
          {sim.above > 0 && <Label at={[HI, yMax * 0.96]} text={`${sim.above} weeks above +15 lakh ▸`} role="ghost" dx={-4} dy={4} anchor="end" />}
        </Plot>
        <div className="d1-hist-foot">
          <span>
            {PATHS.toLocaleString("en-US")} lognormal weeks at {wob.toFixed(1)} %, {freqWord}, seed {SEED}
          </span>
          <span>premium {lakh(POS.premium, 1)}</span>
          <span>sd {lakh(sim.s.sd, 2)}</span>
        </div>
      </div>
    </Figure>
  );
}
