import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Label, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { N, PCT, SQ, X_DOMAIN, YEAR, indexAtYear, movePct, niceDate, shortDate, useNarrow, type Storm, R, DATES } from "./a5";
import { setClock, useClock } from "./clock";

/** y frames: the top picture is cut at ±8 % (two days fall outside), the bottom at 40 %² (five days) */
export const MOVE_CAP = 8;
export const SQ_CAP = 40;
const HEAD = 1.25; // headroom above the clamped spikes, for labels
const DAY = 1 / 252;

/**
 * Where day i sits on the x axis: decimal years on the full ten-year clock, trading days from an origin when a figure
 * zooms to a window. Shared with the overlays through a context so Spikes, Shade, Hand and levelPts agree.
 */
export type XOf = (i: number) => number;
const XCtx = createContext<XOf>((i) => YEAR[i]);
export const useXOf = () => useContext(XCtx);

/**
 * Thousands of thin bars as one path — one <path> per role, so the browser draws 2,679 days without 2,679 nodes.
 * `ys` in data units; bars run from `base` to each y; NaN entries are skipped; values beyond the clamps are cut.
 */
export function Spikes({ ys, base = 0, role = "ink", width, opacity, clampLo, clampHi, from = 0, to = N }: { ys: ArrayLike<number>; base?: number; role?: "truth" | "approx" | "error" | "ghost" | "ink"; width?: number; opacity?: number; clampLo?: number; clampHi?: number; from?: number; to?: number }) {
  const { x, y, inner } = usePlot();
  const xOf = useXOf();
  const d = useMemo(() => {
    const lo = clampLo ?? y.domain()[0],
      hi = clampHi ?? y.domain()[1];
    const yb = y(base).toFixed(1);
    const parts: string[] = [];
    for (let i = from; i < to; i++) {
      const v = ys[i];
      if (!Number.isFinite(v)) continue;
      const vy = Math.max(lo, Math.min(hi, v));
      parts.push(`M${x(xOf(i)).toFixed(2)},${yb}V${y(vy).toFixed(1)}`);
    }
    return parts.join("");
  }, [ys, xOf, base, x, y, clampLo, clampHi, from, to]);
  const w = width ?? Math.max(0.7, (inner.width / (to - from)) * (to - from < 200 ? 0.6 : 1.1));
  return <path className={`a5-spikes ${role}`} d={d} style={{ strokeWidth: w, opacity }} />;
}

/** a translucent window over a span of days (the storms, the 25 days after the 4th) */
export function Shade({ from, to, role = "error", label, labelAt = "top" }: { from: number; to: number; role?: "error" | "approx" | "truth" | "ghost"; label?: string; labelAt?: "top" | "bottom" }) {
  const { x, inner } = usePlot();
  const xOf = useXOf();
  const pad = xOf(1) - xOf(0) === 1 ? 0.5 : 0; // half a day each side when x is counted in days
  const x0 = x(xOf(from) - pad),
    x1 = x(xOf(Math.min(N - 1, to)) + pad);
  return (
    <g>
      <rect className={`a5-shade ${role}`} x={x0} y={inner.top} width={Math.max(2, x1 - x0)} height={inner.height} />
      {label && (
        <text className={`label a5-storm-label ${role}`} x={(x0 + x1) / 2} y={labelAt === "top" ? inner.top + 11 : inner.top + inner.height - 4} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

/** the clock's hand: a vertical line through the plot at day i, with the date beside it */
export function Hand({ i, date }: { i: number; date?: boolean }) {
  const { x, inner } = usePlot();
  const xOf = useXOf();
  const px = x(xOf(i));
  const flip = px > inner.left + inner.width * 0.75;
  return (
    <g>
      <line className="a5-hand" x1={px} x2={px} y1={inner.top} y2={inner.top + inner.height} />
      {date && (
        <text className="label a5-hand-date" x={px + (flip ? -5 : 5)} y={inner.top + 30} textAnchor={flip ? "end" : "start"}>
          {niceDate(DATES[i])}
        </text>
      )}
    </g>
  );
}

/** points for a variance path (length n+1, path[i] for day i), day i → scale(path[i+1]) (the level after day i's cup) */
export function levelPts(path: ArrayLike<number>, scale: (v: number) => number, xOf: XOf = (i) => YEAR[i], from = 0, to = N): Pt[] {
  const out: Pt[] = [];
  const stride = to - from > 1400 ? 2 : 1;
  for (let i = from; i < to; i += stride) out.push([xOf(i), scale(path[i + 1])]);
  return out;
}

export interface PicMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface TwoProps {
  /** overlays drawn inside the top (moves) picture */
  top?: ReactNode;
  /** overlays drawn inside the bottom (squares) picture */
  bottom?: ReactNode;
  /** a third strip under the two (Figure 5's score), inside the same x context */
  extra?: (W: number, margin: PicMargin, xDomain: [number, number]) => ReactNode;
  /** shaded storms; only those in `named` get a date */
  storms?: Storm[];
  named?: Storm[];
  /** zoom to a window of days [from, to); x becomes trading days from `origin` (default: from) */
  window?: [number, number];
  origin?: number;
  /** extra room to the right of the last day, in trading days (Figure 4's forecast) */
  extendRight?: number;
  hand?: boolean;
  bottomLabel?: string;
  bottomCap?: number;
  topCap?: number;
  /** replace the squares with another series (Figure 5: squares ÷ band) */
  bottomSeries?: ArrayLike<number>;
  bottomRole?: "truth" | "approx" | "error" | "ghost" | "ink";
  ariaTop?: string;
  ariaBottom?: string;
  scrub?: boolean;
}

/**
 * The two pictures on one clock: the real daily moves above their squares, the same x axis, one hand through both.
 * Dragging either picture moves the clock for every figure on the page.
 */
export function TwoPictures({ top, bottom, extra, storms, named, window: win, origin, extendRight = 0, hand = true, bottomLabel = "the day's move, squared (%²)", bottomCap = SQ_CAP, topCap = MOVE_CAP, bottomSeries, bottomRole = "approx", ariaTop, ariaBottom, scrub = true }: TwoProps) {
  const i = useClock();
  const narrow = useNarrow();
  const from = win ? win[0] : 0,
    to = win ? win[1] : N;
  const org = origin ?? from;
  const xOf = useMemo<XOf>(() => (win ? (k) => k - org : (k) => YEAR[k]), [win, org]);
  const xDomain: [number, number] = win ? [from - org - 0.5, to - org - 0.5 + extendRight] : [X_DOMAIN[0], X_DOMAIN[1] + extendRight * DAY];
  const W = narrow ? 400 : 660;
  const margin: PicMargin = { top: 10, right: 12, bottom: 24, left: narrow ? 34 : 40 };
  const toIndex = (x: number) => (win ? Math.round(x + org) : indexAtYear(x));
  const onDrag = scrub ? (x: number) => setClock(Math.max(from, Math.min(to - 1, toIndex(x)))) : undefined;
  const ys = bottomSeries ?? SQ;
  const inWin = i >= from && i < to;
  const xTicks = win ? (narrow ? 5 : 8) : narrow ? 5 : 10;
  const xLabel = win ? `trading days from ${niceDate(DATES[org])}` : undefined;
  const worst = Math.min(...R);
  return (
    <XCtx.Provider value={xOf}>
      <div className="a5-two">
        <Plot xDomain={xDomain} yDomain={[-topCap * HEAD, topCap * HEAD]} width={W} height={narrow ? 150 : 170} margin={margin} xTicks={xTicks} yTicks={4} grid={false} axisY={0} onDrag={onDrag} ariaLabel={ariaTop ?? "Daily moves of the NIFTY 50, 2016 to 2026, as thin bars about zero"}>
          {storms?.filter((s) => !named?.includes(s)).map((s, k) => <Shade key={k} from={s.from} to={s.to} role="error" />)}
          {named?.map((s, k) => <Shade key={"n" + k} from={s.from} to={s.to} role="error" label={narrow ? shortDate(DATES[s.peak]) : niceDate(DATES[s.peak]) + " " + movePct(R[s.peak])} labelAt={(k + (narrow ? 1 : 0)) % 2 ? "bottom" : "top"} />)}
          <Spikes ys={PCT} role="ink" from={from} to={to} clampLo={-topCap} clampHi={topCap} />
          {top}
          {hand && inWin && <Hand i={i} date />}
          <Label at={[xDomain[0], topCap * HEAD]} text="the day's move, %" dx={4} dy={11} />
          {!win && !narrow && <Label at={[xDomain[1], -topCap * HEAD]} text={`two days fall off this frame · worst ${movePct(worst)}`} dx={-4} dy={-3} anchor="end" />}
        </Plot>
        <Plot xDomain={xDomain} yDomain={[0, bottomCap * 1.14]} width={W} height={narrow ? 130 : 150} margin={{ ...margin, bottom: win ? 34 : 28 }} xTicks={xTicks} yTicks={3} grid={false} axisY={0} onDrag={onDrag} xLabel={xLabel} ariaLabel={ariaBottom ?? "The same days' moves squared, as thin bars from zero"}>
          {storms?.map((s, k) => <Shade key={k} from={s.from} to={s.to} role="error" />)}
          <Spikes ys={ys} role={bottomRole} from={from} to={to} clampHi={bottomCap} />
          {bottom}
          {hand && inWin && <Hand i={i} />}
          <Label at={[xDomain[0], bottomCap * 1.14]} text={bottomLabel} dx={4} dy={11} />
        </Plot>
        {extra && extra(W, margin, xDomain)}
        {scrub && <div className="a5-hint a5-hint-centre">drag {extra ? "a" : "either"} picture to move the clock</div>}
      </div>
    </XCtx.Provider>
  );
}
