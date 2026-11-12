import { useMemo } from "react";
import { usePlot } from "../../../ui/Plot";

/** Shared SVG parts for the E2 figures: tick labels drawn inside the frame, an estimate's bar, and a many-dot scatter as one path. */

export function XTicks({ at, fmt, label }: { at: number[]; fmt?: (v: number) => string; label?: string }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <text key={v} className="label e2-ticklabel" x={x(v)} y={inner.top + inner.height - 4} textAnchor="middle">
          {fmt ? fmt(v) : v}
        </text>
      ))}
      {label && (
        <text className="label e2-ticklabel" x={inner.left + inner.width} y={inner.top + inner.height - 4} textAnchor="end">
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
          <line x1={inner.left} x2={inner.left + inner.width} y1={y(v)} y2={y(v)} className="e2-tick" />
          <text className="label e2-ticklabel" x={inner.left + 4} y={y(v) - 3}>
            {fmt(v)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** an estimate as a tick with its ± bar on a horizontal axis at row yv */
export function Bar({ mean, se, yv, bold, role = "ink", text, anchorRight, thick }: { mean: number; se: number; yv: number; bold: boolean; role?: "ink" | "approx" | "truth" | "error"; text?: string; anchorRight?: boolean; thick?: number }) {
  const { x, y } = usePlot();
  const cy = y(yv);
  const col = role === "ink" ? (bold ? "var(--ink)" : "var(--ink-3)") : `var(--${role})`;
  const w = thick ?? (bold ? 5 : 3);
  return (
    <g opacity={bold ? 1 : 0.7}>
      <line x1={x(mean - se)} x2={x(mean + se)} y1={cy} y2={cy} stroke={col} strokeWidth={w} strokeLinecap="butt" />
      <line x1={x(mean)} x2={x(mean)} y1={cy - 6} y2={cy + 6} stroke={col} strokeWidth={bold ? 2.5 : 1.5} />
      {text && (
        <text className={`label ${role === "ink" ? "" : role}`} x={anchorRight ? x(mean - se) - 6 : x(mean + se) + 6} y={cy + 4} textAnchor={anchorRight ? "end" : "start"} style={{ fontWeight: bold ? 600 : 400 }}>
          {text}
        </text>
      )}
    </g>
  );
}

/** many dots as one path element (no per-dot React elements) */
export function ScatterPath({ xs, ys, n, role = "approx", r = 1.6, opacity = 0.55 }: { xs: ArrayLike<number>; ys: ArrayLike<number>; n: number; role?: "approx" | "truth" | "error" | "ghost" | "ink"; r?: number; opacity?: number }) {
  const { x, y } = usePlot();
  const d = useMemo(() => {
    let s = "";
    const m = Math.min(n, xs.length);
    for (let i = 0; i < m; i++) {
      const px = x(xs[i]);
      const py = y(ys[i]);
      if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
      s += `M${(px - r).toFixed(1)},${py.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
    }
    return s;
  }, [xs, ys, n, x, y, r]);
  return <path d={d} fill={`var(--${role})`} stroke="none" opacity={opacity} />;
}

/** many polylines (row-major, m points each, x positions shared) as one path element */
export function BundlePath({ rows, m, xs, n, role = "ghost", opacity = 0.08, width = 1 }: { rows: ArrayLike<number>; m: number; xs: number[]; n: number; role?: "ghost" | "approx" | "truth"; opacity?: number; width?: number }) {
  const { x, y } = usePlot();
  const d = useMemo(() => {
    const parts: string[] = [];
    for (let p = 0; p < n; p++) {
      let s = "";
      for (let i = 0; i < m; i++) s += (i ? "L" : "M") + x(xs[i]).toFixed(1) + "," + y(rows[p * m + i]).toFixed(1);
      parts.push(s);
    }
    return parts.join("");
  }, [rows, m, xs, n, x, y]);
  return <path d={d} fill="none" stroke={`var(--${role})`} strokeWidth={width} opacity={opacity} strokeLinejoin="round" />;
}
