import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { MiniBoard } from "../MiniBoard";
import { choose } from "../../../engine/discrete";
import { M } from "../../../ui/Math";

const ROWS = 5;

/** Click a bucket: every path into it lights up; Pascal's fractions appear row by row. */
export function F2Paths() {
  const [k, setK] = useState<number | null>(2);
  const [pascalRows, setPascalRows] = useState(0);
  const n = ROWS;
  return (
    <Figure
      n="2"
      prompt={<>Label each bucket by how many bounces went right, k. Click a bucket to light every route into it; then reveal the fractions on the pegs, row by row.</>}
      controls={
        <>
          <span className="ctl">
            <span className="ctl-label">bucket k</span>
            <span className="seg" role="group">
              {Array.from({ length: n + 1 }, (_, j) => (
                <button key={j} type="button" aria-pressed={k === j} onClick={() => setK(j)}>
                  {j}
                </button>
              ))}
            </span>
          </span>
          <span className="ctl stepper">
            <span className="ctl-label">rows of fractions</span>
            <button type="button" aria-label="fewer" disabled={pascalRows <= 0} onClick={() => setPascalRows((r) => r - 1)}>
              −
            </button>
            <span className="readout">{pascalRows}</span>
            <button type="button" aria-label="more" disabled={pascalRows >= n + 1} onClick={() => setPascalRows((r) => r + 1)}>
              +
            </button>
          </span>
          {k !== null && (
            <span className="readouts">
              <span>
                <span className="k">paths into bucket {k}: </span>
                <span className="v">{choose(n, k)}</span>
                <span className="k"> of {2 ** n}</span>
              </span>
            </span>
          )}
        </>
      }
      observe={
        <>
          <p style={{ margin: 0 }}>
            Every route is equally likely — five ½-chances in a row, 1 in 32 each — so a bucket's probability is just how many routes lead there, over 32. Each peg's
            fraction is the sum of the two above it; that rule builds <strong>Pascal's triangle</strong>, 1 · 5 · 10 · 10 · 5 · 1 on the last row.
          </p>
          {k !== null && (
            <M block tex={`P(\\text{bucket } ${k}) = \\frac{\\text{paths into } ${k}}{\\text{all paths}} = \\frac{${choose(n, k)}}{${2 ** n}} = ${(choose(n, k) / 2 ** n).toFixed(4)}`} />
          )}
        </>
      }
    >
      <MiniBoard rows={ROWS} bucketLabels="k" lightPaths={k} pascal={pascalRows > 0 ? "fractions" : "none"} pascalRows={pascalRows} height={320} />
    </Figure>
  );
}
