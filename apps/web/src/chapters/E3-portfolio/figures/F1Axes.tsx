import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { Bars, Curve, DirLine, Label, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { normalSample, rng } from "../../../engine/random";
import { cholesky } from "../../../engine/linalg";
import { pca, projectedVariance2 } from "../../../engine/portfolio";
import { ScatterPath } from "../../E2-montecarlo/figures/parts";
import { CLOUD_N, CLOUD_SD, CLOUD_SEED, cloudCov, f2, pct1, rho2, useNarrow } from "./e3";

/**
 * Figure 1 — the cloud's own axes. A DRAWN bivariate normal cloud (not data): 600 seeded standard normals (engine/random, seed 3)
 * pushed through the Cholesky factor of S = [[1, 0.7ρ], [0.7ρ, 0.49]], i.e. widths 1 and 0.7 at correlation ρ. Scrub a direction:
 * every dot is projected onto the line through the centre (ticks), a histogram of the projections grows beside it, and its width
 * is read out — the engine's √(uᵀSu), projectedVariance2. The two principal axes (pca of S) are drawn faintly; two bars show the
 * eigenvalues, which sum to S₁₁ + S₂₂ = 1.49, against the variance along your line. Dial ρ: the axes swing toward 45° and the
 * second bar shrinks. Two controls (direction, ρ); three readouts (width at this angle, share 1, share 2).
 */

const R: [number, number] = [-3.6, 3.6];
const BIN = 0.25;

function ProjectionTicks({ pts, theta, connectors }: { pts: Pt[]; theta: number; connectors: number }) {
  const { x, y } = usePlot();
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const d = useMemo(() => {
    let ticks = "";
    let lines = "";
    const h = 0.07;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i][0] * c + pts[i][1] * s;
      const px = p * c;
      const py = p * s;
      ticks += `M${x(px - h * -s).toFixed(1)},${y(py - h * c).toFixed(1)}L${x(px + h * -s).toFixed(1)},${y(py + h * c).toFixed(1)}`;
      if (i < connectors) lines += `M${x(pts[i][0]).toFixed(1)},${y(pts[i][1]).toFixed(1)}L${x(px).toFixed(1)},${y(py).toFixed(1)}`;
    }
    return { ticks, lines };
  }, [pts, c, s, x, y, connectors]);
  return (
    <g>
      <path d={d.lines} fill="none" stroke="var(--approx)" strokeWidth={0.8} opacity={0.35} />
      <path d={d.ticks} fill="none" stroke="var(--approx)" strokeWidth={1} opacity={0.7} />
    </g>
  );
}

function HistTicks({ yAt }: { yAt: number }) {
  const { x, y, inner } = usePlot();
  return (
    <g>
      {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
        <text key={v} className="label e3-ticklabel" x={x(v)} y={y(yAt)} textAnchor="middle">
          {v}
        </text>
      ))}
      <text className="label e3-ticklabel" x={inner.left + inner.width} y={y(yAt)} textAnchor="end">
        position along the line
      </text>
    </g>
  );
}

function SharesBars({ v, lam, total }: { v: number; lam: number[]; total: number }) {
  const narrow = useNarrow();
  const items = [
    { name: "along your line", val: v, role: "approx" as const },
    { name: "axis 1", val: lam[0], role: "truth" as const },
    { name: "axis 2", val: lam[1], role: "truth" as const },
  ];
  return (
    <Plot xDomain={[-0.6, 2.6]} yDomain={[-0.2 * total, total * 1.14]} width={narrow ? 400 : 340} height={narrow ? 170 : 170} margin={{ top: 18, right: 8, bottom: 22, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={-0.6} axisY={0} ariaLabel={`variance along your line ${f2(v)}; along axis 1 ${f2(lam[0])} (${pct1(lam[0] / total)}); along axis 2 ${f2(lam[1])} (${pct1(lam[1] / total)}); the two axes sum to ${f2(total)}`}>
      <Curve pts={[[-0.6, total], [2.6, total]]} role="ghost" width={1} dash="3 3" smooth={false} />
      <Bars bars={items.map((it, i) => ({ x: i, y: it.val, w: 0.6 }))} role="truth" opacity={0.85} />
      <Bars bars={[{ x: 0, y: v, w: 0.6 }]} role="approx" opacity={0.9} />
      {items.map((it, i) => (
        <Label key={it.name} at={[i, it.val]} text={i === 0 ? f2(it.val) : `${f2(it.val)} · ${pct1(it.val / total)}`} role={it.role} dx={0} dy={-5} anchor="middle" />
      ))}
      <BarNames names={items.map((it) => it.name)} yAt={-0.1 * total} />
    </Plot>
  );
}
function BarNames({ names, yAt }: { names: string[]; yAt: number }) {
  const { x, y } = usePlot();
  return (
    <g>
      {names.map((n, i) => (
        <text key={n} className="label e3-ticklabel" x={x(i)} y={y(yAt) + 4} textAnchor="middle">
          {n}
        </text>
      ))}
    </g>
  );
}

export function F1Axes() {
  const narrow = useNarrow();
  const [deg, setDeg] = useState(0);
  const [rho, setRho] = useState(0.6);
  const theta = (deg * Math.PI) / 180;
  const z = useMemo(() => {
    const r = rng(CLOUD_SEED);
    return Array.from({ length: CLOUD_N }, () => [normalSample(r), normalSample(r)] as Pt);
  }, []);
  const S = useMemo(() => cloudCov(rho), [rho]);
  const L = useMemo(() => cholesky(S), [S]);
  const pts: Pt[] = useMemo(() => z.map(([a, b]) => [L[0][0] * a, L[1][0] * a + L[1][1] * b]), [z, L]);
  const xs = useMemo(() => Float64Array.from(pts, (p) => p[0]), [pts]);
  const ys = useMemo(() => Float64Array.from(pts, (p) => p[1]), [pts]);
  const p = useMemo(() => pca(S), [S]);
  const v = projectedVariance2(S, theta);
  const width = Math.sqrt(v);
  const axisDeg = p.vectors.map((e) => (((Math.atan2(e[1], e[0]) * 180) / Math.PI + 180) % 180));
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const proj = useMemo(() => Float64Array.from(pts, (q) => q[0] * c + q[1] * s), [pts, c, s]);
  const hist = useMemo(() => {
    const nb = Math.round((R[1] - R[0]) / BIN);
    const counts = new Array<number>(nb).fill(0);
    let m = 0;
    let m2 = 0;
    for (let i = 0; i < proj.length; i++) {
      const b = Math.floor((proj[i] - R[0]) / BIN);
      if (b >= 0 && b < nb) counts[b]++;
      m += proj[i];
      m2 += proj[i] * proj[i];
    }
    m /= proj.length;
    return { counts, sampleSd: Math.sqrt(Math.max(m2 / proj.length - m * m, 0)) };
  }, [proj]);
  const histMax = Math.max(...hist.counts);
  const sq = narrow ? 360 : 400;

  return (
    <Figure
      n="1"
      prompt={
        <>
          A drawn cloud, not data: {CLOUD_N} dots from a bell in two dimensions, widths {CLOUD_SD[0]} and {CLOUD_SD[1]}, tilted by the correlation you set. Turn the line through the middle and watch how
          wide the dots are <em>along it</em>. Find the widest direction by looking.
        </>
      }
      controls={
        <>
          <Slider label="direction" value={deg} min={0} max={180} step={1} onChange={setDeg} role="approx" fmt={(d) => d + "°"} width={narrow ? 150 : 200} />
          <Slider label="ρ, the correlation" value={rho} min={-0.95} max={0.95} step={0.05} onChange={setRho} role="truth" fmt={rho2} width={narrow ? 150 : 200} />
          <Readouts items={[["width at this angle", f2(width)], ["share 1", pct1(p.shares[0])], ["share 2", pct1(p.shares[1])]]} />
        </>
      }
      observe={
        <>
          The width along your line peaks in one direction — at ρ = {rho2(rho)} it is {Math.round(axisDeg[0])}°, width {f2(Math.sqrt(p.values[0]))} — and is smallest at right angles to it, width{" "}
          {f2(Math.sqrt(p.values[1]))}. Those two directions are the cloud's <strong>own axes</strong>; the widths squared ({f2(p.values[0])} and {f2(p.values[1])}) add up to the two original variances,{" "}
          {f2(CLOUD_SD[0] ** 2)} + {f2(CLOUD_SD[1] ** 2)}: nothing is lost, the wobble is only re-sorted by direction. Push ρ up and the long axis swings toward the diagonal while the short one shrinks toward nothing — at ρ = 1 the
          cloud is a line and one series is the other. The word for this arrives after the thing: the widest direction is the <strong>first principal component</strong>, the next-widest at right angles is the
          second, and a width squared is an <strong>eigenvalue</strong> of the covariance matrix — the arrows the matrix only stretches, in the collapsed panel below. The histogram is of the {CLOUD_N} drawn
          dots (their own width {f2(hist.sampleSd)}); the readout is the width of the bell they were drawn from.
        </>
      }
    >
      <div className="e3-axes">
        <div className="e3-axes-cloud">
          <Plot xDomain={R} yDomain={R} width={sq} height={sq} margin={{ top: 8, right: 8, bottom: 8, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={0} axisY={0} ariaLabel={`a drawn cloud of ${CLOUD_N} dots at correlation ${rho2(rho)} with a line at ${deg}° through its centre; every dot projected onto the line; the two principal axes at ${Math.round(axisDeg[0])}° and ${Math.round(axisDeg[1])}°`}>
            {p.vectors.map((e, i) => (
              <g key={i}>
                <DirLine u={e} role="ghost" width={i === 0 ? 1.5 : 1} />
                <Label at={[e[0] * 2.3 * Math.sqrt(p.values[i]) * (i === 0 ? 1 : 1.6), e[1] * 2.3 * Math.sqrt(p.values[i]) * (i === 0 ? 1 : 1.6)]} text={`axis ${i + 1}, ${Math.round(axisDeg[i])}°`} role="ink" dx={6} dy={-6} />
              </g>
            ))}
            <ScatterPath xs={xs} ys={ys} n={CLOUD_N} role="ghost" r={1.8} opacity={0.5} />
            <ProjectionTicks pts={pts} theta={theta} connectors={narrow ? 40 : 80} />
            <DirLine u={[c, s]} role="approx" width={2} />
            <Label at={[3.5 * c, 3.5 * s]} text={`your line, ${deg}°`} role="approx" dx={c >= 0.3 ? -4 : 4} dy={s > 0.3 ? 14 : -8} anchor={c >= 0.3 ? "end" : "start"} />
            <Label at={[R[0], R[1]]} text="a drawn cloud, not data" role="ink" dx={4} dy={12} />
          </Plot>
        </div>
        <div className="e3-axes-side">
          <div className="e3-panel-title">
            <strong>the dots along your line</strong> <span>{CLOUD_N} projections, bins of {BIN}; bracket = ± one width</span>
          </div>
          <Plot xDomain={R} yDomain={[-0.16 * histMax, histMax * 1.25]} width={narrow ? 400 : 340} height={narrow ? 170 : 180} margin={{ top: 8, right: 8, bottom: 8, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={R[0]} axisY={0} ariaLabel={`histogram of the ${CLOUD_N} projections at ${deg}°, width ${f2(width)}`}>
            <HistTicks yAt={-0.1 * histMax} />
            <Bars bars={hist.counts.map((cnt, i) => ({ x: R[0] + (i + 0.5) * BIN, y: cnt, w: BIN }))} role="approx" opacity={0.7} gap={1} />
            <Curve pts={[[-width, histMax * 1.12], [width, histMax * 1.12]]} role="ink" width={1.5} smooth={false} />
            <Curve pts={[[-width, histMax * 1.06], [-width, histMax * 1.18]]} role="ink" width={1.5} smooth={false} />
            <Curve pts={[[width, histMax * 1.06], [width, histMax * 1.18]]} role="ink" width={1.5} smooth={false} />
            <Label at={[0, histMax * 1.12]} text={`width ${f2(width)}`} role="ink" dx={0} dy={-6} anchor="middle" />
          </Plot>
          <div className="e3-panel-title">
            <strong>how much wobble each direction carries</strong> <span>variance = width²; dashed = the two axes' total, {f2(p.total)} = {f2(CLOUD_SD[0] ** 2)} + {f2(CLOUD_SD[1] ** 2)}</span>
          </div>
          <SharesBars v={v} lam={p.values} total={p.total} />
        </div>
      </div>
    </Figure>
  );
}
