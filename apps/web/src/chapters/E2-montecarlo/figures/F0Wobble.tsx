import "./figures.css";
import { useEffect, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Readouts } from "../../../ui/controls";
import { Curve, Label, Plot, usePlot } from "../../../ui/Plot";
import { CHAIN, CLOUD_N, DAYS, KEY, SEEDS, TRUE_CALL, count, cssVar, getReroll, getRerolls, n0, p1, pm, useNarrow, useThemeBump, useWidth, type Reroll } from "./e2";

/**
 * Figure 0 — the cloud wobbles. C3's cloud for 3 November, redrawn with RANDOM dots (montecarlo.normals, seed shown) instead of
 * C3's 2,000 quantiles (bs.cloud); the call's payoff region shaded. Bet first: of twenty re-rolls, how many prices land inside
 * their own ± 1.96 SE bar? Then re-roll: the price, its bar and the true 249.15. The reveal is the strip of twenty bars,
 * computed live from the engine (they equal key.rerolls; 19 of 20 inside, key.inside_95). One button; three readouts.
 */

type Pick = "20" | "19" | "10" | "5";
const OPTIONS: Array<{ id: Pick; label: string }> = [
  { id: "20", label: "all 20" },
  { id: "19", label: "about 19" },
  { id: "10", label: "about 10" },
  { id: "5", label: "about 5" },
];

const PRICE: [number, number] = [21600, 23600];
const DAY_AXIS: [number, number] = [0, 16];
const BIN = 25;
const STRIP: [number, number] = [200, 300];

/** the cloud on a canvas: the C3 look (dots piled sideways on the expiry line, lit above the strike), no per-dot elements */
function CloudCanvas({ run, narrow }: { run: Reroll; narrow: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = useWidth(wrapRef, 760);
  const height = narrow ? 300 : 380;
  const bump = useThemeBump();

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const col = {
      ghost: cssVar(c, "--ghost"),
      approx: cssVar(c, "--approx"),
      approxSoft: cssVar(c, "--approx-soft"),
      approxText: cssVar(c, "--approx-text"),
      ink: cssVar(c, "--ink"),
      ink2: cssVar(c, "--ink-2"),
      ink3: cssVar(c, "--ink-3"),
      axis: cssVar(c, "--axis"),
      rule: cssVar(c, "--rule-soft"),
    };
    const font = (w: number | string, s: number) => `${w} ${s}px ${cssVar(c, "--font-ui") || "system-ui"}`;
    const M = { left: 10, right: 10, top: 14, bottom: 26 };
    const innerW = width - M.left - M.right;
    const innerH = height - M.top - M.bottom;
    const x = (d: number) => M.left + ((d - DAY_AXIS[0]) / (DAY_AXIS[1] - DAY_AXIS[0])) * innerW;
    const y = (p: number) => M.top + ((PRICE[1] - p) / (PRICE[1] - PRICE[0])) * innerH;
    const xE = x(DAYS);

    // the payoff region: above the strike, from the expiry line outward
    ctx.fillStyle = col.approxSoft;
    ctx.fillRect(xE, M.top, M.left + innerW - xE, y(CHAIN.K) - M.top);

    // price ticks
    ctx.font = font(400, 10.5);
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    for (const p of [21800, 22200, 22600, 23000, 23400]) {
      ctx.strokeStyle = col.rule;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M.left, y(p) + 0.5);
      ctx.lineTo(M.left + innerW, y(p) + 0.5);
      ctx.stroke();
      ctx.fillStyle = col.ink3;
      ctx.fillText(n0(p), M.left + 4, y(p) - 2);
    }
    // bottom axis: days
    ctx.strokeStyle = col.axis;
    ctx.beginPath();
    ctx.moveTo(M.left, M.top + innerH + 0.5);
    ctx.lineTo(M.left + innerW, M.top + innerH + 0.5);
    ctx.stroke();
    ctx.fillStyle = col.ink3;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    for (const d of [0, 2, 4, 6, 8, 10, 12, 14, 16]) ctx.fillText(String(d), x(d), M.top + innerH + 5);
    ctx.textAlign = "right";
    ctx.fillStyle = col.ink2;
    ctx.fillText("days from now", M.left + innerW, M.top + innerH + 15);

    // forward line, today's dot, expiry line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = col.ghost;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x(0), y(CHAIN.F));
    ctx.lineTo(xE, y(CHAIN.F));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col.ink;
    ctx.beginPath();
    ctx.arc(x(0), y(CHAIN.F), 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.font = font(400, 12);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = col.ink2;
    ctx.fillText(`today: forward ${n0(CHAIN.F)}`, x(0) + 8, y(CHAIN.F) + 6);
    ctx.strokeStyle = col.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xE + 0.5, M.top);
    ctx.lineTo(xE + 0.5, M.top + innerH);
    ctx.stroke();
    ctx.textAlign = "end";
    ctx.fillText(`expiry, ${DAYS} days`, xE - 6, M.top + 2);

    // the dots, piled sideways into 25-point bins
    const nb = Math.round((PRICE[1] - PRICE[0]) / BIN);
    const counts = new Int32Array(nb);
    const slot = new Int32Array(run.st.length);
    for (let i = 0; i < run.st.length; i++) {
      const p = run.st[i];
      if (p < PRICE[0] || p >= PRICE[1]) {
        slot[i] = -1;
        continue;
      }
      const b = Math.floor((p - PRICE[0]) / BIN);
      slot[i] = counts[b]++;
    }
    let maxCount = 1;
    for (let b = 0; b < nb; b++) maxCount = Math.max(maxCount, counts[b]);
    const avail = (DAY_AXIS[1] - DAYS - 0.4) * (x(1) - x(0));
    const pitch = Math.min(4.4, avail / maxCount);
    const r = Math.max(0.9, Math.min(1.7, pitch * 0.4));
    const x0 = xE + 3;
    for (const pass of ["ghost", "lit"] as const) {
      ctx.fillStyle = pass === "lit" ? col.approx : col.ghost;
      ctx.globalAlpha = pass === "lit" ? 0.9 : 0.35;
      ctx.beginPath();
      for (let i = 0; i < run.st.length; i++) {
        if (slot[i] < 0) continue;
        const lit = run.st[i] > CHAIN.K;
        if ((pass === "lit") !== lit) continue;
        const cx = x0 + (slot[i] + 0.5) * pitch;
        const cy = y(run.st[i]);
        ctx.moveTo(cx + r, cy);
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // the strike line
    ctx.strokeStyle = col.ink;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(M.left, y(CHAIN.K) + 0.5);
    ctx.lineTo(M.left + innerW, y(CHAIN.K) + 0.5);
    ctx.stroke();
    ctx.font = font(600, 12);
    ctx.fillStyle = col.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`strike ${n0(CHAIN.K)}`, x(6), y(CHAIN.K) - 5);
    ctx.font = font(400, 11.5);
    ctx.fillStyle = col.approxText;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    if (!narrow) ctx.fillText("the call pays here", M.left + innerW - 4, M.top + 2);
    ctx.textBaseline = "bottom";
    ctx.fillStyle = col.ink3;
    ctx.fillText(`seed ${run.seed} · ${count(CLOUD_N)} random dots`, M.left + innerW - 4, M.top + innerH - 4);
  }, [run, width, height, narrow, bump]);

  return (
    <div className="e2-canvas-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} className="e2-canvas" style={{ width, height }} role="img" aria-label={`${count(CLOUD_N)} random futures of the index at ${DAYS} days (seed ${run.seed}), piled into a bell on the expiry line; the dots above the ${n0(CHAIN.K)} strike are lit and the call's payoff region is shaded`} />
    </div>
  );
}

/** the strip: each re-roll's price as a tick with its ± SE (thick) and ± 1.96 SE (thin) bar against the true 249.15 */
function Strip({ rows, current, all }: { rows: Reroll[]; current: number; all: boolean }) {
  const narrow = useNarrow();
  const n = rows.length;
  const rowH = all ? (narrow ? 11 : 12) : 26;
  const height = n * rowH + 52;
  return (
    <Plot xDomain={STRIP} yDomain={[-2.4, n - 0.5]} width={narrow ? 400 : 760} height={height} margin={{ top: 6, right: 10, bottom: 6, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={STRIP[0]} axisY={-2.4} ariaLabel={all ? `twenty re-rolls of the cloud: each price with its error bar against the true ${p1(TRUE_CALL)}; one bar misses` : `this cloud's price with its error bar against the true ${p1(TRUE_CALL)}`}>
      <StripTicks />
      <Curve pts={[[TRUE_CALL, -1.0], [TRUE_CALL, n - 0.5]]} role="truth" width={1.5} dash="4 3" smooth={false} />
      <Label at={[TRUE_CALL, -1.4]} text={`the formula: ${p1(TRUE_CALL)}`} role="truth" dx={6} dy={4} />
      {rows.map((r, i) => (
        <StripRow key={r.seed} r={r} yv={n - 1 - i} bold={i === current} />
      ))}
    </Plot>
  );
}
function StripTicks() {
  const { x, inner } = usePlot();
  return (
    <g>
      {[210, 230, 270, 290].map((v) => (
        <text key={v} className="label e2-ticklabel" x={x(v)} y={inner.top + inner.height - 4} textAnchor="middle">
          {v}
        </text>
      ))}
      <text className="label e2-ticklabel" x={inner.left} y={inner.top + inner.height - 4}>
        price
      </text>
    </g>
  );
}
function StripRow({ r, yv, bold }: { r: Reroll; yv: number; bold: boolean }) {
  const { x, y } = usePlot();
  const cy = y(yv);
  const role = r.inside ? "ink" : "error";
  const col = r.inside ? (bold ? "var(--ink)" : "var(--ink-3)") : "var(--error)";
  const left = r.mean > TRUE_CALL;
  const lx = left ? x(r.mean - 1.96 * r.se) - 6 : x(r.mean + 1.96 * r.se) + 6;
  const anchor = left ? "end" : "start";
  return (
    <g className="e2-strip-row" opacity={bold ? 1 : 0.75}>
      <line x1={x(r.mean - 1.96 * r.se)} x2={x(r.mean + 1.96 * r.se)} y1={cy} y2={cy} stroke={col} strokeWidth={1} />
      <line x1={x(r.mean - r.se)} x2={x(r.mean + r.se)} y1={cy} y2={cy} stroke={col} strokeWidth={bold ? 4 : 3} />
      <line x1={x(r.mean)} x2={x(r.mean)} y1={cy - 5} y2={cy + 5} stroke={col} strokeWidth={bold ? 2.5 : 1.5} />
      {bold && <text className={`label ${role}`} x={lx} y={cy + 4} textAnchor={anchor}>{`seed ${r.seed}: ${p1(r.mean)} ${pm(r.se)}${r.inside ? "" : " — misses"}`}</text>}
      {!bold && !r.inside && <text className="label error" x={lx} y={cy + 4} textAnchor={anchor}>{`seed ${r.seed}: ${p1(r.mean)} — misses`}</text>}
    </g>
  );
}

export function F0Wobble() {
  const narrow = useNarrow();
  const [pick, setPick] = useBet<Pick>("e2-f0");
  const [si, setSi] = useState(0);
  const placed = !!pick;
  const run = getReroll(SEEDS[si]);
  const all = placed ? getRerolls() : null;
  const inside = all ? all.filter((r) => r.inside).length : null;
  const answerId: Pick = inside === null ? "19" : inside >= 20 ? "20" : inside >= 15 ? "19" : inside >= 8 ? "10" : "5";
  const verdict = pick === answerId ? "right" : pick === "20" && answerId === "19" ? "close" : "miss";
  const yoursLabel = OPTIONS.find((o) => o.id === pick)?.label ?? "";
  const miss = all ? all.filter((r) => !r.inside) : [];

  return (
    <Figure
      n="0"
      prompt={
        <>
          Your cloud from C3, grown again for {DAYS} days with <em>random</em> dots this time — {count(CLOUD_N)} draws from the bell, seed shown. The {n0(CHAIN.K)} call's price
          is the average of what it pays in each dot. Make your bet, then re-roll.
        </>
      }
      controls={
        <>
          <button type="button" className="btn primary" disabled={!placed} onClick={() => setSi((si + 1) % SEEDS.length)} title={placed ? "draw 2,000 new dots" : "bet first"}>
            re-roll {placed ? `(seed ${SEEDS[(si + 1) % SEEDS.length]} next)` : ""}
          </button>
          <Readouts items={[["price", p1(run.mean)], ["± one standard error", pm(run.se)], ["dots", count(run.n)]]} />
        </>
      }
      observe={
        <>
          The cloud in C3 never moved because its {count(CLOUD_N)} dots were not random: they were the bell's {count(CLOUD_N)} evenly spaced quantiles, so its 249 was the same
          every time. These dots are random (seeds 1–20, shown), and the price wobbles: seed 1 reads {p1(KEY.rerolls[0].price)}, seed 2 {p1(KEY.rerolls[1].price)}, seed 9{" "}
          {p1(KEY.rerolls[8].price)} (key). The bar comes from the same dots — the spread of the {count(CLOUD_N)} payoffs divided by √{count(CLOUD_N)}, about {pm(KEY.exact.se_2000)} — and the
          formula's {p1(TRUE_CALL)} lies inside ± 1.96 of it on {KEY.inside_95} of the 20 seeds (key). Nineteen in twenty is what the bar promises.
        </>
      }
    >
      <div className="e2-wobble">
        <Bet<Pick>
          question={<>Re-roll the cloud twenty times. How many of the twenty prices land inside their own ± 1.96 standard-error bar?</>}
          options={OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
          pick={pick}
          onPick={(v) => {
            setPick(v);
            if (v === null) setSi(0);
          }}
        >
          <ResultCard yours={yoursLabel} answer={<>{inside} of 20 — seeds 1 to 20, computed from the dots{miss.length ? `; seed ${miss.map((r) => r.seed).join(", ")} misses` : ""}</>} verdict={verdict}>
            An estimate from random draws carries its own error bar, computed from the same draws — no second experiment needed. The bar is one standard error, s/√n; ± 1.96 of it should hold the
            truth about 95 times in 100, and here it does {inside} times in 20. Press re-roll to walk through the seeds; the strip below shows all twenty.
          </ResultCard>
        </Bet>
        <CloudCanvas run={run} narrow={narrow} />
        <div className="e2-strip">
          <div className="e2-panel-title">
            <strong>{all ? "the twenty re-rolls" : "this cloud's price"}</strong>
            <span>tick = the price; thick bar ± one standard error; thin bar ± 1.96 of it; dashed = the formula's {p1(TRUE_CALL)}</span>
          </div>
          <Strip rows={all ?? [run]} current={all ? si : 0} all={!!all} />
        </div>
      </div>
    </Figure>
  );
}
