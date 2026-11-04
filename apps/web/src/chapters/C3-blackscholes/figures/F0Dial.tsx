import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { ResultCard } from "../../../ui/Bet";
import { Slider } from "../../../ui/controls";
import { DIAL, KEY, NSE_CALL_IV, NSE, ROW, SNAP_RUPEES, n0, n2, pct1 } from "./c3";
import { Machine, detent, modelPrice, type Target } from "./Machine";
import "./figures.css";

/**
 * Figure 0 — round 1 of the game, the dial unexplained. The real row from C1 zoomed (22,600 · call 249.15 · IV 13.66),
 * a sealed machine with four inputs locked and one dial, "wobble", 5 → 40 % starting at 30 %. The reader turns it until
 * the gap is under ₹0.50: it snaps at 15.9 %. Result card: you just computed an implied volatility — and the screen's
 * own column says 13.66 % for this row (Figure 5).
 */

const TARGET: Target = { K: ROW.K, kind: "call", screen: ROW.call };
const I_ATM = NSE.strikes.indexOf(ROW.K);

/** The real row, zoomed: a fragment of the NSE table. */
function RowStrip() {
  return (
    <div className="c3-strip">
      <div className="c3-strip-head">NSE, 23 Oct 2026 · NIFTY, expiry 3 Nov · one row of the chain</div>
      <table className="table c3-strip-table">
        <thead>
          <tr>
            <th>call IV</th>
            <th>call LTP</th>
            <th>strike</th>
            <th>put LTP</th>
            <th>put IV</th>
          </tr>
        </thead>
        <tbody>
          <tr className="c3-strip-ghost">
            <td>{n2(NSE_CALL_IV[I_ATM - 1])}</td>
            <td>{n2(NSE.calls[I_ATM - 1])}</td>
            <td>{n0(NSE.strikes[I_ATM - 1])}</td>
            <td>{n2(NSE.puts[I_ATM - 1])}</td>
            <td>{n2(KEY.nse_iv.put_iv_printed[I_ATM - 1])}</td>
          </tr>
          <tr className="hl c3-strip-row">
            <td className="c3-strip-iv">{n2(NSE_CALL_IV[I_ATM])}</td>
            <td className="c3-strip-ltp">{n2(NSE.calls[I_ATM])}</td>
            <td>{n0(NSE.strikes[I_ATM])}</td>
            <td>{n2(NSE.puts[I_ATM])}</td>
            <td>{n2(KEY.nse_iv.put_iv_printed[I_ATM])}</td>
          </tr>
          <tr className="c3-strip-ghost">
            <td>{n2(NSE_CALL_IV[I_ATM + 1])}</td>
            <td>{n2(NSE.calls[I_ATM + 1])}</td>
            <td>{n0(NSE.strikes[I_ATM + 1])}</td>
            <td>{n2(NSE.puts[I_ATM + 1])}</td>
            <td>{n2(KEY.nse_iv.put_iv_printed[I_ATM + 1])}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function F0Dial() {
  const [sigma, setSigma] = useState<number>(DIAL.start);
  const [touched, setTouched] = useState(false);
  const model = useMemo(() => modelPrice(TARGET, sigma), [sigma]);
  const gap = model - TARGET.screen;
  const good = Math.abs(gap) < SNAP_RUPEES;
  const iv = KEY.atm.iv; // 15.853 %, the key's root
  const perPoint = KEY.atm.rupees_per_vol_pt; // ≈ ₹15.6 per point of wobble

  return (
    <Figure
      n="0"
      prompt={
        <>
          One row of the real chain: the right to buy the index at <strong>{n0(ROW.K)}</strong> on 3 November last traded at <strong>{n2(ROW.call)}</strong>. Beside it, a sealed box. Four of
          its inputs are already filled and locked. Turn the fifth until the box prints the screen's price.
        </>
      }
      controls={
        <Slider
          label="wobble"
          value={sigma}
          min={DIAL.min}
          max={DIAL.max}
          step={DIAL.step}
          onChange={(v) => {
            setTouched(true);
            setSigma(detent(v, sigma, TARGET));
          }}
          role="approx"
          fmt={pct1}
          width={220}
        />
      }
      observe={
        good ? (
          <>
            The box is a price-maker with one free setting. Four inputs are facts anyone can read off the screen; the fifth is a <strong>setting</strong>, and the market's price is what
            fixes it. Nobody has said what "wobble" means yet — you found its value anyway.
          </>
        ) : touched ? (
          <>
            The gap moves about <strong>₹{n2(perPoint)}</strong> for every point of wobble, in one direction only. Keep turning: the box only ever gets dearer as the dial goes up.
          </>
        ) : (
          <>Start at 30 %. Watch the gap, not the price: when it reads under half a rupee, you have found the setting.</>
        )
      }
    >
      <div className="c3-stage">
        <RowStrip />
        <Machine target={TARGET} sigma={sigma} />
      </div>
      {good && (
        <ResultCard yours={`wobble ${pct1(sigma)}`} answer={`${pct1(iv)} — the one setting that prints ${n2(ROW.call)}`} verdict="right">
          You just computed an <strong>implied volatility</strong>: the wobble the market's price implies. The screen's own IV column says <strong>{n2(NSE_CALL_IV[I_ATM])} %</strong> for this
          row. One of you fed the machine something different — Figure 5.
        </ResultCard>
      )}
    </Figure>
  );
}
