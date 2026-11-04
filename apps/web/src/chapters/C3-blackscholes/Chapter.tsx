import "./figures/figures.css";
import { F0Dial } from "./figures/F0Dial";
import { F1Cloud } from "./figures/F1Cloud";
import { F2Steps } from "./figures/F2Steps";
import { F3Raj } from "./figures/F3Raj";
import { F4Game } from "./figures/F4Game";
import { F5Column } from "./figures/F5Column";

/** Stub: the six figures only. The chapter head, prose and close are written separately and replace this file. */
export function BlackScholesChapter() {
  return (
    <article className="chapter c3">
      <F0Dial />
      <F1Cloud />
      <F2Steps />
      <F3Raj />
      <F4Game />
      <F5Column />
    </article>
  );
}
