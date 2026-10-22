import { scaleLinear, type ScaleLinear } from "d3-scale";
import { line as d3line, area as d3area, curveMonotoneX, curveLinear } from "d3-shape";
import { format } from "d3-format";
import { createContext, useContext, useId, useMemo, useRef, type PointerEvent, type ReactNode } from "react";

export type Pt = [number, number];
export type Role = "truth" | "approx" | "error" | "ghost" | "ink";

interface PlotCtx {
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
  inner: { left: number; top: number; width: number; height: number };
}
const Ctx = createContext<PlotCtx | null>(null);
export const usePlot = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("Plot children must be inside <Plot>");
  return c;
};

interface PlotProps {
  xDomain: [number, number];
  yDomain: [number, number];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  xLabel?: string;
  yLabel?: string;
  xTicks?: number;
  yTicks?: number;
  grid?: boolean;
  children?: ReactNode;
  /** called with data coords on pointer down/move while pressed */
  onDrag?: (x: number, y: number, phase: "down" | "move" | "up") => void;
  onHover?: (x: number | null, y: number | null) => void;
  ariaLabel?: string;
  /** where to draw the vertical axis line (default: at x = 0 clamped into the domain) */
  axisX?: number;
  /** where to draw the horizontal axis line (default: at y = 0 clamped into the domain) */
  axisY?: number;
}

const fmtTick = format("~g");

export function Plot({
  xDomain,
  yDomain,
  width = 720,
  height = 360,
  margin = { top: 14, right: 18, bottom: 34, left: 46 },
  xLabel,
  yLabel,
  xTicks = 7,
  yTicks = 5,
  grid = true,
  children,
  onDrag,
  onHover,
  ariaLabel,
  axisX,
  axisY,
}: PlotProps) {
  const inner = { left: margin.left, top: margin.top, width: width - margin.left - margin.right, height: height - margin.top - margin.bottom };
  const x = useMemo(() => scaleLinear().domain(xDomain).range([inner.left, inner.left + inner.width]), [xDomain[0], xDomain[1], inner.left, inner.width]);
  const y = useMemo(() => scaleLinear().domain(yDomain).range([inner.top + inner.height, inner.top]), [yDomain[0], yDomain[1], inner.top, inner.height]);
  const svgRef = useRef<SVGSVGElement>(null);
  const pressed = useRef(false);
  const clipId = useId().replace(/:/g, "") + "-clip";

  const toData = (e: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const py = ((e.clientY - rect.top) / rect.height) * height;
    return [x.invert(px), y.invert(py)] as Pt;
  };

  const xt = x.ticks(xTicks);
  const yt = y.ticks(yTicks);
  const x0 = axisX ?? Math.max(xDomain[0], Math.min(xDomain[1], 0));
  const y0 = axisY ?? Math.max(yDomain[0], Math.min(yDomain[1], 0));

  return (
    <svg
      ref={svgRef}
      className="plot"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        if (!onDrag) return;
        pressed.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        const [dx, dy] = toData(e);
        onDrag(dx, dy, "down");
      }}
      onPointerMove={(e) => {
        const [dx, dy] = toData(e);
        onHover?.(dx, dy);
        if (onDrag && pressed.current) onDrag(dx, dy, "move");
      }}
      onPointerUp={(e) => {
        if (!onDrag) return;
        pressed.current = false;
        const [dx, dy] = toData(e);
        onDrag(dx, dy, "up");
      }}
      onPointerLeave={() => onHover?.(null, null)}
    >
      <Ctx.Provider value={{ x, y, inner }}>
        {grid && (
          <g className="grid">
            {xt.map((t) => (
              <line key={"gx" + t} x1={x(t)} x2={x(t)} y1={inner.top} y2={inner.top + inner.height} />
            ))}
            {yt.map((t) => (
              <line key={"gy" + t} y1={y(t)} y2={y(t)} x1={inner.left} x2={inner.left + inner.width} />
            ))}
          </g>
        )}
        <g className="axis">
          <line x1={inner.left} x2={inner.left + inner.width} y1={y(y0)} y2={y(y0)} />
          <line y1={inner.top} y2={inner.top + inner.height} x1={x(x0)} x2={x(x0)} />
          {xt.map((t) => (
            <text key={"tx" + t} x={x(t)} y={inner.top + inner.height + 16} textAnchor="middle">
              {fmtTick(t)}
            </text>
          ))}
          {yt.map((t) => (
            <text key={"ty" + t} x={inner.left - 8} y={y(t) + 4} textAnchor="end">
              {fmtTick(t)}
            </text>
          ))}
          {xLabel && (
            <text className="axis-label" x={inner.left + inner.width} y={inner.top + inner.height + 30} textAnchor="end">
              {xLabel}
            </text>
          )}
          {yLabel && (
            <text className="axis-label" x={inner.left + 6} y={inner.top + 12} textAnchor="start">
              {yLabel}
            </text>
          )}
        </g>
        <clipPath id={clipId}>
          <rect x={inner.left} y={inner.top} width={inner.width} height={inner.height} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>{children}</g>
      </Ctx.Provider>
    </svg>
  );
}

/** Clamp wildly out-of-range values so paths stay finite (polynomials diverge fast). */
function clampY(v: number, lo: number, hi: number) {
  if (!Number.isFinite(v)) return NaN;
  const pad = (hi - lo) * 3;
  return Math.max(lo - pad, Math.min(hi + pad, v));
}

export function Curve({ pts, role = "truth", width, dash, opacity, smooth = true }: { pts: Pt[]; role?: Role; width?: number; dash?: string; opacity?: number; smooth?: boolean }) {
  const { x, y } = usePlot();
  const [lo, hi] = y.domain();
  const d = useMemo(() => {
    const gen = d3line<Pt>()
      .defined((p) => Number.isFinite(p[1]))
      .x((p) => x(p[0]))
      .y((p) => y(clampY(p[1], lo, hi)))
      .curve(smooth ? curveMonotoneX : curveLinear);
    return gen(pts) ?? "";
  }, [pts, x, y, lo, hi, smooth]);
  return <path className={`curve ${role}`} d={d} style={{ strokeWidth: width, strokeDasharray: dash, opacity }} />;
}

export function Band({ upper, lower, role = "error" }: { upper: Pt[]; lower: Pt[]; role?: Role }) {
  const { x, y } = usePlot();
  const [lo, hi] = y.domain();
  const d = useMemo(() => {
    const gen = d3area<[number, number, number]>()
      .defined((p) => Number.isFinite(p[1]) && Number.isFinite(p[2]))
      .x((p) => x(p[0]))
      .y0((p) => y(clampY(p[1], lo, hi)))
      .y1((p) => y(clampY(p[2], lo, hi)))
      .curve(curveMonotoneX);
    const merged = upper.map((p, i) => [p[0], lower[i]?.[1] ?? NaN, p[1]] as [number, number, number]);
    return gen(merged) ?? "";
  }, [upper, lower, x, y, lo, hi]);
  return <path className={`band ${role}`} d={d} />;
}

export function VLine({ at, role }: { at: number; role?: Role }) {
  const { x, inner } = usePlot();
  return <line className={role ? `curve ${role}` : "guide"} x1={x(at)} x2={x(at)} y1={inner.top} y2={inner.top + inner.height} />;
}

export function HLine({ at }: { at: number }) {
  const { y, inner } = usePlot();
  return <line className="guide" y1={y(at)} y2={y(at)} x1={inner.left} x2={inner.left + inner.width} />;
}

export function Marker({ at, role = "ink", r = 5 }: { at: Pt; role?: Role; r?: number }) {
  const { x, y } = usePlot();
  if (!Number.isFinite(at[1])) return null;
  return <circle className={`marker ${role}`} cx={x(at[0])} cy={y(at[1])} r={r} />;
}

export function Label({ at, text, role, dx = 6, dy = -6, anchor = "start" }: { at: Pt; text: string; role?: Role; dx?: number; dy?: number; anchor?: "start" | "middle" | "end" }) {
  const { x, y } = usePlot();
  return (
    <text className={`label ${role ?? ""}`} x={x(at[0]) + dx} y={y(at[1]) + dy} textAnchor={anchor}>
      {text}
    </text>
  );
}

/** Small tooltip box at a data point. */
export function Tip({ at, lines, flip }: { at: Pt; lines: string[]; flip?: boolean }) {
  const { x, y, inner } = usePlot();
  const w = 12 + Math.max(...lines.map((l) => l.length)) * 6.6;
  const h = 8 + lines.length * 15;
  let px = x(at[0]) + 10;
  if (flip || px + w > inner.left + inner.width) px = x(at[0]) - 10 - w;
  const py = Math.max(inner.top, Math.min(y(at[1]) - h / 2, inner.top + inner.height - h));
  return (
    <g>
      <rect className="tip-bg" x={px} y={py} width={w} height={h} rx={3} />
      {lines.map((l, i) => (
        <text key={i} className="tip" x={px + 6} y={py + 13 + i * 15}>
          {l}
        </text>
      ))}
    </g>
  );
}

export const fmt = {
  n: (d = 3) => format(`.${d}f`),
  g: (d = 4) => format(`.${d}~g`),
  sci: format(".2e"),
  pct: (d = 1) => format(`.${d}%`),
};

/** Bars centred at x with width w (data units) from the baseline y=0 (or from y0) to y. */
export function Bars({ bars, role = "approx", opacity = 0.85, gap = 1 }: { bars: Array<{ x: number; y: number; w: number; y0?: number }>; role?: Role; opacity?: number; gap?: number }) {
  const { x, y } = usePlot();
  return (
    <g>
      {bars.map((b, i) => {
        const x0 = x(b.x - b.w / 2) + gap / 2;
        const x1 = x(b.x + b.w / 2) - gap / 2;
        const yTop = y(Math.max(b.y, b.y0 ?? 0));
        const yBot = y(Math.min(b.y, b.y0 ?? 0));
        return <rect key={i} className={`marker ${role}`} x={x0} y={yTop} width={Math.max(0.5, x1 - x0)} height={Math.max(0, yBot - yTop)} style={{ opacity, stroke: "none" }} />;
      })}
    </g>
  );
}

/** A cloud of points. */
export function Points({ pts, role = "truth", r = 2.4, opacity = 0.6 }: { pts: Pt[]; role?: Role; r?: number; opacity?: number }) {
  const { x, y } = usePlot();
  return (
    <g>
      {pts.map((p, i) => (
        <circle key={i} className={`marker ${role}`} cx={x(p[0])} cy={y(p[1])} r={r} style={{ opacity, stroke: "none" }} />
      ))}
    </g>
  );
}

/** A covariance ellipse (k standard deviations) for a 2×2 covariance matrix with Cholesky factor L. */
export function CovEllipse({ L, k = 1, cx = 0, cy = 0, role = "ink", dash }: { L: number[][]; k?: number; cx?: number; cy?: number; role?: Role; dash?: string }) {
  const pts: Pt[] = [];
  for (let i = 0; i <= 90; i++) {
    const t = (2 * Math.PI * i) / 90;
    const u = [Math.cos(t), Math.sin(t)];
    pts.push([cx + k * (L[0][0] * u[0] + L[0][1] * u[1]), cy + k * (L[1][0] * u[0] + L[1][1] * u[1])]);
  }
  return <Curve pts={pts} role={role} width={1.5} dash={dash} smooth={false} />;
}

/** A line through (cx, cy) with direction u, clipped to the plot. */
export function DirLine({ u, cx = 0, cy = 0, role = "ink", width = 2, len = 100 }: { u: number[]; cx?: number; cy?: number; role?: Role; width?: number; len?: number }) {
  return <Curve pts={[[cx - len * u[0], cy - len * u[1]], [cx + len * u[0], cy + len * u[1]]]} role={role} width={width} smooth={false} />;
}
