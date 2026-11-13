import "./figures.css";
import { useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { Curve, Label, Plot } from "../../../ui/Plot";
import { ErrorBar, Stair, XTicks, YTicks } from "./parts";
import { LADDER_N, LSM, LSM_MODEL, getScaleRun, monthsAt, n0, n1, n2, n3, neg, useLazy, useNarrow, type Basis, type ScaleRun } from "./f2";

/**
 * Figure 1 — the LSM price against F1's grid (textbook, labelled): the American put S 50, K 50, r 10 %, σ 40 %, 5 months on
 * 50 exercise dates. Dial paths over the key's ladder (1,000 → 50,000; 2,000 first), switch the basis quadratic / cubic.
 * Live seededPaths + lsmPrice (seed key.lsm.seeded.seed; at 2,000 quad equals key.lsm.seeded). The key's own ladder and its
 * 200,000-path reference are drawn grey for comparison; the grid's 4.284 is the line. Two controls; three readouts.
 */

const TRUTH = LSM.truth_grid;
const EURO = LSM.european_bs;
const REF = LSM.reference;
const X: [number, number] = [2.85, 5.5];
const Y: [number, number] = [3.95, 4.8];
const BX: [number, number] = [-0.45, LSM_MODEL.T * 12 + 0.1];
const BY: [number, number] = [31, 52];
const BASIS_NAME: Record<Basis, string> = { quad: "quadratic (1, x, x²)", cubic: "cubic (1, x, x², x³)" };
const kfmt = (n: number) => (n >= 1000 ? `${n / 1000}k` : String(n));

function Ladder({ run, narrow }: { run: ScaleRun; narrow: boolean }) {
  const lx = Math.log10(run.n);
  return (
    <Plot xDomain={X} yDomain={Y} width={narrow ? 400 : 480} height={narrow ? 260 : 300} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={Y[0]} ariaLabel={`the LSM price with its standard error at ${n0(run.n)} paths against the grid's ${n3(TRUTH)}, with the key's ladder of runs from 1,000 to 200,000 paths in grey`}>
      <YTicks at={[4.0, 4.2, 4.4, 4.6]} fmt={n1} />
      <XTicks at={[3, 4, 5]} fmt={(v) => kfmt(10 ** v)} label="paths" />
      <Curve pts={[[X[0], TRUTH], [X[1], TRUTH]]} role="truth" width={1.6} smooth={false} />
      <Label at={[X[1], TRUTH]} text={`the grid (F1): ${n3(TRUTH)}`} role="truth" dx={-4} dy={-5} anchor="end" />
      <Curve pts={[[X[0], EURO], [X[1], EURO]]} role="ghost" width={1} dash="5 4" smooth={false} />
      <Label at={[X[1], EURO]} text={`European (formula): ${n3(EURO)}`} role="ghost" dx={-4} dy={-5} anchor="end" />
      {LSM.ladder.map((r) => (
        <ErrorBar key={r.n} at={[Math.log10(r.n), r.price]} se={r.se} role="ghost" r={3} cap={3} width={1.2} opacity={0.8} />
      ))}
      <ErrorBar at={[Math.log10(REF.n), REF.price]} se={REF.se} role="ghost" r={3} cap={3} width={1.2} opacity={0.8} />
      <Label at={[Math.log10(REF.n), REF.price - REF.se]} text={`${kfmt(REF.n)}: ${n3(REF.price)} ± ${n3(REF.se)}`} role="ghost" dx={4} dy={16} anchor="end" />
      <ErrorBar at={[lx, run.price]} se={run.se} role="approx" r={5} cap={5} width={2} />
      <Label at={[lx, run.price + run.se]} text={`${n0(run.n)} paths: ${n3(run.price)} ± ${n3(run.se)}`} role="approx" dx={lx > 4.3 ? -10 : 10} dy={-8} anchor={lx > 4.3 ? "end" : "start"} />
      <Label at={[X[0], Y[1]]} text="grey: the key's own runs, ± one standard error" role="ghost" dx={4} dy={12} />
    </Plot>
  );
}

function Boundary({ run, narrow }: { run: ScaleRun; narrow: boolean }) {
  const xs = run.boundary.map((_, i) => LSM_MODEL.T * 12 - monthsAt(i));
  return (
    <Plot xDomain={BX} yDomain={BY} width={narrow ? 400 : 380} height={narrow ? 260 : 300} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={BX[0]} axisY={BY[0]} ariaLabel={`the exercise boundary the regression found at ${n0(run.n)} paths — the highest stock price exercised at each date — against the 200,000-path reference`}>
      <YTicks at={[35, 40, 45, 50]} fmt={n0} />
      <XTicks at={[1, 2, 3, 4]} fmt={(v) => `${v} m`} />
      <Curve pts={[[BX[0], LSM_MODEL.K], [BX[1], LSM_MODEL.K]]} role="ink" width={1} dash="5 4" smooth={false} />
      <Label at={[BX[1], LSM_MODEL.K]} text={`strike ${n0(LSM_MODEL.K)}`} role="ink" dx={-6} dy={-5} anchor="end" />
      <Stair xs={xs} ys={REF.boundary} role="truth" width={1.6} dash="4 3" />
      <Stair xs={xs} ys={run.boundary} role="approx" width={2} />
      <Label at={[BX[0], BY[0] + 2.2]} text={`dashed: the ${kfmt(REF.n)}-path reference's`} role="truth" dx={4} dy={0} />
    </Plot>
  );
}

export function F1Scale() {
  const narrow = useNarrow();
  const [ni, setNi] = useState(1);
  const [basis, setBasis] = useState<Basis>("quad");
  const n = LADDER_N[ni];
  const run = useLazy(`scale:${n}:${basis}`, () => getScaleRun(n, basis));
  const last = useRef<ScaleRun | null>(null);
  if (run) last.current = run;
  const shown = run ?? last.current;
  const gap = shown ? shown.price - TRUTH : NaN;
  const L = LSM.ladder;

  return (
    <Figure
      n="1"
      prompt={
        <>
          Textbook, not the chain: the American put chapter F1's grid priced at {n3(TRUTH)} — stock 50, strike 50, 10 % rate, 40 % volatility, five months — now on simulated paths with 50
          exercise dates and the same two regressions at every one. Dial the paths; change the basis.
        </>
      }
      controls={
        <>
          <Slider label="paths" value={ni} min={0} max={LADDER_N.length - 1} step={1} onChange={setNi} fmt={() => n0(n)} />
          <Segmented<Basis> label="basis" options={[{ id: "quad", label: "quadratic" }, { id: "cubic", label: "cubic" }]} value={basis} onChange={setBasis} />
          <Readouts
            items={[
              [`LSM price, ${n0(n)} paths`, shown ? `${n3(shown.price)} ± ${n3(shown.se)}` : "…"],
              ["the grid (F1)", n3(TRUTH)],
              ["gap", shown ? <span className={Math.abs(gap) <= shown.se ? "f2-good" : Math.abs(gap) <= 2 * shown.se ? undefined : "f2-bad"}>{neg(`${gap >= 0 ? "+" : ""}${n3(gap)} = ${n1(Math.abs(gap) / shown.se)} SE`)}</span> : "…"],
            ]}
          />
        </>
      }
      observe={
        <>
          The runs are seeded (seed {LSM.seeded.seed}), so the {n0(LSM.seeded.n)}-path quadratic run reads {n3(LSM.seeded.price)} ± {n3(LSM.seeded.se)} every time (key); the European put on the same paths is{" "}
          {n3(LSM.seeded.european_same_paths)} against the formula's {n3(EURO)}. The key's own ladder (grey) runs {L.map((r) => `${n3(r.price)} at ${kfmt(r.n)}`).join(", ")}; at {kfmt(REF.n)} it is{" "}
          {n3(REF.price)} ± {n3(REF.se)}, within one standard error of the grid's {n3(TRUTH)}, and the cubic basis gives {n3(REF.cubic_price)} ± {n3(REF.cubic_se)} — {n1(Math.abs(REF.cubic_price - REF.price) / REF.se)} standard errors away (key).
          With a thousand paths the ladder reads {n2(L[0].price)}, too high: the rule was fitted on the paths it is judged on. {LSM.low_bias_note}. The staircase is the highest price exercised at each
          date; with few paths it is ragged, and the dashed reference is what fifty dates and {kfmt(REF.n)} paths settle on.
        </>
      }
    >
      <div className="f2-scale">
        <div className="f2-scale-two">
          <div className="f2-panel">
            <div className="f2-panel-title">
              <strong>the price</strong> <span>LSM ± one standard error, against the grid; basis {BASIS_NAME[basis]}</span>
            </div>
            {shown ? <Ladder run={shown} narrow={narrow} /> : <div className="f2-wait">simulating {n0(n)} paths…</div>}
          </div>
          <div className="f2-panel">
            <div className="f2-panel-title">
              <strong>the exercise boundary</strong> <span>the highest price exercised at each date, in months from now; found without a grid</span>
            </div>
            {shown ? <Boundary run={shown} narrow={narrow} /> : <div className="f2-wait">…</div>}
          </div>
        </div>
        <div className="f2-rule" role="status">
          <strong>{shown ? `${n0(shown.n)} paths, ${BASIS_NAME[shown.basis]}` : "…"}</strong>
          <span>
            {shown ? (
              <>
                price {n3(shown.price)} ± {n3(shown.se)} · European on the same paths {n3(shown.european)} (formula {n3(EURO)}) · the grid {n3(TRUTH)}
                {shown.n !== n || shown.basis !== basis ? " — computing the next run…" : ""}
              </>
            ) : (
              "the first run is simulating"
            )}
          </span>
        </div>
      </div>
    </Figure>
  );
}
