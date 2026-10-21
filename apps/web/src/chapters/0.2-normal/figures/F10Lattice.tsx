import { useEffect, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { GaltonCanvas, type GaltonHandle } from "../GaltonCanvas";

const ROWS = 12;

/** Turn the board on its side: it is a lattice of up/down moves — a price path. */
export function F10Lattice() {
  const board = useRef<GaltonHandle>(null);
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

  return (
    <Figure
      n="10"
      prompt={<>Turn the board on its side.</>}
      controls={
        <>
          <button type="button" className="btn primary" onClick={() => setTarget(target === 1 ? 0 : 1)}>
            {target === 1 ? "Stand it up again" : "Rotate 90°"}
          </button>
          <button type="button" className="btn" onClick={() => board.current?.drop({ n: 300, speed: 8, interval: 60 })}>
            Drop 300
          </button>
          <button type="button" className="btn" onClick={() => board.current?.reset()}>
            Reset
          </button>
        </>
      }
      observe={
        <>
          Read it sideways and nothing has changed except the names: time runs left to right, each peg is a day on which the price steps up or down, one
          ball's route is one possible price history, and the buckets on the right are the distribution of where the price ends up — the same bell.
          This lattice is the binomial tree, and in chapter C2 you will price an option on it by working backwards through exactly these pegs. In A1 the steps
          become percentages instead of fixed amounts, and the bell on the right becomes the lognormal.
        </>
      }
    >
      <GaltonCanvas ref={board} rows={ROWS} seed={5} orientation={theta} height={400} ariaLabel="The Galton board rotating into a price lattice" />
    </Figure>
  );
}
