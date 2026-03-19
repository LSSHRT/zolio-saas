"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Ban,
  CalendarDays,
  CreditCard,
  Crown,
  Mail,
  Shield,
  Sparkles,
  UserRoundX,
  X,
} from "lucide-react";
import type { AdminUserRow } from "../types";

function formatDateTime(value: string | null) {
  if (!value) return "Indisponible";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type AdminUserDrawerProps = {
  onClose: () => void;
  onDelete: () => void;
  onGrantAdmin: () => void;
  onToggleBan: () => void;
  onTogglePro: () => void;
  open: boolean;
  pending: boolean;
  user: AdminUserRow | null;
};

export function AdminUserDrawer({
  onClose,
  onDelete,
  onGrantAdmin,
  onToggleBan,
  onTogglePro,
  open,
  pending,
  user,
}: AdminUserDrawerProps) {
  return (
    <AnimatePresence>
      {open && user && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] border-l border-white/10 bg-slate-950/88 p-5 backdrop-blur-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {user.imageUrl ? (
                    <>
                      {/* External avatar URLs come from Clerk and are not optimized locally. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.imageUrl}
                        alt={user.name}
                        className="h-16 w-16 rounded-3xl object-cover ring-1 ring-white/10"
                      />
                    </>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-semibold text-white">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-white">{user.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{user.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="admin-chip bg-white/8 text-white/80 ring-white/10">
                        {user.isPro ? "PRO" : "Gratuit"}
                      </span>
                      <span className={`admin-chip ${user.banned ? "bg-red-500/12 text-red-200 ring-red-300/20" : "bg-emerald-500/12 text-emerald-200 ring-emerald-300/20"}`}>
                        {user.banned ? "Banni" : "Actif"}
                      </span>
                      {user.publicMetadata.isAdmin && (
                        <span className="admin-chip bg-violet-500/14 text-violet-100 ring-violet-300/20">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="admin-panel rounded-[24px] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Inscription</p>
                  <p className="mt-3 text-sm font-medium text-white">{formatDateTime(user.createdAt)}</p>
                </div>
                <div className="admin-panel rounded-[24px] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Dernière connexion</p>
                  <p className="mt-3 text-sm font-medium text-white">{formatDateTime(user.lastSignInAt)}</p>
                </div>
                <div className="admin-panel rounded-[24px] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Devis IA</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{user.aiGenerations}</p>
                </div>
                <div className="admin-panel rounded-[24px] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Code parrain</p>
                  <p className="mt-3 text-sm font-medium text-white">
                    {user.publicMetadata.parrainCode || "Aucun"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 overflow-y-auto pr-1">
                <section className="admin-panel rounded-[28px] p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-fuchsia-300" />
                    <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
                      Identité & accès
                    </h4>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm text-slate-300">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 text-slate-500" />
                      <div>
                        <dt className="text-slate-500">Adresse email</dt>
                        <dd className="mt-1 text-white">{user.email}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarDays className="mt-0.5 h-4 w-4 text-slate-500" />
                      <div>
                        <dt className="text-slate-500">Identifiant</dt>
                        <dd className="mt-1 font-mono text-xs text-slate-200">{user.id}</dd>
                      </div>
                    </div>
                  </dl>
                </section>

                <section className="admin-panel rounded-[28px] p-5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-300" />
                    <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
                      Actions
                    </h4>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={onTogglePro}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-sky-300" />
                        {user.isPro ? "Retirer le statut PRO" : "Accorder le statut PRO"}
                      </span>
                      <span className="text-xs text-slate-400">{user.isPro ? "Actif" : "Inactif"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={onGrantAdmin}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-3">
                        <Crown className="h-4 w-4 text-fuchsia-300" />
                        {user.publicMetadata.isAdmin ? "Retirer les droits admin" : "Promouvoir admin"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {user.publicMetadata.isAdmin ? "Admin" : "Standard"}
                      </span>
                    </button>
                  </div>
                </section>

                <section className="admin-panel rounded-[28px] p-5">
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-amber-200" />
                    <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
                      Modération
                    </h4>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={onToggleBan}
                      className="flex items-center justify-between rounded-2xl border border-amber-300/14 bg-amber-400/8 px-4 py-3 text-left text-sm text-amber-50 transition hover:bg-amber-400/12 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-3">
                        <Ban className="h-4 w-4 text-amber-200" />
                        {user.banned ? "Débannir le compte" : "Bannir le compte"}
                      </span>
                      <span className="text-xs text-amber-100/70">
                        {user.banned ? "Bloqué" : "Actif"}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={onDelete}
                      className="flex items-center justify-between rounded-2xl border border-red-300/14 bg-red-500/8 px-4 py-3 text-left text-sm text-red-100 transition hover:bg-red-500/12 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-3">
                        <UserRoundX className="h-4 w-4 text-red-200" />
                        Supprimer le compte
                      </span>
                      <span className="text-xs text-red-100/70">Irréversible</span>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
