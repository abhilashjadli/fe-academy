import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { M } from "../../../ui/Math";
import { factorial } from "../../../engine/taylor";

const TERMS = ["1", "x", "x^2", "x^3", "x^4"];
const HEADS = ["f", "f′", "f″", "f‴", "f⁗"];

// derivative expressions of x^k, order d
function dexpr(k: number, d: number): string {
  if (d > k) return "0";
  const coef = factorial(k) / factorial(k - d);
  const pow = k - d;
  const c = coef === 1 ? "" : String(coef);
  if (pow === 0) return coef === 1 ? "1" : String(coef);
  return c + (pow === 1 ? "x" : `x^{${pow}}`);
}
const at0 = (k: number, d: number) => (d === k ? factorial(k) : 0);

/** The derivative table, whole: each coefficient owns exactly one derivative. Static; the step-through is folded under it. */
export function F2Table() {
  return (
    <Figure
      n="2"
      prompt="Why factorials: each coefficient owns exactly one derivative. Read the table; nothing to press."
      observe={
        <>
          Each row is one term, each column one more derivative. Follow the x⁴ row: 4x³, 12x², 24x, 24 — the power rule four times, and 4·3·2·1 is 4!.
          Now set x = 0: every cell that still holds an x dies, and only the lit diagonal survives. Knob k alone reaches derivative k.
        </>
      }
    >
      <div className="t-table-static">
        <table className="dtable">
          <thead>
            <tr>
              <th>term</th>
              {HEADS.map((h, d) => (
                <th key={d}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TERMS.map((t, k) => (
              <tr key={k}>
                <th>
                  <M tex={`\\tok{approx}{c_{${k}}}\\,${k === 0 ? "" : t}`} />
                </th>
                {[0, 1, 2, 3, 4].map((d) => {
                  const diag = d === k;
                  const dies = d < k; // still has an x in it: gone at x = 0
                  return (
                    <td key={d} className={diag ? (k === 4 ? "lit" : "diag") : ""} style={dies ? { opacity: k === 4 ? 0.8 : 0.4 } : undefined}>
                      <M tex={dexpr(k, d)} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="t-table-note">
          <span className="t-table-row4">
            x⁴ row: <span className="tok-approx">4 · 3 · 2 · 1 = 4! = {at0(4, 4)}</span>
          </span>
          <span>at x = 0 the faint cells die; the lit diagonal is cₖ · k!</span>
        </div>
      </div>
      <details className="t-more t-table-steps">
        <summary>step through it instead</summary>
        <F2Steps />
      </details>
    </Figure>
  );
}

/** The earlier seven-step version, kept under a disclosure. */
function F2Steps() {
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
          So the k-th derivative of the whole polynomial at 0 is cₖ·k!, and matching it to f⁽ᵏ⁾(0) gives the coefficient. This is why each knob in Figure 1 could be set on its own.
        </>
      ),
    },
  ];
  return (
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
                  {HEADS.map((h, d) => (
                    <th key={d}>{showAt0 ? `${h}(0)` : h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TERMS.map((t, k) => (
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
  );
}
