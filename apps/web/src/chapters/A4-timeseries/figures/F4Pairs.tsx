import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Readouts } from "../../../ui/controls";
import { Band, Curve, HLine, Label, Plot, Points, type Pt } from "../../../ui/Plot";
import { DF_CRIT_5, dickeyFuller, meanReturnTime } from "../../../engine/timeseries";
import { rng } from "../../../engine/random";
import { getSpread, n0, n2, s2, s3, sd, useNarrow, zeroCrossings } from "./a4";

/**
 * Round 4 — the pairs trade. A spread between two bank stocks that has crossed zero again and again. "It always comes back —
 * buy when it's low." Rubber band or drunk? Then the Dickey–Fuller idea in one picture: today's change against yesterday's level;
 * the reader drags the line; the engine's own slope and t-ratio appear. The picture is drawn at the scale of the fit: the
 * days are binned by yesterday's level and each bin's average change is one dot (its size the head-count), so a slope of
 * −0.02 is a visible tilt rather than a line buried in a cloud ±15 tall; the fitted line carries its ±2 s.e. band.
 * One footnote: the critical values are special.
 * The spread is simulated until the two bank-stock files arrive (a4.ts REAL_PAIR); the figure says which.
 */

type Pick = "band" | "drunk";

export function F4Pairs() {
  const spread = getSpread();
  const ys = spread.ys;
  const crossings = useMemo(() => zeroCrossings(ys), [ys]);
  const df = useMemo(() => dickeyFuller(ys), [ys]);
  const pts = useMemo<Pt[]>(() => ys.slice(1).map((v, i) => [ys[i], v - ys[i]]), [ys]);
  const cx = useMemo(() => pts.reduce((s, p) => s + p[0], 0) / pts.length, [pts]);
  const cy = useMemo(() => pts.reduce((s, p) => s + p[1], 0) / pts.length, [pts]);
  const spreadSd = useMemo(() => sd(ys), [ys]);
  const [pick, setPick] = useBet<Pick>("A4-F4");
  const [slope, setSlope] = useState(0);
  const [dragged, setDragged] = useState(false);
  const narrow = useNarrow("(max-width: 760px)");

  const isBand = df.t < DF_CRIT_5;
  const verdictText = isBand ? "a rubber band" : "not distinguishable from a drunk";
  const phiHat = 1 + df.gamma;
  // the average time for a kick of one typical size to come back to the centre, simulated with the fitted φ̂
  const back = useMemo(() => (isBand ? meanReturnTime(phiHat, sd(ys.slice(1).map((v, i) => v - phiHat * ys[i])), spreadSd, rng(7), 400) : null), [isBand, phiHat, ys, spreadSd]);

  const lo = Math.min(...ys),
    hi = Math.max(...ys);
  const pad = 0.08 * (hi - lo);
  const xr = Math.max(Math.abs(lo), Math.abs(hi)) * 1.05;
  // the binned picture: twelve level buckets, each a dot at (bucket centre, average change of the days that started there)
  const BINS = 12;
  const bins = useMemo(() => {
    const w = (2 * xr) / BINS;
    const acc = Array.from({ length: BINS }, () => ({ sx: 0, sy: 0, n: 0 }));
    for (const [x, dy] of pts) {
      const k = Math.max(0, Math.min(BINS - 1, Math.floor((x + xr) / w)));
      acc[k].sx += x;
      acc[k].sy += dy;
      acc[k].n++;
    }
    return acc.filter((b) => b.n >= 5).map((b) => ({ x: b.sx / b.n, y: b.sy / b.n, n: b.n }));
  }, [pts, xr]);
  const maxN = Math.max(...bins.map((b) => b.n));
  const se = Math.abs(df.gamma / df.t); // the slope's standard error
  // y axis at the scale of the fit, not of the cloud: the fitted drop across the frame, the band, and the binned dots all inside
  const yr = Math.max(Math.abs(df.gamma) * xr + 2 * se * xr, ...bins.map((b) => Math.abs(b.y - cy))) * 1.35 + 1e-9;
  const slopeCap = yr / xr; // a dragged line stays in the frame
  const lineAt = (m: number): Pt[] => [
    [-xr, cy + m * (-xr - cx)],
    [xr, cy + m * (xr - cx)],
  ];
  const bandOf = (sign: 1 | -1): Pt[] => {
    const out: Pt[] = [];
    for (let k = 0; k <= 24; k++) {
      const x = -xr + (k * 2 * xr) / 24;
      out.push([x, cy + df.gamma * (x - cx) + sign * 2 * se * Math.abs(x - cx)]);
    }
    return out;
  };
  const years = (spread.n / 250).toFixed(0);

  return (
    <Figure
      n="4"
      prompt={
        <>
          Round 4, with stakes. A desk shows you the spread between two bank stocks{spread.real ? "" : " (simulated)"} over {years} years. It has crossed
          zero <strong>{crossings} times</strong>. "It always comes back — we buy when it's low." Your call: is it a rubber band, or a drunk who happens to have
          wandered past the lamp-post {crossings} times?
        </>
      }
      controls={
        pick ? (
          <Readouts
            items={[
              ["your slope", <span className="a4-approx">{s3(slope)}</span>],
              ["the regression's slope γ", <span className="a4-truth">{dragged ? s3(df.gamma) : "drag the line first"}</span>],
              ["its t-ratio", <span className="a4-truth">{dragged ? s2(df.t) : "—"}</span>],
            ]}
          />
        ) : undefined
      }
      observe={
        pick && !dragged ? (
          <>
            Regress today's change on yesterday's level. Slope zero: yesterday's level says nothing about today's change — a flat table, a drunk. Slope negative: a
            high level is pulled down tomorrow — a bowl. Drag the line to where you think the dots want it; the regression's own line and its number appear when you
            let go.
          </>
        ) : pick ? (
          <>
            The dots tilt: slope <strong>{s3(df.gamma)}</strong> — the machine takes back about {(100 * -df.gamma).toFixed(1)} % of yesterday's level a day, φ ≈ {n3fix(phiHat)} — with t-ratio{" "}
            <strong>{s2(df.t)}</strong>.{" "}
            {isBand ? (
              <>
                Beyond the −{n2(-DF_CRIT_5)} line: the drunk is rejected. From one typical deviation of ₹{n0(spreadSd)} the fitted band comes back in about <strong>{n0(back ?? 0)} days</strong> on
                average; on a flat table that average is infinite, and the {crossings} crossings would have been luck. The finite number is the trade's edge.
              </>
            ) : (
              <>
                Not beyond the −{n2(-DF_CRIT_5)} line: the drunk cannot be rejected. On a flat table the average time back is infinite, and {crossings} crossings are consistent with
                luck — no proven edge.
              </>
            )}
            <span className="a4-foot">
              Footnote: the t-ratio is <em>not</em> judged against the usual ±2. Under the random-walk rule its distribution is special; the 5 % line is −{n2(-DF_CRIT_5)}{" "}
              (MacKinnon, large samples — the Dickey–Fuller test).
            </span>
          </>
        ) : (
          <>
            Pick before you look closer. Both pictures — a band and a drunk — can cross zero this often over {years} years; the chart alone cannot settle it.
            {spread.real ? "" : " The spread is simulated; it will switch to the real pair of bank stocks when the data file arrives."}
          </>
        )
      }
    >
      <div className="a4-spread">
        <div className="a4-panel-t">{spread.label}</div>
        <Plot xDomain={[0, spread.n - 1]} yDomain={[lo - pad, hi + pad]} width={narrow ? 390 : 720} height={narrow ? 220 : 240} xLabel="trading day" xTicks={narrow ? 4 : 6} yTicks={5} margin={{ top: 16, right: 14, bottom: 34, left: 44 }}>
          <HLine at={0} />
          <Curve pts={ys.map((v, i) => [i, v] as Pt)} role="ink" width={1.2} smooth={false} />
          <Label at={[spread.n * 0.02, hi]} text={`crossed zero ${crossings} times`} anchor="start" dx={0} dy={2} />
        </Plot>
      </div>
      <Bet<Pick>
        question={<>Rubber band or drunk?</>}
        options={[
          { id: "band", label: "rubber band — it is pulled back" },
          { id: "drunk", label: "a drunk — the crossings are luck" },
        ]}
        pick={pick}
        onPick={(v) => {
          setPick(v);
          setDragged(false);
          setSlope(0);
        }}
      >
        <div className="a4-df">
          <div className="a4-panel-t">
            The Dickey–Fuller picture: today's average change against yesterday's level — one dot per level bucket, sized by how many days started there. <strong>Drag</strong> to set
            the line you believe in.
          </div>
          <Plot
            xDomain={[-xr, xr]}
            yDomain={[-yr, yr]}
            width={narrow ? 390 : 560}
            height={narrow ? 300 : 320}
            xLabel="yesterday's level"
            yLabel="today's change"
            xTicks={6}
            yTicks={5}
            margin={{ top: 16, right: 14, bottom: 34, left: 44 }}
            onDrag={(x, y, phase) => {
              if (Math.abs(x - cx) < xr * 0.08) return;
              setSlope(Math.max(-slopeCap, Math.min(slopeCap, (y - cy) / (x - cx))));
              if (phase === "up") setDragged(true);
            }}
          >
            {dragged && <Band upper={bandOf(1)} lower={bandOf(-1)} role="truth" />}
            <Curve pts={lineAt(0)} role="ghost" width={1} dash="4 4" smooth={false} />
            {bins.map((b, k) => (
              <Points key={k} pts={[[b.x, b.y]]} role="ink" r={(narrow ? 2.5 : 3) + (narrow ? 4 : 6) * Math.sqrt(b.n / maxN)} opacity={0.55} />
            ))}
            {dragged && <Curve pts={lineAt(df.gamma)} role="truth" width={2.2} smooth={false} />}
            <Curve pts={lineAt(slope)} role="approx" width={2} smooth={false} />
            <Label at={[xr * 0.98, cy + slope * (xr * 0.98 - cx)]} text={`yours: ${s3(slope)}`} role="approx" anchor="end" dx={0} dy={-8} />
            {dragged && <Label at={[-xr * 0.98, cy + df.gamma * (-xr * 0.98 - cx)]} text={`the regression: ${s3(df.gamma)} ± ${s3(2 * se).replace("−", "")}`} role="truth" anchor="start" dx={0} dy={-10} />}
            <Label at={[xr * 0.98, 0]} text="slope 0: a drunk" role="ghost" anchor="end" dx={0} dy={14} />
          </Plot>
          {dragged && (
            <ResultCard
              yours={pick === "band" ? "a rubber band" : "a drunk"}
              answer={`${verdictText}: t = ${s2(df.t)} against the −${n2(-DF_CRIT_5)} line`}
              verdict={(pick === "band") === isBand ? "right" : "miss"}
            >
              One regression, one slope. The slope says how much of yesterday's level is taken back today; its t-ratio, judged against the special line, is the
              Dickey–Fuller test.
            </ResultCard>
          )}
        </div>
      </Bet>
    </Figure>
  );
}

const n3fix = (v: number) => v.toFixed(3);
