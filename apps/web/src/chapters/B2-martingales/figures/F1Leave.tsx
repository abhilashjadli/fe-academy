import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Says } from "../../../ui/Comic";
import { Readouts, Segmented } from "../../../ui/controls";
import { fixedBet, quitAt, quitWhenAhead, type Strategy } from "../../../engine/martingale";
import { FanPlot, Finals } from "./Fan";
import { Meter } from "./Meter";
import { TOSSES, chips, f2, n1, n2, pct0, pct1, replayFan, useRecordReading } from "./table";

/**
 * Figure 1 — rule 2: you may leave. One picker (quit when up 1 / up 5 or down 20 / stay to the bell), one replay.
 * The histogram of final chips shows the spike and the tail; the readouts say how many left ahead and what the rest lost;
 * the meter reads zero each time. "Right 92 % of the time" and "average zero" are both true.
 */

type Rule = "up1" | "up5down20" | "bell";
const RULES: Record<Rule, { label: string; strategy: Strategy; seed: number; lo: number; hi: number; y: number; words: string }> = {
  up1: { label: "quit when up 1", strategy: quitWhenAhead(1, TOSSES), seed: 20261, lo: -45, hi: 6, y: 45, words: "leave the first time you are one chip ahead" },
  up5down20: { label: "up 5 or down 20", strategy: quitAt(5, 20), seed: 20262, lo: -25, hi: 10, y: 25, words: "leave at +5, or cut your losses at −20" },
  bell: { label: "stay to the bell", strategy: fixedBet(1), seed: 20263, lo: -45, hi: 45, y: 45, words: "sit through all two hundred tosses" },
};

export function F1Leave() {
  const [rule, setRule] = useState<Rule>("up1");
  const [played, setPlayed] = useState<Partial<Record<Rule, true>>>({});
  const r = RULES[rule];
  const fan = useMemo(() => (played[rule] ? replayFan(r.strategy, r.seed) : null), [played, rule, r]);
  useRecordReading("F1", fan);

  const ahead = fan ? fan.finals.filter((v) => v > 0).length / fan.finals.length : 0;
  const rest = fan ? fan.finals.filter((v) => v <= 0) : [];
  const restMean = rest.length ? rest.reduce((s, v) => s + v, 0) / rest.length : 0;
  const worst = fan ? Math.min(...fan.finals) : 0;
  const atUp = fan ? fan.finals.filter((v) => v === 5).length / fan.finals.length : 0;
  const atDown = fan ? fan.finals.filter((v) => v === -20).length / fan.finals.length : 0;
  const atBell = Math.max(0, 1 - atUp - atDown);

  return (
    <Figure
      n="1"
      prompt={
        <>
          Rule two. Pick an exit rule, seat 10,000 players under it, and watch two things at once: how many of them walk away ahead, and the meter.
        </>
      }
      controls={
        <>
          <Segmented<Rule>
            label="exit rule"
            value={rule}
            onChange={setRule}
            options={[
              { id: "up1", label: RULES.up1.label },
              { id: "up5down20", label: RULES.up5down20.label },
              { id: "bell", label: RULES.bell.label },
            ]}
          />
          <button type="button" className={"btn " + (fan ? "" : "primary")} onClick={() => setPlayed((p) => ({ ...p, [rule]: true }))} disabled={!!fan}>
            {fan ? "replayed" : "replay 10,000 players"}
          </button>
          <Readouts
            items={[
              ["left ahead", fan ? <strong>{pct1(ahead)}</strong> : "—"],
              ["the rest lost, on average", fan ? <span className="b2-error">{n1(restMean)}</span> : "—"],
              ["worst seat", fan ? <span className="b2-error">{chips(worst)}</span> : "—"],
            ]}
          />
        </>
      }
      observe={
        !fan ? (
          <>
            <em>{r.label}</em>: {r.words}. Press replay.
          </>
        ) : rule === "up1" ? (
          <>
            A spike at +1 with <strong>{pct1(ahead)}</strong> of players — and a thin tail to {chips(worst)}. The rule works almost every time, and the players it fails lose {n1(restMean)} chips on average, which is exactly what pays for everyone else's one chip. The meter reads <strong>{f2(fan.mean)}</strong> ± {n2(2 * fan.se)}. More time buys a higher hit rate and a deeper hole, never a moved meter.
          </>
        ) : rule === "up5down20" ? (
          <>
            Two walls: <strong>{pct0(atUp)}</strong> of players reached +5, {pct0(atDown)} hit −20, and {pct0(atBell)} were still between the walls at the bell (with unlimited time the split is 80/20 exactly). Four wins of 5 against one loss of 20: the meter reads {f2(fan.mean)} ± {n2(2 * fan.se)}. Choose any two walls you like and the odds rearrange themselves so the average stays where it started.
          </>
        ) : (
          <>
            No exit: Figure 0 again. About half finish ahead ({pct0(ahead)}), the spread is ±{n1(fan.sd)} chips, the meter reads {f2(fan.mean)} ± {n2(2 * fan.se)}. Leaving changes the <em>shape</em> of the histogram as much as you like. It does not change its centre.
          </>
        )
      }
    >
      <Says who="Croupier">Leave whenever you like.</Says>
      <div className="b2-stage">
        <Meter replay={fan} />
        {fan ? (
          <div className="b2-two">
            <FanPlot fan={fan} T={TOSSES} small yRange={r.y} />
            <Finals
              fan={fan}
              lo={r.lo}
              hi={r.hi}
              small
              yMax={rule === "up1" ? 0.02 : undefined}
              marks={rule === "up1" ? [{ at: 1, text: `+1: ${pct1(ahead)}, off the top`, role: "truth" }] : rule === "up5down20" ? [{ at: 5, text: `+5: ${pct0(atUp)}`, role: "truth" }, { at: -20, text: `−20: ${pct0(atDown)}`, role: "error" }] : undefined}
            />
          </div>
        ) : (
          <FanPlot fan={null} T={TOSSES} height={220} />
        )}
      </div>
    </Figure>
  );
}
