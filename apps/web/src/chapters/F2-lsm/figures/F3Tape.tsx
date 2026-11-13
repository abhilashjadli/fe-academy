import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { XTicks, YTicks } from "./parts";
import { AD, BUMP_EXPS, BUMP_WORDS, CHAIN, SEEDS, SEED_TEX, getBumps, getMc, getTape, n0, n2, n4, n5, neg, sci, sup, useLazy, useNarrow, type Seed, type TapeNode } from "./f2";

/**
 * Figure 3 — differentiate the program (real chain): Black-76 for the 22,600 call as six nodes, each carrying a value and a
 * derivative with respect to the seeded input (dual numbers, live adGreek — equals key.ad.tape, and its last node C4's closed-form
 * delta). Segmented seed F / σ / T / r; step node by node. Below: bump-and-revalue errors against the tape's delta on log-log
 * axes (live bumpDelta at the key's twelve bumps) with a dial on the bump; and the Monte Carlo delta three ways (live mcDelta
 * on the key's seeds). Two controls; three readouts.
 */

const GREEK: Record<Seed, string> = { F: "delta", sigma: "vega", T: "theta", r: "rho" };
const UNIT: Record<Seed, string> = { F: "per index point", sigma: "per 1.00 of vol", T: "per year", r: "per 1.00 of rate" };
const NODE_TEX = ["ln(F/K)", "d₁", "d₂", "N(d₁)", "N(d₂)", "price"];
const NODE_RULE = ["the log of the forward over the strike", "(ln(F/K) + ½σ²T) / σ√T", "d₁ − σ√T", "the normal's cumulative at d₁", "the normal's cumulative at d₂", "e⁻ʳᵀ (F·N(d₁) − K·N(d₂))"];
const BX: [number, number] = [0.5, 12.5];
const BY: [number, number] = [-12.3, 0.3];
const BEST = AD.bumps.reduce((b, r) => (Math.abs(r.err_central) < Math.abs(b.err_central) ? r : b), AD.bumps[0]);

/** a value or derivative on the tape: rupees to the paisa above 100, four significant digits otherwise, scientific when tiny */
function fv(v: number): string {
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 100) return neg(n2(v));
  if (a >= 1e-3) return neg(Number(v.toPrecision(4)).toString());
  return sci(v);
}
/** the last node's derivative: five decimals for a delta-sized number, the paisa above 100 */
const fd = (v: number) => (Math.abs(v) >= 100 ? neg(n2(v)) : neg(n5(v)));
const greekFmt = (seed: Seed, v: number) => (seed === "F" ? neg(n5(v)) : neg(n2(v)));

function Tape({ tape, upto, seed, narrow }: { tape: TapeNode[]; upto: number; seed: Seed; narrow: boolean }) {
  const horizontal = !narrow;
  const bw = horizontal ? 96 : 300;
  const bh = horizontal ? 74 : 54;
  const gap = horizontal ? 12 : 12;
  const W = horizontal ? tape.length * (bw + gap) - gap + 8 : bw + 8;
  const H = horizontal ? bh + 34 : tape.length * (bh + gap) - gap + 8;
  return (
    <svg className="f2-tape" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`the six nodes of Black-76 as a tape, each carrying its value and its derivative with respect to ${SEED_TEX[seed]}; ${upto + 1} of 6 revealed`}>
      {tape.map((nd, i) => {
        const x = horizontal ? 4 + i * (bw + gap) : 4;
        const y = horizontal ? 4 : 4 + i * (bh + gap);
        const on = i <= upto;
        const isLast = i === tape.length - 1;
        return (
          <g key={i} opacity={on ? 1 : 0.28}>
            {i > 0 && (horizontal ? <line x1={x - gap} x2={x - 1} y1={y + bh / 2} y2={y + bh / 2} stroke="var(--ink-3)" strokeWidth={1.2} /> : <line x1={x + bw / 2} x2={x + bw / 2} y1={y - gap} y2={y - 1} stroke="var(--ink-3)" strokeWidth={1.2} />)}
            <rect x={x} y={y} width={bw} height={bh} rx={4} fill={isLast && on ? "var(--truth-soft)" : "var(--surface-raised)"} stroke={i === upto ? "var(--ink)" : "var(--rule)"} strokeWidth={i === upto ? 1.8 : 1} />
            {horizontal ? (
              <>
                <text className="f2-node-name" x={x + bw / 2} y={y + 17} textAnchor="middle">
                  {NODE_TEX[i]}
                </text>
                <text className="f2-node-val" x={x + bw / 2} y={y + 38} textAnchor="middle">
                  {fv(nd.value)}
                </text>
                <text className="f2-node-d" x={x + bw / 2} y={y + 60} textAnchor="middle">
                  {on ? (isLast ? fd(nd.d) : fv(nd.d)) : "·"}
                </text>
              </>
            ) : (
              <>
                <text className="f2-node-name" x={x + 10} y={y + 22}>
                  {NODE_TEX[i]}
                </text>
                <text className="f2-node-val" x={x + 100} y={y + 22}>
                  {fv(nd.value)}
                </text>
                <text className="f2-node-d" x={x + 100} y={y + 42}>
                  d/d{SEED_TEX[seed]} {on ? (isLast ? fd(nd.d) : fv(nd.d)) : "·"}
                </text>
              </>
            )}
          </g>
        );
      })}
      {horizontal && (
        <>
          <text className="f2-tape-key" x={4} y={H - 6}>
            each node: name · value · derivative with respect to {SEED_TEX[seed]}
          </text>
        </>
      )}
    </svg>
  );
}

function BumpPlot({ rows, exp, delta, narrow }: { rows: ReturnType<typeof getBumps>; exp: number; delta: number; narrow: boolean }) {
  const lg = (e: number) => Math.log10(Math.max(Math.abs(e), 1e-16));
  const fwd: Pt[] = rows.map((r) => [r.exp, lg(r.errForward)]);
  const cen: Pt[] = rows.map((r) => [r.exp, lg(r.errCentral)]);
  const at = rows.find((r) => r.exp === exp)!;
  const best = rows.reduce((b, r) => (Math.abs(r.errCentral) < Math.abs(b.errCentral) ? r : b), rows[0]);
  return (
    <Plot xDomain={BX} yDomain={BY} width={narrow ? 400 : 440} height={narrow ? 250 : 280} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={BX[0]} axisY={BY[0]} ariaLabel={`bump-and-revalue error against the tape's delta ${n5(delta)} on log-log axes: forward and central bumps from a tenth of F down to a trillionth; the error falls, floors near a millionth, then climbs`}>
      <YTicks at={[-10, -8, -6, -4, -2]} fmt={(v) => `10${sup(v)}`} />
      <XTicks at={[2, 4, 6, 8, 10]} fmt={(v) => `10${sup(-v)}`} label="bump ÷ F" />
      <Curve pts={fwd} role="approx" width={1.8} smooth={false} />
      <Curve pts={cen} role="truth" width={2} smooth={false} />
      <Label at={[fwd[3][0], fwd[3][1]]} text="forward: (up − base) / h" role="approx" dx={8} dy={-6} />
      <Label at={[cen[6][0], cen[6][1]]} text="central: (up − down) / 2h" role="truth" dx={8} dy={14} />
      <Curve pts={[[exp, BY[0]], [exp, BY[1]]]} role="ghost" width={1} smooth={false} />
      <Marker at={[exp, lg(at.errForward)]} role="approx" r={5} />
      <Marker at={[exp, lg(at.errCentral)]} role="truth" r={5} />
      <Label at={[best.exp, lg(best.errCentral)]} text={`best: 10${sup(-best.exp)}, off by ${sci(Math.abs(best.errCentral))}`} role="truth" dx={0} dy={-12} anchor="middle" />
      <Label at={[BX[0], BY[1]]} text="|bump delta − tape delta|" role="ink" dx={4} dy={12} />
    </Plot>
  );
}

export function F3Tape() {
  const narrow = useNarrow();
  const [seed, setSeed] = useState<Seed>("F");
  const [exp, setExp] = useState(5);
  const t = getTape(seed);
  const delta = getTape("F").value;
  const bumps = getBumps();
  const at = bumps.find((r) => r.exp === exp)!;
  const mc = useLazy("mc", getMc);
  const g = AD.dual;

  const steps = t.tape.map((nd, i) => ({
    caption: (
      <>
        <b>{NODE_TEX[i]}</b> = {NODE_RULE[i]}: value {fv(nd.value)}. Alongside it rides a second number, its derivative with respect to {SEED_TEX[seed]}: {fv(nd.d)} {UNIT[seed]}.{" "}
        {i === 0 && seed === "F" && <>That is 1/F = 1/{n0(CHAIN.F)}: nudge the index by a point and the log moves by that much.</>}
        {i === 0 && seed !== "F" && <>The log does not involve {SEED_TEX[seed]}, so its derivative is zero — the tape carries the zero along.</>}
        {i === 1 && <>The chain rule, applied by the program as it runs: the derivative of a quotient from the derivatives of its parts.</>}
        {i === 2 && <>d₂ is d₁ less σ√T{seed === "F" ? ", and σ√T does not move with F, so the two derivatives agree" : ""}.</>}
        {(i === 3 || i === 4) && <>The normal's cumulative passes a derivative on by multiplying by its density at the node — the one rule that needs a new function.</>}
        {i === 5 && (
          <>
            The last node is the price, {n2(nd.value)}, and its derivative is <b>{GREEK[seed]}</b>: {greekFmt(seed, t.value)} {UNIT[seed]}
            {seed === "F" && <> — chapter C4's closed form, {neg(n5(AD.closed.delta))}, to the digit</>}
            {seed === "T" && <> (theta is minus the derivative with respect to time to expiry, {fv(nd.d)})</>}. One pass, no bumping.
          </>
        )}
      </>
    ),
  }));

  return (
    <Figure
      n="3"
      prompt={
        <>
          The real {n0(CHAIN.K)} call again, as the six numbers Black-76 computes on the way to {n2(AD.price)}. Carry alongside each a second number — its derivative — and the chain rule does the
          rest. Pick what to differentiate with respect to, then step along the tape; below, compare the old way.
        </>
      }
      controls={
        <>
          <Segmented<Seed> label="differentiate with respect to" options={SEEDS.map((s) => ({ id: s.id, label: s.label }))} value={seed} onChange={setSeed} />
          <Slider label="bump, as a fraction of F" value={exp} min={BUMP_EXPS[0]} max={BUMP_EXPS[BUMP_EXPS.length - 1]} step={1} onChange={setExp} fmt={(v) => `10${sup(-v)}`} />
          <Readouts
            items={[
              [`the tape: ${GREEK[seed]}`, `${greekFmt(seed, t.value)} ${UNIT[seed]}`],
              [`central bump at 10${sup(-exp)}`, `${neg(n5(at.central))}, off by ${sci(Math.abs(at.errCentral))}`],
              ["forward bump", `${neg(n5(at.forward))}, off by ${sci(Math.abs(at.errForward))}`],
            ]}
          />
        </>
      }
      observe={
        <>
          Dual numbers through Black-76 (key.ad): delta {neg(n5(g.delta))} against the closed form's {neg(n5(AD.closed.delta))}; vega {n2(g.vega)} per 1.00 of vol (closed {n2(AD.closed.vega)}); theta{" "}
          {neg(n2(g.theta))} a year; rho {neg(n2(g.rho))}. Bumping F by a tenth gives a forward delta of {n4(AD.bumps[0].forward)} and a central one of {n4(AD.bumps[0].central)}; the central error is {sci(Math.abs(AD.bumps[1].err_central))} at a hundredth,{" "}
          {sci(Math.abs(AD.bumps[3].err_central))} at a ten-thousandth, and smallest, {sci(Math.abs(BEST.err_central))}, at {BUMP_WORDS[Math.round(-Math.log10(BEST.rel))]} of F; below that round-off takes over, and at a trillionth the error is{" "}
          {sci(Math.abs(AD.bumps[AD.bumps.length - 1].err_central))} (key; the round-off branch differs in the last digits between machines, which is the point). On {n0(AD.mc.n)} seeded draws the Monte Carlo delta is{" "}
          {n4(AD.mc.pathwise.mean)} ± {n4(AD.mc.pathwise.se)} pathwise, {n4(AD.mc.bump_crn.mean)} ± {n4(AD.mc.bump_crn.se)} bumping with the same random numbers, and {n4(AD.mc.bump_indep.mean)} ±{" "}
          {n4(AD.mc.bump_indep.se)} bumping with fresh ones (key): {AD.mc.digital_note}. {AD.cost_note.charAt(0).toUpperCase() + AD.cost_note.slice(1)}.
        </>
      }
    >
      <div className="f2-tape-fig">
        <StepThrough
          steps={steps}
          render={(i) => (
            <div className="f2-tape-left">
              <div className="f2-panel f2-tape-panel">
                <div className="f2-panel-title">
                  <strong>the tape</strong>{" "}
                  <span>
                    F {n0(CHAIN.F)}, K {n0(CHAIN.K)}, σ {n2(CHAIN.sigma * 100)} %, {Math.round(CHAIN.T * 365)} days, r {n2(CHAIN.r * 100)} % · derivative with respect to {SEED_TEX[seed]}
                  </span>
                </div>
                <Tape tape={t.tape} upto={i} seed={seed} narrow={narrow} />
                <div className="f2-rule" role="status">
                  <strong>
                    node {i + 1} of {t.tape.length}: {NODE_TEX[i]}
                  </strong>
                  <span>
                    value {fv(t.tape[i].value)} · d/d{SEED_TEX[seed]} {i === t.tape.length - 1 ? fd(t.tape[i].d) : fv(t.tape[i].d)}
                    {i === t.tape.length - 1 ? ` — ${GREEK[seed]} ${greekFmt(seed, t.value)} ${UNIT[seed]}` : ""}
                    {i === t.tape.length - 1 && seed === "F" ? ` · closed form ${neg(n5(AD.closed.delta))}` : ""}
                  </span>
                </div>
              </div>
              <div className="f2-panel f2-tape-panel">
                <div className="f2-panel-title">
                  <strong>the old way: bump and reprice</strong> <span>error against the tape's delta {neg(n5(delta))}</span>
                </div>
                <BumpPlot rows={bumps} exp={exp} delta={delta} narrow={narrow} />
              </div>
            </div>
          )}
        />
        <div className="f2-tape-mc">
          <div className="f2-panel">
            <div className="f2-panel-title">
              <strong>on paths: the Monte Carlo delta</strong> <span>{n0(AD.mc.n)} seeded draws, three ways</span>
            </div>
            <table className="f2-table f2-mc" aria-label="Monte Carlo delta three ways with standard errors">
              <thead>
                <tr>
                  <th>method</th>
                  <th>delta</th>
                  <th>± SE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>differentiate the path (pathwise)</td>
                  <td>{mc ? n4(mc.pathwise.mean) : "…"}</td>
                  <td>{mc ? n4(mc.pathwise.se) : "…"}</td>
                </tr>
                <tr>
                  <td>bump, same random numbers</td>
                  <td>{mc ? n4(mc.bumpCrn.mean) : "…"}</td>
                  <td>{mc ? n4(mc.bumpCrn.se) : "…"}</td>
                </tr>
                <tr className="f2-bad-row">
                  <td>bump, fresh random numbers</td>
                  <td>{mc ? n4(mc.bumpIndep.mean) : "…"}</td>
                  <td>{mc ? n4(mc.bumpIndep.se) : "…"}</td>
                </tr>
                <tr className="f2-total">
                  <td colSpan={3}>
                    the tape says {neg(n5(delta))}; fresh numbers widen the error bar {mc ? (mc.bumpIndep.se / mc.bumpCrn.se).toFixed(1) : "…"}× and land {mc ? neg(n4(mc.bumpIndep.mean - delta)) : "…"} away
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Figure>
  );
}
