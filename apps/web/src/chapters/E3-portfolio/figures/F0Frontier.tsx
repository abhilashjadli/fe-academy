import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Readouts, Slider } from "../../../ui/controls";
import { Bars, Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { minVarWeight2, twoAsset } from "../../../engine/portfolio";
import { AT_A_RISK, FIVE, GLOBAL_MIN, KEY, MU, NAMES, RF, RHO, SD, TANGENCY, TWO, envelopeAt, f2, getEnvelope, getFrontierCurve, pct1, rho2, useLazy, useNarrow, wpct } from "./e3";

/**
 * Figure 0 — mix two, then five. Phase 1: Wilmott's pair from Figure 18.2 (A 15 %/20 %, E 20 %/35 %) in the risk–reward plane; dial
 * the weight of A (the dot runs along the hyperbola, the efficient half bold, past 100 % you have sold E) and ρ (straight at +1,
 * touching zero risk at −1). Then the bet: add the other three TEXTBOOK assets of Figure 18.1 (our correlations) — can a mix beat
 * A's 15 % at A's 20 % risk? Reveal from bestMeanAtRisk: 16.6 % holding 16 % D (key.five.at_A_risk), 16.4 % with 12 % D and no
 * short sales (key.five.noshort). After the bet the ρ dial is retired (the table fixes ρ_AE at 0.60) so the figure never shows more
 * than two controls; the weight dial keeps running the A–E mix inside the five-asset frontier. Readouts: return, risk, slope.
 */

type Pick = "no" | "little" | "lot";
const OPTIONS: Array<{ id: Pick; label: string }> = [
  { id: "no", label: "no — A dominates them all" },
  { id: "little", label: "yes, by a little" },
  { id: "lot", label: "yes, by a lot" },
];
const X1: [number, number] = [0, 65];
const X2: [number, number] = [0, 45];
const Y: [number, number] = [4, 26];
const W_RANGE: [number, number] = [-0.5, 1.5];

const asPt = (p: { sd: number; mu: number }): Pt => [100 * p.sd, 100 * p.mu];

function Hyperbola({ a, e, rho, bold }: { a: { mu: number; sd: number }; e: { mu: number; sd: number }; rho: number; bold: boolean }) {
  const wMv = Math.min(W_RANGE[1], Math.max(W_RANGE[0], minVarWeight2(a, e, rho)));
  const seg = (lo: number, hi: number): Pt[] => {
    const out: Pt[] = [];
    const n = Math.max(2, Math.round((hi - lo) / 0.01));
    for (let i = 0; i <= n; i++) out.push(asPt(twoAsset(lo + ((hi - lo) * i) / n, a, e, rho)));
    return out;
  };
  const efficient = seg(W_RANGE[0], wMv);
  const rest = seg(wMv, W_RANGE[1]);
  return (
    <g>
      <Curve pts={rest} role="ink" width={1.2} opacity={0.55} smooth={false} />
      <Curve pts={efficient} role="truth" width={bold ? 3 : 1.6} opacity={bold ? 1 : 0.7} smooth={false} />
    </g>
  );
}

function GuideV({ x0, y0, y1 }: { x0: number; y0: number; y1: number }) {
  const { x, y } = usePlot();
  return <line x1={x(x0)} x2={x(x0)} y1={y(y0)} y2={y(y1)} stroke="var(--error)" strokeWidth={1} strokeDasharray="3 3" />;
}

/** five small bars: the marked portfolio's weights, with and without short sales */
function WeightsStrip({ w, wNo }: { w: number[]; wNo: number[] | null }) {
  const narrow = useNarrow();
  const yLo = -0.45;
  const yHi = 0.75;
  return (
    <Plot xDomain={[-0.6, NAMES.length - 0.4]} yDomain={[yLo, yHi]} width={narrow ? 400 : 440} height={narrow ? 150 : 160} margin={{ top: 18, right: 8, bottom: 8, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={-0.6} axisY={0} ariaLabel={`weights of the portfolio that pays ${pct1(AT_A_RISK.m)} at ${pct1(SD[0])} risk: ${NAMES.map((n, i) => `${n} ${wpct(w[i])}`).join(", ")}`}>
      <Bars bars={w.map((v, i) => ({ x: i - (wNo ? 0.18 : 0), y: v, w: wNo ? 0.32 : 0.5 }))} role="truth" opacity={0.85} />
      {wNo && <Bars bars={wNo.map((v, i) => ({ x: i + 0.18, y: v, w: 0.32 }))} role="approx" opacity={0.85} />}
      {w.map((v, i) => (
        <Label key={"w" + i} at={[i - (wNo ? 0.18 : 0), v < 0 ? v : v]} text={wpct(v)} role="truth" dx={0} dy={v < 0 ? 14 : -5} anchor="middle" />
      ))}
      {wNo && wNo.map((v, i) => <Label key={"n" + i} at={[i + 0.18, Math.max(v, 0)]} text={wpct(v)} role="approx" dx={0} dy={-5} anchor="middle" />)}
      <StripNames />
    </Plot>
  );
}
function StripNames() {
  const { x, y } = usePlot();
  return (
    <g>
      {NAMES.map((n, i) => (
        <text key={n} className="label" x={x(i)} y={y(-0.36)} textAnchor="middle" style={{ fontWeight: 600 }}>
          {n}
        </text>
      ))}
    </g>
  );
}

export function F0Frontier() {
  const narrow = useNarrow();
  const [pick, setPick] = useBet<Pick>("e3-f0");
  const placed = !!pick;
  const [w, setW] = useState(0.6);
  const [rhoDial, setRhoDial] = useState(0.2);
  // phase 1: Wilmott's Figure 18.2 pair; phase 2: the table's A and E at the table's ρ
  const a = placed ? { mu: MU[0], sd: SD[0] } : TWO.A;
  const e = placed ? { mu: MU[4], sd: SD[4] } : TWO.E;
  const rho = placed ? RHO[0][4] : rhoDial;
  const p = twoAsset(w, a, e, rho);
  const slope = p.sd > 1e-9 ? (p.mu - RF) / p.sd : NaN;
  const frontier = useMemo(() => (placed ? getFrontierCurve() : null), [placed]);
  const env = useLazy(placed ? "envelope" : "envelope:none", () => (placed ? getEnvelope() : null));
  const envAt = env ? envelopeAt(env, SD[0]) : null;
  const upper: Pt[] = frontier ? frontier.filter((q) => q.m >= GLOBAL_MIN.mu).map((q) => [100 * q.sd, 100 * q.m]) : [];
  const lower: Pt[] = frontier ? frontier.filter((q) => q.m <= GLOBAL_MIN.mu).map((q) => [100 * q.sd, 100 * q.m]) : [];
  const envPts: Pt[] = env ? env.map((q) => [100 * q.sd, 100 * q.m]) : [];
  const X = placed ? X2 : X1;
  const tanEnd: Pt = [X[1], 100 * (RF + TANGENCY.sharpe * (X[1] / 100))];
  // where the tangent line leaves the frame at the top, for its label
  const tanTop: Pt = [(22 - 100 * RF) / TANGENCY.sharpe, 22];
  const upperTarget = narrow ? 18.5 : 19.5;
  const upperLabelAt: Pt = upper.length ? upper.reduce((best, q) => (Math.abs(q[1] - upperTarget) < Math.abs(best[1] - upperTarget) ? q : best), upper[0]) : [0, 0];
  const envLabelAt: Pt = envPts.length ? envPts.reduce((best, q) => (Math.abs(q[1] - 14) < Math.abs(best[1] - 14) ? q : best), envPts[0]) : [0, 0];
  const verdict = pick === "little" ? "right" : pick === "lot" ? "close" : "miss";
  const yours = OPTIONS.find((o) => o.id === pick)?.label ?? "";
  const soldNote = w > 1 ? "you have sold E to buy more A" : w < 0 ? "you have sold A to buy more E" : null;

  return (
    <Figure
      n="0"
      prompt={
        <>
          Two assets from a textbook (Wilmott's Figure 18.2): A pays 15 % a year and wobbles 20 %; E pays 20 % and wobbles 35 %. Mix them. Dial how much of A you hold — then dial how much the
          two move together — and watch where the mix lands. Then make your bet.
        </>
      }
      controls={
        <>
          <Slider label="weight of A" value={w} min={W_RANGE[0]} max={W_RANGE[1]} step={0.01} onChange={setW} role="approx" fmt={wpct} width={narrow ? 150 : 200} />
          {!placed ? (
            <Slider label="ρ, how A and E move together" value={rhoDial} min={-1} max={1} step={0.01} onChange={setRhoDial} role="truth" fmt={rho2} width={narrow ? 150 : 200} />
          ) : (
            <span className="e3-quiet">ρ fixed at the table's {rho2(RHO[0][4])} after the bet; A and E now at the table's values</span>
          )}
          <Readouts items={[["return", pct1(p.mu)], ["risk", pct1(p.sd)], ["slope (μ − r_f)/σ", Number.isFinite(slope) ? f2(slope) : "—"]]} />
        </>
      }
      observe={
        <>
          A mix of two assets is a <strong>bowed curve</strong>, not a straight line: the straight line is what you get at ρ = +1 only, and at ρ = −1 the bow touches zero risk with {Math.round(100 * TWO.zero_risk_weight_rho_minus1)} % in A (key). The bold half is
          the efficient half — nobody wants the lower half, which pays less for the same wobble. With five assets the bows nest into one outer curve, the <strong>frontier</strong>. At A's own{" "}
          {pct1(SD[0])} risk it pays <strong>{pct1(FIVE.at_A_risk.m)}</strong>, not A's {pct1(MU[0])}, and the mix holds {wpct(FIVE.at_A_risk.w[3])} of D — the asset you ruled out, because its correlations are the table's
          lowest ({rho2(RHO[3][2])} with C, {rho2(RHO[3][0])} with A). Forbid short sales and the envelope is only a little inside: {pct1(FIVE.noshort.at_A_risk.m)} with {wpct(FIVE.noshort.at_A_risk.w[3])} of D (key, 2 % grid). The
          dashed line from the riskless {pct1(RF)} just touches the frontier at the <strong>tangency portfolio</strong> ({pct1(FIVE.tangency.mu)} at {pct1(FIVE.tangency.sd)}, slope {f2(FIVE.tangency.sharpe)}); with lending and
          borrowing, every best mix lies on that line. <strong>Textbook:</strong> the five assets' returns and risks are read from Wilmott's Figure 18.1; the correlations are ours. The check: Wilmott's own
          spreadsheet point (Figure 18.4, four other assets, 30 % target) is reproduced to six figures — weights {KEY.wilmott184.w.map((v) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(6)).join(", ")} against his{" "}
          {KEY.wilmott184.book_w.map((v) => (v < 0 ? "−" : "") + String(Math.abs(v))).join(", ")}, risk {pct1(KEY.wilmott184.sd_p)} (key).
        </>
      }
    >
      <div className="e3-frontier">
        <Plot xDomain={X} yDomain={Y} width={narrow ? 400 : 760} height={narrow ? 340 : 420} margin={{ top: 14, right: 14, bottom: 34, left: 40 }} xLabel="risk, % a year" yLabel="return, % a year" xTicks={7} yTicks={5} axisX={0} axisY={Y[0]} ariaLabel={placed ? `five textbook assets, the frontier through them, the no-short envelope inside it, the tangent line from ${pct1(RF)}, and the mix paying ${pct1(AT_A_RISK.m)} at ${pct1(SD[0])} risk` : `the mix of A and E at weight ${wpct(w)} in A and correlation ${rho2(rho)}: return ${pct1(p.mu)} at risk ${pct1(p.sd)}`}>
          {/* the riskless rate and the slope line to the dial's dot */}
          <Curve pts={[[0, 100 * RF], asPt(p)]} role="ghost" width={1} dash="2 3" smooth={false} />
          <Marker at={[0, 100 * RF]} role="ink" r={4} />
          <Label at={[0, 100 * RF]} text={`riskless ${pct1(RF)}`} role="ink" dx={8} dy={4} />
          {placed && frontier && (
            <g>
              <Curve pts={[[0, 100 * RF], tanEnd]} role="ghost" width={1.4} dash="5 4" smooth={false} />
              <Curve pts={lower} role="ink" width={1.2} opacity={0.5} smooth={false} />
              <Curve pts={upper} role="truth" width={3} smooth={false} />
              {env && <Curve pts={envPts} role="approx" width={2} smooth={false} />}
              <Marker at={asPt(TANGENCY)} role="ink" r={4.5} />
              <Label at={asPt(TANGENCY)} text={narrow ? "tangency" : `tangency: ${pct1(TANGENCY.mu)} at ${pct1(TANGENCY.sd)}`} role="ink" dx={8} dy={-8} />
              <Label at={tanTop} text={narrow ? "lend / borrow at 5 %" : "the tangent line: lend or borrow at 5 %"} role="ink" dx={-8} dy={-4} anchor="end" />
              <Label at={upperLabelAt} text={narrow ? "frontier" : "frontier, shorts allowed"} role="truth" dx={12} dy={8} />
              {env ? <Label at={envLabelAt} text="no short sales" role="approx" dx={-8} dy={4} anchor="end" /> : <Label at={[X[1] / 2, 7]} text="drawing the no-short envelope (every 2 % mix of five)…" role="ink" dx={0} dy={0} anchor="middle" />}
              <GuideV x0={100 * SD[0]} y0={100 * MU[0]} y1={100 * AT_A_RISK.m} />
              <Marker at={[100 * SD[0], 100 * AT_A_RISK.m]} role="error" r={6} />
              <Label at={[100 * SD[0], 100 * AT_A_RISK.m]} text={`${pct1(AT_A_RISK.m)} at A's ${pct1(SD[0])} risk`} role="error" dx={-10} dy={-10} anchor="end" />
            </g>
          )}
          <Hyperbola a={a} e={e} rho={rho} bold={!placed} />
          {/* the assets */}
          {(placed ? NAMES : ["A", "E"]).map((n, i) => {
            const idx = placed ? i : n === "A" ? 0 : 4;
            const pt: Pt = placed ? [100 * SD[idx], 100 * MU[idx]] : n === "A" ? asPt(TWO.A) : asPt(TWO.E);
            return (
              <g key={n}>
                <Marker at={pt} role="ink" r={5} />
                <Label at={pt} text={placed ? n : `${n}: ${pct1(n === "A" ? a.mu : e.mu)} at ${pct1(n === "A" ? a.sd : e.sd)}`} role="ink" dx={placed && n === "A" ? -9 : 9} dy={placed && n === "A" ? 14 : 4} anchor={placed && n === "A" ? "end" : "start"} />
              </g>
            );
          })}
          {/* the dial's dot */}
          <Marker at={asPt(p)} role="approx" r={6.5} />
          <Label at={asPt(p)} text={`${wpct(w)} A: ${pct1(p.mu)} at ${pct1(p.sd)}`} role="approx" dx={100 * p.sd > 0.62 * X[1] ? -10 : 10} dy={placed ? 16 : 4} anchor={100 * p.sd > 0.62 * X[1] ? "end" : "start"} />
          {soldNote && <Label at={[X[1], Y[1]]} text={soldNote} role="approx" dx={-4} dy={14} anchor="end" />}
          {!placed && rho <= -0.999 && <Label at={[0, 100 * twoAsset(TWO.zero_risk_weight_rho_minus1, a, e, -1).mu]} text={`zero risk at ${Math.round(100 * TWO.zero_risk_weight_rho_minus1)} % A`} role="truth" dx={8} dy={-12} />}
        </Plot>
        <Bet<Pick>
          question={
            <>
              Now add the other three assets of the textbook table — B (15 % at 30 %), C (10 % at 25 %) and D (10 % at 30 %), each worse than A on its own. Can <em>any</em> mix of the five beat A's 15 %
              at A's 20 % risk?
            </>
          }
          options={OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
          pick={pick}
          onPick={setPick}
        >
          <ResultCard
            yours={yours}
            answer={
              <>
                yes, by a little: <strong>{pct1(AT_A_RISK.m)}</strong> at {pct1(SD[0])} risk, holding {wpct(AT_A_RISK.w[3])} of the ruled-out D (key {(100 * FIVE.at_A_risk.m).toFixed(3)} %); with no short sales{" "}
                {envAt ? `${pct1(envAt.m)} with ${wpct(envAt.w[3])} of D` : `${pct1(FIVE.noshort.at_A_risk.m)} with ${wpct(FIVE.noshort.at_A_risk.w[3])} of D (key)`}
              </>
            }
            verdict={verdict}
          >
            An asset's worth in a mix is not its own return and risk but how it moves against the rest. D pays A's return minus five points at half again the wobble — and almost none of its wobble is shared
            ({rho2(RHO[3][0])} with A, {rho2(RHO[3][2])} with C), so a slice of it cancels wobble the others share. The frontier passes above every single asset; the point on it you choose is yours.
          </ResultCard>
        </Bet>
        {placed && (
          <div className="e3-weights">
            <div className="e3-panel-title">
              <strong>the mix that pays {pct1(AT_A_RISK.m)} at A's {pct1(SD[0])} risk</strong>
              <span>
                blue: short sales allowed (C sold short){env ? "; amber: no short sales, " + pct1(envAt!.m) + " at " + pct1(envAt!.sd) : ""}
              </span>
            </div>
            <WeightsStrip w={AT_A_RISK.w} wNo={envAt ? envAt.w : null} />
          </div>
        )}
      </div>
    </Figure>
  );
}
