import { useMemo, useState } from "react";
import { polyEval, sample } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Curve, Marker, Plot, VLine, fmt } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";
import { M } from "../../../ui/Math";

export function F1Knobs() {
  const [c, setC] = useState<[number, number, number]>([0.4, 0.6, 0.2]);
  const cosPts = useMemo(() => sample(Math.cos, -3.5, 3.5, 241), []);
  const poly = useMemo(() => sample((x) => polyEval(c, 0, x), -3.5, 3.5, 241), [c]);
  const set = (i: number) => (v: number) => setC((old) => old.map((o, j) => (j === i ? v : o)) as [number, number, number]);
  const e = (x: number) => Math.abs(Math.cos(x) - polyEval(c, 0, x));
  const f6 = fmt.n(6);
  const f3 = fmt.n(3);
  const close = e(0.1) < 1e-4 && e(1) < 0.05;

  return (
    <Figure
      n="1"
      prompt={<>Make the yellow polynomial indistinguishable from <span className="tok-truth">cos x</span> near x = 0.</>}
      controls={
        <>
          <Slider label={<M tex="\tok{approx}{c_0}" />} value={c[0]} min={-2} max={2} step={0.05} onChange={set(0)} role="approx" />
          <Slider label={<M tex="\tok{approx}{c_1}" />} value={c[1]} min={-2} max={2} step={0.05} onChange={set(1)} role="approx" />
          <Slider label={<M tex="\tok{approx}{c_2}" />} value={c[2]} min={-2} max={2} step={0.05} onChange={set(2)} role="approx" />
        </>
      }
      observe={
        <>
          <table className="table" style={{ maxWidth: 520 }}>
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
                <td>{f6(Math.cos(0.1))}</td>
                <td>{f6(Math.cos(1))}</td>
              </tr>
              <tr>
                <td>
                  <span className="tok-approx">your polynomial</span>
                </td>
                <td>{f6(polyEval(c, 0, 0.1))}</td>
                <td>{f6(polyEval(c, 0, 1))}</td>
              </tr>
              <tr>
                <td>
                  <span className="tok-error">gap</span>
                </td>
                <td>{f3(e(0.1))}</td>
                <td>{f3(e(1))}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ margin: "0.6em 0 0" }}>
            {close ? (
              <>
                <strong>That is it.</strong> Height 1, no tilt, and a bend of about −½. Keep those numbers in mind — the next figure derives them.
              </>
            ) : (
              <>
                Most people find <span className="num">c₀ = 1</span> at once, feel their way to <span className="num">c₁ = 0</span>, and hover around <span className="num">c₂ ≈ −0.5</span>. Notice that no setting fixes x = 1 and x = 0.1 at the same time.
              </>
            )}
          </p>
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
