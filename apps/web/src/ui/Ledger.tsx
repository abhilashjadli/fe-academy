import { useState, type ReactNode } from "react";

/**
 * Ledger: a worked example with real numbers, one row per click. Each row shows the words, the
 * substituted arithmetic and the value; a running total can sit at the bottom. The reader sees
 * every number born before any formula is written in general.
 */
export interface LedgerRow {
  label: ReactNode;
  /** the arithmetic with numbers substituted, e.g. "½ × 0.01² × 250" */
  work?: ReactNode;
  value: ReactNode;
  role?: "truth" | "approx" | "error";
  /** optional short note shown under the row when it is the newest */
  note?: ReactNode;
}

export function Ledger({ rows, total, start = 1, nextLabel = "next line" }: { rows: LedgerRow[]; total?: (shown: number) => ReactNode; start?: number; nextLabel?: string }) {
  const [shown, setShown] = useState(Math.min(start, rows.length));
  return (
    <div className="ledger">
      <table className="table ledger-table">
        <tbody>
          {rows.slice(0, shown).map((r, k) => (
            <tr key={k} className={(k === shown - 1 ? "hl " : "") + (r.role ? "role-" + r.role : "")}>
              <td className="ledger-label">{r.label}</td>
              <td className="ledger-work">{r.work}</td>
              <td className="ledger-value num">{r.value}</td>
            </tr>
          ))}
          {total && shown > 0 && (
            <tr className="ledger-total">
              <td colSpan={2}>so far</td>
              <td className="num">{total(shown)}</td>
            </tr>
          )}
        </tbody>
      </table>
      {rows[shown - 1]?.note && <div className="ledger-note">{rows[shown - 1].note}</div>}
      <div className="steps-nav">
        <button type="button" className="btn" disabled={shown <= 1} onClick={() => setShown(shown - 1)}>
          ← undo
        </button>
        <button type="button" className="btn primary" disabled={shown >= rows.length} onClick={() => setShown(shown + 1)}>
          {shown >= rows.length ? "that is the whole sum" : nextLabel + " →"}
        </button>
        <button type="button" className="btn" disabled={shown >= rows.length} onClick={() => setShown(rows.length)}>
          show all
        </button>
        <span className="step-n">
          {shown} of {rows.length}
        </span>
      </div>
    </div>
  );
}
