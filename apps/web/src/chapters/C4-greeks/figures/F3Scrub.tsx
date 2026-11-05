import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Curve, Label, Marker, Plot, VLine, type Pt } from "../../../ui/Plot";
import { Readouts, Slider } from "../../../ui/controls";
import { KEY, ROW, daysLabel, gammaLot100, greeks, n0, n1, n2, n3, rs, thetaDay } from "./row";

/**
 * Figure 3 — the last days. Three slices (slope, bend, clock against the index) with one scrubber, days left
 * 11 → 1 → 1 hour, and a pin that leaves ghosts. Bet first: delta at 22,700 with one day left. Readouts: the three
 * Greeks at the ridge for the current day.
 */

const STOPS = [11, 8, 5, 3, 2, 1, 0.5, 0.25, 1 / 24];
const F_LO = 22000,
  F_HI = 23200;
type Pick = "0.6" | "0.7" | "0.95";

interface Slices {
  delta: Pt[];
  gamma: Pt[];
  theta: Pt[];
}
function slices(days: number): Slices {
  const delta: Pt[] = [],
    gamma: Pt[] = [],
    theta: Pt[] = [];
  const step = days < 0.3 ? 4 : 10;
  for (let F = F_LO; F <= F_HI + 1e-6; F += step) {
    const g = greeks(F, days);
    delta.push([F, g.delta]);
    gamma.push([F, gammaLot100(g.gamma)]);
    theta.push([F, thetaDay(g.thetaYr)]);
  }
  return { delta, gamma, theta };
}

export function F3Scrub() {
  const [pick, setPick] = useBet<Pick>("C4-F3");
  const [pos, setPos] = useState(0);
  const [pins, setPins] = useState<number[]>([]);
  const days = STOPS[pos];
  const cur = useMemo(() => slices(days), [days]);
  const ghosts = useMemo(() => pins.map((p) => ({ p, s: slices(STOPS[p]) })), [pins]);
  const ridge = greeks(ROW.K, days);
  const oneDay = KEY.slices["1"]["22700"].delta;
  const oneHour = KEY.slices["0.041666666666666664"]["22700"].delta;
  const verdict = pick === "0.7" ? "right" : pick === "0.6" ? "close" : pick === "0.95" ? "miss" : "none";
  const locked = !pick;
  const pinHere = () => setPins((ps) => (ps.includes(pos) ? ps : [...ps, pos]));

  const small = (yDomain: [number, number], yLabel: string, key: keyof Slices, role: "error" | "approx" | "truth", mark: number, markText: string, ticks = 3) => (
    <Plot xDomain={[F_LO, F_HI]} yDomain={yDomain} width={300} height={200} xTicks={3} yTicks={ticks} xLabel="index" yLabel={yLabel} axisY={yDomain[0]} margin={{ top: 16, right: 10, bottom: 32, left: 40 }} ariaLabel={`${yLabel} against the index at ${daysLabel(days)} left`}>
      <VLine at={ROW.K} />
      {ghosts.map(({ p, s }) => (
        <Curve key={p} pts={s[key]} role="ghost" width={1.2} opacity={0.8} />
      ))}
      <Curve pts={cur[key]} role={role} width={2.2} />
      <Marker at={[ROW.K, mark]} role="ink" r={3.5} />
      <Label at={[ROW.K, mark]} text={markText} dx={8} dy={key === "theta" ? 14 : -8} />
    </Plot>
  );

  return (
    <Figure
      n="3"
      prompt={
        <>
          The same three readings, now against the index, with one scrubber: <em>days left</em>. Bet first, then run the clock down to the last hour and
          pin the shapes you want to keep.
        </>
      }
      controls={
        <>
          <Slider label="days left" value={pos} min={0} max={STOPS.length - 1} step={1} onChange={setPos} locked={locked} fmt={(v) => daysLabel(STOPS[Math.round(v)])} width={200} />
          <button type="button" className="btn" disabled={locked || pins.includes(pos)} onClick={pinHere}>
            pin {daysLabel(days)}
          </button>
          {pins.length > 0 && (
            <button type="button" className="btn c4-quiet" onClick={() => setPins([])}>
              clear pins
            </button>
          )}
          <Readouts
            items={[
              [`slope at the ridge, ${daysLabel(days)}`, n3(ridge.delta)],
              ["bend, units per 100 pts per lot", n2(gammaLot100(ridge.gamma))],
              ["clock, per unit per day", rs(thetaDay(ridge.thetaYr), 1)],
            ]}
          />
        </>
      }
      observe={
        <>
          Near expiry the S-curve becomes a step: the slope flips from 0 to 1 within a hundred points of the strike, and the bend and the clock explode
          together — at the ridge, bend {n1(gammaLot100(KEY.ridge["11"].gamma))} → {n1(gammaLot100(KEY.ridge["1"].gamma))} →{" "}
          {n1(gammaLot100(KEY.ridge["0.041666666666666664"].gamma))} while the clock runs {rs(KEY.ridge["11"].theta_day, 0)} → {rs(KEY.ridge["1"].theta_day, 0)}{" "}
          → {rs(KEY.ridge["0.25"].theta_day, 0)} a day. The two shapes change in lockstep; Figure 5 says why.
        </>
      }
    >
      <Bet<Pick>
        question={<>With one day left and the index at {n0(22700)}, is the slope nearer 0.6, 0.7 or 0.95?</>}
        options={[
          { id: "0.6", label: "0.6" },
          { id: "0.7", label: "0.7" },
          { id: "0.95", label: "0.95" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <ResultCard yours={pick ?? "—"} answer={`${n3(oneDay)} with one day left — and ${n3(oneHour)} with one hour`} verdict={verdict}>
          A hundred points above the strike with a day to go, the call is almost — not quite — a sure thing: the slope is {n2(oneDay)}. One hour before
          the close it is {n3(oneHour)}, the step. Scrub to 1 d and watch the S-curve stand up.
        </ResultCard>
      </Bet>
      <div className={"c4-three " + (locked ? "dim" : "")}>
        {small([0, 1], "slope", "delta", "error", ridge.delta, n3(ridge.delta))}
        {small([0, 70], "bend / 100 pts / lot", "gamma", "approx", gammaLot100(ridge.gamma), n1(gammaLot100(ridge.gamma)))}
        {small([-80, 0], "clock, ₹ per day", "theta", "truth", Math.max(-80, thetaDay(ridge.thetaYr)), rs(thetaDay(ridge.thetaYr), 0), 4)}
      </div>
      {days < 0.3 && <div className="c4-hint">At one hour the clock at the ridge is {rs(thetaDay(ridge.thetaYr), 0)} a day — off this chart — and the bend is a spike {n1(gammaLot100(ridge.gamma))} tall.</div>}
    </Figure>
  );
}
