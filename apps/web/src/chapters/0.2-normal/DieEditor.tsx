import { useRef } from "react";

interface Props {
  weights: number[];
  onChange: (w: number[]) => void;
  max?: number;
  width?: number;
  height?: number;
}

/** Six bars you drag up and down to shape a die's face probabilities. */
export function DieEditor({ weights, onChange, max = 10, width = 190, height = 90 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const dragging = useRef<number | null>(null);
  const pad = { l: 8, r: 8, t: 8, b: 18 };
  const n = weights.length;
  const bw = (width - pad.l - pad.r) / n;
  const total = weights.reduce((a, b) => a + b, 0) || 1;

  const setFromPointer = (e: React.PointerEvent<SVGSVGElement>, i: number) => {
    const rect = ref.current!.getBoundingClientRect();
    const py = ((e.clientY - rect.top) / rect.height) * height;
    const v = Math.round(((height - pad.b - py) / (height - pad.t - pad.b)) * max);
    const nv = Math.max(0, Math.min(max, v));
    const nw = weights.map((w, j) => (j === i ? nv : w));
    if (nw.every((w) => w === 0)) return;
    onChange(nw);
  };
  const indexAt = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    return Math.max(0, Math.min(n - 1, Math.floor((px - pad.l) / bw)));
  };

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      style={{ width, height, touchAction: "none", cursor: "ns-resize", display: "block" }}
      role="group"
      aria-label="Die face weights: drag each bar"
      onPointerDown={(e) => {
        dragging.current = indexAt(e);
        (e.target as Element).setPointerCapture?.(e.pointerId);
        setFromPointer(e, dragging.current);
      }}
      onPointerMove={(e) => {
        if (dragging.current === null) return;
        setFromPointer(e, dragging.current);
      }}
      onPointerUp={() => (dragging.current = null)}
    >
      {weights.map((w, i) => {
        const h = ((height - pad.t - pad.b) * w) / max;
        const x = pad.l + i * bw;
        return (
          <g key={i}>
            <rect x={x + 3} y={pad.t} width={bw - 6} height={height - pad.t - pad.b} fill="var(--surface)" stroke="var(--rule-soft)" rx={2} />
            <rect x={x + 3} y={height - pad.b - h} width={bw - 6} height={h} fill="var(--approx)" rx={2} />
            <text x={x + bw / 2} y={height - 5} textAnchor="middle" style={{ fontSize: 10, fill: "var(--ink-3)", fontFamily: "var(--font-ui)" }}>
              {i + 1}
            </text>
            <text x={x + bw / 2} y={Math.max(pad.t + 9, height - pad.b - h - 3)} textAnchor="middle" style={{ fontSize: 8.5, fill: "var(--ink-2)", fontFamily: "var(--font-ui)" }}>
              {Math.round((100 * w) / total)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
