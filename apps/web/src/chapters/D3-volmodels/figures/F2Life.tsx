import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { hestonPath, hestonSmile, rmsToDots, simulateStory } from "../../../engine/volmodels";
import { StripDots, StripLegend, StripPlot } from "../../D2-smile/figures/strip";
import { DAYS_AXIS, DotPile, PriceTicks } from "./cloud";
import { CHAIN, DAYS, FITS, STRIP_GRID, f1, f2, f3, n0, pct1, s2, toPts, useNarrow } from "./d3";

/**
 * Figure 2 — story 2, a life of its own (Heston). Above the cloud, one simulated path of the wobble itself over the 11 days, jagged,
 * pulled toward a dashed home; below, the terminal cloud of 2,000 such paths at the current dials; beside, the smile the model traces
 * (the exact pricer, hestonSmile) over the real dots. Two dials: the lean ρ and the jitter η. Readouts: tilt, curvature, rms to the dots.
 * Collapsed: the five knobs as places on the picture.
 */

const H = FITS.heston;
const N_PATHS = 2000;
const N_STEPS = 22;
const SEED = 11;
const PATH_SEED = 33;
const VOL_Y: [number, number] = [0, 0.36];
const PRICE_WIDE: [number, number] = [21400, 23800];

function VolTicks() {
  const { y, inner } = usePlot();
  return (
    <g>
      {[0.1, 0.2, 0.3].map((v) => (
        <text key={v} className="label d3-ticklabel" x={inner.left + 4} y={y(v) - 3}>
          {pct1(v).replace(".0", "")}
        </text>
      ))}
    </g>
  );
}

export function F2Life() {
  const narrow = useNarrow();
  const [rho, setRho] = useState(Math.round(H.rho * 100) / 100);
  const [eta, setEta] = useState(Math.round(H.eta * 100) / 100);
  const model = useMemo(() => ({ ...H, rho, eta }), [rho, eta]);
  const path = useMemo(() => hestonPath(model, N_STEPS * 4, PATH_SEED), [model]);
  const cloud = useMemo(() => simulateStory({ story: "heston", model }, N_PATHS, N_STEPS, SEED), [model]);
  const h = 0.01,
    h2 = 0.02;
  const probes = useMemo(() => [CHAIN.F * Math.exp(-h), CHAIN.F, CHAIN.F * Math.exp(h), CHAIN.F * Math.exp(-h2), CHAIN.F * Math.exp(h2)], []);
  const live = useMemo(() => {
    const vols = hestonSmile(model, [...STRIP_GRID, ...CHAIN.strikes, ...probes]);
    const strip = vols.slice(0, STRIP_GRID.length);
    const atDots = vols.slice(STRIP_GRID.length, STRIP_GRID.length + CHAIN.strikes.length);
    const p = vols.slice(STRIP_GRID.length + CHAIN.strikes.length);
    const tilt = (p[2] - p[0]) / (2 * h);
    const curve = 0.5 * ((p[4] - 2 * p[1] + p[3]) / (h2 * h2));
    const rms = rmsToDots((K) => atDots[CHAIN.strikes.indexOf(K)]);
    return { strip, tilt, curve, rms };
  }, [model, probes]);

  const volPts = useMemo<Pt[]>(() => Array.from(path.v, (v, i) => [(i * DAYS) / (N_STEPS * 4), Math.sqrt(Math.max(v, 0))]), [path]);
  const pricePts = useMemo<Pt[]>(() => Array.from(path.price, (p, i) => [(i * DAYS) / (N_STEPS * 4), p]), [path]);
  const home = Math.sqrt(H.theta);
  const cloudW = narrow ? 390 : 480;

  return (
    <Figure
      n="2"
      prompt={
        <>
          Story 2. The wobble has a life of its own: above the cloud, one path of it over the eleven days — it starts at {pct1(Math.sqrt(H.v0))}, wanders, and is pulled back toward a home
          (dashed). The cloud below breathes with it; the curve beside is the smile this cloud prices. Two dials: the <strong>lean</strong> (how the wobble moves with the price) and the{" "}
          <strong>jitter</strong> (how much it wanders).
        </>
      }
      controls={
        <>
          <Slider label="lean ρ" value={rho} min={-0.6} max={0.6} step={0.01} onChange={setRho} fmt={(v) => s2(v)} role="truth" width={narrow ? 120 : undefined} />
          <Slider label="jitter η" value={eta} min={0} max={1.2} step={0.01} onChange={setEta} fmt={(v) => f2(v)} role="approx" width={narrow ? 120 : undefined} />
          <Readouts items={[["tilt at the forward", s2(live.tilt)], ["curvature", f1(live.curve).replace("-", "−")], ["rms to the dots", f3(live.rms) + " vol pt"]]} />
        </>
      }
      observe={
        <>
          At ρ = {s2(H.rho)}, η = {f2(H.eta)} the traced smile tilts onto the dots: rms {f3(FITS.rmsVolPts.heston)} vol points (key). Drag the lean to +0.3 and the tilt goes the other way; drag the
          jitter to 0 and the curve is a flat line at {pct1(Math.sqrt(H.v0))} — a wobble that never wanders is Black–Scholes. Tilt and curvature are two different knobs, and the breathing cloud is the
          picture the five symbols describe.
        </>
      }
    >
      <div className="d3-two">
        <div className="d3-col">
          <Plot
            xDomain={DAYS_AXIS}
            yDomain={VOL_Y}
            width={cloudW}
            height={150}
            margin={{ top: 12, right: 12, bottom: 6, left: 16 }}
            xTicks={0}
            yTicks={0}
            grid={false}
            axisY={VOL_Y[0]}
            ariaLabel={`one simulated path of the wobble over ${DAYS} days under the current dials, pulled toward its home at ${pct1(home)}`}
          >
            <VolTicks />
            <Curve pts={[[0, home], [DAYS, home]]} role="ghost" dash="5 4" width={1.2} smooth={false} />
            <Label at={[DAYS, home]} text={`home θ: ${pct1(home)}`} role="ghost" dx={4} dy={-5} />
            <Curve pts={[[DAYS, VOL_Y[0]], [DAYS, VOL_Y[1]]]} role="ink" width={1} smooth={false} />
            <Curve pts={volPts} role="approx" width={1.8} smooth={false} />
            <Marker at={[0, Math.sqrt(H.v0)]} role="ink" r={3.5} />
            <Label at={[0, Math.sqrt(H.v0)]} text={`now v₀: ${pct1(Math.sqrt(H.v0))}`} dx={8} dy={22} />
            <Label at={[0, VOL_Y[1]]} text="the wobble itself, one path" role="approx" dx={40} dy={12} />
          </Plot>
          <Plot
            xDomain={DAYS_AXIS}
            yDomain={PRICE_WIDE}
            width={cloudW}
            height={narrow ? 300 : 330}
            margin={{ top: 6, right: 12, bottom: 34, left: 16 }}
            xLabel="days from now"
            xTicks={8}
            yTicks={0}
            grid={false}
            axisY={PRICE_WIDE[0]}
            ariaLabel={`the cloud of ${N_PATHS.toLocaleString()} futures of the index under the current lean and jitter, piled at ${DAYS} days, with the same path's price drawn across`}
          >
            <PriceTicks at={[21600, 22000, 22400, 22800, 23200, 23600]} />
            <Curve pts={[[0, CHAIN.F], [DAYS, CHAIN.F]]} role="ghost" dash="4 4" width={1.2} smooth={false} />
            <Curve pts={[[DAYS, PRICE_WIDE[0]], [DAYS, PRICE_WIDE[1]]]} role="ink" width={1} smooth={false} />
            <Label at={[DAYS, PRICE_WIDE[1]]} text={`expiry, ${DAYS} days`} dx={-6} dy={12} anchor="end" />
            <Curve pts={pricePts} role="approx" width={1.2} smooth={false} opacity={0.8} />
            <DotPile futures={cloud} xAt={DAYS} widthPx={(cloudW - 28) * ((DAYS_AXIS[1] - DAYS - 0.4) / DAYS_AXIS[1])} range={PRICE_WIDE} role="plain" />
            <Marker at={[0, CHAIN.F]} role="ink" r={4} />
            <Label at={[0, CHAIN.F]} text={`today: forward ${n0(CHAIN.F)}`} dx={8} dy={-8} />
          </Plot>
        </div>
        <div className="d3-col">
          <StripPlot ariaLabel="the real 34 implied vols against strike with the smile the Heston model traces at the current dials" height={narrow ? 260 : 300}>
            <StripDots />
            <Curve pts={toPts(STRIP_GRID, live.strip)} role="approx" width={2.4} />
          </StripPlot>
          <StripLegend
            extra={
              <span className="d2-legend-note">
                <i className="d2-sw approx" /> the model's smile at ρ {s2(rho)}, η {f2(eta)}
              </span>
            }
          />
      <details className="d3-more d3-more-col">
        <summary>the five knobs as places on the picture</summary>
        <p>
          <strong>v₀</strong> — where the top path starts ({pct1(Math.sqrt(H.v0))} here: the wobble now). <strong>θ</strong> — the dashed line it is pulled toward (the long-run wobble; the fit
          holds it at v₀). <strong>κ</strong> — how hard the pull is (2 a year here; Figure 0 showed 20 draws the same smile at eleven days). <strong>η</strong> — the vertical jitter of the path (
          {f2(H.eta)}: with it at zero the path is a smooth glide and the cloud is one bell). <strong>ρ</strong> — the lean: with ρ negative, the steps that take the price down tend to take the
          wobble up, so the low side of the cloud is drawn from wider steps ({s2(H.rho)} here). Level is v₀, tilt is ρ, curvature is η; the chain of one expiry reads those three.
        </p>
      </details>
        </div>
      </div>
    </Figure>
  );
}
