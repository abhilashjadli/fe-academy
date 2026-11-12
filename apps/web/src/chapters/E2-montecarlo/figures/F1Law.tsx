import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { callPayoff, straddlePayoff } from "../../../engine/montecarlo";
import { Bar, ScatterPath, XTicks } from "./parts";
const neg = (t: string) => t.replace("-", "−");
import { CHAIN, CLOUD_N, DIAL_DEFAULT, DIAL_N, KEY, LADDER_N, TRUE_CALL, count, f2, getLadder, getReroll, getRung, getTricks, n0, p1, pm, times, useLazy, useNarrow, type Rung } from "./e2";

/**
 * Figure 1 — √n and the mirror. Dial "dots" over the key's ladder (100 → 100,000, seed 1) plus Figure 0's 2,000: the price and
 * its ± one-SE bar at every rung, the current one bold; beside it, SE against n on log axes with the fitted slope (−0.51, key).
 * Segmented plain / mirror / control: at the dial's n, the call's bar with and without the trick (the mirror also on a
 * straddle, where it backfires). Two controls; three readouts.
 */

type Mode = "plain" | "mirror" | "control";
const PRICE_AXIS: [number, number] = [180, 380];

/** the funnel: every rung's price and ± one SE against the formula's line */
function Funnel({ rows, cur, narrow }: { rows: Rung[]; cur: number; narrow: boolean }) {
  const n = rows.length;
  return (
    <Plot xDomain={PRICE_AXIS} yDomain={[-1.9, n - 0.4]} width={narrow ? 400 : 520} height={narrow ? 260 : 280} margin={{ top: 20, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={PRICE_AXIS[0]} axisY={-1.9} ariaLabel={`the call's price and its ± one standard error bar at ${n} sizes of cloud from 100 to 100,000 dots, shrinking towards the formula's ${p1(TRUE_CALL)}`}>
      <XTicks at={[200, 250, 300, 350]} label="price" />
      <Curve pts={[[TRUE_CALL, -0.9], [TRUE_CALL, n - 0.4]]} role="truth" width={1.5} dash="4 3" smooth={false} />
      <Label at={[TRUE_CALL, -0.8]} text={`the formula: ${p1(TRUE_CALL)}`} role="truth" dx={6} dy={4} />
      {rows.map((r, i) => (
        <Bar key={r.n} mean={r.mean} se={r.se} yv={n - 1 - i} bold={i === cur} text={`${count(r.n)} dots: ${p1(r.mean)} ${pm(r.se)}`} anchorRight={r.mean - r.se < 262 && r.mean + r.se > 236 ? false : r.mean > TRUE_CALL} />
      ))}
    </Plot>
  );
}

/** SE against n on log axes, the key's seven rungs fitted; the 2,000 rung drawn open and left out of the fit */
function LogLog({ rungs, slope, cur, narrow }: { rungs: Rung[]; slope: number; cur: Rung; narrow: boolean }) {
  const X: [number, number] = [Math.log10(70), Math.log10(140000)];
  const Y: [number, number] = [Math.log10(0.45), Math.log10(60)];
  const mx = rungs.reduce((a, r) => a + Math.log(r.n), 0) / rungs.length;
  const my = rungs.reduce((a, r) => a + Math.log(r.se), 0) / rungs.length;
  const fit = (n: number) => Math.exp(my + slope * (Math.log(n) - mx));
  const line: Pt[] = [
    [X[0], Math.log10(fit(10 ** X[0]))],
    [X[1], Math.log10(fit(10 ** X[1]))],
  ];
  const inFit = LADDER_N.includes(cur.n);
  return (
    <Plot xDomain={X} yDomain={Y} width={narrow ? 400 : 300} height={narrow ? 230 : 270} margin={{ top: 20, right: 12, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={Y[0]} ariaLabel={`standard error against number of dots on log axes: a straight line of slope ${f2(slope)}`}>
      <LogTicks />
      <Curve pts={line} role="ink" width={1.5} dash="5 3" smooth={false} />
      {rungs.map((r) => (
        <Marker key={r.n} at={[Math.log10(r.n), Math.log10(r.se)]} role={r.n === cur.n ? "ink" : "truth"} r={r.n === cur.n ? 5.5 : 4} />
      ))}
      {!inFit && <OpenMarker n={cur.n} se={cur.se} />}
      <Label at={[Math.log10(cur.n), Math.log10(cur.se)]} text={`${count(cur.n)}: ${pm(cur.se)}`} role="ink" dx={cur.n > 10000 ? -8 : 8} dy={-8} anchor={cur.n > 10000 ? "end" : "start"} />
      <Label at={[X[1], Y[1]]} text={`slope ${neg(f2(slope))} (fit on the 7 rungs)`} role="ink" dx={-2} dy={12} anchor="end" />
    </Plot>
  );
}
function OpenMarker({ n, se }: { n: number; se: number }) {
  const { x, y } = usePlot();
  return <circle cx={x(Math.log10(n))} cy={y(Math.log10(se))} r={5.5} fill="var(--surface-figure)" stroke="var(--ink)" strokeWidth={2} />;
}
function LogTicks() {
  const { x, y, inner } = usePlot();
  return (
    <g>
      {[100, 1000, 10000, 100000].map((v) => (
        <text key={v} className="label e2-ticklabel" x={x(Math.log10(v))} y={inner.top + inner.height - 4} textAnchor="middle">
          {v >= 1000 ? `${v / 1000}k` : v}
        </text>
      ))}
      {[2, 5, 20].map((v) => (
        <text key={v} className="label e2-ticklabel" x={inner.left + 4} y={y(Math.log10(v)) - 2}>
          ± {v}
        </text>
      ))}
    </g>
  );
}

/** the trick at the dial's n: plain bar against the trick's bar, one pair of rows per payoff, centred on each plain estimate */
function TrickBars({ rows, narrow }: { rows: Array<{ label: string; plain: { mean: number; se: number }; trick: { mean: number; se: number }; role: "approx" | "truth"; ratio: number }>; narrow: boolean }) {
  const n = rows.length * 2;
  const span = Math.max(14, ...rows.map((r) => Math.max(r.plain.se, r.trick.se) * 2.4));
  const X: [number, number] = [-span, span];
  return (
    <Plot xDomain={X} yDomain={[-1.1, n - 0.2]} width={narrow ? 400 : 520} height={rows.length === 1 ? 150 : 230} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={-1.1} ariaLabel="the error bar with and without the trick">
      <RelTicks />
      <Curve pts={[[0, -0.6], [0, n - 0.2]]} role="ghost" width={1} dash="3 3" smooth={false} />
      {rows.map((r, i) => {
        const off = -r.plain.mean;
        const y1 = n - 1 - 2 * i;
        return (
          <g key={r.label}>
            <Bar mean={r.plain.mean + off} se={r.plain.se} yv={y1} bold={false} role="ink" />
            <Label at={[r.plain.mean + off, y1]} text={`${r.label}, plain: ${p1(r.plain.mean)} ${pm(r.plain.se)}`} role="ink" dx={0} dy={-9} anchor="middle" />
            <Bar mean={r.trick.mean + off} se={r.trick.se} yv={y1 - 1} bold role={r.role} />
            <Label at={[r.trick.mean + off, y1 - 1]} text={`with the trick: ${p1(r.trick.mean)} ${pm(r.trick.se)} — variance ratio ${times(r.ratio)}`} role={r.role} dx={0} dy={-9} anchor="middle" />
          </g>
        );
      })}
    </Plot>
  );
}
function RelTicks() {
  const { x, inner } = usePlot();
  const X = x.domain();
  const step = X[1] - X[0] > 100 ? 20 : X[1] - X[0] > 40 ? 10 : 5;
  const ticks: number[] = [];
  for (let v = Math.ceil(X[0] / step) * step; v <= X[1]; v += step) ticks.push(v);
  return (
    <g>
      {ticks.map((v) => (
        <text key={v} className="label e2-ticklabel" x={x(v)} y={inner.top + inner.height - 4} textAnchor="middle">
          {v > 0 ? "+" + v : v < 0 ? "−" + Math.abs(v) : "0"}
        </text>
      ))}
    </g>
  );
}

/** the mirror as a picture: a dot's payoff and its reflection through the forward, for the call and the straddle */
function MirrorPicture({ narrow }: { narrow: boolean }) {
  const z0 = 1.3;
  const grid = useMemo(() => Array.from({ length: 61 }, (_, i) => -3 + i * 0.1), []);
  const call: Pt[] = grid.map((z) => [z, callPayoff(CHAIN, z)]);
  const strad: Pt[] = grid.map((z) => [z, straddlePayoff(CHAIN, z)]);
  const yMax = straddlePayoff(CHAIN, 3) * 1.1;
  const cPair = 0.5 * (callPayoff(CHAIN, z0) + callPayoff(CHAIN, -z0));
  const sPair = 0.5 * (straddlePayoff(CHAIN, z0) + straddlePayoff(CHAIN, -z0));
  return (
    <Plot xDomain={[-3, 3]} yDomain={[-yMax * 0.1, yMax]} width={narrow ? 400 : 340} height={narrow ? 200 : 230} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={0} axisY={0} ariaLabel="payoff against the draw z for the call and the straddle, with one draw and its mirror image">
      <Curve pts={strad} role="truth" width={1.8} smooth={false} />
      <Curve pts={call} role="approx" width={2.2} smooth={false} />
      <Curve pts={[[z0, 0], [z0, straddlePayoff(CHAIN, z0)]]} role="ghost" width={1} dash="3 3" smooth={false} />
      <Curve pts={[[-z0, 0], [-z0, straddlePayoff(CHAIN, -z0)]]} role="ghost" width={1} dash="3 3" smooth={false} />
      <Marker at={[z0, straddlePayoff(CHAIN, z0)]} role="truth" r={5.5} />
      <Marker at={[-z0, straddlePayoff(CHAIN, -z0)]} role="truth" r={4.5} />
      <Marker at={[z0, callPayoff(CHAIN, z0)]} role="approx" r={3.5} />
      <Marker at={[-z0, callPayoff(CHAIN, -z0)]} role="approx" r={4.5} />
      <Label at={[z0, 0]} text="z" role="ink" dx={-3} dy={-4} anchor="middle" />
      <Label at={[-z0, 0]} text="−z" role="ink" dx={-3} dy={-4} anchor="middle" />
      <Label at={[0, yMax]} text={`call: pair mean ${n0(cPair)} (one dot: ${n0(callPayoff(CHAIN, z0))} or 0)`} role="approx" dx={0} dy={10} anchor="middle" />
      <Label at={[0, yMax]} text={`straddle: pair mean ${n0(sPair)} = either dot`} role="truth" dx={0} dy={24} anchor="middle" />
      <Label at={[0, -yMax * 0.1]} text="the draw z (mirror: z → −z)" role="ink" dx={0} dy={-3} anchor="middle" />
    </Plot>
  );
}

/** the control as a picture: payoff against where the index landed, with the fitted slope b through (F, mean) */
function ControlPicture({ b, rho, narrow }: { b: number; rho: number; narrow: boolean }) {
  const run = getReroll(1);
  const X: [number, number] = [21500, 23900];
  const yMax = callPayoff(CHAIN, 2.1);
  return (
    <Plot xDomain={X} yDomain={[-yMax * 0.1, yMax]} width={narrow ? 400 : 340} height={narrow ? 200 : 230} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={0} ariaLabel="each dot's payoff against where the index landed, with the fitted line whose slope is the control's b">
      <ScatterPath xs={run.st} ys={run.y} n={400} />
      <Curve pts={[[X[0], run.mean + b * (X[0] - CHAIN.F)], [X[1], run.mean + b * (X[1] - CHAIN.F)]]} role="error" width={1.8} smooth={false} />
      <Curve pts={[[CHAIN.F, 0], [CHAIN.F, yMax]]} role="ghost" width={1} dash="3 3" smooth={false} />
      <Marker at={[CHAIN.F, run.mean]} role="ink" r={4.5} />
      <Label at={[CHAIN.F, yMax]} text={`forward ${n0(CHAIN.F)}: the index`} role="ink" dx={5} dy={10} />
      <Label at={[CHAIN.F, yMax]} text="averages here, exactly" role="ink" dx={5} dy={24} />
      <Label at={[X[1], run.mean + b * (X[1] - CHAIN.F)]} text={`fitted line, slope b = ${f2(b)}, ρ = ${f2(rho)}`} role="error" dx={-4} dy={14} anchor="end" />
      <Label at={[X[0], yMax]} text="400 of the dots: index at expiry →" role="ink" dx={4} dy={10} />
      <Label at={[X[0], yMax]} text="the call's payoff" role="ink" dx={4} dy={24} />
    </Plot>
  );
}
export function F1Law() {
  const narrow = useNarrow();
  const [di, setDi] = useState(DIAL_DEFAULT);
  const [mode, setMode] = useState<Mode>("plain");
  const n = DIAL_N[di];
  const ladder = useLazy("ladder", getLadder);
  const rows = ladder ? DIAL_N.map(getRung) : [getRung(CLOUD_N)];
  const cur = ladder ? rows[di] : rows[0];
  const tricks = useLazy(`tricks:${n}`, () => getTricks(n));
  const t = mode === "plain" || !tricks ? null : tricks;
  const se = t ? (mode === "mirror" ? t.call.se : t.control.se) : cur.se;
  const ratio = t ? (mode === "mirror" ? t.call.ratio : (t.control.plainSe / t.control.se) ** 2) : null;
  const S = KEY.seeded;

  return (
    <Figure
      n="1"
      prompt={
        <>
          Turn the dial: how fast does the bar shrink as the dots multiply? Then switch on a trick — the <strong>mirror</strong> pairs each dot with its reflection through the forward; the{" "}
          <strong>control</strong> corrects each payoff by how far the index itself landed from the forward, which you know averages to zero. Seed 1 throughout.
        </>
      }
      controls={
        <>
          <Slider label="dots" value={di} min={0} max={DIAL_N.length - 1} step={1} onChange={setDi} fmt={() => count(n)} />
          <Segmented<Mode> label="trick" options={[{ id: "plain", label: "plain" }, { id: "mirror", label: "mirror" }, { id: "control", label: "control" }]} value={mode} onChange={setMode} />
          <Readouts items={[["dots", count(n)], ["±", tricks || mode === "plain" ? se.toFixed(se < 1 ? 2 : 1) : "…"], ["ratio", ratio === null ? (mode === "plain" ? "1 (no trick)" : "…") : times(ratio)]]} />
        </>
      }
      observe={
        <>
          The bar falls as 1/√n: the fitted slope on the key's seven rungs is {neg(f2(KEY.ladder_slope))} (key). Four times the dots halve it; a hundred times buy one more decimal. At {count(CLOUD_N)} dots the
          mirror takes the call's bar from {pm(S.plain.se)} to {pm(S.antithetic.se)} — the pair's variance is {times(S.antithetic.ratio)} better than two independent dots' — and takes the straddle's from{" "}
          {pm(S.straddle.se)} to {pm(S.straddle.anti_se)} (ratio {times(S.straddle.ratio)}): a symmetric payoff and its mirror are the same number, so the pair carries half the information. The stock as
          control variate: correlation {f2(S.control.rho)}, b {f2(S.control.b)}, bar {pm(S.plain.se)} → {pm(S.control.se)} (key). Exact, by quadrature: ratios {f2(KEY.exact.anti_ratio_call)} and{" "}
          {f2(KEY.exact.anti_ratio_straddle)}, ρ {f2(KEY.exact.cv_rho)}, {Math.round(100 * KEY.exact.cv_rho2)} % of the variance gone.
        </>
      }
    >
      <div className="e2-law">
        <div className="e2-law-two">
          <div className="e2-law-panel">
            <div className="e2-panel-title">
              <strong>the price and its bar</strong> <span>± one standard error at each size of cloud; the dial's rung is bold</span>
            </div>
            <Funnel rows={rows} cur={ladder ? di : 0} narrow={narrow} />
          </div>
          <div className="e2-law-panel">
            <div className="e2-panel-title">
              <strong>the law</strong> <span>bar against dots, both on log scales</span>
            </div>
            {ladder ? <LogLog rungs={ladder.rungs} slope={ladder.slope} cur={cur} narrow={narrow} /> : <div className="e2-wait">computing the ladder…</div>}
          </div>
        </div>
        {mode !== "plain" && (
          <div className="e2-law-trick">
            <div className="e2-panel-title">
              <strong>{mode === "mirror" ? "the mirror" : "the control"}</strong>{" "}
              <span>
                {mode === "mirror"
                  ? `at ${count(n)} dots: the first ${count(n / 2)} dots and their reflections z → −z, against ${count(n)} independent dots; axis = price − the plain estimate`
                  : `at ${count(n)} dots: each payoff minus b × (index at expiry − ${n0(CHAIN.F)}), b fitted from the dots; axis = price − the plain estimate`}
              </span>
            </div>
            {t ? (
              <div className="e2-law-two e2-law-trickrow">
                <TrickBars
                  narrow={narrow}
                  rows={
                    mode === "mirror"
                      ? [
                          { label: "the call", plain: { mean: t.plain.mean, se: t.call.plainSe }, trick: { mean: t.call.mean, se: t.call.se }, role: "approx", ratio: t.call.ratio },
                          { label: "a straddle |S − K|", plain: { mean: t.straddlePlain.mean, se: t.straddlePlain.se }, trick: { mean: t.straddle.mean, se: t.straddle.se }, role: "truth", ratio: t.straddle.ratio },
                        ]
                      : [{ label: "the call", plain: { mean: t.plain.mean, se: t.control.plainSe }, trick: { mean: t.control.mean, se: t.control.se }, role: "approx", ratio: (t.control.plainSe / t.control.se) ** 2 }]
                  }
                />
                {mode === "mirror" ? <MirrorPicture narrow={narrow} /> : <ControlPicture b={t.control.b} rho={t.control.rho} narrow={narrow} />}
              </div>
            ) : (
              <div className="e2-wait">computing {count(n)} dots…</div>
            )}
          </div>
        )}
      </div>
    </Figure>
  );
}
