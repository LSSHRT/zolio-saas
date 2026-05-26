"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, ScanLine, CheckCircle2, AlertCircle } from "lucide-react";
import type { ParsedReceipt } from "@/lib/receipt-parser";

type Props = {
  onParsed: (parsed: ParsedReceipt) => void;
  className?: string;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; parsed: ParsedReceipt };

const ACCEPTED = "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif";

function summary(parsed: ParsedReceipt): string {
  const parts: string[] = [];
  if (parsed.fournisseur) parts.push(parsed.fournisseur.value);
  if (parsed.montantTTC) parts.push(`${parsed.montantTTC.value.toFixed(2)} € TTC`);
  if (parsed.date) parts.push(parsed.date.value);
  return parts.length > 0 ? parts.join(" · ") : "Champs préremplis";
}

export default function ReceiptScanner({ onParsed, className = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ status: "idle" });

  const handleFile = async (file: File) => {
    setState({ status: "loading" });
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/ocr/receipt", {
        method: "POST",
        body,
      });
      const payload = (await response
        .json()
        .catch(() => ({ error: "Réponse OCR invalide" }))) as {
        parsed?: ParsedReceipt;
        error?: string;
      };

      if (!response.ok || !payload.parsed) {
        setState({
          status: "error",
          message: payload.error || `OCR indisponible (${response.status})`,
        });
        return;
      }

      setState({ status: "ok", parsed: payload.parsed });
      onParsed(payload.parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "OCR impossible";
      setState({ status: "error", message });
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    void handleFile(file);
  };

  const trigger = () => inputRef.current?.click();
  const loading = state.status === "loading";

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        capture="environment"
        onChange={onChange}
        className="sr-only"
        aria-label="Importer un ticket de caisse"
      />

      <button
        type="button"
        onClick={trigger}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-300 bg-violet-50/60 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-400 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/15"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Camera size={16} aria-hidden />
        )}
        {loading ? "Lecture du ticket…" : "Scanner un ticket"}
      </button>

      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <ScanLine size={11} className="mr-1 inline" aria-hidden />
        Prends en photo le ticket : on remplit fournisseur, date et montant TTC à ta place.
      </p>

      {state.status === "error" && (
        <div
          role="alert"
          className="mt-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "ok" && (
        <div
          role="status"
          className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>Ticket lu — {summary(state.parsed)}. Vérifie et corrige si besoin.</span>
        </div>
      )}
    </div>
  );
}
