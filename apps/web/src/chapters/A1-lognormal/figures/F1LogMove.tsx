import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Plot, VLine, usePlot, fmt } from "../../../ui/Plot";
import { Slider, Segmented, Toggle } from "../../../ui/controls";
import { Who } from "../../../ui/Comic";
import { binomialPmf } from "../../../engine/discrete";
import { lognormal, npdf } from "../../../engine/distributions";
import { DAYS } from "../sim";

/** Exact year-end distribution: k heads out of DAYS, value v_k, probability C(DAYS,k)/2^DAYS. */
function exactEnds(who: "mel" | "ada", stepPct: number) {
  const pmf = binomialPmf(DAYS, 0.5);
  const vals = pmf.map((_, k) => (who === "ada" ? 100 + stepPct * (2 * k - DAYS) : 100 * Math.pow(1 + stepPct / 100, k) * Math.pow(1 - stepPct / 100, DAYS - k)));
  const bars = vals.map((v, k) => {
    const lo = k === 0 ? v - (vals[1] - v) / 2 : (vals[k - 1] + v) / 2;
    const hi = k === vals.length - 1 ? v + (v - vals[k - 1]) / 2 : (v + vals[k + 1]) / 2;
    return { v, lo, hi, p: pmf[k] };
  });
  const mean = vals.reduce((s, v, k) => s + v * pmf[k], 0);
  const sd = Math.sqrt(vals.reduce((s, v, k) => s + (v - mean) ** 2 * pmf[k], 0));
  const skew = vals.reduce((s, v, k) => s + ((v - mean) / sd) ** 3 * pmf[k], 0);
  const lv = vals.map((v) => Math.log(v));
  const lmean = lv.reduce((s, v, k) => s + v * pmf[k], 0);
  const lsd = Math.sqrt(lv.reduce((s, v, k) => s + (v - lmean) ** 2 * pmf[k], 0));
  const lskew = lv.reduce((s, v, k) => s + ((v - lmean) / lsd) ** 3 * pmf[k], 0);
  return { bars, mean, sd, skew, lmean, lsd, lskew };
}

/**
 * Warp the axis from linear to logarithmic and watch Mel's lean drain out. The smooth curve she ends on
 * (lognormal for Mel, normal for Ada) can be laid over the bars; it is drawn in the warped axis too.
 */
export function F1LogMove() {
  const [warp, setWarp] = useState(0);
  const [step, setStep] = useState(1);
  const [who, setWho] = useState<"mel" | "ada">("mel");
  const [curveOn, setCurveOn] = useState(false);
  const d = useMemo(() => exactEnds(who, step), [who, step]);
  const lo = Math.max(who === "mel" ? 5 : d.mean - 4.5 * d.sd, d.mean - 4.5 * d.sd);
  const hi = d.mean + 4.5 * d.sd;
  // axis warp: g(v) = (1-w) v + w L(v), L(v) = 100 + 100 ln(v/100): equal to v near 100, logarithmic far away
  const L = (v: number) => 100 + 100 * Math.log(Math.max(v, 1e-6) / 100);
  const g = (v: number) => (1 - warp) * v + warp * L(v);
  const gPrime = (v: number) => (1 - warp) + (warp * 100) / Math.max(v, 1e-6);
  const xdom: [number, number] = [g(lo), g(hi)];
  const visible = d.bars.filter((b) => b.hi > lo && b.lo < hi);
  const ymax = Math.max(...visible.map((b) => b.p / Math.max(1e-9, g(b.hi) - g(b.lo)))) * 1.2;

  // the smooth curve, as a density per unit of the warped axis: f(v) / g'(v)
  const curve = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= 300; i++) {
      const v = lo + ((hi - lo) * i) / 300;
      const f = who === "mel" ? lognormal.pdf(v, d.lmean, d.lsd) : npdf((v - d.mean) / d.sd) / d.sd;
      out.push([g(v), f / gPrime(v)]);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [who, step, warp, lo, hi]);
  const centres =
    who === "mel"
      ? { mean: lognormal.mean(d.lmean, d.lsd), median: lognormal.median(d.lmean), mode: lognormal.mode(d.lmean, d.lsd) }
      : { mean: d.mean, median: d.mean, mode: d.mean };
  const name = who === "mel" ? "Mel" : "Ada";

  return (
    <Figure
      n="1"
      prompt={
        <>
          <Who name="Mel" />
          's balance at year end — every one of the 251 possible outcomes, each bar's area its probability. Drag <em>axis warp</em> from linear to
          logarithmic and watch the lean drain out.
        </>
      }
      controls={
        <>
          <Slider label="axis warp: linear → log" value={warp} min={0} max={1} step={0.01} onChange={setWarp} role="approx" fmt={(v) => (v < 0.02 ? "linear" : v > 0.98 ? "log" : v.toFixed(2))} />
          <Slider label="daily step, %" value={step} min={0.2} max={3} step={0.1} onChange={setStep} fmt={(v) => v.toFixed(1) + "%"} />
          <Segmented value={who} onChange={setWho} options={[{ id: "mel", label: "Mel (±%)" }, { id: "ada", label: "Ada (±amount)" }]} />
          <Toggle label={who === "mel" ? "lay the smooth curve over the bars (lognormal)" : "lay the smooth curve over the bars (normal)"} on={curveOn} onChange={setCurveOn} />
          <span className="readouts">
            <span>
              <span className="k">lean of the pile (skewness) </span>
              <span className="v">{fmt.n(2)(d.skew)}</span>
            </span>
            <span>
              <span className="k">after the log </span>
              <span className="v">{fmt.n(2)(d.lskew)}</span>
            </span>
            {curveOn && who === "mel" && (
              <>
                <span>
                  <span className="k">average </span>
                  <span className="v">{fmt.n(2)(centres.mean)}</span>
                </span>
                <span>
                  <span className="k">typical (median) </span>
                  <span className="v">{fmt.n(2)(centres.median)}</span>
                </span>
                <span>
                  <span className="k">most likely (mode) </span>
                  <span className="v">{fmt.n(2)(centres.mode)}</span>
                </span>
              </>
            )}
          </span>
        </>
      }
      observe={
        <>
          <p style={{ margin: 0 }}>
            On the log axis <Who name="Mel" />'s pile is a bell. <strong>The lean lives in the axis, not in the coin.</strong> Switch to <Who name="Ada" />{" "}
            and it is the reverse: a bell on the plain axis, a lean on the log one. Turn the smooth curve on: that is the shape Mel ends on, with her three
            centres marked.
          </p>
          <details className="a1-more">
            <summary>more</summary>
            <p>
              Push the daily step to 3 % and the lean grows with it; shrink it to 0.2 % and Ada and Mel become indistinguishable. For small steps the two
              worlds agree, which is why so much of finance gets away with either.
            </p>
            <p>
              The smooth curve for Mel is called the <strong>lognormal</strong>: a bell on the log axis, which is why it bends back into a bell as you warp.
              Its three centres sit in a fixed order — most likely, then typical, then average — and the gaps between them grow with the daily step. The
              average is pulled up by the long right reach; the typical year is not. The bars have unequal widths on purpose: each is one possible outcome,
              and the area of a bar is its probability.
            </p>
          </details>
        </>
      }
    >
      <Plot
        xDomain={xdom}
        yDomain={[0, ymax]}
        xLabel={`${name}'s balance at year end${warp > 0.98 ? " (logarithmic axis)" : warp < 0.02 ? "" : " (warping)"}`}
        yLabel="probability per unit"
        height={300}
        xTicks={0}
        axisX={xdom[0]}
        ariaLabel="Histogram with a warping axis"
      >
        <WarpBars bars={visible} g={g} role={who === "mel" ? "approx" : "truth"} />
        <WarpTicks g={g} lo={lo} hi={hi} />
        {curveOn && <Curve pts={curve} role="ink" width={2} />}
        {curveOn && who === "mel" && (
          <>
            <VLine at={g(centres.mode)} />
            <VLine at={g(centres.median)} />
            <VLine at={g(centres.mean)} />
            <Label at={[g(centres.mode), ymax * 0.97]} text="most likely" dx={-4} anchor="end" />
            <Label at={[g(centres.median), ymax * 0.9]} text="typical" dx={4} />
            <Label at={[g(centres.mean), ymax * 0.83]} text="average" dx={4} />
          </>
        )}
      </Plot>
    </Figure>
  );
}

function WarpBars({ bars, g, role }: { bars: Array<{ lo: number; hi: number; p: number }>; g: (v: number) => number; role: "truth" | "approx" }) {
  const { x, y } = usePlot();
  return (
    <g>
      {bars.map((b, i) => {
        const x0 = x(g(b.lo)),
          x1 = x(g(b.hi));
        const dens = b.p / Math.max(1e-9, g(b.hi) - g(b.lo));
        return <rect key={i} className={`marker ${role}`} x={x0} y={y(dens)} width={Math.max(0.5, x1 - x0 - 0.6)} height={Math.max(0, y(0) - y(dens))} style={{ opacity: 0.85, stroke: "none" }} />;
      })}
    </g>
  );
}
function WarpTicks({ g, lo, hi }: { g: (v: number) => number; lo: number; hi: number }) {
  const { x, inner } = usePlot();
  const ticks = [10, 25, 50, 75, 100, 125, 150, 200, 300, 400, 600, 800].filter((v) => v >= lo && v <= hi);
  return (
    <g>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={x(g(v))} x2={x(g(v))} y1={inner.top + inner.height - 6} y2={inner.top + inner.height} stroke="var(--ink-2)" />
          <text x={x(g(v))} y={inner.top + inner.height - 9} textAnchor="middle" className="label" style={{ fontSize: 10.5 }}>
            {v}
          </text>
        </g>
      ))}
    </g>
  );
}
