import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

/**
 * KaTeX wrapper. Colour-locking: wrap a sub-expression as \tok{truth}{...}, \tok{approx}{...},
 * \tok{error}{...}, \tok{dim}{...}; it renders with the matching CSS class (same colour as the curve).
 */
const MACROS = {
  "\\tok": "\\htmlClass{tok-#1}{#2}",
};

interface Props {
  tex: string;
  block?: boolean;
  className?: string;
}

export function M({ tex, block = false, className }: Props) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        trust: true,
        strict: false,
        macros: MACROS,
      }),
    [tex, block],
  );
  if (block) return <div className={"math-block " + (className ?? "")} dangerouslySetInnerHTML={{ __html: html }} />;
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
