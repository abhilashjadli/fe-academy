import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { Band, Curve, Plot, VLine, Label } from "../../../ui/Plot";
import { M } from "../../../ui/Math";

const SIG = 1.4;
const MU = 1.2;
const SQ2PI = Math.sqrt(2 * Math.PI);

/** Build the normal density symbol by symbol; the graph morphs in lock-step. Ends on "area, not height". */
export function F6Gaussian() {
  const fns = useMemo(() => {
    const f0 = (x: number) => Math.exp(-x * x);
    const f1 = (x: number) => Math.exp(-(x * x) / (2 * SIG * SIG));
    const f2 = (x: number) => Math.exp(-((x - MU) * (x - MU)) / (2 * SIG * SIG));
    const f3 = (x: number) => f2(x) / (SIG * SQ2PI);
    return [f0, f1, f2, f3];
  }, []);
  const samp = (g: (x: number) => number) => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= 240; i++) {
      const x = -5 + (10 * i) / 240;
      out.push([x, g(x)]);
    }
    return out;
  };
  const curves = useMemo(() => fns.map(samp), [fns]);
  const area = (g: (x: number) => number, a: number, b: number) => {
    let s = 0;
    const m = 400;
    for (let i = 0; i < m; i++) {
      const x = a + ((b - a) * (i + 0.5)) / m;
      s += g(x);
    }
    return (s * (b - a)) / m;
  };

  const steps = [
    {
      tex: "\\tok{approx}{e^{-x^{2}}}",
      cap: <>Start with the simplest hump there is: e raised to minus x squared. It is 1 at the centre, symmetric, and dies off fast — faster than any power of x.</>,
      curve: 0,
    },
    {
      tex: "e^{-x^{2}/\\,2\\tok{approx}{\\sigma}^{2}}",
      cap: <>Give it a width. Dividing by 2σ² stretches the hump horizontally; σ (here 1.4) is the distance from the centre to where the curve bends from "falling faster" to "falling slower". The 2 is there so that σ turns out to be the standard deviation.</>,
      curve: 1,
    },
    {
      tex: "e^{-(x-\\tok{approx}{\\mu})^{2}/\\,2\\sigma^{2}}",
      cap: <>Give it a centre. Replacing x by x − μ slides the hump to μ (here 1.2) without changing its shape.</>,
      curve: 2,
    },
    {
      tex: "\\frac{1}{\\tok{approx}{\\sigma\\sqrt{2\\pi}}}\\,e^{-(x-\\mu)^{2}/2\\sigma^{2}}",
      cap: <>Make the area 1. The area under the hump is σ√(2π) — the √(2π) is a famous fact, and it is where π sneaks into probability — so divide by it. Now the total area is exactly 1 and the curve can carry probability.</>,
      curve: 3,
    },
    {
      tex: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}\\,e^{-(x-\\mu)^{2}/2\\sigma^{2}}",
      cap: (
        <>
          <strong>Area, not height, is probability.</strong> The chance that a draw lands between 0 and 2 is the shaded area: {area(fns[3], 0, 2).toFixed(3)}. The height of the curve at a point is not a probability of anything; it is a density — probability per unit of x.
        </>
      ),
      curve: 3,
      shade: [0, 2] as [number, number],
    },
    {
      tex: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}\\,e^{-(x-\\mu)^{2}/2\\sigma^{2}}",
      cap: <>This is the normal distribution, and it is the curve the standardised dice sums landed on in Figure 5 — with μ = 0 and σ = 1, the "standard" normal. Every symbol in it now has a job: μ places it, σ widens it, σ√(2π) makes the area one.</>,
      curve: 3,
    },
  ];

  return (
    <Figure n="6" prompt="The curve itself, built one symbol at a time.">
      <StepThrough
        steps={steps.map((s) => ({ caption: s.cap }))}
        render={(i) => {
          const s = steps[i];
          const c = curves[s.curve];
          const ymax = s.curve >= 3 ? 0.36 : 1.1;
          return (
            <>
              <Plot xDomain={[-5, 5]} yDomain={[0, ymax]} xLabel="x" height={290} ariaLabel="The normal density being built up">
                {s.shade && <Band upper={c.filter((p) => p[0] >= s.shade![0] && p[0] <= s.shade![1])} lower={c.filter((p) => p[0] >= s.shade![0] && p[0] <= s.shade![1]).map((p) => [p[0], 0])} role="approx" />}
                {s.curve > 0 && <Curve pts={curves[s.curve - 1]} role="ghost" />}
                <Curve pts={c} role="approx" />
                {s.curve >= 2 && <VLine at={MU} />}
                {s.curve >= 2 && <Label at={[MU, ymax * 0.95]} text="μ" dx={4} dy={0} />}
                {s.curve >= 1 && s.curve < 3 && (
                  <>
                    <VLine at={(s.curve >= 2 ? MU : 0) + SIG} />
                    <Label at={[(s.curve >= 2 ? MU : 0) + SIG, ymax * 0.95]} text="+σ" dx={4} dy={0} />
                  </>
                )}
              </Plot>
              <div style={{ textAlign: "center" }}>
                <M block tex={s.tex} />
              </div>
            </>
          );
        }}
      />
    </Figure>
  );
}
