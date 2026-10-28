import { useMemo, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { GaltonCanvas, type GaltonHandle } from "../GaltonCanvas";
import { fmt } from "../../../ui/Plot";
import { Segmented } from "../../../ui/controls";

const ROWS = 12;
const WILD_PROB = 0.01; // one bounce in a hundred
const WILD_JUMP = 5; // buckets
type Mode = "fair" | "sticky" | "uneven" | "wild";

/** Break it, on the board itself: dependence, non-identical pegs, and one peg in a hundred that flings the ball sideways. */
export function F8Break() {
  const board = useRef<GaltonHandle>(null);
  const [mode, setMode] = useState<Mode>("fair");
  const [counts, setCounts] = useState<number[]>(new Array(ROWS + 1).fill(0));
  const [dropped, setDropped] = useState(0);
  const [flung, setFlung] = useState(0);
  const rowBias = useMemo(() => Array.from({ length: ROWS }, (_, r) => (r % 2 === 0 ? 0.25 : -0.25)), []);

  // measured sd of bucket index vs the binomial's √(np(1−p))
  const mean = dropped ? counts.reduce((s, c, k) => s + c * k, 0) / dropped : 0;
  const sd = dropped ? Math.sqrt(counts.reduce((s, c, k) => s + c * (k - mean) ** 2, 0) / dropped) : 0;
  const sdFair = Math.sqrt(ROWS * 0.25);
  const edge = counts[0] + counts[ROWS];

  return (
    <Figure
      n="8"
      prompt={<>Break it. The bell needs three things from the bounces: independence, a similar rule at every peg, and no single bounce that can dwarf all the others. Remove each and drop.</>}
      controls={
        <>
          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m);
              board.current?.reset();
              setDropped(0);
              setFlung(0);
            }}
            options={[
              { id: "fair", label: "fair pegs" },
              { id: "sticky", label: "sticky pegs" },
              { id: "uneven", label: "uneven rows" },
              { id: "wild", label: "one wild peg in a hundred" },
            ]}
          />
          <button type="button" className="btn primary" onClick={() => board.current?.drop({ n: 400, speed: 9, interval: 50 })}>
            Drop 400
          </button>
          <span className="readouts">
            <span>
              <span className="k">spread of the pile </span>
              <span className="v">{dropped ? fmt.n(2)(sd) : "—"}</span>
              <span className="k"> vs the bell's </span>
              <span className="v">{fmt.n(2)(sdFair)}</span>
            </span>
            {mode === "wild" && dropped > 0 && (
              <span>
                <span className="k">balls flung </span>
                <span className="v tok-error">{flung}</span>
                <span className="k"> · in the two end buckets </span>
                <span className="v tok-error">{edge}</span>
              </span>
            )}
          </span>
        </>
      }
      observe={
        <>
          {mode === "fair" && <>Fair, independent pegs: the pile is the binomial, and its spread matches the dashed bell outline. This is the baseline — now break something.</>}
          {mode === "sticky" && (
            <>
              <strong>Dependence.</strong> After a right bounce the next is 80 % likely to go right too. Balls streak to the edges; the pile is wider and flatter than the bell, and
              its spread runs well above the bell's. Independence is what made the variances simply add.
            </>
          )}
          {mode === "uneven" && (
            <>
              <strong>Not identical.</strong> Alternate rows lean left and right. The pile is still a bell: the result tolerates a different rule at every peg, as long as no single
              peg dominates. "Identical" was a convenience, not a necessity.
            </>
          )}
          {mode === "wild" && (
            <>
              <strong>A heavy tail.</strong> One bounce in a hundred flings the ball five buckets sideways — the red ones. Most of the pile is the same bell, but the end buckets
              fill where the bell promised almost nothing, and the spread never settles. A single bounce that can dwarf the others breaks the bell.
              <details className="n2-more">
                <summary>why this one matters most</summary>
                <p>
                  Sticky and uneven pegs change the bell's width; the wild peg changes its kind. The number of balls in the far buckets after 400 drops is a number the bell
                  cannot produce, however you set its width — and daily market moves look more like this board than like the fair one. Chapter A1 is about exactly that.
                </p>
              </details>
            </>
          )}
        </>
      }
    >
      <GaltonCanvas
        key={mode}
        ref={board}
        rows={ROWS}
        seed={23}
        sticky={mode === "sticky" ? 0.6 : 0}
        rowBias={mode === "uneven" ? rowBias : undefined}
        wildProb={mode === "wild" ? WILD_PROB : 0}
        wildJump={WILD_JUMP}
        showExpected
        onCountsChange={(c, d, f) => {
          setCounts(c);
          setDropped(d);
          setFlung(f);
        }}
        ariaLabel="Galton board with modified pegs"
      />
    </Figure>
  );
}
