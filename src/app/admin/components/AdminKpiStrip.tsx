import type { AdminKpi } from "../types";

function toneClasses(tone: AdminKpi["tone"]) {
  switch (tone) {
    case "brand":
      return "from-violet-500/20 via-fuchsia-500/12 to-orange-400/10 ring-violet-300/15";
    case "success":
      return "from-emerald-500/18 via-emerald-400/10 to-transparent ring-emerald-300/15";
    case "warning":
      return "from-amber-400/18 via-orange-400/10 to-transparent ring-amber-200/15";
    default:
      return "from-slate-400/14 via-slate-300/6 to-transparent ring-white/10";
  }
}

export function AdminKpiStrip({ items }: { items: AdminKpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-5">
      {items.map((item) => (
        <article
          key={item.id}
          className={`admin-kpi-card bg-gradient-to-br ${toneClasses(item.tone)}`}
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold tracking-tight text-white">{item.value}</p>
            <div className="h-9 w-9 rounded-2xl bg-white/6 ring-1 ring-white/10" />
          </div>
          <p className="mt-4 text-sm text-slate-300">{item.hint}</p>
        </article>
      ))}
    </div>
  );
}
