import "./figures.css";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Readouts, Slider, Toggle } from "../../../ui/controls";
import { BELL_EXTREME, BELL_VAR99, BEYOND_BELL, BEYOND_BELL_EXTREME, DATES, HIST99, KEY, N, NOTIONAL, PNL, RANK, SD, bellAtRank, ceilPct, count, fmtDate, lakh, lakhSigned, rs, useNarrow } from "./e1";

/**
 * Figure 0 — sort the days. The 2,683 real days of ₹1 crore long NIFTY as a strip of bars in date order, drawn on a canvas.
 * Bet first (99 days in 100 you lose less than —?). The scrubber slides every bar from its date to its rank (the 3b1b brick-row
 * move) and the pile appears; the VaR line is the height of the 27th bar, the ES line the mean of those 27. Toggle: the bell of
 * the record's width laid over the pile as its own quantile curve, with its 1 % line and the count of real days beyond it.
 */

type Pick = "1" | "2.5" | "5" | "10";
const OPTIONS: Array<{ id: Pick; label: string; v: number }> = [
  { id: "1", label: "₹1 lakh", v: 1e5 },
  { id: "2.5", label: "₹2.5 lakh", v: 2.5e5 },
  { id: "5", label: "₹5 lakh", v: 5e5 },
  { id: "10", label: "₹10 lakh", v: 10e5 },
];
const VAR = HIST99.var;
const ES = HIST99.es;
const K = HIST99.k;
const nearestOption = OPTIONS.reduce((b, o) => (Math.abs(o.v - VAR) < Math.abs(b.v - VAR) ? o : b), OPTIONS[0]);

const Y_MIN = -13.5e5;
const INSET_N = 60;
const Y_MAX = 9.5e5;
const YEARS = ["2016", "2018", "2020", "2022", "2024", "2026"];

function cssVar(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export function F0Sort() {
  const narrow = useNarrow();
  const [pick, setPick] = useBet<Pick>("e1-f0");
  const [t, setT] = useState(0);
  const [bell, setBell] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(880);
  const height = narrow ? 260 : 330;
  const anim = useRef<number | null>(null);

  // the reveal: once the bet is placed, the bars slide into the pile
  const placed = !!pick;
  useEffect(() => {
    if (!placed) {
      setT(0);
      return;
    }
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setT(1);
      return;
    }
    const t0 = performance.now();
    const dur = 1800;
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / dur);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      setT(e);
      if (u < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
    return () => {
      if (anim.current) cancelAnimationFrame(anim.current);
    };
  }, [placed]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((es) => {
      for (const e of es) setWidth(Math.max(280, Math.floor(e.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // geometry (CSS pixels)
  const M = { left: narrow ? 8 : 10, right: narrow ? 8 : 10, top: 22, bottom: 24 };
  const innerW = width - M.left - M.right;
  const innerH = height - M.top - M.bottom;
  const yOf = useCallback((v: number) => M.top + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * innerH, [M.top, innerH]);
  const xOfDate = useCallback((i: number) => M.left + ((i + 0.5) / N) * innerW, [M.left, innerW]);
  const rankOf = useRef<Int32Array | null>(null);
  if (!rankOf.current) {
    const r = new Int32Array(N);
    RANK.forEach((idx, rank) => (r[idx] = rank));
    rankOf.current = r;
  }
  const xOf = useCallback(
    (i: number, tt: number) => {
      const xd = xOfDate(i);
      const xr = M.left + ((rankOf.current![i] + 0.5) / N) * innerW;
      return xd + (xr - xd) * tt;
    },
    [xOfDate, M.left, innerW],
  );

  const insetBox = useCallback(() => {
    const x = M.left + innerW * (narrow ? 0.3 : 0.42);
    const y = yOf(-ES) + (narrow ? 22 : 30);
    return { x, y, w: M.left + innerW - 6 - x, h: height - M.bottom - 24 - y };
  }, [M.left, M.bottom, innerW, yOf, height, narrow]);

  // draw
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
      error: cssVar(c, "--error"),
      truth: cssVar(c, "--truth"),
      ghost: cssVar(c, "--ghost"),
      ink: cssVar(c, "--ink"),
      ink2: cssVar(c, "--ink-2"),
      ink3: cssVar(c, "--ink-3"),
      rule: cssVar(c, "--rule"),
      raised: cssVar(c, "--surface-raised"),
      approx: cssVar(c, "--approx"),
      approxText: cssVar(c, "--approx-text"),
      errorText: cssVar(c, "--error-text"),
      truthText: cssVar(c, "--truth-text"),
    };
    const font = (w: number | string, s: number) => `${w} ${s}px ${cssVar(c, "--font-ui") || "system-ui"}`;
    const y0 = yOf(0);
    const bw = Math.max(0.6, innerW / N);

    // zero line
    ctx.strokeStyle = col.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M.left, y0 + 0.5);
    ctx.lineTo(M.left + innerW, y0 + 0.5);
    ctx.stroke();

    // faint height marks
    ctx.font = font(400, 10.5);
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    for (const v of [-10e5, -5e5, 5e5]) {
      ctx.fillStyle = col.ink3;
      ctx.globalAlpha = 0.8;
      ctx.fillText(v > 0 ? "+₹5 lakh" : v === -5e5 ? "−₹5 lakh" : "−₹10 lakh", M.left + 2, yOf(v));
      ctx.globalAlpha = 1;
    }

    // bars
    const worstSet = new Set(HIST99.worst);
    for (let i = 0; i < N; i++) {
      const v = PNL[i];
      const x = xOf(i, t);
      const y1 = yOf(v);
      const isTail = worstSet.has(i);
      ctx.fillStyle = v < 0 ? col.error : col.truth;
      ctx.globalAlpha = isTail ? 0.95 : v < 0 ? 0.5 : 0.4;
      if (hover === i) ctx.globalAlpha = 1;
      ctx.fillRect(x - bw / 2, Math.min(y0, y1), bw, Math.abs(y1 - y0));
    }
    ctx.globalAlpha = 1;

    // axes: years fade out with t, ranks fade in
    ctx.font = font(400, 11);
    ctx.textBaseline = "top";
    if (t < 1) {
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = col.ink3;
      ctx.textAlign = "center";
      for (const y of YEARS) {
        const i = DATES.findIndex((d) => d >= y + "-01-01");
        if (i < 0) continue;
        ctx.textAlign = i === 0 ? "left" : "center";
        ctx.fillText(y, xOfDate(i), height - M.bottom + 7);
      }
      ctx.globalAlpha = 1;
    }
    if (t > 0) {
      ctx.globalAlpha = t;
      ctx.fillStyle = col.ink3;
      ctx.textAlign = "left";
      ctx.fillText("worst day", M.left, height - M.bottom + 7);
      ctx.textAlign = "right";
      ctx.fillText("best day", M.left + innerW, height - M.bottom + 7);
      ctx.textAlign = "center";
      ctx.fillText(`the ${count(N)} days, sorted`, M.left + innerW / 2, height - M.bottom + 7);
      ctx.globalAlpha = 1;
    }

    if (placed) {
      // the bell's quantile curve over the pile (fades in with t)
      if (bell && t > 0) {
        ctx.globalAlpha = t;
        ctx.strokeStyle = col.approx;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let r = 0; r < N; r += 2) {
          const x = M.left + ((r + 0.5) / N) * innerW;
          const y = yOf(Math.max(Y_MIN, Math.min(Y_MAX, bellAtRank(r))));
          if (r === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // VaR and ES lines
      const line = (v: number, color: string, text: string, dash: number[], side: "above" | "below") => {
        const y = yOf(-v);
        ctx.setLineDash(dash);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(M.left, y + 0.5);
        ctx.lineTo(M.left + innerW, y + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = font(600, narrow ? 10.5 : 12);
        ctx.textAlign = "right";
        ctx.textBaseline = side === "above" ? "bottom" : "top";
        ctx.fillStyle = color;
        ctx.fillText(text, M.left + innerW - 4, side === "above" ? y - 3 : y + 4);
      };
      line(VAR, col.errorText, narrow ? `VaR ${lakh(VAR)} · ${K}th worst` : `VaR ${lakh(VAR)} — the ${K}th worst day of ${count(N)}`, [], "above");
      line(ES, col.ink2, narrow ? `ES ${lakh(ES)}` : `ES ${lakh(ES)} — the mean of those ${K}`, [6, 4], "below");
      if (bell) line(BELL_VAR99, col.approxText, narrow ? `the bell's 1 % ${lakh(BELL_VAR99)}` : `the bell's 1 % line ${lakh(BELL_VAR99)} — ${BEYOND_BELL} real days beyond it`, [2, 3], "above");
      // the worst bars, enlarged (the pile squeezes them into 1 % of the width)
      if (t > 0.98) {
        const ib = insetBox();
        ctx.fillStyle = col.raised;
        ctx.strokeStyle = col.rule;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(ib.x, ib.y, ib.w, ib.h, 3);
        ctx.fill();
        ctx.stroke();
        const iy = (v: number) => ib.y + 16 + ((-v) / -Y_MIN) * (ib.h - 22);
        const ibw = (ib.w - 12) / INSET_N;
        for (let r = 0; r < INSET_N; r++) {
          const i = RANK[r];
          const x = ib.x + 6 + r * ibw;
          ctx.fillStyle = col.error;
          ctx.globalAlpha = r < K ? 0.95 : 0.45;
          if (hover === i) ctx.globalAlpha = 1;
          ctx.fillRect(x + 0.5, iy(0), Math.max(1, ibw - 1), iy(PNL[i]) - iy(0));
        }
        ctx.globalAlpha = 1;
        const hline = (v: number, color: string, dash: number[]) => {
          ctx.setLineDash(dash);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ib.x + 4, iy(-v) + 0.5);
          ctx.lineTo(ib.x + ib.w - 4, iy(-v) + 0.5);
          ctx.stroke();
          ctx.setLineDash([]);
        };
        hline(VAR, col.errorText, []);
        hline(ES, col.ink2, [5, 3]);
        if (bell) hline(BELL_VAR99, col.approxText, [2, 3]);
        // the 27th bar
        const x27 = ib.x + 6 + (K - 0.5) * ibw;
        ctx.strokeStyle = col.ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x27 + 0.5, iy(-VAR) + 2);
        ctx.lineTo(x27 + 0.5, ib.y + ib.h - 4);
        ctx.stroke();
        ctx.font = font(600, 10.5);
        ctx.fillStyle = col.ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`the ${K}th bar`, x27 + 4, ib.y + ib.h - 15);
        ctx.font = font(400, 10.5);
        ctx.fillStyle = col.ink3;
        ctx.fillText(`the worst ${INSET_N} bars, enlarged`, ib.x + 6, ib.y + 4);
      }
    // hover tip
    if (hover !== null) {
      const x = xOf(hover, t);
      const v = PNL[hover];
      const lines = [fmtDate(DATES[hover]), `${lakhSigned(v)} on ₹1 crore`];
      ctx.font = font(400, 11.5);
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 14;
      const h = 8 + lines.length * 15;
      let px = x + 10;
      if (px + w > M.left + innerW) px = x - 10 - w;
      const py = Math.max(M.top, Math.min(yOf(v) - h / 2, M.top + innerH - h));
      ctx.fillStyle = col.raised;
      ctx.strokeStyle = col.rule;
      ctx.beginPath();
      ctx.roundRect(px, py, w, h, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col.ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      lines.forEach((l, i) => ctx.fillText(l, px + 7, py + 5 + i * 15));
      // the hovered bar, outlined
      ctx.strokeStyle = col.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - Math.max(1, bw / 2) - 0.5, Math.min(y0, yOf(v)) - 0.5, Math.max(2, bw) + 1, Math.abs(yOf(v) - y0) + 1);
    }
  }, [width, height, t, bell, hover, placed, narrow, xOf, xOfDate, yOf, innerW, innerH, M.left, M.top, M.bottom, insetBox]);

  // redraw when the theme flips (the canvas reads CSS variables)
  const [, bump] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => bump((v) => v + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => bump((v) => v + 1);
    mq.addEventListener("change", on);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", on);
    };
  }, []);

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (py < M.top - 4 || py > height - M.bottom + 4) {
      setHover(null);
      return;
    }
    if (placed && t > 0.98) {
      const ib = insetBox();
      if (px >= ib.x && px <= ib.x + ib.w && py >= ib.y && py <= ib.y + ib.h) {
        const r = Math.floor((px - ib.x - 6) / ((ib.w - 12) / INSET_N));
        setHover(r >= 0 && r < INSET_N ? RANK[r] : null);
        return;
      }
    }
    let best = -1;
    let bd = 6;
    for (let i = 0; i < N; i++) {
      const d = Math.abs(xOf(i, t) - px);
      if (d < bd) {
        bd = d;
        best = i;
      } else if (d === bd && best >= 0 && Math.abs(PNL[i]) > Math.abs(PNL[best])) best = i;
    }
    setHover(best >= 0 ? best : null);
  };

  const yoursLabel = OPTIONS.find((o) => o.id === pick)?.label ?? "";
  const verdict = pick === nearestOption.id ? "right" : pick === "1" || pick === "5" ? "close" : "miss";
  const beyondText = bell ? `${K} real · ${BEYOND_BELL} beyond the bell's line` : `${K} of ${count(N)}`;

  return (
    <Figure
      n="0"
      prompt={
        <>
          Ten years of one position: ₹1 crore long NIFTY, every trading day from {fmtDate(KEY.record.first)} to {fmtDate(KEY.record.last)} (real). Each bar is one day's profit or loss. Make
          your bet, then slide the days into a pile.
        </>
      }
      controls={
        <>
          <Slider label="sort the days" value={t} min={0} max={1} step={0.01} onChange={setT} locked={!placed} fmt={(v) => (v < 0.02 ? "by date" : v > 0.98 ? "by size" : `${Math.round(100 * v)} %`)} />
          <Toggle label="the bell" on={bell} onChange={setBell} />
          <Readouts items={[["VaR 99 %", placed ? lakh(VAR) : "—"], ["ES 99 %", placed ? lakh(ES) : "—"], ["days beyond", placed ? beyondText : "—"]]} />
        </>
      }
      observe={
        <>
          ₹1 crore long NIFTY, {count(N)} trading days {KEY.record.first} → {KEY.record.last} (real); P&L = ₹1 crore × (e<sup>r</sup> − 1); VaR = the {K}th worst day (⌈1 % × {count(N)}⌉ = {ceilPct(0.01, N)}),{" "}
          {rs(KEY.record.hist_var99)}; ES = the mean of those {K}, {rs(KEY.record.hist_es99)}. The bell: a normal of the record's own width, {lakh(SD)} a day; its 1 % line is 2.33 widths,{" "}
          {rs(KEY.record.param_var99)}, and {KEY.record.beyond_bell_99} real days lie beyond it where it promised {ceilPct(0.01, N)}. Its own worst day on a record this long would be about{" "}
          {lakh(BELL_EXTREME)}; the pile has {BEYOND_BELL_EXTREME} bars beyond that, the worst at {lakhSigned(-KEY.record.worst[0].loss)} on {fmtDate(KEY.record.worst[0].date)}.
        </>
      }
    >
      <div className="e1-sort">
        <Bet<Pick> question={<>On 99 days in 100, you lose less than —</>} options={OPTIONS.map((o) => ({ id: o.id, label: o.label }))} pick={pick} onPick={setPick}>
          <ResultCard yours={yoursLabel} answer={<>{lakh(VAR)} — the {K}th worst of {count(N)} real days ({rs(VAR)} to the rupee)</>} verdict={verdict}>
            Sort the days by size and count {K} in from the worst: that bar's height is the 99 % one-day Value at Risk. It is a rank in a pile of real days, not a formula. The {K} bars beyond it
            average {lakh(ES)} — the Expected Shortfall: when it is worse than the line, this is how much worse, on average. Hover any bar to see its date.
          </ResultCard>
        </Bet>
        <div className="e1-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="e1-canvas"
            style={{ width, height }}
            role="img"
            aria-label={`${count(N)} daily P&L bars of ₹1 crore long NIFTY, in date order or sorted by size, with the 99 % VaR line at ${lakh(VAR)} and the ES line at ${lakh(ES)}`}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </div>
        <div className="e1-legend">
          <span>
            <i className="e1-sw" style={{ background: "var(--error)" }} /> losing days
          </span>
          <span>
            <i className="e1-sw" style={{ background: "var(--truth)" }} /> winning days
          </span>
          {bell && (
            <span>
              <i className="e1-sw line" style={{ background: "var(--approx)" }} /> the bell, same width ({lakh(SD)} sd), as a sorted pile
            </span>
          )}
          <span className="e1-quiet">notional {rs(NOTIONAL)}</span>
        </div>
      </div>
    </Figure>
  );
}
