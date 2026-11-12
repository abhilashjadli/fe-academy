import "./figures.css";
import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Bars, Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { pdf } from "../../../engine/normal";
import { Z99 } from "../../../engine/var";
import { DESKS, HULL_1987_SD, KEY, LOSS, N, PNL, SD, WORST_INDEX, WORST_IN_SD, DATES, f1, f2, fmtDate, fmtDay, getBacktest, lakh, lakhSigned, useNarrow } from "./e1";

/**
 * Figure 3 — three stills, no controls: what the pile does not know. (a) The ghost: the historical fence through March 2022 falls
 * by a third while nothing happens — the 2020 cluster leaves the 500-day window. (b) Two desks: two independent 4 % bets, each
 * with a 95 % VaR of zero, together ₹100; ES adds up. (c) Outside the pile: the record's worst day and Hull's 1987 day against
 * the bell, in standard deviations.
 */

function Ghost({ narrow }: { narrow: boolean }) {
  const bt = useMemo(() => getBacktest(), []);
  const g = KEY.backtest.ghost;
  const a = bt.dates.findIndex((d) => d >= "2022-02-01");
  const b = bt.dates.findIndex((d) => d > "2022-04-30") - 1;
  const iS = bt.dates.indexOf(g.start);
  const iE = bt.dates.indexOf(g.end);
  const fence: Pt[] = [];
  for (let i = a; i <= b; i++) fence.push([i, bt.fences.historical[i] / 1e5]);
  const before = bt.fences.historical[iS];
  const after = bt.fences.historical[iE];
  // the day that left the window when the fence moved most: the window for day t is t−500 … t−1 in the full record
  const left = (i: number) => DATES[bt.fences.start + i - 500];
  return (
    <div className="e1-still">
      <div className="e1-panel-title">
        <strong>(a) the ghost</strong> <span>the historical fence, Feb–Apr 2022, with each day's loss</span>
      </div>
      <Plot xDomain={[a - 0.5, b + 0.5]} yDomain={[-5, 7]} width={narrow ? 400 : 520} height={narrow ? 220 : 230} margin={{ top: 8, right: 10, bottom: 8, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={a - 0.5} axisY={0} ariaLabel="the historical 99 % fence from February to April 2022 falling from 5.56 lakh to 3.76 lakh while daily losses stay small">
        <MonthTicks dates={bt.dates} a={a} b={b} months={["2022-02-01", "2022-03-01", "2022-04-01"]} names={["Feb", "Mar", "Apr"]} year="2022" />
        <Bars bars={Array.from({ length: b - a + 1 }, (_, j) => ({ x: a + j, y: bt.loss[a + j] / 1e5, w: 0.8 }))} role="ghost" opacity={0.5} gap={0} />
        <Curve pts={fence} role="truth" width={2} smooth={false} />
        <Marker at={[iS, before / 1e5]} role="truth" r={4.5} />
        <Label at={[iS, before / 1e5]} text={`${fmtDay(g.start)}: ${lakh(before)}`} role="truth" dx={8} dy={-8} />
        <Marker at={[iE, after / 1e5]} role="truth" r={4.5} />
        <Label at={[iE, after / 1e5]} text={`${fmtDay(g.end)}: ${lakh(after)}`} role="truth" dx={6} dy={16} />
        <Label at={[b, 6.6]} text={narrow ? "−" + Math.round(100 * (1 - after / before)) + " % in " + g.days_between + " days" : `the fence falls ${Math.round(100 * (1 - after / before))} % in ${g.days_between} trading days`} role="ink" dx={-2} dy={4} anchor="end" />
        
      </Plot>
      <p className="e1-still-cap">
        Nothing happened. Between {fmtDate(g.start)} and {fmtDate(g.end)} the worst day lost {lakh(Math.max(...Array.from(bt.loss.subarray(iS, iE + 1))))}, and the line fell from{" "}
        <strong>{lakh(g.before)}</strong> to <strong>{lakh(g.after)}</strong> — {Math.round(100 * g.drop)} % lower (key). The Feb–Mar 2020 cluster left the 500-day window: on {fmtDate(g.start)} the oldest
        day in the window was {fmtDate(left(iS) ?? "")}; by {fmtDate(g.end)} it was {fmtDate(left(iE) ?? "")}. A rank in a pile remembers exactly 500 days and then forgets, all at once.
      </p>
    </div>
  );
}

function MonthTicks({ dates, a, b, months, names, year }: { dates: string[]; a: number; b: number; months: string[]; names: string[]; year: string }) {
  const { x, inner } = usePlot();
  return (
    <g>
      {months.map((m, k) => {
        const i = dates.findIndex((e, j) => j >= a && j <= b && e >= m);
        if (i < 0) return null;
        return (
          <text key={m} className="label e1-ticklabel" x={x(i) + 2} y={inner.top + inner.height - 4}>
            {names[k]} {year}
          </text>
        );
      })}
    </g>
  );
}

function Desks() {
  const n = 25; // 1 in 25 = 4 %
  const cells = n * n;
  const lossCells = cells - (n - 1) * (n - 1); // 49 of 625: desk A's column, desk B's row, both at the corner
  const S = 9,
    G = 1.5;
  const W = n * (S + G) - G;
  return (
    <div className="e1-still">
      <div className="e1-panel-title">
        <strong>(b) two desks</strong> <span>each loses ₹100 on 1 day in {n} ({(100 * KEY.subadditivity.p).toFixed(0)} %), independently</span>
      </div>
      <div className="e1-desks">
        <div className="e1-desk">
          <svg viewBox={`0 0 ${W} ${S}`} width="100%" role="img" aria-label="desk A: 25 equally likely days, one of them a ₹100 loss">
            {Array.from({ length: n }, (_, i) => (
              <rect key={i} x={i * (S + G)} y={0} width={S} height={S} rx={1} fill={i === 0 ? "var(--error)" : "var(--ghost)"} opacity={i === 0 ? 1 : 0.35} />
            ))}
          </svg>
          <div className="e1-desk-t">
            desk A alone · 95 % VaR <strong>₹{DESKS.eachVaR}</strong> · ES <strong>₹{DESKS.eachES}</strong>
          </div>
        </div>
        <div className="e1-desk">
          <svg viewBox={`0 0 ${W} ${S}`} width="100%" role="img" aria-label="desk B: 25 equally likely days, one of them a ₹100 loss">
            {Array.from({ length: n }, (_, i) => (
              <rect key={i} x={i * (S + G)} y={0} width={S} height={S} rx={1} fill={i === 0 ? "var(--error)" : "var(--ghost)"} opacity={i === 0 ? 1 : 0.35} />
            ))}
          </svg>
          <div className="e1-desk-t">
            desk B alone · 95 % VaR <strong>₹{DESKS.eachVaR}</strong> · ES <strong>₹{DESKS.eachES}</strong>
          </div>
        </div>
        <div className="e1-desk e1-desk-joint">
          <svg viewBox={`0 0 ${W} ${W}`} width="100%" style={{ maxWidth: 220 }} role="img" aria-label="the two desks together: 625 equally likely days laid out as a 25 by 25 grid; 49 of them lose ₹100 or more">
            {Array.from({ length: cells }, (_, k) => {
              const r = Math.floor(k / n),
                c = k % n;
              const both = r === 0 && c === 0;
              const one = r === 0 || c === 0;
              return <rect key={k} x={c * (S + G)} y={r * (S + G)} width={S} height={S} rx={1} fill={one ? "var(--error)" : "var(--ghost)"} opacity={both ? 1 : one ? 0.7 : 0.25} />;
            })}
          </svg>
          <div className="e1-desk-t">
            together · {lossCells} of {cells} days lose ₹100 or more ({f2(100 * DESKS.pJoint)} %) · 95 % VaR <strong>₹{DESKS.jointVaR}</strong> · ES <strong>₹{f1(DESKS.jointES)}</strong>
          </div>
        </div>
      </div>
      <p className="e1-still-cap">
        Each desk alone: a loss on {(100 * KEY.subadditivity.p).toFixed(0)} % of days is rarer than 1 in 20, so the 95 % line sits at <strong>₹{DESKS.eachVaR}</strong>. Put the desks together and{" "}
        {f2(100 * DESKS.pJoint)} % of days lose at least ₹100 — more than 1 in 20 — so the line jumps to <strong>₹{DESKS.jointVaR}</strong>. VaR says the merged desk is riskier than
        the sum of its parts (₹{DESKS.jointVaR} &gt; ₹{DESKS.eachVaR} + ₹{DESKS.eachVaR}). Expected Shortfall does not: ₹{f1(DESKS.jointES)} ≤ ₹{DESKS.eachES} + ₹{DESKS.eachES}. ES adds up;
        VaR need not.
      </p>
    </div>
  );
}

function Outside({ narrow }: { narrow: boolean }) {
  const X: [number, number] = [-24, 5];
  const bell: Pt[] = [];
  for (let z = -6; z <= 5; z += 0.1) bell.push([z, pdf(z)]);
  const yMax = pdf(0) * 1.18;
  const worstZ = -WORST_IN_SD;
  const ticks = useMemo(() => Array.from(PNL, (v) => v / SD).filter((z) => z < -2.33), []);
  const worstHull = -HULL_1987_SD;
  return (
    <div className="e1-still">
      <div className="e1-panel-title">
        <strong>(c) outside the pile</strong> <span>the bell in standard deviations, with the record's worst day and Hull's 1987 day</span>
      </div>
      <Plot xDomain={X} yDomain={[-0.075, yMax]} width={narrow ? 400 : 800} height={narrow ? 220 : 230} margin={{ top: 8, right: 10, bottom: 8, left: 8 }} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={0} ariaLabel="the normal bell with the 1 % line at 2.33 standard deviations, the record's worst day at about 12.8 standard deviations and the 1987 S&P day at 22, both far beyond the curve">
        <SdTicks />
        <Curve pts={bell} role="approx" width={2} />
        <Curve pts={[[-Z99, 0], [-Z99, pdf(Z99) + 0.06]]} role="approx" width={1.2} dash="4 3" smooth={false} />
        <Label at={[-Z99, pdf(Z99) + 0.06]} text={narrow ? `1 % line, ${f2(Z99)} sd` : `the bell's 1 % line, ${f2(Z99)} sd`} role="approx" dx={narrow ? -4 : 4} dy={-4} anchor={narrow ? "end" : "start"} />
        {ticks.map((z, i) => (
          <Curve key={i} pts={[[z, -0.012], [z, -0.04]]} role="error" width={1} smooth={false} />
        ))}
        <Curve pts={[[worstZ, 0], [worstZ, 0.07]]} role="error" width={1} smooth={false} />
        <Marker at={[worstZ, 0]} role="error" r={5} />
        <Label at={[worstZ, 0.07]} text={narrow ? `${fmtDay(DATES[WORST_INDEX])} 2020: ${f1(WORST_IN_SD)} sd (real)` : `${fmtDate(DATES[WORST_INDEX])}: ${lakhSigned(-LOSS[WORST_INDEX])} on ₹1 crore, ${f1(WORST_IN_SD)} sd (real)`} role="error" dx={0} dy={-6} anchor="middle" />
        <Marker at={[worstHull, 0]} role="ink" r={5} />
        <Label at={[worstHull, 0]} text={narrow ? `19 Oct 1987, S&P 500: ${HULL_1987_SD} sd (textbook)` : `19 Oct 1987, S&P 500: ${HULL_1987_SD} standard deviations (textbook, Hull)`} role="ink" dx={-4} dy={-14} anchor="start" />
        <Label at={[X[0], yMax]} text="the bell: a normal of the record's width" role="approx" dx={6} dy={14} />
        <Label at={[-Z99, -0.062]} text={narrow ? "red ticks: real days past 2.33 sd" : `red ticks: the ${ticks.length} real days beyond 2.33 sd`} role="error" dx={-4} dy={4} anchor="end" />
      </Plot>
      <p className="e1-still-cap">
        Under the bell the record's worst day — {fmtDate(DATES[WORST_INDEX])}, {lakhSigned(-LOSS[WORST_INDEX])} on ₹1 crore, {f1(WORST_IN_SD)} standard deviations — is a day the bell gives no
        probability worth writing down; the 1987 S&P 500 day sits at {HULL_1987_SD} (textbook: Hull, Ch. 16). Neither is in any 500-day pile until it happens. Stress tests are the days the pile has never seen:
        you choose them by hand, reprice the book on them, and report the number next to the VaR. Of {N.toLocaleString("en-US")} real days here, {ticks.length} lie beyond the bell's 1 % line against{" "}
        {Math.ceil(0.01 * N)} promised.
      </p>
    </div>
  );
}
function SdTicks() {
  const { x, y } = usePlot();
  return (
    <g>
      {[-20, -15, -10, 0, 5].map((v) => (
        <text key={v} className="label e1-ticklabel" x={x(v)} y={y(0) + 14} textAnchor="middle">
          {v === 0 ? "0" : `${v > 0 ? "+" : "−"}${Math.abs(v)} sd`}
        </text>
      ))}
    </g>
  );
}

export function F3Stills() {
  const narrow = useNarrow();
  return (
    <Figure
      n="3"
      prompt={<>Three things the pile does not know. No controls — look.</>}
      observe={
        <>
          A one-number summary leaves three things out: it forgets (a), it does not add up (b), and it has never seen the day that matters (c). None of these is a caveat; each is a
          picture of what the number is — a rank in a window of past days.
        </>
      }
    >
      <div className="e1-stills">
        <div className="e1-stills-two">
          <Ghost narrow={narrow} />
          <Desks />
        </div>
        <Outside narrow={narrow} />
      </div>
    </Figure>
  );
}
