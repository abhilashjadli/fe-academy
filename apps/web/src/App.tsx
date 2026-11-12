import { useEffect, useState, type ComponentType } from "react";
import { SYLLABUS } from "./syllabus";
import { Index } from "./Index";
import { Lab } from "./Lab";
import { TaylorChapter } from "./chapters/0.1-taylor/Chapter";
import { NormalChapter } from "./chapters/0.2-normal/Chapter";
import { LognormalChapter } from "./chapters/A1-lognormal/Chapter";
import { DependenceChapter } from "./chapters/A2-dependence/Chapter";
import { ItoChapter } from "./chapters/B4-ito/Chapter";
import { RegressionChapter } from "./chapters/A3-regression/Chapter";
import { OptionsChapter } from "./chapters/C1-options/Chapter";
import { BinomialChapter } from "./chapters/C2-binomial/Chapter";
import { MeasureChapter } from "./chapters/B5-measure/Chapter";
import { FeynmanKacChapter } from "./chapters/B6-feynmankac/Chapter";
import { BlackScholesChapter } from "./chapters/C3-blackscholes/Chapter";
import { GreeksChapter } from "./chapters/C4-greeks/Chapter";
import { HedgingChapter } from "./chapters/D1-hedging/Chapter";
import { SmileChapter } from "./chapters/D2-smile/Chapter";
import { VolModelsChapter } from "./chapters/D3-volmodels/Chapter";
import { GreeksTwoChapter } from "./chapters/C5-greeks2/Chapter";
import { BrownianChapter } from "./chapters/B3-brownian/Chapter";
import { MartingalesChapter } from "./chapters/B2-martingales/Chapter";
import { ChainsChapter } from "./chapters/B1-chains/Chapter";
import { VolatilityChapter } from "./chapters/A5-volatility/Chapter";
import { TimeSeriesChapter } from "./chapters/A4-timeseries/Chapter";
import { VarChapter } from "./chapters/E1-var/Chapter";

const CHAPTERS: Record<string, ComponentType> = {
  "0.1": TaylorChapter,
  "0.2": NormalChapter,
  A1: LognormalChapter,
  A2: DependenceChapter,
  B4: ItoChapter,
  A3: RegressionChapter,
  C1: OptionsChapter,
  C2: BinomialChapter,
  B5: MeasureChapter,
  B6: FeynmanKacChapter,
  C3: BlackScholesChapter,
  C4: GreeksChapter,
  D1: HedgingChapter,
  D2: SmileChapter,
  D3: VolModelsChapter,
  C5: GreeksTwoChapter,
  B3: BrownianChapter,
  B2: MartingalesChapter,
  B1: ChainsChapter,
  A5: VolatilityChapter,
  A4: TimeSeriesChapter,
  E1: VarChapter,
  lab: Lab,
};

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash.replace(/^#\/?/, "");
}

function useTheme() {
  const [theme, setTheme] = useState<"auto" | "light" | "dark">(() => {
    try {
      return (localStorage.getItem("fe-theme") as "light" | "dark") || "auto";
    } catch {
      return "auto";
    }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    try {
      if (theme === "auto") localStorage.removeItem("fe-theme");
      else localStorage.setItem("fe-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

export function App() {
  const route = useHashRoute();
  const [theme, setTheme] = useTheme();
  const Chapter = CHAPTERS[route];
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);
  const title = Chapter ? SYLLABUS.flatMap((t) => t.chapters).find((c) => c.id === route)?.title : undefined;
  useEffect(() => {
    document.title = title ? `${route} ${title} — FE Library` : "FE Library";
  }, [title, route]);
  return (
    <div className="page">
      <div className="page-inner">
        <header className="topbar">
          <a href="#/">FE Library</a>
          <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "auto" : "dark")} aria-label="switch theme">
            theme: {theme}
          </button>
        </header>
        {Chapter ? <Chapter /> : <Index />}
      </div>
    </div>
  );
}
