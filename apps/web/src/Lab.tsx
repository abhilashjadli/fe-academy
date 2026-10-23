import { useMemo } from "react";
import { Figure } from "./ui/Figure";
import { Bet, ResultCard, useBet } from "./ui/Bet";
import { Comic, Panel, Says, Who } from "./ui/Comic";
import { IconGrid } from "./ui/IconGrid";
import { Artefact } from "./ui/Artefact";
import { Ledger } from "./ui/Ledger";
import { Clip } from "./ui/Clip";
import { normalSample, rng } from "./engine/random";
import { cdf } from "./engine/normal";
import nifty from "./data/nifty50.json";

/**
 * Style lab — each new figure type shown in one real beat from a chapter, so the sponsor can judge
 * the mode before the chapter is built. Nothing here is a chapter; everything here graduates into one.
 */
export function Lab() {
  return (
    <main className="chapter">
      <header className="chapter-head">
        <div className="chapter-id">Style lab</div>
        <h1>Six new kinds of figure, one real beat each</h1>
        <p className="standfirst">
          A bet with a result card, a comic with faces, a grid you can count, a real screen with hotspots, a sum built one line at a time, and a
          rendered clip with beats. Judge each by the brief: easy first, interesting second, interactive third.
        </p>
      </header>
      <div className="prose">
        <h2>1 · The bet — B4’s opening question</h2>
        <p>Before anything is explained, the reader commits. The card afterwards never says “wrong”; it says what happened and why.</p>
      </div>
      <SquaresBet />

      <div className="prose">
        <h2>2 · The comic — two accountants (B4)</h2>
        <p>A derivation told by characters who disagree. The faces are the legend wherever these two appear later.</p>
      </div>
      <Accountants />

      <div className="prose">
        <h2>3 · The icon grid — a year of NIFTY, one square per day</h2>
        <p>Counts are things. “8 of 247” stays in the head; “3.2 %” does not. The data is real, from the file you sent.</p>
      </div>
      <NiftyDays />

      <div className="prose">
        <h2>4 · The annotated real thing — your NSE option chain (C1)</h2>
        <p>Definitions live on the object. Click a number, or let it walk you through.</p>
      </div>
      <ChainArtefact />

      <div className="prose">
        <h2>5 · The ledger — Mel’s tax, one line at a time (A1)</h2>
        <p>The derivation that was a narrated timeline, now a sum you build by clicking. Every number is born before any formula is written.</p>
      </div>
      <MelLedger />

      <div className="prose">
        <h2>6 · The clip — slope, then bend (0.1 / C4)</h2>
        <p>A rendered animation with beats you can jump between, captions that double as the voice track, and a stills-only mode.</p>
      </div>
      <TangentClip />
    </main>
  );
}

/* ---------- 1. Bet ---------- */
function SquaresBet() {
  const [pick, setPick] = useBet<"shrinks" | "stays" | "grows">("lab-squares");
  const table = useMemo(() => {
    const r = rng(2026);
    return [4, 16, 64, 256, 1024].map((n) => {
      const dt = 1 / n;
      let sq = 0,
        sdt = 0,
        sum = 0;
      for (let i = 0; i < n; i++) {
        const dW = Math.sqrt(dt) * normalSample(r);
        sum += dW;
        sq += dW * dW;
        sdt += dt * dt;
      }
      return { n, sum, sq, sdt };
    });
  }, []);
  return (
    <Figure
      n="L1"
      prompt={
        <>
          A price wobbles up and down all year. Chop the year into finer and finer steps and add up the <strong>square</strong> of every step.
        </>
      }
    >
      <Bet
        question="As the steps get tiny, the total of the squared wobbles…"
        options={[
          { id: "shrinks", label: "shrinks to nothing — tiny squared is tinier" },
          { id: "stays", label: "settles on one number" },
          { id: "grows", label: "blows up — there are more and more of them" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <table className="table" style={{ maxWidth: 560, margin: "0.75rem 0" }}>
          <thead>
            <tr>
              <th>steps in the year</th>
              <th>net move</th>
              <th>sum of squared moves</th>
              <th>sum of squared time-steps</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => (
              <tr key={row.n}>
                <td>{row.n}</td>
                <td className="num">{row.sum.toFixed(2)}</td>
                <td className="num" style={{ color: "var(--truth-text)", fontWeight: 600 }}>
                  {row.sq.toFixed(2)}
                </td>
                <td className="num" style={{ color: "var(--ink-3)" }}>
                  {row.sdt.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ResultCard
          yours={pick === "shrinks" ? "it shrinks to nothing" : pick === "stays" ? "it settles on one number" : "it blows up"}
          answer="it settles on one number — about 1.0, the length of the year"
          verdict={pick === "stays" ? "right" : "miss"}
        >
          Each step is small, so its square is tiny — but there are many steps, and the two effects cancel exactly. The squared time-steps (right column)
          do vanish. The squared price-steps do not. That stubborn total is the whole of chapter B4; everything else is bookkeeping.
        </ResultCard>
      </Bet>
    </Figure>
  );
}

/* ---------- 2. Comic ---------- */
function Accountants() {
  const Up = ({ x, y, up }: { x: number; y: number; up: boolean }) => (
    <path d={up ? `M${x} ${y} l18 -22` : `M${x} ${y} l18 22`} stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
  );
  const Sq = ({ x, y, role }: { x: number; y: number; role: "truth" | "approx" }) => <rect x={x} y={y} width="14" height="14" fill={`var(--${role})`} rx="2" />;
  return (
    <Figure n="L2" prompt="Two accountants watch the same stock for two days. Who is right?">
      <Comic cols={2}>
        <Panel n={1} caption="Day 1: up ₹1. Day 2: down ₹1. The price is back where it started.">
          <svg viewBox="0 0 160 90" width="100%" style={{ maxWidth: 300 }}>
            <line x1="10" y1="60" x2="150" y2="60" stroke="var(--ghost)" />
            <Up x={30} y={60} up />
            <Up x={48} y={38} up={false} />
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
        <Panel n={4} caption="A year of steps later, Ada’s pile of squares has grown to a number — and it is the same number every year. That number has a name.">
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
        <Who name="Mel" /> keeps first-order books, and his profit-and-loss is wrong every single day the price moves. <Who name="Ada" /> keeps the squares, and
        her books balance. Chapter B4 is Ada’s accounting.
      </div>
    </Figure>
  );
}

/* ---------- 3. Icon grid with real data ---------- */
function NiftyDays() {
  const { rets, big, expected } = useMemo(() => {
    const c = nifty.rows.map((r) => r.c);
    const rets = c.slice(1).map((v, i) => Math.log(v / c[i]));
    const sd = Math.sqrt(rets.reduce((s, x) => s + x * x, 0) / rets.length);
    const big = new Set(rets.map((x, i) => (Math.abs(x) > 0.02 ? i : -1)).filter((i) => i >= 0));
    const z = 0.02 / sd;
    const expected = rets.length * 2 * (1 - cdf(z));
    return { rets, big, expected };
  }, []);
  return (
    <Figure n="L3" prompt={<>Every trading day of the last year, one square each. Rose: the index moved more than 2 % that day.</>}>
      <IconGrid
        n={rets.length}
        perRow={25}
        groupEvery={5}
        roleOf={(i) => (big.has(i) ? "error" : "ghost")}
        titleOf={(i) => `${nifty.rows[i + 1].d}: ${(rets[i] * 100).toFixed(2)} %`}
        label={
          <>
            NIFTY 50, {nifty.rows[0].d} to {nifty.rows[nifty.rows.length - 1].d}: <strong>{big.size} of {rets.length}</strong> days beyond 2 %. A bell curve with this
            year’s spread would have promised about <strong>{expected.toFixed(0)}</strong>. Hover a square for its date.
          </>
        }
      />
    </Figure>
  );
}

/* ---------- 4. Artefact ---------- */
function ChainArtefact() {
  return (
    <Figure n="L4" prompt="The NSE option chain for NIFTY, 23 October 2026, as a trader sees it. Nothing here is simulated.">
      <Artefact
        src={import.meta.env.BASE_URL + "artefacts/nse-nifty-chain-2026-10-23.png"}
        alt="NSE NIFTY option chain screenshot"
        width={1910}
        height={917}
        caption="One row per strike. Calls on the left, puts on the right, the strike price down the middle."
        hotspots={[
          { x: 46.6, y: 17, w: 5.8, h: 80, title: "Strike.", note: "The price you would be allowed to buy (call) or sell (put) the index at. The table is sorted by it." },
          { x: 23.3, y: 17, w: 3.8, h: 80, title: "Call LTP.", note: "The last traded price of the call. It falls as the strike rises: the right to buy at 23,000 is worth less than the right to buy at 22,250." },
          { x: 71.7, y: 17, w: 4, h: 80, title: "Put LTP.", note: "The last traded price of the put. It rises with the strike: the right to sell high is worth more." },
          { x: 23, y: 51, w: 56, h: 4.8, title: "One row, two prices.", note: "Strike 22,600: call 249.15, put 249.60 — almost equal, because 22,600 is roughly where the index is. This row is what ‘at the money’ means." },
          { x: 20.3, y: 17, w: 3, h: 80, title: "IV — implied volatility.", note: "Not a traded price: a number backed out of the price. Calls sit near 13–14, puts near 18. Same index, same expiry, different numbers — that gap is chapter D2." },
          { x: 34.9, y: 17, w: 7.8, h: 80, title: "Bid and ask.", note: "What buyers offer and sellers want. The gap between them is the cost of trading now rather than waiting." },
        ]}
      />
    </Figure>
  );
}

/* ---------- 5. Ledger ---------- */
function MelLedger() {
  return (
    <Figure n="L5" prompt="Mel bets 1 % of her money on a fair coin every day. Her average year ends at 100. Where does her typical year end?">
      <Ledger
        rows={[
          { label: "A winning day multiplies her money by", work: "1 + 0.01", value: "1.01" },
          { label: "A losing day multiplies it by", work: "1 − 0.01", value: "0.99" },
          { label: "One win and one loss together", work: "1.01 × 0.99", value: "0.9999", role: "error", note: "Not 1. Up 1 % then down 1 % leaves you 0.01 % short. That is the tax." },
          { label: "The tax per pair, as a fraction", work: "1 − 0.9999 = ½ × 0.01²", value: "0.00005" },
          { label: "Pairs of days in a year", work: "250 ÷ 2", value: "125" },
          { label: "Tax for the year", work: "125 × 0.00005", value: "0.00625 ≈ 0.6 %", role: "error" },
          { label: "A typical year (half wins, half losses) ends at", work: "100 × 0.9999^125", value: "98.76", role: "approx", note: "The average year is still exactly 100: a few very lucky years pull the mean up while the typical year sinks. That 1.24 gap is volatility drag." },
        ]}
      />
    </Figure>
  );
}

/* ---------- 6. Clip ---------- */
function TangentClip() {
  const base = import.meta.env.BASE_URL + "clips/lab/";
  return (
    <Figure n="L6" prompt="A rendered clip: the tangent line, then the parabola, sliding along a curve.">
      <Clip
        src={{ mp4: base + "tangent.mp4", webm: base + "tangent.webm" }}
        poster={base + "tangent.png"}
        ariaLabel="A curve with a sliding tangent line and a quadratic fit"
        beats={[
          { at: 0, caption: "A smooth curve. The dot is where we stand today." },
          { at: 3.4, caption: "First guess for a small move: the straight line through the dot — the slope." },
          { at: 4.6, caption: "Second guess: add the bend, a parabola that hugs the curve a little longer." },
          { at: 5.8, caption: "Slide along the curve. The slope and the bend change together — later, these two numbers get Greek names." },
        ]}
      />
    </Figure>
  );
}
