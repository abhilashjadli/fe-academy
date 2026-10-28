import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Ledger } from "../../../ui/Ledger";
import { Segmented } from "../../../ui/controls";
import { Who } from "../../../ui/Comic";
import { overstatementFactor } from "../../../engine/ito";

type Sig = "20" | "40";

/** Figure 4 — the bug that overprices. Guess, then build the ln S ledger. */
export function F4Bug() {
  const [sig, setSig] = useState<Sig>("40");
  const [pick, setPick] = useBet<"0" | "2" | "8" | "20">("B4-F4");
  const s = sig === "20" ? 0.2 : 0.4;
  const over = overstatementFactor(s, 1);
  const pct = ((over - 1) * 100).toFixed(1);
  const right = sig === "40" ? "8" : "2";
  const half = 0.5 * s * s;

  return (
    <Figure
      n="4"
      prompt={
        <>
          A desk simulates a stock for a year by multiplying today's price by e<sup>(drift + jitter)</sup> — and forgets Ada's square. By how much does it
          overstate the average price?
        </>
      }
      controls={
        <Segmented
          label="the stock's yearly wobble σ"
          options={[
            { id: "20", label: "20 % (an index)" },
            { id: "40", label: "40 % (a single stock)" },
          ]}
          value={sig}
          onChange={(v) => {
            setSig(v);
            setPick(null);
          }}
        />
      }
      observe={
        <>
          The slope line of ln S is straight; the curve bends down. A jittery step lands on the curve, not the line, so every step loses a sliver — half the
          curvature times the step squared. Multiply by a year of steps and the loss is exactly ½σ². Forget it and your simulated average is too high.
        </>
      }
    >
      <Bet
        question={`At σ = ${sig} %, a simulation without the correction overstates the average by…`}
        options={[
          { id: "0", label: "nothing — the jitter averages out" },
          { id: "2", label: "about 2 %" },
          { id: "8", label: "about 8 %" },
          { id: "20", label: "about 20 %" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <ResultCard yours={pick === "0" ? "nothing" : `about ${pick} %`} answer={`${pct} % — the factor is e^{½σ²} = ${over.toFixed(3)}`} verdict={pick === right ? "right" : pick === "0" ? "miss" : "close"}>
          Here is where the number comes from, one line at a time.
        </ResultCard>
        <Ledger
          rows={[
            { label: "Take f = ln S. Its slope is", work: "1 / S", value: "1/S", role: "approx" },
            { label: "Its bend (second derivative) is", work: "−1 / S²", value: "−1/S²", role: "truth", note: "Negative: ln curves downward. The triangle under the slope line points down." },
            { label: "One step's jitter in S is about", work: `σ · S · √Δt = ${s} S √Δt`, value: "σS√Δt" },
            { label: "The corner square for that step: ½ × bend × jitter²", work: `½ × (−1/S²) × (${s} S)² Δt`, value: `−${half.toFixed(2)} Δt`, role: "truth", note: "The S cancels. The sliver lost per step depends only on σ." },
            { label: "Over a year, the steps add up to", work: `−${half.toFixed(2)} × 1`, value: `−${half.toFixed(2)}`, role: "truth" },
            { label: "So the typical year ends at", work: `mean × e^{−${half.toFixed(2)}}`, value: `mean × ${Math.exp(-half).toFixed(3)}`, role: "approx" },
            { label: "Forget the sliver and you overstate the mean by", work: `1 / ${Math.exp(-half).toFixed(3)}`, value: `${over.toFixed(3)} — that is ${pct} %`, role: "error", note: <>In chapter A1, <Who name="Mel" /> bet 1 % a day for 250 days: ½ × 0.01² × 250 = 0.0125, and her typical year ended at 100 × e<sup>−0.0125</sup> = 98.76. Same sliver, same reason.</> },
          ]}
        />
      </Bet>
    </Figure>
  );
}
