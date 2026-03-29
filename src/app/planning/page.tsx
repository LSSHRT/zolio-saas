"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  ClientHeroStat,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";

type PlanningQuote = {
  dateDebut?: string | null;
  dateFin?: string | null;
  nomClient: string;
  numero: string;
  statut: string;
  totalTTC: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatCurrency(value: string) {
  const amount = Number.parseFloat(value || "0");
  return `${Number.isFinite(amount) ? amount.toFixed(0) : "0"}€`;
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return "Non défini";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function PlanningItem({
  devis,
  onSaved,
}: {
  devis: PlanningQuote;
  onSaved: () => Promise<unknown>;
}) {
  const [dateDebut, setDateDebut] = useState(devis.dateDebut || "");
  const [dateFin, setDateFin] = useState(devis.dateFin || "");
  const [saving, setSaving] = useState(false);

  const isPlanned = Boolean(devis.dateDebut || devis.dateFin);
  const hasChanged = dateDebut !== (devis.dateDebut || "") || dateFin !== (devis.dateFin || "");

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/devis/${devis.numero}/planning`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateDebut, dateFin }),
      });

      if (!response.ok) {
        throw new Error("Impossible d'enregistrer les dates du chantier.");
      }

      await onSaved();
      toast.success(isPlanned ? "Planning mis à jour." : "Chantier planifié.");
    } catch (error) {
      logError("planning-save", error);
      toast.error(error instanceof Error ? error.message : "Erreur de planification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.85rem] border border-slate-200/70 bg-slate-50/85 p-5 dark:border-white/8 dark:bg-white/4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
              {devis.numero}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                isPlanned
                  ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300"
                  : "bg-amber-400/12 text-amber-700 dark:bg-amber-400/12 dark:text-amber-300"
              }`}
            >
              {isPlanned ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
              {isPlanned ? "Planifié" : "À planifier"}
            </span>
          </div>

          <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{devis.nomClient}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <FileText size={15} />
              {formatCurrency(devis.totalTTC)} TTC
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarRange size={15} />
              {dateDebut ? formatDateLabel(dateDebut) : "Début à définir"}
              <span aria-hidden="true">→</span>
              {dateFin ? formatDateLabel(dateFin) : "Fin à définir"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] lg:min-w-[360px]">
          <label className="flex flex-col gap-2 rounded-[1.25rem] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/20">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Début chantier
            </span>
            <input
              type="date"
              value={dateDebut}
              onChange={(event) => setDateDebut(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
            />
          </label>

          <div className="hidden items-center justify-center text-slate-300 sm:flex dark:text-slate-600">—</div>

          <label className="flex flex-col gap-2 rounded-[1.25rem] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/20">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Fin chantier
            </span>
            <input
              type="date"
              value={dateFin}
              onChange={(event) => setDateFin(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-4 dark:border-white/8">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Commencez par les devis acceptés sans date, puis ajustez vos semaines au fil du terrain.
        </p>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!hasChanged || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </motion.article>
  );
}

export default function PlanningPage() {
  const { data, mutate, isLoading } = useSWR<PlanningQuote[]>("/api/devis", fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const devis = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const devisAcceptes = useMemo(() => devis.filter((item) => item.statut === "Accepté"), [devis]);
  const sortedDevis = useMemo(
    () =>
      [...devisAcceptes].sort((a, b) => {
        if (!a.dateDebut && b.dateDebut) return -1;
        if (a.dateDebut && !b.dateDebut) return 1;
        if (a.dateDebut && b.dateDebut) return a.dateDebut.localeCompare(b.dateDebut);
        return 0;
      }),
    [devisAcceptes],
  );

  const plannedCount = useMemo(
    () => devisAcceptes.filter((item) => Boolean(item.dateDebut || item.dateFin)).length,
    [devisAcceptes],
  );
  const toScheduleCount = devisAcceptes.length - plannedCount;
  const upcomingCount = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return devisAcceptes.filter((item) => {
      if (!item.dateDebut) {
        return false;
      }

      const startDate = new Date(item.dateDebut);
      return startDate >= today && startDate <= nextWeek;
    }).length;
  }, [devisAcceptes]);

  return (
    <ClientSubpageShell
      title="Planning & chantiers"
      description="Regroupez ici vos devis acceptés, posez des dates en quelques gestes et gardez une vue claire sur les prochaines semaines terrain."
      eyebrow="Organisation chantier"
      activeNav="tools"
      mobilePrimaryAction={
        <Link
          href="/devis"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
        >
          <CalendarDays size={16} />
          Devis
        </Link>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="Chantiers"
            value={String(devisAcceptes.length)}
            detail="Devis acceptés à planifier"
            tone="violet"
          />
          <ClientHeroStat
            label="Planifiés"
            value={String(plannedCount)}
            detail="Avec au moins une date définie"
            tone="emerald"
          />
          <ClientHeroStat
            label="À caler"
            value={String(toScheduleCount)}
            detail="Priorité de la semaine"
            tone="amber"
          />
          <ClientHeroStat
            label="7 jours"
            value={String(upcomingCount)}
            detail="Démarrent bientôt"
            tone="slate"
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Vue terrain"
          description="Commencez par les chantiers sans date, puis affinez votre semaine selon les confirmations client."
          badge={`${devisAcceptes.length} chantiers`}
          items={[
            {
              label: "Planifiés",
              value: String(plannedCount),
              detail: "Dates posées",
              tone: "emerald",
            },
            {
              label: "À caler",
              value: String(toScheduleCount),
              detail: "À traiter vite",
              tone: "amber",
            },
            {
              label: "7 jours",
              value: String(upcomingCount),
              detail: "Prochains départs",
              tone: "violet",
            },
            {
              label: "Source",
              value: String(devisAcceptes.length),
              detail: "Devis acceptés",
              tone: "slate",
            },
          ]}
        />
      }
    >
      <ClientSectionCard>
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-violet-200/70 bg-violet-50/80 p-4 text-sm text-violet-900 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-100">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-violet-700 dark:bg-white/10 dark:text-violet-100">
              <CalendarDays size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-200">
                Vue rapide
              </p>
              <p className="mt-2 leading-6">
                Ici, vous retrouvez uniquement les devis déjà acceptés. Posez une date de début et une date de fin pour transformer votre pipeline en planning exploitable sur mobile.
              </p>
            </div>
          </div>
        </div>
      </ClientSectionCard>

      <ClientSectionCard>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 dark:border-white/8 dark:bg-white/4"
              >
                <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-4 h-6 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="h-20 rounded-[1.25rem] bg-slate-200 dark:bg-slate-700" />
                  <div className="h-20 rounded-[1.25rem] bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedDevis.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[1.85rem] border border-dashed border-slate-200 px-6 py-14 text-center dark:border-white/10">
            <CalendarDays size={46} className="text-slate-300 dark:text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aucun chantier à planifier</h2>
            <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Les devis acceptés apparaîtront ici automatiquement. Validez un devis, puis revenez poser les dates de chantier.
            </p>
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
            >
              <FileText size={16} />
              Voir mes devis
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {sortedDevis.length} chantier{sortedDevis.length > 1 ? "s" : ""} à organiser
              </p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                Les non planifiés remontent en premier
              </p>
            </div>

            {sortedDevis.map((item) => (
              <PlanningItem key={item.numero} devis={item} onSaved={mutate} />
            ))}
          </div>
        )}
      </ClientSectionCard>
    </ClientSubpageShell>
  );
}
