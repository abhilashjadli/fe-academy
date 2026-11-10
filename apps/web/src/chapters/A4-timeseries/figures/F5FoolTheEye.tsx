import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { ResultCard, useBet } from "../../../ui/Bet";
import { Readouts, Segmented } from "../../../ui/controls";
import { DF_CRIT_5, dickeyFuller } from "../../../engine/timeseries";
import { KEY, n0, n2, s2, tenFresh } from "./a4";

/**
 * Round 5 — break it: fool the eye. Ten fresh series, five random walks and five slow rubber bands (φ = 0.95–0.98), unlabelled.
 * Guess each by eye, then press "test": the Dickey–Fuller regression runs on all ten. Score out of 10 for you and for the test,
 * with the honest sentence. The second control is the sample length — the test needs a long sample too.
 */

type Len = "300" | "2000";
type Guess = "h" | "w" | "-";

const W = 220,
  H = 84;

function Spark({ ys }: { ys: number[] }) {
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
    const step = Math.max(1, Math.floor(n / 400));
    let s = "";
    for (let i = 0; i < n; i += step) s += `${i === 0 ? "M" : "L"}${((i / (n - 1)) * (W - 6) + 3).toFixed(1)},${((1 - (ys[i] - lo) / (hi - lo)) * (H - 6) + 3).toFixed(1)}`;
    return s;
  }, [ys]);
  return (
    <svg className="a4-spark" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function F5FoolTheEye() {
  const [len, setLen] = useState<Len>("300");
  const n = parseInt(len, 10);
  const series = tenFresh(n);
  // remembered as "<n>:<ten letters>"; a different sample length starts a fresh round
  const [bet, setBet] = useBet<string>("A4-F5");
  const [draft, setDraft] = useState<Guess[]>(() => new Array(10).fill("-"));
  const done = bet !== null && bet.startsWith(len + ":");
  const guesses: Guess[] = done ? (bet!.split(":")[1].split("") as Guess[]) : draft;
  const tests = useMemo(() => series.map((s) => dickeyFuller(s.ys)), [series]);
  const testSays = tests.map((t) => (t.t < DF_CRIT_5 ? "h" : "w"));
  const truth: Guess[] = series.map((s) => (s.walk ? "w" : "h"));
  const eyeScore = guesses.filter((g, i) => g === truth[i]).length;
  const testScore = testSays.filter((g, i) => g === truth[i]).length;
  const guessed = guesses.filter((g) => g !== "-").length;
  const near = KEY.df_near;

  const cycle = (i: number) => {
    if (done) return;
    const g = [...draft];
    g[i] = g[i] === "-" ? "h" : g[i] === "h" ? "w" : "-";
    setDraft(g);
  };

  return (
    <Figure
      n="5"
      prompt={
        <>
          Final round: break it. Ten fresh series, unlabelled — five are flat tables (random walks), five are slow bowls (φ between 0.95 and 0.98). Tap each one to
          call it <em>comes home</em> or <em>wanders</em>, then press test.
        </>
      }
      controls={
        <>
          <Segmented<Len>
            label="sample"
            options={[
              { id: "300", label: "300 days" },
              { id: "2000", label: "2,000 days" },
            ]}
            value={len}
            onChange={(v) => {
              setLen(v);
              setDraft(new Array(10).fill("-"));
            }}
          />
          {!done ? (
            <button type="button" className="btn primary" disabled={guessed < 10} onClick={() => setBet(len + ":" + draft.join(""))}>
              {guessed < 10 ? `call all ten (${guessed} so far)` : "test all ten"}
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setBet(null);
                setDraft(new Array(10).fill("-"));
              }}
            >
              play again
            </button>
          )}
          <Readouts items={done ? [["by eye", <strong>{eyeScore} / 10</strong>], ["the test", <strong>{testScore} / 10</strong>]] : [["called", `${guessed} / 10`]]} />
        </>
      }
      observe={
        done ? (
          <>
            By eye you got <strong>{eyeScore}</strong>; the test got <strong>{testScore}</strong> of ten on {n0(n)} days.{" "}
            {testScore === 10 ? (
              <>Every miss of the eye is a slow bowl that looks like a table, or a table that happened to turn round — and no chart can tell them apart near φ = 1.</>
            ) : (
              <>
                Even the test is fooled on a short sample: a bowl with φ = 0.98 on {near.y.length} points gives t = {s2(near.t)}, short of the {s2(near.crit["5%"])} it needs,
                so it is waved through as a random walk. Given enough days it is not — switch to 2,000 and run the round again.
              </>
            )}{" "}
            <span className="a4-quiet">Each verdict is the engine's own Dickey–Fuller regression on that series; "comes home" means t below −{n2(-DF_CRIT_5)}.</span>
          </>
        ) : (
          <>
            Any series that turns round a few times looks like it comes home; any that drifts for a while looks like a walk. Call all ten, then let the regression
            of Figure 4 run on each.
          </>
        )
      }
    >
      <div className="a4-ten">
        {series.map((s, i) => {
          const g = guesses[i];
          const right = g === truth[i];
          const testRight = testSays[i] === truth[i];
          return (
            <button key={i} type="button" className={"a4-card small " + (done ? (right ? "right " : "wrong ") : g !== "-" ? "ticked " : "")} disabled={done} onClick={() => cycle(i)} aria-label={`series ${i + 1}: ${g === "h" ? "comes home" : g === "w" ? "wanders" : "not called"}`}>
              <span className="a4-card-head">
                <span className="a4-card-n">{i + 1}</span>
                <span className={"a4-call " + (g === "-" ? "" : g === "h" ? "a4-truth" : "a4-err")}>{g === "-" ? "tap to call" : g === "h" ? "comes home" : "wanders"}</span>
              </span>
              <Spark ys={s.ys} />
              {done && (
                <span className="a4-flip">
                  <span className={"a4-verdict " + (truth[i] === "h" ? "a4-truth" : "a4-err")}>{truth[i] === "h" ? `a bowl, φ = ${n2(s.phi)}` : "a flat table, φ = 1"}</span>
                  <span className="a4-reason">
                    test: t = {s2(tests[i].t)} → {testSays[i] === "h" ? "comes home" : "wanders"} {testRight ? "✓" : "✗"}
                  </span>
                  <span className="a4-you">you: {right ? "✓" : "✗"}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="a4-result">
          <ResultCard yours={`${eyeScore} of 10 by eye`} answer={`the test: ${testScore} of 10`} verdict={eyeScore === 10 ? "right" : eyeScore >= 8 ? "close" : "miss"}>
            {testScore > eyeScore
              ? "The test beat your eye. Near φ = 1 the two machines draw the same pictures; only the regression can tell them apart — and it needs a long sample."
              : testScore === eyeScore
                ? "A draw — on this sample the test is no sharper than your eye. Give it 2,000 days."
                : "Your eye beat the test on this sample. Enjoy it: on a short sample the test has little power, and your luck will not hold on the next ten."}
          </ResultCard>
        </div>
      )}
    </Figure>
  );
}
