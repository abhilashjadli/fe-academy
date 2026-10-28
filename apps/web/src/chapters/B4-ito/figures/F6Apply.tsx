import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Segmented, Slider, Readouts } from "../../../ui/controls";
import { M } from "../../../ui/Math";
import { fmt } from "../../../ui/Plot";
import { itoDrift, itoDiffusion } from "../../../engine/ito";

type Fn = "ln" | "sq" | "sqrt" | "exp";

const FNS: Record<Fn, { tex: string; name: string; fx: (x: number) => number; fxx: (x: number) => number; fxTex: string; fxxTex: string; story: string }> = {
  ln: { tex: "\\ln S", name: "the log of the price", fx: (x) => 1 / x, fxx: (x) => -1 / (x * x), fxTex: "1/S", fxxTex: "-1/S^2", story: "Bends down, so the toll is a charge: the log drifts slower than the price. This is the −½σ² that sets a typical year below the average one." },
  sq: { tex: "S^2", name: "the price squared", fx: (x) => 2 * x, fxx: () => 2, fxTex: "2S", fxxTex: "2", story: "Bends up, so the toll is a bonus: S² drifts faster than you'd guess from the chain rule. The square from Figure 2, with a price in it." },
  sqrt: { tex: "\\sqrt{S}", name: "the square root of the price", fx: (x) => 0.5 / Math.sqrt(x), fxx: (x) => -0.25 / Math.pow(x, 1.5), fxTex: "\\tfrac{1}{2\\sqrt S}", fxxTex: "-\\tfrac{1}{4}S^{-3/2}", story: "Bends down a little, so a small charge. Interest-rate models that take square roots pay this toll every step." },
  exp: { tex: "e^{S}", name: "the exponential of the price", fx: (x) => Math.exp(x), fxx: (x) => Math.exp(x), fxTex: "e^S", fxxTex: "e^S", story: "Bends up hard, so a large bonus. Anything convex gets paid by wobble — which is the whole reason options have value before expiry." },
};

/** Figure 6 — use it yourself: pick a function of the price and watch the lemma assemble its drift and jitter. */
export function F6Apply() {
  const [fn, setFn] = useState<Fn>("ln");
  const [sigma, setSigma] = useState(0.4);
  const mu = 0.1,
    S = 100;
  const f = FNS[fn];
  // dS = μS dt + σS dW  → a = μS, b = σS
  const a = mu * S,
    b = sigma * S;
  const chain = a * f.fx(S); // what the chain rule alone would say
  const toll = 0.5 * b * b * f.fxx(S);
  const drift = itoDrift(0, f.fx(S), f.fxx(S), a, b);
  const jitter = itoDiffusion(f.fx(S), b);
  const rel = (v: number) => (fn === "ln" ? fmt.n(3)(v) : fmt.n(2)(v));

  return (
    <Figure
      n="6"
      prompt="Use it yourself. The price S wobbles as dS = μS dt + σS dW. Pick a function of S and the lemma tells you how that function wobbles."
      controls={
        <>
          <Segmented
            label="f(S) ="
            options={[
              { id: "ln", label: "ln S" },
              { id: "sq", label: "S²" },
              { id: "sqrt", label: "√S" },
              { id: "exp", label: "eˢ" },
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
          f is the slope times the wobble — the chain rule is right about that part. {f.story}
        </>
      }
    >
      <div className="b4-apply">
        <M block tex={`f = ${f.tex},\\qquad f' = ${f.fxTex},\\qquad f'' = ${f.fxxTex}`} />
        <M
          block
          tex={`df = \\Big(\\underbrace{\\tok{approx}{\\mu S f'}}_{\\text{chain rule}} + \\underbrace{\\tok{truth}{\\tfrac12\\sigma^2 S^2 f''}}_{\\text{the toll}}\\Big)dt + \\tok{approx}{\\sigma S f'}\\,dW`}
        />
        <Readouts
          items={[
            [`at S = 100, μ = 10 %, σ = ${fmt.pct(0)(sigma)}: chain rule alone`, <span className="b4-approx">{rel(chain)} per year</span>],
            ["the toll (half bend × wobble²)", <span className={toll < 0 ? "b4-bad" : "b4-good"}>{toll >= 0 ? "+" : ""}{rel(toll)} per year</span>],
            ["drift of f", <strong>{rel(drift)} per year</strong>],
            ["jitter of f", `${rel(jitter)} × dW`],
          ]}
        />
        {fn === "ln" && (
          <p className="footnote">
            For ln S the price cancels and the toll is exactly −½σ² = −{fmt.n(3)(0.5 * sigma * sigma)}: the same number whatever the price. Solve this
            one line and you get the price formula S<sub>T</sub> = S<sub>0</sub> e<sup>(μ − ½σ²)T + σW<sub>T</sub></sup> — the "lognormal" of chapter A1.
          </p>
        )}
      </div>
    </Figure>
  );
}
