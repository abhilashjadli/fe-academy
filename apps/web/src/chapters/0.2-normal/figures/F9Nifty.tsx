import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { IconGrid } from "../../../ui/IconGrid";
import { cdf } from "../../../engine/normal";
import nifty from "../../../data/nifty50-long.json";

const K = 3; // a "big day": the index moved more than 3 usual-day units (3σ)

/** The bell on real data: a year of NIFTY 50 daily moves, one square each; the bell's promise versus the count. */
export function F9Nifty() {
  const { rets, big, huge, expected, expected5, sd } = useMemo(() => {
    const c = nifty.rows.map((r) => r.c);
    const rets = c.slice(1).map((v, i) => Math.log(v / c[i]));
    const sd = Math.sqrt(rets.reduce((s, x) => s + x * x, 0) / rets.length);
    const big = new Set(rets.map((x, i) => (Math.abs(x) > K * sd ? i : -1)).filter((i) => i >= 0));
    const huge = new Set(rets.map((x, i) => (Math.abs(x) > 5 * sd ? i : -1)).filter((i) => i >= 0));
    const expected = rets.length * 2 * (1 - cdf(K));
    const expected5 = rets.length * 2 * (1 - cdf(5));
    return { rets, big, huge, expected, expected5, sd };
  }, []);
  const first = nifty.rows[0].d;
  const last = nifty.rows[nifty.rows.length - 1].d;

  return (
    <Figure
      n="9"
      prompt={
        <>
          Real data, not simulated: every trading day of the NIFTY 50 for ten years, one square each, a hundred to a row. <span className="tok-error">Rose</span>: a
          three-sigma day — the index moved more than three usual days' worth. Hover a square for its date.
        </>
      }
      observe={
        <>
          A usual day moves {(100 * sd).toFixed(2)} %. A bell with that spread promised about <strong>{Math.round(expected)}</strong> three-sigma days in ten years; there
          were <strong>{big.size}</strong>. Beyond five sigma it promised <strong>{expected5.toFixed(2)}</strong>; there were <strong>{huge.size}</strong>, and four of them are in
          March 2020. The middle of the pile is a bell; the edges are the wild peg.
        </>
      }
    >
      <IconGrid
        n={rets.length}
        perRow={100}
        size={7}
        gap={2}
        groupEvery={5}
        roleOf={(i) => (huge.has(i) ? "ink" : big.has(i) ? "error" : "ghost")}
        titleOf={(i) => `${nifty.rows[i + 1].d}: ${(rets[i] * 100).toFixed(2)} %`}
        label={
          <>
            NIFTY 50, {first} to {last}: <strong>{big.size} of {rets.length}</strong> days beyond 3σ (rose), {huge.size} beyond 5σ (black). Source: {nifty.source}.
          </>
        }
      />
    </Figure>
  );
}
