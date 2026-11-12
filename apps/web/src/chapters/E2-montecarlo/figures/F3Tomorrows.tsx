import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Readouts, Segmented, Toggle } from "../../../ui/controls";
import { CovEllipse, Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { normals } from "../../../engine/montecarlo";
import { ScatterPath, YTicks } from "./parts";
import { BELL_REL, BOOK, HEDGE, KEY_E1, MC, MC_N, MC_SEED, RHOS, count, e1Quad, f1, f2, getBootRel, getTomorrows, lakh, n0, pct1, rs, useLazy, useNarrow, type Rho } from "./e2";

/**
 * Figure 3 — Raj's book, five thousand tomorrows. Two risks: the index (sd 1.02 %/day, the record's own) and the call's implied
 * vol (a labelled stand-in: 6 %/day relative, until India VIX closes arrive), drawn together through a Cholesky shear (A2's
 * tilted cloud). The book repriced on 5,000 tomorrows (seed 7) and sorted; the 50th worst is the Monte Carlo 99 % VaR, beside
 * E1's exact bend-on-a-bell figure for the same book. Guess the error bar first; the bootstrap (seed 11) answers ≈ ±5 %.
 * Controls: correlation −0.6 / 0 / +0.6 and hedged / unhedged; the numbers equal key.mcvar.grid.
 */

type Pick = "1" | "5" | "15";
const OPTIONS: Array<{ id: Pick; label: string }> = [
  { id: "1", label: "± 1 %" },
  { id: "5", label: "± 5 %" },
  { id: "15", label: "± 15 %" },
];
const SHOW = 500;

/** the Cholesky picture: two independent bells, then the sheared pair at ρ */
function Shear({ rho }: { rho: number }) {
  const z = useMemo(() => normals(MC_SEED, 1200), []);
  const z1 = useMemo(() => Float64Array.from({ length: 600 }, (_, i) => z[2 * i]), [z]);
  const z2 = useMemo(() => Float64Array.from({ length: 600 }, (_, i) => z[2 * i + 1]), [z]);
  const v = useMemo(() => Float64Array.from(z1, (a, i) => rho * a + Math.sqrt(1 - rho * rho) * z2[i]), [z1, z2, rho]);
  const L = [
    [1, 0],
    [rho, Math.sqrt(1 - rho * rho)],
  ];
  const w = 200;
  return (
    <div className="e2-shear">
      <Plot xDomain={[-3.4, 3.4]} yDomain={[-3.4, 3.4]} width={w} height={w} margin={{ top: 6, right: 6, bottom: 6, left: 6 }} xTicks={0} yTicks={0} grid={false} axisX={0} axisY={0} ariaLabel="two independent standard normal draws as a round cloud">
        <ScatterPath xs={z1} ys={z2} n={600} role="ghost" r={1.5} opacity={0.6} />
        <CovEllipse L={[[1, 0], [0, 1]]} k={2} role="ink" dash="4 3" />
        <Label at={[-3.3, 3.3]} text="two independent bells" role="ink" dx={0} dy={10} />
        <Label at={[3.3, 0]} text="z₁" role="ink" dx={-2} dy={-4} anchor="end" />
        <Label at={[0, -3.3]} text="z₂" role="ink" dx={4} dy={0} />
      </Plot>
      <div className="e2-shear-arrow" aria-hidden>
        <span>×</span>
        <code>
          L = [1, 0; ρ, √(1−ρ²)]
        </code>
        <span>→</span>
      </div>
      <Plot xDomain={[-3.4, 3.4]} yDomain={[-3.4, 3.4]} width={w} height={w} margin={{ top: 6, right: 6, bottom: 6, left: 6 }} xTicks={0} yTicks={0} grid={false} axisX={0} axisY={0} ariaLabel={`the same draws sheared to correlation ${rho}: a tilted cloud of index move against vol move`}>
        <ScatterPath xs={z1} ys={v} n={600} role="truth" r={1.5} opacity={0.5} />
        <CovEllipse L={L} k={2} role="ink" dash="4 3" />
        <Label at={[-3.3, 3.3]} text={`sheared: ρ = ${rho > 0 ? "+" : rho < 0 ? "−" : ""}${Math.abs(rho)}`} role="ink" dx={0} dy={10} />
        <Label at={[3.3, 0]} text="index move" role="ink" dx={-2} dy={-4} anchor="end" />
        <Label at={[0, -3.3]} text="vol move" role="ink" dx={4} dy={0} />
      </Plot>
    </div>
  );
}

function RankTicks({ at, total }: { at: number[]; total: number }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <text key={v} className="label e2-ticklabel" x={x(v)} y={inner.top + inner.height - 4} textAnchor={v === at[0] ? "start" : "middle"}>
          {v === at[0] ? "worst" : `${count(v)}th`}
        </text>
      ))}
      <text className="label e2-ticklabel" x={inner.left + inner.width} y={inner.top + inner.height - 4} textAnchor="end">
        of {count(total)} tomorrows, sorted
      </text>
    </g>
  );
}

/** the sorted pile: all 5,000 as a thin strip, then the worst 500 enlarged with the 50th marked */
function Pile({ t, bell, narrow, placed, boot }: { t: ReturnType<typeof getTomorrows>; bell: number; narrow: boolean; placed: boolean; boot: number | null }) {
  const sorted = useMemo(() => Float64Array.from(t.pnl).sort((a, b) => a - b), [t]);
  const all: Pt[] = useMemo(() => {
    const out: Pt[] = [];
    for (let i = 0; i < sorted.length; i += 5) out.push([i + 1, sorted[i] / 1e5]);
    out.push([sorted.length, sorted[sorted.length - 1] / 1e5]);
    return out;
  }, [sorted]);
  const worst: Pt[] = useMemo(() => Array.from({ length: SHOW }, (_, i) => [i + 1, sorted[i] / 1e5] as Pt), [sorted]);
  const lo = sorted[0] / 1e5;
  const hi = sorted[sorted.length - 1] / 1e5;
  const k = t.k;
  const v = -t.var / 1e5;
  const wLo = lo * 1.14;
  const wHi = Math.max(0.4, sorted[SHOW - 1] / 1e5 + 0.5);
  const bandLo = boot !== null ? -t.var * (1 + boot) / 1e5 : null;
  const bandHi = boot !== null ? -t.var * (1 - boot) / 1e5 : null;
  return (
    <div className="e2-pile">
      <Plot xDomain={[0, MC_N]} yDomain={[lo * 1.1, hi * 2.4]} width={narrow ? 400 : 760} height={narrow ? 110 : 120} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={0} axisY={0} ariaLabel={`all ${count(MC_N)} tomorrows' P&L sorted from worst to best`}>
        <Curve pts={all} role="ink" width={1.5} smooth={false} />
        <Curve pts={[[0, v], [SHOW, v]]} role="error" width={1.2} smooth={false} />
        <Curve pts={[[SHOW, lo * 1.1], [SHOW, hi * 2.4]]} role="ghost" width={1} dash="3 3" smooth={false} />
        <Label at={[SHOW, hi * 2.4]} text={narrow ? `worst ${SHOW} ↓` : `the worst ${SHOW}, enlarged below`} role="ink" dx={6} dy={12} />
        <Label at={[MC_N, hi * 2.4]} text={narrow ? `all ${count(MC_N)}, sorted` : `all ${count(MC_N)} tomorrows, sorted; best ${lakh(hi * 1e5)}`} role="ink" dx={-10} dy={12} anchor="end" />
        <Label at={[0, lo * 1.1]} text={`worst ${lakh(-lo * 1e5)}`} role="ink" dx={4} dy={-4} />
      </Plot>
      <Plot xDomain={[0, SHOW]} yDomain={[wLo, wHi]} width={narrow ? 400 : 760} height={narrow ? 250 : 270} margin={{ top: 10, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={0} axisY={0} ariaLabel={`the worst ${SHOW} tomorrows: the ${k}th worst is the 99 % VaR, ${lakh(t.var)}`}>
        <RankTicks at={narrow ? [1, 100, 200, 300, 400] : [1, 50, 100, 200, 300, 400]} total={MC_N} />
        <YTicks at={niceTicks(wLo, wHi).filter((y) => Math.abs(y * 1e5 + t.var) > 1.6e5)} fmt={(y) => (y === 0 ? "0" : lakh(y * 1e5, 0).replace(".00", ""))} />
        {placed && bandLo !== null && bandHi !== null && <BandRect lo={bandLo} hi={bandHi} />}
        <Curve pts={[[0, -bell / 1e5], [SHOW, -bell / 1e5]]} role="approx" width={1.5} dash="5 3" smooth={false} />
        <Label at={[SHOW, -bell / 1e5]} text={narrow ? `E1's bell: ${lakh(bell)}` : `E1's exact bend-on-a-bell figure for this book: ${lakh(bell)}`} role="approx" dx={-4} dy={-6} anchor="end" />
        <Curve pts={worst} role="ink" width={2} smooth={false} />
        <Curve pts={[[k, v], [SHOW, v]]} role="error" width={1.2} dash="4 3" smooth={false} />
        <Marker at={[k, v]} role="error" r={5.5} />
        <Label at={[k + (narrow ? 40 : 30), v]} text={`the ${k}th worst: VaR ${lakh(t.var)}`} role="error" dx={0} dy={narrow ? 20 : 18} />
        {placed && boot !== null && <Label at={[k + (narrow ? 40 : 30), v]} text={`bootstrap band ± ${pct1(boot)} (shaded)`} role="error" dx={0} dy={narrow ? 34 : 32} />}
        <Label at={[SHOW, wHi]} text={`${k} tomorrows lie beyond the line — a thin place to stand`} role="ink" dx={-4} dy={14} anchor="end" />
      </Plot>
    </div>
  );
}
function BandRect({ lo, hi }: { lo: number; hi: number }) {
  const { x, y, inner } = usePlot();
  return <rect x={inner.left} width={x(SHOW) - inner.left} y={y(hi)} height={Math.max(1, y(lo) - y(hi))} fill="var(--error-soft)" />;
}
function niceTicks(lo: number, hi: number): number[] {
  const span = hi - lo;
  const step = span > 30 ? 10 : span > 12 ? 5 : span > 6 ? 2 : 1;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
  return out;
}

export function F3Tomorrows() {
  const narrow = useNarrow();
  const [pick, setPick] = useBet<Pick>("e2-f3");
  const [rho, setRho] = useState<Rho>(-0.6);
  const [hedged, setHedged] = useState(true);
  const h = hedged ? HEDGE : 0;
  const t = useLazy(`mcvar:${rho}:${h}`, () => getTomorrows(rho, h));
  const placed = !!pick;
  const boot = useLazy(placed ? `boot:${rho}:${h}` : "boot:none", () => (placed ? getBootRel(rho, h) : NaN));
  const bootRel = boot !== null && Number.isFinite(boot) ? boot : null;
  const bell = e1Quad(h);
  const verdict = pick === "5" ? "right" : pick === "1" ? "close" : "miss";
  const yours = OPTIONS.find((o) => o.id === pick)?.label ?? "";
  const grid = MC.grid;
  const hedgedRow = (r: number) => grid.find((g) => g.rho === r && g.h === HEDGE)!;
  const nakedRow = (r: number) => grid.find((g) => g.rho === r && g.h === 0)!;
  const spread = (Math.max(...RHOS.map((r) => hedgedRow(r).var99)) / Math.min(...RHOS.map((r) => hedgedRow(r).var99)) - 1) * 100;

  return (
    <Figure
      n="3"
      prompt={
        <>
          Raj's book from D1 — short {n0(BOOK.short)} of the {n0(BOOK.K)} call, long {n0(HEDGE)} futures — faces two risks tomorrow: the index moves, and so does the wobble the call is priced
          at. Draw {count(MC_N)} tomorrows for both at once, reprice, sort. Guess first: how wide is the error bar on the 50th worst of 5,000?
        </>
      }
      controls={
        <>
          <Segmented<string> label="index–vol correlation" options={RHOS.map((r) => ({ id: String(r), label: r > 0 ? `+${r}` : r === 0 ? "0" : `−${Math.abs(r)}` }))} value={String(rho)} onChange={(v) => setRho(parseFloat(v) as Rho)} />
          <Toggle label={hedged ? `hedged (${n0(HEDGE)} futures)` : "unhedged (0 futures)"} on={!hedged} onChange={(on) => setHedged(!on)} />
          <Readouts
            items={[
              ["VaR 99 %", t ? lakh(t.var) : "…"],
              ["±", !placed ? "guess first" : bootRel === null ? "…" : `${pct1(bootRel)} (${rs(Math.round((bootRel * (t?.var ?? 0)) / 1000) * 1000)})`],
              ["E1's bell figure", lakh(bell)],
            ]}
          />
        </>
      }
      observe={
        <>
          Monte Carlo VaR is "sample, reprice, sort": {count(MC_N)} draws of (index move, vol move) — index sd {f2(100 * MC.sig_day)} %/day (the record's own), vol move a <strong>stand-in</strong>{" "}
          of {Math.round(100 * MC.vol_rel_sd)} %/day relative until India VIX closes arrive — sheared to the correlation set, the book repriced one day older on each, the 50th worst read off (seed 7). At
          ρ −0.6 the hedged book reads {lakh(MC.corr.var99)} against E1's exact bell figure {lakh(KEY_E1.raj.quad_var99)} and its repriced-history {lakh(KEY_E1.raj.full_var99)} (keys). The
          bootstrap sd of that 50th worst is {rs(Math.round(MC.corr.boot_sd / 1000) * 1000)}, {pct1(MC.corr.boot_rel)} of it (key, seed 11); a plain bell's 1 % quantile from 5,000 draws would carry ±{f1(100 * BELL_REL)} %
          and the book's bent tail roughly doubles it. The lesson: an 11-day at-the-money book is a gamma book, its vega small, so the correlation moves the hedged VaR by under {Math.ceil(spread)} % (
          {lakh(hedgedRow(-0.6).var99)} / {lakh(hedgedRow(0).var99)} / {lakh(hedgedRow(0.6).var99)}); the unhedged short call feels the sign — {lakh(nakedRow(-0.6).var99)} / {lakh(nakedRow(0).var99)} /{" "}
          {lakh(nakedRow(0.6).var99)} — because vol falls when the index rises and a naked call is hurt by rises.
        </>
      }
    >
      <div className="e2-tomorrows">
        <Bet<Pick> question={<>From {count(MC_N)} drawn tomorrows, the 50th worst is the 99 % VaR. Roughly how wide is its error bar?</>} options={OPTIONS.map((o) => ({ id: o.id, label: o.label }))} pick={pick} onPick={setPick}>
          <ResultCard
            yours={yours}
            answer={
              <>
                about ± 5 % for the hedged book at ρ −0.6 (key: ± {pct1(MC.corr.boot_rel)}, seed 11); this setting, live: {bootRel === null ? "…" : `± ${pct1(bootRel)}`}
                {t && bootRel !== null ? ` (${rs(Math.round((bootRel * t.var) / 1000) * 1000)} on ${lakh(t.var)})` : ""}
              </>
            }
            verdict={verdict}
          >
            Fifty tomorrows lie past the line, however big five thousand looks; a quantile's error bar is set by how many draws land near it. A plain bell would carry ± {f1(100 * BELL_REL)} % here (√(p(1−p)/n)
            divided by the bell's height at the line); the book's bent tail is thinner than a bell's, so the bar roughly doubles. Resample the 5,000 tomorrows 400 times, re-read the 50th worst each
            time, and the spread of those readings is the bar. The unhedged call's bar sits nearer the bell's: its tail is less bent.
          </ResultCard>
        </Bet>
        <div className="e2-tomorrows-two">
          <div className="e2-law-panel">
            <div className="e2-panel-title">
              <strong>two risks, drawn together</strong> <span>A2's shear: independent draws × the Cholesky factor</span>
            </div>
            <div className="e2-shear-row">
              <Shear rho={rho} />
              <p className="e2-still-cap">
                600 of the {count(MC_N)} draws. Index: sd {f2(100 * MC.sig_day)} %/day (the record's own). Vol: a <strong>stand-in</strong>, {Math.round(100 * MC.vol_rel_sd)} %/day relative, until India VIX closes
                arrive. Tomorrow's index = {n0(BOOK.F)} × e<sup>{(MC.sig_day).toFixed(4)} z₁</sup>; tomorrow's vol = {(100 * BOOK.sigma).toFixed(1)} % × (1 + {MC.vol_rel_sd} × sheared z₂). The book is repriced
                one day older on each pair.
              </p>
            </div>
          </div>
          <div className="e2-law-panel">
            <div className="e2-panel-title">
              <strong>reprice, sort</strong> <span>the book's P&L on each tomorrow, worst first</span>
            </div>
            {t ? <Pile t={t} bell={bell} narrow={narrow} placed={placed} boot={bootRel} /> : <div className="e2-wait">repricing {count(MC_N)} tomorrows…</div>}
          </div>
        </div>
      </div>
    </Figure>
  );
}
