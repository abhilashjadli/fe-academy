import "./figures.css";
import { conditionalForecasts } from "../../../engine/martingale";
import key from "../../../engine/__fixtures__/key-B2.json";
import { useNarrow } from "./table";

/**
 * The information diary — the close's one drawing (static on purpose). Shreve's three-toss tree, 4, ×2 or ×½, and a diary
 * of four pages: before any toss (eight paths possible), after one (four), after two (two), after three (one). Each page
 * writes its own forecast of the final price (engine conditionalForecasts, p = ½) and no page is ever torn out.
 */

const S0 = key.diary.p === 0.5 ? key.tree.S0 : 4;
const FORE = conditionalForecasts(S0, key.tree.u, key.tree.d, key.diary.p, 3);
const PAGES = [
  { title: "before any toss", paths: 8, atoms: ["—"] },
  { title: "after one toss", paths: 4, atoms: ["H", "T"] },
  { title: "after two", paths: 2, atoms: ["HH", "HT", "TH", "TT"] },
  { title: "after three", paths: 1, atoms: ["HHH", "HHT", "HTH", "HTT", "THH", "THT", "TTH", "TTT"] },
];
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000));
const headsOf = (s: string) => (s === "—" ? 0 : s.split("").filter((c) => c === "H").length);

export function Diary({ highlight = "HT" }: { highlight?: string }) {
  const narrow = useNarrow();
  const W = narrow ? 350 : 560;
  const H = 230;
  const colX = [36, 36 + (W - 72) / 3, 36 + (2 * (W - 72)) / 3, W - 36];
  const rowY = (n: number, i: number) => {
    const count = n + 1;
    const gap = (H - 40) / Math.max(1, count);
    return 20 + gap * (i + 0.5);
  };
  const prices = [0, 1, 2, 3].map((n) => Array.from({ length: n + 1 }, (_, i) => S0 * Math.pow(key.tree.u, n - i) * Math.pow(key.tree.d, i)));
  // the path the diary follows, for emphasis: prefix of `highlight`
  const onPath = (n: number, i: number) => {
    const prefix = highlight.slice(0, n);
    return prefix.length === n && n - headsOf(prefix) === i;
  };
  return (
    <div className="b2-diary">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="three-toss tree starting at 4, up times two or down by half">
        {[0, 1, 2].map((n) =>
          prices[n].map((_, i) => (
            <g key={`${n}-${i}`} className="b2-tree-edge">
              <line x1={colX[n]} y1={rowY(n, i)} x2={colX[n + 1]} y2={rowY(n + 1, i)} className={onPath(n, i) && onPath(n + 1, i) ? "on" : ""} />
              <line x1={colX[n]} y1={rowY(n, i)} x2={colX[n + 1]} y2={rowY(n + 1, i + 1)} className={onPath(n, i) && onPath(n + 1, i + 1) ? "on" : ""} />
            </g>
          )),
        )}
        {prices.map((row, n) =>
          row.map((v, i) => (
            <g key={`${n}-${i}`} transform={`translate(${colX[n]} ${rowY(n, i)})`}>
              <circle r={16} className="b2-tree-under" />
              <circle r={16} className={"b2-tree-node " + (onPath(n, i) ? "on" : "")} />
              <text y={4} textAnchor="middle" className="b2-tree-v">
                {fmt(v)}
              </text>
            </g>
          )),
        )}
        <text x={4} y={H - 2} textAnchor="start" className="b2-tree-cap">
          4 today
        </text>
        <text x={W - 4} y={H - 2} textAnchor="end" className="b2-tree-cap">
          after three tosses
        </text>
        <text x={(colX[0] + colX[1]) / 2} y={14} textAnchor="middle" className="b2-tree-cap">
          H: ×2 · T: ×½
        </text>
      </svg>
      <div className="b2-pages">
        {PAGES.map((pg, n) => (
          <div key={n} className="b2-page">
            <div className="b2-page-head">
              <span className="b2-page-n">page {n}</span>
              <span>{pg.title}</span>
            </div>
            <div className="b2-page-paths">
              {pg.paths} {pg.paths === 1 ? "path" : "paths"} still possible
            </div>
            <div className="b2-page-fore">
              <span className="k">my forecast of the end:</span>
              {pg.atoms.map((a) => (
                <span key={a} className={"b2-fore " + (a === "—" || highlight.startsWith(a) || a.startsWith(highlight) ? "on" : "")}>
                  {a !== "—" && <span className="atom">{a}</span>}
                  {fmt(FORE[n][n - headsOf(a)])}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
