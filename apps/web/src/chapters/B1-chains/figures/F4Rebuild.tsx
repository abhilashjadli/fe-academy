import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Readouts } from "../../../ui/controls";
import { meanRunLength, simulateChain } from "../../../engine/markov";
import { rng, sampleIndex } from "../../../engine/random";
import { DAYS, KEY, OCCUPANCY, P_FIT, SEASON, f1, halves, pct0 } from "./rain";
import { DayStrip } from "./strip";

/**
 * Figure 4 — rebuild and compare. Generate a season from the nine fractions; put it under the real one; put a memoryless
 * "coin" strip (each day drawn fresh with the season's own colour mix) under both; shuffle; the reader picks which is the
 * season. The chain's strip has the spells (mean run lengths side by side); the coin's looks "more random" and is the one
 * most people pick. Honest gap: the season's rain fraction drifts across the months; the chain's is flat.
 */

type Kind = "season" | "chain" | "coin";
type Pick = "A" | "B" | "C";
const LETTERS: Pick[] = ["A", "B", "C"];

function makeStrips(seed: number): Array<{ kind: Kind; states: number[] }> {
  const r = rng(seed);
  const chain = simulateChain(P_FIT, DAYS - 1, SEASON.states[0], r);
  const coin: number[] = [];
  for (let i = 0; i < DAYS; i++) coin.push(sampleIndex(OCCUPANCY, r()));
  const list: Array<{ kind: Kind; states: number[] }> = [
    { kind: "season", states: SEASON.states as number[] },
    { kind: "chain", states: chain },
    { kind: "coin", states: coin },
  ];
  // seeded shuffle
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const KIND_LABEL: Record<Kind, string> = {
  season: SEASON.real ? "the real season" : "the season (simulated — real file pending)",
  chain: "rebuilt from your nine fractions",
  coin: "a coin with no memory (same colour mix)",
};

export function F4Rebuild() {
  const [seed, setSeed] = useState(1);
  const [pick, setPick] = useBet<Pick>("B1-F4");
  const strips = useMemo(() => makeStrips(seed), [seed]);
  const revealed = pick !== null;
  const seasonAt = LETTERS[strips.findIndex((s) => s.kind === "season")];
  const coinAt = LETTERS[strips.findIndex((s) => s.kind === "coin")];
  const runs = Object.fromEntries(strips.map((s) => [s.kind, meanRunLength(s.states)])) as Record<Kind, number>;
  const seasonHalves = halves(SEASON.states);
  const chainHalves = halves(strips.find((s) => s.kind === "chain")!.states);
  const drift = Math.abs(seasonHalves[0] - seasonHalves[1]);

  return (
    <Figure
      n="4"
      prompt={
        <>
          Rebuild it. One of these three strips is the season from Figure 0{SEASON.real ? "" : " (the simulated one)"}; one was grown by the machine from your nine fractions;
          one is a coin with no memory at all, tossed with the season's own colour mix. Which is the season?
        </>
      }
      controls={
        <>
          <span className="ctl">
            <span className="seg" role="group">
              <button type="button" onClick={() => { setSeed((s) => s + 1); setPick(null); }}>
                generate again
              </button>
            </span>
          </span>
          {revealed && (
            <Readouts
              items={[
                ["mean spell, season", f1(runs.season) + " days"],
                ["mean spell, machine", f1(runs.chain) + " days"],
                ["mean spell, coin", f1(runs.coin) + " days"],
              ]}
            />
          )}
        </>
      }
      observe={
        revealed ? (
          <>
            The machine's strip has the season's spells: mean run {f1(runs.chain)} days against {f1(runs.season)}; the coin's {f1(runs.coin)} flickers, and it is the one most
            people pick as "random". <strong>The honest gap:</strong> rain share in the two halves — season {pct0(seasonHalves[0])} then {pct0(seasonHalves[1])}; machine{" "}
            {pct0(chainHalves[0])} then {pct0(chainHalves[1])}.{" "}
            {SEASON.real ? (
              <>Fixed arrows cannot drift with the monsoon — that is the one thing this table cannot do, and it is why a real season beats a chain with a flat habit.</>
            ) : (
              <>
                (This season is simulated with fixed arrows, so its {Math.round(100 * drift)}-point gap is luck.) The real Bengaluru file drifts with the monsoon, and fixed
                arrows cannot — the one thing this table cannot do.
              </>
            )}
          </>
        ) : (
          <>Look for spells, not colours: all three have about the same number of each colour. Commit, then the labels appear.</>
        )
      }
    >
      <div className="b1-rebuild">
        {strips.map((s, k) => (
          <div key={k} className={"b1-candidate " + (revealed ? "b1-" + s.kind : "")}>
            <div className="b1-cand-head">
              <span className="b1-letter">{LETTERS[k]}</span>
              {revealed && <span className="b1-cand-label">{KIND_LABEL[s.kind]}</span>}
              {revealed && <span className="b1-cand-run">mean spell {f1(runs[s.kind])} days</span>}
            </div>
            <DayStrip states={s.states} perRow={30} ariaLabel={`candidate ${LETTERS[k]}${revealed ? ": " + KIND_LABEL[s.kind] : ""}`} />
          </div>
        ))}
        <Bet<Pick>
          question={<>Which strip is the season?</>}
          options={LETTERS.map((l) => ({ id: l, label: `strip ${l}` }))}
          pick={pick}
          onPick={setPick}
        >
          <ResultCard yours={pick ? `strip ${pick}` : "—"} answer={`strip ${seasonAt}`} verdict={pick === seasonAt ? "right" : "miss"}>
            {pick === coinAt ? (
              <>
                You picked the coin — the one that looks most "random", and the only one with no habit at all. Its spells average {f1(runs.coin)} days; the season's{" "}
                {f1(runs.season)}.
              </>
            ) : pick === seasonAt ? (
              <>
                You read the spells. The machine's copy, strip {LETTERS[strips.findIndex((s) => s.kind === "chain")]}, is the hard one to tell apart — and that is the
                point: nine fractions carry the habit.
              </>
            ) : (
              <>
                You picked the machine's copy. Fair: its spells average {f1(runs.chain)} days against the season's {f1(runs.season)}, and it was built from the season's own nine
                fractions. Press "generate again" and the copy will look different and just as plausible.
              </>
            )}{" "}
            The sticky two-state chain in the books makes the same point with two colours: a 0.9 chance of staying gives mean spells of {f1(KEY.sticky.mean_run_closed)} days
            against the coin's {f1(KEY.sticky.coin_mean_run)}.
          </ResultCard>
        </Bet>
      </div>
    </Figure>
  );
}
