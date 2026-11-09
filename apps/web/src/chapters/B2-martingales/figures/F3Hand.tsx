import "./figures.css";
import { useMemo, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Says } from "../../../ui/Comic";
import { Readouts, Stepper } from "../../../ui/controls";
import { habitRule, tossCoin } from "../../../engine/martingale";
import { rng } from "../../../engine/random";
import { FanPlot } from "./Fan";
import { Meter } from "./Meter";
import { TOSSES, chips, f2, n1, n2, pct0, replayFan, table, useRecordReading, useTable, type Habit } from "./table";

/**
 * Figure 3 — rule 4: your own system. Two controls — bet size (1–8) and leave — and a toss button. The reader plays up to
 * thirty tosses by hand using everything seen so far; the croupier reads off "your habit" (bet after a win, after a loss,
 * where you left) and replays it 10,000 times. The meter: zero again. The chapter's defining sentence lands here.
 */

const HAND_TOSSES = 30;
const SEED_HAND = 20266;
const SEED_REPLAY = 20267;

interface Hand {
  bets: number[];
  tosses: number[];
  wealth: number[];
  left: boolean;
}

function mode(xs: number[], fallback: number): number {
  if (!xs.length) return fallback;
  const m = new Map<number, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  let best = xs[0],
    c = 0;
  for (const [k, v] of m) if (v > c || (v === c && k > best)) ((best = k), (c = v));
  return best;
}

/** Three numbers read off the hand: stake after a win (and the first bet), stake after a loss, the level you left at. */
function readHabit(h: Hand): Habit {
  const afterWin: number[] = [],
    afterLoss: number[] = [];
  for (let i = 0; i < h.bets.length; i++) {
    if (i === 0) afterWin.push(h.bets[0]);
    else (h.bets[i - 1] * h.tosses[i - 1] > 0 ? afterWin : afterLoss).push(h.bets[i]);
  }
  const aw = mode(afterWin, 1);
  const al = mode(afterLoss, aw);
  const final = h.wealth[h.wealth.length - 1];
  return {
    afterWin: aw,
    afterLoss: al,
    leaveUp: h.left && final > 0 ? final : Infinity,
    leaveDown: h.left && final < 0 ? -final : Infinity,
    tosses: h.bets.length,
    final,
  };
}

export function F3Hand() {
  const t = useTable();
  const [stake, setStake] = useState(1);
  const [hand, setHand] = useState<Hand>({ bets: [], tosses: [], wealth: [0], left: false });
  const [dealt, setDealt] = useState(0); // which hand of the visit (reseeds)
  const [replayed, setReplayed] = useState(0);
  const coin = useRef(rng(SEED_HAND));

  const over = hand.left || hand.bets.length >= HAND_TOSSES;
  const w = hand.wealth[hand.wealth.length - 1];
  const habit: Habit | null = over && hand.bets.length > 0 ? readHabit(hand) : t.habit;
  const fan = useMemo(() => (replayed && habit ? replayFan(habitRule(habit.afterWin, habit.afterLoss, habit.leaveUp, habit.leaveDown), SEED_REPLAY + replayed) : null), [replayed, habit]);
  useRecordReading("F3", fan);

  const toss = () => {
    if (over) return;
    if (hand.bets.length === 0 && t.habit) {
      // a fresh hand after a reload: the old habit is retired
      table.clearHand();
      setReplayed(0);
    }
    const x = tossCoin(coin.current);
    setHand((h) => ({ bets: [...h.bets, stake], tosses: [...h.tosses, x], wealth: [...h.wealth, h.wealth[h.wealth.length - 1] + stake * x], left: false }));
  };
  const leave = () => {
    if (over || hand.bets.length === 0) return;
    setHand((h) => ({ ...h, left: true }));
  };
  const newHand = () => {
    coin.current = rng(SEED_HAND + dealt + 1);
    setDealt((d) => d + 1);
    setHand({ bets: [], tosses: [], wealth: [0], left: false });
    setReplayed(0);
    table.clearHand();
  };
  const replay = () => {
    if (!habit) return;
    table.setHand(habit);
    setReplayed((r) => r + 1);
  };
  const last = hand.tosses.length ? hand.tosses[hand.tosses.length - 1] : 0;
  const leaveWords = (h: Habit) => (Number.isFinite(h.leaveUp) ? `leave when up ${h.leaveUp}` : Number.isFinite(h.leaveDown) ? `leave when down ${h.leaveDown}` : "stay to the bell");

  return (
    <Figure
      n="3"
      prompt={
        <>
          Rule four. Thirty tosses, your hand on the chips: size each bet, leave when you like, use anything you have seen — streaks, your balance, the last three tosses. Then the croupier replays <em>your</em> system ten thousand times.
        </>
      }
      controls={
        <>
          <Stepper label="bet" value={stake} min={1} max={8} onChange={setStake} />
          <button type="button" className={"btn " + (!over ? "primary" : "")} onClick={toss} disabled={over}>
            {over ? "hand over" : hand.bets.length === 0 ? `bet ${stake} on red` : `toss ${hand.bets.length + 1} of ${HAND_TOSSES}: bet ${stake}`}
          </button>
          <button type="button" className="btn" onClick={leave} disabled={over || hand.bets.length === 0}>
            leave the table
          </button>
          <Readouts
            items={[
              ["your chips", <strong>{chips(w)}</strong>],
              ["last toss", hand.tosses.length ? <span className={last > 0 ? "b2-truth" : "b2-error"}>{last > 0 ? "red — won" : "black — lost"}</span> : "—"],
            ]}
          />
        </>
      }
      observe={
        !over && hand.bets.length === 0 && !t.habit ? (
          <>Set the stake, bet. Double after a loss, press after a streak, bank a lead — whatever you believe works. Leave when you want, or the bell rings at thirty.</>
        ) : !over && !t.habit ? (
          <>
            {hand.bets.length} {hand.bets.length === 1 ? "toss" : "tosses"} in, {chips(w)}. Keep going, or leave.
          </>
        ) : !fan ? (
          <>
            Your hand is over{habit ? `: ${chips(habit.final)} after ${habit.tosses} tosses` : ""}. The croupier has written down your habit — three numbers — and will replay it for 10,000 players over 200 tosses each.
          </>
        ) : (
          <>
            Your system, 10,000 times: {pct0(fan.pAhead)} finished ahead{fan.leftEarly > 0 ? `, ${pct0(fan.leftEarly / fan.finals.length)} left before the bell` : ""}, spread ±{n1(fan.sd)} chips, and the meter reads <strong>{f2(fan.mean)}</strong> ± {n2(2 * fan.se)}. Zero, a fourth time. Everything you used — the streak, the balance, the last toss — was already in the past when you bet on it. That is what the next rule is about.
          </>
        )
      }
    >
      <Says who="Croupier">{fan ? "Anything you can see, you may use. It does not help." : "Your system. Size each bet; leave when you like."}</Says>
      <div className="b2-stage">
        <Meter replay={fan} />
        <FanPlot fan={fan} yours={hand.wealth.length > 1 ? hand.wealth : null} T={TOSSES} xMax={fan ? TOSSES : HAND_TOSSES} yRange={fan ? 45 : 24} leftAt={hand.left ? hand.bets.length : null} />
        {habit && (over || t.habit) && (
          <div className="b2-habit" role="group" aria-label="your habit">
            <div className="b2-habit-head">
              <span>your habit, as the croupier read it</span>
              <span className="b2-dim">{habit.tosses} tosses · {chips(habit.final)}</span>
            </div>
            <div className="b2-habit-row">
              <span className="k">after a win, you bet</span>
              <span className="v">{habit.afterWin}</span>
            </div>
            <div className="b2-habit-row">
              <span className="k">after a loss, you bet</span>
              <span className="v">{habit.afterLoss}</span>
            </div>
            <div className="b2-habit-row">
              <span className="k">your exit</span>
              <span className="v">{leaveWords(habit)}</span>
            </div>
            <div className="b2-habit-nav">
              <button type="button" className={"btn " + (fan ? "" : "primary")} onClick={replay}>
                {fan ? "replay again" : "replay my habit 10,000 times"}
              </button>
              <button type="button" className="btn" onClick={newHand}>
                play a new hand
              </button>
            </div>
          </div>
        )}
      </div>
    </Figure>
  );
}
