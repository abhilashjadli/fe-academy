import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Ledger } from "../../../ui/Ledger";
import { Curve, HLine, Label, type Pt } from "../../../ui/Plot";
import { DATES, EWMA94, JUNE4, R, RV25, RV250, SQ, movePct, niceDate, useNarrow, varPct2, volPct, toPct2 } from "./a5";
import { setClock, useClock } from "./clock";
import { Shade, TwoPictures, levelPts } from "./pictures";
import "./figures.css";

/**
 * Figure 3 — annotated real artefact + ledger: the day the limit was wrong. The clock stands on 4 June 2024 (−6.1 %, the
 * election count). Three numbers, one ledger row each: the trailing year, the bucket the night before, the bucket after.
 * The reader guesses which was closest to the next 25 days; the result card says what they realised and why the bucket
 * needs a home. One control: the button that sets the clock. Every number is the engine's on the real series.
 */

type Pick = "year" | "before" | "after";
const WIN: [number, number] = [JUNE4 - 45, JUNE4 + 46];

export function F3June() {
  const i = useClock();
  const [pick, setPick] = useBet<Pick>("A5-F3");
  const narrow = useNarrow();
  const yearVol = Math.sqrt(RV250[JUNE4 - 1]);
  const before = Math.sqrt(EWMA94[JUNE4]);
  const after = Math.sqrt(EWMA94[JUNE4 + 1]);
  const realised = Math.sqrt(RV25[JUNE4 + 25]); // the 25 days after the 4th
  const cands = { year: yearVol, before, after };
  const closest = (Object.keys(cands) as Pick[]).reduce((a, b) => (Math.abs(cands[b] - realised) < Math.abs(cands[a] - realised) ? b : a));
  const verdict = !pick ? "none" : pick === closest ? "right" : "miss";
  const xOf = (k: number) => k - JUNE4;
  const line: Pt[] = levelPts(EWMA94, toPct2, xOf, WIN[0], WIN[1]);
  const yearLine: Pt[] = [];
  for (let k = WIN[0]; k < WIN[1]; k++) yearLine.push([xOf(k), toPct2(RV250[k - 1])]);
  const onTheDay = i === JUNE4;
  const name = (p: Pick) => (p === "year" ? "the year's number" : p === "before" ? "the bucket the night before" : "the bucket after the day");

  return (
    <Figure
      n="3"
      prompt={
        <>
          Zoom to {niceDate(DATES[JUNE4])}: the election count, {movePct(R[JUNE4])} in a day. A risk desk's position limit is set from one number — "how big can tomorrow be?" Three
          candidates were on the table that evening. Read them off the ledger, then bet on which was closest to what the next 25 days actually did.
        </>
      }
      controls={
        <>
          <button type="button" className="btn" disabled={onTheDay} onClick={() => setClock(JUNE4)}>
            {onTheDay ? `the clock stands on ${niceDate(DATES[JUNE4])}` : `put the clock on ${niceDate(DATES[JUNE4])}`}
          </button>
        </>
      }
      observe={
        <>
          The year's number was too calm: it had {varPct2(RV250[JUNE4 - 1])} in the bucket because 250 quiet days outvote one loud one. The bucket after the day overshot — one cup of{" "}
          {SQ[JUNE4].toFixed(1)} %² poured into a bucket holding {varPct2(EWMA94[JUNE4])} — and, worse, it had no idea the storm would end: a bucket with only a hole can forget, but it cannot
          know where quiet is. The month realised <strong>{volPct(realised)}</strong> a day. Nothing on this page yet knows what "normal" is; that is the next pipe.
        </>
      }
    >
      <div className="a5-stage">
        <TwoPictures
          window={WIN}
          origin={JUNE4}
          top={
            <>
              <Shade from={JUNE4 + 1} to={JUNE4 + 25} role="approx" label="the next 25 days" labelAt="bottom" />
              <Label at={[xOf(JUNE4), -9]} text={`the election count: ${movePct(R[JUNE4])}`} role="error" dx={-6} dy={0} anchor="end" />
            </>
          }
          bottom={
            <>
              <Shade from={JUNE4 + 1} to={JUNE4 + 25} role="approx" />
              <Curve pts={yearLine} role="ghost" width={1.4} smooth={false} />
              <Curve pts={line} role="truth" width={1.8} smooth={false} />
              <HLine at={toPct2(realised * realised)} />
              <Label at={[xOf(WIN[0]), toPct2(RV250[WIN[0]])]} text="trailing year" role="ghost" dx={4} dy={-4} />
              <Label at={[xOf(JUNE4 + 2), toPct2(EWMA94[JUNE4 + 2])]} text="the bucket, 6 % hole" role="truth" dx={6} dy={narrow ? -14 : -4} />
              <Label at={[xOf(WIN[1] - 1), toPct2(realised * realised)]} text={`the 25 days realised ${varPct2(realised * realised)}`} dx={0} dy={-6} anchor="end" />
            </>
          }
          bottomCap={10}
          topCap={8}
          bottomLabel="squares (%²), the bucket, the trailing year"
          ariaTop="Daily moves from April to August 2024 with the 4 June fall of six percent and the next 25 days shaded"
          ariaBottom="The squares over the same window with the bucket's level jumping on 4 June and the trailing-year level barely moving"
        />
        <Ledger
          nextLabel="next number"
          rows={[
            {
              label: "the trailing year — the limit-setter's number",
              work: <>√ (average of the last 250 squares) = √ {varPct2(RV250[JUNE4 - 1])}</>,
              value: volPct(yearVol),
              role: undefined,
              note: "Equal weights: every one of the 250 days counts the same, so the quiet spring of 2024 sets the number.",
            },
            {
              label: `the bucket the night before (hole 6 %)`,
              work: <>√ level on {niceDate(DATES[JUNE4 - 1])} = √ {varPct2(EWMA94[JUNE4])}</>,
              value: volPct(before),
              role: "truth",
              note: `Already half again the year's number: the day before, ${niceDate(DATES[JUNE4 - 1])}, had moved ${movePct(R[JUNE4 - 1])} — a cup of ${SQ[JUNE4 - 1].toFixed(1)} %².`,
            },
            {
              label: "the bucket after the day",
              work: (
                <>
                  √ (0.94 × {varPct2(EWMA94[JUNE4])} + 0.06 × {SQ[JUNE4].toFixed(1)} %²) = √ {varPct2(EWMA94[JUNE4 + 1])}
                </>
              ),
              value: volPct(after),
              role: "error",
              note: `One cup of ${SQ[JUNE4].toFixed(1)} %² — the square of a ${movePct(R[JUNE4])} day — and the level nearly doubles overnight.`,
            },
          ]}
        />
        <Bet<Pick>
          question={<>Which of the three was closest to what the next 25 trading days realised?</>}
          options={[
            { id: "year", label: `the year's number, ${volPct(yearVol)}` },
            { id: "before", label: `the bucket before, ${volPct(before)}` },
            { id: "after", label: `the bucket after, ${volPct(after)}` },
          ]}
          pick={pick}
          onPick={setPick}
        >
          <ResultCard yours={pick ? `${name(pick)}, ${volPct(cands[pick])}` : "—"} answer={`the 25 days realised ${volPct(realised)} a day — ${name(closest)} was closest`} verdict={verdict}>
            The year's number ({volPct(yearVol)}) was too calm, the bucket after the day ({volPct(after)}) far too loud, and the bucket the night before ({volPct(before)}) nearest — by
            luck as much as design, because a bucket with only a hole has no idea that storms end. It overshoots on the day and then simply drains, towards zero, forever. <strong>The bucket
            needs a home.</strong>
          </ResultCard>
        </Bet>
      </div>
    </Figure>
  );
}
