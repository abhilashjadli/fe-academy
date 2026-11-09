import { useMemo } from "react";
import { Bars, Curve, HLine, Label, Marker, Plot, VLine, type Pt } from "../../../ui/Plot";
import { histogram } from "../../../engine/martingale";
import { chips, useNarrow, type Fan } from "./table";

/**
 * The table's drawing: wealth against tosses. A faint fan of sampled replay paths (ghost), the mean over all players
 * (truth blue — the meter in time), and the reader's own path (ink). The x-domain can be shorter than the fan to let a
 * path draw slowly for ten tosses and then squish to the full session.
 */
export function FanPlot({
  fan,
  yours,
  yoursRole = "ink",
  yoursLabel = "you",
  T,
  xMax,
  yRange = 45,
  xLabel = "tosses",
  height,
  leftAt,
  small,
  children,
}: {
  fan: Fan | null;
  yours?: number[] | null;
  yoursRole?: "ink" | "error" | "truth" | "approx";
  yoursLabel?: string;
  T: number;
  /** show only this many tosses on the axis (default T) */
  xMax?: number;
  yRange?: number;
  xLabel?: string;
  height?: number;
  /** a dotted line where the reader left */
  leftAt?: number | null;
  /** drawn beside another plot: a narrower design width so the type stays readable */
  small?: boolean;
  children?: React.ReactNode;
}) {
  const narrow = useNarrow();
  const w = narrow ? 360 : small ? 420 : 640;
  const h = height ?? (narrow ? 230 : small ? 240 : 280);
  const xm = xMax ?? T;
  const pts = (path: number[], upto = path.length - 1): Pt[] => {
    const out: Pt[] = [];
    for (let t = 0; t <= Math.min(upto, path.length - 1); t++) out.push([t, path[t]]);
    return out;
  };
  const meanPts = useMemo(() => (fan ? pts(fan.meanPath) : []), [fan]);
  const yourPts = yours ? pts(yours, xm) : [];
  return (
    <Plot xDomain={[0, xm]} yDomain={[-yRange, yRange]} width={w} height={h} xLabel={xLabel} yLabel="chips" xTicks={narrow ? 4 : 6} yTicks={5} margin={{ top: 14, right: 14, bottom: 34, left: 44 }} ariaLabel="wealth against tosses">
      {fan && fan.paths.map((p, i) => <Curve key={i} pts={pts(p)} role="ghost" width={1} opacity={0.22} smooth={false} />)}
      <HLine at={0} />
      {fan && <Curve pts={meanPts} role="truth" width={2.5} smooth={false} />}
      {fan && <Label at={[0.4 * xm, fan.meanPath[Math.round(0.4 * Math.min(xm, fan.meanPath.length - 1))]]} text="average of all players" role="truth" dx={0} dy={16} anchor="middle" />}
      {leftAt !== null && leftAt !== undefined && <VLine at={leftAt} />}
      {yours && yourPts.length > 1 && <Curve pts={yourPts} role={yoursRole} width={2} smooth={false} />}
      {yours && yourPts.length > 0 && <Marker at={yourPts[yourPts.length - 1]} role={yoursRole} r={4} />}
      {yours && yourPts.length > 0 && (
        <Label
          at={yourPts[yourPts.length - 1]}
          text={`${yoursLabel} ${chips(yourPts[yourPts.length - 1][1])}`}
          role={yoursRole === "ink" ? undefined : yoursRole}
          dx={yourPts[yourPts.length - 1][0] < 0.7 * xm ? 6 : -4}
          dy={-8}
          anchor={yourPts[yourPts.length - 1][0] < 0.7 * xm ? "start" : "end"}
        />
      )}
      {children}
    </Plot>
  );
}

/** Histogram of the final chips over all players; the spike and the tail of a strategy. */
export function Finals({ fan, lo, hi, marks, height, role = "approx", small, yMax }: { fan: Fan; lo: number; hi: number; marks?: Array<{ at: number; text: string; role?: "truth" | "approx" | "error" }>; height?: number; role?: "approx" | "error" | "truth"; small?: boolean; /** cap the share axis so a spike goes off the top and the tail becomes visible */ yMax?: number }) {
  const narrow = useNarrow();
  const w = narrow ? 360 : small ? 420 : 640;
  const h = height ?? (narrow ? 200 : small ? 240 : 220);
  const n = fan.finals.length;
  const bins = useMemo(() => histogram(fan.finals, lo, hi), [fan, lo, hi]);
  const bars = bins.map((c, i) => ({ x: lo + i, y: c / n, w: 1 }));
  const below = fan.finals.filter((v) => v < lo).length / n;
  const above = fan.finals.filter((v) => v > hi).length / n;
  const top = yMax ?? Math.max(0.02, ...bars.map((b) => b.y)) * 1.15;
  return (
    <Plot xDomain={[lo - 0.5, hi + 0.5]} yDomain={[0, top]} width={w} height={h} xLabel="final chips" yLabel="share of players" xTicks={narrow ? 5 : 8} yTicks={4} margin={{ top: 16, right: 14, bottom: 34, left: 48 }} ariaLabel="histogram of final chips">
      <Bars bars={bars} role={role} opacity={0.85} gap={0.5} />
      {below > 0.0005 && <Label at={[lo + 0.5, top * 0.9]} text={`${(below * 100).toFixed(1)} % further left`} dx={0} dy={0} />}
      {above > 0.0005 && <Label at={[hi - 0.5, top * 0.9]} text={`${(above * 100).toFixed(1)} % further right`} anchor="end" dx={0} dy={0} />}
      {marks?.map((m, i) => (
        <g key={i}>
          <VLine at={m.at} role={m.role} />
          <Label at={[m.at, top * (0.78 - i * 0.12)]} text={m.text} role={m.role} dx={m.at > (lo + hi) / 2 ? -6 : 6} anchor={m.at > (lo + hi) / 2 ? "end" : "start"} dy={0} />
        </g>
      ))}
    </Plot>
  );
}
