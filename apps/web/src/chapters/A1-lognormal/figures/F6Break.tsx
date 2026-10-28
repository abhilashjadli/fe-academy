import { useMemo, useRef, useState } from "react";
import { rng, tSample } from "../../../engine/random";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, fmt } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";

const MONSTER = 6; // a step this many times the usual size is a "monster"
const MAX = 400;

/** When adding stops making a bell: add one fat-tailed step at a time and watch the running sd refuse to settle. */
export function F6Break() {
  const [nu, setNu] = useState(1.5);
  const gen = useRef(rng(11 + 150));
  const [steps, setSteps] = useState<number[]>(() => [tSample(1.5, gen.current)]);
  const [flash, setFlash] = useState(0);
  // a reference step with a finite spread (ν = 5), same count, so the reader sees what "settling" looks like
  const light = useMemo(() => {
    const r = rng(12);
    const out: number[] = [];
    for (let i = 0; i < MAX; i++) out.push(tSample(5, r));
    return out;
  }, []);

  const reset = (nuv: number) => {
    setNu(nuv);
    gen.current = rng(11 + Math.round(nuv * 100));
    setSteps([tSample(nuv, gen.current)]);
  };
  const add = (count: number) => {
    if (steps.length >= MAX) return;
    const next = steps.slice();
    let monster = false;
    for (let i = 0; i < count && next.length < MAX; i++) {
      const s = tSample(nu, gen.current);
      if (Math.abs(s) > MONSTER) monster = true;
      next.push(s);
    }
    setSteps(next);
    if (monster) setFlash((f) => f + 1);
  };

  const running = useMemo(() => {
    const out: Array<[number, number]> = [];
    let s = 0;
    for (let i = 0; i < steps.length; i++) {
      s += steps[i] * steps[i];
      out.push([i + 1, Math.sqrt(s / (i + 1))]);
    }
    return out;
  }, [steps]);
  const runningLight = useMemo(() => {
    const out: Array<[number, number]> = [];
    let s = 0;
    for (let i = 0; i < Math.max(steps.length, 1); i++) {
      s += light[i] * light[i];
      out.push([i + 1, Math.sqrt(s / (i + 1))]);
    }
    return out;
  }, [steps.length, light]);
  const monsters = steps.map((s, i) => ({ i, s })).filter((m) => Math.abs(m.s) > MONSTER);
  const n = steps.length;
  const last = steps[n - 1] ?? 0;
  const sdNow = running[n - 1]?.[1] ?? 0;
  const ymax = Math.max(3, ...running.map((p) => p[1])) * 1.1;
  const xmax = Math.max(20, Math.ceil(n / 20) * 20);

  return (
    <Figure
      n="6"
      prompt={<>Break it. Add steps from a very fat-tailed coin, one at a time. Does the running spread ever settle?</>}
      controls={
        <>
          <button type="button" className="btn primary" onClick={() => add(1)} disabled={n >= MAX}>
            add one more step
          </button>
          <button type="button" className="btn" onClick={() => add(25)} disabled={n >= MAX}>
            add 25
          </button>
          <Slider label="step's tail knob ν" value={nu} min={1.1} max={3} step={0.1} onChange={reset} role="error" fmt={(v) => v.toFixed(1)} />
          <span className="readouts">
            <span>
              <span className="k">steps </span>
              <span className="v">{n}</span>
            </span>
            <span>
              <span className="k">last step </span>
              <span className={"v " + (Math.abs(last) > MONSTER ? "a1-jump" : "")} key={flash + ":" + n}>
                {last >= 0 ? "+" : ""}
                {fmt.n(1)(last)}
              </span>
            </span>
            <span>
              <span className="k">running spread (sd) </span>
              <span className={"v tok-error " + (Math.abs(last) > MONSTER ? "a1-jump" : "")} key={"sd" + flash + ":" + n}>
                {fmt.n(2)(sdNow)}
              </span>
            </span>
            <span>
              <span className="k">monsters so far </span>
              <span className="v">{monsters.length}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          <p style={{ margin: 0 }}>
            Keep clicking. The blue line (a tamer step, ν = 5) settles. The rose line does not: every so often a monster lands and the spread jumps,
            however many steps you have added. The bell needs a finite spread to build on, and a tail this fat never gives it one.
          </p>
          <details className="a1-more">
            <summary>more</summary>
            <p>
              For ν at or below 2 the step's spread is infinite: the "running sd" you compute is always some number, but it never converges, because the
              next monster is always bigger than everything before it. Adding such steps never makes a bell — the central limit theorem's one real
              precondition has failed. Real markets sit between the two lines, which is why the bell is a useful first draft and a dangerous final answer.
            </p>
          </details>
        </>
      }
    >
      <Plot xDomain={[1, xmax]} yDomain={[0, ymax]} xLabel="steps added" yLabel="running spread of the step (sd)" height={280} xTicks={5} yTicks={4} ariaLabel="Running standard deviation as steps are added">
        <Curve pts={runningLight} role="truth" smooth={false} />
        <Curve pts={running} role="error" smooth={false} width={2} />
        {monsters.map((m) => (
          <Marker key={m.i} at={[m.i + 1, running[m.i][1]]} role="error" r={4} />
        ))}
        {n > 0 && <Marker at={[n, sdNow]} role="error" r={5} />}
        <Label at={[xmax, runningLight[runningLight.length - 1]?.[1] ?? 1]} text="ν = 5, settles" role="truth" anchor="end" dx={-4} />
        {monsters.length > 0 && <Label at={[monsters[0].i + 1, running[monsters[0].i][1]]} text="a monster" role="error" dy={-10} />}
      </Plot>
    </Figure>
  );
}
