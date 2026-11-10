import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { forwardVol, interpolateSurface } from "../../../engine/smile";
import { KEY, n1 } from "./d2";
import { REAL_SURFACE } from "./realSurface";
import "./figures.css";

/**
 * Figure 4 — the surface as a table with one probe. Rows are expiries, columns strikes (as a fraction of the forward), every
 * cell an implied wobble. Two grids: the real NIFTY surface at the close of 23 Oct 2026 (four expiries, D2's five strikes; realSurface.ts,
 * from the bhavcopy via key_surface.py) read-only above, and Hull's textbook currency surface, Table 15.2, below, which the probe
 * walks because it has six rows to interpolate between. Hover or tap a textbook cell: its row is the smile, its column the term structure. The one control
 * is an expiry slider that walks down the 1.05 column and interpolates between the printed rows. Beside it, one line on
 * forward wobble: variances add, not vols.
 */

const H = KEY.hull_15_2;
const STRIKES: number[] = H.strikes;
const TS: number[] = H.T;
const NAMES: string[] = H.maturities;
const VOLS: number[][] = H.vols;
const PROBE_K = 1.05;
const J_PROBE = STRIKES.indexOf(PROBE_K);
const J_ATM = STRIKES.indexOf(1);
const V_MIN = Math.min(...VOLS.flat()),
  V_MAX = Math.max(...VOLS.flat());
const monthsLabel = (m: number) => (m < 12 ? `${m} m` : m % 12 === 0 ? `${m / 12} y` : `${Math.floor(m / 12)} y ${m % 12} m`);

function shade(v: number) {
  const u = (v - V_MIN) / (V_MAX - V_MIN);
  return { background: `color-mix(in srgb, var(--truth) ${Math.round(6 + 34 * u)}%, var(--surface-raised))` };
}

function Grid({
  strikes,
  rows,
  vols,
  hover,
  onHover,
  probeRows,
  probeCol,
  caption,
  strikeHead,
}: {
  strikes: string[];
  rows: string[];
  vols: number[][];
  hover: [number, number] | null;
  onHover: (h: [number, number] | null) => void;
  probeRows?: [number, number];
  probeCol?: number;
  caption: string;
  strikeHead: string;
}) {
  return (
    <table className="d2-grid" onMouseLeave={() => onHover(null)}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th className="d2-grid-corner">{strikeHead} →</th>
          {strikes.map((s, j) => (
            <th key={s} className={(hover && hover[1] === j ? "col-lit " : "") + (probeCol === j ? "col-probe" : "")}>
              {s}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((name, i) => (
          <tr key={name} className={(hover && hover[0] === i ? "row-lit " : "") + (probeRows && (i === probeRows[0] || i === probeRows[1]) ? "row-probe" : "")}>
            <th>{name}</th>
            {vols[i].map((v, j) => (
              <td
                key={j}
                style={shade(v)}
                className={(hover && (hover[0] === i || hover[1] === j) ? "lit " : "") + (hover && hover[0] === i && hover[1] === j ? "cell " : "") + (probeCol === j ? "col-probe" : "")}
                onMouseEnter={() => onHover([i, j])}
                onClick={() => onHover(hover && hover[0] === i && hover[1] === j ? null : [i, j])}
                tabIndex={0}
                onFocus={() => onHover([i, j])}
              >
                {n1(v)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function F4Surface() {
  const [months, setMonths] = useState(9);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const T = months / 12;
  const probe = useMemo(() => interpolateSurface(STRIKES, TS, VOLS, PROBE_K, T), [T]);
  const i0 = Math.max(0, Math.min(TS.length - 2, TS.findIndex((_, i) => i < TS.length - 1 && T <= TS[i + 1])));
  const onRow = TS.findIndex((t) => Math.abs(t - T) < 1e-9);
  const fwdAtm = forwardVol(VOLS[0][J_ATM] / 100, TS[0], VOLS[1][J_ATM] / 100, TS[1]);
  const jHi = STRIKES.length - 1;
  const fwdLate = forwardVol(VOLS[4][jHi] / 100, TS[4], VOLS[5][jHi] / 100, TS[5]);
  const fwdReal = forwardVol(REAL_SURFACE.atmVol[1], REAL_SURFACE.T[1], REAL_SURFACE.atmVol[2], REAL_SURFACE.T[2]);
  const hoverWords = hover ? `${NAMES[hover[0]]} × ${STRIKES[hover[1]].toFixed(2)}: ${n1(VOLS[hover[0]][hover[1]])} % — read across for the smile at ${NAMES[hover[0]]}, down for the term structure at ${STRIKES[hover[1]].toFixed(2)}` : "hover or tap a cell: across is the smile, down is the term structure";

  return (
    <Figure
      n="4"
      prompt={
        <>
          A second axis: time. Rows are expiries, columns strikes, every cell the implied wobble of one option. Read across for a smile, down for a term structure. The top grid is
          NIFTY at the close of 23 Oct — the chain's own 3 Nov row with a weekly before it and a monthly and a quarterly after. The bottom grid is Hull's textbook currency
          surface, kept because it has six rows: one probe walks down its {PROBE_K.toFixed(2)} column between the printed rows.
        </>
      }
      controls={
        <>
          <Slider label="expiry" value={months} min={1} max={60} step={1} onChange={setMonths} fmt={monthsLabel} role="truth" width={200} />
          <Readouts
            items={[
              ["strike", `${PROBE_K.toFixed(2)} × forward`],
              ["expiry", monthsLabel(months)],
              ["wobble", <span key="w" className="d2-truth">{n1(probe)} %</span>],
            ]}
          />
        </>
      }
      observe={
        <>
          {onRow >= 0 ? (
            <>
              At {NAMES[onRow]} the probe reads a printed cell: <strong>{n1(probe)} %</strong>.
            </>
          ) : (
            <>
              At {monthsLabel(months)} there is no printed row; the probe reads between {NAMES[i0]} ({n1(VOLS[i0][J_PROBE])} %) and {NAMES[i0 + 1]} ({n1(VOLS[i0 + 1][J_PROBE])} %):{" "}
              <strong>{n1(probe)} %</strong>.
            </>
          )}{" "}
          Between the cells the surface is interpolation — the formula is, in Hull's words, a sophisticated interpolation tool. The surface is the whole market's option book as
          one object.
        </>
      }
    >
      <div className="d2-stage">
        <Grid
          strikes={REAL_SURFACE.strikes.map((k) => k.toLocaleString("en-US"))}
          rows={REAL_SURFACE.expiries}
          vols={REAL_SURFACE.vols}
          hover={null}
          onHover={() => undefined}
          caption={REAL_SURFACE.label}
          strikeHead="strike"
        />
        <Grid strikes={STRIKES.map((s) => s.toFixed(2))} rows={NAMES} vols={VOLS} hover={hover} onHover={setHover} probeRows={onRow >= 0 ? [onRow, onRow] : [i0, i0 + 1]} probeCol={J_PROBE} caption="textbook currency surface, Hull Table 15.2 (implied vol, %)" strikeHead="strike ÷ forward" />
        <div className="d2-hint">{hoverWords}</div>
        <p className="d2-aside">
          Reading down a column, wobbles do not add — <em>variances</em> do. In the real grid, at the money, 3 Nov prints {(100 * REAL_SURFACE.atmVol[1]).toFixed(2)} % and 23 Nov{" "}
          {(100 * REAL_SURFACE.atmVol[2]).toFixed(2)} %, so the twenty days between them carry {(100 * fwdReal).toFixed(2)} % — a touch more than either, because the nearer wobble is the
          smaller one. In Hull's, 1 m and 3 m both print {n1(VOLS[0][J_ATM])} %, so the two
          months between them carry {n1(100 * fwdAtm)} %; at {STRIKES[jHi].toFixed(2)}, 2 y prints {n1(VOLS[4][jHi])} % and 5 y {n1(VOLS[5][jHi])} %, and the three years between them carry{" "}
          {n1(100 * fwdLate)} % — lower than both. One more thing the real grid shows: the 4-day row is a U (both wings above the middle), the longer rows a slope. Figure 1's tilt is not
          a fixed shape; it is one expiry's.
        </p>
      </div>
    </Figure>
  );
}
