import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/15">
          <Search size={36} className="text-violet-600 dark:text-violet-400" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-600 dark:text-violet-400">
          Erreur 404
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Page introuvable
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Désolé, nous n&apos;avons pas pu trouver la page que vous recherchez. Elle a peut-être été déplacée ou supprimée.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-violet-400/20"
          >
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  );
}
