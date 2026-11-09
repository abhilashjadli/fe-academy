import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { Readouts, Segmented } from "../../../ui/controls";
import { Who } from "../../../ui/Comic";
import { brownianPath, gbmMean, gbmMedian, gbmTerminal } from "../../../engine/ito";
import { rng } from "../../../engine/random";
import keyB4 from "../../../engine/__fixtures__/key-B4.json";
import { n2, pct0, pct1, useNarrow } from "./b3";
import "./figures.css";

/**
 * Figure 4 — one rule changed: Ada adds, Mel multiplies. The same 1,000 simulated jostles (one seed) drive both fans over ten
 * years from 100 with a 10 % drift. Ada adds the jostles to the level: her fan is symmetric and its width grows like √t. Mel applies
 * them as percentages (GBM, the closed form stated here and derived in B4): her fan leans, and the average and the middle path
 * separate — the key's 110.52 vs 102.02 after one year at 40 %, 271.83 vs 122.14 after ten. Ada and Mel appear here only, as the
 * legend swatches of the two fans.
 */

const S0 = 100,
  MU = 0.1,
  YEARS = 10,
  STEPS = 120,
  N = 1000,
  SHOWN = 70,
  SEED = 404;
type Rule = "ada" | "mel";
type Wobble = "0.2" | "0.4";

export function F4Fan() {
  const [rule, setRule] = useState<Rule>("ada");
  const [wob, setWob] = useState<Wobble>("0.4");
  const sigma = parseFloat(wob);
  const narrow = useNarrow();

  const paths = useMemo(() => {
    const r = rng(SEED);
    return Array.from({ length: N }, () => brownianPath(STEPS, YEARS, r).W);
  }, []);
  const level = (W: number, t: number) => (rule === "ada" ? S0 * (1 + MU * t + sigma * W) : gbmTerminal(S0, MU, sigma, t, W));

  const curves = useMemo<Pt[][]>(() => paths.slice(0, SHOWN).map((W) => W.map((w, i) => [(i / STEPS) * YEARS, level(w, (i / STEPS) * YEARS)] as Pt)), [paths, rule, sigma]); // eslint-disable-line react-hooks/exhaustive-deps
  const below = useMemo(() => paths.filter((W) => level(W[STEPS], YEARS) < S0).length / N, [paths, rule, sigma]); // eslint-disable-line react-hooks/exhaustive-deps

  const mean = (t: number) => (rule === "ada" ? S0 * (1 + MU * t) : gbmMean(S0, MU, t));
  const middle = (t: number) => (rule === "ada" ? S0 * (1 + MU * t) : gbmMedian(S0, MU, sigma, t));
  const meanPts: Pt[] = Array.from({ length: 41 }, (_, i) => [(i * YEARS) / 40, mean((i * YEARS) / 40)]);
  const midPts: Pt[] = Array.from({ length: 41 }, (_, i) => [(i * YEARS) / 40, middle((i * YEARS) / 40)]);
  const yMax = rule === "ada" ? 400 : sigma === 0.4 ? 600 : 400;
  const yMin = rule === "ada" ? -100 : 0;
  const role = rule === "ada" ? "truth" : "approx";

  return (
    <Figure
      n="4"
      prompt={
        <>
          A thousand simulated ten-year roads, the same jostles for both accountants. <Who name="Ada" /> adds each jostle to the level; <Who name="Mel" /> applies it as a
          percentage. Switch, and compare the average with the middle path.
        </>
      }
      controls={
        <>
          <Segmented
            label="rule"
            options={[
              { id: "ada", label: "Ada adds" },
              { id: "mel", label: "Mel multiplies" },
            ]}
            value={rule}
            onChange={setRule}
          />
          <Segmented
            label="wobble"
            options={[
              { id: "0.2", label: "20 % a year" },
              { id: "0.4", label: "40 % a year" },
            ]}
            value={wob}
            onChange={setWob}
          />
          <Readouts
            items={[
              ["average after 10 years", <span className={rule === "ada" ? "b3-truth" : "b3-approx"}>{n2(mean(YEARS))}</span>],
              ["middle path", <span className={rule === "ada" ? "b3-truth" : "b3-approx"}>{n2(middle(YEARS))}</span>],
              ["paths below the start", pct1(below)],
            ]}
          />
        </>
      }
      observe={
        rule === "ada" ? (
          <>
            Ada's fan is symmetric about the average, which is also the middle path, and its width grows like √t: four times the years, twice the spread. It can also go
            below zero — a price cannot, and that is Mel's reason for multiplying.
          </>
        ) : (
          <>
            Mel's fan leans. At {pct0(sigma)} the average is {n2(mean(1))} after one year but the middle path only {n2(middle(1))}; after ten, {n2(mean(10))} against{" "}
            {n2(middle(10))}. A few runaway paths carry the average; most paths sit below it. This is A1's {n2(keyB4.mel.median)} in continuous time — the half of the
            wobble squared that the middle path loses every year. B4 says where the half comes from.
          </>
        )
      }
    >
      <div className="b3-fan">
        <Plot xDomain={[0, YEARS]} yDomain={[yMin, yMax]} width={narrow ? 380 : 760} height={narrow ? 260 : 360} xLabel="years" yLabel="level" xTicks={5} yTicks={5} ariaLabel={`A fan of ${SHOWN} of ${N} simulated paths under ${rule === "ada" ? "Ada's additive" : "Mel's multiplicative"} rule, with the average and the middle path`}>
          {curves.map((c, i) => (
            <Curve key={i} pts={c} role={role} width={0.9} opacity={0.32} smooth={false} />
          ))}
          <Curve pts={[[0, S0], [YEARS, S0]]} role="ghost" dash="2 3" width={1} smooth={false} />
          <Curve pts={meanPts} role="ink" width={2.2} smooth={false} />
          <Curve pts={midPts} role="ink" width={2} dash="6 4" smooth={false} />
          <Label at={[YEARS, mean(YEARS)]} text={`average ${n2(mean(YEARS))}`} anchor="end" dx={-6} dy={-8} />
          <Label at={[YEARS, middle(YEARS)]} text={`middle ${n2(middle(YEARS))}`} anchor="end" dx={-6} dy={rule === "ada" ? 16 : 16} />
          <Marker at={[1, mean(1)]} role="ink" r={3.5} />
          <Label at={[1, mean(1)]} text={`year 1: average ${n2(mean(1))}${rule === "mel" ? ", middle " + n2(middle(1)) : ""}`} anchor="start" dx={8} dy={-10} />
          <Label at={[0, S0]} text="start 100" role="ghost" dx={6} dy={14} />
        </Plot>
      </div>
    </Figure>
  );
}
