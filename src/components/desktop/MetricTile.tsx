import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";

type MetricTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

interface MetricTileProps {
  label: string;
  value: string | number;
  detail?: string;
  delta?: { value: number; suffix?: string };
  icon?: LucideIcon;
  tone?: MetricTone;
  sparkline?: number[];
  className?: string;
}

const toneAccentMap: Record<MetricTone, string> = {
  neutral: "text-slate-400 dark:text-slate-500",
  primary: "text-[var(--v2-primary)]",
  success: "text-[var(--v2-success)]",
  warning: "text-[var(--v2-warning)]",
  danger: "text-[var(--v2-danger)]",
  info: "text-[var(--v2-info)]",
};

/**
 * Tuile métrique desktop : eyebrow + valeur tabulaire + delta optionnel + sparkline mini.
 * Pas de gradient ni d'icône surdimensionnée — focus sur la donnée.
 */
export function MetricTile({
  label,
  value,
  detail,
  delta,
  icon: Icon,
  tone = "neutral",
  sparkline,
  className = "",
}: MetricTileProps) {
  const deltaPositive = delta != null && delta.value >= 0;
  const deltaTone = delta == null
    ? ""
    : deltaPositive
      ? "text-[var(--v2-success)]"
      : "text-[var(--v2-danger)]";
  const DeltaIcon = delta == null ? null : deltaPositive ? ArrowUp : ArrowDown;

  return (
    <div className={`lg-v2-panel p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="lg-v2-eyebrow">{label}</p>
        {Icon ? <Icon size={16} className={toneAccentMap[tone]} aria-hidden /> : null}
      </div>
      <p className="lg-v2-kpi-value mt-3 text-[28px] leading-none">{value}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        {detail ? <p className="text-xs lg-v2-text-muted">{detail}</p> : <span />}
        {delta != null && DeltaIcon ? (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${deltaTone}`}>
            <DeltaIcon size={12} aria-hidden />
            {Math.abs(delta.value).toFixed(1)}
            {delta.suffix ?? "%"}
          </span>
        ) : null}
      </div>
      {sparkline && sparkline.length > 1 ? (
        <Sparkline values={sparkline} tone={tone} className="mt-3 h-8 w-full" />
      ) : null}
    </div>
  );
}

interface SparklineProps {
  values: number[];
  tone: MetricTone;
  className?: string;
}

function Sparkline({ values, tone, className = "" }: SparklineProps) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  const strokeMap: Record<MetricTone, string> = {
    neutral: "var(--v2-text-subtle)",
    primary: "var(--v2-primary)",
    success: "var(--v2-success)",
    warning: "var(--v2-warning)",
    danger: "var(--v2-danger)",
    info: "var(--v2-info)",
  };
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeMap[tone]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
