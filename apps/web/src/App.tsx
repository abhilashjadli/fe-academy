import { useEffect, useState, type ComponentType } from "react";
import { SYLLABUS } from "./syllabus";
import { Index } from "./Index";
import { TaylorChapter } from "./chapters/0.1-taylor/Chapter";
import { NormalChapter } from "./chapters/0.2-normal/Chapter";
import { LognormalChapter } from "./chapters/A1-lognormal/Chapter";
import { DependenceChapter } from "./chapters/A2-dependence/Chapter";

const CHAPTERS: Record<string, ComponentType> = {
  "0.1": TaylorChapter,
  "0.2": NormalChapter,
  A1: LognormalChapter,
  A2: DependenceChapter,
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
