import { useEffect, useMemo, useState } from "react";
import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { StepThrough } from "../../../ui/StepThrough";
import { Bars, Curve, HLine, Label, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { M } from "../../../ui/Math";
import { acf, mean, ols } from "../../../engine/regression";
import { getPair, logReturns } from "../series";

type Pick = "0.01" | "0.05" | "0.2";
const OPTS: Array<{ id: Pick; v: number }> = [
  { id: "0.01", v: 0.01 },
  { id: "0.05", v: 0.05 },
  { id: "0.2", v: 0.2 },
];
const n2 = fmt.n(2);
const n3 = fmt.n(3);
const DRAW_MS = 4000;
const LAGS = 20;

function yearOf(d: string): number {
  const [y, m, dd] = d.split("-").map(Number);
  return y + (m - 1) / 12 + (dd - 1) / 365;
}

/** Figure 3 — the hedge that drifted: drag a line through the levels, bet on how sure, watch the leftovers wander. */
export function F3Hedge() {
  const pair = useMemo(() => getPair(), []);
  const [pick, setPick] = useBet<Pick>("A3-F3");
  const [userSlope, setUserSlope] = useState(1);
  const [fitted, setFitted] = useState(false);
  const [step, setStep] = useState(0);
  const [prog, setProg] = useState(0);
  const [changes, setChanges] = useState(false);

  const data = useMemo(() => {
    const { a, b, dates } = pair;
    const t = dates.map(yearOf);
    const normA: Pt[] = a.map((v, i) => [t[i], (100 * v) / a[0]]);
    const normB: Pt[] = b.map((v, i) => [t[i], (100 * v) / b[0]]);
    const levels = ols(a, b);
    const ra = logReturns(a),
      rb = logReturns(b);
    const rets = ols(ra, rb);
    return {
      t,
      normA,
      normB,
      normMax: Math.max(...normA.map((p) => p[1]), ...normB.map((p) => p[1])),
      ma: mean(a),
      mb: mean(b),
      cloud: a.map((v, i) => [v, b[i]] as Pt),
      levels,
      residT: levels.resid.map((e, i) => [t[i], e] as Pt),
      acfLevels: acf(levels.resid, LAGS),
      retCloud: ra.map((v, i) => [v, rb[i]] as Pt),
      rets,
      acfRets: acf(rets.resid, LAGS),
      aMin: Math.min(...a),
      aMax: Math.max(...a),
      bMin: Math.min(...b),
      bMax: Math.max(...b),
      rMax: [...ra.map(Math.abs), ...rb.map(Math.abs)].sort((p, q) => p - q)[Math.floor(0.995 * (ra.length + rb.length))],
      eMax: Math.max(...levels.resid.map(Math.abs)),
    };
  }, [pair]);

  // step 3 (index 2): draw the leftovers in time order over ~4 s
  useEffect(() => {
    if (step !== 2) return;
    setProg(0);
    let start: number | null = null;
    let id = 0;
    const tick = (now: number) => {
      if (start === null) start = now;
      const p = Math.min(1, (now - start) / DRAW_MS);
      setProg(p);
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [step]);

  const { levels, rets } = data;
  const honest = 2 * levels.seHAC;
  const naive = 2 * levels.se;
  // the smallest option that contains the honest band is "right"; narrower is a miss; wider is close
  const rightId = (OPTS.find((o) => o.v >= honest) ?? OPTS[OPTS.length - 1]).id;
  const pickV = OPTS.find((o) => o.id === pick)?.v ?? 0;
  const verdict = pick === rightId ? "right" : pickV < honest ? "miss" : "close";
  const drawn = step > 2 || prog >= 1;
  const showProg = step === 2 ? prog : 1;
  const nShown = Math.max(2, Math.floor(showProg * data.residT.length));

  const lineThrough = (slope: number): Pt[] => [
    [data.aMin, data.mb + slope * (data.aMin - data.ma)],
    [data.aMax, data.mb + slope * (data.aMax - data.ma)],
  ];
  const aPad = (data.aMax - data.aMin) * 0.04,
    bPad = (data.bMax - data.bMin) * 0.04;
  const yearDomain: [number, number] = [Math.floor(data.t[0]), Math.ceil(data.t[data.t.length - 1])];
  const rSpan = data.rMax * 1.05;

  const badge = (stage: "green" | "amber") => (
    <span className={"a3-badge a3-badge-" + stage}>{stage === "green" ? `certain: ± ${n3(naive)}` : `not so certain: the leftovers wander`}</span>
  );

  const acfPlot = (vals: number[], label: string) => (
    <Plot xDomain={[0.5, LAGS + 0.5]} yDomain={[-0.25, 1.18]} width={440} height={240} xLabel="lag, days" yLabel={label} xTicks={5} yTicks={5} ariaLabel={label}>
      <HLine at={0} />
      <Bars bars={vals.map((v, i) => ({ x: i + 1, y: v, w: 0.8 }))} role={Math.abs(vals[0]) > 0.5 ? "error" : "truth"} />
      <Curve pts={[[0.5, 2 / Math.sqrt(levels.n)], [LAGS + 0.5, 2 / Math.sqrt(levels.n)]]} role="ghost" dash="4 3" width={1} smooth={false} />
    </Plot>
  );

  const steps = [
    {
      caption: (
        <>
          You hold the bank index. You can only trade NIFTY. <strong>How much NIFTY per unit of bank index?</strong> Both series are rebased to 100 at the start,
          so you can see them move together — and drift apart.
        </>
      ),
    },
    {
      caption: (
        <>
          Every day is a dot: bank index up, NIFTY across. <strong>Drag</strong> a line through the cloud; it pivots on the centre. Then press "fit it" and place
          your bet on how sure that slope is.
        </>
      ),
    },
    {
      caption: (
        <>
          The textbook says ± {n3(naive)} — <strong>certain</strong>. Now watch the leftovers (each day's gap to the line) drawn in the order they happened,
          and watch the badge.
        </>
      ),
    },
    {
      caption: (
        <>
          Each bar: how much today's leftover resembles the one k days ago. <strong>The leftovers remember themselves for months.</strong> The textbook formula
          counted each day as a fresh coin.
        </>
      ),
    },
    {
      caption: (
        <>
          Same question on <strong>daily changes</strong> instead of levels. The memory collapses, the honest and naive errors agree — and the slope itself moves,
          because a hedge on levels is a hedge on the trend.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>Same line, three levels of honesty.</strong> The slope never changed; only how loudly you may say "sure". Even the last number is generous:
          Newey–West listens four days back, and these leftovers remember for months. The honest fix was step 5 — use changes.
        </>
      ),
    },
  ];

  const render = (i: number) => {
    if (i === 0)
      return (
        <Plot xDomain={yearDomain} yDomain={[0, data.normMax * 1.1]} width={700} height={320} xLabel="year" yLabel="start = 100" xTicks={6} yTicks={5} ariaLabel="Both indices rebased to 100">
          <Curve pts={data.normA} role="truth" width={1.6} smooth={false} />
          <Curve pts={data.normB} role="approx" width={1.6} smooth={false} />
          <Label at={[yearDomain[1], data.normA[data.normA.length - 1][1]]} text={pair.aName} role="truth" anchor="end" dx={-6} dy={-8} />
          <Label at={[yearDomain[1], data.normB[data.normB.length - 1][1]]} text={pair.bName} role="approx" anchor="end" dx={-6} dy={18} />
        </Plot>
      );
    if (i === 1)
      return (
        <>
          <div className="a3-drag">
          <Plot
            xDomain={[data.aMin - aPad, data.aMax + aPad]}
            yDomain={[data.bMin - bPad, data.bMax + bPad]}
            width={700}
            height={340}
            xLabel={pair.aName}
            yLabel={pair.bName}
            xTicks={6}
            yTicks={5}
            onDrag={(x, y) => {
              if (Math.abs(x - data.ma) < (data.aMax - data.aMin) * 0.03) return;
              setUserSlope((y - data.mb) / (x - data.ma));
            }}
            ariaLabel="Bank index against NIFTY, daily levels, with a draggable line"
          >
            <Points pts={data.cloud} role="ink" r={1.6} opacity={0.35} />
            {fitted && <Curve pts={lineThrough(levels.slope)} role="error" width={2.5} smooth={false} />}
            <Curve pts={lineThrough(userSlope)} role="truth" width={2} smooth={false} />
            <Label at={[data.ma, data.mb]} text="centre" role="ghost" dx={8} dy={-8} />
          </Plot>
          </div>
          <div className="a3-row">
            <Readouts items={[["your slope", n2(userSlope)], ["fitted slope", fitted ? n2(levels.slope) : "—"]]} />
            {!fitted && (
              <button type="button" className="btn" onClick={() => setFitted(true)}>
                fit it
              </button>
            )}
          </div>
          <Bet question="How sure is that slope? Give it a ± band." options={OPTS.map((o) => ({ id: o.id, label: `± ${o.id}` }))} pick={pick} onPick={setPick} />
        </>
      );
    if (i === 2)
      return (
        <>
          <div className="a3-row">
            <Readouts items={[["slope", n2(levels.slope)], ["R²", n2(levels.r2)], ["textbook ± (2 × SE)", n3(naive)]]} />
            {badge(drawn ? "amber" : "green")}
          </div>
          <Plot xDomain={yearDomain} yDomain={[-data.eMax * 1.1, data.eMax * 1.1]} width={700} height={280} xLabel="year" yLabel="leftover (gap to the line)" xTicks={6} yTicks={5} ariaLabel="Residuals drawn in time order">
            <HLine at={0} />
            <Curve pts={data.residT.slice(0, nShown)} role={drawn ? "error" : "approx"} width={1.4} smooth={false} />
          </Plot>
          <div className="a3-caption">
            {drawn ? (
              <>
                <strong>The leftovers stay on one side for months at a time.</strong> A fresh coin each day would cross zero constantly.
              </>
            ) : (
              <>Drawing the leftovers, one day after the next…</>
            )}
          </div>
        </>
      );
    if (i === 3)
      return (
        <>
          <div className="a3-row">
            <Readouts items={[["slope", n2(levels.slope)], ["R²", n2(levels.r2)], ["lag-1 memory", n2(data.acfLevels[0])], ["Durbin–Watson", n2(levels.dw)]]} />
            {badge("amber")}
          </div>
          <div className="two">
            <Plot xDomain={yearDomain} yDomain={[-data.eMax * 1.1, data.eMax * 1.1]} width={440} height={240} xLabel="year" yLabel="leftover" xTicks={5} yTicks={4} ariaLabel="Residuals in time order">
              <HLine at={0} />
              <Curve pts={data.residT} role="error" width={1.2} smooth={false} />
            </Plot>
            {acfPlot(data.acfLevels, "memory of the leftovers")}
          </div>
        </>
      );
    if (i === 4)
      return (
        <>
          <div className="a3-row">
            {!changes ? (
              <button type="button" className="btn primary" onClick={() => setChanges(true)}>
                use daily changes instead
              </button>
            ) : (
              <Readouts
                items={[
                  ["slope on changes", n2(rets.slope)],
                  ["naive ± (2 × SE)", n3(2 * rets.se)],
                  ["honest ± (2 × Newey–West)", n3(2 * rets.seHAC)],
                  ["R²", n2(rets.r2)],
                ]}
              />
            )}
          </div>
          <div className="two">
            {changes ? (
              <Plot xDomain={[-rSpan, rSpan]} yDomain={[-rSpan, rSpan]} width={440} height={260} xLabel={`${pair.aName}, daily change`} yLabel="bank index, daily change" xTicks={5} yTicks={5} ariaLabel="Daily log-returns scatter with fit">
                <Points pts={data.retCloud} role="ink" r={1.6} opacity={0.35} />
                <Curve pts={[[-rSpan, rets.intercept - rets.slope * rSpan], [rSpan, rets.intercept + rets.slope * rSpan]]} role="truth" width={2.2} smooth={false} />
                <Label at={[rSpan, rets.intercept + rets.slope * rSpan]} text={`slope ${n2(rets.slope)}`} role="truth" anchor="end" dx={-6} dy={-8} />
              </Plot>
            ) : (
              <Plot xDomain={[data.aMin - aPad, data.aMax + aPad]} yDomain={[data.bMin - bPad, data.bMax + bPad]} width={440} height={260} xLabel={pair.aName} yLabel="bank index" xTicks={5} yTicks={5} ariaLabel="Levels scatter with fit">
                <Points pts={data.cloud} role="ink" r={1.4} opacity={0.3} />
                <Curve pts={lineThrough(levels.slope)} role="error" width={2.2} smooth={false} />
                <Label at={[data.aMax, data.mb + levels.slope * (data.aMax - data.ma)]} text={`slope ${n2(levels.slope)}`} role="error" anchor="end" dx={-6} dy={-8} />
              </Plot>
            )}
            {acfPlot(changes ? data.acfRets : data.acfLevels, changes ? "memory, on changes" : "memory, on levels")}
          </div>
          {changes && (
            <ResultCard
              yours={`± ${pick}`}
              answer={`textbook ± ${n3(naive)}; honest (Newey–West) ± ${n3(honest)} on the levels line — and on daily changes the slope is ${n2(rets.slope)}, not ${n2(levels.slope)}`}
              verdict={verdict}
            >
              "How sure" is a separate claim from "how well it fits". The leftovers here are an event in time, not a fresh coin each day, so the textbook ± is the
              one number on this page you should not believe.
            </ResultCard>
          )}
        </>
      );
    return (
      <>
        <div className="a3-three">
          {[
            { k: "textbook", v: levels.slope / levels.se, sub: "each day a fresh coin", cls: "truth" },
            { k: "White", v: levels.slope / levels.seHC, sub: "lets the leftovers fan out", cls: "approx" },
            { k: "Newey–West", v: levels.slope / levels.seHAC, sub: "lets them remember yesterday", cls: "error" },
          ].map((t) => (
            <div key={t.k} className={"a3-tile " + t.cls}>
              <span className="k">t-ratio, {t.k}</span>
              <span className="v">{n2(t.v)}</span>
              <span className="sub">{t.sub}</span>
            </div>
          ))}
        </div>
        <div className="a3-caption">
          Same slope <span className="num">{n2(levels.slope)}</span>, three standard errors:{" "}
          <M tex={`t = \\tok{truth}{\\text{slope}} \\,/\\, \\tok{error}{\\text{SE}}`} /> — only the <span className="tok-error">SE</span> changes, and with it how
          loudly you may say "sure".
        </div>
      </>
    );
  };

  return (
    <Figure
      n="3"
      prompt={
        <>
          {pair.real
            ? `Real: ${pair.aName} and ${pair.bName}, daily closes from the NSE, 2016 to today.`
            : `Half real: ${pair.aName} is the NSE's; ${pair.bName} is made up — built to follow NIFTY with a hedge ratio that slowly drifts, because that is what real bank indices do. The real NIFTY BANK file replaces it when it arrives, and the lesson will be whatever the data says.`}{" "}
          Step through: drag, bet, then watch the leftovers.
        </>
      }
      observe={
        step < 2 ? (
          <>Six steps. The slope is the easy half; the "how sure" is the half the leftovers decide. Bet before you look.</>
        ) : (
        <>
          The slope was the easy half. The "how sure" assumed every day's leftover was a fresh coin; drawn in time order they wander for months, so the honest
          error is about {n2(levels.seHAC / levels.se)}× the textbook one — and on daily changes the hedge ratio is a different number altogether.
        </>
        )
      }
    >
      <StepThrough steps={steps} render={render} onStep={setStep} />
    </Figure>
  );
}
