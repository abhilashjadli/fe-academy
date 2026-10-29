import { useEffect, useState } from "react";
import { Clip } from "../../../ui/Clip";

function useDark() {
  const read = () => {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
  };
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setDark(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setDark(read());
    mq.addEventListener("change", on);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", on);
    };
  }, []);
  return dark;
}

/** Watch first (15 s): the leftovers of the levels fit, drawn in the order they happened. Figure 3 is the pressable version. */
export function ClipLeftovers() {
  const base = import.meta.env.BASE_URL + "clips/A3/leftovers_" + (useDark() ? "dark" : "light");
  return (
    <div className="clip-inside">
      <Clip
        src={{ mp4: base + ".mp4", webm: base + ".webm" }}
        poster={base + ".png"}
        ariaLabel="Residuals of a regression drawn in time order, wandering on one side for months; the certainty badge turns amber"
        beats={[
          { at: 0, caption: "The fit says certain: R² high, the ± tiny. A green badge. (The bank index here is a simulated stand-in whose hedge ratio drifts; NIFTY is real.)" },
          { at: 3.0, caption: "Now draw the leftovers in the order they happened, one trading day at a time." },
          { at: 9.0, caption: "They stay on one side for months at a time. The textbook formula assumed a fresh coin every day." },
          { at: 12.0, caption: "The badge turns amber. Same line — the how-sure was a lie, by a factor of about two." },
        ]}
      />
    </div>
  );
}
