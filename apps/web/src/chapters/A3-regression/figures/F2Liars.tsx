import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Comic, Panel, Says } from "../../../ui/Comic";
import { Curve, HLine, Plot, Points, type Pt } from "../../../ui/Plot";
import { ols, ols2, randomWalk } from "../../../engine/regression";
import { normalSample, rng } from "../../../engine/random";
import key from "../../../engine/__fixtures__/key-A3.json";

/**
 * The Funnel: a one-sided fan. Most points sit on the left (x = 1 + 9u³), the leftovers grow with x
 * (sd = 0.2 + 0.15x²), so the few far-right points carry the slope and White's error is about 2× the naive one.
 */
export function funnelCloud(seed = 11, n = 200) {
  const r = rng(seed);
  const x = Array.from({ length: n }, (_, i) => 1 + 9 * (i / (n - 1)) ** 3);
  const y = x.map((v) => 1 + 2 * v + (0.2 + 0.15 * v * v) * normalSample(r));
  return { x, y };
}

/**
 * The Twins: x₂ is x₁ plus a whisper (0.006 × noise); y = x₁ + x₂ + noise. The fit can only see the sum (≈ 2),
 * so the split between them is anybody's guess — this seed's guess is about +51 / −49, each ± 50.
 */
export function twinsCloud(seed = 214, n = 60, whisper = 0.006) {
  const r = rng(seed);
  const x1 = Array.from({ length: n }, () => normalSample(r));
  const x2 = x1.map((v) => v + whisper * normalSample(r));
  const y = x1.map((v, i) => v + x2[i] + normalSample(r));
  return { x1, x2, y };
}

/** Figure 2 — four liars, four panels, no interaction. Each breaks one assumption of the how-sure. */
export function F2Liars() {
  const funnel = useMemo(() => {
    const { x, y } = funnelCloud();
    const f = ols(x, y);
    return { f, res: x.map((v, i) => [v, f.resid[i]] as Pt), eMax: Math.max(...f.resid.map(Math.abs)) * 1.05 };
  }, []);
  const echo = useMemo(() => {
    const f = ols(key.echo.x, key.echo.y);
    return { f, res: key.echo.x.map((_, i) => [i, f.resid[i]] as Pt) };
  }, []);
  const twins = useMemo(() => {
    const { x1, x2, y } = twinsCloud();
    return ols2(x1, x2, y);
  }, []);
  const drunks = useMemo(() => {
    // the first seed whose two independent walks happen to fit with R² > 0.8 — they exist, that is the point
    for (let seed = 1; seed < 500; seed++) {
      const r = rng(seed);
      const a = randomWalk(60, r),
        b = randomWalk(60, r);
      const f = ols(a, b);
      if (f.r2 > 0.8) return { a, b, f, pts: a.map((v, i) => [v, b[i]] as Pt), seed };
    }
    const r = rng(1);
    const a = randomWalk(60, r),
      b = randomWalk(60, r);
    return { a, b, f: ols(a, b), pts: a.map((v, i) => [v, b[i]] as Pt), seed: 1 };
  }, []);
  const sign = (v: number) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(0);

  return (
    <Figure n="2" prompt="Four liars. Each leaves the slope roughly alone and breaks the how-sure.">
      <Comic cols={2}>
        <Panel
          n={1}
          caption={
            <Says who="Funnel" mood="smug">
              My leftovers grow with x. Your ± {(2 * funnel.f.se).toFixed(2)} is really ± {(2 * funnel.f.seHC).toFixed(2)} — {(funnel.f.seHC / funnel.f.se).toFixed(1)}× wider.
            </Says>
          }
        >
          <Plot xDomain={[0, 11]} yDomain={[-funnel.eMax, funnel.eMax]} width={300} height={170} xLabel="x" yLabel="leftover" xTicks={4} yTicks={3} ariaLabel="Residuals against x, fanning out to the right">
            <HLine at={0} />
            <Points pts={funnel.res} role="error" r={2} opacity={0.6} />
          </Plot>
        </Panel>
        <Panel
          n={2}
          caption={
            <Says who="Echo" mood="smug">
              My leftovers copy yesterday's. You counted {echo.f.n} fresh coins; you had about {Math.round((echo.f.n * (1 - 0.9)) / (1 + 0.9))}. Your ± is{" "}
              {(echo.f.seHAC / echo.f.se).toFixed(1)}× too small.
            </Says>
          }
        >
          <Plot xDomain={[0, 200]} yDomain={[-8, 8]} width={300} height={170} xTicks={4} yTicks={3} xLabel="time" yLabel="leftover" ariaLabel="Residuals in time order with long runs">
            <HLine at={0} />
            <Curve pts={echo.res} role="error" width={1.5} smooth={false} />
          </Plot>
        </Panel>
        <Panel
          n={3}
          caption={
            <Says who="Twins" mood="happy">
              We are the same input twice. The fit is fine (R² {twins.r2.toFixed(2)}); the credit is {sign(twins.coef[1])} to me and {sign(twins.coef[2])} to my
              twin, each ± {(2 * twins.se[1]).toFixed(0)}. Together we are worth about {(twins.coef[1] + twins.coef[2]).toFixed(0)}. Ask again tomorrow and we'll
              swap.
            </Says>
          }
        >
          <svg viewBox="0 0 300 170" width="100%" style={{ maxWidth: 300 }} role="img" aria-label="Two circles that overlap almost entirely">
            <circle cx="140" cy="88" r="50" fill="var(--truth-soft)" stroke="var(--truth)" />
            <circle cx="160" cy="88" r="50" fill="var(--approx-soft)" stroke="var(--approx)" />
            <text x="150" y="22" textAnchor="middle" fontSize="12" fill="var(--ink-2)">
              x₁ and x₂ overlap almost entirely
            </text>
            <text x="150" y="160" textAnchor="middle" fontSize="12" fill="var(--ink-2)">
              the sliver that differs decides everything
            </text>
          </svg>
        </Panel>
        <Panel
          n={4}
          caption={
            <Says who="Drunks" mood="happy">
              We never met. Two of us, {drunks.a.length - 1} coin-flips each, and pair number {drunks.seed} that we tried fits with R² = {drunks.f.r2.toFixed(2)}.
              Swap the axis labels for "ice cream" and "drownings" and you have a headline.
            </Says>
          }
        >
          <Plot xDomain={[Math.min(...drunks.a) - 1, Math.max(...drunks.a) + 1]} yDomain={[Math.min(...drunks.b) - 1, Math.max(...drunks.b) + 1]} width={300} height={170} xTicks={4} yTicks={3} ariaLabel="Two independent random walks plotted against each other with a fitted line">
            <Points pts={drunks.pts} role="ink" r={2.5} opacity={0.7} />
            <Curve pts={[[Math.min(...drunks.a), drunks.f.intercept + drunks.f.slope * Math.min(...drunks.a)], [Math.max(...drunks.a), drunks.f.intercept + drunks.f.slope * Math.max(...drunks.a)]]} role="error" width={2} smooth={false} />
          </Plot>
        </Panel>
      </Comic>
      <div className="figure-observe">
        Funnel and Echo lie about the <strong>how-sure</strong>. The Twins lie about <strong>who gets the credit</strong>. The Drunks lie about whether there is a
        relationship at all. All four are caught the same way: look at the leftovers, in order, before you believe the number.
      </div>
    </Figure>
  );
}
