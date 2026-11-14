import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { XTicks, YTicks } from "./parts";
import { FIG1_ROWS, K_MAX, N_DAYS, SEEDS, SPREAD_K1, getSorted, n0, n2, useNarrow } from "./g2";

/**
 * Figure 1 — how many piles? (real record, per-cent units): two curves against k = 1 … 7. Left, the within-pile spread as a
 * share of the k = 1 spread (the elbow); right, the mean silhouette (b − a)/max(a, b). Both curves are the key's (key.fig1.rows;
 * the silhouette is O(n²) and tested in the engine); the dialled (k, seed) runs k-means live and is asserted against the key's
 * spread and rounds. Segmented starting centres (seeds 1 / 2 / 3): the same spread by a different number of rounds. Two
 * controls; three readouts.
 */

type SeedPick = "1" | "2" | "3";
const KX: [number, number] = [0.4, K_MAX + 1.5];
const SY: [number, number] = [-8, 124];
const HY: [number, number] = [-0.08, 1.24];
const KT = Array.from({ length: K_MAX }, (_, i) => i + 1);

function spreadPct(k: number, seed: number): number {
  const row = FIG1_ROWS[k - 1].per_seed.find((s) => s.seed === seed) ?? FIG1_ROWS[k - 1].per_seed[0];
  return (100 * row.spread) / SPREAD_K1;
}
function sil(k: number): number | null {
  return FIG1_ROWS[k - 1].best_silhouette;
}

function SpreadCurve({ k, seed, narrow }: { k: number; seed: number; narrow: boolean }) {
  const pts: Pt[] = KT.map((kk) => [kk, spreadPct(kk, seed)]);
  const live = k === 1 ? SPREAD_K1 : getSorted("raw", k, seed).res.spread;
  const livePct = (100 * live) / SPREAD_K1;
  return (
    <Plot xDomain={KX} yDomain={SY} width={narrow ? 400 : 360} height={narrow ? 260 : 300} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={KX[0]} axisY={0} ariaLabel={`the within-pile spread against the number of piles k from 1 to ${K_MAX}, as a percentage of the spread with one pile; at k = ${k} it is ${n0(livePct)} percent`}>
      <YTicks at={[25, 50, 75, 100]} fmt={(v) => `${v} %`} />
      <XTicks at={KT} fmt={String} label="piles k" />
      <Label at={[KX[0], SY[1]]} text={narrow ? "spread, % of one pile's" : "within-pile spread, as % of the spread with one pile"} role="ink" dx={4} dy={14} />
      <Curve pts={pts} role="truth" width={2.2} smooth={false} />
      {KT.map((kk) => (
        <Marker key={kk} at={[kk, spreadPct(kk, seed)]} role="truth" r={3} />
      ))}
      <Curve pts={[[k, SY[0]], [k, SY[1]]]} role="ghost" width={1} smooth={false} />
      <Marker at={[k, livePct]} role="approx" r={6} />
      <Label at={[k, livePct]} text={`${n0(live)} · ${n0(livePct)} %`} role="approx" dx={k >= 5 ? -10 : 10} dy={k === 1 ? 18 : -9} anchor={k >= 5 ? "end" : "start"} />
    </Plot>
  );
}

function SilCurve({ k, narrow }: { k: number; narrow: boolean }) {
  const pts: Pt[] = KT.filter((kk) => sil(kk) !== null).map((kk) => [kk, sil(kk)!]);
  const v = sil(k);
  const best = KT.filter((kk) => sil(kk) !== null).reduce((a, b) => (sil(b)! > sil(a)! ? b : a));
  return (
    <Plot xDomain={KX} yDomain={HY} width={narrow ? 400 : 360} height={narrow ? 260 : 300} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={KX[0]} axisY={0} ariaLabel={`the mean silhouette against k from 2 to ${K_MAX}; highest at k = ${best}, ${n2(sil(best)!)}${v !== null ? `; at k = ${k} it is ${n2(v)}` : ""}`}>
      <YTicks at={[0.25, 0.5, 0.75, 1]} fmt={(t) => n2(t)} />
      <XTicks at={KT} fmt={String} label="piles k" />
      <Label at={[KX[0], HY[1]]} text={narrow ? "silhouette: own pile vs the nearest other" : "silhouette: own pile against the nearest other"} role="ink" dx={4} dy={14} />
      <Label at={[KX[1], 1]} text="1 would mean every day far nearer its own pile" role="ghost" dx={-6} dy={14} anchor="end" />
      <Curve pts={pts} role="truth" width={2.2} smooth={false} />
      {pts.map((p) => (
        <Marker key={p[0]} at={p} role="truth" r={3} />
      ))}
      <Curve pts={[[k, HY[0]], [k, HY[1]]]} role="ghost" width={1} smooth={false} />
      {v !== null ? (
        <>
          <Marker at={[k, v]} role="approx" r={6} />
          <Label at={[k, v]} text={n2(v)} role="approx" dx={k >= 6 ? -10 : 10} dy={-9} anchor={k >= 6 ? "end" : "start"} />
        </>
      ) : (
        <Label at={[1, 0.5]} text="one pile: no other pile to compare with" role="ink" dx={8} dy={0} />
      )}
    </Plot>
  );
}

export function F1HowMany() {
  const narrow = useNarrow();
  const [k, setK] = useState(2);
  const [seedPick, setSeedPick] = useState<SeedPick>("1");
  const seed = Number(seedPick);
  const live = k === 1 ? null : getSorted("raw", k, seed);
  const spread = live ? live.res.spread : SPREAD_K1;
  const rounds = live ? live.res.rounds : 1;
  const s = sil(k);
  const row2 = FIG1_ROWS[1];
  const row3 = FIG1_ROWS[2];
  const rowLast = FIG1_ROWS[K_MAX - 1];
  const bestSil = KT.filter((kk) => sil(kk) !== null).reduce((a, b) => (sil(b)! > sil(a)! ? b : a));
  const k4 = FIG1_ROWS[3];

  return (
    <Figure
      n="1"
      prompt={
        <>
          How many piles? Nothing can be held out to score the answer, so two heuristics stand in: the spread, which always falls as k grows (look for the elbow), and the silhouette, which asks
          each day whether it is nearer its own pile than the next one. Dial k; change where the centres start.
        </>
      }
      controls={
        <>
          <Slider label="piles k" value={k} min={1} max={K_MAX} step={1} onChange={setK} role="approx" fmt={String} />
          <Segmented label="starting centres" options={SEEDS.map((sd) => ({ id: String(sd) as SeedPick, label: `seed ${sd}` }))} value={seedPick} onChange={setSeedPick} />
          <Readouts
            items={[
              ["within-pile spread", <span>{n0(spread)} <span className="g2-dim">· {n0((100 * spread) / SPREAD_K1)} % of one pile's</span></span>],
              ["silhouette", s === null ? <span className="g2-dim">needs two piles</span> : n2(s)],
              ["rounds to settle", String(rounds)],
            ]}
          />
        </>
      }
      observe={
        <>
          Per-cent units throughout (Figure 0's first view). With one pile the spread is the total squared distance about the mean, {n0(SPREAD_K1)}; it falls to {n0(row2.best_spread)} at two piles,{" "}
          {n0(row3.best_spread)} at three, {n0(rowLast.best_spread)} at {K_MAX} (key; the dialled point is the engine's, equal to the key). The drop from two to three is the last big one; the elbow is
          somewhere between three and five, and a different reader will put it in a different place — that is the point. The silhouette of a day is (b − a)/max(a, b): a its mean distance to its own
          pile, b its smallest mean distance to another; averaged over the {n0(N_DAYS)} days it is {n2(row2.best_silhouette!)} at two piles, {n2(row3.best_silhouette!)} at three, {n2(rowLast.best_silhouette!)} at{" "}
          {K_MAX} (key), highest at {bestSil}. The three seeds reach the same spread at every k — at k = 4 in {k4.per_seed.map((p) => p.rounds).join(" / ")} rounds — so the start did not matter on this cloud.
          On another it can: k-means finds a local minimum, and one runs it from several starts for that reason.
        </>
      }
    >
      <div className="g2-howmany">
        <div className="g2-two">
          <div className="g2-panel">
            <div className="g2-panel-title">
              <strong>the elbow</strong> <span>within-pile spread against k · seed {seed} · amber: the dial</span>
            </div>
            <SpreadCurve k={k} seed={seed} narrow={narrow} />
          </div>
          <div className="g2-panel">
            <div className="g2-panel-title">
              <strong>the silhouette</strong> <span>0 to 1 · the same for every seed</span>
            </div>
            <SilCurve k={k} narrow={narrow} />
          </div>
        </div>
        <div className="g2-rule" role="status">
          <strong>
            {k} {k === 1 ? "pile" : "piles"}, seed {seed}
          </strong>
          <span>
            spread {n0(spread)} ({n0((100 * spread) / SPREAD_K1)} % of one pile's) · silhouette {s === null ? "—" : n2(s)} · settled in {rounds} {rounds === 1 ? "round" : "rounds"}
            {live && SEEDS.every((sd) => Math.round(FIG1_ROWS[k - 1].per_seed.find((p) => p.seed === sd)!.spread) === Math.round(spread)) ? " · all three seeds: the same spread" : ""}
          </span>
        </div>
      </div>
    </Figure>
  );
}
