import { useMemo, useState } from "react";
import { FUNCTIONS, coefficients, sample, taylor, type TaylorFn } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Band, Curve, Label, Marker, Plot, VLine, fmt } from "../../../ui/Plot";
import { Segmented, Stepper } from "../../../ui/controls";
import { M } from "../../../ui/Math";

type FnId = "cos" | "exp" | "ln" | "sqrt1p";
const LIB: Record<FnId, TaylorFn> = FUNCTIONS as Record<FnId, TaylorFn>;
const Y_DOMAIN: Record<FnId, [number, number]> = { cos: [-2.2, 2.2], exp: [-2, 12], ln: [-3, 2], sqrt1p: [-0.5, 2.5] };
const MAX_N: Record<FnId, number> = { cos: 10, exp: 10, ln: 12, sqrt1p: 10 };
const START_A: Record<FnId, number> = { cos: 0, exp: 0, ln: 1, sqrt1p: 0 };

function termTex(k: number, c: number, a: number, highlight: boolean): string {
  const h = a === 0 ? "x" : `(x - ${fmtA(a)})`;
  const mag = Math.abs(c);
  const num = mag < 1e-12 ? "0" : fmt.g(3)(mag);
  const one = Math.abs(mag - 1) < 1e-12;
  const coefTex = one && k > 0 ? "" : `${num}\\,`;
  const body = k === 0 ? num : mag < 1e-12 ? `0\\,${h}${k === 1 ? "" : `^{${k}}`}` : k === 1 ? `${coefTex}${h}` : `${coefTex}${h}^{${k}}`;
  const sign = c < 0 ? "-" : "+";
  const t = highlight ? `\\tok{approx}{${body}}` : `\\tok{dim}{${body}}`;
  return (k === 0 ? (c < 0 ? "-" : "") : ` ${sign} `) + t;
}
const fmtA = (a: number) => (Number.isInteger(a) ? String(a) : a.toFixed(2));

/** One figure: add terms with the stepper, drag the centre along the curve. The ghost is the polynomial one term ago. */
export function F3BuildUp() {
  const [fn, setFn] = useState<FnId>("cos");
  const [n, setN] = useState(0);
  const [a, setA] = useState<number>(0);
  const f = LIB[fn];
  const [x0, x1] = f.domain;
  const nn = Math.min(n, MAX_N[fn]);

  const truth = useMemo(() => sample((x) => f.deriv(0, x), x0, x1, 241), [fn]);
  const poly = useMemo(() => sample((x) => taylor(f, nn, a, x), x0, x1, 241), [fn, nn, a]);
  const ghost = useMemo(() => (nn > 0 ? sample((x) => taylor(f, nn - 1, a, x), x0, x1, 241) : null), [fn, nn, a]);
  const cs = coefficients(f, nn, a);
  const prefix = cs.map((c, k) => termTex(k, c, a, k === nn)).join("");
  const r = f.radius(a);
  const walls = Number.isFinite(r);

  return (
    <Figure
      n="3"
      prompt={
        <>
          Add one term at a time with <span className="num">+</span> and watch <span className="tok-approx">the polynomial</span> hug <span className="tok-truth">the function</span> further out. Then drag the
          centre point along the curve. The fainter curve — the ghost — is the polynomial one term ago.
        </>
      }
      controls={
        <>
          <Segmented
            label="function"
            value={fn}
            onChange={(v) => {
              setFn(v);
              setN(0);
              setA(START_A[v]);
            }}
            options={[
              { id: "cos", label: "cos x" },
              { id: "exp", label: "eˣ" },
              { id: "ln", label: "ln x" },
              { id: "sqrt1p", label: "√(1+x)" },
            ]}
          />
          <Stepper label="terms" value={nn} min={0} max={MAX_N[fn]} onChange={setN} />
          <span className="readouts">
            <span>
              <span className="k">centre at x = </span>
              <span className="v">{a.toFixed(2)}</span>
            </span>
            {walls && (
              <span>
                <span className="k">the fit cannot reach past </span>
                <span className="v tok-error">{(a + r).toFixed(2)}</span>
                <span className="k"> or </span>
                <span className="v tok-error">{(a - r).toFixed(2)}</span>
              </span>
            )}
          </span>
        </>
      }
      observe={
        <>
          The shaded gap is thinnest at the centre and widens as you walk away: the polynomial knows the function <em>at one point</em>. Each new term pushes the
          good region outward; drag the centre and the knowledge moves with it. For ln x and √(1+x) two red walls appear, and no number of terms crosses them.
          <details className="t-more">
            <summary>the recipe with the centre anywhere</summary>
            <p>Nothing was special about x = 0. Measure the derivatives at a point a, and the only change is that x becomes the distance from a:</p>
            <M block tex="f(x) \;\approx\; f(a) + f'(a)\,(x-a) + \tfrac12 f''(a)\,(x-a)^2 + \tfrac16 f'''(a)\,(x-a)^3 + \cdots" />
            <p>Read: value at a, plus slope at a times the distance, plus half the bend at a times the distance squared, and so on.</p>
          </details>
        </>
      }
    >
      <Plot
        xDomain={[x0, x1]}
        yDomain={Y_DOMAIN[fn]}
        xLabel="x"
        height={340}
        onDrag={(x) => setA(Math.max(x0 + 0.02, Math.min(x1 - 0.02, Math.round(x * 20) / 20)))}
        ariaLabel="Function with its Taylor polynomial of increasing degree and a draggable centre"
      >
        <Band upper={truth} lower={poly} role="error" />
        {walls && (
          <>
            <VLine at={a + r} role="error" />
            <VLine at={a - r} role="error" />
          </>
        )}
        {ghost && <Curve pts={ghost} role="ghost" />}
        <Curve pts={poly} role="approx" />
        <Curve pts={truth} role="truth" />
        <VLine at={a} />
        <Marker at={[a, f.deriv(0, a)]} role="ink" r={6} />
        <Label at={[a, f.deriv(0, a)]} text="centre — drag me" dx={10} dy={-10} />
        {walls && <Label at={[a + r, Y_DOMAIN[fn][1]]} text="wall" role="error" dx={4} dy={14} />}
      </Plot>
      <M block tex={`\\tok{approx}{P_{${nn}}(x)} = ${prefix}`} />
    </Figure>
  );
}
