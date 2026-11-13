import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { Readouts } from "../../../ui/controls";
import { Bars, Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { XTicks, YTicks } from "./parts";
import { BEST_CV_I, BEST_LAM_I, CV_K_SHOWN, CV_LAM_CURVE, FIG1, FIG2, FIG3, FOLDS, K, LAMS, LAM_CURVE, TEST_AT_0_PCT, TEST_AT_CV_PCT, TSAY, dmy, getFoldScores, lamFmt, lamX, my, n0, n2, n3, pct1, useNarrow } from "./g1";

/**
 * Figure 3 — five folds (real record): the 1,940 training days cut into five dated blocks (key.fig3.folds). Step 1: hold block 1
 * out, fit on the other four, score it (live crossValidate at k = 10, λ = 0; equals key.fig3.per_fold_k10). Step 2: all five scores.
 * Step 3: the pooled CV score against the leash λ (key.fig3.cv_lam), minimum marked. Step 4: the test curve (key.fig2.rows), shown
 * once — the CV's pick, the test's own pick and λ = 0 compared; Tsay's Example 4.7 in the caption. Step buttons only; readouts per step.
 */

const FX: [number, number] = [0.4, FOLDS.length + 0.6];
const FY: [number, number] = [-0.2, 1.78];
const LX: [number, number] = [-0.85, 5.35];
const LY: [number, number] = [-1.5, 19];
const pctTick = (v: number) => `${v} %`;
const LAM_TICKS = LAMS.map((_, i) => i).filter((i) => i === 0 || Number.isInteger(Math.log10(LAMS[i])));
const WORST = FIG3.per_fold_k10.reduce((b, v, i) => (v > FIG3.per_fold_k10[b] ? i : b), 0);

/** the training span as a bar cut into five dated blocks; `held` is the block drawn as held out (−1: none) */
function FoldBar({ held, scores, narrow }: { held: number; scores?: number[]; narrow: boolean }) {
  const W = narrow ? 400 : 720;
  const left = 6;
  const top = 26;
  const bh = 34;
  const H = top + bh + 34;
  const bw = (W - 2 * left) / FOLDS.length;
  return (
    <svg className="g1-folds-bar" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`the ${n0(FIG1.train.n)} training days as five blocks of ${FOLDS[0].n} days each, from ${dmy(FOLDS[0].start)} to ${dmy(FOLDS[FOLDS.length - 1].end)}${held >= 0 ? `; block ${held + 1} held out` : ""}`}>
      {FOLDS.map((f, i) => {
        const x = left + i * bw;
        const isHeld = i === held;
        return (
          <g key={i}>
            <rect x={x + 1} y={top} width={bw - 2} height={bh} rx={3} fill={isHeld ? "var(--error-soft)" : "var(--truth-soft)"} stroke={isHeld ? "var(--error)" : "var(--truth)"} strokeWidth={isHeld ? 1.8 : 1} />
            <text className="g1-fold-n" x={x + bw / 2} y={top - 9} textAnchor="middle">
              {isHeld ? `block ${i + 1}: held out, scored` : scores ? `block ${i + 1}: ${n3(scores[i])}` : `block ${i + 1}: fitted on`}
            </text>
            <text className="g1-fold-d" x={x + bw / 2} y={top + bh / 2 + 4} textAnchor="middle">
              {narrow ? `${my(f.start).slice(-4)}–${my(f.end).slice(-2)}` : `${my(f.start)} – ${my(f.end)}`}
            </text>
            <text className="g1-fold-n" x={x + bw / 2} y={top + bh + 16} textAnchor="middle">
              {n0(f.n)} days
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FoldScores({ scores, upto, narrow }: { scores: number[]; upto: number; narrow: boolean }) {
  const shown = scores.slice(0, upto);
  const bars = shown.map((v, i) => ({ x: i + 1, y: v, w: 0.62 }));
  const worst = bars.filter((b) => b.x - 1 === WORST);
  const rest = bars.filter((b) => b.x - 1 !== WORST);
  return (
    <Plot xDomain={FX} yDomain={FY} width={narrow ? 400 : 720} height={narrow ? 240 : 260} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={FX[0]} axisY={0} ariaLabel={`the score of each held-out block at ${CV_K_SHOWN} lags: ${shown.map((v, i) => `block ${i + 1} ${n3(v)}`).join(", ")}`}>
      <YTicks at={[0.5, 1.0, 1.5]} fmt={(v) => n2(v)} />
      <XTicks at={FOLDS.map((_, i) => i + 1)} fmt={(v) => `block ${v}`} />
      <Bars bars={rest} role="truth" opacity={0.75} gap={2} />
      <Bars bars={worst} role="error" opacity={0.9} gap={2} />
      {shown.map((v, i) => (
        <Label key={i} at={[i + 1, v]} text={n3(v)} role={i === WORST ? "error" : "truth"} dx={0} dy={-7} anchor="middle" />
      ))}
      <Label at={[FX[0], FY[1]]} text={narrow ? "mean squared miss on the held-out block" : `mean squared miss on the held-out block, fitted on the other four · ${CV_K_SHOWN} lags, no leash`} role="ink" dx={40} dy={14} />
    </Plot>
  );
}

function LamCurves({ withTest, narrow }: { withTest: boolean; narrow: boolean }) {
  const cv: Pt[] = CV_LAM_CURVE.map((p) => [lamX(p.i), p.cv]);
  const test: Pt[] = LAM_CURVE.map((p) => [lamX(p.i), p.test]);
  const cvBest = CV_LAM_CURVE[BEST_CV_I];
  const testBest = LAM_CURVE[BEST_LAM_I];
  const testAtCv = LAM_CURVE[BEST_CV_I];
  const testAt0 = LAM_CURVE[0];
  return (
    <Plot xDomain={LX} yDomain={LY} width={narrow ? 400 : 720} height={narrow ? 300 : 320} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={LX[0]} axisY={0} ariaLabel={withTest ? `the five-fold score (grey) and the test score (blue) against the leash λ, both as percent better than guessing; the folds' pick λ ${lamFmt(cvBest.lam)} scores ${pct1(testAtCv.test)} on the test days, the test's own pick λ ${lamFmt(testBest.lam)} scores ${pct1(testBest.test)}, λ = 0 scores ${pct1(testAt0.test)}` : `the five-fold score against the leash λ on a log axis, as percent better than guessing, minimum at λ ${lamFmt(cvBest.lam)}`}>
      <YTicks at={[5, 10, 15]} fmt={pctTick} />
      <XTicks at={LAM_TICKS.map(lamX)} fmt={(v) => (v < 0 ? "0" : v === 0 ? "1" : lamFmt(10 ** Math.round(v)))} label="λ" />
      <Label at={[LX[1], 0]} text="0 %: guessing the average" role="ink" dx={-6} dy={-5} anchor="end" />
      <Curve pts={[[lamX(BEST_CV_I), LY[0]], [lamX(BEST_CV_I), LY[1]]]} role="ghost" width={1} dash="3 3" smooth={false} />
      <Curve pts={cv} role={withTest ? "ghost" : "truth"} width={2.2} smooth={false} />
      <Marker at={[lamX(cvBest.i), cvBest.cv]} role={withTest ? "ghost" : "truth"} r={5} />
      <Label at={[lamX(cvBest.i), cvBest.cv]} text={`the folds' pick: λ ${lamFmt(cvBest.lam)}, ${pct1(cvBest.cv)} on the folds`} role={withTest ? "ghost" : "truth"} dx={narrow ? 6 : 0} dy={-10} anchor={narrow ? "start" : "middle"} />
      {!withTest && <Label at={[LX[0], LY[1]]} text={narrow ? "the five scores pooled, as % better than guessing" : `the five scores pooled, as % better than guessing the fold's own average · ${K} lags`} role="ink" dx={4} dy={14} />}
      {withTest && (
        <>
          <Curve pts={test} role="truth" width={2.2} smooth={false} />
          <Marker at={[lamX(testAtCv.i), testAtCv.test]} role="approx" r={5.5} />
          <Label at={[lamX(testAtCv.i), testAtCv.test]} text={`the folds' pick on the test days: ${pct1(testAtCv.test)}`} role="approx" dx={-9} dy={14} anchor="end" />
          <Marker at={[lamX(testBest.i), testBest.test]} role="truth" r={4} />
          <Label at={[lamX(testBest.i), testBest.test]} text={`the test's own pick: λ ${lamFmt(testBest.lam)}, ${pct1(testBest.test)}`} role="truth" dx={9} dy={-9} />
          <Marker at={[lamX(0), testAt0.test]} role="error" r={4} />
          <Label at={[lamX(0), testAt0.test]} text={`no leash: ${pct1(testAt0.test)}`} role="error" dx={8} dy={-8} />
          <Label at={[LX[0], LY[1]]} text={narrow ? "grey: the folds · blue: the test days, once" : "grey: the folds (from the training days only) · blue: the test days, looked at once"} role="ink" dx={4} dy={14} />
        </>
      )}
    </Plot>
  );
}

export function F3Folds() {
  const narrow = useNarrow();
  const [step, setStep] = useState(0);
  const scores = getFoldScores();
  const cvBest = CV_LAM_CURVE[BEST_CV_I];
  const testBest = LAM_CURVE[BEST_LAM_I];
  const cvAt0 = CV_LAM_CURVE[0];
  const worst = FOLDS[WORST];
  const nextWorst = Math.max(...scores.perFold.filter((_, i) => i !== WORST));
  const sum = scores.perFold.reduce((s, v) => s + v, 0);

  const steps = [
    {
      caption: (
        <>
          The {n0(FIG1.train.n)} training days — {dmy(FOLDS[0].start)} to {dmy(FOLDS[FOLDS.length - 1].end)} — cut into five blocks of {FOLDS[0].n} days, in date order. Hold block 1 out. Fit the{" "}
          {CV_K_SHOWN}-lag model of Figure 1 on the other four blocks only, then score it on block 1, which the fit never saw: mean squared miss <b>{n3(scores.perFold[0])}</b>. The test days have not been
          touched.
        </>
      ),
    },
    {
      caption: (
        <>
          Do it five times, each block held out once: {scores.perFold.map((v) => n3(v)).join(", ")}. Block {WORST + 1} ({my(worst.start)}–{my(worst.end)}) holds March 2020 and scores{" "}
          <b>{n3(scores.perFold[WORST])}</b> — {n2(scores.perFold[WORST] / nextWorst).replace(/0$/, "")} times the next worst, {Math.round((100 * scores.perFold[WORST]) / sum)} % of the sum on its own.
          The pooled score, {n3(scores.cv)}, is what gets to choose; one bad stretch dominates it, and that is honest — the test days may hold one too.
        </>
      ),
    },
    {
      caption: (
        <>
          Now the leash. For each λ on Figure 2's grid, the same five fits and five scores on the {K}-lag model, pooled, as % better than guessing: {pct1(cvAt0.cv)} with no leash, climbing to{" "}
          <b>{pct1(cvBest.cv)}</b> at λ {lamFmt(cvBest.lam)}, then falling to {pct1(CV_LAM_CURVE[CV_LAM_CURVE.length - 1].cv)} at {lamFmt(LAMS[LAMS.length - 1])}. The folds pick λ ≈ {lamFmt(cvBest.lam)}. No test day has
          been looked at.
        </>
      ),
    },
    {
      caption: (
        <>
          Now, once, the test days. The folds' pick, λ {lamFmt(cvBest.lam)}, scores <b>{pct1(TEST_AT_CV_PCT)}</b> better than guessing on them; the test days themselves would have preferred λ{" "}
          {lamFmt(testBest.lam)}, {pct1(testBest.test)}; no leash at all scores {pct1(TEST_AT_0_PCT)}. The choice made without peeking is a little off the best and far from the worst. Tsay ran this test on
          IBM (Example 4.7, textbook): a 3-2-1 neural network fitted on monthly returns 1926–1997 scored an out-of-sample MSFE of {n2(TSAY.msfe_network)} on 1998–99, against {n2(TSAY.msfe_mean)} for
          predicting the average and {n2(TSAY.msfe_ar1)} for an AR(1); refitting the network with different starting values gave anywhere from {n2(TSAY.msfe_network_range[0])} to{" "}
          {n2(TSAY.msfe_network_range[1])}.
        </>
      ),
    },
  ];

  const readouts: Array<Array<[string, string]>> = [
    [
      ["held out", `block 1 · ${my(FOLDS[0].start)}–${my(FOLDS[0].end)}`],
      ["fitted on", `blocks 2–5 · ${n0(FIG1.train.n - FOLDS[0].n)} days`],
      ["score on block 1", n3(scores.perFold[0])],
    ],
    [
      ["the five scores", scores.perFold.map((v) => n3(v)).join(" · ")],
      [`block ${WORST + 1}`, `${n3(scores.perFold[WORST])} · ${Math.round((100 * scores.perFold[WORST]) / sum)} % of the sum`],
      ["pooled", n3(scores.cv)],
    ],
    [
      ["folds, no leash", `${pct1(cvAt0.cv)} better`],
      ["folds, best", `${pct1(cvBest.cv)} at λ ${lamFmt(cvBest.lam)}`],
      ["test days", "not looked at"],
    ],
    [
      [`test, the folds' λ ${lamFmt(cvBest.lam)}`, `${pct1(TEST_AT_CV_PCT)} better`],
      [`test, its own λ ${lamFmt(testBest.lam)}`, `${pct1(testBest.test)} better`],
      ["test, no leash", `${pct1(TEST_AT_0_PCT)} better`],
    ],
  ];

  return (
    <Figure
      n="3"
      prompt={
        <>
          Who chooses the leash? Not the test days — if they choose it they are no longer unseen. Cut the training days into five blocks, fit on four, score the fifth, five times over; let the
          sum choose. Step through.
        </>
      }
      controls={<Readouts items={readouts[step]} />}
      observe={
        <>
          Five contiguous blocks of the {n0(FIG1.train.n)} training rows (numpy's array_split; key): {FOLDS.map((f, i) => `${i + 1}: ${dmy(f.start)}–${dmy(f.end)}`).join("; ")}. Per-fold mean squared
          miss at {CV_K_SHOWN} lags {scores.perFold.map((v) => n3(v)).join(" / ")}, pooled {n3(scores.cv)} (engine, equal to the key); guessing each fold's training average pools to{" "}
          {n3(FIG3.cv_mean)}. Over λ on the {K}-lag model the pooled score bottoms at λ {lamFmt(cvBest.lam)} ({n3(cvBest.raw)}); the test days bottom at λ {lamFmt(testBest.lam)} (test MSE {n3(FIG2.rows[BEST_LAM_I].test)}; {n3(FIG3.test_at_cv_lam)} at the
          folds' pick, {n3(FIG3.test_at_lam0)} with no leash). Over k with no leash the folds pick {FIG3.best_cv_k} lags, Figure 1's test days picked {FIG1.best_k_full} (key). The blocks are contiguous rather than
          shuffled because neighbouring days share their volatility; shuffled folds would let tomorrow leak into today's fit (chapter G3). Tsay's numbers are the textbook's, labelled.
        </>
      }
    >
      <div className="g1-folds">
        <StepThrough
          steps={steps}
          onStep={setStep}
          render={(i) => (
            <div className="g1-folds-body">
              {i <= 1 && (
                <div className="g1-panel">
                  <div className="g1-panel-title">
                    <strong>the training days, in five blocks</strong> <span>{i === 0 ? "red: held out and scored · blue: fitted on" : "each block held out once"}</span>
                  </div>
                  <FoldBar held={i === 0 ? 0 : -1} scores={i === 1 ? scores.perFold : undefined} narrow={narrow} />
                </div>
              )}
              {i <= 1 && (
                <div className="g1-panel">
                  <div className="g1-panel-title">
                    <strong>{i === 0 ? "the score on block 1" : "the five scores"}</strong> <span>{CV_K_SHOWN} lags, no leash{i === 1 ? " · red: the block that holds March 2020" : ""}</span>
                  </div>
                  <FoldScores scores={scores.perFold} upto={i === 0 ? 1 : 5} narrow={narrow} />
                </div>
              )}
              {i >= 2 && (
                <div className="g1-panel">
                  <div className="g1-panel-title">
                    <strong>{i === 2 ? "the folds' score against the leash" : "the folds' pick, checked once on the test days"}</strong>{" "}
                    <span>{i === 2 ? `pooled over the five blocks · ${K} lags` : `grey: the folds · blue: the ${n0(FIG1.test.n)} test days`}</span>
                  </div>
                  <LamCurves withTest={i === 3} narrow={narrow} />
                </div>
              )}
            </div>
          )}
        />
      </div>
    </Figure>
  );
}
