import "./figures.css";
import { useMemo, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, HLine, Label, Marker, Plot, VLine, type Pt } from "../../../ui/Plot";
import { Segmented, Slider } from "../../../ui/controls";
import { breakEvenMove } from "../../../engine/bs";
import { G0, KEY, ROW, indian, n0, n1, n3, price, rs, rsSigned, thetaDay } from "./row";
import { useLightOnView } from "./lit";

/**
 * Figure 5 — one dial: the bend pays for the clock. Tomorrow's move, −300 → +300, with Raj delta-hedged: two bars,
 * what the bend pays (½ × bend × move²) and what the clock charges (one day of theta); they tie at ±187 points, which
 * is one typical day's wobble. Second control: the wobble dial 10 / 15.9 / 25 % inflating the price curve (vega).
 * Lights the vega tile.
 */

type Wobble = "0.10" | "iv" | "0.25";
const WOBBLES: { id: Wobble; sigma: number; label: string }[] = [
  { id: "0.10", sigma: 0.1, label: "10 %" },
  { id: "iv", sigma: ROW.sigma, label: "15.9 %" },
  { id: "0.25", sigma: 0.25, label: "25 %" },
];

export function F5Dial() {
  const root = useRef<HTMLDivElement>(null);
  useLightOnView(root, ["vega"]);
  const [move, setMove] = useState(100);
  const [wob, setWob] = useState<Wobble>("iv");
  const sigma = WOBBLES.find((w) => w.id === wob)!.sigma;

  const thDay = thetaDay(G0.thetaYr); // negative, per unit per day
  const clock = -thDay; // what one day charges the buyer, per unit
  const bend = 0.5 * G0.gamma * move * move; // what the bend pays the buyer, per unit
  const be = useMemo(() => breakEvenMove(G0), []);
  const oneSigmaDay = ROW.sigma * ROW.F * Math.sqrt(1 / 365);
  const net = bend - clock; // for the buyer; Raj gets the opposite
  const parabola: Pt[] = useMemo(() => {
    const out: Pt[] = [];
    for (let m = -300; m <= 300; m += 10) out.push([m, 0.5 * G0.gamma * m * m]);
    return out;
  }, []);
  const barMax = 0.5 * G0.gamma * 300 * 300;

  // the wobble inset
  const inset = useMemo(() => WOBBLES.map((w) => ({ ...w, pts: curveAt(w.sigma) })), []);
  const vAt = price(ROW.F, ROW.days, sigma);
  const vegaPt = G0.vega / 100;
  const rho = KEY.atm.rho_per_pt;

  return (
    <Figure
      n="5"
      prompt={
        <>
          Raj has hedged the slope (Figure 1's half-lot per call), so the slope row is zero. Set tomorrow's move. Two things remain: what the bend pays
          and what the clock charges.
        </>
      }
      controls={
        <>
          <Slider label="tomorrow's move" value={move} min={-300} max={300} step={1} onChange={setMove} role="approx" fmt={(v) => (v > 0 ? "+" : "") + n0(v) + " pts"} width={200} />
          <Segmented label="wobble" value={wob} onChange={setWob} options={WOBBLES.map((w) => ({ id: w.id, label: w.label }))} />
        </>
      }
      observe={
        <>
          The two bars tie at <strong>±{n0(be)} points</strong> — and {n0(be)} points is one typical day's wobble: {(100 * ROW.sigma).toFixed(1)} % of{" "}
          {n0(ROW.F)}, scaled to a single day out of 365, is {n1(oneSigmaDay)}. So what the clock charges is exactly what an average day's bend pays. For
          Raj every quiet day is income, every {n0(be)}-point day is break-even, and a bigger day costs him. Turn the wobble down and the curve sinks
          towards the hockey stick: <strong>turning the wobble down looks like time passing</strong>. Tile 5.
        </>
      }
    >
      <div ref={root} className="c4-dial">
        <div className="c4-dial-main">
          <Plot xDomain={[-300, 300]} yDomain={[0, 30]} width={460} height={230} xTicks={6} yTicks={3} xLabel="tomorrow's move, pts" yLabel="₹ per unit" axisX={-300} axisY={0} margin={{ top: 14, right: 12, bottom: 34, left: 40 }} ariaLabel="The bend's payment as a parabola of the move against the clock's flat charge; they cross at plus and minus 187">
            <HLine at={clock} />
            <Curve pts={parabola} role="approx" width={2.2} />
            <VLine at={be} role="ghost" />
            <VLine at={-be} role="ghost" />
            <Label at={[-300, clock]} text={`the clock charges ${rs(clock, 2)}`} dx={6} dy={-6} />
            <Label at={[be, 0]} text={`+${n0(be)}`} dx={4} dy={-6} role="ghost" />
            <Label at={[-be, 0]} text={`−${n0(be)}`} dx={4} dy={-6} role="ghost" />
            <Marker at={[move, bend]} role="approx" r={5} />
            <Label at={[move, bend]} text={`the bend pays ${rs(bend, 2)}`} role="approx" dx={move > 80 ? -10 : 10} dy={-10} anchor={move > 80 ? "end" : "start"} />
          </Plot>
          <div className="c4-bars">
            <Bar label="the bend pays" value={bend} max={barMax} cls="approx" text={rs(bend, 2) + " a unit"} />
            <Bar label="the clock charges" value={clock} max={barMax} cls="truth" text={rs(clock, 2) + " a unit"} />
            <div className={"c4-net " + (Math.abs(net) < 0.6 ? "tie" : net > 0 ? "cost" : "income")}>
              {Math.abs(net) < 0.6 ? (
                <>break-even: the bend pays what the clock charges</>
              ) : (
                <>
                  for Raj's {indian(-ROW.units)} units: <strong>{rsSigned(net * ROW.units)}</strong> on the day
                </>
              )}
            </div>
          </div>
        </div>

        <div className="c4-dial-side">
          <div className="c4-slice-head">the wobble dial inflates the whole curve</div>
          <Plot xDomain={[22000, 23200]} yDomain={[0, 700]} width={320} height={200} xTicks={3} yTicks={3} xLabel="index" yLabel="call price, 11 d" axisY={0} margin={{ top: 14, right: 10, bottom: 32, left: 40 }} ariaLabel="The price curve at 10, 15.9 and 25 % wobble; the chosen one is drawn solid">
            <VLine at={ROW.K} />
            {inset.map((w) => (
              <Curve key={w.id} pts={w.pts} role={w.id === wob ? "truth" : "ghost"} width={w.id === wob ? 2.4 : 1.2} />
            ))}
            <Marker at={[ROW.F, vAt]} role="ink" r={4} />
            <Label at={[ROW.F, vAt]} text={`${n1(vAt)} at ${WOBBLES.find((w) => w.id === wob)!.label}`} dx={10} dy={-6} />
          </Plot>
          <div className="c4-reads">
            <div className="c4-read">
              <span className="k">vega · per unit per vol point</span>
              <span className="v">{rs(vegaPt, 2)}</span>
            </div>
            <div className="c4-read err">
              <span className="k">for Raj's row · per vol point</span>
              <span className="v">{rs(vegaPt * ROW.units)}</span>
            </div>
          </div>
          <div className="c4-foot">
            Rho, for the record: {rs(rho * ROW.lot, 0)} per lot per point of interest rate ({n3(rho).replace("-", "−")} a unit) — it takes a back seat.
          </div>
        </div>
      </div>
    </Figure>
  );
}

function Bar({ label, value, max, cls, text }: { label: string; value: number; max: number; cls: string; text: string }) {
  const w = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className={"c4-bar " + cls}>
      <span className="c4-bar-k">{label}</span>
      <span className="c4-bar-track" role="img" aria-label={`${label}: ${text}`}>
        <span className="c4-bar-fill" style={{ width: w + "%" }} />
      </span>
      <span className="c4-bar-v">{text}</span>
    </div>
  );
}

function curveAt(sigma: number): Pt[] {
  const out: Pt[] = [];
  for (let F = 22000; F <= 23200 + 1e-6; F += 20) out.push([F, price(F, ROW.days, sigma)]);
  return out;
}
