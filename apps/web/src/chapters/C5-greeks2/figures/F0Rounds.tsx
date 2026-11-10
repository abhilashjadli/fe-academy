import "./figures.css";
import { useEffect, useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Curve, HLine, Label, Marker, Plot, VLine, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { XTicks } from "./ticks";
import { n0 } from "../../C4-greeks/figures/row";
import { KEY, ROW, STRIKE_ROLE, STRIKE_WORD, chainIv, deltaVsDays, deltaVsVol, f3, g2, pct1, units, useNarrow, type Strike } from "./c5";

/**
 * Figure 0 — three rounds, guess then reveal, on the real chain. A drawn position card (4 lots of a call, hedged flat at
 * this morning's slope), a three-button pick (long / short / flat), then the reveal: the delta-vs-wobble (rounds 1, 2)
 * or delta-vs-days (round 3) curve slides in and the marker drifts from the old slope to the new one. Then the tally,
 * the two names, and the at-the-money control line. Every number is the engine's; the captions quote key-C5.json.
 */

type Pick = "long" | "short" | "flat";
type Nudge = "vol" | "days";
const LOTS = 4;
const UNITS = LOTS * ROW.lot; // 260
const VOL_JUMP = 0.1;
const WEEK_LEFT = 4;

interface Round {
  n: 1 | 2 | 3;
  K: Strike;
  nudge: Nudge;
  key: string;
}
const ROUNDS: Round[] = [
  { n: 1, K: 23050, nudge: "vol", key: "C5-F0-1" },
  { n: 2, K: 22250, nudge: "vol", key: "C5-F0-2" },
  { n: 3, K: 23050, nudge: "days", key: "C5-F0-3" },
];

interface Outcome {
  iv: number;
  delta0: number;
  delta1: number;
  hedge: number;
  book: number; // index units the hedged book is long (+) or short (−) after the nudge
  truth: Pick;
}
function outcome(r: Round): Outcome {
  const iv = chainIv(r.K);
  const delta0 = g2(r.K, ROW.days).delta;
  const delta1 = r.nudge === "vol" ? g2(r.K, ROW.days, iv + VOL_JUMP).delta : g2(r.K, WEEK_LEFT).delta;
  const hedge = UNITS * delta0;
  const book = hedge - UNITS * delta1;
  const truth: Pick = Math.abs(book) < 0.5 ? "flat" : book > 0 ? "long" : "short";
  return { iv, delta0, delta1, hedge, book, truth };
}
const OUT = ROUNDS.map(outcome);
const ATM = { d0: g2(22600, ROW.days).delta, dVol: g2(22600, ROW.days, chainIv(22600) + VOL_JUMP).delta, dWeek: g2(22600, WEEK_LEFT).delta };

const OPTIONS: Array<{ id: Pick; label: string }> = [
  { id: "long", label: "long — more index than the calls need" },
  { id: "short", label: "short — less than the calls need" },
  { id: "flat", label: "flat — nothing traded, nothing moved" },
];
const PCT_TICKS = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35];
const pctTick = (v: number) => Math.round(v * 100) + " %";
const bookWord = (book: number) => (Math.abs(book) < 0.5 ? "flat" : `${book > 0 ? "long" : "short"} ${units(book)} units`);

/** 0 → 1 over `ms` once `on` turns true; snaps back to 0 when it turns false. */
function useProgress(on: boolean, ms = 1100): number {
  const [t, setT] = useState(on ? 1 : 0);
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / ms);
      setT(u < 1 ? u * u * (3 - 2 * u) : 1);
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setT(0);
    };
  }, [on, ms]);
  return on ? t : 0;
}

function PositionCard({ r, o }: { r: Round; o: Outcome }) {
  return (
    <div className="c5-card" role="group" aria-label={`position card, round ${r.n}`}>
      <div className="c5-card-head">
        <span>position · round {r.n} of 3</span>
        <span>NIFTY · {ROW.days} days left</span>
      </div>
      <div className="c5-card-main">
        <span className="c5-card-sold">sold</span>
        <strong>
          {LOTS} lots of the {n0(r.K)} call
        </strong>
        <span className="c5-card-sub">
          {LOTS} × {ROW.lot} = {UNITS} units · {STRIKE_WORD[r.K]} · wobble {pct1(o.iv)}
        </span>
      </div>
      <div className="c5-card-rows">
        <span>
          <i>slope</i> {f3(o.delta0)}
        </span>
        <span>
          <i>bought against them</i> {units(o.hedge)} index units
        </span>
        <span>
          <i>book</i> flat
        </span>
      </div>
      <div className="c5-card-event">
        {r.nudge === "vol" ? (
          <>
            Then the wobble jumps ten points, {pct1(o.iv)} → {pct1(o.iv + VOL_JUMP)}. No trade. The index does not move.
          </>
        ) : (
          <>
            Then nothing happens for a week. Wobble unchanged at {pct1(o.iv)}, index unchanged, {WEEK_LEFT} days left. No trade.
          </>
        )}
      </div>
    </div>
  );
}

function RevealPlot({ r, o, revealed, t }: { r: Round; o: Outcome; revealed: boolean; t: number }) {
  const narrow = useNarrow();
  const curve = useMemo<Pt[]>(() => (r.nudge === "vol" ? deltaVsVol(r.K) : deltaVsDays(r.K)), [r.K, r.nudge]);
  const atm = useMemo<Pt[]>(() => (r.nudge === "vol" ? deltaVsVol(22600) : deltaVsDays(22600)), [r.nudge]);
  const x0 = r.nudge === "vol" ? o.iv : ROW.days;
  const x1 = r.nudge === "vol" ? o.iv + VOL_JUMP : WEEK_LEFT;
  const xNow = x0 + (x1 - x0) * t;
  const yNow = r.nudge === "vol" ? g2(r.K, ROW.days, xNow).delta : g2(r.K, xNow).delta;
  const role = STRIKE_ROLE[r.K];
  const xDomain: [number, number] = r.nudge === "vol" ? [0.05, 0.4] : [0, 20];
  return (
    <div className={"c5-reveal " + (revealed ? "on" : "")}>
      <Plot
        xDomain={xDomain}
        yDomain={[0, 1]}
        width={narrow ? 340 : 440}
        height={narrow ? 250 : 260}
        margin={{ top: 16, right: 14, bottom: 34, left: 40 }}
        xTicks={r.nudge === "vol" ? 0 : 5}
        yTicks={5}
        xLabel={r.nudge === "vol" ? "wobble" : "days left"}
        yLabel={`slope of the ${n0(r.K)} call`}
        axisX={xDomain[0]}
        axisY={0}
        ariaLabel={`the ${n0(r.K)} call's delta against ${r.nudge === "vol" ? "the wobble" : "the days left"}, with the marker moving from ${f3(o.delta0)} to ${f3(o.delta1)}`}
      >
        {r.nudge === "vol" && <XTicks at={PCT_TICKS} fmt={pctTick} />}
        <HLine at={o.delta0} />
        {revealed && (
          <g className="c5-slide">
            <Curve pts={atm} role="ghost" dash="4 3" width={1.2} />
            <Label at={[r.nudge === "vol" ? 0.395 : 19.5, atm[atm.length - 1]?.[1] ?? 0.5]} text="22,600, at the money" role="ghost" dx={0} dy={14} anchor="end" />
            <Curve pts={curve} role={role} width={2.2} />
          </g>
        )}
        <VLine at={x0} />
        <Marker at={[x0, o.delta0]} role="ink" r={4} />
        <Label at={[x0, o.delta0]} text={`this morning ${f3(o.delta0)}`} dx={r.nudge === "vol" ? -8 : 8} dy={r.K === 22250 ? 18 : -8} anchor={r.nudge === "vol" ? "end" : "start"} />
        {revealed && (
          <>
            <Curve pts={[[x0, o.delta0], [xNow, o.delta0]]} role="ghost" width={1} smooth={false} />
            <Curve pts={[[xNow, o.delta0], [xNow, yNow]]} role="error" width={1.5} dash="3 2" smooth={false} />
            <Marker at={[xNow, yNow]} role={role} r={6} />
            {t >= 1 && <Label at={[x1, o.delta1]} text={`after ${f3(o.delta1)}`} role={role} dx={10} dy={18} />}
          </>
        )}
      </Plot>
    </div>
  );
}

function Tally({ picks }: { picks: Array<Pick | null> }) {
  const narrow = useNarrow();
  const vol = useMemo(() => ({ 22250: deltaVsVol(22250), 22600: deltaVsVol(22600), 23050: deltaVsVol(23050) }), []);
  const days = useMemo(() => ({ 22250: deltaVsDays(22250), 22600: deltaVsDays(22600), 23050: deltaVsDays(23050) }), []);
  const right = picks.filter((p, i) => p === OUT[i].truth).length;
  const w = narrow ? 360 : 330,
    h = narrow ? 220 : 230;
  const panel = (kind: "vol" | "days") => {
    const src = kind === "vol" ? vol : days;
    const xDomain: [number, number] = kind === "vol" ? [0.05, 0.4] : [0, 20];
    const here = kind === "vol" ? chainIv(22600) : ROW.days;
    return (
      <Plot xDomain={xDomain} yDomain={[0, 1]} width={w} height={h} margin={{ top: 16, right: 12, bottom: 34, left: 40 }} xTicks={kind === "vol" ? 0 : 5} yTicks={5} xLabel={kind === "vol" ? "wobble" : "days left"} axisX={xDomain[0]} axisY={0} ariaLabel={`delta of the three calls against ${kind === "vol" ? "the wobble" : "the days left"}`}>
        {kind === "vol" && <XTicks at={PCT_TICKS} fmt={pctTick} />}
        <VLine at={here} />
        {([22250, 22600, 23050] as Strike[]).map((K) => (
          <Curve key={K} pts={src[K]} role={STRIKE_ROLE[K]} width={K === 22600 ? 1.4 : 2} dash={K === 22600 ? "4 3" : undefined} />
        ))}
        <Label at={[kind === "vol" ? 0.3 : 15, 0.86]} text="22,250" role="error" dy={-4} />
        <Label at={[kind === "vol" ? 0.3 : 15, 0.5]} text="22,600" dy={-6} />
        <Label at={[kind === "vol" ? 0.3 : 15, kind === "vol" ? 0.34 : 0.3]} text="23,050" role="truth" dy={18} />
      </Plot>
    );
  };
  return (
    <div className="c5-tally">
      <div className="c5-tally-panels">
        <div>
          <div className="c5-panel-title">
            <strong>vanna</strong> — delta's drift when the wobble moves
          </div>
          {panel("vol")}
        </div>
        <div>
          <div className="c5-panel-title">
            <strong>charm</strong> — delta's drift when the clock moves
          </div>
          {panel("days")}
        </div>
      </div>
      <table className="table c5-tally-table">
        <thead>
          <tr>
            <th>round</th>
            <th className="c5-nudge">the nudge</th>
            <th>you said</th>
            <th>it was</th>
          </tr>
        </thead>
        <tbody>
          {ROUNDS.map((r, i) => (
            <tr key={r.n} className={picks[i] === OUT[i].truth ? "c5-hit" : "c5-miss"}>
              <td className="c5-nowrap">
                {r.n} · {n0(r.K)}
              </td>
              <td className="c5-nudge">{r.nudge === "vol" ? "wobble +10 points" : "a quiet week"}</td>
              <td>{picks[i] ?? "—"}</td>
              <td>
                <strong className="c5-nowrap">{bookWord(OUT[i].book)}</strong>
                <span className="c5-nowrap c5-quiet"> · {f3(OUT[i].delta0)} → {f3(OUT[i].delta1)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="c5-names">
        <p>
          <strong>{right} of 3.</strong> {right < 3 ? "If round 2 caught you, you are in good company: the sign flips at the money." : "The sign flips at the money, and you saw it coming."} Two names
          for what you just watched. <strong>Vanna</strong> is delta's drift when the wobble moves: up for the out-of-the-money call ({f3(OUT[0].delta0)} → {f3(OUT[0].delta1)}), down for the
          in-the-money one ({f3(OUT[1].delta0)} → {f3(OUT[1].delta1)}). <strong>Charm</strong> is delta's drift when the clock moves ({f3(OUT[2].delta0)} → {f3(OUT[2].delta1)} over the quiet week).
          Less time and less wobble both shrink the cloud, so charm points the same way as a wobble <em>fall</em>.
        </p>
        <p className="c5-control-line">
          The control: the at-the-money 22,600's slope barely moves — {f3(ATM.d0)} → {f3(ATM.dVol)} on the wobble jump, {f3(ATM.dWeek)} after the week. Key: {f3(KEY.atm_control.delta0)} →{" "}
          {f3(KEY.atm_control.delta_vol_up)} / {f3(KEY.atm_control.delta_week)}.
        </p>
      </div>
    </div>
  );
}

export function F0Rounds() {
  const [view, setView] = useState(0); // 0..2 the rounds, 3 the tally
  const [p1, setP1] = useBet<Pick>(ROUNDS[0].key);
  const [p2, setP2] = useBet<Pick>(ROUNDS[1].key);
  const [p3, setP3] = useBet<Pick>(ROUNDS[2].key);
  const picks = [p1, p2, p3];
  const setters = [setP1, setP2, setP3];
  const tally = view === 3;
  const i = Math.min(view, 2);
  const r = ROUNDS[i],
    o = OUT[i],
    pick = picks[i];
  const revealed = !!pick;
  const t = useProgress(revealed);
  const verdict = !pick ? "none" : pick === o.truth ? "right" : "miss";
  const keyRound = KEY.rounds[i];

  const next = () => {
    if (tally) {
      setView(0);
      setters.forEach((s) => s(null));
    } else setView(view + 1);
  };

  return (
    <Figure
      n="0"
      prompt={
        <>
          Three rounds. A sold call, hedged flat at this morning's slope. Then one thing changes that is not a trade and not a move in the index. Say whether the book is now long, short or
          flat — then watch the slope drift.
        </>
      }
      controls={
        <>
          <span className="c5-ctl-note">{tally ? "the tally" : `round ${r.n} of 3`}</span>
          <button type="button" className="btn primary" disabled={!tally && !revealed} onClick={next}>
            {tally ? "play again" : view === 2 ? "the tally" : "next round"}
          </button>
          {!tally && (
            <Readouts
              items={[
                ["slope this morning", f3(o.delta0)],
                [r.nudge === "vol" ? "slope after the jump" : "slope after the week", revealed ? f3(o.delta1) : "?"],
                ["book", revealed ? bookWord(o.book) : "?"],
              ]}
            />
          )}
        </>
      }
      observe={
        tally ? (
          <>
            Neither drift was a trade. A hedge balanced this morning is quietly wrong by lunchtime for two reasons: the wobble is an assumption you can change in your head, and the clock
            runs whether or not anything happens. Figure 1 shows both drifts for every strike and every date at once.
          </>
        ) : i === 0 ? (
          <>
            Nothing was traded and the index did not move; the only thing that changed was a number in the trader's head. Key: {f3(keyRound.delta0)} → {f3(keyRound.delta1)}, book{" "}
            {units(keyRound.book_delta_after)} units short.
          </>
        ) : i === 1 ? (
          <>
            Same jump, opposite answer. More wobble pulls every slope toward one-half: the out-of-the-money call's rises, the in-the-money call's falls. Key: {f3(keyRound.delta0)} →{" "}
            {f3(keyRound.delta1)}, book {units(keyRound.book_delta_after)} units long.
          </>
        ) : (
          <>
            Nobody touched anything and the book is long. Less time, like less wobble, shrinks the cloud; an out-of-the-money call's slope decays toward zero. Key: {f3(keyRound.delta0)} →{" "}
            {f3(keyRound.delta1)} with {WEEK_LEFT} days left, book {units(keyRound.book_delta_after)} units long.
          </>
        )
      }
    >
      {tally ? (
        <Tally picks={picks} />
      ) : (
        <div className="c5-round" key={r.n}>
          <div className="c5-round-left">
            <PositionCard r={r} o={o} />
          </div>
          <div className="c5-round-right">
            <RevealPlot r={r} o={o} revealed={revealed} t={t} />
          </div>
          <div className="c5-round-bet">
            <Bet<Pick> question={<>Your book is now…</>} options={OPTIONS} pick={pick} onPick={setters[i]}>
              <ResultCard yours={pick ?? ""} answer={<>{bookWord(o.book)} — the slope went {f3(o.delta0)} → {f3(o.delta1)}, so the {UNITS} units sold now need {units(UNITS * o.delta1)} against {units(o.hedge)} held</>} verdict={verdict}>
                {r.n === 1 ? (
                  <>
                    <q>All he did to unbalance his delta position was to change his assumptions about market conditions.</q> — Natenberg, p. 110. The {n0(r.K)} call is out of the money; a wider
                    cloud gives it more chance of finishing in, and its slope rises toward one-half.
                  </>
                ) : r.n === 2 ? (
                  <>
                    The {n0(r.K)} call is in the money. The same wider cloud gives it more chance of finishing <em>out</em>, and its slope falls toward one-half — so the book that was short in round 1 is
                    long now. The sign flips at the money.
                  </>
                ) : (
                  <>
                    A quiet week does to the {n0(r.K)} call what a wobble <em>fall</em> would: the cloud shrinks, the call's chance of finishing in shrinks, the slope decays. The short-call book, hedged at{" "}
                    {f3(o.delta0)}, is long {units(o.book)} units on Monday morning with nothing traded.
                  </>
                )}
              </ResultCard>
            </Bet>
          </div>
        </div>
      )}
    </Figure>
  );
}
