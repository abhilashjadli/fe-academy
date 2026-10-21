import { useMemo, useState } from "react";
import { FUNCTIONS, coefficients, sample, taylor, type TaylorFn } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Band, Curve, Marker, Plot, Tip, VLine, fmt } from "../../../ui/Plot";
import { Segmented, Stepper } from "../../../ui/controls";
import { M } from "../../../ui/Math";

type FnId = "cos" | "exp" | "ln" | "sqrt1p";
const LIB: Record<FnId, TaylorFn> = FUNCTIONS as Record<FnId, TaylorFn>;
const Y_DOMAIN: Record<FnId, [number, number]> = { cos: [-2.2, 2.2], exp: [-2, 12], ln: [-3, 2], sqrt1p: [-0.5, 2.5] };
const MAX_N: Record<FnId, number> = { cos: 10, exp: 10, ln: 12, sqrt1p: 10 };
const X_LABEL: Record<FnId, string> = { cos: "x", exp: "x", ln: "x", sqrt1p: "x" };

function termTex(k: number, c: number, a: number, varName: string, highlight: boolean): string {
  const h = a === 0 ? varName : `(${varName} - ${fmtA(a)})`;
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

export function F4BuildUp() {
  const [fn, setFn] = useState<FnId>("cos");
  const [n, setN] = useState(0);
  const [probe, setProbe] = useState<number | null>(null);
  const f = LIB[fn];
  const a = f.a0;
  const [x0, x1] = f.domain;
  const nn = Math.min(n, MAX_N[fn]);

  const truth = useMemo(() => sample((x) => f.deriv(0, x), x0, x1, 241), [fn]);
  const poly = useMemo(() => sample((x) => taylor(f, nn, a, x), x0, x1, 241), [fn, nn]);
  const ghost = useMemo(() => (nn > 0 ? sample((x) => taylor(f, nn - 1, a, x), x0, x1, 241) : null), [fn, nn]);
  const cs = coefficients(f, nn, a);
  const varName = "x";
  const prefix = cs.map((c, k) => termTex(k, c, a, varName, k === nn)).join("");

  const px = probe ?? (fn === "ln" ? 2.2 : 1.5);
  const fv = f.deriv(0, px);
  const pv = taylor(f, nn, a, px);
  const fm = fmt.n(4);

  return (
    <Figure
      n="4"
      prompt={
        <>
          Add one term at a time and watch <span className="tok-approx">the polynomial</span> hug <span className="tok-truth">the function</span> further from the centre. Drag on the plot to move the probe.
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
              setProbe(null);
            }}
            options={[
              { id: "cos", label: "cos x" },
              { id: "exp", label: "eˣ" },
              { id: "ln", label: "ln x" },
              { id: "sqrt1p", label: "√(1+x)" },
            ]}
          />
          <Stepper label="terms n" value={nn} min={0} max={MAX_N[fn]} onChange={setN} />
          <span className="readouts">
            <span>
              <span className="k">at {varName} = {fmt.n(2)(px)}: </span>
              <span className="v tok-truth">{fm(fv)}</span>
              <span className="k"> vs </span>
              <span className="v tok-approx">{fm(pv)}</span>
              <span className="k"> gap </span>
              <span className="v tok-error">{fmt.sci(Math.abs(fv - pv))}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          The shaded band is the gap. It is tiny near the centre and grows with distance; every added term pushes the edge of "tiny" outward. The ghost is the previous polynomial, so you can see exactly what the newest term bought.
        </>
      }
    >
      <Plot
        xDomain={[x0, x1]}
        yDomain={Y_DOMAIN[fn]}
        xLabel={X_LABEL[fn]}
        height={340}
        onDrag={(x) => setProbe(Math.max(x0, Math.min(x1, x)))}
        ariaLabel="Function with its Taylor polynomial of increasing degree"
      >
        <Band upper={truth} lower={poly} role="error" />
        {ghost && <Curve pts={ghost} role="ghost" />}
        <Curve pts={poly} role="approx" />
        <Curve pts={truth} role="truth" />
        <VLine at={a} />
        <Marker at={[a, f.deriv(0, a)]} role="ink" r={4} />
        <VLine at={px} />
        <Marker at={[px, fv]} role="truth" r={4} />
        <Marker at={[px, pv]} role="approx" r={4} />
        <Tip at={[px, fv]} lines={[`${varName} = ${fmt.n(2)(px)}`, `f: ${fm(fv)}`, `P${nn}: ${fm(pv)}`]} />
      </Plot>
      <M block tex={`\\tok{approx}{P_{${nn}}(${varName})} = ${prefix}`} />
    </Figure>
  );
}
