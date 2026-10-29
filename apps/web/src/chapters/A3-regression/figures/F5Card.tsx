import { useMemo, useState } from "react";
import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Curve, HLine, Label, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { Who } from "../../../ui/Comic";
import { ols, ols2, randomWalk, vif, type Fit } from "../../../engine/regression";
import { normalSample, rng } from "../../../engine/random";
import key from "../../../engine/__fixtures__/key-A3.json";
import { funnelCloud, twinsCloud } from "./F2Liars";

type Liar = "Funnel" | "Echo" | "Twins" | "Drunks";
const n2 = fmt.n(2);
const sign = (v: number) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(0);

/** The same four liars as Figure 2, each with its own cloud, its own picture and the one number it moves. */
function build() {
  // the honest cloud: y = 1 + x + leftovers that look like nothing
  const r = rng(5);
  const cx = Array.from({ length: 200 }, () => 2 * normalSample(r));
  const cy = cx.map((v) => 1 + v + 1.2 * normalSample(r));
  const clean = ols(cx, cy);

  const fn = funnelCloud();
  const funnel = ols(fn.x, fn.y);

  const echo = ols(key.echo.x, key.echo.y);

  const tw = twinsCloud();
  const twins = ols2(tw.x1, tw.x2, tw.y);

  // two coin piles of 200 days that never met: the first pair whose levels fit scores R² > 0.5 with a Durbin–Watson below it
  let drunks: { a: number[]; b: number[]; f: Fit; seed: number } | null = null;
  for (let seed = 1; seed < 500 && !drunks; seed++) {
    const rr = rng(seed);
    const a = randomWalk(200, rr),
      b = randomWalk(200, rr);
    const f = ols(a, b);
    if (f.r2 > 0.5 && f.dw < 0.3) drunks = { a, b, f, seed };
  }
  if (!drunks) {
    const rr = rng(1);
    const a = randomWalk(200, rr),
      b = randomWalk(200, rr);
    drunks = { a, b, f: ols(a, b), seed: 1 };
  }
  return { clean: { x: cx, y: cy, f: clean }, funnel: { ...fn, f: funnel }, echo, twins: { ...tw, f: twins, vif: vif(tw.x1, tw.x2) }, drunks };
}

/** Figure 5 — break it: the detective's card is the figure. Light one row; see its picture and the one number it moves. */
export function F5Card() {
  const [lit, setLit] = useState<Liar | null>(null);
  const d = useMemo(build, []);

  const rows: Array<{ who: Liar; ask: string; fix: string; numbers: Array<[string, string]> }> = [
    {
      who: "Funnel",
      ask: "Do the leftovers fan out?",
      fix: "Use White's standard error; the slope is fine.",
      numbers: [
        ["naive ±", n2(2 * d.funnel.f.se)],
        ["White ±", n2(2 * d.funnel.f.seHC)],
      ],
    },
    {
      who: "Echo",
      ask: "Do the leftovers remember yesterday?",
      fix: "Use Newey–West — or regress on changes, not levels.",
      numbers: [
        ["naive ±", n2(2 * d.echo.se)],
        ["Newey–West ±", n2(2 * d.echo.seHAC)],
      ],
    },
    {
      who: "Twins",
      ask: "Are two inputs the same thing?",
      fix: "Drop one or add them together; VIF above 5 is the tell.",
      numbers: [
        ["credit to x₁", `${sign(d.twins.f.coef[1])} ± ${(2 * d.twins.f.se[1]).toFixed(0)}`],
        ["credit to x₂", `${sign(d.twins.f.coef[2])} ± ${(2 * d.twins.f.se[2]).toFixed(0)}`],
      ],
    },
    {
      who: "Drunks",
      ask: "Do both series wander?",
      fix: "Difference first; R² above Durbin–Watson is the tell.",
      numbers: [
        ["R²", n2(d.drunks.f.r2)],
        ["Durbin–Watson", n2(d.drunks.f.dw)],
      ],
    },
  ];
  const row = rows.find((q) => q.who === lit) ?? null;
  const numbers: Array<[string, string]> = row ? row.numbers : [["slope", n2(d.clean.f.slope)], ["naive ±", n2(2 * d.clean.f.se)]];

  const picture = () => {
    if (lit === "Funnel") {
      const eMax = Math.max(...d.funnel.f.resid.map(Math.abs)) * 1.05;
      return (
        <Plot xDomain={[0, 11]} yDomain={[-eMax, eMax]} width={480} height={340} xLabel="x" yLabel="leftover" xTicks={5} yTicks={5} ariaLabel="Leftovers against x, fanning out to the right">
          <HLine at={0} />
          <Points pts={d.funnel.x.map((v, i) => [v, d.funnel.f.resid[i]] as Pt)} role="error" r={2.4} opacity={0.6} />
        </Plot>
      );
    }
    if (lit === "Echo") {
      const eMax = Math.max(...d.echo.resid.map(Math.abs)) * 1.05;
      return (
        <Plot xDomain={[0, d.echo.n - 1]} yDomain={[-eMax, eMax]} width={480} height={340} xLabel="time" yLabel="leftover" xTicks={5} yTicks={5} ariaLabel="Leftovers in time order with long runs">
          <HLine at={0} />
          <Curve pts={d.echo.resid.map((e, i) => [i, e] as Pt)} role="error" width={1.5} smooth={false} />
        </Plot>
      );
    }
    if (lit === "Twins") {
      const n = d.twins.x1.length;
      const m = Math.max(...d.twins.x1.map(Math.abs), ...d.twins.x2.map(Math.abs)) * 1.1;
      return (
        <Plot xDomain={[0, n - 1]} yDomain={[-m, m]} width={480} height={340} xLabel="observation" yLabel="the two inputs" xTicks={5} yTicks={5} ariaLabel="Two input series drawn on top of each other">
          <HLine at={0} />
          <Curve pts={d.twins.x1.map((v, i) => [i, v] as Pt)} role="truth" width={2.4} smooth={false} />
          <Curve pts={d.twins.x2.map((v, i) => [i, v] as Pt)} role="approx" width={1.2} smooth={false} />
          <Label at={[0, -m]} text="x₁ and x₂, one on top of the other" role="approx" dx={8} dy={-8} />
        </Plot>
      );
    }
    if (lit === "Drunks") {
      const n = d.drunks.a.length - 1;
      const span = Math.max(8, ...d.drunks.a.map(Math.abs), ...d.drunks.b.map(Math.abs));
      return (
        <Plot xDomain={[0, n]} yDomain={[-span, span]} width={480} height={340} xLabel="day" yLabel="coins in the pile" xTicks={5} yTicks={5} ariaLabel="Two wandering series that never met">
          <Curve pts={d.drunks.a.map((v, i) => [i, v] as Pt)} role="truth" width={1.6} smooth={false} />
          <Curve pts={d.drunks.b.map((v, i) => [i, v] as Pt)} role="approx" width={1.6} smooth={false} />
          <Label at={[n, d.drunks.a[n]]} text="A" role="truth" anchor="end" dx={-4} />
          <Label at={[n, d.drunks.b[n]]} text="B" role="approx" anchor="end" dx={-4} />
        </Plot>
      );
    }
    const xMin = Math.min(...d.clean.x),
      xMax = Math.max(...d.clean.x);
    const yMin = Math.min(...d.clean.y),
      yMax = Math.max(...d.clean.y);
    return (
      <Plot xDomain={[xMin, xMax]} yDomain={[yMin, yMax]} width={480} height={340} xLabel="x" yLabel="y" xTicks={5} yTicks={5} ariaLabel="An honest cloud of two hundred points with its line">
        <Points pts={d.clean.x.map((v, i) => [v, d.clean.y[i]] as Pt)} role="ink" r={2.4} opacity={0.5} />
        <Curve pts={[[xMin, d.clean.f.intercept + d.clean.f.slope * xMin], [xMax, d.clean.f.intercept + d.clean.f.slope * xMax]]} role="truth" width={2.2} smooth={false} />
        <Label at={[xMax, yMax]} text="nobody lying — light a row" role="ghost" anchor="end" dx={-8} dy={16} />
      </Plot>
    );
  };

  return (
    <Figure
      n="5"
      prompt={<>The detective's card. Light a row: you get that liar's picture and the one number it moves. Each row is its own cloud, the same four from Figure 2.</>}
      controls={<Readouts items={[[lit ? `${lit} says` : "nobody lying", ""], ...numbers]} />}
      observe={
        <>
          Four liars, one lie: the textbook "how sure" assumed leftovers that look like nothing. Two of them move the ± (Funnel, Echo), one moves who gets the
          credit (Twins), one moves whether there is a relationship at all (Drunks). The card is the habit: ask all four before you believe the number.
        </>
      }
    >
      <div className="two a3-split">
        <div className="a3-detective">
          <h4>The detective's card</h4>
          {rows.map((q) => {
            const on = lit === q.who;
            return (
              <button key={q.who} type="button" className={"a3-q " + (on ? "on" : "")} aria-pressed={on} onClick={() => setLit(on ? null : q.who)}>
                <span className="dot" aria-hidden="true" />
                <span className="ask">
                  {q.ask} <Who name={q.who} mood={on ? "smug" : "neutral"} />
                </span>
                {on && (
                  <span className="fix">
                    {q.fix} Here: {q.numbers[0][0]} {q.numbers[0][1]}, {q.numbers[1][0]} {q.numbers[1][1]}.
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div>{picture()}</div>
      </div>
      <details className="a3-details">
        <summary>the whole card: all four fixes and every number</summary>
        <ul className="a3-list">
          {rows.map((q) => (
            <li key={q.who}>
              <strong>{q.who}</strong> — {q.ask} {q.fix} {q.numbers.map(([k, v]) => `${k} ${v}`).join("; ")}.
            </li>
          ))}
        </ul>
        <Readouts
          items={[
            ["Funnel: slope", n2(d.funnel.f.slope)],
            ["Funnel: R²", n2(d.funnel.f.r2)],
            ["Echo: slope", n2(d.echo.slope)],
            ["Echo: Durbin–Watson", n2(d.echo.dw)],
            ["Twins: R²", n2(d.twins.f.r2)],
            ["Twins: VIF", Math.round(d.twins.vif).toLocaleString("en-IN")],
            ["Drunks: |t|", n2(Math.abs(d.drunks.f.slope / d.drunks.f.se))],
            ["Drunks: pair tried", String(d.drunks.seed)],
          ]}
        />
      </details>
    </Figure>
  );
}
