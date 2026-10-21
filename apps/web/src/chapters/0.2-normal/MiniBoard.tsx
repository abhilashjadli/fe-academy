import { choose } from "../../engine/discrete";

interface Props {
  rows?: number;
  /** bits of the current ball (1 = right) */
  bits?: number[];
  /** how many rows the ball has passed (0..rows); rows+1 = landed */
  progress?: number;
  /** show ±1 arrows at the current peg */
  arrows?: boolean;
  /** running sum in the corner */
  showSum?: boolean;
  /** label buckets by: "sum" | "k" | "none" */
  bucketLabels?: "sum" | "k" | "none";
  /** light every path into bucket k */
  lightPaths?: number | null;
  /** show Pascal fractions on pegs */
  pascal?: "none" | "fractions" | "counts";
  /** rows of pascal to reveal */
  pascalRows?: number;
  /** a single highlighted path (bits) drawn as a line */
  path?: number[] | null;
  width?: number;
  height?: number;
}

/** A small SVG Galton board for step-throughs: one ball, arrows, sums, path lighting, Pascal labels. */
export function MiniBoard({ rows = 5, bits, progress = 0, arrows, showSum, bucketLabels = "sum", lightPaths = null, pascal = "none", pascalRows = 99, path = null, width = 480, height = 300 }: Props) {
  const s = Math.min((width - 40) / (rows + 2), (height - 70) / (rows + 1.6));
  const cx = width / 2;
  const top = 28;
  const px = (r: number, k: number) => cx + (k - r / 2) * s; // peg k in row r
  const py = (r: number) => top + r * s;
  const bucketY = py(rows) + s * 0.4;

  // enumerate all paths into bucket k (k right-bounces among rows)
  const pathsInto = (k: number): number[][] => {
    const out: number[][] = [];
    const rec = (prefix: number[], ones: number) => {
      if (prefix.length === rows) {
        if (ones === k) out.push(prefix);
        return;
      }
      rec([...prefix, 0], ones);
      rec([...prefix, 1], ones + 1);
    };
    rec([], 0);
    return out;
  };
  const pathPoints = (b: number[]) => {
    const pts: Array<[number, number]> = [[cx, top - s * 0.6]];
    let k = 0;
    for (let r = 0; r < rows; r++) {
      pts.push([px(r, k), py(r)]);
      k += b[r];
    }
    pts.push([cx + (k - rows / 2) * s, bucketY]);
    return pts;
  };
  const toD = (pts: Array<[number, number]>) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");

  // ball position
  let ball: [number, number] | null = null;
  let k = 0;
  if (bits) {
    const r = Math.min(progress, rows);
    k = bits.slice(0, r).reduce((a, b) => a + b, 0);
    if (progress <= rows) ball = [px(r, k), r === rows ? bucketY : py(r)];
    else ball = [cx + (k - rows / 2) * s, bucketY];
  }
  const sum = bits ? bits.slice(0, Math.min(progress, rows)).reduce((a, b) => a + (b ? 1 : -1), 0) : 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="plot" role="img" aria-label="A small Galton board">
      {/* lit paths */}
      {lightPaths !== null &&
        pathsInto(lightPaths).map((b, i) => <path key={i} d={toD(pathPoints(b))} fill="none" stroke="var(--approx)" strokeWidth={2} opacity={0.55} />)}
      {path && <path d={toD(pathPoints(path))} fill="none" stroke="var(--approx)" strokeWidth={2.5} />}
      {/* pegs */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: r + 1 }, (_, j) => (
          <g key={r + "-" + j}>
            <circle cx={px(r, j)} cy={py(r)} r={3} fill="var(--axis)" />
            {pascal !== "none" && r < pascalRows && (
              <text x={px(r, j)} y={py(r) - 9} textAnchor="middle" className="label" style={{ fontSize: 10, paintOrder: "stroke", stroke: "var(--surface-figure)", strokeWidth: 4 }}>
                {pascal === "counts" ? choose(r, j) : `${choose(r, j)}/${2 ** r}`}
              </text>
            )}
          </g>
        )),
      )}
      {/* final row (bucket entries) pascal */}
      {pascal !== "none" &&
        rows < pascalRows &&
        Array.from({ length: rows + 1 }, (_, j) => (
          <text key={"b" + j} x={cx + (j - rows / 2) * s} y={bucketY - 10} textAnchor="middle" className="label approx" style={{ fontSize: 10.5, fontWeight: 500 }}>
            {pascal === "counts" ? choose(rows, j) : `${choose(rows, j)}/${2 ** rows}`}
          </text>
        ))}
      {/* buckets */}
      {Array.from({ length: rows + 1 }, (_, j) => {
        const x = cx + (j - rows / 2) * s;
        const label = bucketLabels === "sum" ? (2 * j - rows > 0 ? "+" : "") + (2 * j - rows) : bucketLabels === "k" ? String(j) : "";
        const lit = lightPaths === j || (ball && progress > rows && k === j);
        return (
          <g key={"bk" + j}>
            <rect x={x - s * 0.4} y={bucketY - s * 0.15} width={s * 0.8} height={s * 0.9} rx={2} fill={lit ? "var(--approx-soft)" : "none"} stroke={lit ? "var(--approx)" : "var(--rule)"} />
            <text x={x} y={bucketY + s * 0.95} textAnchor="middle" className="label" style={{ fontSize: 11 }}>
              {label}
            </text>
          </g>
        );
      })}
      {/* arrows at current peg */}
      {arrows && bits && progress < rows && ball && (
        <g>
          {[-1, 1].map((d) => {
            const chosen = bits[progress] === (d > 0 ? 1 : 0);
            return (
              <g key={d} opacity={chosen ? 1 : 0.3}>
                <line x1={ball![0]} y1={ball![1]} x2={ball![0] + (d * s) / 2} y2={ball![1] + s} stroke={d > 0 ? "var(--truth)" : "var(--error)"} strokeWidth={2} />
                <text x={ball![0] + d * s * 0.62} y={ball![1] + s * 0.55} className="label" style={{ fontSize: 12, fontWeight: 500 }} textAnchor="middle" fill={d > 0 ? "var(--truth-text)" : "var(--error-text)"}>
                  {d > 0 ? "+1" : "−1"}
                </text>
              </g>
            );
          })}
        </g>
      )}
      {/* ball */}
      {ball && <circle cx={ball[0]} cy={ball[1]} r={6} fill="var(--approx)" stroke="var(--surface-figure)" strokeWidth={2} />}
      {/* running sum */}
      {showSum && bits && (
        <g>
          <text x={16} y={22} className="label" style={{ fontSize: 12 }}>
            steps so far
          </text>
          <text x={16} y={42} className="num" style={{ fontSize: 15, fill: "var(--ink)" }}>
            {bits
              .slice(0, Math.min(progress, rows))
              .map((b) => (b ? "+1" : "−1"))
              .join(" ") || "—"}
          </text>
          <text x={16} y={64} className="num" style={{ fontSize: 15, fill: "var(--approx-text)", fontWeight: 500 }}>
            {progress > 0 ? `sum = ${sum > 0 ? "+" : ""}${sum}` : ""}
          </text>
        </g>
      )}
    </svg>
  );
}
