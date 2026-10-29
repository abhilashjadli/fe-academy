import "./figures.css";
import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough, type Step } from "../../../ui/StepThrough";
import { Bars, Curve, Label, Plot, VLine, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { callFloorArbitrage, callPayoff, intrinsicValue, noArbitrageBounds, putFloorArbitrage, putPayoff, timeValue } from "../../../engine/options";
import { ATM_K, SPOT_INFERRED, n0, n2, rows } from "./chain";

const X0 = 22000;
const X1 = 23300;
const Y1 = 620;
const BAR_W = 46;

/** Figure 2 — hotspots ② and ③: walk down the column. The bent line slides; each price bar splits into "already in it" and "the rest". */
export function F2Column() {
  const S = SPOT_INFERRED;
  const steps: Step[] = useMemo(
    () =>
      rows.map((r, i) => {
        const ci = intrinsicValue("call", S, r.K);
        const cr = timeValue("call", S, r.K, r.call);
        const pi = intrinsicValue("put", S, r.K);
        const pr = timeValue("put", S, r.K, r.put);
        let caption: string;
        if (i === 0)
          caption = `Strike ${n0(r.K)}, well below the index. The call costs ${n2(r.call)}, and ${n2(ci)} of it is already in it: used today, the right to buy at ${n0(r.K)} is worth ${n0(S)} − ${n0(r.K)}. The rest, ${n2(cr)}, you pay for not knowing yet. The put is all "rest".`;
        else if (r.K === ATM_K)
          caption = `The index is about here. Almost nothing is in either option; both prices are nearly all "the rest" — and they are nearly equal, ${n2(r.call)} against ${n2(r.put)}. This is the row you will rebuild.`;
        else if (i === rows.length - 1)
          caption = `Past the index the whole call bar is "the rest": ${n2(r.call)} for a right that is worth nothing used today. That is the price of uncertainty, not of time — a right you cannot use yet still sells. The put mirrors it: ${n2(pi)} in it, ${n2(pr)} the rest.`;
        else if (r.K < S)
          caption = `Strike ${n0(r.K)}. Call ${n2(r.call)} = ${n2(ci)} already in it + ${n2(cr)} the rest. Less is in it than one row up, so the call is cheaper; the put, ${n2(r.put)}, is still all "rest" and a little dearer.`;
        else
          caption = `Strike ${n0(r.K)}, above the index. The call, ${n2(r.call)}, is all "rest" now. The put has ${n2(pi)} in it (sell at ${n0(r.K)} what is worth ${n0(S)}) and ${n2(pr)} the rest.`;
        return { caption };
      }),
    [S],
  );

  return (
    <Figure
      n="2"
      prompt={
        <>
          Walk down the column, {n0(rows[0].K)} to {n0(rows[rows.length - 1].K)}. The index is inferred from the chain, ≈ {n0(S)}; each price bar is
          split at the bent line.
        </>
      }
      observe={
        <>
          The call's price falls with strike because less of it is already in the money. Past the index the whole bar is "the rest" — you pay it for
          what the index might still do. The bent line is the <strong>floor</strong>: no option trades below what using it today is worth.
        </>
      }
    >
      <StepThrough steps={steps} render={(i) => <Body i={i} S={S} />} />
      <details className="c1-more">
        <summary>If someone breaks the floor (Hull's two tables, in his numbers)</summary>
        <FloorTables />
      </details>
    </Figure>
  );
}

function Body({ i, S }: { i: number; S: number }) {
  const r = rows[i];
  const K = r.K;
  const ci = intrinsicValue("call", S, K);
  const cr = timeValue("call", S, K, r.call);
  const pi = intrinsicValue("put", S, K);
  const pr = timeValue("put", S, K, r.put);
  const callLine: Pt[] = [
    [X0, callPayoff(X0, K)],
    [K, 0],
    [X1, callPayoff(X1, K)],
  ];
  const putLine: Pt[] = [
    [X0, putPayoff(X0, K)],
    [K, 0],
    [X1, putPayoff(X1, K)],
  ];
  // the option with something "in it" stands exactly on the index line, so its split sits on the bent line; the other steps aside
  const xc = ci > 0 ? S : S - BAR_W * 1.2;
  const xp = pi > 0 ? S : S + BAR_W * 1.2;
  const floorAt = K + 350 <= X1 ? ([K + 350, callPayoff(K + 350, K)] as Pt) : ([K - 350, putPayoff(K - 350, K)] as Pt);
  const floorOnCall = K + 350 <= X1;
  return (
    <div>
      <Plot xDomain={[X0, X1]} yDomain={[0, Y1]} width={480} height={290} xLabel="index on expiry day · per unit" xTicks={5} yTicks={4} ariaLabel="Call and put payoff lines at the current strike, with the two price bars split at the lines">
        <Curve pts={[[X0, Y1 - 6], [X1, Y1 - 6]]} role="ghost" width={1} dash="2 4" smooth={false} />
        <Label at={[X0, Y1 - 6]} text={`ceiling = the index itself (${n0(S)}), far above this scale`} dx={6} dy={14} />
        <VLine at={S} />
        <Curve pts={putLine} role="error" width={1.5} dash="5 4" smooth={false} />
        <Curve pts={callLine} role="truth" width={2.5} smooth={false} />
        <Bars bars={[{ x: xc, y: ci, w: BAR_W }]} role="truth" opacity={0.95} />
        <Bars bars={[{ x: xc, y: r.call, y0: ci, w: BAR_W }]} role="truth" opacity={0.3} />
        <Bars bars={[{ x: xp, y: pi, w: BAR_W }]} role="error" opacity={0.95} />
        <Bars bars={[{ x: xp, y: r.put, y0: pi, w: BAR_W }]} role="error" opacity={0.3} />
        <Label at={[xc, r.call]} text={`call ${n2(r.call)}`} role="truth" anchor="end" dx={-4} dy={-6} />
        <Label at={[xp, r.put]} text={`put ${n2(r.put)}`} role="error" anchor="start" dx={4} dy={-6} />
        {Math.abs(K - S) < 90 ? <Label at={[K, 548]} text={`strike ${n0(K)}`} anchor="middle" dx={0} dy={0} /> : <Label at={[K, 0]} text={`strike ${n0(K)}`} anchor="middle" dx={0} dy={-8} />}
        <Label at={[S, 440]} text={`index ≈ ${n0(S)}`} dx={6} dy={0} />
        <Label at={floorAt} text="floor = payoff line" role={floorOnCall ? "truth" : "error"} anchor={floorOnCall ? "start" : "end"} dx={floorOnCall ? 8 : -8} dy={14} />
      </Plot>
      <div className="c1-split">
        <Readouts
          items={[
            [
              "call",
              <>
                <span className="c1-in">{n2(ci)} in it</span> + <span className="c1-rest">{n2(cr)} the rest</span>
              </>,
            ],
            [
              "put",
              <>
                <span className="c1-in err">{n2(pi)} in it</span> + <span className="c1-rest">{n2(pr)} the rest</span>
              </>,
            ],
            ["strike vs index", K < S ? `${n0(S - K)} below` : K > S ? `${n0(K - S)} above` : "at it"],
          ]}
        />
      </div>
    </div>
  );
}

function FloorTables() {
  const cb = noArbitrageBounds(20, 18, 0.1, 1);
  const ca = callFloorArbitrage(20, 18, 0.1, 1, 3, 17);
  const pb = noArbitrageBounds(37, 40, 0.05, 0.5);
  const pa = putFloorArbitrage(37, 40, 0.05, 0.5, 1, 42);
  return (
    <div className="c1-floor">
      <p>
        With interest, the floor moves a little: a call can never be worth less than the stock minus the <em>discounted</em> strike. Stock 20, strike
        18, 10 % a year, one year: floor {n2(cb.callLower)}. Offer the call at 3.00 and someone shorts the stock, buys your call, and invests the{" "}
        {n2(ca.invested)} left over; it grows to {n2(ca.growsTo)}.
      </p>
      <div className="c1-scroll">
        <table className="table c1-table">
          <thead>
            <tr>
              <th>on expiry day</th>
              <th>stock ends above 18</th>
              <th>stock ends at 17</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>close the short</td>
              <td>use the call: pay 18</td>
              <td>buy back at 17</td>
            </tr>
            <tr>
              <td>left over, whatever happens</td>
              <td className="num">{n2(ca.profitExercise)}</td>
              <td className="num">{n2(ca.profitLow)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        A put's floor is the discounted strike minus the stock. Stock 37, strike 40, 5 %, six months: floor {n2(pb.putLower)}. Offer the put at 1.00 and
        someone borrows {n2(pa.borrowed)} to buy the stock and your put, owing {n2(pa.repay)} at expiry.
      </p>
      <div className="c1-scroll">
        <table className="table c1-table">
          <thead>
            <tr>
              <th>on expiry day</th>
              <th>stock ends below 40</th>
              <th>stock ends at 42</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>what the stock fetches</td>
              <td>use the put: 40</td>
              <td>sell it: 42</td>
            </tr>
            <tr>
              <td>left over after repaying, whatever happens</td>
              <td className="num">{n2(pa.profitExercise)}</td>
              <td className="num">{n2(pa.profitHigh)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
