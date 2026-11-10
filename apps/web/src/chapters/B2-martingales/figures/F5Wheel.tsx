import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Says } from "../../../ui/Comic";
import { Readouts, Toggle } from "../../../ui/controls";
import { ROULETTE_P, doublingCycles, fixedBet, habitRule, quitWhenAhead, unitBetEdge, type Replay } from "../../../engine/martingale";
import { rng } from "../../../engine/random";
import key from "../../../engine/__fixtures__/key-B2.json";
import { Meter } from "./Meter";
import { PLAYERS, TOSSES, f2, n2, n3, pct1, replayFan, useTable } from "./table";

/**
 * Figure 5 — the honest wheel. One toggle: add the zero (house edge 2.7 %). The systems of Figures 0–3 replay on the new
 * wheel and every meter tilts negative, doubling fastest. Sub- and super-martingales arrive as tilts.
 */

const SEEDS = { unit: 20271, up1: 20272, dbl: 20273, habit: 20274 };

export function F5Wheel() {
  const t = useTable();
  const [zero, setZero] = useState(false);
  const p = zero ? ROULETTE_P : 0.5;
  const habit = t.habit;
  const rounds = useMemo(() => {
    const unit = replayFan(fixedBet(1), SEEDS.unit, PLAYERS, TOSSES, p);
    const up1 = replayFan(quitWhenAhead(1, TOSSES), SEEDS.up1, PLAYERS, TOSSES, p);
    const dbl: Replay = doublingCycles(5, 100, PLAYERS, rng(SEEDS.dbl), p);
    const yours = habit ? replayFan(habitRule(habit.afterWin, habit.afterLoss, habit.leaveUp, habit.leaveDown), SEEDS.habit, PLAYERS, TOSSES, p) : null;
    return { unit, up1, dbl, yours };
  }, [p, habit]);
  const edge = unitBetEdge(p);
  const dblExact = (1 - Math.pow(1 - p, 5)) * 1 - Math.pow(1 - p, 5) * 31; // exact mean per cycle at this p

  return (
    <Figure
      n="5"
      prompt={
        <>
          Last rule. Real wheels have a zero: red pays even money but wins only 18 times in 37. Flip it on and read the systems of this page on the wheel they are actually played on.
        </>
      }
      controls={
        <>
          <Toggle label={zero ? "zero on the wheel: 18 of 37" : "add the zero"} on={zero} onChange={setZero} />
          <Readouts
            items={[
              ["edge per toss, unit bet", <span className={zero ? "b2-error" : ""}>{(edge < 0 ? "−" : "") + n3(Math.abs(edge))}</span>],
              ["per 100 tosses", <span className={zero ? "b2-error" : ""}>{f2(100 * edge)}</span>],
              ["doubling, exact per cycle", <span className={zero ? "b2-error" : ""}>{f2(dblExact)}</span>],
            ]}
          />
        </>
      }
      observe={
        !zero ? (
          <>
            Fair wheel: three systems{habit ? " and yours" : ""}, three{habit ? ", four" : ""} meters, all pinned. Now add the zero.
          </>
        ) : (
          <>
            Every meter tilts down, the doubling system's fastest: a cycle's exact average is {f2(dblExact)} chips on the wheel against {n2(key.doubling_k5.mean_cycle_formula)} fair, because the five-black runs come {pct1(Math.pow(1 - ROULETTE_P, 5))} of cycles instead of {pct1(1 / 32)}. The unit bet loses {n3(Math.abs(edge))} a toss. A meter that leans down is a <strong>supermartingale</strong>, up a <strong>submartingale</strong>; a stock under its own odds leans up, and chapter B5 removes the lean. No exit rule or bet sizing changes a tilt: they only change who carries it.
          </>
        )
      }
    >
      <Says who="Croupier">{zero ? "Zero. The house keeps the table." : "No zero at this table — until you ask for one."}</Says>
      <div className="b2-stage">
        <div className="b2-meters">
          <Meter replay={rounds.unit} label="one chip a toss (Fig. 0)" scale={20} compact per="per seat of 200" />
          <Meter replay={rounds.up1} label="quit when up 1 (Fig. 1)" scale={20} compact per="per seat of 200" />
          <Meter replay={rounds.dbl} label="doubling, limit 31 (Fig. 2)" scale={20} compact per="per 100 cycles" />
          {rounds.yours && <Meter replay={rounds.yours} label="your habit (Fig. 3)" scale={20} compact per="per seat of 200" />}
        </div>
      </div>
    </Figure>
  );
}
