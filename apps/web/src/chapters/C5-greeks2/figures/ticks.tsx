import { usePlot } from "../../../ui/Plot";

/** x-axis tick labels drawn inside the frame in the caller's own format (the Plot's built-in ticks print raw numbers; the wobble wants percentages). Copied from C3's strip. */
export function XTicks({ at, fmt }: { at: number[]; fmt: (v: number) => string }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <text key={v} className="label c5-tick" x={x(v)} y={inner.top + inner.height - 5} textAnchor="middle">
          {fmt(v)}
        </text>
      ))}
    </g>
  );
}
