import { useEffect, useRef, useState } from "react";
import { useNarration } from "./narration";

/**
 * Clip: a rendered video (Manim) with beats. Each beat has a start time and a caption; the caption
 * is the narration text when voice is on, and the clip pauses at the end of a beat until the voice
 * has finished. Beat buttons let a clip be read like a step-through. With reduced motion, or before
 * the video loads, the poster and the captions are the whole figure.
 */
export interface Beat {
  /** seconds from the start of the clip */
  at: number;
  caption: string;
}

export function Clip({ src, poster, beats, width = 16, height = 9, ariaLabel }: { src: { mp4?: string; webm?: string }; poster?: string; beats: Beat[]; width?: number; height?: number; ariaLabel?: string }) {
  const v = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [holding, setHolding] = useState(false);
  const narration = useNarration();
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [light, setLight] = useState(reduced);
  const beat = Math.max(
    0,
    beats.findIndex((b, i) => t >= b.at && (i === beats.length - 1 || t < beats[i + 1].at)),
  );
  const lastBeat = useRef(-1);

  // Voice: at each beat boundary, read the caption; hold the clip until it is read.
  useEffect(() => {
    if (beat === lastBeat.current) return;
    lastBeat.current = beat;
    if (!narration.enabled || !playing) return;
    const el = v.current;
    if (!el) return;
    el.pause();
    setHolding(true);
    narration.speak(beats[beat].caption);
    const id = setInterval(() => {
      if (!narration.speaking()) {
        clearInterval(id);
        setHolding(false);
        if (playing) void el.play();
      }
    }, 150);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat, narration.enabled]);

  const seekBeat = (i: number) => {
    const el = v.current;
    if (!el) return;
    el.currentTime = beats[i].at + 0.01;
    setT(el.currentTime);
    lastBeat.current = -1;
  };
  const toggle = () => {
    const el = v.current;
    if (!el) return;
    if (el.paused) {
      if (el.ended) el.currentTime = 0;
      void el.play();
    } else el.pause();
  };

  return (
    <div className="clip">
      <div className="clip-stage" style={{ aspectRatio: `${width} / ${height}` }}>
        {light ? (
          <img src={poster} alt={ariaLabel ?? ""} />
        ) : (
          <video
            ref={v}
            poster={poster}
            playsInline
            preload="metadata"
            aria-label={ariaLabel}
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
            onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onClick={toggle}
          >
            {src.webm && <source src={src.webm} type="video/webm" />}
            {src.mp4 && <source src={src.mp4} type="video/mp4" />}
          </video>
        )}
      </div>
      <div className="timeline-caption">
        <span className="timeline-n">{beat + 1} / {beats.length}</span>
        <span>{beats[beat]?.caption}</span>
      </div>
      <div className="timeline-bar">
        {!light && (
          <>
            <button type="button" className="btn primary" onClick={toggle} aria-label={playing ? "pause" : "play"}>
              {holding ? "…" : playing ? "❚❚" : "▶"}
            </button>
            <input
              className="timeline-scrub"
              type="range"
              min={0}
              max={dur || 1}
              step={0.05}
              value={t}
              onChange={(e) => {
                const el = v.current;
                if (!el) return;
                el.currentTime = parseFloat(e.target.value);
                setT(el.currentTime);
              }}
              aria-label="scrub"
            />
          </>
        )}
        <span className="seg clip-beats" role="group" aria-label="beats">
          {beats.map((_, i) => (
            <button key={i} type="button" aria-pressed={i === beat} onClick={() => (light ? setT(beats[i].at) : seekBeat(i))}>
              {i + 1}
            </button>
          ))}
        </span>
        <button type="button" className="btn" onClick={() => setLight(!light)} title="show the still frame and captions only">
          {light ? "play video" : "stills only"}
        </button>
      </div>
    </div>
  );
}
