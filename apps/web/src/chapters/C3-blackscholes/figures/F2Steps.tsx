import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough } from "../../../ui/StepThrough";
import { WatchOrDo } from "../../../ui/WatchOrDo";
import { Clip } from "../../../ui/Clip";
import { M } from "../../../ui/Math";
import { Label, Marker } from "../../../ui/Plot";
import { black76Greeks, cloud, cloudStats } from "../../../engine/bs";
import { CloudPlot } from "./Cloud";
import { BASE, KEY, ROW, f3, n0, n2, pct1, useDark } from "./c3";
import "./figures.css";

/**
 * Figure 2 — the formula grows out of the cloud, five steps over a static copy of Figure 1 (wobble 15.9 %, strike 22,600).
 * (1) the share of dots above the line → N(d₂); (2) the strike times that share → K·N(d₂); (3) the lit dots' prices averaged
 * with the same weights → F·N(d₁); (4) subtract; (5) shrink by 11 days of interest → 249.15, and the line written once.
 * The watch tab is the 20-second clip "two areas, one price" doing the same five moves as flying symbols.
 */

const SIGMA = KEY.atm.iv;

function ClipAreas() {
  const base = import.meta.env.BASE_URL + "clips/C3/areas" + (useDark() ? "_dark" : "_light");
  return (
    <div className="clip-inside">
      <Clip
        src={{ mp4: base + ".mp4", webm: base + ".webm" }}
        poster={base + ".png"}
        ariaLabel="The cloud of futures with a strike line; the share above the line flies out as N(d₂), the price-weighted area as F·N(d₁), and the two are subtracted and discounted to 249.15"
        beats={[
          { at: 0, caption: "The share of futures above the line becomes one symbol: N(d₂) — 0.496 here, almost exactly half." },
          { at: 5, caption: "The strike times that share: what you would pay, weighted by how often you pay it. K·N(d₂) = 11,219." },
          { at: 10, caption: "Now weight the lit futures by their own prices and add them up: the price-weighted area is F·N(d₁) = 11,469." },
          { at: 15, caption: "Subtract the two areas, 249.64, and shrink by 11 days of interest: 249.15. Two areas and a discount — that is the formula." },
        ]}
      />
    </div>
  );
}

function Tile({ k, v, role, note, on }: { k: string; v: string; role?: "approx" | "truth" | "ghost"; note?: string; on: boolean }) {
  return (
    <div className={"c3-tile c3-step-tile " + (role ?? "") + (on ? " on" : " off")} aria-hidden={!on}>
      <span className="k">{k}</span>
      <span className="v">{on ? v : "·"}</span>
      {note && <span className="k">{on ? note : " "}</span>}
    </div>
  );
}

export function F2Steps() {
  const g = useMemo(() => black76Greeks({ ...BASE, sigma: SIGMA }), []);
  const futures = useMemo(() => cloud(ROW.F, SIGMA, ROW.T), []);
  const stats = useMemo(() => cloudStats(futures, ROW.K, ROW.r, ROW.T), [futures]);
  const litAvg = useMemo(() => {
    const lit = futures.filter((p) => p > ROW.K);
    return lit.reduce((a, b) => a + b, 0) / lit.length;
  }, [futures]);
  const D = Math.exp(-ROW.r * ROW.T);
  const KNd2 = ROW.K * g.Nd2;
  const FNd1 = ROW.F * g.Nd1;
  const undiscounted = FNd1 - KNd2;

  const steps = [
    {
      caption: (
        <>
          <strong>Shade the futures above the line.</strong> Count them: {pct1(stats.shareLit)} of the 2,000. The formula calls that share <span className="c3-approx">N(d₂)</span>. d₂ is how many
          widths of the cloud the strike sits from its centre — {f3(g.d2)} here, i.e. almost exactly at the centre, so N(d₂) ≈ ½.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>What you pay, times how often.</strong> Above the line you hand over the strike. Strike × share: {n0(ROW.K)} × {f3(g.Nd2)} = <strong>{n2(KNd2)}</strong>. That is K·N(d₂).
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>What you get, with the same weights.</strong> Above the line you receive the index. Add up the lit futures' prices and divide by all 2,000: <strong>{n2(FNd1)}</strong>. The
          formula writes this as <span className="c3-truth">F·N(d₁)</span> — one unit, not a probability times anything; N(d₁) ≠ N(d₂) because this area is price-weighted.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>Subtract.</strong> Get minus pay: {n2(FNd1)} − {n2(KNd2)} = <strong>{n2(undiscounted)}</strong>. That is the average payout over the whole cloud, in rupees at expiry.
        </>
      ),
    },
    {
      caption: (
        <>
          <strong>Shrink by {ROW.days} days of interest.</strong> {n2(undiscounted)} × {f3(D)} = <strong>{n2(g.price)}</strong> — the screen's price, from Figure 0's dial. Written once:
          <M
            block
            tex={`\\begin{aligned} c &= e^{-rT}\\big[\\,\\tok{truth}{F\\,N(d_1)} - \\tok{approx}{K\\,N(d_2)}\\,\\big] \\\\ &= ${f3(D)}\\,[\\,\\tok{truth}{${n2(FNd1)}} - \\tok{approx}{${n2(KNd2)}}\\,] \\\\ &= ${n2(g.price)} \\end{aligned}`}
          />
        </>
      ),
    },
  ];

  return (
    <Figure
      n="2"
      prompt={
        <>
          Figure 1 frozen at the setting you found — wobble {pct1(SIGMA)}, strike {n0(ROW.K)}. Five steps lift the picture into symbols; each symbol keeps the colour of the thing it came
          from.
        </>
      }
      observe={
        <>
          The formula <strong>is</strong> the picture: two areas under the cloud and a discount. One area counts how often you pay the strike; the other weighs what you receive by its
          price. Nothing in it is a forecast.
        </>
      }
    >
      <WatchOrDo watch={<ClipAreas />} watchLabel="watch it (20 s)" doLabel="step through it">
        <StepThrough
          steps={steps}
          render={(i) => (
            <div className="c3-stage c3-steps-stage">
              <CloudPlot futures={futures} K={ROW.K} height={340} lit={i >= 2 ? "truth" : "approx"} ariaLabel="The cloud of Figure 1, frozen; the futures above the strike are shaded">
                {i >= 2 && (
                  <>
                    <Marker at={[ROW.days + 0.6, litAvg]} role="truth" r={4} />
                    <Label at={[ROW.days + 0.6, litAvg]} text={`lit futures average ${n0(litAvg)}`} role="truth" dx={10} dy={4} />
                  </>
                )}
              </CloudPlot>
              <div className="c3-step-tiles">
                <Tile on={i >= 0} role="approx" k="share above the line · N(d₂)" v={f3(g.Nd2)} note={`${pct1(stats.shareLit)} of 2,000 dots`} />
                <Tile on={i >= 1} role="approx" k="pay: K × N(d₂)" v={n2(KNd2)} note={`${n0(ROW.K)} × ${f3(g.Nd2)}`} />
                <Tile on={i >= 2} role="truth" k="get: F × N(d₁)" v={n2(FNd1)} note={`${n0(ROW.F)} × ${f3(g.Nd1)}`} />
                <Tile on={i >= 3} k="get − pay, at expiry" v={n2(undiscounted)} />
                <Tile on={i >= 4} role="ghost" k={`× ${ROW.days} days of discount`} v={n2(g.price)} note={`× ${f3(D)}`} />
              </div>
            </div>
          )}
        />
      </WatchOrDo>
    </Figure>
  );
}
