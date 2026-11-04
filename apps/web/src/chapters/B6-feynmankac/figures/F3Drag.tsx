import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { backwardGrid, insideBracket, monteCarloOption, optionPayoffInX, type Grid, type MCResult } from "../../../engine/feynmankac";
import { brownianPath, gbmTerminal } from "../../../engine/ito";
import { rng } from "../../../engine/random";
import "./figures.css";

/**
 * Figure 3 — one knob: the drag. Drag the start point (today's price, today's date) anywhere on the grid. The grid's cell lights
 * instantly — it already knew the answer for every start point. The walkers' bracket re-opens, re-runs from that point, and closes.
 */

const P = { S: 42, K: 40, r: 0.1, sigma: 0.2, T: 0.5 };
const MONTHS = 6;
const N_GRID = 100;
const DX_FACTOR = 1.5;
const K0 = N_GRID; // the grid is run from an extra six months back so every column on screen is wide (as in Figure 1)
const PRICE: [number, number] = [25, 65];
const SEED = 26;
const RUNS = [10, 100, 1000, 10000]; // the walkers' bracket closes in four beats; each run is a prefix of the same draws
const FAN = 24;
const f2 = format(".2f");
const f1 = format(".1f");
const fn = format(",");

/** Light or dark, following the page's theme attribute and the OS preference. */
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

function token(name: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(v);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The whole grid, filled, as a small image stretched over the plot (rows uniform in price). */
const FIELD_ROWS = 160;
function useFieldImage(g: Grid, dark: boolean): string {
  return useMemo(() => {
    const n = N_GRID;
    const canvas = document.createElement("canvas");
    canvas.width = n + 1;
    canvas.height = FIELD_ROWS;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const img = ctx.createImageData(n + 1, FIELD_ROWS);
    const base = token("--surface-raised", dark ? [28, 34, 43] : [255, 255, 255]);
    const hot = token("--truth", dark ? [95, 128, 245] : [47, 91, 234]);
    const vMax = PRICE[1] - P.K;
    const x0 = Math.log(P.S);
    for (let k = 0; k <= n; k++) {
      const layer = g.layers[K0 + k];
      for (let row = 0; row < FIELD_ROWS; row++) {
        const S = PRICE[1] - ((row + 0.5) / FIELD_ROWS) * (PRICE[1] - PRICE[0]);
        const j = K0 + k + Math.round((Math.log(S) - x0) / g.dx);
        const i = (row * (n + 1) + k) * 4;
        const t = j < 0 || j >= layer.length ? 0 : Math.sqrt(Math.max(0, Math.min(1, layer[j] / vMax)));
        img.data[i] = base[0] + (hot[0] - base[0]) * t;
        img.data[i + 1] = base[1] + (hot[1] - base[1]) * t;
        img.data[i + 2] = base[2] + (hot[2] - base[2]) * t;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  }, [g, dark]);
}

function FieldImage({ href }: { href: string }) {
  const { x, y, inner } = usePlot();
  return <image href={href} x={x(0) - inner.width / (2 * N_GRID)} y={y(PRICE[1])} width={inner.width * (1 + 1 / N_GRID)} height={y(PRICE[0]) - y(PRICE[1])} preserveAspectRatio="none" style={{ imageRendering: "pixelated" }} />;
}

interface Start {
  k: number; // grid column (0 = today, N_GRID = expiry)
  off: number; // lattice offset from ln 42
}

export function F3Drag() {
  const dark = useDark();
  const g = useMemo(() => {
    const dt = P.T / N_GRID;
    return backwardGrid({ drift: P.r - 0.5 * P.sigma * P.sigma, vol: P.sigma, rate: P.r, x0: Math.log(P.S), T: 2 * P.T, steps: K0 + N_GRID, dx: P.sigma * Math.sqrt(DX_FACTOR * dt), payoff: optionPayoffInX("call", P.K) });
  }, []);
  const field = useFieldImage(g, dark);
  const [start, setStart] = useState<Start>({ k: 0, off: 0 });
  const [dragging, setDragging] = useState(false);
  const S0 = P.S * Math.exp(start.off * g.dx);
  const tau = P.T - start.k * g.dt; // time left, years
  const months = start.k * (MONTHS / N_GRID);
  const cell = g.layers[K0 + start.k][K0 + start.k + start.off]; // lights instantly: the grid already has it

  // the walkers: re-run from the start point, bracket closing in four beats
  const runs = useMemo<MCResult[]>(() => RUNS.map((N) => monteCarloOption(S0, P.K, P.r, P.sigma, tau, N, rng(SEED))), [S0, tau]);
  const [beat, setBeat] = useState(0);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    setBeat(0);
    if (timer.current) window.clearInterval(timer.current);
    let i = 0;
    timer.current = window.setInterval(() => {
      i++;
      setBeat(i);
      if (i >= RUNS.length - 1 && timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    }, 260);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [runs]);
  const mc = runs[Math.min(beat, RUNS.length - 1)];
  const done = beat >= RUNS.length - 1;
  const agree = done && insideBracket(mc, cell);

  // a small fan of walkers from the start, for the picture
  const fan = useMemo(() => {
    const next = rng(SEED + 7);
    const steps = Math.max(2, Math.round(26 * (tau / P.T)));
    return Array.from({ length: FAN }, () => {
      const { t, W } = brownianPath(steps, tau, next);
      return t.map((ti, i) => [months + (ti / P.T) * MONTHS, gbmTerminal(S0, P.r, P.sigma, ti, W[i])] as Pt);
    });
  }, [S0, tau, months]);

  const place = (xm: number, S: number) => {
    const k = Math.max(0, Math.min(N_GRID - 5, Math.round((xm / MONTHS) * N_GRID)));
    const Sc = Math.max(PRICE[0] + 1, Math.min(PRICE[1] - 1, S));
    setStart({ k, off: Math.round((Math.log(Sc) - Math.log(P.S)) / g.dx) });
  };

  return (
    <Figure
      n="3"
      prompt={<>Drag the start point — today's price, today's date — anywhere on the grid. Watch which program answers first.</>}
      observe={
        <>
          The grid already knew the answer for <strong>every</strong> start point; the walkers answer one point at a time, and re-run when you move. That is why a desk's grid pricer is instant and its simulator is not — and why the simulator survives: it does not care how many dimensions the grid would need.
        </>
      }
    >
      <div className="b6-drag">
        <Plot
          xDomain={[0, MONTHS]}
          yDomain={PRICE}
          width={560}
          height={320}
          xLabel="months"
          yLabel="price"
          axisY={PRICE[0]}
          xTicks={6}
          grid={false}
          ariaLabel="The filled grid of option value against price and time; a draggable start point with a fan of walkers from it"
          onDrag={(x, y, phase) => {
            place(x, y);
            setDragging(phase !== "up");
          }}
        >
          <FieldImage href={field} />
          <Curve pts={[[0, P.K], [MONTHS, P.K]]} role="error" width={1.2} dash="4 3" smooth={false} />
          <Label at={[MONTHS, P.K]} text="strike 40" role="error" anchor="end" dx={-4} dy={-5} />
          {fan.map((pts, i) => (
            <Curve key={i} pts={pts} role="approx" width={0.9} opacity={done ? 0.35 : 0.55} smooth={false} />
          ))}
          <Marker at={[months, S0]} role="truth" r={dragging ? 8 : 6} />
          <Label at={[months, S0]} text={`grid ${f2(cell)}`} dx={12} dy={-6} />
          <Label at={[months, S0]} text={`walkers ${f2(mc.mean)} ± ${f2(mc.se)}`} dx={12} dy={10} />
        </Plot>
        <div className="b6-drag-side">
          <div className="b6-box">
            <div className="b6-cell">
              <span className="k">start</span>
              <span className="v">
                {f1(S0)} <small>· {f1(MONTHS - months)} months left</small>
              </span>
            </div>
            <div className={"b6-cell truth " + (agree ? "agree" : "")}>
              <span className="k">grid cell · lit instantly</span>
              <span className="v">
                {f2(cell)} {done && <span className={"b6-tick " + (agree ? "" : "no")}>{agree ? "✓ inside the bracket" : "outside the bracket"}</span>}
              </span>
            </div>
            <div className={"b6-cell approx " + (done ? "" : "waiting")}>
              <span className="k">walkers · {fn(mc.N)} of {fn(RUNS[RUNS.length - 1])} futures</span>
              <span className="v">
                {f2(mc.mean)} <small>± {f2(mc.se)}</small>
              </span>
              <span className="b6-meter" aria-hidden="true">
                <span className="b6-meter-fill" style={{ width: `${(100 * Math.log10(mc.N)) / Math.log10(RUNS[RUNS.length - 1])}%` }} />
              </span>
            </div>
          </div>
          <div className="footnote">Each move re-runs the walkers from the new point, 10 → 10,000 futures; the grid only reads a cell. Same seed every run, so the same point gives the same bracket.</div>
        </div>
      </div>
    </Figure>
  );
}
