import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Readouts, Slider } from "../../../ui/controls";
import { black76, cloud, cloudStats, shareAbove } from "../../../engine/bs";
import { CloudPlot } from "./Cloud";
import { BASE, DIAL, KEY, ROW, n0, n2, pct1, rs } from "./c3";
import "./figures.css";

/**
 * Figure 1 — the box opens: 2,000 equally likely futures of the index 11 days from now, centred on the forward. A strike line
 * you drag and the wobble dial again. Dots above the line light; readouts: share lit, average payout of a lit dot, and the
 * price = average payout over all 2,000 × discount. Bet before the dial moves: widen the wobble from 16 % to 30 % — does the
 * share above 22,600 rise, fall or stay? It falls (the cloud leans) while the price nearly doubles.
 */

type Pick = "rises" | "falls" | "stays";
const K_MIN = 22250,
  K_MAX = 23050,
  K_STEP = 50;
const SIGMA_A = 0.16,
  SIGMA_B = 0.3;

export function F1Cloud() {
  const [pick, setPick] = useBet<Pick>("C3-F1");
  const [sigma, setSigma] = useState<number>(KEY.atm.iv); // 15.9 %, where Figure 0 left the dial
  const [K, setK] = useState<number>(ROW.K);
  const futures = useMemo(() => cloud(ROW.F, sigma, ROW.T), [sigma]);
  const stats = useMemo(() => cloudStats(futures, K, ROW.r, ROW.T), [futures, K]);
  const formula = useMemo(() => black76({ ...BASE, K, sigma }), [K, sigma]);

  // the bet's two numbers, from the engine
  const shareA = shareAbove(ROW.F, ROW.K, SIGMA_A, ROW.T);
  const shareB = shareAbove(ROW.F, ROW.K, SIGMA_B, ROW.T);
  const priceA = black76({ ...BASE, sigma: SIGMA_A });
  const priceB = black76({ ...BASE, sigma: SIGMA_B });
  const verdict = pick === "falls" ? "right" : pick === "stays" ? "close" : "miss";
  const said = pick === "rises" ? "it rises" : pick === "falls" ? "it falls" : "it stays";

  const dragK = (price: number) => {
    const snapped = Math.round(price / K_STEP) * K_STEP;
    setK(Math.max(K_MIN, Math.min(K_MAX, snapped)));
  };

  return (
    <Figure
      n="1"
      prompt={
        <>
          The box, opened. Inside are <strong>2,000 equally likely futures</strong> of the index {ROW.days} days from now — B5's coin: in the pricing world the index is a fair bet after
          interest, so the cloud is centred on the forward. The call pays what the index ends above the line. Drag the line; then turn the wobble.
        </>
      }
      controls={
        <>
          <Slider label="wobble" value={sigma} min={DIAL.min} max={DIAL.max} step={DIAL.step} onChange={setSigma} role="approx" fmt={pct1} width={200} locked={!pick} />
          {!pick && <span className="c3-hint">locked until you have placed the bet</span>}
        </>
      }
      observe={
        pick ? (
          <>
            The price is <strong>every future above the line, by how far above, shrunk by {ROW.days} days of interest</strong>. Wobble makes the price by making the lit payouts bigger, not by
            making exercise likelier: at 30 % the lit share is slightly <em>smaller</em> and the price is nearly double.
          </>
        ) : (
          <>Drag the strike line through the cloud and watch the three readouts. The wobble dial unlocks once you have placed the bet below.</>
        )
      }
    >
      <div className="c3-stage c3-stage-col">
        <CloudPlot futures={futures} K={K} onDragK={dragK} />
        <Readouts
          items={[
            [
              "share of futures above the line",
              <span key="s" className="c3-approx">
                {pct1(stats.shareLit)}
              </span>,
            ],
            ["average payout of a lit future", rs(stats.avgLitPayoff)],
            [
              "price: average over all 2,000, discounted",
              <span key="p">
                <span className="c3-truth">{n2(stats.price)}</span> <span className="c3-dim">(the formula says {n2(formula)})</span>
              </span>,
            ],
          ]}
        />
      </div>
      <Bet
        question={
          <>
            Before the dial moves: widen the wobble from 16 % to 30 %. The share of futures above {n0(ROW.K)} —
          </>
        }
        options={[
          { id: "rises", label: "rises — a wider cloud reaches higher" },
          { id: "falls", label: "falls" },
          { id: "stays", label: "stays — it is centred on 22,603 either way" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <ResultCard yours={said} answer={`it falls: ${pct1(shareA)} → ${pct1(shareB)} — while the price goes ${n2(priceA)} → ${n2(priceB)}`} verdict={verdict}>
          The cloud is centred on {n0(ROW.F)} as an <em>average</em>; widen it and the pile leans — more futures a little below, fewer a lot above, the same mean. So the share above the line
          drops a touch. The price nearly doubles anyway, because the futures that <em>are</em> above the line are now much further above it. Turn the dial to 30 % and watch the
          average lit payout.
        </ResultCard>
      </Bet>
    </Figure>
  );
}
