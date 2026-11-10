import { useEffect, useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { acf } from "../../../engine/volatility";
import { CLUSTER, DATES, N, NAMED_STORMS, R, SQ, STORMS, movePct, n0, niceDate, s3 } from "./a5";
import { setClock, useClock } from "./clock";
import { TwoPictures } from "./pictures";
import "./figures.css";

/**
 * Figure 1 — two pictures, one clock. The real daily moves above their squares, one scrubber across ten years, one hand
 * through both. One button, "listen": a click per day, as loud as its square, from where the hand stands — the chapter's
 * one sonification beat. Readouts: date, move, square (drawn under the hand). The tile in words is computed from the
 * same days: how often a big square follows a big square, against chance.
 */

const DAYS_PER_SECOND = 60;
const LOUD_AT = 16; // a 4 % day (16 %²) is full volume; louder squares are capped

export function F1Clock() {
  const i = useClock();
  const [listening, setListening] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timer = useRef<number>(0);
  const posRef = useRef(i);
  posRef.current = i;

  useEffect(() => {
    if (!listening) return;
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AC) {
      setListening(false);
      return;
    }
    const ctx = ctxRef.current ?? new AC();
    ctxRef.current = ctx;
    void ctx.resume();
    let k = posRef.current >= N - 1 ? 0 : posRef.current;
    const tick = () => {
      if (k >= N) {
        setListening(false);
        return;
      }
      const gain = Math.min(1, SQ[k] / LOUD_AT);
      if (gain > 0.004) {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = R[k] < 0 ? 180 : 260; // down days a little lower
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.5 * gain), t + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + 0.04 * gain);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      }
      setClock(k);
      k++;
    };
    timer.current = window.setInterval(tick, 1000 / DAYS_PER_SECOND);
    return () => window.clearInterval(timer.current);
  }, [listening]);

  const rho2 = acf(R.map((r) => r * r), 1)[0];
  const rho1 = acf(R, 1)[0];
  return (
    <Figure
      n="1"
      prompt={
        <>
          The real strip again, now with a clock. Above: each day's move. Below, on the same clock: the same move <em>squared</em>. Drag the hand across the ten years; press
          <em> listen</em> to hear a click per day, as loud as its square.
        </>
      }
      controls={
        <>
          <Slider label="the clock" value={i} min={0} max={N - 1} step={1} onChange={setClock} fmt={(v) => DATES[Math.round(v)].slice(0, 7)} width={180} />
          <button type="button" className={"btn " + (listening ? "toggled" : "")} aria-pressed={listening} onClick={() => setListening((v) => !v)}>
            {listening ? "stop" : "listen"}
          </button>
          <Readouts
            items={[
              ["day", niceDate(DATES[i])],
              ["move", movePct(R[i], 2)],
              ["square", SQ[i].toFixed(2) + " %²"],
            ]}
          />
        </>
      }
      observe={
        <>
          The top picture is noise; the bottom one has <strong>weather</strong> — the squares come in spells, and the spells are Figure 0's storms. A big square (a move past{" "}
          {movePct(CLUSTER.thr, 1).replace(/^[+−]/, "±")}) follows a big square <strong>{(100 * CLUSTER.pBigAfterBig).toFixed(0)} %</strong> of the time against {(100 * CLUSTER.pBig).toFixed(0)} % by chance; an up day
          follows an up day {(100 * CLUSTER.pUpAfterUp).toFixed(0)} % against {(100 * CLUSTER.pUp).toFixed(0)} %. Lag-one correlation: squares {s3(rho2)}, moves {s3(rho1)}. Large changes tend to be followed by
          large changes, of either sign.
        </>
      }
    >
      <div className="a5-stage">
        <TwoPictures storms={STORMS} named={NAMED_STORMS} ariaTop={`The ${n0(N)} real daily moves of the NIFTY 50 as thin bars, with a draggable vertical hand`} ariaBottom="The same days' squares; the big ones cluster in the shaded storms" />
      </div>
    </Figure>
  );
}
