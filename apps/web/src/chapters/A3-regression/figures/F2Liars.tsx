import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Comic, Panel, Says } from "../../../ui/Comic";
import { Curve, Plot, Points, type Pt } from "../../../ui/Plot";
import { ols, ols2, randomWalk } from "../../../engine/regression";
import { normalSample, rng } from "../../../engine/random";
import key from "../../../engine/__fixtures__/key-A3.json";

/** Figure 2 — four liars, four panels, no interaction. Each breaks one assumption of the how-sure. */
export function F2Liars() {
  const funnel = useMemo(() => {
    // leftovers whose size grows with distance from the centre of the cloud
    const r = rng(3);
    const x = Array.from({ length: 200 }, (_, i) => 1 + (9 * i) / 199);
    const y = x.map((v) => 1 + 2 * v + (0.3 + 2.2 * Math.abs(v - 5.5)) * normalSample(r));
    const f = ols(x, y);
    return { f, res: x.map((v, i) => [v, f.resid[i]] as Pt) };
  }, []);
  const echo = useMemo(() => {
    const f = ols(key.echo.x, key.echo.y);
    return { f, res: key.echo.x.map((_, i) => [i, f.resid[i]] as Pt) };
  }, []);
  const twins = useMemo(() => ols2(key.twins.x1, key.twins.x2, key.twins.y), []);
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

  return (
    <Figure n="2" prompt="Four liars. Each leaves the slope roughly alone and breaks the how-sure.">
      <Comic cols={2}>
        <Panel n={1} caption={<Says who="Funnel" mood="smug">My leftovers get wilder away from the middle. Your ± {(2 * funnel.f.se).toFixed(2)} is really ± {(2 * funnel.f.seHC).toFixed(2)}.</Says>}>
          <Plot xDomain={[0, 11]} yDomain={[-30, 30]} width={300} height={170} xLabel="x" xTicks={4} yTicks={3} ariaLabel="Residuals that fan out">
            <Points pts={funnel.res} role="error" r={2} opacity={0.6} />
          </Plot>
        </Panel>
        <Panel n={2} caption={<Says who="Echo" mood="smug">My leftovers copy yesterday's. You counted {echo.f.n} fresh coins; you had about {Math.round(echo.f.n * (1 - 0.9) / (1 + 0.9))}. Your ± is {(echo.f.seHAC / echo.f.se).toFixed(1)}× too small.</Says>}>
          <Plot xDomain={[0, 200]} yDomain={[-8, 8]} width={300} height={170} xTicks={4} yTicks={3} xLabel="time" ariaLabel="Residuals in time order with long runs">
            <Curve pts={echo.res} role="error" width={1.5} smooth={false} />
          </Plot>
        </Panel>
        <Panel n={3} caption={<Says who="Twins" mood="happy">We are the same input twice. The fit is perfect (R² {twins.r2.toFixed(2)}); the credit is {twins.coef[1].toFixed(0)} to me and {twins.coef[2].toFixed(0)} to my twin, each ± {(2 * twins.se[1]).toFixed(0)}. Ask again tomorrow and we'll swap.</Says>}>
          <svg viewBox="0 0 300 170" width="100%" style={{ maxWidth: 300 }}>
            <circle cx="135" cy="85" r="60" fill="var(--truth-soft)" stroke="var(--truth)" />
            <circle cx="165" cy="85" r="60" fill="var(--approx-soft)" stroke="var(--approx)" />
            <text x="150" y="30" textAnchor="middle" fontSize="12" fill="var(--ink-2)">
              x₁ and x₂ overlap almost entirely
            </text>
            <text x="150" y="150" textAnchor="middle" fontSize="12" fill="var(--ink-2)">
              the sliver that differs decides everything
            </text>
          </svg>
        </Panel>
        <Panel n={4} caption={<Says who="Drunks" mood="happy">We never met. Two of us, {drunks.a.length - 1} coin-flips each, and pair number {drunks.seed} that we tried fits with R² = {drunks.f.r2.toFixed(2)}. Swap the axis labels for "ice cream" and "drownings" and you have a headline.</Says>}>
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
