"use client";

import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/dashboard" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/8 dark:hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-lg font-semibold text-slate-950 dark:text-white">Contact</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 dark:border-white/8 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Besoin d&apos;aide ?</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Pour toute question ou demande d&apos;assistance, n&apos;hésitez pas à nous contacter.
          </p>
          <a
            href="mailto:support@zolio.fr"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            support@zolio.fr
          </a>
        </div>
      </div>
    </div>
  );
}
