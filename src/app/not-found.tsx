import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, Receipt, Search, Users, LayoutDashboard } from "lucide-react";

const QUICK_LINKS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/devis", icon: FileText, label: "Mes devis" },
  { href: "/factures", icon: Receipt, label: "Mes factures" },
  { href: "/clients", icon: Users, label: "Mes clients" },
];

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-12 text-slate-950 dark:text-white">
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-[#0c0a1d] dark:to-violet-950/30" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.18),rgba(251,146,60,0.08),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.25),rgba(251,146,60,0.1),transparent_60%)]" />

      <div className="relative mx-auto w-full max-w-xl">
        {/* Branding */}
        <Link
          href="/"
          className="mx-auto mb-10 flex w-fit items-center gap-3 transition hover:opacity-80"
          aria-label="Retour à l'accueil Zolio"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-white/50 dark:bg-white/8 dark:ring-white/10">
            <Image src="/logo.png" alt="Zolio" width={28} height={28} className="h-7 w-auto object-contain" priority />
          </div>
          <span className="text-sm font-semibold tracking-[0.22em] text-violet-600 dark:text-violet-200">ZOLIO</span>
        </Link>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-[0_28px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:p-12">
          <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 ring-4 ring-violet-50 dark:bg-violet-500/15 dark:ring-violet-500/5">
            <Search size={36} className="text-violet-600 dark:text-violet-300" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-600 dark:text-violet-300">
            Erreur 404
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Page introuvable
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
            Cette page n&apos;existe pas ou a été déplacée. Vous pouvez rejoindre directement une section ci-dessous.
          </p>

          {/* Quick links */}
          <div className="mt-8 grid grid-cols-2 gap-2.5">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700 hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-violet-400/30 dark:hover:text-white"
                >
                  <Icon size={16} className="shrink-0 text-violet-500 transition group-hover:scale-110 dark:text-violet-300" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 sm:w-auto"
            >
              <ArrowLeft size={16} />
              Retour au tableau de bord
            </Link>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-violet-400/20 sm:w-auto"
            >
              Contacter le support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
