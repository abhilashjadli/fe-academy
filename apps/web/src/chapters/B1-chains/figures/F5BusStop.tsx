import "./figures.css";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Figure } from "../../../ui/Figure";
import { Comic, Panel, Says, Avatar } from "../../../ui/Comic";
import { Readouts } from "../../../ui/controls";
import { countsPerWindow, lotteryArrivals, poissonArrivals, poissonPmfTable, waitFrom } from "../../../engine/markov";
import { rng } from "../../../engine/random";
import { KEY, f1, f3, f4, useNarrow } from "./rain";

/**
 * Figure 5 — the bus stop. Sign: buses every 10 minutes (on average). The reader drags 12 buses onto a two-hour line, then
 * lets chance place them: a lottery ticket each second at 1 in 600, a glow per hit. The character drops onto the line at a
 * random moment, 1,000 times. Chance clumps at the same rate as even spacing; the average wait reads 10 minutes, not 5.
 */

const WHO = "You";
const LAM = KEY.poisson.lam; // 6 per hour
const T_HOURS = 2;
const T_MIN = 60 * T_HOURS;
const BUSES = 12;
const DROPS = 1000;
const H = 176,
  Y_YOURS = 50,
  Y_CHANCE = 138,
  X0 = 24;


interface Drops {
  waits: number[]; // minutes
  hourly: number[]; // buses per hour over all drop timelines' first two hours
  last: { times: number[]; at: number; wait: number } | null;
}

export function F5BusStop() {
  const [yours, setYours] = useState<number[]>([]); // minutes
  const [chance, setChance] = useState<number[] | null>(null); // minutes
  const [sweep, setSweep] = useState<number>(-1); // the lottery cursor in minutes, −1 = idle
  const [drops, setDrops] = useState<Drops>({ waits: [], hourly: new Array(13).fill(0), last: null });
  const [dropping, setDropping] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const narrow = useNarrow();
  const W = narrow ? 380 : 600;
  const X1 = W - 16;
  const xOf = (min: number) => X0 + (min / T_MIN) * (X1 - X0);
  const minOf = (x: number) => ((x - X0) / (X1 - X0)) * T_MIN;
  const dragging = useRef<number | null>(null);
  const raf = useRef(0);
  const dropRng = useRef(rng(600));

  // the lottery: a ticket each second, 1 in 600 — the engine's discrete arrivals, swept across the line
  const runChance = () => {
    const times = lotteryArrivals(LAM, T_HOURS, 1 / 3600, rng(11 + (chance ? chance.length : 0))).map((h) => h * 60);
    setChance(times);
    setDrops({ waits: [], hourly: new Array(13).fill(0), last: null });
    setSweep(0);
  };
  useEffect(() => {
    if (sweep < 0 || sweep >= T_MIN) return;
    const tick = () => setSweep((s) => (s >= T_MIN ? T_MIN : s + 1.2));
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [sweep]);
  const sweepDone = chance !== null && sweep >= T_MIN;

  // 1,000 drops: each onto a fresh two-hour timeline of chance buses (the key's own procedure), at a random moment in the first hour
  useEffect(() => {
    if (!dropping) return;
    const r = dropRng.current;
    const batch = () => {
      setDrops((d) => {
        if (d.waits.length >= DROPS) {
          setDropping(false);
          return d;
        }
        const waits = d.waits.slice();
        const hourly = d.hourly.slice();
        let last = d.last;
        for (let k = 0; k < 20 && waits.length < DROPS; k++) {
          const times = poissonArrivals(LAM, T_HOURS + 1, r); // an extra hour so the next bus always exists
          const at = r(); // hours, in the first hour
          const w = waitFrom(times, at);
          waits.push(w * 60);
          for (const c of countsPerWindow(times, T_HOURS)) hourly[Math.min(c, 12)]++;
          last = { times: times.filter((x) => x < T_HOURS).map((x) => x * 60), at: at * 60, wait: w * 60 };
        }
        return { waits, hourly, last };
      });
      raf.current = requestAnimationFrame(batch);
    };
    raf.current = requestAnimationFrame(batch);
    return () => cancelAnimationFrame(raf.current);
  }, [dropping]);

  // the reader's timetable, dropped on at 1,000 uniform moments (the line repeats, so the first bus follows the last)
  const yourWait = useMemo(() => {
    if (yours.length === 0) return NaN;
    const sorted = yours.slice().sort((a, b) => a - b);
    const ext = sorted.concat(sorted.map((m) => m + T_MIN));
    const r = rng(5);
    let s = 0;
    for (let k = 0; k < DROPS; k++) s += waitFrom(ext, r() * T_MIN);
    return s / DROPS;
  }, [yours]);
  const meanWait = drops.waits.length ? drops.waits.reduce((s, w) => s + w, 0) / drops.waits.length : NaN;
  const pmf = useMemo(() => poissonPmfTable(LAM, 12), []);
  const hoursSeen = drops.hourly.reduce((s, c) => s + c, 0);

  // pointer: click the top lane to place a bus, drag one to move it
  const toMin = (e: PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    return { m: Math.max(0, Math.min(T_MIN, minOf(px))), lane: py < (Y_YOURS + Y_CHANCE) / 2 ? "yours" : "chance" };
  };
  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    const { m, lane } = toMin(e);
    if (lane !== "yours") return;
    const near = yours.findIndex((b) => Math.abs(xOf(b) - xOf(m)) < 9);
    if (near >= 0) dragging.current = near;
    else if (yours.length < BUSES) {
      setYours((b) => b.concat(m));
      dragging.current = yours.length;
    } else return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current === null) return;
    const { m } = toMin(e);
    const i = dragging.current;
    setYours((b) => b.map((v, k) => (k === i ? m : v)));
  };
  const onUp = () => (dragging.current = null);

  const laneBuses = drops.last ? drops.last.times : chance ? chance.filter((m) => m <= sweep) : [];
  const visibleChance = laneBuses;
  const spacing = yours.length > 1 ? (() => {
      const s = yours.slice().sort((a, b) => a - b);
      const gaps = s.slice(1).map((v, i) => v - s[i]);
      return { min: Math.min(...gaps), max: Math.max(...gaps) };
    })() : null;

  return (
    <Figure
      n="5"
      prompt={
        <>
          The sign at the stop says <strong>buses every 10 minutes (on average)</strong>. Place twelve buses on the two-hour line the way you would expect them — tap to
          drop one, drag to move it. Then let chance place them at the same rate, and drop yourself onto the line.
        </>
      }
      controls={
        <>
          <span className="ctl">
            <span className="seg" role="group" aria-label="the bus stop">
              <button type="button" disabled={sweep >= 0 && !sweepDone} onClick={runChance}>
                {chance ? "chance again" : "let chance place them"}
              </button>
              <button type="button" disabled={!sweepDone || dropping || drops.waits.length >= DROPS} onClick={() => setDropping(true)}>
                drop me {DROPS.toLocaleString("en-US")} times
              </button>
              <button type="button" disabled={yours.length === 0} onClick={() => setYours([])}>
                clear my buses
              </button>
            </span>
          </span>
          <Readouts
            items={[
              ["your timetable: mean wait", Number.isFinite(yourWait) ? f1(yourWait) + " min" : "—"],
              ["chance: mean wait", drops.waits.length ? `${f1(meanWait)} min over ${drops.waits.length.toLocaleString("en-US")} drops` : "—"],
              ["chance: buses in these two hours", chance && sweepDone ? String(laneBuses.length) : "—"],
            ]}
          />
        </>
      }
      observe={
        drops.waits.length >= DROPS ? (
          <>
            <strong>{f1(meanWait)} minutes, not 5</strong> (exactly {f1(KEY.poisson.mean_wait_min)} in the long run). A random moment lands in a long gap more often than a short
            one, and the next bus does not know how long you have waited: the chance of none in the next ten minutes is always {f3(KEY.poisson.p_none_10min)}. Small print:
            timetabled buses give {f1(KEY.poisson.timetabled_wait_min)} — yours read {Number.isFinite(yourWait) ? f1(yourWait) : "—"} — and real buses, half-timetabled, sit between.
          </>
        ) : sweepDone ? (
          <>
            Same rate as your timetable, different shape: {chance!.length} buses in two hours, in clumps and gaps. "Every ten minutes on average" never promised even
            spacing — it promised a lottery ticket a second at 1 in 600. Now drop yourself onto the line at a random moment, a thousand times.
          </>
        ) : chance ? (
          <>A ticket every second, 1 in 600. Each glow is a win; between wins, nothing — however long it has been.</>
        ) : (
          <>
            {yours.length === 0
              ? "Most people space them evenly. Place yours; the readout drops you onto your own line a thousand times and averages the wait."
              : yours.length < BUSES
                ? `${yours.length} of ${BUSES} placed${spacing ? ` · gaps from ${f1(spacing.min)} to ${f1(spacing.max)} min` : ""}.`
                : `All ${BUSES} placed · gaps from ${f1(spacing!.min)} to ${f1(spacing!.max)} min · your mean wait reads ${f1(yourWait)}. Now let chance try.`}
          </>
        )
      }
    >
      <div className="b1-bus">
        <svg
          ref={svgRef}
          className="b1-line"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="two-hour timeline with your buses on the top lane and chance's on the bottom lane"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          {[Y_YOURS, Y_CHANCE].map((y, k) => (
            <g key={k} className="b1-lane">
              <line x1={X0} x2={X1} y1={y} y2={y} />
              {[0, 30, 60, 90, 120].map((m) => (
                <g key={m}>
                  <line x1={xOf(m)} x2={xOf(m)} y1={y - 4} y2={y + 4} />
                  <text x={xOf(m)} y={y + 17} textAnchor="middle">
                    {m === 0 ? "0" : m === 60 ? "1 h" : m === 120 ? "2 h" : narrow ? `${m}′` : `${m} min`}
                  </text>
                </g>
              ))}
            </g>
          ))}
          <text className="b1-lanelabel" x={X0} y={Y_YOURS - 32}>
            your timetable · {yours.length} of {BUSES}
            {yours.length < BUSES ? " · tap the line to add one" : ""}
          </text>
          <text className="b1-lanelabel" x={X0} y={Y_CHANCE - 40}>
            chance, same rate ·{" "}
            {drops.last ? (narrow ? `fresh two hours per drop · ${laneBuses.length} buses` : `a fresh two hours for every drop · ${laneBuses.length} buses in this one`) : chance ? `${laneBuses.length} bus${laneBuses.length === 1 ? "" : "es"}` : "press \"let chance place them\""}
          </text>
          {yours.map((m, i) => (
            <Bus key={i} x={xOf(m)} y={Y_YOURS} kind="yours" />
          ))}
          {visibleChance.map((m, i) => (
            <Bus key={i} x={xOf(m)} y={Y_CHANCE} kind="chance" fresh={!drops.last && sweep - m < 8} />
          ))}
          {chance && !sweepDone && (
            <g className="b1-sweep">
              <line x1={xOf(sweep)} x2={xOf(sweep)} y1={Y_CHANCE - 18} y2={Y_CHANCE + 6} />
              <text x={xOf(sweep)} y={Y_CHANCE - 21} textAnchor={sweep > 90 ? "end" : "start"}>
                ticket {Math.round(sweep * 60).toLocaleString("en-US")} · 1 in 600
              </text>
            </g>
          )}
          {drops.last && (
            <g className="b1-drop">
              <path d={`M${xOf(drops.last.at)} ${Y_CHANCE - 14} v-5 H${xOf(drops.last.at + drops.last.wait)} v5`} />
              <text x={xOf(drops.last.at + drops.last.wait / 2)} y={Y_CHANCE - 22} textAnchor="middle">
                waited {f1(drops.last.wait)} min
              </text>
              <foreignObject x={xOf(drops.last.at) - 12} y={Y_CHANCE - 13} width={24} height={24}>
                <Avatar name={WHO} mood="neutral" size={24} title="you, dropped at a random moment" />
              </foreignObject>
            </g>
          )}
        </svg>
        <Comic cols={2}>
          <Panel n={1} caption={<>The sign, and the first thought everyone has.</>}>
            <div className="b1-stop">
              <div className="b1-sign" role="img" aria-label="bus stop sign: buses every 10 minutes (on average)">
                <span className="b1-sign-k">BUS</span>
                <span className="b1-sign-v">every 10 min</span>
                <span className="b1-sign-s">(on average)</span>
              </div>
              <Says who={WHO} mood={drops.waits.length >= DROPS ? "surprised" : "thinking"}>
                {drops.waits.length >= DROPS ? <>Ten minutes? But the sign said ten minutes <em>between</em> buses.</> : <>Random arrival, ten-minute gaps — about five minutes' wait, then.</>}
              </Says>
            </div>
          </Panel>
          <Panel n={2} caption={<>Buses per hour, counted over the drop timelines, against the Poisson bars at rate 6: {f4(pmf[5])} at 5 and 6, {f4(pmf[0])} at none.</>}>
            <svg viewBox="0 0 200 126" className="b1-pois" role="img" aria-label="histogram of buses per hour against the Poisson probabilities">
              {pmf.map((p, k) => {
                const x = 14 + k * 14;
                const h = p * 420;
                const meas = hoursSeen ? drops.hourly[k] / hoursSeen : 0;
                return (
                  <g key={k}>
                    <rect className="b1-poisbar" x={x - 5} y={100 - h} width={10} height={h} />
                    {hoursSeen > 0 && <rect className="b1-measbar" x={x - 3} y={100 - meas * 420} width={6} height={meas * 420} />}
                    <text className="b1-poislabel" x={x} y={111} textAnchor="middle">
                      {k}
                    </text>
                  </g>
                );
              })}
              <text className="b1-poislabel b1-poisnote" x={190} y={14} textAnchor="end">
                {hoursSeen ? `${hoursSeen.toLocaleString("en-US")} hours counted` : "pale bars: Poisson, rate 6"}
              </text>
              <text className="b1-poislabel" x={100} y={121} textAnchor="middle">
                buses per hour
              </text>
            </svg>
          </Panel>
        </Comic>
      </div>
    </Figure>
  );
}

function Bus({ x, y, kind, fresh }: { x: number; y: number; kind: "yours" | "chance"; fresh?: boolean }) {
  return (
    <g className={"b1-busicon " + kind + (fresh ? " fresh" : "")} transform={`translate(${x} ${y})`}>
      {fresh && <circle className="b1-glow" r={10} cy={-7} />}
      <rect x={-5} y={-12} width={10} height={9} rx={1.5} />
      <rect x={-3.5} y={-10.5} width={7} height={3} className="b1-win" />
      <circle cx={-2.5} cy={-2.5} r={1.4} className="b1-wheel" />
      <circle cx={2.5} cy={-2.5} r={1.4} className="b1-wheel" />
    </g>
  );
}
