import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Artefact, type Hotspot } from "../../../ui/Artefact";
import { AFTER_HEAVY, AFTER_HEAVY_RAIN, A_HEAVY_DAY, CELLS, DAYS, HEAVY_DAYS, LONGEST_DRY, LONGEST_DRY_ALL, MONTHS, SEASON, STATE_COUNTS, STATE_NAME, THRESH, longDate, shortDate } from "./rain";
import { CELL, GAP, stateClass } from "./strip";

/**
 * Figure 0 — the annotated artefact. One season of daily rainfall, one square per day in three colours, laid out as a
 * calendar; four hotspots and no bet. Everything drawn is read off the strip: the longest dry spell, a heavy day, the row
 * of "days after a heavy day", and the colour counts.
 */

const LEFT = 30;
const STEP = CELL + GAP;
const ROW_H = STEP + 4;
const W = LEFT + 31 * STEP; // 464
const HEAD = 14;
const CAL_Y = HEAD + 4;
const CAL_H = MONTHS.length * ROW_H;
const AFTER_LABEL_Y = CAL_Y + CAL_H + 14;
const AFTER_Y = AFTER_LABEL_Y + 5;
const LEGEND_Y = AFTER_Y + CELL + 18;
const THRESH_Y = LEGEND_Y + CELL + 12;
const H = THRESH_Y + 6;

const pct = (v: number, of: number) => (100 * v) / of;

function cellXY(i: number) {
  const c = CELLS[i];
  return { x: LEFT + (c.dom - 1) * STEP, y: CAL_Y + c.month * ROW_H };
}

export function F0Season() {
  const dry0 = cellXY(LONGEST_DRY.start);
  const dryEnd = CELLS[LONGEST_DRY.start + LONGEST_DRY.len - 1];
  const dryW = LONGEST_DRY.len * STEP - GAP;
  const longerElsewhere = LONGEST_DRY_ALL.len > LONGEST_DRY.len;
  const heavy = cellXY(A_HEAVY_DAY);
  const afterW = AFTER_HEAVY.length * STEP - GAP;
  const legendW = 3 * 110;

  const hotspots: Hotspot[] = [
    {
      x: pct(dry0.x - 3, W),
      y: pct(dry0.y - 3, H),
      w: pct(dryW + 6, W),
      h: pct(CELL + 6, H),
      title: `① A ${LONGEST_DRY.len}-day dry run.`,
      note: (
        <>
          {shortDate(CELLS[LONGEST_DRY.start].date)} to {shortDate(dryEnd.date)}: {LONGEST_DRY.len} dry days in a row
          {longerElsewhere ? (
            <>
              {" "}
              — and a {LONGEST_DRY_ALL.len}-day one runs from {shortDate(CELLS[LONGEST_DRY_ALL.start].date)} across the row break
            </>
          ) : (
            ", the longest spell on the strip"
          )}
          . If each day were a fresh draw with this season's colour mix, a run this long would be rare. Spells are long here — rain comes and stays away in
          stretches, not in two-day flickers.
        </>
      ),
    },
    {
      x: pct(heavy.x - 3, W),
      y: pct(heavy.y - 3, H),
      w: pct(CELL + 6, W),
      h: pct(CELL + 6, H),
      title: `② A heavy day, ${shortDate(CELLS[A_HEAVY_DAY].date)}.`,
      note: (
        <>
          More than {THRESH.heavy} mm fell. Look at the square to its right: {STATE_NAME[SEASON.states[A_HEAVY_DAY + 1]]}. A heavy day is rarely alone. Hold that thought —
          the next hotspot counts it.
        </>
      ),
    },
    {
      x: pct(LEFT - 3, W),
      y: pct(AFTER_LABEL_Y - 11, H),
      w: pct(afterW + 6, W),
      h: pct(CELL + 22, H),
      title: "③ The day after every heavy day.",
      note: (
        <>
          Take each of the {HEAVY_DAYS.length} heavy days and copy out the square that follows it — that is this row. {AFTER_HEAVY_RAIN} of {HEAVY_DAYS.length} are rain again
          (some or heavy); only {HEAVY_DAYS.length - AFTER_HEAVY_RAIN} dry. After a heavy day, rain again more often than not. Nothing is explained yet; that is just what
          the strip says.
        </>
      ),
    },
    {
      x: pct(LEFT - 3, W),
      y: pct(LEGEND_Y - 3, H),
      w: pct(legendW, W),
      h: pct(CELL + 8, H),
      title: "④ Days per colour.",
      note: (
        <>
          {STATE_COUNTS[0]} dry, {STATE_COUNTS[1]} with some rain, {STATE_COUNTS[2]} heavy, out of {DAYS}. Thresholds: dry under {THRESH.some} mm, some {THRESH.some}–
          {THRESH.heavy} mm, heavy over {THRESH.heavy} mm. These three numbers are the colour mix — and the colour mix alone cannot tell you about the spells. The next
          figure finds what can.
        </>
      ),
    },
  ];

  return (
    <Figure
      n="0"
      prompt={
        SEASON.real ? (
          <>
            {DAYS} real days of rain in {SEASON.city}, {longDate(SEASON.from)} to {longDate(SEASON.to)}, one square per day. Nothing here is simulated. Click a number, or walk
            the four things to notice.
          </>
        ) : (
          <>
            {DAYS} days of a monsoon season, one square per day, in three colours — <strong>a {SEASON.label}</strong>, laid out as the Bengaluru calendar, {longDate(SEASON.from)} to{" "}
            {longDate(SEASON.to)}. Click a number, or walk the four things to notice.
          </>
        )
      }
      observe={
        <>
          You can see the habit before anyone names it: rain comes in spells, dry comes in spells, and after a heavy day it rains again {AFTER_HEAVY_RAIN} times in{" "}
          {HEAVY_DAYS.length}. "Tomorrow depends only on today" sounds too simple for that. The rest of this page checks whether it is.
        </>
      }
    >
      <Artefact
        width={W}
        height={H}
        hotspots={hotspots}
        caption={
          <>
            One row per month, one square per day. {SEASON.real ? SEASON.source : "The strip is drawn by the engine's own three-state chain, seeded, until the Open-Meteo file arrives; the figures say so wherever it appears."}
          </>
        }
      >
        <svg className="b1-strip b1-artefact" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Calendar of ${DAYS} days in three colours: dry, some rain, heavy; below it the row of days that followed each heavy day, and a legend with counts`}>
          <text className="b1-arthead" x={LEFT} y={HEAD - 3}>
            {SEASON.city} · daily rainfall · {longDate(SEASON.from)} – {longDate(SEASON.to)}
          </text>
          <text className="b1-arthead b1-artflag" x={W - 2} y={HEAD - 3} textAnchor="end">
            {SEASON.real ? "real" : "simulated"}
          </text>
          {MONTHS.map((m, r) => (
            <text key={m} className="b1-rowlabel" x={LEFT - 5} y={CAL_Y + r * ROW_H + CELL - 2} textAnchor="end">
              {m.slice(0, 3)}
            </text>
          ))}
          {CELLS.map((c) => {
            const { x, y } = cellXY(c.i);
            return (
              <rect key={c.i} className={"b1-day-rect " + stateClass(c.state)} x={x} y={y} width={CELL} height={CELL} rx={1.5}>
                <title>{`${shortDate(c.date)}: ${STATE_NAME[c.state]}`}</title>
              </rect>
            );
          })}
          <text className="b1-rowlabel b1-afterlabel" x={LEFT} y={AFTER_LABEL_Y}>
            the day after each heavy day →
          </text>
          {AFTER_HEAVY.map((s, k) => (
            <rect key={k} className={"b1-day-rect " + stateClass(s)} x={LEFT + k * STEP} y={AFTER_Y} width={CELL} height={CELL} rx={1.5} />
          ))}
          {([0, 1, 2] as const).map((s) => (
            <g key={s} transform={`translate(${LEFT + s * 110} ${LEGEND_Y})`}>
              <rect className={"b1-day-rect " + stateClass(s)} x={0} y={0} width={CELL} height={CELL} rx={1.5} />
              <text className="b1-legendtext" x={CELL + 5} y={CELL - 2}>
                {STATE_NAME[s]} · {STATE_COUNTS[s]}
              </text>
            </g>
          ))}
          <text className="b1-legendtext b1-thresh" x={LEFT} y={THRESH_Y}>
            dry &lt; {THRESH.some} mm · some {THRESH.some}–{THRESH.heavy} mm · heavy &gt; {THRESH.heavy} mm
          </text>
        </svg>
      </Artefact>
    </Figure>
  );
}
