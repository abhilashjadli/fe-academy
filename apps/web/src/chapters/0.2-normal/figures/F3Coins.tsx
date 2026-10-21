import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { MiniBoard } from "../MiniBoard";
import { choose, factorialSafe } from "../engineBridge";
import { M } from "../../../ui/Math";

const N = 5;
const K = 2;

/** Choosing which 2 of 5 bounces go right: click coins, count the distinct selections. */
export function F3Coins() {
  const [heads, setHeads] = useState<boolean[]>([false, false, false, false, false]);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const count = heads.filter(Boolean).length;
  const toggle = (i: number) => {
    const next = heads.map((h, j) => (j === i ? !h : h));
    setHeads(next);
    if (next.filter(Boolean).length === K) setSeen((s) => new Set(s).add(next.map((h) => (h ? "1" : "0")).join("")));
  };
  const total = choose(N, K);
  const path = count === K ? heads.map((h) => (h ? 1 : 0)) : null;

  return (
    <Figure
      n="3"
      prompt={<>Five bounces; choose which two go right. Click two coins to make them heads (heads = right) and watch the path draw itself. How many different choices are there?</>}
      controls={
        <>
          <span className="ctl" style={{ gap: 6 }}>
            {heads.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={h}
                className="btn"
                style={{ width: 40, height: 40, borderRadius: 20, padding: 0, fontWeight: 500, background: h ? "var(--approx)" : "var(--surface-raised)", color: h ? "#fff" : "var(--ink)", borderColor: h ? "var(--approx)" : "var(--rule)" }}
              >
                {h ? "H" : "T"}
              </button>
            ))}
          </span>
          <span className="readouts">
            <span>
              <span className="k">distinct choices found </span>
              <span className="v">
                {seen.size} of {total}
              </span>
            </span>
            {count !== K && (
              <span className="k">
                {count < K ? `pick ${K - count} more` : "that is too many — unpick one"}
              </span>
            )}
          </span>
          <button type="button" className={"btn " + (showAll ? "toggled" : "")} onClick={() => setShowAll((v) => !v)}>
            {showAll ? "hide all ten" : "show all ten"}
          </button>
        </>
      }
      observe={
        <>
          <p style={{ margin: 0 }}>
            Count it by hand: 5 choices for the first head, then 4 for the second — 20 ordered pairs — but choosing coin 2 then coin 4 is the same selection as
            coin 4 then coin 2, so divide by 2: <strong>10</strong>. For k heads among n coins the same argument gives n(n−1)…(n−k+1) ordered picks, divided by
            the k! orders in which the same set can be picked:
          </p>
          <M block tex={`\\binom{n}{k} = \\frac{n!}{k!\\,(n-k)!} \\qquad \\binom{5}{2} = \\frac{5 \\cdot 4}{2} = \\frac{${factorialSafe(5)}}{${factorialSafe(2)}\\cdot ${factorialSafe(3)}} = 10`} />
          <p style={{ margin: "0.4em 0 0" }}>
            That is the number on the peg in Figure 2, now counted rather than generated. "n choose k" is the number of paths into bucket k.
          </p>
        </>
      }
    >
      <MiniBoard rows={N} bucketLabels="k" path={path} lightPaths={showAll ? K : null} height={300} />
    </Figure>
  );
}
