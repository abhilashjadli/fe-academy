import { useMemo, useState } from "react";
import { sample } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Band, Curve, Label, Marker, Plot, VLine } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";

/**
 * Opening bet, pure mechanics: a car you know three things about right now — where it is, how fast it goes,
 * how hard it is braking. Where is it in 3 s? The straight-line guess uses two numbers, the bend guess uses three.
 * Truth: the car slows in proportion to its speed, x(t) = 100 (1 − e^{−t/5}); at t = 0: x = 0, v = 20, a = −4.
 */
const V0 = 20;
const TAU = 5;
const truthFn = (t: number) => V0 * TAU * (1 - Math.exp(-t / TAU));
const lineFn = (t: number) => V0 * t;
const bendFn = (t: number) => V0 * t - 0.5 * (V0 / TAU) * t * t;

export function F0Car() {
  const [pick, setPick] = useBet<"line" | "bend">("0.1-F0");
  const [t, setT] = useState(3);
  const truth = useMemo(() => sample(truthFn, 0, 5, 101), []);
  const line = useMemo(() => sample(lineFn, 0, 5, 2), []);
  const bend = useMemo(() => sample(bendFn, 0, 5, 101), []);
  const xT = truthFn(t);
  const xL = lineFn(t);
  const xB = bendFn(t);
  const m = (v: number) => `${Math.round(v)} m`;

  return (
    <Figure
      n="0"
      prompt={
        <>
          A car passes you doing <span className="num">20 m/s</span>, and it is braking: right now it loses <span className="num">4 m/s</span> of speed every second. Where is it
          three seconds from now?
        </>
      }
    >
      <Bet
        question="Two guesses. Which one do you trust?"
        options={[
          { id: "line", label: "the straight line: 20 × 3 = 60 m" },
          { id: "bend", label: "the bend: 60 m minus ½ × 4 × 3² = 42 m" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <Plot xDomain={[0, 5]} yDomain={[0, 100]} xLabel="seconds from now" yLabel="metres down the road" height={300} xTicks={6} ariaLabel="A car's position over time, with a straight-line guess and a bend guess">
          <Band upper={truth} lower={bend} role="error" />
          <Curve pts={line} role="ghost" dash="5 4" smooth={false} />
          <Curve pts={bend} role="approx" />
          <Curve pts={truth} role="truth" />
          <VLine at={t} />
          <Marker at={[0, 0]} role="ink" />
          <Marker at={[t, xT]} role="truth" />
          <Marker at={[t, Math.min(100, xL)]} role="ghost" r={4} />
          <Marker at={[t, xB]} role="approx" r={4} />
          <Label at={[0, 0]} text="now" dx={8} dy={-8} />
          <Label at={[4.6, truthFn(4.6)]} text="the car" role="truth" dx={-6} dy={-8} anchor="end" />
          <Label at={[4.4, bendFn(4.4)]} text="the bend" role="approx" dx={-6} dy={16} anchor="end" />
          <Label at={[4.3, 86]} text="the line" role="ghost" dx={0} dy={0} anchor="end" />
        </Plot>
        <div className="t-ctl">
          <Slider label="seconds ahead" value={t} min={0.5} max={5} step={0.1} onChange={setT} fmt={(v) => v.toFixed(1) + " s"} />
          <span className="readouts">
            <span>
              <span className="k">line says </span>
              <span className="v tok-ghost">{m(xL)}</span>
            </span>
            <span>
              <span className="k">bend says </span>
              <span className="v tok-approx">{m(xB)}</span>
            </span>
            <span>
              <span className="k">the car is at </span>
              <span className="v tok-truth">{m(xT)}</span>
            </span>
          </span>
        </div>
        <ResultCard
          yours={pick === "line" ? "the straight line, 60 m" : "the bend, 42 m"}
          answer={`${m(truthFn(3))} — the bend was ${Math.round(truthFn(3) - bendFn(3))} m out, the line ${Math.round(lineFn(3) - truthFn(3))} m out`}
          verdict={pick === "bend" ? "right" : "miss"}
        >
          Position, speed and braking are three numbers measured at one instant. The line uses two of them, the bend uses all three, and each number you add
          buys a better guess — for a while. Slide further ahead and watch even the bend drift. This page is where those numbers come from, and when to stop
          adding them.
        </ResultCard>
      </Bet>
    </Figure>
  );
}
