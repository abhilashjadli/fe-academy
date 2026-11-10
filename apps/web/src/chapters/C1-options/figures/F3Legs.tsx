import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Plot, VLine, usePlot, type Pt, type Role } from "../../../ui/Plot";
import { Readouts, Toggle } from "../../../ui/controls";
import { netDebit, positionPayoff, positionProfit, strategies, type Leg } from "../../../engine/options";
import { ATM_K, n0, n2, rowAt, s2 } from "./chain";

const X0 = 22000;
const X1 = 23200;
const CHECK = [22000, 22600, 23200];

type LegId = "longCall" | "shortCall" | "longPut" | "shortPut";

/** The region between two piecewise-linear curves sampled at the same x's — drawn as straight segments, no smoothing, so a kink stays a kink. */
function Stack({ lower, upper, role }: { lower: Pt[]; upper: Pt[]; role: Role }) {
  const { x, y } = usePlot();
  const [lo, hi] = y.domain();
  const c = (v: number) => Math.max(lo, Math.min(hi, v));
  const d =
    upper.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)} ${y(c(p[1])).toFixed(1)}`).join(" ") +
    " " +
    lower
      .slice()
      .reverse()
      .map((p) => `L${x(p[0]).toFixed(1)} ${y(c(p[1])).toFixed(1)}`)
      .join(" ") +
    " Z";
  return <path className={`band ${role}`} d={d} />;
}

/**
 * Figure 3 — hotspot ④: a shelf of four legs at 22,600. Stack two tip-to-tail: the first leg stands on the axis, the second is drawn
 * from the first leg's value at every index level, so the solid total is visibly assembled from two bends. The target is a straight line.
 */
export function F3Legs() {
  const row = rowAt(ATM_K);
  const K = row.K;
  const shelf = useMemo(
    () =>
      ({
        longCall: { label: "long call", legs: strategies.longCall(K, row.call), role: "truth" as const, cash: -row.call },
        shortCall: { label: "short call", legs: strategies.shortCall(K, row.call), role: "truth" as const, cash: row.call },
        longPut: { label: "long put", legs: strategies.longPut(K, row.put), role: "error" as const, cash: -row.put },
        shortPut: { label: "short put", legs: strategies.shortPut(K, row.put), role: "error" as const, cash: row.put },
      }) satisfies Record<LegId, { label: string; legs: Leg[]; role: "truth" | "error"; cash: number }>,
    [K, row.call, row.put],
  );
  const [picked, setPicked] = useState<LegId[]>([]);
  const [cash, setCash] = useState(false);

  const legs: Leg[] = picked.flatMap((id) => shelf[id].legs);
  const value = cash ? positionProfit : positionPayoff;
  const total = (s: number) => value(legs, s);
  const paid = netDebit(legs);
  // the kink is at K; a point either side of it keeps the segments straight through the strike
  const levels = [X0, K, X1];
  const totalPts: Pt[] = levels.map((s) => [s, total(s)]);
  const zero: Pt[] = levels.map((s) => [s, 0]);
  const target: Pt[] = [
    [X0, X0 - K],
    [X1, X1 - K],
  ];
  // tip to tail: leg 1 from the axis; leg 2 from the top of leg 1
  const first = picked[0];
  const second = picked[1];
  const firstPts: Pt[] = first ? levels.map((s) => [s, value(shelf[first].legs, s)]) : [];
  const isForward = picked.length === 2 && picked.includes("longCall") && picked.includes("shortPut");
  const isShortForward = picked.length === 2 && picked.includes("shortCall") && picked.includes("longPut");
  const two = picked.length === 2;
  // where to label the second leg: the side of the strike where its band is thickest
  const secondAt = second ? (Math.abs(value(shelf[second].legs, X0)) >= Math.abs(value(shelf[second].legs, X1)) ? X0 + 120 : X1 - 120) : K;

  const toggle = (id: LegId) => {
    if (picked.includes(id)) setPicked(picked.filter((p) => p !== id));
    else if (picked.length < 2) setPicked([...picked, id]);
    else setPicked([picked[1], id]);
  };

  return (
    <Figure
      n="3"
      prompt={
        <>
          Four contracts at strike {n0(K)}, from the real row: call {n2(row.call)}, put {n2(row.put)}. Put two on the table: the second is stacked on
          top of the first, tip to tail. The faint straight line is the target.
        </>
      }
      controls={
        <>
          <span className="ctl">
            <span className="ctl-label">shelf (pick two)</span>
            <span className="c1-shelf" role="group">
              {(Object.keys(shelf) as LegId[]).map((id) => (
                <button key={id} type="button" className={"btn c1-leg " + shelf[id].role + (picked.includes(id) ? " on" : "")} aria-pressed={picked.includes(id)} onClick={() => toggle(id)}>
                  {shelf[id].label}
                </button>
              ))}
            </span>
          </span>
          <Toggle label={cash ? `cash today: ${s2(-paid)}` : "add the cash paid today"} on={cash} onChange={setCash} />
          <Readouts items={CHECK.map((s) => [`total at ${n0(s)}`, legs.length ? s2(total(s)) : "—"])} />
        </>
      }
      observe={
        two ? (
          isForward || isShortForward ? (
            <>
              {isForward ? "Long call plus short put" : "Short call plus long put"} is a <strong>straight line</strong>: a forward, built by hand — you
              must {isForward ? "buy" : "sell"} at {n0(K)} whatever happens. Two bent lines made one straight one: each leg is flat on one side of the
              strike, and the other leg's bend fills exactly that side. And because the straight line passes through zero at {n0(K)}, call ≈ put here{" "}
              <em>because</em> the index is about here.
            </>
          ) : (
            <>
              The shaded band is the second leg, stood on top of the first. Bent lines add: the solid total is the top of the stack. Try a long call with
              a short put — the two bends are on opposite sides of {n0(K)}, and the stack comes out straight.
            </>
          )
        ) : (
          <>Pick two legs. The first stands on the axis; the second is drawn from the top of the first, so you can watch the total being assembled.</>
        )
      }
    >
      <Plot xDomain={[X0, X1]} yDomain={[-700, 700]} width={600} height={340} xLabel="index on expiry day" yLabel="per unit" xTicks={6} yTicks={6} ariaLabel="Up to two option legs stacked tip to tail — the first from the axis, the second from the first — and their total, solid, against a straight target line through the strike">
        <VLine at={K} />
        <Curve pts={target} role="ghost" width={1.5} dash="2 5" smooth={false} />
        <Label at={[X1, 60]} text={`target: index − ${n0(K)} (faint dashes)`} role="ghost" anchor="end" dx={-6} dy={0} />
        {first && <Stack lower={zero} upper={firstPts} role={shelf[first].role} />}
        {first && second && <Stack lower={firstPts} upper={totalPts} role={shelf[second].role} />}
        {first && <Curve pts={firstPts} role={shelf[first].role} width={1.6} dash="6 4" smooth={false} />}
        {legs.length > 0 && <Curve pts={totalPts} role="ink" width={3} smooth={false} />}
        {first && <Label at={[X0, value(shelf[first].legs, X0)]} text={shelf[first].label} role={shelf[first].role} dx={6} dy={-8} />}
        {first && second && (
          <Label
            at={[secondAt, (value(shelf[first].legs, secondAt) + total(secondAt)) / 2]}
            text={`${shelf[second].label}, on top`}
            role={shelf[second].role}
            anchor="middle"
            dx={0}
            dy={4}
          />
        )}
        {legs.length > 0 && <Label at={[X1 - 240, total(X1 - 240)]} text={isForward ? "a forward, built by hand" : isShortForward ? "a forward, sold" : "total"} anchor="end" dx={-8} dy={-10} />}
      </Plot>
      {picked.length === 0 && <div className="c1-hint">Pick a leg from the shelf. The first draws dashed from the axis; the second stacks on it; the total draws solid on top.</div>}
    </Figure>
  );
}
