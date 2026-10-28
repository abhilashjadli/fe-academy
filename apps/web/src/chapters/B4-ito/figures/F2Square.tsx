import { useEffect, useMemo, useState } from "react";
import { format } from "d3-format";
import { coinPath, incrementSums, quadraticVariationSd, telescope } from "../../../engine/ito";
import { rng } from "../../../engine/random";
import { Figure } from "../../../ui/Figure";
import { Slider } from "../../../ui/controls";
import { M } from "../../../ui/Math";

/** Figure 2 — the nudged square with a coin on its side (storyboard beats 1–6). */

const DTS = [1 / 10, 1 / 20, 1 / 40, 1 / 80, 1 / 160];
const DT_LABEL = ["1/10", "1/20", "1/40", "1/80", "1/160"];
const X0 = 3;
const NUDGE = 0.01;

const f2 = format(".2f");
const f2s = format("+.2f");

type Mode = "still" | "nudge" | "flip";

/** Phone width: the SVG scales down, so its text scales up and the meters move under the square. */
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

/** "Safe to ignore" — the sticker from 0.1, rotated; crossed out once the corners have added up. */
function Sticker({ x, y, crossed, fs = 1 }: { x: number; y: number; crossed: boolean; fs?: number }) {
  const w = 108,
    h = 22;
  return (
    <g transform={`translate(${x} ${y}) rotate(-14) scale(${fs})`} style={{ transition: "opacity 400ms" }}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill="var(--surface-raised)" stroke="var(--error)" strokeWidth={1.4} />
      <text x={0} y={4} textAnchor="middle" fontSize={11} fontWeight={500} letterSpacing={1} fill="var(--error-text)" fontFamily="var(--font-ui)">
        SAFE TO IGNORE
      </text>
      {crossed && (
        <g stroke="var(--error)" strokeWidth={2.2} strokeLinecap="round">
          <line x1={-w / 2 + 6} y1={h / 2 - 3} x2={w / 2 - 6} y2={-h / 2 + 3} />
          <line x1={-w / 2 + 6} y1={-h / 2 + 3} x2={w / 2 - 6} y2={h / 2 - 3} />
        </g>
      )}
    </g>
  );
}

/** A vertical bar meter. `signed` puts zero in the middle. `marker` draws a thin reference line with a label. */
function Meter({
  x,
  value,
  range,
  signed,
  role,
  title,
  marker,
  fs = 1,
}: {
  x: number;
  value: number;
  range: number;
  signed: boolean;
  role: "approx" | "truth";
  title: string;
  marker?: { at: number; label: string };
  fs?: number;
}) {
  const top = 34,
    bottom = 222,
    w = 34;
  const H = bottom - top;
  const yOf = (v: number) => (signed ? top + H / 2 - (v / range) * (H / 2) : bottom - (v / range) * H);
  const zero = yOf(0);
  const yv = yOf(Math.max(-range, Math.min(range, value)));
  const col = `var(--${role})`;
  const txt = `var(--${role}-text)`;
  return (
    <g fontFamily="var(--font-ui)">
      <rect x={x} y={top} width={w} height={H} rx={3} fill="var(--surface)" stroke="var(--rule)" />
      <rect x={x + 1} y={Math.min(zero, yv)} width={w - 2} height={Math.max(0, Math.abs(zero - yv))} fill={col} opacity={0.85} style={{ transition: "y 250ms, height 250ms" }} />
      <line x1={x - 4} x2={x + w + 4} y1={zero} y2={zero} stroke="var(--axis)" strokeWidth={1} />
      {!(marker && Math.abs(yOf(marker.at) - zero) < 12) && (
        <text x={x + w + 7} y={zero + 4 * fs} fontSize={10 * fs} fill="var(--ink-3)">
          0
        </text>
      )}
      {signed && (
        <>
          <text x={x + w + 7} y={top + 4 * fs} fontSize={10 * fs} fill="var(--ink-3)">
            +{range}
          </text>
          <text x={x + w + 7} y={bottom + 4 * fs} fontSize={10 * fs} fill="var(--ink-3)">
            −{range}
          </text>
        </>
      )}
      {marker && (
        <g>
          <line x1={x - 6} x2={x + w + 6} y1={yOf(marker.at)} y2={yOf(marker.at)} stroke="var(--ink)" strokeWidth={1.2} strokeDasharray="3 2" style={{ transition: "y1 250ms, y2 250ms" }} />
          <text x={x + w + 8} y={yOf(marker.at) + 4 * fs} fontSize={10.5 * fs} fill="var(--ink)">
            {marker.label}
          </text>
        </g>
      )}
      <text x={x + w / 2} y={top - 12 * fs} textAnchor="middle" fontSize={11.5 * fs} fill="var(--ink-2)">
        {title}
      </text>
      <text x={x + w / 2} y={bottom + 22 * fs} textAnchor="middle" fontSize={15 * fs} fontWeight={500} fill={txt} style={{ fontVariantNumeric: "tabular-nums" }}>
        {signed ? f2s(value) : f2(value)}
      </text>
    </g>
  );
}

export function F2Square() {
  const [mode, setMode] = useState<Mode>("still");
  const [dtIdx, setDtIdx] = useState(0);
  const [n, setN] = useState(0); // flips so far
  const [seed, setSeed] = useState(11);
  const narrow = useNarrow();
  const fs = narrow ? 1.6 : 1;
  const mx = narrow ? [50, 230] : [400, 520]; // meter x positions

  const dt = DTS[dtIdx];
  const t = n * dt;

  // The path: x = 3 + W, W a coin path with n steps of ±√Δt (engine). Same seed ⇒ flipping appends; changing Δt re-rolls the same elapsed time.
  const path = useMemo(() => (n > 0 ? coinPath(n, t, rng(seed)).W : [0]), [n, t, seed]);
  const xs = useMemo(() => path.map((w) => X0 + w), [path]);
  const sums = useMemo(() => (n > 0 ? incrementSums(path, t) : null), [path, t, n]);
  const tele = useMemo(() => telescope(xs), [xs]);
  const strips = n > 0 ? tele.twoSumWdW : 0; // 2 Σ x·dx, signed
  const corners = sums ? sums.sumDW2 : 0; // Σ (dx)²  = n·Δt = t

  // the last move, drawn on the square
  const nudged = mode === "nudge";
  const xBefore = nudged ? X0 : n > 0 ? xs[n - 1] : X0;
  const dx = nudged ? NUDGE : n > 0 ? xs[n] - xs[n - 1] : 0;
  const xAfter = xBefore + dx;
  const lastStrips = 2 * xBefore * dx;
  const lastCorner = dx * dx;
  const heads = dx > 0;

  const flipped = mode === "flip" && n > 0;
  const many = flipped && n >= 20;
  const stickerOn = nudged || flipped;

  const setDt = (idx: number) => {
    if (idx === dtIdx) return;
    setN((old) => Math.round(old * Math.pow(2, idx - dtIdx)));
    setDtIdx(idx);
  };
  const flip = (k: number) => {
    setMode("flip");
    setN((old) => old + k);
  };
  const reset = () => {
    setMode("still");
    setN(0);
  };
  const runAgain = () => {
    setSeed(Math.floor(Math.random() * 1e9));
  };

  // geometry
  const ox = 26,
    oy = 262;
  const need = Math.max(X0 + 0.4, Math.max(xBefore, xAfter) + 0.4);
  const s = narrow ? Math.min(46, 180 / need) : Math.min(62, 236 / need);
  const px = (v: number) => v * s;
  const sideB = px(Math.max(0, xBefore));
  const sideA = px(Math.max(0, xAfter));
  const wStrip = Math.max(px(Math.abs(dx)), 2);
  const wCorner = Math.max(px(Math.abs(dx)), 3);
  const lo = Math.min(sideA, sideB);

  const caption = (() => {
    if (mode === "still") return "A square of side 3. Nudge it by 0.01, or put a coin on the side and flip.";
    if (nudged) return "Nudge the side by 0.01: the area grows by two thin strips and a tiny corner. The corner is 0.0001 — safe to ignore. (0.1 said so.)";
    if (!many) return "Heads or tails, the corner is added. It is a square: it cannot be negative.";
    if (dtIdx === 0) return "The strips are a fair game. The corners are a clock. Now turn Δt down.";
    return "Smaller steps, more of them: the corners add up to the same thing — the time that passed. Cross out the sticker.";
  })();

  const sd = n > 0 ? quadraticVariationSd(n, t) : 0;

  return (
    <Figure
      n="2"
      prompt="Nudge the side of a square and the area grows by two strips and a corner. Now let the side jitter instead."
      controls={
        <>
          <span className="toggle-row">
            <button type="button" className="btn" onClick={() => { setMode("nudge"); setN(0); }}>
              nudge by 0.01
            </button>
            <button type="button" className="btn primary" onClick={() => flip(1)}>
              flip
            </button>
            <button type="button" className="btn" onClick={() => flip(20)}>
              flip ×20
            </button>
            <button type="button" className="btn" onClick={reset}>
              reset
            </button>
          </span>
          <Slider label="Δt" value={dtIdx} min={0} max={4} step={1} onChange={(v) => setDt(Math.round(v))} fmt={(v) => DT_LABEL[Math.round(v)]} role="truth" width={110} />
          <span className="readouts">
            <span>
              <span className="k">flips </span>
              <span className="v">{n}</span>
            </span>
            <span>
              <span className="k">time elapsed t = flips·Δt = </span>
              <span className="v">{f2(t)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          In 0.1 the corner vanished because a nudge squared is tiny. Here each corner is tiny too — but a coin lands √Δt away, so the corner is Δt, and there are 1/Δt of
          them. Tiny times many is one. Everything in this chapter is that sentence.
        </>
      }
    >
      <svg viewBox={narrow ? "0 0 380 658" : "0 0 640 300"} className="plot" role="img" aria-label="A square whose side is nudged or jittered; two meters count the strips and the corners" style={{ touchAction: "auto" }}>
        {/* the square, anchored bottom-left */}
        <g transform={`translate(${ox} ${oy}) scale(1 -1)`}>
          <rect x={0} y={0} width={lo} height={lo} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.4} />
          {dx !== 0 && heads && (
            <g>
              {/* added strips (amber) */}
              <rect x={sideB} y={0} width={wStrip} height={sideB} fill="var(--approx)" opacity={0.75} />
              <rect x={0} y={sideB} width={sideB} height={wStrip} fill="var(--approx)" opacity={0.75} />
              {/* the corner, always filled */}
              <rect x={sideB} y={sideB} width={wCorner} height={wCorner} fill="var(--truth)" />
            </g>
          )}
          {dx !== 0 && !heads && (
            <g>
              {/* removed strips: blue outline, dashed, inside the old square */}
              <rect x={sideA} y={0} width={wStrip} height={sideB} fill="var(--truth-soft)" stroke="var(--truth)" strokeDasharray="4 3" strokeWidth={1.2} />
              <rect x={0} y={sideA} width={sideB} height={wStrip} fill="var(--truth-soft)" stroke="var(--truth)" strokeDasharray="4 3" strokeWidth={1.2} />
              {/* the corner: counted in both strips, so it is given back — still added */}
              <rect x={sideA} y={sideA} width={wCorner} height={wCorner} fill="var(--truth)" />
            </g>
          )}
          {/* the coin on the side */}
          {mode !== "nudge" && (
            <g transform={`translate(${Math.max(sideB, sideA) + 22 * fs} ${lo / 2}) scale(${fs} ${-fs})`}>
              <circle r={11} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.4} />
              <text y={4} textAnchor="middle" fontSize={11} fontWeight={500} fill="var(--ink)" fontFamily="var(--font-ui)">
                {n > 0 && flipped ? (heads ? "H" : "T") : "±"}
              </text>
            </g>
          )}
        </g>
        {/* labels around the square */}
        <g fontFamily="var(--font-ui)" fontSize={11.5 * fs}>
          <text x={narrow ? ox : ox + lo / 2} y={oy + 16 * fs} textAnchor={narrow ? "start" : "middle"} fill="var(--ink-2)">
            side x = {f2(xAfter)}
            {dx !== 0 && (
              <tspan fill={heads ? "var(--approx-text)" : "var(--truth-text)"}>
                {" "}
                ({heads ? "+" : "−"}
                {nudged ? "0.01" : "√Δt = " + f2(Math.abs(dx))})
              </tspan>
            )}
          </text>
          {dx !== 0 && (
            <>
              <text x={narrow ? ox : ox + 4} y={narrow ? oy + 36 * fs : oy - lo - wStrip - 8 * fs} fill={heads ? "var(--approx-text)" : "var(--truth-text)"}>
                {heads ? "two strips added" : "two strips removed"} 2·x·Δx = {nudged ? "0.06" : f2s(lastStrips)}
              </text>
              <text x={ox + Math.max(sideA, sideB) + 6} y={oy - Math.max(sideA, sideB) - wCorner + 4 * fs} fill="var(--truth-text)" fontSize={11 * fs}>
                corner
              </text>
              <text x={ox + Math.max(sideA, sideB) + 6} y={oy - Math.max(sideA, sideB) - wCorner + 17 * fs} fill="var(--truth-text)" fontSize={11 * fs}>
                Δx² = {nudged ? "0.0001" : "Δt = " + f2(lastCorner)}
              </text>
            </>
          )}
        </g>
        {stickerOn && <Sticker x={narrow ? 290 : Math.min(335, ox + Math.max(sideA, sideB) + 62)} y={narrow ? oy - 24 : oy - Math.max(sideA, sideB) - wCorner + 46} crossed={many} fs={fs} />}

        {/* the two dials */}
        <g transform={narrow ? "translate(0 348)" : undefined}>
        <Meter x={mx[0]} value={strips} range={Math.max(4, Math.ceil(Math.abs(strips)))} signed role="approx" title="strips so far" fs={fs} />
        <Meter x={mx[1]} value={corners} range={Math.max(3, Math.ceil(t * 1.15))} signed={false} role="truth" title="corners so far" marker={{ at: t, label: `t = ${f2(t)}` }} fs={fs} />
        <text x={mx[0] + 17} y={286 + 8 * (fs - 1)} textAnchor="middle" fontSize={10.5 * fs} fill="var(--ink-3)" fontFamily="var(--font-ui)">
          2·Σ x·Δx
        </text>
        <text x={mx[1] + 17} y={286 + 8 * (fs - 1)} textAnchor="middle" fontSize={10.5 * fs} fill="var(--ink-3)" fontFamily="var(--font-ui)">
          Σ (Δx)²
        </text>
        </g>
      </svg>

      <p style={{ margin: "0.4rem 0.25rem 0.2rem", fontFamily: "var(--font-prose)", fontSize: "0.98rem", color: "var(--ink)" }}>{caption}</p>

      {flipped && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0.3rem 1.2rem", padding: "0 0.25rem" }}>
          {!many ? (
            <>
              <M tex="\Delta(x^2) = \tok{approx}{2x\,\Delta x} + \tok{truth}{(\Delta x)^2}" />
              <span className="readouts">
                <span>
                  <span className="k">this flip: </span>
                  <span className="v">
                    {f2s(2 * xBefore * dx + dx * dx)} = <span className="tok-approx">{f2s(lastStrips)}</span> + <span className="tok-truth">{f2(lastCorner)}</span>
                  </span>
                </span>
              </span>
            </>
          ) : (
            <>
              <M tex="d(x^2) = \tok{approx}{2x\,dW} + \tok{truth}{dt}" />
              <span style={{ fontFamily: "var(--font-prose)", color: "var(--ink-2)", fontSize: "0.95rem" }}>This is the whole lemma for one function. The chain rule got a passenger.</span>
            </>
          )}
        </div>
      )}

      {many && (
        <div style={{ margin: "0.6rem 0.25rem 0.5rem", padding: "0.6rem 0.8rem", border: "1px solid var(--rule)", borderRadius: "var(--radius)", background: "var(--surface-raised)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem 1rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--ink-3)" }}>Now you — the check, exact every time:</span>
            <M tex="x_T^2 - x_0^2 - \tok{approx}{2\textstyle\sum x\,\Delta x} = \tok{truth}{\textstyle\sum (\Delta x)^2}" />
            <button type="button" className="btn" onClick={runAgain}>
              run again
            </button>
          </div>
          <table className="table" style={{ maxWidth: 520, marginTop: "0.4rem" }}>
            <tbody>
              <tr>
                <td>
                  x<sub>T</sub>² − x<sub>0</sub>²
                </td>
                <td>
                  {f2(tele.WT2)} − {f2(X0 * X0)} = {f2(tele.WT2 - X0 * X0)}
                </td>
              </tr>
              <tr>
                <td>
                  <span className="tok-approx">2 Σ x·Δx</span> (strips)
                </td>
                <td>
                  <span className="tok-approx">{f2(tele.twoSumWdW)}</span>
                </td>
              </tr>
              <tr className="hl">
                <td>
                  difference = <span className="tok-truth">Σ (Δx)²</span> (corners)
                </td>
                <td>
                  {f2(tele.WT2 - X0 * X0 - tele.twoSumWdW)} = <span className="tok-truth">{f2(tele.sumDW2)}</span> ≈ t = {f2(t)}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="footnote" style={{ marginTop: "0.3rem" }}>
            With a coin the corners add to t exactly. A normal draw of the same size gives the same total give or take {f2(sd)} — and the identity still holds to the last digit.
          </div>
        </div>
      )}
    </Figure>
  );
}
