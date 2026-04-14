import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, Wrench } from "lucide-react";
import { getAdminRuntimeState } from "@/lib/admin-settings";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const runtimeState = await getAdminRuntimeState();

  if (!runtimeState.maintenanceEnabled) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_26%),linear-gradient(180deg,#050816_0%,#020617_100%)] px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-8 text-center shadow-[0_30px_120px_-40px_rgba(0,0,0,0.75)] sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-200 ring-1 ring-amber-300/20">
            <Wrench className="h-10 w-10" />
          </div>
          <p className="mt-6 text-[11px] uppercase tracking-[0.34em] text-slate-500">Zolio maintenance</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            La plateforme est temporairement indisponible.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            {runtimeState.maintenanceMessage.trim() ||
              "Nous appliquons une mise à jour importante. Merci de revenir dans quelques minutes."}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Revenir à l’accueil
            </Link>
            <Link
              href="/sign-in?redirect_url=/admin"
              className="rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Accès administrateur
            </Link>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs text-slate-300">
            <ShieldAlert className="h-3.5 w-3.5 text-violet-200" />
            Les administrateurs gardent l’accès au cockpit.
          </div>
        </section>
      </div>
    </main>
  );
}
