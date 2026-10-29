import { Figure } from "../../../ui/Figure";
import { Comic, Panel, Says, Who } from "../../../ui/Comic";

const Sq = ({ x, y, s = 14 }: { x: number; y: number; s?: number }) => <rect x={x} y={y} width={s} height={s} fill="var(--truth)" rx="2" />;

/** Figure 1 — two accountants, one stock, two days. Two drawn panels: Mel's path, Ada's pile of squares. */
export function F1Comic() {
  return (
    <Figure n="1" prompt="Two accountants watch the same stock for two days: up ₹1, then down ₹1. Who is right?">
      <Comic cols={2}>
        <Panel n={1} caption={<Says who="Mel" mood="smug">Nothing happened. Plus one, minus one: zero. Close the books.</Says>}>
          <svg viewBox="0 0 200 110" width="100%" style={{ maxWidth: 340 }} role="img" aria-label="A price that goes up one rupee then down one rupee, back where it started">
            <line x1="12" y1="78" x2="188" y2="78" stroke="var(--ghost)" />
            <text x="12" y="92" fontSize="10" fill="var(--ink-3)" fontFamily="var(--font-ui)">
              start
            </text>
            <text x="188" y="92" fontSize="10" fill="var(--ink-3)" fontFamily="var(--font-ui)" textAnchor="end">
              two days later
            </text>
            {/* the path: up, then down */}
            <path d="M40 78 L96 34" stroke="var(--approx)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M96 34 L152 78" stroke="var(--approx)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="40" cy="78" r="3.5" fill="var(--ink)" />
            <circle cx="96" cy="34" r="3.5" fill="var(--ink)" />
            <circle cx="152" cy="78" r="3.5" fill="var(--ink)" />
            <text x="60" y="48" fontSize="11" fill="var(--approx-text)" fontFamily="var(--font-ui)">
              +1
            </text>
            <text x="128" y="48" fontSize="11" fill="var(--approx-text)" fontFamily="var(--font-ui)">
              −1
            </text>
            {/* the net move: a bracket of zero height */}
            <text x="160" y="72" fontSize="10.5" fill="var(--ink-2)" fontFamily="var(--font-ui)">
              net 0
            </text>
          </svg>
        </Panel>
        <Panel n={2} caption={<Says who="Ada" mood="thinking">Something happened. Square each step — a square is never negative — and pile them up. A year of them is a number.</Says>}>
          <svg viewBox="0 0 200 110" width="100%" style={{ maxWidth: 340 }} role="img" aria-label="Two squares, one per step, and a year's pile of squares that never cancel">
            {/* the two days' squares */}
            <Sq x={16} y={56} s={22} />
            <Sq x={44} y={56} s={22} />
            <text x={16} y={90} fontSize="10.5" fill="var(--truth-text)" fontFamily="var(--font-ui)">
              (+1)²
            </text>
            <text x={44} y={90} fontSize="10.5" fill="var(--truth-text)" fontFamily="var(--font-ui)">
              (−1)²
            </text>
            <text x={16} y={46} fontSize="10.5" fill="var(--ink-2)" fontFamily="var(--font-ui)">
              two days
            </text>
            {/* the arrow to a year */}
            <path d="M78 67 L96 67" stroke="var(--ink-3)" strokeWidth="1.2" markerEnd="url(#b4f1-arrow)" />
            <defs>
              <marker id="b4f1-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0 0 L6 3 L0 6 Z" fill="var(--ink-3)" />
              </marker>
            </defs>
            {/* a year's pile: 8 wide, 5 high, small squares */}
            {Array.from({ length: 40 }, (_, i) => (
              <Sq key={i} x={104 + (i % 8) * 11} y={78 - Math.floor(i / 8) * 11} s={9} />
            ))}
            <text x={104} y={22} fontSize="10.5" fill="var(--ink-2)" fontFamily="var(--font-ui)">
              a year
            </text>
            <text x={192} y={100} fontSize="10" fill="var(--truth-text)" fontFamily="var(--font-ui)" textAnchor="end">
              they never cancel
            </text>
          </svg>
        </Panel>
      </Comic>
      <div className="figure-observe">
        <Who name="Mel" /> keeps first-order books, and his profit-and-loss is wrong every day the price moves. <Who name="Ada" /> keeps the squares, and her
        books balance. The total of the squares is called the <strong>quadratic variation</strong> (on a desk: realised variance). This chapter is Ada's
        accounting.
      </div>
    </Figure>
  );
}
