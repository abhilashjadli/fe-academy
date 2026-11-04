import { useEffect, useRef } from "react";
import { ROW, n0 } from "./row";
import { D_MAX, F_MAX, F_MIN, clampD, clampF, snapD, snapF, surfaceGrid } from "./surface";
import type { Probe } from "./Surface3D";

/**
 * The fallback for Figure 2 when WebGL is unavailable: the same surface as a heat-map of V over (index, days left),
 * the ridge dashed, the same draggable probe and the same slice line. Canvas 2-D only.
 */
export function HeatMap({ probe, onProbe, alongTime, height = 360 }: { probe: Probe; onProbe: (p: Probe) => void; alongTime: boolean; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const probeRef = useRef(probe);
  probeRef.current = probe;

  useEffect(() => {
    const cv = ref.current,
      host = box.current;
    if (!cv || !host) return;
    const M = { l: 52, r: 14, t: 14, b: 34 };
    let w = 0,
      h = 0;
    const xOf = (F: number) => M.l + ((F - F_MIN) / (F_MAX - F_MIN)) * (w - M.l - M.r);
    const yOf = (d: number) => M.t + ((D_MAX - d) / D_MAX) * (h - M.t - M.b); // 11 d at the bottom (the front), expiry at the top
    const draw = () => {
      const cs = getComputedStyle(document.documentElement);
      const get = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
      const ink = get("--ink", "#1b2430"),
        ink3 = get("--ink-3", "#7a8594"),
        err = get("--error", "#c8325f"),
        truth = get("--truth", "#2f5bea"),
        raised = get("--surface-raised", "#fff");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = height;
      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.width = w + "px";
      cv.style.height = h + "px";
      const g = cv.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      // cells
      const grid = surfaceGrid();
      const iw = (w - M.l - M.r) / (grid.nx - 1),
        ih = (h - M.t - M.b) / (grid.nz - 1);
      const c0 = parse(raised),
        c1 = parse(truth);
      for (let j = 0; j < grid.nz; j++)
        for (let i = 0; i < grid.nx; i++) {
          const u = Math.sqrt(grid.v[j * grid.nx + i] / grid.vmax);
          g.fillStyle = `rgb(${mix(c0[0], c1[0], u)},${mix(c0[1], c1[1], u)},${mix(c0[2], c1[2], u)})`;
          g.fillRect(M.l + (i - 0.5) * iw, M.t + (grid.nz - 1 - j - 0.5) * ih, iw + 0.5, ih + 0.5);
        }
      g.save();
      g.beginPath();
      g.rect(M.l, M.t, w - M.l - M.r, h - M.t - M.b);
      g.clip();
      // ridge
      g.setLineDash([5, 4]);
      g.strokeStyle = ink;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(xOf(ROW.K), M.t);
      g.lineTo(xOf(ROW.K), h - M.b);
      g.stroke();
      g.setLineDash([]);
      // slice line
      const p = probeRef.current;
      g.strokeStyle = ink;
      g.lineWidth = 2;
      g.beginPath();
      if (!alongTime) {
        g.moveTo(M.l, yOf(p.days));
        g.lineTo(w - M.r, yOf(p.days));
      } else {
        g.moveTo(xOf(p.F), M.t);
        g.lineTo(xOf(p.F), h - M.b);
      }
      g.stroke();
      // probe
      g.fillStyle = err;
      g.strokeStyle = raised;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(xOf(p.F), yOf(p.days), 7, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.restore();
      // axes
      g.fillStyle = ink3;
      g.font = "11px IBM Plex Sans, system-ui, sans-serif";
      g.textAlign = "center";
      for (const F of [22000, 22600, 23000]) g.fillText(n0(F), xOf(F), h - M.b + 14);
      g.textAlign = "right";
      g.fillText("index →", w - M.r, h - M.b + 28);
      for (const d of [0, 5, 11]) g.fillText(d === 0 ? "expiry" : d + " d", M.l - 6, yOf(d) + 4);
      g.save();
      g.translate(12, (M.t + h - M.b) / 2);
      g.rotate(-Math.PI / 2);
      g.textAlign = "center";
      g.fillText("days left", 0, 0);
      g.restore();
      g.textAlign = "left";
      g.fillStyle = ink;
      g.fillText("darker = higher price", M.l + 4, M.t + 12);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(host);
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", draw);
    (cv as HTMLCanvasElement & { __draw?: () => void }).__draw = draw;
    return () => {
      ro.disconnect();
      mo.disconnect();
      mq.removeEventListener("change", draw);
    };
  }, [alongTime, height]);

  useEffect(() => {
    (ref.current as (HTMLCanvasElement & { __draw?: () => void }) | null)?.__draw?.();
  }, [probe.F, probe.days]);

  const pickAt = (e: React.PointerEvent) => {
    const cv = ref.current!;
    const r = cv.getBoundingClientRect();
    const M = { l: 52, r: 14, t: 14, b: 34 };
    const F = F_MIN + ((e.clientX - r.left - M.l) / (r.width - M.l - M.r)) * (F_MAX - F_MIN);
    const d = D_MAX - ((e.clientY - r.top - M.t) / (r.height - M.t - M.b)) * D_MAX;
    onProbe({ F: snapF(clampF(F)), days: snapD(clampD(d)) });
  };
  const down = useRef(false);
  const onKey = (e: React.KeyboardEvent) => {
    const m = e.shiftKey ? 4 : 1;
    let { F, days } = probe;
    if (e.key === "ArrowLeft") F -= 25 * m;
    else if (e.key === "ArrowRight") F += 25 * m;
    else if (e.key === "ArrowUp") days -= 0.5 * m;
    else if (e.key === "ArrowDown") days += 0.5 * m;
    else return;
    e.preventDefault();
    onProbe({ F: snapF(clampF(F)), days: snapD(clampD(days)) });
  };
  return (
    <div ref={box} className="c4-heat-box" tabIndex={0} onKeyDown={onKey} aria-label="price heat-map; arrow keys move the probe">
      <canvas
        ref={ref}
        role="img"
        aria-label="The call price as a heat-map over the index and the days left; drag to move the probe"
        onPointerDown={(e) => {
          down.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          pickAt(e);
        }}
        onPointerMove={(e) => {
          if (down.current) pickAt(e);
        }}
        onPointerUp={() => {
          down.current = false;
        }}
        onPointerCancel={() => {
          down.current = false;
        }}
      />
    </div>
  );
}

function parse(c: string): [number, number, number] {
  const m = c.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const r = c.match(/rgba?\(([^)]+)\)/);
  if (r) {
    const [a, b, d] = r[1].split(",").map((x) => parseFloat(x));
    return [a, b, d];
  }
  return [128, 128, 128];
}
const mix = (a: number, b: number, u: number) => Math.round(a + (b - a) * u);
