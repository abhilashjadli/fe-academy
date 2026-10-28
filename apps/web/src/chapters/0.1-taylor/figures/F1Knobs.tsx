import { useMemo, useState } from "react";
import { polyEval, sample } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, VLine, fmt } from "../../../ui/Plot";
import { StepThrough } from "../../../ui/StepThrough";
import { Slider } from "../../../ui/controls";
import { M } from "../../../ui/Math";

const cosPts = sample(Math.cos, -3.5, 3.5, 241);
type C3 = [number, number, number];

/**
 * Figure 1 in two acts. Act one: three free knobs, make the yellow curve match cos x. Act two ("now show me why"):
 * the same plot and the same three sliders, but one decision per step and the knob locks when the decision is made.
 */
export function F1Knobs() {
  const [act, setAct] = useState<0 | 1>(0);
  const [c, setC] = useState<C3>([0.4, 0.6, 0.2]);
  const set = (i: number) => (v: number) => setC((old) => old.map((o, j) => (j === i ? v : o)) as C3);

  if (act === 1) return <DeriveAct free={c} setFree={setC} onBack={() => setAct(0)} />;

  const poly = sample((x) => polyEval(c, 0, x), -3.5, 3.5, 241);
  const e = (x: number) => Math.abs(Math.cos(x) - polyEval(c, 0, x));
  const f3 = fmt.n(3);
  const f2 = fmt.n(2);
  const close = e(0.1) < 1e-3 && e(1) < 0.05;

  return (
    <Figure
      n="1"
      prompt={
        <>
          Make <span className="tok-approx">the yellow curve</span> indistinguishable from <span className="tok-truth">cos x</span> near x = 0. Three knobs, three numbers.
        </>
      }
      controls={
        <>
          <Slider label={<M tex="\tok{approx}{c_0}" />} value={c[0]} min={-2} max={2} step={0.05} onChange={set(0)} role="approx" />
          <Slider label={<M tex="\tok{approx}{c_1}" />} value={c[1]} min={-2} max={2} step={0.05} onChange={set(1)} role="approx" />
          <Slider label={<M tex="\tok{approx}{c_2}" />} value={c[2]} min={-2} max={2} step={0.05} onChange={set(2)} role="approx" />
        </>
      }
      observe={
        <>
          <table className="table" style={{ maxWidth: 480 }}>
            <thead>
              <tr>
                <th></th>
                <th>at x = 0.1</th>
                <th>at x = 1</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="tok-truth">cos x</span>
                </td>
                <td>{f3(Math.cos(0.1))}</td>
                <td>{f3(Math.cos(1))}</td>
              </tr>
              <tr>
                <td>
                  <span className="tok-approx">your curve</span>
                </td>
                <td>{f3(polyEval(c, 0, 0.1))}</td>
                <td>{f3(polyEval(c, 0, 1))}</td>
              </tr>
              <tr>
                <td>
                  <span className="tok-error">gap</span>
                </td>
                <td>{f2(e(0.1))}</td>
                <td>{f2(e(1))}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ margin: "0.6em 0 0" }}>
            {close ? (
              <>
                <strong>That is it.</strong> Height 1, no tilt, a bend of about −½. Those three numbers are not a coincidence.
              </>
            ) : (
              <>
                Most people find <span className="num">c₀ = 1</span> at once, feel their way to <span className="num">c₁ = 0</span>, and hover near <span className="num">c₂ ≈ −0.5</span>. Notice that no setting fixes x = 1 and x = 0.1 at the same time.
              </>
            )}
          </p>
          <div className="t-act">
            <button type="button" className="btn primary" onClick={() => setAct(1)}>
              Now show me why
            </button>
            <span className="footnote">same plot, same knobs — one decision at a time</span>
          </div>
        </>
      }
    >
      <Plot xDomain={[-3.5, 3.5]} yDomain={[-2.2, 2.2]} xLabel="x" height={320} ariaLabel="cos x with an adjustable quadratic">
        <VLine at={0.1} />
        <VLine at={1} />
        <Curve pts={poly} role="approx" />
        <Curve pts={cosPts} role="truth" />
        <Marker at={[0.1, Math.cos(0.1)]} role="truth" r={4} />
        <Marker at={[0.1, polyEval(c, 0, 0.1)]} role="approx" r={4} />
        <Marker at={[1, Math.cos(1)]} role="truth" r={4} />
        <Marker at={[1, polyEval(c, 0, 1)]} role="approx" r={4} />
      </Plot>
      <M block tex={`\\tok{approx}{P(x)} = \\tok{approx}{c_0} + \\tok{approx}{c_1}\\,x + \\tok{approx}{c_2}\\,x^2 \\qquad\\text{currently}\\quad ${c[0].toFixed(2)} ${c[1] < 0 ? "-" : "+"} ${Math.abs(c[1]).toFixed(2)}\\,x ${c[2] < 0 ? "-" : "+"} ${Math.abs(c[2]).toFixed(2)}\\,x^2`} />
    </Figure>
  );
}

/** Act two: match height, slope, bend — one coefficient locks per step. (The locking sliders are kept exactly.) */
function DeriveAct({ free, setFree, onBack }: { free: C3; setFree: (f: C3) => void; onBack: () => void }) {
  const [step, setStep] = useState(0);

  // which coefficients are locked at each step
  const locked = [
    [false, false, false],
    [true, false, false],
    [true, false, false],
    [true, true, false],
    [true, true, false],
    [true, true, true],
    [true, true, true],
    [true, true, true],
  ][step];
  const c: C3 = [locked[0] ? 1 : free[0], locked[1] ? 0 : free[1], locked[2] ? -0.5 : free[2]];
  const poly = useMemo(() => sample((x) => polyEval(c, 0, x), -3.5, 3.5, 241), [c[0], c[1], c[2]]);
  const tangent = useMemo(() => sample(() => 1, -3.5, 3.5, 2), []);
  const set = (i: number) => (v: number) => setFree(free.map((o, j) => (j === i ? v : o)) as C3);
  const f4 = fmt.n(4);

  const polyTex = (() => {
    const t0 = locked[0] ? "1" : "c_0";
    const t1 = locked[1] ? "" : " + c_1\\,x";
    const t2 = locked[2] ? " - \\tfrac12\\,x^2" : " + c_2\\,x^2";
    return `\\tok{approx}{P(x)} = \\tok{approx}{${t0}${t1}${t2}}`;
  })();

  const steps = [
    {
      caption: (
        <>
          Three free numbers. You will pin them down one at a time by asking the polynomial to agree with <span className="tok-truth">cos x</span> at x = 0 — first in height, then in slope, then in bend.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>Height.</strong> At x = 0 every term with an x in it vanishes, so P(0) = c₀. And cos 0 = 1. So <span className="tok-approx">c₀ = 1</span>. The first knob locks.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>Slope.</strong> Draw the tangent to cos at 0: it is flat. The derivative of cos is −sin, and −sin 0 = 0. Try tilting the yellow curve with c₁ — only one value keeps it flat there.
        </>
      ),
    },
    {
      caption: (
        <>
          The polynomial's slope is P′(x) = c₁ + 2c₂x, which at 0 is just c₁. Flat means <span className="tok-approx">c₁ = 0</span>. Second knob locks.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>Bend.</strong> cos curves <em>downward</em> at 0. Its second derivative is −cos, and −cos 0 = −1. Move c₂: the yellow curve bends up for positive c₂, down for negative.
        </>
      ),
    },
    {
      caption: (
        <>
          Differentiate P twice: P″(x) = 2c₂ — the 2 comes from the power rule (x² → 2x → 2). Matching −1 gives <span className="tok-approx">c₂ = −½</span>. Third knob locks. That ½ is not a convention; it is the 2 from differentiating x² twice.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>Check with a number.</strong> cos(0.1) = {f4(Math.cos(0.1))}; the polynomial gives 1 − 0.005 = {f4(polyEval(c, 0, 0.1))}. Four decimals from three facts.
        </>
      ),
    },
    {
      caption: (
        <>
          Three facts at one point — <span className="num">height, slope, bend</span> — gave a curve that works nearby. That trade, local information for nearby values, is the whole chapter.
        </>
      ),
    },
  ];

  return (
    <Figure
      n="1"
      prompt={
        <>
          Now do it properly: match <span className="tok-truth">cos x</span> at x = 0 in height, slope and bend. The knobs lock as each decision is made.
        </>
      }
      controls={
        <>
          <Slider label={<M tex="\tok{approx}{c_0}" />} value={c[0]} min={-2} max={2} step={0.05} onChange={set(0)} role="approx" locked={locked[0]} />
          <Slider label={<M tex="\tok{approx}{c_1}" />} value={c[1]} min={-2} max={2} step={0.05} onChange={set(1)} role="approx" locked={locked[1]} />
          <Slider label={<M tex="\tok{approx}{c_2}" />} value={c[2]} min={-2} max={2} step={0.05} onChange={set(2)} role="approx" locked={locked[2]} />
          <button type="button" className="btn" onClick={onBack} style={{ marginLeft: "auto" }}>
            back to the knobs
          </button>
        </>
      }
    >
      <StepThrough
        steps={steps}
        onStep={setStep}
        render={(i) => (
          <>
            <Plot xDomain={[-3.5, 3.5]} yDomain={[-2.2, 2.2]} xLabel="x" height={300} ariaLabel="Deriving the quadratic approximation to cos x">
              {i >= 1 && i <= 7 && <VLine at={0} />}
              {i >= 2 && i <= 3 && <Curve pts={tangent} role="ghost" dash="5 4" smooth={false} />}
              {i >= 2 && i <= 3 && <Label at={[-3.3, 1]} text="tangent at 0: flat" role="ghost" dy={-6} />}
              <Curve pts={poly} role="approx" />
              <Curve pts={cosPts} role="truth" />
              {i >= 1 && <Marker at={[0, 1]} role="truth" r={4} />}
              {i === 6 && (
                <>
                  <VLine at={0.1} />
                  <Marker at={[0.1, Math.cos(0.1)]} role="truth" r={4} />
                  <Marker at={[0.1, polyEval(c, 0, 0.1)]} role="approx" r={4} />
                </>
              )}
            </Plot>
            <div style={{ padding: "0 0.5rem" }}>
              <M block tex={polyTex} />
              {i === 1 && <M block tex="P(0) = c_0 = \cos 0 = 1" />}
              {(i === 2 || i === 3) && <M block tex="\frac{d}{dx}\cos x = -\sin x,\quad -\sin 0 = 0 \qquad\qquad P'(x) = c_1 + 2c_2x,\quad P'(0) = c_1" />}
              {(i === 4 || i === 5) && <M block tex="\frac{d^2}{dx^2}\cos x = -\cos x,\quad -\cos 0 = -1 \qquad\qquad P''(x) = 2c_2" />}
              {i >= 5 && (
                <div style={{ textAlign: "center" }}>
                  <span className="eq-box">
                    <M tex="\cos x \;\approx\; \tok{approx}{1 - \tfrac{x^2}{2}}" />
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      />
    </Figure>
  );
}
