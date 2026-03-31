import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function DevisNotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/15">
          <FileText size={28} className="text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Devis introuvable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Ce devis n&apos;existe pas ou a été supprimé.
        </p>
        <Link
          href="/devis"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          <ArrowLeft size={16} />
          Retour aux devis
        </Link>
      </div>
    </div>
  );
}
