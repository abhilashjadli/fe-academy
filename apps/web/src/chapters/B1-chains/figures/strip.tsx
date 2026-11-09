import type { ReactNode } from "react";
import { STATE_NAME, type State } from "./rain";

/**
 * The strip: one square per day in three colours (dry = grey, some = light blue, heavy = deep blue). Drawn as SVG so the
 * squares scale with the figure; wraps into rows of `perRow` days. `mark` returns an extra class per day (e.g. "cursor",
 * "lit", "dim"); `tag` returns a tiny label drawn under a day.
 */
export const CELL = 12; // viewBox units per day
export const GAP = 2;

export function stateClass(s: State | number): string {
  return s === 2 ? "b1-heavy" : s === 1 ? "b1-some" : "b1-dry";
}

export function DayStrip({
  states,
  perRow = 30,
  mark,
  tag,
  rowLabels,
  ariaLabel,
  className,
  children,
  leftPad = 0,
}: {
  states: readonly number[];
  perRow?: number;
  mark?: (i: number) => string | undefined;
  tag?: (i: number) => string | undefined;
  rowLabels?: string[];
  ariaLabel: string;
  className?: string;
  children?: ReactNode;
  /** viewBox units reserved on the left for row labels */
  leftPad?: number;
}) {
  const rows = Math.max(1, Math.ceil(states.length / perRow));
  const rowH = CELL + GAP + (tag ? 7 : 0);
  const w = leftPad + perRow * (CELL + GAP);
  const h = rows * rowH + 2;
  return (
    <svg className={"b1-strip " + (className ?? "")} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={ariaLabel} style={{ aspectRatio: `${w} / ${h}` }}>
      {rowLabels?.map((l, r) => (
        <text key={r} className="b1-rowlabel" x={leftPad - 4} y={r * rowH + CELL - 2} textAnchor="end">
          {l}
        </text>
      ))}
      {Array.from(states).map((s, i) => {
        const r = Math.floor(i / perRow),
          c = i % perRow;
        const x = leftPad + c * (CELL + GAP),
          y = r * rowH;
        const extra = mark?.(i);
        const t = tag?.(i);
        return (
          <g key={i} className={"b1-day " + stateClass(s) + (extra ? " " + extra : "")}>
            <rect x={x} y={y} width={CELL} height={CELL} rx={1.5}>
              <title>{`day ${i + 1}: ${STATE_NAME[s as State]}`}</title>
            </rect>
            {t && (
              <text className="b1-tag" x={x + CELL / 2} y={y + CELL + 6} textAnchor="middle">
                {t}
              </text>
            )}
          </g>
        );
      })}
      {children}
    </svg>
  );
}

/** The calendar layout: one row per month, columns by day-of-month. Used by the artefact. */
export function CalendarStrip({
  cells,
  months,
  mark,
  ariaLabel,
  children,
}: {
  cells: ReadonlyArray<{ i: number; month: number; dom: number; state: State }>;
  months: string[];
  mark?: (i: number) => string | undefined;
  ariaLabel: string;
  children?: ReactNode;
}) {
  const leftPad = 30;
  const rowH = CELL + GAP + 4;
  const w = leftPad + 31 * (CELL + GAP);
  const h = months.length * rowH;
  return (
    <svg className="b1-strip" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={ariaLabel} style={{ aspectRatio: `${w} / ${h}` }}>
      {months.map((m, r) => (
        <text key={m} className="b1-rowlabel" x={leftPad - 5} y={r * rowH + CELL - 2} textAnchor="end">
          {m}
        </text>
      ))}
      {cells.map((c) => {
        const x = leftPad + (c.dom - 1) * (CELL + GAP),
          y = c.month * rowH;
        const extra = mark?.(c.i);
        return (
          <g key={c.i} className={"b1-day " + stateClass(c.state) + (extra ? " " + extra : "")}>
            <rect x={x} y={y} width={CELL} height={CELL} rx={1.5}>
              <title>{`day ${c.i + 1}: ${STATE_NAME[c.state]}`}</title>
            </rect>
          </g>
        );
      })}
      {children}
    </svg>
  );
}

export function calendarXY(dom: number, month: number): { x: number; y: number } {
  const leftPad = 30;
  const rowH = CELL + GAP + 4;
  return { x: leftPad + (dom - 1) * (CELL + GAP), y: month * rowH };
}
export const CALENDAR_W = 30 + 31 * (CELL + GAP);
export const calendarH = (months: number) => months * (CELL + GAP + 4);

/** The legend chips: three squares and their names. */
export function StateLegend({ counts, extra }: { counts?: number[]; extra?: ReactNode }) {
  return (
    <div className="b1-legend">
      {([0, 1, 2] as State[]).map((s) => (
        <span key={s}>
          <i className={"b1-sw " + stateClass(s)} /> {STATE_NAME[s]}
          {counts && <span className="b1-legend-n"> {counts[s]}</span>}
        </span>
      ))}
      {extra}
    </div>
  );
}
