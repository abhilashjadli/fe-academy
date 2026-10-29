import { useState, type ReactNode } from "react";

/**
 * A clip and its pressable twin share ONE figure: two tabs, "watch" and "do it yourself".
 * The clip is never a separate figure (style guide rule 12). Opens on "do" by default; the
 * watch tab is there for the reader who wants to see it first.
 */
export function WatchOrDo({ watch, children, startOn = "do", watchLabel = "watch it (20 s)", doLabel = "do it yourself" }: { watch: ReactNode; children: ReactNode; startOn?: "watch" | "do"; watchLabel?: string; doLabel?: string }) {
  const [tab, setTab] = useState<"watch" | "do">(startOn);
  return (
    <div className="watchdo">
      <div className="watchdo-tabs">
        <span className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "watch"} aria-pressed={tab === "watch"} onClick={() => setTab("watch")}>
            {watchLabel}
          </button>
          <button type="button" role="tab" aria-selected={tab === "do"} aria-pressed={tab === "do"} onClick={() => setTab("do")}>
            {doLabel}
          </button>
        </span>
      </div>
      <div hidden={tab !== "watch"}>{watch}</div>
      <div hidden={tab !== "do"}>{children}</div>
    </div>
  );
}
