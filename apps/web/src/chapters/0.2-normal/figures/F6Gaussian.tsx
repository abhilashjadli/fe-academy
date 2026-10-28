import { useMemo, useState } from "react";
import { cdf } from "../../../engine/normal";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { Band, Curve, Label, Marker, Plot, VLine } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";
import { M } from "../../../ui/Math";

const SQ2PI = Math.sqrt(2 * Math.PI);

/**
 * Build the normal curve one symbol at a time — and each symbol arrives with its own knob: σ, then μ.
 * The last two steps are about area: drag two posts, then snap them to ±1σ, ±2σ, ±3σ ("a three-sigma day").
 */
export function F6Gaussian() {
  const [step, setStep] = useState(0);
  const [sig, setSig] = useState(1.4);
  const [mu, setMu] = useState(0);
  const [lo, setLo] = useState(-1);
  const [hi, setHi] = useState(1);
  const [drag, setDrag] = useState<"lo" | "hi" | null>(null);

  // which curve at which step
  const curveIdx = Math.min(step, 3);
  const fns = useMemo(() => {
    const f0 = (x: number) => Math.exp(-x * x);
    const f1 = (x: number) => Math.exp(-(x * x) / (2 * sig * sig));
    const f2 = (x: number) => Math.exp(-((x - mu) * (x - mu)) / (2 * sig * sig));
    const f3 = (x: number) => f2(x) / (sig * SQ2PI);
    return [f0, f1, f2, f3];
  }, [sig, mu]);
  const samp = (g: (x: number) => number) => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= 240; i++) {
      const x = -5 + (10 * i) / 240;
      out.push([x, g(x)]);
    }
    return out;
  };
  const curves = useMemo(() => fns.map(samp), [fns]);
  const c = curves[curveIdx];
  const peak = 1 / (sig * SQ2PI);
  const ymax = curveIdx >= 3 ? Math.max(0.3, 1.15 * peak) : 1.1;
  const areaRaw = sig * SQ2PI; // area under e^{-(x-μ)²/2σ²}
  const prob = cdf((hi - mu) / sig) - cdf((lo - mu) / sig);
  const inside = c.filter((p) => p[0] >= lo && p[0] <= hi);
  const snap = (z: number) => {
    setLo(mu - z * sig);
    setHi(mu + z * sig);
  };
  const pct = (v: number) => (100 * v).toFixed(v > 0.99 ? 2 : 1) + " %";

  const steps = [
    {
      tex: "\\tok{approx}{e^{-x^{2}}}",
      cap: <>Start with the simplest hump there is: e to the minus x squared. Height 1 in the middle, symmetric, and it dies off fast — faster than any power of x.</>,
    },
    {
      tex: "e^{-x^{2}/\\,2\\tok{approx}{\\sigma}^{2}}",
      cap: (
        <>
          <strong>Give it a width.</strong> σ is the knob — it just appeared below. Double σ and the hump is twice as wide. (The 2 in 2σ² is bookkeeping so that σ comes out as
          exactly the standard deviation you already know.)
        </>
      ),
    },
    {
      tex: "e^{-(x-\\tok{approx}{\\mu})^{2}/\\,2\\sigma^{2}}",
      cap: (
        <>
          <strong>Give it a centre.</strong> Replace x by x − μ and the hump slides to μ without changing shape. Second knob. Slide it; then slide σ again and notice that
          one knob never disturbs the other.
        </>
      ),
    },
    {
      tex: "\\frac{1}{\\tok{approx}{\\sigma\\sqrt{2\\pi}}}\\,e^{-(x-\\mu)^{2}/2\\sigma^{2}}",
      cap: (
        <>
          <strong>Make the area 1.</strong> The area under your hump is σ√(2π) — right now {areaRaw.toFixed(2)}. Divide by it and the total area is exactly 1, so the curve can
          carry probability. Wiggle σ: the hump gets wider and shorter, area fixed.
        </>
      ),
    },
    {
      tex: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}\\,e^{-(x-\\mu)^{2}/2\\sigma^{2}}",
      cap: (
        <>
          <strong>Area, not height, is probability.</strong> Drag the two posts on the plot. The shaded area is the chance of landing between them: {pct(prob)}. The height at a
          point is a <strong>density</strong> — probability per unit of x — not a probability of anything.
        </>
      ),
    },
    {
      tex: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}\\,e^{-(x-\\mu)^{2}/2\\sigma^{2}}",
      cap: (
        <>
          People on the desk say "that was a three-sigma day". Here is what they mean. Snap the posts to ±1σ, ±2σ, ±3σ and read the area: 68 %, 95 %, 99.7 %. Beyond
          3σ there is {pct(1 - (cdf(3) - cdf(-3)))} — if this is the right curve.
        </>
      ),
    },
  ];

  const showPosts = step >= 4;

  return (
    <Figure
      n="6"
      prompt="The curve itself, built one symbol at a time — and every symbol brings its own knob."
      controls={
        <>
          {step >= 1 && <Slider label="width σ" value={sig} min={0.5} max={2.5} step={0.05} onChange={setSig} role="approx" />}
          {step >= 2 && <Slider label="centre μ" value={mu} min={-2} max={2} step={0.05} onChange={setMu} role="approx" />}
          {step >= 5 && (
            <span className="toggle-row">
              <button type="button" className="btn" onClick={() => snap(1)}>
                ±1σ
              </button>
              <button type="button" className="btn" onClick={() => snap(2)}>
                ±2σ
              </button>
              <button type="button" className="btn" onClick={() => snap(3)}>
                ±3σ
              </button>
            </span>
          )}
          {step === 0 && <span className="footnote">no knobs yet — press Forward</span>}
          {showPosts && (
            <span className="readouts">
              <span>
                <span className="k">between the posts </span>
                <span className="v">{pct(prob)}</span>
                <span className="k"> · that is </span>
                <span className="v">
                  {((lo - mu) / sig).toFixed(1)}σ to {((hi - mu) / sig).toFixed(1)}σ
                </span>
              </span>
            </span>
          )}
        </>
      }
      observe={
        step === 5 ? (
          <>
            A value's distance from the centre, in units of σ, is its <strong>z-score</strong>. "A 3σ day" means z = 3, which this curve says happens about 0.13 % of the time on
            each side. Whether the curve is right is chapter A1's question — and Figure 9 gives a first hint.
          </>
        ) : undefined
      }
    >
      <StepThrough
        steps={steps.map((s) => ({ caption: s.cap }))}
        onStep={setStep}
        render={(i) => {
          const s = steps[i];
          return (
            <>
              <Plot
                xDomain={[-5, 5]}
                yDomain={[0, ymax]}
                xLabel="x"
                yLabel={curveIdx >= 3 ? "density" : "height"}
                height={290}
                ariaLabel="The normal density being built up"
                onDrag={
                  showPosts
                    ? (x, _y, phase) => {
                        if (phase === "down") {
                          const which = Math.abs(x - lo) < Math.abs(x - hi) ? "lo" : "hi";
                          setDrag(which);
                          if (which === "lo") setLo(Math.min(x, hi - 0.05));
                          else setHi(Math.max(x, lo + 0.05));
                        } else if (phase === "move" && drag) {
                          if (drag === "lo") setLo(Math.max(-5, Math.min(x, hi - 0.05)));
                          else setHi(Math.min(5, Math.max(x, lo + 0.05)));
                        } else if (phase === "up") setDrag(null);
                      }
                    : undefined
                }
              >
                {showPosts && <Band upper={inside} lower={inside.map((p) => [p[0], 0])} role="approx" />}
                {curveIdx > 0 && curveIdx < 3 && <Curve pts={curves[curveIdx - 1]} role="ghost" />}
                <Curve pts={c} role={curveIdx >= 3 ? "truth" : "approx"} />
                {curveIdx >= 2 && <VLine at={mu} />}
                {curveIdx >= 2 && <Label at={[mu, ymax * 0.95]} text="μ" dx={4} dy={0} role="approx" />}
                {curveIdx >= 1 && curveIdx < 3 && (
                  <>
                    <VLine at={(curveIdx >= 2 ? mu : 0) + sig} />
                    <Label at={[(curveIdx >= 2 ? mu : 0) + sig, ymax * 0.95]} text="+σ" dx={4} dy={0} role="approx" />
                  </>
                )}
                {showPosts && (
                  <>
                    <VLine at={lo} role="approx" />
                    <VLine at={hi} role="approx" />
                    <Marker at={[lo, fns[3](lo)]} role="approx" r={6} />
                    <Marker at={[hi, fns[3](hi)]} role="approx" r={6} />
                    <Label at={[mu, ymax * 0.93]} text={`${pct(prob)} of the area`} anchor="middle" dx={0} dy={0} />
                  </>
                )}
              </Plot>
              <div className="n2-formula">
                <M block tex={s.tex} />
              </div>
            </>
          );
        }}
      />
    </Figure>
  );
}
