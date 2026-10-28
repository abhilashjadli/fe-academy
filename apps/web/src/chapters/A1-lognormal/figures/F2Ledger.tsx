import { Figure } from "../../../ui/Figure";
import { Comic, Panel, Says, Who } from "../../../ui/Comic";
import { Ledger } from "../../../ui/Ledger";
import { F2DeriveTimeline } from "./F2Derive";

/** Mel's tax, one line at a time: the misconception speaks first, then the sum is built by clicking. */
export function F2Ledger() {
  return (
    <Figure
      n="2"
      prompt={
        <>
          Up 1 %, then down 1 %. <Who name="Mel" /> says you are back where you started. Build the sum one line at a time and find her missing 1.24.
        </>
      }
      observe={
        <>
          Up 1 % then down 1 % is 1.01 × 0.99 = 0.9999 — a hair short, every single pair, whichever order they come in. Pay that hair 125 times and
          the typical year lands at 98.76. The average stays at 100 only because a few lucky years are very lucky. That gap is called{" "}
          <strong>volatility drag</strong>.
        </>
      }
    >
      <Comic cols={2}>
        <Panel n={1} caption={<Says who="Mel" mood="smug">Heads, I am up 1 %. Tails, I am down 1 %. One of each and I am exactly where I started. Fair coin, fair game.</Says>}>
          <svg viewBox="0 0 200 90" width="100%" style={{ maxWidth: 320 }} role="img" aria-label="plus one percent, minus one percent, equals zero">
            <text x="14" y="56" fontSize="24" fill="var(--approx-text)" fontFamily="var(--font-ui)">
              +1 % − 1 % = 0
            </text>
          </svg>
        </Panel>
        <Panel n={2} caption={<Says who="Ada" mood="thinking">Percent of what, though? Up 1 % of 100 is 101. Down 1 % of 101 is 99.99. You are a penny short — and you will be short again next pair.</Says>}>
          <svg viewBox="0 0 200 90" width="100%" style={{ maxWidth: 320 }} role="img" aria-label="100 to 101 to 99.99">
            <line x1="14" y1="62" x2="186" y2="62" stroke="var(--ghost)" />
            <path d="M30 62 l40 -28" stroke="var(--truth)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M70 34 l40 28.6" stroke="var(--error)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="30" cy="62" r="3" fill="var(--ink)" />
            <circle cx="110" cy="62.6" r="3" fill="var(--error)" />
            <text x="18" y="80" fontSize="11" fill="var(--ink-2)" fontFamily="var(--font-ui)">
              100
            </text>
            <text x="60" y="26" fontSize="11" fill="var(--truth-text)" fontFamily="var(--font-ui)">
              101
            </text>
            <text x="118" y="80" fontSize="11" fill="var(--error-text)" fontFamily="var(--font-ui)">
              99.99
            </text>
          </svg>
        </Panel>
      </Comic>
      <Ledger
        rows={[
          { label: "A winning day multiplies her money by", work: "1 + 0.01", value: "1.01" },
          { label: "A losing day multiplies it by", work: "1 − 0.01", value: "0.99" },
          { label: "One win and one loss together", work: "1.01 × 0.99", value: "0.9999", role: "error", note: "Not 1. Up 1 % then down 1 % leaves you 0.01 % short. That is the tax." },
          { label: "The tax per pair, as a fraction", work: "1 − 0.9999 = ½ × 0.01²", value: "0.00005" },
          { label: "Pairs of days in a year", work: "250 ÷ 2", value: "125" },
          { label: "Tax for the year", work: "125 × 0.00005", value: "0.00625 ≈ 0.6 %", role: "error" },
          {
            label: "A typical year (half wins, half losses) ends at",
            work: "100 × 0.9999^125",
            value: "98.76",
            role: "approx",
            note: "The average year is still exactly 100: a few very lucky years pull the mean up while the typical year sinks. That 1.24 gap is volatility drag.",
          },
        ]}
      />
      <details className="a1-fold">
        <summary>watch the derivation instead (why the log of Mel's balance is a bell, with the formulas)</summary>
        <F2DeriveTimeline />
      </details>
    </Figure>
  );
}
