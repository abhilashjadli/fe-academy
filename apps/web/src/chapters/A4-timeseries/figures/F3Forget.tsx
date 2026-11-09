import "./figures.css";
import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough, type Step } from "../../../ui/StepThrough";
import { Bars, HLine, Label, Plot } from "../../../ui/Plot";
import { ar1Acf, halfLife, sampleAcf } from "../../../engine/timeseries";
import { KEY, NIFTY_CLOSE, NIFTY_FROM, NIFTY_RET, NIFTY_TO, n1, n2, n3, s3, useNarrow } from "./a4";

/**
 * Round 3 — how fast does it forget? A single kick of size 1 at day 0; each Forward press is +1 day and the kick is worth φ of
 * what it was (φ = 0.8, Tsay Fig. 2.3). The shrinking bars are the autocorrelation. Last step: the same bars for the real NIFTY
 * level (stay near 1 for 30 days) and for its daily changes (vanish at lag 1). Differencing is the one-step fix.
 */

const PHI = KEY.acf_theory.phi; // 0.8
const DAYS = 10;
const LAGS = 30;
const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const sup = (k: number) => String(k).split("").map((c) => SUP[parseInt(c, 10)]).join("");
const YTOP = 1.25; // room above the bars for a label

export function F3Forget() {
  const acf = useMemo(() => ar1Acf(PHI, DAYS), []);
  const hl = halfLife(PHI);
  const level = useMemo(() => sampleAcf(NIFTY_CLOSE, LAGS), []);
  const change = useMemo(() => sampleAcf(NIFTY_RET, LAGS), []);
  const band = 2 / Math.sqrt(NIFTY_RET.length);
  const narrow = useNarrow("(max-width: 760px)");

  const steps: Step[] = [
    { caption: <>Day 0: one piece of news lands, a kick of size 1. Press Forward for +1 day and watch what the machine keeps of it.</> },
    ...Array.from({ length: DAYS }, (_, i) => {
      const k = i + 1;
      return {
        caption: (
          <>
            Day {k}: the kick is multiplied by {n1(PHI)} once more and is worth <strong>{n3(acf[k - 1])}</strong> of its size.{" "}
            {k === 1 && <>These bars, read as "how much of a shock survives k days", are the series' autocorrelation.</>}
            {k === 4 && <>Half of a kick is gone after {n2(hl)} days — the half-life, from the engine.</>}
            {k === DAYS && <>Ten days on and a tenth remains. With a steeper bowl it would be gone sooner; on a flat table it would never shrink at all.</>}
          </>
        ),
      };
    }),
    {
      caption: (
        <>
          Now the real thing: the same bars measured on NIFTY 50, {NIFTY_FROM}–{NIFTY_TO}. For the <strong>index level</strong> the bar at lag 1 is {n3(level[0])} and
          at lag 30 still {n3(level[LAGS - 1])}: nothing is forgotten — the eye's "it has a level" was wrong. For the <strong>daily change</strong> the lag-1 bar is{" "}
          {s3(change[0])}, inside the ±{n3(band)} band of pure noise. Differencing — looking at changes instead of levels — is the one-step fix.
        </>
      ),
    },
  ];

  return (
    <Figure
      n="3"
      prompt={
        <>
          Round 3. How fast does the machine forget? One kick, then +1 day at a time at φ = {n1(PHI)}. The honest version of the eye is the chart of
          what survives.
        </>
      }
    >
      <StepThrough
        steps={steps}
        render={(i) =>
          i <= DAYS ? (
            <Plot xDomain={[-0.6, DAYS + 0.6]} yDomain={[0, YTOP]} width={narrow ? 420 : 560} height={narrow ? 240 : 300} xLabel="days since the kick" yLabel="what survives of the kick" xTicks={11} yTicks={5} margin={{ top: 16, right: 14, bottom: 34, left: 40 }}>
              <Bars bars={[{ x: 0, y: 1, w: 0.7 }]} role="ink" opacity={0.9} />
              {i > 0 && <Bars bars={Array.from({ length: i }, (_, k) => ({ x: k + 1, y: acf[k], w: 0.7 }))} role="truth" opacity={0.85} />}
              <Label at={[0, 1]} text="the kick, size 1" anchor="start" dx={8} dy={-6} />
              {i > 0 && <Label at={[i, acf[i - 1]]} text={`${n1(PHI)}${sup(i)} = ${n3(acf[i - 1])}`} role="truth" anchor={i > 7 ? "end" : "start"} dx={i > 7 ? -8 : 8} dy={-6} />}
            </Plot>
          ) : (
            <div className="a4-two stack">
              <div>
                <div className="a4-panel-t">
                  NIFTY 50 <strong>level</strong> · sample autocorrelation, lags 1–{LAGS} (real)
                </div>
                <Plot xDomain={[0.3, LAGS + 0.7]} yDomain={[-0.12, YTOP]} width={560} height={200} xLabel="lag, days" xTicks={6} yTicks={5} margin={{ top: 10, right: 12, bottom: 32, left: 38 }}>
                  <HLine at={band} />
                  <HLine at={-band} />
                  <Bars bars={level.map((v, k) => ({ x: k + 1, y: v, w: 0.7 }))} role="error" opacity={0.85} />
                  <Label at={[LAGS, level[LAGS - 1]]} text={`lag 30: still ${n3(level[LAGS - 1])} — nothing forgotten`} role="error" anchor="end" dx={0} dy={-8} />
                </Plot>
              </div>
              <div>
                <div className="a4-panel-t">
                  NIFTY 50 <strong>daily change</strong> · the same bars (real)
                </div>
                <Plot xDomain={[0.3, LAGS + 0.7]} yDomain={[-0.12, YTOP]} width={560} height={200} xLabel="lag, days" xTicks={6} yTicks={5} margin={{ top: 10, right: 12, bottom: 32, left: 38 }}>
                  <HLine at={band} />
                  <HLine at={-band} />
                  <Bars bars={change.map((v, k) => ({ x: k + 1, y: v, w: 0.7 }))} role="truth" opacity={0.85} />
                  <Label at={[LAGS, band]} text={`±${n3(band)}: pure noise would sit in this band`} anchor="end" dx={0} dy={-8} />
                  <Label at={[1, change[0]]} text={`lag 1: ${s3(change[0])}`} role="truth" anchor="start" dx={6} dy={-8} />
                </Plot>
              </div>
            </div>
          )
        }
      />
    </Figure>
  );
}
