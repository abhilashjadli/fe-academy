import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Says } from "../../../ui/Comic";
import { Ledger, type LedgerRow } from "../../../ui/Ledger";
import { Readouts } from "../../../ui/controls";
import { Bars, Curve, HLine, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { doublingCycles, type Replay } from "../../../engine/martingale";
import { rng } from "../../../engine/random";
import key from "../../../engine/__fixtures__/key-B2.json";
import { Meter } from "./Meter";
import { PLAYERS, chips, doublingNight, f2, n2, pct0, pct1, useNarrow, useRecordReading } from "./table";

/**
 * Figure 2 — rule 3: you may size your bets. One doubling cycle by hand in a ledger (1 lose, 2 lose, 4 win → +1), then one
 * night of 100 cycles as a staircase with its cliff, and 10,000 such nights as a histogram. Median +4, 62 % ahead, 96 % hit
 * the limit at least once; the meter 0.00. The maths is named after this system.
 */

const K = 5; // doublings allowed: 1, 2, 4, 8, 16 — the next bet, 32, is over the limit
const LIMIT = Math.pow(2, K) - 1; // 31
const CYCLES = 100;
const SEED_NIGHT = 20264;
const SEED_ALL = 20266;

/** The hand-played cycle: two losses then a win; the ledger arithmetic is computed, not typed. */
const HAND: Array<{ bet: number; toss: 1 | -1 }> = [
  { bet: 1, toss: -1 },
  { bet: 2, toss: -1 },
  { bet: 4, toss: 1 },
];

export function F2Double() {
  const [night, setNight] = useState(0); // 0 = not yet; n = which night is drawn
  const narrow = useNarrow();
  const rows = useMemo<LedgerRow[]>(() => {
    let w = 0;
    return HAND.map((h, i) => {
      w += h.bet * h.toss;
      const won = h.toss > 0;
      return {
        label: `toss ${i + 1}: bet ${h.bet} on red — ${won ? "red" : "black"}`,
        work: `${chips(w - h.bet * h.toss)} ${won ? "+" : "−"} ${h.bet}`,
        value: chips(w),
        role: won ? "truth" : "error",
        note: i === HAND.length - 1 ? "One win returns everything lost and one chip more. Then the cycle starts again at 1." : i === 1 ? "Down 3. The system says: double again." : "Down 1. The system says: double.",
      } as LedgerRow;
    });
  }, []);

  const path = useMemo(() => (night ? doublingNight(K, CYCLES, SEED_NIGHT + night) : null), [night]);
  const all = useMemo(() => (night ? doublingCycles(K, CYCLES, PLAYERS, rng(SEED_ALL)) : null), [night]);
  const replay: Replay | null = all;
  useRecordReading("F2", replay);
  const kd = key.doubling_k5;

  // histogram over the distinct final values 100 − 32·ruins
  const hist = useMemo(() => {
    if (!all) return [];
    const m = new Map<number, number>();
    for (const v of all.finals) m.set(v, (m.get(v) ?? 0) + 1);
    return Array.from(m.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([v, c]) => ({ x: v, y: c / all.finals.length, w: 14 }));
  }, [all]);
  const top = hist.length ? Math.max(...hist.map((b) => b.y)) * 1.3 : 1;
  const w = narrow ? 360 : 420;

  return (
    <Figure
      n="2"
      prompt={
        <>
          Rule three. Click through one cycle of the oldest system there is — double after every loss — then let the table run a hundred cycles for ten thousand players.
        </>
      }
      controls={
        <>
          <button type="button" className={"btn " + (night ? "" : "primary")} onClick={() => setNight((n) => n + 1)}>
            {night ? "another night, same 10,000" : `${CYCLES} cycles, ${PLAYERS.toLocaleString("en-IN")} players`}
          </button>
          <Readouts
            items={[
              ["median night", all ? <strong>{chips(all.median)}</strong> : "—"],
              ["nights ahead", all ? pct0(all.pAhead) : "—"],
              ["hit the limit at least once", all ? <span className="b2-error">{pct0(all.pAtLeastOneRuin)}</span> : "—"],
            ]}
          />
        </>
      }
      observe={
        !night ? (
          <>Click the ledger through: bet 1, lose; bet 2, lose; bet 4, win. Then run the night.</>
        ) : (
          <>
            A staircase of +1s and, one night in {Math.round(1 / all!.pRuinPerCycle)}, the cliff: five blacks in a row, the next bet would be 32, over the limit, and the night is down {LIMIT} in one cycle. Over 100 cycles the median night is{" "}
            <strong>{chips(all!.median)}</strong> and {pct0(all!.pAhead)} of players go home ahead — and {pct0(all!.pAtLeastOneRuin)} of them met the cliff at least once (the answer key: median {chips(kd.median)}, {pct1(kd.p_ahead)} ahead, {pct1(kd.p_at_least_one_ruin)} ruined at least once, exact {pct1(kd.p_at_least_one_ruin_formula)}). The meter reads <strong>{f2(all!.mean)}</strong> ± {n2(2 * all!.se)}; the exact mean per cycle is {kd.mean_cycle_formula}: 31 chances in 32 of +1 against 1 in 32 of −31. The mathematics of fair games is named after this system — the thing that does not work.
          </>
        )
      }
    >
      <Says who="Croupier">Bet what you like; the limit is {LIMIT}.</Says>
      <div className="b2-stage">
        <Meter replay={replay} />
        <div className="b2-ledger">
          <Ledger rows={rows} total={(shown) => chips(HAND.slice(0, shown).reduce((s, h) => s + h.bet * h.toss, 0))} nextLabel="next toss" />
        </div>
        {path && all && (
          <div className="b2-two">
            <Plot xDomain={[0, CYCLES]} yDomain={[-70, 100]} width={w} height={narrow ? 210 : 240} xLabel="cycles" yLabel="chips, one night" xTicks={5} yTicks={5} margin={{ top: 14, right: 14, bottom: 34, left: 44 }} ariaLabel="one night of doubling: a staircase with cliffs">
              <HLine at={0} />
              <Curve pts={path.wealth.map((v, i) => [i, v] as Pt)} role="approx" width={2} smooth={false} />
              {path.cliffs.map((c) => (
                <Marker key={c} at={[c, path.wealth[c]]} role="error" r={4} />
              ))}
              {path.cliffs.length > 0 && <Label at={[path.cliffs[0], path.wealth[path.cliffs[0]]]} text={`the cliff: −${LIMIT}`} role="error" dx={6} dy={14} />}
              <Label at={[CYCLES, path.wealth[CYCLES]]} text={`night ${night}: ${chips(path.wealth[CYCLES])}`} role="approx" dx={-4} dy={-8} anchor="end" />
            </Plot>
            <Plot xDomain={[-170, 125]} yDomain={[0, top]} width={w} height={narrow ? 200 : 240} xLabel={`final chips after ${CYCLES} cycles`} yLabel="share of nights" xTicks={narrow ? 4 : 7} yTicks={4} margin={{ top: 14, right: 14, bottom: 34, left: 48 }} ariaLabel="histogram of 10,000 nights">
              <Bars bars={hist} role="approx" opacity={0.85} gap={1} />
              <Label at={[52, top * 0.53]} text={`no cliff: ${pct0(hist.find((b) => b.x === 100)?.y ?? 0)}`} role="approx" dx={0} dy={0} anchor="start" />
              <Label at={[all.median, hist.find((b) => b.x === all.median)?.y ?? 0]} text={`median ${chips(all.median)}`} dx={0} dy={-8} anchor="middle" />
            </Plot>
          </div>
        )}
      </div>
    </Figure>
  );
}
