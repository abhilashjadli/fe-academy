import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Curve, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";
import { gammaSample, normalSample, rng } from "../../../engine/random";
import { correlation } from "../../../engine/linalg";

const N = 2500; // ten years of trading days
const NU = 4; // degrees of freedom of the t pair — the label below reads this constant, so they cannot disagree

type Pick = "left" | "right" | "same";

/** Same ρ, different corners: a Gaussian pair vs a t pair (ν = 4). Bet on the corner, then count it. */
export function F5Copula() {
  const [pick, setPick] = useBet<Pick>("A2-F5");
  const [rho, setRho] = useState(0.5);
  const [k, setK] = useState(2.5);
  const q = Math.sqrt(1 - rho * rho);
  const clouds = useMemo(() => {
    const r = rng(99);
    const g: Pt[] = [],
      t: Pt[] = [];
    const c = Math.sqrt((NU - 2) / NU);
    for (let i = 0; i < N; i++) {
      const a = normalSample(r),
        b = normalSample(r);
      g.push([a, rho * a + q * b]);
      const w = Math.sqrt((2 * gammaSample(NU / 2, r)) / NU); // sqrt(chi2_nu / nu)
      const a2 = normalSample(r),
        b2 = normalSample(r);
      t.push([(a2 / w) * c, ((rho * a2 + q * b2) / w) * c]);
    }
    return { g, t };
  }, [rho, q]);
  const both = (pts: Pt[]) => pts.filter((p) => p[0] < -k && p[1] < -k).length;
  const either = (pts: Pt[]) => pts.filter((p) => p[0] < -k).length;
  const rg = correlation(
    clouds.g.map((p) => p[0]),
    clouds.g.map((p) => p[1]),
  );
  const rt = correlation(
    clouds.t.map((p) => p[0]),
    clouds.t.map((p) => p[1]),
  );
  const tLabel = `fat-tailed pair (t, ν = ${NU})`;
  const panel = (
    pts: Pt[],
    role: "truth" | "error",
    label: string,
    rMeasured: number,
  ) => (
    <div>
      <Plot
        xDomain={[-6, 6]}
        yDomain={[-6, 6]}
        width={400}
        height={340}
        xTicks={6}
        yTicks={6}
        xLabel="stock 1, in σ"
        yLabel="stock 2, in σ"
        ariaLabel={label}
      >
        <Points pts={pts} role={role} r={1.8} opacity={0.45} />
        <Curve
          pts={[
            [-6, -k],
            [-k, -k],
            [-k, -6],
          ]}
          role="ink"
          width={1.5}
          dash="4 3"
          smooth={false}
        />
      </Plot>
      <div
        className="readouts"
        style={{ padding: "0.3rem 0.5rem 0", fontSize: "0.8rem" }}
      >
        <span>
          <span className="k">{label} · ρ measured </span>
          <span className="v">{fmt.n(2)(rMeasured)}</span>
        </span>
        <span>
          <span className="k">days stock 1 fell past {k}σ: </span>
          <span className="v">{either(pts)}</span>
          <span className="k"> · stock 2 fell too on </span>
          <span className="v">{both(pts)}</span>
          <span className="k">
            {" "}
            of them ({either(pts) ? fmt.pct(0)(both(pts) / either(pts)) : "—"})
          </span>
        </span>
      </div>
    </div>
  );
  const bg = both(clouds.g),
    bt = both(clouds.t);

  return (
    <Figure
      n="5"
      prompt={
        <>
          Two clouds, two stocks each, ten years of days, the same correlation.
          The dashed corner is where both crash at once. Bet, then count.
        </>
      }
      controls={
        pick && (
          <>
            <Slider
              label="ρ, the correlation"
              value={rho}
              min={0}
              max={0.9}
              step={0.05}
              onChange={setRho}
            />
            <Slider
              label="where the corner starts, in σ"
              value={k}
              min={1}
              max={3.5}
              step={0.25}
              onChange={setK}
            />
          </>
        )
      }
      observe={
        pick && (
          <>
            <p style={{ margin: 0 }}>
              Same ρ, same spread, different corners. On the right both stocks
              share one bad-luck dial, so their bad days arrive together and the
              cloud grows an X. Push the corner out and the gap widens. This is
              what "correlations go to one in a crisis" means: ρ never changed.
              ρ describes the middle; risk lives in the corner (E1).
            </p>
            <details className="a2-more">
              <summary>more: how the right-hand cloud is made</summary>
              <p>
                Take a correlated pair of normals and divide both by the same
                random number, √(χ²/ν) with ν = {NU}. On most days that number
                is near 1 and nothing changes. On a few days it is tiny, both
                coordinates blow up together, and a dot lands far out along the
                diagonal. The recipe is called a <strong>t-copula</strong>; ν is
                the knob for how often the tiny days come. The right-hand cloud
                is rescaled so both panels have spread 1 per axis.
              </p>
              <p>
                The measured ρ on the right wobbles from sample to sample: with
                tails this fat, even the correlation is hard to pin down.
              </p>
            </details>
          </>
        )
      }
    >
      <Bet
        question="Same correlation. Which cloud has more days when BOTH crash?"
        options={[
          { id: "left", label: "left" },
          { id: "right", label: "right" },
          { id: "same", label: "same — same ρ, same corner" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <div className="two" style={{ marginTop: "0.5rem" }}>
          {panel(clouds.g, "truth", "bell-shaped pair", rg)}
          {panel(clouds.t, "error", tLabel, rt)}
        </div>
        <ResultCard
          yours={
            pick === "left"
              ? "the left cloud"
              : pick === "right"
                ? "the right cloud"
                : "the same"
          }
          answer={
            bt > bg
              ? `the right cloud — ${bt} joint crashes against ${bg}, in ten years of days each`
              : bt < bg
                ? `the left cloud, at this corner — ${bg} joint crashes against ${bt}; push the corner out and watch it flip`
                : `a tie at this corner — ${bt} each; push the corner out and watch the right pull ahead`
          }
          verdict={
            (bt > bg && pick === "right") ||
            (bt < bg && pick === "left") ||
            (bt === bg && pick === "same")
              ? "right"
              : "miss"
          }
        >
          Stock 1 fell past {k}σ on {either(clouds.g)} days on the left and{" "}
          {either(clouds.t)} on the right; stock 2 went down with it {bg} and{" "}
          {bt} times. One number, ρ, for both clouds — and it never saw the
          corner.
        </ResultCard>
      </Bet>
    </Figure>
  );
}
