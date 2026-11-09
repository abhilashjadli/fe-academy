import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { ResultCard, useBet } from "../../../ui/Bet";
import { Readouts } from "../../../ui/controls";
import { NIFTY_FROM, NIFTY_TO, ninePanels, useNarrow, type Panel } from "./a4";

/**
 * Round 1 — nine charts. The reader ticks the series that "keep their rules over time", submits, and every panel
 * flips with one reason. Score out of 9. Nine at once on a desktop, three at a time on a phone. The two real series
 * are NIFTY 50 and its daily changes; the rest are simulated and say so on the flip.
 */

const W = 220,
  H = 96;

function Spark({ ys, done }: { ys: number[]; done: boolean }) {
  const d = useMemo(() => {
    let lo = Infinity,
      hi = -Infinity;
    for (const v of ys) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const pad = 0.06 * (hi - lo || 1);
    lo -= pad;
    hi += pad;
    const n = ys.length;
    return ys.map((v, i) => `${i === 0 ? "M" : "L"}${((i / (n - 1)) * (W - 6) + 3).toFixed(1)},${((1 - (v - lo) / (hi - lo)) * (H - 6) + 3).toFixed(1)}`).join("");
  }, [ys]);
  return (
    <svg className={"a4-spark " + (done ? "done" : "")} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Card({ p, i, ticked, done, onTick }: { p: Panel; i: number; ticked: boolean; done: boolean; onTick: () => void }) {
  const right = done && ticked === p.stationary;
  return (
    <button
      type="button"
      className={"a4-card " + (ticked ? "ticked " : "") + (done ? (right ? "right " : "wrong ") : "") + (done && p.stationary ? "stat" : "")}
      aria-pressed={ticked}
      disabled={done}
      onClick={onTick}
    >
      <span className="a4-card-head">
        <span className="a4-card-n">{i + 1}</span>
        <span className="a4-card-name">{p.name}</span>
        {!done && <span className={"a4-tick " + (ticked ? "on" : "")} aria-hidden="true" />}
      </span>
      <Spark ys={p.ys} done={done} />
      {done && (
        <span className="a4-flip">
          <span className={"a4-verdict " + (p.stationary ? "a4-truth" : "a4-err")}>{p.stationary ? "keeps its rules" : "does not"}</span>
          <span className="a4-reason">{p.reason}</span>
          <span className="a4-src">{p.real ? `real: NIFTY 50, ${NIFTY_FROM}–${NIFTY_TO}` : "simulated"}</span>
          <span className="a4-you">{ticked === p.stationary ? "you had it" : ticked ? "you ticked it" : "you left it"}</span>
        </span>
      )}
    </button>
  );
}

export function F1NineCharts() {
  const panels = ninePanels();
  // the remembered answer is the comma-joined list of ticked panel ids
  const [bet, setBet] = useBet<string>("A4-F1");
  const [draft, setDraft] = useState<Set<string>>(() => new Set());
  const done = bet !== null;
  const ticked = done ? new Set(bet.split(",").filter(Boolean)) : draft;
  const narrow = useNarrow("(max-width: 640px)");
  const [page, setPage] = useState(0);
  const pages = 3;
  const shown = narrow ? panels.slice(page * 3, page * 3 + 3) : panels;
  const offset = narrow ? page * 3 : 0;

  const score = panels.filter((p) => ticked.has(p.id) === p.stationary).length;
  const trueCount = panels.filter((p) => p.stationary).length;
  const swapped = done && ticked.has("price") && !ticked.has("cycle");
  const toggle = (id: string) => {
    if (done) return;
    const s = new Set(draft);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setDraft(s);
  };

  return (
    <Figure
      n="1"
      prompt={
        <>
          Round 1. Nine series, two of them real. Tick the ones that <em>keep their rules over time</em> — the same centre and the same spread in any year
          you care to look at. Then submit.
        </>
      }
      controls={
        <>
          {!done ? (
            <button type="button" className="btn primary" onClick={() => setBet([...draft].join(",") || "none")}>
              submit {draft.size} of 9
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setBet(null);
                setDraft(new Set());
              }}
            >
              play again
            </button>
          )}
          <Readouts items={done ? [["your score", <strong>{score} / 9</strong>], ["stationary series", `${trueCount} of 9`]] : [["ticked", `${draft.size}`]]} />
        </>
      }
      observe={
        !done ? (
          <>
            A series that keeps its rules is called <strong>stationary</strong>. That is the whole definition — nothing about flat, nothing about
            boring. Trust your eye for now; the reveal says which rules changed and why.
          </>
        ) : (
          <>
            {swapped ? (
              <>
                You swapped the two that everyone swaps: the index <em>looks</em> like it has a level, but the level is wherever it happened to wander; the
                cycle <em>looks</em> wild, but its rules never change — only its timing is random.{" "}
              </>
            ) : (
              <>
                The two that trip most people are the index price (it looks like it has a level — it does not) and the wild cycle (it looks unruly — its
                rules never change).{" "}
              </>
            )}
            "Keeps its rules" is a statement about the <strong>machine that made the series</strong>, not about one chart. Figure 2 is that machine.
          </>
        )
      }
    >
      {narrow && (
        <div className="a4-pager">
          <button type="button" className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
            ← previous 3
          </button>
          <span className="a4-pager-n">
            charts {page * 3 + 1}–{page * 3 + 3} of 9
          </span>
          <button type="button" className="btn" disabled={page === pages - 1} onClick={() => setPage(page + 1)}>
            next 3 →
          </button>
        </div>
      )}
      <div className={"a4-gallery " + (narrow ? "three" : "nine")}>
        {shown.map((p, k) => (
          <Card key={p.id} p={p} i={offset + k} ticked={ticked.has(p.id)} done={done} onTick={() => toggle(p.id)} />
        ))}
      </div>
      {done && (
        <div className="a4-result">
          <ResultCard
            yours={`${[...ticked].length} ticked`}
            answer={`${trueCount} keep their rules: the daily change, the volatility index, the spread and the aperiodic cycle`}
            verdict={score === 9 ? "right" : score >= 7 ? "close" : "miss"}
          >
            {score} of 9. Two were real (the NIFTY 50 close and its daily change); the other seven are simulated, each built by a rule that either does or does not
            depend on the date.
          </ResultCard>
        </div>
      )}
    </Figure>
  );
}
