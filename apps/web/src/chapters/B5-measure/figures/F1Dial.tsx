import { useMemo, useState } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider, Toggle } from "../../../ui/controls";
import { Avatar, Says } from "../../../ui/Comic";
import { oneStep } from "../../../engine/binomial";
import { priceUnderEveryBelief } from "../../../engine/measure";
import "./figures.css";

/**
 * Figure 1 — the spine: a dial that moves nothing. Priya's belief 10 % → 90 %; two needles on one ruler — what she expects the ticket to pay
 * (swings 0.10 → 0.90) and what Raj charges (0.633, does not move). One toggle widens the range to 23 / 17: Raj's needle jumps to 1.17 at once.
 */

const HULL = { S0: 20, u: 1.1, d: 0.9, K: 21, r: 0.12, T: 0.25 } as const;
const WIDE = { ...HULL, u: 1.15, d: 0.85 } as const;
const f2 = format(".2f");
const f3 = format(".3f");
const f0 = format(",.0f");
const pct0 = format(".0%");

function Ruler({ priya, raj, max }: { priya: number; raj: number; max: number }) {
  const W = 480,
    H = 150;
  const x0 = 28,
    x1 = W - 24;
  const xOf = (v: number) => x0 + ((x1 - x0) * v) / max;
  const yBar = 82;
  const ticks = Array.from({ length: Math.round(max / 0.25) + 1 }, (_, i) => i * 0.25);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`One ruler, two needles: Priya expects ${f2(priya)}, Raj charges ${f3(raj)}`}>
      <line className="bar" x1={x0} x2={x1} y1={yBar} y2={yBar} />
      {ticks.map((t) => (
        <g key={t}>
          <line className="tick" x1={xOf(t)} x2={xOf(t)} y1={yBar - 5} y2={yBar + 5} />
          <text className="tick-lbl" x={xOf(t)} y={yBar + 18} textAnchor="middle">
            {f2(t)}
          </text>
        </g>
      ))}
      {/* Priya's needle, from above */}
      <g className="needle" style={{ transform: `translateX(${xOf(priya)}px)` }}>
        <path d={`M0 ${yBar - 2} L-7 ${yBar - 16} L7 ${yBar - 16} Z`} fill="var(--truth)" />
        <line x1={0} x2={0} y1={yBar - 16} y2={yBar - 40} stroke="var(--truth)" strokeWidth="2" />
        <svg x={-14} y={yBar - 68} width={28} height={28} viewBox="0 0 48 48" overflow="visible">
          <Avatar name="Priya" mood="happy" size={48} title="Priya" />
        </svg>
        <text className="needle-lbl priya" x={priya / max > 0.62 ? -18 : 18} y={yBar - 46} textAnchor={priya / max > 0.62 ? "end" : "start"}>
          Priya expects {f2(priya)}
        </text>
      </g>
      {/* Raj's needle, from below */}
      <g className="needle" style={{ transform: `translateX(${xOf(raj)}px)` }}>
        <path d={`M0 ${yBar + 2} L-7 ${yBar + 16} L7 ${yBar + 16} Z`} fill="var(--error)" />
        <line x1={0} x2={0} y1={yBar + 16} y2={yBar + 34} stroke="var(--error)" strokeWidth="2" />
        <svg x={-14} y={yBar + 34} width={28} height={28} viewBox="0 0 48 48" overflow="visible">
          <Avatar name="Raj" mood="neutral" size={48} title="Raj" />
        </svg>
        <text className="needle-lbl raj" x={raj / max > 0.62 ? -18 : 18} y={yBar + 54} textAnchor={raj / max > 0.62 ? "end" : "start"}>
          Raj charges {f3(raj)}
        </text>
      </g>
    </svg>
  );
}

export function F1Dial() {
  const [belief, setBelief] = useState(0.7);
  const [wide, setWide] = useState(false);
  const input = wide ? WIDE : HULL;
  const step = useMemo(() => oneStep(input), [input]);
  // Raj's price does not depend on the belief: the engine says so for this belief and every other
  const raj = priceUnderEveryBelief(input, [belief])[0];
  const priya = belief * step.fu + (1 - belief) * step.fd; // what she expects the ticket to pay
  // a pays-1-if-up ticket on the wide board, for the observe: the engine's fair weight on "up", discounted (the price per unit of payoff)
  const perUnitWide = step.f / step.fu;

  return (
    <Figure
      n="1"
      prompt={<>Same stock, same ticket — the right to buy at 21. Turn Priya's belief and watch the two needles. Then widen the range.</>}
      controls={
        <>
          <Slider label="Priya's belief it goes up" value={belief} min={0.1} max={0.9} step={0.01} onChange={setBelief} role="truth" fmt={pct0} width={140} />
          <Toggle label={wide ? "range: 23 / 17 (back to 22 / 18)" : "widen the range to 23 / 17"} on={wide} onChange={setWide} />
        </>
      }
      observe={
        wide ? (
          <>
            On the 23 / 17 board the same ticket — the right to buy at 21 — pays <strong>2</strong> when the stock is 23, not 1. Raj's needle jumps {f3(oneStep(HULL).f)} → {f3(raj)}, and the bigger payoff is most of why: per unit of payoff the wide board is a little <em>cheaper</em>, {f3(perUnitWide)}, because the fair weight on "up" falls. Either way it was the range of futures that moved the price. Priya's belief is still nowhere in it — slide it and his needle stays put. How far the stock can go sets the price; how likely she thinks each way is does not.
          </>
        ) : (
          <>
            Priya's needle swings 0.10 → 0.90; Raj's sits at 0.633. Her odds were never in his two columns. Now widen the range: the stock can reach 23 or 17, the ticket pays 2 or 0, and his needle moves at once.
          </>
        )
      }
    >
      <div className="b5-stage b5-stage-col">
        <Says who="Priya" mood="smug">
          Fine. But if I were <em>sure</em> — ninety percent — surely it is worth more.
        </Says>
        <div className="b5-ruler">
          <Ruler priya={priya} raj={raj} max={2} />
        </div>
        <div className="b5-side b5-side-row">
          <Readouts
            items={[
              [
                "Priya expects the ticket to pay",
                <span key="p" className="b5-priya">
                  {f2(priya)}
                </span>,
              ],
              [
                "Raj charges",
                <span key="r" className="b5-raj">
                  {f3(raj)}
                </span>,
              ],
              ["the stock in three months", `${f0(step.Su)} or ${f0(step.Sd)} — the right to buy at 21 pays ${f0(step.fu)} or ${f0(step.fd)}`],
            ]}
          />
          <div className={"b5-note " + (wide ? "lit" : "")}>{wide ? `the range moved Raj's needle: ${f3(oneStep(HULL).f)} → ${f3(raj)} (the ticket now pays ${f0(step.fu)}, not 1)` : "Raj's needle has not moved since you arrived"}</div>
        </div>
      </div>
    </Figure>
  );
}
