import { useMemo, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Timeline, type Segment } from "../../../ui/Timeline";
import {
  Curve,
  Label,
  Marker,
  Plot,
  Points,
  usePlot,
  type Pt,
} from "../../../ui/Plot";
import { Avatar, Who } from "../../../ui/Comic";
import { rng, normalSample } from "../../../engine/random";
import { correlation } from "../../../engine/linalg";

const DAYS = 90;
export const LEMONADE = "Lemonade";
export const UMBRELLA = "Umbrella";

type Pick = "high" | "low" | "none";

/** Two stalls, one weather: bet first, then daily takings become dots, and the cloud has a direction. */
export function F0Stalls() {
  const [pick, setPick] = useBet<Pick>("A2-F0");
  const [ended, setEnded] = useState(false);
  const endedRef = useRef(false);
  const markEnded = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    queueMicrotask(() => setEnded(true));
  };
  const days = useMemo(() => {
    const r = rng(314);
    const out: Array<{ w: number; lemon: number; umb: number }> = [];
    for (let d = 0; d < DAYS; d++) {
      const w = normalSample(r);
      out.push({
        w,
        lemon: 50 + 10 * w + 6 * normalSample(r),
        umb: 40 - 8 * w + 6 * normalSample(r),
      });
    }
    return out;
  }, []);
  const all: Pt[] = days.map((d) => [d.lemon, d.umb]);
  const rho = correlation(
    days.map((d) => d.lemon),
    days.map((d) => d.umb),
  );
  const mx = days.reduce((s, d) => s + d.lemon, 0) / DAYS,
    my = days.reduce((s, d) => s + d.umb, 0) / DAYS;
  // the bet's answer, read off the figure's own data: Umbrella on Lemonade's best day, against Umbrella's usual (median) day
  const best = useMemo(() => {
    const b = days.reduce((a, d) => (d.lemon > a.lemon ? d : a));
    const sorted = days.map((d) => d.umb).sort((p, q) => p - q);
    const median = (sorted[DAYS / 2 - 1] + sorted[DAYS / 2]) / 2;
    const rank = sorted.filter((u) => u < b.umb).length;
    return { lemon: b.lemon, umb: b.umb, median, rank, answer: (b.umb < median ? "low" : "high") as Pick };
  }, [days]);
  const f2 = (v: number) => v.toFixed(2);
  const dir = useMemo(() => {
    // direction of the cloud: principal axis of the 2x2 covariance
    const sx = days.reduce((s, d) => s + (d.lemon - mx) ** 2, 0) / DAYS,
      sy = days.reduce((s, d) => s + (d.umb - my) ** 2, 0) / DAYS,
      sxy = days.reduce((s, d) => s + (d.lemon - mx) * (d.umb - my), 0) / DAYS;
    const th = 0.5 * Math.atan2(2 * sxy, sx - sy);
    return [Math.cos(th), Math.sin(th)];
  }, [days, mx, my]);

  const segments: Segment[] = [
    {
      duration: 8,
      caption:
        "Two stalls on one street: Lemonade and Umbrella. Each day's takings depend on the weather — the same weather for both — plus each stall's own luck: a school trip, a broken till, a friendly bus driver.",
    },
    {
      duration: 10,
      caption:
        "Day by day, each pair of takings becomes one dot: Lemonade across, Umbrella up. The first few days look like scattered luck.",
    },
    {
      duration: 14,
      caption:
        "By the end of the season the dots form a cloud, and the cloud has a direction: it runs downhill. The sunny days that fill the lemonade till are the days nobody buys an umbrella.",
    },
    {
      duration: 10,
      caption: `This is dependence, and the number that summarises it is the correlation: here about ${rho.toFixed(2)}. Minus one would be a perfect downhill line, plus one a perfect uphill line, zero a round cloud with no direction at all.`,
    },
    {
      duration: 8,
      caption:
        "Two questions for this page. How do you build a cloud with a chosen tilt on purpose — a trading desk needs to, every day — and how do you read a cloud back: its tilt, its axes, and what one number cannot tell you about its corners?",
    },
  ];
  const countAt = (i: number, u: number) =>
    i === 0
      ? 0
      : i === 1
        ? Math.floor(12 * u)
        : i === 2
          ? 12 + Math.floor((DAYS - 12) * u)
          : DAYS;

  return (
    <Figure
      n="0"
      prompt={
        <>
          A season in the life of two stalls. Bet first; then play, scrub, or
          switch the voice on.
        </>
      }
      observe={
        pick && (
        <>
          Every dot is one day. <Who name={LEMONADE} mood="happy" /> sells on
          sunny days, <Who name={UMBRELLA} mood="worried" /> on wet ones, so the
          cloud leans downhill. One hidden cause, two stalls, one tilt. The
          number for the tilt is the correlation, about {f2(rho).replace("-", "\u2212")} here —
          and the rest of this page is about making, reading and mistrusting
          that number.
        </>
        )
      }
    >
      <Bet
        question={
          <>
            <Who name={LEMONADE} mood="happy" /> and{" "}
            <Who name={UMBRELLA} mood="worried" /> share one street and one
            weather. On Lemonade's best day of the season, is Umbrella's takings
            high or low?
          </>
        }
        options={[
          { id: "high", label: "high" },
          { id: "low", label: "low" },
          { id: "none", label: "no relation" },
        ]}
        pick={pick}
        onPick={(v) => {
          setPick(v);
          if (v === null) {
            endedRef.current = false;
            setEnded(false);
          }
        }}
      >
      <Timeline
        segments={segments}
        onEnd={markEnded}
        render={(_t, i, u) => {
          const n = countAt(i, u);
          if (i === segments.length - 1 && u >= 1 - 1e-6) markEnded();
          const showDir = i >= 3 || (i === 2 && u > 0.85);
          return (
            <Plot
              xDomain={[10, 90]}
              yDomain={[0, 80]}
              xLabel="Lemonade's takings"
              yLabel="Umbrella's takings"
              height={340}
              ariaLabel="Daily takings of two stalls as a scatter"
            >
              {/* the first frame is never empty: the whole season, faint, before day 1 is drawn */}
              {i === 0 && <Points pts={all} role="ghost" r={3} opacity={0.3} />}
              {n > 0 && (
                <Points
                  pts={all.slice(0, n)}
                  role="approx"
                  r={3.2}
                  opacity={0.7}
                />
              )}
              {n > 0 && n <= DAYS && i < 3 && (
                <Marker at={all[n - 1]} role="approx" r={5} />
              )}
              {showDir && (
                <Curve
                  pts={[
                    [mx - 40 * dir[0], my - 40 * dir[1]],
                    [mx + 40 * dir[0], my + 40 * dir[1]],
                  ]}
                  role="ink"
                  width={1.5}
                  dash="6 4"
                  smooth={false}
                />
              )}
              {showDir && (
                <Label
                  at={[mx + 30 * dir[0], my + 30 * dir[1]]}
                  text="the cloud's direction"
                  dx={8}
                  dy={-6}
                />
              )}
              {i === segments.length - 1 && (
                <>
                  <Marker at={[best.lemon, best.umb]} role="error" r={6} />
                  <Label
                    at={[best.lemon, best.umb]}
                    text="Lemonade's best day"
                    role="error"
                    dx={-9}
                    dy={-14}
                    anchor="end"
                  />
                </>
              )}
              {i >= 1 && i < 3 && n > 0 && (
                <Label
                  at={all[n - 1]}
                  text={`day ${n}`}
                  dx={8}
                  dy={-6}
                  role="approx"
                />
              )}
              <StallFaces />
            </Plot>
          );
        }}
      />
      <div className="a2-legend">
        <span>
          across: <Who name={LEMONADE} /> takings
        </span>
        <span>
          up: <Who name={UMBRELLA} /> takings
        </span>
        <span>one dot = one day</span>
      </div>
      {pick && ended && (
        <ResultCard
          yours={pick === "high" ? "high" : pick === "low" ? "low" : "no relation"}
          answer={`${best.answer}: Umbrella took ${f2(best.umb)} on Lemonade's best day (${f2(best.lemon)}), against a usual ${f2(best.median)}`}
          verdict={pick === best.answer ? "right" : "miss"}
        >
          Same weather, opposite tills. The sun that fills Lemonade's best day
          empties Umbrella's: that day ranks {best.rank + 1} of {DAYS} for
          Umbrella, from the bottom. One hidden cause, two stalls, and the cloud
          leans downhill — correlation about {f2(rho).replace("-", "\u2212")}.
        </ResultCard>
      )}
      </Bet>
    </Figure>
  );
}

/** The two stalls' faces, sitting at the end of their own axis inside the plot. */
function StallFaces() {
  const { inner } = usePlot();
  const s = 34;
  return (
    <g>
      <g
        transform={`translate(${inner.left + inner.width - s - 4}, ${inner.top + inner.height - s - 4})`}
      >
        <Avatar name={LEMONADE} mood="happy" size={s} title="Lemonade stall" />
      </g>
      <g transform={`translate(${inner.left + 4}, ${inner.top + 22})`}>
        <Avatar
          name={UMBRELLA}
          mood="worried"
          size={s}
          title="Umbrella stall"
        />
      </g>
    </g>
  );
}
