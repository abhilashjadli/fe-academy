import type { ReactNode } from "react";

export type Role = "truth" | "approx" | "error" | "ghost" | "ink";

/**
 * Icon / unit grid: "13 in every 100" as 100 things, grouped in tens so the eye counts.
 * `roleOf(i)` colours each unit; `label` writes the sentence under it. Counts are things, not areas.
 */
export function IconGrid({
  n,
  roleOf,
  perRow = 10,
  size = 14,
  gap = 3,
  groupEvery = 10,
  label,
  shape = "square",
  titleOf,
}: {
  n: number;
  roleOf: (i: number) => Role;
  perRow?: number;
  size?: number;
  gap?: number;
  /** extra gap after every k rows */
  groupEvery?: number;
  label?: ReactNode;
  shape?: "square" | "dot" | "person";
  titleOf?: (i: number) => string;
}) {
  const rows = Math.ceil(n / perRow);
  const groupGap = size * 0.6;
  const width = perRow * (size + gap) - gap;
  const height = rows * (size + gap) - gap + Math.floor((rows - 1) / groupEvery) * groupGap;
  return (
    <div className="icongrid">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: width }} role="img" aria-label={typeof label === "string" ? label : `${n} units`}>
        {Array.from({ length: n }, (_, i) => {
          const row = Math.floor(i / perRow),
            col = i % perRow;
          const x = col * (size + gap);
          const y = row * (size + gap) + Math.floor(row / groupEvery) * groupGap;
          const role = roleOf(i);
          const fill = role === "ink" ? "var(--ink-3)" : `var(--${role})`;
          const t = titleOf?.(i);
          if (shape === "dot")
            return (
              <circle key={i} cx={x + size / 2} cy={y + size / 2} r={size / 2 - 0.5} fill={fill} className={"unit unit-" + role}>
                {t && <title>{t}</title>}
              </circle>
            );
          if (shape === "person")
            return (
              <g key={i} transform={`translate(${x},${y})`} fill={fill} className={"unit unit-" + role}>
                {t && <title>{t}</title>}
                <circle cx={size / 2} cy={size * 0.22} r={size * 0.18} />
                <path d={`M${size * 0.22} ${size} V${size * 0.6} a${size * 0.28} ${size * 0.28} 0 0 1 ${size * 0.56} 0 V${size} Z`} />
              </g>
            );
          return (
            <rect key={i} x={x} y={y} width={size} height={size} rx={1.5} fill={fill} className={"unit unit-" + role}>
              {t && <title>{t}</title>}
            </rect>
          );
        })}
      </svg>
      {label && <div className="icongrid-label">{label}</div>}
    </div>
  );
}
