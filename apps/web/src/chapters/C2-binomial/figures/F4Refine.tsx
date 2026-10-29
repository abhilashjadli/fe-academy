import { useEffect, useMemo, useState } from "react";
import { format } from "d3-format";
import { scaleLog } from "d3-scale";
import { Figure } from "../../../ui/Figure";
import { Clip } from "../../../ui/Clip";
import { WatchOrDo } from "../../../ui/WatchOrDo";
import { Readouts, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, Points, type Pt } from "../../../ui/Plot";
import { bsPrice, convergence, crrParameters, crrPrice, oddEvenAverage, terminalProbabilities } from "../../../engine/binomial";
import { rng } from "../../../engine/random";
import "./figures.css";

/**
 * Figure 4 — the trick scaled up. A 100-stock, the right to buy at 100, one year, 5 % interest, 20 % wobble (the standard textbook case).
 * One scrubber: steps, 1 → 1,000. The board on its side grows rows, the buckets on the right sharpen into a leaning bell, and the price
 * settles on 10.4506 — Black–Scholes, written once, handed to C3. The "watch" tab is the 17-second clip of the same thing.
 */

const P = { S: 100, K: 100, r: 0.05, sigma: 0.2, T: 1, kind: "call" as const };
const STEPS = [1, 2, 3, 5, 10, 11, 20, 21, 50, 100, 200, 500, 1000];
const SAWTOOTH_NS = [...Array.from({ length: 100 }, (_, i) => i + 1), 110, 120, 130, 140, 150, 160, 170, 180, 200, 250, 300, 400, 500, 750, 1000];
const f4 = format(".4f");
const f2 = format(".2f");
const fsign4 = format("+.4f");
const fn = format(",");

/** Light or dark, following the page's theme attribute and the OS preference (same as B4's clips). */
function useDark() {
  const read = () => {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
  };
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setDark(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setDark(read());
    mq.addEventListener("change", on);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", on);
    };
  }, []);
  return dark;
}

function ClipRefine() {
  const base = import.meta.env.BASE_URL + "clips/C2/refine" + (useDark() ? "_dark" : "_light");
  return (
    <div className="clip-inside">
      <Clip
        src={{ mp4: base + ".mp4", webm: base + ".webm" }}
        poster={base + ".png"}
        ariaLabel="The prices in one year sharpen from two bars into a bell as the steps grow; the option price bounces above and below a dashed line and settles on it"
        beats={[
          { at: 0, caption: "One step: two prices in a year, and the ticket comes out at 12.16 — too much." },
          { at: 2.9, caption: "Two, three, five, ten steps: more prices in the year, and the number bounces — below, above, below, above." },
          { at: 7.7, caption: "Twenty, fifty, a hundred, five hundred: the bars are a curve now, and the bounce has shrunk to the third decimal." },
          { at: 13.5, caption: "The number it is closing in on has a closed form. That is Black–Scholes: 10.4506." },
        ]}
      />
    </div>
  );
}

/** The board on its side: time → right, price ↑ (log), the lattice for small n, and the buckets on the right as the end-of-year distribution. */
function SideBoard({ n }: { n: number }) {
  const W = 520,
    H = 330;
  const left = 46,
    right = 20,
    top = 14,
    bottom = 30;
  const bucketsW = 130; // the right-hand strip for the distribution
  const latticeW = W - left - right - bucketsW;
  const { u, d, p } = crrParameters(P.sigma, P.r, P.T / n);
  const y = useMemo(() => scaleLog().domain([45, 220]).range([H - bottom, top]), []);
  const tx = (i: number) => left + (i / n) * latticeW;

  const probs = useMemo(() => terminalProbabilities(p, n), [p, n]);
  // terminal node prices S u^{n-j} d^{j} (j down-moves) and their probability density per unit price
  const bars = useMemo(() => {
    const out: Array<{ S: number; prob: number; dens: number }> = [];
    for (let j = 0; j <= n; j++) {
      const S = P.S * Math.pow(u, n - j) * Math.pow(d, j);
      if (S < 45 || S > 220) continue;
      out.push({ S, prob: probs[j], dens: probs[j] / (S * (u - 1 / u)) });
    }
    return out;
  }, [n, u, d, probs]);
  const maxDens = 1 / (P.S * P.sigma * Math.sqrt(2 * Math.PI)) / Math.exp(-0.5); // a little above the lognormal peak, so all n share a scale
  const bx = (dens: number) => left + latticeW + 8 + Math.min(1, dens / maxDens) * (bucketsW - 16);

  // the lognormal the bars are becoming (risk-neutral: mean log = ln S + (r − σ²/2)T)
  const m = Math.log(P.S) + (P.r - 0.5 * P.sigma * P.sigma) * P.T;
  const v = P.sigma * Math.sqrt(P.T);
  const curve = useMemo(() => {
    const pts: Array<[number, number]> = [];
    for (let s = 46; s <= 219; s += 2) {
      const z = (Math.log(s) - m) / v;
      const dens = Math.exp(-0.5 * z * z) / (Math.sqrt(2 * Math.PI) * s * v);
      pts.push([bx(dens), y(s)]);
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toD = (pts: Array<[number, number]>) => pts.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" ");

  const drawLattice = n <= 50;
  const edges: string[] = [];
  if (drawLattice) {
    for (let i = 0; i < n; i++)
      for (let j = 0; j <= i; j++) {
        const S = P.S * Math.pow(u, i - j) * Math.pow(d, j);
        const Su = S * u,
          Sd = S * d;
        if (S < 45 || S > 220) continue;
        edges.push(`M${tx(i).toFixed(1)} ${y(S).toFixed(1)}L${tx(i + 1).toFixed(1)} ${y(Math.min(220, Su)).toFixed(1)}`);
        edges.push(`M${tx(i).toFixed(1)} ${y(S).toFixed(1)}L${tx(i + 1).toFixed(1)} ${y(Math.max(45, Sd)).toFixed(1)}`);
      }
  }
  // too many nodes to draw: a dozen of the board's own paths instead (seeded, under the magician's weight)
  const paths = useMemo(() => {
    if (drawLattice) return [];
    const r = rng(7);
    return Array.from({ length: 12 }, () => {
      const pts: Array<[number, number]> = [[tx(0), y(P.S)]];
      let S = P.S;
      for (let i = 1; i <= n; i++) {
        S *= r() < p ? u : d;
        pts.push([tx(i), y(Math.max(45, Math.min(220, S)))]);
      }
      return pts;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, p, u, d, drawLattice]);
  const barH = Math.max(1.2, Math.min(10, n <= 2 ? 10 : (y(100) - y(100 * u * u)) * 0.85));
  const yTicks = [50, 70, 100, 140, 200];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label={`The board on its side with ${n} steps; the buckets on the right show where the price ends up after a year`}>
      {/* axes */}
      <g className="axis">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={left} x2={left + latticeW + bucketsW} y1={y(t)} y2={y(t)} stroke="var(--grid)" />
            <text x={left - 8} y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <line x1={left} x2={left} y1={top} y2={H - bottom} />
        <line x1={left} x2={left + latticeW} y1={H - bottom} y2={H - bottom} />
        <text x={left} y={H - 10} textAnchor="start">
          today
        </text>
        <text x={left + latticeW} y={H - 10} textAnchor="end">
          one year
        </text>
        <text className="axis-label" x={left + 6} y={top + 10} textAnchor="start">
          price
        </text>
        <text x={left + latticeW + bucketsW / 2 + 4} y={H - 10} textAnchor="middle">
          where it ends up
        </text>
      </g>
      {/* lattice or envelope */}
      {drawLattice ? (
        <path d={edges.join("")} fill="none" stroke="var(--ink-2)" strokeWidth={n <= 5 ? 1.6 : 0.8} opacity={n <= 5 ? 0.7 : 0.45} />
      ) : (
        <g>
          {paths.map((pts, i) => (
            <path key={i} d={toD(pts)} fill="none" stroke="var(--ink-2)" strokeWidth={0.8} opacity={0.45} />
          ))}
          <text x={left + latticeW / 2 + 20} y={top + 28} textAnchor="middle" className="label" style={{ fontSize: 11, paintOrder: "stroke", stroke: "var(--surface-figure)", strokeWidth: 4 }}>
            {fn(n)} steps, {fn((n * (n + 1)) / 2 + n + 1)} nodes — twelve of its paths
          </text>
        </g>
      )}
      {drawLattice &&
        Array.from({ length: n + 1 }, (_, i) =>
          Array.from({ length: i + 1 }, (_, j) => {
            const S = P.S * Math.pow(u, i - j) * Math.pow(d, j);
            if (S < 45 || S > 220) return null;
            return <circle key={i + "-" + j} cx={tx(i)} cy={y(S)} r={n <= 5 ? 3.5 : n <= 20 ? 2 : 1.2} fill="var(--axis)" />;
          }),
        )}
      {/* the strike, across the buckets */}
      <line x1={left + latticeW + 4} x2={left + latticeW + bucketsW} y1={y(P.K)} y2={y(P.K)} stroke="var(--error)" strokeWidth={1.3} strokeDasharray="4 3" />
      <text x={left + latticeW + bucketsW} y={y(P.K) - 5} textAnchor="end" className="label error" style={{ fontSize: 10.5 }}>
        strike 100
      </text>
      {/* buckets: horizontal bars at the terminal prices, length = density */}
      <g>
        {bars.map((b, k) => (
          <rect key={k} x={left + latticeW + 8} y={y(b.S) - barH / 2} width={Math.max(0.8, bx(b.dens) - (left + latticeW + 8))} height={barH} fill={b.S > P.K ? "var(--approx)" : "var(--ghost)"} opacity={0.8} />
        ))}
        {n >= 100 && <path d={toD(curve)} fill="none" stroke="var(--truth)" strokeWidth={1.6} opacity={0.9} strokeDasharray="5 3" />}
        {n >= 100 && (
          <text x={left + latticeW + bucketsW} y={y(150)} textAnchor="end" className="label truth" style={{ fontSize: 10.5 }}>
            the smooth limit
          </text>
        )}
      </g>
    </svg>
  );
}

export function F4Refine() {
  const [idx, setIdx] = useState(0);
  const n = STEPS[idx];
  const bs = useMemo(() => bsPrice(P.S, P.K, P.r, P.sigma, P.T, "call"), []);
  const saw = useMemo(() => convergence(P, SAWTOOTH_NS), []);
  const price = useMemo(() => crrPrice({ ...P, n }), [n]);
  const gap = price - bs;
  const odd: Pt[] = saw.points.filter((q) => q.parity === "odd").map((q) => [Math.log10(q.n), q.price]);
  const even: Pt[] = saw.points.filter((q) => q.parity === "even").map((q) => [Math.log10(q.n), q.price]);
  const avg = useMemo(() => oddEvenAverage(P, n), [n]);
  const nextPrice = useMemo(() => crrPrice({ ...P, n: n + 1 }), [n]);
  const yLo = 9.4,
    yHi = 12.4;

  return (
    <WatchOrDo
      watchLabel="watch it (17 s)"
      doLabel="scrub it yourself"
      watch={
        <Figure n="4" prompt="The tree becomes the curve, watched. The same board, the same numbers — then scrub it yourself.">
          <ClipRefine />
        </Figure>
      }
    >
      <Figure
        n="4"
        prompt={
          <>
            The trick, scaled up. A 100-stock, the right to buy at <strong>100</strong>, one year, 5 % interest, a 20 % wobble — the standard textbook case. Drag the steps from 1 to 1,000 and watch the board and the price.
          </>
        }
        controls={
          <>
            <Slider label="steps in the year" value={idx} min={0} max={STEPS.length - 1} step={1} onChange={(v) => setIdx(Math.round(v))} fmt={(v) => fn(STEPS[Math.round(v)])} role="approx" width={200} />
            <Readouts
              items={[
                ["price on this board", <span className="c2-approx num">{f4(price)}</span>],
                ["Black–Scholes", <span className="c2-truth num">{f4(bs)}</span>],
                ["gap", <span className="num">{fsign4(gap)}</span>],
              ]}
            />
          </>
        }
        observe={
          <>
            The limit of the trick is a formula. On a thousand-step board the average under the magician's weight is 10.4486; the smooth curve it is becoming gives <strong>10.4506</strong> — Black–Scholes, which C3 derives. The bumps on the way are geometric: at 10, 11, 12 steps the strike sits on a bucket, between two, then on one again.
          </>
        }
      >
        <div className="c2-stage c2-stage-wide">
          <div className="c2-board">
            <SideBoard n={n} />
          </div>
          <div className="c2-saw">
            <Plot xDomain={[-0.05, 3.05]} yDomain={[yLo, yHi]} width={380} height={300} margin={{ top: 14, right: 14, bottom: 34, left: 44 }} xTicks={0} yTicks={6} axisX={-0.05} axisY={yLo} ariaLabel="The board's price against the number of steps: odd step counts above the Black–Scholes line, even below, the sawtooth shrinking like one over n">
              {[1, 10, 100, 1000].map((t) => (
                <Label key={t} at={[Math.log10(t), yLo]} text={t === 1 ? "1 step" : t === 1000 ? "1,000 steps" : fn(t)} anchor={t === 1 ? "start" : t === 1000 ? "end" : "middle"} dx={t === 1 ? -4 : t === 1000 ? 4 : 0} dy={-6} />
              ))}
              <Curve pts={[[-0.05, bs], [3.05, bs]]} role="truth" width={1.2} dash="5 3" smooth={false} />
              <Label at={[3.05, bs]} text={`Black–Scholes ${f4(bs)}`} role="truth" anchor="end" dx={-2} dy={-6} />
              <Points pts={odd} role="approx" r={2.6} opacity={0.85} />
              <Points pts={even} role="ghost" r={2.6} opacity={0.85} />
              <Marker at={[Math.log10(n), price]} role="error" r={6} />
              <Label at={[Math.log10(n), price]} text={`${fn(n)}: ${f4(price)}`} role="error" anchor={n >= 100 ? "end" : "start"} dx={n >= 100 ? -9 : 9} dy={price > bs ? -8 : 16} />
              <Label at={[0.2, 12.25]} text="amber: odd steps · grey: even steps" anchor="start" dx={0} dy={0} />
            </Plot>
          </div>
        </div>
        <details className="c2-more">
          <summary>The sawtooth, and the trick that halves it</summary>
          <p>
            An even number of steps puts a bucket exactly on the strike; an odd number straddles it. So the price lands a hair low, then a hair high, and the bounce shrinks like 1/n: at 10 steps the board says 10.2534 and at 11 it says 10.6112 — the strike went from "on a bucket" to "between two". Averaging a board and its neighbour cancels most of the bounce: at {fn(n)} and {fn(n + 1)} steps the two prices are {f4(price)} and {f4(nextPrice)}, average <span className="num c2-truth">{f4(avg)}</span>, against {f4(bs)}. (At 100 and 101 steps the average is 10.4493; a thousand-step board alone only gets to 10.4486.) Put the strike off the nodes — K = 110, a 30 % wobble — and the bounce is wilder: 9.96, 10.42, 9.81 at 5, 6, 7 steps around a Black–Scholes 10.02.
          </p>
          <p>
            The weight on each bucket is 0.2's path count, C(n, k) p<sup>k</sup>(1 − p)<sup>n − k</sup>, with p the magician's weight for this step size (0.5075 at 100 steps); u = e<sup>σ√δt</sup> is what makes a step of the board match a 20 %-a-year wobble; the price is the discounted sum of payoff × weight over the buckets. With u, d and p chosen that way the bell on the right tends to a lognormal, and the sum to the formula. Put price from the same board, by C1's parity: {f2(bsPrice(P.S, P.K, P.r, P.sigma, P.T, "put"))}.
          </p>
        </details>
      </Figure>
    </WatchOrDo>
  );
}
