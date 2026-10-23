import type { ReactNode } from "react";

/**
 * Comic: a strip of panels, each with a drawing (any ReactNode: SVG, a small Plot, an Avatar) and a
 * one-line caption. Reads left to right, wraps on phones. No interaction by default — the strip is
 * for ideas that are a story (a derivation told by characters, a failure that happens to someone).
 */
export function Comic({ children, cols }: { children: ReactNode; cols?: number }) {
  return (
    <div className="comic" style={cols ? ({ "--comic-cols": cols } as React.CSSProperties) : undefined}>
      {children}
    </div>
  );
}

export function Panel({ n, caption, children, wide }: { n?: number; caption?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className={"panel " + (wide ? "panel-wide" : "")}>
      {n !== undefined && <span className="panel-n">{n}</span>}
      <div className="panel-art">{children}</div>
      {caption && <div className="panel-cap">{caption}</div>}
    </div>
  );
}

/** A speech line next to a character. */
export function Says({ who, children, mood }: { who: string; children: ReactNode; mood?: Mood }) {
  return (
    <div className="says">
      <Avatar name={who} mood={mood} size={36} />
      <div className="bubble">
        <span className="who">{who}</span>
        {children}
      </div>
    </div>
  );
}

export type Mood = "neutral" | "happy" | "worried" | "surprised" | "smug" | "thinking";

/** Character register: colour + hair + glasses, deterministic by name so a face is the same in every chapter. */
const REGISTER: Record<string, { colour: string; hair: "short" | "long" | "bun" | "bald" | "curly"; glasses?: boolean; skin: string }> = {
  Ada: { colour: "var(--truth)", hair: "bun", glasses: true, skin: "#e9c2a0" },
  Mel: { colour: "var(--approx)", hair: "short", skin: "#c68c5a" },
  Priya: { colour: "var(--truth)", hair: "long", skin: "#b8743f" },
  Raj: { colour: "var(--error)", hair: "short", glasses: true, skin: "#a86a3b" },
  You: { colour: "var(--ink-2)", hair: "curly", skin: "#d9a97f" },
  Desk: { colour: "var(--ink-2)", hair: "bald", glasses: true, skin: "#e0b48f" },
};
const PALETTE = ["var(--truth)", "var(--approx)", "var(--error)", "var(--ink-2)"];
const HAIRS = ["short", "long", "bun", "curly", "bald"] as const;

function lookup(name: string) {
  if (REGISTER[name]) return REGISTER[name];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { colour: PALETTE[h % PALETTE.length], hair: HAIRS[(h >> 3) % HAIRS.length], glasses: ((h >> 5) & 1) === 1, skin: "#d9a97f" };
}

/**
 * A line-drawn face, 2-colour, deterministic per name. Used as the legend wherever the character's
 * data appears: the face's ring colour is the character's series colour.
 */
export function Avatar({ name, mood = "neutral", size = 48, title }: { name: string; mood?: Mood; size?: number; title?: string }) {
  const r = lookup(name);
  const eyeY = 20,
    eyeDx = 7;
  const mouth =
    mood === "happy"
      ? "M17 31 Q24 37 31 31"
      : mood === "worried"
        ? "M17 34 Q24 29 31 34"
        : mood === "surprised"
          ? "M21 31 a3 3.6 0 1 0 6 0 a3 3.6 0 1 0 -6 0"
          : mood === "smug"
            ? "M18 32 Q26 36 31 30"
            : mood === "thinking"
              ? "M19 33 L29 33"
              : "M18 32 Q24 34 30 32";
  const brows =
    mood === "worried" ? (
      <>
        <path d="M13 15 L21 17" />
        <path d="M27 17 L35 15" />
      </>
    ) : mood === "surprised" ? (
      <>
        <path d="M13 13 Q17 10 21 13" />
        <path d="M27 13 Q31 10 35 13" />
      </>
    ) : mood === "smug" ? (
      <>
        <path d="M13 16 L21 14" />
        <path d="M27 14 L35 16" />
      </>
    ) : null;
  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={title ?? name} style={{ color: r.colour }}>
      <circle cx="24" cy="24" r="22.5" fill="var(--surface-raised)" stroke="currentColor" strokeWidth="2.5" />
      {/* hair */}
      {r.hair === "short" && <path d="M8 22 Q10 6 24 6 Q38 6 40 22 Q36 12 24 12 Q12 12 8 22 Z" fill="currentColor" opacity="0.85" />}
      {r.hair === "long" && <path d="M7 40 Q4 10 24 6 Q44 10 41 40 L36 40 Q38 18 24 13 Q10 18 12 40 Z" fill="currentColor" opacity="0.85" />}
      {r.hair === "bun" && (
        <>
          <circle cx="24" cy="7" r="5" fill="currentColor" opacity="0.85" />
          <path d="M8 22 Q10 8 24 8 Q38 8 40 22 Q36 13 24 13 Q12 13 8 22 Z" fill="currentColor" opacity="0.85" />
        </>
      )}
      {r.hair === "curly" && (
        <path d="M7 24 a5 5 0 0 1 4 -9 a5 5 0 0 1 6 -6 a5 5 0 0 1 7 -2 a5 5 0 0 1 7 2 a5 5 0 0 1 6 6 a5 5 0 0 1 4 9 Q36 14 24 13 Q12 14 7 24 Z" fill="currentColor" opacity="0.85" />
      )}
      {/* face */}
      <ellipse cx="24" cy="26" rx="13" ry="15" fill={r.skin} stroke="var(--ink)" strokeWidth="1.2" />
      <g stroke="var(--ink)" strokeWidth="1.4" fill="none" strokeLinecap="round">
        {brows}
        {mood === "happy" ? (
          <>
            <path d={`M${24 - eyeDx - 2} ${eyeY + 1} q2 -3 4 0`} />
            <path d={`M${24 + eyeDx - 2} ${eyeY + 1} q2 -3 4 0`} />
          </>
        ) : (
          <>
            <circle cx={24 - eyeDx} cy={eyeY} r={mood === "surprised" ? 2.2 : 1.5} fill="var(--ink)" />
            <circle cx={24 + eyeDx} cy={eyeY} r={mood === "surprised" ? 2.2 : 1.5} fill="var(--ink)" />
          </>
        )}
        {r.glasses && (
          <>
            <circle cx={24 - eyeDx} cy={eyeY} r="4.5" />
            <circle cx={24 + eyeDx} cy={eyeY} r="4.5" />
            <path d={`M${24 - eyeDx + 4.5} ${eyeY} L${24 + eyeDx - 4.5} ${eyeY}`} />
          </>
        )}
        <path d={mouth} fill={mood === "surprised" ? "var(--ink)" : "none"} />
      </g>
    </svg>
  );
}

/** A legend chip: face + name, in the character's colour. */
export function Who({ name, mood }: { name: string; mood?: Mood }) {
  return (
    <span className="who-chip" style={{ color: lookup(name).colour }}>
      <Avatar name={name} mood={mood} size={22} />
      <span>{name}</span>
    </span>
  );
}

export function characterColour(name: string) {
  return lookup(name).colour;
}
