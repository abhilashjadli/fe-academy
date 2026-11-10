import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Says } from "../../../ui/Comic";
import { Readouts, Slider } from "../../../ui/controls";
import { edgePerDay } from "../../../engine/hedge";
import { CLOCK_DAY, G0, POS, WEEK, pct1, rs, rsSigned, short, useNarrow } from "./week";

/**
 * Figure 2 — the referee's card. Illustrated text with one dial: what the index wobbled at (5 → 30 %). Two bars per day,
 * what the clock pays Raj (priced at the 15.9 % he sold) against what the bend charges him at the dial's wobble; they tie
 * at 15.9 %. The track under the bars carries the dial, the tie and the real week's wobble so far.
 */

const LO = 5,
  HI = 30;
/** the per-day cost of the bend for the position when the index wobbles at σ (rupees, positive): ½ Γ F² σ² × units / 365, sign flipped for Raj */
function bendPerDay(sigma: number): number {
  return (-POS.units * 0.5 * G0.gamma * POS.F0 * POS.F0 * sigma * sigma) / 365;
}

export function F2Referee() {
  const realised = WEEK.realised;
  const narrow = useNarrow();
  const [wob, setWob] = useState(100 * realised); // in %, default the real week so far (exact; the slider snaps to 0.1 once moved)
  const sigma = wob / 100;
  const edge = edgePerDay(G0, POS.F0, POS.units, sigma, POS.sigmaSold);
  const clockBar = bendPerDay(POS.sigmaSold);
  const bendBar = bendPerDay(sigma);
  const edgeReal = edgePerDay(G0, POS.F0, POS.units, realised, POS.sigmaSold);

  // picture geometry
  const W = 440,
    H = 272;
  const maxBar = bendPerDay(HI / 100);
  const barH = (v: number) => (v / maxBar) * 128;
  const bx1 = 70,
    bx2 = 230,
    bw = 90,
    base = 164;
  const tx = (p: number) => 30 + ((p - LO) / (HI - LO)) * (W - 60);
  const ty = 236;
  const topMin = base - Math.max(barH(clockBar), barH(bendBar));

  return (
    <Figure
      n="2"
      prompt={
        <>
          Why {pct1(POS.sigmaSold)} is the number on the referee's card. Turn the dial to any wobble the index might have had and watch what the bend costs Raj per day
          against what the clock pays him.
        </>
      }
      controls={
        <>
          <Slider label={narrow ? "index wobbled at" : "what the index wobbled at"} value={wob} min={LO} max={HI} step={0.1} onChange={setWob} fmt={(v) => v.toFixed(1) + " %"} role="approx" />
          <Readouts
            items={[
              [`realised, ${WEEK.realisedDays} real days`, pct1(realised)],
              ["sold", pct1(POS.sigmaSold)],
              ["Raj's edge, per day", <span className={edge >= 0 ? "d1-truth" : "d1-err"}>{rsSigned(edge)}</span>],
            ]}
          />
        </>
      }
      observe={
        <>
          The bars tie at <strong>{pct1(POS.sigmaSold)}</strong> and nowhere else: a hedged option breaks even when the index wobbles at the vol it was sold at. Below it Raj is
          paid more than the bend costs; above it, less. The market's {WEEK.realisedDays} real days{WEEK.complete ? "" : " so far"} wobbled at <strong>{pct1(realised)}</strong>, worth {rsSigned(edgeReal)} a day
          to him — and that is the only sense in which theta was ever his profit.
        </>
      }
    >
      <div className="d1-ref">
        <div className="d1-ref-pic">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Two bars, the clock paying and the bend charging, over a track of wobbles with the tie at 15.9 %">
            {/* bars */}
            <rect x={bx1} y={base - barH(clockBar)} width={bw} height={barH(clockBar)} fill="var(--truth)" opacity="0.85" />
            <rect x={bx2} y={base - barH(bendBar)} width={bw} height={barH(bendBar)} fill="var(--approx)" opacity="0.85" />
            <line x1={bx1 - 24} x2={bx2 + bw + 24} y1={base} y2={base} className="track" />
            <text className="bar-t" x={bx1 + bw / 2} y={base + 16} textAnchor="middle">
              the clock pays Raj
            </text>
            <text className="bar-v" x={bx1 + bw / 2} y={base + 31} textAnchor="middle" fill="var(--truth-text)">
              priced at {pct1(POS.sigmaSold)}
            </text>
            <text className="bar-t" x={bx2 + bw / 2} y={base + 16} textAnchor="middle">
              the bend charges him
            </text>
            <text className="bar-v" x={bx2 + bw / 2} y={base + 31} textAnchor="middle" fill="var(--approx-text)">
              at {wob.toFixed(1)} %
            </text>
            {/* the gap between the bar tops */}
            <line x1={bx1 + bw} x2={bx2} y1={base - barH(clockBar)} y2={base - barH(clockBar)} className="tick" strokeDasharray="3 3" />
            <line x1={bx2 - 1} x2={bx2 - 1} y1={base - barH(clockBar)} y2={base - barH(bendBar)} stroke={edge >= 0 ? "var(--truth)" : "var(--error)"} strokeWidth="2" />
            <text className="edge-t" x={(bx1 + bw + bx2) / 2} y={topMin - 10} textAnchor="middle" fill={edge >= 0 ? "var(--truth-text)" : "var(--error-text)"}>
              {edge >= 0 ? "Raj keeps" : "Raj pays"} {rs(Math.abs(edge))} a day
            </text>
            {/* the track */}
            <line x1={tx(LO)} x2={tx(HI)} y1={ty} y2={ty} className="track" />
            {[5, 10, 15, 20, 25, 30].map((p) => (
              <g key={p}>
                <line x1={tx(p)} x2={tx(p)} y1={ty - 4} y2={ty + 4} className="tick" />
                <text className="axis-t" x={tx(p)} y={ty + 16} textAnchor="middle">
                  {p} %
                </text>
              </g>
            ))}
            {/* the tie */}
            <line x1={tx(100 * POS.sigmaSold)} x2={tx(100 * POS.sigmaSold)} y1={ty - 14} y2={ty + 4} stroke="var(--truth)" strokeWidth="2" />
            <text className="mark-t" x={tx(100 * POS.sigmaSold)} y={ty - 18} textAnchor="middle" fill="var(--truth-text)">
              the tie · sold {pct1(POS.sigmaSold)}
            </text>
            {/* the real week so far */}
            <line x1={tx(100 * realised)} x2={tx(100 * realised)} y1={ty - 14} y2={ty + 4} stroke="var(--error)" strokeWidth="2" />
            <text className="mark-t" x={tx(100 * realised)} y={ty + 30} textAnchor={100 * realised < 11 ? "start" : "middle"} fill="var(--error-text)">
              the real week{WEEK.complete ? "" : " so far"} {pct1(realised)}
            </text>
            {/* the dial */}
            <circle cx={tx(wob)} cy={ty} r="6" fill="var(--approx)" stroke="var(--surface-figure)" strokeWidth="2" />
          </svg>
        </div>
        <div className="d1-ref-text">
          <p>
            Every day the clock hands Raj the same sum — Figure 0's {rs(CLOCK_DAY)}, give or take the interest on his premium — and that sum is the bend's cost{" "}
            <em>priced at {pct1(POS.sigmaSold)}</em>, the wobble the model assumed when it set his premium. What the bend actually costs him is set by the wobble the index actually has. Turn the dial to a calm market and the second bar
            shrinks — Raj keeps the difference. Turn it to a wild one and the bend outruns the clock.
          </p>
          <p>
            So the referee's card is not a forecast; it is the break-even. Whatever the index does, Raj's daily edge is the gap between the two bars, and the gap is zero
            at exactly one wobble: the one he sold.
          </p>
          <Says who="Mel" mood="thinking">
            So theta is your profit?
          </Says>
          <Says who="Raj" mood="neutral">
            Theta is what I'm paid to take the bend. My profit is the gap between what the index did and what I sold — {pct1(realised)} against {pct1(POS.sigmaSold)}{WEEK.complete ? "" : " so far"}, {short(edgeReal)} a day.
          </Says>
        </div>
      </div>
    </Figure>
  );
}
