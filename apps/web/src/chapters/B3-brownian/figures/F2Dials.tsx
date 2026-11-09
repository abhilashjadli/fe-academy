import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bars, Curve, Label, Plot, VLine } from "../../../ui/Plot";
import { Segmented, Toggle } from "../../../ui/controls";
import { ResultCard } from "../../../ui/Bet";
import { brownianPath } from "../../../engine/ito";
import { brownianBridgeRefineTimes, dials, fractionBelow, median, stepRatios } from "../../../engine/brownian";
import { rng } from "../../../engine/random";
import { Gauge, Odometer } from "./gauges";
import { KEY, LADDER, T, int, n1, n2, n3, pct1, thin, useNarrow } from "./b3";
import type { DialPick } from "./F0Comic";
import "./figures.css";

/**
 * Figure 2 — the instrument panel. One simulated path on one unit of time, read 16, then 256, 4,096, 65,536 times. The path is
 * refined by Brownian bridge, never redrawn, so the wiggles you saw at 16 are still there at 65,536. The three dials read the
 * engine's speedometer (rms of |ΔW|/Δt), odometer (Σ|ΔW|) and squares dial (Σ(ΔW)²); "typical" under each is the answer key's
 * expectation for that n. Figure 0's bet is settled here. The ledger opens the per-step ratios (ΔW)²/Δt as a histogram.
 */

const SEED = 97;

function buildStages() {
  const r = rng(SEED);
  let p = brownianPath(LADDER[0], T, r);
  const stages = [p];
  for (let i = 1; i < LADDER.length; i++) {
    p = brownianBridgeRefineTimes(p, Math.round(Math.log2(LADDER[i] / LADDER[i - 1])), r);
    stages.push(p);
  }
  return stages.map((s, i) => {
    const d = dials(s.W, T);
    const ratios = stepRatios(s.W, T);
    return { ...s, ...d, drawn: thin(s.t, s.W, 700), ratios, below1: fractionBelow(ratios, 1), med: median(ratios), typical: KEY.odometer[i] };
  });
}

const BIN = 0.25,
  BINS = 20; // ratios 0 … 5

export function F2Dials({ pick }: { pick: DialPick | null }) {
  const [k, setK] = useState(0);
  const [ledger, setLedger] = useState(false);
  const stages = useMemo(buildStages, []);
  const st = stages[k];
  const last = stages[stages.length - 1];
  const narrow = useNarrow();

  const hist = useMemo(() => {
    const counts = new Array(BINS).fill(0);
    for (const v of st.ratios) {
      const i = Math.min(BINS - 1, Math.floor(v / BIN));
      counts[i]++;
    }
    return counts.map((c, i) => ({ x: (i + 0.5) * BIN, y: c / st.ratios.length, w: BIN }));
  }, [st]);

  const yLo = Math.min(-0.5, Math.floor(Math.min(...last.W) * 2) / 2),
    yHi = Math.max(0.5, Math.ceil(Math.max(...last.W) * 2) / 2);
  const said = pick === "speed" ? "the speedometer" : pick === "odo" ? "the odometer" : "the squares dial";
  const ladder = (key: "speedometer" | "odometer" | "squares", f: (v: number) => string) => stages.map((s) => f(s[key])).join(" → ");

  return (
    <Figure
      n="2"
      prompt={<>One simulated path, one unit of time. Read it 16 times, then 256, then 4,096, then 65,536 — the same path, refined between its points, never redrawn.</>}
      controls={
        <>
          <Segmented label="readings" options={LADDER.map((n, i) => ({ id: String(i), label: int(n) }))} value={String(k)} onChange={(v) => setK(parseInt(v, 10))} />
          <Toggle label="open the ledger" on={ledger} onChange={setLedger} />
        </>
      }
      observe={
        ledger ? (
          <>
            Each single step's ratio (move² ÷ tick) is <strong>not</strong> near 1: {pct1(st.below1)} of them are below 1 and the middle one is {n2(st.med)} (exactly:{" "}
            {pct1(KEY.qv.ratio_below_1)} and {n3(KEY.qv.ratio_median)}, for any tick). The dial is steady because the errors cancel across many steps, not because
            each step is right.
          </>
        ) : k === 0 ? (
          <>
            Sixteen readings, tick 1/16: the speedometer reads {n1(st.speedometer)}, the odometer {n1(st.odometer)}, the squares dial {n3(st.squares)}. Nothing has settled yet.
            Refine.
          </>
        ) : k < stages.length - 1 ? (
          <>
            {int(st.n)} readings of the same path: the speedometer reads {n1(st.speedometer)} (typical {n1(st.typical.speedometer_rms)} for this tick) and the odometer{" "}
            {n1(st.odometer)} — both climbing. The squares dial reads {n3(st.squares)}, nearer the clock than before. Refine again.
          </>
        ) : (
          <>
            The speedometer read {ladder("speedometer", n1)} — typical {KEY.odometer.map((o) => o.speedometer_rms).join(", ")} — and pinned. The odometer read{" "}
            {ladder("odometer", n1)} and ran away. The squares dial read {ladder("squares", n3)}: it settles on <strong>1.0, the time elapsed</strong>. The dial reads the
            clock.
          </>
        )
      }
    >
      <div className="b3-panel">
        <Plot xDomain={[0, T]} yDomain={[yLo, yHi]} width={narrow ? 380 : 760} height={narrow ? 220 : 280} xLabel="time" yLabel="the path" xTicks={5} yTicks={4} ariaLabel={`The path read ${int(st.n)} times`} axisY={yLo}>
          <Curve pts={st.drawn} role="ink" width={st.n > 1000 ? 0.7 : 1.3} smooth={false} />
          <Label at={[T, yHi]} text={`${int(st.n)} readings · tick ${st.n <= 256 ? "1/" + st.n : "1/" + int(st.n)}`} anchor="end" dx={-6} dy={14} />
        </Plot>
        <div className="b3-dash">
          <Gauge value={st.speedometer} max={10} ticks={5} label="speedometer" sub={`typical ${n1(st.typical.speedometer_rms)} · move ÷ tick`} printed={n1(st.speedometer)} role="error" width={narrow ? 140 : 190} />
          <Odometer value={st.odometer} label="odometer" sub={`typical ${n1(st.typical.expected)} · moves added up`} width={narrow ? 140 : 190} />
          <Gauge value={st.squares} max={2} ticks={4} label="squares dial" sub="moves², added up" printed={n3(st.squares)} role="truth" mark={T} markLabel="the clock" width={narrow ? 140 : 190} />
        </div>
      </div>
      {ledger && (
        <div className="b3-ledger">
          <Plot xDomain={[0, 5]} yDomain={[0, 0.4]} width={narrow ? 380 : 560} height={190} xLabel="one step's move² ÷ tick" yLabel="share of steps" xTicks={5} yTicks={3} ariaLabel="Histogram of per-step ratios: most below 1, a long tail above">
            <Bars bars={hist} role="truth" />
            <VLine at={1} />
            <Label at={[1, 0.4]} text="1 = the dial's average" anchor="start" dx={6} dy={14} />
            <Label at={[2.6, 0.2]} text={`${pct1(st.below1)} of steps below 1`} role="truth" anchor="start" />
            <Label at={[2.6, 0.16]} text={`middle step ${n2(st.med)}`} role="truth" anchor="start" />
          </Plot>
        </div>
      )}
      {pick && k < stages.length - 1 && (
        <div className="b3-hint">
          Your bet from the comic is on <strong>{said}</strong>. Refine to {int(LADDER[LADDER.length - 1])} readings to settle it.
        </div>
      )}
      {pick && k === stages.length - 1 && (
        <div className="b3-result">
          <ResultCard
            yours={said}
            answer={<>the squares dial — {n3(last.squares)} after {int(last.n)} readings, against a clock that says {n1(T)}</>}
            verdict={pick === "squares" ? "right" : "miss"}
          >
            {pick === "speed" && <>A speed needs the move to shrink with the tick. On this road the move shrinks only like the square root of the tick, so move ÷ tick grows without bound — {ladder("speedometer", n1)} — and the needle pins.</>}
            {pick === "odo" && <>Each step is shorter, but there are more of them, and the two do not cancel: the distance grows like the square root of the number of readings — {ladder("odometer", n1)} — with no end.</>}
            {pick === "squares" && <>Squares are small when steps are small, there are many steps, and these two cancel exactly: the squares dial reads {ladder("squares", n3)}. Only this dial has a reading.</>}
          </ResultCard>
        </div>
      )}
    </Figure>
  );
}
