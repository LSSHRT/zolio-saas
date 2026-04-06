"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Calendar,
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
      description="Vue mensuelle de vos échéances, fins de devis et factures récurrentes."
      eyebrow="Calendrier"
      activeNav="tools"
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
            Aujourd'hui
          </button>
        </div>
      }
    >
      {/* Calendrier */}
      <ClientSectionCard>
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <button onClick={prevMonth} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <h2 className="text-base font-bold text-slate-800 dark:text-white sm:text-lg">
            {MOIS_LABELS[viewMonth - 1]} {viewYear}
          </h2>
          <button onClick={nextMonth} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronRight size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {JOURS.map((j) => (
            <div key={j} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                className={`relative flex aspect-square flex-col items-center justify-start rounded-xl p-1 text-xs transition ${
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
                      <div key={e.id} className={`h-1 w-1 rounded-full ${TONE_DOT[e.tone] || "bg-slate-400"}`} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-slate-400">+{dayEvents.length - 3}</span>
                    )}
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
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
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
