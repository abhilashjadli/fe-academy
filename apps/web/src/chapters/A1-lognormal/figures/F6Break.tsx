import { useMemo, useState } from "react";
import { moments, npdf } from "../../../engine/distributions";
import { rng, tSample } from "../../../engine/random";
import { Figure } from "../../../ui/Figure";
import { Bars, Curve, Plot, fmt } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";
import { histogram } from "../sim";

const NS = [1, 10, 100];
const TRIALS = 3000;

/** When adding stops making a bell: sums of a heavy-tailed step never standardise. */
export function F6Break() {
  const [nu, setNu] = useState(1.5);
  const [seed, setSeed] = useState(1);
  const run = (nuv: number) =>
    NS.map((n) => {
      const r = rng(seed * 31 + Math.round(nuv * 100));
      const sums = new Float64Array(TRIALS);
      for (let t = 0; t < TRIALS; t++) {
        let s = 0;
        for (let i = 0; i < n; i++) s += tSample(nuv, r);
        sums[t] = s;
      }
      const m = moments(sums);
      const z = Array.from(sums, (v) => (v - m.mean) / m.sd);
      return { n, bins: histogram(z, -5, 5, 50), kurt: m.kurtosis };
    });
  const heavy = useMemo(() => run(nu), [nu, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const light = useMemo(() => run(5), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  // running sd of a single long sum, in units of sqrt(n)
  const running = useMemo(() => {
    const r = rng(seed * 7 + 3);
    const out: Array<[number, number]> = [];
    const outL: Array<[number, number]> = [];
    const r2 = rng(seed * 7 + 4);
    let sH = 0,
      sL = 0;
    const N = 400;
    for (let n = 1; n <= N; n++) {
      const a = tSample(nu, r),
        b = tSample(5, r2);
      sH += a * a;
      sL += b * b;
      out.push([n, Math.sqrt(sH / n)]);
      outL.push([n, Math.sqrt(sL / n)]);
    }
    return { heavy: out, light: outL };
  }, [nu, seed]);
  const bell = useMemo(() => Array.from({ length: 101 }, (_, i) => [-5 + (10 * i) / 100, npdf(-5 + (10 * i) / 100)] as [number, number]), []);

  const row = (set: ReturnType<typeof run>, label: string, role: "error" | "truth") => (
    <div className="two" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
      {set.map((s) => (
        <div key={s.n}>
          <Plot xDomain={[-5, 5]} yDomain={[0, 0.8]} width={300} height={170} xTicks={5} yTicks={2} xLabel={`n = ${s.n}`} margin={{ top: 8, right: 8, bottom: 28, left: 30 }} ariaLabel={`${label}: standardised sum of ${s.n}`}>
            <Bars bars={s.bins.map((b) => ({ x: b.x, y: b.density, w: b.w }))} role={role} opacity={0.75} gap={0} />
            <Curve pts={bell} role="ghost" dash="4 3" />
          </Plot>
          <div className="readouts" style={{ padding: "0 0.4rem", fontSize: "0.76rem" }}>
            <span>
              <span className="k">kurtosis </span>
              <span className="v">{fmt.n(1)(s.kurt)}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Figure
      n="6"
      prompt={<>Break it: add up steps from a very fat-tailed distribution. Do the standardised sums ever settle onto the bell?</>}
      controls={
        <>
          <Slider label="heavy step's ν" value={nu} min={1.1} max={3} step={0.1} onChange={setNu} role="error" fmt={(v) => v.toFixed(1)} />
          <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
            New sample
          </button>
        </>
      }
      observe={
        <>
          Top row: steps from a t with ν = {nu.toFixed(1)} — a tail so fat that for ν ≤ 2 the variance is infinite. Dividing by the sample sd always produces{" "}
          <em>something</em> standardised, but the shape never settles onto the bell: a spike in the middle, a few points far out, and a kurtosis that
          grows with n instead of falling to 3. Bottom row: ν = 5, a fat but finite tail, which behaves like the dice in chapter 0.2. The running sd below tells the same story — for the heavy step it keeps jumping as new extreme values arrive, however many terms you add. The central limit
          theorem has one real precondition, a finite variance, and a fat-enough tail denies it. Markets sit somewhere between these two rows, which is why
          the bell is a useful first draft and a dangerous final answer.
        </>
      }
    >
      {row(heavy, "heavy tail", "error")}
      {row(light, "finite tail", "truth")}
      <Plot xDomain={[1, 400]} yDomain={[0, Math.max(3, ...running.heavy.map((p) => p[1]))]} xLabel="terms added" yLabel="running sd of the step" height={170} xTicks={5} yTicks={3} ariaLabel="Running standard deviation for heavy and light tails">
        <Curve pts={running.light} role="truth" smooth={false} />
        <Curve pts={running.heavy} role="error" smooth={false} />
      </Plot>
    </Figure>
  );
}
