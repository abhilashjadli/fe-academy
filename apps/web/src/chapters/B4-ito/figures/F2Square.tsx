import { useMemo, useState } from "react";
import { format } from "d3-format";
import { brownianPath, coinPath, peekingSum, quadraticVariationSd, telescope } from "../../../engine/ito";
import { rng } from "../../../engine/random";
import { Figure } from "../../../ui/Figure";
import { Slider, Toggle } from "../../../ui/controls";
import { Curve, Label, Plot, type Pt } from "../../../ui/Plot";
import { M } from "../../../ui/Math";

/** Figure 2 — the nudged square with a coin on its side (storyboard beats 1–6); the strips and corners as two running lines against time. */

const DTS = [1 / 10, 1 / 20, 1 / 40, 1 / 80, 1 / 160];
const DT_LABEL = ["1/10", "1/20", "1/40", "1/80", "1/160"];
const X0 = 4;
const T_MAX = 4; // flips stop once four units of time have passed, so the side stays well away from zero
const NUDGE = 0.01;

const f2 = format(".2f");
const f2s = format("+.2f");

type Mode = "still" | "nudge" | "flip";

/** "Safe to ignore" — the sticker from ordinary calculus, rotated; crossed out once the corners have added up. */
function Sticker({ x, y, crossed }: { x: number; y: number; crossed: boolean }) {
  const w = 108,
    h = 22;
  return (
    <g transform={`translate(${x} ${y}) rotate(-14)`} style={{ transition: "opacity 400ms" }}>
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

export function F2Square() {
  const [mode, setMode] = useState<Mode>("still");
  const [dtIdx, setDtIdx] = useState(0);
  const [n, setN] = useState(0); // flips so far
  const [seed, setSeed] = useState(11);
  const [normal, setNormal] = useState(false); // normal draws instead of a coin
  const [peek, setPeek] = useState(false);

  const dt = DTS[dtIdx];
  const t = n * dt;

  // The path: x = 3 + W. A coin path has steps of ±√Δt; a normal path has steps √Δt·N(0,1). Same seed ⇒ flipping appends; changing Δt re-rolls the same elapsed time.
  const path = useMemo(() => (n > 0 ? (normal ? brownianPath : coinPath)(n, t, rng(seed)).W : [0]), [n, t, seed, normal]);
  const xs = useMemo(() => path.map((w) => X0 + w), [path]);
  const tele = useMemo(() => telescope(xs), [xs]);
  const peeked = useMemo(() => peekingSum(xs), [xs]);

  // the running totals, one point per flip
  const runs = useMemo(() => {
    const strips: Pt[] = [[0, 0]];
    const corners: Pt[] = [[0, 0]];
    let s = 0,
      q = 0;
    for (let i = 1; i < xs.length; i++) {
      const d = xs[i] - xs[i - 1];
      s += 2 * xs[i - 1] * d;
      q += d * d;
      strips.push([i, s]);
      corners.push([i, q]);
    }
    return { strips, corners };
  }, [xs]);
  const strips = n > 0 ? tele.twoSumWdW : 0; // 2 Σ x·dx, signed
  const corners = n > 0 ? tele.sumDW2 : 0; // Σ (dx)²  ≈ n·Δt = t

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
  const canFlip = t < T_MAX - 1e-9;
  const flip = (k: number) => {
    setMode("flip");
    setN((old) => Math.min(Math.round(T_MAX / dt), old + k));
  };
  const reset = () => {
    setMode("still");
    setN(0);
    setPeek(false);
  };
  const runAgain = () => setSeed(Math.floor(Math.random() * 1e9));

  // square geometry (a 320 × 320 panel; the square is anchored bottom-left)
  const ox = 24,
    oy = 300;
  const need = Math.max(X0 + 0.4, Math.max(xBefore, xAfter) + 0.4);
  const s = Math.min(60, 220 / need);
  const px = (v: number) => v * s;
  const sideB = px(Math.max(0, xBefore));
  const sideA = px(Math.max(0, xAfter));
  const wStrip = Math.max(px(Math.abs(dx)), 2);
  const wCorner = Math.max(px(Math.abs(dx)), 3);
  const lo = Math.min(sideA, sideB);
  const hi = Math.max(sideA, sideB);

  // plot domains: x = flips, y = running total (zero inside, so the strips can wander both ways)
  const xMax = Math.max(20, n);
  const yDomain = useMemo((): [number, number] => {
    let hi = Math.max(2, t),
      lo = -1;
    for (const p of runs.strips) {
      hi = Math.max(hi, p[1]);
      lo = Math.min(lo, p[1]);
    }
    for (const p of runs.corners) hi = Math.max(hi, p[1]);
    return [Math.floor(lo * 1.15), Math.ceil(hi * 1.15)];
  }, [runs, t]);

  const caption = (() => {
    if (mode === "still") return "A square of side 4. Nudge it by 0.01, or put a coin on the side and flip.";
    if (nudged) return "Nudge the side by 0.01: the area grows by two thin strips and a tiny corner. The corner is 0.0001 — safe to ignore, as in ordinary calculus.";
    if (!many) return normal ? "A normal draw: the corner is some size, never Δt exactly. Still a square, still added." : "Heads or tails, the corner is added. It is a square: it cannot be negative.";
    if (normal) return "Normal draws: each corner is nowhere near Δt — some tiny, some three times it — yet the blue pile still lands near t. The sum works; the single term does not.";
    if (dtIdx === 0) return "The amber strips wander: a fair game. The blue corners climb the time line: a clock. Now turn Δt down.";
    if (!canFlip) return "Four units of time have passed. The corners read the clock; the strips read nothing in particular. Reset, run again, or turn Δt down.";
    return "Smaller steps, more of them: the corners still climb the time line — the same total, the time that passed. Cross out the sticker.";
  })();

  const sd = n > 0 ? quadraticVariationSd(n, t) : 0;
  const honest = tele.twoSumWdW / 2; // Σ x·Δx, x measured before each flip

  return (
    <Figure
      n="2"
      prompt="Nudge the side of a square and the area grows by two strips and a corner. Now let the side jitter instead."
      controls={
        <>
          <span className="toggle-row">
            <button type="button" className="btn" onClick={() => { setMode("nudge"); setN(0); setPeek(false); }}>
              nudge by 0.01
            </button>
            <button type="button" className="btn primary" disabled={!canFlip} onClick={() => flip(1)}>
              flip
            </button>
            <button type="button" className="btn" disabled={!canFlip} onClick={() => flip(20)}>
              flip ×20
            </button>
            <button type="button" className="btn" onClick={reset}>
              reset
            </button>
          </span>
          <Slider label="Δt" value={dtIdx} min={0} max={4} step={1} onChange={(v) => setDt(Math.round(v))} fmt={(v) => DT_LABEL[Math.round(v)]} role="truth" width={110} />
          <Toggle label="normal draws instead of a coin" on={normal} onChange={setNormal} />
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
          In ordinary calculus the corner vanished because a nudge squared is tiny. Here each corner is tiny too — but a coin lands √Δt away, so the corner is Δt, and
          there are 1/Δt of them. Tiny times many is one. Everything in this chapter is that sentence.
        </>
      }
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "var(--space-2) var(--space-4)" }}>
        {/* the square */}
        <svg viewBox="0 0 360 320" role="img" aria-label="A square whose side is nudged or jittered; the strips and the corner of the last step are drawn" style={{ flex: "0 1 330px", maxWidth: 330, width: "100%", height: "auto", touchAction: "auto", fontFamily: "var(--font-ui)" }}>
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
            {/* the coin (or the normal draw) on the side */}
            {mode !== "nudge" && (
              <g transform={`translate(${hi + 24} ${lo / 2}) scale(1 -1)`}>
                <circle r={11} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.4} />
                <text y={4} textAnchor="middle" fontSize={11} fontWeight={500} fill="var(--ink)">
                  {n > 0 && flipped ? (normal ? (heads ? "+" : "−") : heads ? "H" : "T") : "±"}
                </text>
              </g>
            )}
          </g>
          {/* labels around the square */}
          <g fontSize={11.5}>
            <text x={ox} y={oy + 17} fill="var(--ink-2)">
              side x = {f2(xAfter)}
              {dx !== 0 && (
                <tspan fill={heads ? "var(--approx-text)" : "var(--truth-text)"}>
                  {" "}
                  ({heads ? "+" : "−"}
                  {nudged ? "0.01" : (normal ? "" : "√Δt = ") + f2(Math.abs(dx))})
                </tspan>
              )}
            </text>
            {dx !== 0 && (
              <>
                <text x={ox} y={20} fill={heads ? "var(--approx-text)" : "var(--truth-text)"}>
                  {heads ? "two strips added" : "two strips removed"} 2·x·Δx = {nudged ? "0.08" : f2s(lastStrips)}
                </text>
                <text x={ox + hi + 8} y={oy - hi - wCorner + 4} fill="var(--truth-text)" fontSize={11}>
                  corner
                </text>
                <text x={ox + hi + 8} y={oy - hi - wCorner + 17} fill="var(--truth-text)" fontSize={11}>
                  Δx² = {nudged ? "0.0001" : (normal ? "" : "Δt = ") + f2(lastCorner)}
                </text>
              </>
            )}
          </g>
          {stickerOn && <Sticker x={268} y={44} crossed={many} />}
        </svg>

        {/* the two running lines against time */}
        <div style={{ flex: "1 1 300px", minWidth: 0 }}>
          <Plot
            xDomain={[0, xMax]}
            yDomain={yDomain}
            width={440}
            height={300}
            margin={{ top: 14, right: 16, bottom: 34, left: 42 }}
            xLabel="flips"
            yLabel="running total"
            xTicks={5}
            yTicks={5}
            ariaLabel="Two running totals against the number of flips: the strips wander around zero, the corners climb the time line"
          >
            {/* the time line t = flips·Δt, thin ink */}
            <Curve pts={[[0, 0], [xMax, xMax * dt]]} role="ink" width={1} dash="5 3" smooth={false} />
            <Label at={[0.42 * xMax, 0.42 * xMax * dt]} text="time t = flips·Δt" anchor="middle" dx={0} dy={-8} />
            {n > 0 && (
              <>
                <Curve pts={runs.strips} role="approx" width={1.8} smooth={false} />
                <Curve pts={runs.corners} role="truth" width={2.2} smooth={false} />
                <Label at={[n, strips]} text={`strips ${f2s(strips)}`} role="approx" anchor="end" dx={-4} dy={strips >= 0 ? -8 : 16} />
                <Label at={[n, corners]} text={`corners ${f2(corners)}`} role="truth" anchor="end" dx={-4} dy={16} />
              </>
            )}
          </Plot>
        </div>
      </div>

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
            <Toggle label="peek" on={peek} onChange={setPeek} />
          </div>
          <table className="table" style={{ maxWidth: 560, marginTop: "0.4rem" }}>
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
                  <span className="tok-approx">2 Σ x·Δx</span> (strips, x measured before each flip)
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
              {peek && (
                <tr>
                  <td>
                    <span className="tok-error">Σ x·Δx, peeking</span> (x measured <em>after</em> each flip)
                  </td>
                  <td>
                    <span className="tok-error">{f2(peeked)}</span> = {f2(honest)} (the honest Σ x·Δx) + <span className="tok-truth">{f2(peeked - honest)}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {peek && (
            <p style={{ margin: "0.4rem 0 0", fontFamily: "var(--font-prose)", fontSize: "0.95rem", color: "var(--ink)" }}>
              Off by exactly <span className="tok-truth">Σ (Δx)²</span> — the corners, counted again. Counting a step after you've seen it is cheating — the sum only
              works if you don't peek.
            </p>
          )}
          <div className="footnote" style={{ marginTop: "0.3rem" }}>
            {normal
              ? `Normal draws: the corners add to ${f2(tele.sumDW2)}, give or take ${f2(sd)} around t = ${f2(t)} — and the identity still holds to the last digit.`
              : `With a coin the corners add to t exactly. A normal draw of the same size gives the same total give or take ${f2(sd)} — and the identity still holds to the last digit.`}
          </div>
        </div>
      )}
    </Figure>
  );
}
