import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Label } from "../../../ui/Plot";
import { ROW, STRIP, n0, pct1 } from "./d2";
import { StripDots, StripLegend, StripPlot } from "./strip";
import "./figures.css";

/**
 * Figure 0 — the artefact. C3 Figure 4's finished strip, redrawn clean: the 17 strikes of the real 23 Oct chain, calls and puts,
 * each one's implied wobble solved at the chain's own forward (22,603). One bet, no controls.
 */

type Pick = "low" | "high" | "neither";
const I_LO = 0,
  I_HI = STRIP.strikes.length - 1;

export function F0Strip() {
  const [pick, setPick] = useBet<Pick>("D2-F0");
  const said = pick === "low" ? `the traders at ${n0(STRIP.strikes[I_LO])}` : pick === "high" ? `the traders at ${n0(STRIP.strikes[I_HI])}` : "neither";
  return (
    <Figure
      n="0"
      prompt={
        <>
          The real screen of 23 October, translated: seventeen strikes, calls and puts, each one's price turned back into the one wobble that prints it. Same index, same day,
          same {ROW.days} days to expiry. The dots do not agree.
        </>
      }
      observe={
        <>
          <strong>{pct1(STRIP.call_iv[I_LO])}</strong> at {n0(STRIP.strikes[I_LO])} sloping to <strong>{pct1(STRIP.call_iv[I_HI])}</strong> at {n0(STRIP.strikes[I_HI])}; the calls and the puts sit on one
          curve, as C1's law says they must. Every dot is a quote in the formula's language. The index can only wobble one way over eleven days — so the list of wobbles is
          not a list of forecasts.
        </>
      }
    >
      <div className="d2-stage">
        <StripPlot ariaLabel="Implied volatility against strike for the 17 real rows of the 23 October chain: calls as blue dots and puts as red diamonds, sloping from 17.0 % at 22,250 to 15.5 % at 23,050, with the forward marked at 22,603">
          <StripDots />
          <Label at={[STRIP.strikes[I_LO], STRIP.call_iv[I_LO]]} text={pct1(STRIP.call_iv[I_LO])} dx={8} dy={-8} />
          <Label at={[STRIP.strikes[I_HI], STRIP.call_iv[I_HI]]} text={pct1(STRIP.call_iv[I_HI])} dx={-8} dy={-9} anchor="end" />
        </StripPlot>
        <StripLegend extra={<span className="d2-legend-note">NSE NIFTY chain, 23 Oct 2026, expiry 3 Nov (real)</span>} />
        <Bet
          question={
            <>
              The {n0(STRIP.strikes[I_LO])} call is priced at a {pct1(STRIP.call_iv[I_LO])} wobble, the {n0(STRIP.strikes[I_HI])} call at {pct1(STRIP.call_iv[I_HI])}. Who is wrong?
            </>
          }
          options={[
            { id: "low", label: `the traders at ${n0(STRIP.strikes[I_LO])}` },
            { id: "high", label: `the traders at ${n0(STRIP.strikes[I_HI])}` },
            { id: "neither", label: "neither" },
          ]}
          pick={pick}
          onPick={setPick}
        >
          <ResultCard yours={said} answer="neither — the formula is" verdict={pick === "neither" ? "right" : "miss"}>
            Natenberg: the marketplace "does not think the model is one hundred percent efficient" — and the curve is the list of where. The formula was never a belief about the
            index; it is the language the prices are compared in. Translate a screen and the translation disagrees with itself. The disagreement is the information, and the
            first place it comes from is the index's own record.
          </ResultCard>
        </Bet>
      </div>
    </Figure>
  );
}
