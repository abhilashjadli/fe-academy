import { useEffect, useState, type ReactNode } from "react";

export interface Step {
  caption: ReactNode;
}

interface Props {
  steps: Step[];
  /** render the figure body for step i */
  render: (i: number) => ReactNode;
  /** optional: lift the step index (e.g. to sync controls) */
  onStep?: (i: number) => void;
}

/**
 * Button-driven step-through: Back / Reset / Forward, "step i of n", the caption changes per step,
 * the body does one thing per click. Keyboard: ← → Home.
 */
export function StepThrough({ steps, render, onStep }: Props) {
  const [i, setI] = useState(0);
  const n = steps.length;
  const go = (j: number) => {
    const k = Math.max(0, Math.min(n - 1, j));
    setI(k);
    onStep?.(k);
  };
  useEffect(() => {
    onStep?.(i);
  }, []);
  return (
    <div
      className="steps"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(i + 1);
        else if (e.key === "ArrowLeft") go(i - 1);
        else if (e.key === "Home") go(0);
      }}
    >
      <div>{render(i)}</div>
      <div className="steps-caption">
        <div className="step-n">
          Step {i + 1} of {n}
        </div>
        <div className="step-text">{steps[i].caption}</div>
        <div className="steps-nav">
          <button type="button" className="btn" disabled={i === 0} onClick={() => go(i - 1)}>
            Back
          </button>
          <button type="button" className="btn" onClick={() => go(0)}>
            Reset
          </button>
          <button type="button" className="btn primary" disabled={i === n - 1} onClick={() => go(i + 1)}>
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}
