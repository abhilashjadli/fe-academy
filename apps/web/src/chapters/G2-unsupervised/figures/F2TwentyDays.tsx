import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { Bars, Curve, Label, Plot, Points, type Pt } from "../../../ui/Plot";
import { XTicks, YTicks } from "./parts";
import { FIG2, N_DAYS, TSAY, W, WINDOWS, dmy, getPca, getRecon, getReconMse, n0, n2, n4, neg, pct1, useNarrow, type WindowName } from "./g2";

const m2 = (v: number) => neg(n2(v));

/**
 * Figure 2 — twenty days in two numbers (real record): each day's last twenty move sizes (|return| in %) as a 20-vector, PCA of
 * all 2,663 (live windowPca; shares, loadings and errors equal key.fig2). Left: the first three loadings as bars over "20 days
 * ago … yesterday" — level, slope, curvature, with their shares. Right: the chosen window's twenty values as dots and the window
 * rebuilt from the dialled k components (live reconstruct; equals key.fig2.windows[...].recon). Segmented window: the calmest
 * fortnight / the window ending 23 March 2020. Two controls; three readouts.
 */

const SHAPES = ["level", "slope", "curvature"] as const;
const DX: [number, number] = [-0.7, W - 0.3];
const LY: [number, number] = [-0.42, 0.42];
const DAY_TICKS = [0, 5, 10, 15, 19];
const dayLabel = (d: number) => (d === W - 1 ? "yesterday" : d === 0 ? `${W} days ago` : `${W - d}`);

function LoadingRow({ j, kept, narrow }: { j: number; kept: boolean; narrow: boolean }) {
  const p = getPca();
  const bars = p.loadings[j].map((v, d) => ({ x: d, y: v, w: 0.78 }));
  return (
    <Plot xDomain={DX} yDomain={LY} width={narrow ? 400 : 360} height={narrow ? 92 : 96} margin={{ top: 4, right: 8, bottom: 4, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={DX[0]} axisY={0} ariaLabel={`component ${j + 1}, ${SHAPES[j]}, ${pct1(p.share[j])} of the variance: its weight on each of the twenty days, ${W} days ago to yesterday`}>
      <Bars bars={bars} role={kept ? "approx" : "ghost"} opacity={kept ? 0.9 : 0.5} gap={1} />
      <Label at={[DX[0], LY[1]]} text={`${j + 1} · ${SHAPES[j]} · ${pct1(p.share[j])} of the variance${kept ? "" : " · dropped"}`} role={kept ? "approx" : "ghost"} dx={4} dy={12} />
      {j === 2 && <XTicks at={DAY_TICKS} fmt={dayLabel} ends />}
    </Plot>
  );
}

function Window({ name, k, narrow }: { name: WindowName; k: number; narrow: boolean }) {
  const p = getPca();
  const w = WINDOWS[name];
  const rec = getRecon(name, k);
  const vals: Pt[] = w.values.map((v, d) => [d, v]);
  const recPts: Pt[] = Array.from(rec, (v, d) => [d, v]);
  const meanPts: Pt[] = Array.from(p.colmean, (v, d) => [d, v]);
  const top = Math.max(...w.values, ...rec, ...p.colmean) * 1.28;
  const bottom = Math.min(0, ...rec) - 0.06 * top;
  const Y: [number, number] = [bottom, top];
  const yt = top > 4 ? [5, 10] : top > 1.5 ? [0.5, 1, 1.5] : [0.25, 0.5];
  let err = 0;
  for (let d = 0; d < W; d++) err += (rec[d] - w.values[d]) ** 2 / W;
  return (
    <Plot xDomain={DX} yDomain={Y} width={narrow ? 400 : 360} height={narrow ? 280 : 300} margin={{ top: 8, right: 8, bottom: 8, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={DX[0]} axisY={0} ariaLabel={`the twenty move sizes of the window ending ${dmy(w.ends)} as dots and the window rebuilt from ${k} component${k === 1 ? "" : "s"} as a curve; mean squared miss ${n4(err)}`}>
      <YTicks at={yt.filter((t) => t < top)} fmt={(t) => `${t} %`} />
      <XTicks at={DAY_TICKS} fmt={dayLabel} ends />
      <Curve pts={meanPts} role="ghost" width={1.2} dash="4 3" smooth={false} />
      <Label at={[DX[1], p.colmean[W - 1]]} text="dashed: the average window" role="ghost" dx={-4} dy={-6} anchor="end" />
      <Curve pts={recPts} role="approx" width={2.2} smooth={false} />
      <Points pts={vals} role="ink" r={3.6} opacity={0.95} />
      <Label at={[DX[0], Y[1]]} text={`dots: the ${W} move sizes · amber: rebuilt from ${k} component${k === 1 ? "" : "s"}`} role="ink" dx={4} dy={14} />
    </Plot>
  );
}

export function F2TwentyDays() {
  const narrow = useNarrow();
  const [k, setK] = useState(2);
  const [name, setName] = useState<WindowName>("pc2_min");
  const p = getPca();
  const w = WINDOWS[name];
  const mse = getReconMse(k);
  const mse0 = getReconMse(0);
  const rec = getRecon(name, k);
  let thisMiss = 0;
  for (let d = 0; d < W; d++) thisMiss += (rec[d] - w.values[d]) ** 2 / W;

  return (
    <Figure
      n="2"
      prompt={
        <>
          Now each day is its last {W} move sizes — a list of {W} numbers — and the question is chapter E3's: which few directions carry most of the variation across all {n0(N_DAYS)} lists? Keep k
          of them and rebuild a window. Dial k; pick a window.
        </>
      }
      controls={
        <>
          <Slider label="components kept" value={k} min={1} max={W} step={1} onChange={setK} role="approx" fmt={String} />
          <Segmented
            label="window"
            options={[
              { id: "calm", label: `calmest · ends ${dmy(WINDOWS.calm.ends)}` },
              { id: "pc2_min", label: `ends ${dmy(WINDOWS.pc2_min.ends)}` },
            ]}
            value={name}
            onChange={setName}
          />
          <Readouts
            items={[
              ["variance explained", pct1(p.cumulative[k - 1])],
              ["rebuilding error, all windows", <span>{n4(mse)} <span className="g2-dim">· {n4(mse0)} with none</span></span>],
              ["components", `${k} of ${W}`],
            ]}
          />
        </>
      }
      observe={
        <>
          Rows are the {W} move sizes |r| in % from {W} days ago to yesterday (oldest first), {n0(FIG2.n_windows)} of them; centred; covariance with 1/n; eigenvectors by the engine's symmetric solver. Shares{" "}
          {FIG2.share.slice(0, 4).map((s) => pct1(s)).join(", ")}; the first ten carry {pct1(FIG2.cumulative[9])} (engine, equal to the key). Component 1 weights every day alike ({m2(Math.min(...p.loadings[0]))} to{" "}
          {m2(Math.max(...p.loadings[0]))}): the level of volatility. Component 2 runs from {m2(p.loadings[1][0])} on the oldest day to {m2(p.loadings[1][W - 1])} on the newest: the slope. Component 3 bends. The
          mean squared error of rebuilding every window from k components is the dropped eigenvalues over {W}: {n4(FIG2.recon_mse[0])} with none, {n4(FIG2.recon_mse[1])}, {n4(FIG2.recon_mse[2])},{" "}
          {n4(FIG2.recon_mse[3])}, {n4(FIG2.recon_mse[5])} at five, {n4(FIG2.recon_mse[10])} at ten, {n4(FIG2.recon_mse[W])} at {W}. The window ending {dmy(WINDOWS.pc2_min.ends)} has the lowest slope score of the ten years ({m2(WINDOWS.pc2_min.scores[1])}:
          vol exploding), {dmy(WINDOWS.pc2_max.ends)} the highest (+{n2(WINDOWS.pc2_max.scores[1])}: collapsing); the calmest window — the lowest level score — ends {dmy(WINDOWS.calm.ends)}. Tsay's five stocks (Example 9.3,
          textbook): first component {pct1(TSAY.share1)} of the variance, every loading positive — a market factor. Most of a day's move size is its own.
        </>
      }
    >
      <div className="g2-twenty">
        <div className="g2-two">
          <div className="g2-panel">
            <div className="g2-panel-title">
              <strong>the first three directions</strong> <span>weight on each of the {W} days · amber: kept · grey: dropped</span>
            </div>
            <div className="g2-loadings">
              {SHAPES.map((_, j) => (
                <LoadingRow key={j} j={j} kept={j < k} narrow={narrow} />
              ))}
            </div>
          </div>
          <div className="g2-panel">
            <div className="g2-panel-title">
              <strong>the window ending {dmy(w.ends)}</strong> <span>{name === "calm" ? "the calmest fortnight of the ten years" : "vol exploding"} · rebuilt from {k} · this window's miss {n4(thisMiss)}</span>
            </div>
            <Window name={name} k={k} narrow={narrow} />
          </div>
        </div>
        <div className="g2-rule" role="status">
          <strong>
            {k} component{k === 1 ? "" : "s"}
          </strong>
          <span>
            {pct1(p.cumulative[k - 1])} of the variance · rebuilding error over all {n0(FIG2.n_windows)} windows {n4(mse)} · the dropped eigenvalues over {W}
          </span>
        </div>
      </div>
    </Figure>
  );
}
