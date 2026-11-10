import "./figures.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Toggle } from "../../../ui/controls";
import { countBars, randomWalk, walkSd, walkWithin, walkerCloud } from "../../../engine/markov";
import { rng } from "../../../engine/random";
import { KEY, f1, f2, pct0, useNarrow } from "./rain";

/**
 * Figure 3 — the same machine with states on a line. A drunk at a lamppost, each hop ±1 with a fair coin. Five steps by
 * hand; release 1,000 and the count bars above the street widen. The bracket reads "typical distance √steps". One toggle
 * gives him memory (a step repeats the last one 3 times in 4): the crowd spreads faster than √t.
 */

const N = 400;
const WALKERS = 1000;
const MEMORY_P = KEY.memory.p; // 0.75
const X_MAX = 80;
const H = 238,
  STREET_Y = 206,
  BAR_BASE = 148,
  BAR_H = 112;

export function F3Street() {
  const [t, setT] = useState(0);
  const [released, setReleased] = useState(false);
  const [memory, setMemory] = useState(false);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const p = memory ? MEMORY_P : 0.5;
  const narrow = useNarrow();
  const W = narrow ? 390 : 560;
  const xpx = (x: number) => W / 2 + (x / X_MAX) * (W / 2 - 14);
  const bw = narrow ? 4 : 6;

  const drunk = useMemo(() => randomWalk(N, rng(31), p), [p]);
  const cloud = useMemo(() => walkerCloud(WALKERS, N, rng(2024), p), [p]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      if (dt > 28) {
        last = now;
        setT((k) => {
          const step = k < 30 ? 1 : k < 120 ? 2 : 4; // slow start so the bell forms in view, then quicker
          const nk = Math.min(N, k + step);
          if (nk >= N) setPlaying(false);
          return nk;
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const bars = useMemo(() => (released ? countBars(cloud.positions[t], N) : null), [cloud, t, released]);
  const maxBar = bars ? Math.max(1, ...bars) : 1;
  const ms = released && t > 0 ? cloud.meanSquare(t) : NaN;
  const rms = Math.sqrt(ms);
  const sd = walkSd(t);
  const within = bars && t > 0 ? (() => {
      const a = Math.round(sd);
      let s = 0;
      for (let x = -a; x <= a; x++) s += bars[x + N];
      return s / WALKERS;
    })() : NaN;

  const reset = () => {
    cancelAnimationFrame(raf.current);
    setPlaying(false);
    setReleased(false);
    setT(0);
  };

  return (
    <Figure
      n="3"
      prompt={
        <>
          The same machine, with the states laid along a street. A drunk leaves the lamppost; each step is one pace left or right on a coin, and the coin never asks
          where he has been. Walk him five steps. Then release a thousand of him.
        </>
      }
      controls={
        <>
          <span className="ctl">
            <span className="seg" role="group" aria-label="walk">
              <button type="button" disabled={playing || t >= N} onClick={() => setT((k) => Math.min(N, k + 1))}>
                step
              </button>
              <button type="button" disabled={playing || t >= N} onClick={() => { setReleased(true); setPlaying(true); }}>
                {released ? "run on" : `release ${WALKERS.toLocaleString("en-US")}`}
              </button>
              <button type="button" disabled={t === 0 && !released} onClick={reset}>
                reset
              </button>
            </span>
          </span>
          <Toggle label="give him memory" on={memory} onChange={setMemory} />
          <Readouts
            items={[
              ["steps", String(t)],
              ["typical distance, measured", released && t > 0 ? f1(rms) : "—"],
              [memory ? "spread² ÷ steps (memory)" : "√steps", memory ? (released && t > 0 ? f2(ms / t) : "—") : f1(sd)],
            ]}
          />
        </>
      }
      observe={
        !released ? (
          t < 5 ? (
            <>
              He is at {signed(drunk[t])}. Where will he be after a hundred steps? "Back at the lamppost, on average" is true and useless — the question is how far he
              typically wanders. Five steps by hand, then release the crowd.
            </>
          ) : (
            <>
              One drunk is a zigzag, {signed(drunk[t])} after {t} steps, and tells you nothing about "typical". A thousand drunks will. Release them.
            </>
          )
        ) : memory ? (
          <>
            With memory a step copies the last one {pct0(MEMORY_P)} of the time, so he strides. The crowd's spread² ÷ steps is {t > 0 ? f2(ms / t) : "—"}, not 1 — about{" "}
            {f2(KEY.memory.ratio_formula)} in the long run. The bracket still says √steps and the crowd has outrun it.
            That is what "no memory beyond now" was buying you: the √ law.
          </>
        ) : t < 100 ? (
          <>
            The bars above the street are a head-count. By step 30 they are a bell. The bracket marks ±√steps; the crowd's measured typical distance is {t > 0 ? f1(rms) : "—"}{" "}
            against √{t} = {f1(sd)}.
          </>
        ) : (
          <>
            At 100 steps the typical distance is 10, at 400 it is 20 — four times the steps, twice the distance. The bars say {t > 0 ? pct0(within) : "—"} of the crowd is
            within ±{Math.round(sd)} right now; the exact figure at 100 steps is {f2(walkWithin(100, 10))}. Not 0.68 — the walk is on whole numbers, not a smooth bell yet. Now
            give him memory.
          </>
        )
      }
    >
      <svg className={"b1-street " + (narrow ? "narrow" : "")} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={released ? `count bars for ${WALKERS} walkers after ${t} steps, the drunk at ${drunk[t]}` : `the drunk at ${drunk[t]} after ${t} steps`}>
        {/* bars */}
        {bars &&
          bars.map((c, k) => {
            const x = k - N;
            if (c === 0 || Math.abs(x) > X_MAX) return null;
            const h = (c / maxBar) * BAR_H;
            return <rect key={k} className="b1-countbar" x={xpx(x) - bw / 2} y={BAR_BASE - h} width={bw} height={h} />;
          })}
        {/* bracket at ±√t */}
        {released && t > 0 && (
          <g className="b1-bracket">
            <path d={`M${xpx(-sd)} ${BAR_BASE + 6} v6 H${xpx(sd)} v-6`} />
            <text x={W / 2} y={BAR_BASE + 24} textAnchor="middle">
              typical distance √{t} = {f1(sd)}
            </text>
          </g>
        )}
        {/* street */}
        <line className="b1-road" x1={14} x2={W - 14} y1={STREET_Y} y2={STREET_Y} />
        {(narrow ? [-80, -40, 0, 40, 80] : [-80, -60, -40, -20, 0, 20, 40, 60, 80]).map((x) => (
          <g key={x} className="b1-ticks">
            <line x1={xpx(x)} x2={xpx(x)} y1={STREET_Y - 3} y2={STREET_Y + 3} />
            <text x={xpx(x)} y={STREET_Y + 16} textAnchor="middle">
              {x === 0 ? "lamppost" : signed(x)}
            </text>
          </g>
        ))}
        {/* lamppost */}
        <g className="b1-lamp">
          <line x1={W / 2} x2={W / 2} y1={STREET_Y} y2={BAR_BASE + 10} />
          <circle cx={W / 2} cy={BAR_BASE + 8} r={3.5} />
        </g>
        {/* the one drunk: his trail of the last steps and the ball */}
        {t > 0 && <path className="b1-trailwalk" d={drunk.slice(Math.max(0, t - 12), t + 1).map((x, k, arr) => `${k ? "L" : "M"}${xpx(x)} ${STREET_Y - 6 - (arr.length - 1 - k) * 3}`).join(" ")} />}
        <circle className="b1-ball" cx={xpx(drunk[t])} cy={STREET_Y - 7} r={6} />
        <text className="b1-balllabel" x={xpx(drunk[t]) + (drunk[t] >= 0 ? 10 : -10)} y={STREET_Y - 4} textAnchor={drunk[t] >= 0 ? "start" : "end"}>
          {signed(drunk[t])}
        </text>
        {released && (
          <text className="b1-count" x={16} y={16}>
            {WALKERS.toLocaleString("en-US")} walkers · step {t}
          </text>
        )}
      </svg>
    </Figure>
  );
}

function signed(x: number): string {
  return x > 0 ? `+${x}` : x < 0 ? `−${-x}` : "0";
}
