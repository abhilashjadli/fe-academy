import { useMemo } from "react";
import { usePlot } from "../../../ui/Plot";

/** Shared SVG parts for the F2 figures: tick labels drawn inside the frame, many dots as one path, an error bar. */

export function XTicks({ at, fmt, label }: { at: number[]; fmt?: (v: number) => string; label?: string }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <text key={v} className="label f2-ticklabel" x={x(v)} y={inner.top + inner.height - 4} textAnchor="middle">
          {fmt ? fmt(v) : v}
        </text>
      ))}
      {label && (
        <text className="label f2-ticklabel" x={inner.left + inner.width} y={inner.top + inner.height - 4} textAnchor="end">
          {label}
        </text>
      )}
    </g>
  );
}

export function YTicks({ at, fmt }: { at: number[]; fmt: (v: number) => string }) {
  const { y, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <g key={v}>
          <line x1={inner.left} x2={inner.left + inner.width} y1={y(v)} y2={y(v)} className="f2-tick" />
          <text className="label f2-ticklabel" x={inner.left + 4} y={y(v) - 3}>
            {fmt(v)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** many dots as one path element */
export function DotsPath({ xs, ys, role = "truth", r = 2.6, opacity = 0.9 }: { xs: ArrayLike<number>; ys: ArrayLike<number>; role?: "approx" | "truth" | "error" | "ghost" | "ink"; r?: number; opacity?: number }) {
  const { x, y } = usePlot();
  const [lo, hi] = y.domain();
  const d = useMemo(() => {
    let s = "";
    const pad = (hi - lo) * 0.2;
    for (let i = 0; i < xs.length; i++) {
      const v = Math.max(lo - pad, Math.min(hi + pad, ys[i]));
      const px = x(xs[i]);
      const py = y(v);
      if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
      s += `M${(px - r).toFixed(1)},${py.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
    }
    return s;
  }, [xs, ys, x, y, r, lo, hi]);
  return <path d={d} fill={`var(--${role})`} stroke="none" opacity={opacity} />;
}

/** a vertical error bar ± one standard error with a dot at the mean */
export function ErrorBar({ at, se, role = "approx", r = 4, cap = 5, width = 1.6, opacity = 1 }: { at: [number, number]; se: number; role?: "approx" | "truth" | "error" | "ghost" | "ink"; r?: number; cap?: number; width?: number; opacity?: number }) {
  const { x, y } = usePlot();
  const px = x(at[0]);
  const y0 = y(at[1] - se);
  const y1 = y(at[1] + se);
  return (
    <g opacity={opacity}>
      <line x1={px} x2={px} y1={y0} y2={y1} stroke={`var(--${role})`} strokeWidth={width} />
      <line x1={px - cap} x2={px + cap} y1={y0} y2={y0} stroke={`var(--${role})`} strokeWidth={width} />
      <line x1={px - cap} x2={px + cap} y1={y1} y2={y1} stroke={`var(--${role})`} strokeWidth={width} />
      <circle cx={px} cy={y(at[1])} r={r} fill={`var(--${role})`} stroke="var(--surface-figure)" strokeWidth={1.5} />
    </g>
  );
}

/** a staircase (step-after) through points, values ≤ 0 skipped */
export function Stair({ xs, ys, role = "approx", width = 1.8, dash, opacity = 1 }: { xs: ArrayLike<number>; ys: ArrayLike<number>; role?: "approx" | "truth" | "error" | "ghost" | "ink"; width?: number; dash?: string; opacity?: number }) {
  const { x, y } = usePlot();
  const d = useMemo(() => {
    let s = "";
    let prev: number | null = null;
    for (let i = 0; i < xs.length; i++) {
      if (!(ys[i] > 0)) {
        prev = null;
        continue;
      }
      const px = x(xs[i]).toFixed(1);
      const py = y(ys[i]).toFixed(1);
      if (prev === null) s += `M${px},${py}`;
      else s += `L${px},${prev}L${px},${py}`;
      prev = Number(py);
    }
    return s;
  }, [xs, ys, x, y]);
  return <path d={d} fill="none" stroke={`var(--${role})`} strokeWidth={width} strokeDasharray={dash} opacity={opacity} strokeLinejoin="miter" />;
}
