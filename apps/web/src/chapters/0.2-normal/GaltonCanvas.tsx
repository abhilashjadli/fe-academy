import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { rng } from "../../engine/random";
import { binomialPmf } from "../../engine/discrete";

export interface DropOptions {
  /** balls to drop */
  n: number;
  /** rows per second for the first ball; later balls accelerate (speed ramp) */
  speed?: number;
  /** spawn interval in ms (shrinks with the ramp) */
  interval?: number;
}

export interface GaltonHandle {
  drop(opts: DropOptions): void;
  reset(): void;
  counts(): number[];
}

interface Props {
  rows?: number;
  /** probability of bouncing right at each peg */
  p?: number;
  /** 0 = board (balls fall down), 1 = lattice (time runs left→right) */
  orientation?: number;
  /** dependence: after a right bounce, P(right) becomes p + sticky·(1−p); after a left, p − sticky·p */
  sticky?: number;
  /** per-row bias offsets added to p (for the "uneven pegs" experiment) */
  rowBias?: number[];
  seed?: number;
  /** bucket the learner bet on, if any */
  bet?: number | null;
  onBucketClick?: (k: number) => void;
  onCountsChange?: (counts: number[], dropped: number) => void;
  /** show the expected binomial outline over the buckets */
  showExpected?: boolean;
  height?: number;
  ariaLabel?: string;
}

interface Ball {
  bits: number[];
  t: number; // progress in rows (0..rows+1)
  v: number; // rows per second
  color: string;
}

function cssVar(name: string, el: HTMLElement) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export const GaltonCanvas = forwardRef<GaltonHandle, Props>(function GaltonCanvas(
  { rows = 12, p = 0.5, orientation = 0, sticky = 0, rowBias, seed = 1, bet = null, onBucketClick, onCountsChange, showExpected = false, height = 380, ariaLabel },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balls = useRef<Ball[]>([]);
  const counts = useRef<number[]>(new Array(rows + 1).fill(0));
  const dropped = useRef(0);
  const queue = useRef<{ remaining: number; nextAt: number; interval: number; speed: number; total: number }>({ remaining: 0, nextAt: 0, interval: 0, speed: 0, total: 0 });
  const next = useRef(rng(seed));
  const raf = useRef(0);
  const last = useRef(0);
  const [, force] = useState(0);
  const width = 720;

  useImperativeHandle(ref, () => ({
    drop({ n, speed = 6, interval = 180 }) {
      const q = queue.current;
      q.remaining += n;
      q.total = n;
      q.interval = interval;
      q.speed = speed;
      q.nextAt = 0;
      if (!raf.current) {
        last.current = performance.now();
        raf.current = requestAnimationFrame(tick);
      }
    },
    reset() {
      balls.current = [];
      counts.current = new Array(rows + 1).fill(0);
      dropped.current = 0;
      queue.current.remaining = 0;
      next.current = rng(seed);
      onCountsChange?.(counts.current.slice(), 0);
      draw();
    },
    counts: () => counts.current.slice(),
  }));

  useEffect(() => {
    counts.current = new Array(rows + 1).fill(0);
    balls.current = [];
    dropped.current = 0;
    next.current = rng(seed);
    draw();
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, seed]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation, p, bet, showExpected, sticky, rowBias]);

  const spawn = (speed: number) => {
    const bits: number[] = [];
    let prevRight: number | null = null;
    for (let r = 0; r < rows; r++) {
      let pr = p + (rowBias?.[r] ?? 0);
      if (sticky > 0 && prevRight !== null) pr = prevRight ? pr + sticky * (1 - pr) : pr - sticky * pr;
      const right = next.current() < pr ? 1 : 0;
      bits.push(right);
      prevRight = right;
    }
    balls.current.push({ bits, t: 0, v: speed, color: "" });
  };

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last.current) / 1000);
    last.current = now;
    const q = queue.current;
    // spawn with a speed ramp: the more balls requested, the faster the later ones go
    if (q.remaining > 0 && now >= q.nextAt) {
      const done = q.total - q.remaining;
      const ramp = 1 + Math.min(12, done / 8);
      const perSpawn = Math.max(1, Math.round(ramp / 3));
      for (let i = 0; i < perSpawn && q.remaining > 0; i++) {
        spawn(q.speed * ramp);
        q.remaining--;
      }
      q.nextAt = now + q.interval / ramp;
    }
    let changed = false;
    for (const b of balls.current) {
      b.t += b.v * dt;
      if (b.t >= rows + 1.2) {
        const k = b.bits.reduce((s, x) => s + x, 0);
        counts.current[k]++;
        dropped.current++;
        changed = true;
      }
    }
    if (changed) {
      balls.current = balls.current.filter((b) => b.t < rows + 1.2);
      onCountsChange?.(counts.current.slice(), dropped.current);
    }
    draw();
    if (balls.current.length || q.remaining > 0) raf.current = requestAnimationFrame(tick);
    else {
      raf.current = 0;
      force((x) => x + 1);
    }
  };

  /** position of a ball with given bits at progress t, in board coordinates (x right, y down), unit = peg spacing */
  const pos = (bits: number[], t: number) => {
    const r = Math.floor(t);
    const f = t - r;
    const sumTo = (m: number) => bits.slice(0, m).reduce((s, x) => s + (x ? 1 : -1), 0);
    if (r >= rows) {
      // falling into the bucket
      return { x: sumTo(rows) / 2, y: rows + f * 1.2 };
    }
    const x0 = sumTo(r) / 2;
    const x1 = sumTo(r + 1) / 2;
    // a little arc: ease horizontally, accelerate vertically
    const ex = f < 0.5 ? 0 : (f - 0.5) * 2;
    const x = x0 + (x1 - x0) * ex * ex;
    const y = r + f;
    return { x, y };
  };

  const draw = () => {
    const cv = canvasRef.current;
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
    const el = cv;
    const col = {
      peg: cssVar("--axis", el),
      ball: cssVar("--approx", el),
      ballBet: cssVar("--truth", el),
      bucket: cssVar("--truth", el),
      bucketSoft: cssVar("--truth-soft", el),
      ink: cssVar("--ink-2", el),
      ink3: cssVar("--ink-3", el),
      rule: cssVar("--rule", el),
      expected: cssVar("--error", el),
      bet: cssVar("--error", el),
    };

    // geometry: unit spacing s; board occupies rows+1 units vertically plus bucket zone
    const AX = 1.45; // horizontal peg spacing relative to row spacing
    const bucketZone = 3.6; // units
    const unitsY = rows + 1 + bucketZone;
    const unitsX = (rows + 2) * AX;
    const theta = (-Math.PI / 2) * orientation; // rotate board so "down" becomes "right"
    // scale so that the rotated drawing fits
    const sBoard = Math.min((height - 40) / unitsY, (width - 60) / unitsX);
    const sLattice = Math.min((height - 50) / unitsX, (width - 80) / unitsY);
    const s = sBoard + (sLattice - sBoard) * orientation;
    const cx = width / 2 + (orientation * -width) / 2 + orientation * 70;
    const cy = 20 + (orientation * (height / 2 - 20));

    ctx.save();
    // board origin at the top peg; translate so the rotated board is centred
    const ox = orientation * 0 + cx;
    const oy = cy;
    ctx.translate(ox, oy);
    ctx.rotate(theta);
    ctx.translate(0, orientation * (-unitsX / 2) * s * 0 + 0);
    // in lattice orientation, the "top" of the board is on the left; shift so the triangle is vertically centred
    ctx.translate(0, 0);

    const X = (u: number) => u * s * AX;
    const Y = (u: number) => u * s;

    // pegs
    ctx.fillStyle = col.peg;
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k <= r; k++) {
        ctx.beginPath();
        ctx.arc(X(k - r / 2), Y(r), 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // in lattice orientation, draw faint lattice edges
    if (orientation > 0.5) {
      ctx.strokeStyle = col.rule;
      ctx.globalAlpha = (orientation - 0.5) * 2 * 0.9;
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k <= r; k++) {
          const x = X(k - r / 2);
          ctx.beginPath();
          ctx.moveTo(x, Y(r));
          ctx.lineTo(X(k - r / 2 - 0.5), Y(r + 1));
          ctx.moveTo(x, Y(r));
          ctx.lineTo(X(k - r / 2 + 0.5), Y(r + 1));
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    // buckets
    const maxCount = Math.max(1, ...counts.current);
    const total = Math.max(1, dropped.current);
    const bucketTop = Y(rows + 1);
    const bucketH = bucketZone * s - 8;
    const bw = s * AX * 0.82;
    for (let k = 0; k <= rows; k++) {
      const x = X(k - rows / 2);
      // outline
      ctx.strokeStyle = col.rule;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - bw / 2, bucketTop, bw, bucketH);
      // fill
      const h = (counts.current[k] / maxCount) * (bucketH - 4);
      ctx.fillStyle = k === bet ? col.bet : col.bucket;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x - bw / 2 + 1, bucketTop + 1, bw - 2, h);
      ctx.globalAlpha = 1;
      if (bet === k) {
        ctx.strokeStyle = col.bet;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - bw / 2, bucketTop, bw, bucketH);
      }
      // label (counter-rotated so it reads upright)
      ctx.save();
      ctx.translate(x, bucketTop + bucketH + 12);
      ctx.rotate(-theta);
      ctx.fillStyle = col.ink3;
      ctx.font = "10px IBM Plex Sans, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (orientation < 0.5) ctx.fillText(String(k), 0, 0);
      ctx.restore();
    }
    // expected outline
    if (showExpected && dropped.current > 0) {
      const pm = binomialPmf(rows, p);
      const maxP = Math.max(...pm);
      const scale = (maxCount / total) / maxP;
      ctx.strokeStyle = col.expected;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let k = 0; k <= rows; k++) {
        const x = X(k - rows / 2);
        const h = Math.min(1, pm[k] * scale * total / maxCount) * (bucketH - 4);
        if (k === 0) ctx.moveTo(x - bw / 2, bucketTop + h);
        ctx.lineTo(x - bw / 2, bucketTop + h);
        ctx.lineTo(x + bw / 2, bucketTop + h);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // balls
    for (const b of balls.current) {
      const { x, y } = pos(b.bits, b.t);
      ctx.fillStyle = col.ball;
      ctx.beginPath();
      ctx.arc(X(x), Y(y), Math.max(3, s * 0.26), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // axis labels for the lattice
    if (orientation > 0.5) {
      ctx.globalAlpha = (orientation - 0.5) * 2;
      ctx.fillStyle = col.ink;
      ctx.font = "12px IBM Plex Sans, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("time →", 16, height - 10);
      ctx.save();
      ctx.translate(14, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("price ↑", 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  };

  // click → bucket (board orientation only)
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onBucketClick || orientation > 0.5) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const py = ((e.clientY - rect.top) / rect.height) * height;
    const AX = 1.45;
    const bucketZone = 3.6;
    const unitsY = rows + 1 + bucketZone;
    const unitsX = (rows + 2) * AX;
    const s = Math.min((height - 40) / unitsY, (width - 60) / unitsX);
    const cx = width / 2;
    const top = 20 + (rows + 1) * s;
    if (py < top) return;
    const k = Math.round((px - cx) / (s * AX) + rows / 2);
    if (k >= 0 && k <= rows) onBucketClick(k);
  };

  return <canvas ref={canvasRef} className="plot" style={{ width: "100%", height: "auto", aspectRatio: `${width} / ${height}`, cursor: onBucketClick && orientation < 0.5 ? "pointer" : "default" }} onClick={onClick} role="img" aria-label={ariaLabel} />;
});
