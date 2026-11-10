import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Says } from "../../../ui/Comic";
import { Readouts, Segmented } from "../../../ui/controls";
import { firstHitBelow, fixedBet, peekFor, riskNeutralTree, shreveRho, stoppedMean } from "../../../engine/martingale";
import key from "../../../engine/__fixtures__/key-B2.json";
import { FanPlot } from "./Fan";
import { Meter } from "./Meter";
import { TOSSES, f2, n2, pct0, replayFan, replayLeaveBeforeRun, useNarrow, useRecordReading, useTable, type Fan } from "./table";

/**
 * Figure 4 — break it: the peek. Unlocked once Figure 3 has been played by hand (the honest failure must come first).
 * One picker — honest / see the next toss before you bet (for ten tosses) / leave two tosses before a run of five losses — and a
 * replay. The meter moves for the first time: +1.00 per toss peeked. Under the fan: "the only way to move it is to look
 * ahead", and the footnote drawing of Shreve's two-step tree 4 → 6.40 / 1.60 → 10.24 / 2.56 / 0.64, stopped by a rule that peeks → 2.56.
 */

type Cheat = "honest" | "peek" | "run";
const PEEKED = 10;
const RUN = 5;
const SEED: Record<Cheat, number> = { honest: 20268, peek: 20269, run: 20270 };
const TREE = riskNeutralTree(key.tree.S0, key.tree.u, key.tree.d, key.tree.r, 2);
const RHO_MEAN = stoppedMean(TREE, shreveRho); // 2.56
const HONEST_STOP_MEAN = stoppedMean(TREE, firstHitBelow(TREE, 2)); // a genuine stopping time: 4

export function F4Peek() {
  const t = useTable();
  const [cheat, setCheat] = useState<Cheat>("peek");
  const [played, setPlayed] = useState<Partial<Record<Cheat, true>>>({});
  const unlocked = t.handPlayed;
  const fan: Fan | null = useMemo(() => {
    if (!unlocked || !played[cheat]) return null;
    if (cheat === "honest") return replayFan(fixedBet(1), SEED.honest);
    if (cheat === "peek") return replayFan(peekFor(PEEKED), SEED.peek);
    return replayLeaveBeforeRun(SEED.run, RUN);
  }, [unlocked, played, cheat]);
  useRecordReading("F4", fan);
  const readings = (["F0", "F1", "F2", "F3"] as const).map((id) => [id, t.readings[id]] as const).filter(([, r]) => r);

  return (
    <Figure
      n="4"
      prompt={
        <>
          Four rounds, four readings, nothing moved. The croupier now lets you break one rule — and only this one — so you can see what moving the meter takes.
        </>
      }
      controls={
        unlocked ? (
          <>
            <Segmented<Cheat>
              label="the rule you break"
              value={cheat}
              onChange={setCheat}
              options={[
                { id: "honest", label: "none" },
                { id: "peek", label: `see the next toss (first ${PEEKED})` },
                { id: "run", label: `leave 2 tosses before ${RUN} losses` },
              ]}
            />
            <button type="button" className={"btn " + (fan ? "" : "primary")} onClick={() => setPlayed((p) => ({ ...p, [cheat]: true }))} disabled={!!fan}>
              {fan ? "replayed" : "replay 10,000 players"}
            </button>
            <Readouts
              items={[
                ["per peeked toss", fan && cheat === "peek" ? <span className="b2-error">{f2(fan.mean / PEEKED)}</span> : cheat === "peek" ? "—" : "n/a"],
                ["left before the run", fan && cheat === "run" ? pct0(fan.leftEarly / fan.finals.length) : cheat === "run" ? "—" : "n/a"],
              ]}
            />
          </>
        ) : (
          <span className="b2-dim">Locked until you have played a hand in Figure 3 and replayed it.</span>
        )
      }
      observe={
        !unlocked ? (
          <>The croupier keeps this round closed until your own system has failed to move the meter. Play Figure 3 by hand, replay your habit, and come back.</>
        ) : !fan ? (
          <>Pick the rule to break and replay. The honest setting is Figure 0's game, for comparison.</>
        ) : cheat === "honest" ? (
          <>
            No rule broken: the meter reads {f2(fan.mean)} ± {n2(2 * fan.se)}, pinned, as in every round so far.
          </>
        ) : cheat === "peek" ? (
          <>
            The meter moves for the first time: <strong>{f2(fan.mean)}</strong> ± {n2(2 * fan.se)} — <strong>{f2(fan.mean / PEEKED)} per toss peeked</strong>, and the fan is lifted whole, not widened. Not a system, not an exit rule, not bet sizing: knowing the next toss before the bet.
          </>
        ) : (
          <>
            The second cheat is quieter but the same crime. "Leave two tosses before five losses in a row" sounds like an exit rule, but to obey it you must read the tosses that have not happened. {pct0(fan.leftEarly / fan.finals.length)} of players left this way and the meter reads <strong>{f2(fan.mean)}</strong> ± {n2(2 * fan.se)} — moved. Shreve's words: the only way the martingale property could be violated is if the stopping decision looked ahead.
          </>
        )
      }
    >
      <Says who="Croupier">{unlocked ? "Just this once: look at the next card before you bet." : "Not yet. Play your own hand first."}</Says>
      <div className="b2-stage">
        <Meter replay={fan} />
        <FanPlot fan={fan} T={TOSSES} yRange={45} />
        {fan && cheat !== "honest" && (
          <div className="b2-card" role="status">
            <div className="b2-card-head">The only way to move it is to look ahead.</div>
            <div className="b2-card-rows">
              {readings.map(([id, r]) => (
                <div key={id} className="b2-card-row">
                  <span className="k">Figure {id.slice(1)}, honest</span>
                  <span className="v">
                    {f2(r!.mean)} ± {n2(2 * r!.se)}
                  </span>
                </div>
              ))}
              <div className="b2-card-row moved">
                <span className="k">this round, {cheat === "peek" ? `peeking ${PEEKED} tosses` : "leaving before the run"}</span>
                <span className="v">
                  {f2(fan.mean)} ± {n2(2 * fan.se)}
                </span>
              </div>
            </div>
            <ShreveTree />
          </div>
        )}
      </div>
    </Figure>
  );
}

/** Footnote drawing: Shreve's discounted tree (Fig. 8.2.2) and the rule ρ that stops at the start only if the first toss will win (Fig. 8.2.3). */
function ShreveTree() {
  const narrow = useNarrow();
  const W = narrow ? 340 : 520;
  const H = 176;
  const colX = [40, W / 2, W - 50];
  const rowY = (n: number, i: number) => (n === 0 ? 80 : n === 1 ? [42, 118][i] : [22, 80, 138][i]);
  const L = TREE.levels;
  const stop = { "0,0": "stop here if the first toss will be H", "1,1": "TH: stop", "2,2": "TT: stop" } as Record<string, string>;
  return (
    <div className="b2-tree">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Shreve's two-step discounted tree with a peeking stopping rule">
        {[0, 1].map((n) =>
          L[n].map((_, i) => (
            <g key={`${n}-${i}`} className="b2-tree-edge">
              <line x1={colX[n]} y1={rowY(n, i)} x2={colX[n + 1]} y2={rowY(n + 1, i)} />
              <line x1={colX[n]} y1={rowY(n, i)} x2={colX[n + 1]} y2={rowY(n + 1, i + 1)} />
            </g>
          )),
        )}
        {L.map((row, n) =>
          row.map((v, i) => {
            const s = stop[`${n},${i}`];
            return (
              <g key={`${n}-${i}`} transform={`translate(${colX[n]} ${rowY(n, i)})`}>
                <circle r={17} className="b2-tree-under" />
                <circle r={17} className={"b2-tree-node " + (s ? "stopped" : "")} />
                <text y={4} textAnchor="middle" className="b2-tree-v">
                  {v.toFixed(2)}
                </text>
              </g>
            );
          }),
        )}
        <text x={colX[0]} y={H - 4} textAnchor="middle" className="b2-tree-cap">
          now
        </text>
        <text x={colX[1]} y={H - 4} textAnchor="middle" className="b2-tree-cap">
          after toss 1
        </text>
        <text x={colX[2]} y={H - 4} textAnchor="middle" className="b2-tree-cap">
          after toss 2
        </text>
      </svg>
      <p className="b2-footnote">
        Footnote, the same crime in three numbers. A fair tree: {L[0][0].toFixed(2)} is the average of {L[1][0].toFixed(2)} and {L[1][1].toFixed(2)}, each of which is the average of its two children, so any honest rule for when to stop averages {HONEST_STOP_MEAN.toFixed(2)}. The rule "stop at the start only if the first toss will be a win, otherwise stop at the first tail" needs tomorrow's toss today; its stopped values are {key.tree.rho_stopped_values.HH.toFixed(2)}, {key.tree.rho_stopped_values.HT.toFixed(2)}, {key.tree.rho_stopped_values.TH.toFixed(2)}, {key.tree.rho_stopped_values.TT.toFixed(2)} and their average is <span className="b2-nowrap"><strong>{RHO_MEAN.toFixed(2)}</strong>, not {L[0][0].toFixed(2)}</span>. (Shreve, Figs 8.2.2–8.2.3.)
      </p>
    </div>
  );
}
