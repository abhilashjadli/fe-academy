import { Figure } from "../../../ui/Figure";
import { Comic, Panel, Says, Who } from "../../../ui/Comic";

const Sq = ({ x, y, role }: { x: number; y: number; role: "truth" | "approx" }) => <rect x={x} y={y} width="14" height="14" fill={`var(--${role})`} rx="2" />;

/** Figure 1 — two accountants, one stock, two days. */
export function F1Comic() {
  return (
    <Figure n="1" prompt="Two accountants watch the same stock for two days. Who is right?">
      <Comic cols={2}>
        <Panel n={1} caption="Day 1: up ₹1. Day 2: down ₹1. The price is back where it started.">
          <svg viewBox="0 0 160 90" width="100%" style={{ maxWidth: 300 }}>
            <line x1="10" y1="60" x2="150" y2="60" stroke="var(--ghost)" />
            <path d="M30 60 l18 -22" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M48 38 l18 22" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="30" cy="60" r="3" fill="var(--ink)" />
            <circle cx="66" cy="60" r="3" fill="var(--ink)" />
            <text x="80" y="40" fontSize="11" fill="var(--ink-2)">
              +1, then −1
            </text>
          </svg>
        </Panel>
        <Panel n={2} caption={<Says who="Mel" mood="smug">Nothing happened. Plus one, minus one: zero. Close the books.</Says>}>
          <svg viewBox="0 0 160 90" width="100%" style={{ maxWidth: 300 }}>
            <text x="20" y="50" fontSize="26" fill="var(--approx-text)">
              +1 − 1 = 0
            </text>
          </svg>
        </Panel>
        <Panel n={3} caption={<Says who="Ada" mood="thinking">Something happened. Square each step: a square is never negative. Two tiny squares, and they add.</Says>}>
          <svg viewBox="0 0 160 90" width="100%" style={{ maxWidth: 300 }}>
            <text x="14" y="52" fontSize="20" fill="var(--truth-text)">
              (+1)² + (−1)² =
            </text>
            <Sq x={128} y={30} role="truth" />
            <Sq x={128} y={48} role="truth" />
          </svg>
        </Panel>
        <Panel n={4} caption="A year of steps later, Ada's pile of squares has grown to a number — and it is the same number every year. That number has a name.">
          <svg viewBox="0 0 160 90" width="100%" style={{ maxWidth: 300 }}>
            {Array.from({ length: 24 }, (_, i) => (
              <Sq key={i} x={14 + (i % 8) * 17} y={64 - Math.floor(i / 8) * 17} role="truth" />
            ))}
            <text x="14" y="24" fontSize="11" fill="var(--ink-2)">
              the squares never cancel
            </text>
          </svg>
        </Panel>
      </Comic>
      <div className="figure-observe">
        <Who name="Mel" /> keeps first-order books, and his profit-and-loss is wrong every day the price moves. <Who name="Ada" /> keeps the squares, and her
        books balance. This chapter is Ada's accounting.
      </div>
    </Figure>
  );
}
