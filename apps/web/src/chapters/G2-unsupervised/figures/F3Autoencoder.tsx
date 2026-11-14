import "./figures.css";
import { useEffect, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { Readouts, Toggle } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, Points, type Pt } from "../../../ui/Plot";
import { XTicks, YTicks } from "./parts";
import { AE, N_DAYS, PCA2_FLOOR, TSAY, W, WINDOWS, aeLog, checkAutoencoder, dmy, n0, n2, n4, neg, pct1, useNarrow, type AeStep, type Act } from "./g2";

/**
 * Figure 3 — a network that learns PCA (real record): a 20 → 2 → 20 network trained by full-batch gradient descent to reproduce
 * each window of move sizes. Steps are rounds 0, 10, 100, 1,000, 3,000 of the key's training log (key.fig3.linear / tanh; the
 * engine reproduces the log in engine/unsupervised.test.ts, and a 100-round live run checks the key's first hundred rounds in dev
 * after the figure mounts — never on render). At each step: the loss so far against the PCA-2 floor, and the window ending
 * 23 March 2020 rebuilt by the network over its true values. Toggle tanh in the middle. One control plus the step buttons; three
 * readouts. Tsay's Example 9.3 in the caption, labelled textbook.
 */

const STEP_EPOCHS = [0, 10, 100, 1000, 3000];
const DX: [number, number] = [-0.7, W - 0.3];
const LX: [number, number] = [-0.25, 3.75];
const LY: [number, number] = [0.3, 0.67];
const lx = (e: number) => Math.log10(e + 1);
const DAY_TICKS = [0, 5, 10, 15, 19];
const dayLabel = (d: number) => (d === W - 1 ? "yesterday" : d === 0 ? `${W} days ago` : `${W - d}`);

function Network({ step, narrow }: { step: AeStep; narrow: boolean }) {
  const Wd = narrow ? 400 : 300;
  const H = narrow ? 260 : 250;
  const xs = [Wd * 0.17, Wd * 0.5, Wd * 0.83];
  const top = 26;
  const gap = (H - top - 30) / (W - 1);
  const yIn = (i: number) => top + i * gap;
  const yMid = [H / 2 - 32, H / 2 + 22];
  return (
    <svg className="g2-net" viewBox={`0 0 ${Wd} ${H}`} role="img" aria-label={`a network with ${W} inputs, two hidden neurons and ${W} outputs; after round ${n0(step.epoch)} the hidden pair for the window ending ${dmy(WINDOWS.pc2_min.ends)} reads ${n2(step.hidden[0])}, ${n2(step.hidden[1])}`}>
      <g className="g2-net-lines">
        {Array.from({ length: W }, (_, i) => yMid.map((ym, j) => <line key={`a${i}${j}`} x1={xs[0]} y1={yIn(i)} x2={xs[1]} y2={ym} />))}
        {Array.from({ length: W }, (_, i) => yMid.map((ym, j) => <line key={`b${i}${j}`} x1={xs[1]} y1={ym} x2={xs[2]} y2={yIn(i)} />))}
      </g>
      {Array.from({ length: W }, (_, i) => (
        <circle key={`i${i}`} className="g2-net-in" cx={xs[0]} cy={yIn(i)} r={4} />
      ))}
      {Array.from({ length: W }, (_, i) => (
        <circle key={`o${i}`} className="g2-net-out" cx={xs[2]} cy={yIn(i)} r={4} />
      ))}
      {yMid.map((ym, j) => (
        <g key={j}>
          <circle className="g2-net-mid" cx={xs[1]} cy={ym} r={10} />
          <text className="g2-net-val" x={xs[1] + 16} y={ym + 4}>
            {neg(n2(step.hidden[j]))}
          </text>
        </g>
      ))}
      <text className="g2-net-lab" x={xs[0]} y={14} textAnchor="middle">
        in: {W} move sizes
      </text>
      <text className="g2-net-lab" x={xs[1]} y={14} textAnchor="middle">
        2 numbers
      </text>
      <text className="g2-net-lab" x={xs[2]} y={14} textAnchor="middle">
        out: {W} rebuilt
      </text>
      <text className="g2-net-lab" x={8} y={H - 8} textAnchor="start">
        top: {W} days ago · bottom: yesterday
      </text>
    </svg>
  );
}

function LossCurve({ act, upto, narrow }: { act: Act; upto: number; narrow: boolean }) {
  const log = aeLog(act);
  const shown = log.filter((l) => l.epoch <= upto);
  const pts: Pt[] = shown.map((l) => [lx(l.epoch), l.loss]);
  const cur = shown[shown.length - 1];
  return (
    <Plot xDomain={LX} yDomain={LY} width={narrow ? 400 : 620} height={narrow ? 220 : 200} margin={{ top: 8, right: 8, bottom: 8, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={LX[0]} axisY={LY[0]} ariaLabel={`the mean squared rebuilding error of the ${act} network against the training round on a log axis, to round ${n0(upto)}: ${n4(cur.loss)}; the error of keeping two principal components, ${n4(PCA2_FLOOR)}, dashed`}>
      <YTicks at={[0.4, 0.5, 0.6]} fmt={(t) => t.toFixed(1)} />
      <XTicks at={(narrow ? [0, 10, 100, 3000] : [0, 10, 100, 1000, 3000]).map(lx)} fmt={(v) => n0(Math.round(10 ** v) - 1)} ends />
      <Curve pts={[[LX[0], PCA2_FLOOR], [LX[1], PCA2_FLOOR]]} role="truth" width={1.4} dash="5 4" smooth={false} />
      <Label at={[LX[0], PCA2_FLOOR]} text={`the floor: PCA with two components, ${n4(PCA2_FLOOR)}`} role="truth" dx={6} dy={14} />
      <Curve pts={pts} role="approx" width={2.2} smooth={false} />
      <Marker at={[lx(cur.epoch), cur.loss]} role="approx" r={5.5} />
      <Label at={[lx(cur.epoch), cur.loss]} text={`round ${n0(cur.epoch)}: ${n4(cur.loss)}`} role="approx" dx={cur.epoch >= 1000 ? -10 : 10} dy={cur.loss < PCA2_FLOOR + 0.06 ? -10 : 16} anchor={cur.epoch >= 1000 ? "end" : "start"} />
      <Label at={[LX[0], LY[1]]} text="rebuilding error over all windows, by training round (log axis)" role="ink" dx={4} dy={14} />
    </Plot>
  );
}

/** the network's mean squared miss on the 23 March 2020 window at a logged round (from the key's recon_pc2min) */
function windowMiss(step: AeStep): number {
  const w = WINDOWS.pc2_min;
  let err = 0;
  for (let d = 0; d < W; d++) err += (step.recon[d] - w.values[d]) ** 2 / W;
  return err;
}

function Rebuilt({ step, narrow }: { step: AeStep; narrow: boolean }) {
  const w = WINDOWS.pc2_min;
  const vals: Pt[] = w.values.map((v, d) => [d, v]);
  const rec: Pt[] = step.recon.map((v, d) => [d, v]);
  const pcaPts: Pt[] = w.recon["2"].map((v, d) => [d, v] as Pt);
  const top = Math.max(...w.values) * 1.22;
  const bottom = Math.min(0, ...step.recon) - 0.06 * top;
  return (
    <Plot xDomain={DX} yDomain={[bottom, top]} width={narrow ? 400 : 300} height={narrow ? 280 : 250} margin={{ top: 8, right: 8, bottom: 8, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={DX[0]} axisY={0} ariaLabel={`the window ending ${dmy(w.ends)}: its twenty move sizes as dots, the network's rebuild after round ${n0(step.epoch)} as an amber curve (mean squared miss ${n4(windowMiss(step))}) and the two-component PCA rebuild dashed blue`}>
      <YTicks at={[5, 10]} fmt={(t) => `${t} %`} />
      <XTicks at={DAY_TICKS} fmt={dayLabel} ends />
      <Curve pts={pcaPts} role="truth" width={1.4} dash="5 4" smooth={false} />
      <Curve pts={rec} role="approx" width={2.2} smooth={false} />
      <Points pts={vals} role="ink" r={3.6} opacity={0.95} />
      <Label at={[DX[0], top]} text={`dots: the ${W} move sizes · amber: the network`} role="ink" dx={4} dy={14} />
      <Label at={[DX[1], w.recon["2"][W - 1]]} text="dashed: PCA, two components" role="truth" dx={-4} dy={-8} anchor="end" />
    </Plot>
  );
}

export function F3Autoencoder() {
  const narrow = useNarrow();
  const [tanh, setTanh] = useState(false);
  const [step, setStep] = useState(0);
  const act: Act = tanh ? "tanh" : "linear";
  const log = aeLog(act);
  const at = (e: number) => log.find((l) => l.epoch === e)!;
  const cur = at(STEP_EPOCHS[step]);
  const lin = aeLog("linear");
  const th = aeLog("tanh");
  const linAt = (e: number) => lin.find((l) => l.epoch === e)!;
  const thAt = (e: number) => th.find((l) => l.epoch === e)!;
  const last = STEP_EPOCHS[STEP_EPOCHS.length - 1];

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const t = setTimeout(() => checkAutoencoder(act, 100), 1500);
    return () => clearTimeout(t);
  }, [act]);

  const steps = STEP_EPOCHS.map((e, i) => {
    const row = at(e);
    const name = act === "tanh" ? "tanh network" : "linear network";
    return {
      caption:
        i === 0 ? (
          <>
            Round 0. {W} inputs — the window's move sizes — squeezed through two neurons and expanded back to {W}; the weights are random, so the rebuild of the {dmy(WINDOWS.pc2_min.ends)} window
            is noise near the average. Error over all windows: <b>{n4(row.loss)}</b>. The only instruction: make the output match the input.
          </>
        ) : i === STEP_EPOCHS.length - 1 ? (
          <>
            Round {n0(e)}: error <b>{n4(row.loss)}</b> against the two-component PCA floor of {n4(PCA2_FLOOR)}
            {act === "linear" ? <> — the same, to four digits. The {name} did not find anything new; it found PCA, slowly.</> : <> — above it. The bend in the middle neurons found nothing to use here; the linear network reached {n4(linAt(last).loss)}.</>}{" "}
            Tsay's five stocks (Example 9.3, textbook): the first component carries {pct1(TSAY.share1)} of the variance and every loading is positive ({TSAY.e1.map((v) => n2(v)).join(", ")}) — a market
            factor, the same picture on a different object.
          </>
        ) : (
          <>
            Round {n0(e)}: error <b>{n4(row.loss)}</b>. {e === 10 ? "Barely moved: gradient descent from small random weights starts slowly." : e === 100 ? `Most of the way: the first direction — the level — is found; the floor is ${n4(PCA2_FLOOR)}.` : `The second direction, the slope, is being found; the rebuild of the ${dmy(WINDOWS.pc2_min.ends)} window now rises toward the newest days.`}
          </>
        ),
    };
  });

  return (
    <Figure
      n="3"
      prompt={
        <>
          A network with {W} inputs, two neurons in the middle and {W} outputs is told only to reproduce its input. Whatever gets through the two neurons is what it decided to keep. Step through
          the training; then put a bend in the middle.
        </>
      }
      controls={
        <>
          <Toggle label="tanh in the middle" on={tanh} onChange={setTanh} />
          <Readouts
            items={[
              ["round", n0(cur.epoch)],
              ["error", <span className={cur.loss < PCA2_FLOOR + 1e-4 ? "g2-truth" : undefined}>{n4(cur.loss)}</span>],
              ["PCA floor, two components", n4(PCA2_FLOOR)],
            ]}
          />
        </>
      }
      observe={
        <>
          Full-batch gradient descent on the mean squared rebuilding error over all {n0(N_DAYS)} windows, weights started at N(0, 0.1²) from the seeded generator, biases 0. Linear,
          rate {AE.linear.lr}: {n4(linAt(0).loss)} at round 0, {n4(linAt(10).loss)} at 10, {n4(linAt(100).loss)} at 100, {n4(linAt(1000).loss)} at 1,000, {n4(linAt(3000).loss)} at 3,000 — the PCA-2 floor is{" "}
          {n4(PCA2_FLOOR)} (key; the engine reproduces the log in its tests). tanh in the middle, rate {AE.tanh.lr}: {n4(thAt(0).loss)}, {n4(thAt(10).loss)}, {n4(thAt(100).loss)}, {n4(thAt(1000).loss)},{" "}
          {n4(thAt(3000).loss)} — slower, and worse after the same rounds. A linear autoencoder's minima lie exactly on the subspace of the first two principal components (Baldi and Hornik, 1989);
          gradient descent finds the subspace, not the components, so the linear network's two middle numbers are a rotation of the two PC scores ({neg(n2(linAt(last).hidden[0]))}, {neg(n2(linAt(last).hidden[1]))} for the {dmy(WINDOWS.pc2_min.ends)} window
          after {n0(last)} rounds, against scores {neg(n2(WINDOWS.pc2_min.scores[0]))}, {neg(n2(WINDOWS.pc2_min.scores[1]))}). Nonlinearity pays when there is a bend to find; twenty days of move sizes offered two neurons none.
        </>
      }
    >
      <div className="g2-ae">
        <StepThrough
          steps={steps}
          onStep={setStep}
          render={(i) => {
            const row = at(STEP_EPOCHS[i]);
            return (
              <div className="g2-ae-body">
                <div className="g2-two">
                  <div className="g2-panel">
                    <div className="g2-panel-title">
                      <strong>
                        {W} → 2 → {W}
                        {act === "tanh" ? ", tanh in the middle" : ", linear"}
                      </strong>{" "}
                      <span>the two middle numbers for the {dmy(WINDOWS.pc2_min.ends)} window</span>
                    </div>
                    <Network step={row} narrow={narrow} />
                  </div>
                  <div className="g2-panel">
                    <div className="g2-panel-title">
                      <strong>the window ending {dmy(WINDOWS.pc2_min.ends)}, rebuilt</strong> <span>after round {n0(row.epoch)} · this window's miss {n4(windowMiss(row))}</span>
                    </div>
                    <Rebuilt step={row} narrow={narrow} />
                  </div>
                </div>
                <div className="g2-panel">
                  <div className="g2-panel-title">
                    <strong>the error, round by round</strong> <span>over all {n0(N_DAYS)} windows · blue dashed: PCA with two components</span>
                  </div>
                  <LossCurve act={act} upto={STEP_EPOCHS[i]} narrow={narrow} />
                </div>
              </div>
            );
          }}
        />
      </div>
    </Figure>
  );
}
