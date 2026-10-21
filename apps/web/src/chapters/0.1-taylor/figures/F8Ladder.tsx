import { useMemo, useState } from "react";
import { bsCurve, sample, taylor } from "../../../engine/taylor";
import { bsCall } from "../../../engine/blackscholes";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, VLine, fmt } from "../../../ui/Plot";
import { Slider, Toggle } from "../../../ui/controls";
import { M } from "../../../ui/Math";

const V = bsCurve();
const S0 = 100;
const P = { S: S0, K: 100, r: 0.05, sigma: 0.2, T: 1 };

/** The payoff: a risk report is a Taylor series. */
export function F8Ladder() {
  const [dS, setDS] = useState(10);
  const [show1, setShow1] = useState(true);
  const [show2, setShow2] = useState(false);
  const [showX, setShowX] = useState(false);
  const truth = useMemo(() => sample((s) => V.deriv(0, s), 60, 140, 161), []);
  const line = useMemo(() => sample((s) => taylor(V, 1, S0, s), 60, 140, 2), []);
  const para = useMemo(() => sample((s) => taylor(V, 2, S0, s), 60, 140, 161), []);
  const g = bsCall(P);
  const S1 = S0 + dS;
  const v0 = g.price;
  const rows = [-30, -10, -1, dS, 10, 20, 30]
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a - b)
    .map((d) => ({
      d,
      first: g.delta * d,
      second: g.delta * d + 0.5 * g.gamma * d * d,
      exact: V.deriv(0, S0 + d) - v0,
    }));
  const f2 = fmt.n(2);

  return (
    <Figure
      n="8"
      prompt={<>The curve from Figure 0, now named: a one-year call option on a stock at 100. Build the approximation one Greek at a time.</>}
      controls={
        <>
          <Slider label="market move δS" value={dS} min={-30} max={30} step={1} onChange={setDS} fmt={(v) => (v >= 0 ? "+" : "") + v} />
          <span className="toggle-row">
            <Toggle label="Δ · δS" on={show1} onChange={setShow1} />
            <Toggle label="+ ½ Γ · δS²" on={show2} onChange={setShow2} />
            <Toggle label="exact" on={showX} onChange={setShowX} />
          </span>
        </>
      }
      observe={
        <>
          <M
            block
            tex="\delta\Pi \;=\; \tok{truth}{\Delta}\,\delta S \;+\; \tfrac12\,\tok{approx}{\Gamma}\,\delta S^2 \;+\; \Theta\,\delta t \;+\;\cdots \qquad \tok{truth}{\Delta} = \frac{\partial V}{\partial S} = \text{slope},\quad \tok{approx}{\Gamma} = \frac{\partial^2 V}{\partial S^2} = \text{bend}"
          />
          <p style={{ margin: "0 0 0.5em" }}>
            Here Δ = {g.delta.toFixed(4)} and Γ = {g.gamma.toFixed(5)}. These are <em>the Greeks</em> — the Taylor coefficients of a position's value, which is all a risk report is: a few derivatives measured today, used to predict tomorrow's P&amp;L. The ½ is the one from Figure 3. The Θ·δt term is the same expansion in the time direction.
          </p>
          <table className="table" style={{ maxWidth: 560 }}>
            <thead>
              <tr>
                <th>δS</th>
                <th>Δ only</th>
                <th>Δ + ½Γ</th>
                <th>exact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.d} className={r.d === dS ? "hl" : ""}>
                  <td>{(r.d >= 0 ? "+" : "") + r.d}</td>
                  <td>{f2(r.first)}</td>
                  <td>{f2(r.second)}</td>
                  <td>{f2(r.exact)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "0.6em 0 0" }}>
            Notice that for a +10 move Δ + ½Γ slightly overshoots the exact 7.21 — the third-order term is negative here. Chapter C4 names all of these and shows how they interlock; D1 turns this table into a hedging P&amp;L; and in B4 you will meet a world in which the second-order term refuses to vanish even for tiny steps — that is where this chapter and stochastic calculus meet.
          </p>
        </>
      }
    >
      <Plot xDomain={[60, 140]} yDomain={[-2, 50]} xLabel="stock price S" yLabel="call value V(S)" height={330} ariaLabel="Option value with first- and second-order Taylor approximations">
        {show1 && <Curve pts={line} role="ghost" dash="5 4" smooth={false} />}
        {show2 && <Curve pts={para} role="approx" />}
        <Curve pts={truth} role="truth" opacity={showX ? 1 : 0.35} />
        <VLine at={S0} />
        <VLine at={S1} />
        <Marker at={[S0, v0]} role="ink" />
        {show1 && <Marker at={[S1, taylor(V, 1, S0, S1)]} role="ghost" r={4} />}
        {show2 && <Marker at={[S1, taylor(V, 2, S0, S1)]} role="approx" r={4} />}
        {showX && <Marker at={[S1, V.deriv(0, S1)]} role="truth" r={4} />}
        <Label at={[S0, v0]} text="today, S = 100" dx={-8} dy={18} anchor="end" />
        {show1 && <Label at={[136, taylor(V, 1, S0, 136)]} text="Δ line" role="ghost" dx={-4} dy={18} anchor="end" />}
        {show2 && <Label at={[134, taylor(V, 2, S0, 134)]} text="Δ + ½Γ" role="approx" dx={-12} dy={-6} anchor="end" />}
        {showX && <Label at={[126, V.deriv(0, 126)]} text="exact V(S)" role="truth" dx={-10} dy={-4} anchor="end" />}
      </Plot>
    </Figure>
  );
}
