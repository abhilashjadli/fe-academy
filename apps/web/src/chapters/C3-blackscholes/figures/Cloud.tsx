import { useMemo, type ReactNode } from "react";
import { Curve, Label, Marker, Plot, usePlot } from "../../../ui/Plot";
import { ROW, n0 } from "./c3";

/**
 * The cloud of Figures 1 and 2: 2,000 equally likely futures of the index 11 days from now (exact quantiles, as in B5 F3),
 * piled sideways at the expiry into a dot histogram — a bell lying on the expiry line, centred on the forward. A strike
 * line crosses it; dots above are lit.
 */

export const PRICE: [number, number] = [21600, 23600];
export const DAYS_AXIS: [number, number] = [0, 16];
const BIN = 25;

export interface Dot {
  i: number;
  price: number;
  k: number; // position within its bin, from the expiry line outward
}

export function layoutCloud(futures: number[]): { dots: Dot[]; maxCount: number } {
  const nb = Math.round((PRICE[1] - PRICE[0]) / BIN);
  const counts = new Array<number>(nb).fill(0);
  const dots: Dot[] = [];
  for (let i = 0; i < futures.length; i++) {
    const p = futures[i];
    if (p < PRICE[0] || p >= PRICE[1]) continue; // off the axis: a handful at 40 % wobble
    const b = Math.floor((p - PRICE[0]) / BIN);
    dots.push({ i, price: p, k: counts[b]++ });
  }
  return { dots, maxCount: Math.max(1, ...counts) };
}

/** Price ticks with thousands separators, drawn inside the frame (Plot children are clipped to it; its own ticks would print 22600). */
export function PriceTicks({ at }: { at: number[] }) {
  const { y, inner } = usePlot();
  return (
    <g>
      {at.map((p) => (
        <g key={p}>
          <line x1={inner.left} x2={inner.left + inner.width} y1={y(p)} y2={y(p)} className="c3-tick" />
          <text className="label c3-ticklabel" x={inner.left + 4} y={y(p) - 3}>
            {n0(p)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Y ticks drawn inside the frame, formatted (Plot children are clipped to the frame, so an outside label would vanish). */
export function YTicksInside({ at, fmt }: { at: number[]; fmt: (v: number) => string }) {
  const { y, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <text key={v} className="label c3-ticklabel" x={inner.left + 4} y={y(v) - 3}>
          {fmt(v)}
        </text>
      ))}
    </g>
  );
}

/** X ticks drawn inside the frame, just above the bottom edge. */
export function XTicksInside({ at, fmt }: { at: number[]; fmt: (v: number) => string }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <text key={v} className="label c3-ticklabel" x={x(v)} y={inner.top + inner.height - 5} textAnchor="middle">
          {fmt(v)}
        </text>
      ))}
    </g>
  );
}

export function Dots({ dots, maxCount, K, kind = "call", lit = "approx", dim = true }: { dots: Dot[]; maxCount: number; K: number; kind?: "call" | "put"; lit?: "approx" | "truth" | "none"; dim?: boolean }) {
  const { x, y } = usePlot();
  const pxPerDay = x(1) - x(0);
  const avail = (DAYS_AXIS[1] - ROW.days - 0.4) * pxPerDay;
  const pitch = Math.min(4.4, avail / maxCount);
  const r = Math.max(0.9, Math.min(1.7, pitch * 0.4));
  const x0 = x(ROW.days) + 3;
  return (
    <g className="c3-dots">
      {dots.map((d) => {
        const isLit = kind === "call" ? d.price > K : d.price < K;
        const cls = isLit && lit !== "none" ? "lit " + lit : dim ? "ghost" : "plain";
        return <circle key={d.i} className={cls} cx={x0 + (d.k + 0.5) * pitch} cy={y(d.price)} r={r} />;
      })}
    </g>
  );
}

/** The strike line across the cloud, with its handle. */
export function StrikeLine({ K, draggable, label }: { K: number; draggable?: boolean; label?: string }) {
  const { x, y, inner } = usePlot();
  const yy = y(K);
  return (
    <g className={draggable ? "c3-strike handle" : "c3-strike"}>
      <line x1={inner.left} x2={inner.left + inner.width} y1={yy} y2={yy} />
      {draggable && <rect x={x(ROW.days) - 26} y={yy - 9} width={22} height={18} rx={3} className="c3-grip" />}
      {draggable && (
        <g className="c3-grip-lines">
          <line x1={x(ROW.days) - 21} x2={x(ROW.days) - 9} y1={yy - 3} y2={yy - 3} />
          <line x1={x(ROW.days) - 21} x2={x(ROW.days) - 9} y1={yy + 3} y2={yy + 3} />
        </g>
      )}
      <text className="label" x={x(6)} y={yy - 6} textAnchor="middle">
        {label ?? `strike ${n0(K)}`}
      </text>
    </g>
  );
}

export function CloudPlot({ futures, K, kind = "call", onDragK, children, height = 400, lit = "approx", dim = true, ariaLabel }: { futures: number[]; K: number; kind?: "call" | "put"; onDragK?: (price: number) => void; children?: ReactNode; height?: number; lit?: "approx" | "truth" | "none"; dim?: boolean; ariaLabel?: string }) {
  const lay = useMemo(() => layoutCloud(futures), [futures]);
  return (
    <Plot
      xDomain={DAYS_AXIS}
      yDomain={PRICE}
      width={520}
      height={height}
      margin={{ top: 14, right: 12, bottom: 34, left: 16 }}
      xLabel="days from now"
      xTicks={8}
      yTicks={0}
      grid={false}
      axisY={PRICE[0]}
      onDrag={onDragK ? (_x, yv) => onDragK(yv) : undefined}
      ariaLabel={ariaLabel ?? `2,000 equally likely futures of the index at ${ROW.days} days, piled into a bell on the expiry line; a strike line at ${n0(K)} with the futures above it lit`}
    >
      <PriceTicks at={[21800, 22200, 22600, 23000, 23400]} />
      <Curve pts={[[0, ROW.F], [ROW.days, ROW.F]]} role="ghost" dash="4 4" width={1.2} smooth={false} />
      <Marker at={[0, ROW.F]} role="ink" r={4} />
      <Label at={[0, ROW.F]} text={`today: forward ${n0(ROW.F)}`} dx={8} dy={16} />
      <Curve pts={[[ROW.days, PRICE[0]], [ROW.days, PRICE[1]]]} role="ink" width={1} smooth={false} />
      <Label at={[ROW.days, PRICE[1]]} text={`expiry, ${ROW.days} days`} dx={-6} dy={12} anchor="end" />
      <Dots dots={lay.dots} maxCount={lay.maxCount} K={K} kind={kind} lit={lit} dim={dim} />
      <StrikeLine K={K} draggable={!!onDragK} label={onDragK ? `strike ${n0(K)} — drag` : `strike ${n0(K)}`} />
      {children}
    </Plot>
  );
}
