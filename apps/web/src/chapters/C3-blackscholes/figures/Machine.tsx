import { useMemo } from "react";
import { black76, impliedVolFwd, type Kind } from "../../../engine/bs";
import { BASE, ROW, SNAP_RUPEES, n0, n2, pct1, s2 } from "./c3";

/**
 * The sealed machine of Figures 0 and 4: four inputs filled and locked, one dial (rendered by the figure, in its
 * controls row), and what it prints — the model price, the screen's price, and a gap meter between them.
 */

export interface Target {
  K: number;
  kind: Kind;
  /** the screen's last traded price */
  screen: number;
}

export function modelPrice(t: Target, sigma: number) {
  return black76({ ...BASE, K: t.K, sigma }, t.kind);
}

/** The exact dial setting that prints the screen's price (Newton from 30 %, the engine's root). */
export function exactIv(t: Target) {
  return impliedVolFwd(t.screen, { ...BASE, K: t.K }, t.kind, 0.3).sigma;
}

/**
 * A detent on the dial: coming in from outside, a setting that prints within ₹2 of the screen snaps to the root, so a
 * finger on a phone can land it; once on the root, the next nudge is free to leave.
 */
export function detent(next: number, prev: number, t: Target): number {
  const root = exactIv(t);
  if (Math.abs(prev - root) < 1e-9) return next;
  if (Math.abs(modelPrice(t, next) - t.screen) < 2) return root;
  return next;
}

export function GapMeter({ gap, good }: { gap: number; good: boolean }) {
  const W = 240,
    H = 22,
    cx = W / 2,
    span = 250;
  const px = (cx - 4) * Math.max(-1, Math.min(1, gap / span));
  return (
    <svg className="c3-gap" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`gap between the machine and the screen: ${s2(gap)} rupees`}>
      <line x1={4} x2={W - 4} y1={H / 2} y2={H / 2} stroke="var(--rule)" />
      <line x1={cx} x2={cx} y1={3} y2={H - 3} stroke="var(--ink-3)" />
      <rect x={Math.min(cx, cx + px)} y={H / 2 - 5} width={Math.max(2, Math.abs(px))} height={10} rx={2} fill={good ? "var(--truth)" : "var(--error)"} opacity={good ? 1 : 0.8} />
      <text x={6} y={H - 1} fontSize="8.5" fill="var(--ink-3)" fontFamily="var(--font-ui)">
        too cheap
      </text>
      <text x={W - 6} y={H - 1} fontSize="8.5" fill="var(--ink-3)" fontFamily="var(--font-ui)" textAnchor="end">
        too dear
      </text>
    </svg>
  );
}

export function Machine({ target, sigma, sealed = true }: { target: Target; sigma: number; sealed?: boolean }) {
  const model = useMemo(() => modelPrice(target, sigma), [target, sigma]);
  const gap = model - target.screen;
  const good = Math.abs(gap) < SNAP_RUPEES;
  return (
    <div className={"c3-machine " + (good ? "snapped" : "")}>
      <div className="c3-machine-head">
        <strong>the machine</strong>
        <span>{sealed ? "sealed — four inputs locked, one dial" : "open"}</span>
      </div>
      <div className="c3-locks" aria-label="the four locked inputs">
        <span className="c3-lock">
          <span className="k">forward</span>
          <span className="v">{n0(ROW.F)}</span>
        </span>
        <span className="c3-lock">
          <span className="k">strike</span>
          <span className="v">{n0(target.K)}</span>
        </span>
        <span className="c3-lock">
          <span className="k">time</span>
          <span className="v">{ROW.days} days</span>
        </span>
        <span className="c3-lock">
          <span className="k">interest</span>
          <span className="v">{pct1(ROW.r)}</span>
        </span>
      </div>
      <div className="c3-out">
        <div className="c3-tile">
          <span className="k">the machine prints</span>
          <span className={"v " + (good ? "c3-truth" : "")}>{n2(model)}</span>
          <span className="k">{target.kind} at {n0(target.K)}, wobble {pct1(sigma)}</span>
        </div>
        <div className="c3-tile">
          <span className="k">the screen says</span>
          <span className="v">{n2(target.screen)}</span>
          <span className="k">NSE, 23 Oct 2026</span>
        </div>
        <div className={"c3-tile c3-tile-gap " + (good ? "good" : "")}>
          <span className="k">gap, machine − screen</span>
          <span className="v">{s2(gap)}</span>
          <GapMeter gap={gap} good={good} />
        </div>
      </div>
    </div>
  );
}
