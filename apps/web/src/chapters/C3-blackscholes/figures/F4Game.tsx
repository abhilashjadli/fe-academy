import { useEffect, useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { bisectionPath, black76, black76Greeks, impliedVolFwd, type Kind } from "../../../engine/bs";
import { BASE, DIAL, KEY, NSE, ROW, SNAP_RUPEES, f2, n0, n2, pct1, pct2, s2 } from "./c3";
import { Machine, detent, modelPrice, type Target } from "./Machine";
import { XTicksInside, YTicksInside } from "./Cloud";
import "./figures.css";

/**
 * Figure 4 — the game, rounds 2–6, then the computer. The dial of Figure 0 with a "next strike" button: five more real rows in turn
 * (22,250 / 22,500 / 22,800 / 23,050 calls, then the 22,600 put), each snapping when the gap is under ₹0.50 and dropping a dot on a
 * strip of wobble against strike. Then "let the computer do the other twelve": a Newton path from 30 % per row, drawn as tangent
 * steps on a small price-against-wobble inset, and the strip fills — 17.0 % at 22,250 sloping to 15.5 % at 23,050, a real skew from
 * a real screen. Collapsed: Hull's bisection on the 22,600 row.
 */

interface Round extends Target {
  iv: number;
}
const ROUNDS: Round[] = KEY.rounds.filter((r) => !(r.K === ROW.K && r.kind === "call")).map((r) => ({ K: r.K, kind: r.kind as Kind, screen: r.price, iv: r.iv }));
const ATM_IV = KEY.atm.iv;
const STRIP_X: [number, number] = [22200, 23100];
const STRIP_Y: [number, number] = [0.15, 0.175];
const HAND = new Set(ROUNDS.filter((r) => r.kind === "call").map((r) => r.K)).add(ROW.K);
const REST = NSE.strikes.map((K, i) => ({ K, screen: NSE.calls[i] })).filter((r) => !HAND.has(r.K)); // the other twelve
const FRAME_MS = 200; // three frames a row: two tangent steps and the drop

interface Dot {
  K: number;
  iv: number;
  kind: Kind;
  by: "you" | "computer" | "figure0";
}

type Phase = "rounds" | "auto" | "done";

/** Newton's tangent steps on the price-against-wobble curve for one row. */
function NewtonInset({ K, screen, frame }: { K: number; screen: number; frame: number }) {
  const path = useMemo(() => impliedVolFwd(screen, { ...BASE, K }, "call", DIAL.start).path, [K, screen]);
  const curve = useMemo<Pt[]>(() => {
    const pts: Pt[] = [];
    for (let s = 0.08; s <= 0.34; s += 0.005) pts.push([s, black76({ ...BASE, K, sigma: s })]);
    return pts;
  }, [K]);
  const yLo = black76({ ...BASE, K, sigma: 0.08 }),
    yHi = black76({ ...BASE, K, sigma: 0.34 });
  const steps = Math.min(frame, 2);
  return (
    <div className="c3-inset">
      <div className="c3-inset-head">
        <strong>the computer's turn</strong> · call at {n0(K)}, screen {n2(screen)} · Newton from 30 %
      </div>
      <Plot xDomain={[0.08, 0.34]} yDomain={[yLo - 10, yHi + 10]} width={420} height={200} margin={{ top: 10, right: 12, bottom: 30, left: 50 }} xLabel="wobble" xTicks={0} yTicks={4} axisY={yLo - 10} axisX={0.08} ariaLabel="The model price against the wobble for this strike, the screen's price as a horizontal line, and the tangent steps of Newton's method from 30 %">
        <XTicksInside at={[0.1, 0.15, 0.2, 0.25, 0.3]} fmt={(v) => pct1(v).replace(".0", "")} />
        <Curve pts={curve} role="truth" />
        <Curve pts={[[0.08, screen], [0.34, screen]]} role="ghost" dash="4 3" smooth={false} />
        <Label at={[0.08, screen]} text={`screen ${n2(screen)}`} dx={6} dy={-5} />
        {[0, 1].map((k) => {
          if (k >= steps) return null;
          const s = path[k];
          const sNext = path[k + 1] ?? s;
          const g = black76Greeks({ ...BASE, K, sigma: s });
          return (
            <g key={k}>
              <Marker at={[s, g.price]} role="approx" r={4} />
              <Curve pts={[[s, g.price], [sNext, screen]]} role="approx" width={1.5} smooth={false} />
              <Curve pts={[[sNext, screen], [sNext, black76({ ...BASE, K, sigma: sNext })]]} role="approx" dash="2 2" width={1} smooth={false} />
              <Label at={[s, g.price]} text={`${k === 0 ? "guess" : "step 1"} ${pct2(s)}`} role="approx" dx={k === 0 ? -8 : 8} dy={k === 0 ? 4 : -8} anchor={k === 0 ? "end" : "start"} />
            </g>
          );
        })}
        {steps >= 2 && (
          <>
            <Marker at={[path[2] ?? path[1], screen]} role="approx" r={5} />
            <Label at={[path[2] ?? path[1], screen]} text={`step 2: ${pct2(path[2] ?? path[1])}`} role="approx" dx={10} dy={16} />
          </>
        )}
      </Plot>
    </div>
  );
}

function StripDots({ dots }: { dots: Dot[] }) {
  const { x, y } = usePlot();
  return (
    <g>
      {dots.map((d, i) => {
        const cx = x(d.K),
          cy = y(d.iv);
        if (d.kind === "put") return <rect key={i} className="marker error" x={cx - 5} y={cy - 5} width={10} height={10} transform={`rotate(45 ${cx} ${cy})`} />;
        return <circle key={i} className={"marker " + (d.by === "figure0" ? "truth" : d.by === "you" ? "approx" : "ink")} cx={cx} cy={cy} r={d.by === "computer" ? 4 : 5.5} />;
      })}
    </g>
  );
}

export function F4Game() {
  const [sigma, setSigma] = useState<number>(DIAL.start);
  const [i, setI] = useState(0);
  const [dots, setDots] = useState<Dot[]>([{ K: ROW.K, iv: ATM_IV, kind: "call", by: "figure0" }]);
  const [phase, setPhase] = useState<Phase>("rounds");
  const [autoRow, setAutoRow] = useState(0);
  const [frame, setFrame] = useState(0);

  const target = ROUNDS[Math.min(i, ROUNDS.length - 1)];
  const model = useMemo(() => modelPrice(target, sigma), [target, sigma]);
  const gap = model - target.screen;
  const good = Math.abs(gap) < SNAP_RUPEES;
  const snappedThis = dots.some((d) => d.K === target.K && d.kind === target.kind && d.by === "you");
  const roundsLeft = i < ROUNDS.length;
  const yourDots = dots.filter((d) => d.by === "you");
  const lastYours = yourDots[yourDots.length - 1];

  // drop a dot the moment the gap closes
  useEffect(() => {
    if (phase !== "rounds" || !roundsLeft || !good || snappedThis) return;
    setDots((d) => [...d, { K: target.K, iv: sigma, kind: target.kind, by: "you" }]);
  }, [good, phase, roundsLeft, snappedThis, target, sigma]);

  // the computer's turn: three frames a row, then the next row
  useEffect(() => {
    if (phase !== "auto") return;
    const id = setTimeout(() => {
      if (frame < 2) setFrame(frame + 1);
      else {
        const r = REST[autoRow];
        const iv = impliedVolFwd(r.screen, { ...BASE, K: r.K }, "call", DIAL.start).sigma;
        setDots((d) => [...d, { K: r.K, iv, kind: "call", by: "computer" }]);
        if (autoRow + 1 >= REST.length) setPhase("done");
        else {
          setAutoRow(autoRow + 1);
          setFrame(0);
        }
      }
    }, FRAME_MS);
    return () => clearTimeout(id);
  }, [phase, frame, autoRow]);

  const next = () => {
    if (phase === "rounds" && roundsLeft) setI(i + 1);
    else if (phase === "rounds") {
      setPhase("auto");
      setAutoRow(0);
      setFrame(0);
    }
  };
  const buttonLabel = phase === "done" ? "all 17 rows done" : phase === "auto" ? "working…" : roundsLeft ? (i === ROUNDS.length - 1 ? "finish round 6" : `next strike (round ${i + 2} of 6)`) : "let the computer do the other twelve";
  const buttonOn = phase === "rounds" && (snappedThis || !roundsLeft);

  const callDots = dots.filter((d) => d.kind === "call").sort((a, b) => a.K - b.K);
  const skewLine: Pt[] = phase === "done" ? callDots.map((d) => [d.K, d.iv]) : [];
  const bisect = useMemo(() => bisectionPath(ROW.call, BASE, 0.1, 0.3, 6), []);

  return (
    <Figure
      n="4"
      prompt={
        <>
          Rounds 2 to 6. Same dial, five more real rows — four calls and one put — each from the same screen. Find the setting, drop the dot, press next. Then let the machine finish the
          column.
        </>
      }
      controls={
        <>
          <Slider label="wobble" value={sigma} min={DIAL.min} max={DIAL.max} step={DIAL.step} onChange={(v) => setSigma(detent(v, sigma, target))} role="approx" fmt={pct1} width={200} locked={phase !== "rounds"} />
          <button type="button" className="btn primary" disabled={!buttonOn} onClick={next}>
            {buttonLabel}
          </button>
        </>
      }
      observe={
        phase === "done" ? (
          <>
            The dots do not land on a flat line: <strong>{pct1(KEY.strip.call_iv[0])} at {n0(NSE.strikes[0])} sloping to {pct1(KEY.strip.call_iv[16])} at {n0(NSE.strikes[16])}</strong> — a real skew from a real
            screen. One machine, one day, seventeen settings. The formula is wrong in a way the market has learned to speak; D2 is about that language.
          </>
        ) : phase === "auto" ? (
          <>
            Newton: at the current guess, follow the tangent of the price-against-wobble curve to the screen's price and jump there. The slope is the vega. From 30 % the 22,600 call lands
            in two steps: {pct2(KEY.newton.path[1])} → {pct2(KEY.newton.path[2])}.
          </>
        ) : !roundsLeft ? (
          <>
            Five dots from your own hand, and they already lean. Twelve rows remain. The computer turns the same dial, only faster — it reads the slope of the price against the wobble and
            jumps.
          </>
        ) : (
          <>
            {target.kind === "put" ? (
              <>
                The put at {n0(target.K)}: the machine's mirror setting — it prices what the index ends <em>below</em> the line. Its wobble is {pct1(target.iv)}, a touch off the call's{" "}
                {pct1(ATM_IV)}; Figure 5 is about that gap.
              </>
            ) : (
              <>
                The root is unique because the price only ever goes up with the dial, so there is exactly one setting per row. Round {i + 2}: the {target.kind} at {n0(target.K)}, screen{" "}
                {n2(target.screen)}.
              </>
            )}
          </>
        )
      }
    >
      <div className="c3-stage c3-stage-col">
        {phase === "rounds" ? <Machine target={target} sigma={sigma} sealed /> : phase === "auto" ? <NewtonInset K={REST[autoRow].K} screen={REST[autoRow].screen} frame={frame} /> : null}
        <Plot xDomain={STRIP_X} yDomain={STRIP_Y} width={640} height={230} margin={{ top: 14, right: 16, bottom: 34, left: 16 }} xLabel="strike" yLabel="wobble that prints the screen's price" xTicks={0} yTicks={0} grid={false} axisY={STRIP_Y[0]} axisX={STRIP_X[0]} ariaLabel="A strip of the wobble found for each strike: your dots, the 22,600 call from Figure 0, the computer's dots, and a line through all seventeen calls">
          <XTicksInside at={[22250, 22500, 22600, 22800, 23050]} fmt={n0} />
          <YTicksInside at={[0.155, 0.16, 0.165, 0.17]} fmt={pct1} />
          <Curve pts={[[ROW.F, STRIP_Y[0]], [ROW.F, STRIP_Y[1]]]} role="ghost" dash="3 3" width={1} smooth={false} />
          <Label at={[ROW.F, STRIP_Y[1]]} text="forward" dx={4} dy={12} />
          {skewLine.length > 1 && <Curve pts={skewLine} role="ink" width={1.2} opacity={0.5} smooth={false} />}
          <StripDots dots={dots} />
          {dots.length <= 1 && <Label at={[ROW.K, ATM_IV]} text={`Figure 0: ${pct1(ATM_IV)}`} role="truth" dx={10} dy={4} />}
          {phase === "done" && (
            <>
              <Label at={[NSE.strikes[0], KEY.strip.call_iv[0]]} text={pct1(KEY.strip.call_iv[0])} dx={8} dy={-6} />
              <Label at={[NSE.strikes[16], KEY.strip.call_iv[16]]} text={pct1(KEY.strip.call_iv[16])} dx={-8} dy={-8} anchor="end" />
            </>
          )}
        </Plot>
        <Readouts
          items={[
            ["dial", pct1(sigma)],
            ["gap, machine − screen", <span key="g" className={good ? "c3-truth" : ""}>{s2(gap)}</span>],
            ["your last dot", lastYours ? `${n0(lastYours.K)} ${lastYours.kind} → ${pct1(lastYours.iv)}` : "—"],
          ]}
        />
      </div>
      <details className="c3-more">
        <summary>The slower way: Hull's bisection on the 22,600 row (10 % → 30 %)</summary>
        <p>Halve the bracket each time; keep the half whose price straddles {n2(ROW.call)}. Six halvings:</p>
        <table className="table c3-bisect">
          <thead>
            <tr>
              <th>try</th>
              <th>wobble</th>
              <th>machine prints</th>
              <th>verdict</th>
            </tr>
          </thead>
          <tbody>
            {bisect.map((b, k) => (
              <tr key={k}>
                <td>{k + 1}</td>
                <td>{pct2(b.sigma)}</td>
                <td>{n2(b.price)}</td>
                <td>{b.price > ROW.call ? "too dear → go lower" : "too cheap → go higher"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Six tries to get within {f2(Math.abs(bisect[5].price - ROW.call))} of the screen; Newton needed two. Both work because the price only ever rises with the dial.
        </p>
      </details>
    </Figure>
  );
}
