import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { XTicksInside, YTicksInside } from "./Cloud";
import { impliedVolFwd } from "../../../engine/bs";
import { KEY, NSE, NSE_CALL_IV, NSE_FORWARD, NSE_PUT_IV, ROW, n0, pct1, pct2 } from "./c3";
import "./figures.css";

/**
 * Figure 5 — the screen's own IV column, caught out. NSE prints calls ≈ 13–14 % and puts ≈ 18–19 % for the same strikes. C1's law says a
 * call and a put at one strike are the same bet plus a forward, so they cannot carry two wobbles. One dial: the forward you feed the
 * machine, 22,550 → 22,700. Two curves across the 17 strikes, re-solved from the real LTPs at the fed forward, with the printed columns
 * as ghost dots. At 22,668 (spot 22,600 grown at 10 %, which is what NSE fed it) the curves read the screen's numbers; at 22,603, the
 * forward the chain itself quoted, they lie on top of each other.
 */

const F_MIN = 22550,
  F_MAX = 22700;
const F_NSE = Math.round(NSE_FORWARD); // 22,668
const F_CHAIN = ROW.F; // 22,603
const I_ATM = NSE.strikes.indexOf(ROW.K);
const Y: [number, number] = [0.11, 0.2];

function solve(F: number) {
  const calls = NSE.strikes.map((K, i) => impliedVolFwd(NSE.calls[i], { F, K, r: ROW.r, T: ROW.T }, "call", 0.2).sigma);
  const puts = NSE.strikes.map((K, i) => impliedVolFwd(NSE.puts[i], { F, K, r: ROW.r, T: ROW.T }, "put", 0.2).sigma);
  return { calls, puts };
}

/** The one dial, with two marks on its track. */
function ForwardDial({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pos = (v: number) => ((v - F_MIN) / (F_MAX - F_MIN)) * 100;
  return (
    <div className="c3-fdial">
      <div className="ctl ctl-error">
        <span className="ctl-label">the forward you feed the machine</span>
        <span className="c3-fdial-track">
          <input type="range" min={F_MIN} max={F_MAX} step={1} value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} aria-label="the forward fed to the machine" />
          <span className="c3-fdial-marks">
            <button type="button" className="c3-fdial-mark" style={{ left: pos(F_CHAIN) + "%" }} onClick={() => onChange(F_CHAIN)} aria-pressed={value === F_CHAIN} title={`jump to ${n0(F_CHAIN)}`}>
              <i />
              <b>
                {n0(F_CHAIN)} · the forward the chain itself quoted
              </b>
            </button>
            <button type="button" className="c3-fdial-mark alt" style={{ left: pos(F_NSE) + "%" }} onClick={() => onChange(F_NSE)} aria-pressed={value === F_NSE} title={`jump to ${n0(F_NSE)}`}>
              <i />
              <b>
                {n0(F_NSE)} · what NSE fed it: spot 22,600 at 10 %
              </b>
            </button>
          </span>
        </span>
        <span className="readout">{n0(value)}</span>
      </div>
    </div>
  );
}

export function F5Column() {
  const [F, setF] = useState<number>(F_NSE);
  const sol = useMemo(() => solve(F), [F]);
  const callPts: Pt[] = NSE.strikes.map((K, i) => [K, sol.calls[i]]);
  const putPts: Pt[] = NSE.strikes.map((K, i) => [K, sol.puts[i]]);
  const cAtm = sol.calls[I_ATM],
    pAtm = sol.puts[I_ATM];
  const gapAtm = cAtm - pAtm;
  const atNse = Math.abs(F - F_NSE) <= 2;
  const atChain = Math.abs(F - F_CHAIN) <= 2;
  const fed = KEY.nse_iv.fed_forward;

  return (
    <Figure
      n="5"
      prompt={
        <>
          The screen's own IV columns, both of them: calls around 13–14 %, puts around 18 %, <strong>for the same strikes</strong>. C1's law says a call and a put at one strike are the same bet
          plus a forward — they cannot carry two wobbles. Something fed to the machine is off. You have one dial.
        </>
      }
      controls={<ForwardDial value={F} onChange={setF} />}
      observe={
        atNse ? (
          <>
            At {n0(F_NSE)} the curves read <strong>{pct2(cAtm)} / {pct2(pAtm)}</strong> at {n0(ROW.K)} — the screen's own numbers ({NSE_CALL_IV[I_ATM]} / {NSE_PUT_IV[I_ATM]}). That is the spot,
            22,600, grown at 10 % for {ROW.days} days: NSE fed the machine a forward the chain never quoted. Now turn the dial down to {n0(F_CHAIN)}.
          </>
        ) : atChain ? (
          <>
            At {n0(F_CHAIN)} — the forward the chain itself quoted in C1 — the two curves lie on top of each other at about <strong>{pct1(cAtm)}</strong>, and the ghost dots look
            absurd. The same screen printed two wrong vols and the right forward. An implied vol is only as good as the inputs it was implied from.
          </>
        ) : (
          <>
            Every point on the two curves is a Figure 0 — the dial turned until the machine prints the real last price — with one input changed: the forward. Feed it more and the
            calls look calmer and the puts wilder; the gap at {n0(ROW.K)} is now {pct2(Math.abs(gapAtm))}. Find the setting where the gap closes.
          </>
        )
      }
    >
      <div className="c3-stage c3-stage-col">
        <Plot xDomain={[22200, 23100]} yDomain={Y} width={560} height={360} margin={{ top: 14, right: 16, bottom: 34, left: 16 }} xLabel="strike" yLabel="wobble that prints the real last price" xTicks={0} yTicks={0} axisY={Y[0]} axisX={22200} grid={false} ariaLabel="Implied volatility against strike for the 17 real rows: the call curve and the put curve re-solved at the fed forward, with NSE's printed columns as ghost dots">
          <XTicksInside at={[22250, 22450, 22650, 22850, 23050]} fmt={n0} />
          <YTicksInside at={[0.12, 0.14, 0.16, 0.18]} fmt={(v) => pct1(v).replace(".0", "")} />
          {NSE.strikes.map((K, i) => (
            <Marker key={"gc" + K} at={[K, NSE_CALL_IV[i] / 100]} role="ghost" r={3} />
          ))}
          {NSE.strikes.map((K, i) => (
            <Marker key={"gp" + K} at={[K, NSE_PUT_IV[i] / 100]} role="ghost" r={3} />
          ))}
          <Curve pts={putPts} role="error" width={2} smooth={false} />
          <Curve pts={callPts} role="truth" width={2} smooth={false} />
          <Marker at={[ROW.K, cAtm]} role="truth" r={4.5} />
          <Marker at={[ROW.K, pAtm]} role="error" r={4.5} />
          <Label at={[NSE.strikes[16], sol.calls[16]]} text="calls" role="truth" dx={-6} dy={sol.calls[16] >= sol.puts[16] ? -9 : 17} anchor="end" />
          <Label at={[NSE.strikes[16], sol.puts[16]]} text="puts" role="error" dx={-6} dy={sol.calls[16] >= sol.puts[16] ? 17 : -9} anchor="end" />
          <Label at={[NSE.strikes[0], NSE_PUT_IV[0] / 100]} text="NSE's printed put IVs" dx={6} dy={-8} />
          <Label at={[NSE.strikes[0], NSE_CALL_IV[0] / 100]} text="NSE's printed call IVs" dx={6} dy={16} />
        </Plot>
        <Readouts
          items={[
            [`call IV at ${n0(ROW.K)}`, <span key="c" className="c3-truth">{pct2(cAtm)}</span>],
            [`put IV at ${n0(ROW.K)}`, <span key="p" className="c3-error">{pct2(pAtm)}</span>],
            ["gap", <span key="g" className={Math.abs(gapAtm) < 0.0025 ? "c3-truth" : ""}>{pct2(gapAtm)}</span>],
          ]}
        />
      </div>
      <details className="c3-more">
        <summary>How we know what NSE fed it</summary>
        <p>
          Spot Black–Scholes with S = 22,600, r = 10 % and {ROW.days} days reproduces all 34 printed IVs from the real last prices with an rms error of ₹{KEY.nse_iv.rms.toFixed(2)}; its forward is
          22,600 × e<sup>0.10 × {ROW.days}/365</sup> = {n0(NSE_FORWARD)}. The chain's own forward, from call − put + strike across the rows, is {n0(F_CHAIN)}. Fed-forward table at{" "}
          {n0(ROW.K)} (call / put): 22,550 → {pct1(fed["22550"].call_iv)} / {pct1(fed["22550"].put_iv)}; 22,603 → {pct1(fed["22603"].call_iv)} / {pct1(fed["22603"].put_iv)}; 22,668 →{" "}
          {pct1(fed["22668"].call_iv)} / {pct1(fed["22668"].put_iv)}; 22,700 → {pct1(fed["22700"].call_iv)} / {pct1(fed["22700"].put_iv)}.
        </p>
      </details>
    </Figure>
  );
}
