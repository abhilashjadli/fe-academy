import { useEffect, useMemo, useState } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Clip } from "../../../ui/Clip";
import { WatchOrDo } from "../../../ui/WatchOrDo";
import { Segmented, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { backwardGrid, bsTarget, insideBracket, monteCarloOption, optionPayoffInX, type Grid } from "../../../engine/feynmankac";
import { brownianPath, gbmTerminal } from "../../../engine/ito";
import { normalSample, rng } from "../../../engine/random";
import "./figures.css";

/**
 * Figure 1 — two pictures, one clock. Hull's option (stock 42, the right to buy at 40, six months, 10 % interest, 20 % wobble).
 * Left: walkers set off from today under the fair weights; at expiry their discounted payoffs pile into a rail and level into one bar.
 * Right: a trinomial grid in ln S, filled from the last column backwards by "discounted average of my three children"; the "watch" tab
 * is the 15-second heat-rod clip. One scrubber (the clock) drives both; one box, both write to it, with Black–Scholes as the referee.
 */

const P = { S: 42, K: 40, r: 0.1, sigma: 0.2, T: 0.5 };
const MONTHS = 6;
const N_GRID = 100;
const DX_FACTOR = 1.5; // δx = σ√(1.5 δt): three real doors (≈ 0.34 / 0.33 / 0.32), not a binomial in disguise
/** The engine's lattice is a cone around today's price, so the grid is run from an extra six months back: layers K0 … K0 + N_GRID are the six months on screen, wide enough to fill the window. A cell's value depends only on the columns to its right, so nothing changes. */
const K0 = N_GRID;
const SEED = 26;
const PATH_STEPS = 26;
const MAX_DRAWN = 200;
const PRICE: [number, number] = [25, 65];
const RAIL: [number, number] = [0, 16];
const f2 = format(".2f");
const f4 = format(".4f");
const f1 = format(".1f");
const fn = format(",");

type Walkers = 1 | 100 | 10000;

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

function ClipHeatRod() {
  const base = import.meta.env.BASE_URL + "clips/B6/heatrod" + (useDark() ? "_dark" : "_light");
  return (
    <div className="clip-inside">
      <Clip
        src={{ mp4: base + ".mp4", webm: base + ".webm" }}
        poster={base + ".png"}
        ariaLabel="The option's payoff drawn as the temperature along a rod of prices; run backwards, the kink at the strike melts into a smooth curve"
        beats={[
          { at: 0, caption: "The payoff as a rod's temperature: cold below the strike, hotter above, a kink at it. (This rod is C2's 100-stock for a year; the grid beside it is Hull's 42.)" },
          { at: 3.0, caption: "One day back. Each point moves toward the average of its neighbours — only where the rod bends. The straight parts don't move." },
          { at: 8.0, caption: "The arrows are longer on the right: the same 20 % wobble is more rupees at a higher price. In price, the push scales with S²." },
          { at: 12.0, caption: "A year of steps back: the kink has melted into today's smooth curve. A probe reads the option's price. Cooling backwards is averaging forwards." },
        ]}
      />
    </div>
  );
}

/** Read a CSS colour token as [r, g, b] (the grid field is painted on a canvas, so tokens have to be resolved by hand). */
function token(name: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(v);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * The grid field as a small image (one pixel column per grid column, rows uniform in price so the picture lines up with the
 * linear price axis), stretched over the plot. Columns right of the frontier are filled.
 */
const FIELD_ROWS = 160;
function useFieldImage(g: Grid, kFront: number, dark: boolean): { href: string; payoffHref: string } {
  return useMemo(() => {
    const n = N_GRID;
    const rows = FIELD_ROWS;
    const canvas = document.createElement("canvas");
    canvas.width = n + 1;
    canvas.height = rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { href: "", payoffHref: "" };
    const img = ctx.createImageData(n + 1, rows);
    const base = token("--surface-raised", dark ? [28, 34, 43] : [255, 255, 255]);
    const empty = token("--rule-soft", dark ? [34, 41, 50] : [231, 234, 239]);
    const hot = token("--truth", dark ? [95, 128, 245] : [47, 91, 234]);
    const vMax = PRICE[1] - P.K; // the payoff at the top of the window
    const x0 = Math.log(P.S);
    for (let k = 0; k <= n; k++) {
      const layer = g.layers[K0 + k];
      for (let row = 0; row < rows; row++) {
        const S = PRICE[1] - ((row + 0.5) / rows) * (PRICE[1] - PRICE[0]); // row 0 is the top (highest price)
        const off = Math.round((Math.log(S) - x0) / g.dx);
        const j = K0 + k + off; // node index at layer K0 + k for x0 + off·dx
        const i = (row * (n + 1) + k) * 4;
        let c: [number, number, number];
        if (k < kFront) c = empty;
        else if (j < 0 || j >= layer.length) c = base;
        else {
          const t = Math.sqrt(Math.max(0, Math.min(1, layer[j] / vMax)));
          c = [base[0] + (hot[0] - base[0]) * t, base[1] + (hot[1] - base[1]) * t, base[2] + (hot[2] - base[2]) * t];
        }
        img.data[i] = c[0];
        img.data[i + 1] = c[1];
        img.data[i + 2] = c[2];
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const href = canvas.toDataURL();
    // the last column alone — the payoff, the grid's boundary condition — drawn as a visible strip at the right edge from the first frame
    const strip = document.createElement("canvas");
    strip.width = 1;
    strip.height = rows;
    const sctx = strip.getContext("2d");
    if (!sctx) return { href, payoffHref: "" };
    const simg = sctx.createImageData(1, rows);
    for (let row = 0; row < rows; row++) {
      const i = row * 4;
      const src = (row * (n + 1) + n) * 4;
      simg.data[i] = img.data[src];
      simg.data[i + 1] = img.data[src + 1];
      simg.data[i + 2] = img.data[src + 2];
      simg.data[i + 3] = 255;
    }
    sctx.putImageData(simg, 0, 0);
    return { href, payoffHref: strip.toDataURL() };
  }, [g, kFront, dark]);
}

/** The payoff column as a strip just right of the grid: visible at clock 0, before any column is filled. */
function PayoffStrip({ href }: { href: string }) {
  const { x, y } = usePlot();
  const yTop = y(PRICE[1]);
  const yBot = y(PRICE[0]);
  const w = 10;
  const x0 = x(MONTHS) - w; // the plot clips to its inner box, so the strip sits just inside the right edge, over the last two columns
  return (
    <g>
      <image href={href} x={x0} y={yTop} width={w} height={yBot - yTop} preserveAspectRatio="none" style={{ imageRendering: "pixelated" }} />
      <rect x={x0} y={yTop} width={w} height={yBot - yTop} fill="none" stroke="var(--ink-3)" strokeWidth={0.8} />
    </g>
  );
}

function FieldImage({ href }: { href: string }) {
  const { x, y, inner } = usePlot();
  const yTop = y(PRICE[1]);
  const yBot = y(PRICE[0]);
  return <image href={href} x={x(0) - inner.width / (2 * N_GRID)} y={yTop} width={inner.width * (1 + 1 / N_GRID)} height={yBot - yTop} preserveAspectRatio="none" style={{ imageRendering: "pixelated" }} />;
}

/** The three children of the frontier cell at S = 42, with their weights. */
function Stencil({ g, kFront, c }: { g: Grid; kFront: number; c: number }) {
  const { x, y } = usePlot();
  if (kFront >= N_GRID) return null;
  const tx = (k: number) => x((k / N_GRID) * MONTHS);
  const parent: Pt = [tx(kFront), y(P.S)];
  const kids = [
    { S: P.S * Math.exp(g.dx), w: g.phi.up, tag: "up" },
    { S: P.S, w: g.phi.mid, tag: "flat" },
    { S: P.S * Math.exp(-g.dx), w: g.phi.down, tag: "down" },
  ];
  const showLabels = c < 0.97;
  const cw = tx(1) - tx(0); // one column
  const ch = y(P.S) - y(P.S * Math.exp(g.dx)); // one lattice step, in pixels
  const cell = (k: number, S: number, strong: boolean) => <rect x={tx(k) - cw / 2} y={y(S) - ch / 2} width={cw} height={ch} fill={strong ? "var(--surface-figure)" : "none"} stroke="var(--ink)" strokeWidth={strong ? 1.6 : 1} />;
  return (
    <g>
      {kids.map((kid) => (
        <line key={kid.tag} x1={parent[0]} y1={parent[1]} x2={tx(kFront + 1)} y2={y(kid.S)} stroke="var(--ink)" strokeWidth={1} opacity={0.8} />
      ))}
      {kids.map((kid) => (
        <g key={"c" + kid.tag}>{cell(kFront + 1, kid.S, false)}</g>
      ))}
      {cell(kFront, P.S, true)}
      {showLabels && (
        <>
          <line x1={tx(kFront + 1) + cw} y1={y(P.S)} x2={tx(kFront + 1) + 14} y2={y(P.S)} stroke="var(--ink-3)" strokeWidth={0.8} />
          {kids.map((kid, i) => (
            <text key={kid.tag} className="label" x={tx(kFront + 1) + 16} y={y(P.S) + (i - 1) * 14 + 4} style={{ fontSize: 10.5 }}>
              {kid.tag} × {f2(kid.w)}
            </text>
          ))}
          <text className="label" x={tx(kFront) - 6} y={y(P.S) - 10} textAnchor="end" style={{ fontSize: 10.5 }}>
            {kFront === N_GRID - 1 ? "" : "me = discounted avg of three"}
          </text>
        </>
      )}
    </g>
  );
}

export function F1Clock() {
  const [clock, setClock] = useState(0); // 0 … 1 of six months
  const [N, setN] = useState<Walkers>(1);
  const dark = useDark();
  const tNow = clock * P.T;

  // the grid: a trinomial in ln S, three real doors, filled from the last column backwards
  const g = useMemo(() => {
    const dt = P.T / N_GRID;
    return backwardGrid({ drift: P.r - 0.5 * P.sigma * P.sigma, vol: P.sigma, rate: P.r, x0: Math.log(P.S), T: 2 * P.T, steps: K0 + N_GRID, dx: P.sigma * Math.sqrt(DX_FACTOR * dt), payoff: optionPayoffInX("call", P.K) });
  }, []);
  const kFront = Math.round((1 - clock) * N_GRID); // columns k ≥ kFront are filled; the frontier cell at 42 has clock·T left
  const gridNow = g.layers[K0 + kFront][K0 + kFront]; // the centre node of a layer is x0 = ln 42
  const field = useFieldImage(g, kFront, dark);
  const bs = useMemo(() => bsTarget(P.S, P.K, P.r, P.sigma, P.T), []);

  // the walkers: the same draws as the engine's Monte Carlo (one normal per future), so the box and the dots agree
  const mc = useMemo(() => monteCarloOption(P.S, P.K, P.r, P.sigma, P.T, N, rng(SEED)), [N]);
  const walkers = useMemo(() => {
    const next = rng(SEED);
    const drawn = Math.min(N, MAX_DRAWN);
    const z: number[] = [];
    for (let i = 0; i < N; i++) z.push(normalSample(next));
    const disc = Math.exp(-P.r * P.T);
    const payoffs = z.map((zi) => disc * Math.max(gbmTerminal(P.S, P.r, P.sigma, P.T, zi * Math.sqrt(P.T)) - P.K, 0));
    const bridge = rng(SEED + 1000);
    const paths: Array<{ t: number[]; S: number[] }> = [];
    for (let i = 0; i < drawn; i++) {
      const { t, W } = brownianPath(PATH_STEPS, P.T, bridge);
      const WT = z[i] * Math.sqrt(P.T);
      const Wb = W.map((w, k) => w - (t[k] / P.T) * W[PATH_STEPS] + (t[k] / P.T) * WT); // a bridge ending exactly at the drawn future
      paths.push({ t, S: Wb.map((w, k) => gbmTerminal(P.S, P.r, P.sigma, t[k], w)) });
    }
    return { paths, payoffs };
  }, [N]);
  const drawn = walkers.paths.length;
  const arrived = clock >= 1;
  // the rail draws mc.lo … mc.hi, which is ±1 SE; the tick tests the same band, so what is drawn and what is ticked never disagree
  const agree = arrived && N > 1 && insideBracket(mc, gridNow, 1);

  // paths up to the clock
  const visible = useMemo(() => {
    return walkers.paths.map(({ t, S }) => {
      const pts: Pt[] = [];
      for (let k = 0; k < t.length; k++) {
        if (t[k] <= tNow + 1e-12) pts.push([(t[k] / P.T) * MONTHS, S[k]]);
        else {
          const a = (tNow - t[k - 1]) / (t[k] - t[k - 1]);
          pts.push([(tNow / P.T) * MONTHS, S[k - 1] + a * (S[k] - S[k - 1])]);
          break;
        }
      }
      return pts;
    });
  }, [walkers, tNow]);

  // the pile on the rail: stacked dots for ≤ 100, a histogram for 10,000
  const pile = useMemo(() => {
    const bin = N > 100 ? 0.25 : 0.5;
    const counts = new Map<number, number>();
    const dots: Array<{ v: number; h: number }> = [];
    for (const v of walkers.payoffs) {
      const b = Math.floor(v / bin);
      const h = counts.get(b) ?? 0;
      counts.set(b, h + 1);
      if (N <= 100) dots.push({ v, h });
    }
    const bars = [...counts.entries()].map(([b, h]) => ({ x: (b + 0.5) * bin, w: bin, h }));
    const maxH = Math.max(1, ...bars.map((b) => b.h));
    return { dots, bars, maxH, bin };
  }, [walkers, N]);

  const months = clock * MONTHS;
  const RW = 440,
    RH = 64,
    rl = 46,
    rr = 18;
  const rx = (v: number) => rl + ((v - RAIL[0]) / (RAIL[1] - RAIL[0])) * (RW - rl - rr);

  return (
    <Figure
      n="1"
      prompt={
        <>
          Hull's textbook option: a stock at <strong>42</strong>, the right to buy it at <strong>40</strong> in six months, 10 % interest, 20 % wobble. Two programs price it. Run the clock.
        </>
      }
      controls={
        <>
          <Slider label="the clock" value={clock} min={0} max={1} step={0.01} onChange={setClock} fmt={(v) => `${f1(v * MONTHS)} of 6 months`} width={200} />
          <Segmented
            label="walkers"
            value={String(N) as "1" | "100" | "10000"}
            onChange={(v) => setN(parseInt(v, 10) as Walkers)}
            options={[
              { id: "1", label: "1" },
              { id: "100", label: "100" },
              { id: "10000", label: "10,000" },
            ]}
          />
        </>
      }
      observe={
        arrived ? (
          N === 1 ? (
            <>One future is one number — {f2(mc.mean)} this time — and it tells you nothing. Add walkers: the pile levels into a bar, and the bracket shrinks like 1/√N.</>
          ) : (
            <>
              Both panels wrote to the box. The grid's {f2(gridNow)} sits {agree ? "inside" : "just outside"} the walkers' one-standard-error bracket{agree ? "" : " — a ±1 SE bracket misses about a third of the time; more walkers tighten it"}; the formula agrees to the second decimal. Cooling backwards and averaging forwards are the same number, and the grid never simulated anything.
            </>
          )
        ) : (
          <>Left, futures walk forward from 42. Right, every cell is the discounted average of its three children — the three doors — and the fill runs backwards from the payoff. Run the clock to six months.</>
        )
      }
    >
      <div className="b6-split">
        <div className="b6-pane">
          <div className="b6-pane-head">
            <strong>average forwards</strong>
            <span>
              {fn(N)} {N === 1 ? "walker" : "walkers"}
              {N > drawn ? ` (${drawn} drawn)` : ""}
            </span>
          </div>
          <Plot xDomain={[0, MONTHS]} yDomain={PRICE} width={RW} height={300} xLabel="months" yLabel="price" axisY={PRICE[0]} xTicks={6} ariaLabel="Walkers' price paths from 42, drawn up to the clock; at six months their endpoints are coloured by whether they pay">
            <Curve pts={[[0, P.K], [MONTHS, P.K]]} role="error" width={1.2} dash="4 3" smooth={false} />
            <Label at={[MONTHS, P.K]} text="strike 40" role="error" anchor="end" dx={-4} dy={-5} />
            {visible.map((pts, i) => (
              <Curve key={i} pts={pts} role="approx" width={N === 1 ? 2.2 : 0.9} opacity={N === 1 ? 1 : N === 100 ? 0.45 : 0.3} smooth={false} />
            ))}
            {arrived &&
              visible.map((pts, i) => {
                const end = pts[pts.length - 1];
                return <Marker key={"m" + i} at={end} role={end[1] > P.K ? "approx" : "ghost"} r={N === 1 ? 5 : 2.2} />;
              })}
            <Marker at={[0, P.S]} role="ink" r={4} />
            <Label at={[0, P.S]} text="42 today" dx={6} dy={-12} />
            {!arrived && (
              <g opacity={N === 1 ? 1 : 0.6}>
                {visible.map((pts, i) => (
                  <Marker key={"h" + i} at={pts[pts.length - 1]} role="approx" r={N === 1 ? 4.5 : N === 100 ? 2 : 1.4} />
                ))}
              </g>
            )}
            {!arrived && <Curve pts={[[months, PRICE[0]], [months, PRICE[1]]]} role="ink" width={1} dash="3 3" smooth={false} />}
          </Plot>
          <svg className="b6-pile" viewBox={`0 0 ${RW} ${RH}`} role="img" aria-label="The walkers' discounted payoffs piled on a rail, with their average and its bracket">
            <line x1={rl} x2={RW - rr} y1={RH - 18} y2={RH - 18} stroke="var(--axis)" />
            {[0, 4, 8, 12, 16].map((v) => (
              <text key={v} x={rx(v)} y={RH - 5} textAnchor="middle" fontSize="10" fill="var(--ink-3)" fontFamily="var(--font-ui)">
                {v}
              </text>
            ))}
            <text x={rl - 6} y={RH - 14} textAnchor="end" fontSize="10" fill="var(--ink-2)" fontFamily="var(--font-ui)">
              pays
            </text>
            {arrived ? (
              <>
                {N <= 100
                  ? pile.dots.map((d, i) => <circle key={i} cx={rx(d.v)} cy={RH - 22 - Math.min(d.h, 9) * 4} r={2.4} fill="var(--approx)" opacity={0.8} />)
                  : pile.bars.map((b, i) => {
                      const h = Math.sqrt(b.h / pile.maxH) * 38; // square-root heights: the "pays nothing" bar would otherwise flatten the rest
                      return <rect key={i} x={rx(b.x - b.w / 2) + 0.5} y={RH - 19 - h} width={Math.max(1, rx(b.x + b.w / 2) - rx(b.x - b.w / 2) - 1)} height={h} fill="var(--approx)" opacity={0.75} />;
                    })}
                {N > 1 && <line x1={rx(mc.lo)} x2={rx(mc.hi)} y1={6} y2={6} stroke="var(--approx)" strokeWidth={5} opacity={0.5} />}
                <line x1={rx(mc.mean)} x2={rx(mc.mean)} y1={2} y2={RH - 18} stroke="var(--approx)" strokeWidth={2} />
                <line x1={rx(gridNow)} x2={rx(gridNow)} y1={2} y2={RH - 18} stroke="var(--truth)" strokeWidth={2} strokeDasharray="3 2" />
                <text x={rx(Math.min(mc.mean, gridNow)) - 5} y={14} textAnchor="end" fontSize="10.5" fill="var(--approx-text)" fontFamily="var(--font-ui)" fontWeight={600}>
                  average {f2(mc.mean)}
                </text>
                <text x={rx(Math.max(mc.mean, gridNow)) + 5} y={14} textAnchor="start" fontSize="10.5" fill="var(--truth-text)" fontFamily="var(--font-ui)" fontWeight={600}>
                  grid {f2(gridNow)}
                </text>
              </>
            ) : (
              <text x={rx(8)} y={RH - 30} textAnchor="middle" fontSize="11" fill="var(--ink-3)" fontFamily="var(--font-ui)">
                the payoffs land here at six months
              </text>
            )}
          </svg>
        </div>
        <div className="b6-pane">
          <div className="b6-pane-head">
            <strong>cool backwards</strong>
            <span>
              {N_GRID} columns · three doors a cell
            </span>
          </div>
          <WatchOrDo watch={<ClipHeatRod />} watchLabel="watch it (15 s)" doLabel="fill it yourself">
            <Plot xDomain={[0, MONTHS]} yDomain={PRICE} width={RW} height={300} xLabel="months" yLabel="price" axisY={PRICE[0]} xTicks={6} grid={false} ariaLabel="A grid of price against time; columns fill from the right with the option's value, darker where it is worth more; the frontier cell at 42 shows its three children">
              <FieldImage href={field.href} />
              <PayoffStrip href={field.payoffHref} />
              <Curve pts={[[0, P.K], [MONTHS, P.K]]} role="error" width={1.2} dash="4 3" smooth={false} />
              <Label at={[MONTHS, P.K]} text="strike 40" role="error" anchor="end" dx={-4} dy={-5} />
              <Label at={[MONTHS, PRICE[1]]} text="payoff" anchor="end" dx={-14} dy={14} />
              <Stencil g={g} kFront={kFront} c={clock} />
              {arrived && (
                <>
                  <Marker at={[0, P.S]} role="truth" r={5} />
                  <Label at={[0, P.S]} text={`${f2(gridNow)} at 42`} role="truth" dx={8} dy={-8} />
                </>
              )}
            </Plot>
          </WatchOrDo>
          <div className="b6-pane-head">
            <span>
              {kFront >= N_GRID ? "the last column is the payoff" : kFront === 0 ? "filled back to today" : `filled back to ${f1((kFront / N_GRID) * MONTHS)} months`}
            </span>
          </div>
        </div>
      </div>
      <div className="b6-box" role="status">
        <div className={"b6-cell approx " + (arrived ? "" : "waiting") + (agree ? " agree" : "")}>
          <span className="k">walkers · {fn(N)} {N === 1 ? "future" : "futures"}</span>
          <span className="v">
            {arrived ? (
              <>
                {f2(mc.mean)}
                {N > 1 && <small> ± {f2(mc.se)}</small>}
              </>
            ) : (
              <small>walking… {f1(months)} months</small>
            )}
          </span>
        </div>
        <div className={"b6-cell truth " + (agree ? "agree" : "")}>
          <span className="k">grid · at 42, {arrived ? "today" : `${f1(months)} months before expiry`}</span>
          <span className="v">
            {f2(gridNow)} {arrived && N > 1 && <span className={"b6-tick " + (agree ? "" : "no")}>{agree ? "✓ inside the bracket" : "outside the bracket"}</span>}
          </span>
        </div>
        <div className="b6-cell">
          <span className="k">the formula (chapter C3) · today</span>
          <span className="v">{arrived ? f4(bs) : <small>at six months</small>}</span>
        </div>
      </div>
    </Figure>
  );
}
