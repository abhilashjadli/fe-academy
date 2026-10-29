import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Plot, VLine, type Pt } from "../../../ui/Plot";
import { Readouts, Toggle } from "../../../ui/controls";
import { netDebit, positionPayoff, positionProfit, strategies, type Leg } from "../../../engine/options";
import { ATM_K, n0, n2, rowAt, s2 } from "./chain";

const X0 = 22000;
const X1 = 23200;
const CHECK = [22000, 22600, 23200];

type LegId = "longCall" | "shortCall" | "longPut" | "shortPut";

/** Figure 3 — hotspot ④: a shelf of four legs at 22,600. Stack two; the total draws solid; the target is a straight line through the strike. */
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
  const total = (s: number) => (cash ? positionProfit(legs, s) : positionPayoff(legs, s));
  const paid = netDebit(legs);
  const levels = [X0, K, X1];
  const totalPts: Pt[] = levels.map((s) => [s, total(s)]);
  const target: Pt[] = [
    [X0, X0 - K],
    [X1, X1 - K],
  ];
  const isForward = picked.length === 2 && picked.includes("longCall") && picked.includes("shortPut");
  const isShortForward = picked.length === 2 && picked.includes("shortCall") && picked.includes("longPut");

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
          Four contracts at strike {n0(K)}, from the real row: call {n2(row.call)}, put {n2(row.put)}. Put two on the table. The faint straight line is
          the target.
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
        <>
          Long call plus short put is a <strong>straight line</strong>: a forward, built by hand — you must buy at {n0(K)} whatever happens. Two bent
          lines made one straight one. And because the straight line passes through zero at {n0(K)}, call ≈ put here <em>because</em> the index is about
          here.
        </>
      }
    >
      <Plot xDomain={[X0, X1]} yDomain={[-700, 700]} width={600} height={340} xLabel="index on expiry day" yLabel="per unit" xTicks={6} yTicks={6} ariaLabel="Up to two option legs, dashed, and their total, solid, against a straight target line through the strike">
        <VLine at={K} />
        <Curve pts={target} role="ghost" width={1.5} dash="2 5" smooth={false} />
        <Label at={[X1, X1 - K]} text={`target: index − ${n0(K)}`} role="ghost" anchor="end" dx={-6} dy={16} />
        {picked.map((id) => (
          <Curve
            key={id}
            pts={levels.map((s) => [s, (cash ? positionProfit : positionPayoff)(shelf[id].legs, s)] as Pt)}
            role={shelf[id].role}
            width={1.6}
            dash="6 4"
            smooth={false}
          />
        ))}
        {legs.length > 0 && <Curve pts={totalPts} role="ink" width={3} smooth={false} />}
        {picked.map((id, i) => (
          <Label key={id} at={[X0, (cash ? positionProfit : positionPayoff)(shelf[id].legs, X0)]} text={shelf[id].label} role={shelf[id].role} dx={6} dy={i ? 16 : -8} />
        ))}
        {legs.length > 0 && <Label at={[X1 - 240, total(X1 - 240)]} text={isForward ? "a forward, built by hand" : isShortForward ? "a forward, sold" : "total"} anchor="end" dx={-8} dy={-10} />}
      </Plot>
      {picked.length === 0 && <div className="c1-hint">Pick a leg from the shelf. Each leg draws dashed; the total draws solid on top.</div>}
    </Figure>
  );
}
