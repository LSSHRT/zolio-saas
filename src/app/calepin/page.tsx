"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, StickyNote, Trash2, X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Note {
  id: string;
  titre: string;
  contenu: string;
  date: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CalepinPage() {
  const { data: notes, error, isLoading, mutate } = useSWR<Note[]>("/api/notes", fetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({});
  const [isSaving, setIsSaving] = useState(false);

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
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette note ?")) return;
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      mutate();
    } catch (err) {
      console.error(err);
    }
  };

  const openNote = (note?: Note) => {
    setCurrentNote(note || {});
    setIsModalOpen(true);
  };

  if (error) return <div className="p-4 text-red-500">Erreur lors du chargement des notes.</div>;

  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full p-4 md:p-6 pb-24 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/" className="text-sm text-violet-600 dark:text-violet-400 mb-1 inline-block hover:underline">
            &larr; Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-violet-600" />
            Mon Calepin
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Prenez vos cotes et notes de chantier ici.</p>
        </div>
        <button
          onClick={() => openNote()}
          className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : notes?.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <StickyNote className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Aucune note</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Commencez par noter vos mesures ou vos idées de chantiers.</p>
          <button onClick={() => openNote()} className="bg-violet-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-violet-700 transition">
            Nouvelle note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes?.map((note) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={note.id}
              onClick={() => openNote(note)}
              className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all border border-yellow-100 dark:border-yellow-800/30 group relative"
            >
              <button
                onClick={(e) => handleDelete(note.id, e)}
                className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <h3 className="font-semibold text-slate-800 dark:text-yellow-100 mb-2 truncate pr-6">{note.titre || "Sans titre"}</h3>
              <p className="text-sm text-slate-600 dark:text-yellow-200/70 whitespace-pre-wrap line-clamp-5">{note.contenu}</p>
              <div className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Modifié le {note.date}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal d'édition */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/20">
                <input
                  type="text"
                  placeholder="Titre de la note..."
                  value={currentNote.titre || ""}
                  onChange={(e) => setCurrentNote({ ...currentNote, titre: e.target.value })}
                  className="bg-transparent text-lg font-bold text-slate-800 dark:text-yellow-100 outline-none w-full placeholder:text-slate-400 dark:placeholder:text-yellow-700/50"
                />
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex-grow overflow-y-auto bg-yellow-50/50 dark:bg-yellow-900/10">
                <textarea
                  placeholder="Écrivez vos notes de chantier, dimensions, idées..."
                  value={currentNote.contenu || ""}
                  onChange={(e) => setCurrentNote({ ...currentNote, contenu: e.target.value })}
                  className="w-full h-64 bg-transparent outline-none resize-none text-slate-700 dark:text-yellow-50 leading-relaxed placeholder:text-slate-300 dark:placeholder:text-yellow-700/30"
                  autoFocus
                />
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving || (!currentNote.titre && !currentNote.contenu)}
                  className="flex items-center gap-2 bg-violet-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-violet-700 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
