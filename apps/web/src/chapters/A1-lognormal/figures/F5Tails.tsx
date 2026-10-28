import { useMemo, useState } from "react";
import { npdf, onceInYears, studentT, tailTwoSidedNormal, tailTwoSidedT } from "../../../engine/distributions";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, VLine } from "../../../ui/Plot";
import { Slider, Toggle } from "../../../ui/controls";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { fmtYears } from "./years";

type Pick = "year" | "decade" | "lifetime" | "longer";

/** Normal vs Student-t with the same sd: how often does a k-sigma day happen? Bet first. */
export function F5Tails() {
  const [pick, setPick] = useBet<Pick>("A1-F5");
  const [nu, setNu] = useState(4);
  const [k, setK] = useState(4);
  const [logScale, setLog] = useState(true);
  const c = studentT.unitScale(nu);
  const tr = (v: number) => (logScale ? Math.log10(Math.max(v, 1e-12)) : v);
  const bell = useMemo(() => Array.from({ length: 321 }, (_, i) => [-10 + (20 * i) / 320, npdf(-10 + (20 * i) / 320)] as [number, number]), []);
  const tcurve = useMemo(
    () =>
      Array.from({ length: 321 }, (_, i) => {
        const x = -10 + (20 * i) / 320;
        return [x, nu > 2 ? studentT.pdf(x / c, nu) / c : studentT.pdf(x, nu)] as [number, number];
      }),
    [nu, c],
  );
  const pN = tailTwoSidedNormal(k);
  const pT = nu > 2 ? tailTwoSidedT(k, nu) : 2 * (1 - studentT.cdf(k, nu));
  const ydom: [number, number] = logScale ? [-10, 0] : [0, 0.5];
  const bell4 = onceInYears(tailTwoSidedNormal(4));
  const t4 = onceInYears(tailTwoSidedT(4, 4));

  return (
    <Figure
      n="5"
      prompt={<>Same average, same usual-day size, different tails. How often does a day k times the usual size come round under each curve?</>}
      observe={
        <>
          <p style={{ margin: 0 }}>
            Both curves have the same usual-day size, so "a 4σ day" means the same move under each. The bell says once in {fmtYears(bell4)}; the t with
            ν = 4 says once in about a year. Move k to 5 and the gap becomes centuries against years. Fat tails are not "more volatility" — they are
            the same spread with the probability moved outward.
          </p>
          <details className="a1-more">
            <summary>more</summary>
            <p>
              The t has one knob, ν. Small ν: fat tails, a tall spike in the middle, thin shoulders. Large ν: it turns back into the bell. The worst day of
              October 1987 was about twenty usual-day sizes under the bell, a probability so small the readout gives up. Slide ν toward 2 and the t's
              spread heads to infinity, so "same spread" stops meaning anything — that is Figure 6.
            </p>
          </details>
        </>
      }
    >
      <Bet
        question={<>Under the bell, a day four times the usual size comes once in…</>}
        options={[
          { id: "year", label: "a year" },
          { id: "decade", label: "a decade" },
          { id: "lifetime", label: "a lifetime" },
          { id: "longer", label: "longer than that" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <Plot xDomain={[-10, 10]} yDomain={ydom} xLabel="daily change, in usual-day units (σ)" yLabel={logScale ? "log₁₀ density" : "density"} height={300} ariaLabel="Normal and Student-t densities compared">
          <Curve pts={bell.map((p) => [p[0], tr(p[1])])} role="truth" />
          <Curve pts={tcurve.map((p) => [p[0], tr(p[1])])} role="error" />
          <VLine at={k} />
          <VLine at={-k} />
          <Marker at={[k, tr(npdf(k))]} role="truth" r={4} />
          <Marker at={[k, tr(nu > 2 ? studentT.pdf(k / c, nu) / c : studentT.pdf(k, nu))]} role="error" r={4} />
          <Label at={[k, ydom[1] - (logScale ? 1.6 : 0.08)]} text={`${k.toFixed(1)}σ`} dx={6} />
          <Label at={[-9.6, ydom[1] - (logScale ? 2.2 : 0.12)]} text="bell" role="truth" />
          <Label at={[-9.6, ydom[1] - (logScale ? 3.0 : 0.16)]} text={`t, ν = ${nu.toFixed(1)}`} role="error" />
        </Plot>
        <div className="a1-ctl">
          <Slider label="t's knob ν" value={nu} min={2.2} max={30} step={0.1} onChange={setNu} role="error" fmt={(v) => v.toFixed(1)} />
          <Slider label="a k-σ day, k =" value={k} min={1} max={10} step={0.5} onChange={setK} fmt={(v) => v.toFixed(1)} />
          <Toggle label="log-density view" on={logScale} onChange={setLog} />
          <span className="readouts">
            <span>
              <span className="k">under the bell: once in </span>
              <span className="v tok-truth">{fmtYears(onceInYears(pN))}</span>
            </span>
            <span>
              <span className="k">under the t: once in </span>
              <span className="v tok-error">{fmtYears(onceInYears(pT))}</span>
            </span>
          </span>
        </div>
        {pick && (
          <ResultCard
            yours={pick === "year" ? "a year" : pick === "decade" ? "a decade" : pick === "lifetime" ? "a lifetime" : "longer than a lifetime"}
            answer={`once in ${fmtYears(bell4)} — about a lifetime. Under the t with ν = 4: once in ${fmtYears(t4)}.`}
            verdict={pick === "lifetime" ? "right" : pick === "decade" || pick === "longer" ? "close" : "miss"}
          >
            The bell's tail dies off faster and faster — each extra σ costs far more than the last. Real daily changes do not die off that fast: the NIFTY
            year above had a 4σ day in its first twelve months. The bell under-counts the big days by something like a lifetime to a year.
          </ResultCard>
        )}
      </Bet>
    </Figure>
  );
}
