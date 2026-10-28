import { useMemo, useState } from "react";
import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { IconGrid } from "../../../ui/IconGrid";
import { diff, ols, randomWalk, type Fit } from "../../../engine/regression";
import { normalSample, rng } from "../../../engine/random";
import { format } from "d3-format";

type Round = "days" | "catch" | "ten";
type Kind = "spurious" | "real" | "noisy";
const n2 = fmt.n(2);
const n0 = fmt.n(0);
const nDays = format(",d");
const TRIALS = 200;
const PAIR_N = 200;
const ORDER: Kind[] = ["spurious", "real", "spurious", "noisy", "spurious", "real", "spurious", "noisy", "real", "spurious"];

interface Curated {
  kind: Kind;
  a: number[];
  b: number[];
  fit: Fit;
  dfit: Fit;
}

/** Ten pairs, fixed for everyone. Spurious pairs are chosen to be tempting (R² > 0.35). */
function curate(): Curated[] {
  const out: Curated[] = [];
  let seed = 4100;
  for (const kind of ORDER) {
    for (;;) {
      const r = rng(seed++);
      const a = randomWalk(PAIR_N, r, false);
      let b: number[];
      if (kind === "spurious") b = randomWalk(PAIR_N, r, false);
      else if (kind === "real") b = a.map((v) => 0.8 * v + 0.5 * normalSample(r));
      else b = a.map((v) => 0.8 * v + 1.5 * normalSample(r));
      const fit = ols(a, b);
      if (kind === "spurious" && fit.r2 < 0.35) continue;
      if (kind !== "spurious" && fit.r2 > 0.97) continue;
      out.push({ kind, a, b, fit, dfit: ols(diff(a), diff(b)) });
      break;
    }
  }
  return out;
}

function fooledRate(n: number): number {
  const r = rng(9000 + n);
  let c = 0;
  for (let t = 0; t < TRIALS; t++) {
    const a = randomWalk(n, r);
    const b = randomWalk(n, r);
    const f = ols(a, b);
    if (Math.abs(f.slope / f.se) > 2) c++;
  }
  return c / TRIALS;
}

function PairPlots({ a, b, fit, role = "error", label }: { a: number[]; b: number[]; fit: Fit; role?: "error" | "truth"; label?: string }) {
  const span = Math.max(4, ...a.map(Math.abs), ...b.map(Math.abs));
  const n = a.length - 1;
  const stride = Math.max(1, Math.floor(n / 400));
  const lineA: Pt[] = [],
    lineB: Pt[] = [],
    cloud: Pt[] = [];
  for (let i = 0; i <= n; i += stride) {
    lineA.push([i, a[i]]);
    lineB.push([i, b[i]]);
    cloud.push([a[i], b[i]]);
  }
  return (
    <div className="two">
      <Plot xDomain={[0, n]} yDomain={[-span, span]} width={440} height={260} xLabel="day" yLabel="level" xTicks={5} yTicks={5} ariaLabel="Two series over time">
        <Curve pts={lineA} role="truth" width={1.6} smooth={false} />
        <Curve pts={lineB} role="approx" width={1.6} smooth={false} />
        <Label at={[n, a[n]]} text="A" role="truth" anchor="end" dx={-4} />
        <Label at={[n, b[n]]} text="B" role="approx" anchor="end" dx={-4} />
      </Plot>
      <Plot xDomain={[-span, span]} yDomain={[-span, span]} width={440} height={260} xLabel="A" yLabel="B" xTicks={5} yTicks={5} ariaLabel="B against A with the fitted line">
        <Curve pts={[[-span, fit.intercept - fit.slope * span], [span, fit.intercept + fit.slope * span]]} role={role} width={2} smooth={false} />
        <Points pts={cloud} role="ink" r={2.2} opacity={0.5} />
        {label && <Label at={[span, span]} text={label} role={role} anchor="end" dx={-8} dy={16} />}
      </Plot>
    </div>
  );
}

/** Figure 4 — game rounds 2–4: more days won't save you; the detector; spurious or real, ten times. */
export function F4Fool() {
  const [round, setRound] = useState<Round>("days");
  const [days, setDays] = useState(50);
  const [seed, setSeed] = useState(21);
  const [differenced, setDifferenced] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState<Kind | null>(null);

  const walks = useMemo(() => {
    const r = rng(seed);
    const a = randomWalk(days, r);
    const b = randomWalk(days, r);
    return { a, b, fit: ols(a, b), dfit: ols(diff(a), diff(b)) };
  }, [seed, days]);
  const fooled = useMemo(() => fooledRate(days), [days]);
  const pairs = useMemo(curate, []);

  const tAbs = Math.abs(walks.fit.slope / walks.fit.se);
  const suspect = walks.fit.r2 > walks.fit.dw;
  const fooledN = Math.round(fooled * 100);

  const cur = pairs[Math.min(idx, pairs.length - 1)];
  const finished = answers.length >= pairs.length;
  const score = answers.filter(Boolean).length;
  const truthOf = (k: Kind) => (k === "spurious" ? "spurious" : "real");
  const answer = (said: "spurious" | "real") => {
    if (answered) return;
    setAnswered(said);
    setAnswers([...answers, said === truthOf(cur.kind)]);
  };
  const next = () => {
    setAnswered(null);
    setIdx(idx + 1);
  };
  const again = () => {
    setAnswers([]);
    setIdx(0);
    setAnswered(null);
  };
  const sentence =
    score >= 9
      ? "You have the habit: difference it, and see what survives."
      : score >= 7
        ? "Most of the fakes fooled nobody. The ones that did are why you difference first."
        : score >= 5
          ? "Half right is what R² alone gets you. The differenced row is the one to read."
          : "The levels fit lied to you ten times. Read Durbin–Watson and the differenced R² before the slope.";

  const diffWalks = { a: diff(walks.a), b: diff(walks.b) };

  return (
    <Figure
      n="4"
      prompt={
        <>
          Round 2: give the coin piles more days and see if the lie fades. Round 3: learn the one readout that catches it. Round 4: ten pairs — which are
          real?
        </>
      }
      controls={
        <>
          <Segmented
            options={[
              { id: "days", label: "round 2 · more days" },
              { id: "catch", label: "round 3 · catch it" },
              { id: "ten", label: "round 4 · spurious or real?" },
            ]}
            value={round}
            onChange={setRound}
          />
          {round !== "ten" && (
            <>
              <Slider label="days" value={days} min={50} max={2000} step={50} onChange={setDays} fmt={nDays} />
              <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>
                new walks
              </button>
            </>
          )}
          {round === "days" && <Readouts items={[["R²", n2(walks.fit.r2)], ["|t|", n2(tAbs)], ["fooled", `${n0(fooled * 100)} % of the time`]]} />}
          {round === "catch" && (
            <>
              <Readouts items={[["R²", n2(walks.fit.r2)], ["Durbin–Watson", n2(walks.fit.dw)]]} />
              <span className={"a3-badge " + (suspect ? "a3-badge-red" : "a3-badge-green")}>{suspect ? "R² > DW → suspect" : "R² < DW → fine"}</span>
              <button type="button" className={"btn " + (differenced ? "toggled" : "")} aria-pressed={differenced} onClick={() => setDifferenced(!differenced)}>
                difference the series
              </button>
              {differenced && <Readouts items={[["R² of the changes", n2(walks.dfit.r2)], ["|t| of the changes", n2(Math.abs(walks.dfit.slope / walks.dfit.se))]]} />}
            </>
          )}
        </>
      }
      observe={
        round === "days" ? (
          <>
            More days make the t-ratio grow and the score sit where it was. Sample size does not save you: a coin-pile regression gets more confident, not more
            right.
          </>
        ) : round === "catch" ? (
          <>
            Durbin–Watson near 2 means the leftovers forget yesterday; near 0 means they remember everything. The habit: R² above DW, suspect it. Difference
            the series and see what survives.
          </>
        ) : (
          <>
            Ten pairs, same look. Levels R² cannot tell them apart; the differenced fit can. Genuinely related pairs keep a slope after differencing; fakes lose
            it. Score is the habit, not the luck.
          </>
        )
      }
    >
      {round === "days" && (
        <>
          <PairPlots a={walks.a} b={walks.b} fit={walks.fit} label={`R² ${n2(walks.fit.r2)}, |t| ${n2(tAbs)}`} />
          <div className="a3-row">
            <IconGrid n={100} roleOf={(i) => (i < fooledN ? "error" : "ghost")} size={11} gap={2} label={<>{fooledN} in every 100 coin-pile pairs of {nDays(days)} days pass the textbook test (|t| &gt; 2)</>} />
          </div>
        </>
      )}
      {round === "catch" &&
        (differenced ? (
          <PairPlots a={diffWalks.a} b={diffWalks.b} fit={walks.dfit} role="truth" label={`changes: R² ${n2(walks.dfit.r2)}`} />
        ) : (
          <PairPlots a={walks.a} b={walks.b} fit={walks.fit} label={`levels: R² ${n2(walks.fit.r2)}, DW ${n2(walks.fit.dw)}`} />
        ))}
      {round === "ten" && (
        <>
          <PairPlots a={cur.a} b={cur.b} fit={cur.fit} role={answered ? (cur.kind === "spurious" ? "error" : "truth") : "error"} label={`R² ${n2(cur.fit.r2)}`} />
          <div className="a3-game">
            <span>
              pair {Math.min(idx + 1, pairs.length)} of {pairs.length}
            </span>
            <span className="a3-score" aria-label={`score ${score} of ${answers.length}`}>
              {pairs.map((_, i) => (
                <i key={i} className={i < answers.length ? (answers[i] ? "hit" : "miss") : ""} />
              ))}
            </span>
            {!finished && (
              <>
                <button type="button" className="btn" disabled={!!answered} onClick={() => answer("spurious")}>
                  spurious
                </button>
                <button type="button" className="btn" disabled={!!answered} onClick={() => answer("real")}>
                  real
                </button>
                {answered && (
                  <button type="button" className="btn primary" onClick={next}>
                    next pair
                  </button>
                )}
              </>
            )}
            {finished && (
              <button type="button" className="btn" onClick={again}>
                play again
              </button>
            )}
          </div>
          {answered && (
            <div className={"a3-verdict " + (answers[answers.length - 1] ? "hit" : "miss")}>
              <Readouts
                items={[
                  ["it was", cur.kind === "noisy" ? "real, but noisy" : cur.kind],
                  ["R²", n2(cur.fit.r2)],
                  ["Durbin–Watson", n2(cur.fit.dw)],
                  ["R² after differencing", n2(cur.dfit.r2)],
                  ["|t| after differencing", n2(Math.abs(cur.dfit.slope / cur.dfit.se))],
                ]}
              />
              <div className="why">
                {cur.kind === "spurious"
                  ? "Two strangers. Difference them and the slope is gone."
                  : cur.kind === "real"
                    ? "B really follows A. Difference them and the slope survives."
                    : "B follows A under a lot of noise. The differenced R² is small — but its t-ratio still clears 2."}
              </div>
            </div>
          )}
          {finished && (
            <div className={"a3-verdict " + (score >= 7 ? "hit" : "miss")}>
              <strong>
                {score} out of {pairs.length}.
              </strong>
              <div className="why">{sentence}</div>
            </div>
          )}
        </>
      )}
    </Figure>
  );
}
