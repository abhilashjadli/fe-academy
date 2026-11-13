import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { DotsPath, XTicks, YTicks } from "./parts";
import { CAL, FIT_RMS, FIT_SMILE, NUS, RHOS, SURFACE, isValley, n0, n1, n2, n3, nearestNu, nearestRho, neg, smileAtCell, useNarrow } from "./f2";

/**
 * Figure 2 — the calibration valley (real chain): SABR with β = 1 on the 34 implied vols of 23 Oct, the level α set by the
 * at-the-money vol at every (ρ, ν). Heat-map of the fitting error in vol points over tilt ρ × curvature ν (key.calib.surface_alpha_atm);
 * dial ρ and ν to move the dot and redraw the smile over the dots (live alphaForAtm + sabrSmile; rms equals the key's cell).
 * The valley — cells within 0.05 vol points of the best — outlined; the continuous fit marked. Two controls; three readouts.
 */

const RHO_STEP = RHOS[1] - RHOS[0];
const NU_STEP = NUS[1] - NUS[0];
const RMS_LO = CAL.best_on_grid.rms;
const RMS_HI = 1.0;
const SX: [number, number] = [CAL.strikes[0] - 60, CAL.strikes[CAL.strikes.length - 1] + 60];
const SY: [number, number] = [13.4, 18.4];
const pct = (v: number) => `${n1(v * 100)} %`;

/** rms → opacity of the truth colour: the best fit is darkest, anything past RMS_HI is bare */
const shade = (rms: number) => {
  const t = (rms - RMS_LO) / (RMS_HI - RMS_LO);
  return 0.92 * (1 - Math.max(0, Math.min(1, t))) ** 1.6 + 0.04;
};

function HeatMap({ ri, nj, onPick, narrow }: { ri: number; nj: number; onPick: (i: number, j: number) => void; narrow: boolean }) {
  const cw = narrow ? 17 : 24;
  const ch = narrow ? 11 : 12;
  const left = 40;
  const top = 26;
  const W = left + NUS.length * cw + 34;
  const H = top + RHOS.length * ch + 22;
  const fitX = left + ((CAL.fit.nu - NUS[0]) / NU_STEP + 0.5) * cw;
  const fitY = top + ((CAL.fit.rho - RHOS[0]) / RHO_STEP + 0.5) * ch;
  const rho0 = RHOS.findIndex((r) => Math.abs(r) < 1e-9);
  return (
    <svg className="f2-heat" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`fitting error in vol points over tilt ρ (rows, ${neg(String(RHOS[0]))} to ${RHOS[RHOS.length - 1]}) and curvature ν (columns, ${NUS[0]} to ${NUS[NUS.length - 1]}); dark is a good fit; the outlined cells are the valley`}>
      <text className="f2-heat-head" x={left - 4} y={top - 8} textAnchor="end">
        ρ
      </text>
      <text className="f2-heat-head" x={left} y={top - 8}>
        curvature ν →
      </text>
      {NUS.map((v, j) =>
        j % 2 === 0 ? (
          <text key={j} className="f2-heat-head" x={left + j * cw + cw / 2} y={H - 8} textAnchor="middle">
            {n1(v)}
          </text>
        ) : null,
      )}
      {RHOS.map((r, i) =>
        i % 2 === 0 ? (
          <text key={i} className="f2-heat-head" x={left - 4} y={top + i * ch + ch / 2 + 3.5} textAnchor="end">
            {neg(n2(Math.abs(r) < 1e-9 ? 0 : r))}
          </text>
        ) : null,
      )}
      {RHOS.map((_, i) =>
        NUS.map((_, j) => {
          const rms = SURFACE[i][j];
          const x = left + j * cw;
          const y = top + i * ch;
          return (
            <g key={i + ":" + j} onPointerEnter={() => onPick(i, j)} onPointerDown={() => onPick(i, j)}>
              <rect x={x} y={y} width={cw} height={ch} fill="var(--surface-raised)" />
              <rect x={x} y={y} width={cw} height={ch} fill="var(--truth)" opacity={shade(rms)} />
              {isValley(i, j) && <rect x={x + 0.75} y={y + 0.75} width={cw - 1.5} height={ch - 1.5} fill="none" stroke="var(--ink)" strokeWidth={1.2} />}
            </g>
          );
        }),
      )}
      <line x1={left} x2={left + NUS.length * cw} y1={top + rho0 * ch + ch / 2} y2={top + rho0 * ch + ch / 2} stroke="var(--ghost)" strokeWidth={1} strokeDasharray="3 3" />
      <text className="f2-heat-head" x={left + NUS.length * cw + 3} y={top + rho0 * ch + ch / 2 + 3.5}>
        ρ = 0
      </text>
      <circle cx={fitX} cy={fitY} r={4} fill="var(--surface-figure)" stroke="var(--error)" strokeWidth={2} />
      <rect x={left + nj * cw} y={top + ri * ch} width={cw} height={ch} fill="none" stroke="var(--approx)" strokeWidth={2.5} />
    </svg>
  );
}

function Smile({ model, narrow }: { model: number[]; narrow: boolean }) {
  const pts: Pt[] = CAL.strikes.map((k, i) => [k, model[i] * 100]);
  const fitPts: Pt[] = CAL.strikes.map((k, i) => [k, FIT_SMILE[i] * 100]);
  const atm = CAL.strikes.reduce((b, k, i) => (Math.abs(k - CAL.F) < Math.abs(CAL.strikes[b] - CAL.F) ? i : b), 0);
  return (
    <Plot xDomain={SX} yDomain={SY} width={narrow ? 400 : 420} height={narrow ? 250 : 300} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={SX[0]} axisY={SY[0]} ariaLabel="the 34 market implied vols as dots, the SABR smile at the dial in amber, the best fit dashed">
      <YTicks at={[14, 15, 16, 17]} fmt={(v) => `${v} %`} />
      <XTicks at={[22400, 22600, 22800, 23000]} fmt={n0} label="strike" />
      <Curve pts={[[CAL.F, SY[0]], [CAL.F, SY[1]]]} role="ghost" width={1} smooth={false} />
      <Label at={[CAL.F, SY[0] + 1.0]} text={`at the money: pinned by α`} role="ink" dx={-6} dy={0} anchor="end" />
      <Curve pts={fitPts} role="truth" width={1.4} dash="5 4" smooth={false} />
      <Curve pts={pts} role="approx" width={2.2} smooth={false} />
      <DotsPath xs={CAL.strikes} ys={CAL.ivs.map((v) => v * 100)} role="ink" r={3} />
      <Marker at={[CAL.strikes[atm], CAL.atm_iv * 100]} role="ink" r={5} />
      <Label at={[SX[0], SY[1]]} text="dots: the screen · amber: the dial · dashed: the fit" role="ink" dx={4} dy={12} />
    </Plot>
  );
}

export function F2Valley() {
  const narrow = useNarrow();
  const [ri, setRi] = useState(() => nearestRho(CAL.fit.rho));
  const [nj, setNj] = useState(() => nearestNu(CAL.fit.nu));
  const rho = RHOS[ri];
  const nu = NUS[nj];
  const s = smileAtCell(ri, nj);
  const rms = SURFACE[ri][nj];
  const inValley = isValley(ri, nj);
  const best = CAL.best_on_grid;

  return (
    <Figure
      n="2"
      prompt={
        <>
          The real chain's {CAL.strikes.length} implied vols of 23 October, and chapter D3's ruler, SABR, with its level α set each time so the at-the-money vol is matched. Two knobs are left — the
          tilt ρ and the curvature ν — and the map shows how badly each pair misses the dots. Find the bottom.
        </>
      }
      controls={
        <>
          <Slider label="tilt ρ" value={ri} min={0} max={RHOS.length - 1} step={1} onChange={setRi} fmt={() => neg(n2(rho))} />
          <Slider label="curvature ν" value={nj} min={0} max={NUS.length - 1} step={1} onChange={setNj} fmt={() => n2(nu)} />
          <Readouts
            items={[
              ["rms miss at the dial", <span className={inValley ? "f2-good" : undefined}>{n3(rms)} vol points{inValley ? " — in the valley" : ""}</span>],
              [`the fit (ρ ${neg(n2(CAL.fit.rho))}, ν ${n2(CAL.fit.nu)})`, `${n3(FIT_RMS)}`],
              ["ρ = 0 · a flat smile", `${n2(CAL.rms_at_rho0)} · ${n2(CAL.rms_flat)}`],
            ]}
          />
        </>
      }
      observe={
        <>
          The error is the root-mean-square miss over the {CAL.strikes.length} dots in vol points; each cell sets α so the at-the-money vol ({pct(CAL.atm_iv)}) is matched exactly, so the map is the
          two knobs the at-the-money vol cannot fix. The outlined cells are within 0.05 vol points of the best cell ({n3(best.rms)} at ρ {neg(n2(best.rho))}, ν {n1(best.nu)}): ρ from{" "}
          {neg(n2(CAL.valley_rho_range[0]))} to {neg(n2(CAL.valley_rho_range[1]))} but ν from {n2(CAL.valley_nu_range[0])} to {n2(CAL.valley_nu_range[1])} — a valley long in curvature, short in tilt (key).
          The continuous fit (red ring) is ρ {neg(n3(CAL.fit.rho))}, ν {n2(CAL.fit.nu)}, rms {n3(FIT_RMS)}, chapter D3's number; ρ = 0 scores {n2(CAL.rms_at_rho0)} and a flat smile at the
          at-the-money vol {n2(CAL.rms_flat)} (key). On an eleven-day expiry the smile's curvature is the knob the data pin least; chapter D3's Heston found the same — its mean-reversion κ moved from
          2 to 20 and the smile over the quoted strikes moved by {n3(CAL.heston_kappa_note.on_quoted_22250_23050)} vol points (key).
        </>
      }
    >
      <div className="f2-valley">
        <div className="f2-valley-two">
          <div className="f2-panel">
            <div className="f2-panel-title">
              <strong>the miss, in vol points</strong> <span>deeper blue is closer; outlined: the valley; red ring: the fit; hover or tap a cell</span>
            </div>
            <HeatMap
              ri={ri}
              nj={nj}
              onPick={(i, j) => {
                setRi(i);
                setNj(j);
              }}
              narrow={narrow}
            />
          </div>
          <div className="f2-panel">
            <div className="f2-panel-title">
              <strong>the smile at the dial</strong> <span>over the screen's {CAL.strikes.length} dots; the vertical line is the forward, {n0(CAL.F)}</span>
            </div>
            <Smile model={s.ivs} narrow={narrow} />
          </div>
        </div>
        <div className="f2-rule" role="status">
          <strong>
            ρ {neg(n2(rho))}, ν {n2(nu)}
          </strong>
          <span>
            α {n3(s.alpha)} to match {pct(CAL.atm_iv)} at the money · rms miss <b className={inValley ? "f2-good" : undefined}>{n3(s.rms)}</b> vol points
            {inValley ? " — within 0.05 of the best cell" : rms > 2 * FIT_RMS ? " — more than twice the fit's" : ""}
          </span>
        </div>
      </div>
    </Figure>
  );
}
