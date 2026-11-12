import { useMemo } from "react";
import { usePlot } from "../../../ui/Plot";

/** Shared SVG parts for the F1 figures: tick labels drawn inside the frame, and many dots as one path. */

export function XTicks({ at, fmt, label }: { at: number[]; fmt?: (v: number) => string; label?: string }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <text key={v} className="label f1-ticklabel" x={x(v)} y={inner.top + inner.height - 4} textAnchor="middle">
          {fmt ? fmt(v) : v}
        </text>
      ))}
      {label && (
        <text className="label f1-ticklabel" x={inner.left + inner.width} y={inner.top + inner.height - 4} textAnchor="end">
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
          <line x1={inner.left} x2={inner.left + inner.width} y1={y(v)} y2={y(v)} className="f1-tick" />
          <text className="label f1-ticklabel" x={inner.left + 4} y={y(v) - 3}>
            {fmt(v)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** many dots as one path element (no per-dot React elements); values beyond the clamp are pinned to the frame's edge */
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

/** a polyline as one path, values clamped so a billion-rupee saw-tooth stays a finite path inside the frame's clip */
export function RowPath({ xs, ys, role = "approx", width = 1.8, dash, opacity = 1 }: { xs: ArrayLike<number>; ys: ArrayLike<number>; role?: "approx" | "truth" | "error" | "ghost" | "ink"; width?: number; dash?: string; opacity?: number }) {
  const { x, y } = usePlot();
  const [lo, hi] = y.domain();
  const d = useMemo(() => {
    let s = "";
    const pad = (hi - lo) * 0.5;
    for (let i = 0; i < xs.length; i++) {
      const v = Math.max(lo - pad, Math.min(hi + pad, ys[i]));
      s += (i ? "L" : "M") + x(xs[i]).toFixed(1) + "," + y(v).toFixed(1);
    }
    return s;
  }, [xs, ys, x, y, lo, hi]);
  return <path d={d} fill="none" stroke={`var(--${role})`} strokeWidth={width} strokeDasharray={dash} opacity={opacity} strokeLinejoin="round" />;
}
