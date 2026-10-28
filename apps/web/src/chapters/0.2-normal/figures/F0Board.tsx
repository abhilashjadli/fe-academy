import { useEffect, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { ResultCard, useBet } from "../../../ui/Bet";
import { GaltonCanvas, type GaltonHandle } from "../GaltonCanvas";

const ROWS = 12;
const REVEAL_AT = 150; // balls before the pile is trusted enough to call the bet

/** Bet on a bucket, drop, get a result card. Last beat: turn the board on its side. */
export function F0Board() {
  const board = useRef<GaltonHandle>(null);
  const [pick, setPick] = useBet<string>("0.2-F0");
  const bet = pick === null ? null : parseInt(pick, 10);
  const [counts, setCounts] = useState<number[]>(new Array(ROWS + 1).fill(0));
  const [dropped, setDropped] = useState(0);
  const winner = dropped > 0 ? counts.indexOf(Math.max(...counts)) : null;
  const revealed = bet !== null && winner !== null && dropped >= REVEAL_AT;
  const verdict = !revealed ? "none" : winner === bet ? "right" : Math.abs((winner as number) - bet) === 1 ? "close" : "miss";
  const share = dropped > 0 && winner !== null ? Math.round((100 * counts[winner]) / dropped) : 0;

  // the rotation beat
  const [theta, setTheta] = useState(0);
  const [target, setTarget] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const step = () => {
      setTheta((t) => {
        const d = target - t;
        if (Math.abs(d) < 0.005) return target;
        raf.current = requestAnimationFrame(step);
        return t + d * 0.08;
      });
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  const sideways = target === 1;

  return (
    <Figure
      n="0"
      prompt={
        bet === null ? (
          <>
            A ball falls through rows of pegs, bouncing left or right at each one. <strong>Click the bucket you think will fill highest</strong>, then drop.
          </>
        ) : dropped === 0 ? (
          <>You bet on bucket {bet}. (Click another bucket to change it.) Now drop some balls.</>
        ) : (
          <>You bet on bucket {bet}. Keep dropping until the pile settles.</>
        )
      }
      controls={
        <>
          <button type="button" className="btn primary" disabled={bet === null || sideways} onClick={() => board.current?.drop({ n: 20, speed: 5, interval: 260 })}>
            Drop 20 balls
          </button>
          <button type="button" className="btn" disabled={bet === null || sideways} onClick={() => board.current?.drop({ n: 500, speed: 8, interval: 60 })}>
            Drop 500
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              board.current?.reset();
              setPick(null);
              setDropped(0);
              setTarget(0);
            }}
          >
            Reset
          </button>
          {revealed && (
            <button type="button" className="btn" onClick={() => setTarget(sideways ? 0 : 1)}>
              {sideways ? "Stand it up again" : "Turn it on its side"}
            </button>
          )}
          <span className="readouts">
            <span>
              <span className="k">dropped </span>
              <span className="v">{dropped}</span>
            </span>
            {winner !== null && (
              <span>
                <span className="k">highest so far </span>
                <span className="v">bucket {winner}</span>
              </span>
            )}
          </span>
        </>
      }
      observe={
        sideways ? (
          <>
            Read it sideways and nothing changed but the names: time runs left to right, each peg is a day on which something steps up or down, one ball's route is one
            possible history, and the buckets on the right are where the histories end up — the same pile.
          </>
        ) : (
          <>
            No single bounce is predictable. The pile is. After a few hundred balls the buckets settle into a shape that owes nothing to luck, and almost everyone bets on
            the middle without being able to say why. The rest of this page is the why.
          </>
        )
      }
    >
      <GaltonCanvas
        ref={board}
        rows={ROWS}
        seed={11}
        bet={bet}
        orientation={theta}
        onBucketClick={(k) => dropped === 0 && setPick(String(k))}
        onCountsChange={(c, d) => {
          setCounts(c);
          setDropped(d);
        }}
        ariaLabel="A Galton board with twelve rows of pegs and thirteen buckets"
      />
      {revealed && !sideways && (
        <div className="n2-result">
          <ResultCard yours={`bucket ${bet}`} answer={`bucket ${winner} won, with ${share} % of ${dropped} balls`} verdict={verdict}>
            {verdict === "right"
              ? "Almost everyone picks the middle, and almost nobody can say why. "
              : "The middle wins, and it wins every time you try. "}
            A ball reaches bucket {winner} by more routes than any other bucket — that is the whole reason, and the next three figures count those routes.
          </ResultCard>
        </div>
      )}
    </Figure>
  );
}
