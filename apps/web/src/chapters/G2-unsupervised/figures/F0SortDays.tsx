import "./figures.css";
import { useMemo, useState } from "react";
import { ticks } from "d3-array";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { StepThrough } from "../../../ui/StepThrough";
import { Readouts, Segmented, Toggle } from "../../../ui/controls";
import { Curve, Label, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { Cross, XTicks, YTicks } from "./parts";
import { DAYS, FIRST_DAY, LAST_DAY, N_DAYS, SEED, W, assignAt, dmy, extent, getSorted, n0, n1, points, s2pct, span, useNarrow, type Sorted, type Units } from "./g2";

/**
 * Figure 0 — sort the days (real record): the 2,663 days as dots, x = today's move (%), y = the previous twenty days' realised vol
 * (% a year). Bet first: ask for two piles — how many days land in the smaller one? Then step through Lloyd's algorithm live
 * (engine kmeans, seed 1; equals key.fig0[units][k]): the k starting centres, the first assignment, the first move, round 5, the
 * settled piles. Segmented piles 2 / 3 / 4; toggle "same units on both axes" (standardise). Two controls plus the step buttons;
 * three readouts (round, pile sizes, within-pile spread). Piles are coloured in size order: largest blue, then amber, grey, smallest red.
 */

type KPick = "2" | "3" | "4";
type Guess = "1300" | "300" | "40";
const GUESSES: Array<{ id: Guess; label: string; value: number }> = [
  { id: "1300", label: "about 1,300 — half of them", value: 1300 },
  { id: "300", label: "about 300", value: 300 },
  { id: "40", label: "about 40", value: 40 },
];
const JUMP_ROUND = 5;

function domains(u: Units): { x: [number, number]; y: [number, number] } {
  const e = extent(u);
  const px = (e.x[1] - e.x[0]) * 0.05;
  const py = (e.y[1] - e.y[0]) * 0.05;
  return { x: [e.x[0] - px, e.x[1] + px], y: [Math.min(0, e.y[0]) - py, e.y[1] + 2.4 * py] };
}

/** the 2,663 days, one circle each, coloured by pile slot (or all grey) */
function Cloud({ u, labels, slot }: { u: Units; labels: Int32Array | null; slot: number[] }) {
  const { x, y } = usePlot();
  const Q = points(u);
  return useMemo(
    () => (
      <g className="g2-cloud">
        {Q.map((p, i) => (
          <circle key={i} className={labels ? `g2-slot-${slot[labels[i]]}` : "g2-slot-none"} cx={x(p[0])} cy={y(p[1])} r={1.8} />
        ))}
      </g>
    ),
    [Q, labels, slot, x, y],
  );
}

interface View {
  round: number; // 0 = before the first assignment
  centres: Pt[];
  labels: Int32Array | null;
  sizes: number[] | null;
  spread: number | null;
  trail: number; // how many rounds of the centres' path to draw
  arrows: boolean;
}
function viewAt(s: Sorted, step: number): View {
  const tr = s.res.trace;
  const R = Math.min(JUMP_ROUND, tr.length);
  switch (step) {
    case 0:
      return { round: 0, centres: tr[0].centres, labels: null, sizes: null, spread: null, trail: 0, arrows: false };
    case 1: {
      const a = assignAt(s, 1);
      return { round: 1, centres: tr[0].centres, labels: a.labels, sizes: a.sizes, spread: a.spread, trail: 0, arrows: false };
    }
    case 2: {
      const a = assignAt(s, 2);
      return { round: 2, centres: tr[1].centres, labels: a.labels, sizes: a.sizes, spread: a.spread, trail: 2, arrows: true };
    }
    case 3: {
      const a = assignAt(s, R);
      return { round: R, centres: tr[R - 1].centres, labels: a.labels, sizes: a.sizes, spread: a.spread, trail: R, arrows: false };
    }
    default:
      return { round: s.res.rounds, centres: s.res.centres, labels: s.res.labels, sizes: s.res.sizes, spread: s.res.spread, trail: tr.length, arrows: false };
  }
}

function Picture({ s, step, narrow }: { s: Sorted; step: number; narrow: boolean }) {
  const u = s.units;
  const d = domains(u);
  const v = viewAt(s, step);
  const xt = ticks(d.x[0], d.x[1], 5).filter((t) => t > d.x[0] + 0.5 && t < d.x[1] - 0.5);
  const yt = ticks(d.y[0], d.y[1], 5).filter((t) => t > 0 && t < d.y[1] - 2);
  const unitX = u === "raw" ? "%" : "sd";
  const unitY = u === "raw" ? "% a year" : "sd";
  const sizesText = v.sizes ? s.piles.map((p) => `${n0(v.sizes![p.j])} days`).join(", ") : "not yet assigned";
  return (
    <Plot xDomain={d.x} yDomain={d.y} width={narrow ? 400 : 720} height={narrow ? 340 : 400} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={d.x[0]} axisY={d.y[0]} ariaLabel={`the ${n0(N_DAYS)} NIFTY days as dots, today's move against the previous twenty days' realised vol${u === "standardised" ? ", both in standard-deviation units" : ""}; ${s.k} centres drawn as crosses after round ${v.round}; piles: ${sizesText}`}>
      <YTicks at={yt} fmt={(t) => `${n0(t)}${u === "raw" ? " %" : ""}`} />
      <XTicks at={xt} fmt={(t) => (t === 0 ? "0" : `${t > 0 ? "+" : "−"}${Math.abs(t)}`)} label={u === "raw" ? "today's move, %" : "today's move, sd"} />
      <Label at={[d.x[0], d.y[1]]} text={narrow ? `↑ trailing 20-day vol, ${unitY}` : `↑ the previous 20 days' realised vol, ${unitY} · → today's move, ${unitX}`} role="ink" dx={4} dy={14} />
      <Cloud u={u} labels={v.labels} slot={s.slot} />
      {v.trail > 1 &&
        s.res.centres.map((_, j) => (
          <Curve key={j} pts={s.res.trace.slice(0, v.trail).map((t) => t.centres[j])} role="ghost" width={1.2} smooth={false} opacity={0.9} />
        ))}
      {v.arrows && s.res.trace[0].centres.map((c, j) => <Cross key={j} at={c} slot={s.slot[j]} r={5} faint />)}
      {v.centres.map((c, j) => (
        <Cross key={j} at={c} slot={s.slot[j]} r={narrow ? 6 : 7} />
      ))}
      {step === 0 && s.res.init.map((i, j) => <Label key={j} at={s.res.trace[0].centres[j]} text={`start ${j + 1}: ${dmy(DAYS[i])}`} role="ink" dx={10} dy={-8} />)}
      {step === 4 &&
        s.piles
          .filter((p) => p.size < N_DAYS / 10)
          .map((p) => (
            <Label key={p.j} at={p.centre} text={`${n0(p.size)} days · ${span(p.first, p.last)}`} role="ink" dx={narrow ? -12 : 12} dy={4} anchor={narrow ? "end" : "start"} />
          ))}
    </Plot>
  );
}

export function F0SortDays() {
  const narrow = useNarrow();
  const [pick, setPick] = useBet<Guess>("g2-f0");
  const [kPick, setKPick] = useState<KPick>("2");
  const [std, setStd] = useState(false);
  const [step, setStep] = useState(0);
  const u: Units = std ? "standardised" : "raw";
  const k = Number(kPick);
  const s = getSorted(u, k);
  const v = viewAt(s, step);
  const two = getSorted("raw", 2);
  const small = two.piles[two.piles.length - 1];
  const big = two.piles[0];
  const answer = GUESSES.reduce((a, g) => (Math.abs(Math.log(g.value / small.size)) < Math.abs(Math.log(a.value / small.size)) ? g : a));
  const verdict = pick === null ? "none" : pick === answer.id ? "right" : "miss";
  const yoursLabel = GUESSES.find((g) => g.id === pick)?.label ?? "";
  const starts = s.res.init.map((i) => dmy(DAYS[i]));
  const R = Math.min(JUMP_ROUND, s.res.trace.length);
  const smallest = s.piles[s.piles.length - 1];
  const sizesOf = (sizes: number[]) => s.piles.map((p) => n0(sizes[p.j])).join(" / ");
  const COLOUR = ["blue", "amber", "grey", "red"];
  const colourWord = (i: number) => COLOUR[s.slot[s.piles[i].j]];

  const steps = [
    {
      caption: (
        <>
          The {n0(N_DAYS)} trading days from {dmy(FIRST_DAY)} to {dmy(LAST_DAY)}, one dot each: how far the index moved that day, against how rough the previous twenty days had been.{" "}
          Drop {k} centres on {k} days picked at random (seed {SEED}): {starts.join(", ")}. The crosses. No day has a label; the only instruction is "make the piles tight".
        </>
      ),
    },
    {
      caption: (
        <>
          Every day joins the nearer centre. The piles after round 1: <b>{sizesOf(v.sizes ?? [])}</b> days; the within-pile spread — every day's squared distance to its centre, added up — is{" "}
          {n0(v.spread ?? 0)}. The starting days were accidents, so the piles are too.
        </>
      ),
    },
    {
      caption: (
        <>
          Each centre moves to the middle of its pile (the faint crosses are where they were), and the days re-join whichever is now nearer: <b>{sizesOf(v.sizes ?? [])}</b>, spread{" "}
          {n0(v.spread ?? 0)}. Assign, recentre, repeat — that is the whole of the algorithm (Lloyd's).
        </>
      ),
    },
    {
      caption: (
        <>
          Round {R}: <b>{sizesOf(v.sizes ?? [])}</b>, spread {n0(v.spread ?? 0)}. The grey lines are the centres' paths so far. Each round lowers the spread; it never goes up, so the
          procedure must stop.
        </>
      ),
    },
    {
      caption: (
        <>
          Nothing moves after round <b>{s.res.rounds}</b>: {sizesOf(s.res.sizes)} days, spread {n0(s.res.spread)}. The smallest pile is {n0(smallest.size)} days, {span(smallest.first, smallest.last)}
          {u === "raw" ? <>, nothing else among them — the pandemic, found from two numbers a day. </> : <>. </>}
          {s.piles.map((p, i) => (
            <span key={p.j}>
              {i > 0 ? " · " : ""}
              {colourWord(i)}: {n0(p.size)} days, mean move {s2pct(p.meanMove)}, mean vol {n1(p.meanVol)} %
            </span>
          ))}
          .
        </>
      ),
    },
  ];

  return (
    <Figure
      n="0"
      prompt={
        <>
          Ten years of NIFTY days, two numbers each, and one instruction: sort them into piles and make the piles tight. Bet first — then step through the sorting, ask for more piles, and
          change the units.
        </>
      }
      controls={
        <>
          <Segmented
            label="piles"
            options={[
              { id: "2", label: "2" },
              { id: "3", label: "3" },
              { id: "4", label: "4" },
            ]}
            value={kPick}
            onChange={setKPick}
          />
          <Toggle label="same units on both axes" on={std} onChange={setStd} />
          <Readouts
            items={[
              ["round", v.round === 0 ? `0 of ${s.res.rounds}` : `${v.round} of ${s.res.rounds}`],
              ["pile sizes", v.sizes ? <span>{s.piles.map((p, i) => <span key={p.j} className={`g2-slot-text-${s.slot[p.j]}`}>{i > 0 ? " / " : ""}{n0(v.sizes![p.j])}</span>)}</span> : <span className="g2-dim">not yet assigned</span>],
              ["within-pile spread", v.spread === null ? <span className="g2-dim">—</span> : n0(v.spread)],
            ]}
          />
        </>
      }
      observe={
        <>
          Day t is (100·r_t, 100·√(252·mean r² over the previous {W} days)); {n0(N_DAYS)} days, {dmy(FIRST_DAY)}–{dmy(LAST_DAY)}. Lloyd's algorithm from k distinct random days (mulberry32, seed{" "}
          {SEED}), squared Euclidean distance, stopped when no centre moves. In per-cent units, seed {SEED}: two piles settle after {getSorted("raw", 2).res.rounds} rounds at {getSorted("raw", 2).piles.map((p) => n0(p.size)).join(" / ")} days, spread{" "}
          {n0(getSorted("raw", 2).res.spread)}, the small pile {span(small.first, small.last)}; three after {getSorted("raw", 3).res.rounds} rounds at {getSorted("raw", 3).piles.map((p) => n0(p.size)).join(" / ")}; four after{" "}
          {getSorted("raw", 4).res.rounds} at {getSorted("raw", 4).piles.map((p) => n0(p.size)).join(" / ")} (engine, equal to the key). The vol axis runs to about {n0(extent("raw").y[1])} % while the move axis spans about{" "}
          {n0(extent("raw").x[1] - extent("raw").x[0])} points, so in these units distance is nearly all vol and the piles are vol bands. Standardised (each axis less its mean, over its sd), three piles become{" "}
          {getSorted("standardised", 3).piles.map((p) => `${n0(p.size)} (mean move ${s2pct(p.meanMove)}, vol ${n1(p.meanVol)} %)`).join(" / ")}: up days, down days and the pandemic. Same days, same algorithm; the units chose.
        </>
      }
    >
      <div className="g2-sort">
        <Bet<Guess>
          question={
            <>
              Ask for two piles, in per-cent units. Of the {n0(N_DAYS)} days, how many land in the smaller pile?
            </>
          }
          options={GUESSES.map((g) => ({ id: g.id, label: g.label }))}
          pick={pick}
          onPick={(g) => {
            setPick(g);
            if (g !== null) {
              setKPick("2");
              setStd(false);
            }
          }}
        >
          <ResultCard
            yours={yoursLabel}
            answer={
              <>
                {answer.label}: <b>{n0(small.size)} days</b>, {span(small.first, small.last)}, every one of them — against {n0(big.size)} in the other pile
              </>
            }
            verdict={verdict}
          >
            Nobody told it about a pandemic. Step through to watch the piles form; then ask for three, then flip the units.
          </ResultCard>
        </Bet>
        <StepThrough
          steps={steps}
          onStep={setStep}
          render={(i) => (
            <div className="g2-panel">
              <div className="g2-panel-title">
                <strong>
                  {k} piles · {u === "raw" ? "per-cent units" : "standardised units"}
                </strong>{" "}
                <span>
                  {i === 0 ? "grey: the days, unsorted · crosses: the starting centres" : `dots and crosses by pile, largest to smallest: ${s.piles.map((_, j) => colourWord(j)).join(" → ")}`}
                  {i >= 2 ? " · grey lines: the centres' path" : ""}
                </span>
              </div>
              <Picture s={s} step={i} narrow={narrow} />
            </div>
          )}
        />
      </div>
    </Figure>
  );
}
