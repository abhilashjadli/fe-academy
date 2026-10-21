import { useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { GaltonCanvas, type GaltonHandle } from "../GaltonCanvas";

const ROWS = 12;

export function F0Board() {
  const board = useRef<GaltonHandle>(null);
  const [bet, setBet] = useState<number | null>(null);
  const [counts, setCounts] = useState<number[]>(new Array(ROWS + 1).fill(0));
  const [dropped, setDropped] = useState(0);
  const winner = dropped > 0 ? counts.indexOf(Math.max(...counts)) : null;

  return (
    <Figure
      n="0"
      prompt={
        bet === null ? (
          <>A Galton board: a ball falls through rows of pegs, bouncing left or right at each one. <strong>Click the bucket you think will fill highest</strong>, then drop.</>
        ) : (
          <>You bet on bucket {bet}. Now drop some balls.</>
        )
      }
      controls={
        <>
          <button type="button" className="btn primary" onClick={() => board.current?.drop({ n: 20, speed: 5, interval: 260 })}>
            Drop 20 balls
          </button>
          <button type="button" className="btn" onClick={() => board.current?.drop({ n: 500, speed: 8, interval: 60 })}>
            Drop 500
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              board.current?.reset();
              setBet(null);
              setDropped(0);
            }}
          >
            Reset
          </button>
          <span className="readouts">
            <span>
              <span className="k">dropped </span>
              <span className="v">{dropped}</span>
            </span>
            {winner !== null && (
              <span>
                <span className="k">highest so far </span>
                <span className="v">bucket {winner}</span>
                {bet !== null && <span className="k"> {winner === bet ? "— your bet" : `— you said ${bet}`}</span>}
              </span>
            )}
          </span>
        </>
      }
      observe={
        <>
          No single bounce is predictable. The pile is. After a few hundred balls the buckets settle into a shape that does not depend on luck at all, and
          almost everyone bets on the middle without being able to say why. The rest of this page is the why.
        </>
      }
    >
      <GaltonCanvas
        ref={board}
        rows={ROWS}
        seed={11}
        bet={bet}
        onBucketClick={(k) => dropped === 0 && setBet(k)}
        onCountsChange={(c, d) => {
          setCounts(c);
          setDropped(d);
        }}
        ariaLabel="A Galton board with twelve rows of pegs and thirteen buckets"
      />
    </Figure>
  );
}
