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
    <div className="rounded-[1.5rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-7 text-center dark:border-white/10 dark:bg-white/4">
      <p className="text-sm font-semibold text-slate-950 dark:text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

function shouldInterceptDesktopOpen() {
  return typeof window !== "undefined" && window.innerWidth >= 1024;
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
        description="Créez votre premier devis pour faire vivre le cockpit."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 4).map((item) => (
        <Link
          href={`/devis/${item.numero}`}
          key={item.numero}
          onClick={(event) => {
            if (onSelectDevis && shouldInterceptDesktopOpen()) {
              event.preventDefault();
              onSelectDevis(item.numero);
            }
          }}
        >
          <div className="rounded-[1.45rem] border border-slate-200/70 bg-white/84 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
                  <span className={`client-chip ring-1 ${statusBadgeClasses(item.statut)}`}>{item.statut}</span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {item.numero}
                </p>
              </div>
              <p className="shrink-0 text-base font-semibold text-slate-950 dark:text-white">
                {formatCurrency(item.totalTTC || 0)}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              <span>Créé le {formatDateLabel(item.date)}</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">Ouvrir</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
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
        title="Aucune relance en attente"
        description="Le pipeline ne contient pas de devis dépassant 7 jours d'attente."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 4).map((item) => (
        <Link
          href={`/devis/${item.numero}`}
          key={item.numero}
          onClick={(event) => {
            if (onSelectDevis && shouldInterceptDesktopOpen()) {
              event.preventDefault();
              onSelectDevis(item.numero);
            }
          }}
        >
          <div className="relative overflow-hidden rounded-[1.45rem] border border-rose-200/70 bg-white/84 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 dark:border-rose-400/12 dark:bg-white/4">
            <div className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-to-b from-rose-500 to-orange-300" />
            <div className="pl-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-rose-500 dark:text-rose-300">
                    {item.numero}
                  </p>
                </div>
                <p className="shrink-0 text-base font-semibold text-slate-950 dark:text-white">
                  {formatCurrency(item.totalTTC || 0)}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-rose-200/70 pt-3 text-sm dark:border-rose-400/12">
                <span className="text-slate-500 dark:text-slate-400">En attente depuis le {formatDateLabel(item.date)}</span>
                <span className="font-semibold text-rose-700 dark:text-rose-200">Relancer</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function DashboardEcheances({ items }: { items: EcheanceItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyListState
        title="Aucune échéance proche"
        description="Aucun paiement n'est attendu dans les 14 prochains jours."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item) => {
        const urgent = item.joursRestants <= 3;
        const soon = item.joursRestants > 3 && item.joursRestants <= 7;
        const badgeClasses = urgent
          ? "bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-200 dark:ring-rose-400/20"
          : soon
            ? "bg-amber-500/12 text-amber-700 ring-amber-300/40 dark:bg-amber-500/12 dark:text-amber-200 dark:ring-amber-400/20"
            : "bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-200 dark:ring-violet-400/20";

        return (
          <Link href={`/factures/${item.numero}`} key={item.numero}>
            <div className="rounded-[1.45rem] border border-slate-200/70 bg-white/84 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    {item.numero} · {formatDateLabel(item.dateEcheance)}
                  </p>
                </div>
                <span className={`client-chip ring-1 ${badgeClasses}`}>
                  {item.joursRestants === 0 ? "Aujourd'hui" : `J${item.joursRestants > 0 ? "+" : ""}${item.joursRestants}`}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3 dark:border-white/10">
                <span className="text-sm text-slate-500 dark:text-slate-400">Montant attendu</span>
                <span className="text-base font-semibold text-slate-950 dark:text-white">
                  {formatCurrency(item.totalTTC)}
                </span>
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
        title="Aucun top client pour l'instant"
        description="Vos prochains devis acceptés feront émerger les comptes les plus rentables."
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
            className="rounded-[1.45rem] border border-slate-200/70 bg-white/84 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-white/4"
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
