import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Label, Plot } from "../../../ui/Plot";
import { shuffle } from "../../../engine/volatility";
import { rng } from "../../../engine/random";
import { DATES, N, NAMED_STORMS, R, STATS, STORMS, X_DOMAIN, YEAR, movePct, n0, niceDate, shortDate, useNarrow, volPct } from "./a5";
import { CLIPPED_DAYS, MOVE_CAP, Shade, Spikes, clippedWords } from "./pictures";
import "./figures.css";

/**
 * Figure 0 — guess-then-reveal on a real artefact. Two unlabelled strips of daily moves, 2016 → 2026: the real index and
 * the same 2,679 days shuffled. The three tiles under each are identical by construction. The reader clicks the real
 * one; on reveal the real strip's storms are shaded and dated and "shuffle again" reshuffles the other as often as
 * they like. No clock yet — this figure is the one that earns it.
 */

type Pick = "top" | "bottom";
const REAL_IS_TOP = rng(5)() < 0.5; // fixed once, so a reload keeps the answer where it was

export function F0Shuffle() {
  const [pick, setPick] = useBet<Pick>("A5-F0");
  const [seed, setSeed] = useState(1);
  const shuffled = useMemo(() => shuffle(R, rng(1000 + seed)).map((r) => 100 * r), [seed]);
  const narrow = useNarrow();
  const real: Pick = REAL_IS_TOP ? "top" : "bottom";
  const revealed = !!pick;
  const verdict = !pick ? "none" : pick === real ? "right" : "miss";

  const strip = (which: Pick) => {
    const isReal = which === real;
    const ys = isReal ? R.map((r) => 100 * r) : shuffled;
    return (
      <button type="button" className={"a5-strip " + (revealed ? (isReal ? "is-real" : "is-shuffled") : "")} disabled={revealed} onClick={() => setPick(which)} aria-label={revealed ? (isReal ? "the real index" : "the same days, shuffled") : `strip ${which === "top" ? "A" : "B"} — click if you think this is the real one`}>
        <span className="a5-strip-tag">{revealed ? (isReal ? "the real index, in order" : `the same ${n0(N)} days, shuffled`) : which === "top" ? "A" : "B"}</span>
        <Plot xDomain={X_DOMAIN} yDomain={[-MOVE_CAP * 1.25, MOVE_CAP * 1.25]} width={narrow ? 400 : 660} height={narrow ? 130 : 150} margin={{ top: 8, right: 10, bottom: 8, left: 30 }} xTicks={0} yTicks={3} grid={false} axisY={0} ariaLabel={isReal ? "The real daily moves in date order: quiet stretches and clumps of big days" : "The same daily moves in a random order: even fuzz with no clumps"}>
          {revealed && isReal && STORMS.filter((s) => !NAMED_STORMS.includes(s)).map((s, k) => <Shade key={k} from={s.from} to={s.to} role="error" />)}
          {revealed && isReal && NAMED_STORMS.map((s, k) => <Shade key={"n" + k} from={s.from} to={s.to} role="error" label={narrow ? shortDate(DATES[s.peak]) : niceDate(DATES[s.peak]) + " " + movePct(R[s.peak])} labelAt={(k + (narrow ? 1 : 0)) % 2 ? "bottom" : "top"} />)}
          <Spikes ys={ys} role="ink" clampLo={-MOVE_CAP} clampHi={MOVE_CAP} />
          {revealed && isReal && <Label at={[YEAR[0], -MOVE_CAP * 1.25]} text={`${DATES[0].slice(0, 4)} → ${DATES[N - 1].slice(0, 4)}`} dx={3} dy={-3} />}
          {revealed && isReal && !narrow && <Label at={[YEAR[N - 1], -MOVE_CAP * 1.25]} text={`${clippedWords(CLIPPED_DAYS)} · worst ${movePct(R[STATS.worst])}`} dx={-3} dy={-3} anchor="end" />}
        </Plot>
        <span className="a5-tiles">
          <span className="a5-tile">
            <span className="k">average day</span>
            <span className="v">{movePct(STATS.mean, 3)}</span>
          </span>
          <span className="a5-tile">
            <span className="k">spread (sd)</span>
            <span className="v">{volPct(STATS.sd)}</span>
          </span>
          <span className="a5-tile">
            <span className="k">worst day</span>
            <span className="v">{movePct(R[STATS.worst])}</span>
          </span>
        </span>
      </button>
    );
  };

  return (
    <Figure
      n="0"
      prompt={
        <>
          Two strips of daily moves, each {n0(N)} days long. One is a real stock index, in order; the other is the same {n0(N)} numbers shuffled. The three tiles under each are
          identical. Click the real one.
        </>
      }
      controls={
        <>
          <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
            shuffle again
          </button>
          <span className="a5-hint">{revealed ? "the shuffled strip changes; the real one cannot" : "reshuffle as often as you like, then click"}</span>
        </>
      }
      observe={
        revealed ? (
          <>
            The real strip has <strong>storms</strong> — {NAMED_STORMS.map((s, k) => (k ? ", " : "") + niceDate(DATES[s.peak]).replace(/^\d+ /, "")).join("")} — where big days come in clumps and quiet years in between; the
            shuffled strip is even fuzz, and stays fuzz however often you reshuffle. Average, spread and worst day cannot tell them apart: <strong>the order is the information</strong>. A
            big move is not a date; a clump of them is.
          </>
        ) : (
          <>Same average, same spread, same worst day. Whatever lets you tell them apart is something those three numbers do not measure — and is this chapter's subject.</>
        )
      }
    >
      <div className="a5-stage">
        <div className="a5-strips">
          {strip("top")}
          {strip("bottom")}
        </div>
        <Bet<Pick>
          question={<>Which strip is the real index?</>}
          options={[
            { id: "top", label: "A, the top one" },
            { id: "bottom", label: "B, the bottom one" },
          ]}
          pick={pick}
          onPick={setPick}
        >
          <ResultCard yours={pick === "top" ? "A, the top one" : "B, the bottom one"} answer={real === "top" ? "A — the one with the storms" : "B — the one with the storms"} verdict={verdict}>
            NIFTY 50, {niceDate(DATES[0])} to {niceDate(DATES[N - 1])}, {n0(N)} real days. The shaded spells are where the big days bunched; the dates mark each spell's biggest day. Shuffle the
            other strip a hundred times and the clumps never come back — the three tiles do not move either, because they never saw the order. The order <em>is</em> the information.
          </ResultCard>
        </Bet>
      </div>
    </Figure>
  );
}
