import { useEffect, useState, type ReactNode } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { M } from "../../../ui/Math";

/** Figure 3 — every term of the expansion is a tile whose area is its size (storyboard "Figure 3 in beats"). */

const A = 0.1,
  B = 0.3; // engine key values
const DX0 = 0.4; // step 1: starting Δx (f′ = 1, ½f″ = 1, ⅙f‴ = 1 so areas are Δx, Δx², Δx³)
const K = 48000; // px² per unit of area — one scale for every tile on the page
const BAR_H = 120; // first-order tiles are bars of this height; their width is the increment

const f2 = format(".2f");
const f4 = format(".4f");
/** 2 dp; four for an area that would print as 0.00 (so a dying tile still shows a number, never 0.00 or 1e-5). */
const fv = (v: number) => (v >= 0.005 ? f2(v) : v >= 0.00005 ? f4(v) : "< 0.0001");

/** expected sizes of the five tiles at step Δt */
function tilesAt(dt: number) {
  const eAbsDW = Math.sqrt((2 * dt) / Math.PI); // E|ΔW|
  return {
    aDt: A * dt,
    bDW: B * eAbsDW,
    a2Dt2: A * A * dt * dt,
    abDtDW: 2 * A * B * dt * eAbsDW,
    b2DW2: B * B * dt, // E(ΔW)² = Δt
  };
}

type Role = "approx" | "truth" | "ghost";

/** Phone width: the SVGs scale down, so their text scales up. */
function useNarrow() {
  const [narrow, setNarrow] = useState(() => (typeof window !== "undefined" ? window.matchMedia("(max-width: 640px)").matches : false));
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

function Sticker({ x, y, on, small, fs = 1 }: { x: number; y: number; on: boolean; small?: boolean; fs?: number }) {
  const w = (small ? 78 : 108) * fs,
    h = (small ? 18 : 22) * fs;
  return (
    <g transform={`translate(${x} ${y}) rotate(-14)`} style={{ opacity: on ? 1 : 0, transition: "opacity 600ms ease" }}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill="var(--surface-raised)" stroke="var(--error)" strokeWidth={1.4} />
      <text x={0} y={4 * fs} textAnchor="middle" fontSize={(small ? 8.5 : 11) * fs} fontWeight={500} letterSpacing={small ? 0.5 : 1} fill="var(--error-text)" fontFamily="var(--font-ui)">
        SAFE TO IGNORE
      </text>
    </g>
  );
}

function Coin({ x, y, fs = 1 }: { x: number; y: number; fs?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${fs})`}>
      <circle r={9} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.3} />
      <text y={3.5} textAnchor="middle" fontSize={9.5} fontWeight={500} fill="var(--ink)" fontFamily="var(--font-ui)">
        ±
      </text>
    </g>
  );
}

/** A tile: a rectangle of the given pixel size sitting on the baseline, with a label and a value below. */
function Tile({
  x,
  base,
  w,
  h,
  role,
  label,
  value,
  coin,
  sticker,
  note,
  fs = 1,
}: {
  x: number;
  base: number;
  w: number;
  h: number;
  role: Role;
  label: ReactNode;
  value: string;
  coin?: boolean;
  sticker?: boolean;
  note?: string;
  fs?: number;
}) {
  const W = Math.max(w, 1.2),
    H = Math.max(h, 1.2);
  const fill = role === "ghost" ? "var(--ghost)" : `var(--${role})`;
  const txt = role === "ghost" ? "var(--ghost)" : `var(--${role}-text)`;
  return (
    <g fontFamily="var(--font-ui)">
      <rect x={x} y={base - H} width={W} height={H} fill={fill} opacity={role === "ghost" ? 0.5 : 0.8} style={{ transition: "width 350ms, height 350ms, y 350ms, opacity 500ms" }} />
      {coin && <Coin x={x + W / 2} y={base - H - 14 * fs} fs={fs} />}
      <text x={x + W / 2} y={base + 16 * fs} textAnchor="middle" fontSize={12 * fs} fontWeight={500} fill={txt}>
        {label}
      </text>
      <text x={x + W / 2} y={base + 31 * fs} textAnchor="middle" fontSize={11 * fs} fill="var(--ink-2)" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </text>
      {note && (
        <text x={x + W / 2} y={base + 45 * fs} textAnchor="middle" fontSize={10.5 * fs} fill={txt}>
          {note}
        </text>
      )}
      {sticker !== undefined && <Sticker x={x + W / 2} y={base - Math.max(H, 44 * fs) / 2} on={sticker} small fs={fs} />}
    </g>
  );
}

/** The 2×2 box table, each cell fading in in order. */
function BoxTable() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const ids = [1, 2, 3, 4].map((k) => window.setTimeout(() => setShown(k), 250 + k * 450));
    return () => ids.forEach(clearTimeout);
  }, []);
  const cell = (k: number, tex: string, role?: Role) => (
    <td
      style={{
        opacity: shown >= k ? 1 : 0,
        transform: shown >= k ? "none" : "translateY(10px)",
        transition: "opacity 450ms ease, transform 450ms ease",
        padding: "8px 18px",
        textAlign: "center",
        background: role === "truth" ? "var(--truth-soft)" : "var(--surface)",
        borderRadius: 3,
      }}
    >
      <M tex={tex} />
    </td>
  );
  return (
    <table style={{ borderCollapse: "separate", borderSpacing: 4, margin: "0.4rem auto", fontFamily: "var(--font-ui)" }}>
      <thead>
        <tr>
          <th></th>
          <th style={{ fontWeight: 500, color: "var(--ink-3)" }}>
            <M tex="dt" />
          </th>
          <th style={{ fontWeight: 500, color: "var(--ink-3)" }}>
            <M tex="dW" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th style={{ fontWeight: 500, color: "var(--ink-3)", textAlign: "right" }}>
            <M tex="dt" />
          </th>
          {cell(1, "\\tok{ghost}{dt\\cdot dt = 0}")}
          {cell(2, "\\tok{ghost}{dt\\cdot dW = 0}")}
        </tr>
        <tr>
          <th style={{ fontWeight: 500, color: "var(--ink-3)", textAlign: "right" }}>
            <M tex="dW" />
          </th>
          {cell(3, "\\tok{ghost}{dW\\cdot dt = 0}")}
          {cell(4, "\\tok{truth}{dW\\cdot dW = dt}", "truth")}
        </tr>
      </tbody>
    </table>
  );
}

export function F3Tiles() {
  const [step, setStep] = useState(0);
  const [hx, setHx] = useState(0); // "halve Δx" presses, step 1 (max 3)
  const [ht, setHt] = useState(0); // "halve Δt" presses, step 3 (max 4)
  const narrow = useNarrow();
  const fs = narrow ? 1.6 : 1; // text scale inside the SVGs

  const dx = DX0 / Math.pow(2, hx);
  const dt = 1 / Math.pow(2, ht);
  const T = tilesAt(dt);
  const T0 = tilesAt(1);

  // step-1 geometry (areas Δx, Δx², Δx³ at scale K)
  const barW = (dx * K) / BAR_H;
  const sqS = Math.sqrt(dx * dx * K);
  const slH = (dx * dx * dx * K) / barW;

  // step-2+ geometry: bars are BAR_H tall; squares/rectangles have sides from the increments
  const w1 = (T.aDt * K) / BAR_H;
  const w2 = (T.bDW * K) / BAR_H;
  const s3 = Math.sqrt(T.a2Dt2 * K);
  const w4 = Math.sqrt(T.abDtDW * K); // drawn as a square of the right area
  const s5 = Math.sqrt(T.b2DW2 * K);

  const onStep = (i: number) => {
    setStep(i);
    if (i === 0) {
      setHx(0);
      setHt(0);
    }
  };

  const stickersOn = step >= 3 ? ht >= 4 || step >= 4 : false;
  const base = 196;

  const steps = [
    {
      caption: (
        <>
          0.1's three tiles: a bar <span className="tok-approx">f′Δx</span>, a square <span className="tok-truth">½f″Δx²</span>, a sliver. Press "halve Δx" three times and watch the square shrink four times faster than the bar.
        </>
      ),
    },
    {
      caption: (
        <>
          Now the step is a jitter: Δx = <span className="tok-approx">aΔt</span> + <span className="tok-approx">bΔW</span>. Squaring it multiplies the tiles out into Δt², Δt·ΔW and (ΔW)². The ΔW tile carries a coin.
        </>
      ),
    },
    {
      caption: (
        <>
          Press "halve Δt" four times. Areas are <em>expected</em> areas. The bar halves; Δt² quarters; Δt·ΔW shrinks by 2.8; <strong>(ΔW)² halves — same as the bar.</strong>
        </>
      ),
    },
    {
      caption: (
        <>
          Stickers go on everything that shrank faster than the bar. Two things remain: the bar and the <span className="tok-truth">(ΔW)²</span> tile, now labelled "= b²Δt on average".
        </>
      ),
    },
    {
      caption: <>The box table is the list of who survived. Each cell comes from its tile: dt·dt = 0, dt·dW = 0, dW·dW = dt. A table earned, not announced.</>,
    },
    {
      caption: (
        <>
          The lemma assembles, each term the colour of its tile. The <M tex="\tok{truth}{\tfrac12 b^2 f_{xx}}" /> is the corner that would not vanish. The full working is below, if you want it.
        </>
      ),
    },
  ];

  const halveDx = step === 0;
  const halveDt = step === 2;

  return (
    <Figure
      n="3"
      prompt="Every term of the expansion is a tile whose area is its size. Shrink the step and watch which tiles survive."
      controls={
        <>
          <span className={"ctl " + (halveDx ? "" : "locked")}>
            <button type="button" className="btn" disabled={!halveDx || hx >= 3} onClick={() => setHx((v) => Math.min(3, v + 1))}>
              halve Δx
            </button>
            <span className="readout" style={{ minWidth: "5ch" }}>
              Δx = {f4(dx).replace(/0+$/, "").replace(/\.$/, "")}
            </span>
            <span className="footnote">{hx}/3</span>
          </span>
          <span className={"ctl " + (halveDt ? "" : "locked")}>
            <button type="button" className="btn" disabled={!halveDt || ht >= 4} onClick={() => setHt((v) => Math.min(4, v + 1))}>
              halve Δt
            </button>
            <span className="readout" style={{ minWidth: "5ch" }}>
              Δt = {ht === 0 ? "1" : "1/" + Math.pow(2, ht)}
            </span>
            <span className="footnote">{ht}/4</span>
          </span>
          <span className="footnote">a = {A}, b = {B}; f′ and ½f″ set to 1 so a tile's area is its increment</span>
        </>
      }
      observe={
        <>
          In ordinary calculus every tile but the bar dies when the step shrinks. With a jittering step one square tile shrinks only as fast as the bar — so it stays, and it
          carries the curvature. That is the whole lemma; the box table is just a list of who survived.
        </>
      }
    >
      <StepThrough
        steps={steps}
        onStep={onStep}
        render={(i) => (
          <>
            {i === 0 && (
              <svg viewBox={narrow ? "0 0 640 300" : "0 0 640 260"} className="plot" role="img" aria-label="Three Taylor tiles: bar, square, sliver" style={{ touchAction: "auto" }}>
                <line x1={20} x2={620} y1={base} y2={base} stroke="var(--axis)" />
                <Tile x={40} base={base} w={barW} h={BAR_H} role="approx" label="f′Δx" value={fv(dx)} fs={fs} />
                <Tile x={260} base={base} w={sqS} h={sqS} role="truth" label="½f″Δx²" value={fv(dx * dx)} sticker={hx >= 3} fs={fs} />
                <Tile x={420} base={base} w={barW} h={slH} role="ghost" label="⅙f‴Δx³" value={fv(dx * dx * dx)} fs={fs} />
                <text x={620} y={base + 48 * fs} textAnchor="end" fontSize={11 * fs} fill="var(--ink-3)" fontFamily="var(--font-ui)">
                  bar ÷ {Math.pow(2, hx)} · square ÷ {Math.pow(4, hx)}
                </text>
              </svg>
            )}
            {i >= 1 && i <= 3 && (
              <svg viewBox={narrow ? "0 0 640 300" : "0 0 640 260"} className="plot" role="img" aria-label="The five tiles of the expansion with a jittering step" style={{ touchAction: "auto" }}>
                <line x1={20} x2={620} y1={base} y2={base} stroke="var(--axis)" />
                <Tile x={36} base={base} w={w1} h={BAR_H} role="approx" label="aΔt" value={fv(T.aDt)} fs={fs} />
                <Tile x={36 + Math.max(w1, 36) + 34} base={base} w={w2} h={BAR_H} role="approx" label="bΔW" value={fv(T.bDW)} coin fs={fs} />
                <Tile x={290} base={base} w={s3} h={s3} role="ghost" label="a²Δt²" value={fv(T.a2Dt2)} sticker={stickersOn} fs={fs} />
                <Tile x={390} base={base} w={w4} h={w4} role="ghost" label="2ab Δt·ΔW" value={fv(T.abDtDW)} sticker={stickersOn} fs={fs} />
                <Tile x={520} base={base} w={s5} h={s5} role="truth" label="b²(ΔW)²" value={fv(T.b2DW2)} note={i >= 3 ? "= b²Δt on average" : undefined} fs={fs} />
                <text x={620} y={22} textAnchor="end" fontSize={11 * fs} fill="var(--ink-3)" fontFamily="var(--font-ui)">
                  expected areas at Δt = {ht === 0 ? "1" : "1/" + Math.pow(2, ht)}
                </text>
                <text x={20} y={22} fontSize={11 * fs} fill="var(--ink-3)" fontFamily="var(--font-ui)">
                  E|ΔW| = √(2Δt/π) · E(ΔW)² = Δt
                </text>
              </svg>
            )}
            {i === 2 && (
              <table className="table" style={{ maxWidth: 560, margin: "0 auto 0.4rem" }}>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: "nowrap" }}>after each halving</th>
                    <th>
                      <span className="tok-approx">aΔt</span> (bar)
                    </th>
                    <th>
                      <span className="tok-ghost">a²Δt²</span>
                    </th>
                    <th>
                      <span className="tok-ghost">2abΔt·ΔW</span>
                    </th>
                    <th>
                      <span className="tok-truth">b²(ΔW)²</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>area at Δt = 1</td>
                    <td>{f2(T0.aDt)}</td>
                    <td>{f2(T0.a2Dt2)}</td>
                    <td>{f2(T0.abDtDW)}</td>
                    <td>{f2(T0.b2DW2)}</td>
                  </tr>
                  {Array.from({ length: ht }, (_, j) => {
                    const k = j + 1;
                    return (
                      <tr key={k} className={k === ht ? "hl" : undefined}>
                        <td style={{ whiteSpace: "nowrap" }}>Δt = 1/{Math.pow(2, k)}: area ÷</td>
                        <td>{Math.pow(2, k)}</td>
                        <td>{Math.pow(4, k)}</td>
                        <td>{Math.pow(2 * Math.SQRT2, k).toFixed(k % 2 ? 1 : 0)}</td>
                        <td>{Math.pow(2, k)}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td>each halving</td>
                    <td>÷ 2</td>
                    <td>÷ 4</td>
                    <td>÷ 2.8</td>
                    <td>
                      <strong>÷ 2 — same rate as the bar</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            {i === 4 && (
              <div style={{ padding: "1.2rem 0.5rem 0.6rem" }}>
                <BoxTable />
                <div className="footnote" style={{ textAlign: "center" }}>
                  grey cells: tiles that shrank faster than the bar · blue cell: the square that kept pace
                </div>
              </div>
            )}
            {i === 5 && (
              <div style={{ padding: "0.6rem 0.5rem 0.4rem" }}>
                <M block tex="df = \big(\tok{approx}{f_t + a f_x} + \tok{truth}{\tfrac12 b^2 f_{xx}}\big)\,dt + \tok{approx}{b f_x}\,dW" />
                <div className="footnote" style={{ textAlign: "center", marginBottom: "0.6rem" }}>
                  for dx = a dt + b dW · <span className="tok-approx">amber</span>: the first-order bars · <span className="tok-truth">blue</span>: the (ΔW)² tile
                </div>
                <details style={{ fontFamily: "var(--font-ui)", fontSize: "0.9rem", color: "var(--ink-2)" }}>
                  <summary style={{ cursor: "pointer", color: "var(--ink-3)", fontSize: "0.8rem" }}>the full working, if you want it</summary>
                  <div style={{ display: "grid", gap: "0.45rem", padding: "0.5rem 0.2rem", overflowX: "auto" }}>
                    <M tex="\Delta f = f_t\,\Delta t + f_x\,\Delta x + \tfrac12 f_{xx}\,(\Delta x)^2 + f_{tx}\,\Delta t\,\Delta x + \tfrac12 f_{tt}\,(\Delta t)^2 + \cdots" />
                    <M tex="\Delta x = a\,\Delta t + b\,\Delta W" />
                    <M tex="(\Delta x)^2 = a^2 (\Delta t)^2 + 2ab\,\Delta t\,\Delta W + b^2 (\Delta W)^2" />
                    <M tex="\text{as } \Delta t \to 0:\quad (\Delta t)^2 \to 0,\quad \Delta t\,\Delta W \to 0,\quad \tok{truth}{(\Delta W)^2 \to \Delta t}" />
                    <M tex="\Delta f \to f_t\,dt + f_x\,(a\,dt + b\,dW) + \tfrac12 f_{xx}\,\tok{truth}{b^2\,dt}" />
                    <M tex="df = \big(f_t + a f_x + \tok{truth}{\tfrac12 b^2 f_{xx}}\big)dt + b f_x\,dW" />
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      />
    </Figure>
  );
}
