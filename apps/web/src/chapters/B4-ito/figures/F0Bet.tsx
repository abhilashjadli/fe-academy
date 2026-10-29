import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Curve, Label, Plot, fmt, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { brownianPath } from "../../../engine/ito";
import { rng } from "../../../engine/random";

/** Figure 0 — the bet. As the steps get tiny, what happens to the total of the squared steps? The reveal is a picture: three stills. */

const STEPS = [4, 64, 1024];
const SEEDS = [2022, 2047, 2023]; // one real path each; the totals are whatever the draws give
const T = 1;
const f2 = fmt.n(2);

/** The running total of squared steps along the year, for one path with n steps. */
function runningSquares(n: number, seed: number): { pts: Pt[]; end: number; dtSquares: number } {
  const { t, W } = brownianPath(n, T, rng(seed));
  const pts: Pt[] = [[0, 0]];
  let acc = 0;
  for (let i = 1; i <= n; i++) {
    const d = W[i] - W[i - 1];
    acc += d * d;
    pts.push([t[i], acc]);
  }
  return { pts, end: acc, dtSquares: n * (T / n) * (T / n) };
}

export function F0Bet() {
  const [pick, setPick] = useBet<"shrinks" | "stays" | "grows">("B4-F0");
  const panels = useMemo(() => STEPS.map((n, i) => ({ n, ...runningSquares(n, SEEDS[i]) })), []);
  const yMax = 1.8;

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-2)", margin: "var(--space-3) 0 var(--space-2)" }}>
          {panels.map((p, i) => (
            <div key={p.n} style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--ink-2)", padding: "0 0 2px 4px" }}>
                {p.n} steps in the year
              </div>
              <Plot
                xDomain={[0, T]}
                yDomain={[0, yMax]}
                width={260}
                height={190}
                margin={{ top: 10, right: 12, bottom: 34, left: 34 }}
                xTicks={2}
                yTicks={3}
                xLabel={i === 0 ? "time" : undefined}
                ariaLabel={`Running total of squared steps with ${p.n} steps in the year, settling near 1`}
              >
                {/* the year, as a height: the total should land here */}
                <Curve pts={[[0, 1], [T, 1]]} role="ghost" dash="4 3" width={1} smooth={false} />
                {/* squared time-steps, for contrast: they vanish */}
                <Curve pts={[[0, 0], [T, p.dtSquares]]} role="ghost" width={1.5} smooth={false} />
                <Curve pts={p.pts} role="truth" width={2} smooth={false} />
                {i === 0 && <Label at={[0.02, 1]} text="the year = 1" role="ghost" dy={-5} />}
                {i === 0 && <Label at={[0.02, p.dtSquares]} text="squared time-steps" role="ghost" dy={-5} />}
                <Label at={[T, p.end]} text={f2(p.end)} role="truth" anchor="end" dx={-4} dy={p.end > 1.1 ? 14 : -7} />
              </Plot>
            </div>
          ))}
        </div>
        <Readouts items={panels.map((p) => [`squares with ${p.n} steps`, <span className="b4-truth">{f2(p.end)}</span>])} />
        <ResultCard
          yours={pick === "shrinks" ? "it shrinks to nothing" : pick === "stays" ? "it settles on one number" : "it blows up"}
          answer="it settles on one number — about 1.0, the length of the year"
          verdict={pick === "stays" ? "right" : "miss"}
        >
          Each step is small, so its square is tiny — but there are many steps, and the two effects cancel exactly. The grey line of squared <em>time</em>
          -steps does vanish as the steps get finer. The blue total of squared <em>price</em>-steps climbs like a clock and lands on the year. Everything on this page is
          about that stubborn total.
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
