import {
  BrainCircuit,
  CreditCard,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
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
  const iconMap = {
    users: Users,
    pro: CreditCard,
    mrr: TrendingUp,
    recent: UserPlus,
    ai: BrainCircuit,
  } as const;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => {
        const Icon = iconMap[item.id as keyof typeof iconMap] ?? TrendingUp;

        return (
          <article
            key={item.id}
            className={`admin-kpi-card bg-gradient-to-br ${toneClasses(item.tone)}`}
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{item.value}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/6 text-white ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-10 sm:w-10">
                <Icon className="h-5 w-5 text-white/90" strokeWidth={2.2} />
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-300 sm:mt-4 sm:text-sm">{item.hint}</p>
          </article>
        );
      })}
    </div>
  );
}
