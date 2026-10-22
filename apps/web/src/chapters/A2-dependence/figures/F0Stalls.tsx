import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Timeline, type Segment } from "../../../ui/Timeline";
import { Curve, Label, Marker, Plot, Points, type Pt } from "../../../ui/Plot";
import { rng, normalSample } from "../../../engine/random";
import { correlation } from "../../../engine/linalg";

const DAYS = 90;

/** Two stalls, one weather: daily takings become dots, and the cloud has a direction. */
export function F0Stalls() {
  const days = useMemo(() => {
    const r = rng(314);
    const out: Array<{ w: number; lemon: number; umb: number }> = [];
    for (let d = 0; d < DAYS; d++) {
      const w = normalSample(r);
      out.push({ w, lemon: 50 + 10 * w + 6 * normalSample(r), umb: 40 - 8 * w + 6 * normalSample(r) });
    }
    return out;
  }, []);
  const all: Pt[] = days.map((d) => [d.lemon, d.umb]);
  const rho = correlation(
    days.map((d) => d.lemon),
    days.map((d) => d.umb),
  );
  const mx = days.reduce((s, d) => s + d.lemon, 0) / DAYS,
    my = days.reduce((s, d) => s + d.umb, 0) / DAYS;

  const segments: Segment[] = [
    { duration: 8, caption: "Two stalls on one street: a lemonade stall and an umbrella stall. Each day's takings depend on the weather — the same weather for both — plus each stall's own luck: a school trip, a broken till, a friendly bus driver." },
    { duration: 10, caption: "Day by day, each pair of takings becomes one dot: lemonade across, umbrellas up. The first few days look like scattered luck." },
    { duration: 14, caption: "By the end of the season the dots form a cloud, and the cloud has a direction: it runs downhill. The sunny days that fill the lemonade till are the days nobody buys an umbrella." },
    { duration: 10, caption: `This is dependence, and the number that summarises it is the correlation: here about ${rho.toFixed(2)}. Minus one would be a perfect downhill line, plus one a perfect uphill line, zero a round cloud with no direction at all.` },
    { duration: 8, caption: "Two questions for this chapter. How do we build a cloud with a chosen tilt on purpose — a trading desk needs to, every day — and how do we read a cloud back: its tilt, its axes, and what one number cannot tell us about its corners?" },
  ];
  const countAt = (i: number, u: number) => (i === 0 ? 0 : i === 1 ? Math.floor(12 * u) : i === 2 ? 12 + Math.floor((DAYS - 12) * u) : DAYS);

  return (
    <Figure n="0" prompt="A season in the life of two stalls. Play, scrub, or switch the voice on.">
      <Timeline
        segments={segments}
        render={(_t, i, u) => {
          const n = countAt(i, u);
          const showDir = i >= 3 || (i === 2 && u > 0.85);
          const dir = (() => {
            // direction of the cloud: principal axis of the 2x2 covariance
            const sx = days.reduce((s, d) => s + (d.lemon - mx) ** 2, 0) / DAYS,
              sy = days.reduce((s, d) => s + (d.umb - my) ** 2, 0) / DAYS,
              sxy = days.reduce((s, d) => s + (d.lemon - mx) * (d.umb - my), 0) / DAYS;
            const th = 0.5 * Math.atan2(2 * sxy, sx - sy);
            return [Math.cos(th), Math.sin(th)];
          })();
          return (
            <Plot xDomain={[10, 90]} yDomain={[0, 80]} xLabel="lemonade takings" yLabel="umbrella takings" height={340} ariaLabel="Daily takings of two stalls as a scatter">
              {n > 0 && <Points pts={all.slice(0, n)} role="approx" r={3.2} opacity={0.7} />}
              {n > 0 && n <= DAYS && i < 3 && <Marker at={all[n - 1]} role="approx" r={5} />}
              {showDir && <Curve pts={[[mx - 40 * dir[0], my - 40 * dir[1]], [mx + 40 * dir[0], my + 40 * dir[1]]]} role="ink" width={1.5} dash="6 4" smooth={false} />}
              {showDir && <Label at={[mx + 30 * dir[0], my + 30 * dir[1]]} text="the cloud's direction" dx={8} dy={-6} />}
              {i >= 1 && i < 3 && n > 0 && <Label at={all[n - 1]} text={`day ${n}`} dx={8} dy={-6} role="approx" />}
            </Plot>
          );
        }}
      />
    </Figure>
  );
}
