"use client";

import Link from "next/link";
import { formatCurrency, formatDateLabel, statusBadgeClasses } from "./shared";

export interface QuoteListItem {
  numero: string;
  nomClient: string;
  date: string;
  statut: string;
  totalTTC: number;
}

export interface EcheanceItem {
  numero: string;
  nomClient: string;
  totalTTC: number;
  dateEcheance: string;
  joursRestants: number;
}

function EmptyListState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-7 text-center dark:border-white/10 dark:bg-white/4">
      <p className="text-sm font-semibold text-slate-950 dark:text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

export function DashboardRecentQuotes({
  items,
  onSelectDevis,
}: {
  items: QuoteListItem[];
  onSelectDevis?: (numero: string) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyListState
        title="Aucun devis récent"
        description="Créez votre premier devis pour alimenter le cockpit."
      />
    );
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {items.slice(0, 4).map((item) => (
          <Link href={`/devis/${item.numero}`} key={item.numero}>
            <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    {item.numero}
                  </p>
                </div>
                <span className={`client-chip ring-1 ${statusBadgeClasses(item.statut)}`}>{item.statut}</span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateLabel(item.date)}</p>
                <p className="text-base font-semibold text-slate-950 dark:text-white">{formatCurrency(item.totalTTC || 0)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[1.65rem] border border-slate-200/70 bg-white/80 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.22)] lg:block dark:border-white/8 dark:bg-white/4">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/70 text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Client</th>
              <th scope="col" className="px-4 py-3 font-semibold">Numéro</th>
              <th scope="col" className="px-4 py-3 font-semibold">Date</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">Montant</th>
              <th scope="col" className="px-4 py-3 font-semibold text-center">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
            {items.slice(0, 4).map((item) => (
              <tr key={item.numero} className="group relative transition hover:bg-slate-50/70 dark:hover:bg-white/5">
                <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">
                  <Link
                    href={`/devis/${item.numero}`}
                    onClick={(event) => {
                      if (onSelectDevis) {
                        event.preventDefault();
                        onSelectDevis(item.numero);
                      }
                    }}
                    className="before:absolute before:inset-0 focus:outline-none"
                  >
                    {item.nomClient}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.numero}</td>
                <td className="px-4 py-3">{formatDateLabel(item.date)}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-950 dark:text-white">
                  {formatCurrency(item.totalTTC || 0)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`client-chip inline-flex ring-1 ${statusBadgeClasses(item.statut)}`}>
                    {item.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function DashboardFollowUps({
  items,
  onSelectDevis,
}: {
  items: QuoteListItem[];
  onSelectDevis?: (numero: string) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyListState
        title="Pipeline propre"
        description="Aucun devis âgé de plus de 7 jours n'attend une relance."
      />
    );
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {items.slice(0, 4).map((item) => (
          <Link href={`/devis/${item.numero}`} key={item.numero}>
            <div className="rounded-[1.5rem] border border-rose-200/70 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(255,255,255,0.95))] p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.22)] dark:border-rose-400/12 dark:bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(15,23,42,0.86))]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-rose-500 dark:text-rose-300">
                    {item.numero}
                  </p>
                </div>
                <span className="client-chip bg-rose-500/12 text-rose-700 ring-1 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-200 dark:ring-rose-400/20">
                  +7j
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateLabel(item.date)}</p>
                <p className="text-base font-semibold text-slate-950 dark:text-white">{formatCurrency(item.totalTTC || 0)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[1.65rem] border border-rose-200/70 bg-white/80 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.22)] lg:block dark:border-rose-400/12 dark:bg-white/4">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-rose-50/70 text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Client</th>
              <th scope="col" className="px-4 py-3 font-semibold">Numéro</th>
              <th scope="col" className="px-4 py-3 font-semibold">Date</th>
              <th scope="col" className="px-4 py-3 font-semibold text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-200/60 dark:divide-white/10">
            {items.slice(0, 4).map((item) => (
              <tr key={item.numero} className="group relative bg-rose-50/30 transition hover:bg-rose-50/60 dark:bg-rose-500/5 dark:hover:bg-rose-500/10">
                <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">
                  <Link
                    href={`/devis/${item.numero}`}
                    onClick={(event) => {
                      if (onSelectDevis) {
                        event.preventDefault();
                        onSelectDevis(item.numero);
                      }
                    }}
                    className="before:absolute before:inset-0 focus:outline-none"
                  >
                    {item.nomClient}
                  </Link>
                </td>
                <td className="px-4 py-3 text-rose-700 dark:text-rose-200">{item.numero}</td>
                <td className="px-4 py-3 text-rose-700 dark:text-rose-200">{formatDateLabel(item.date)}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-950 dark:text-white">
                  {formatCurrency(item.totalTTC || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function DashboardEcheances({ items }: { items: EcheanceItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyListState
        title="Aucune échéance dans les 14 jours"
        description="Tout est sous contrôle côté encaissement."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item) => {
        const urgent = item.joursRestants <= 3;
        const soon = item.joursRestants > 3 && item.joursRestants <= 7;
        const toneClasses = urgent
          ? "border-rose-200/70 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(255,255,255,0.95))] dark:border-rose-400/12 dark:bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(15,23,42,0.86))]"
          : soon
            ? "border-amber-200/70 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(255,255,255,0.95))] dark:border-amber-400/12 dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(15,23,42,0.86))]"
            : "border-violet-200/70 bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(255,255,255,0.95))] dark:border-violet-400/12 dark:bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(15,23,42,0.86))]";
        const textClass = urgent
          ? "text-rose-700 dark:text-rose-200"
          : soon
            ? "text-amber-700 dark:text-amber-200"
            : "text-violet-700 dark:text-violet-200";

        return (
          <Link href={`/factures/${item.numero}`} key={item.numero}>
            <div className={`rounded-[1.5rem] border p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 ${toneClasses}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    {item.numero} · {formatDateLabel(item.dateEcheance)}
                  </p>
                </div>
                <span className={`client-chip ring-1 ${textClass} ${urgent ? "bg-rose-500/12 ring-rose-300/40 dark:bg-rose-500/12 dark:ring-rose-400/20" : soon ? "bg-amber-500/12 ring-amber-300/40 dark:bg-amber-500/12 dark:ring-amber-400/20" : "bg-violet-500/12 ring-violet-300/40 dark:bg-violet-500/12 dark:ring-violet-400/20"}`}>
                  {item.joursRestants === 0 ? "Aujourd'hui" : `J${item.joursRestants > 0 ? "+" : ""}${item.joursRestants}`}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">Paiement attendu</p>
                <p className="text-base font-semibold text-slate-950 dark:text-white">{formatCurrency(item.totalTTC)}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function DashboardTopClients({
  items,
}: {
  items: Array<{ nom: string; devisCount: number; revenueHT: number }>;
}) {
  if (items.length === 0) {
    return (
      <EmptyListState
        title="Pas encore de données"
        description="Acceptez vos premiers devis pour faire émerger vos meilleurs clients."
      />
    );
  }

  const maxRevenue = Math.max(...items.map((item) => item.revenueHT), 1);

  return (
    <div className="space-y-3">
      {items.map((client, index) => {
        const width = Math.max((client.revenueHT / maxRevenue) * 100, 8);
        return (
          <div
            key={client.nom}
            className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.22)] dark:border-white/8 dark:bg-white/4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700 ring-1 ring-violet-300/30 dark:text-violet-200 dark:ring-violet-400/20">
                  <span className="text-sm font-bold">{index + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{client.nom}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {client.devisCount} devis accepté{client.devisCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(client.revenueHT)}
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
