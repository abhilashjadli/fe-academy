import { useEffect, useMemo, useRef, useState } from "react";
import { die, pmfMean, pmfVariance, sumOf, type Pmf } from "../../../engine/discrete";
import { pdf } from "../../../engine/normal";
import { rng, sampleIndex } from "../../../engine/random";
import { Figure } from "../../../ui/Figure";
import { Bars, Curve, Plot, fmt } from "../../../ui/Plot";
import { Toggle } from "../../../ui/controls";
import { DieEditor } from "../DieEditor";

const NS = [1, 2, 5, 15, 50];
const TRIALS = 3000;

/** Draw your own die; watch sums of 1, 2, 5, 15, 50 dice pile up; standardise to one curve. */
export function F5Dice() {
  const [w, setW] = useState<number[]>([6, 5, 4, 3, 2, 1]);
  const [std, setStd] = useState(false);
  const [exact, setExact] = useState(false);
  const [revealed, setRevealed] = useState(0); // number of trials revealed
  const [seed, setSeed] = useState(1);
  const d = useMemo(() => die(w), [w]);
  const sums = useMemo(() => NS.map((n) => sumOf(d, n)), [d]);

  // pre-generated samples (seeded), revealed by index
  const samples = useMemo(() => {
    const r = rng(seed * 7919);
    return NS.map((n) => {
      const out = new Int32Array(TRIALS);
      for (let t = 0; t < TRIALS; t++) {
        let s = 0;
        for (let i = 0; i < n; i++) s += 1 + sampleIndex(w, r());
        out[t] = s;
      }
      return out;
    });
  }, [w, seed]);

  // animation of the reveal (log-spaced speed ramp)
  const raf = useRef(0);
  useEffect(() => {
    if (revealed <= 0 || revealed >= TRIALS) return;
    let cur = revealed;
    let lastT = performance.now();
    const step = (t: number) => {
      const dt = (t - lastT) / 1000;
      lastT = t;
      const rate = Math.max(8, cur * 1.6); // trials per second grows with count
      cur = Math.min(TRIALS, cur + rate * dt);
      setRevealed(Math.floor(cur));
      if (cur < TRIALS) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed > 0 && revealed < TRIALS ? 1 : 0, seed, w]);

  const hist = (i: number) => {
    const n = NS[i];
    const s = sums[i];
    const counts = new Array(s.p.length).fill(0);
    const m = Math.min(revealed, TRIALS);
    for (let t = 0; t < m; t++) counts[samples[i][t] - s.x0]++;
    return { counts, total: m, x0: s.x0, n };
  };

  const panel = (i: number) => {
    const s: Pmf = sums[i];
    const n = NS[i];
    const mean = pmfMean(s);
    const sd = Math.sqrt(pmfVariance(s));
    const h = hist(i);
    const toZ = (x: number) => (x - mean) / sd;
    const bars = s.p.map((pv, j) => {
      const x = s.x0 + j;
      const freq = h.total > 0 ? h.counts[j] / h.total : 0;
      const yv = exact || h.total === 0 ? pv : freq;
      return std ? { x: toZ(x), y: yv * sd, w: 1 / sd } : { x, y: yv, w: 1 };
    });
    const xdom: [number, number] = std ? [-4, 4] : [s.x0 - 0.5, s.x0 + s.p.length - 0.5];
    const ymax = std ? 0.5 : Math.max(...s.p) * 1.25;
    const bell: Array<[number, number]> = [];
    if (std) for (let k = 0; k <= 120; k++) bell.push([-4 + (8 * k) / 120, pdf(-4 + (8 * k) / 120)]);
    return (
      <div key={n}>
        <Plot xDomain={xdom} yDomain={[0, ymax]} width={360} height={190} xTicks={std ? 5 : 6} yTicks={3} xLabel={std ? "(sum − mean) / sd" : `sum of ${n}`} ariaLabel={`Distribution of the sum of ${n} dice`} margin={{ top: 10, right: 10, bottom: 30, left: 36 }}>
          <Bars bars={bars} role={h.total > 0 || exact ? "approx" : "ghost"} opacity={h.total > 0 || exact ? 0.8 : 0.55} />
          {std && <Curve pts={bell} role="truth" />}
        </Plot>
        <div className="readouts" style={{ padding: "0 0.4rem", fontSize: "0.78rem" }}>
          <span>
            <span className="k">n = {n} · mean </span>
            <span className="v">{fmt.n(2)(mean)}</span>
            <span className="k"> sd </span>
            <span className="v">{fmt.n(2)(sd)}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <Figure
      n="5"
      prompt={<>Not just coins. Draw your own unfair die (drag the six bars), then roll it — 1, 2, 5, 15 and 50 at a time — and watch the sums pile up.</>}
      controls={
        <>
          <span className="ctl" style={{ alignItems: "flex-end" }}>
            <span className="ctl-label">your die</span>
            <DieEditor
              weights={w}
              onChange={(nw) => {
                setW(nw);
                setRevealed(0);
              }}
            />
          </span>
          <button type="button" className="btn primary" onClick={() => { setExact(false); setRevealed(1); }}>
            Roll {TRIALS.toLocaleString()}×
          </button>
          <button type="button" className="btn" onClick={() => { setSeed((s) => s + 1); setRevealed(0); }}>
            New sample
          </button>
          <Toggle label="exact (roll forever)" on={exact} onChange={setExact} />
          <Toggle label="shift by the mean, squeeze by the sd" on={std} onChange={setStd} />
          <span className="readouts">
            <span>
              <span className="k">rolls shown </span>
              <span className="v">{Math.min(revealed, TRIALS).toLocaleString()}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          Whatever die you drew, the sum of 15 or 50 of them is a hump — and once each pile is shifted by its mean and squeezed by its sd, they all land on{" "}
          <span className="tok-truth">the same curve</span>. The die's shape is forgotten. Only its mean and variance survive, and those simply add up.
          <details className="n2-more">
            <summary>why √n, and what "exact" means</summary>
            <p>
              The mean of a sum is the sum of the means; the variance of a sum of independent things is the sum of the variances. So n dice have n times the variance, and the
              sd — the square root — grows like √n.
            </p>
            <p>
              "Exact" shows what the bars would be if you rolled forever — worked out by listing every combination of faces instead of trusting 3,000 rolls. (The listing
              is called a convolution.)
            </p>
          </details>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0.4rem" }}>{NS.map((_, i) => panel(i))}</div>
    </Figure>
  );
}
