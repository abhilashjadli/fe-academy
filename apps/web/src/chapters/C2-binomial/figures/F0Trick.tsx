import { useMemo, useState } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { BetNumber, ResultCard } from "../../../ui/Bet";
import { Slider } from "../../../ui/controls";
import { MiniBoard } from "../../0.2-normal/MiniBoard";
import { beliefDemonstrator, oneStep } from "../../../engine/binomial";
import "./figures.css";

/**
 * Figure 0 — the bet, then the trick. Hull's one-step example (20 → 22 / 18, the right to buy at 21, three months, 12 %):
 * the reader sets a chance-of-up dial to their belief, types a price, and the price tile reads 0.633 and freezes while the dial keeps moving.
 */

const HULL = { S0: 20, u: 1.1, d: 0.9, K: 21, r: 0.12, T: 0.25 } as const;
const f3 = format(".3f");
const pct = format(".0%");

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
  const step = useMemo(() => oneStep(HULL), []);
  const demo = beliefDemonstrator(HULL, [p])[0];
  const price = step.f; // 0.633, whatever the dial says
  const gap = committed ? Math.abs(guess - price) : 0;
  const verdict = !committed ? "none" : gap < 0.05 ? "right" : gap < 0.15 ? "close" : "miss";

  return (
    <Figure
      n="0"
      prompt={
        <>
          A stock is <strong>20</strong>. In three months it will be <strong>22</strong> or <strong>18</strong> — the textbook's numbers, so is everything else here. Interest is 12 % a year. A ticket pays <strong>1</strong> if the stock is 22 (the right to buy at 21), nothing if it is 18. Set the odds, then price the ticket.
        </>
      }
      controls={<Slider label="chance it goes up" value={p} min={0.1} max={0.9} step={0.01} onChange={setP} role="approx" fmt={pct} width={160} />}
      observe={
        committed ? (
          <>
            The tile does not move. Spin the dial from 10 % to 90 %: the <em>average</em> payout runs from 0.10 to 0.87, and the price stays 0.633. The price of the ticket does not depend on the odds. The next figure is how the trick is done.
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
          ariaLabel="A one-row board: the stock at 20 drops to 22 or 18"
          nodeLabel={(r, k) => (r === 0 ? ["20", { text: "today", plain: true }] : k === 1 ? ["22", "pays 1"] : ["18", "pays 0"])}
          nodeState={(r, k) => (r === 1 && k === 1 ? "lit" : r === 1 ? "dim" : undefined)}
          edges={(_r, _k, dir) => ({ opacity: 0.25 + 0.75 * (dir ? p : 1 - p), label: dir ? pct(p) : pct(1 - p) })}
        />
        <div className="c2-tiles">
          <div className={"c2-tile " + (committed ? "frozen" : "")}>
            <span className="k">price of the ticket</span>
            <span className="v">{committed ? f3(price) : "?"}</span>
            <span className="k">{committed ? "frozen — spin the dial" : "lock in your guess to see it"}</span>
          </div>
          <div className="c2-tile approx">
            <span className="k">average payout, discounted</span>
            <span className="v">{f3(demo.naive)}</span>
            <span className="k">moves with the dial</span>
          </div>
        </div>
      </div>
      <BetNumber question="Your dial is set. What is the ticket worth today?" value={guess} onCommit={setGuess} committed={committed} min={0} max={5} step={0.01}>
        <ResultCard yours={guess !== null ? f3(guess) : "—"} answer="0.633 — at every setting of the dial" verdict={verdict}>
          Most people say about <span className="num">0.50</span> (half of a 1), or "it depends on the odds". It does not. Turn the dial now: the amber number chases it, the price tile sits at 0.633. The magician never looked at your dial — and the next figure shows what he looked at instead.
        </ResultCard>
      </BetNumber>
    </Figure>
  );
}
