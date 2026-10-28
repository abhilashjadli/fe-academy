import { useMemo, useState } from "react";
import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Curve, HLine, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Readouts, Toggle } from "../../../ui/controls";
import { Who } from "../../../ui/Comic";
import { ols, ols2, randomWalk, vif } from "../../../engine/regression";
import { normalSample, rng } from "../../../engine/random";

const N = 200;
const n2 = fmt.n(2);

interface Cloud {
  x: number[];
  x2: number[] | null;
  y: number[];
}

/** One cloud with the chosen liars switched on. Truth: y = 1 + 1·x + leftovers (or two strangers when wandering). */
function makeCloud(seed: number, fan: boolean, runs: boolean, twins: boolean, wander: boolean): Cloud {
  const r = rng(seed);
  // x: iid normally; a slow-moving (AR(1), φ = 0.9) input when the leftovers echo, so the echo matters; a random walk when wandering
  let x: number[];
  if (wander) x = randomWalk(N - 1, r, false);
  else if (runs) {
    x = [];
    let p = 0;
    for (let i = 0; i < N; i++) {
      p = 0.9 * p + Math.sqrt(1 - 0.81) * normalSample(r);
      x.push(2 * p);
    }
  } else x = Array.from({ length: N }, () => 2 * normalSample(r));
  const e: number[] = [];
  let prev = 0;
  for (let i = 0; i < N; i++) {
    let z = normalSample(r);
    if (runs) {
      z = 0.9 * prev + Math.sqrt(1 - 0.81) * z;
      prev = z;
    }
    e.push(z);
  }
  // fan: the leftovers' spread grows with distance from the centre of the cloud
  const xc = x.reduce((a, b) => a + b, 0) / N;
  const xs = Math.sqrt(x.reduce((a, b) => a + (b - xc) ** 2, 0) / N) || 1;
  const sd = (i: number) => (fan ? 0.3 + 1.6 * (Math.abs(x[i] - xc) / xs) : 1.2);
  const x2 = twins ? x.map((v) => v + 0.15 * normalSample(r)) : null;
  const base = wander ? randomWalk(N - 1, r, false) : x.map((v) => 1 + v);
  const y = base.map((b, i) => b + sd(i) * e[i]);
  return { x, x2, y };
}

/** Figure 5 — break it: the detective's card. Four liars, one lie. */
export function F5Card() {
  const [fan, setFan] = useState(false);
  const [runs, setRuns] = useState(false);
  const [twins, setTwins] = useState(false);
  const [wander, setWander] = useState(false);
  const [seed, setSeed] = useState(5);

  const cloud = useMemo(() => makeCloud(seed, fan, runs, twins, wander), [seed, fan, runs, twins, wander]);
  const fit = useMemo(() => ols(cloud.x, cloud.y), [cloud]);
  const pair = useMemo(() => (cloud.x2 ? { two: ols2(cloud.x, cloud.x2, cloud.y), vif: vif(cloud.x, cloud.x2) } : null), [cloud]);

  const pts: Pt[] = cloud.x.map((v, i) => [v, cloud.y[i]]);
  const xMin = Math.min(...cloud.x),
    xMax = Math.max(...cloud.x);
  const yMin = Math.min(...cloud.y),
    yMax = Math.max(...cloud.y);
  const xPad = (xMax - xMin) * 0.05,
    yPad = (yMax - yMin) * 0.08;
  const eMax = Math.max(...fit.resid.map(Math.abs)) * 1.1;
  const residT: Pt[] = fit.resid.map((e, i) => [i, e]);
  const suspect = fit.r2 > fit.dw;

  const questions = [
    { on: fan, who: "Funnel", ask: "Do the leftovers fan out?", fix: "Use White's standard error; the slope is fine." },
    { on: runs, who: "Echo", ask: "Do the leftovers remember yesterday?", fix: "Use Newey–West — or regress on changes, not levels." },
    { on: twins, who: "Twins", ask: "Are two inputs the same thing?", fix: "Drop one or add them together; VIF above 5 is the tell." },
    { on: wander, who: "Drunks", ask: "Do both series wander?", fix: "Difference first; R² above Durbin–Watson is the tell." },
  ];

  return (
    <Figure
      n="5"
      prompt={<>Switch any liar on and read the card. Every number comes from the same two hundred points; only the leftovers change character.</>}
      controls={
        <>
          <span className="toggle-row">
            <Toggle label="fan" on={fan} onChange={setFan} />
            <Toggle label="runs" on={runs} onChange={setRuns} />
            <Toggle label="twins" on={twins} onChange={setTwins} />
            <Toggle label="wander" on={wander} onChange={setWander} />
          </span>
          <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>
            new cloud
          </button>
          <Readouts
            items={[
              ["slope", n2(fit.slope)],
              ["R²", n2(fit.r2)],
              ["naive SE", n2(fit.se)],
              ["White SE", n2(fit.seHC)],
              ["Newey–West SE", n2(fit.seHAC)],
              ["Durbin–Watson", <span key="dw" className={suspect ? "tok-error" : undefined}>{n2(fit.dw)}</span>],
              ...(pair ? ([["VIF", n2(pair.vif)]] as Array<[string, string]>) : []),
            ]}
          />
        </>
      }
      observe={<>Four liars, one lie: the textbook "how sure" assumed leftovers that look like nothing. Switch each on and watch which standard error moves — and which readout on the card would have warned you.</>}
    >
      <div className="two a3-split">
        <div>
          <Plot xDomain={[xMin - xPad, xMax + xPad]} yDomain={[yMin - yPad, yMax + yPad]} width={520} height={300} xLabel="x" yLabel="y" xTicks={6} yTicks={5} ariaLabel="A cloud of two hundred points with the fitted line">
            <Points pts={pts} role="ink" r={2.4} opacity={0.55} />
            <Curve pts={[[xMin - xPad, fit.intercept + fit.slope * (xMin - xPad)], [xMax + xPad, fit.intercept + fit.slope * (xMax + xPad)]]} role="truth" width={2.2} smooth={false} />
          </Plot>
          <Plot xDomain={[0, N - 1]} yDomain={[-eMax, eMax]} width={520} height={150} xLabel="point, in order" yLabel="leftover" xTicks={5} yTicks={3} ariaLabel="Residuals in order">
            <HLine at={0} />
            <Curve pts={residT} role={fan || runs || wander ? "error" : "approx"} width={1.2} smooth={false} />
          </Plot>
          {pair && (
            <div className="a3-caption">
              Two inputs, one of them a copy: coefficients <span className="tok-truth">{n2(pair.two.coef[1])}</span> on x and{" "}
              <span className="tok-error">{n2(pair.two.coef[2])}</span> on its twin, with standard errors {n2(pair.two.se[1])} and {n2(pair.two.se[2])}. They
              add to about {n2(pair.two.coef[1] + pair.two.coef[2])}; each alone means nothing.
            </div>
          )}
        </div>
        <div className="a3-card">
          <h4>The detective's card</h4>
          {questions.map((q) => (
            <div key={q.who} className={"a3-q " + (q.on ? "on" : "")}>
              <span className="dot" aria-hidden="true" />
              <span className="ask">
                {q.ask} <Who name={q.who} mood={q.on ? "smug" : "neutral"} />
              </span>
              <span className="fix">{q.fix}</span>
            </div>
          ))}
        </div>
      </div>
    </Figure>
  );
}
