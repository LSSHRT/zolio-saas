"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, StickyNote, Trash2, X, Save, ArrowLeft } from "lucide-react";
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
  const { data: notes, error, isLoading, mutate } = useSWR<Note[]>("/api/notes", fetcher, { revalidateOnFocus: false, keepPreviousData: true });
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
    <div className="flex flex-col min-h-screen pb-24 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent blur-3xl -z-10 pointer-events-none"></div>
      
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#0c0a1d]/80 border-b border-violet-100/50 dark:border-violet-500/10 transition-all flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-violet-600" />
          Mon Calepin
        </h1>
        <div className="flex-1" />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => openNote()}
          className="w-10 h-10 bg-gradient-zolio text-white rounded-full flex items-center justify-center shadow-brand"
        >
          <Plus size={20} />
        </motion.button>
      </header>

      <main className="flex-1 px-6 flex flex-col gap-6 pt-6">

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-[1.5rem] border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent"></div>
          ))}
        </div>
      ) : notes?.length === 0 ? (
        <div className="text-center py-24 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-[2rem] border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-50 dark:bg-violet-500/100/10 dark:bg-violet-50 dark:bg-violet-500/100/20 blur-3xl rounded-full"></div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="relative z-10 flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-6 -rotate-6">
              <StickyNote className="w-10 h-10 text-brand-fuchsia" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-mono">Calepin vide</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">Commencez à noter vos dimensions, idées et croquis de chantiers pour ne rien oublier.</p>
            <button onClick={() => openNote()} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg">
              Créer une note
            </button>
          </motion.div>
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
              className="bg-white dark:bg-slate-800 p-6 rounded-[1.5rem] shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 border border-slate-100 dark:border-slate-700 hover:-translate-y-1 group relative overflow-hidden"
            >
              <button
                onClick={(e) => handleDelete(note.id, e)}
                className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-zolio opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3 truncate pr-6 font-mono">{note.titre || "Sans titre"}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-5 leading-relaxed">{note.contenu}</p>
              <div className="mt-5 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium bg-slate-50 dark:bg-slate-900/50 w-fit px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-violet-50 dark:bg-violet-500/100/50 animate-pulse"></span>
                {note.date}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      </main>

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
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                <input
                  type="text"
                  placeholder="Titre de la note..."
                  value={currentNote.titre || ""}
                  onChange={(e) => setCurrentNote({ ...currentNote, titre: e.target.value })}
                  className="bg-transparent text-2xl font-bold text-slate-900 dark:text-white outline-none w-full placeholder:text-slate-300 dark:placeholder:text-slate-600 font-mono"
                />
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex-grow overflow-y-auto bg-slate-50/50 dark:bg-slate-800/30">
                <textarea
                  placeholder="Écrivez vos notes de chantier, dimensions, idées..."
                  value={currentNote.contenu || ""}
                  onChange={(e) => setCurrentNote({ ...currentNote, contenu: e.target.value })}
                  className="w-full h-72 bg-transparent outline-none resize-none text-slate-700 dark:text-slate-200 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  autoFocus
                />
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving || (!currentNote.titre && !currentNote.contenu)}
                  className="flex items-center gap-2 bg-gradient-zolio text-white px-6 py-3 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
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
