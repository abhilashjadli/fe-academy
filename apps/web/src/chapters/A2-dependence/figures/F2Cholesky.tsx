import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough, type Step } from "../../../ui/StepThrough";
import { Timeline, type Segment } from "../../../ui/Timeline";
import {
  Curve,
  Label,
  Marker,
  Plot,
  Points,
  fmt,
  type Pt,
} from "../../../ui/Plot";
import { M } from "../../../ui/Math";
import { normalSample, rng } from "../../../engine/random";
import { cholesky, invLower } from "../../../engine/linalg";

const RHO = 0.7;
const Z0: Pt = [1.2, -0.5]; // the one dot we follow
const S = [
  [1, RHO],
  [RHO, 1],
];
const apply = (A: number[][], p: Pt): Pt => [
  A[0][0] * p[0] + A[0][1] * p[1],
  A[1][0] * p[0] + A[1][1] * p[1],
];
const lerpM = (A: number[][], B: number[][], u: number) =>
  A.map((row, i) => row.map((v, j) => v + (B[i][j] - v) * u));
const I = [
  [1, 0],
  [0, 1],
];

function useClouds() {
  const L = useMemo(() => cholesky(S), []);
  const Li = useMemo(() => invLower(L), [L]);
  const z = useMemo(() => {
    const r = rng(8);
    const rest = Array.from(
      { length: 299 },
      () => [normalSample(r), normalSample(r)] as Pt,
    );
    return [Z0, ...rest];
  }, []);
  const sheared = useMemo(() => z.map((p) => apply(L, p)), [z, L]);
  const circle: Pt[] = useMemo(
    () =>
      Array.from({ length: 91 }, (_, i) => [
        Math.cos((2 * Math.PI * i) / 90),
        Math.sin((2 * Math.PI * i) / 90),
      ]),
    [],
  );
  return { L, Li, z, sheared, circle };
}

/** Cholesky: the shear with a name. One dot's (z₁, z₂) becomes (x, y) with the numbers; then the trick in reverse. */
export function F2Cholesky() {
  const { L, z, sheared, circle } = useClouds();
  const X0 = sheared[0];
  const l = fmt.n(2);
  const q = L[1][1];

  const steps: Step[] = [
    {
      caption: (
        <>
          One dot from a round cloud of plain noise. Its two numbers: z₁ ={" "}
          {l(Z0[0])} across, z₂ = {l(Z0[1])} up. Two independent surprises,
          nothing more.
        </>
      ),
    },
    {
      caption: (
        <>
          Keep the first number: x = {l(X0[0])}. Make the second from both: y =
          0.7 × {l(Z0[0])} + {l(q)} × ({l(Z0[1])}) = {l(X0[1])}. The dot slides
          to its new place.
        </>
      ),
    },
    {
      caption: (
        <>
          Do that to every dot and the round cloud tilts into the ρ = 0.7 cloud.
          The recipe, written as a table of four numbers, is called L.
        </>
      ),
    },
    {
      caption: (
        <>
          Here is the trick with a name. Multiply L by its own mirror image and
          out pops the table of covariances: 1, 0.7, 0.7, 1. That is Cholesky.
        </>
      ),
    },
    {
      caption: (
        <>
          So it works in reverse. Hand me any covariance table and I can find
          the L that makes it — and L backwards sends our dot home to (
          {l(Z0[0])}, {l(Z0[1])}): its surprises.
        </>
      ),
    },
  ];

  return (
    <Figure
      n="2"
      prompt={
        <>
          One dot, step by step: how plain noise becomes a tilted cloud, and
          back.
        </>
      }
      observe={
        <>
          <p style={{ margin: 0 }}>
            Correlated noise is plain noise, sheared. The shear is a small table
            L, and L comes from the covariance table by a few lines of
            arithmetic. Every simulation of a book of many positions starts by
            doing exactly this.
          </p>
          <details className="a2-more">
            <summary>watch it instead (the animated version)</summary>
            <CholeskyWatch />
          </details>
          <details className="a2-more">
            <summary>more: the matrices</summary>
            <M
              block
              tex="\tok{approx}{L} = \begin{pmatrix} 1 & 0 \\ \rho & \sqrt{1-\rho^2} \end{pmatrix}, \qquad \tok{approx}{L}\tok{approx}{L}^{\mathsf T} = \begin{pmatrix} 1 & \rho \\ \rho & \rho^2 + 1 - \rho^2 \end{pmatrix} = \Sigma"
            />
            <M
              block
              tex="\tok{truth}{L^{-1}} = \begin{pmatrix} 1 & 0 \\ -\rho/\sqrt{1-\rho^2} & 1/\sqrt{1-\rho^2} \end{pmatrix}, \qquad \begin{pmatrix} z_1 \\ z_2 \end{pmatrix} = \tok{truth}{L^{-1}}\begin{pmatrix} x \\ y \end{pmatrix}"
            />
            <p>
              "Mirror image" is the transpose: flip the table over its diagonal.
              "Lower-triangular" means the top-right corner is zero, which is
              why the first coordinate is left alone. For any covariance table
              there is such an L, and the engine finds it with the recipe in the
              code panel at the end.
            </p>
          </details>
        </>
      }
    >
      <StepThrough
        steps={steps}
        render={(i) => {
          const tilted = i >= 2 && i <= 3;
          const cloud = i === 4 ? z : tilted ? sheared : z;
          const ring = tilted ? circle.map((p) => apply(L, p)) : circle;
          const dot = i === 0 ? Z0 : i === 4 ? Z0 : X0;
          return (
            <div className="a2-steps-body">
              <Plot
                xDomain={[-3.5, 3.5]}
                yDomain={[-3.5, 3.5]}
                width={440}
                height={320}
                xTicks={5}
                yTicks={5}
                xLabel="x (was z₁)"
                yLabel="y (was z₂)"
                ariaLabel="One dot being sheared by L and sent back by its inverse"
              >
                <Points
                  pts={cloud}
                  role={i === 4 ? "truth" : "approx"}
                  r={2.4}
                  opacity={i === 1 ? 0.18 : 0.5}
                />
                <Curve pts={ring} role="ink" width={1.5} smooth={false} />
                {i === 1 && (
                  <>
                    <Marker at={Z0} role="ghost" r={5} />
                    <Curve
                      pts={[Z0, X0]}
                      role="ink"
                      width={1.2}
                      dash="4 3"
                      smooth={false}
                    />
                    <Label
                      at={Z0}
                      text={`(${l(Z0[0])}, ${l(Z0[1])})`}
                      dx={8}
                      dy={14}
                    />
                  </>
                )}
                {i === 4 && (
                  <>
                    <Marker at={X0} role="ghost" r={5} />
                    <Curve
                      pts={[X0, Z0]}
                      role="ink"
                      width={1.2}
                      dash="4 3"
                      smooth={false}
                    />
                    <Label
                      at={X0}
                      text={`(${l(X0[0])}, ${l(X0[1])})`}
                      dx={8}
                      dy={-8}
                    />
                  </>
                )}
                <Marker at={dot} role="error" r={6} />
                <Label
                  at={dot}
                  text={`(${l(dot[0])}, ${l(dot[1])})`}
                  dx={8}
                  dy={i === 4 ? 16 : -8}
                  role="error"
                />
              </Plot>
              <div className="a2-numbers">
                {i === 0 && (
                  <M
                    block
                    tex={`\\begin{pmatrix} z_1 \\\\ z_2 \\end{pmatrix} = \\begin{pmatrix} ${l(Z0[0])} \\\\ ${l(Z0[1])} \\end{pmatrix}`}
                  />
                )}
                {i === 1 && (
                  <M
                    block
                    tex={`\\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} 1 \\cdot ${l(Z0[0])} \\\\ 0.7 \\cdot ${l(Z0[0])} + ${l(q)} \\cdot (${l(Z0[1])}) \\end{pmatrix} = \\begin{pmatrix} ${l(X0[0])} \\\\ ${l(X0[1])} \\end{pmatrix}`}
                  />
                )}
                {i === 2 && (
                  <M
                    block
                    tex={`\\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\tok{approx}{L}\\begin{pmatrix} z_1 \\\\ z_2 \\end{pmatrix}, \\qquad \\tok{approx}{L} = \\begin{pmatrix} 1 & 0 \\\\ 0.7 & ${l(q)} \\end{pmatrix}`}
                  />
                )}
                {i === 3 && (
                  <M
                    block
                    tex={`\\tok{approx}{L}\\tok{approx}{L}^{\\mathsf T} = \\begin{pmatrix} 1 & 0 \\\\ 0.7 & ${l(q)} \\end{pmatrix}\\begin{pmatrix} 1 & 0.7 \\\\ 0 & ${l(q)} \\end{pmatrix} = \\begin{pmatrix} 1 & 0.7 \\\\ 0.7 & 1 \\end{pmatrix}`}
                  />
                )}
                {i === 4 && (
                  <M
                    block
                    tex={`\\begin{pmatrix} z_1 \\\\ z_2 \\end{pmatrix} = \\tok{truth}{L^{-1}}\\begin{pmatrix} ${l(X0[0])} \\\\ ${l(X0[1])} \\end{pmatrix} = \\begin{pmatrix} ${l(Z0[0])} \\\\ ${l(Z0[1])} \\end{pmatrix}`}
                  />
                )}
              </div>
            </div>
          );
        }}
      />
    </Figure>
  );
}

/** The v1 narrated animation, kept under "watch it instead". */
function CholeskyWatch() {
  const { L, Li, z, sheared, circle } = useClouds();
  const segments: Segment[] = [
    {
      duration: 8,
      caption:
        "Start with what we can make: a round cloud of independent standard normals, and the unit circle that outlines its typical spread.",
    },
    {
      duration: 12,
      caption:
        "Now apply a matrix L to every point. The first coordinate is left alone. The second becomes rho times the first plus the square root of one minus rho squared times the second — the recipe from Figure 1, written as a matrix. The circle becomes an ellipse; the round cloud becomes a tilted one.",
    },
    {
      duration: 12,
      caption:
        "Multiply L by its own mirror image and out pops the table of covariances: ones on the diagonal, rho off it. That is Cholesky's trick: any covariance table can be written as L times its mirror image, and then L applied to independent noise produces noise with exactly that table.",
    },
    {
      duration: 12,
      caption:
        "It runs backwards too. Take real correlated data and apply the inverse of L. The cloud un-shears into a round one. Each point's new coordinates are its surprises — the part of each variable that could not have been predicted from the others. Risk desks call these innovations.",
    },
    {
      duration: 7,
      caption:
        "Correlated noise is independent noise, sheared; the shear is L; and L comes from the covariance matrix by a few lines of arithmetic. Every Monte Carlo of a correlated portfolio — chapter E2 — is this picture in more dimensions.",
    },
  ];
  return (
    <Timeline
      segments={segments}
      render={(_t, i, u) => {
        const Mt = i === 0 ? I : i === 1 ? lerpM(I, L, u) : i === 2 ? L : I;
        const pts =
          i === 3
            ? sheared.map((p) => apply(lerpM(I, Li, u), p))
            : z.map((p) => apply(Mt, p));
        const ring =
          i === 3
            ? circle.map((p) => apply(lerpM(L, I, u), p))
            : circle.map((p) => apply(Mt, p));
        return (
          <div
            className="two"
            style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)" }}
          >
            <Plot
              xDomain={[-3.5, 3.5]}
              yDomain={[-3.5, 3.5]}
              width={460}
              height={340}
              xTicks={5}
              yTicks={5}
              ariaLabel="A cloud being sheared by L and un-sheared by its inverse"
            >
              <Points
                pts={pts}
                role={i === 3 ? "truth" : "approx"}
                r={2.4}
                opacity={0.6}
              />
              <Curve pts={ring} role="ink" width={1.5} smooth={false} />
              <Curve
                pts={ring.map((p) => [2 * p[0], 2 * p[1]])}
                role="ink"
                width={1}
                dash="4 3"
                smooth={false}
              />
            </Plot>
            <div style={{ padding: "0.4rem 0.2rem", fontSize: "0.9em" }}>
              {i === 0 && (
                <M
                  block
                  tex="\begin{pmatrix} z_1 \\ z_2 \end{pmatrix},\quad z_1, z_2 \sim N(0,1)\ \text{independent}"
                />
              )}
              {i >= 1 && i <= 2 && (
                <M
                  block
                  tex="\tok{approx}{L} = \begin{pmatrix} 1 & 0 \\ \rho & \sqrt{1-\rho^2} \end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0.7 & 0.71 \end{pmatrix}"
                />
              )}
              {i === 1 && (
                <M
                  block
                  tex="\begin{pmatrix} x \\ y \end{pmatrix} = \tok{approx}{L}\begin{pmatrix} z_1 \\ z_2 \end{pmatrix}"
                />
              )}
              {i === 2 && (
                <>
                  <M
                    block
                    tex="\tok{approx}{L}\tok{approx}{L}^{\mathsf T} = \begin{pmatrix} 1 & \rho \\ \rho & \rho^2 + 1 - \rho^2 \end{pmatrix} = \begin{pmatrix} 1 & \rho \\ \rho & 1 \end{pmatrix} = \Sigma"
                  />
                  <M
                    block
                    tex="\Sigma = LL^{\mathsf T}\ \text{for any covariance matrix}"
                    className={u > 0.5 ? "eq-live" : "eq-dim"}
                  />
                </>
              )}
              {i === 3 && (
                <>
                  <M
                    block
                    tex="\tok{truth}{L^{-1}} = \begin{pmatrix} 1 & 0 \\ -\rho/\sqrt{1-\rho^2} & 1/\sqrt{1-\rho^2} \end{pmatrix}"
                  />
                  <M
                    block
                    tex="\begin{pmatrix} z_1 \\ z_2 \end{pmatrix} = \tok{truth}{L^{-1}}\begin{pmatrix} x \\ y \end{pmatrix}\quad\text{the surprises}"
                    className={u > 0.3 ? "eq-live" : "eq-dim"}
                  />
                </>
              )}
              {i === 4 && (
                <>
                  <M
                    block
                    tex="\text{correlated} = L \cdot \text{independent}"
                  />
                  <M
                    block
                    tex="\text{independent} = L^{-1} \cdot \text{correlated}"
                  />
                </>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
