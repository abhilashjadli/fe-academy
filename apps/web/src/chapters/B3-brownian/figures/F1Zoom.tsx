import { useMemo, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Plot, type Pt } from "../../../ui/Plot";
import { Readouts, Slider, Toggle } from "../../../ui/controls";
import { bridgeMidpoint } from "../../../engine/brownian";
import { normalSample, rng } from "../../../engine/random";
import { n2, n3, useNarrow, zoomLabel } from "./b3";
import "./figures.css";

/**
 * Figure 1 — the zoom that never straightens. One scrubber (×1 → ×10,000) drives two pictures with the same axes: a smooth curve
 * on the left, a random path on the right. The zoom is a camera zoom — both axes shrink by the same factor — so the smooth curve
 * becomes its tangent by ×10 while the random path bursts out of the frame: its swing over a window shrinks only like the square
 * root of the window. The path grows new detail as you zoom, repeatably: every midpoint is a Brownian bridge draw seeded by its
 * position (engine bridgeMidpoint), so zooming out and back in shows the same wiggles. The toggle shrinks the height by √zoom
 * instead, and then every zoom level is the same picture.
 */

const T0 = 0.5; // the point we zoom on (dyadic, so the random path has an exact value there)
const SEED = 1903;
const f = (t: number) => 0.5 + 0.35 * Math.sin(3 * t - 1); // the smooth curve; slope at T0 is 1.05·cos(0.5)

/** A Brownian path on [0, 1] defined at every dyadic point, lazily: W(k/2^L). */
class DyadicPath {
  private memo = new Map<string, number>();
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
    this.memo.set("0:0", 0);
    this.memo.set("0:1", normalSample(rng(seed)));
  }
  at(L: number, k: number): number {
    if (L > 0 && k % 2 === 0) return this.at(L - 1, k / 2);
    const key = L + ":" + k;
    const hit = this.memo.get(key);
    if (hit !== undefined) return hit;
    const wl = this.at(L - 1, (k - 1) / 2),
      wr = this.at(L - 1, (k + 1) / 2);
    const dt = 1 / 2 ** (L - 1);
    const z = normalSample(rng((this.seed ^ (L << 24) ^ k) >>> 0));
    const v = bridgeMidpoint(wl, wr, dt, z);
    this.memo.set(key, v);
    return v;
  }
  /** the path sampled on [lo, hi] at the dyadic level that gives about `want` points */
  window(lo: number, hi: number, want = 220): Pt[] {
    const L = Math.min(24, Math.max(6, Math.ceil(Math.log2(want / (hi - lo)))));
    const N = 2 ** L;
    const k0 = Math.max(0, Math.floor(lo * N)),
      k1 = Math.min(N, Math.ceil(hi * N));
    const pts: Pt[] = [];
    for (let k = k0; k <= k1; k++) pts.push([k / N, this.at(L, k)]);
    return pts;
  }
}

export function F1Zoom() {
  const [s, setS] = useState(0); // zoom = 10^s
  const [stretch, setStretch] = useState(false);
  const z = 10 ** s;
  const pathRef = useRef<DyadicPath | null>(null);
  if (!pathRef.current) pathRef.current = new DyadicPath(SEED);
  const path = pathRef.current;
  const narrow = useNarrow();

  const hw = 0.5 / z; // half-width of the window
  const lo = T0 - hw,
    hi = T0 + hw;
  const hh = stretch ? 1 / Math.sqrt(z) : 1 / z; // half-height of the frame

  const smooth = useMemo<Pt[]>(() => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 200; i++) {
      const t = lo + ((hi - lo) * i) / 200;
      pts.push([t, f(t)]);
    }
    return pts;
  }, [lo, hi]);
  const rough = useMemo(() => path.window(lo, hi), [path, lo, hi]);

  const cL = f(T0),
    cR = path.at(1, 1);
  // swing ÷ window: the biggest rise in view over the width in view. Converges to the slope for the smooth curve; grows like √zoom for the random path.
  const swingL = Math.max(...smooth.map((p) => p[1])) - Math.min(...smooth.map((p) => p[1]));
  const swingR = Math.max(...rough.map((p) => p[1])) - Math.min(...rough.map((p) => p[1]));
  const secantL = swingL / (hi - lo);
  const secantR = swingR / (rough[rough.length - 1][0] - rough[0][0]);
  const framesTall = swingR / (2 * hh);

  const W = narrow ? 360 : 420,
    H = narrow ? 230 : 260;
  const margin = { top: 14, right: 30, bottom: 34, left: 54 };
  const fmtSec = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : n2(v));

  return (
    <Figure
      n="1"
      prompt={<>Two pictures, one magnifying glass. Drag the zoom and watch which picture turns into a straight line. (Both curves are simulated.)</>}
      controls={
        <>
          <Slider label="zoom" value={s} min={0} max={4} step={0.02} onChange={setS} fmt={(v) => zoomLabel(10 ** v)} width={narrow ? 150 : 220} />
          <Toggle label="stretch height by √zoom instead" on={stretch} onChange={setStretch} />
          <Readouts
            items={[
              ["window", (2 * hw).toPrecision(2) + " of the unit of time"],
              ["smooth: swing ÷ window", <span className="b3-approx">{n3(secantL)}</span>],
              ["random: swing ÷ window", <span className="b3-truth">{fmtSec(secantR)}</span>],
            ]}
          />
        </>
      }
      observe={
        stretch ? (
          <>
            Now the frame's height shrinks by √zoom while its width shrinks by zoom — and the random path looks the same at every level: a Brownian
            path is the same picture at every scale, <strong>if you measure height in √time</strong>. The smooth curve, under that rule, goes flat.
          </>
        ) : (
          <>
            By ×10 the smooth curve is its tangent, and its swing ÷ window settles on its slope. The random path never straightens: its swing ÷ window keeps growing
            {framesTall >= 1.5 ? <> and at {zoomLabel(z)} its swing is {framesTall >= 10 ? Math.round(framesTall) : framesTall.toFixed(1)} frames tall</> : null} — a window 100×
            shorter still holds a swing 10× smaller, so it bursts out of the frame. There is no slope here, not a hard one: none. New detail is grown between
            the points as you zoom, and grown the same way every time.
          </>
        )
      }
    >
      <div className="b3-split">
        <div className="b3-pane">
          <div className="b3-pane-head">
            <strong>smooth curve</strong>
            <span>zoom {zoomLabel(z)}</span>
          </div>
          <Plot xDomain={[lo, hi]} yDomain={[cL - hh, cL + hh]} width={W} height={H} margin={margin} xTicks={3} yTicks={3} ariaLabel="A smooth curve under the zoom, becoming its tangent" axisX={lo} axisY={cL - hh}>
            <Curve pts={smooth} role="approx" width={2} smooth={false} />
            {z >= 8 && <Label at={[hi, f(hi)]} text="a straight line" role="approx" anchor="end" dx={-6} dy={f(hi) > cL ? 18 : -10} />}
          </Plot>
        </div>
        <div className="b3-pane">
          <div className="b3-pane-head">
            <strong>random path</strong>
            <span>same axes</span>
          </div>
          <Plot xDomain={[lo, hi]} yDomain={[cR - hh, cR + hh]} width={W} height={H} margin={margin} xTicks={3} yTicks={3} ariaLabel="A random path under the same zoom, never straightening" axisX={lo} axisY={cR - hh}>
            <Curve pts={rough} role="truth" width={z > 30 && !stretch ? 0.8 : 1.4} smooth={false} />
            {!stretch && framesTall > 1.5 && <Label at={[lo, cR + hh]} text={`swing: ${framesTall >= 10 ? Math.round(framesTall) : framesTall.toFixed(1)} frames tall`} role="truth" anchor="start" dx={8} dy={14} />}
          </Plot>
        </div>
      </div>
    </Figure>
  );
}
