import "./figures.css";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, VLine, type Pt } from "../../../ui/Plot";
import { Toggle } from "../../../ui/controls";
import { KEY, ROW, daysLabel, gammaLot100, greeks, n0, n1, n2, n3, price, rs, rsSigned, thetaDay } from "./row";
import { D_MAX, F_MAX, F_MIN } from "./surface";
import type { Probe } from "./Surface3D";
import { HeatMap } from "./HeatMap";
import { useLightOnView } from "./lit";

/**
 * Figure 2 — stand on the surface. C3's curve at 11 days, flat; press "stack" and copies at 8, 5, 3, 1 days and the
 * hockey stick slide back; then the surface (Three.js, or a heat-map when WebGL is missing) with a probe you drag and,
 * beside it, the 2-D slice at the probe's day: height, slope (red), bend (yellow). "Look along time" turns the camera
 * and the readout becomes the sinking rate. Controls: probe + toggle. Readouts: 3. Lights price, gamma, theta.
 */

const Surface3D = lazy(() => import("./Surface3D").then((m) => ({ default: m.Surface3D })));

const STACK_DAYS = [11, 8, 5, 3, 1, 0];
const SHIFT_F = -55; // oblique offsets per copy, in data units
const SHIFT_V = 95;
const START: Probe = { F: ROW.F, days: ROW.days };

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function curveAt(days: number, step = 20): Pt[] {
  const out: Pt[] = [];
  for (let F = F_MIN; F <= F_MAX + 1e-6; F += step) out.push([F, days <= 0 ? Math.max(F - ROW.K, 0) : price(F, days)]);
  return out;
}

export function F2Surface() {
  const root = useRef<HTMLDivElement>(null);
  useLightOnView(root, ["price", "gamma", "theta"]);
  const [phase, setPhase] = useState<"flat" | "stacking" | "surface">("flat");
  const [prog, setProg] = useState(0);
  const [probe, setProbe] = useState<Probe>(START);
  const [alongTime, setAlongTime] = useState(false);
  const [gl, setGl] = useState<boolean | null>(null);
  useEffect(() => setGl(hasWebGL()), []);

  useEffect(() => {
    if (phase !== "stacking") return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / 2600);
      setProg(u);
      if (u < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setPhase("surface"), 350);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const flatCurves = useMemo(() => STACK_DAYS.map((d) => curveAt(d)), []);

  // the slice at the probe
  const g = greeks(probe.F, probe.days);
  const slice: Pt[] = useMemo(() => (alongTime ? timeSlice(probe.F) : curveAt(probe.days)), [alongTime, probe.F, probe.days]);
  const V = g.price;
  const tanF: Pt[] = [
    [probe.F - 160, V - 160 * g.delta],
    [probe.F + 160, V + 160 * g.delta],
  ];
  const arc: Pt[] = useMemo(() => {
    const out: Pt[] = [];
    for (let h = -320; h <= 320; h += 20) out.push([probe.F + h, V + g.delta * h + 0.5 * g.gamma * h * h]);
    return out;
  }, [probe.F, V, g.delta, g.gamma]);
  const thDay = thetaDay(g.thetaYr); // per unit per calendar day (negative)
  const tanT: Pt[] = [
    [probe.days + 1.2, V - 1.2 * thDay],
    [probe.days - 1.2, V + 1.2 * thDay],
  ];
  const sliceMax = Math.max(60, ...slice.map((p) => p[1]));
  const yTop = alongTime ? niceTop(sliceMax) : 850;

  const ridge11 = KEY.ridge["11"];
  return (
    <Figure
      n="2"
      prompt={
        phase === "surface" ? (
          <>
            Drag the bead anywhere on the surface (or use the arrow keys). The slice beside it is the surface cut at the bead's day: its height, its
            slope, its bend. Then turn the camera and read the other direction.
          </>
        ) : (
          <>
            This is C3's curve: the 22,600 call against the index with 11 days left. It is one slice of something bigger. Press <em>stack</em>.
          </>
        )
      }
      controls={
        phase === "surface" ? (
          <>
            <Toggle label="look along time" on={alongTime} onChange={setAlongTime} />
            <span className="c4-ctl-note">
              probe at {n0(probe.F)}, {daysLabel(probe.days)}
              {gl === false && " · heat-map (no WebGL here)"}
            </span>
            <button
              type="button"
              className="btn c4-quiet"
              onClick={() => {
                setProbe(START);
                setAlongTime(false);
              }}
            >
              back to Friday
            </button>
          </>
        ) : (
          <button type="button" className="btn primary" disabled={phase !== "flat"} onClick={() => setPhase("stacking")}>
            stack
          </button>
        )
      }
      observe={
        phase === "surface" ? (
          <>
            One surface, three readings. Standing at {n0(ROW.F)} with 11 days left: height <strong>{n2(ridge11.price)}</strong> a unit (
            {n1(KEY.slices["11"]["22600"].price)} on the ridge itself), <span className="c4-err">slope {n3(ridge11.delta)}</span>,{" "}
            <span className="c4-approx">bend {n2(gammaLot100(ridge11.gamma))} units per 100 points per lot</span>. Turn along time and the same bead
            reads a <strong>sinking rate of {rs(ridge11.theta_day, 2)} a unit per calendar day</strong> — {rsSigned((ridge11.theta_day * ROW.units) / 1)} a
            day into Raj's row. Tiles 1, 3 and 4.
          </>
        ) : (
          <>
            Behind the 11-day curve sit the 8-, 5-, 3- and 1-day curves and, at the back, the hockey stick of expiry day. Fill in between them and you
            have the whole object this chapter is about.
          </>
        )
      }
    >
      <div ref={root} className={"c4-stage3d " + (phase === "surface" ? "live" : "")}>
        <div className="c4-stage">
          {phase !== "surface" && (
            <Plot xDomain={[F_MIN - 300, F_MAX]} yDomain={[0, 1350]} width={560} height={400} xTicks={5} yTicks={4} xLabel="index" yLabel="call price" axisY={0} ariaLabel="The price curve at eleven days; copies at fewer days slide back behind it">
              <VLine at={ROW.K} />
              {STACK_DAYS.map((d, k) => {
                if (k === 0) return null;
                const u = Math.max(0, Math.min(1, (prog * STACK_DAYS.length - (k - 0.3)) / 1.3));
                if (u <= 0) return null;
                const e = 1 - Math.pow(1 - u, 2);
                const pts: Pt[] = flatCurves[k].map((p) => [p[0] + SHIFT_F * k * e, p[1] + SHIFT_V * k * e]);
                return (
                  <g key={d}>
                    <Curve pts={pts} role={d === 0 ? "ink" : "truth"} width={d === 0 ? 2 : 1.4} opacity={0.25 + 0.75 * u} smooth={d !== 0} />
                    {u > 0.95 && <Label at={[pts[pts.length - 1][0], pts[pts.length - 1][1]]} text={d === 0 ? "expiry" : `${d} d`} anchor="end" dx={-4} dy={-6} role={d === 0 ? undefined : "truth"} />}
                  </g>
                );
              })}
              <Curve pts={flatCurves[0]} role="truth" width={2.4} />
              <Label at={[F_MAX, flatCurves[0][flatCurves[0].length - 1][1]]} text="11 d" anchor="end" dx={-4} dy={-6} role="truth" />
              <Marker at={[ROW.F, price(ROW.F, 11)]} role="error" r={4} />
            </Plot>
          )}
          {phase === "surface" &&
            (gl ? (
              <Suspense fallback={<div className="c4-gl-wait">building the surface…</div>}>
                <Surface3D probe={probe} onProbe={setProbe} alongTime={alongTime} height={400} />
              </Suspense>
            ) : (
              <HeatMap probe={probe} onProbe={setProbe} alongTime={alongTime} height={360} />
            ))}
        </div>

        {phase === "surface" && (
          <div className="c4-slice">
            <div className="c4-slice-head">{alongTime ? <>the slice along time at index {n0(probe.F)}</> : <>the slice across the index at {daysLabel(probe.days)} left</>}</div>
            {!alongTime ? (
              <Plot xDomain={[F_MIN, F_MAX]} yDomain={[0, yTop]} width={360} height={250} xTicks={4} yTicks={4} xLabel="index" yLabel="call price" axisY={0} margin={{ top: 14, right: 12, bottom: 34, left: 44 }} ariaLabel="The price curve at the probe's day with its tangent and the bend drawn at the probe">
                <VLine at={ROW.K} />
                <Curve pts={slice} role="truth" width={2} />
                <Curve pts={arc} role="approx" width={2} dash="5 4" />
                <Curve pts={tanF} role="error" width={2.2} smooth={false} />
                <Marker at={[probe.F, V]} role="error" r={4.5} />
                <Label at={[probe.F, V]} text={`height ${n1(V)}`} dx={probe.F > 22900 ? -8 : 10} dy={-10} anchor={probe.F > 22900 ? "end" : "start"} />
              </Plot>
            ) : (
              <Plot xDomain={[D_MAX, 0]} yDomain={[0, yTop]} width={360} height={250} xTicks={6} yTicks={4} xLabel="days left →  time passes" yLabel="call price" axisX={D_MAX} axisY={0} margin={{ top: 14, right: 12, bottom: 34, left: 44 }} ariaLabel="The price against days left at the probe's index, with the sinking rate drawn as a tangent">
                <Curve pts={slice} role="truth" width={2} />
                <Curve pts={tanT} role="error" width={2.2} smooth={false} />
                <Marker at={[probe.days, V]} role="error" r={4.5} />
                <Label at={[probe.days, V]} text={`height ${n1(V)}`} dx={10} dy={-10} />
              </Plot>
            )}
            <div className="c4-reads">
              <div className="c4-read">
                <span className="k">height · price per unit</span>
                <span className="v">{rs(V, 2)}</span>
              </div>
              {!alongTime ? (
                <>
                  <div className="c4-read err">
                    <span className="k">slope · lots of index per call</span>
                    <span className="v">{n3(g.delta)}</span>
                  </div>
                  <div className="c4-read approx">
                    <span className="k">bend · units per 100 pts, per lot</span>
                    <span className="v">{n2(gammaLot100(g.gamma))}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="c4-read err">
                    <span className="k">sinking rate · per unit per calendar day</span>
                    <span className="v">{rs(thDay, 2)}</span>
                  </div>
                  <div className="c4-read">
                    <span className="k">for Raj's row · per calendar day</span>
                    <span className="v">{rsSigned(thDay * ROW.units)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Figure>
  );
}

function timeSlice(F: number): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k <= 66; k++) {
    const d = (D_MAX * k) / 66;
    out.push([d, d <= 0 ? Math.max(F - ROW.K, 0) : price(F, d)]);
  }
  return out;
}
function niceTop(v: number): number {
  const steps = [100, 200, 300, 400, 500, 600, 700, 850];
  return steps.find((s) => s >= v * 1.1) ?? 850;
}
