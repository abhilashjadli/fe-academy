import { Figure } from "../../../ui/Figure";
import { Comic, Panel } from "../../../ui/Comic";
import { Bet } from "../../../ui/Bet";
import "./figures.css";

/**
 * Figure 0 — the comic. Four drawn panels: ① a car on a jittery road with three dials labelled in words; ② the driver halves
 * the clock tick; ③ the speedometer slams to its stop, the odometer spins, the third dial sits still; ④ the passenger: "that one
 * reads the clock." The guess (three buttons) sits after panel 2; panels 3 and 4 turn over once it is made. The guess is stored
 * under fe-bet:B3-F0 and its result card lands under Figure 2, where real instruments read a real path. No numbers here: panel 3
 * is drawn needles.
 */

export type DialPick = "speed" | "odo" | "squares";
const FONT = "var(--font-ui)";

/** A small drawn dial: needle at a fraction of its sweep, optional label under it. */
function MiniDial({ x, y, r = 16, frac, label, role = "ink", spin, pinned, still }: { x: number; y: number; r?: number; frac: number; label?: string; role?: "ink" | "truth" | "approx" | "error"; spin?: boolean; pinned?: boolean; still?: boolean }) {
  const a0 = Math.PI * 1.1,
    a1 = -Math.PI * 0.1;
  const a = a0 + (a1 - a0) * Math.max(0, Math.min(1, frac));
  const col = role === "ink" ? "var(--ink)" : `var(--${role})`;
  const pt = (t: number, rr: number) => [x + rr * Math.cos(t), y - rr * Math.sin(t)] as const;
  const [sx, sy] = pt(a0, r),
    [ex, ey] = pt(a1, r);
  const [nx, ny] = pt(a, r - 4);
  return (
    <g>
      <circle cx={x} cy={y} r={r + 4} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.2} />
      <path d={`M${sx} ${sy} A${r} ${r} 0 1 1 ${ex} ${ey}`} fill="none" stroke="var(--rule)" strokeWidth={2.5} strokeLinecap="round" />
      {spin &&
        [0.15, 0.35, 0.55, 0.75].map((f, i) => {
          const t = a0 + (a1 - a0) * f;
          const [gx, gy] = pt(t, r - 4);
          return <line key={i} x1={x} y1={y} x2={gx} y2={gy} stroke={col} strokeWidth={1.4} opacity={0.25 + 0.12 * i} strokeLinecap="round" />;
        })}
      <line x1={x} y1={y} x2={nx} y2={ny} stroke={col} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={x} cy={y} r={2} fill={col} />
      {pinned && (
        <g stroke="var(--error)" strokeWidth={1} strokeLinecap="round">
          <line x1={x + r + 6} y1={y - r + 2} x2={x + r + 11} y2={y - r - 3} />
          <line x1={x + r + 8} y1={y - r + 8} x2={x + r + 14} y2={y - r + 7} />
          <line x1={x + r + 3} y1={y - r - 2} x2={x + r + 5} y2={y - r - 8} />
        </g>
      )}
      {label && (
        <text x={x} y={y + r + 13} textAnchor="middle" fontSize={7.5} fontFamily={FONT} fill="var(--ink-2)">
          {label}
        </text>
      )}
      {still && (
        <text x={x} y={y + r + 23} textAnchor="middle" fontSize={7} fontFamily={FONT} fill="var(--truth-text)" fontStyle="italic">
          (does not move)
        </text>
      )}
    </g>
  );
}

function Car({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke="var(--ink)" strokeWidth={1.4} strokeLinejoin="round">
      <path d="M0 22 L6 10 Q10 2 22 2 L42 2 Q52 2 58 10 L70 14 Q78 16 78 22 L78 28 L0 28 Z" fill="var(--surface-raised)" />
      <path d="M12 10 L22 4 L40 4 L40 12 Z" fill="var(--truth-soft)" />
      <circle cx={16} cy={29} r={6} fill="var(--ink)" />
      <circle cx={62} cy={29} r={6} fill="var(--ink)" />
      <circle cx={16} cy={29} r={2.5} fill="var(--surface)" stroke="none" />
      <circle cx={62} cy={29} r={2.5} fill="var(--surface)" stroke="none" />
    </g>
  );
}

/** a jittery road: a seeded zig-zag so the drawing is the same every time */
function Road({ y, w, amp = 6 }: { y: number; w: number; amp?: number }) {
  const pts: string[] = [];
  const jit = [0.2, -0.8, 0.5, 0.9, -0.3, -1, 0.1, 0.7, -0.6, 0.4, -0.2, 0.8, -0.9, 0.3, 0.6, -0.5, 0.1, -0.7];
  for (let i = 0; i <= 17; i++) pts.push(`${(i * w) / 17},${y + amp * jit[i]}`);
  return <polyline points={pts.join(" ")} fill="none" stroke="var(--ink-3)" strokeWidth={1.2} strokeLinejoin="round" />;
}

function ClockKnob({ x, y, halves }: { x: number; y: number; halves: boolean }) {
  const r = 14;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.4} />
      {Array.from({ length: halves ? 24 : 12 }, (_, i) => {
        const t = (i / (halves ? 24 : 12)) * 2 * Math.PI;
        return <line key={i} x1={x + (r - 3) * Math.cos(t)} y1={y + (r - 3) * Math.sin(t)} x2={x + r * Math.cos(t)} y2={y + r * Math.sin(t)} stroke="var(--ink-2)" strokeWidth={0.8} />;
      })}
      <line x1={x} y1={y} x2={x} y2={y - 9} stroke="var(--ink)" strokeWidth={1.4} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + 6} y2={y + 3} stroke="var(--ink)" strokeWidth={1.2} strokeLinecap="round" />
    </g>
  );
}

/** The bet lives in Chapter.tsx (useBet("B3-F0")) so Figure 2 sees it the moment it is made. */
export function F0Comic({ pick, onPick }: { pick: DialPick | null; onPick: (v: DialPick | null) => void }) {

  const panel1 = (
    <svg viewBox="0 0 220 120" role="img" aria-label="A car on a jittery road; its dashboard has a speedometer, an odometer and a third dial that adds up squared moves">
      <Road y={54} w={220} />
      <Car x={70} y={22} s={0.85} />
      {/* the dashboard, blown up below the car */}
      <path d="M100 52 L112 66" stroke="var(--ink-3)" strokeWidth={0.8} strokeDasharray="2 2" fill="none" />
      <rect x={6} y={66} width={208} height={50} rx={4} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.2} />
      <MiniDial x={40} y={85} r={11} frac={0.35} role="error" />
      <text x={40} y={112} textAnchor="middle" fontSize={7.5} fontFamily={FONT} fill="var(--ink-2)">
        speed
      </text>
      {/* odometer as digits */}
      <rect x={84} y={82} width={52} height={16} rx={2} fill="var(--ink)" />
      {["0", "0", "3", ".", "1"].map((c, i) => (
        <text key={i} x={92 + i * 9.5} y={94} textAnchor="middle" fontSize={10} fontFamily={FONT} fill="var(--surface)" fontWeight={600}>
          {c}
        </text>
      ))}
      <text x={110} y={112} textAnchor="middle" fontSize={7.5} fontFamily={FONT} fill="var(--ink-2)">
        distance
      </text>
      <MiniDial x={180} y={85} r={11} frac={0.45} role="truth" />
      <text x={180} y={112} textAnchor="middle" fontSize={7.5} fontFamily={FONT} fill="var(--ink-2)">
        squares
      </text>
    </svg>
  );

  const panel2 = (
    <svg viewBox="0 0 220 120" role="img" aria-label="The driver's hand turns the clock knob: readings twice as often">
      <rect x={6} y={10} width={208} height={100} rx={4} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.2} />
      <ClockKnob x={60} y={56} halves={false} />
      <text x={60} y={90} textAnchor="middle" fontSize={8} fontFamily={FONT} fill="var(--ink-2)">
        read the dials every tick
      </text>
      <path d="M86 56 L128 56" stroke="var(--ink)" strokeWidth={1.4} markerEnd="url(#b3f0-arrow)" />
      <defs>
        <marker id="b3f0-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill="var(--ink)" />
        </marker>
      </defs>
      <text x={107} y={48} textAnchor="middle" fontSize={8} fontFamily={FONT} fill="var(--ink)">
        halve it
      </text>
      <ClockKnob x={156} y={56} halves />
      <text x={156} y={90} textAnchor="middle" fontSize={8} fontFamily={FONT} fill="var(--ink-2)">
        twice as often
      </text>
      <text x={110} y={104} textAnchor="middle" fontSize={8} fontFamily={FONT} fill="var(--ink-3)" fontStyle="italic">
        …and again, and again
      </text>
      {/* the turn: a curved arrow around the finer clock */}
      <path d="M176 40 A22 22 0 0 1 178 66" fill="none" stroke="var(--approx)" strokeWidth={1.4} strokeLinecap="round" markerEnd="url(#b3f0-arrow2)" />
      <marker id="b3f0-arrow2" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M0 0 L6 3 L0 6 Z" fill="var(--approx)" />
      </marker>
    </svg>
  );

  const panel3 = (
    <svg viewBox="0 0 220 120" role="img" aria-label="Three dials: the speedometer pinned at its stop, the odometer spinning, the squares dial unmoved">
      <rect x={6} y={10} width={208} height={100} rx={4} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.2} />
      <MiniDial x={44} y={52} r={18} frac={1} role="error" pinned label="speed" />
      {/* odometer, spinning: blurred digits */}
      <rect x={82} y={42} width={60} height={20} rx={2} fill="var(--ink)" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <text x={92 + i * 11} y={53} textAnchor="middle" fontSize={11} fontFamily={FONT} fill="var(--surface)" opacity={0.35} fontWeight={600}>
            {["8", "3", "9", "5", "1"][i]}
          </text>
          <text x={92 + i * 11} y={60} textAnchor="middle" fontSize={11} fontFamily={FONT} fill="var(--surface)" opacity={0.75} fontWeight={600}>
            {["2", "7", "4", "0", "6"][i]}
          </text>
        </g>
      ))}
      <text x={112} y={83} textAnchor="middle" fontSize={7.5} fontFamily={FONT} fill="var(--ink-2)">
        distance
      </text>
      <text x={112} y={93} textAnchor="middle" fontSize={7} fontFamily={FONT} fill="var(--approx-text)" fontStyle="italic">
        (runs away)
      </text>
      <MiniDial x={176} y={52} r={18} frac={0.5} role="truth" still label="squares" />
      <text x={44} y={93} textAnchor="middle" fontSize={7} fontFamily={FONT} fill="var(--error-text)" fontStyle="italic">
        (slams to the stop)
      </text>
    </svg>
  );

  const panel4 = (
    <svg viewBox="0 0 220 120" role="img" aria-label="The passenger points at the third dial: that one reads the clock">
      {/* two heads in the car, side view */}
      <path d="M10 112 L10 70 Q10 56 24 56 L150 56 Q170 56 180 72 L210 86 L210 112 Z" fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.3} strokeLinejoin="round" />
      <circle cx={60} cy={51} r={10} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.3} />
      <circle cx={118} cy={52} r={10} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.3} />
      <circle cx={64} cy={49} r={1.2} fill="var(--ink)" />
      <circle cx={122} cy={50} r={1.2} fill="var(--ink)" />
      {/* passenger's arm pointing at the third dial */}
      <path d="M128 60 L172 76" stroke="var(--ink)" strokeWidth={1.4} strokeLinecap="round" />
      <MiniDial x={184} y={86} r={9} frac={0.5} role="truth" />
      {/* bubble */}
      <path d="M40 6 H200 Q206 6 206 12 V30 Q206 36 200 36 H136 L126 44 L128 36 H46 Q40 36 40 30 V12 Q40 6 46 6 Z" fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={1.2} />
      <text x={123} y={25} textAnchor="middle" fontSize={10.5} fontFamily="var(--font-prose)" fill="var(--ink)" fontStyle="italic">
        “That one reads the clock.”
      </text>
      <text x={60} y={78} textAnchor="middle" fontSize={7} fontFamily={FONT} fill="var(--ink-3)">
        driver
      </text>
      <text x={118} y={80} textAnchor="middle" fontSize={7} fontFamily={FONT} fill="var(--ink-3)">
        passenger
      </text>
    </svg>
  );

  return (
    <Figure
      n="0"
      prompt={<>A car drives a jittery road. Read the two panels, then bet on the dashboard. (Every road on this page is simulated; the real one comes in Figure 3.)</>}
      observe={
        pick ? (
          <>
            The passenger's claim is a drawing, not a measurement. Figure 1 shows why the speedometer dies; Figure 2 reads all three dials on a real
            path, and your bet is settled there.
          </>
        ) : (
          <>Three dials, one clock knob. Pick before you turn the page.</>
        )
      }
    >
      <div className="b3-comic">
        <Comic cols={2}>
          <Panel n={1} caption={<>A speedometer (each move ÷ the tick), an odometer (every move added up, both directions), and a third dial that adds up the <em>squares</em> of the moves.</>}>
            {panel1}
          </Panel>
          <Panel n={2} caption={<>The driver halves the clock tick, and halves it again. The dials are read more and more often.</>}>
            {panel2}
          </Panel>
        </Comic>
        <Bet
          question="Read often enough, which dial settles to a steady reading?"
          options={[
            { id: "speed", label: "the speedometer — a speed is a speed" },
            { id: "odo", label: "the odometer — distance is distance" },
            { id: "squares", label: "the squares dial" },
          ]}
          pick={pick}
          onPick={onPick}
        >
          <Comic cols={2}>
            <Panel n={3} caption={<>The speedometer slams to its stop. The odometer spins faster the finer the tick. The third dial does not move.</>}>
              {panel3}
            </Panel>
            <Panel n={4} caption={<>The passenger, who has seen this before.</>}>
              {panel4}
            </Panel>
          </Comic>
        </Bet>
      </div>
    </Figure>
  );
}
