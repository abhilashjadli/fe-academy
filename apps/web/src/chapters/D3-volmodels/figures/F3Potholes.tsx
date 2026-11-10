import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { Curve, Label, Plot, usePlot } from "../../../ui/Plot";
import { cloud as bellCloud } from "../../../engine/bs";
import { mertonComponent, mertonSmile, poissonWeights, rmsToDots, type MertonModel } from "../../../engine/volmodels";
import { StripDots, StripLegend, StripPlot } from "../../D2-smile/figures/strip";
import { DotPile, PriceTicks } from "./cloud";
import { CHAIN, DAYS, FITS, KEY, STRIP_GRID, f3, n0, pct1, pct2, pctS, s2, toPts, useNarrow } from "./d3";

/**
 * Figure 3 — story 3, potholes (Merton). The cloud is three clouds stacked side by side — no jump, one jump, two jumps — each a Black-76
 * bell of exact quantiles (C3's cloud) at the forward and width the engine gives that count of jumps (mertonComponent), with the number of
 * dots in each set by the Poisson weights (poissonWeights: at one jump a year and 11 days, 97.0 / 2.9 / 0.04 %). The pricer is the same
 * mixture, so the clouds are the price. One dial: the typical jump μ_J. Segmented: jumps a year, 1 or 5 (the key's two fits).
 * Readouts: tilt, rms, chance of at least one jump before expiry.
 */

type Lam = "1" | "5";
const FIT: Record<Lam, MertonModel> = { "1": FITS.merton, "5": FITS.mertonL5 };
const RMS: Record<Lam, number> = { "1": FITS.rmsVolPts.merton, "5": FITS.rmsVolPts.mertonL5 };
const N_DOTS = 2000;
const PRICE_J: [number, number] = [17800, 25000];
const COLS = [
  { n: 0, name: "no jump", role: "plain" as const },
  { n: 1, name: "one jump", role: "approx" as const },
  { n: 2, name: "two jumps", role: "error" as const },
];

function ColHeads({ weights, counts, comps }: { weights: number[]; counts: number[]; comps: Array<{ F: number; sigma: number }> }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {COLS.map((c) => (
        <g key={c.n}>
          <text className="label d3-colhead" x={x(c.n + 0.5)} y={inner.top + 12} textAnchor="middle">
            {c.name}
          </text>
          <text className="label d3-ticklabel" x={x(c.n + 0.5)} y={inner.top + 25} textAnchor="middle">
            {c.n === 2 ? pct2(weights[c.n]) : pct1(weights[c.n])} · {counts[c.n].toLocaleString("en-US")} {counts[c.n] === 1 ? "dot" : "dots"}
          </text>
          <text className="label d3-ticklabel" x={x(c.n + 0.5)} y={inner.top + 38} textAnchor="middle">
            {n0(comps[c.n].F)} · {pct1(comps[c.n].sigma)} wide
          </text>
          {c.n > 0 && <line className="d3-colsep" x1={x(c.n)} x2={x(c.n)} y1={inner.top + 44} y2={inner.top + inner.height} />}
        </g>
      ))}
    </g>
  );
}

export function F3Potholes() {
  const narrow = useNarrow();
  const [lam, setLamState] = useState<Lam>("1");
  const [muJ, setMuJ] = useState(FITS.merton.muJ);
  const setLam = (l: Lam) => {
    setLamState(l);
    setMuJ(FIT[l].muJ);
  };
  const model = useMemo<MertonModel>(() => ({ ...FIT[lam], muJ }), [lam, muJ]);
  const weights = useMemo(() => poissonWeights(model.lam, CHAIN.T, 3), [model.lam]);
  const counts = useMemo(() => weights.map((w) => Math.max(w > 0 ? 1 : 0, Math.round(N_DOTS * w))), [weights]);
  const clouds = useMemo(
    () =>
      COLS.map((c) => {
        const comp = mertonComponent(model, c.n);
        return bellCloud(comp.F, comp.sigma, CHAIN.T, counts[c.n]);
      }),
    [model, counts],
  );
  const comps = useMemo(() => COLS.map((c) => mertonComponent(model, c.n)), [model]);
  const h = 0.01;
  const live = useMemo(() => {
    const probes = [CHAIN.F * Math.exp(-h), CHAIN.F * Math.exp(h)];
    const vols = mertonSmile(model, [...STRIP_GRID, ...CHAIN.strikes, ...probes]);
    const strip = vols.slice(0, STRIP_GRID.length);
    const atDots = vols.slice(STRIP_GRID.length, STRIP_GRID.length + CHAIN.strikes.length);
    const p = vols.slice(STRIP_GRID.length + CHAIN.strikes.length);
    return { strip, tilt: (p[1] - p[0]) / (2 * h), rms: rmsToDots((K) => atDots[CHAIN.strikes.indexOf(K)]) };
  }, [model]);
  const pAtLeastOne = 1 - weights[0];
  const keyP1 = KEY.poisson_weights["1.0"],
    keyP5 = KEY.poisson_weights["5.0"];
  const plotW = narrow ? 390 : 480;
  const colPx = ((plotW - 28) / 3) * 0.9;

  return (
    <Figure
      n="3"
      prompt={
        <>
          Story 3. The index wobbles gently and, now and then, hits a pothole. The cloud is three clouds: the futures that saw no jump, one jump, two jumps, each a bell of its own width at its own
          centre, with the number of dots in each set by how likely that many potholes are in eleven days. D2's two-point frown from Hull was this picture with two bells; here the small bell is a rare
          bad day. One dial: the typical jump.
        </>
      }
      controls={
        <>
          <Slider label="typical jump μ_J" value={muJ} min={-0.09} max={0} step={0.001} onChange={setMuJ} fmt={(v) => pctS(v)} role="error" width={narrow ? 120 : undefined} />
          <Segmented<Lam> label="jumps a year" options={[{ id: "1", label: "1" }, { id: "5", label: "5" }]} value={lam} onChange={setLam} />
          <Readouts items={[["tilt at the forward", s2(live.tilt)], ["rms to the dots", f3(live.rms) + " vol pt"], ["chance of a jump before expiry", pct1(pAtLeastOne)]]} />
        </>
      }
      observe={
        <>
          At one jump a year the fit is σ {pct1(FITS.merton.sigma)}, μ_J {pctS(FITS.merton.muJ)}, jump spread {pct1(FITS.merton.sJ)}: rms {f3(FITS.rmsVolPts.merton)} vol points, the best of the three
          stories (key). The weights are {pct1(keyP1.weights[0])} / {pct1(keyP1.weights[1])} / {pct2(keyP1.weights[2])}, so {pct1(keyP1.p_at_least_one)} of the cloud has seen a pothole. At five a year the same
          chain is fitted by smaller, more frequent ones (σ {pct1(FITS.mertonL5.sigma)}, μ_J {pctS(FITS.mertonL5.muJ)}, spread {pct1(FITS.mertonL5.sJ)}; rms {f3(FITS.rmsVolPts.mertonL5)}; {pct1(keyP5.p_at_least_one)} of the cloud jumps): the
          chain sees the mixture, not the recipe.
        </>
      }
    >
      <div className="d3-two">
        <div className="d3-col">
          <Plot
            xDomain={[0, 3]}
            yDomain={PRICE_J}
            width={plotW}
            height={narrow ? 320 : 380}
            margin={{ top: 8, right: 12, bottom: 34, left: 16 }}
            xTicks={0}
            yTicks={0}
            grid={false}
            axisY={PRICE_J[0]}
            axisX={0}
            xLabel={`at expiry, ${DAYS} days`}
            ariaLabel={`three clouds of futures at ${DAYS} days: ${counts[0]} with no jump centred near ${n0(comps[0].F)}, ${counts[1]} with one jump centred near ${n0(comps[1].F)}, ${counts[2]} with two`}
          >
            <PriceTicks at={[18000, 19000, 20000, 21000, 22000, 23000]} side="right" />
            <Curve pts={[[0, CHAIN.F], [3, CHAIN.F]]} role="ghost" dash="4 4" width={1.2} smooth={false} />
            <Label at={[3, CHAIN.F]} text={`forward ${n0(CHAIN.F)}`} role="ghost" dx={-4} dy={-5} anchor="end" />
            <ColHeads weights={weights} counts={counts} comps={comps} />
            {COLS.map((c, i) => (
              <DotPile key={c.n} futures={clouds[i]} xAt={c.n + 0.04} widthPx={colPx} range={PRICE_J} role={c.role} maxPitch={c.n === 0 ? 4.4 : 6} bin={c.n === 0 ? 25 : 100} />
            ))}
          </Plot>
        </div>
        <div className="d3-col">
          <StripPlot ariaLabel="the real 34 implied vols against strike with the smile the Merton mixture traces at the current dial" height={narrow ? 260 : 300}>
            <StripDots />
            <Curve pts={toPts(STRIP_GRID, live.strip)} role="error" width={2.4} />
          </StripPlot>
          <StripLegend
            extra={
              <span className="d2-legend-note">
                <i className="d2-sw error" /> the mixture's smile at μ_J {pctS(muJ)}, {lam} a year · fit rms {f3(RMS[lam])}
              </span>
            }
          />
        </div>
      </div>
    </Figure>
  );
}
