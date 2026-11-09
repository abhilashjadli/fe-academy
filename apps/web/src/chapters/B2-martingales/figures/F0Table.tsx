import "./figures.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Says } from "../../../ui/Comic";
import { Readouts } from "../../../ui/controls";
import { fixedBet } from "../../../engine/martingale";
import key from "../../../engine/__fixtures__/key-B2.json";
import { FanPlot } from "./Fan";
import { Meter } from "./Meter";
import { TOSSES, chips, n1, n2, onePath, pct0, replayFan, useRecordReading, f2 } from "./table";

/**
 * Figure 0 — rule 1: one chip a toss, two hundred tosses. The reader bets where the *average* player ends, plays one
 * seat (the path draws slowly for ten tosses, then squishes to 200), then seats 10,000 players: a faint fan and, above the
 * table, the meter — average over all players — which stays put while the fan widens.
 */

type Guess = "ahead" | "even" | "behind";
const LABEL: Record<Guess, string> = { ahead: "ahead", even: "even — about zero", behind: "behind" };
const SEED_YOU = 101;
const SEED_FAN = 20260;
const SLOW = 10; // tosses drawn one at a time

export function F0Table() {
  const [pick, setPick] = useBet<Guess>("B2-F0");
  const [seat, setSeat] = useState(0); // which seat you have played (0 = not yet)
  const [shown, setShown] = useState(0); // tosses of your path revealed so far
  const [replayed, setReplayed] = useState(false);
  const timer = useRef<number | null>(null);

  const you = useMemo(() => (seat ? onePath(fixedBet(1), SEED_YOU + seat) : null), [seat]);
  const fan = useMemo(() => (replayed ? replayFan(fixedBet(1), SEED_FAN) : null), [replayed]);
  useRecordReading("F0", fan);

  // the reveal: slowly for ten tosses, then fast to the bell
  useEffect(() => {
    if (!you) return;
    if (shown >= TOSSES) return;
    const slow = shown < SLOW;
    timer.current = window.setTimeout(
      () => setShown((s) => Math.min(TOSSES, s + (slow ? 1 : 3))),
      slow ? 320 : 16,
    );
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [you, shown]);

  const play = () => {
    setSeat((s) => s + 1);
    setShown(0);
  };
  const xMax = you ? Math.max(SLOW, Math.min(TOSSES, shown)) : TOSSES;
  const done = you !== null && shown >= TOSSES;
  const sdKey = key.spread.sd; // √200 = 14.14 from the answer key
  const verdict = pick && fan ? (pick === "even" ? "right" : "miss") : "none";

  return (
    <Figure
      n="0"
      prompt={
        <>
          The table. Every toss on this page is a <strong>simulated fair coin</strong> — seeded, so the same visit deals the same cards. Rule one is the croupier's. Before you sit down: where does the <em>average</em> player end after two hundred tosses?
        </>
      }
      controls={
        <>
          <button type="button" className={"btn " + (you ? "" : "primary")} onClick={play} disabled={you !== null && !done}>
            {you ? "play me again" : "play me"}
          </button>
          <button type="button" className={"btn " + (done && !replayed ? "primary" : "")} onClick={() => setReplayed(true)} disabled={replayed}>
            {replayed ? "10,000 players seated" : "replay 10,000 players"}
          </button>
          <Readouts
            items={[
              ["your chips", <strong>{you ? chips(you.wealth[Math.min(shown, TOSSES)]) : "—"}</strong>],
              ["spread of players", fan ? <>±{n1(fan.sd)} chips</> : "—"],
              ["finished ahead", fan ? pct0(fan.pAhead) : "—"],
            ]}
          />
        </>
      }
      observe={
        !you ? (
          <>Lock in a guess, then press <em>play me</em>: your seat's path draws one toss at a time, then runs to the bell.</>
        ) : !done ? (
          <>One chip a toss. Ten tosses slowly, then the axis squishes to let the other hundred and ninety through.</>
        ) : !fan ? (
          <>
            That was one seat: {chips(you.final)} at the bell. One path says nothing about the average. Seat ten thousand players and read the meter above the table.
          </>
        ) : (
          <>
            The fan widens — after 200 tosses a typical player is about <strong>{n1(sdKey)} chips</strong> from zero (√200, the answer key's spread; this replay measured {n1(fan.sd)}) — and the meter does not. It reads{" "}
            <strong>{f2(fan.mean)}</strong> with noise ±{n2(2 * fan.se)}: zero, within what 10,000 players can resolve. {pct0(fan.pAhead)} finished ahead, {pct0(1 - fan.pAhead)} did not, and the average of all of them is where it started. Rule two is next.
          </>
        )
      }
    >
      <Says who="Croupier">One chip a toss, red or black, no zero. Two hundred tosses.</Says>
      <Bet
        question="Over ten thousand players, where does the average player end?"
        options={[
          { id: "ahead", label: "ahead" },
          { id: "even", label: "even" },
          { id: "behind", label: "behind" },
        ]}
        pick={pick}
        onPick={setPick}
      />
      <div className="b2-stage">
        <Meter replay={fan} />
        <FanPlot fan={fan} yours={you ? you.wealth : null} T={TOSSES} xMax={xMax} />
      </div>
      {pick && fan && (
        <ResultCard yours={LABEL[pick]} answer={<>even: the meter reads {f2(fan.mean)} ± {n2(2 * fan.se)} chips — the spread is ±{n1(sdKey)}, the average is zero</>} verdict={verdict}>
          Nobody ends at zero — your own seat ended at {chips(you?.final ?? 0)} — and the average of everybody is zero exactly. The answer key's 10,000-player check puts the fixed bet at {f2(key.meter.strategies[0].mean)} with standard error {n2(key.meter.strategies[0].se)}. The spread grows with every toss; the meter is the one number that does not. This page is about what can move it.
        </ResultCard>
      )}
    </Figure>
  );
}
