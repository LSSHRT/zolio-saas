"use client";

import Link from "next/link";
import { formatCurrency, formatDateLabel, statusBadgeClasses } from "./shared";

// ─── Types for quote/echeance lists ───────────────────────────────────

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

// ─── Devis Récents ────────────────────────────────────────────────────

export function DashboardRecentQuotes({ items }: { items: QuoteListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Aucun devis récent</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Créez votre premier devis pour alimenter le cockpit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 3).map((item) => (
        <Link href={`/devis/${item.numero}`} key={item.numero}>
          <div className="rounded-[1.45rem] border border-slate-200/70 bg-white/75 p-4 transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {item.numero} · {formatDateLabel(item.date)}
                </p>
              </div>
              <span className={`client-chip ring-1 ${statusBadgeClasses(item.statut)}`}>
                {item.statut}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">
              {formatCurrency(item.totalTTC || 0)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Devis à Relancer ─────────────────────────────────────────────────

export function DashboardFollowUps({ items }: { items: QuoteListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Pipeline propre</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Aucun devis âgé de plus de 7 jours n&apos;attend une relance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 3).map((item) => (
        <Link href={`/devis/${item.numero}`} key={item.numero}>
          <div className="rounded-[1.45rem] border border-rose-200/70 bg-rose-50/80 p-4 dark:border-rose-400/12 dark:bg-rose-500/8">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
            <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">
              {item.numero} · {formatDateLabel(item.date)}
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {formatCurrency(item.totalTTC || 0)} • en attente depuis plus de 7 jours.
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Échéances Prochaines ─────────────────────────────────────────────

export function DashboardEcheances({ items }: { items: EcheanceItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Aucune échéance dans les 14 jours</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Tout est sous contrôle.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((ech) => (
        <Link href={`/factures/${ech.numero}`} key={ech.numero}>
          <div className={`rounded-[1.45rem] border p-4 transition hover:-translate-y-0.5 ${
            ech.joursRestants <= 3
              ? "border-rose-200/70 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/10"
              : ech.joursRestants <= 7
              ? "border-amber-200/70 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/10"
              : "border-violet-200/70 bg-violet-50/50 dark:border-violet-500/20 dark:bg-violet-500/10"
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{ech.nomClient}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ech.numero}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(ech.totalTTC)}</p>
                <p className={`text-xs font-semibold ${
                  ech.joursRestants <= 3 ? "text-rose-600 dark:text-rose-400" :
                  ech.joursRestants <= 7 ? "text-amber-600 dark:text-amber-400" : "text-violet-600 dark:text-violet-400"
                }`}>
                  {ech.joursRestants === 0 ? "Aujourd'hui" : `J${ech.joursRestants > 0 ? '+' : ''}${ech.joursRestants}j`}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Top Clients ──────────────────────────────────────────────────────

export function DashboardTopClients({ items }: { items: Array<{ nom: string; devisCount: number; revenueHT: number }> }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Pas encore de données</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Acceptez vos premiers devis pour voir vos meilleurs clients.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((client) => (
        <div key={client.nom} className="rounded-[1.45rem] border border-slate-200/70 bg-white/75 p-4 dark:border-white/8 dark:bg-white/4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 ring-1 ring-violet-300/30 dark:text-violet-200 dark:ring-violet-400/20">
                <span className="text-sm font-bold">{client.nom.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{client.nom}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {client.devisCount} devis{client.devisCount > 1 ? 's' : ''} acceptés
                </p>
              </div>
            </div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(client.revenueHT)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
