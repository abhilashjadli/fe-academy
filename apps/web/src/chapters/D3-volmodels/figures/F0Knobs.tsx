import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Curve, Label, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { hestonSmile } from "../../../engine/volmodels";
import { StripDots, StripPlot, StripLegend, STRIP_X, STRIP_Y } from "../../D2-smile/figures/strip";
import { ATM_FLAT, CHAIN, FITS, KEY, STRIP_GRID, f1, f2, f3, n0, pct1, pct2, pctSp, s2, tiltAndCurve, toPts, useNarrow, useProgress } from "./d3";

/**
 * Figure 0 — guess the knob, four rounds on the real strip. Each round shows a curve the engine drew and asks which knob of a
 * wobble-with-a-life-of-its-own model drew it; the reveal replays the knob being turned (ρ 0 → −0.31, η 0 → 0.87), or draws the
 * two curves that cannot be told apart (κ 2 and 20), or the three stories' answers to a −5 % day. Then the tally and the names.
 * Every curve is hestonSmile at the key's fitted v₀ and η; the captions quote key-D3.json.
 */

type Knob = "v0" | "theta" | "kappa" | "eta" | "rho";
type YesNo = "yes" | "no";
type Move = "slide" | "stay" | "flatten";
type AnyPick = Knob | YesNo | Move;

const KNOBS: Array<{ id: Knob; label: string; name: string; word: string }> = [
  { id: "v0", label: "the starting wobble", name: "v₀", word: "now" },
  { id: "theta", label: "the long-run wobble", name: "θ", word: "home" },
  { id: "kappa", label: "how fast it is pulled back", name: "κ", word: "pull" },
  { id: "eta", label: "how jittery the wobble is", name: "η", word: "jitter" },
  { id: "rho", label: "how the wobble leans with the price", name: "ρ", word: "lean" },
];
const knobLabel = (id: string) => KNOBS.find((k) => k.id === id)?.label ?? id;
const H = FITS.heston;
const BASE_U = { ...H, rho: 0 }; // the symmetric U: lean off, jitter on
const MAX_DIFF_QUOTED = KEY.heston_kappa_unidentifiable_max_diff_vol_pts.on_quoted_22250_23050;
const DAY = KEY.day_minus_5pct;

/** The curve each round shows before the pick, and the sweep the reveal replays. */
function curveAt(round: number, t: number): number[] {
  if (round === 0) return hestonSmile({ ...H, rho: H.rho * t }, STRIP_GRID);
  if (round === 1) return hestonSmile({ ...BASE_U, eta: Math.max(H.eta * t, 1e-9) }, STRIP_GRID);
  return hestonSmile(H, STRIP_GRID);
}

function TiltArrow({ vols, role = "approx" }: { vols: number[]; role?: "approx" | "truth" }) {
  const { x, y } = usePlot();
  // slope from the drawn curve itself: two grid points either side of the forward
  const i = STRIP_GRID.findIndex((K) => K >= CHAIN.F);
  const k0 = STRIP_GRID[i - 2],
    k1 = STRIP_GRID[i + 1];
  const v0 = vols[i - 2],
    v1 = vols[i + 1];
  const sl = (v1 - v0) / (k1 - k0);
  const vF = v0 + sl * (CHAIN.F - k0);
  const dx = 180;
  const p0: Pt = [CHAIN.F - dx, vF - sl * dx];
  const p1: Pt = [CHAIN.F + dx, vF + sl * dx];
  const ang = Math.atan2(y(p1[1]) - y(p0[1]), x(p1[0]) - x(p0[0]));
  return (
    <g className={"d3-arrow " + role}>
      <line x1={x(p0[0])} y1={y(p0[1])} x2={x(p1[0])} y2={y(p1[1])} />
      <path d={`M ${x(p1[0])} ${y(p1[1])} l ${-8 * Math.cos(ang - 0.4)} ${-8 * Math.sin(ang - 0.4)} M ${x(p1[0])} ${y(p1[1])} l ${-8 * Math.cos(ang + 0.4)} ${-8 * Math.sin(ang + 0.4)}`} />
    </g>
  );
}

function FlatLine() {
  return (
    <>
      <Curve pts={[[STRIP_X[0], ATM_FLAT], [STRIP_X[1], ATM_FLAT]]} role="ghost" dash="5 4" width={1.2} smooth={false} />
      <Label at={[STRIP_X[1], ATM_FLAT]} text={`one wobble: ${pct2(ATM_FLAT)}`} role="ghost" dx={-4} dy={-6} anchor="end" />
    </>
  );
}

/** Rounds 1–3 on the strip. */
function RoundStrip({ round, revealed, t }: { round: number; revealed: boolean; t: number }) {
  const shown = useMemo(() => curveAt(round, revealed ? t : 1), [round, revealed, t]);
  const k20 = useMemo(() => hestonSmile(FITS.hestonK20, STRIP_GRID), []);
  const sweeping = revealed && round < 2;
  return (
    <StripPlot ariaLabel={`the real 34 implied vols against strike with a flat line at ${pct2(ATM_FLAT)} and a model curve the engine drew: round ${round + 1}`} height={290}>
      <FlatLine />
      <StripDots dim={!revealed} />
      {round === 2 && revealed ? (
        <>
          <Curve pts={toPts(STRIP_GRID, shown)} role="truth" width={2.4} />
          <Curve pts={toPts(STRIP_GRID, k20)} role="approx" width={2} dash="6 4" />
          <Label at={[STRIP_GRID[16], shown[16]]} text="pull-back 2" role="truth" dx={0} dy={-12} anchor="middle" />
          <Label at={[STRIP_GRID[16], k20[16]]} text="pull-back 20" role="approx" dx={0} dy={18} anchor="middle" />
        </>
      ) : (
        <>
          <Curve pts={toPts(STRIP_GRID, shown)} role={revealed ? "truth" : "approx"} width={2.4} />
          {(round === 0 || round === 2) && <TiltArrow vols={shown} role={revealed ? "truth" : "approx"} />}
          {sweeping && (
            <Label at={[STRIP_X[0], STRIP_Y[0]]} text={round === 0 ? `lean ρ = ${s2(H.rho * t)}` : `jitter η = ${f2(H.eta * t)}`} role="truth" dx={48} dy={-24} />
          )}
        </>
      )}
    </StripPlot>
  );
}

/** Round 4: the three stories' answers to a −5 % day, from the key. */
const STORIES = [
  { id: "local_vol", name: "painted on the map", sub: "local vol", role: "truth" as const },
  { id: "heston", name: "a life of its own", sub: "Heston", role: "approx" as const },
  { id: "merton", name: "potholes", sub: "Merton", role: "error" as const },
];
const PANEL_Y: [number, number] = [0.14, 0.23];
export function DayPanels({ compact = false }: { compact?: boolean }) {
  const narrow = useNarrow();
  const w = narrow ? 360 : 300,
    h = compact ? 170 : 200;
  return (
    <div className="d3-panels">
      {STORIES.map((s) => {
        const d = DAY[s.id as keyof typeof DAY] as typeof DAY.heston;
        const before = toPts(DAY.strikes, d.before.iv_at_strikes);
        const after = toPts(DAY.strikes, d.after.iv_at_strikes);
        return (
          <div key={s.id} className="d3-panel">
            <div className="d3-panel-title">
              <strong>{s.name}</strong> <span>{s.sub}</span>
            </div>
            <div className={"d3-verdict " + s.role}>{d.verdict === "flattens" ? "flattens and jumps" : "slides with the index"}</div>
            <Plot xDomain={[22200, 23100]} yDomain={PANEL_Y} width={w} height={h} margin={{ top: 10, right: 10, bottom: 26, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={22200} axisY={PANEL_Y[0]} ariaLabel={`${s.sub}: the smile before and after a 5 % fall, ${d.verdict}`}>
              <PanelTicks />
              <Curve pts={[[DAY.F_before, PANEL_Y[0]], [DAY.F_before, PANEL_Y[1]]]} role="ghost" dash="3 3" width={1} smooth={false} />
              <Curve pts={before} role="ghost" width={1.6} dash="5 3" />
              <Curve pts={after} role={s.role} width={2.2} />
              <Label at={[22220, PANEL_Y[1]]} text={`at the money ${pct1(d.before.atm_vol)} → ${pct1(d.after.atm_vol)}`} dx={0} dy={12} />
              <Label at={[22220, PANEL_Y[1]]} text={`slope ${f3(d.before.slope).replace("-", "−")} → ${f3(d.after.slope).replace("-", "−")}`} dx={0} dy={26} role="ghost" />
            </Plot>
          </div>
        );
      })}
    </div>
  );
}
function PanelTicks() {
  const { x, y, inner } = usePlot();
  return (
    <g>
      {[22250, 22600, 23050].map((K) => (
        <text key={K} className="label d3-ticklabel" x={x(K)} y={inner.top + inner.height - 4} textAnchor="middle">
          {n0(K)}
        </text>
      ))}
      {[0.18].map((v) => (
        <text key={v} className="label d3-ticklabel" x={inner.left + 4} y={y(v) - 2}>
          {pct1(v).replace(".0", "")}
        </text>
      ))}
    </g>
  );
}

const R4_OPTIONS: Array<{ id: Move; label: string }> = [
  { id: "slide", label: "slides down with the index" },
  { id: "stay", label: "stays put, strike by strike" },
  { id: "flatten", label: "flattens" },
];

export function F0Knobs() {
  const [view, setView] = useState(0); // 0..3 the rounds, 4 the tally
  const [p1, setP1] = useBet<Knob>("D3-F0-1");
  const [p2, setP2] = useBet<Knob>("D3-F0-2");
  const [p3, setP3] = useBet<YesNo>("D3-F0-3");
  const [p4, setP4] = useBet<Move>("D3-F0-4");
  const picks: Array<AnyPick | null> = [p1, p2, p3, p4];
  const tally = view === 4;
  const i = Math.min(view, 3);
  const pick = picks[i];
  const revealed = !!pick;
  const t = useProgress(revealed && i < 2, 1100, i);

  const truths: AnyPick[] = ["rho", "eta", "no", "slide"];
  const verdict = (k: number): "right" | "miss" | "close" | "none" => {
    const p = picks[k];
    if (!p) return "none";
    if (k === 3) return p === "stay" ? "miss" : "close";
    return p === truths[k] ? "right" : "miss";
  };
  const live = useMemo(() => {
    const vols = curveAt(i, revealed ? t : 1);
    const tc = tiltAndCurve((ks) => (i === 1 ? hestonSmile({ ...BASE_U, eta: Math.max(H.eta * (revealed ? t : 1), 1e-9) }, ks) : hestonSmile(i === 0 ? { ...H, rho: H.rho * (revealed ? t : 1) } : H, ks)));
    return { vols, ...tc };
  }, [i, revealed, t]);
  const kDiff = useMemo(() => {
    const a = hestonSmile(H, STRIP_GRID),
      b = hestonSmile(FITS.hestonK20, STRIP_GRID);
    let m = 0;
    STRIP_GRID.forEach((K, j) => {
      if (K >= 22250 && K <= 23050) m = Math.max(m, Math.abs(a[j] - b[j]));
    });
    return 100 * m;
  }, []);

  const next = () => {
    if (tally) {
      setView(0);
      setP1(null);
      setP2(null);
      setP3(null);
      setP4(null);
    } else setView(view + 1);
  };
  const right = [0, 1, 2].filter((k) => verdict(k) === "right").length;

  const question =
    i === 0 ? (
      <>The amber curve is the real strip's tilt, drawn by a model in which the wobble has a life of its own. I turned one of its five knobs away from zero to get it. Which?</>
    ) : i === 1 ? (
      <>Now a symmetric U, same model. One knob again, from zero. Which?</>
    ) : i === 2 ? (
      <>The wobble is pulled back toward its home at some speed. Would a pull-back of 2 a year or of 20 a year have given a different picture at {11} days?</>
    ) : (
      <>Overnight the index falls 5 %. Tomorrow's smile, read against the same strikes —</>
    );

  return (
    <Figure
      n="0"
      prompt={
        <>
          Four rounds on the real strip: the 34 implied wobbles of 23 October and the one flat line Black–Scholes can draw through them. Each round, a curve the machine drew and a
          question about which knob drew it. Say, then watch the knob turn.
        </>
      }
      controls={
        <>
          <span className="d3-ctl-note">{tally ? "the tally" : `round ${i + 1} of 4`}</span>
          <button type="button" className="btn primary" disabled={!tally && !revealed} onClick={next}>
            {tally ? "play again" : view === 3 ? "the tally" : "next round"}
          </button>
          {!tally && i < 3 && (
            <Readouts
              items={[
                ["tilt at the forward", s2(live.tilt)],
                ["curvature", f1(live.curve).replace("-", "−")],
                ["knob", revealed ? (i === 2 ? "κ, and it did not matter" : KNOBS.find((k) => k.id === truths[i])!.name) : "?"],
              ]}
            />
          )}
        </>
      }
      observe={
        tally ? (
          <>
            The chain can read three numbers off a smile — level, tilt, curvature — and a model with five knobs has two it cannot see at one expiry. The next three figures tell the three
            stories one at a time, each on the cloud from C3, each with the one knob that makes the tilt.
          </>
        ) : !revealed ? (
          <>
            {i < 2 ? "Five knobs, one turned. Pick, and watch it turn." : i === 2 ? "Two pull-backs, one chain, eleven days. Pick, and both curves are drawn." : "Three stories drew today's curve. Pick, and each one answers."}
          </>
        ) : i === 0 ? (
          <>
            Most readers pick the jitter. It is the lean: when the wobble tends to rise as the price falls, low strikes are priced off a wider cloud than high ones, and the curve tilts.
            Key: ρ = {s2(H.rho)}, η = {f3(H.eta).slice(0, 4)}, rms {f3(FITS.rmsVolPts.heston)} vol points to the 34 dots.
          </>
        ) : i === 1 ? (
          <>
            Jitter alone is even-handed: a wobble that is sometimes high and sometimes low widens both wings and, by a small convexity effect, lowers the middle (16.5 % flat at η = 0,{" "}
            {pct1(hestonSmile(BASE_U, [CHAIN.F])[0])} at the money at η = 0.87). Curvature is one knob, tilt is another.
          </>
        ) : i === 2 ? (
          <>
            Both fits score the same {f3(FITS.rmsVolPts.heston)} / {f3(FITS.rmsVolPts.hestonK20)} vol points; across the quoted strikes the two curves differ by at most {f3(MAX_DIFF_QUOTED)} of a vol point
            (key). One expiry cannot see how fast the wobble comes home, nor where home is: those knobs are promises about other dates.
          </>
        ) : (
          <>
            Dashed, today's smile; solid, tomorrow's, in each story. Painted on the map it flattens and jumps (at the money {pct1(DAY.local_vol.before.atm_vol)} → {pct1(DAY.local_vol.after.atm_vol)}, slope{" "}
            {f3(DAY.local_vol.before.slope).replace("-", "−")} → {f3(DAY.local_vol.after.slope).replace("-", "−")}); with a life of its own or with potholes it slides with the index, shape unchanged. Figure 4 comes back to this.
          </>
        )
      }
    >
      {tally ? (
        <div className="d3-tally">
          <div className="d3-round-plot">
            <RoundStrip round={2} revealed={false} t={1} />
            <StripLegend
              extra={
                <span className="d2-legend-note">
                  the three numbers this chain reads: level {pct2(FITS.quadratic.a)} · tilt {s2(FITS.quadratic.b)} · curvature {f1(FITS.quadratic.c)} (D2's fit)
                </span>
              }
            />
          </div>
          <table className="table d3-tally-table">
            <thead>
              <tr>
                <th>round</th>
                <th>you said</th>
                <th>it was</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3].map((k) => (
                <tr key={k} className={verdict(k) === "right" ? "d3-hit" : verdict(k) === "close" ? "d3-close" : "d3-miss"}>
                  <td>{k + 1}</td>
                  <td>{picks[k] ? (k < 2 ? knobLabel(picks[k]!) : k === 2 ? picks[k] : R4_OPTIONS.find((o) => o.id === picks[k])?.label) : "—"}</td>
                  <td>
                    {k === 0 && <strong>the lean, ρ</strong>}
                    {k === 1 && <strong>the jitter, η</strong>}
                    {k === 2 && <strong>no — the same curve to {f3(MAX_DIFF_QUOTED)} of a point</strong>}
                    {k === 3 && <strong>it depends on the story</strong>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d3-names">
            <p>
              <strong>{right} of 3</strong> on the knobs; nobody wins round 4. The names, now that you have seen what they do: <strong>ρ</strong> is the lean — how the wobble moves with the price — and
              it makes the <em>tilt</em>. <strong>η</strong> is the jitter — how much the wobble itself wanders — and it makes the <em>curvature</em>. <strong>v₀</strong> is the wobble now,{" "}
              <strong>θ</strong> is its home, <strong>κ</strong> is the pull toward home: now, home, pull. The chain of one expiry reads level, tilt and curvature — three numbers — and nothing
              else. Fit: v₀ {pctSp(Math.sqrt(H.v0))}, ρ {s2(H.rho)}, η {f3(H.eta).slice(0, 4)} at κ = 2; the same curve at κ = 20 with η {f3(FITS.hestonK20.eta).slice(0, 4)}.
            </p>
          </div>
        </div>
      ) : (
        <div className="d3-round" key={i}>
          <div className="d3-round-plot">
            {i === 3 && revealed ? <DayPanels /> : <RoundStrip round={i} revealed={revealed} t={t} />}
            {!(i === 3 && revealed) && (
              <StripLegend
                extra={
                  <span className="d2-legend-note">
                    <i className="d2-sw line" style={{ background: revealed ? "var(--truth)" : "var(--approx)" }} /> {revealed ? "the knob, turned" : "the machine's curve"} · dashed: one wobble, {pct2(ATM_FLAT)}
                  </span>
                }
              />
            )}
          </div>
          <div className="d3-round-bet">
            {i === 0 && (
              <Bet<Knob> question={question} options={KNOBS.map((k) => ({ id: k.id, label: k.label }))} pick={p1} onPick={setP1}>
                <ResultCard yours={knobLabel(p1 ?? "")} answer={<>how the wobble leans with the price — ρ, from 0 to {s2(H.rho)}</>} verdict={verdict(0)}>
                  Watch the curve: at ρ = 0 it is a symmetric U; as the lean goes negative the low wing rises and the high wing falls, and the U tilts onto the dots. The jitter was on the whole
                  time (η = {f3(H.eta).slice(0, 4)}) and made no tilt at all.
                </ResultCard>
              </Bet>
            )}
            {i === 1 && (
              <Bet<Knob> question={question} options={KNOBS.map((k) => ({ id: k.id, label: k.label }))} pick={p2} onPick={setP2}>
                <ResultCard yours={knobLabel(p2 ?? "")} answer={<>how jittery the wobble is — η, from 0 to {f3(H.eta).slice(0, 4)}, with the lean at 0</>} verdict={verdict(1)}>
                  With the lean off, the picture is even-handed: both wings lift together. A wobble that wanders is a mixture of narrow and wide clouds, and a mixture has fatter tails than any one
                  bell — the same reason D2's smile existed at all.
                </ResultCard>
              </Bet>
            )}
            {i === 2 && (
              <Bet<YesNo> question={question} options={[{ id: "yes", label: "yes — a faster pull-back shows" }, { id: "no", label: "no — the same picture" }]} pick={p3} onPick={setP3}>
                <ResultCard yours={p3 === "yes" ? "yes, a different picture" : "no, the same picture"} answer={<>the same picture: the two curves differ by at most {f3(kDiff)} of a vol point across the quoted strikes</>} verdict={verdict(2)}>
                  Eleven days is too short for the pull to act. Refit with κ = 20 and the least squares simply asks for a little more jitter (η {f3(FITS.hestonK20.eta).slice(0, 4)} for {f3(H.eta).slice(0, 4)})
                  and the same lean; the dots cannot tell. The knob is real; this chain is blind to it.
                </ResultCard>
              </Bet>
            )}
            {i === 3 && (
              <Bet<Move> question={question} options={R4_OPTIONS} pick={p4} onPick={setP4}>
                <ResultCard yours={R4_OPTIONS.find((o) => o.id === p4)?.label ?? ""} answer={<>it depends on the story — flattens and jumps, slides, slides</>} verdict={verdict(3)}>
                  Three models that draw today's curve identically give three different tomorrows. The one thing today's chain cannot tell you is the thing a desk is paid to get right. Figure 4
                  returns to it with the numbers.
                </ResultCard>
              </Bet>
            )}
          </div>
        </div>
      )}
    </Figure>
  );
}
