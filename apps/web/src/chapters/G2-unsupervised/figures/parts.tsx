import { usePlot } from "../../../ui/Plot";

/** Shared SVG parts for the G2 figures: tick labels drawn inside the frame. */

export function XTicks({ at, fmt, label, ends = false }: { at: number[]; fmt?: (v: number) => string; label?: string; /** anchor the first tick's label to the left and the last to the right, so they stay inside the frame */ ends?: boolean }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {at.map((v, i) => (
        <text key={v} className="label g2-ticklabel" x={x(v)} y={inner.top + inner.height - 4} textAnchor={ends && i === 0 ? "start" : ends && i === at.length - 1 ? "end" : "middle"}>
          {fmt ? fmt(v) : v}
        </text>
      ))}
      {label && (
        <text className="label g2-ticklabel" x={inner.left + inner.width} y={inner.top + inner.height - 4} textAnchor="end">
          {label}
        </text>
      )}
    </g>
  );
}

export function YTicks({ at, fmt, lines = true }: { at: number[]; fmt: (v: number) => string; lines?: boolean }) {
  const { y, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <g key={v}>
          {lines && <line x1={inner.left} x2={inner.left + inner.width} y1={y(v)} y2={y(v)} className="g2-tick" />}
          <text className="label g2-ticklabel" x={inner.left + 4} y={y(v) - 3}>
            {fmt(v)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** a centre: a cross */
export function Cross({ at, slot, r = 6, faint = false }: { at: [number, number]; slot: number; r?: number; faint?: boolean }) {
  const { x, y } = usePlot();
  const cx = x(at[0]);
  const cy = y(at[1]);
  return (
    <g className={`g2-cross g2-slot-${slot}${faint ? " g2-faint" : ""}`}>
      <line className="g2-halo" x1={cx - r} x2={cx + r} y1={cy - r} y2={cy + r} />
      <line className="g2-halo" x1={cx - r} x2={cx + r} y1={cy + r} y2={cy - r} />
      <line x1={cx - r} x2={cx + r} y1={cy - r} y2={cy + r} />
      <line x1={cx - r} x2={cx + r} y1={cy + r} y2={cy - r} />
    </g>
  );
}
