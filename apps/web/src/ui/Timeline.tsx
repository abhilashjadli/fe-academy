import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNarration } from "./narration";

export interface Segment {
  /** seconds this segment plays for (at 1×) */
  duration: number;
  /** caption shown while the segment plays */
  caption: ReactNode;
  /** text to read aloud (defaults to a plain-text version of the caption if it is a string) */
  speak?: string;
}

interface Props {
  segments: Segment[];
  /**
   * Render the figure at global time t (seconds), segment index i and local progress u in [0, 1].
   * Must be a pure function of (t, i, u) so scrubbing is exact.
   */
  render: (t: number, i: number, u: number) => ReactNode;
  autoplay?: boolean;
  /** called when playback reaches the end */
  onEnd?: () => void;
  ariaLabel?: string;
}

/**
 * A scrubbable animation: play/pause, speed, a scrubber over the whole duration, captions synced to segments,
 * and an optional voice track. With voice on, the timeline holds the last frame of a segment until its
 * narration has finished, so the picture never runs ahead of the words.
 */
export function Timeline({ segments, render, autoplay = false, onEnd }: Props) {
  const total = useMemo(() => segments.reduce((s, g) => s + g.duration, 0), [segments]);
  const starts = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const g of segments) {
      out.push(acc);
      acc += g.duration;
    }
    return out;
  }, [segments]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(1);
  const narration = useNarration();
  const raf = useRef(0);
  const last = useRef(0);
  const spokenSeg = useRef(-1);
  const holding = useRef(false);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const segAt = useCallback(
    (time: number) => {
      let i = segments.length - 1;
      for (let k = 0; k < segments.length; k++) if (time < starts[k] + segments[k].duration) { i = k; break; }
      const u = Math.max(0, Math.min(1, (time - starts[i]) / segments[i].duration));
      return { i, u };
    },
    [segments, starts],
  );

  // speak the caption when a new segment begins (voice on)
  const speakSegment = useCallback(
    (i: number) => {
      if (!narration.enabled) return;
      const g = segments[i];
      const text = g.speak ?? (typeof g.caption === "string" ? g.caption : "");
      if (!text) return;
      spokenSeg.current = i;
      narration.speak(text);
    },
    [narration, segments],
  );

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      return;
    }
    last.current = performance.now();
    const step = (now: number) => {
      const dt = ((now - last.current) / 1000) * speed;
      last.current = now;
      setT((prev) => {
        const { i } = segAt(prev);
        if (spokenSeg.current !== i) speakSegment(i);
        const segEnd = starts[i] + segments[i].duration;
        let next = prev + dt;
        if (next >= segEnd - 1e-6) {
          // hold at the end of the segment while narration is still speaking
          if (narration.enabled && narration.speaking()) {
            holding.current = true;
            return segEnd - 1e-4;
          }
          holding.current = false;
        }
        if (next >= total) {
          setPlaying(false);
          onEnd?.();
          return total;
        }
        return next;
      });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, narration.enabled]);

  useEffect(() => () => narration.stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const { i, u } = segAt(t);
  const seek = (time: number) => {
    narration.stop();
    spokenSeg.current = -1;
    setT(Math.max(0, Math.min(total, time)));
  };
  const toggle = () => {
    if (!playing && t >= total - 1e-6) seek(0);
    if (playing) narration.stop();
    spokenSeg.current = playing ? spokenSeg.current : -1;
    setPlaying((p) => !p);
  };
  const fmtT = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="timeline">
      <div className="timeline-stage">{render(reduced ? starts[i] + segments[i].duration - 1e-4 : t, i, reduced ? 1 : u)}</div>
      <div className="timeline-caption" aria-live="polite">
        <span className="timeline-n">
          {i + 1}/{segments.length}
        </span>
        <span>{segments[i].caption}</span>
      </div>
      <div className="timeline-bar">
        <button type="button" className="btn primary" onClick={toggle} aria-label={playing ? "pause" : "play"}>
          {playing ? "Pause" : t >= total - 1e-6 ? "Replay" : "Play"}
        </button>
        <input
          type="range"
          className="timeline-scrub"
          min={0}
          max={total}
          step={0.01}
          value={t}
          onChange={(e) => seek(parseFloat(e.target.value))}
          aria-label="scrub"
          style={{ backgroundSize: `${(100 * t) / total}% 100%` }}
        />
        <span className="readout num">
          {fmtT(t)} / {fmtT(total)}
        </span>
        <span className="seg" role="group" aria-label="speed">
          {[0.5, 1, 2].map((s) => (
            <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)}>
              {s}×
            </button>
          ))}
        </span>
        <span className="seg" role="group" aria-label="chapters">
          {segments.map((_, k) => (
            <button key={k} type="button" aria-pressed={k === i} onClick={() => seek(starts[k])} title={`part ${k + 1}`}>
              {k + 1}
            </button>
          ))}
        </span>
        <button type="button" className={"btn " + (narration.enabled ? "toggled" : "")} aria-pressed={narration.enabled} onClick={() => narration.toggle()} title={narration.available ? "read the captions aloud" : "no speech voices available in this browser"} disabled={!narration.available}>
          {narration.enabled ? "Voice on" : "Voice off"}
        </button>
      </div>
    </div>
  );
}
