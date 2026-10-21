import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { M } from "../../../ui/Math";
import { factorial } from "../../../engine/taylor";

/** The derivative table: each coefficient owns exactly one derivative. */
export function F3Table() {
  const terms = ["1", "x", "x^2", "x^3", "x^4"];
  // derivative expressions of x^k, order d
  const dexpr = (k: number, d: number): string => {
    if (d > k) return "0";
    const coef = factorial(k) / factorial(k - d);
    const pow = k - d;
    const c = coef === 1 ? "" : String(coef);
    if (pow === 0) return coef === 1 ? "1" : String(coef);
    return c + (pow === 1 ? "x" : `x^{${pow}}`);
  };
  const at0 = (k: number, d: number) => (d === k ? factorial(k) : 0);

  // steps: 0 intro table (expressions), 1..4 differentiate x^4 step by step, 5 evaluate at 0 (whole table), 6 formula
  const steps = [
    { caption: <>Five terms, five derivatives. Each cell is the d-th derivative of the term in that row — before we plug in x = 0.</> },
    { caption: <>Follow the x⁴ row. One derivative: the power rule brings down the 4.</> },
    { caption: <>Two derivatives: 4 · 3 = 12. The exponents fall as the factors pile up.</> },
    { caption: <>Three: 4 · 3 · 2 = 24x.</> },
    { caption: <>Four: 4 · 3 · 2 · 1 = 24. That product is 4! — the factorial is nothing more than the power rule applied k times.</> },
    {
      caption: (
        <>
          Now set x = 0. Everything that still has an x in it dies. What survives is a single diagonal: the k-th derivative of xᵏ, and nothing else.{" "}
          <strong>Higher terms never disturb lower derivatives; lower terms never reach higher ones.</strong>
        </>
      ),
    },
    {
      caption: (
        <>
          So the k-th derivative of the whole polynomial at 0 is cₖ·k!, and matching it to f⁽ᵏ⁾(0) gives the coefficient. This is why each knob in Figure 2 could be set independently.
        </>
      ),
    },
  ];

  return (
    <Figure n="3" prompt="Why factorials: each coefficient owns exactly one derivative.">
      <StepThrough
        steps={steps}
        render={(i) => {
          const showAt0 = i >= 5;
          return (
            <div style={{ padding: "1rem 0.5rem" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>term</th>
                    {["f", "f′", "f″", "f‴", "f⁗"].map((h, d) => (
                      <th key={d}>{showAt0 ? `${h}(0)` : h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {terms.map((t, k) => (
                    <tr key={k}>
                      <th>
                        <M tex={`\\tok{approx}{c_{${k}}}\\,${k === 0 ? "" : t}`} />
                      </th>
                      {[0, 1, 2, 3, 4].map((d) => {
                        const lit = i >= 1 && i <= 4 && k === 4 && d === i;
                        const diag = showAt0 && d === k;
                        const txt = showAt0 ? String(at0(k, d)) : dexpr(k, d);
                        const dim = i >= 1 && i <= 4 && k === 4 && d > i;
                        return (
                          <td key={d} className={diag ? "diag" : lit ? "lit" : ""} style={dim ? { opacity: 0.25 } : undefined}>
                            <M tex={txt} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {i >= 1 && i <= 4 && (
                <M block tex={`\\frac{d^{${i}}}{dx^{${i}}}\\,x^4 = ${[4, 3, 2, 1].slice(0, i).join("\\cdot")}\\;${i < 4 ? `x^{${4 - i}}` : ""} = ${dexpr(4, i)}`} />
              )}
              {i === 6 && (
                <div style={{ textAlign: "center" }}>
                  <M block tex="P^{(k)}(0) = \tok{approx}{c_k}\,k! \;=\; f^{(k)}(0) \qquad\Longrightarrow\qquad \tok{approx}{c_k} = \frac{f^{(k)}(0)}{k!}" />
                </div>
              )}
            </div>
          );
        }}
      />
    </Figure>
  );
}
