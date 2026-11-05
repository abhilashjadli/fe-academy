import "./figures/figures.css";
import { F0RiskLine } from "./figures/F0RiskLine";
import { F1Comic } from "./figures/F1Comic";
import { F2Surface } from "./figures/F2Surface";
import { F3Scrub } from "./figures/F3Scrub";
import { F4Ledger } from "./figures/F4Ledger";
import { F5Dial } from "./figures/F5Dial";

/** Chapter C4 — Greeks I. Stub: the six figures in order; the prose page replaces this. */
export function GreeksChapter() {
  return (
    <article className="chapter c4">
      <F0RiskLine />
      <F1Comic />
      <F2Surface />
      <F3Scrub />
      <F4Ledger />
      <F5Dial />
    </article>
  );
}
