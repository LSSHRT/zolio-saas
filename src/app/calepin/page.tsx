"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, ChevronLeft, ChevronRight, Loader2, Plus, Save, StickyNote, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  ClientHeroStat,
  ClientMobileActionsMenu,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMobileAction,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";

interface Note {
  id: string;
  titre: string;
  contenu: string;
  date: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface NotesResponse {
  data: Note[];
  pagination: PaginationInfo;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CalepinPage() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, mutate } = useSWR<NotesResponse>(`/api/notes?page=${page}&limit=20`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditing = Boolean(currentNote.id);
  const noteDraftLength = (currentNote.contenu || "").trim().length;
  const notePreview = (currentNote.contenu || "").trim();

  const noteList = useMemo<Note[]>(() => (Array.isArray(data?.data) ? data.data : []), [data]);
  const pagination = data?.pagination ?? null;
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
      logError("calepin-save", err);
      toast.error("Impossible d'enregistrer la note.");
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
      logError("calepin-delete", err);
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
      <ClientSectionCard className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
          <div className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-500 dark:text-violet-300">
                  Accès rapide
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  Prenez une note en quelques secondes
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Ouvrez l&apos;éditeur, saisissez vos dimensions ou une idée de chantier, puis retrouvez-la tout de suite dans la liste.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openNote()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand"
              >
                <Plus size={16} />
                Nouvelle note
              </button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-4 dark:border-white/8 dark:bg-white/4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Lecture mobile
                </p>
                <h3 className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
                  Pensé pour le portrait
                </h3>
              </div>
              <div className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
                Terrain
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-3 dark:border-white/8 dark:bg-white/6">
                Ouvrez une note sans perdre la liste.
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-3 dark:border-white/8 dark:bg-white/6">
                Gardez le contenu principal lisible même sur écran étroit.
              </div>
            </div>
          </div>
        </div>

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
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[1.6rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  Liste active
                </p>
                <h3 className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
                  {noteList.length} note{noteList.length > 1 ? "s" : ""} prêtes à relire
                </h3>
              </div>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400 sm:max-w-xs sm:text-right">
                Touchez une carte pour ouvrir le détail, puis modifiez ou supprimez sans quitter votre lecture verticale.
              </p>
            </div>

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
                        <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
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
          </div>
        )}
      </ClientSectionCard>

      <MobileDialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (!isSaving) {
            setCurrentNote((note) => ({ ...note }));
          }
        }}
        title={isEditing ? (currentNote.titre?.trim() || "Modifier la note") : "Nouvelle note"}
        description={
          isEditing
            ? "Ajustez le titre ou le contenu sans perdre le confort de lecture sur mobile vertical."
            : "Capturez vos mesures, idées ou consignes de chantier dans une surface compacte et facile à remplir au pouce."
        }
        actions={
          <>
            {isEditing ? (
              <button
                type="button"
                onClick={() => requestDelete(currentNote as Note)}
                disabled={isSaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-400/20 dark:bg-rose-500/8 dark:text-rose-200 dark:hover:bg-rose-500/14"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:bg-white/8"
              >
                Annuler
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || (!currentNote.titre && !currentNote.contenu)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:shadow-lg disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Enregistrer"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              Titre
            </span>
            <input
              type="text"
              placeholder="Titre de la note..."
              value={currentNote.titre || ""}
              onChange={(e) => setCurrentNote({ ...currentNote, titre: e.target.value })}
              className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-slate-600"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-white/8 dark:bg-white/4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                Longueur
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{noteDraftLength} caractères</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-white/8 dark:bg-white/4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                Aperçu
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {notePreview ? `${notePreview.slice(0, 72)}${notePreview.length > 72 ? "..." : ""}` : "Ajoutez un contenu pour préparer votre prochaine visite."}
              </p>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              Contenu
            </span>
            <textarea
              placeholder="Écrivez vos notes de chantier, dimensions, idées..."
              value={currentNote.contenu || ""}
              onChange={(e) => setCurrentNote({ ...currentNote, contenu: e.target.value })}
              className="min-h-[18rem] w-full resize-none rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4 text-base leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:placeholder:text-slate-600"
              autoFocus
            />
          </label>
        </div>
      </MobileDialog>

      <MobileDialog
        open={Boolean(noteToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setNoteToDelete(null);
          }
        }}
        title="Supprimer la note ?"
        description={`Cette action efface définitivement ${deleteLabel}.`}
        tone="danger"
        actions={
          <>
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
          </>
        }
      >
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-4 text-sm leading-6 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/8 dark:text-rose-100">
          Supprimez uniquement les notes qui ne servent plus. Le contenu ne pourra pas être restauré après validation.
        </div>
      </MobileDialog>
    </ClientSubpageShell>
  );
}
