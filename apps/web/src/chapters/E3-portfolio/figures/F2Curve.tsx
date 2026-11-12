import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { Bars, Curve, Label, Marker, Plot, usePlot, type Pt, type Role } from "../../../ui/Plot";
import { BOOK, BOOK_EXPOSURE, BOOK_ONE_FACTOR_VAR, BOOK_VAR, DAY_MIX, FACTOR_NAMES, FACTOR_SD, FRYE, KEY, LOADINGS, MADE_UP_DAY, NSS, ONE_SD_MOVE, TENORS, Z99, bp1, f2, pct1, rebuild, sgn0, sgn2, useNarrow } from "./e3";

/**
 * Figure 2 — shift, tilt, bend. (i) The rope: ten tenors (Frye's, 3 m → 30 y, evenly spaced for legibility) with a base curve whose
 * SHAPE is CCIL's Indian NSS curve of 2 Jan 2026 (key.nss; used only as a shape) and three ghost curves, each one of Frye's factors
 * at EXAGGERATION × one sd (one sd is ~6 bp at 3 y, invisible against a 210 bp curve; the honest number is printed). (ii) Three
 * small multiples of the loadings with their shares and cumulative shares, printed from the key. (iii) Dial k: a made-up day
 * (1 sd PC1 − 0.8 sd PC2 + 0.5 sd PC3, textbook) rebuilt from k of the factors of Σ₃ — the covariance the three printed factors
 * span, as portfolio.test.ts builds it — so the rebuild is exact at k = 3; the share readout is the real surface's cum[k−1].
 * (iv) Hull Table 16.5's book collapsed to two factor exposures and one VaR. One dial; three readouts.
 */

const EXAGGERATION = 5;
const ROLES: Role[] = ["truth", "approx", "error"];
const XI: [number, number] = [-0.5, TENORS.length - 0.5];

function TenorTicks({ every = 1, yAt }: { every?: number; yAt: number }) {
  const { x, y } = usePlot();
  return (
    <g>
      {TENORS.map((t, i) =>
        i % every === 0 || i === TENORS.length - 1 ? (
          <text key={t} className="label e3-ticklabel" x={x(i)} y={y(yAt) + 4} textAnchor="middle">
            {t}
          </text>
        ) : null,
      )}
    </g>
  );
}
function YTicksLeft({ at, fmt }: { at: number[]; fmt: (v: number) => string }) {
  const { y, inner } = usePlot();
  return (
    <g>
      {at.map((v) => (
        <g key={v}>
          <line x1={inner.left} x2={inner.left + inner.width} y1={y(v)} y2={y(v)} className="e3-tick" />
          <text className="label e3-ticklabel" x={inner.left + 4} y={y(v) - 3}>
            {fmt(v)}
          </text>
        </g>
      ))}
    </g>
  );
}

function Rope({ narrow }: { narrow: boolean }) {
  const base: Pt[] = NSS.rates.map((r, i) => [i, r]);
  const ghosts: Pt[][] = ONE_SD_MOVE.map((mv) => NSS.rates.map((r, i) => [i, r + (EXAGGERATION * mv[i]) / 100]));
  const yLo = 4.8;
  const yHi = 8.1;
  return (
    <Plot xDomain={XI} yDomain={[yLo, yHi]} width={narrow ? 400 : 480} height={narrow ? 290 : 300} margin={{ top: 10, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={XI[0]} axisY={5.1} ariaLabel={`a yield curve from ${pct1(NSS.rates[0] / 100)} at 3 months to ${pct1(NSS.rates[9] / 100)} at 30 years, with three ghost curves: shifted, tilted and bent by ${EXAGGERATION} sd of each of Frye's factors`}>
      <YTicksLeft at={[5.5, 6, 6.5, 7, 7.5, 8]} fmt={(v) => v.toFixed(1) + " %"} />
      <TenorTicks every={1} yAt={4.95} />
      {ghosts.map((g, f) => (
        <Curve key={f} pts={g} role={ROLES[f]} width={1.8} dash="5 3" opacity={0.85} />
      ))}
      <Curve pts={base} role="ink" width={3} />
      {ghosts.map((g, f) => (
        <Label key={f} at={g[f === 1 ? 9 : f === 0 ? 5 : 3]} text={`${FACTOR_NAMES[f]}: ${EXAGGERATION} sd`} role={ROLES[f]} dx={f === 1 ? -4 : 0} dy={f === 2 ? 15 : -8} anchor={f === 1 ? "end" : "middle"} />
      ))}
      <Label at={base[9]} text="today's curve" role="ink" dx={-4} dy={16} anchor="end" />
    </Plot>
  );
}

function Loadings({ f, narrow }: { f: number; narrow: boolean }) {
  const l = LOADINGS[f];
  return (
    <div className="e3-multiple">
      <div className="e3-panel-title">
        <strong>
          {f + 1}. {FACTOR_NAMES[f]}
        </strong>
        <span>
          {pct1(FRYE.shares[f])} of the wobble{f > 0 ? ` · ${pct1(FRYE.cum[f])} with ${f === 1 ? "two" : "three"}` : ""} · sd {f2(FACTOR_SD[f])} bp
        </span>
      </div>
      <Plot xDomain={XI} yDomain={[-0.88, 0.65]} width={narrow ? 400 : 300} height={narrow ? 120 : 110} margin={{ top: 4, right: 6, bottom: 4, left: 6 }} xTicks={0} yTicks={0} grid={false} axisX={XI[0]} axisY={0} ariaLabel={`loadings of factor ${f + 1} (${FACTOR_NAMES[f]}) by tenor: ${l.join(", ")}`}>
        <Bars bars={l.map((v, i) => ({ x: i, y: v, w: 0.7 }))} role={ROLES[f]} opacity={0.8} />
        <TenorTicks every={narrow ? 3 : 1} yAt={-0.76} />
      </Plot>
    </div>
  );
}

function Rebuild({ k, narrow }: { k: number; narrow: boolean }) {
  const r = rebuild(k);
  const day: Pt[] = MADE_UP_DAY.map((v, i) => [i, v]);
  const built: Pt[] = r.rebuilt.map((v, i) => [i, v]);
  const yHi = 10;
  return (
    <Plot xDomain={XI} yDomain={[-1.3, yHi]} width={narrow ? 400 : 480} height={narrow ? 240 : 260} margin={{ top: 10, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={XI[0]} axisY={0} ariaLabel={`the made-up day's change in basis points by tenor and its rebuild from ${k} factor${k > 1 ? "s" : ""}; rebuild error ${bp1(r.error)}`}>
      <YTicksLeft at={[2, 4, 6, 8]} fmt={(v) => v + " bp"} />
      <TenorTicks every={1} yAt={-0.7} />
      {day.map((p, i) => (
        <Curve key={i} pts={[[p[0], p[1]], [p[0], built[i][1]]]} role="error" width={1.2} smooth={false} />
      ))}
      <Curve pts={built} role="truth" width={2.5} />
      {day.map((p, i) => (
        <Marker key={i} at={p} role="ink" r={4} />
      ))}
      <Label at={day[0]} text="the day, bp" role="ink" dx={8} dy={-10} />
      <Label at={built[4]} text={`rebuilt from ${k} factor${k > 1 ? "s" : ""}`} role="truth" dx={0} dy={-12} anchor="middle" />
      <Label at={[XI[1], yHi]} text={`rebuild error ${bp1(r.error)}`} role="error" dx={-4} dy={14} anchor="end" />
    </Plot>
  );
}

function BookCard() {
  return (
    <div className="e3-book">
      <strong>Hull Table 16.5: a five-bond book, textbook</strong>
      <table className="e3-booktable">
        <thead>
          <tr>
            <th>tenor</th>
            {BOOK.tenors.map((t) => (
              <th key={t}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>$ m per bp</td>
            {BOOK.exposures.map((v, i) => (
              <td key={i} className={v < 0 ? "e3-neg" : ""}>
                {sgn0(v)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="e3-dim">× shift</td>
            {BOOK.tenors.map((t) => (
              <td key={t} className="e3-dim">
                {FRYE.pc1[TENORS.indexOf(t)].toFixed(2)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="e3-dim">× tilt</td>
            {BOOK.tenors.map((t) => (
              <td key={t} className="e3-dim">
                {sgn2(FRYE.pc2[TENORS.indexOf(t)])}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="e3-book-rows">
        <span>
          <span className="k">exposure to the shift </span>
          <span className="v">{sgn2(BOOK_EXPOSURE.f[0])}</span>
        </span>
        <span>
          <span className="k">exposure to the tilt </span>
          <span className="v">{sgn2(BOOK_EXPOSURE.f[1])}</span>
        </span>
        <span>
          <span className="k">σ = √({sgn2(BOOK_EXPOSURE.f[0]).replace("+", "")}² × {f2(FACTOR_SD[0])}² + {sgn2(BOOK_EXPOSURE.f[1]).replace("+", "")}² × {f2(FACTOR_SD[1])}²) </span>
          <span className="v">{f2(BOOK_EXPOSURE.sd)}</span>
        </span>
        <span>
          <span className="k">one-day 99 % VaR, {Z99} σ </span>
          <span className="v">$ {f2(BOOK_VAR)} m</span>
          <span className="k"> (Hull: {f2(BOOK.book_var)})</span>
        </span>
        <span>
          <span className="k">with the shift alone </span>
          <span className="v e3-bad">$ {f2(BOOK_ONE_FACTOR_VAR)} m</span>
        </span>
      </div>
      <p className="e3-book-why">
        Long the 1–2 y, short the 3–5 y: a <strong>steepener</strong>. Its exposure to the shift is {sgn2(BOOK_EXPOSURE.f[0])}, nearly nothing — a one-factor view calls it almost riskless, {f2(BOOK_ONE_FACTOR_VAR)} against{" "}
        {f2(BOOK_VAR)}. The tilt carries {(100 * (1 - (BOOK_ONE_FACTOR_VAR / BOOK_VAR) ** 2)).toFixed(1)} % of its variance. One factor misses nearly all of it.
      </p>
    </div>
  );
}

export function F2Curve() {
  const narrow = useNarrow();
  const [k, setK] = useState(1);
  const r = rebuild(k);
  return (
    <Figure
      n="2"
      prompt={
        <>
          A yield curve is a rope with ten knots, one per maturity. Watch every day's move for years and three motions account for nearly all of it: the rope <em>shifts</em>, it <em>tilts</em>, it{" "}
          <em>bends</em>. Textbook: Frye's ten US Treasury tenors from Hull §16.9. Dial how many motions you keep and watch a day's move come back.
        </>
      }
      controls={
        <>
          <Slider label="how many factors" value={k} min={1} max={TENORS.length} step={1} onChange={setK} role="truth" fmt={(v) => String(v)} width={narrow ? 150 : 200} />
          <Readouts items={[["k", String(k)], ["share of the wobble explained", pct1(FRYE.cum[k - 1])], ["rebuild error", bp1(r.error)]]} />
        </>
      }
      observe={
        <>
          The three shapes are not imposed — the matrix of daily changes produced them. Frye's shift carries <strong>{pct1(FRYE.shares[0])}</strong> of all the wobble in ten Treasury yields, the tilt{" "}
          {pct1(FRYE.shares[1])}, the bend {pct1(FRYE.shares[2])}: {pct1(FRYE.cum[1])} with two, {pct1(FRYE.cum[2])} with three (key, Hull Table 16.4). One sd of the shift moves the 3-month rate{" "}
          {bp1(FRYE.one_sd_pc1_bp[0])} and the 3-year {bp1(FRYE.one_sd_pc1_bp[4])} — the ghost curves above are drawn at {EXAGGERATION} sd so you can see them. The day you rebuild is a made-up one from the
          factors ({DAY_MIX[0]} sd of the shift, −{Math.abs(DAY_MIX[1])} of the tilt, +{DAY_MIX[2]} of the bend, textbook): one factor returns the shift and misses the twist, error {bp1(rebuild(1).error)}; three return it exactly — because the key
          holds only the three factors Hull printed, so the covariance they span has three directions, not ten; on the real surface the fourth to tenth carry the last {pct1(1 - FRYE.cum[2])}. The base curve's{" "}
          <strong>shape</strong> is CCIL's Indian government curve of 2 Jan 2026 ({pct1(NSS.rates[0] / 100)} at 3 m to {pct1(NSS.rates[9] / 100)} at 30 y, its published NSS parameters), used only as a shape; the
          factors are Frye's. The book: five exposures become two numbers, {sgn2(BOOK_EXPOSURE.f[0])} and {sgn2(BOOK_EXPOSURE.f[1])}, and one VaR, {f2(BOOK_VAR)} (Hull {f2(BOOK.book_var)}; Hull's loadings are
          printed to two decimals). Tsay's five-stock check from Example 9.1 is in the key too: eigenvalues {KEY.tsay.cov_pca.book_values.slice(0, 2).join(", ")}, … to the printed digits.
        </>
      }
    >
      <div className="e3-curve">
        <div className="e3-curve-row">
          <div className="e3-curve-panel">
            <div className="e3-panel-title">
              <strong>the rope</strong> <span>base: CCIL's Indian curve of 2 Jan 2026, as a shape; ghosts: Frye's three factors at {EXAGGERATION} sd each (one sd of the shift is {bp1(FRYE.one_sd_pc1_bp[4])} at 3 y)</span>
            </div>
            <Rope narrow={narrow} />
          </div>
          <div className="e3-multiples">
            {[0, 1, 2].map((f) => (
              <Loadings key={f} f={f} narrow={narrow} />
            ))}
          </div>
        </div>
        <div className="e3-curve-row">
          <div className="e3-curve-panel">
            <div className="e3-panel-title">
              <strong>a day rebuilt from {k} factor{k > 1 ? "s" : ""}</strong> <span>a made-up day from the factors, textbook: {DAY_MIX[0]} sd shift − {Math.abs(DAY_MIX[1])} sd tilt + {DAY_MIX[2]} sd bend; red = what {k} factor{k > 1 ? "s" : ""} miss{k > 1 ? "" : "es"}</span>
            </div>
            <Rebuild k={k} narrow={narrow} />
          </div>
          <BookCard />
        </div>
      </div>
    </Figure>
  );
}
