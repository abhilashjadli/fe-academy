import type { ReactNode } from "react";

interface FigureProps {
  n: string;
  prompt: ReactNode;
  children: ReactNode;
  controls?: ReactNode;
  observe?: ReactNode;
}

/** The figure frame: prompt above, the live body, controls row, the observation below. */
export function Figure({ n, prompt, children, controls, observe }: FigureProps) {
  return (
    <figure className="figure" id={"fig-" + n}>
      <div className="figure-prompt">
        <span>{prompt}</span>
        <span className="figure-n">Figure {n}</span>
      </div>
      <div className="figure-body">{children}</div>
      {controls && <div className="figure-controls">{controls}</div>}
      {observe && <figcaption className="figure-observe">{observe}</figcaption>}
    </figure>
  );
}
