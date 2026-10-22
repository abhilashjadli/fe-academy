import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Plot, usePlot, fmt } from "../../../ui/Plot";
import { Slider, Segmented } from "../../../ui/controls";
import { binomialPmf } from "../../../engine/discrete";
import { DAYS } from "../sim";

/** Exact year-end distribution: k heads out of DAYS, value v_k, probability C(DAYS,k)/2^DAYS. */
function exactEnds(who: "mel" | "ada", stepPct: number) {
  const pmf = binomialPmf(DAYS, 0.5);
  const vals = pmf.map((_, k) => (who === "ada" ? 100 + stepPct * (2 * k - DAYS) : 100 * Math.pow(1 + stepPct / 100, k) * Math.pow(1 - stepPct / 100, DAYS - k)));
  // bars from midpoint to midpoint between neighbouring values
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
  return { bars, mean, sd, skew, lskew };
}

/** Warp the axis from linear to logarithmic and watch Mel's skew drain out. */
export function F1LogMove() {
  const [warp, setWarp] = useState(0);
  const [step, setStep] = useState(1);
  const [who, setWho] = useState<"mel" | "ada">("mel");
  const d = useMemo(() => exactEnds(who, step), [who, step]);
  const lo = Math.max(who === "mel" ? 5 : d.mean - 4.5 * d.sd, d.mean - 4.5 * d.sd);
  const hi = d.mean + 4.5 * d.sd;
  // axis warp: g(v) = (1-w) v + w L(v), L(v) = 100 + 100 ln(v/100): equal to v near 100, logarithmic far away
  const L = (v: number) => 100 + 100 * Math.log(Math.max(v, 1e-6) / 100);
  const g = (v: number) => (1 - warp) * v + warp * L(v);
  const xdom: [number, number] = [g(lo), g(hi)];
  const visible = d.bars.filter((b) => b.hi > lo && b.lo < hi);
  const ymax = Math.max(...visible.map((b) => b.p / Math.max(1e-9, g(b.hi) - g(b.lo)))) * 1.2;

  return (
    <Figure
      n="1"
      prompt={<>Mel's year-end balances — the exact distribution, all 251 possible outcomes. Drag <em>axis warp</em> from linear to logarithmic and watch the lean drain out.</>}
      controls={
        <>
          <Slider label="axis warp: linear → log" value={warp} min={0} max={1} step={0.01} onChange={setWarp} role="approx" fmt={(v) => (v < 0.02 ? "linear" : v > 0.98 ? "log" : v.toFixed(2))} />
          <Slider label="daily step, %" value={step} min={0.2} max={3} step={0.1} onChange={setStep} fmt={(v) => v.toFixed(1) + "%"} />
          <Segmented value={who} onChange={setWho} options={[{ id: "mel", label: "Mel (±%)" }, { id: "ada", label: "Ada (±amount)" }]} />
          <span className="readouts">
            <span>
              <span className="k">skewness of balances </span>
              <span className="v">{fmt.n(2)(d.skew)}</span>
            </span>
            <span>
              <span className="k">of log balances </span>
              <span className="v">{fmt.n(2)(d.lskew)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          On the log axis Mel's pile is a bell — the skew lives in the axis, not in the coin. Ada's pile does the opposite: a bell on the linear axis, a lean on the log axis. <strong>Log turns stretch into slide.</strong> Push the daily step up to 3 % and the lean grows with it; shrink it to 0.2 % and Ada and Mel become indistinguishable — for small steps the two worlds agree, which is why so much of finance can get away with either. (The bars have unequal widths on purpose: each is one possible outcome, and the area of a bar is its probability.)
        </>
      }
    >
      <Plot xDomain={xdom} yDomain={[0, ymax]} xLabel={warp > 0.98 ? "balance (logarithmic axis)" : warp < 0.02 ? "balance" : "balance (warping)"} yLabel="probability per unit" height={300} xTicks={0} axisX={xdom[0]} ariaLabel="Histogram with a warping axis">
        <WarpBars bars={visible} g={g} />
        <WarpTicks g={g} lo={lo} hi={hi} />
      </Plot>
    </Figure>
  );
}

function WarpBars({ bars, g }: { bars: Array<{ lo: number; hi: number; p: number }>; g: (v: number) => number }) {
  const { x, y } = usePlot();
  return (
    <g>
      {bars.map((b, i) => {
        const x0 = x(g(b.lo)),
          x1 = x(g(b.hi));
        const dens = b.p / Math.max(1e-9, g(b.hi) - g(b.lo));
        return <rect key={i} className="marker approx" x={x0} y={y(dens)} width={Math.max(0.5, x1 - x0 - 0.6)} height={Math.max(0, y(0) - y(dens))} style={{ opacity: 0.85, stroke: "none" }} />;
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
