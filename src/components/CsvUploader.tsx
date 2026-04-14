"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CsvUploaderProps {
  onImport: () => void;
}

export function CsvUploader({ onImport }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Veuillez sélectionner un fichier CSV.");
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/clients/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(result.error || "Erreur lors de l\'importation.");
        return;
      }

      const { imported = 0, errors = [] } = result;

      if (imported > 0) {
        onImport();
        toast.success(`${imported} client${imported > 1 ? "s" : ""} importé${imported > 1 ? "s" : ""}.`);
      }

      if (errors.length > 0) {
        toast.warning(`${errors.length} ligne${errors.length > 1 ? "s" : ""} ignorée${errors.length > 1 ? "s" : ""}.`);
      }
    } catch {
      toast.error("Erreur lors de la lecture du fichier.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onImport]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all ${
          isDragging
            ? "border-violet-400 bg-violet-500/10 scale-[1.02]"
            : "border-slate-200/80 bg-white/50 hover:border-violet-300 hover:bg-violet-500/5 dark:border-white/10 dark:hover:border-violet-500/30"
        } ${isImporting ? "pointer-events-none opacity-60" : ""}`}
      >
        {isImporting ? (
          <>
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Import en cours…</p>
          </>
        ) : (
          <>
            <Upload className="mb-3 h-8 w-8 text-slate-400 dark:text-slate-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Glissez un fichier CSV ici
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              ou cliquez pour parcourir
            </p>
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" />
              Colonnes attendues : <strong>Nom</strong>, Email, Téléphone, Adresse
            </p>
          </>
        )}
      </div>

      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
