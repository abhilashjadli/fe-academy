import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, Points, type Pt } from "../../../ui/Plot";
import { Readouts, Slider } from "../../../ui/controls";
import { conversionLedger, maxPutGap, predictedPuts } from "../../../engine/options";
import { BREAK_IT, LOT, SPOT_INFERRED, n0, n2, rowAt, rows, rs, s2 } from "./chain";

const CHECK = [22000, 22600, 23200];

/** Figure 5 — rebuild the put column from the call column at one forward; then type a wrong put and watch the ledger lock the difference. */
export function F5Rebuild() {
  const [F, setF] = useState(SPOT_INFERRED);
  const breakRow = rowAt(BREAK_IT.K);
  const [typed, setTyped] = useState<string>(breakRow.put.toFixed(2));
  const typedPut = Number.parseFloat(typed);
  const putOk = Number.isFinite(typedPut) && typedPut >= 0;
  const myPut = putOk ? typedPut : breakRow.put;

  const pred = useMemo(() => predictedPuts(rows, F), [F]);
  const worst = useMemo(() => maxPutGap(rows, F), [F]);
  const led = useMemo(() => conversionLedger({ K: breakRow.K, call: breakRow.call, put: myPut }, F, LOT), [breakRow, myPut, F]);
  // the engine's ledger is written for a cheap put (buy put, sell call, buy forward). A rich put is the same three trades reversed.
  const flip = led.perUnit < 0;
  const sign = flip ? -1 : 1;
  const flippedWords = [`sell the ${n0(breakRow.K)} put`, `buy the ${n0(breakRow.K)} call`, `sell the index forward at ${n0(F)}`];
  const straightWords = [`buy the ${n0(breakRow.K)} put`, `sell the ${n0(breakRow.K)} call`, `buy the index forward at ${n0(F)}`];
  const trades = led.trades.map((t, i) => ({ what: flip ? flippedWords[i] : straightWords[i], cash: sign * t.cash }));
  const lock = sign * led.perUnit;
  const lockLot = sign * led.perLot;
  const broke = Math.abs(myPut - breakRow.put) > 1e-9;

  const predPts: Pt[] = rows.map((r, i) => [r.K, pred[i]]);
  const realPts: Pt[] = rows.map((r) => [r.K, r.put]);

  return (
    <Figure
      n="5"
      prompt={
        <>
          Throw the put column away. From the call column and one number — the forward — the engine predicts every put. Then break one price and see
          what happens.
        </>
      }
      controls={
        <>
          <Slider label="forward" value={F} min={22550} max={22650} step={1} onChange={setF} role="truth" fmt={n0} width={180} />
          <label className="ctl">
            <span className="ctl-label">break it: the {n0(breakRow.K)} put at</span>
            <input className="c1-num" type="number" inputMode="decimal" step={0.05} min={0} value={typed} onChange={(e) => setTyped(e.target.value)} aria-label={`price of the ${n0(breakRow.K)} put`} />
          </label>
          <Readouts
            items={[
              ["worst gap over 17 rows", n2(worst)],
              ["locked per unit", s2(lock)],
              ["per lot", rs(lockLot)],
            ]}
          />
        </>
      }
      observe={
        <>
          Half the screen is implied by the other half to within a few rupees; the gaps are bid–ask and timing. Type a wrong price and the ledger
          fills: three trades, one number locked whatever the index does. A wrong price is <strong>free money</strong> for whoever sees it first — which
          is why there is no wrong price for long.
        </>
      }
    >
      <div className="two c1-rebuild">
        <div>
          <Plot xDomain={[22200, 23100]} yDomain={[80, 580]} width={520} height={300} xLabel="strike" yLabel="put price" xTicks={5} yTicks={5} axisY={80} ariaLabel="Real put prices as dots with the predicted put column as a line through them">
            <Curve pts={predPts} role="truth" width={2} smooth={false} />
            <Points pts={realPts} role="ink" r={4} opacity={0.95} />
            {broke && <Marker at={[breakRow.K, myPut]} role="error" r={6} />}
            {broke && <Label at={[breakRow.K, myPut]} text={`your ${n0(breakRow.K)} put: ${n2(myPut)}`} role="error" dx={-10} dy={myPut > pred[rows.indexOf(breakRow)] ? -12 : 20} anchor="end" />}
            <Label at={[22250, pred[0]]} text={`predicted at F = ${n0(F)}`} role="truth" dx={6} dy={-16} />
            <Label at={[23050, rows[rows.length - 1].put]} text="real" anchor="end" dx={-10} dy={4} />
          </Plot>
          <div className="c1-scroll c1-chainbox">
            <table className="table c1-chain">
              <thead>
                <tr>
                  <th>strike</th>
                  <th>call (real)</th>
                  <th>put predicted</th>
                  <th>put real</th>
                  <th>gap</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.K} className={r.K === breakRow.K ? "hl" : ""}>
                    <td>{n0(r.K)}</td>
                    <td>{n2(r.call)}</td>
                    <td className="c1-truth">{n2(pred[i])}</td>
                    <td>{n2(r.put)}</td>
                    <td className={Math.abs(pred[i] - r.put) > 5 ? "c1-err" : ""}>{s2(pred[i] - r.put)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={"c1-conv " + (broke ? "broke" : "")}>
          <div className="c1-conv-head">
            {broke ? (
              <>
                The {n0(breakRow.K)} put at {n2(myPut)} — the call column says {n2(pred[rows.indexOf(breakRow)])}. {flip ? "Too dear." : "Too cheap."}
              </>
            ) : (
              <>
                The {n0(breakRow.K)} put at its real price, {n2(breakRow.put)}; the call column says {n2(pred[rows.indexOf(breakRow)])}. That sits
                inside the put's bid–ask on the screen, 348.00 / 360.70 — not free money. Type another price to break it.
              </>
            )}
          </div>
          <table className="table c1-ledger">
            <tbody>
              {trades.map((t, i) => (
                <tr key={i}>
                  <td>{t.what}</td>
                  <td className="num">{t.cash === 0 ? "—" : s2(t.cash)}</td>
                </tr>
              ))}
              <tr className="c1-conv-total">
                <td>locked, whatever happens</td>
                <td className="num">{s2(lock)} a unit</td>
              </tr>
              <tr>
                <td>× {LOT} a lot</td>
                <td className="num">{rs(lockLot)}</td>
              </tr>
            </tbody>
          </table>
          <div className="c1-conv-check">
            {CHECK.map((s) => (
              <span key={s}>
                index at {n0(s)} → <strong className="num">{s2(sign * led.atExpiry(s))}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Figure>
  );
}
