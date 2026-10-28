import { useMemo, useState } from "react";
import { moments, npdf, onceInYears, studentT, tailTwoSidedNormal } from "../../../engine/distributions";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Plot, Tip, VLine, fmt, usePlot } from "../../../ui/Plot";
import { Segmented, Toggle } from "../../../ui/controls";
import { histogram } from "../sim";
import niftyLong from "../../../data/nifty50-long.json";
import { fmtYears } from "./years";

const BIG2 = 0.02; // one year: "a big day" is more than 2 % either way; ten years: more than 4σ

/** One year of real NIFTY 50 daily changes, every day a bar; then the same days stacked against the bell. */
export function F4World() {
  const [logScale, setLog] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [showT, setShowT] = useState(true);

  const [span, setSpan] = useState<"year" | "decade">("year");
  const nifty = useMemo(() => (span === "year" ? { ...niftyLong, rows: niftyLong.rows.slice(-248) } : niftyLong), [span]);
  const data = useMemo(() => {
    const c = nifty.rows.map((r) => r.c);
    const rets = c.slice(1).map((v, i) => Math.log(v / c[i]));
    const dates = nifty.rows.slice(1).map((r) => r.d);
    return { rets, dates };
  }, [nifty]);
  const m = useMemo(() => moments(data.rets), [data]);
  const z = useMemo(() => data.rets.map((v) => (v - m.mean) / m.sd), [data, m]);
  const bins = useMemo(() => histogram(z, -6, 6, 36), [z]);
  const BIG = span === "year" ? BIG2 : 4 * m.sd;
  const bigLabel = span === "year" ? "2 %" : "4σ";
  const bigDays = useMemo(() => data.rets.map((r, i) => ({ i, r, d: data.dates[i] })).filter((x) => Math.abs(x.r) > BIG), [data, BIG]);
  const bigBell = data.rets.length * tailTwoSidedNormal(BIG / m.sd);
  const worst = z.reduce((a, v, i) => (Math.abs(v) > Math.abs(z[a]) ? i : a), 0);
  const worstYears = onceInYears(tailTwoSidedNormal(Math.abs(z[worst])));
  // a t fitted loosely by the sample kurtosis (one year is far too short to pin the tails down)
  const nuFit = Math.max(2.5, Math.min(30, 4 + 6 / Math.max(0.1, m.kurtosis - 3)));
  const bell = useMemo(() => Array.from({ length: 241 }, (_, i) => [-6 + (12 * i) / 240, npdf(-6 + (12 * i) / 240)] as [number, number]), []);
  const tfit = useMemo(() => {
    const c = studentT.unitScale(nuFit);
    return Array.from({ length: 241 }, (_, i) => {
      const x = -6 + (12 * i) / 240;
      return [x, studentT.pdf(x / c, nuFit) / c] as [number, number];
    });
  }, [nuFit]);
  const tr = (v: number) => (logScale ? Math.log10(Math.max(v, 1e-5)) : v);
  const ydom: [number, number] = logScale ? [-4, 0] : [0, span === "year" ? 0.5 : 0.65];
  const n = data.rets.length;
  const pctMax = Math.max(...data.rets.map((v) => Math.abs(v))) * 100 * 1.15;
  const first = nifty.rows[0].d,
    last = nifty.rows[nifty.rows.length - 1].d;

  return (
    <Figure
      n="4"
      prompt={
        <>
          {span === "year" ? "One year" : "Ten years"} of NIFTY 50, every day a bar — real, from NSE, downloaded Oct 2026. Hover a rose bar for its date. Then switch to the log view
          on the right.
        </>
      }
      controls={
        <>
          <Toggle label="log-density view" on={logScale} onChange={setLog} />
          <Segmented
            label="span"
            options={[
              { id: "year", label: "the last year" },
              { id: "decade", label: "2016 – 2026" },
            ]}
            value={span}
            onChange={setSpan}
          />
          <Toggle label={span === "year" ? "t-curve, fitted loosely" : "t-curve, fitted"} on={showT} onChange={setShowT} />
          <span className="readouts">
            <span>
              <span className="k">days </span>
              <span className="v">{n}</span>
            </span>
            <span>
              <span className="k">a usual day moves </span>
              <span className="v">{fmt.n(2)(m.sd * 100)} %</span>
            </span>
            <span>
              <span className="k">days beyond {bigLabel}: </span>
              <span className="v tok-error">{bigDays.length}</span>
              <span className="k">, the bell promised {span === "year" ? "about " : ""}</span>
              <span className="v tok-truth">{span === "year" ? Math.round(bigBell) : fmt.n(1)(bigBell)}</span>
            </span>
            <span>
              <span className="k">biggest day {data.dates[worst]}: </span>
              <span className="v">{fmt.n(1)(Math.abs(z[worst]))}σ</span>
              <span className="k">, the bell says once in </span>
              <span className="v tok-truth">{fmtYears(worstYears)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          <p style={{ margin: 0 }}>
            The bell fits the middle and misses the edges. {bigDays.length} days moved more than {bigLabel}; the bell promised {span === "year" ? "about " + Math.round(bigBell) : fmt.n(1)(bigBell)}. The
            biggest day moved {fmt.n(1)(Math.abs(z[worst]))}σ, which the bell allows once in {fmtYears(worstYears)}.{" "}
            {span === "year" ? "One year is 247 days — too few to pin the far tails down, so the t-curve is fitted loosely. Switch to ten years." : "Ten years, and the picture is the same with the edges filled in: March 2020 alone has four days the bell says should never happen."}
          </p>
          <details className="a1-more">
            <summary>more</summary>
            <p>
              Switch to the log view and the bell becomes an upside-down U, dropping faster and faster. The bars do not drop that fast: past 2σ they fall
              away in something closer to a straight line, which means big days never stop being possible, they just get rarer slowly. The rose curve is a
              Student-t, the simplest shape with that property; its one knob (ν ≈ {fmt.n(1)(nuFit)} here) was set from the sample's tail weight
              (kurtosis {fmt.n(1)(m.kurtosis)}, where a bell has 3). With thirty years of data the same picture holds and the t fits tightly; with one
              year, treat the rose curve as a sketch.
            </p>
            <p className="footnote" style={{ margin: "0.4em 0 0" }}>
              Source: NSE India, NIFTY 50 daily closes {first} to {last}, downloaded by the sponsor on 23 October 2026 (<code>src/data/nifty50.json</code>).
              Daily change = log of today's close over yesterday's. Nothing in this figure is simulated.
            </p>
          </details>
        </>
      }
    >
      <div className="two a1-two-32">
        <Plot
          xDomain={[0, n]}
          yDomain={[-pctMax, pctMax]}
          xLabel={`trading days, ${first} → ${last}`}
          yLabel="daily change, %"
          width={520}
          height={300}
          xTicks={5}
          yTicks={5}
          ariaLabel="One bar per trading day of NIFTY 50"
          onHover={(x) => setHover(x === null ? null : Math.max(0, Math.min(n - 1, Math.round(x - 0.5))))}
        >
          <DayBars rets={data.rets} hover={hover} big={BIG} />
          <ThresholdLines pct={BIG * 100} />
          {hover !== null && (
            <Tip at={[hover + 0.5, data.rets[hover] * 100]} lines={[data.dates[hover], `${data.rets[hover] >= 0 ? "+" : ""}${fmt.n(2)(data.rets[hover] * 100)} %`]} flip={hover > n * 0.6} />
          )}
        </Plot>
        <Plot xDomain={[-6, 6]} yDomain={ydom} xLabel="daily change, in usual-day units (σ)" yLabel={logScale ? "log₁₀ density" : "density"} width={400} height={300} xTicks={6} yTicks={4} ariaLabel="Histogram of standardised daily changes with the bell and a t fit">
          <LogBars bins={bins} tr={tr} floor={ydom[0]} />
          <Curve pts={bell.map((p) => [p[0], tr(p[1])])} role="truth" />
          {showT && <Curve pts={tfit.map((p) => [p[0], tr(p[1])])} role="error" dash="5 4" />}
          <BigRug z={z} big={bigDays.map((b) => b.i)} hover={hover} />
          <VLine at={BIG / m.sd} />
          <VLine at={-BIG / m.sd} />
          <Label at={[5.8, logScale ? -0.25 : 0.47]} text="bell" role="truth" anchor="end" />
          {showT && <Label at={[5.8, logScale ? -0.6 : ydom[1] * 0.86]} text={span === "year" ? "t, fitted loosely" : "t, fitted"} role="error" anchor="end" />}
          <Label at={[BIG / m.sd, logScale ? -0.35 : ydom[1] * 0.94]} text={"±" + bigLabel} dx={4} dy={0} />
        </Plot>
      </div>
      <div className="a1-days">
        <span>The {bigDays.length} days beyond {bigLabel}:</span>
        {bigDays.map((b) => (
          <span key={b.d} className="d" style={{ color: b.i === hover ? "var(--error-text)" : undefined }}>
            {b.d} <strong>{b.r >= 0 ? "+" : ""}{fmt.n(1)(b.r * 100)} %</strong>
          </span>
        ))}
      </div>
    </Figure>
  );
}

function DayBars({ rets, hover, big: BIG }: { rets: number[]; hover: number | null; big: number }) {
  const { x, y } = usePlot();
  const w = Math.max(1, x(1) - x(0) - 0.6);
  return (
    <g>
      {rets.map((r, i) => {
        const v = r * 100;
        const big = Math.abs(r) > BIG;
        const yTop = y(Math.max(v, 0)),
          yBot = y(Math.min(v, 0));
        return (
          <rect key={i} className={`marker ${big ? "error" : "approx"}`} x={x(i) + 0.3} y={yTop} width={w} height={Math.max(0.5, yBot - yTop)} style={{ opacity: hover === i ? 1 : big ? 0.95 : 0.55, stroke: "none" }}>
            <title>{`day ${i + 1}: ${v >= 0 ? "+" : ""}${v.toFixed(2)} %`}</title>
          </rect>
        );
      })}
    </g>
  );
}

function ThresholdLines({ pct }: { pct: number }) {
  const { x, y, inner } = usePlot();
  return (
    <g>
      {[pct, -pct].map((v) => (
        <line key={v} className="guide" x1={inner.left} x2={inner.left + inner.width} y1={y(v)} y2={y(v)} style={{ strokeDasharray: "4 3" }} />
      ))}
      <text className="label" x={x(2)} y={y(pct) - 4} style={{ fontSize: 10.5 }}>
        +{pct.toFixed(1)} %
      </text>
      <text className="label" x={x(2)} y={y(-pct) + 12} style={{ fontSize: 10.5 }}>
        −{pct.toFixed(1)} %
      </text>
    </g>
  );
}

/** A rug of the big days along the bottom of the histogram, so each bar on the left is also a tick on the right. */
function BigRug({ z, big, hover }: { z: number[]; big: number[]; hover: number | null }) {
  const { x, inner } = usePlot();
  const y0 = inner.top + inner.height;
  return (
    <g>
      {big.map((i) => (
        <line key={i} x1={x(z[i])} x2={x(z[i])} y1={y0 - (hover === i ? 22 : 14)} y2={y0} stroke="var(--error)" strokeWidth={hover === i ? 3 : 2} />
      ))}
    </g>
  );
}

function LogBars({ bins, tr, floor }: { bins: ReturnType<typeof histogram>; tr: (v: number) => number; floor: number }) {
  const { x, y } = usePlot();
  return (
    <g>
      {bins.map((b, i) => {
        if (b.density <= 0) return null;
        const top = y(tr(b.density));
        const bot = y(floor);
        return <rect key={i} className="marker approx" x={x(b.lo) + 0.5} y={top} width={Math.max(0.5, x(b.hi) - x(b.lo) - 1)} height={Math.max(0, bot - top)} style={{ opacity: 0.75, stroke: "none" }} />;
      })}
    </g>
  );
}
