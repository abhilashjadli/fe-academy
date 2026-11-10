import { useMemo } from "react";
import { usePlot } from "../../../ui/Plot";
import { n0 } from "./d3";

/**
 * C3's cloud, generalised for this chapter: futures of the index piled sideways into a dot histogram on a vertical price axis,
 * starting at `xAt` (data units) and growing to the right. The bins are 25 points wide, as in C3; `range` clips to the axis.
 */
export const PRICE: [number, number] = [21600, 23600];
export const DAYS_AXIS: [number, number] = [0, 16];
const BIN = 25;

export interface PileDot {
  price: number;
  k: number;
}
export function pile(futures: ArrayLike<number>, range: [number, number], bin = BIN): { dots: PileDot[]; maxCount: number; off: number } {
  const nb = Math.round((range[1] - range[0]) / bin);
  const counts = new Array<number>(nb).fill(0);
  const dots: PileDot[] = [];
  let off = 0;
  for (let i = 0; i < futures.length; i++) {
    const p = futures[i];
    if (p < range[0] || p >= range[1]) {
      off++;
      continue;
    }
    const b = Math.floor((p - range[0]) / bin);
    dots.push({ price: p, k: counts[b]++ });
  }
  return { dots, maxCount: Math.max(1, ...counts), off };
}

/** The pile drawn: `widthPx` is the room to the right of xAt; dots shrink to fit the fullest bin. */
export function DotPile({ futures, xAt, widthPx, range = PRICE, role = "plain", maxPitch = 4.4, bin = BIN }: { futures: ArrayLike<number>; xAt: number; widthPx: number; range?: [number, number]; role?: "plain" | "truth" | "approx" | "error" | "ghost"; maxPitch?: number; bin?: number }) {
  const { x, y } = usePlot();
  const lay = useMemo(() => pile(futures, range, bin), [futures, range, bin]);
  const pitch = Math.min(maxPitch, widthPx / lay.maxCount);
  const r = Math.max(0.9, Math.min(1.7, pitch * 0.4));
  const x0 = x(xAt) + 3;
  return (
    <g className={"d3-dots " + role}>
      {lay.dots.map((d, i) => (
        <circle key={i} cx={x0 + (d.k + 0.5) * pitch} cy={y(d.price)} r={r} />
      ))}
    </g>
  );
}

/** Price ticks with thousands separators, drawn inside the frame (C3's). */
export function PriceTicks({ at, dx = 4, side = "left" }: { at: number[]; dx?: number; side?: "left" | "right" }) {
  const { y, inner } = usePlot();
  return (
    <g>
      {at.map((p) => (
        <g key={p}>
          <line x1={inner.left} x2={inner.left + inner.width} y1={y(p)} y2={y(p)} className="d3-tick" />
          <text className="label d3-ticklabel" x={side === "left" ? inner.left + dx : inner.left + inner.width - dx} y={y(p) - 3} textAnchor={side === "left" ? "start" : "end"}>
            {n0(p)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Quantiles of a cross-section, for the growing fan. */
export function quantiles(xs: ArrayLike<number>, qs: number[]): number[] {
  const a = Array.from(xs).sort((p, q) => p - q);
  return qs.map((q) => a[Math.min(a.length - 1, Math.max(0, Math.round(q * (a.length - 1))))]);
}
