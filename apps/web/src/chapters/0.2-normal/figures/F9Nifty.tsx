import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { IconGrid } from "../../../ui/IconGrid";
import { cdf } from "../../../engine/normal";
import nifty from "../../../data/nifty50.json";

const BIG = 0.02; // a "big day": the index moved more than 2 %

/** The bell on real data: a year of NIFTY 50 daily moves, one square each; the bell's promise versus the count. */
export function F9Nifty() {
  const { rets, big, expected, sd } = useMemo(() => {
    const c = nifty.rows.map((r) => r.c);
    const rets = c.slice(1).map((v, i) => Math.log(v / c[i]));
    const sd = Math.sqrt(rets.reduce((s, x) => s + x * x, 0) / rets.length);
    const big = new Set(rets.map((x, i) => (Math.abs(x) > BIG ? i : -1)).filter((i) => i >= 0));
    const expected = rets.length * 2 * (1 - cdf(BIG / sd));
    return { rets, big, expected, sd };
  }, []);
  const first = nifty.rows[0].d;
  const last = nifty.rows[nifty.rows.length - 1].d;

  return (
    <Figure
      n="9"
      prompt={
        <>
          Real data, not simulated: every trading day of the last year of the NIFTY 50, one square each. <span className="tok-error">Rose</span>: the index moved more than 2 % that day.
          Hover a square for its date.
        </>
      }
      observe={
        <>
          A bell with this year's spread — sd {(100 * sd).toFixed(2)} % a day — promised about <strong>{Math.round(expected)}</strong> days beyond 2 %. There were{" "}
          <strong>{big.size}</strong>. The middle of the pile is a bell; the edges are the wild peg. Keep both facts: the bell is a first draft, and a dangerous final answer.
        </>
      }
    >
      <IconGrid
        n={rets.length}
        perRow={25}
        groupEvery={5}
        roleOf={(i) => (big.has(i) ? "error" : "ghost")}
        titleOf={(i) => `${nifty.rows[i + 1].d}: ${(rets[i] * 100).toFixed(2)} %`}
        label={
          <>
            NIFTY 50, {first} to {last}: <strong>{big.size} of {rets.length}</strong> days beyond 2 %. Source: {nifty.source}.
          </>
        }
      />
    </Figure>
  );
}
