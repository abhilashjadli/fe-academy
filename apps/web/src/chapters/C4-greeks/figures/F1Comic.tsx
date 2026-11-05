import "./figures.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Comic, Panel, Says, Avatar } from "../../../ui/Comic";
import { Curve, HLine, Label, Marker, Plot, VLine, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { G0, KEY, REAL_DAY, ROW, indian, lakh, n0, n3, price } from "./row";
import { MINUTES, bridge, obviousHedge } from "./path";
import { useLightOnView } from "./lit";

/**
 * Figure 1 — why the first number exists. Raj naked under the cloud; the obvious fix (all lots above the strike, none
 * below) run on a minute path simulated between the two real closes, with a crossing counter; then the slope.
 * One control (run / reset). Lights the delta tile.
 */

const EPS = 5; // points between the buy and the sell price
const SEED = 17;
const TRIP_COST = EPS * -ROW.units; // ₹ per round trip: 5 points × 6,500 units
const MS_PER_MINUTE = 16; // ≈ 6 s for the session

export function F1Comic() {
  const root = useRef<HTMLDivElement>(null);
  useLightOnView(root, ["delta"]);

  const path = useMemo(() => bridge(REAL_DAY.fromClose, REAL_DAY.toClose, ROW.sigma, SEED), []);
  const hedge = useMemo(() => obviousHedge(path, ROW.K, EPS, ROW.lots), [path]);
  const [t, setT] = useState(0); // minutes shown
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const m = Math.min(MINUTES, Math.floor((now - t0) / MS_PER_MINUTE));
      setT(m);
      if (m < MINUTES) raf = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  const run = () => {
    if (running) {
      setRunning(false);
      setT(0);
    } else {
      setT(0);
      setRunning(true);
    }
  };
  const shown: Pt[] = useMemo(() => path.slice(0, t + 1).map((p, i) => [i, p]), [path, t]);
  const trips = hedge.trips[Math.max(0, t)] ?? 0;
  const tradesSoFar = hedge.trades.filter((x) => x.i <= t);
  const heldNow = hedge.held[t] ?? 0;
  const stop = KEY.hull_tables.stop_loss;

  // panel 4: the price curve at 11 days with the tangent at F
  const curve: Pt[] = useMemo(() => {
    const out: Pt[] = [];
    for (let F = 22000; F <= 23200; F += 20) out.push([F, price(F, ROW.days)]);
    return out;
  }, []);
  const tangent: Pt[] = [
    [ROW.F - 450, G0.price - 450 * G0.delta],
    [ROW.F + 450, G0.price + 450 * G0.delta],
  ];

  return (
    <Figure
      n="1"
      prompt={
        <>
          Raj sold the calls. Whatever the index does by 3 November, he owes the difference above 22,600 on {indian(-ROW.units)} units. What should he
          hold against that? Try the obvious thing first.
        </>
      }
      controls={
        <>
          <button type="button" className={"btn " + (running ? "" : "primary")} onClick={run}>
            {running ? "reset" : t >= MINUTES ? "run Monday again" : "run Monday"}
          </button>
          <Readouts items={[["Hull, Table 14.1 — trading finer", `${stop.performance.map((x) => x.toFixed(2)).join(" → ")} of the premium still at risk`]]} />
        </>
      }
      observe={
        <>
          The obvious hedge is a switch, and a switch at the strike gets flipped all day for a {EPS}-point toll each time. Hull tried it on a thousand
          paths: trading every five weeks down to every quarter-week, the premium at risk never fell below <strong>{stop.performance[5].toFixed(2)}</strong> of
          what he was paid. A slope is not a switch — and the slope here is <strong>{n3(G0.delta)}</strong> of a lot per call: {indian(ROW.units * G0.delta)}{" "}
          units in Raj's row, tile 2.
        </>
      }
    >
      <div ref={root}>
        <Comic cols={4}>
          <Panel n={1} caption={<>Naked. If the index expires anywhere above 22,600, Raj pays — the cloud reaches ₹40 lakh at {n0(ROW.K + 40e5 / -ROW.units)} and keeps going.</>}>
            <div className="c4-naked">
              <svg viewBox="0 0 200 110" className="c4-cloud" role="img" aria-label="a storm cloud labelled ₹0 to ₹40 lakh">
                <path
                  d="M40 80 Q10 80 14 58 Q4 36 30 34 Q34 10 64 18 Q84 0 108 16 Q138 4 148 30 Q180 30 176 56 Q196 72 168 82 Z"
                  fill="var(--surface)"
                  stroke="var(--ink)"
                  strokeWidth="2"
                />
                <text x="96" y="52" textAnchor="middle" className="c4-cloud-t">
                  ₹0 to ₹40 lakh
                </text>
                <text x="96" y="68" textAnchor="middle" className="c4-cloud-s">
                  owed on expiry day
                </text>
                <path d="M70 86 l-6 12 M100 88 l-6 12 M130 86 l-6 12" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <Avatar name="Raj" mood="worried" size={56} title="Raj, worried" />
            </div>
          </Panel>

          <Panel n={2} caption={<>The obvious fix: hold all {ROW.lots} lots of the index when it is above 22,600, none when it is below. A switch.</>}>
            <Plot xDomain={[22300, 22900]} yDomain={[0, 110]} width={300} height={190} xTicks={3} yTicks={2} xLabel="index" yLabel="lots held" margin={{ top: 16, right: 10, bottom: 30, left: 34 }} axisY={0} ariaLabel="A step: zero lots below the strike, one hundred above">
              <VLine at={ROW.K} />
              <Curve
                pts={[
                  [22300, 0],
                  [ROW.K, 0],
                  [ROW.K, 100],
                  [22900, 100],
                ]}
                role="approx"
                smooth={false}
                width={2.5}
              />
              <Label at={[ROW.K, 100]} text={`${ROW.lots} lots`} dx={8} dy={-4} role="approx" />
              <Label at={[22310, 0]} text="none" dx={4} dy={-6} role="approx" />
            </Plot>
          </Panel>

          <Panel n={3} caption={<>Monday, minute by minute — the path is <em>simulated</em> between the real closes {n0(REAL_DAY.fromClose)} → {n0(REAL_DAY.toClose)}. Each time it re-crosses the strike, the switch flips and the {EPS}-point gap is paid.</>}>
            <div className="c4-run">
              <Plot xDomain={[0, MINUTES]} yDomain={[22500, 22800]} width={300} height={190} xTicks={3} yTicks={3} xLabel="minute" yLabel="index" margin={{ top: 16, right: 10, bottom: 30, left: 44 }} axisY={22500} ariaLabel="A simulated minute path for Monday crossing the strike many times">
                <HLine at={ROW.K} />
                <Label at={[MINUTES, ROW.K]} text="22,600" anchor="end" dx={-4} dy={-4} />
                {shown.length > 1 && <Curve pts={shown} role={heldNow ? "approx" : "ghost"} width={1.4} smooth={false} />}
                {tradesSoFar.map((x) => (
                  <Marker key={x.i} at={[x.i, path[x.i]]} role="error" r={3} />
                ))}
                {t > 0 && <Marker at={[t, path[t]]} role="ink" r={4} />}
              </Plot>
              <div className="c4-run-counter" aria-live="polite">
                <span className="c4-run-k">round trips</span>
                <span className="c4-run-v">{trips}</span>
                <span className="c4-run-k">cost</span>
                <span className="c4-run-v c4-err">{trips ? lakh(trips * TRIP_COST) : "₹0"}</span>
              </div>
            </div>
          </Panel>

          <Panel n={4} caption={<>Instead: {n3(G0.delta)} of a lot per call — the <span className="c4-err">slope</span> of the price curve where the index is now, {n0(ROW.F)}.</>}>
            <Plot xDomain={[22000, 23200]} yDomain={[0, 650]} width={300} height={190} xTicks={3} yTicks={3} xLabel="index" yLabel="call price" margin={{ top: 16, right: 10, bottom: 30, left: 34 }} axisY={0} ariaLabel="The price curve at eleven days with its tangent at the current index">
              <Curve pts={curve} role="truth" width={2} />
              <Curve pts={tangent} role="error" width={2} smooth={false} />
              <Marker at={[ROW.F, G0.price]} role="ink" r={4} />
              <Label at={[ROW.F + 300, G0.price + 300 * G0.delta]} text={`slope ${n3(G0.delta)}`} role="error" anchor="start" dx={6} dy={16} />
            </Plot>
          </Panel>
        </Comic>
        <div className="c4-says">
          <Says who="Raj" mood="thinking">
            Half a lot now; I'll change it when the curve tells me to.
          </Says>
        </div>
      </div>
    </Figure>
  );
}
