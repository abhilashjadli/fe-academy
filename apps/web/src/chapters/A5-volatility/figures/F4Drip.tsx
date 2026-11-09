import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { Curve, Label, type Pt } from "../../../ui/Plot";
import { garchForecast, garchLongRun, garchVariance, halfLife } from "../../../engine/volatility";
import { DATES, FIT, KEY, MEAN_SQ, N, R, RV250, SQ, YEAR, n1, niceDate, useNarrow, varPct2, volPct, toPct2 } from "./a5";
import { useClock } from "./clock";
import { Bucket } from "./Bucket";
import { SQ_CAP, TwoPictures, levelPts } from "./pictures";
import "./figures.css";

/**
 * Figure 4 — the second pipe. A thin tap drips a constant into the bucket each day: GARCH(1,1), Hull eq. 17.8,
 * σ² = ω + α u² + β σ². One dial: the drip ω. The cup fraction α is the computer's fitted value; the keep fraction β is
 * whatever balances the drip at the ten-year average cup (β = 1 − α − ω/V̄, Hull's variance targeting, p. 381), so with
 * the drip off the bucket is Figure 2's again (α + β = 1, EWMA) and with it on the level has a home. Button: freeze the
 * pouring and let it drain from where the clock stands — Hull eq. 17.13. Readouts: home, half-life, 10 days ahead.
 */

const HORIZON = 120;
const STEP_PCT2 = 0.0025; // the dial moves in %² a day
const DAY = 1 / 252;

export function F4Drip() {
  const i = useClock();
  const narrow = useNarrow();
  const [dripPct2, setDrip] = useState(Math.round((10000 * FIT.omega) / STEP_PCT2) * STEP_PCT2);
  const [frozen, setFrozen] = useState(false);
  const omega = dripPct2 / 10000;
  const alpha = FIT.alpha;
  const gamma = omega / MEAN_SQ;
  const beta = 1 - alpha - gamma;
  const path = useMemo(() => garchVariance(R, omega, alpha, beta), [omega, alpha, beta]);
  const level = path[i + 1];
  const peakAt = useMemo(() => path.indexOf(Math.max(...path)) - 1, [path]);
  const home = gamma > 0 ? garchLongRun(omega, alpha, beta) : NaN;
  const hl = gamma > 0 ? halfLife(alpha + beta) : Infinity;
  // with the drip off the model is EWMA (α + β = 1): Hull eq. 17.13 has no V_L and the forecast is flat at today's level
  const fc = useMemo(() => (gamma > 0 ? garchForecast(level, omega, alpha, beta, HORIZON) : new Array<number>(HORIZON).fill(level)), [level, omega, alpha, beta, gamma]);
  // frozen: zoom to the 80 days before the clock and the horizon after it; x becomes trading days from the clock
  const win: [number, number] | undefined = frozen ? [Math.max(0, i - 80), i + 1] : undefined;
  const xOf = frozen ? (k: number) => k - i : (k: number) => YEAR[k];
  const line = useMemo<Pt[]>(() => levelPts(path, toPct2, xOf, win ? win[0] : 0, win ? win[1] : N), [path, frozen, i]); // eslint-disable-line react-hooks/exhaustive-deps
  const xAhead = (k: number) => (frozen ? k : i + k < N ? YEAR[i + k] : YEAR[N - 1] + (i + k - (N - 1)) * DAY);
  const fcLine: Pt[] = frozen ? [[0, toPct2(level)], ...fc.map((v, k) => [k + 1, toPct2(v)] as Pt)] : [];
  const flatLine: Pt[] = frozen ? [[0, toPct2(level)], [HORIZON, toPct2(level)]] : [];
  const bandUp: Pt[] = frozen ? fcLine.map(([x, v]) => [x, Math.sqrt(v)]) : [];
  const bandLo: Pt[] = bandUp.map(([x, v]) => [x, -v]);
  const ten = Math.sqrt(fc[9]);
  const homeY = Number.isFinite(home) ? toPct2(home) : NaN;

  return (
    <Figure
      n="4"
      prompt={
        <>
          The same bucket with one more pipe: a thin tap dripping a constant each day. One dial: the drip. The hole is now the computer's ({(100 * alpha).toFixed(0)} % of each cup is
          kept; see Figure 5); the keep fraction is whatever balances the drip at the ten-year average cup. Then <em>freeze the pouring</em> and watch the bucket drain from where the clock stands.
        </>
      }
      controls={
        <>
          <Slider label="the drip, %² a day" value={dripPct2} min={0} max={0.06} step={STEP_PCT2} onChange={setDrip} role="approx" fmt={(v) => v.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} width={170} />
          <button type="button" className={"btn " + (frozen ? "toggled" : "")} aria-pressed={frozen} onClick={() => setFrozen((v) => !v)}>
            {frozen ? "pour again" : "freeze the pouring"}
          </button>
          <Readouts
            items={[
              ["home (√)", gamma > 0 ? <span key="h" className="a5-approx">{volPct(Math.sqrt(home))}</span> : <span key="h" className="a5-approx">none</span>],
              ["forgets half in", gamma > 0 ? `${n1(hl)} days` : "never settles"],
              ["10 days ahead (√)", <span key="t" className="a5-truth">{volPct(ten)}</span>],
            ]}
          />
        </>
      }
      observe={
        <>
          With the drip on, the level has a <strong>home</strong>: the place where what drips in balances what leaks out, here the ten-year average cup, √ {varPct2(MEAN_SQ)} ={" "}
          {volPct(Math.sqrt(MEAN_SQ))} a day. Frozen, the level glides back along a curve, not a cliff — Hull's half-life, ln ½ / ln (cup + keep). Drip off: no home, the forecast is a
          flat line (that is EWMA). The computer's own drip is {varPct2(FIT.omega, 3)} a day with keep {FIT.beta.toFixed(3)}, home {volPct(Math.sqrt(KEY.VL))}, half-life{" "}
          {n1(KEY.half_life)} days. Push cup + keep past 1 and the drip is never leaked away: the bucket overflows — the model is not stable.
        </>
      }
    >
      <div className="a5-stage">
        <div className="a5-machine">
          <TwoPictures
            top={
              frozen ? (
                <>
                  <Curve pts={bandUp} role="truth" width={1.6} dash="4 3" smooth={false} />
                  <Curve pts={bandLo} role="truth" width={1.6} dash="4 3" smooth={false} />
                </>
              ) : undefined
            }
            bottom={
              <>
                {Number.isFinite(homeY) && (
                  <>
                    <Curve pts={[[xOf(win ? win[0] : 0) - 1, homeY], [xAhead(HORIZON) + 1, homeY]]} role="approx" width={1.2} dash="2 4" smooth={false} />
                    <Label at={[xOf(win ? win[0] : 0), homeY]} text="home" role="approx" dx={4} dy={-4} />
                  </>
                )}
                <Curve pts={line} role="truth" width={1.6} smooth={false} />
                {frozen && (
                  <>
                    <Curve pts={flatLine} role="ghost" width={1.2} dash="2 3" smooth={false} />
                    <Curve pts={fcLine} role="truth" width={2.2} dash="5 3" smooth={false} />
                    <Label at={[xAhead(HORIZON), toPct2(level)]} text="drip off: flat" role="ghost" dx={-4} dy={toPct2(level) > homeY ? -4 : 12} anchor="end" />
                    <Label at={[xAhead(Math.round(HORIZON * 0.35)), toPct2(fc[Math.round(HORIZON * 0.35) - 1])]} text="frozen: draining home" role="truth" dy={toPct2(level) > homeY ? 16 : -7} anchor="middle" />
                  </>
                )}
                {!frozen && <Label at={[YEAR[peakAt], Math.min((narrow ? 16 : 20) * 0.85, toPct2(path[peakAt + 1]))]} text="level, with the drip" role="truth" dx={5} dy={-2} />}
              </>
            }
            bottomLabel="squares (%²) and the bucket's level"
            bottomCap={frozen ? Math.max(4, Math.min(SQ_CAP, Math.ceil(toPct2(level) * 1.3))) : narrow ? 16 : 20}
            window={win}
            origin={i}
            extendRight={frozen ? HORIZON + 5 : 0}
            scrub={!frozen}
            ariaTop="Daily moves; when frozen, a dashed blue band shows the forecast width draining back towards the home level"
            ariaBottom="The squares with the bucket's level, an amber dashed home line, and when frozen a dashed forecast curve gliding to the home while a grey flat line shows the no-drip forecast"
          />
          <div className="a5-bucket-col">
            <Bucket level={toPct2(level)} cup={frozen ? 0 : SQ[i]} hole={1 - beta} ghost={Number.isFinite(RV250[i]) ? toPct2(RV250[i]) : undefined} drip={gamma} label="variance" />
            <div className="a5-sqrt-tile">
              <span className="k">√ level = volatility</span>
              <span className="v a5-truth">{volPct(Math.sqrt(level))}</span>
            </div>
          </div>
        </div>
        <div className="a5-words">
          <div className="a5-words-rule">level today = drip + cup share × today's cup + keep × level yesterday</div>
          <div className="a5-words-nums">
            {varPct2(level)} = {dripPct2.toFixed(4)} + {alpha.toFixed(3)} × {SQ[i].toFixed(2)} %² + {beta.toFixed(3)} × {varPct2(path[i])} <span className="a5-hint">({niceDate(DATES[i])})</span>
          </div>
        </div>
      </div>
    </Figure>
  );
}
