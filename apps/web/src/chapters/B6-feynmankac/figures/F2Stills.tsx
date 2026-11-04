import { useMemo } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { M } from "../../../ui/Math";
import { Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { backwardGrid, curvatureArrows, gridColumn, optionPayoffInX } from "../../../engine/feynmankac";
import "./figures.css";

/**
 * Figure 2 — three captioned stills, no controls. The value profile at three columns of Figure 1's grid: expiry (the hockey stick),
 * one week back (the kink rounded, with arcs on the bend and arrows for where each point moves next), six months back (the smooth
 * curve, 4.76 at 42). The ½σ²S²∂²V/∂S² term is named under the arrows, after it has been a picture twice.
 */

const P = { S: 42, K: 40, r: 0.1, sigma: 0.2, T: 0.5 };
const N_GRID = 100;
const DX_FACTOR = 1.5;
const K0 = N_GRID; // the grid is run from an extra six months back so every column on screen is wide (as in Figure 1)
const WEEK_STEPS = 4; // 4 × (0.5 / 100) years ≈ one week
const MONTH_STEPS = 17; // ≈ one month of the grid's steps, for the arrows' length
const PRICE: [number, number] = [32, 50];
const VALUE: [number, number] = [0, 10];
const f2 = format(".2f");

function Arrows({ pts, push }: { pts: Pt[]; push: number[] }) {
  const { x, y } = usePlot();
  const out: React.ReactNode[] = [];
  let drawn = 0;
  for (let j = 1; j + 1 < pts.length && drawn < 9; j++) {
    if (Math.abs(push[j]) < 0.08) continue;
    const [S, V] = pts[j];
    const x0 = x(S),
      y0 = y(V),
      y1 = y(V + push[j]);
    // the bend: a short arc through the two neighbours, drawn as a halo
    const a = pts[j - 1],
      b = pts[j + 1];
    const cx = 2 * x0 - (x(a[0]) + x(b[0])) / 2;
    const cy = 2 * y0 - (y(a[1]) + y(b[1])) / 2;
    const arc = `M${x(a[0])} ${y(a[1])} Q${cx} ${cy} ${x(b[0])} ${y(b[1])}`;
    out.push(
      <g key={j}>
        <path className="arc" d={arc} />
        <path className="arc-ink" d={arc} />
        <line className="arrow" x1={x0} y1={y0} x2={x0} y2={y1} />
        <path className="arrowhead" d={`M${x0 - 3.5} ${y1 + (y1 < y0 ? 5 : -5)} L${x0} ${y1} L${x0 + 3.5} ${y1 + (y1 < y0 ? 5 : -5)} Z`} />
      </g>,
    );
    drawn++;
  }
  return <>{out}</>;
}

function Still({ pts, title, push, probe, children }: { pts: Pt[]; title: string; push?: number[]; probe?: boolean; children: React.ReactNode }) {
  return (
    <div className="b6-still">
      <Plot xDomain={PRICE} yDomain={VALUE} width={300} height={224} margin={{ top: 14, right: 12, bottom: 40, left: 36 }} xLabel="price" yLabel="value" xTicks={4} yTicks={4} ariaLabel={title}>
        <Curve pts={[[P.K, VALUE[0]], [P.K, VALUE[1]]]} role="error" width={1} dash="4 3" smooth={false} />
        <Curve pts={pts} role={probe ? "truth" : "approx"} width={2.2} smooth={false} />
        {push && <Arrows pts={pts} push={push} />}
        {probe && (
          <>
            <Marker at={[P.S, pts.find((p) => Math.abs(p[0] - P.S) < 1e-6)?.[1] ?? NaN]} role="truth" r={5} />
            <Label at={[P.S, pts.find((p) => Math.abs(p[0] - P.S) < 1e-6)?.[1] ?? NaN]} text={`${f2(pts.find((p) => Math.abs(p[0] - P.S) < 1e-6)?.[1] ?? NaN)} at 42`} role="truth" dx={-8} dy={-10} anchor="end" />
          </>
        )}
        <Label at={[P.K, VALUE[1]]} text="strike 40" role="error" dx={-4} dy={12} anchor="end" />
      </Plot>
      <div className="b6-still-cap">{children}</div>
    </div>
  );
}

export function F2Stills() {
  const g = useMemo(() => {
    const dt = P.T / N_GRID;
    return backwardGrid({ drift: P.r - 0.5 * P.sigma * P.sigma, vol: P.sigma, rate: P.r, x0: Math.log(P.S), T: 2 * P.T, steps: K0 + N_GRID, dx: P.sigma * Math.sqrt(DX_FACTOR * dt), payoff: optionPayoffInX("call", P.K) });
  }, []);
  const column = (k: number): Pt[] => {
    const { x, v } = gridColumn(g, K0 + k);
    return x.map((xi, j) => [Math.exp(xi), v[j]] as Pt).filter((p) => p[0] >= PRICE[0] - 2 && p[0] <= PRICE[1] + 2);
  };
  const expiry = column(N_GRID);
  const week = column(N_GRID - WEEK_STEPS);
  const today = column(0);
  // the push from the bend alone, over the next month of steps: D·δt·(second difference)/δx² with D = ½σ² in ln S
  const push = useMemo(() => {
    const { x, v } = gridColumn(g, K0 + N_GRID - WEEK_STEPS);
    const perStep = curvatureArrows(v, g.dx, g.dt, 0.5 * P.sigma * P.sigma);
    const keep = x.map((xi) => Math.exp(xi) >= PRICE[0] - 2 && Math.exp(xi) <= PRICE[1] + 2);
    return perStep.map((p) => p * MONTH_STEPS).filter((_, j) => keep[j]);
  }, [g]);

  return (
    <Figure
      n="2"
      prompt={<>The same grid, read column by column. Nothing to press: three stills of the value against price, at expiry, a week before, and six months before.</>}
      observe={
        <>
          A cell is the plain average of its neighbours <strong>plus a push proportional to the bend</strong>. On a straight part the average is the point itself — nothing moves. At the kink the neighbours sit above the point, so it is pulled up. That push is the only thing the grid adds.
        </>
      }
    >
      <div className="b6-stills">
        <Still pts={expiry} title="At expiry: the payoff, a hockey stick with its kink at 40">
          <strong>At expiry.</strong> The value is the payoff: nothing below 40, then a straight line. The kink is the only place the line bends.
        </Still>
        <Still pts={week} push={push} title="One week before expiry: the kink has rounded; arcs mark the bend and arrows show the push over the next month">
          <strong>One week before.</strong> The kink has rounded. The arcs mark the bend; each arrow is how far that point moves over the next month from the bend alone.
          <span className="b6-term">
            the push: <M tex={"\\tfrac12\\,\\sigma^2 S^2\\,\\dfrac{\\partial^2 V}{\\partial S^2}"} />, read as ½ × wobble² × price² × bend
          </span>
        </Still>
        <Still pts={today} probe title="Six months before expiry: the smooth curve, 4.76 at 42">
          <strong>Six months before.</strong> The bend has spread along the whole rod, and the curve is smooth. At 42 it reads {f2(g.layers[K0][K0])} — the number both programs printed.
        </Still>
      </div>
    </Figure>
  );
}
