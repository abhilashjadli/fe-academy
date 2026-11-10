import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Toggle } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, VLine, usePlot, type Pt } from "../../../ui/Plot";
import { black76 } from "../../../engine/bs";
import { butterfly, smileVol } from "../../../engine/smile";
import { hestonSmile, mertonSmile, sabrSmile } from "../../../engine/volmodels";
import { StripDots, StripLegend } from "../../D2-smile/figures/strip";
import { DayPanels } from "./F0Knobs";
import { CHAIN, FITS, GRID, KEY, f2, f3, n0, pct1, s2, s3, toPts, useNarrow } from "./d3";
import { REAL_SECOND_EXPIRY } from "./secondExpiry";

/**
 * Figure 4 — same dots, three stories, and the two questions that tell them apart. The three fitted smiles on one axis over
 * 21,800–23,400 with the 34 dots: they coincide on the quoted strikes and fan apart outside. Toggle 1, the index falls 5 %: the key's
 * three panels (local vol flattens and jumps; Heston and Merton slide). Toggle 2, a second expiry: Gatheral's SPX variance skews by
 * expiry (textbook, until the 24 Nov NIFTY row arrives) against the fitted stories' predicted skews. SABR as one captioned row.
 */

const X: [number, number] = [21800, 23400];
const Y: [number, number] = [0.148, 0.196];
const STORIES = [
  { id: "local", name: "painted on the map", sub: "local vol — the smoothed smile it was painted from", role: "truth" as const, rms: FITS.rmsVolPts.quadratic },
  { id: "heston", name: "a life of its own", sub: "Heston, κ = 2", role: "approx" as const, rms: FITS.rmsVolPts.heston },
  { id: "merton", name: "potholes", sub: "Merton, 1 a year", role: "error" as const, rms: FITS.rmsVolPts.merton },
];
const TS = KEY.term_structure;
const DAY = KEY.day_minus_5pct;
const nearest = (K: number) => GRID.reduce((b, k) => (Math.abs(k - K) < Math.abs(b - K) ? k : b), GRID[0]);

function Ticks() {
  const { x, y, inner } = usePlot();
  return (
    <g>
      {[22000, 22250, 22600, 23050, 23300].map((K) => (
        <text key={K} className="label d3-ticklabel" x={x(K)} y={inner.top + inner.height - 5} textAnchor="middle">
          {n0(K)}
        </text>
      ))}
      {[0.15, 0.16, 0.17, 0.18, 0.19].map((v) => (
        <text key={v} className="label d3-ticklabel" x={inner.left + 4} y={y(v) - 3}>
          {pct1(v).replace(".0", "")}
        </text>
      ))}
    </g>
  );
}

/** variance skew d(σ²)/dk at k = 0 over ±1 % for a fitted story at horizon T, by the engine */
function varSkewAt(story: "heston" | "merton", T: number): number {
  const ks = [Math.exp(-0.01), 1, Math.exp(0.01)];
  const v = story === "heston" ? hestonSmile({ ...FITS.heston, F: 1, T }, ks) : mertonSmile({ ...FITS.merton, F: 1, T }, ks);
  return (v[2] * v[2] - v[0] * v[0]) / 0.02;
}

function TermPanel() {
  const narrow = useNarrow();
  const real = REAL_SECOND_EXPIRY;
  const rows = useMemo(() => {
    const src = real ? real.rows.map((r) => ({ T: r.T, label: r.label, skew: r.varSkew })) : TS.rows.map((r) => ({ T: r.T, label: r.label, skew: r.spx_var_skew }));
    return src.map((r) => ({ ...r, heston: varSkewAt("heston", r.T), merton: varSkewAt("merton", r.T) }));
  }, [real]);
  const lx = (T: number) => Math.log10(T * 365);
  const xd: [number, number] = [lx(rows[0].T) - 0.15, lx(rows[rows.length - 1].T) + 0.55];
  const yd: [number, number] = [-0.3, 0.02];
  const chainX = lx(CHAIN.T);
  // smooth prediction lines across the panel
  const line = (story: "heston" | "merton"): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const e = xd[0] + 0.15 + ((xd[1] - 0.55 - xd[0] - 0.15) * i) / 24;
      out.push([e, varSkewAt(story, Math.pow(10, e) / 365)]);
    }
    return out;
  };
  const hl = useMemo(() => line("heston"), []);
  const ml = useMemo(() => line("merton"), []);
  return (
    <div className="d3-term">
      <div className="d3-panel-title">
        <strong>a second expiry</strong> <span>{real ? real.source : "textbook: Gatheral's SPX, 15 Sep 2005 (Table 3.1) — the 24 Nov NIFTY row replaces it when it arrives"}</span>
      </div>
      <Plot xDomain={xd} yDomain={yd} width={narrow ? 390 : 560} height={narrow ? 250 : 270} margin={{ top: 12, right: 14, bottom: 36, left: 44 }} xTicks={0} yTicks={4} grid={false} axisX={xd[0]} axisY={0} xLabel="time to expiry" yLabel="steepness of the smile at the money (variance skew)" ariaLabel="at-the-money variance skew against time to expiry: the textbook SPX points and the fitted Heston and Merton stories' predicted decay">
        <TermTicks rows={rows.map((r) => ({ x: lx(r.T), label: r.label }))} />
        <VLine at={chainX} />
        <Label at={[chainX, yd[1]]} text="this chain, 11 days" dx={4} dy={26} role="ghost" />
        <Curve pts={hl} role="approx" width={2} />
        <Curve pts={ml} role="error" width={2} />
        <Marker at={[chainX, TS.chain_quadratic_var_skew]} role="truth" r={5} />
        {rows.map((r, i) => (
          <g key={r.label}>
            <Marker at={[lx(r.T), r.skew]} role="ink" r={5} />
            <Label at={[lx(r.T), r.skew]} text={`${real ? "real" : "SPX"} ${s3(r.skew)}`} dx={i === rows.length - 1 ? -8 : 8} dy={i === rows.length - 1 ? 16 : -8} anchor={i === rows.length - 1 ? "end" : "start"} />
            <Marker at={[lx(r.T), r.heston]} role="approx" r={3.5} />
            <Marker at={[lx(r.T), r.merton]} role="error" r={3.5} />
          </g>
        ))}
        <Label at={hl[0]} text="Heston" role="approx" dx={8} dy={14} />
        <Label at={ml[0]} text="Merton" role="error" dx={8} dy={14} />
      </Plot>
      <p className="d3-term-note">
        {real ? "Real rows" : "Textbook rows"}: {rows.map((r) => `${s3(r.skew)} at ${r.label}`).join(", ")}. The fitted stories at those dates — Heston {rows.map((r) => s3(r.heston)).join(" / ")}; Merton{" "}
        {rows.map((r) => s3(r.merton)).join(" / ")} (key: Heston {TS.rows.map((r) => s3(r.heston_var_skew)).join(" / ")}, Merton {TS.rows.map((r) => s3(r.merton_var_skew)).join(" / ")}). Heston's tilt fades
        like one over time; Merton's is steepest at a day and gone past a few weeks; local vol has no prediction here — it follows whatever surface it was painted from, and one expiry does not give it one.
        Blue dot: this chain's own tilt, {s3(TS.chain_quadratic_var_skew)} at 11 days.
      </p>
    </div>
  );
}
function TermTicks({ rows }: { rows: Array<{ x: number; label: string }> }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {rows.map((r) => (
        <text key={r.label} className="label d3-ticklabel" x={x(r.x)} y={inner.top + inner.height - 5} textAnchor="middle">
          {r.label.replace("1d", "1 day").replace("1m", "1 month").replace("21m", "21 months")}
        </text>
      ))}
    </g>
  );
}

export function F4Together() {
  const narrow = useNarrow();
  const [day, setDay] = useState(false);
  const [second, setSecond] = useState(false);
  const curves = useMemo(
    () => ({
      local: GRID.map((K) => smileVol(FITS.quadratic, CHAIN.F, K)),
      heston: hestonSmile(FITS.heston, GRID),
      merton: mertonSmile(FITS.merton, GRID),
      sabr: sabrSmile(CHAIN.F, CHAIN.T, FITS.sabr, GRID),
    }),
    [],
  );
  const at = (id: keyof typeof curves, K: number) => curves[id][GRID.indexOf(nearest(K))];
  const sabrZone = useMemo(() => {
    const price = (K: number) => black76({ F: CHAIN.F, K, r: 0, sigma: sabrSmile(CHAIN.F, CHAIN.T, FITS.sabr, [K])[0], T: CHAIN.T });
    const neg = GRID.filter((K) => butterfly(price(K - 25), price(K), price(K + 25)) < 0);
    let wideFirst: number | null = null;
    for (let K = 12000; K <= 30000; K += 20) if (butterfly(price(K - 10), price(K), price(K + 10)) < 0) wideFirst = wideFirst ?? K;
    return { neg, wideFirst };
  }, []);
  const triple = (K: number) => `${pct1(at("local", K))} / ${pct1(at("heston", K))} / ${pct1(at("merton", K))}`;

  return (
    <Figure
      n="4"
      prompt={
        <>
          Same dots, three stories. The three fitted smiles on one axis: blue painted on the map, amber a life of its own, red potholes. Across the quoted strikes they are one curve; outside them
          they fan apart. Two questions tell them apart, and neither is on today's screen.
        </>
      }
      controls={
        <>
          <Toggle label="the index falls 5 %" on={day} onChange={setDay} />
          <Toggle label="a second expiry" on={second} onChange={setSecond} />
          <Readouts items={[["at 22,000", triple(22000)], ["at 23,300", triple(23300)], ["rms to the dots", STORIES.map((s) => f3(s.rms)).join(" / ")]]} />
        </>
      }
      observe={
        <>
          Rms {STORIES.map((s) => f3(s.rms)).join(" / ")} vol points for map / life / potholes — D2's plain quadratic scores {f3(FITS.rmsVolPts.quadratic)}, and the map's smile <em>is</em> that quadratic by
          construction. Wings at 22,000: {triple(22000)}; at 23,300: {triple(23300)} (key, at 22,000: {pct1(KEY.fits.quadratic.wing_22000)} / {pct1(KEY.fits.heston.wing_22000)} /{" "}
          {pct1(KEY.fits.merton.wing_22000)}). Today's quotes do not choose the story. A −5 % day does: the map's smile flattens and its level jumps ({pct1(DAY.local_vol.before.atm_vol)} →{" "}
          {pct1(DAY.local_vol.after.atm_vol)} at the money, slope {f3(DAY.local_vol.before.slope).replace("-", "−")} → {f3(DAY.local_vol.after.slope).replace("-", "−")}); the other two slide with the index
          unchanged in shape. The sticky-strike reader is wrong in all three, differently. This is the thing today's chain cannot tell you, and the thing the desk is paid to get right.
        </>
      }
    >
      <div className="d3-stage">
        <Plot xDomain={X} yDomain={Y} width={narrow ? 420 : 640} height={narrow ? 280 : 340} margin={{ top: 14, right: 16, bottom: 34, left: 16 }} xLabel="strike" yLabel="implied wobble" xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={Y[0]} ariaLabel="the three fitted smiles over 21,800 to 23,400 with the 34 real dots: they coincide on the quoted strikes and fan apart in the wings">
          <Ticks />
          <Curve pts={[[CHAIN.F, Y[0]], [CHAIN.F, Y[1]]]} role="ghost" dash="3 3" width={1} smooth={false} />
          <Label at={[CHAIN.F, Y[1]]} text={`forward ${n0(CHAIN.F)}`} dx={4} dy={12} />
          <Curve pts={[[22250, Y[0]], [22250, Y[1]]]} role="ghost" width={0.8} smooth={false} />
          <Curve pts={[[23050, Y[0]], [23050, Y[1]]]} role="ghost" width={0.8} smooth={false} />
          <Label at={[22650, Y[0]]} text={narrow ? "the quoted strikes" : "the quoted strikes, 22,250 – 23,050"} role="ghost" dx={0} dy={-20} anchor="middle" />
          <Curve pts={toPts(GRID, curves.local)} role="truth" width={2.2} />
          <Curve pts={toPts(GRID, curves.heston)} role="approx" width={2.2} />
          <Curve pts={toPts(GRID, curves.merton)} role="error" width={2.2} />
          <StripDots />
          {(["local", "heston", "merton"] as const).map((id) =>
            [22000, 23300].map((K) => <Marker key={id + K} at={[K, at(id, K)]} role={id === "local" ? "truth" : id === "heston" ? "approx" : "error"} r={4} />),
          )}
        </Plot>
        <StripLegend extra={<span className="d2-legend-note">marked: the wings at 22,000 and 23,300</span>} />
        <table className="table d3-wings">
          <thead>
            <tr>
              <th>story</th>
              <th>at 22,000</th>
              <th>at 23,300</th>
              <th>rms to the dots</th>
            </tr>
          </thead>
          <tbody>
            {STORIES.map((s) => (
              <tr key={s.id}>
                <td>
                  <i className="d2-sw line" style={{ background: `var(--${s.role})` }} /> <strong>{s.name}</strong> <span className="d3-quiet">{s.sub}</span>
                </td>
                <td>{pct1(at(s.id as "local" | "heston" | "merton", 22000))}</td>
                <td>{pct1(at(s.id as "local" | "heston" | "merton", 23300))}</td>
                <td>{f3(s.rms)} vol pt</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d3-sabr">
          <Plot xDomain={X} yDomain={Y} width={narrow ? 420 : 640} height={narrow ? 120 : 130} margin={{ top: 6, right: 16, bottom: 6, left: 16 }} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={Y[0]} ariaLabel="SABR's smile through the same dots, with any strikes where its implied density goes negative marked in red">
            {sabrZone.neg.length > 0 && (
              <Curve pts={[[sabrZone.neg[0] - 12, Y[0] + 0.002], [sabrZone.neg[sabrZone.neg.length - 1] + 12, Y[0] + 0.002]]} role="error" width={6} opacity={0.5} smooth={false} />
            )}
            <Curve pts={toPts(GRID, curves.sabr)} role="ghost" width={2} dash="6 3" />
            <StripDots dim />
            <Label at={[X[0], Y[1]]} text="SABR, the desk's ruler" role="ghost" dx={6} dy={12} />
          </Plot>
          <p className="d3-sabr-caption">
            <strong>The desk's ruler:</strong> SABR draws a smile through a few quotes with three knobs that do the three jobs — α {pct1(FITS.sabr.alpha)} level, ρ {s2(FITS.sabr.rho)} tilt, ν{" "}
            {f2(FITS.sabr.nu)} curvature — rms {f3(FITS.rmsVolPts.sabr)} vol points, {pct1(at("sabr", 22000))} at 22,000, {pct1(at("sabr", 23300))} at 23,300 (key). It is an interpolator, not a story: no mean
            reversion, so it is only trusted for short expiries, and far enough into the low wing its formula prices a negative probability.{" "}
            {sabrZone.neg.length > 0
              ? `Red: its butterfly goes negative from ${n0(sabrZone.neg[0])} to ${n0(sabrZone.neg[sabrZone.neg.length - 1])} on this plot.`
              : `Here its butterfly stays positive on every strike of the plot — the red zone is beyond the plot${sabrZone.wideFirst ? ` (first negative density near ${n0(sabrZone.wideFirst)})` : ": at 11 days the engine finds none between 12,000 and 30,000"}.`}
          </p>
        </div>
        {day && (
          <div className="d3-dayblock">
            <div className="d3-panel-title">
              <strong>the index falls 5 % overnight</strong> <span>dashed today, solid tomorrow; same strikes, each story's own rule (key)</span>
            </div>
            <DayPanels compact />
          </div>
        )}
        {second && <TermPanel />}
      </div>
    </Figure>
  );
}
