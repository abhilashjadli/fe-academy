import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Timeline, type Segment } from "../../../ui/Timeline";
import { Curve, Plot, Points, type Pt } from "../../../ui/Plot";
import { M } from "../../../ui/Math";
import { normalSample, rng } from "../../../engine/random";
import { cholesky, invLower } from "../../../engine/linalg";

const RHO = 0.7;

/** Cholesky: the shear with a name. Unit circle → ellipse under L; real data → surprises under L⁻¹. */
export function F2Cholesky() {
  const S = [
    [1, RHO],
    [RHO, 1],
  ];
  const L = useMemo(() => cholesky(S), []); // eslint-disable-line react-hooks/exhaustive-deps
  const Li = useMemo(() => invLower(L), [L]);
  const z = useMemo(() => {
    const r = rng(8);
    return Array.from({ length: 300 }, () => [normalSample(r), normalSample(r)] as Pt);
  }, []);
  const circle: Pt[] = useMemo(() => Array.from({ length: 91 }, (_, i) => [Math.cos((2 * Math.PI * i) / 90), Math.sin((2 * Math.PI * i) / 90)]), []);
  const apply = (A: number[][], p: Pt): Pt => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
  const lerpM = (A: number[][], B: number[][], u: number) => A.map((row, i) => row.map((v, j) => v + (B[i][j] - v) * u));
  const I = [
    [1, 0],
    [0, 1],
  ];
  const sheared = useMemo(() => z.map((p) => apply(L, p)), [z, L]);

  const segments: Segment[] = [
    { duration: 8, caption: "Start with what we can make: a round cloud of independent standard normals, and the unit circle that outlines its typical spread." },
    { duration: 12, caption: "Now apply a matrix L to every point. The first coordinate is left alone. The second becomes rho times the first plus the square root of one minus rho squared times the second — the recipe from Figure 1, written as a matrix. The circle becomes an ellipse; the round cloud becomes a tilted one." },
    { duration: 12, caption: "Multiply L by its own transpose and you get the covariance matrix: ones on the diagonal, rho off it. That is the whole of Cholesky's trick: any covariance matrix can be written as L times L transpose with L lower-triangular, and then L applied to independent noise produces noise with exactly that covariance." },
    { duration: 12, caption: "It runs backwards too. Take real correlated data and apply the inverse of L. The cloud un-shears into a round one. Each point's new coordinates are its surprises — the part of each variable that could not have been predicted from the others. Risk desks call these innovations." },
    { duration: 7, caption: "Correlated noise is independent noise, sheared; the shear is L; and L comes from the covariance matrix by a few lines of arithmetic. Every Monte Carlo of a correlated portfolio — chapter E2 — is this picture in more dimensions." },
  ];

  return (
    <Figure n="2" prompt="Cholesky: the shear with a name.">
      <Timeline
        segments={segments}
        render={(_t, i, u) => {
          const Mt = i === 0 ? I : i === 1 ? lerpM(I, L, u) : i === 2 ? L : I;
          // segment 3: start from sheared data (L applied) and apply L⁻¹ progressively = lerp from L to I
          const pts = i === 3 ? sheared.map((p) => apply(lerpM(I, Li, u), p)) : z.map((p) => apply(Mt, p));
          const ring = i === 3 ? circle.map((p) => apply(lerpM(L, I, u), p)) : circle.map((p) => apply(Mt, p));
          return (
            <div className="two" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)" }}>
              <Plot xDomain={[-3.5, 3.5]} yDomain={[-3.5, 3.5]} width={460} height={340} xTicks={5} yTicks={5} ariaLabel="A cloud being sheared by L and un-sheared by its inverse">
                <Points pts={pts} role={i === 3 ? "truth" : "approx"} r={2.4} opacity={0.6} />
                <Curve pts={ring} role="ink" width={1.5} smooth={false} />
                <Curve pts={ring.map((p) => [2 * p[0], 2 * p[1]])} role="ink" width={1} dash="4 3" smooth={false} />
              </Plot>
              <div style={{ padding: "0.4rem 0.2rem", fontSize: "0.9em" }}>
                {i === 0 && <M block tex="\begin{pmatrix} z_1 \\ z_2 \end{pmatrix},\quad z_1, z_2 \sim N(0,1)\ \text{independent}" />}
                {i >= 1 && i <= 2 && (
                  <M block tex="\tok{approx}{L} = \begin{pmatrix} 1 & 0 \\ \rho & \sqrt{1-\rho^2} \end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0.7 & 0.714 \end{pmatrix}" />
                )}
                {i === 1 && <M block tex="\begin{pmatrix} x \\ y \end{pmatrix} = \tok{approx}{L}\begin{pmatrix} z_1 \\ z_2 \end{pmatrix}" />}
                {i === 2 && (
                  <>
                    <M block tex="\tok{approx}{L}\tok{approx}{L}^{\mathsf T} = \begin{pmatrix} 1 & \rho \\ \rho & \rho^2 + 1 - \rho^2 \end{pmatrix} = \begin{pmatrix} 1 & \rho \\ \rho & 1 \end{pmatrix} = \Sigma" />
                    <M block tex="\Sigma = LL^{\mathsf T}\ \text{for any covariance matrix}" className={u > 0.5 ? "eq-live" : "eq-dim"} />
                  </>
                )}
                {i === 3 && (
                  <>
                    <M block tex="\tok{truth}{L^{-1}} = \begin{pmatrix} 1 & 0 \\ -\rho/\sqrt{1-\rho^2} & 1/\sqrt{1-\rho^2} \end{pmatrix}" />
                    <M block tex="\begin{pmatrix} z_1 \\ z_2 \end{pmatrix} = \tok{truth}{L^{-1}}\begin{pmatrix} x \\ y \end{pmatrix}\quad\text{the surprises}" className={u > 0.3 ? "eq-live" : "eq-dim"} />
                  </>
                )}
                {i === 4 && (
                  <>
                    <M block tex="\text{correlated} = L \cdot \text{independent}" />
                    <M block tex="\text{independent} = L^{-1} \cdot \text{correlated}" />
                  </>
                )}
              </div>
            </div>
          );
        }}
      />
    </Figure>
  );
}
