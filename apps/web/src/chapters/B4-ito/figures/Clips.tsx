import { useEffect, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Clip } from "../../../ui/Clip";

/** Light or dark, following the page's theme attribute and the OS preference. */
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

function src(name: string, dark: boolean) {
  const base = import.meta.env.BASE_URL + "clips/B4/" + name + (dark ? "_dark" : "_light");
  return { mp4: base + ".mp4", webm: base + ".webm", poster: base + ".png" };
}

/** Watch first: the square whose side jitters (22 s). The pressable version is Figure 2. */
export function ClipSquare() {
  const s = src("square", useDark());
  return (
    <Figure n="2a" prompt="Watch first (22 seconds). Then you get the coin.">
      <Clip
        src={{ mp4: s.mp4, webm: s.webm }}
        poster={s.poster}
        ariaLabel="A square whose side jitters by a coin flip; strips cancel, corners accumulate"
        beats={[
          { at: 0, caption: "A square of side x. Nudge the side a little: the area grows by two strips and a tiny corner. The corner is safe to ignore — chapter 0.1 said so." },
          { at: 4.0, caption: "Now the side doesn't nudge. It jitters: a coin decides. Heads grows it, tails shrinks it." },
          { at: 8.5, caption: "Tails takes the strips away — but the corner is a square. It is added either way." },
          { at: 13.0, caption: "Flip after flip, the strips wander around zero. The corners only climb — and they climb like a clock." },
          { at: 18.0, caption: "Smaller steps, more of them: the strips are as random as before; the corners still add up to the time that passed. Cross out the sticker." },
        ]}
      />
    </Figure>
  );
}

/** Watch first: the race of the tiles (19 s). The pressable version is Figure 3. */
export function ClipTiles() {
  const s = src("tiles", useDark());
  return (
    <Figure n="3a" prompt="Watch first (19 seconds): every term is a tile whose area is its size.">
      <Clip
        src={{ mp4: s.mp4, webm: s.webm }}
        poster={s.poster}
        ariaLabel="Four tiles shrinking at different rates as the time step is halved"
        beats={[
          { at: 0, caption: "Four tiles, four terms. The bar is the ordinary first-order term. The other three are the leftovers calculus usually throws away." },
          { at: 4.0, caption: "Halve the step. The bar halves. The Δt² tile quarters. The mixed tile shrinks by nearly three." },
          { at: 9.0, caption: "The (ΔW)² tile halves — the same rate as the bar. Halve again, and again: it keeps pace." },
          { at: 14.0, caption: "Everything that shrank faster than the bar is gone. Two tiles remain, and one of them is a square." },
        ]}
      />
    </Figure>
  );
}
