import { useMemo, useState } from "react";
import { bsCurve, sample, taylor } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Band, Curve, Marker, Plot, VLine, fmt, Label } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";
import { M } from "../../../ui/Math";

const V = bsCurve();
const S0 = 100;

export function F0Opening() {
  const [dS, setDS] = useState(14);
  const truth = useMemo(() => sample((s) => V.deriv(0, s), 60, 140, 161), []);
  const line = useMemo(() => sample((s) => taylor(V, 1, S0, s), 60, 140, 161), []);
  const para = useMemo(() => sample((s) => taylor(V, 2, S0, s), 60, 140, 161), []);
  const S1 = S0 + dS;
  const v0 = V.deriv(0, S0);
  const exact = V.deriv(0, S1) - v0;
  const guess1 = taylor(V, 1, S0, S1) - v0;
  const guess2 = taylor(V, 2, S0, S1) - v0;
  const f = fmt.n(2);

  return (
    <Figure
      n="0"
      prompt={
        <>
          The market moves by <span className="num">{dS >= 0 ? "+" : ""}{dS}</span>. Which guess would you trade on — the straight line or the bend?
        </>
      }
      controls={
        <>
          <Slider label="market move δS" value={dS} min={-30} max={30} step={1} onChange={setDS} fmt={(v) => (v >= 0 ? "+" : "") + v} />
          <span className="readouts">
            <span>
              <span className="k">line says </span>
              <span className="v">{f(guess1)}</span>
            </span>
            <span>
              <span className="k">bend says </span>
              <span className="v">{f(guess2)}</span>
            </span>
            <span>
              <span className="k">actually </span>
              <span className="v">{f(exact)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          Every risk report in this firm is a short polynomial like the one below. By the end of this page you will know where it comes from, and why
          the second term carries a ½.
          <div className="eq-dim">
            <M block tex="\delta\Pi \;=\; \tok{dim}{\Delta}\,\delta S \;+\; \tfrac12\,\tok{dim}{\Gamma}\,\delta S^2 \;+\; \tok{dim}{\Theta}\,\delta t \;+\;\cdots" />
          </div>
        </>
      }
    >
      <Plot xDomain={[60, 140]} yDomain={[-2, 50]} xLabel="market level S" yLabel="value of the position" height={330} ariaLabel="A curved value graph with a straight-line guess and a parabola guess">
        <Band upper={truth} lower={para} role="error" />
        <Curve pts={line} role="ghost" dash="5 4" smooth={false} />
        <Curve pts={para} role="approx" />
        <Curve pts={truth} role="truth" />
        <VLine at={S0} />
        <Marker at={[S0, v0]} role="ink" />
        <Marker at={[S1, V.deriv(0, S1)]} role="truth" />
        <Marker at={[S1, taylor(V, 1, S0, S1)]} role="ghost" r={4} />
        <Marker at={[S1, taylor(V, 2, S0, S1)]} role="approx" r={4} />
        <Label at={[S0, v0]} text="today" dx={-8} dy={18} anchor="end" />
        <Label at={[126, V.deriv(0, 126)]} text="the position" role="truth" dx={-10} dy={-4} anchor="end" />
        <Label at={[134, taylor(V, 2, S0, 134)]} text="the bend" role="approx" dx={-12} dy={-6} anchor="end" />
        <Label at={[136, taylor(V, 1, S0, 136)]} text="the line" role="ghost" dx={-4} dy={18} anchor="end" />
      </Plot>
    </Figure>
  );
}
