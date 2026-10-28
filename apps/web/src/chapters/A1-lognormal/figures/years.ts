/** "once in …" in units a person feels: days, months, years, centuries, never scientific notation. */
export function fmtYears(y: number): string {
  if (!Number.isFinite(y)) return "never";
  if (y < 1 / 12) return `${Math.max(1, Math.round(y * 252))} trading days`;
  if (y < 1) return `${Math.round(y * 12)} months`;
  if (y < 10) return `${y.toFixed(1)} years`;
  if (y < 1000) return `${Math.round(y)} years`;
  if (y < 1e6) return `${Math.round(y / 100).toLocaleString()} centuries`;
  if (y < 1e9) return `${Math.round(y / 1e6).toLocaleString()} million years`;
  if (y < 1e12) return `${Math.round(y / 1e9).toLocaleString()} billion years`;
  return "longer than the universe has existed";
}
