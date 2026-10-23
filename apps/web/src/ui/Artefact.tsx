import { useState, type ReactNode } from "react";

/**
 * Annotated real artefact: a screenshot, table or drawing of the real thing (an option chain, a risk
 * report line, a term sheet) with numbered hotspots. The reader clicks a hotspot — or walks them in
 * order with Next — and one short note appears. Definitions live on the object they belong to.
 */
export interface Hotspot {
  /** position and size as percentages of the artefact box */
  x: number;
  y: number;
  w: number;
  h: number;
  title: ReactNode;
  note: ReactNode;
}

export function Artefact({ src, alt, width, height, hotspots, caption, children }: { src?: string; alt?: string; width: number; height: number; hotspots: Hotspot[]; caption?: ReactNode; children?: ReactNode }) {
  const [i, setI] = useState<number | null>(null);
  const cur = i === null ? null : hotspots[i];
  return (
    <div className="artefact">
      <div className="artefact-box" style={{ aspectRatio: `${width} / ${height}` }}>
        {src ? <img src={src} alt={alt ?? ""} /> : children}
        {hotspots.map((h, k) => (
          <button
            key={k}
            type="button"
            className={"hotspot " + (i === k ? "on" : "")}
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
            aria-label={typeof h.title === "string" ? h.title : `hotspot ${k + 1}`}
            onClick={() => setI(i === k ? null : k)}
          >
            <span className="hotspot-n">{k + 1}</span>
          </button>
        ))}
      </div>
      <div className="artefact-note">
        <div className="steps-nav">
          <button type="button" className="btn" disabled={i === null || i === 0} onClick={() => setI((i ?? 1) - 1)}>
            ← Back
          </button>
          <button type="button" className="btn primary" disabled={i !== null && i >= hotspots.length - 1} onClick={() => setI(i === null ? 0 : i + 1)}>
            {i === null ? "Walk me through it" : "Next →"}
          </button>
          <span className="step-n">{i === null ? `${hotspots.length} things to notice` : `${i + 1} of ${hotspots.length}`}</span>
        </div>
        {cur ? (
          <div className="artefact-text">
            <strong>{cur.title}</strong> {cur.note}
          </div>
        ) : (
          caption && <div className="artefact-text">{caption}</div>
        )}
      </div>
    </div>
  );
}
