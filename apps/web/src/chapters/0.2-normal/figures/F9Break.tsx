import { useMemo, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { GaltonCanvas, type GaltonHandle } from "../GaltonCanvas";
import { rng } from "../../../engine/random";
import { Bars, Curve, Plot, fmt } from "../../../ui/Plot";
import { pdf } from "../../../engine/normal";
import { Segmented } from "../../../ui/controls";

const ROWS = 12;
type Mode = "fair" | "sticky" | "uneven" | "wild";

/** Break it: dependence, non-identical pegs, a heavy-tailed die. */
export function F9Break() {
  const board = useRef<GaltonHandle>(null);
  const [mode, setMode] = useState<Mode>("fair");
  const [counts, setCounts] = useState<number[]>(new Array(ROWS + 1).fill(0));
  const [dropped, setDropped] = useState(0);
  const rowBias = useMemo(() => Array.from({ length: ROWS }, (_, r) => (r % 2 === 0 ? 0.25 : -0.25)), []);

  // measured sd of bucket index vs the binomial's √(np(1−p))
  const mean = dropped ? counts.reduce((s, c, k) => s + c * k, 0) / dropped : 0;
  const sd = dropped ? Math.sqrt(counts.reduce((s, c, k) => s + c * (k - mean) ** 2, 0) / dropped) : 0;
  const sdFair = Math.sqrt(ROWS * 0.25);

  // wild die: face 6 replaced by a rare face worth 300 (prob 1/300), sums of 50
  const wild = useMemo(() => {
    const r = rng(99);
    const out: number[] = [];
    for (let t = 0; t < 4000; t++) {
      let s = 0;
      for (let i = 0; i < 50; i++) s += r() < 1 / 300 ? 300 : 1 + Math.floor(r() * 5);
      out.push(s);
    }
    return out;
  }, []);
  const [wildN, setWildN] = useState(200);
  const wildStats = useMemo(() => {
    const xs = wild.slice(0, wildN);
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length;
    return { m, sd: Math.sqrt(v) };
  }, [wild, wildN]);
  const wildBars = useMemo(() => {
    const xs = wild.slice(0, wildN);
    const lo = 100,
      hi = 500,
      bw = 5;
    const counts = new Array((hi - lo) / bw).fill(0);
    for (const s of xs) {
      const b = Math.floor((s - lo) / bw);
      if (b >= 0 && b < counts.length) counts[b]++;
    }
    return counts.map((c, i) => ({ x: lo + i * bw + bw / 2, y: c / xs.length / bw, w: bw }));
  }, [wild, wildN]);
  const wildBell: Array<[number, number]> = [];
  for (let i = 0; i <= 200; i++) {
    const x = 100 + (400 * i) / 200;
    wildBell.push([x, pdf((x - wildStats.m) / wildStats.sd) / wildStats.sd]);
  }

  return (
    <Figure
      n="9"
      prompt={<>Break it. The bell needs three things from the bounces: independence, a similar rule at every peg, and no single bounce that can dwarf all the others. Remove each and watch.</>}
      controls={
        <>
          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m);
              board.current?.reset();
              setDropped(0);
            }}
            options={[
              { id: "fair", label: "fair pegs" },
              { id: "sticky", label: "sticky pegs (dependence)" },
              { id: "uneven", label: "uneven rows (not identical)" },
              { id: "wild", label: "one wild face (heavy tail)" },
            ]}
          />
          {mode !== "wild" ? (
            <>
              <button type="button" className="btn primary" onClick={() => board.current?.drop({ n: 400, speed: 9, interval: 50 })}>
                Drop 400
              </button>
              <span className="readouts">
                <span>
                  <span className="k">measured sd of bucket </span>
                  <span className="v">{dropped ? fmt.n(2)(sd) : "—"}</span>
                  <span className="k"> vs √(np(1−p)) = </span>
                  <span className="v">{fmt.n(2)(sdFair)}</span>
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="ctl">
                <span className="ctl-label">rolls of 50 dice shown</span>
                <input type="range" min={50} max={4000} step={50} value={wildN} onChange={(e) => setWildN(parseInt(e.target.value))} />
                <span className="readout">{wildN}</span>
              </span>
              <span className="readouts">
                <span>
                  <span className="k">running sd </span>
                  <span className="v">{fmt.n(1)(wildStats.sd)}</span>
                </span>
              </span>
            </>
          )}
        </>
      }
      observe={
        <>
          {mode === "fair" && <>Fair, independent pegs: the pile is the binomial, sd ≈ {fmt.n(2)(sdFair)}.</>}
          {mode === "sticky" && (
            <>
              <strong>Dependence.</strong> After a right bounce the next is 80 % likely to be right too. The balls streak to the edges; the pile is wider and
              flatter than the bell predicts, and the measured sd runs well above √(np(1−p)). Independence is what made variances simply add.
            </>
          )}
          {mode === "uneven" && (
            <>
              <strong>Not identical.</strong> Alternate rows are biased left and right. The pile is still a bell: the theorem tolerates different distributions
              at each step as long as none dominates. "Identically distributed" is a convenience, not a necessity.
            </>
          )}
          {mode === "wild" && (
            <>
              <strong>A heavy tail.</strong> One face in 300 is worth 300 instead of 1–5. Most totals of 50 dice bunch near 150 — but every so often one
              wild face lands and the total jumps by 300. The bell fitted to the running mean and sd (blue) is a poor description of what actually happens,
              and the running sd never settles; it leaps every time the rare face appears. A single bounce that can dwarf all the others breaks the bell,
              and market returns are closer to this die than to a fair one — chapter A1.
            </>
          )}
        </>
      }
    >
      {mode !== "wild" ? (
        <GaltonCanvas
          key={mode}
          ref={board}
          rows={ROWS}
          seed={23}
          sticky={mode === "sticky" ? 0.6 : 0}
          rowBias={mode === "uneven" ? rowBias : undefined}
          showExpected
          onCountsChange={(c, d) => {
            setCounts(c);
            setDropped(d);
          }}
          ariaLabel="Galton board with modified pegs"
        />
      ) : (
        <Plot xDomain={[100, 500]} yDomain={[0, 0.05]} xLabel="total of 50 dice" yLabel="density" height={300} ariaLabel="Histogram of totals with a heavy-tailed die">
          <Bars bars={wildBars} role="approx" gap={0} />
          <Curve pts={wildBell} role="truth" />
        </Plot>
      )}
    </Figure>
  );
}
