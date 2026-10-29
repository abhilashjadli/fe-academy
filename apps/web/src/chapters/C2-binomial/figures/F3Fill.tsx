import { useMemo, useState } from "react";
import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { Readouts, Segmented, Toggle } from "../../../ui/controls";
import { MiniBoard } from "../../0.2-normal/MiniBoard";
import { binomialTree, payoff, type TreeResult } from "../../../engine/binomial";
import "./figures.css";

/**
 * Figure 3 — two rows, and the American toggle. The board grows a second row (24.2 / 19.8 / 16.2); press Forward and the last column
 * takes the payoff, then each parent lights with its two children and becomes their discounted weighted average, down to the root.
 * Hull's put (K = 52 on a 50-stock, two one-year steps, ±20 %, 5 %) and the American toggle use the same fill with one extra question per node.
 */

type Which = "call" | "put";
const CALL = { S0: 20, K: 21, r: 0.12, dt: 0.25, steps: 2, u: 1.1, d: 0.9, kind: "call" as const };
const PUT = { S0: 50, K: 52, r: 0.05, dt: 1, steps: 2, u: 1.2, d: 0.8, kind: "put" as const };
const f4 = format(".4f");
const f2 = format(".2f");
const fS = format(".4~g"); // 24.2, 19.8, 16.2, 72, 48, 32

/** which engine node (i, j = down-moves) sits at board position (r, k = right bounces) */
const node = (r: number, k: number) => ({ i: r, j: r - k });

export function F3Fill() {
  const [which, setWhich] = useState<Which>("call");
  const [american, setAmerican] = useState(false);
  const input = which === "call" ? CALL : PUT;
  const t: TreeResult = useMemo(() => binomialTree({ ...input, american }), [input, american]);
  const S = (r: number, k: number) => t.S[node(r, k).i][node(r, k).j];
  const V = (r: number, k: number) => t.V[node(r, k).i][node(r, k).j];
  const ex = (r: number, k: number) => t.exercised[node(r, k).i][node(r, k).j];
  const D = (r: number, k: number) => t.delta[node(r, k).i][node(r, k).j];
  const cont = (r: number, k: number) => t.continuation[node(r, k).i][node(r, k).j];
  const pay = (S: number) => payoff(input.kind, S, input.K);
  const disc = Math.exp(-input.r * input.dt);

  // the fill, one node per step: terminal, B (22 / 60), C (18 / 40), root
  const order: Array<[number, number]> = [
    [1, 1],
    [1, 0],
    [0, 0],
  ];
  const K = input.K;
  const name = which === "call" ? "the right to buy at 21" : "the right to sell at 52";
  const period = which === "call" ? "a quarter at 12 %" : "a year at 5 %";
  const avg = (r: number, k: number) => `${f4(t.p)} × ${f4(V(r + 1, k + 1))} + ${f4(1 - t.p)} × ${f4(V(r + 1, k))}`;

  const steps = [
    {
      caption: (
        <>
          A second row. {which === "call" ? "20 goes to 22 or 18; each of those goes up 10 % or down 10 % again" : "50 goes to 60 or 40; each of those goes up 20 % or down 20 % again"}: three prices at the end, five nodes in all. The ticket is {name}. Press Forward to fill the board from the right.
        </>
      ),
    },
    {
      caption: (
        <>
          The last column takes the payoff — the ticket is worth exactly what it pays there: <span className="num">{[2, 1, 0].map((k) => fS(pay(S(2, k)))).join(" / ")}</span>. No averaging yet.
        </>
      ),
    },
    ...order.map(([r, k]) => {
      const exercised = ex(r, k);
      return {
        caption: (
          <>
            Node <strong>{fS(S(r, k))}</strong> lights with its two children. Average them with the weight {f4(t.p)} (the weight from Figure 2, for this board), then discount {period}: <span className="num">{disc.toFixed(4)} × ({avg(r, k)}) = {f4(cont(r, k))}</span>.
            {exercised ? (
              <>
                {" "}
                <span className="c2-error">
                  But selling now at 52 pays {f2(pay(S(r, k)))}, more than {f4(cont(r, k))} for waiting — the node turns red and takes {f2(V(r, k))}.
                </span>
              </>
            ) : american ? (
              <> Exercising now would pay {f2(pay(S(r, k)))}; waiting is worth more, so the node keeps {f4(V(r, k))}.</>
            ) : null}{" "}
            The hedge here is <span className="num">{f4(Math.abs(D(r, k)))}</span> shares{D(r, k) < 0 ? " (sold short)" : ""}.
            {r === 0 && <> This is the price today: <strong className="num">{f4(t.price)}</strong>.</>}
          </>
        ),
      };
    }),
  ];

  return (
    <Figure
      n="3"
      prompt={<>The board grows a second row. Fill it from the right: every node is the discounted weighted average of its two children.</>}
      controls={
        <>
          <Segmented
            label="ticket"
            value={which}
            onChange={(v) => setWhich(v)}
            options={[
              { id: "call", label: "textbook call: buy at 21 on a 20-stock" },
              { id: "put", label: "textbook put: sell at 52 on a 50-stock" },
            ]}
          />
          <Toggle label="American — may exercise early" on={american} onChange={setAmerican} />
        </>
      }
      observe={
        <>
          Backward induction is "average your children, step left". The hedge changes at every node — 0.5064 shares at the root, 0.7273 or 0 one step later — so the copy is rebuilt as the price moves. An American ticket is the same fill with one extra question per node: is cashing in now worth more than waiting?
        </>
      }
    >
      <StepThrough
        key={which + (american ? "-am" : "")}
        steps={steps}
        render={(i) => {
          // which nodes are filled after step i: i=1 terminal; i=2 adds B; i=3 adds C; i=4 adds root
          const filled = (r: number, k: number) => (r === 2 ? i >= 1 : r === 1 && k === 1 ? i >= 2 : r === 1 && k === 0 ? i >= 3 : i >= 4);
          const litParent = i >= 2 && i <= 4 ? order[i - 2] : null;
          const isLit = (r: number, k: number) => !!litParent && ((r === litParent[0] && k === litParent[1]) || (r === litParent[0] + 1 && (k === litParent[1] || k === litParent[1] + 1)));
          const lp = litParent;
          return (
            <div className="c2-stage c2-stage-col">
              <MiniBoard
                rows={2}
                width={440}
                height={400}
                bucketLabels="none"
                ariaLabel="A two-row price board being filled from the right"
                nodeLabel={(r, k) => [fS(S(r, k)), filled(r, k) ? (r === 2 ? "pays " + fS(V(r, k)) : f4(V(r, k))) : "·"]}
                nodeState={(r, k) => (filled(r, k) && ex(r, k) ? "hot" : isLit(r, k) ? "lit" : filled(r, k) ? undefined : "dim")}
                edges={(r, k) => ({ opacity: lp && r === lp[0] && k === lp[1] ? 0.9 : 0.25 })}
              />
              <div className="c2-under">
                <Readouts
                  items={[
                    ["price today (root)", <span className="c2-truth num">{i >= 4 ? f4(t.price) : "—"}</span>],
                    ["lit node", <span className="num">{lp ? `${fS(S(lp[0], lp[1]))} → ${f4(V(lp[0], lp[1]))}` : "—"}</span>],
                    ["shares to hold there", <span className="num">{lp ? f4(D(lp[0], lp[1])) : "—"}</span>],
                  ]}
                />
                <div className="footnote c2-footnote">
                  Weight {f4(t.p)} = (e^({input.r} × {input.dt}) − {input.d}) / ({input.u} − {input.d}). {which === "call" ? "The book rounds along the way and prints 2.0257 and 1.2823." : american ? "The book prints 12 at the red node and 5.0894 at the root." : "The book prints 1.4147, 9.4636 and 4.1923."}
                  {" "}K = {K}.
                </div>
              </div>
            </div>
          );
        }}
      />
    </Figure>
  );
}
