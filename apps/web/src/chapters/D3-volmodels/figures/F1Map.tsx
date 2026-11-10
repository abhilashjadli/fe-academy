import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts } from "../../../ui/controls";
import { Band, Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { impliedSmileFromCloud, localVolFromSmile, rmsToDots, simulateStory } from "../../../engine/volmodels";
import { StripDots, StripLegend, StripPlot } from "../../D2-smile/figures/strip";
import { DAYS_AXIS, DotPile, PRICE, PriceTicks, quantiles } from "./cloud";
import { CHAIN, DAYS, FITS, KEY, f3, impliedAt, n0, pct1, s2, toPts, useNarrow } from "./d3";
import { useTicker } from "./useProgress";

/**
 * Figure 1 — story 1, painted on the map (local volatility). C3's cloud at 11 days with a strip beside the price axis coloured by the
 * local wobble σ_L(K) read from D2's smoothed smile by Dupire's rule (the key's T-slice: 19.2 % at 22,000, 14.7 % near 23,050, 14.9 % at
 * 23,300). Play: the cloud is grown 22 half-day steps on the engine's map (each step reads the colour under the current price at the step's
 * own date), then C3's root-finder traces the smile strike by strike on the finished cloud and lands on the real dots.
 * One control. Readouts: the colour under the cursor, the implied wobble there, the rms to the dots after the trace.
 */

const N_PATHS = 2000;
const N_STEPS = 22;
const SEED = 7;
const MAP = localVolFromSmile(FITS.quadratic, CHAIN.F, CHAIN.T);
const LV = KEY.local_vol;
const BIN = 25;
const STEP_MS = 60;
const COL_LO = 0.14,
  COL_HI = 0.22;
const opacityFor = (s: number) => 0.06 + 0.9 * Math.max(0, Math.min(1, (s - COL_LO) / (COL_HI - COL_LO)));

/** The cross-section after each step: the simulator with the same seed and a shorter horizon walks the same draws, so step s of the full run is run s. */
function growCloud(): Float64Array[] {
  const dt = CHAIN.T / N_STEPS;
  const out: Float64Array[] = [new Float64Array(N_PATHS).fill(CHAIN.F)];
  for (let s = 1; s <= N_STEPS; s++) out.push(simulateStory({ story: "local", map: MAP, F: CHAIN.F, T: s * dt }, N_PATHS, s, SEED));
  return out;
}

function ColourStrip({ hover }: { hover: number | null }) {
  const { x, y, inner } = usePlot();
  const x0 = inner.left + 1;
  const w = 13;
  const cells = useMemo(() => {
    const out: Array<{ p0: number; p1: number; s: number }> = [];
    for (let p = PRICE[0]; p < PRICE[1]; p += BIN) out.push({ p0: p, p1: p + BIN, s: MAP.sigma(p + BIN / 2, CHAIN.T) });
    return out;
  }, []);
  return (
    <g className="d3-heatstrip">
      {cells.map((c) => (
        <rect key={c.p0} x={x0} y={y(c.p1)} width={w} height={y(c.p0) - y(c.p1) + 0.5} style={{ fillOpacity: opacityFor(c.s) }} />
      ))}
      <rect x={x0} y={y(PRICE[1])} width={w} height={y(PRICE[0]) - y(PRICE[1])} className="d3-heatframe" />
      {hover !== null && (
        <g>
          <line className="d3-hoverline" x1={x0} x2={x(DAYS_AXIS[1])} y1={y(hover)} y2={y(hover)} />
          <rect className="d3-hovermark" x={x0 - 2} y={y(hover) - 1.5} width={w + 4} height={3} />
        </g>
      )}
    </g>
  );
}

export function F1Map() {
  const narrow = useNarrow();
  const [playing, setPlaying] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const steps = useMemo(() => (playing ? growCloud() : null), [playing]);
  const tick = useTicker(playing, N_STEPS + CHAIN.strikes.length, STEP_MS, nonce);
  const step = Math.min(tick, N_STEPS);
  const traced = Math.max(0, tick - N_STEPS);
  const grown = step >= N_STEPS;
  const final = steps ? steps[N_STEPS] : null;
  const smile = useMemo(() => (final ? impliedSmileFromCloud(final, CHAIN.strikes, CHAIN.r, CHAIN.T, CHAIN.F) : null), [final]);
  const rms = useMemo(() => (smile && traced >= CHAIN.strikes.length ? rmsToDots((K) => smile[CHAIN.strikes.indexOf(K)]) : null), [smile, traced]);
  const fan = useMemo(() => {
    if (!steps) return null;
    const dt = DAYS / N_STEPS;
    const q = steps.slice(0, step + 1).map((cs, s) => ({ d: s * dt, q: quantiles(cs, [0.05, 0.25, 0.75, 0.95]) }));
    return {
      outerU: q.map((r) => [r.d, r.q[3]] as Pt),
      outerL: q.map((r) => [r.d, r.q[0]] as Pt),
      innerU: q.map((r) => [r.d, r.q[2]] as Pt),
      innerL: q.map((r) => [r.d, r.q[1]] as Pt),
    };
  }, [steps, step]);
  const current = steps ? steps[step] : null;
  const dayNow = (step * DAYS) / N_STEPS;

  const play = () => {
    setNonce((n) => n + 1);
    setPlaying(true);
  };
  const hoverK = hover !== null ? Math.max(PRICE[0], Math.min(PRICE[1], hover)) : null;
  const localHere = hoverK !== null ? MAP.sigma(hoverK, CHAIN.T) : null;
  const impliedHere = hoverK !== null ? impliedAt(hoverK) : null;
  const cloudW = narrow ? 390 : 520,
    cloudH = narrow ? 340 : 380;

  return (
    <Figure
      n="1"
      prompt={
        <>
          Story 1. The wobble is a property of the <em>place</em>: beside the price axis, a strip coloured by how much the index wobbles when it is at that level — darker is wider — read off D2's
          smoothed smile by Dupire's rule. Press play: the cloud is grown half a day at a time, each step as wide as the colour under it; then C3's root-finder reads the finished cloud strike by
          strike. Hover the strip to read the colour.
        </>
      }
      controls={
        <>
          <button type="button" className="btn primary" onClick={play} disabled={playing && tick < N_STEPS + CHAIN.strikes.length}>
            {playing ? (tick < N_STEPS + CHAIN.strikes.length ? (grown ? "tracing…" : "growing…") : "play again") : "play"}
          </button>
          <Readouts
            items={[
              ["local wobble under the cursor", localHere !== null ? pct1(localHere) : "hover the strip"],
              ["implied wobble at that strike", impliedHere !== null ? pct1(impliedHere) : "—"],
              ["rms to the dots", rms !== null ? f3(rms) + " vol pt" : traced > 0 ? "tracing…" : "—"],
            ]}
          />
        </>
      }
      observe={
        <>
          The strip reads <strong>{pct1(LV.at_22000)}</strong> at 22,000, <strong>{pct1(LV.min_sigma_loc)}</strong> near {n0(LV.min_K)} and {pct1(LV.at_23300)} at 23,300 (key), and a cloud of 200,000 paths grown on it reprices the
          smoothed smile within {f3(KEY.local_vol_check.mc.max_err_vol_pts)} of a vol point (key); these 2,000 are noisier, and the readout prints their own rms to the dots. Side note: at the money the local slope is{" "}
          {s2(LV.atm_slope_local)} per unit of log-moneyness against the implied {s2(LV.atm_slope_implied)} — nearly twice as steep. The implied wobble at a strike is the <em>average colour along the road to
          it</em>, and an average of a slope is half the slope.
        </>
      }
    >
      <div className="d3-stage">
        <Plot
          xDomain={DAYS_AXIS}
          yDomain={PRICE}
          width={cloudW}
          height={cloudH}
          margin={{ top: 14, right: 12, bottom: 34, left: 16 }}
          xLabel="days from now"
          xTicks={8}
          yTicks={0}
          grid={false}
          axisY={PRICE[0]}
          onHover={(_x, yv) => setHover(yv)}
          ariaLabel={`the cloud of ${N_PATHS.toLocaleString()} futures of the index grown step by step on a local-volatility map, with a strip beside the price axis coloured by the local wobble`}
        >
          <PriceTicks at={[21800, 22200, 22600, 23000, 23400]} dx={20} />
          <ColourStrip hover={hoverK} />
          <Curve pts={[[0, CHAIN.F], [DAYS, CHAIN.F]]} role="ghost" dash="4 4" width={1.2} smooth={false} />
          <Label at={[0.6, CHAIN.F]} text={`today: forward ${n0(CHAIN.F)}`} dx={8} dy={16} />
          <Curve pts={[[DAYS, PRICE[0]], [DAYS, PRICE[1]]]} role="ink" width={1} smooth={false} />
          <Label at={[DAYS, PRICE[1]]} text={`expiry, ${DAYS} days`} dx={-8} dy={14} anchor="end" />
          {fan && (
            <>
              <Band upper={fan.outerU} lower={fan.outerL} role="ghost" />
              <Band upper={fan.innerU} lower={fan.innerL} role="truth" />
            </>
          )}
          {current && <DotPile futures={current} xAt={dayNow} widthPx={Math.max(20, (cloudW - 12 - 16) * ((DAYS_AXIS[1] - dayNow - 0.4) / DAYS_AXIS[1]))} role={grown ? "plain" : "truth"} />}
          {playing && !grown && <Label at={[0.4, PRICE[0]]} text={`step ${step} of ${N_STEPS} · ${pct1(MAP.sigma(current ? current[0] : CHAIN.F, (step / N_STEPS) * CHAIN.T))} under the first path`} dx={4} dy={-8} role="truth" />}
          <Marker at={[0, CHAIN.F]} role="ink" r={4} />
        </Plot>
        <div className="d3-strip-legend">
          <span>
            <i className="d3-heat-sw" style={{ opacity: opacityFor(LV.at_22000) }} /> {pct1(LV.at_22000)} at 22,000
          </span>
          <span>
            <i className="d3-heat-sw" style={{ opacity: opacityFor(LV.min_sigma_loc) }} /> {pct1(LV.min_sigma_loc)} near {n0(LV.min_K)}
          </span>
          <span>
            <i className="d3-heat-sw" style={{ opacity: opacityFor(LV.at_23300) }} /> {pct1(LV.at_23300)} at 23,300
          </span>
          <span className="d2-legend-note">the T-slice; the cloud reads the slice at each step's own date</span>
        </div>
        <StripPlot ariaLabel="the real 34 implied vols against strike, with the smile traced strike by strike from the cloud grown on the local-volatility map" height={260}>
          <StripDots dim={traced > 0} />
          {smile && traced > 0 && (
            <>
              {traced >= CHAIN.strikes.length && <Curve pts={toPts(CHAIN.strikes, smile)} role="approx" width={2} />}
              {CHAIN.strikes.slice(0, traced).map((K, j) => (
                <Marker key={K} at={[K, smile[j]]} role="approx" r={4.5} />
              ))}
              {traced < CHAIN.strikes.length && <Label at={[CHAIN.strikes[traced - 1], smile[traced - 1]]} text={`${n0(CHAIN.strikes[traced - 1])}: ${pct1(smile[traced - 1])}`} role="approx" dx={8} dy={-8} />}
            </>
          )}
        </StripPlot>
        <StripLegend
          extra={
            <span className="d2-legend-note">
              <i className="d2-sw approx" /> traced from the cloud{rms !== null ? ` · rms ${f3(rms)} vol pt` : ""}
            </span>
          }
        />
      </div>
    </Figure>
  );
}
