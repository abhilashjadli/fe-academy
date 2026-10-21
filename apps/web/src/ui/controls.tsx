import type { ReactNode } from "react";
import { format } from "d3-format";

type Role = "truth" | "approx" | "error";

interface SliderProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  role?: Role;
  locked?: boolean;
  fmt?: (v: number) => string;
  width?: number;
}

/** A named slider with a tabular readout. One control per idea. */
export function Slider({ label, value, min, max, step = 0.01, onChange, role, locked, fmt = format(".2f"), width }: SliderProps) {
  return (
    <label className={`ctl ${role ? "ctl-" + role : ""} ${locked ? "locked" : ""}`}>
      <span className="ctl-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={locked}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={width ? { width } : undefined}
      />
      <span className="readout">{fmt(value)}</span>
    </label>
  );
}

export function Stepper({ label, value, min, max, onChange }: { label: ReactNode; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <span className="ctl stepper">
      <span className="ctl-label">{label}</span>
      <button type="button" aria-label="decrease" disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="readout">{value}</span>
      <button type="button" aria-label="increase" disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </span>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: Array<{ id: T; label: string }>; value: T; onChange: (v: T) => void; label?: ReactNode }) {
  return (
    <span className="ctl">
      {label && <span className="ctl-label">{label}</span>}
      <span className="seg" role="group">
        {options.map((o) => (
          <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </span>
    </span>
  );
}

export function Toggle({ label, on, onChange }: { label: ReactNode; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className={"btn " + (on ? "toggled" : "")} aria-pressed={on} onClick={() => onChange(!on)}>
      {label}
    </button>
  );
}

export function Readouts({ items }: { items: Array<[ReactNode, ReactNode]> }) {
  return (
    <div className="readouts">
      {items.map(([k, v], i) => (
        <span key={i}>
          <span className="k">{k} </span>
          <span className="v">{v}</span>
        </span>
      ))}
    </div>
  );
}
