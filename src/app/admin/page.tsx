import { currentUser } from "@clerk/nextjs/server";
import { ShieldAlert } from "lucide-react";
import AdminClient from "./AdminClient";
import { getAdminEmail, isAdminUser } from "@/lib/admin";
import { getAdminDashboardData } from "./dashboard-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await currentUser();
  const adminEmail = getAdminEmail();

  if (!isAdminUser(user)) {
    return (
      <div className="admin-cockpit min-h-screen px-4 py-10 font-sans">
        <div className="pointer-events-none absolute inset-0 admin-grid-overlay" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="admin-panel-strong w-full rounded-2xl p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/12 text-rose-300 ring-1 ring-rose-400/20">
              <ShieldAlert size={32} />
            </div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Administration</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Accès refusé</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-400">
              Ce cockpit n’est accessible qu’aux administrateurs Zolio. La route est bien protégée côté
              serveur.
            </p>
            {!adminEmail && (
              <div className="mt-6 rounded-2xl border border-amber-300/18 bg-amber-400/8 p-4 text-left text-sm text-amber-100">
                <strong>Configuration manquante :</strong> ajoute <code>ADMIN_EMAIL=votre@email.com</code>
                dans Vercel pour aligner l’identité admin canonique.
              </div>
            )}
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
