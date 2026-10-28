export interface ChapterMeta {
  id: string;
  title: string;
  built?: boolean;
}
export interface Track {
  id: string;
  title: string;
  chapters: ChapterMeta[];
}

export const SYLLABUS: Track[] = [
  {
    id: "0",
    title: "Foundations made interactive",
    chapters: [
      { id: "0.1", title: "Taylor series", built: true },
      { id: "0.2", title: "Counting, the binomial and the normal", built: true },
    ],
  },
  {
    id: "A",
    title: "Probability & statistics for finance",
    chapters: [
      { id: "A1", title: "Normal, lognormal and fat tails", built: true },
      { id: "A2", title: "Dependence: correlation is a shear", built: true },
      { id: "A3", title: "Regression: the line is half the answer", built: true },
      { id: "A4", title: "Time series: stationarity, ARIMA, unit roots" },
      { id: "A5", title: "Volatility: EWMA, ARCH/GARCH" },
    ],
  },
  {
    id: "B",
    title: "Stochastic processes & calculus",
    chapters: [
      { id: "B1", title: "Random walks, Markov chains, Poisson" },
      { id: "B2", title: "Martingales" },
      { id: "B3", title: "Brownian motion, GBM, quadratic variation" },
      { id: "B4", title: "Itô's lemma: the square that would not vanish", built: true },
      { id: "B5", title: "Risk-neutral measure, Girsanov" },
      { id: "B6", title: "Feynman-Kac: PDE ↔ expectation" },
    ],
  },
  {
    id: "C",
    title: "Options",
    chapters: [
      { id: "C1", title: "Mechanics, bounds, put-call parity" },
      { id: "C2", title: "Binomial model → Black-Scholes" },
      { id: "C3", title: "Black-Scholes in detail" },
      { id: "C4", title: "Greeks I" },
      { id: "C5", title: "Greeks II: vanna, volga, charm…" },
    ],
  },
  {
    id: "D",
    title: "Hedging & volatility",
    chapters: [
      { id: "D1", title: "Delta hedging and P&L attribution" },
      { id: "D2", title: "Implied vol, smile, skew, surface" },
      { id: "D3", title: "Beyond Black-Scholes: local vol, Heston, SABR, jumps" },
    ],
  },
  {
    id: "E",
    title: "Risk & simulation",
    chapters: [
      { id: "E1", title: "VaR and Expected Shortfall" },
      { id: "E2", title: "Monte Carlo methods" },
      { id: "E3", title: "Portfolio theory, efficient frontier, PCA on curves" },
    ],
  },
  {
    id: "F",
    title: "Numerical methods",
    chapters: [
      { id: "F1", title: "Finite-difference PDE solvers" },
      { id: "F2", title: "Longstaff-Schwartz, calibration, AD" },
    ],
  },
  {
    id: "G",
    title: "Machine learning for finance",
    chapters: [
      { id: "G1", title: "Supervised learning, regularisation, validation" },
      { id: "G2", title: "Unsupervised: clustering, PCA, autoencoders" },
      { id: "G3", title: "Time-series ML; leakage and backtest overfitting" },
    ],
  },
  {
    id: "H",
    title: "Exotics & structured products",
    chapters: [
      { id: "H1", title: "Exotics" },
      { id: "H2", title: "Structured products" },
    ],
  },
];
