import "./figures/figures.css";
import { F0Sort } from "./figures/F0Sort";
import { F1Fence } from "./figures/F1Fence";
import { F2Raj } from "./figures/F2Raj";
import { F3Stills } from "./figures/F3Stills";

export function VarChapter() {
  return (
    <article className="chapter e1">
      <header className="chapter-head">
        <p className="chapter-id">Chapter E1 · Value at Risk and Expected Shortfall</p>
        <h1>A line through the bad days</h1>
      </header>

      <F0Sort />

      <div className="prose">
        <p>[prose]</p>
      </div>

      <F1Fence />

      <div className="prose">
        <p>[prose]</p>
      </div>

      <F2Raj />

      <div className="prose">
        <p>[prose]</p>
      </div>

      <F3Stills />
    </article>
  );
}
