import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts } from "../../../ui/controls";
import { Curve, Label, type Pt } from "../../../ui/Plot";
import { impliedVolFwd } from "../../../engine/bs";
import { butterfly } from "../../../engine/smile";
import { KEY, ROW, STRIP, n0, n2, pct2, rs } from "./d2";
import { StripDots, StripLegend, StripPlot } from "./strip";
import "./figures.css";

/**
 * Figure 3 — kink the smile. One dial: the 22,650 call's price, ₹215 → ₹240, starting at the screen's own 226.55 — where the
 * flag is already red, because the printed 22,600 / 22,650 / 22,700 tent costs −1.95. The strip redraws with the 22,650 call's
 * wobble re-solved from the dial; the tent's cost reads out; the flip at 225.575 is marked on the track.
 */

const K = KEY.kink.K; // 22,650
const [C_LO, C_HI] = KEY.kink.neighbours as [number, number]; // 249.15 and 202.00
const SCREEN = KEY.kink.screen; // 226.55
const [MIN, MAX] = KEY.kink.dial_range as [number, number];
const STEP = 0.05;
const FLIP = (C_LO + C_HI) / 2; // where C(22,600) − 2 C(22,650) + C(22,700) crosses zero: 225.575
const I_K = STRIP.strikes.indexOf(K);
const K_LO = K - 50,
  K_HI = K + 50;

function KinkDial({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pos = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;
  return (
    <div className="d2-dial">
      <div className="ctl ctl-error">
        <span className="ctl-label">the {n0(K)} call's price</span>
        <span className="d2-dial-track">
          <input type="range" min={MIN} max={MAX} step={STEP} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} aria-label={`the ${n0(K)} call's price`} />
          <span className="d2-dial-marks">
            <button type="button" className="d2-dial-mark" style={{ left: pos(FLIP) + "%" }} onClick={() => onChange(FLIP)} aria-pressed={Math.abs(value - FLIP) < 1e-9} title={`jump to ${n2(FLIP)}`}>
              <i />
              <b>{n2(FLIP)} · the flip</b>
            </button>
            <button type="button" className="d2-dial-mark alt" style={{ left: pos(SCREEN) + "%" }} onClick={() => onChange(SCREEN)} aria-pressed={value === SCREEN} title={`jump to ${n2(SCREEN)}`}>
              <i />
              <b>{n2(SCREEN)} · the screen</b>
            </button>
          </span>
        </span>
        <span className="readout">₹{n2(value)}</span>
      </div>
    </div>
  );
}

export function F3Kink() {
  const [price, setPrice] = useState<number>(SCREEN);
  const iv = useMemo(() => impliedVolFwd(price, { F: ROW.F, K, r: ROW.r, T: ROW.T }, "call", 0.2).sigma, [price]);
  const cost = butterfly(C_LO, price, C_HI);
  const red = cost <= 0;
  const atScreen = Math.abs(price - SCREEN) < 1e-9;
  const callIv = useMemo(() => STRIP.call_iv.map((v, i) => (i === I_K ? iv : v)), [iv]);
  const neighbours: Pt[] = [
    [K_LO, STRIP.call_iv[I_K - 1]],
    [K, iv],
    [K_HI, STRIP.call_iv[I_K + 1]],
  ];
  const flag = red ? "red: the tent costs nothing or less — sell it" : "green: the tent costs money, as a probability must";

  return (
    <Figure
      n="3"
      prompt={
        <>
          Break it. One dial: the price of the {n0(K)} call, with its neighbours at {n0(K_LO)} ({rs(C_LO)}) and {n0(K_HI)} ({rs(C_HI)}) held at the screen's prints. The strip
          redraws; the {n0(K_LO)} / {n0(K)} / {n0(K_HI)} tent reads out its cost.
        </>
      }
      controls={
        <>
          <KinkDial value={price} onChange={setPrice} />
          <Readouts
            items={[
              ["the tent's cost", <span key="c" className={red ? "d2-err" : "d2-truth"}>{rs(cost)}</span>],
              [`implied wobble at ${n0(K)}`, pct2(iv)],
              ["flag", <span key="f" className={red ? "d2-err" : "d2-truth"}>{flag}</span>],
            ]}
          />
        </>
      }
      observe={
        atScreen ? (
          <>
            This is the <strong>printed screen</strong>, and the flag is already red: {n2(C_LO)} − 2 × {n2(SCREEN)} + {n2(C_HI)} = <strong>{rs(cost)}</strong>. The printed smile has a kink at{" "}
            {n0(K)} because the three last prices traded at different seconds. If those prints were tradable, a trader would sell the kink — buy {n0(K_LO)}, sell two {n0(K)}, buy{" "}
            {n0(K_HI)} — collect {rs(-cost)} a unit up front, and hold a payoff that can never be below zero. Drag the dial below {n2(FLIP)}.
          </>
        ) : red ? (
          <>
            Still red. At {rs(price)} the {n0(K)} call is dear relative to its neighbours: the tent costs {rs(cost)}, so selling it pays you {rs(-cost)} a unit for a payoff that cannot lose.
            Every seller who sees it sells, the {n0(K)} price falls, and the kink goes. That is why a desk's smile is a smooth curve, not seventeen independent numbers.
          </>
        ) : (
          <>
            Green: at {rs(price)} the tent costs {rs(cost)} — a positive price for a positive payoff, as a probability must. The {n0(K)} dot sits at {pct2(iv)}
            {iv < Math.min(STRIP.call_iv[I_K - 1], STRIP.call_iv[I_K + 1]) ? ", below both neighbours: a cheap middle makes the tent dear, which is allowed; a dear middle is not" : ", in line with its neighbours"}
            . "Arbitrage-free" is only this tripwire, strike after strike.
          </>
        )
      }
    >
      <div className="d2-stage">
        <StripPlot ariaLabel="The strip of implied vols with the 22,650 call's dot moving as its price is dialled; its two neighbours are joined to it by a thin line that kinks when the tent is priced below zero">
          <Curve pts={neighbours} role={red ? "error" : "truth"} width={1.4} dash={red ? "4 3" : undefined} smooth={false} opacity={0.8} />
          <StripDots callIv={callIv} lit={K} />
          <Label at={[K, iv]} text={`${n0(K)} at ${rs(price)} → ${pct2(iv)}`} role={red ? "error" : "truth"} dx={10} dy={iv > STRIP.call_iv[I_K + 1] ? -10 : 16} />
        </StripPlot>
        <StripLegend
          extra={
            <span>
              <i className={"d2-sw " + (red ? "error" : "truth")} /> the dialled dot and its two neighbours
            </span>
          }
        />
      </div>
    </Figure>
  );
}
