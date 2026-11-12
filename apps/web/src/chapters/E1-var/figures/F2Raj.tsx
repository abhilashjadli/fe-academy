import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { Readouts, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, Points, usePlot, type Pt } from "../../../ui/Plot";
import { Z99, bookPnl, historicalVaR, quadCoefficients } from "../../../engine/var";
import { BOOK, CF, DATES, DIAL, DIAL_DEFAULT, GREEKS, HEDGE, KEY, N, RETURNS, count, f2, fmtDate, lakh, n0, n2, repriced, rs, rsSigned, useNarrow } from "./e1";

/**
 * Figure 2 — Raj's ₹144. His book from D1 (short 6,500 of the 22,600 call, long 3,292 futures). Three steps on one picture of
 * "P&L tomorrow against the index's move": the slope alone says ₹144; repricing the book on every real day says ₹10.3 lakh;
 * the bend on a bell says ₹7.35 lakh. One dial, the futures held, over the key's fifteen stops; three readouts.
 */

const XR = 6; // % move either way
const GRID: number[] = Array.from({ length: 91 }, (_, i) => -XR + (2 * XR * i) / 90);
const SIG_PCT = 100 * BOOK.sigDay;

function Ticks({ yLo, yHi, rupees }: { yLo: number; yHi: number; rupees: boolean }) {
  const { x, y, inner } = usePlot();
  const step = rupees ? niceStep((yHi - yLo) / 4) : niceStep((yHi - yLo) / 5);
  const ticks: number[] = [];
  for (let v = Math.ceil(yLo / step) * step; v <= yHi; v += step) ticks.push(v);
  return (
    <g>
      {[-6, -4, -2, 0, 2, 4, 6].map((v) => (
        <text key={v} className="label e1-ticklabel" x={x(v)} y={inner.top + inner.height - 4} textAnchor={v === -6 ? "start" : v === 6 ? "end" : "middle"}>
          {v === 0 ? "no move" : `${v > 0 ? "+" : "−"}${Math.abs(v)} %`}
        </text>
      ))}
      {ticks.map((v) => (
        <text key={v} className="label e1-ticklabel" x={inner.left + 3} y={y(v) - 2}>
          {Math.abs(v) < 1e-9 ? "0" : rupees ? rs(v) : lakh(v, 0).replace(".00", "")}
        </text>
      ))}
    </g>
  );
}
function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

export function F2Raj() {
  const narrow = useNarrow();
  const [step, setStep] = useState(0);
  const [di, setDi] = useState(DIAL_DEFAULT);
  const stop = DIAL[di];
  const h = stop.h;

  const book = useMemo(() => {
    const full = repriced(h);
    const hist = historicalVaR(Float64Array.from(full, (v) => -v), 0.01);
    let best = 0;
    for (let i = 0; i < N; i++) if (full[i] > full[best]) best = i;
    const { a, b } = quadCoefficients(BOOK, h);
    const onGrid = bookPnl(BOOK, h, GRID.map((g) => g / 100));
    const curve: Pt[] = GRID.map((g, j) => [g, onGrid[j]]);
    const lin: Pt[] = GRID.map((g) => [g, (a * g) / 100]);
    const quad: Pt[] = GRID.map((g) => [g, (a * g) / 100 + (b * g * g) / 1e4]);
    const dots: Pt[] = Array.from(full, (v, i) => [100 * RETURNS[i], v]);
    const k27 = hist.worst[hist.k - 1];
    return { full, hist, best, a, curve, lin, quad, dots, k27 };
  }, [h]);

  // y domain: step 1 zooms to the slope alone; steps 2–3 to the whole book
  const linMax = Math.max(Math.abs(book.a * XR) / 100, 400);
  const fullMin = Math.min(...book.dots.filter((p) => Math.abs(p[0]) <= XR).map((p) => p[1]));
  const fullMax = Math.max(book.full[book.best], 0);
  const yLo = step === 0 ? -linMax * 1.25 : fullMin * 1.3;
  const yHi = step === 0 ? linMax * 1.25 : Math.max(fullMax * 4, -yLo * 0.14);
  const rupees = yHi - yLo < 1.5e5;
  const zx = Z99 * SIG_PCT;

  const steps = [
    {
      caption: (
        <>
          <strong>The slope alone.</strong> Raj is short {n0(BOOK.short)} calls (delta {f2(GREEKS.delta)} each) and long {n0(h)} futures, so his book moves like {n2(h - BOOK.short * GREEKS.delta)} units of
          index. The bell's 1 % move is {f2(Z99)} daily wobbles of {f2(SIG_PCT)} %. Multiply: {f2(Z99)} × {n2(Math.abs(h - BOOK.short * GREEKS.delta))} × {n0(BOOK.F)} × {f2(SIG_PCT)} % ={" "}
          <strong>{rs(stop.linear)}</strong>.
          {h === HEDGE && (
            <div className="result result-none e1-result-inline" role="status">
              <div className="result-head">The model says Raj can lose {rs(stop.linear)} tomorrow, 99 days in 100.</div>
            </div>
          )}
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>Reprice the book.</strong> Take each of the {count(N)} real days, move the index by that day's return, price the option one day older, and read the book's P&L. The pile's{" "}
          {book.hist.k}th worst bar is <strong>{lakh(book.hist.var)}</strong> ({fmtDate(DATES[book.k27])}). The best day is {rsSigned(book.full[book.best])} — the clock, and nothing more: a
          short option can only earn its theta.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>The bend, on a bell.</strong> Add the second term, P&L = slope × move + ½ bend × move², and solve for its 1 % point exactly: <strong>{lakh(stop.quad)}</strong>. The bend explains
          most of the gap from {rs(stop.linear)}; the record's fat tails explain the rest, up to {lakh(stop.full)}.{" "}
          {h === HEDGE && (
            <>
              Cornish–Fisher's shortcut on the same moments (skew {f2(CF.skew).replace("-", "−")}) gives {lakh(KEY.raj.cornish_fisher.var99)} (key).
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <Figure
      n="2"
      prompt={
        <>
          Raj's book from D1: short {n0(BOOK.short)} of the {n0(BOOK.K)} call, long {n0(HEDGE)} futures, flat to the first hundred points. What is <em>his</em> 99 % one-day VaR? Step
          through three answers, then turn the hedge.
        </>
      }
      controls={
        <>
          <Slider label="futures held" value={di} min={0} max={DIAL.length - 1} step={1} onChange={setDi} fmt={() => n0(h)} role="approx" />
          <Readouts
            items={[
              ["linear", <span className={h === HEDGE ? "e1-err" : ""}>{stop.linear < 1e4 ? rs(stop.linear) : lakh(stop.linear)}</span>],
              ["repriced", lakh(stop.full)],
              ["bend", lakh(stop.quad)],
            ]}
          />
        </>
      }
      observe={
        <>
          VaR for a book with options is a revaluation problem. The slope alone (linear, delta-normal) lies exactly where a hedger lives: at {n0(HEDGE)} futures it reads {rs(KEY.raj.linear_var99)};
          the repriced pile reads {lakh(KEY.raj.full_var99)} and the bend on a bell {lakh(KEY.raj.quad_var99)} (key). With no futures at all the linear answer is {lakh(DIAL[0].linear)} against{" "}
          {lakh(DIAL[0].full)} repriced — {Math.round(100 * (1 - DIAL[0].linear / DIAL[0].full))} % low; at delta-neutral it is low by a factor of {n0(KEY.raj.full_var99 / KEY.raj.linear_var99)}. Book: F {n0(BOOK.F)}, K {n0(BOOK.K)}, 11 days, σ{" "}
          {(100 * BOOK.sigma).toFixed(1)} %, Δ {f2(GREEKS.delta)}, Γ {GREEKS.gamma.toFixed(5)}, daily wobble {f2(SIG_PCT)} % (the record's own).
        </>
      }
    >
      <div className="e1-raj">
        <StepThrough
          steps={steps}
          onStep={setStep}
          render={(i) => (
            <div className="e1-raj-stage">
              <Plot
                xDomain={[-XR, XR]}
                yDomain={[yLo, yHi]}
                width={narrow ? 400 : 560}
                height={narrow ? 270 : 320}
                margin={{ top: 10, right: 10, bottom: 8, left: 8 }}
                xTicks={0}
                yTicks={0}
                grid={false}
                axisX={0}
                axisY={0}
                ariaLabel={`the book's P&L tomorrow against the index's daily move, with ${n0(h)} futures: the slope line, the repriced curve with the real days as dots, and the bend parabola`}
              >
                <Ticks yLo={yLo} yHi={yHi} rupees={rupees} />
                {i >= 1 && <Points pts={book.dots} role="ghost" r={narrow ? 1.6 : 2} opacity={0.5} />}
                {i >= 1 && <Curve pts={book.curve} role="truth" width={2} />}
                {i >= 2 && <Curve pts={book.quad} role="approx" width={2} dash="6 4" />}
                <Curve pts={book.lin} role="error" width={i === 0 ? 2.2 : 1.6} smooth={false} />
                {i === 0 && (
                  <>
                    <Curve pts={[[-zx, yLo], [-zx, yHi]]} role="ghost" width={1} dash="3 3" smooth={false} />
                    <Curve pts={[[zx, yLo], [zx, yHi]]} role="ghost" width={1} dash="3 3" smooth={false} />
                    <Marker at={[book.a > 0 ? -zx : zx, (-Math.abs(book.a) * zx) / 100]} role="error" r={5} />
                    <Label at={[book.a > 0 ? -zx : zx, (-Math.abs(book.a) * zx) / 100]} text={`${f2(Z99)} wobbles: ${stop.linear < 1e4 ? rs(stop.linear) : lakh(stop.linear)} down`} role="error" dx={book.a > 0 ? 8 : -8} dy={16} anchor={book.a > 0 ? "start" : "end"} />
                    <Label at={[0, yHi]} text="slope only — the linear model" role="error" dx={6} dy={14} />
                  </>
                )}
                {i >= 1 && (
                  <>
                    <Curve pts={[[-XR, -book.hist.var], [XR, -book.hist.var]]} role="truth" width={1.2} dash="4 3" smooth={false} />
                    <Label at={[XR, -book.hist.var]} text={`${book.hist.k}th worst real day: ${lakh(book.hist.var)}`} role="truth" dx={-6} dy={narrow ? -5 : -6} anchor="end" />
                    <Marker at={book.dots[book.k27]} role="truth" r={5} />
                    <Marker at={book.dots[book.best]} role="ink" r={4} />
                    <Label at={book.dots[book.best]} text={`best day ${rsSigned(book.full[book.best])} = the clock`} role="ink" dx={book.dots[book.best][0] > 0 ? -8 : 8} dy={-8} anchor={book.dots[book.best][0] > 0 ? "end" : "start"} />
                    <Label at={[0, yLo]} text={`repriced on the real ${count(N)} days (blue, dots)`} role="truth" dx={0} dy={i >= 2 ? -50 : -36} anchor="middle" />
                    <Label at={[0, yLo]} text={`slope only (red): ${stop.linear < 1e4 ? rs(stop.linear) : lakh(stop.linear)} at ${f2(Z99)} wobbles`} role="error" dx={0} dy={-22} anchor="middle" />
                  </>
                )}
                {i >= 2 && (
                  <>
                    <Curve pts={[[-XR, -stop.quad], [XR, -stop.quad]]} role="approx" width={1.2} dash="4 3" smooth={false} />
                    <Label at={[-XR, -stop.quad]} text={`bend on a bell, 1 %: ${lakh(stop.quad)}`} role="approx" dx={6} dy={narrow ? -5 : -6} />
                    <Label at={[0, yLo]} text="slope + bend, on a bell (dashed amber)" role="approx" dx={0} dy={-36} anchor="middle" />
                  </>
                )}
              </Plot>
            </div>
          )}
        />
        <div className="e1-dial">
          <div className="e1-panel-title">
            <strong>the hedge dial</strong> <span>99 % one-day VaR against futures held, at the key's {DIAL.length} stops; the dot is where you are</span>
          </div>
          <DialChart di={di} narrow={narrow} />
        </div>
      </div>
    </Figure>
  );
}

function DialChart({ di, narrow }: { di: number; narrow: boolean }) {
  const yMax = Math.max(...DIAL.map((d) => Math.max(d.linear, d.full, d.quad))) / 1e5;
  const H0 = DIAL[0].h;
  const H1 = DIAL[DIAL.length - 1].h;
  const cur = DIAL[di];
  const toPts = (k: "linear" | "full" | "quad"): Pt[] => DIAL.map((d) => [d.h, d[k] / 1e5]);
  const atHedge = DIAL[DIAL_DEFAULT];
  return (
    <Plot xDomain={[H0, H1]} yDomain={[0, yMax * 1.15]} width={narrow ? 400 : 800} height={narrow ? 220 : 230} margin={{ top: 8, right: 10, bottom: 8, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={H0} axisY={0} ariaLabel="99 % VaR of Raj's book against the number of futures held: the linear model touches ₹144 at 3,292 while the repriced and bend answers stay above ₹7 lakh">
      <DialTicks yMax={yMax * 1.15} />
      <Curve pts={toPts("full")} role="truth" width={2} />
      <Curve pts={toPts("quad")} role="approx" width={2} dash="6 4" />
      <Curve pts={toPts("linear")} role="error" width={2} smooth={false} />
      <Marker at={[atHedge.h, atHedge.linear / 1e5]} role="error" r={4} />
      <Label at={[atHedge.h, atHedge.linear / 1e5]} text={narrow ? `${rs(atHedge.linear)} at ${n0(atHedge.h)}` : `${rs(atHedge.linear)} at ${n0(atHedge.h)} futures`} role="error" dx={0} dy={-12} anchor="middle" />
      <Label at={[H1, DIAL[DIAL.length - 1].full / 1e5]} text={narrow ? "repriced" : "repriced on the real days"} role="truth" dx={-6} dy={-6} anchor="end" />
      <Label at={[H1, DIAL[DIAL.length - 1].quad / 1e5]} text={narrow ? "slope + bend" : "slope + bend, on a bell"} role="approx" dx={-6} dy={14} anchor="end" />
      <Label at={[H1, DIAL[DIAL.length - 1].linear / 1e5]} text={narrow ? "slope only" : "slope only (linear)"} role="error" dx={-6} dy={16} anchor="end" />
      <Curve pts={[[cur.h, 0], [cur.h, yMax * 1.15]]} role="ghost" width={1} dash="3 3" smooth={false} />
      <Marker at={[cur.h, cur.full / 1e5]} role="truth" r={5} />
      <Marker at={[cur.h, cur.quad / 1e5]} role="approx" r={5} />
      <Marker at={[cur.h, cur.linear / 1e5]} role="error" r={5} />
    </Plot>
  );
}
function DialTicks({ yMax }: { yMax: number }) {
  const { x, y, inner } = usePlot();
  return (
    <g>
      {[0, 1000, 2000, 4000, 5000, 6000].map((v) => (
        <text key={v} className="label e1-ticklabel" x={x(v) + (v === 6000 ? -3 : 3)} y={inner.top + inner.height - 4} textAnchor={v === 6000 ? "end" : "start"}>
          {v === 0 ? "0 futures" : n0(v)}
        </text>
      ))}
      {[5, 10, 15, 20, 25].filter((v) => v < yMax).map((v) => (
        <text key={v} className="label e1-ticklabel" x={inner.left + 3} y={y(v) - 2}>
          ₹{v} lakh
        </text>
      ))}
    </g>
  );
}
