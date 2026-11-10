import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { BetNumber, ResultCard } from "../../../ui/Bet";
import { Slider } from "../../../ui/controls";
import { MiniBoard } from "../../0.2-normal/MiniBoard";
import { beliefDemonstrator } from "../../../engine/binomial";
import { REAL, REAL_DAYS, REAL_FORWARD, REAL_SIGMA, SCREEN_CALL, f4, n0, n2, pct, pct1, pct2, realStep } from "./real";
import "./figures.css";

/**
 * Figure 0 — the bet, then the trick, on the real row: C1's 22,600 call. Today's level is 22,559, the stock whose 11-day forward is the chain's 22,603; one step of
 * eleven days takes it to the CRR up or down node sized from the row's wobble. The reader sets a chance-of-up dial to their belief, types a
 * price, and the price tile reads the engine's one-step price and freezes while the dial keeps moving.
 */

export function F0Trick() {
  const [p, setP] = useState(0.7);
  const [guess, setGuessState] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem("fe-bet:C2-F0");
      return v === null ? null : parseFloat(v);
    } catch {
      return null;
    }
  });
  const setGuess = (v: number | null) => {
    setGuessState(v);
    try {
      if (v === null) localStorage.removeItem("fe-bet:C2-F0");
      else localStorage.setItem("fe-bet:C2-F0", String(v));
    } catch {
      /* ignore */
    }
  };
  const committed = guess !== null;
  const step = useMemo(realStep, []);
  const [lowEnd, highEnd] = useMemo(() => beliefDemonstrator(REAL, [0.1, 0.9]).map((r) => r.naive), []);
  const demo = beliefDemonstrator(REAL, [p])[0];
  const price = step.f; // the same number whatever the dial says
  const half = beliefDemonstrator(REAL, [0.5])[0].naive; // the usual answer: a coin flip on the payout
  // "right" only within a rupee. Anything else is a miss: the card says why — a wrong price is a trade, not a near thing.
  const diff = committed ? guess - price : 0;
  const verdict = !committed ? "none" : Math.abs(diff) <= 1 + 1e-9 ? "right" : "miss";

  return (
    <Figure
      n="0"
      prompt={
        <>
          The index is <strong>{n0(REAL.S0)}</strong> today — the level whose {REAL_DAYS}-day forward is the {n0(REAL_FORWARD)} C1's screen agreed on. In {REAL_DAYS} days, at expiry, one
          step: up to <strong>{n2(step.Su)}</strong> or down to <strong>{n2(step.Sd)}</strong> (the step is sized from the row's own wobble, {pct2(REAL_SIGMA)} a
          year; interest {pct1(REAL.r)}). A ticket pays the index minus {n0(REAL.K)} if it ends above {n0(REAL.K)} — {n2(step.fu)} at the top node — and nothing
          below. Set the odds, then price the ticket.
        </>
      }
      controls={<Slider label="chance it goes up" value={p} min={0.1} max={0.9} step={0.01} onChange={setP} role="approx" fmt={pct} width={160} />}
      observe={
        committed ? (
          <>
            The tile does not move. Spin the dial from 10 % to 90 %: the <em>average</em> payout runs from {n2(lowEnd)} to {n2(highEnd)}, and the price
            stays {n2(price)}. The price of the ticket does not depend on the odds. The next figure is how the trick is done.
          </>
        ) : (
          <>Set the dial to what you believe, type a price, lock it in. Then spin the dial and watch the tile.</>
        )
      }
    >
      <div className="c2-stage">
        <MiniBoard
          rows={1}
          width={380}
          height={260}
          bits={[1]}
          progress={0}
          bucketLabels="none"
          ariaLabel={`A one-row board: the index at ${n0(REAL.S0)} drops to ${n2(step.Su)} or ${n2(step.Sd)}`}
          nodeLabel={(r, k) => (r === 0 ? [n0(REAL.S0), { text: "today", plain: true }] : k === 1 ? [n2(step.Su), `pays ${n2(step.fu)}`] : [n2(step.Sd), "pays 0"])}
          nodeState={(r, k) => (r === 1 && k === 1 ? "lit" : r === 1 ? "dim" : undefined)}
          edges={(_r, _k, dir) => ({ opacity: 0.25 + 0.75 * (dir ? p : 1 - p), label: dir ? pct(p) : pct(1 - p) })}
        />
        <div className="c2-tiles">
          <div className={"c2-tile " + (committed ? "frozen" : "")}>
            <span className="k">price of the ticket</span>
            <span className="v">{committed ? n2(price) : "?"}</span>
            <span className="k">{committed ? "frozen — spin the dial" : "lock in your guess to see it"}</span>
          </div>
          <div className="c2-tile approx">
            <span className="k">average payout, discounted</span>
            <span className="v">{n2(demo.naive)}</span>
            <span className="k">moves with the dial</span>
          </div>
        </div>
      </div>
      <BetNumber question="Your dial is set. What is the ticket worth today, per unit of the index?" value={guess} onCommit={setGuess} committed={committed} min={0} max={2000} step={0.05}>
        <ResultCard yours={guess !== null ? n2(guess) : "—"} answer={`${n2(price)} — at every setting of the dial`} verdict={verdict}>
          Most people say about <span className="num">{n2(half)}</span> (a coin flip on {n2(step.fu)}, discounted), or "it depends on the odds". It does not. Turn the dial
          now: the amber number chases it, the price tile sits at {n2(price)}. The magician never looked at your dial — and the next figure shows what he looked at
          instead. (The screen's own price for this ticket is {n2(SCREEN_CALL)}: a board with one step is a cartoon of eleven trading days, and the last figure is
          what happens to the trick when the board is split finer and finer.)
          {verdict === "miss" && (
            <>
              {" "}
              Your {n2(guess ?? 0)} is not close, it is a trade: whoever{" "}
              {diff > 0 ? `sells you the ticket at that price and buys ${f4(step.delta)} of the index` : `buys your ticket at that price and sells ${f4(step.delta)} of the index`} keeps{" "}
              {n2(Math.abs(diff))} a unit whichever way the index goes.
            </>
          )}
        </ResultCard>
      </BetNumber>
    </Figure>
  );
}
