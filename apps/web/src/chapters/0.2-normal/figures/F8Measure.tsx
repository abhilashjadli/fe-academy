import { useEffect, useMemo, useRef, useState } from "react";
import { die, pmfTailAtLeast, sumOf, normalTailAtLeast } from "../../../engine/discrete";
import { pdf } from "../../../engine/normal";
import { rng } from "../../../engine/random";
import { Figure } from "../../../ui/Figure";
import { Bars, Curve, Plot, VLine, Label, fmt } from "../../../ui/Plot";

const N_DICE = 100;
const TRIALS = 10000;
const MEAN = 350;
const SD = Math.sqrt((N_DICE * 35) / 12);
const Z95 = 1.959964;

/** 100 dice: predict, then roll 10,000 times and measure. */
export function F8Measure() {
  const [guess, setGuess] = useState("");
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
  const g = parseFloat(guess);

  return (
    <Figure
      n="8"
      prompt={<>Roll 100 fair dice and add them up. Before you roll: what is the chance the total exceeds 400? Type a guess, then roll ten thousand times.</>}
      controls={
        <>
          <label className="ctl">
            <span className="ctl-label">your guess, %</span>
            <input type="number" value={guess} onChange={(e) => setGuess(e.target.value)} style={{ width: 70, font: "inherit", padding: "3px 6px", border: "1px solid var(--rule)", borderRadius: 4, background: "var(--surface-raised)", color: "var(--ink)" }} step="0.1" min="0" max="100" />
          </label>
          <button type="button" className="btn primary" disabled={revealed > 0 && revealed < TRIALS} onClick={() => setRevealed(1)}>
            Roll 100 dice × 10,000
          </button>
          <button type="button" className="btn" onClick={() => { setSeed((s) => s + 1); setRevealed(0); }}>
            New sample
          </button>
          <span className="readouts">
            <span>
              <span className="k">trials </span>
              <span className="v">{m.toLocaleString()}</span>
            </span>
            <span>
              <span className="k">totals above 400: </span>
              <span className="v">{breaches}</span>
              <span className="k"> = </span>
              <span className="v">{m > 0 ? fmt.pct(2)(breaches / m) : "—"}</span>
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
          <p style={{ margin: 0 }}>
            From the formulas alone: mean 100 × 3.5 = 350, sd √100 × 1.708 = {fmt.n(2)(SD)}, so 400 is {fmt.n(2)((400.5 - MEAN) / SD)} standard deviations out and
            the bell gives {fmt.pct(3)(pNormal)} (exact, by convolution: {fmt.pct(3)(pExact)}). The 95 % band is {fmt.n(1)(MEAN - Z95 * SD)} to {fmt.n(1)(MEAN + Z95 * SD)}.
            {Number.isFinite(g) && <> You guessed {g} %.</>} Most people guess far too high: a sum of a hundred things is much more tightly bunched than
            the things themselves — the sd grew like √100 = 10 while the mean grew like 100.
          </p>
          <p style={{ margin: "0.4em 0 0" }}>
            Notice the two senses of "settling". The <em>sum</em> spreads out as n grows (sd ∝ √n); the <em>average</em> tightens (sd ∝ 1/√n). Same fact, two
            directions — and the second one is why Monte Carlo (chapter E2) converges so slowly.
          </p>
        </>
      }
    >
      <Plot xDomain={[lo, hi]} yDomain={[0, 0.03]} xLabel="total of 100 dice" yLabel="density" height={290} ariaLabel="Histogram of 10,000 totals of 100 dice with the normal curve">
        <Bars bars={bars} role="approx" opacity={0.75} gap={0} />
        <Curve pts={bell} role="truth" />
        <VLine at={400} role="error" />
        <Label at={[400, 0.028]} text="400" role="error" dx={4} />
        <VLine at={MEAN - Z95 * SD} />
        <VLine at={MEAN + Z95 * SD} />
        <Label at={[MEAN, 0.0285]} text="95 % band" anchor="middle" dx={0} />
      </Plot>
    </Figure>
  );
}
