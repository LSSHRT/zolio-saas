import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { ArrowLeft, LifeBuoy, ShieldAlert } from "lucide-react";
import AdminClient from "./AdminClient";
import { getAdminEmail, isAdminUser } from "@/lib/admin";
import { getAdminDashboardData } from "./dashboard-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await currentUser();
  const adminEmail = getAdminEmail();

  if (!isAdminUser(user)) {
    return (
      <div className="admin-cockpit relative min-h-screen px-4 py-10 font-sans">
        <div className="pointer-events-none absolute inset-0 admin-grid-overlay" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="admin-panel-strong w-full rounded-3xl p-8 text-center sm:p-10">
            {/* Branding */}
            <Link
              href="/"
              className="mx-auto mb-8 flex w-fit items-center gap-3 transition hover:opacity-80"
              aria-label="Retour à l'accueil Zolio"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10">
                <Image src="/logo.png" alt="Zolio" width={28} height={28} className="h-7 w-auto object-contain" />
              </div>
              <span className="text-sm font-semibold tracking-[0.22em] text-violet-200">ZOLIO</span>
            </Link>

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/12 text-rose-300 ring-1 ring-rose-400/20">
              <ShieldAlert size={36} />
            </div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Administration</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Accès refusé
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-400">
              Ce cockpit n&apos;est accessible qu&apos;aux administrateurs Zolio. Si vous pensez qu&apos;il
              s&apos;agit d&apos;une erreur, contactez le support.
            </p>

            {!adminEmail && (
              <div className="mt-6 rounded-2xl border border-amber-300/18 bg-amber-400/8 p-4 text-left text-sm text-amber-100">
                <p className="font-semibold">Configuration manquante</p>
                <p className="mt-1 text-amber-100/80">
                  Ajoutez <code className="rounded bg-amber-400/15 px-1.5 py-0.5 font-mono text-[12px]">ADMIN_EMAIL=votre@email.com</code> dans
                  Vercel pour aligner l&apos;identité admin canonique.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90"
              >
                <ArrowLeft size={16} />
                Retour au tableau de bord
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-violet-400/30 hover:text-white"
              >
                <LifeBuoy size={16} />
                Contacter le support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dashboardData = await getAdminDashboardData(user);

  return (
    <div className="selection:bg-fuchsia-300/30 selection:text-white">
      <AdminClient data={dashboardData} />
    </div>
  );
}
