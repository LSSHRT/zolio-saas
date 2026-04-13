"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
} from "lucide-react";
import {
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMobileAction,
} from "@/components/client-shell";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type DevisApi = {
  numero: string;
  date: string;
  statut: string;
  totalTTC: string;
  nomClient: string;
  emailClient: string;
};

type FactureApi = {
  numero: string;
  date: string;
  statut: string;
  totalTTC: number;
  nomClient: string;
  emailClient: string;
};

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: client } = useSWR(`/api/clients/${id}`, fetcher);
  const { data: devisData } = useSWR<{ data?: DevisApi[] }>("/api/devis", fetcher);
  const { data: facturesData } = useSWR<{ data?: FactureApi[] }>("/api/factures", fetcher);

  const historiques = useMemo(() => {
    if (!client) return [];
    const items: { type: "devis" | "facture"; id: string; date: string; totalTTC: number; statut: string }[] = [];

    if (devisData?.data) {
      devisData.data
        .filter((d) => d.nomClient === client.nom || d.emailClient === client.email)
        .forEach((d) =>
          items.push({
            type: "devis",
            id: d.numero,
            date: d.date,
            totalTTC: typeof d.totalTTC === "string" ? parseFloat(d.totalTTC) : d.totalTTC,
            statut: d.statut,
          }),
        );
    }

    if (facturesData?.data) {
      facturesData.data
        .filter((f) => f.nomClient === client.nom || f.emailClient === client.email)
        .forEach((f) =>
          items.push({
            type: "facture",
            id: f.numero,
            date: f.date,
            totalTTC: f.totalTTC,
            statut: f.statut,
          }),
        );
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [client, devisData, facturesData]);

  const stats = useMemo(() => {
    const devis = historiques.filter((h) => h.type === "devis");
    const factures = historiques.filter((h) => h.type === "facture");
    const totalDevis = devis.reduce((s, d) => s + d.totalTTC, 0);
    const totalFactures = factures.reduce((s, f) => s + f.totalTTC, 0);
    const accepted = devis.filter((d) => d.statut === "Accepté" || d.statut === "Signé");
    return { nbDevis: devis.length, nbFactures: factures.length, totalDevis, totalFactures, acceptedCount: accepted.length };
  }, [historiques]);

  const mobileActions: ClientMobileAction[] = [
    {
      label: "Retour",
      icon: ArrowLeft,
      href: "/clients",
    },
    client?.email
      ? {
          label: "Envoyer un email",
          icon: Mail,
          onClick: () => (window.location.href = `mailto:${client.email}`),
          tone: "accent" as const,
        }
      : undefined,
    client?.telephone
      ? {
          label: "Appeler",
          icon: Phone,
          onClick: () => (window.location.href = `tel:${client.telephone}`),
        }
      : undefined,
  ].filter(Boolean) as ClientMobileAction[];

  const fc = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
      </div>
    );
  }

  return (
    <ClientSubpageShell
      title={client.nom}
      description={`Fiche client · Créé le ${client.dateAjout}`}
      eyebrow="Client"
      activeNav="clients"
      mobileSecondaryActions={mobileActions}
      mobilePrimaryAction={
        <Link
          href="/clients"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <ArrowLeft size={16} /> Retour
        </Link>
      }
    >
      {/* Contact */}
      <ClientSectionCard>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-zolio text-white text-xl font-bold">
            {client.nom.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">{client.nom}</p>
            {client.email && (
              <p className="truncate text-sm text-violet-600 dark:text-violet-400">{client.email}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
            >
              <Mail size={12} />
              Email
            </a>
          )}
          {client.telephone && (
            <a
              href={`tel:${client.telephone}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
            >
              <Phone size={12} />
              {client.telephone}
            </a>
          )}
          {client.adresse && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <MapPin size={12} />
              {client.adresse}
            </span>
          )}
        </div>
      </ClientSectionCard>

      {/* Stats */}
      <ClientSectionCard>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">Devis</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.nbDevis}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">Factures</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.nbFactures}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total facturé</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{fc(stats.totalFactures)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">Acceptés</p>
            <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{stats.acceptedCount}</p>
          </div>
        </div>
      </ClientSectionCard>

      {/* Historique */}
      <ClientSectionCard>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-violet-600 dark:text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white">Historique</h2>
        </div>

        {historiques.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-white/10">
            <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Aucun devis ou facture pour ce client.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {historiques.map((item, i) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={item.type === "devis" ? `/devis/${item.id}` : `/factures/${item.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-violet-200 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        item.type === "facture"
                          ? "bg-emerald-50 dark:bg-emerald-500/10"
                          : "bg-violet-50 dark:bg-violet-500/10"
                      }`}
                    >
                      <FileText
                        size={16}
                        className={item.type === "facture" ? "text-emerald-600 dark:text-emerald-400" : "text-violet-600 dark:text-violet-400"}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.type === "facture" ? "Facture" : "Devis"} #{item.id}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{fc(item.totalTTC)}</p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        item.statut === "Accepté" || item.statut === "Signé" || item.statut === "Payée"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : item.statut === "Refusé" || item.statut === "Annulée" || item.statut === "En retard"
                          ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                      }`}
                    >
                      {item.statut}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </ClientSectionCard>
    </ClientSubpageShell>
  );
}
