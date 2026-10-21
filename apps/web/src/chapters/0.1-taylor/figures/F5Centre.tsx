import { useMemo, useState } from "react";
import { FUNCTIONS, sample, taylor } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Band, Curve, Label, Marker, Plot, VLine } from "../../../ui/Plot";
import { Segmented, Stepper } from "../../../ui/controls";
import { M } from "../../../ui/Math";

type FnId = "cos" | "ln" | "sqrt1p";

/** Drag the expansion point: the series knows the function near wherever you ask. */
export function F5Centre() {
  const [fn, setFn] = useState<FnId>("cos");
  const [n, setN] = useState(3);
  const f = FUNCTIONS[fn];
  const [x0, x1] = f.domain;
  const [a, setA] = useState<number>(f.a0 + (fn === "cos" ? 1 : 0.5));
  const ydom: [number, number] = fn === "cos" ? [-2.2, 2.2] : fn === "ln" ? [-3, 2] : [-0.5, 2.5];
  const truth = useMemo(() => sample((x) => f.deriv(0, x), x0, x1, 241), [fn]);
  const poly = useMemo(() => sample((x) => taylor(f, n, a, x), x0, x1, 241), [fn, n, a]);
  const r = f.radius(a);

  return (
    <Figure
      n="5"
      prompt={<>Drag the centre point along the curve. The polynomial re-centres and the fit moves with it.</>}
      controls={
        <>
          <Segmented
            label="function"
            value={fn}
            onChange={(v) => {
              setFn(v);
              setA(FUNCTIONS[v].a0 + (v === "cos" ? 1 : 0.5));
            }}
            options={[
              { id: "cos", label: "cos x" },
              { id: "ln", label: "ln x" },
              { id: "sqrt1p", label: "√(1+x)" },
            ]}
          />
          <Stepper label="terms n" value={n} min={1} max={8} onChange={setN} />
          <span className="readouts">
            <span>
              <span className="k">centre a = </span>
              <span className="v">{a.toFixed(2)}</span>
            </span>
            {Number.isFinite(r) && (
              <span>
                <span className="k">fit cannot reach beyond </span>
                <span className="v">{(a + r).toFixed(2)}</span>
                <span className="k"> or below </span>
                <span className="v">{(a - r).toFixed(2)}</span>
              </span>
            )}
          </span>
        </>
      }
      observe={
        <>
          The information lives at one point and radiates outward. This is the general form, which only differs from Figure 2 in replacing x by the distance from the centre:
          <M block tex="f(x) \;\approx\; \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}\,(x-a)^k \;=\; f(a) + f'(a)\,(x-a) + \tfrac12 f''(a)\,(x-a)^2 + \cdots" />
          {fn !== "cos" && <>For ln x and √(1+x) the fit has a hard edge — the dotted lines — however many terms you add. Figure 6 is about that edge.</>}
        </>
      }
    >
      <Plot xDomain={[x0, x1]} yDomain={ydom} xLabel="x" height={320} onDrag={(x) => setA(Math.max(x0 + 0.02, Math.min(x1 - 0.02, x)))} ariaLabel="Taylor polynomial with a draggable centre">
        <Band upper={truth} lower={poly} role="error" />
        {Number.isFinite(r) && (
          <>
            <VLine at={a + r} />
            <VLine at={a - r} />
          </>
        )}
        <Curve pts={poly} role="approx" />
        <Curve pts={truth} role="truth" />
        <VLine at={a} role="approx" />
        <Marker at={[a, f.deriv(0, a)]} role="ink" r={6} />
        <Label at={[a, f.deriv(0, a)]} text="a — drag" dx={10} dy={-10} />
      </Plot>
    </Figure>
  );
}
