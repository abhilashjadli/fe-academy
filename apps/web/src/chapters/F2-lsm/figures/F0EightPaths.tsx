import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { StepThrough } from "../../../ui/StepThrough";
import { Readouts } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { XTicks, YTicks } from "./parts";
import { HULL, HULL_PATHS, exerciseOf, getHullRun, n2, n3, n4, neg, useNarrow, type SmallRound } from "./f2";

/**
 * Figure 0 — Hull §20.9 / Longstaff–Schwartz 2001 (textbook, labelled): eight paths of a stock at 1.00, a three-year put struck
 * at 1.10 exercisable at years 1, 2, 3. Bet first (path 1 at year 2: exercise for 0.02 or wait?), then step through the two
 * regressions and the cash-flow table. Live lsmSmall on the key's paths (equals key.hull209, Hull Tables 20.1–20.4).
 * Step buttons only; three readouts.
 */

type Pick = "exercise" | "wait";
const K = HULL.K;
const STEPS = HULL_PATHS[0].length - 1;
const X: [number, number] = [-0.38, STEPS + 0.42];
const Y: [number, number] = [0.68, 1.62];
const RX: [number, number] = [0.72, 1.13];
const RY: [number, number] = [-0.03, 0.47];

const fit = (c: number[], s: number) => c[0] + c[1] * s + c[2] * s * s;
const coefText = (c: number[]) => neg(`V = ${c[0].toFixed(3)} ${c[1] < 0 ? "−" : "+"} ${Math.abs(c[1]).toFixed(3)}S ${c[2] < 0 ? "−" : "+"} ${Math.abs(c[2]).toFixed(3)}S²`);
const list = (ps: number[]) => (ps.length === 0 ? "none" : ps.length === 1 ? `path ${ps[0]}` : `paths ${ps.slice(0, -1).join(", ")} and ${ps[ps.length - 1]}`);

/** which round (if any) a step shows: step 1 → year 2, step 2 → year 1 */
/** nudge path-number labels apart where paths end within a hair of each other */
function spread(ys: number[], minGap: number): number[] {
  const order = ys.map((y, i) => [y, i] as const).sort((a, b) => a[0] - b[0]);
  const out = ys.slice();
  let prev = -Infinity;
  for (const [y, i] of order) {
    const v = Math.max(y, prev + minGap);
    out[i] = v;
    prev = v;
  }
  return out;
}

function roundOf(step: number, rounds: SmallRound[]): SmallRound | null {
  if (step === 1) return rounds[0];
  if (step === 2) return rounds[1];
  return null;
}

function Paths({ step, round, ex, narrow }: { step: number; round: SmallRound | null; ex: Array<{ t: number; amount: number }>; narrow: boolean }) {
  const t = round?.t ?? null;
  return (
    <Plot xDomain={X} yDomain={Y} width={narrow ? 400 : 330} height={narrow ? 260 : 300} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={Y[0]} ariaLabel={`Hull's eight stock-price paths over three years, starting at 1.00, against the put's strike of ${n2(K)}`}>
      <YTicks at={[0.8, 1.0, 1.2, 1.4]} fmt={n2} />
      <XTicks at={[0, 1, 2, 3]} fmt={(v) => (v === 0 ? "now" : `year ${v}`)} />
      <Curve pts={[[X[0], K], [X[1], K]]} role="ink" width={1} dash="5 4" smooth={false} />
      <Label at={[X[1], K]} text={`strike ${n2(K)}`} role="ink" dx={-4} dy={-5} anchor="end" />
      {t !== null && <Curve pts={[[t, Y[0]], [t, Y[1]]]} role="ghost" width={1} smooth={false} />}
      {HULL_PATHS.map((p, i) => {
        const pts: Pt[] = p.map((v, k) => [k, v]);
        const inRound = round ? round.paths.includes(i + 1) : false;
        const exercised = round ? inRound && round.exercise[round.paths.indexOf(i + 1)] : false;
        const role = round ? (exercised ? "error" : inRound ? "approx" : "ghost") : step === 3 ? (ex[i].t > 0 ? "approx" : "ghost") : "truth";
        return <Curve key={i} pts={pts} role={role} width={round && inRound ? 2.2 : 1.5} opacity={role === "ghost" ? 0.7 : 1} smooth={false} />;
      })}
      {spread(
        HULL_PATHS.map((p) => p[STEPS]),
        0.045,
      ).map((yl, i) => (
        <Label key={i} at={[STEPS, yl]} text={String(i + 1)} role="ink" dx={6} dy={3.5} />
      ))}
      {t !== null &&
        round!.paths.map((pi, k) => {
          const S = round!.S[k];
          const exd = round!.exercise[k];
          return <Marker key={pi} at={[t, S]} role={exd ? "error" : "approx"} r={exd ? 5 : 4} />;
        })}
      {step === 3 &&
        ex.map((e, i) => (e.t > 0 ? <Marker key={i} at={[e.t, HULL_PATHS[i][e.t]]} role="error" r={4.5} /> : null))}
      {step === 3 && <Label at={[X[0], Y[1]]} text="red dots: where each path exercises" role="error" dx={4} dy={12} />}
      {t !== null && <Label at={[t, Y[1]]} text={`year ${t}: ${round!.paths.length} in the money`} role="ink" dx={t === 1 ? 6 : -6} dy={12} anchor={t === 1 ? "start" : "end"} />}
    </Plot>
  );
}

/** the regression at one date: Y (discounted later cash) against S, the fitted parabola, and the exercise line K − S */
function Regression({ round, narrow }: { round: SmallRound; narrow: boolean }) {
  const curve: Pt[] = Array.from({ length: 41 }, (_, i) => {
    const s = RX[0] + ((RX[1] - RX[0]) * i) / 40;
    return [s, fit(round.coef, s)];
  });
  return (
    <Plot xDomain={RX} yDomain={RY} width={narrow ? 400 : 310} height={narrow ? 260 : 300} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={RX[0]} axisY={RY[0]} ariaLabel={`regression at year ${round.t}: what each in-the-money path went on to earn against its price, the fitted parabola, and the payoff of exercising now`}>
      <YTicks at={[0.1, 0.2, 0.3]} fmt={n2} />
      <XTicks at={[0.8, 0.9, 1.0]} fmt={n2} />
      <Curve pts={[[RX[0], K - RX[0]], [K, 0]]} role="ink" width={1.2} dash="5 4" smooth={false} />
      <Label at={[0.86, K - 0.86]} text={`exercise now: ${n2(K)} − S`} role="ink" dx={8} dy={10} />
      <Curve pts={curve} role="truth" width={2} smooth={false} />
      {round.paths.map((pi, k) => {
        const S = round.S[k];
        const exd = round.exercise[k];
        return (
          <g key={pi}>
            <Curve pts={[[S, round.exerciseValue[k]], [S, round.continuation[k]]]} role="ghost" width={1} smooth={false} />
            <Marker at={[S, round.Y[k]]} role="approx" r={4.5} />
            <Marker at={[S, round.exerciseValue[k]]} role={exd ? "error" : "ink"} r={3} />
            <Label at={[S, round.Y[k]]} text={String(pi)} role="approx" dx={round.Y[k] < 0.01 ? -8 : 7} dy={round.Y[k] < 0.01 ? 3.5 : -6} anchor={round.Y[k] < 0.01 ? "end" : "start"} />
          </g>
        );
      })}
      <Label at={[RX[0], RY[1]]} text="amber: what each path went on to earn, discounted" role="approx" dx={4} dy={12} />
      <Label at={[RX[0], RY[1]]} text="blue: the fit — what waiting is worth at each price" role="truth" dx={4} dy={25} />
    </Plot>
  );
}

function CashTable({ cash, price }: { cash: number[][]; price: number }) {
  return (
    <table className="f2-table" aria-label="cash flow of each path by year after the exercise decisions">
      <thead>
        <tr>
          <th>path</th>
          <th>year 1</th>
          <th>year 2</th>
          <th>year 3</th>
        </tr>
      </thead>
      <tbody>
        {cash.map((row, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            {row.slice(1).map((v, k) => (
              <td key={k} className={v > 0 ? "f2-cash" : "f2-dim"}>
                {v > 0 ? n2(v) : "—"}
              </td>
            ))}
          </tr>
        ))}
        <tr className="f2-total">
          <td colSpan={4}>
            discount each at {Math.round(HULL.r * 100)} % a year, add, divide by {cash.length}: <b>{n4(price)}</b>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function F0EightPaths() {
  const narrow = useNarrow();
  const [pick, setPick] = useBet<Pick>("f2-f0");
  const [step, setStep] = useState(0);
  const run = getHullRun();
  const round = roundOf(step, run.rounds);
  const ex = exerciseOf(run);
  const r2 = run.rounds[0];
  const r1 = run.rounds[1];
  const path1 = r2.paths.indexOf(1);
  const waits = !r2.exercise[path1];
  const verdict = pick === (waits ? "wait" : "exercise") ? "right" : "miss";
  const OPTIONS: Array<{ id: Pick; label: string }> = [
    { id: "exercise", label: `exercise — take the ${n2(r2.exerciseValue[path1])}` },
    { id: "wait", label: "wait" },
  ];
  const yoursLabel = OPTIONS.find((o) => o.id === pick)?.label ?? "";
  const exList = (r: SmallRound) => r.paths.filter((_, k) => r.exercise[k]);
  const payoff3 = HULL_PATHS.map((p) => Math.max(K - p[STEPS], 0));
  const pays3 = payoff3.map((v, i) => (v > 0 ? i + 1 : 0)).filter((i) => i > 0);

  const steps = [
    {
      caption: (
        <>
          Hull's Table 20.1: eight paths of a stock at 1.00, one price a year for three years (textbook). A put struck at {n2(K)} may be exercised at year 1, 2 or 3. At year 3 there is no decision: each
          path pays {n2(K)} − S if that is positive — {list(pays3)} ({pays3.map((i) => n2(payoff3[i - 1])).join(", ")}). Now walk back a year.
        </>
      ),
    },
    {
      caption: (
        <>
          Year 2. {r2.paths.length} paths are in the money ({list(r2.paths)}). For each, what did waiting pay — its year-3 cash, discounted a year — against where it stood? Least squares through those {r2.paths.length} points
          gives {coefText(r2.coef)} (Hull: {coefText(HULL.book.t2.coef)}). Exercise where {n2(K)} − S beats the fit: {list(exList(r2))}. Path 1 at {n2(r2.S[path1])} would collect {n2(r2.exerciseValue[path1])}; the fit says waiting
          is worth {n3(r2.continuation[path1])} — it waits.
        </>
      ),
    },
    {
      caption: (
        <>
          Year 1, with the year-2 decisions already written into the cash flows. {r1.paths.length} paths are in the money ({list(r1.paths)}); the fit is {coefText(r1.coef)} (Hull: {coefText(HULL.book.t1.coef)}), and{" "}
          {list(exList(r1))} exercise. Path 1 at {n2(r1.S[r1.paths.indexOf(1)])} would collect {n2(r1.exerciseValue[r1.paths.indexOf(1)])} against a fit of {n3(r1.continuation[r1.paths.indexOf(1)])} — it waits again, and ends up
          worth nothing.
        </>
      ),
    },
    {
      caption: (
        <>
          Each path now exercises once or never (Hull Table 20.4). Discount each cash flow at {Math.round(HULL.r * 100)} %, add, divide by eight: <b>{n4(run.price)}</b> — Hull prints {n4(HULL.book_price)}. Exercising today would
          pay {n2(HULL.immediate)}; the European put on the same eight paths (year-3 payoffs only) is worth {n4(HULL.european_8paths)} (key). Two regressions and a comparison: that is the algorithm.
        </>
      ),
    },
  ];

  return (
    <Figure
      n="0"
      prompt={
        <>
          Textbook, not the chain: Hull's eight paths. A stock at 1.00, a put struck at {n2(K)} that may be exercised at the end of years 1, 2 or 3. The hard question at every date is "what is
          waiting worth?" — and no single path can say. Bet first, then step.
        </>
      }
      controls={
        <Readouts
          items={[
            [round ? `the fit at year ${round.t}` : "the fit", round ? coefText(round.coef) : "—"],
            ["exercise", round ? list(exList(round)) : step === 3 ? `${ex.filter((e) => e.t > 0).length} of 8 paths, once each` : "—"],
            ["price", step === 3 ? `${n4(run.price)} · Hull ${n4(HULL.book_price)}` : "…"],
          ]}
        />
      }
      observe={
        <>
          Hull Tables 20.1–20.4 reproduced (key; Hull prints the coefficients to three decimals): at year 2 the regression on the {r2.paths.length} in-the-money paths is {coefText(r2.coef)}, continuation values{" "}
          {r2.continuation.map((c) => n4(c)).join(", ")} against exercise values {r2.exerciseValue.map((c) => n2(c)).join(", ")}, so {list(exList(r2))} exercise; at year 1, {coefText(r1.coef)} and{" "}
          {list(exList(r1))}. Price {n4(run.price)} against {n2(HULL.immediate)} for exercising now and {n4(HULL.european_8paths)} for the European put on the same paths. The fit is judged on the paths
          that made it — with eight paths that is the whole story, and Figure 1 shows what it costs.
        </>
      }
    >
      <div className="f2-eight">
        <Bet<Pick>
          question={
            <>
              At year 2, path 1 sits at {n2(r2.S[path1])}: exercising the {n2(K)} put collects {n2(r2.exerciseValue[path1])} now. Exercise, or wait?
            </>
          }
          options={OPTIONS}
          pick={pick}
          onPick={setPick}
        >
          <ResultCard yours={yoursLabel} answer={<>it waits — the curve fitted through the five in-the-money paths says waiting is worth {n3(r2.continuation[path1])}, more than the {n2(r2.exerciseValue[path1])} on offer</>} verdict={verdict}>
            Path 1 itself goes on to earn nothing, but the decision is not made on path 1 alone: the five in-the-money paths together say what a stock at about {n2(r2.S[path1])} tends to be worth
            if the put is kept. Step through the two regressions to see how.
          </ResultCard>
        </Bet>
        <StepThrough
          steps={steps}
          onStep={setStep}
          render={(i) => {
            const r = roundOf(i, run.rounds);
            return (
              <div className="f2-eight-two">
                <div className="f2-panel">
                  <div className="f2-panel-title">
                    <strong>the eight paths</strong> <span>{r ? `year ${r.t}: amber in the money, red exercise` : i === 3 ? "each path's exercise date" : "stock price, one a year"}</span>
                  </div>
                  <Paths step={i} round={r} ex={ex} narrow={narrow} />
                </div>
                <div className="f2-panel">
                  {r ? (
                    <>
                      <div className="f2-panel-title">
                        <strong>the regression at year {r.t}</strong> <span>what waiting paid, against the price</span>
                      </div>
                      <Regression round={r} narrow={narrow} />
                    </>
                  ) : i === 3 ? (
                    <>
                      <div className="f2-panel-title">
                        <strong>Hull Table 20.4</strong> <span>cash flow of each path</span>
                      </div>
                      <CashTable cash={run.cash} price={run.price} />
                    </>
                  ) : (
                    <>
                      <div className="f2-panel-title">
                        <strong>Hull Table 20.1</strong> <span>the prices</span>
                      </div>
                      <table className="f2-table" aria-label="Hull's eight paths as a table">
                        <thead>
                          <tr>
                            <th>path</th>
                            <th>now</th>
                            <th>year 1</th>
                            <th>year 2</th>
                            <th>year 3</th>
                          </tr>
                        </thead>
                        <tbody>
                          {HULL_PATHS.map((p, k) => (
                            <tr key={k}>
                              <td>{k + 1}</td>
                              {p.map((v, j) => (
                                <td key={j} className={j === STEPS && v < K ? "f2-cash" : undefined}>
                                  {n2(v)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>
    </Figure>
  );
}
