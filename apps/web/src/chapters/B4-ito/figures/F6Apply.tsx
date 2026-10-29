import { useEffect, useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Segmented, Slider, Readouts } from "../../../ui/controls";
import { M } from "../../../ui/Math";
import { Band, Curve, Label, Marker, Plot, VLine, fmt, type Pt } from "../../../ui/Plot";
import { CURVATURE_TERM, itoDrift, itoDiffusion } from "../../../engine/ito";

type Fn = "lin" | "ln" | "sq" | "sqrt" | "exp";

/**
 * The four functions. `f`, `fx`, `fxx` are of the price S; `toll` is ½ f″(S) b² from the engine's CURVATURE_TERM.
 * e^{S/100} is e^x at x = S/100, so its toll is CURVATURE_TERM["eˣ"] at (S/100, b/100).
 */
const FNS: Record<
  Fn,
  { tex: string; name: string; f: (x: number) => number; fx: (x: number) => number; fxx: (x: number) => number; fxTex: string; fxxTex: string; toll: (S: number, b: number) => number; story: string }
> = {
  lin: {
    tex: "2S",
    name: "twice the price (a straight line)",
    f: (x) => 2 * x,
    fx: () => 2,
    fxx: () => 0,
    fxTex: "2",
    fxxTex: "0",
    toll: () => 0,
    story: "No bend, no toll: for a straight line the chain rule is exactly right. That is the control case — the lemma only adds something when f curves.",
  },
  ln: {
    tex: "\\ln S",
    name: "the log of the price",
    f: Math.log,
    fx: (x) => 1 / x,
    fxx: (x) => -1 / (x * x),
    fxTex: "1/S",
    fxxTex: "-1/S^2",
    toll: CURVATURE_TERM["ln x"],
    story: "Bends down, so the toll is a charge: the log drifts slower than the price. This is the −½σ² that sets a typical year below the average one.",
  },
  sq: {
    tex: "S^2",
    name: "the price squared",
    f: (x) => x * x,
    fx: (x) => 2 * x,
    fxx: () => 2,
    fxTex: "2S",
    fxxTex: "2",
    toll: CURVATURE_TERM["x²"],
    story: "Bends up, so the toll is a bonus: S² drifts faster than you'd guess from the chain rule. The square from Figure 2, with a price in it.",
  },
  sqrt: {
    tex: "\\sqrt{S}",
    name: "the square root of the price",
    f: Math.sqrt,
    fx: (x) => 0.5 / Math.sqrt(x),
    fxx: (x) => -0.25 / Math.pow(x, 1.5),
    fxTex: "\\tfrac{1}{2\\sqrt S}",
    fxxTex: "-\\tfrac{1}{4}S^{-3/2}",
    toll: CURVATURE_TERM["√x"],
    story: "Bends down a little, so a small charge. Interest-rate models that take square roots pay this toll every step.",
  },
  exp: {
    tex: "e^{S/100}",
    name: "the exponential of the price",
    f: (x) => Math.exp(x / 100),
    fx: (x) => Math.exp(x / 100) / 100,
    fxx: (x) => Math.exp(x / 100) / 10000,
    fxTex: "e^{S/100}/100",
    fxxTex: "e^{S/100}/10^4",
    toll: (S, b) => CURVATURE_TERM["eˣ"](S / 100, b / 100),
    story: "Bends up hard, so a large bonus. Anything convex gets paid by wobble — which is the whole reason options have value before expiry.",
  },
};

const S = 100,
  MU = 0.1,
  DT = 0.25; // the drawn step: one quarter-year

const f2 = fmt.n(2);
/** 2 dp with a sign, never "−0.00". */
const signed = (v: number) => {
  const s = f2(Math.abs(v));
  return s === "0.00" ? "0.00" : (v < 0 ? "−" : "+") + s;
};

/** Phone width: a narrower plot so its text stays readable, and short step labels. */
function useNarrow() {
  const [narrow, setNarrow] = useState(() => (typeof window !== "undefined" ? window.matchMedia("(max-width: 640px)").matches : false));
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

/** Figure 6 — use it yourself: pick a function of the price and watch the lemma assemble its drift and jitter. The curvature gap is drawn first. */
export function F6Apply() {
  const [fn, setFn] = useState<Fn>("ln");
  const [sigma, setSigma] = useState(0.4);
  const narrow = useNarrow();
  const F = FNS[fn];
  // dS = μS dt + σS dW  → a = μS, b = σS
  const a = MU * S,
    b = sigma * S;
  const chain = a * F.fx(S); // what the chain rule alone would say
  const toll = F.toll(S, b); // ½ f″ b², per year
  const drift = itoDrift(0, F.fx(S), F.fxx(S), a, b);
  const jitter = itoDiffusion(F.fx(S), b);
  const bonus = toll > 0;

  // the picture: f near S with its slope line laid flat — we draw g(x) = f(x) − [f(S) + f′(S)(x − S)], the bend alone —
  // and the sliver between curve and line over one step ±σS√Δt. The x-range is fixed (the largest σ fits), so the sliver grows with σ.
  const step = b * Math.sqrt(DT);
  const tollStep = toll * DT; // ½ f″ · step², the expected area per step
  const pic = useMemo(() => {
    const dMax = 0.8 * S * Math.sqrt(DT);
    const x0 = S - 1.3 * dMax,
      x1 = S + 1.3 * dMax;
    const fS = F.f(S),
      slope = F.fx(S);
    const g = (x: number) => F.f(x) - (fS + slope * (x - S));
    const N = 100;
    const curve: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      curve.push([x, g(x)]);
    }
    const lo = S - step,
      hi = S + step;
    const gapCurve: Pt[] = [],
      gapLine: Pt[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = lo + ((hi - lo) * i) / 40;
      gapCurve.push([x, g(x)]);
      gapLine.push([x, 0]);
    }
    const ys = curve.map((p) => p[1]);
    const yMin = Math.min(0, ...ys),
      yMax = Math.max(0, ...ys);
    // a bonus curve sits above the line, so the labels below the line need more room
    const pad = (yMax - yMin) * (yMax > -yMin ? 0.24 : 0.14) || 1;
    return { x0, x1, curve, gapCurve, gapLine, lo, hi, g, yDomain: [yMin - pad, yMax + pad] as [number, number] };
  }, [F, step]);

  return (
    <Figure
      n="6"
      prompt="Use it yourself. The price S wobbles as dS = μS dt + σS dW. Pick a function of S and the lemma tells you how that function wobbles."
      controls={
        <>
          <Segmented
            label="f(S) ="
            options={[
              { id: "lin", label: "2S" },
              { id: "ln", label: "ln S" },
              { id: "sq", label: "S²" },
              { id: "sqrt", label: "√S" },
              { id: "exp", label: "exp(S/100)" },
            ]}
            value={fn}
            onChange={setFn}
          />
          <Slider label="σ, the wobble" value={sigma} min={0.05} max={0.8} step={0.05} onChange={setSigma} fmt={fmt.pct(0)} />
        </>
      }
      observe={
        <>
          <strong>The recipe, in words:</strong> the drift of f is what the chain rule says, <em>plus</em> half the bend times the wobble squared. The jitter of
          f is the slope times the wobble, here {f2(jitter)} × dW — the chain rule is right about that part. {F.story}
        </>
      }
    >
      <div className="b4-apply">
        <Plot
          xDomain={[pic.x0, pic.x1]}
          yDomain={pic.yDomain}
          width={narrow ? 400 : 640}
          height={narrow ? 250 : 280}
          margin={{ top: 14, right: 14, bottom: 34, left: narrow ? 46 : 54 }}
          xLabel="price S"
          yLabel={narrow ? undefined : "the bend of f(S)"}
          xTicks={5}
          yTicks={4}
          axisX={pic.x0}
          axisY={0}
          ariaLabel="The curve f(S) near S = 100 drawn against its slope line, with the sliver between them shaded over one jittery step"
        >
          {/* the sliver between curve and line over one step: a bonus (blue) above the line or a charge (red) below it */}
          <Band upper={pic.gapCurve} lower={pic.gapLine} role={bonus ? "truth" : "error"} />
          <Curve pts={pic.gapCurve} role={bonus ? "truth" : "error"} width={2.4} />
          <VLine at={pic.lo} />
          <VLine at={pic.hi} />
          <Curve pts={[[pic.x0, 0], [pic.x1, 0]]} role="approx" width={1.6} dash="6 4" smooth={false} />
          <Curve pts={pic.curve} role="ink" width={1.6} />
          <Marker at={[S, 0]} role="ink" r={4} />
          <Marker at={[pic.lo, pic.g(pic.lo)]} role={bonus ? "truth" : "error"} r={4} />
          <Marker at={[pic.hi, pic.g(pic.hi)]} role={bonus ? "truth" : "error"} r={4} />
          <Label at={[pic.x1, pic.g(pic.x1)]} text="the curve f(S)" anchor="end" dx={-4} dy={bonus ? -8 : 15} />
          <Label at={[narrow ? pic.x0 : pic.x1, 0]} text={narrow ? "its slope line" : "its slope line, laid flat"} role="approx" anchor={narrow ? "start" : "end"} dx={narrow ? 4 : -4} dy={bonus ? 15 : -8} />
          {/* the step labels sit at the foot of the guides (on a phone, at the head when the curve is a bonus, where it is empty); the toll label sits on the empty side of the line */}
          <Label at={[pic.lo, narrow && bonus ? pic.yDomain[1] : pic.yDomain[0]]} text={narrow ? f2(pic.lo) : `S − σS√Δt = ${f2(pic.lo)}`} anchor="end" dx={-4} dy={narrow && bonus ? 14 : -6} />
          <Label at={[pic.hi, narrow && bonus ? pic.yDomain[1] : pic.yDomain[0]]} text={narrow ? f2(pic.hi) : `S + σS√Δt = ${f2(pic.hi)}`} anchor="start" dx={4} dy={narrow && bonus ? 14 : -6} />
          <Label at={[S, 0]} text={`${narrow ? "the toll" : "the toll per step: ½ × bend × step²"} = ${signed(tollStep)}`} role={bonus ? "truth" : "error"} anchor="middle" dx={0} dy={bonus ? 20 : -12} />
        </Plot>
        <p className="footnote" style={{ margin: "0.2rem 0 0.6rem" }}>
          One step of a quarter-year: the price lands σS√Δt = {f2(step)} either side of S = 100, on the curve, not on the line. Drawn with the slope line laid
          flat so the bend shows. The sliver is {bonus ? "above the line — a bonus" : "below the line — a charge"}; averaged over steps it is worth ½ f″ b² per year.
        </p>
        <M block tex={`f = ${F.tex},\\qquad f' = ${F.fxTex},\\qquad f'' = ${F.fxxTex}`} />
        <div style={{ fontSize: "clamp(0.68rem, 3.1vw, 1rem)" }}>
        <M
          block
          tex={`df = \\Big(\\underbrace{\\tok{approx}{\\mu S f'}}_{\\text{chain rule}} + \\underbrace{\\tok{truth}{\\tfrac12\\sigma^2 S^2 f''}}_{\\text{the toll}}\\Big)dt + \\tok{approx}{\\sigma S f'}\\,dW`}
        />
        </div>
        <Readouts
          items={[
            [`at S = 100, μ = 10 %, σ = ${fmt.pct(0)(sigma)}: chain rule alone`, <span className="b4-approx">{f2(chain)} per year</span>],
            ["the toll (half bend × wobble²)", <span className={bonus ? "b4-good" : "b4-bad"}>{signed(toll)} per year</span>],
            ["drift of f", <strong>{f2(drift)} per year</strong>],
          ]}
        />
        {fn === "ln" && (
          <p className="footnote">
            For ln S the price cancels and the toll is exactly −½σ² = −{f2(0.5 * sigma * sigma)}: the same number whatever the price. Solve this one line
            and you get the price formula S<sub>T</sub> = S<sub>0</sub> e<sup>(μ − ½σ²)T + σW<sub>T</sub></sup> — the "lognormal" of chapter A1.
          </p>
        )}
      </div>
    </Figure>
  );
}
