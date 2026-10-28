import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { MiniBoard } from "../MiniBoard";
import { choose, factorialSafe } from "../engineBridge";
import { M } from "../../../ui/Math";

const N = 5;
const K = 2;
const TOTAL = choose(N, K);

/**
 * A counting game. Five bounces; choose which two go right. The page will not tell you how many ways there are
 * until you have found them all — or you give up.
 */
export function F3Coins() {
  const [heads, setHeads] = useState<boolean[]>([false, false, false, false, false]);
  const [seen, setSeen] = useState<string[]>([]);
  const [gaveUp, setGaveUp] = useState(false);
  const count = heads.filter(Boolean).length;
  const key = heads.map((h) => (h ? "H" : "T")).join("");
  const toggle = (i: number) => {
    const next = heads.map((h, j) => (j === i ? !h : h));
    setHeads(next);
    if (next.filter(Boolean).length === K) {
      const k = next.map((h) => (h ? "H" : "T")).join("");
      setSeen((s) => (s.includes(k) ? s : [...s, k]));
    }
  };
  const done = seen.length === TOTAL;
  const over = done || gaveUp;
  const path = count === K ? heads.map((h) => (h ? 1 : 0)) : null;

  return (
    <Figure
      n="3"
      prompt={
        <>
          Five bounces; pick which <strong>two</strong> go right. Click two coins to make them heads (heads = right) and the route draws itself. How many different picks are
          there? Find them all.
        </>
      }
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
              <span className="k">different picks found </span>
              <span className="v">{over ? `${seen.length} of ${TOTAL}` : seen.length}</span>
            </span>
            {count !== K && !over && <span className="k">{count < K ? `pick ${K - count} more` : "that is too many — unpick one"}</span>}
            {count === K && !over && <span className="k">{seen.length === 1 ? "one. keep going" : `that one is ${key} — any more?`}</span>}
          </span>
          {!over && seen.length >= 3 && (
            <button type="button" className="btn" onClick={() => setGaveUp(true)} style={{ marginLeft: "auto" }}>
              give up, show me
            </button>
          )}
          {over && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSeen([]);
                setGaveUp(false);
                setHeads([false, false, false, false, false]);
              }}
              style={{ marginLeft: "auto" }}
            >
              play again
            </button>
          )}
        </>
      }
      observe={
        over ? (
          <>
            <p style={{ margin: 0 }}>
              {done ? <strong>All ten. </strong> : <strong>Ten. </strong>}
              Count it without clicking: 5 choices for the first head, then 4 for the second — 20 — but "coin 2 then coin 4" is the same pick as "coin 4 then coin 2", so halve it:{" "}
              <strong>10</strong>. In general: n(n−1)…(n−k+1) ordered picks, divided by the k! orders of the same set.
            </p>
            <M block tex={`\\binom{n}{k} = \\frac{n!}{k!\\,(n-k)!} \\qquad \\binom{5}{2} = \\frac{5 \\cdot 4}{2} = \\frac{${factorialSafe(5)}}{${factorialSafe(2)}\\cdot ${factorialSafe(3)}} = 10`} />
            <p style={{ margin: "0.4em 0 0" }}>"n choose k" is the number on the peg in Figure 2 — now counted, not generated.</p>
          </>
        ) : (
          <>Each pick you find is a route into bucket 2. The chips above are your collection. When you are sure you have them all, you will be told.</>
        )
      }
    >
      <MiniBoard rows={N} bucketLabels="k" path={path} lightPaths={over ? K : null} height={300} />
      <div className="n2-found">
        <span className="k">found:</span>
        {seen.length === 0 && <span className="k">nothing yet</span>}
        {seen.map((s, i) => (
          <span key={s} className={"n2-chip " + (i === seen.length - 1 ? "n2-chip-new" : "")}>
            {s}
          </span>
        ))}
        {gaveUp &&
          allPicks().filter((s) => !seen.includes(s)).map((s) => (
            <span key={s} className="n2-chip" style={{ opacity: 0.5 }}>
              {s}
            </span>
          ))}
      </div>
    </Figure>
  );
}

function allPicks(): string[] {
  const out: string[] = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) out.push(Array.from({ length: N }, (_, t) => (t === i || t === j ? "H" : "T")).join(""));
  return out;
}
