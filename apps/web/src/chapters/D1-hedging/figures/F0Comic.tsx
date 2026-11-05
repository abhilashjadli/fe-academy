import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Bet, useBet } from "../../../ui/Bet";
import { Comic, Panel } from "../../../ui/Comic";
import { CLOCK_DAY, G0, POS, WEEK, bendOn, indian, lakh, n0, n1, n2, pct1, rs, short, shortSigned } from "./week";

/**
 * Figure 0 — three panels and the bet. Friday's blotter; Natenberg's race (the clock against the bend, the model as
 * referee); Monday's screen with the desk's explain line. One control: the bet, settled in Figure 1.
 */

export type Pick = "ahead" | "behind" | "within";
export const PICK_LABEL: Record<Pick, string> = {
  ahead: "ahead of it",
  behind: "behind it",
  within: "within a few thousand of it",
};

const MON = WEEK.rows[1];
const FRI = WEEK.rows[0];
const RESID = MON.exactDay - MON.clock - MON.bend;

export function F0Comic() {
  const [pick, setPick] = useBet<Pick>("D1-F0");
  const deltaUnits = -POS.units * G0.delta;
  return (
    <Figure
      n="0"
      prompt={
        <>
          Friday 23 October, 15:30. Raj has sold {POS.lots} lots of the NIFTY 22,600 call and bought the slope against it. Three screens: what he holds,
          the race he has entered, and Monday's verdict.
        </>
      }
      observe={
        <>
          Collect smooth, pay lumpy, re-balance after the move. The clock pays Raj the same {rs(CLOCK_DAY)} every calendar day; the bend charges him
          only when the index moves, and charges the <em>square</em> of the move. Monday was 153 points and three days of clock. The whole week is seven
          more screens — and the question is not whether Raj wins, it is whether his ledger ends where the clock-minus-bend arithmetic says it should.
        </>
      }
    >
      <div className="d1-comic">
        <Comic cols={3}>
          <Panel n={1} caption={<>Friday's blotter. Short {POS.lots} lots; long {indian(Math.round(deltaUnits))} index units against them — {n2(G0.delta)} of a lot per call; {lakh(POS.premium, 1)} in.</>}>
            <div className="d1-screen" role="img" aria-label="Raj's blotter on Friday evening">
              <div className="d1-screen-head">
                <span>BLOTTER</span>
                <span>FRI 23 OCT</span>
              </div>
              <div className="d1-screen-row">
                <span className="k">22600 CE 3 NOV</span>
                <span className="v dn">−{POS.lots} lots</span>
              </div>
              <div className="d1-screen-row">
                <span className="k">sold at</span>
                <span className="v">{n2(FRI.value)} × {indian(-POS.units)}</span>
              </div>
              <div className="d1-screen-row">
                <span className="k">premium in</span>
                <span className="v up">{rs(POS.premium)}</span>
              </div>
              <div className="d1-screen-sep" />
              <div className="d1-screen-row">
                <span className="k">NIFTY index</span>
                <span className="v up">+{indian(Math.round(deltaUnits))} units</span>
              </div>
              <div className="d1-screen-row">
                <span className="k">slope hedged</span>
                <span className="v">{n1(deltaUnits / POS.lot)} lots</span>
              </div>
              <div className="d1-screen-row">
                <span className="k">index close</span>
                <span className="v">{n0(FRI.close)}</span>
              </div>
            </div>
          </Panel>

          <Panel
            n={2}
            caption={
              <>
                The race. <span className="d1-truth">The clock</span> pays Raj {rs(CLOCK_DAY)} a day, every day. <span className="d1-approx">The bend</span> charges
                him ½ × bend × move²: {short(-bendOn(100))} on a 100-point day, {short(-bendOn(300))} on a 300-point day. The model is the referee, and its card says{" "}
                <strong>{pct1(POS.sigmaSold)}</strong>.
              </>
            }
          >
            <Race />
          </Panel>

          <Panel n={3} caption={<>Monday's screen. The index {shortMove(MON.dS)}. The desk's explain line: theta {short(MON.clock / MON.dtDays)} × {MON.dtDays} days, gamma {short(MON.bend)}, residual {shortSigned(RESID)}.</>}>
            <div className="d1-screen" role="img" aria-label="Monday's P&L screen">
              <div className="d1-screen-head">
                <span>P&L EXPLAIN</span>
                <span>MON 26 OCT</span>
              </div>
              <div className="d1-screen-big">
                {n2(MON.close)}
                <small>
                  {MON.dS > 0 ? "+" : "−"}
                  {n1(Math.abs(MON.close - FRI.close))}
                </small>
              </div>
              <div className="d1-screen-row">
                <span className="k">theta × {MON.dtDays} d</span>
                <span className="v up">{shortSigned(MON.clock)}</span>
              </div>
              <div className="d1-screen-row">
                <span className="k">gamma, {n0(Math.abs(MON.dS))} pts</span>
                <span className="v dn">{shortSigned(MON.bend)}</span>
              </div>
              <div className="d1-screen-row">
                <span className="k">residual</span>
                <span className="v">{shortSigned(RESID)}</span>
              </div>
              <div className="d1-screen-sep" />
              <div className="d1-screen-row">
                <span className="k">day, hedged</span>
                <span className={"v " + (MON.exactDay >= 0 ? "up" : "dn")}>{shortSigned(MON.exactDay)}</span>
              </div>
              <div className="d1-screen-row">
                <span className="k">re-hedge</span>
                <span className="v">buy {n1(MON.tradeLots)} lots</span>
              </div>
            </div>
          </Panel>
        </Comic>
        <div className="d1-f0-bet">
          <Bet<Pick>
            question={<>Over the whole week to expiry, hedged once a day, Raj ends up — against the clock-minus-bend arithmetic —</>}
            options={[
              { id: "ahead", label: PICK_LABEL.ahead },
              { id: "behind", label: PICK_LABEL.behind },
              { id: "within", label: PICK_LABEL.within },
            ]}
            pick={pick}
            onPick={setPick}
          >
            <div className="d1-bet-held">Bet held. It is settled in Figure 1, one real day at a time.</div>
          </Bet>
        </div>
      </div>
    </Figure>
  );
}

function shortMove(dS: number) {
  return `${dS > 0 ? "+" : "−"}${n0(Math.abs(dS))}`;
}

/** Natenberg's race: two lanes, two runners, the referee with the card. */
function Race() {
  return (
    <svg className="d1-race" viewBox="0 0 320 200" role="img" aria-label="Two runners on a track, the clock and the bend, with a referee holding a card that reads 15.9 %">
      {/* lanes */}
      <rect className="lane" x="8" y="18" width="236" height="72" rx="36" />
      <rect className="lane" x="8" y="106" width="236" height="72" rx="36" />
      <text className="lane-t" x="26" y="42" fill="var(--truth-text)">
        the clock
      </text>
      <text className="lane-s" x="26" y="78">
        {rs(CLOCK_DAY)} a day, rain or shine
      </text>
      <text className="lane-t" x="26" y="130" fill="var(--approx-text)">
        the bend
      </text>
      <text className="lane-s" x="26" y="166">
        ½ × bend × move² — only when it moves
      </text>
      {/* the clock runner: even stride */}
      <g className="runner" stroke="var(--truth)" transform="translate(186 36)">
        <circle cx="0" cy="0" r="5" />
        <path d="M0 5 L0 20 M0 9 L-8 15 M0 9 L8 15 M0 20 L-7 32 M0 20 L7 32" />
      </g>
      <path d="M156 52 h16 M156 58 h12" stroke="var(--truth)" strokeWidth="1.2" opacity="0.5" />
      {/* the bend runner: a lunge */}
      <g className="runner" stroke="var(--approx)" transform="translate(206 124)">
        <circle cx="0" cy="0" r="5" />
        <path d="M0 5 L-4 20 M0 9 L-12 10 M0 9 L10 16 M-4 20 L-16 28 M-4 20 L8 32" />
      </g>
      <path d="M164 138 h22 M170 144 h14 M176 150 h10" stroke="var(--approx)" strokeWidth="1.2" opacity="0.5" />
      {/* the referee */}
      <g transform="translate(274 76)">
        <circle cx="0" cy="0" r="9" fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M0 9 L0 44 M0 18 L-12 30 M0 18 L14 10 M0 44 L-8 66 M0 44 L8 66" stroke="var(--ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect className="card" x="8" y="-10" width="40" height="26" rx="2" />
        <text className="card-t" x="28" y="4" textAnchor="middle">
          {pct1(POS.sigmaSold)}
        </text>
        <text className="card-s" x="28" y="13" textAnchor="middle">
          sold at
        </text>
        <text className="card-s" x="0" y="78" textAnchor="middle">
          the model
        </text>
      </g>
    </svg>
  );
}
