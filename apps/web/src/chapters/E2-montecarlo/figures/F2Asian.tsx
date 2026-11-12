import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { Readouts } from "../../../ui/controls";
import { Bars, Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { Bar, BundlePath, ScatterPath, XTicks, YTicks } from "./parts";
import { ASIAN, ASIAN_N, ASIAN_SEED, CHAIN, DAYS, FIX_DAYS, GEO, TRUE_CALL, count, f2, fmtDay, getAsian, histogram, n0, p1, p2, pct1, pm, runningAverage, times, useLazy, useNarrow, type AsianSet } from "./e2";

/**
 * Figure 2 — paths, not points. A what-if Asian call on the average NIFTY close over the seven real trading days 26 Oct → 3 Nov
 * (NSE lists none; dates and closes are real). Five steps: the real road; one simulated road (seed 2, road 0) with its running
 * average; 2,000 roads as a bundle with the pile of averages narrower than the pile of endpoints; the geometric control; the
 * real road's 463 placed in the pile. Step buttons only; three readouts.
 */

const X: [number, number] = [0, 18];
const Y: [number, number] = [20600, 24400];
const REAL = ASIAN.real_closes;
const REAL_PTS: Pt[] = REAL.map((c, i) => [FIX_DAYS[i], c]);
const PILE_X0 = DAYS + 0.6;
const PILE_W = X[1] - PILE_X0 - 0.3;
const BIN = 50;

function Frame({ children, narrow, aria }: { children: React.ReactNode; narrow: boolean; aria: string }) {
  return (
    <Plot xDomain={X} yDomain={Y} width={narrow ? 400 : 600} height={narrow ? 330 : 400} margin={{ top: 12, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={0} axisY={Y[0]} ariaLabel={aria}>
      <YTicks at={[21000, 22000, 23000, 24000]} fmt={n0} />
      <DayLabels />
      <Curve pts={[[DAYS, Y[0]], [DAYS, Y[1]]]} role="ink" width={1} smooth={false} />
      <Label at={[DAYS, Y[1]]} text={`expiry, ${DAYS} days`} dx={-6} dy={26} anchor="end" />
      <Curve pts={[[0, CHAIN.K], [X[1], CHAIN.K]]} role="ink" width={1.6} smooth={false} />
      <Label at={[X[1], CHAIN.K]} text={`strike ${n0(CHAIN.K)}`} role="ink" dx={-4} dy={-5} anchor="end" />
      <Marker at={[0, CHAIN.F]} role="ink" r={4} />
      <Label at={[0, CHAIN.F]} text={`today ${n0(CHAIN.F)}`} dx={8} dy={16} />
      {children}
    </Plot>
  );
}
function DayLabels() {
  const { x, inner } = usePlot();
  return (
    <g>
      {FIX_DAYS.map((d, i) => (
        <g key={d}>
          <line x1={x(d)} x2={x(d)} y1={inner.top + inner.height - 6} y2={inner.top + inner.height} className="e2-tick" />
          <text className="label e2-ticklabel" x={x(d)} y={inner.top + inner.height - 4} textAnchor="middle">
            {i % 2 === 0 ? fmtDay(ASIAN.fix_dates[i]) : ""}
          </text>
        </g>
      ))}
      <text className="label e2-ticklabel" x={x(0)} y={inner.top + inner.height - 4} textAnchor="start">
        today
      </text>
    </g>
  );
}

/** a sideways pile (histogram over price) drawn to the right of the expiry line */
function SidePile({ values, role, opacity, scale, label, labelAt }: { values: ArrayLike<number>; role: "truth" | "approx" | "ghost"; opacity: number; scale: number; label?: string; labelAt?: number }) {
  const h = useMemo(() => histogram(values, Y[0], Y[1], BIN), [values]);
  const bars = h.counts.map((c, i) => ({ x: PILE_X0 + (c / scale) * PILE_W * 0.5, y: h.lo + (i + 0.5) * BIN, w: 0, y0: 0, c }));
  return (
    <g>
      <HBars bars={bars.filter((b) => b.c > 0).map((b) => ({ price: b.y, len: (b.c / scale) * PILE_W }))} role={role} opacity={opacity} />
      {label && labelAt !== undefined && <Label at={[PILE_X0 + 0.1, labelAt]} text={label} role={role === "ghost" ? "ink" : role} dx={2} dy={-4} />}
    </g>
  );
}
function HBars({ bars, role, opacity }: { bars: Array<{ price: number; len: number }>; role: string; opacity: number }) {
  const { x, y } = usePlot();
  const hpx = Math.abs(y(BIN) - y(0)) - 1;
  return (
    <g>
      {bars.map((b, i) => (
        <rect key={i} x={x(PILE_X0)} y={y(b.price + BIN / 2)} width={Math.max(0.5, x(PILE_X0 + b.len) - x(PILE_X0))} height={Math.max(0.5, hpx)} fill={`var(--${role})`} opacity={opacity} />
      ))}
    </g>
  );
}

function RoadStage({ step, A, narrow }: { step: number; A: AsianSet | null; narrow: boolean }) {
  const road0 = A ? Array.from(A.run.paths[0]) : null;
  const run0 = road0 ? runningAverage(road0) : null;
  const realAvg = ASIAN.real_avg;
  const aria = step === 0 ? "the seven real closes from 26 October to 3 November as a road, their average and the strike" : step === 1 ? "one simulated road of seven exact log-steps with its running average, against the real road" : "2,000 simulated roads as a bundle, with the pile of their averages narrower than the pile of their endpoints";
  const maxCount = A ? Math.max(...histogram(A.ends, Y[0], Y[1], BIN).counts) : 1;
  return (
    <Frame narrow={narrow} aria={aria}>
      {step >= 2 && A && (
        <>
          <BundlePath rows={A.roads} m={A.m} xs={FIX_DAYS} n={ASIAN_N} role="ghost" opacity={0.06} />
          <SidePile values={A.ends} role="ghost" opacity={0.5} scale={maxCount} label={narrow ? `end: sd ${n0(A.endsSd)}` : `where they end (grey): sd ${n0(A.endsSd)}`} labelAt={23900} />
          <SidePile values={A.run.arith} role="truth" opacity={0.65} scale={maxCount} label={narrow ? `average: sd ${n0(A.avgSd)}` : `what they averaged (blue): sd ${n0(A.avgSd)}`} labelAt={23600} />
        </>
      )}
      {step <= 1 && (
        <>
          <Curve pts={[[FIX_DAYS[0], realAvg], [DAYS, realAvg]]} role="truth" width={1.2} dash="5 3" smooth={false} />
          <Curve pts={REAL_PTS} role="truth" width={step === 0 ? 2.2 : 1.4} smooth={false} opacity={step === 0 ? 1 : 0.5} />
          {REAL_PTS.map((p, i) => (
            <Marker key={i} at={p} role="truth" r={step === 0 ? 4 : 3} />
          ))}
        </>
      )}
      {step === 0 && (
        <>
          <Label at={[FIX_DAYS[0], realAvg]} text={`average of the 7 closes: ${p2(realAvg)}`} role="truth" dx={-2} dy={-6} anchor="start" />
          <Label at={[FIX_DAYS[0], REAL[0]]} text={`${fmtDay(ASIAN.fix_dates[0])}: ${p2(REAL[0])}`} role="truth" dx={-6} dy={-10} anchor="start" />
          <Label at={[DAYS, REAL[6]]} text={`${fmtDay(ASIAN.fix_dates[6])}: ${p2(REAL[6])}`} role="truth" dx={6} dy={4} />
          <Curve pts={[[DAYS + 0.4, CHAIN.K], [DAYS + 0.4, realAvg]]} role="approx" width={3} smooth={false} />
          <Label at={[DAYS + 0.4, (CHAIN.K + realAvg) / 2]} text={`pays average − strike = ${p2(ASIAN.real_payoff)}`} role="approx" dx={8} dy={4} />
          <Label at={[0.3, Y[1]]} text="what-if contract on real dates (real closes, NSE)" role="ink" dx={0} dy={12} />
        </>
      )}
      {step === 1 && road0 && run0 && (
        <>
          <Curve pts={road0.map((v, i) => [FIX_DAYS[i], v] as Pt)} role="approx" width={2.2} smooth={false} />
          {road0.map((v, i) => (
            <Marker key={i} at={[FIX_DAYS[i], v]} role="approx" r={4} />
          ))}
          <Curve pts={run0.map((v, i) => [FIX_DAYS[i], v] as Pt)} role="approx" width={1.4} dash="5 3" smooth={false} />
          <Curve pts={[[0, CHAIN.F], [FIX_DAYS[0], road0[0]]]} role="ghost" width={1} dash="3 3" smooth={false} />
          <Label at={[DAYS, run0[6]]} text={`average ${n0(run0[6])}: below the strike, pays 0`} role="approx" dx={6} dy={14} />
          <Label at={[DAYS, road0[6]]} text={`the road ends at ${n0(road0[6])}`} role="approx" dx={6} dy={-4} />
          <Label at={[FIX_DAYS[0], REAL[0]]} text="the real road, for scale" role="truth" dx={0} dy={-10} anchor="middle" />
          <Label at={[0.3, Y[1]]} text={`one simulated road: seven exact log-steps, seed ${ASIAN_SEED}, road 0`} role="ink" dx={0} dy={12} />
        </>
      )}
      {step === 2 && A && (
        <>
          <Label at={[0.3, Y[1]]} text={`${count(ASIAN_N)} simulated roads (seed ${ASIAN_SEED}), piled two ways at the expiry`} role="ink" dx={0} dy={12} />
          <Label at={[0.3, Y[0]]} text={narrow ? `average-call ${p1(A.arith.mean)} ${pm(A.arith.se)} · plain call ${p1(TRUE_CALL)}` : `the average-call: ${p1(A.arith.mean)} ${pm(A.arith.se)} (key's 10⁶ roads: ${p1(ASIAN.reference.arith)}) — the plain call is ${p1(TRUE_CALL)}`} role="truth" dx={0} dy={-20} />
        </>
      )}
    </Frame>
  );
}

/** step 4: the geometric control — the scatter of arithmetic against geometric payoff, and the bars */
function ControlStage({ A, narrow }: { A: AsianSet; narrow: boolean }) {
  const ref = ASIAN.reference;
  const lim = 1400;
  const ratioW = Math.sqrt(A.cv.ratio);
  const bx: [number, number] = [161, 181];
  return (
    <div className="e2-asian-two">
      <Plot xDomain={[0, lim]} yDomain={[-lim * 0.08, lim]} width={narrow ? 400 : 300} height={narrow ? 300 : 280} margin={{ top: 10, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={0} axisY={0} ariaLabel="each road's arithmetic-average payoff against its geometric-average payoff: a near-perfect straight line">
        <XTicks at={[500, 1000]} />
        <Label at={[lim, 0]} text="geometric payoff →" role="ink" dx={-4} dy={-22} anchor="end" />
        <YTicks at={[500, 1000]} fmt={(v) => String(v)} />
        <ScatterPath xs={A.run.payGeo} ys={A.run.payArith} n={ASIAN_N} role="truth" r={1.8} opacity={0.45} />
        <Curve pts={[[0, 0], [lim, lim * A.cv.b]]} role="error" width={1.2} dash="4 3" smooth={false} />
        <Label at={[lim * 0.55, lim * 0.55 * A.cv.b]} text={`slope b = ${f2(A.cv.b)}`} role="error" dx={-8} dy={-6} anchor="end" />
        <Label at={[0, lim]} text="↑ arithmetic payoff, each of the 2,000 roads" role="truth" dx={4} dy={12} />
        <Label at={[lim * 0.55, lim * 0.2]} text={`${count(A.run.payArith.filter((v) => v === 0).length)} roads pay nothing on either`} role="ink" dx={0} dy={0} anchor="middle" />
      </Plot>
      <Plot xDomain={bx} yDomain={[-1.4, 3.6]} width={narrow ? 400 : 300} height={narrow ? 200 : 280} margin={{ top: 10, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={bx[0]} axisY={-1.4} ariaLabel="the plain estimate's bar, the geometric closed form, the corrected estimate's bar and the key's million-road reference">
        <XTicks at={[165, 170, 175]} label="price" />
        <Curve pts={[[GEO.price, -0.6], [GEO.price, 3.6]]} role="approx" width={1.5} dash="4 3" smooth={false} />
        <Label at={[GEO.price, 3.6]} text={`geometric, closed form ${p2(GEO.price)}`} role="approx" dx={4} dy={12} />
        <Bar mean={A.arith.mean} se={A.arith.se} yv={2} bold={false} role="ink" />
        <Label at={[A.arith.mean, 2]} text={`plain: ${p1(A.arith.mean)} ${pm(A.arith.se)}`} role="ink" dx={0} dy={-9} anchor="middle" />
        <Bar mean={A.cv.mean} se={A.cv.se} yv={1} bold role="truth" thick={6} />
        <Label at={[A.cv.mean, 1]} text={`corrected: ${p2(A.cv.mean)} ${pm(A.cv.se, 2)}`} role="truth" dx={0} dy={-9} anchor="middle" />
        <Bar mean={ref.cv} se={ref.cv_se} yv={0} bold={false} role="ink" thick={3} />
        <Label at={[ref.cv, 0]} text={`key, 10⁶ roads: ${p2(ref.cv)} ${pm(ref.cv_se, 4)}`} role="ink" dx={0} dy={-9} anchor="middle" />
        <Label at={[bx[0], -0.6]} text={`variance ratio ${count(A.cv.ratio)}: the bar is ${Math.round(ratioW)}× narrower`} role="truth" dx={4} dy={-2} />
      </Plot>
    </div>
  );
}

/** step 5: the pile of 2,000 arithmetic payoffs with the real road's 463 in it */
function PileStage({ A, narrow }: { A: AsianSet; narrow: boolean }) {
  const W = 50;
  const h = useMemo(() => histogram(A.run.payArith, 0, 1800, W), [A]);
  const firstBin = h.counts[0];
  let zeros = 0;
  for (let i = 0; i < A.run.payArith.length; i++) if (A.run.payArith[i] === 0) zeros++;
  const yMax = Math.max(...h.counts.slice(1)) * 1.3;
  const real = ASIAN.real_payoff;
  return (
    <Plot xDomain={[-W, 1800]} yDomain={[-yMax * 0.07, yMax]} width={narrow ? 400 : 600} height={narrow ? 300 : 360} margin={{ top: 12, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={-W} axisY={0} ariaLabel={`the pile of 2,000 simulated payoffs of the average-call, most of them zero, with the real road's ${p1(real)} marked near the top`}>
      <XTicks at={[0, 250, 500, 750, 1000, 1250, 1500]} label="payoff →" />
      <Bars bars={h.counts.map((c, i) => ({ x: (i + 0.5) * W, y: Math.min(c, yMax * 0.96), w: W }))} role="truth" opacity={0.6} gap={1} />
      <Label at={[W / 2, yMax * 0.96]} text={`${count(firstBin)} roads pay under ${W} — ${count(zeros)} of them 0 (bar cut)`} role="truth" dx={6} dy={10} />
      <Curve pts={[[real, 0], [real, yMax * 0.75]]} role="approx" width={2.4} smooth={false} />
      <Marker at={[real, yMax * 0.75]} role="approx" r={5} />
      <Label at={[real, yMax * 0.75]} text={`the real road: ${p1(real)}`} role="approx" dx={8} dy={-6} />
      <Label at={[real, yMax * 0.75]} text={`beyond ${pct1(A.realPct)} of the roads — rank ${count(A.realRank)} of ${count(ASIAN_N)} from the top`} role="approx" dx={8} dy={10} />
      <Curve pts={[[A.arith.mean, 0], [A.arith.mean, yMax * 0.6]]} role="ink" width={1.5} dash="4 3" smooth={false} />
      <Label at={[A.arith.mean, yMax * 0.6]} text={`the price, ${p1(A.arith.mean)} — the pile's mean`} role="ink" dx={8} dy={-6} />
    </Plot>
  );
}

export function F2Asian() {
  const narrow = useNarrow();
  const [step, setStep] = useState(0);
  const A = useLazy("asian", getAsian);
  const ref = ASIAN.reference;
  const price = A ? (step === 3 ? p2(A.cv.mean) : step >= 2 ? p1(A.arith.mean) : "—") : "…";
  const band = A ? (step === 3 ? A.cv.se.toFixed(2) : step >= 2 ? A.arith.se.toFixed(1) : "—") : "…";
  const ratio = A && step === 3 ? `${count(A.cv.ratio)} (≈ ${Math.round(Math.sqrt(A.cv.ratio))}× narrower)` : "—";

  const steps = [
    {
      caption: (
        <>
          <strong>The contract, and the real road.</strong> A what-if: a call struck at {n0(CHAIN.K)} on the <em>average</em> NIFTY close over the seven trading days {fmtDay(ASIAN.fix_dates[0])} →{" "}
          {fmtDay(ASIAN.fix_dates[6])} (NSE lists no such contract; the dates and closes are real). The index went {p2(REAL[0])} → {p2(REAL[6])}; the average was {p2(ASIAN.real_avg)}, so this
          contract paid <strong>{p2(ASIAN.real_payoff)}</strong>. You cannot price it from the cloud of endpoints: the payoff depends on the whole road.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>One simulated road.</strong> Seven exact log-steps from today's {n0(CHAIN.F)}, one draw per step (seed {ASIAN_SEED}, road 0), with its running average as the dashed line. This road
          drifts down: its average is {A ? n0(A.run.arith[0]) : "…"}, below the strike, and the contract pays nothing. One road is one draw.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>{count(ASIAN_N)} roads.</strong> Pile them at the expiry two ways. Where they <em>end</em> spreads with sd {A ? n0(A.endsSd) : "…"}; what they <em>averaged</em> spreads with sd{" "}
          {A ? n0(A.avgSd) : "…"} — an average wobbles less than an endpoint. So the average-call is cheaper than the plain call: <strong>{A ? p1(A.arith.mean) : "…"} {A ? pm(A.arith.se) : ""}</strong>{" "}
          from these roads, {p1(ref.arith)} ± {f2(ref.arith_se)} from the key's million, against {p1(TRUE_CALL)}.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>The control.</strong> The <em>geometric</em> average has a closed form — {p2(GEO.price)} for this contract — and every road's geometric payoff sits almost on a line with its
          arithmetic one (slope {A ? f2(A.cv.b) : "…"}). Correct each road: arithmetic payoff − b × (geometric payoff − {p2(GEO.price)}). The estimate becomes{" "}
          <strong>{A ? p2(A.cv.mean) : "…"} {A ? pm(A.cv.se, 2) : ""}</strong>: about {A ? Math.round(Math.sqrt(A.cv.ratio)) : "…"}× narrower from the same {count(ASIAN_N)} roads. Price the
          thing you cannot solve by correcting it with the thing you can. (Seven fixings in eleven days make the two averages near-identical; on a year of monthly fixings the factor is tens, not
          hundreds.)
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>The real road in the pile.</strong> The index rose {((REAL[6] / REAL[0] - 1) * 100).toFixed(1)} % in the week, and the real contract paid {p1(ASIAN.real_payoff)} against a price of{" "}
          {A ? p1(A.arith.mean) : "…"}: beyond {A ? pct1(A.realPct) : "…"} of the {count(ASIAN_N)} simulated roads. One road is one draw, and this one landed near the top of the pile. The price is
          the pile's mean, not a forecast of the road.
        </>
      ),
    },
  ];

  return (
    <Figure
      n="2"
      prompt={
        <>
          A payoff that depends on the whole road, on real dates: a call on the <em>average</em> of the seven NIFTY closes {fmtDay(ASIAN.fix_dates[0])} → {fmtDay(ASIAN.fix_dates[6])} (a what-if
          contract — NSE lists none). Step through: the real road, one drawn road, two thousand, the trick that makes it precise, and where the real road fell.
        </>
      }
      controls={<Readouts items={[["price", price], ["±", band], ["variance ratio", ratio]]} />}
      observe={
        <>
          Fixings on the seven real trading days {fmtDay(ASIAN.fix_dates[0])} → {fmtDay(ASIAN.fix_dates[6])} (NSE closes, the same file as E1); real average {p2(ASIAN.real_avg)}, payoff{" "}
          {p2(ASIAN.real_payoff)} (key). Seed {ASIAN_SEED}, {count(ASIAN_N)} roads: arithmetic {p1(ASIAN.seeded.arith)} ± {f2(ASIAN.seeded.arith_se)}; corrected {p2(ASIAN.seeded.cv)} ±{" "}
          {ASIAN.seeded.cv_se.toFixed(3)}, variance ratio {count(ASIAN.seeded.ratio)}; endpoint sd {n0(ASIAN.seeded.endpoint_sd)}, average sd {n0(ASIAN.seeded.average_sd)} (key). Geometric closed form{" "}
          {p2(ASIAN.geo_closed)}; the key's 10⁶-road reference {p1(ref.arith)} ± {f2(ref.arith_se)} plain, {p2(ref.cv)} ± {ref.cv_se.toFixed(4)} corrected, ratio {count(Math.round(ref.cv_ratio))} —{" "}
          {times(Math.sqrt(ref.cv_ratio), 0)} narrower. The plain {n0(CHAIN.K)} call: {p1(ASIAN.european)}.
        </>
      }
    >
      <div className="e2-asian">
        <StepThrough
          steps={steps}
          onStep={setStep}
          render={(i) => (
            <div className="e2-asian-stage">
              {i <= 2 && <RoadStage step={i} A={A} narrow={narrow} />}
              {i === 3 && (A ? <ControlStage A={A} narrow={narrow} /> : <div className="e2-wait">computing the roads…</div>)}
              {i === 4 && (A ? <PileStage A={A} narrow={narrow} /> : <div className="e2-wait">computing the roads…</div>)}
            </div>
          )}
        />
      </div>
    </Figure>
  );
}
