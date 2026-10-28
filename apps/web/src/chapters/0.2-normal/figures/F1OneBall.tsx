import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { MiniBoard } from "../MiniBoard";
import { rng } from "../../../engine/random";

const ROWS = 5;

/** One ball, one peg per click: ±1 at each peg, the running sum, the bucket as the sum. */
export function F1OneBall() {
  const [seed, setSeed] = useState(3);
  const bits = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: ROWS }, () => (r() < 0.5 ? 1 : 0) as number);
  }, [seed]);
  const sum = bits.reduce((a, b) => a + (b ? 1 : -1), 0);
  const steps = [
    { caption: <>A smaller board: five rows. At every peg the ball goes left (−1) or right (+1), each with probability ½. Click Forward to watch one bounce at a time.</> },
    ...bits.map((b, i) => ({
      caption: (
        <>
          Peg {i + 1}: it goes <strong>{b ? "right (+1)" : "left (−1)"}</strong>. Running sum so far:{" "}
          <span className="num">{(() => { const s = bits.slice(0, i + 1).reduce((a, x) => a + (x ? 1 : -1), 0); return (s > 0 ? "+" : "") + s; })()}</span>.
        </>
      ),
    })),
    {
      caption: (
        <>
          It lands in the bucket labelled <strong>{sum > 0 ? "+" : ""}{sum}</strong> — the sum of its five ±1 steps. A bucket is a sum of coin flips, and its label is the total.
        </>
      ),
    },
  ];
  return (
    <Figure
      n="1"
      prompt="One ball, one peg at a time."
      controls={
        <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
          New ball
        </button>
      }
    >
      <StepThrough key={seed} steps={steps} render={(i) => <MiniBoard rows={ROWS} bits={bits} progress={i} arrows showSum bucketLabels="sum" />} />
    </Figure>
  );
}
