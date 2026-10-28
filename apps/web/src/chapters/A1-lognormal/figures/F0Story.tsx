import { useEffect, useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Timeline, type Segment } from "../../../ui/Timeline";
import { HLine, Label, Plot, usePlot } from "../../../ui/Plot";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Who } from "../../../ui/Comic";
import { PathsStage } from "../PathsStage";
import { DAYS, histogram, simulateSavers } from "../sim";

const PATHS = 160;
const YD: [number, number] = [40, 180];
/** Exact answers if Mel's year were run forever: mean 100, median 100 × 0.9999^125. */
const EXACT_MEDIAN = 100 * Math.pow(0.9999, 125);

type Pick = "above" | "exact" | "below";

/** Ada and Mel's year: bet first, then a scrubbable story with captions and optional voice. */
export function F0Story() {
  const [pick, setPick] = useBet<Pick>("A1-F0");
  const [reached, setReached] = useState(false);
  const savers = useMemo(() => simulateSavers(PATHS, 1, 2024), []);
  const ends = useMemo(() => {
    const a = Array.from(savers.ada, (s) => s[DAYS]);
    const m = Array.from(savers.mel, (s) => s[DAYS]);
    return { a, m };
  }, [savers]);
  const histA = useMemo(() => histogram(ends.a, YD[0], YD[1], 35), [ends]);
  const histM = useMemo(() => histogram(ends.m, YD[0], YD[1], 35), [ends]);
  const meanM = ends.m.reduce((s, v) => s + v, 0) / ends.m.length;
  const sortedM = [...ends.m].sort((x, y) => x - y);
  const medianM = sortedM[Math.floor(sortedM.length / 2)];
  const xmaxH = Math.max(...histA.map((b) => b.density), ...histM.map((b) => b.density)) * 1.15;

  const segments: Segment[] = [
    {
      duration: 9,
      caption: "Two savers, Ada and Mel, each start the year with 100. Every day a fair coin is tossed. Heads: Ada gains 1 and Mel gains 1 percent. Tails: Ada loses 1, Mel loses 1 percent. Same coin, same days — only the rule differs.",
    },
    {
      duration: 8,
      caption: "The first few weeks. A hundred and sixty possible years are drawn for each of them, with the same coin tosses. For now you cannot tell Ada's blue from Mel's amber: one percent of a balance near 100 is about 1.",
    },
    {
      duration: 12,
      caption: "By late spring the clouds part. Mel's lucky years pull away — each win is one percent of a larger balance — while her unlucky years are squeezed: each loss is one percent of a smaller one. Ada's steps never change size.",
    },
    {
      duration: 14,
      caption: "Year end. Ada's cloud is symmetric about 100, a bell. Mel's leans: a long reach upward, a short one downward, and not one of her years ends below zero — a one-percent loss can never take the whole balance.",
    },
    {
      duration: 12,
      caption: `Stack the year-end balances. Ada's pile is a bell. Mel's leans. In these 160 sample years her average ends near ${meanM.toFixed(1)} and her typical year — the median — near ${medianM.toFixed(1)}. Run forever, the average is exactly 100 and the typical year ${EXACT_MEDIAN.toFixed(2)}: below where she started.`,
    },
    {
      duration: 8,
      caption: "So: why does adding give a bell and multiplying give a lean? Why is Mel's typical year worse than her average year? And how do we get the bell back? Those three questions are this chapter.",
    },
  ];

  const dayAt = (i: number, u: number) => {
    if (i === 0) return 0;
    if (i === 1) return 20 * u;
    if (i === 2) return 20 + 100 * u;
    if (i === 3) return 120 + 130 * u;
    return DAYS;
  };

  return (
    <Figure
      n="0"
      prompt={
        <>
          A year in the lives of two savers. Place your bet, then press play; scrub or jump to any part.
        </>
      }
      observe={
        <>
          <Who name="Ada" /> adds a fixed amount every day: her pile is a bell. <Who name="Mel" /> multiplies by 1 % every day: her pile leans, never
          touches zero, and her typical year ends <em>below</em> her average one. The rest of this page is why.
        </>
      }
    >
      <Bet
        question={
          <>
            Mel bets 1 % of her money on a fair coin, every day for a year. Where does her <strong>typical</strong> year end?
          </>
        }
        options={[
          { id: "above", label: "above 100 — wins compound" },
          { id: "exact", label: "exactly 100 — the coin is fair" },
          { id: "below", label: "below 100" },
        ]}
        pick={pick}
        onPick={(v) => {
          setPick(v);
          if (v === null) setReached(false);
        }}
      >
        <Timeline
          segments={segments}
          render={(_t, i, u) => {
            const day = dayAt(i, u);
            const histProgress = i === 4 ? u : i > 4 ? 1 : 0;
            const showStats = i >= 4 && (i > 4 || u > 0.6);
            return (
              <div className="two" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)" }}>
                <PathsStage savers={savers} day={day} showAda showMel yDomain={YD} />
                <Plot xDomain={[0, xmaxH]} yDomain={YD} width={380} height={320} xTicks={3} yTicks={7} grid={false} margin={{ top: 10, right: 12, bottom: 26, left: 36 }} ariaLabel="End-of-year balance histograms">
                  <HBars bins={histM} progress={histProgress} role="approx" />
                  <HBars bins={histA} progress={histProgress} role="truth" />
                  <HLine at={100} />
                  {showStats && (
                    <>
                      <HLine at={meanM} />
                      <Label at={[xmaxH, meanM]} text={`Mel's average ${meanM.toFixed(1)}`} role="approx" dx={-4} dy={-4} anchor="end" />
                      <HLine at={medianM} />
                      <Label at={[xmaxH, medianM]} text={`Mel's typical ${medianM.toFixed(1)}`} role="approx" dx={-4} dy={14} anchor="end" />
                      <OnMount fn={() => setReached(true)} />
                    </>
                  )}
                  {i >= 3 && <Label at={[0, YD[1] - 4]} text="year-end balances" dx={4} dy={0} />}
                </Plot>
              </div>
            );
          }}
        />
        <div className="a1-legend">
          <Who name="Ada" /> adds ±1 a day
          <Who name="Mel" /> multiplies by ±1 % a day
        </div>
        {reached && pick && (
          <ResultCard
            yours={pick === "above" ? "above 100" : pick === "exact" ? "exactly 100" : "below 100"}
            answer={`below 100 — the typical year ends at ${EXACT_MEDIAN.toFixed(2)} (her average year is exactly 100)`}
            verdict={pick === "below" ? "right" : "miss"}
          >
            Up 1 % then down 1 % is 1.01 × 0.99 = 0.9999, a hair under 1. Mel pays that hair 125 times a year. A few very lucky years keep her
            <em> average</em> at exactly 100; the year she usually gets is 1.24 short. These 160 years are a sample, so their numbers wobble around that.
          </ResultCard>
        )}
      </Bet>
    </Figure>
  );
}

/** Fires once when the stats segment is first drawn (child effect, so no state is set during render). */
function OnMount({ fn }: { fn: () => void }) {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function HBars({ bins, progress, role }: { bins: ReturnType<typeof histogram>; progress: number; role: "truth" | "approx" }) {
  const { x, y } = usePlot();
  if (progress <= 0) return null;
  return (
    <g>
      {bins.map((b, i) => {
        const yTop = y(b.hi) + 0.5;
        const yBot = y(b.lo) - 0.5;
        const w = x(b.density * progress) - x(0);
        return <rect key={i} className={`marker ${role}`} x={x(0)} y={yTop} width={Math.max(0, w)} height={Math.max(0, yBot - yTop)} style={{ opacity: 0.55, stroke: "none" }} />;
      })}
    </g>
  );
}
