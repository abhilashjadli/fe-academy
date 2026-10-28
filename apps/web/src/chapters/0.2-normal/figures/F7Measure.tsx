import { useEffect, useMemo, useRef, useState } from "react";
import { die, pmfTailAtLeast, sumOf, normalTailAtLeast } from "../../../engine/discrete";
import { pdf } from "../../../engine/normal";
import { rng } from "../../../engine/random";
import { Figure } from "../../../ui/Figure";
import { BetNumber, ResultCard, useBet } from "../../../ui/Bet";
import { Bars, Curve, Plot, VLine, Label, fmt } from "../../../ui/Plot";

const N_DICE = 100;
const TRIALS = 10000;
const MEAN = 350;
const SD = Math.sqrt((N_DICE * 35) / 12);
const Z95 = 1.959964;

/** 100 dice: predict, then roll 10,000 times and measure. */
export function F7Measure() {
  const [guessStr, setGuessStr] = useBet<string>("0.2-F8");
  const guess = guessStr === null ? null : parseFloat(guessStr);
  const [revealed, setRevealed] = useState(0);
  const [seed, setSeed] = useState(5);
  const samples = useMemo(() => {
    const r = rng(seed * 104729);
    const out = new Int32Array(TRIALS);
    for (let t = 0; t < TRIALS; t++) {
      let s = 0;
      for (let i = 0; i < N_DICE; i++) s += 1 + Math.floor(r() * 6);
      out[t] = s;
    }
    return out;
  }, [seed]);
  const exact = useMemo(() => sumOf(die([1, 1, 1, 1, 1, 1]), N_DICE), []);
  const pExact = pmfTailAtLeast(exact, 401);
  const pNormal = normalTailAtLeast(401, MEAN, SD);

  const raf = useRef(0);
  useEffect(() => {
    if (revealed <= 0 || revealed >= TRIALS) return;
    let cur = revealed;
    let lastT = performance.now();
    const step = (t: number) => {
      const dt = (t - lastT) / 1000;
      lastT = t;
      cur = Math.min(TRIALS, cur + Math.max(10, cur * 1.8) * dt);
      setRevealed(Math.floor(cur));
      if (cur < TRIALS) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed > 0 && revealed < TRIALS ? 1 : 0, seed]);

  const m = Math.min(revealed, TRIALS);
  const lo = 280,
    hi = 420,
    bw = 2;
  const counts = new Array(Math.ceil((hi - lo) / bw)).fill(0);
  let breaches = 0,
    inBand = 0;
  for (let t = 0; t < m; t++) {
    const s = samples[t];
    if (s > 400) breaches++;
    if (Math.abs(s - MEAN) <= Z95 * SD) inBand++;
    const b = Math.floor((s - lo) / bw);
    if (b >= 0 && b < counts.length) counts[b]++;
  }
  const bars = counts.map((c, i) => ({ x: lo + i * bw + bw / 2, y: m > 0 ? c / m / bw : 0, w: bw }));
  const bell: Array<[number, number]> = [];
  for (let i = 0; i <= 200; i++) {
    const x = lo + ((hi - lo) * i) / 200;
    bell.push([x, pdf((x - MEAN) / SD) / SD]);
  }

  const actual = m > 0 ? (100 * breaches) / m : null;
  const finished = m >= TRIALS;
  const verdict = guess === null || actual === null ? "none" : Math.abs(guess - actual) <= 1 ? "right" : Math.abs(guess - actual) <= 5 ? "close" : "miss";
  const pct1 = (v: number) => v.toFixed(v < 1 ? 2 : 1) + " %";

  return (
    <Figure
      n="7"
      prompt={<>Roll 100 fair dice and add them up. Before you roll: what is the chance the total beats 400? Commit to a guess, then roll ten thousand times.</>}
      controls={
        <>
          <button type="button" className="btn primary" disabled={guess === null || (revealed > 0 && revealed < TRIALS)} onClick={() => setRevealed(1)}>
            Roll 100 dice × 10,000
          </button>
          <button type="button" className="btn" onClick={() => { setSeed((s) => s + 1); setRevealed(0); }}>
            New sample
          </button>
          <span className="readouts">
            <span>
              <span className="k">rolls </span>
              <span className="v">{m.toLocaleString()}</span>
            </span>
            <span>
              <span className="k">totals above 400: </span>
              <span className="v">{breaches}</span>
              <span className="k"> = </span>
              <span className="v">{actual !== null ? pct1(actual) : "—"}</span>
            </span>
            <span>
              <span className="k">inside the 95 % band: </span>
              <span className="v">{m > 0 ? fmt.pct(1)(inBand / m) : "—"}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          Most people guess far too high. A sum of a hundred things is much more tightly bunched than the things themselves: the mean grew like 100, the spread only like
          √100 = 10. So 400 is five spreads out, and five spreads out is almost never.
          <details className="n2-more">
            <summary>the arithmetic, and the two senses of "settling"</summary>
            <p>
              One die: mean 3.5, sd 1.708. A hundred of them: mean 350, sd √100 × 1.708 = {fmt.n(2)(SD)}. So 400 sits {fmt.n(2)((400.5 - MEAN) / SD)} sd out, and the bell gives{" "}
              {pct1(100 * pNormal)}; listing every combination exactly gives {pct1(100 * pExact)}. The 95 % band runs from {fmt.n(0)(MEAN - Z95 * SD)} to {fmt.n(0)(MEAN + Z95 * SD)}.
            </p>
            <p>
              The <em>sum</em> spreads out as n grows (sd like √n); the <em>average</em> tightens (sd like 1/√n). Same fact, two directions — and the second is why simulation
              converges so slowly (chapter E2).
            </p>
          </details>
        </>
      }
    >
      <BetNumber question="Your guess: the chance the total beats 400 is…" unit="%" value={guess} onCommit={(v) => { setGuessStr(v === null ? null : String(v)); setRevealed(0); }} committed={guess !== null} min={0} max={100} step={0.1}>
        <Plot xDomain={[lo, hi]} yDomain={[0, 0.03]} xLabel="total of 100 dice" yLabel="density" height={290} ariaLabel="Histogram of 10,000 totals of 100 dice with the normal curve">
          <Bars bars={bars} role="approx" opacity={0.75} gap={0} />
          <Curve pts={bell} role="truth" />
          <VLine at={400} role="error" />
          <Label at={[400, 0.028]} text="400" role="error" dx={4} />
          <VLine at={MEAN - Z95 * SD} />
          <VLine at={MEAN + Z95 * SD} />
          <Label at={[MEAN, 0.0285]} text="95 % band" anchor="middle" dx={0} />
        </Plot>
        {finished && guess !== null && actual !== null && (
          <ResultCard yours={`${guess} %`} answer={`${pct1(actual)} — ${breaches} of ${m.toLocaleString()} rolls`} verdict={verdict}>
            {verdict === "right" ? "You felt the √n. " : verdict === "close" ? "Close, and in the right direction. " : guess > actual ? "Far too high — like almost everyone. " : "Too low, which is rare. "}
            The bell drawn from mean 350 and sd {fmt.n(1)(SD)} predicted {pct1(100 * pNormal)}; the pile agrees. Nothing here was fitted to the rolls.
          </ResultCard>
        )}
      </BetNumber>
    </Figure>
  );
}
