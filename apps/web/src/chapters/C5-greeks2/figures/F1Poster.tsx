import "./figures.css";
import { useMemo, type ReactNode } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, VLine, type Pt } from "../../../ui/Plot";
import { plane } from "../../../engine/greeks2";
import type { Greeks2 } from "../../../engine/greeks2";
import { n0 } from "../../C4-greeks/figures/row";
import { XTicks } from "./ticks";
import { KEY, ROW, STRIKES, STRIKE_ROLE, deltaVsDays, deltaVsVol, f1, f2, f3, g2, pct1, useNarrow, type Strike } from "./c5";

/**
 * Figure 1 — the sign-map poster. Legend first; three planes (vanna, charm, volga) over strike × days left at the row's
 * at-the-money wobble, two hues only (positive = truth, negative = error), lightness by size normalised per plane, the
 * at-the-money ridge dashed, three printed values per plane at 11 days. Side panels: Natenberg's delta-vs-wobble and
 * delta-vs-days curves redrawn from the engine on the real row. A second, smaller row (speed, zomma, color) captioned
 * with one sentence each, Wilmott's footnote and Moontower's residual underneath. No controls.
 */

const P = KEY.planes;
const STRIKE_LIST = P.strikes;
const DAYS = P.days;
const SIGMA = P.sigma;
const RIDGE = ROW.F;
const ROW_DAYS = ROW.days;

type Name = keyof Pick<Greeks2, "vanna" | "charm" | "volga" | "speed" | "zomma" | "color">;

interface PlaneSpec {
  name: Name;
  title: string;
  sub: string;
  unit: string;
  fmt: (v: number) => string;
}
const BIG: PlaneSpec[] = [
  { name: "vanna", title: "vanna", sub: "delta's drift when the wobble moves", unit: "per unit σ", fmt: f2 },
  { name: "charm", title: "charm", sub: "delta's drift when the clock moves", unit: "per year", fmt: f2 },
  { name: "volga", title: "volga", sub: "how the wobble-sensitivity itself bends", unit: "per unit σ²", fmt: (v) => (Math.abs(v) >= 100 ? n0(v) : f1(v)) },
];
const SMALL: Array<PlaneSpec & { caption: ReactNode }> = [
  {
    name: "speed",
    title: "speed",
    sub: "gamma's slope",
    unit: "per index point",
    fmt: f3,
    caption: (
      <>
        <q>The speed of an option is the rate of change of the gamma with respect to the stock price … hence the use of speed in a higher-order Taylor series expansion.</q> — Wilmott, p. 126.
      </>
    ),
  },
  {
    name: "zomma",
    title: "zomma",
    sub: "gamma's wobble-sensitivity",
    unit: "per unit σ",
    fmt: f3,
    caption: <>How the bend changes when the wobble does: Natenberg's gamma-against-volatility picture — the at-the-money gamma grows as the wobble assumption falls (p. 106).</>,
  },
  {
    name: "color",
    title: "color",
    sub: "gamma's drift with the clock",
    unit: "per year",
    fmt: f3,
    caption: <>Positive at the money in calendar time: the bend grows as expiry nears — Natenberg's gamma-against-time picture, the one that "can increase dramatically as expiration approaches".</>,
  },
];

const sgn = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "");

/** geometric band edges for a log-ish day axis */
function edges(days: number[]): number[] {
  const e: number[] = [];
  for (let i = 0; i < days.length; i++) {
    const lo = i === 0 ? days[0] / Math.sqrt(days[1] / days[0]) : Math.sqrt(days[i - 1] * days[i]);
    e.push(lo);
  }
  e.push(days[days.length - 1] * Math.sqrt(days[days.length - 1] / days[days.length - 2]));
  return e;
}
const EDGES = edges(DAYS);
const LOG_LO = Math.log(EDGES[0]),
  LOG_HI = Math.log(EDGES[EDGES.length - 1]);

function usePlane(name: Name) {
  return useMemo(() => {
    const v = plane(name, ROW.F, ROW.r, SIGMA, STRIKE_LIST, DAYS);
    let max = 0;
    for (const row of v) for (const x of row) max = Math.max(max, Math.abs(x));
    return { v, max };
  }, [name]);
}

function HeatPlane({ spec, small = false }: { spec: PlaneSpec; small?: boolean }) {
  const { v, max } = usePlane(spec.name);
  const W = 300,
    H = small ? 150 : 220;
  const M = small ? { l: 24, r: 4, t: 4, b: 16 } : { l: 30, r: 6, t: 6, b: 22 };
  const iw = W - M.l - M.r,
    ih = H - M.t - M.b;
  const kStep = STRIKE_LIST[1] - STRIKE_LIST[0];
  const kLo = STRIKE_LIST[0] - kStep / 2,
    kHi = STRIKE_LIST[STRIKE_LIST.length - 1] + kStep / 2;
  const xOf = (K: number) => M.l + ((K - kLo) / (kHi - kLo)) * iw;
  const yOf = (d: number) => M.t + ((LOG_HI - Math.log(d)) / (LOG_HI - LOG_LO)) * ih; // 60 d at the top, expiry at the bottom
  const jRow = DAYS.indexOf(ROW_DAYS);
  const printed = STRIKES.map((K) => ({ K, v: v[jRow][STRIKE_LIST.indexOf(K)] }));
  return (
    <div className={"c5-plane " + (small ? "small" : "")}>
      <div className="c5-plane-title">
        <strong>{spec.title}</strong>
        <span className="c5-plane-sub">{spec.sub}</span>
      </div>
      <svg className="c5-heat" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${spec.title} over strike and days left: ${printed.map((p) => `${n0(p.K)} ${sgn(p.v)}${spec.fmt(Math.abs(p.v))}`).join(", ")} at ${ROW_DAYS} days`}>
        {v.map((row, j) =>
          row.map((val, i) => {
            const u = max > 0 ? 0.08 + 0.92 * Math.sqrt(Math.abs(val) / max) : 0;
            const pct = Math.round(u * 100);
            const hue = val >= 0 ? "var(--truth)" : "var(--error)";
            const x0 = xOf(STRIKE_LIST[i] - kStep / 2),
              x1 = xOf(STRIKE_LIST[i] + kStep / 2);
            const y0 = yOf(EDGES[j + 1]),
              y1 = yOf(EDGES[j]);
            return <rect key={i + "-" + j} x={x0} y={y0} width={x1 - x0 + 0.4} height={y1 - y0 + 0.4} style={{ fill: `color-mix(in srgb, ${hue} ${pct}%, var(--surface-raised))` }} />;
          }),
        )}
        <line className="c5-ridge" x1={xOf(RIDGE)} x2={xOf(RIDGE)} y1={M.t} y2={M.t + ih} />
        {!small && (
          <>
            <line className="c5-rowline" x1={M.l} x2={M.l + iw} y1={yOf(ROW_DAYS)} y2={yOf(ROW_DAYS)} />
            {printed.map((p) => (
              <circle key={p.K} className="c5-pin" cx={xOf(p.K)} cy={yOf(ROW_DAYS)} r={3.2} />
            ))}
          </>
        )}
        <g className="c5-heat-axis">
          {(small ? [22000, 23000] : [22000, 22600, 23000]).map((K) => (
            <text key={K} x={xOf(K)} y={H - M.b + (small ? 11 : 13)} textAnchor="middle">
              {n0(K)}
            </text>
          ))}
          {(small ? [1, 11, 60] : [1, 5, 11, 20, 60]).map((d) => (
            <text key={d} x={M.l - 4} y={yOf(d) + 3} textAnchor="end">
              {d === 1 ? "1 d" : d}
            </text>
          ))}
          {!small && (
            <text x={M.l + iw} y={H - 1} textAnchor="end" className="c5-heat-word">
              strike →
            </text>
          )}
        </g>
      </svg>
      {!small && (
        <div className="c5-plane-values">
          <span className="c5-plane-unit">at {ROW_DAYS} days, {spec.unit}</span>
          {printed.map((p) => (
            <span key={p.K} className={"c5-val " + (p.v >= 0 ? "pos" : "neg")}>
              <i>{n0(p.K)}</i> {sgn(p.v)}
              {spec.fmt(Math.abs(p.v))}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SidePanel({ kind }: { kind: "vol" | "days" }) {
  const narrow = useNarrow();
  const curves = useMemo(() => Object.fromEntries(STRIKES.map((K) => [K, kind === "vol" ? deltaVsVol(K) : deltaVsDays(K)])) as Record<Strike, Pt[]>, [kind]);
  const xDomain: [number, number] = kind === "vol" ? [0.05, 0.4] : [0, 60];
  const here = kind === "vol" ? SIGMA : ROW_DAYS;
  return (
    <div className="c5-side">
      <div className="c5-panel-title">
        {kind === "vol" ? (
          <>
            slope against the <strong>wobble</strong> at {ROW_DAYS} days — the vanna plane read along its {ROW_DAYS}-day row
          </>
        ) : (
          <>
            slope against the <strong>days left</strong> at each strike's own wobble — the charm plane read down a column
          </>
        )}
      </div>
      <Plot xDomain={xDomain} yDomain={[0, 1]} width={narrow ? 360 : 300} height={narrow ? 210 : 200} margin={{ top: 14, right: 12, bottom: 32, left: 38 }} xTicks={kind === "vol" ? 0 : 5} yTicks={5} xLabel={kind === "vol" ? "wobble" : "days left"} axisX={xDomain[0]} axisY={0} ariaLabel={`delta of the 22,250, 22,600 and 23,050 calls against ${kind === "vol" ? "the wobble" : "the days left"} (Natenberg's figures ${kind === "vol" ? "6-13" : "6-11"} on the real row)`}>
        {kind === "vol" && <XTicks at={[0.1, 0.2, 0.3]} fmt={(v) => Math.round(v * 100) + " %"} />}
        <VLine at={here} />
        {STRIKES.map((K) => (
          <Curve key={K} pts={curves[K]} role={STRIKE_ROLE[K]} width={K === 22600 ? 1.4 : 2} dash={K === 22600 ? "4 3" : undefined} />
        ))}
        {STRIKES.map((K) => (
          <Marker key={"m" + K} at={[here, kind === "vol" ? g2(K, ROW_DAYS, SIGMA).delta : g2(K, ROW_DAYS).delta]} role={STRIKE_ROLE[K]} r={3.5} />
        ))}
        <Label at={[kind === "vol" ? 0.3 : 45, 0.84]} text="22,250" role="error" dy={-4} />
        <Label at={[kind === "vol" ? 0.3 : 45, 0.5]} text="22,600" dy={-6} />
        <Label at={[kind === "vol" ? 0.3 : 45, kind === "vol" ? 0.3 : 0.26]} text="23,050" role="truth" dy={18} />
      </Plot>
    </div>
  );
}

export function F1Poster() {
  const pv = KEY.plane_values_11d;
  return (
    <Figure
      n="1"
      prompt={
        <>
          The sign map. Every strike from {n0(STRIKE_LIST[0])} to {n0(STRIKE_LIST[STRIKE_LIST.length - 1])} across, every date from one day to sixty up, at the row's own wobble ({pct1(SIGMA)}). Read the
          legend, then the three planes, then the two curves you already met.
        </>
      }
      observe={
        <>
          Vanna and charm are mirror images with the same zero line; charm crowds toward expiry, vanna's dark patches sit weeks out; volga is a wing phenomenon, pale along the ridge with a thin
          sliver of the opposite sign hugging it. Key, at {ROW_DAYS} days: vanna {f2(pv.vanna["22250"])} / {sgn(pv.vanna["22600"])}
          {f2(Math.abs(pv.vanna["22600"]))} / +{f2(pv.vanna["23050"])} per unit σ; charm +{f2(pv.charm["22250"])} / {f2(pv.charm["22600"])} / {f2(pv.charm["23050"])} per year; volga {n0(pv.volga["22250"])} /{" "}
          {f1(pv.volga["22600"]).replace("-", "−")} / {n0(pv.volga["23050"])} per unit σ². The second row is there so that you have seen the names; you have Wilmott's permission to forget them.
        </>
      }
    >
      <div className="c5-legend" aria-label="legend">
        <span>
          <i className="c5-sw pos" /> positive — hue is which way
        </span>
        <span>
          <i className="c5-sw neg" /> negative
        </span>
        <span>
          <i className="c5-sw ramp" /> darker = how much (square-root scale, each plane on its own)
        </span>
        <span>
          <i className="c5-sw dash" /> at the money, forward {n0(RIDGE)}
        </span>
        <span>
          <i className="c5-sw pin" /> the three strikes at {ROW_DAYS} days
        </span>
      </div>
      <div className="c5-planes">
        {BIG.map((s) => (
          <HeatPlane key={s.name} spec={s} />
        ))}
      </div>
      <div className="c5-sides">
        <SidePanel kind="vol" />
        <SidePanel kind="days" />
        <div className="c5-side-note">
          <p>
            Natenberg drew these two pictures without naming either plane. <q>As we increase the time to expiration or increase volatility, all options tend to become more at-the-money, with call
            deltas approaching 50 … Options which are at-the-money and have deltas close to 50 tend to maintain the same delta characteristics regardless of changes in time or volatility.</q> (p. 106)
          </p>
          <p>The slope of each curve where the marker sits is one cell of the plane above it. The 22,600 line is flat in both: that is the white ridge.</p>
        </div>
      </div>
      <div className="c5-second">
        <div className="c5-second-head">the rest — the same question asked of gamma, small on purpose</div>
        <div className="c5-planes small">
          {SMALL.map((s) => (
            <div key={s.name} className="c5-small-cell">
              <HeatPlane spec={s} small />
              <p className="c5-small-caption">{s.caption}</p>
            </div>
          ))}
        </div>
        <div className="c5-foot">
          <p>
            <q>The second derivative with respect to σ has been called 'vomma' and the second-order derivative with respect to the asset and the volatility has been called 'kabanga'. I doubt that
            they represent what their fans think they represent, and I'm going to make no further mention of them.</q> — Wilmott, footnote, p. 127.
          </p>
          <p>
            The honest scale: when delta, vega, gamma and theta are subtracted from a real option's daily P&L, the residual left to vanna, volga and charm stays <strong>under 0.4 cents</strong> across a
            year of daily data (Moontower). They matter for books, wings and the last days before expiry — not for one at-the-money call.
          </p>
        </div>
      </div>
    </Figure>
  );
}
