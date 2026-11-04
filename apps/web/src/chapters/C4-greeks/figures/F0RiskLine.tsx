import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, useBet } from "../../../ui/Bet";
import { KEY, LINE, MOVE, REAL_DAY, ROW, indian, n0, n2, rs, rsSigned } from "./row";
import { useLit, type Tile } from "./lit";

/**
 * Figure 0 — the risk line, unread. A desk's screen row for Raj's position: six numbers, five of them Greeks nobody has
 * named yet. Each tile says only what unit it is in. One bet under it; the answer is Figure 4's. Tiles light as later
 * figures explain them (see lit.ts) — cosmetic only.
 */

type Pick = "lose1" | "lose3" | "gain2";

interface TileDef {
  id: Tile | "position";
  head: string;
  value: string;
  unit: string;
  /** what the tile is once it has been explained (shown only when lit) */
  meaning?: string;
  /** the hotspot note: the unit, and nothing else */
  note: string;
  n?: number;
}

const TILES: TileDef[] = [
  { id: "position", head: "position", value: `−${ROW.lots} lots`, unit: `× ${ROW.lot} = ${indian(ROW.units)} units`, note: `Lots of ${ROW.lot} units of the index. Minus means Raj sold them.` },
  { id: "price", n: 1, head: "premium", value: rs(LINE.premium), unit: "rupees, received Friday", meaning: "the height", note: `Rupees. What the ${ROW.lots} lots fetched on Friday, 23 October: ${n2(KEY.row.call)} a unit × ${indian(-ROW.units)} units.` },
  { id: "delta", n: 2, head: "delta", value: indian(LINE.deltaUnits), unit: "index units", meaning: "the slope", note: `Units of the index — the same unit as the position row, so ${indian(LINE.deltaUnits)} units is about ${n0(Math.abs(LINE.deltaUnits) / ROW.lot)} lots.` },
  { id: "gamma", n: 3, head: "gamma", value: rs(LINE.gammaPer100), unit: "per 100 pts", meaning: "the bend", note: "Rupees per 100-point move of the index, either way." },
  { id: "theta", n: 4, head: "theta", value: rsSigned(LINE.thetaDay), unit: "per calendar day", meaning: "the clock", note: "Rupees per calendar day. Saturdays and Sundays included." },
  { id: "vega", n: 5, head: "vega", value: rs(LINE.vegaPerPt), unit: "per vol point", meaning: "the wobble dial", note: "Rupees per one percentage point of volatility (15.9 % → 16.9 %)." },
];

export function F0RiskLine() {
  const [pick, setPick] = useBet<Pick>("C4-F0");
  const [open, setOpen] = useState<number | null>(null);
  const lit = useLit();
  const cur = open === null ? null : TILES[open];
  return (
    <Figure
      n="0"
      prompt={
        <>
          Raj's risk screen on Friday evening, 23 October 2026: one row for the 22,600 call he sold. Click a number — the screen will tell you its unit and
          nothing else.
        </>
      }
      observe={
        <>
          Six numbers and five of them have Greek names you have not been told. By the end of the page every tile is lit, and each one is the same
          thing — one curved surface, read at the spot where Raj stands. First, commit to Monday.
        </>
      }
    >
      <div className="c4-screen" role="group" aria-label="risk line">
        <div className="c4-screen-head">
          <span>NIFTY 03NOV2026 CE 22600</span>
          <span>FRI 23-OCT 15:30</span>
        </div>
        <div className="c4-row">
          {TILES.map((t, k) => {
            const isLit = t.id !== "position" && lit.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                className={"c4-tile " + (open === k ? "on " : "") + (isLit ? "lit " : "") + (t.id === "position" ? "pos" : "")}
                aria-pressed={open === k}
                onClick={() => setOpen(open === k ? null : k)}
              >
                <span className="c4-tile-head">
                  {t.n !== undefined && <span className="c4-tile-n">{t.n}</span>}
                  {t.head}
                </span>
                <span className="c4-tile-v">{t.value}</span>
                <span className="c4-tile-u">{t.unit}</span>
                {isLit && <span className="c4-tile-meaning">{t.meaning}</span>}
              </button>
            );
          })}
        </div>
        <div className="c4-screen-note" aria-live="polite">
          {cur ? (
            <>
              <strong>{cur.head}.</strong> {cur.note}
            </>
          ) : (
            <>Five tiles, five units. Their meanings arrive one figure at a time.</>
          )}
        </div>
      </div>

      <Bet<Pick>
        question={
          <>
            Monday the index opens {n0(MOVE)} points higher ({n0(REAL_DAY.fromClose)} → {n0(REAL_DAY.toClose)}, the real Monday close). Raj's position…
          </>
        }
        options={[
          { id: "lose1", label: "loses ≈ ₹1 lakh" },
          { id: "lose3", label: "loses ≈ ₹3 lakh" },
          { id: "gain2", label: "gains ≈ ₹2 lakh" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <div className="c4-bet-held">Bet held. The answer is at Figure 4 — and Figure 4 shows why, row by row.</div>
      </Bet>
    </Figure>
  );
}
