import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Label, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { normalSample, rng } from "../../../engine/random";
import { correlation } from "../../../engine/linalg";

/** Break it: three stills side by side — zero correlation with total dependence; strong correlation made by one point. */
export function F6Break() {
  const cases = useMemo(() => {
    const r = rng(5);
    const base: Pt[] = Array.from({ length: 200 }, () => [
      normalSample(r),
      normalSample(r),
    ]);
    const parabola = base.map(
      ([x]) => [x, x * x - 1 + 0.15 * normalSample(r)] as Pt,
    );
    const outlier: Pt[] = [
      ...base.map(([x, y]) => [0.6 * x, 0.6 * y] as Pt),
      [7, 7],
    ];
    const rhoOf = (pts: Pt[]) =>
      correlation(
        pts.map((p) => p[0]),
        pts.map((p) => p[1]),
      );
    return [
      {
        id: "round",
        pts: base,
        rho: rhoOf(base),
        role: "approx" as const,
        caption: "Independent noise: a round cloud, nothing to see.",
      },
      {
        id: "parabola",
        pts: parabola,
        rho: rhoOf(parabola),
        role: "approx" as const,
        caption:
          "Know x and you know y — yet the number reads zero. Uphill cancels downhill.",
      },
      {
        id: "outlier",
        pts: outlier,
        rho: rhoOf(outlier),
        role: "error" as const,
        caption:
          "Two hundred independent days plus one wild one, and the number says “strong”.",
      },
    ];
  }, []);
  const n2 = fmt.n(2);
  return (
    <Figure
      n="6"
      prompt={
        <>
          Break it. One number for a whole cloud — the same ρ on the left and in
          the middle, and one point making the right.
        </>
      }
      observe={
        <>
          The number only sees straight lines. The middle cloud is total
          dependence and reads ρ = {n2(cases[1].rho)}: "uncorrelated" does not
          mean "independent". The right cloud is independence plus one day and
          reads ρ = {n2(cases[2].rho)}. Every market correlation has a day like
          that inside it. Ask which it is before you trust it.
        </>
      }
    >
      <div className="a2-stills">
        {cases.map((c) => (
          <figure key={c.id} className="a2-still">
            <Plot
              xDomain={[-4, 8]}
              yDomain={[-4, 8]}
              width={300}
              height={260}
              margin={{ top: 10, right: 10, bottom: 26, left: 30 }}
              xTicks={4}
              yTicks={4}
              ariaLabel={`${c.caption} Correlation ${n2(c.rho)}.`}
            >
              <Points pts={c.pts} role={c.role} r={2.6} opacity={0.6} />
              <Label
                at={[-3.3, 7.2]}
                text={`ρ = ${n2(c.rho)}`}
                anchor="start"
                role={c.role}
                dx={0}
                dy={0}
              />
            </Plot>
            <figcaption>{c.caption}</figcaption>
          </figure>
        ))}
      </div>
    </Figure>
  );
}
