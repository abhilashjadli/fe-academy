import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { brownianPath, incrementSums } from "../../../engine/ito";
import { rng } from "../../../engine/random";

/** Figure 0 — the bet. As the steps get tiny, what happens to the total of the squared steps? */
export function F0Bet() {
  const [pick, setPick] = useBet<"shrinks" | "stays" | "grows">("B4-F0");
  const table = useMemo(() => {
    const r = rng(2026);
    return [4, 16, 64, 256, 1024].map((n) => {
      const { W } = brownianPath(n, 1, r);
      const s = incrementSums(W, 1);
      return { n, sum: s.sumDW, sq: s.sumDW2, sdt: s.sumDt2 };
    });
  }, []);
  return (
    <Figure
      n="0"
      prompt={
        <>
          A price wobbles up and down for a year. Chop the year into finer and finer steps and add up the <strong>square</strong> of every step.
        </>
      }
    >
      <Bet
        question="As the steps get tiny, the total of the squared wobbles…"
        options={[
          { id: "shrinks", label: "shrinks to nothing — tiny squared is tinier" },
          { id: "stays", label: "settles on one number" },
          { id: "grows", label: "blows up — there are more and more of them" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <table className="table b4-table">
          <thead>
            <tr>
              <th>steps in the year</th>
              <th>net move</th>
              <th>sum of squared moves</th>
              <th>sum of squared time-steps</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => (
              <tr key={row.n}>
                <td>{row.n}</td>
                <td className="num">{row.sum.toFixed(2)}</td>
                <td className="num b4-truth">{row.sq.toFixed(2)}</td>
                <td className="num b4-dim">{row.sdt.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ResultCard
          yours={pick === "shrinks" ? "it shrinks to nothing" : pick === "stays" ? "it settles on one number" : "it blows up"}
          answer="it settles on one number — about 1.0, the length of the year"
          verdict={pick === "stays" ? "right" : "miss"}
        >
          Each step is small, so its square is tiny — but there are many steps, and the two effects cancel exactly. The squared <em>time</em>-steps (right
          column) do vanish. The squared <em>price</em>-steps do not. Everything on this page is about that stubborn total.
        </ResultCard>
      </Bet>
      <details className="b4-more">
        <summary>If you remember the chain rule: a one-line puzzle</summary>
        <p>
          Ordinary calculus says d(W²) = 2W dW. But a fair wobble W has an average of zero, so 2∫W dW averages to zero — while W² at the end of the year
          averages to exactly 1. Something worth exactly one year is missing from the chain rule. This page finds it.
        </p>
      </details>
    </Figure>
  );
}
