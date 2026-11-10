import "./figures.css";
import { useEffect, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { Curve, HLine, Plot, type Pt } from "../../../ui/Plot";
import { normalSample, rng } from "../../../engine/random";
import { ar1Stationary } from "../../../engine/timeseries";
import { n1, n2, sd, useNarrow } from "./a4";

/**
 * Round 2 — the forgetting machine. A marble in a bowl, kicked by news every tick; the one dial is the bowl's steepness φ.
 * today = φ × yesterday + news. The bowl is a picture of that multiplication (said on the figure), not gravity.
 * "Release 500 marbles" (250 from each side, QuantEcon's two-starts move): the two piles land on one settled shape when φ < 1,
 * keep widening — and remember their side — at φ = 1, fly off above it. The table is ±12 while the home spread fits on it and
 * ±40 once it does not (φ ≥ 0.96), so the random walk is seen widening rather than falling off the edge.
 * Readouts: the marbles' spread vs the engine's stationary spread (ar1Stationary), and how many ticks the cloud has run.
 */

const SIGMA = 1;
const TABLE_NARROW = 12; // the bowl is drawn from −12 to +12 while the home spread fits
const TABLE_WIDE = 40; // and from −40 to +40 when it does not (φ ≥ 0.96, the flat table, the upturned bowl)
const N_CLOUD = 500;
const CLOUD_STEPS = 300;
const HIST = 160; // ticks of the single marble's trace kept

const BW = 420,
  BH = 220,
  PX0 = 20,
  PX1 = 400,
  BASE = 170,
  HMAX = 260; // px height of the bowl's rim at φ = 0
/** the upturned bowl (φ > 1) is drawn with a visual gain so the hill can be seen at all; the picture, not a quantity */
const GAIN_UP = 3;
const pxOn = (TABLE: number) => (x: number) => PX0 + ((x + TABLE) / (2 * TABLE)) * (PX1 - PX0);
const bowlYOn = (TABLE: number) => (x: number, phi: number) =>
  phi <= 1 ? BASE - (1 - phi) * (x / TABLE_NARROW) ** 2 * HMAX : BASE - (phi - 1) * GAIN_UP * HMAX * (1 - (x / TABLE) ** 2);
/** the two release points: 250 marbles from each — ±8 on the narrow table (QuantEcon's move), ±10 on the wide one so a
 *  random walk's 300-tick spread (√300 ≈ 17) stays on the table while it widens */
const startOn = (TABLE: number) => (TABLE === TABLE_NARROW ? 8 : 10);

interface Sim {
  x: number;
  hist: number[];
  off: number; // ticks since the marble flew off (0 = on the table)
  cloud: number[] | null;
  step: number;
  next: () => number;
}

export function F2Bowl() {
  const [phi, setPhi] = useState(0.9);
  const simRef = useRef<Sim>({ x: 0, hist: [0], off: 0, cloud: null, step: 0, next: rng(2) });
  const [, setTick] = useState(0);
  const narrow = useNarrow("(max-width: 760px)");
  const stat = ar1Stationary(phi, SIGMA);
  const homeSd = stat ? Math.sqrt(stat.variance) : null;
  const TABLE = homeSd !== null && homeSd <= 3.5 ? TABLE_NARROW : TABLE_WIDE;
  const BIN = TABLE / 30;
  const px = pxOn(TABLE);
  const bowlY = bowlYOn(TABLE);
  const START = startOn(TABLE);

  // the dial resets the marble (and the cloud) so each φ is seen from the centre
  useEffect(() => {
    const s = simRef.current;
    s.x = 0;
    s.hist = [0];
    s.off = 0;
    s.cloud = null;
    s.step = 0;
    setTick((t) => t + 1);
  }, [phi]);

  useEffect(() => {
    const slow = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setInterval(
      () => {
        const s = simRef.current;
        if (s.off > 0) {
          s.off++;
          if (s.off > 10) {
            s.off = 0;
            s.x = 0;
            s.hist.push(0);
          }
        } else {
          s.x = phi * s.x + SIGMA * normalSample(s.next);
          s.hist.push(s.x);
          if (Math.abs(s.x) > TABLE + 0.5) s.off = 1;
        }
        if (s.hist.length > HIST) s.hist.splice(0, s.hist.length - HIST);
        for (let rep = 0; rep < 2 && s.cloud && s.step < CLOUD_STEPS; rep++) {
          const c = s.cloud;
          for (let i = 0; i < c.length; i++) {
            if (!Number.isFinite(c[i])) continue;
            c[i] = phi * c[i] + SIGMA * normalSample(s.next);
            if (Math.abs(c[i]) > 200) c[i] = NaN; // gone for good
          }
          s.step++;
        }
        setTick((t) => t + 1);
      },
      slow ? 400 : 110,
    );
    return () => clearInterval(id);
  }, [phi]);

  const s = simRef.current;

  const alive = s.cloud ? s.cloud.filter((v) => Number.isFinite(v)) : [];
  const onTable = alive.filter((v) => Math.abs(v) <= TABLE);
  const lost = s.cloud ? N_CLOUD - onTable.length : 0;
  const cloudSd = alive.length > 1 ? sd(alive) : null;

  // the pile: marbles per bin, stacked on the bowl's surface (marbles beyond the table pile at its edge)
  const bins = new Map<number, number>();
  for (const v of onTable) {
    const k = Math.round(v / BIN);
    bins.set(k, (bins.get(k) ?? 0) + 1);
  }
  const maxBin = Math.max(1, ...bins.values());
  const unit = Math.min(2.6, 130 / maxBin);
  const bowlPath = Array.from({ length: 65 }, (_, i) => {
    const x = -TABLE + (i / 64) * 2 * TABLE;
    return `${i === 0 ? "M" : "L"}${px(x).toFixed(1)},${bowlY(x, phi).toFixed(1)}`;
  }).join("");
  const mx = Math.max(-TABLE - 0.4, Math.min(TABLE + 0.4, s.x));
  const trace: Pt[] = s.hist.map((v, i) => [i - s.hist.length + 1, Math.max(-TABLE - 1, Math.min(TABLE + 1, v))]);
  const regime = phi < 1 ? (phi < 0.7 ? "snaps home" : "wanders, but comes home") : phi === 1 ? "a flat table: a random walk" : "an upturned bowl: it flies off";

  return (
    <Figure
      n="2"
      prompt={
        <>
          Round 2. The only machine in this chapter: <strong>today = φ × yesterday + news</strong>. The bowl is a picture of that multiplication — not
          gravity — and φ is its steepness. Turn the dial, watch one marble; then release five hundred and see where they pile up.
        </>
      }
      controls={
        <>
          <Slider label="φ, the steepness" value={phi} min={0} max={1.05} step={0.01} onChange={setPhi} role="truth" />
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const c = simRef.current;
              c.cloud = Array.from({ length: N_CLOUD }, (_, i) => (i % 2 ? START : -START));
              c.step = 0;
              setTick((t) => t + 1);
            }}
          >
            {s.cloud ? "release 500 again" : "release 500 marbles"}
          </button>
          <Readouts
            items={[
              ["cloud", s.cloud ? `${s.step} ticks${s.step >= CLOUD_STEPS ? " (stopped)" : ""}` : "not released"],
              ["marbles' spread", <span className="a4-approx">{cloudSd === null ? "—" : n2(cloudSd)}</span>],
              ["home spread, theory", <span className="a4-truth">{homeSd === null ? (phi === 1 ? "none — keeps widening" : "none — flies off") : n2(homeSd)}</span>],
            ]}
          />
        </>
      }
      observe={
        <>
          φ = {n2(phi)}: <strong>{regime}</strong>.{" "}
          {homeSd !== null ? (
            <>
              A home exists because every kick is multiplied by {n2(phi)} each day and fades. Released from −{n1(START)} and +{n1(START)}, the two piles forget where they
              started and land on one shape, spread {n2(homeSd)} — the home.
            </>
          ) : phi === 1 ? (
            <>
              Nothing fades: every kick is kept in full. The pile has no shape to settle into — its spread grows like √ticks forever ({n1(Math.sqrt(Math.max(1, s.step)))} after{" "}
              {s.step} ticks). That is a random walk; its best forecast for any day ahead is today's position.
            </>
          ) : (
            <>Kicks are amplified, not forgotten: the marbles leave the table. A price cannot do this for long, which is why the boundary at φ = 1 matters.</>
          )}
        </>
      }
    >
      <div className={"a4-bowl-wrap " + (narrow ? "stack" : "")}>
        <svg className="a4-bowl" viewBox={`0 0 ${BW} ${BH}`} role="img" aria-label="a marble in a bowl whose steepness is φ">
          <line className="a4-table" x1={PX0} x2={PX1} y1={BASE} y2={BASE} />
          {homeSd !== null && homeSd <= TABLE && (
            <g className="a4-home">
              <line x1={px(-homeSd)} x2={px(-homeSd)} y1={BASE + 4} y2={BASE + 16} />
              <line x1={px(homeSd)} x2={px(homeSd)} y1={BASE + 4} y2={BASE + 16} />
              <text x={px(homeSd) + 4} y={BASE + 15}>
                ± home spread
              </text>
            </g>
          )}
          <path className="a4-bowl-line" d={bowlPath} />
          {/* the pile of marbles, stacked on the surface */}
          {[...bins.entries()].map(([k, c]) => {
            const xb = k * BIN;
            const top = bowlY(xb, phi);
            const h = c * unit;
            return <rect key={k} className="a4-pile" x={px(xb - BIN / 2) + 0.5} y={top - h} width={Math.max(1, px(xb + BIN / 2) - px(xb - BIN / 2) - 1)} height={h} />;
          })}
          {/* the one marble */}
          <circle className={"a4-marble " + (s.off ? "off" : "")} cx={px(mx)} cy={bowlY(mx, phi) - 6} r={6} />
          {s.off > 0 && (
            <text className="a4-gone" x={PX0} y={20} textAnchor="start">
              the marble left the table — a new one starts at 0
            </text>
          )}
          <text className="a4-axis" x={px(-TABLE)} y={BASE + 30} textAnchor="start">
            −{TABLE}
          </text>
          <text className="a4-axis" x={px(0)} y={BASE + 30} textAnchor="middle">
            0 · where the marbles pile up is the home
          </text>
          {homeSd !== null && !s.cloud && (
            <g className="a4-home">
              <text x={px(-START)} y={BASE - 6} textAnchor="middle">
                ▼ 250 start here
              </text>
              <text x={px(START)} y={BASE - 6} textAnchor="middle">
                250 start here ▼
              </text>
            </g>
          )}
          <text className="a4-axis" x={px(0)} y={BASE + 44} textAnchor="middle">
            {phi < 1 ? "a bowl: kicks are forgotten" : phi === 1 ? "a flat table: kicks are kept" : "upturned (drawn steeper than it is): kicks grow"}
          </text>
          <text className="a4-axis" x={px(TABLE)} y={BASE + 30} textAnchor="end">
            +{TABLE}
          </text>
          {s.cloud && lost > 0 && (
            <text className="a4-gone" x={PX1} y={s.off > 0 ? 36 : 20} textAnchor="end">
              {lost} of {N_CLOUD} marbles are off the table
            </text>
          )}
        </svg>
        <div className="a4-trace">
          <Plot xDomain={[-HIST + 1, 0]} yDomain={[-TABLE - 1, TABLE + 1]} width={narrow ? 420 : 300} height={narrow ? 200 : 220} xLabel="ticks ago" yLabel="the marble's position" xTicks={4} yTicks={5} margin={{ top: 14, right: 12, bottom: 34, left: 36 }}>
            {homeSd !== null && homeSd <= TABLE && (
              <>
                <HLine at={homeSd} />
                <HLine at={-homeSd} />
              </>
            )}
            <Curve pts={trace} role="truth" width={1.6} smooth={false} />
          </Plot>
        </div>
      </div>
    </Figure>
  );
}
