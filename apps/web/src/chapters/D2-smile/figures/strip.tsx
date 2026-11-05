import type { ReactNode } from "react";
import { Curve, Label, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { ROW, STRIP, n0, pct1, useNarrow } from "./d2";

/** Ticks drawn inside the frame (copied from C3's strip so the two chapters' strips read the same). */
export function YTicksInside({ at, fmt }: { at: number[]; fmt: (v: number) => string }) {
  const { y, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <text key={v} className="label d2-ticklabel" x={inner.left + 4} y={y(v) - 3}>
          {fmt(v)}
        </text>
      ))}
    </g>
  );
}
export function XTicksInside({ at, fmt }: { at: number[]; fmt: (v: number) => string }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <text key={v} className="label d2-ticklabel" x={x(v)} y={inner.top + inner.height - 5} textAnchor="middle">
          {fmt(v)}
        </text>
      ))}
    </g>
  );
}

/** The 34 dots: calls as blue circles, puts as red diamonds. `callIv` lets a figure override one strike's call vol. */
export function StripDots({ callIv = STRIP.call_iv, putIv = STRIP.put_iv, lit, dim }: { callIv?: number[]; putIv?: number[]; lit?: number; dim?: boolean }) {
  const { x, y } = usePlot();
  return (
    <g style={dim ? { opacity: 0.45 } : undefined}>
      {STRIP.strikes.map((K, i) => {
        const cx = x(K),
          cy = y(putIv[i]);
        return <rect key={"p" + K} className="marker error" x={cx - 4.5} y={cy - 4.5} width={9} height={9} transform={`rotate(45 ${cx} ${cy})`} />;
      })}
      {STRIP.strikes.map((K, i) => (
        <circle key={"c" + K} className={"marker truth" + (lit === K ? " d2-lit" : "")} cx={x(K)} cy={y(callIv[i])} r={lit === K ? 6.5 : 5} />
      ))}
    </g>
  );
}

export const STRIP_X: [number, number] = [22100, 23150];
export const STRIP_Y: [number, number] = [0.1465, 0.175];

/** The strip frame: forward line, inside ticks, axis words. Children draw on top. */
export function StripPlot({ children, height = 300, ariaLabel, yLabel = "implied wobble, from the chain's own forward" }: { children?: ReactNode; height?: number; ariaLabel: string; yLabel?: string }) {
  const narrow = useNarrow();
  return (
    <Plot xDomain={STRIP_X} yDomain={STRIP_Y} width={narrow ? 420 : 560} height={narrow ? Math.round(height * 0.85) : height} margin={{ top: 14, right: 16, bottom: 34, left: 16 }} xLabel="strike" yLabel={narrow ? yLabel.replace(", from the chain's own forward", "") : yLabel} xTicks={0} yTicks={0} grid={false} axisY={STRIP_Y[0]} axisX={STRIP_X[0]} ariaLabel={ariaLabel}>
      <XTicksInside at={[22250, 22500, 22600, 22800, 23050]} fmt={n0} />
      <YTicksInside at={[0.15, 0.155, 0.16, 0.165, 0.17]} fmt={pct1} />
      <Curve pts={[[ROW.F, STRIP_Y[0]], [ROW.F, STRIP_Y[1]]] as Pt[]} role="ghost" dash="3 3" width={1} smooth={false} />
      <Label at={[ROW.F, STRIP_Y[1]]} text={`forward ${n0(ROW.F)}`} dx={4} dy={12} />
      {children}
    </Plot>
  );
}

export function StripLegend({ extra }: { extra?: ReactNode }) {
  return (
    <div className="d2-legend">
      <span>
        <i className="d2-sw truth" /> calls
      </span>
      <span>
        <i className="d2-sw error diamond" /> puts
      </span>
      {extra}
    </div>
  );
}
