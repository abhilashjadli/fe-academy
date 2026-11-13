import { useMemo } from "react";
import { usePlot } from "../../../ui/Plot";

/** Shared SVG parts for the G1 figures: tick labels drawn inside the frame, many dots as one path. */

export function XTicks({ at, fmt, label }: { at: number[]; fmt?: (v: number) => string; label?: string }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <text key={v} className="label g1-ticklabel" x={x(v)} y={inner.top + inner.height - 4} textAnchor="middle">
          {fmt ? fmt(v) : v}
        </text>
      ))}
      {label && (
        <text className="label g1-ticklabel" x={inner.left + inner.width} y={inner.top + inner.height - 4} textAnchor="end">
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
          <line x1={inner.left} x2={inner.left + inner.width} y1={y(v)} y2={y(v)} className="g1-tick" />
          <text className="label g1-ticklabel" x={inner.left + 4} y={y(v) - 3}>
            {fmt(v)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** many dots as one path element (values far outside the frame are pulled to its edge) */
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
