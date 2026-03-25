"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, XCircle, SkipForward, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ResultItem = {
  email: string;
  reason?: string;
};

type ApiResponse = {
  sent: string[];
  skipped: ResultItem[];
  failed: ResultItem[];
  summary: string;
};

export default function ProspectPage() {
  const { user, isLoaded } = useUser();
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleSend = async () => {
    const emailList = emails
      .split(/[\n,;]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    if (emailList.length === 0) {
      toast.error("Entre au moins un email");
      return;
    }

    if (emailList.length > 50) {
      toast.error("Maximum 50 emails par envoi");
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/prospect/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailList }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setResult(data);
      toast.success(data.summary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setSending(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#faf5ff] dark:bg-[#0c0a1d] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-violet-600 hover:text-violet-700 mb-6"
        >
          <ArrowLeft size={16} className="mr-2" /> Retour au cockpit
        </Link>

        <div className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-white/10">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Prospection manuelle
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Entre les emails des artisans que tu veux contacter. Sépare-les par une virgule, un point-virgule ou un retour à la ligne.
          </p>

          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={`exemple@artisan1.fr\nexemple@artisan2.fr\nexemple@artisan3.fr`}
            rows={8}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 resize-none font-mono"
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {emails.split(/[\n,;]/).filter((e) => e.trim()).length} email(s) détecté(s)
            </span>

            <button
              onClick={handleSend}
              disabled={sending || emails.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={16} /> Envoyer les emails
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="mt-6 space-y-3">
              {result.sent.length > 0 && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold mb-2">
                    <CheckCircle size={16} /> Envoyés ({result.sent.length})
                  </div>
                  <ul className="text-sm text-emerald-600 dark:text-emerald-400 space-y-1">
                    {result.sent.map((email) => (
                      <li key={email}>• {email}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.skipped.length > 0 && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-4">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold mb-2">
                    <SkipForward size={16} /> Ignorés ({result.skipped.length})
                  </div>
                  <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                    {result.skipped.map((item) => (
                      <li key={item.email}>• {item.email} — {item.reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.failed.length > 0 && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 p-4">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold mb-2">
                    <XCircle size={16} /> Échecs ({result.failed.length})
                  </div>
                  <ul className="text-sm text-rose-600 dark:text-rose-400 space-y-1">
                    {result.failed.map((item) => (
                      <li key={item.email}>• {item.email} — {item.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
