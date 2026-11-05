import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Comic, Panel, Says, Who } from "../../../ui/Comic";
import { Readouts } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { black76, black76Greeks } from "../../../engine/bs";
import { rng } from "../../../engine/random";
import { BASE, KEY, ROW, f2, n0, n2, rs, s2 } from "./c3";
import "./figures.css";

/**
 * Figure 3 — Raj lays off the bet. Three drawn panels and one live one. Panel 1: Raj has sold the 22,600 call for 249.15 and wants no
 * view on the index; today's curve with a slope triangle reading 0.51. Panel 2: index +100 / −100 — the call's change against 0.51 × 100
 * of index, from the engine. Live panel: one button, tick: the index moves, the slope changes, Raj buys or sells a sliver, and the
 * hedged book stays flat against the premium in the bank while the naked book swings. Panel 4: the flat line written in words.
 */

const SIGMA = KEY.atm.iv;
const LOT = ROW.lot;
const PREMIUM = LOT * ROW.call;
const MAX_TICKS = 10; // one day per tick; the last tick leaves a day to expiry
const SEED = 17;
const X_RANGE: [number, number] = [22000, 23200];

/**
 * A fixed sequence of index moves from the engine's seeded generator (the same every visit): ±90–280 points a day, which is the
 * size of move a 15.9 % wobble promises (22,603 × 0.1585 / √365 ≈ 187 points rms). Smaller moves would make the hedged book drift
 * up — the index calmer than the dial — which is D1's lesson, not this one.
 */
const MOVES: number[] = (() => {
  const next = rng(SEED);
  const out: number[] = [];
  for (let i = 0; i < MAX_TICKS; i++) {
    const sign = next() < 0.5 ? -1 : 1;
    out.push(sign * Math.round((90 + 190 * next()) / 5) * 5);
  }
  return out;
})();

interface Tick {
  t: number;
  F: number;
  days: number;
  delta: number;
  sliver: number; // units of index bought (+) or sold (−) at this tick
  bank: number; // the premium, in the bank
  hedged: number; // short 65 calls + delta hedge financed by borrowing + the premium in the bank
  naked: number; // short 65 calls + the premium in the bank
}

/** The bookkeeping: the premium sits in the bank at 6.5 %; the hedge is index futures (no money changes hands to hold them), whose
 * daily gains and losses go into the same account. The book is the account minus what the 65 calls are worth. */
function simulate(): Tick[] {
  const out: Tick[] = [];
  const day = Math.exp(ROW.r / 365);
  let F = ROW.F;
  let days = ROW.days;
  const g0 = black76Greeks({ ...BASE, sigma: SIGMA, T: days / 365 });
  let h = LOT * g0.delta;
  let bank = PREMIUM; // the premium alone, growing at 6.5 %
  let cash = PREMIUM; // the premium plus the hedge's running gains and losses
  out.push({ t: 0, F, days, delta: g0.delta, sliver: h, bank, hedged: cash - LOT * g0.price, naked: bank - LOT * g0.price });
  for (let t = 1; t <= MAX_TICKS; t++) {
    const dF = MOVES[t - 1];
    F += dF;
    days -= 1;
    bank *= day;
    cash = cash * day + h * dF;
    const g = black76Greeks({ ...BASE, F, sigma: SIGMA, T: days / 365 });
    const hNew = LOT * g.delta;
    const sliver = hNew - h;
    h = hNew;
    out.push({ t, F, days, delta: g.delta, sliver, bank, hedged: cash - LOT * g.price, naked: bank - LOT * g.price });
  }
  return out;
}

/** The slope triangle on today's curve at the forward. */
function SlopeTriangle({ at, slope, run }: { at: Pt; slope: number; run: number }) {
  const { x, y } = usePlot();
  const x0 = x(at[0]),
    y0 = y(at[1]);
  const x1 = x(at[0] + run),
    y1 = y(at[1] + slope * run);
  return (
    <g>
      <path d={`M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} Z`} fill="var(--truth-soft)" stroke="var(--truth)" strokeWidth={1.2} />
      <text className="label truth" x={x1 + 5} y={(y0 + y1) / 2 + 4} style={{ fontSize: 12, fontWeight: 600 }}>
        {f2(slope)}
      </text>
      <text className="label" x={(x0 + x1) / 2} y={y0 + 12} textAnchor="middle" style={{ fontSize: 10 }}>
        +{run}
      </text>
    </g>
  );
}

function Bars({ pairs }: { pairs: Array<{ label: string; call: number; hedge: number }> }) {
  const W = 300,
    H = 165,
    base = 84,
    scale = 0.9; // px per rupee
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="For an index move of plus and minus 100: the call's change against the hedge's change; they almost cancel">
      <line x1={10} x2={W - 10} y1={base} y2={base} stroke="var(--axis)" />
      {pairs.map((p, i) => {
        const cx = 60 + i * 150;
        const bar = (v: number, dx: number, role: string) => (
          <rect x={cx + dx} y={v >= 0 ? base - v * scale : base} width={26} height={Math.abs(v) * scale} fill={`var(--${role})`} opacity={0.85} rx={1.5} />
        );
        const labelY = (v: number) => (v >= 0 ? base - v * scale - 4 : base + Math.abs(v) * scale + 11);
        const vCall = -p.call; // Raj is short: the call's gain is his loss
        return (
          <g key={p.label}>
            {bar(vCall, -32, "error")}
            {bar(p.hedge, 6, "truth")}
            <text x={cx - 19} y={labelY(vCall)} textAnchor="middle" fontSize="10" fontFamily="var(--font-ui)" fill="var(--error-text)" fontWeight={600}>
              {s2(vCall)}
            </text>
            <text x={cx + 19} y={labelY(p.hedge)} textAnchor="middle" fontSize="10" fontFamily="var(--font-ui)" fill="var(--truth-text)" fontWeight={600}>
              {s2(p.hedge)}
            </text>
            <text x={cx} y={H - 4} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-ui)" fill="var(--ink-2)">
              {p.label}
            </text>
          </g>
        );
      })}
      <text x={W / 2 - 15} y={12} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-ui)" fill="var(--error-text)">
        ■ the sold call
      </text>
      <text x={W / 2 - 15} y={24} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-ui)" fill="var(--truth-text)">
        ■ the index hedge
      </text>
    </svg>
  );
}

export function F3Raj() {
  const [n, setN] = useState(0);
  const g = useMemo(() => black76Greeks({ ...BASE, sigma: SIGMA }), []);
  const curve = useMemo<Pt[]>(() => {
    const pts: Pt[] = [];
    for (let F = X_RANGE[0]; F <= X_RANGE[1]; F += 20) pts.push([F, black76({ ...BASE, F, sigma: SIGMA })]);
    return pts;
  }, []);
  const ramp: Pt[] = [
    [X_RANGE[0], 0],
    [ROW.K, 0],
    [X_RANGE[1], X_RANGE[1] - ROW.K],
  ];
  const up = black76({ ...BASE, F: ROW.F + 100, sigma: SIGMA }) - g.price;
  const dn = black76({ ...BASE, F: ROW.F - 100, sigma: SIGMA }) - g.price;
  const hedge = g.delta * 100;
  const leftover = Math.max(Math.abs(hedge - up), Math.abs(-hedge - dn));
  const ticks = useMemo(() => simulate(), []);
  const now = ticks[n];
  const shown = ticks.slice(0, n + 1);
  const yMax = useMemo(() => Math.ceil((Math.max(1500, ...ticks.map((t) => Math.max(Math.abs(t.hedged), Math.abs(t.naked)))) * 1.3) / 1000), [ticks]); // ₹ thousand
  const k = (v: number) => v / 1000; // the book, in ₹ thousand, against where it started
  const bankLine = (t: Tick) => k(t.bank - PREMIUM); // what the premium alone has earned in the bank
  const done = n >= MAX_TICKS;

  return (
    <Figure
      n="3"
      prompt={
        <>
          <Who name="Raj" /> — the bookmaker from B5 — has sold one lot of the {n0(ROW.K)} call at {n2(ROW.call)}: {rs(PREMIUM)} in the bank, and a bet he did not want. Read the two
          drawn panels, then tick the clock.
        </>
      }
      controls={
        <>
          <button type="button" className="btn primary" disabled={done} onClick={() => setN(n + 1)}>
            {done ? "expiry tomorrow" : n === 0 ? "tick — one day passes" : `tick (${n} of ${MAX_TICKS})`}
          </button>
          {n > 0 && (
            <button type="button" className="btn" onClick={() => setN(0)}>
              start again
            </button>
          )}
        </>
      }
      observe={
        <>
          Raj never once said where the index was going; he only kept the slope. That is why the drift is not in the formula — and why there is a second derivation: a hedged book must
          earn interest, nothing more, and the sentence in panel 4 is that fact written down. Hull's naked seller: a call sold for $300,000 "could cost anything from zero to over
          $1,000,000" if left alone.
        </>
      }
    >
      <Comic cols={2}>
        <Panel
          n={1}
          caption={
            <Says who="Raj" mood="worried">
              I sold it at {n2(ROW.call)}. If the index runs, I pay the ramp. Today's curve has a slope of <strong>{f2(g.delta)}</strong> at {n0(ROW.F)} — so I will hold {f2(g.delta)} of the index per call,
              and no view.
            </Says>
          }
        >
          <Plot xDomain={X_RANGE} yDomain={[0, 720]} width={300} height={190} margin={{ top: 10, right: 12, bottom: 26, left: 36 }} xTicks={0} yTicks={0} grid={false} axisY={0} ariaLabel="The call's payoff ramp at expiry and its smooth curve today, with a slope triangle at the forward reading 0.51">
            <Curve pts={ramp} role="ghost" smooth={false} width={1.5} />
            <Curve pts={curve} role="truth" />
            <SlopeTriangle at={[ROW.F, g.price]} slope={g.delta} run={200} />
            <Marker at={[ROW.F, g.price]} role="truth" r={3.5} />
            <Label at={[X_RANGE[0], 0]} text={n0(X_RANGE[0])} dx={4} dy={-5} anchor="start" />
            <Label at={[X_RANGE[1], 0]} text={n0(X_RANGE[1])} dx={-4} dy={-5} anchor="end" />
            <Label at={[ROW.K, 0]} text={`strike ${n0(ROW.K)}`} dx={0} dy={-5} anchor="middle" />
            <Label at={[22700, 22700 - ROW.K]} text="payoff at expiry" dx={8} dy={6} anchor="start" />
            <Label at={[22850, black76({ ...BASE, F: 22850, sigma: SIGMA })]} text="today's curve" role="truth" dx={0} dy={22} anchor="middle" />
          </Plot>
        </Panel>
        <Panel
          n={2}
          caption={
            <>
              Index +100: the call costs Raj {n2(up)}, the hedge pays {n2(hedge)}. Index −100: the call hands back {n2(-dn)}, the hedge loses {n2(hedge)}. The two cancel to within{" "}
              <strong>₹{f2(leftover)}</strong> either way, on a ₹50 swing — the leftover is the bend in the curve, which the next tick will meet.
            </>
          }
        >
          <Bars
            pairs={[
              { label: "index +100", call: up, hedge },
              { label: "index −100", call: dn, hedge: -hedge },
            ]}
          />
        </Panel>
        <Panel n={3} wide caption={<>One day per tick: the index moves, the slope changes, Raj buys or sells a sliver to match it. The hedged book hugs the premium in the bank; the naked book does not.</>}>
          <div className="c3-live">
            <Plot
              xDomain={[0, MAX_TICKS]}
              yDomain={[-yMax, yMax]}
              width={560}
              height={210}
              margin={{ top: 12, right: 12, bottom: 30, left: 52 }}
              xLabel="days"
              xTicks={MAX_TICKS}
              yTicks={5}
              ariaLabel="Raj's book over the days, in rupees against the premium: the hedged book near flat, the naked book swinging, the bank line growing slowly"
            >
              <Curve pts={shown.map((t) => [t.t, k(t.naked)])} role="error" width={1.5} opacity={0.6} smooth={false} />
              <Curve pts={shown.map((t) => [t.t, bankLine(t)])} role="ghost" dash="4 3" smooth={false} />
              <Curve pts={shown.map((t) => [t.t, k(t.hedged)])} role="truth" width={2.4} smooth={false} />
              <Marker at={[now.t, k(now.hedged)]} role="truth" r={4} />
              {n > 0 && <Marker at={[now.t, k(now.naked)]} role="error" r={3.5} />}
              <Label at={[0, yMax]} text="Raj's book, ₹ thousand, against where it started" dx={4} dy={12} />
              {n > 0 && <Label at={[now.t, k(now.hedged)]} text={`hedged ${s2(now.hedged)}`} role="truth" dx={-6} dy={k(now.naked) > k(now.hedged) ? 18 : -12} anchor="end" />}
              {n > 0 && <Label at={[now.t, k(now.naked)]} text={`naked ${s2(now.naked)}`} role="error" dx={-6} dy={k(now.naked) > k(now.hedged) ? -12 : 18} anchor="end" />}
              {n >= 3 && <Label at={[0.3, bankLine(ticks[0])]} text={`the premium alone, in the bank: +${f2(now.bank - PREMIUM)} by now`} dx={0} dy={k(now.naked) > 0 ? 16 : -10} />}
            </Plot>
            <Readouts
              items={[
                ["index · days left", `${n0(now.F)} · ${now.days}`],
                [
                  "slope now",
                  <span key="d" className="c3-truth">
                    {f2(now.delta)}
                  </span>,
                ],
                [
                  n === 0 ? "Raj holds" : "this tick Raj " + (now.sliver >= 0 ? "buys" : "sells"),
                  `${n === 0 ? f2(now.sliver) : f2(Math.abs(now.sliver))} units (${f2(Math.abs(now.sliver) / LOT)} of a lot)`,
                ],
              ]}
            />
          </div>
        </Panel>
        <Panel n={4} wide caption={<Says who="Raj" mood="smug">I never once said where the index was going. That is why the drift is not in the formula.</Says>}>
          <div className="c3-board">
            <div className="c3-board-line">
              <span className="c3-ghost">time decay</span> + ½ · <span className="c3-approx">wobble²</span> · <span className="c3-truth">bend</span> + carry <span className="c3-eq">=</span> interest
            </div>
            <div className="c3-board-note">That sentence is the Black–Scholes equation. C4 names its glyphs.</div>
          </div>
        </Panel>
      </Comic>
    </Figure>
  );
}
