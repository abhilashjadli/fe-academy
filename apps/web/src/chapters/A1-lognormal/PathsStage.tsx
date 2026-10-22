import { useEffect, useRef } from "react";
import type { Savers } from "./sim";

interface Props {
  savers: Savers;
  /** fractional day to draw up to */
  day: number;
  /** which saver(s) to show */
  showAda: boolean;
  showMel: boolean;
  width?: number;
  height?: number;
  yDomain?: [number, number];
  /** emphasise one path index */
  highlight?: number | null;
}

/** Canvas stage drawing many paths up to a given day; pure function of its props. */
export function PathsStage({ savers, day, showAda, showMel, width = 560, height = 320, yDomain = [40, 180], highlight = null }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== width * dpr) {
      cv.width = width * dpr;
      cv.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const cs = getComputedStyle(cv);
    const col = { ada: cs.getPropertyValue("--truth").trim(), mel: cs.getPropertyValue("--approx").trim(), grid: cs.getPropertyValue("--grid").trim(), axis: cs.getPropertyValue("--axis").trim(), ink: cs.getPropertyValue("--ink-3").trim() };
    const m = { l: 40, r: 10, t: 10, b: 26 };
    const days = savers.ada[0].length - 1;
    const X = (d: number) => m.l + ((width - m.l - m.r) * d) / days;
    const Y = (v: number) => m.t + ((height - m.t - m.b) * (yDomain[1] - v)) / (yDomain[1] - yDomain[0]);
    // grid
    ctx.strokeStyle = col.grid;
    ctx.lineWidth = 1;
    for (let v = Math.ceil(yDomain[0] / 20) * 20; v <= yDomain[1]; v += 20) {
      ctx.beginPath();
      ctx.moveTo(m.l, Y(v));
      ctx.lineTo(width - m.r, Y(v));
      ctx.stroke();
      ctx.fillStyle = col.ink;
      ctx.font = "11px IBM Plex Sans, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(v), m.l - 6, Y(v) + 4);
    }
    ctx.strokeStyle = col.axis;
    ctx.beginPath();
    ctx.moveTo(m.l, Y(100));
    ctx.lineTo(width - m.r, Y(100));
    ctx.stroke();
    ctx.fillStyle = col.ink;
    ctx.textAlign = "center";
    for (const d of [0, 50, 100, 150, 200]) ctx.fillText(String(d), X(d), height - 8);
    ctx.textAlign = "right";
    ctx.fillText("day 250", width - m.r, height - 8);
    // paths
    const drawSet = (set: Float32Array[], color: string) => {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      const dFull = Math.floor(day);
      const frac = day - dFull;
      for (let p = 0; p < set.length; p++) {
        if (p === highlight) continue;
        const s = set[p];
        ctx.beginPath();
        ctx.moveTo(X(0), Y(s[0]));
        for (let d = 1; d <= dFull && d <= days; d++) ctx.lineTo(X(d), Y(s[d]));
        if (dFull < days && frac > 0) ctx.lineTo(X(dFull + frac), Y(s[dFull] + (s[dFull + 1] - s[dFull]) * frac));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (highlight !== null && set[highlight]) {
        const s = set[highlight];
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(X(0), Y(s[0]));
        for (let d = 1; d <= dFull && d <= days; d++) ctx.lineTo(X(d), Y(s[d]));
        ctx.stroke();
      }
    };
    if (showAda) drawSet(savers.ada, col.ada);
    if (showMel) drawSet(savers.mel, col.mel);
    // day cursor
    if (day > 0 && day < days) {
      ctx.strokeStyle = col.axis;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(X(day), m.t);
      ctx.lineTo(X(day), height - m.b);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [savers, day, showAda, showMel, width, height, yDomain, highlight]);
  return <canvas ref={ref} className="plot" style={{ width: "100%", height: "auto", aspectRatio: `${width} / ${height}` }} role="img" aria-label="Many simulated balance paths" />;
}
