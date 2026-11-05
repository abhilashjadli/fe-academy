import { useMemo, useState } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { BetNumber, ResultCard } from "../../../ui/Bet";
import { Says, Who } from "../../../ui/Comic";
import { MiniBoard } from "../../0.2-normal/MiniBoard";
import { oneStep, realWorldProbability } from "../../../engine/binomial";
import "./figures.css";

/**
 * Figure 0 — guess-then-reveal on a drawing. Hull's one-step example (20 → 22 / 18, three months, 12 %), a ticket that pays 1 if 22.
 * Priya (70 % up) says seventy paise. The reader types a price. The reveal is Raj's drawing: sell the ticket, buy a quarter share,
 * and the two columns — if 22 / if 18 — both end at 4.50. Result card under the drawing: your number, 0.633, the usual answers.
 */

const HULL = { S0: 20, u: 1.1, d: 0.9, K: 21, r: 0.12, T: 0.25 } as const;
const MU = 0.16; // Hull p. 205: a 16 % expected return gives the 70 % real-world odds
const f2 = format(".2f");
const f3 = format(".3f");
const f0 = format(",.0f");
const pct0 = format(".0%");

/** Raj's drawing: a quarter share in each future, minus the ticket where it pays; both columns end at the same height. */
function RajDrawing({ delta, Su, Sd, fu, fd, portfolio }: { delta: number; Su: number; Sd: number; fu: number; fd: number; portfolio: number }) {
  const W = 360,
    H = 230;
  const base = 196;
  const yOf = (v: number) => base - v * 26; // 6 units of value ≈ 156 px
  const col = (x: number, S: number, f: number, label: string) => {
    const shares = delta * S;
    return (
      <g>
        <rect x={x - 34} y={yOf(shares)} width={68} height={base - yOf(shares)} fill="var(--ghost)" opacity="0.35" stroke="var(--ink-2)" strokeWidth="1" />
        {f > 0 && <rect x={x - 34} y={yOf(shares)} width={68} height={yOf(shares - f) - yOf(shares)} fill="var(--error-soft)" stroke="var(--error)" strokeWidth="1.2" />}
        <text className="lbl ink" x={x} y={base + 16} textAnchor="middle">
          {label}
        </text>
        <text className="lbl" x={x} y={base - 10} textAnchor="middle">
          ¼ share = {f2(shares)}
        </text>
        {f > 0 && (
          <text className="lbl raj" x={x} y={yOf(shares) - 5} textAnchor="middle">
            pay the ticket −{f2(f)}
          </text>
        )}
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Raj's drawing: in both futures a quarter share minus the ticket is worth 4.50">
      <line x1={30} x2={W - 20} y1={base} y2={base} stroke="var(--axis)" />
      {col(118, Su, fu, `if ${f0(Su)}`)}
      {col(248, Sd, fd, `if ${f0(Sd)}`)}
      <line x1={70} x2={W - 24} y1={yOf(portfolio)} y2={yOf(portfolio)} stroke="var(--error)" strokeWidth="1.5" strokeDasharray="5 4" />
      <text className="lbl raj" x={W - 24} y={yOf(portfolio) - 6} textAnchor="end">
        {f2(portfolio)} either way
      </text>
      <text className="lbl" x={30} y={18}>
        Raj: sell her the ticket, buy ¼ of a share
      </text>
    </svg>
  );
}

export function F0Odds() {
  const [guess, setGuessState] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem("fe-bet:B5-F0");
      return v === null ? null : parseFloat(v);
    } catch {
      return null;
    }
  });
  const setGuess = (v: number | null) => {
    setGuessState(v);
    try {
      if (v === null) localStorage.removeItem("fe-bet:B5-F0");
      else localStorage.setItem("fe-bet:B5-F0", String(v));
    } catch {
      /* ignore */
    }
  };
  const committed = guess !== null;
  const step = useMemo(() => oneStep(HULL), []);
  const q = useMemo(() => realWorldProbability(HULL.u, HULL.d, MU, HULL.T), []); // 0.7041 — Priya's 70 %
  const price = step.f; // 0.633
  const priyaPrice = Math.round(q * 100) / 100; // "about seventy paise"
  const pocket = priyaPrice - price; // 0.067 a ticket
  // "right" only within a paisa of 0.633. Anything else is a miss: the card says why — a wrong price is a trade, not a near thing.
  const diff = committed ? guess - price : 0;
  const verdict = !committed ? "none" : Math.abs(diff) <= 0.01 + 1e-9 ? "right" : "miss";

  return (
    <Figure
      n="0"
      prompt={
        <>
          A stock is <strong>20</strong>. In three months it will be <strong>22</strong> or <strong>18</strong> — the textbook's numbers, and so is the 12 % a year interest. A ticket is the <strong>right to buy the stock at 21</strong> in three months — it pays <strong>1</strong> if the stock is 22, nothing if it is 18. What is the ticket worth today?
        </>
      }
      observe={
        committed ? (
          <>
            Both columns end at 4.50, so Raj holds a sure 4.50 — worth 4.367 today. His quarter share cost 5. The ticket is the gap: 0.633. Nowhere in the drawing is the 70 %. If Priya pays 0.70, Raj pockets 0.067 a ticket, every time.
          </>
        ) : (
          <>Priya has a belief. Raj, who sets odds for a living, has not said a word yet. Type your price and lock it in.</>
        )
      }
    >
      <div className="b5-stage">
        <div className="b5-side">
          <Says who="Priya" mood="happy">
            Seventy percent it goes up — so about seventy paise.
          </Says>
          {committed && (
            <Says who="Raj" mood="neutral">
              I never said how likely. I sold her the ticket and bought a quarter of a share. Look at the two columns.
            </Says>
          )}
        </div>
        {!committed ? (
          <MiniBoard
            rows={1}
            width={360}
            height={240}
            bits={[1]}
            progress={0}
            bucketLabels="none"
            ariaLabel="A one-row board: the stock at 20 goes to 22 or 18; Priya's odds on the edges"
            nodeLabel={(r, k) => (r === 0 ? ["20", { text: "today", plain: true }] : k === 1 ? ["22", "pays 1"] : ["18", "pays 0"])}
            nodeState={(r, k) => (r === 1 && k === 1 ? "lit" : r === 1 ? "dim" : undefined)}
            edges={(_r, _k, dir) => ({ opacity: 0.25 + 0.75 * (dir ? q : 1 - q), label: dir ? `Priya: ${pct0(q)}` : pct0(1 - q) })}
          />
        ) : (
          <div className="b5-drawing">
            <RajDrawing delta={step.delta} Su={step.Su} Sd={step.Sd} fu={step.fu} fd={step.fd} portfolio={step.portfolio} />
          </div>
        )}
      </div>
      <BetNumber question="Your price for the ticket, today?" value={guess} onCommit={setGuess} committed={committed} min={0} max={5} step={0.01}>
        <ResultCard yours={guess !== null ? f3(guess) : "—"} answer={`${f3(price)} — from Raj's drawing, not from anyone's odds`} verdict={verdict}>
          The usual answers are <span className="num">0.50</span> (half of a 1), <span className="num">0.70</span> (Priya's), or "it depends on the odds". A sure {f2(step.portfolio)} in three months is {f3(step.pv)} today; the quarter share cost {f2(HULL.S0 * step.delta)}; the ticket is the difference, {f3(price)}. <Who name="Priya" />'s 0.70 is free money for <Who name="Raj" />: {f3(pocket)} a ticket, ₹{f0(pocket * 10000)} on a 10,000-lot, whichever way the stock goes.
          {verdict === "miss" && Math.abs((guess ?? 0) - priyaPrice) < 0.005 ? (
            <> Yours is Priya's number, so that 0.067 a ticket comes out of your pocket. A price is not nearly right or nearly wrong — it is either the drawing's number or a trade against you.</>
          ) : verdict === "miss" && (
            <>
              {" "}
              So is yours: at {f3(guess ?? 0)} Raj {diff > 0 ? "sells you the ticket and buys a quarter share" : "buys your ticket and sells a quarter share"}, and keeps{" "}
              {f3(Math.abs(diff))} a ticket whatever the stock does. A price is not nearly right or nearly wrong — it is either the drawing's number or a trade against you.
            </>
          )}
        </ResultCard>
      </BetNumber>
    </Figure>
  );
}
