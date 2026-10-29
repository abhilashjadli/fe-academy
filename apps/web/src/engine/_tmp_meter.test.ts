import { it } from "vitest";
import { betOnStreaks, customRule, doubling, fixedBet, habitRule, quitAt, quitWhenAhead, simulatePlayers, type Strategy } from "./martingale";
import { rng } from "./random";
it("margins", () => {
  const strategies: Strategy[] = [fixedBet(1), fixedBet(3), quitWhenAhead(1, 200), quitWhenAhead(5, 200), quitAt(5, 20), doubling(31), betOnStreaks(3, 2),
    customRule((h) => (h.streak < 0 ? 2 : h.w > 10 ? 0 : 1), "bet 2 after a loss, leave at +10"), habitRule(1, 3, 8, 12)];
  for (const s of strategies) {
    const r = simulatePlayers(s, 10_000, 200, rng(s.name.length * 1000 + 17));
    console.log(s.name.padEnd(40), "mean", r.mean.toFixed(3), "se", r.se.toFixed(3), "z", (r.mean / r.se).toFixed(2), "pAhead", r.pAhead.toFixed(3), "median", r.median);
  }
});
