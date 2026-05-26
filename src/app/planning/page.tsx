"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";
import { MetricTile } from "@/components/desktop";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MOIS_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const TONE_DOT: Record<string, string> = {
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  slate: "bg-slate-400",
};

interface PlanningEvent {
  id: string;
  type: "facture" | "devis" | "recurrente";
  date: string;
  title: string;
  subtitle: string;
  amount: number | null;
  statut: string;
  href: string;
  tone: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1; // Lundi = 0
}

export default function PlanningPage() {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Données planning auto
  const { data, isLoading } = useSWR<{ events: PlanningEvent[]; month: number; year: number }>(
    `/api/planning?month=${viewMonth}&year=${viewYear}`,
    fetcher,
    { refreshInterval: 60000 },
  );

  // Événements manuels
  const { data: manualData, mutate: mutateManual } = useSWR<{ events: PlanningEvent[] }>(
    `/api/calendar-events?month=${viewMonth}&year=${viewYear}`,
    fetcher,
    { refreshInterval: 60000 },
  );

  const events = useMemo(() => {
    const auto = data?.events ?? [];
    const manual = manualData?.events ?? [];
    return [...auto, ...manual];
  }, [data, manualData]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, PlanningEvent[]> = {};
    for (const e of events) {
      const dateKey = e.date.split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(e);
    }
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setViewMonth(today.getMonth() + 1);
    setViewYear(today.getFullYear());
    setSelectedDate(null);
  };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: formData.get("titre"),
          date: formData.get("date"),
          heure: formData.get("heure") || null,
          type: formData.get("type") || "rdv",
          couleur: formData.get("couleur") || "violet",
          notes: formData.get("notes") || null,
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      await mutateManual();
      setShowCreateModal(false);
      toast.success("Événement ajouté");
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  const todayStr = today.toISOString().split("T")[0];

  return (
    <ClientSubpageShell
      title="Planning"
      description="Vos échéances, fins de devis et factures récurrentes en un coup d'œil."
      eyebrow="Calendrier"
      activeNav="tools"
      breadcrumbs={[{ label: "Outils" }, { label: "Planning" }]}
      metaPills={[
        {
          icon: Calendar,
          label: new Date(viewYear, viewMonth - 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
          tone: "slate",
        },
        ...(events.length > 0
          ? [{ icon: TrendingUp, label: `${events.length} événement${events.length > 1 ? "s" : ""}`, tone: "violet" as const }]
          : []),
        ...(eventsByDate[todayStr]?.length
          ? [{ icon: Clock, label: `${eventsByDate[todayStr].length} aujourd'hui`, tone: "amber" as const }]
          : []),
      ]}
      focusLine={
        events.length === 0 ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-100">Mois calme</span>
            {" "}· Aucun événement programmé. Vos factures et échéances de devis apparaîtront ici automatiquement.
          </>
        ) : eventsByDate[todayStr]?.length ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {eventsByDate[todayStr].length} événement{eventsByDate[todayStr].length > 1 ? "s" : ""} aujourd&apos;hui
            </span>
            {" "}· Cliquez sur la date pour voir le détail et ouvrir les documents liés.
          </>
        ) : (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {events.length} événement{events.length > 1 ? "s" : ""} ce mois-ci
            </span>
            {" "}· Échéances de devis, factures et événements manuels regroupés sur une seule vue.
          </>
        )
      }
      mobilePrimaryAction={
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
          >
            <Plus size={16} />
            Ajouter
          </button>
          <button
            onClick={goToday}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Calendar size={16} />
            Aujourd&apos;hui
          </button>
        </div>
      }
    >
      {/* ─── Mobile view (< lg) ─────────────────────────── */}
      <div className="space-y-4 sm:space-y-6 lg:hidden">
      {/* Calendrier */}
      <ClientSectionCard>
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <button onClick={prevMonth} aria-label="Mois précédent" className="rounded-xl p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <h2 className="text-base font-bold text-slate-800 dark:text-white sm:text-lg">
            {MOIS_LABELS[viewMonth - 1]} {viewYear}
          </h2>
          <button onClick={nextMonth} aria-label="Mois suivant" className="rounded-xl p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronRight size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {JOURS.map((j) => (
            <div key={j} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {j}
            </div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = eventsByDate[dateStr] ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex aspect-square flex-col items-center justify-start rounded-xl p-1.5 text-sm transition ${
                  isSelected
                    ? "bg-violet-100 ring-2 ring-violet-500 dark:bg-violet-500/15 dark:ring-violet-400"
                    : isToday
                    ? "bg-violet-50 ring-1 ring-violet-300 dark:bg-violet-500/10 dark:ring-violet-500/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <span className={`font-semibold ${isToday ? "text-violet-700 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[e.tone] || "bg-slate-400"}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ClientSectionCard>

      {/* Événements du jour sélectionné */}
      {selectedDate && (
        <ClientSectionCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {selectedEvents.length} événement{selectedEvents.length !== 1 ? "s" : ""}
            </span>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucun événement ce jour.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e) => {
                const Icon = e.type === "facture" ? FileText : e.type === "recurrente" ? RefreshCw : Clock;
                return (
                  <Link key={e.id} href={e.href}>
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-violet-500/30"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_DOT[e.tone] ? `bg-${e.tone}-50 dark:bg-${e.tone}-500/10` : "bg-slate-100 dark:bg-slate-700"}`}>
                        <Icon size={16} className={e.tone === "emerald" ? "text-emerald-600 dark:text-emerald-400" : e.tone === "rose" ? "text-rose-600 dark:text-rose-400" : e.tone === "amber" ? "text-amber-600 dark:text-amber-400" : e.tone === "violet" ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-400"} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{e.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{e.subtitle}</p>
                      </div>
                      {e.amount !== null && (
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {e.amount.toFixed(2)}€
                        </span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </ClientSectionCard>
      )}

      {/* Liste complète du mois */}
      <ClientSectionCard>
        <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">
          Tous les événements du mois
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun événement ce mois-ci.</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => {
              const Icon = e.type === "facture" ? FileText : e.type === "recurrente" ? RefreshCw : Clock;
              const eventDate = new Date(e.date);
              return (
                <Link key={e.id} href={e.href}>
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-violet-500/30"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_DOT[e.tone] ? `bg-${e.tone}-50 dark:bg-${e.tone}-500/10` : "bg-slate-100 dark:bg-slate-700"}`}>
                      <Icon size={16} className={e.tone === "emerald" ? "text-emerald-600 dark:text-emerald-400" : e.tone === "rose" ? "text-rose-600 dark:text-rose-400" : e.tone === "amber" ? "text-amber-600 dark:text-amber-400" : e.tone === "violet" ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-400"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{e.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {e.subtitle} · {eventDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {e.amount !== null && (
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {e.amount.toFixed(2)}€
                      </span>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </ClientSectionCard>
      </div>

      {/* ─── Desktop view (lg+) — v2 dense ─────────────────────── */}
      <div className="hidden lg:block lg:space-y-6">
        {/* KPI strip */}
        <div className="grid gap-4 lg:grid-cols-4">
          <MetricTile
            label="Mois en cours"
            value={MOIS_LABELS[viewMonth - 1]}
            detail={String(viewYear)}
            icon={CalendarDays}
            tone="primary"
          />
          <MetricTile
            label="Événements"
            value={String(events.length)}
            detail="Programmés ce mois-ci"
            icon={TrendingUp}
            tone={events.length > 0 ? "success" : "neutral"}
          />
          <MetricTile
            label="Aujourd'hui"
            value={String(eventsByDate[todayStr]?.length ?? 0)}
            detail="À traiter dès maintenant"
            icon={Clock}
            tone={(eventsByDate[todayStr]?.length ?? 0) > 0 ? "warning" : "neutral"}
          />
          <MetricTile
            label="Manuels"
            value={String(manualData?.events?.length ?? 0)}
            detail={`Auto : ${data?.events?.length ?? 0}`}
            icon={Plus}
            tone="neutral"
          />
        </div>

        {/* 2-col body */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            {/* Toolbar */}
            <section className="lg-v2-panel p-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Mois précédent"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border lg-v2-divider text-[var(--v2-text-subtle)] transition hover:border-[var(--v2-primary)] hover:text-[var(--v2-primary)]"
                >
                  <ChevronLeft size={14} aria-hidden />
                </button>
                <h2 className="text-sm font-semibold lg-v2-text-strong">
                  {MOIS_LABELS[viewMonth - 1]} {viewYear}
                </h2>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Mois suivant"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border lg-v2-divider text-[var(--v2-text-subtle)] transition hover:border-[var(--v2-primary)] hover:text-[var(--v2-primary)]"
                >
                  <ChevronRight size={14} aria-hidden />
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={goToday}
                  className="lg-v2-btn lg-v2-btn-secondary shrink-0"
                >
                  <Calendar size={14} aria-hidden /> Aujourd&apos;hui
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="lg-v2-btn lg-v2-btn-primary shrink-0"
                >
                  <Plus size={14} aria-hidden /> Nouvel événement
                </button>
              </div>
            </section>

            {/* Calendar grid */}
            <section className="lg-v2-panel p-5">
              <div className="mb-3 grid grid-cols-7 gap-1">
                {JOURS.map((j) => (
                  <div key={j} className="lg-v2-eyebrow text-center">
                    {j}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = eventsByDate[dateStr] ?? [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`relative flex aspect-square flex-col items-stretch justify-start rounded-md border p-1.5 text-xs transition ${
                        isSelected
                          ? "border-[var(--v2-primary)] bg-[var(--v2-primary-soft)]"
                          : isToday
                            ? "border-[var(--v2-primary)] bg-[var(--v2-panel)]"
                            : "lg-v2-divider bg-[var(--v2-panel)] hover:border-[var(--v2-primary)]"
                      }`}
                    >
                      <span className={`text-left text-[11px] font-semibold tabular-nums ${isToday ? "text-[var(--v2-primary)]" : "lg-v2-text-strong"}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 ? (
                        <div className="mt-auto flex items-center gap-0.5">
                          {dayEvents.slice(0, 4).map((e) => (
                            <div key={e.id} className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[e.tone] || "bg-slate-400"}`} />
                          ))}
                          {dayEvents.length > 4 ? (
                            <span className="ml-0.5 text-[9px] font-semibold lg-v2-text-muted tabular-nums">+{dayEvents.length - 4}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Selected day details */}
            {selectedDate ? (
              <section className="lg-v2-panel p-5">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="lg-v2-eyebrow">Sélection</p>
                    <p className="mt-1 text-sm font-semibold lg-v2-text-strong">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <span className="lg-v2-pill lg-v2-pill-neutral">
                    {selectedEvents.length} événement{selectedEvents.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {selectedEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center lg-v2-text-subtle">
                    <Calendar size={32} strokeWidth={1} aria-hidden />
                    <p className="text-sm">Aucun événement ce jour.</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="lg-v2-btn lg-v2-btn-primary"
                    >
                      <Plus size={14} aria-hidden /> Ajouter
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEvents.map((e) => {
                      const Icon = e.type === "facture" ? FileText : e.type === "recurrente" ? RefreshCw : Clock;
                      return (
                        <Link
                          key={e.id}
                          href={e.href}
                          className="flex items-center gap-3 rounded-lg border lg-v2-divider bg-[var(--v2-panel)] px-3 py-2.5 transition hover:border-[var(--v2-primary)]"
                        >
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${TONE_DOT[e.tone] || "bg-slate-400"} text-white`}>
                            <Icon size={12} aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold lg-v2-text-strong truncate">{e.title}</p>
                            <p className="text-xs lg-v2-text-muted truncate">{e.subtitle}</p>
                          </div>
                          {e.amount !== null ? (
                            <span className="text-sm font-semibold tabular-nums lg-v2-text-strong">
                              {e.amount.toFixed(2)}€
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : null}
          </div>

          {/* Right rail sticky */}
          <aside className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-4">
            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">Actions</p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="lg-v2-btn lg-v2-btn-primary mt-3 w-full justify-center"
              >
                <Plus size={14} aria-hidden /> Nouvel événement
              </button>
              <button
                type="button"
                onClick={goToday}
                className="lg-v2-btn lg-v2-btn-secondary mt-2 w-full justify-center"
              >
                <Calendar size={14} aria-hidden /> Revenir à aujourd&apos;hui
              </button>
              <p className="mt-3 text-xs lg-v2-text-subtle">
                Les échéances de devis, factures et récurrentes apparaissent automatiquement.
              </p>
            </section>

            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">Légende</p>
              <ul className="mt-3 space-y-1.5 text-xs">
                <li className="flex items-center gap-2 lg-v2-text-muted">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  Facture payée / récurrente OK
                </li>
                <li className="flex items-center gap-2 lg-v2-text-muted">
                  <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                  Échéance proche / rappel
                </li>
                <li className="flex items-center gap-2 lg-v2-text-muted">
                  <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden />
                  En retard / urgent
                </li>
                <li className="flex items-center gap-2 lg-v2-text-muted">
                  <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden />
                  Événement manuel
                </li>
              </ul>
            </section>

            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">Tous les événements</p>
              <p className="mt-1 text-sm lg-v2-text-muted">
                {events.length} ce mois-ci.
              </p>
              {isLoading ? (
                <div className="mt-3 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200/70 dark:bg-white/8" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <p className="mt-3 text-xs lg-v2-text-subtle">Aucun événement à afficher pour ce mois.</p>
              ) : (
                <div className="mt-3 max-h-80 space-y-1.5 overflow-y-auto pr-1">
                  {events.map((e) => {
                    const Icon = e.type === "facture" ? FileText : e.type === "recurrente" ? RefreshCw : Clock;
                    const eventDate = new Date(e.date);
                    return (
                      <Link
                        key={e.id}
                        href={e.href}
                        className="flex items-center gap-2 rounded-md border lg-v2-divider bg-[var(--v2-panel-muted)] px-2.5 py-1.5 transition hover:border-[var(--v2-primary)] hover:bg-[var(--v2-panel)]"
                      >
                        <div className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[e.tone] || "bg-slate-400"}`} aria-hidden />
                        <Icon size={11} className="shrink-0 text-[var(--v2-text-subtle)]" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold lg-v2-text-strong">{e.title}</p>
                          <p className="truncate text-[10px] lg-v2-text-muted">
                            {eventDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {e.subtitle}
                          </p>
                        </div>
                        {e.amount !== null ? (
                          <span className="shrink-0 text-[10px] font-semibold tabular-nums lg-v2-text-strong">
                            {e.amount.toFixed(0)}€
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {/* Modal création événement */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nouvel événement</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Titre</label>
                <input name="titre" required placeholder="RDV Chantier, Rappel..." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Date</label>
                  <input name="date" type="date" required defaultValue={selectedDate || todayStr} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Heure (opt.)</label>
                  <input name="heure" type="time" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Type</label>
                  <select name="type" defaultValue="rdv" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                    <option value="rdv">🗓 RDV</option>
                    <option value="rappel">⏰ Rappel</option>
                    <option value="note">📝 Note</option>
                    <option value="echeance">💰 Échéance</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Couleur</label>
                  <select name="couleur" defaultValue="violet" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                    <option value="violet">🟣 Violet</option>
                    <option value="emerald">🟢 Vert</option>
                    <option value="amber">🟠 Orange</option>
                    <option value="rose">🔴 Rose</option>
                    <option value="blue">🔵 Bleu</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Notes (opt.)</label>
                <textarea name="notes" rows={2} placeholder="Détails..." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  Annuler
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-50">
                  {isCreating ? "..." : "Créer"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </ClientSubpageShell>
  );
}
