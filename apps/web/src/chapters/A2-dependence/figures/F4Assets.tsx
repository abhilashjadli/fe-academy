import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bars, Plot, fmt } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";
import { normalSample, rng } from "../../../engine/random";
import { corrFromCov, covMatrix, symEigen } from "../../../engine/linalg";

const NAMES = ["Bank A", "Bank B", "Bank C", "Tech X", "Tech Y", "Tech Z"];
const BETA = [1.0, 0.9, 1.1, 0.8, 1.2, 1.0];
const SECTOR = [0, 0, 0, 1, 1, 1];

/** Six assets, one market: the correlation matrix, its eigenvalues, and what PC1 is. */
export function F4Assets() {
  const [mkt, setMkt] = useState(1);
  const data = useMemo(() => {
    const r = rng(2026);
    const rows: number[][] = [];
    for (let d = 0; d < 1500; d++) {
      const m = normalSample(r),
        s0 = normalSample(r),
        s1 = normalSample(r);
      rows.push(BETA.map((b, j) => b * mkt * m + 0.6 * (SECTOR[j] === 0 ? s0 : s1) + 0.8 * normalSample(r)));
    }
    return rows;
  }, [mkt]);
  const C = useMemo(() => corrFromCov(covMatrix(data)), [data]);
  const e = useMemo(() => symEigen(C), [C]);
  const total = e.values.reduce((s, v) => s + v, 0);
  const cell = (v: number) => {
    const a = Math.min(1, Math.abs(v));
    return v >= 0 ? `rgba(47, 91, 234, ${0.08 + 0.75 * a})` : `rgba(200, 50, 95, ${0.08 + 0.75 * a})`;
  };

  return (
    <Figure
      n="4"
      prompt={<>Six assets — three banks, three tech names — moved by one market, two sectors and their own noise. Read the correlation matrix, then let PCA read it for you.</>}
      controls={
        <>
          <Slider label="strength of the market factor" value={mkt} min={0} max={2} step={0.05} onChange={setMkt} role="truth" />
          <span className="readouts">
            <span>
              <span className="k">PC1 explains </span>
              <span className="v">{fmt.pct(1)(e.values[0] / total)}</span>
            </span>
            <span>
              <span className="k">PC1 + PC2 </span>
              <span className="v">{fmt.pct(1)((e.values[0] + e.values[1]) / total)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          The matrix is all positive — everything moves with the market — with two warmer blocks for the two sectors. PCA says the same thing in three
          numbers: the first eigenvector has every loading the same sign (that <em>is</em> "the market"), the second has banks against tech (the sector
          spread), and after that the eigenvalues are small — the rest is each name's own noise. Turn the market factor down to zero and PC1 collapses to a
          sector; turn it up and one direction carries nearly all the variance. Chapter E3 does this to a yield curve, where the three components come out as
          level, slope and curvature.
        </>
      }
    >
      <div className="two" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <div style={{ padding: "0.5rem" }}>
          <table className="table" style={{ fontSize: "0.78rem" }}>
            <thead>
              <tr>
                <th></th>
                {NAMES.map((n) => (
                  <th key={n}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {C.map((row, i) => (
                <tr key={i}>
                  <td style={{ textAlign: "left", color: "var(--ink-3)" }}>{NAMES[i]}</td>
                  {row.map((v, j) => (
                    <td key={j} style={{ background: cell(v), color: Math.abs(v) > 0.55 ? "#fff" : "var(--ink)", textAlign: "center" }}>
                      {v.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="footnote" style={{ paddingTop: 6 }}>correlation matrix of daily moves (1,500 days)</div>
        </div>
        <div>
          <Plot xDomain={[0.4, 6.6]} yDomain={[0, Math.max(3, e.values[0] * 1.15)]} width={420} height={170} xTicks={6} yTicks={3} xLabel="component" yLabel="eigenvalue (variance explained)" margin={{ top: 10, right: 10, bottom: 28, left: 40 }} ariaLabel="Scree plot">
            <Bars bars={e.values.map((v, i) => ({ x: i + 1, y: v, w: 0.7 }))} role="truth" />
          </Plot>
          <Plot xDomain={[0.4, 6.6]} yDomain={[-0.8, 0.8]} width={420} height={170} xTicks={6} yTicks={3} xLabel="asset" yLabel="loadings: PC1 (blue) and PC2 (amber)" margin={{ top: 10, right: 10, bottom: 28, left: 40 }} ariaLabel="Loadings of the first two components">
            <Bars bars={e.vectors[0].map((v, i) => ({ x: i + 0.82, y: v, w: 0.34 }))} role="truth" />
            <Bars bars={e.vectors[1].map((v, i) => ({ x: i + 1.18, y: v, w: 0.34 }))} role="approx" />
          </Plot>
        </div>
      </div>
    </Figure>
  );
}
