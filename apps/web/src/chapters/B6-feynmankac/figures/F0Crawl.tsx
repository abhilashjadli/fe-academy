import { format } from "d3-format";
import { Figure } from "../../../ui/Figure";
import { Comic, Panel, Says } from "../../../ui/Comic";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import "./figures.css";

/**
 * Figure 0 — the pub crawl. Three panels: 5 pm at the desk ("chance I'm in bed by midnight?"), 6 pm at three doors with the
 * chance of each on the arrow, midnight with a number pinned to each door. The reader picks the 5 pm answer; the reveal redraws
 * the doors with widths as weights and a result card sits under it. One drawn character, Walker, and no finance.
 */

const DOORS = [
  { name: "the pub", chance: 0.5, pinned: 0.4 },
  { name: "the office", chance: 0.3, pinned: 0.7 },
  { name: "the club", chance: 0.2, pinned: 0.1 },
] as const;
const f2 = format(".2f");
const f1 = format(".1f");
const pct = format(".0%");

/** value now = Σ chance × value one step later */
const weighted = DOORS.reduce((s, d) => s + d.chance * d.pinned, 0);
const best = Math.max(...DOORS.map((d) => d.pinned));
const middle = [...DOORS.map((d) => d.pinned)].sort((a, b) => a - b)[1];

type Pick = "best" | "middle" | "weighted";
const FONT = "var(--font-ui)";

function Door({ x, y, w, h, label, side = "right" }: { x: number; y: number; w: number; h: number; label: string; side?: "left" | "right" }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2} fill="var(--surface-figure)" stroke="var(--ink)" strokeWidth={1.4} />
      <circle cx={side === "right" ? x + w - 6 : x + 6} cy={y + h / 2} r={1.8} fill="var(--ink)" />
      <text x={side === "right" ? x + w + 6 : x - 6} y={y + h / 2 + 3.5} textAnchor={side === "right" ? "start" : "end"} fontSize="10" fontFamily={FONT} fill="var(--ink-2)">
        {label}
      </text>
    </g>
  );
}

function Clock({ cx, cy, hour, label }: { cx: number; cy: number; hour: number; label: string }) {
  const a = ((hour % 12) / 12) * 2 * Math.PI - Math.PI / 2;
  return (
    <g>
      <circle cx={cx} cy={cy} r={13} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.4} />
      <line x1={cx} y1={cy} x2={cx + 8 * Math.cos(a)} y2={cy + 8 * Math.sin(a)} stroke="var(--ink)" strokeWidth={1.6} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx} y2={cy - 11} stroke="var(--ink)" strokeWidth={1.2} strokeLinecap="round" />
      <text x={cx} y={cy + 25} textAnchor="middle" fontSize="9.5" fontFamily={FONT} fill="var(--ink-3)">
        {label}
      </text>
    </g>
  );
}

function Bed({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 10} width={52} height={14} rx={2} fill="var(--truth-soft)" stroke="var(--ink)" strokeWidth={1.3} />
      <rect x={x + 3} y={y + 3} width={14} height={8} rx={2} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.2} />
      <line x1={x} y1={y + 24} x2={x} y2={y + 30} stroke="var(--ink)" strokeWidth={1.3} />
      <line x1={x + 52} y1={y + 24} x2={x + 52} y2={y + 30} stroke="var(--ink)" strokeWidth={1.3} />
    </g>
  );
}

export function F0Crawl() {
  const [pick, setPick] = useBet<Pick>("B6-F0");
  const said = pick === "best" ? best : pick === "middle" ? middle : weighted;
  const verdict = pick === "weighted" ? "right" : pick === "middle" ? "close" : "miss";
  const totalW = 210; // px for the reveal's doors, split by chance

  return (
    <Figure
      n="0"
      prompt={<>Five o'clock on a Friday. Walker wants one number: the chance of being in bed by midnight. Read the three panels, then pick the five o'clock answer.</>}
      observe={
        pick ? (
          <>
            Only the three pinned numbers matter — everything after six o'clock is already inside them. The value now is the <strong>weighted average</strong> of the values one step later, and the answer flows <strong>backwards</strong>, from midnight to five. Hold on to that: it is this whole page.
          </>
        ) : (
          <>Three doors, three pinned numbers, three chances. Pick, then look at the doors again.</>
        )
      }
    >
      <div className="b6-crawl">
        <Comic cols={3}>
          <Panel n={1} caption={<Says who="Walker" mood="thinking">Five o'clock. What's the chance I'm in bed by midnight?</Says>}>
            <svg viewBox="0 0 200 100" role="img" aria-label="A desk at five o'clock, a clock, and a question mark over a bed">
              <Clock cx={34} cy={30} hour={5} label="5 pm" />
              <rect x={20} y={70} width={70} height={5} fill="var(--ink-2)" opacity={0.6} />
              <rect x={24} y={75} width={4} height={18} fill="var(--ink-2)" opacity={0.6} />
              <rect x={82} y={75} width={4} height={18} fill="var(--ink-2)" opacity={0.6} />
              <rect x={40} y={56} width={24} height={14} rx={1} fill="var(--surface-figure)" stroke="var(--ink)" strokeWidth={1.2} />
              <Bed x={128} y={52} />
              <text x={154} y={40} textAnchor="middle" fontSize="26" fontFamily={FONT} fill="var(--approx-text)">
                ?
              </text>
              <path d="M100 62 Q118 40 134 44" fill="none" stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 3" />
            </svg>
          </Panel>
          <Panel n={2} caption={<>Six o'clock, three doors. The chance of each is on its arrow: pub {pct(DOORS[0].chance)}, office {pct(DOORS[1].chance)}, club {pct(DOORS[2].chance)}.</>}>
            <svg viewBox="0 0 200 120" role="img" aria-label="Three doors — pub, office, club — with the chance of each written on an arrow">
              <Clock cx={24} cy={24} hour={6} label="6 pm" />
              {DOORS.map((d, i) => {
                const y = 12 + i * 36;
                const cy = y + 11;
                const x0 = 56,
                  y0 = 60,
                  x1 = 136;
                const mx = x0 + 0.55 * (x1 - x0),
                  my = y0 + 0.55 * (cy - y0);
                return (
                  <g key={d.name}>
                    <line x1={x0} y1={y0} x2={x1} y2={cy} stroke="var(--approx)" strokeWidth={1.3 + 3 * d.chance} opacity={0.75} strokeLinecap="round" />
                    <rect x={mx - 13} y={my - 7} width={26} height={13} rx={2} fill="var(--surface-raised)" opacity={0.9} />
                    <text x={mx} y={my + 3.5} textAnchor="middle" fontSize="9.5" fontFamily={FONT} fill="var(--approx-text)" fontWeight={600}>
                      {pct(d.chance)}
                    </text>
                    <Door x={138} y={y} w={22} h={22} label={d.name.replace("the ", "")} />
                  </g>
                );
              })}
              <circle cx={56} cy={60} r={4} fill="var(--ink)" />
            </svg>
          </Panel>
          <Panel n={3} caption={<>Midnight. Each door has its own number pinned: from the pub {f1(DOORS[0].pinned)}, the office {f1(DOORS[1].pinned)}, the club {f1(DOORS[2].pinned)}.</>}>
            <svg viewBox="0 0 200 120" role="img" aria-label="A bed at midnight; each of the three doors carries a pinned card with its chance">
              <Clock cx={176} cy={100} hour={12} label="" />
              <text x={176} y={86} textAnchor="middle" fontSize="9.5" fontFamily={FONT} fill="var(--ink-3)">
                12 am
              </text>
              {DOORS.map((d, i) => {
                const y = 12 + i * 36;
                return (
                  <g key={d.name}>
                    <Door x={44} y={y} w={22} h={22} label={d.name.replace("the ", "")} side="left" />
                    <rect x={72} y={y + 2} width={34} height={18} rx={1.5} fill="var(--approx-soft)" stroke="var(--approx)" strokeWidth={1} />
                    <circle cx={76} cy={y + 5} r={1.4} fill="var(--error)" />
                    <text x={90} y={y + 15} textAnchor="middle" fontSize="11" fontFamily={FONT} fill="var(--ink)" fontWeight={600}>
                      {f1(d.pinned)}
                    </text>
                    <line x1={108} y1={y + 11} x2={136} y2={62} stroke="var(--ink-3)" strokeWidth={0.8} strokeDasharray="2 2" />
                  </g>
                );
              })}
              <Bed x={138} y={50} />
            </svg>
          </Panel>
        </Comic>
        <Bet
          question={<>So what is the five o'clock number?</>}
          options={[
            { id: "best", label: <>{f1(best)} — the best door</> },
            { id: "middle", label: <>{f1(middle)} — the middle of the three</> },
            { id: "weighted", label: <>{f2(weighted)} — each door's number, weighted by its chance</> },
          ]}
          pick={pick}
          onPick={setPick}
        >
          <div className="b6-reveal">
            <div className="b6-reveal-art">
              <svg viewBox="0 0 260 110" role="img" aria-label="The three doors redrawn with widths equal to their chances; the pinned number inside each; the weighted average under them">
                {(() => {
                  let x = 24;
                  return DOORS.map((d) => {
                    const w = totalW * d.chance;
                    const el = (
                      <g key={d.name}>
                        <rect x={x} y={14} width={w - 4} height={44} rx={2} fill="var(--approx-soft)" stroke="var(--ink)" strokeWidth={1.3} />
                        <text x={x + (w - 4) / 2} y={32} textAnchor="middle" fontSize="9" fontFamily={FONT} fill="var(--ink-2)">
                          {d.name.replace("the ", "")}
                        </text>
                        <text x={x + (w - 4) / 2} y={50} textAnchor="middle" fontSize="13" fontFamily={FONT} fill="var(--ink)" fontWeight={600}>
                          {f1(d.pinned)}
                        </text>
                        <text x={x + (w - 4) / 2} y={70} textAnchor="middle" fontSize="9" fontFamily={FONT} fill="var(--approx-text)">
                          {pct(d.chance)}
                        </text>
                      </g>
                    );
                    x += w;
                    return el;
                  });
                })()}
                <line x1={24} y1={78} x2={24 + totalW - 4} y2={78} stroke="var(--ink-3)" strokeWidth={0.8} />
                <text x={24 + (totalW - 4) / 2} y={98} textAnchor="middle" fontSize="11" fontFamily={FONT} fill="var(--truth-text)" fontWeight={600}>
                  {DOORS.map((d) => `${d.chance} × ${d.pinned}`).join(" + ")} = {f2(weighted)}
                </text>
              </svg>
            </div>
            <ResultCard yours={<span className="num">{pick ? f2(said) : "—"}</span>} answer={<span className="num">{f2(weighted)}</span>} verdict={verdict}>
              {pick === "best" && <>The best door is only {pct(DOORS[1].chance)} likely. A door you probably won't take can't carry the whole answer.</>}
              {pick === "middle" && <>Close, because the pub is the likeliest door. But the office pulls the number up and the club pulls it down, each by its own weight.</>}
              {pick === "weighted" && <>Each door's number, weighted by how likely you are to walk through it. That one sentence is the rule the rest of this page runs on.</>}
            </ResultCard>
          </div>
        </Bet>
      </div>
    </Figure>
  );
}
