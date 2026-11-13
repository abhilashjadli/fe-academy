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
      { id: "A4", title: "Time series: does it come home?", built: true },
      { id: "A5", title: "Volatility: how fast should you forget?", built: true },
    ],
  },
  {
    id: "B",
    title: "Stochastic processes & calculus",
    chapters: [
      { id: "B1", title: "Markov chains: the weather has a habit", built: true },
      { id: "B2", title: "Martingales: the meter that will not move", built: true },
      { id: "B3", title: "Brownian motion: the dial that reads the clock", built: true },
      { id: "B4", title: "Itô's lemma: the square that would not vanish", built: true },
      { id: "B5", title: "The risk-neutral measure: the odds are not the price", built: true },
      { id: "B6", title: "Feynman–Kac: two ways to get the same number", built: true },
    ],
  },
  {
    id: "C",
    title: "Options",
    chapters: [
      { id: "C1", title: "Options: read the chain", built: true },
      { id: "C2", title: "Binomial to Black–Scholes: pick any probability", built: true },
      { id: "C3", title: "Black–Scholes in detail: the one dial the screen does not set", built: true },
      { id: "C4", title: "Greeks I: the slope, the bend and the clock", built: true },
      { id: "C5", title: "Greeks II: all he did was change his mind", built: true },
    ],
  },
  {
    id: "D",
    title: "Hedging & volatility",
    chapters: [
      { id: "D1", title: "Delta hedging: theta pays for gamma", built: true },
      { id: "D2", title: "The smile and the surface: the market does not believe in one number", built: true },
      { id: "D3", title: "Beyond Black–Scholes: three stories, one curve", built: true },
    ],
  },
  {
    id: "E",
    title: "Risk & simulation",
    chapters: [
      { id: "E1", title: "VaR and Expected Shortfall", built: true },
      { id: "E2", title: "Monte Carlo methods", built: true },
      { id: "E3", title: "Portfolio theory, efficient frontier, PCA on curves", built: true },
    ],
  },
  {
    id: "F",
    title: "Numerical methods",
    chapters: [
      { id: "F1", title: "Finite-difference PDE solvers", built: true },
      { id: "F2", title: "Longstaff–Schwartz, calibration, automatic differentiation", built: true },
    ],
  },
  {
    id: "G",
    title: "Machine learning for finance",
    chapters: [
      { id: "G1", title: "Supervised learning, regularisation, validation", built: true },
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
