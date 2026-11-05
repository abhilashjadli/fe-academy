import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { Bars, Curve, Label, Plot, VLine, type Pt } from "../../../ui/Plot";
import { butterfly, density, smileVol, tailBelow, tentProbability } from "../../../engine/smile";
import { BASE, FIT, KEY, NSE, ROW, callAt, n0, n2, pct1, pct2, rs, useNarrow } from "./d2";
import { StripDots, StripLegend, StripPlot, XTicksInside, YTicksInside } from "./strip";
import "./figures.css";

/**
 * Figure 2 — three tickets and what a strike is a bet on. Five steps over one plot of the index at expiry (22,300–22,900):
 * (1) buy 22,550, sell two 22,600, buy 22,650 → a tent; (2) its cost from the real last prices, ₹3.70, read as odds;
 * (3) the same tent at every strike from the raw prints — six priced below zero; (4) smooth the smile first and redo the
 * tents — a clean hump; (5) the bell at the fitted at-the-money wobble over it. Zero controls besides the step buttons.
 */

const H = KEY.raw_butterflies.h; // 50: the tent reaches 50 points either side of its middle strike
const K_MID = ROW.K; // 22,600
const K_LO = K_MID - H,
  K_HI = K_MID + H;
const X: [number, number] = [22250, 23050]; // the whole chain, so all fifteen tents fit
const TENT_Y: [number, number] = [0, 64];
const COST_Y: [number, number] = [-9, 13];
const PROB_Y: [number, number] = [0, 0.046];
const TAIL_K = 21500;
const FLAT = KEY.density.flat_sigma; // the fitted smile's own at-the-money wobble, 15.95 %

function tent(S: number) {
  const c = (K: number) => Math.max(S - K, 0);
  return c(K_LO) - 2 * c(K_MID) + c(K_HI);
}

const ticketRows = [
  { side: "buy", n: 1, K: K_LO },
  { side: "sell", n: 2, K: K_MID },
  { side: "buy", n: 1, K: K_HI },
] as const;

function Tickets({ priced }: { priced: boolean }) {
  return (
    <div className="d2-tickets">
      {ticketRows.map((t) => (
        <div key={t.K} className={"d2-ticket " + t.side}>
          <div className="d2-ticket-side">
            {t.side} {t.n === 2 ? "two" : "one"}
          </div>
          <div className="d2-ticket-k">{n0(t.K)} call</div>
          <div className="d2-ticket-ltp">{priced ? `last price ${rs(callAt(t.K))}` : "last price —"}</div>
        </div>
      ))}
    </div>
  );
}

export function F2Tickets() {
  const [step, setStep] = useState(0);
  const narrow = useNarrow();
  const cost = butterfly(callAt(K_LO), callAt(K_MID), callAt(K_HI));
  const odds = tentProbability(cost, H, ROW.r, ROW.T);

  const rawRows = useMemo(() => KEY.raw_butterflies.rows.map((r) => ({ K: r.K, cost: butterfly(callAt(r.K - H), callAt(r.K), callAt(r.K + H)) })), []);
  const nNeg = rawRows.filter((r) => r.cost < 0).length;

  const tentPts = useMemo<Pt[]>(() => [X[0], K_LO, K_MID, K_HI, X[1]].map((S) => [S, tent(S)]), []);
  const humpBars = useMemo(() => NSE.strikes.filter((K) => K >= X[0] + H && K <= X[1] - H).map((K) => ({ x: K, y: H * density(FIT, { ...BASE, K }), w: 34 })), []);
  const smileCurve = useMemo<Pt[]>(() => {
    const pts: Pt[] = [];
    for (let K = X[0]; K <= X[1]; K += 10) pts.push([K, H * density(FIT, { ...BASE, K })]);
    return pts;
  }, []);
  const bellCurve = useMemo<Pt[]>(() => {
    const pts: Pt[] = [];
    for (let K = X[0]; K <= X[1]; K += 10) pts.push([K, H * density(FIT, { ...BASE, K }, 5, FLAT)]);
    return pts;
  }, []);
  const fitCurve = useMemo<Pt[]>(() => {
    const pts: Pt[] = [];
    for (let K = 22200; K <= 23100; K += 10) pts.push([K, smileVol(FIT, ROW.F, K)]);
    return pts;
  }, []);
  const atmSmile = H * density(FIT, { ...BASE, K: K_MID });
  const atmBell = H * density(FIT, { ...BASE, K: K_MID }, 5, FLAT);
  const tailSmile = tailBelow(FIT, { ...BASE, K: TAIL_K });
  const tailBell = tailBelow(FIT, { ...BASE, K: TAIL_K }, 5, FLAT);

  const steps = [
    {
      caption: (
        <>
          Three call tickets from the real screen: buy one at {n0(K_LO)}, sell two at {n0(K_MID)}, buy one at {n0(K_HI)}. At expiry the four legs add up to a tent: nothing below{" "}
          {n0(K_LO)}, nothing above {n0(K_HI)}, <strong>₹{H} at {n0(K_MID)}</strong>. It pays only if the index lands within {H} points of {n0(K_MID)}.
        </>
      ),
    },
    {
      caption: (
        <>
          Its cost, from the real last prices: {n2(callAt(K_LO))} − 2 × {n2(callAt(K_MID))} + {n2(callAt(K_HI))} = <strong>{rs(cost)}</strong>. The market pays {rs(cost)} today for up to ₹{H} on 3 Nov
          — read as odds, about <strong>{pct1(odds)}</strong> that the index lands within ±{H / 2} of {n0(K_MID)}. A butterfly is a probability, bought with three tickets.
        </>
      ),
    },
    {
      caption: (
        <>
          Now the same tent at every strike, from the raw prints: the costs jump about, and <strong>{nNeg} of the {rawRows.length} tents are priced below zero</strong>. A free lunch? No —
          the last prices traded at different seconds, and a tent built from three stale prints is not a price anyone will give you.
        </>
      ),
    },
    {
      caption: (
        <>
          So smooth the smile first: one curve through the 34 dots, within {KEY.fit.rms_vol_pts.toFixed(2)} vol points of them on average. Reprice every strike from the curve and redo
          the tents: a clean hump — the market's own odds for 3 Nov, <strong>{pct2(atmSmile)}</strong> within ±{H / 2} of {n0(K_MID)}.
        </>
      ),
    },
    {
      caption: (
        <>
          The bell at the curve's own at-the-money wobble, {pct2(FLAT)}, laid over it (dashed): within ±{H / 2} of {n0(K_MID)} the smile says <strong>{pct2(atmSmile)}</strong>, the bell{" "}
          {pct2(atmBell)} — nearly the same. Far below they part: P(index &lt; {n0(TAIL_K)}) is <strong>{pct2(tailSmile)}</strong> under the smile against {pct2(tailBell)} under the bell.
          Honestly: {n0(TAIL_K)} is beyond the quoted strikes, so that number is the curve extrapolated, not a price anyone printed.
        </>
      ),
    },
  ];

  const render = (i: number) => {
    const showCost = i === 2,
      showProb = i >= 3;
    const yDom = showCost ? COST_Y : showProb ? PROB_Y : TENT_Y;
    const yLabel = showCost ? "cost of the tent, ₹" : showProb ? `odds of landing within ±${H / 2} of the strike` : "payoff at expiry, ₹";
    const yTicks = showCost ? [-5, 0, 5, 10] : showProb ? [0.01, 0.02, 0.03, 0.04] : [20, 40];
    const yFmt = showProb ? (v: number) => pct1(v).replace(".0", "") : (v: number) => String(v);
    return (
      <div className="d2-stage">
        {i <= 1 && <Tickets priced={i === 1} />}
        {i >= 3 && (
          <div className="d2-substrip">
            <StripPlot height={190} ariaLabel="The 34 implied vols with the fitted smile curve through them" yLabel="the smoothed smile">
              <StripDots dim />
              <Curve pts={fitCurve} role="truth" width={2} />
            </StripPlot>
          </div>
        )}
        <Plot xDomain={X} yDomain={yDom} width={narrow ? 420 : 620} height={narrow ? 230 : 280} margin={{ top: 14, right: 14, bottom: 34, left: 14 }} xLabel="index on 3 Nov" yLabel={yLabel} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={showCost ? 0 : yDom[0]} ariaLabel="The index at expiry on the horizontal axis; the body changes by step: a tent payoff, then tent costs per strike as bars, then the smoothed odds per strike as a hump with the bell over it">
          <XTicksInside at={narrow ? [22300, 22600, 22900] : [22300, 22450, 22600, 22750, 22900]} fmt={n0} />
          <YTicksInside at={yTicks} fmt={yFmt} />
          {i <= 1 && (
            <>
              <VLine at={K_LO} />
              <VLine at={K_MID} />
              <VLine at={K_HI} />
              <Curve pts={tentPts} role="truth" width={2.2} smooth={false} />
              <Label at={[K_LO, 15]} text={`buy ${n0(K_LO)}`} dx={-4} dy={-2} anchor="end" />
              <Label at={[K_HI, 15]} text={`buy ${n0(K_HI)}`} dx={4} dy={-2} />
              <Label at={[K_MID, H]} text={`sell two ${n0(K_MID)} · pays ₹${H} here`} dx={8} dy={-4} />
              {i === 1 && <Label at={[K_MID, H / 2]} text={`costs ${rs(cost)} now ≈ ${pct1(odds)} odds`} role="truth" dx={30} dy={4} />}
            </>
          )}
          {showCost && (
            <>
              <Bars bars={rawRows.filter((r) => r.cost >= 0).map((r) => ({ x: r.K, y: r.cost, w: 34 }))} role="truth" />
              <Bars bars={rawRows.filter((r) => r.cost < 0).map((r) => ({ x: r.K, y: r.cost, w: 34 }))} role="error" />
              <Label at={[K_MID, cost]} text={rs(cost)} role="truth" dy={-5} anchor="middle" />
              <Label at={[X[1], COST_Y[1]]} text={`${nNeg} below zero: LTPs traded at different seconds`} role="error" dx={-6} dy={14} anchor="end" />
            </>
          )}
          {showProb && (
            <>
              <Bars bars={humpBars} role="truth" opacity={0.3} />
              <Curve pts={smileCurve} role="truth" width={2} />
              {i === 4 && <Curve pts={bellCurve} role="ink" width={1.6} dash="5 4" />}
              <Label at={[K_MID, atmSmile]} text={`smile ${pct2(atmSmile)}`} role="truth" dx={8} dy={-6} />
              {i === 4 && <Label at={[22400, H * density(FIT, { ...BASE, K: 22400 }, 5, FLAT)]} text={`bell at ${pct2(FLAT)}`} dx={-24} dy={-12} anchor="end" />}
            </>
          )}
        </Plot>
        {i >= 3 && <StripLegend extra={<span className="d2-legend-note">curve: least squares through all 34 (fit)</span>} />}
      </div>
    );
  };

  return (
    <Figure
      n="2"
      prompt={
        <>
          What is a strike's price a bet <em>on</em>? Three tickets from the same screen answer it, and then the whole strip does. Step through.
        </>
      }
      observe={
        step === 4 ? (
          <>
            The smile's shape is the market's density for 3 Nov: a hump a little to the right of the bell's, with more weight far below — the fat left tail of Figure 1, paid for.
            Prices must progress smoothly from strike to strike or someone eats the kink; that is the next figure.
          </>
        ) : step === 2 ? (
          <>
            Negative tents are why desks never read probabilities off raw prints. Every quoted LTP is the last trade, not a live two-way price, and the three legs of a tent rarely
            traded in the same second.
          </>
        ) : (
          <>
            A tent {H} points either side pays like a flat ₹{H} note over a {H}-point window; its price today, divided by ₹{H} and grown at the rate, is the market's odds for that window.
            That is all a butterfly is.
          </>
        )
      }
    >
      <StepThrough steps={steps} render={render} onStep={setStep} />
    </Figure>
  );
}
