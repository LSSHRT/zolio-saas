"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, Loader2, Plus, Save, StickyNote, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ClientHeroStat,
  ClientMobileActionsMenu,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMobileAction,
} from "@/components/client-shell";

interface Note {
  id: string;
  titre: string;
  contenu: string;
  date: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CalepinPage() {
  const { data: notes, error, isLoading, mutate } = useSWR<Note[]>("/api/notes", fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const noteList = useMemo<Note[]>(() => (Array.isArray(notes) ? notes : []), [notes]);
  const titledNotes = useMemo(
    () => noteList.filter((note) => Boolean(note.titre && note.titre.trim())).length,
    [noteList],
  );
  const recentDate = noteList[0]?.date || "Aucune activité";
  const deleteLabel = noteToDelete?.titre?.trim() || noteToDelete?.contenu?.trim().slice(0, 72) || "cette note";
  const getMobileNoteActions = (note: Note): ClientMobileAction[] => [
    {
      icon: Trash2,
      label: "Supprimer",
      onClick: () => requestDelete(note),
      tone: "danger",
    },
  ];

  const handleSave = async () => {
    if (!currentNote.titre && !currentNote.contenu) return;

    setIsSaving(true);
    try {
      if (currentNote.id) {
        await fetch(`/api/notes/${currentNote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentNote),
        });
      } else {
        await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentNote),
        });
      }
      await mutate();
      setIsModalOpen(false);
      setCurrentNote({});
      toast.success(currentNote.id ? "Note mise à jour." : "Note enregistrée.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d’enregistrer la note.");
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (note: Note, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setNoteToDelete(note);
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notes/${noteToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Erreur de suppression");
      }

      await mutate();

      if (currentNote.id === noteToDelete.id) {
        setIsModalOpen(false);
        setCurrentNote({});
      }

      setNoteToDelete(null);
      toast.success("Note supprimée.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer la note.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openNote = (note?: Note) => {
    setCurrentNote(note || {});
    setIsModalOpen(true);
  };

  return (
    <ClientSubpageShell
      title="Mon calepin"
      description="Capturez vos dimensions, vos idées et vos notes de chantier dans un espace rapide, tactile et beaucoup plus agréable à consulter partout."
      activeNav="calepin"
      eyebrow="Mémoire chantier"
      mobilePrimaryAction={
        <button
          type="button"
          onClick={() => openNote()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
        >
          <Plus size={16} />
          Note
        </button>
      }
      actions={
        <button
          type="button"
          onClick={() => openNote()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand"
        >
          <Plus size={16} />
          Nouvelle note
        </button>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="Notes"
            value={String(noteList.length)}
            detail="Toutes vos annotations enregistrées"
            tone="violet"
          />
          <ClientHeroStat
            label="Structurées"
            value={String(titledNotes)}
            detail="Avec un vrai titre exploitable"
            tone="emerald"
          />
          <ClientHeroStat
            label="Dernière activité"
            value={recentDate === "Aucune activité" ? "0" : "1"}
            detail={recentDate}
            tone="amber"
          />
          <ClientHeroStat
            label="Mode"
            value="Terrain"
            detail="Pensé pour les prises de note rapides"
            tone="slate"
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Bloc-notes chantier"
          description="Un aperçu court, puis les notes une par une pour rester lisible sur téléphone."
          badge={`${noteList.length} note${noteList.length > 1 ? "s" : ""}`}
          items={[
            {
              label: "Notes",
              value: String(noteList.length),
              detail: "Toutes enregistrées",
              tone: "violet",
            },
            {
              label: "Titrées",
              value: String(titledNotes),
              detail: "Plus simples à retrouver",
              tone: "emerald",
            },
            {
              label: "Dernière",
              value: recentDate === "Aucune activité" ? "Vide" : "Récente",
              detail: recentDate,
              tone: "amber",
            },
            {
              label: "Usage",
              value: "Terrain",
              detail: "Rapide et tactile",
              tone: "slate",
            },
          ]}
        />
      }
    >
      <ClientSectionCard>
        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/8 dark:text-rose-200">
            Erreur lors du chargement des notes.
          </div>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="relative h-56 overflow-hidden rounded-[1.75rem] border border-slate-200/60 bg-slate-100/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent dark:border-white/8 dark:bg-white/4 dark:before:via-white/5"
              />
            ))}
          </div>
        ) : noteList.length === 0 ? (
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-50/80 px-6 py-16 text-center dark:border-white/8 dark:bg-white/4">
            <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white shadow-xl dark:bg-slate-900">
                <StickyNote className="h-10 w-10 text-brand-fuchsia" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Calepin vide</h3>
              <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500 dark:text-slate-400">
                Commencez à noter vos dimensions, idées et croquis de chantiers pour ne rien perdre en route.
              </p>
              <button
                type="button"
                onClick={() => openNote()}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] dark:bg-white dark:text-slate-950"
              >
                <Plus size={16} />
                Créer une note
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {noteList.map((note) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={note.id}
                onClick={() => openNote(note)}
                className="group relative cursor-pointer overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/8 dark:bg-white/4"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-zolio opacity-0 transition group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                      {note.titre || "Sans titre"}
                    </h3>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                      {note.date}
                    </div>
                  </div>
                </div>

                <p className="mt-4 line-clamp-6 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {note.contenu}
                </p>

                <div className="mt-5 flex items-center gap-2 md:hidden">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openNote(note);
                    }}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-violet-400/20 dark:hover:text-white"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Ouvrir
                  </button>
                  <ClientMobileActionsMenu
                    buttonLabel={`Actions ${note.titre || "note"}`}
                    items={getMobileNoteActions(note)}
                    panelAlign="left"
                  />
                </div>

                <div className="mt-5 hidden flex-col gap-2 md:flex md:flex-row">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openNote(note);
                    }}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-violet-400/20 dark:hover:text-white"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Ouvrir
                  </button>
                  <button
                    type="button"
                    onClick={(event) => requestDelete(note, event)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/8 dark:text-rose-200 dark:hover:bg-rose-500/14"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ClientSectionCard>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 dark:border-white/8 dark:bg-slate-900">
                <input
                  type="text"
                  placeholder="Titre de la note..."
                  value={currentNote.titre || ""}
                  onChange={(e) => setCurrentNote({ ...currentNote, titre: e.target.value })}
                  className="w-full bg-transparent text-2xl font-semibold text-slate-950 outline-none placeholder:text-slate-300 dark:text-white dark:placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto bg-slate-50/70 px-6 py-6 dark:bg-slate-950/40">
                <textarea
                  placeholder="Écrivez vos notes de chantier, dimensions, idées..."
                  value={currentNote.contenu || ""}
                  onChange={(e) => setCurrentNote({ ...currentNote, contenu: e.target.value })}
                  className="h-72 w-full resize-none bg-transparent text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-600"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-4 dark:border-white/8 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {currentNote.id ? (
                    <button
                      type="button"
                      onClick={() => requestDelete(currentNote as Note)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/8 dark:text-rose-200 dark:hover:bg-rose-500/14"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Nouvelle note non enregistrée
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || (!currentNote.titre && !currentNote.contenu)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-zolio px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {noteToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/12 dark:text-rose-200">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500 dark:text-rose-300">
                    Confirmation
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                    Supprimer la note ?
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Cette action efface définitivement{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {deleteLabel}
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setNoteToDelete(null)}
                  disabled={isDeleting}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:bg-white/8"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ClientSubpageShell>
  );
}
