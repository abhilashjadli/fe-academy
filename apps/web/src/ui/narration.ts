import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Voice track using the browser's built-in speech synthesis (no files, no accounts, works offline).
 * One global preference, remembered per browser. A studio voice (recorded audio) can replace this later
 * behind the same interface: speak(text), stop(), speaking().
 */
const KEY = "fe-voice";
let enabledGlobal = (() => {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
})();
const listeners = new Set<(v: boolean) => void>();

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefs = [/en-GB/i, /en-IN/i, /en-US/i, /^en/i];
  const quality = (v: SpeechSynthesisVoice) => (/natural|neural|premium|enhanced|google uk|daniel|samantha|serena/i.test(v.name) ? 1 : 0);
  for (const re of prefs) {
    const c = voices.filter((v) => re.test(v.lang)).sort((a, b) => quality(b) - quality(a));
    if (c.length) return c[0];
  }
  return voices[0];
}

export function useNarration() {
  const available = typeof window !== "undefined" && "speechSynthesis" in window;
  const [enabled, setEnabled] = useState(enabledGlobal);
  useEffect(() => {
    const l = (v: boolean) => setEnabled(v);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  const toggle = useCallback(() => {
    enabledGlobal = !enabledGlobal;
    try {
      localStorage.setItem(KEY, enabledGlobal ? "on" : "off");
    } catch {
      /* ignore */
    }
    if (!enabledGlobal && available) speechSynthesis.cancel();
    listeners.forEach((l) => l(enabledGlobal));
  }, [available]);
  const speak = useCallback(
    (text: string) => {
      if (!available || !enabledGlobal) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 1.0;
      u.pitch = 1.0;
      speechSynthesis.speak(u);
    },
    [available],
  );
  const stop = useCallback(() => {
    if (available) speechSynthesis.cancel();
  }, [available]);
  const speaking = useCallback(() => available && (speechSynthesis.speaking || speechSynthesis.pending), [available]);
  return useMemo(() => ({ available, enabled, toggle, speak, stop, speaking }), [available, enabled, toggle, speak, stop, speaking]);
}
