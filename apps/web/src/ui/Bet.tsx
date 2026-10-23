import { useEffect, useState, type ReactNode } from "react";

/**
 * Ask before you tell. A Bet shows 2–4 options (or a free number) and remembers the pick;
 * the figure then renders the result with a ResultCard that names the pick and the answer.
 * The guess is remembered per key in localStorage so a reload keeps it.
 */
export interface BetOption<T extends string = string> {
  id: T;
  label: ReactNode;
}

export function useBet<T extends string>(key: string) {
  const [pick, setPickState] = useState<T | null>(() => {
    try {
      return (localStorage.getItem("fe-bet:" + key) as T) || null;
    } catch {
      return null;
    }
  });
  const setPick = (v: T | null) => {
    setPickState(v);
    try {
      if (v === null) localStorage.removeItem("fe-bet:" + key);
      else localStorage.setItem("fe-bet:" + key, v);
    } catch {
      /* ignore */
    }
  };
  return [pick, setPick] as const;
}

export function Bet<T extends string>({
  question,
  options,
  pick,
  onPick,
  children,
}: {
  question: ReactNode;
  options: BetOption<T>[];
  pick: T | null;
  onPick: (v: T | null) => void;
  /** what to show once a pick is made (usually the figure plus a ResultCard) */
  children?: ReactNode;
}) {
  return (
    <div className={"bet " + (pick ? "bet-done" : "")}>
      <div className="bet-q">{question}</div>
      <div className="bet-opts" role="group">
        {options.map((o) => (
          <button key={o.id} type="button" className={"btn bet-opt " + (pick === o.id ? "picked" : "")} aria-pressed={pick === o.id} disabled={!!pick && pick !== o.id} onClick={() => onPick(o.id)}>
            {o.label}
          </button>
        ))}
        {pick && (
          <button type="button" className="btn bet-again" onClick={() => onPick(null)}>
            change my bet
          </button>
        )}
      </div>
      {pick && children}
    </div>
  );
}

/** A number the reader types or drags before the reveal. */
export function BetNumber({
  question,
  unit,
  value,
  onCommit,
  committed,
  min,
  max,
  step = 1,
  children,
}: {
  question: ReactNode;
  unit?: string;
  value: number | null;
  onCommit: (v: number | null) => void;
  committed: boolean;
  min: number;
  max: number;
  step?: number;
  children?: ReactNode;
}) {
  const [draft, setDraft] = useState<string>(value === null ? "" : String(value));
  useEffect(() => {
    if (value !== null) setDraft(String(value));
  }, [value]);
  return (
    <div className={"bet " + (committed ? "bet-done" : "")}>
      <div className="bet-q">{question}</div>
      <form
        className="bet-opts"
        onSubmit={(e) => {
          e.preventDefault();
          const v = parseFloat(draft);
          if (!Number.isNaN(v)) onCommit(Math.max(min, Math.min(max, v)));
        }}
      >
        <input className="bet-num" type="number" inputMode="decimal" min={min} max={max} step={step} value={draft} disabled={committed} onChange={(e) => setDraft(e.target.value)} aria-label="your guess" />
        {unit && <span className="bet-unit">{unit}</span>}
        {!committed ? (
          <button type="submit" className="btn primary" disabled={draft === ""}>
            lock it in
          </button>
        ) : (
          <button type="button" className="btn bet-again" onClick={() => onCommit(null)}>
            change my guess
          </button>
        )}
      </form>
      {committed && children}
    </div>
  );
}

/**
 * The reward. Says what you said, what happened, and one line of why. Never says "incorrect".
 * verdict: "right" | "close" | "miss" | "none" (no judgement, e.g. an open bet)
 */
export function ResultCard({ yours, answer, verdict = "none", children }: { yours: ReactNode; answer: ReactNode; verdict?: "right" | "close" | "miss" | "none"; children?: ReactNode }) {
  const head = verdict === "right" ? "You called it." : verdict === "close" ? "Close." : verdict === "miss" ? "Not this time — and the reason is the lesson." : "Here is what happened.";
  return (
    <div className={"result result-" + verdict} role="status">
      <div className="result-head">{head}</div>
      <div className="result-row">
        <span className="k">You said</span>
        <span className="v">{yours}</span>
      </div>
      <div className="result-row">
        <span className="k">It was</span>
        <span className="v">{answer}</span>
      </div>
      {children && <div className="result-why">{children}</div>}
    </div>
  );
}
