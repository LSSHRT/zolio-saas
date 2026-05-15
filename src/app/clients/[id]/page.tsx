"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Euro,
  FileText,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMetaPill,
  type ClientMobileAction,
} from "@/components/client-shell";
import { EmptyState } from "@/components/empty-state";
import { DataTable, MetricTile } from "@/components/desktop";
import { CheckCircle, Plus, Receipt } from "lucide-react";

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
      <ClientSubpageShell
        title="Chargement…"
        description="Récupération de la fiche client"
        eyebrow="Client"
        activeNav="clients"
        backHref="/clients"
        breadcrumbs={[{ label: "Clients", href: "/clients" }, { label: "Chargement…" }]}
      >
        <ClientSectionCard>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/6" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-white/6" />
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-200/70 dark:bg-white/5" />
            </div>
          </div>
        </ClientSectionCard>
        <ClientSectionCard>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 text-center">
                <div className="mx-auto h-3 w-12 animate-pulse rounded-full bg-slate-200/70 dark:bg-white/5" />
                <div className="mx-auto h-6 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-white/6" />
              </div>
            ))}
          </div>
        </ClientSectionCard>
      </ClientSubpageShell>
    );
  }

  const lastInteraction = historiques[0];
  const focusLine = lastInteraction ? (
    <>
      <span className="font-semibold text-slate-800 dark:text-slate-100">
        {lastInteraction.type === "facture" ? "Dernière facture" : "Dernier devis"} #{lastInteraction.id}
      </span>
      {" "}· {lastInteraction.date} · {fc(lastInteraction.totalTTC)} · {lastInteraction.statut.toLowerCase()}
    </>
  ) : (
    <>Aucun devis ni facture pour ce client — créez votre premier document pour démarrer la relation.</>
  );

  const metaPills: ClientMetaPill[] = [
    { icon: FileText, label: `${stats.nbDevis} devis`, tone: "violet" },
    { icon: FileText, label: `${stats.nbFactures} facture${stats.nbFactures > 1 ? "s" : ""}`, tone: "emerald" },
    ...(stats.totalFactures > 0
      ? [{ icon: Euro, label: `${fc(stats.totalFactures)} facturé`, tone: "emerald" as const }]
      : []),
    ...(client.dateAjout
      ? [{ icon: Calendar, label: `Client depuis ${client.dateAjout}`, tone: "slate" as const }]
      : []),
  ];

  return (
    <ClientSubpageShell
      title={client.nom}
      description={`Fiche client · Créé le ${client.dateAjout}`}
      eyebrow="Fiche client"
      activeNav="clients"
      backHref="/clients"
      breadcrumbs={[{ label: "Clients", href: "/clients" }, { label: client.nom }]}
      metaPills={metaPills}
      focusLine={focusLine}
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
      {/* ─── Mobile / tablet view (≤ md) — strictly preserved ─── */}
      <div className="space-y-4 sm:space-y-6 lg:hidden">
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
          <EmptyState
            icon={Sparkles}
            tone="violet"
            size="sm"
            title="Aucun échange pour ce client"
            description="Créez son premier devis ou sa première facture pour démarrer la relation commerciale."
            actions={[
              { label: "Nouveau devis", href: "/nouveau-devis", variant: "primary", icon: FileText },
              { label: "Nouvelle facture", href: "/nouvelle-facture", variant: "secondary", icon: FileText },
            ]}
          />
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
      </div>

      {/* ─── Desktop view (lg+) — v2 detail layout ───────────────── */}
      <div className="hidden lg:block lg:space-y-6">
        {/* KPI strip */}
        <div className="grid gap-4 lg:grid-cols-4">
          <MetricTile
            label="Devis"
            value={String(stats.nbDevis)}
            detail={`${stats.acceptedCount} accepté${stats.acceptedCount > 1 ? "s" : ""}`}
            icon={FileText}
            tone="primary"
          />
          <MetricTile
            label="Factures"
            value={String(stats.nbFactures)}
            detail="Documents émis"
            icon={Receipt}
            tone="neutral"
          />
          <MetricTile
            label="Total facturé"
            value={fc(stats.totalFactures)}
            detail="Chiffre d'affaires"
            icon={Euro}
            tone="success"
          />
          <MetricTile
            label="Acceptés"
            value={String(stats.acceptedCount)}
            detail="Devis signés / acceptés"
            icon={CheckCircle}
            tone={stats.acceptedCount > 0 ? "success" : "neutral"}
          />
        </div>

        {/* 2-col body */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Col gauche : Contact + Historique */}
          <div className="flex flex-col gap-6">
            {/* Contact */}
            <section className="lg-v2-panel p-5">
              <h2 className="lg-v2-eyebrow mb-4">Contact</h2>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--v2-primary-soft)] text-xl font-bold text-[var(--v2-primary)]">
                  {client.nom.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold lg-v2-text-strong">{client.nom}</p>
                  {client.dateAjout ? (
                    <p className="mt-0.5 text-xs lg-v2-text-subtle">
                      Client depuis le {client.dateAjout}
                    </p>
                  ) : null}
                  <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {client.email ? (
                      <div>
                        <dt className="flex items-center gap-1.5 text-xs font-medium lg-v2-text-subtle">
                          <Mail size={11} aria-hidden /> Email
                        </dt>
                        <dd className="mt-1">
                          <a
                            href={`mailto:${client.email}`}
                            className="text-sm font-medium text-[var(--v2-primary)] transition hover:underline"
                          >
                            {client.email}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                    {client.telephone ? (
                      <div>
                        <dt className="flex items-center gap-1.5 text-xs font-medium lg-v2-text-subtle">
                          <Phone size={11} aria-hidden /> Téléphone
                        </dt>
                        <dd className="mt-1">
                          <a
                            href={`tel:${client.telephone}`}
                            className="text-sm font-medium lg-v2-text-strong transition hover:text-[var(--v2-primary)]"
                          >
                            {client.telephone}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                    {client.adresse ? (
                      <div className="sm:col-span-2">
                        <dt className="flex items-center gap-1.5 text-xs font-medium lg-v2-text-subtle">
                          <MapPin size={11} aria-hidden /> Adresse
                        </dt>
                        <dd className="mt-1 text-sm lg-v2-text-muted">{client.adresse}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
            </section>

            {/* Historique */}
            <section className="lg-v2-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="lg-v2-eyebrow flex items-center gap-1.5">
                  <TrendingUp size={12} aria-hidden /> Historique
                </h2>
                <span className="text-xs lg-v2-text-subtle">
                  {historiques.length} document{historiques.length > 1 ? "s" : ""}
                </span>
              </div>
              {historiques.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  tone="violet"
                  size="sm"
                  title="Aucun échange pour ce client"
                  description="Créez son premier devis ou sa première facture pour démarrer la relation."
                  actions={[
                    { label: "Nouveau devis", href: "/nouveau-devis", variant: "primary", icon: FileText },
                    { label: "Nouvelle facture", href: "/nouvelle-facture", variant: "secondary", icon: Receipt },
                  ]}
                />
              ) : (
                <DataTable
                  ariaLabel={`Historique des documents de ${client.nom}`}
                  data={historiques}
                  getRowKey={(h) => `${h.type}-${h.id}`}
                  rowHref={(h) => (h.type === "facture" ? `/factures/${h.id}` : `/devis/${h.id}`)}
                  defaultSortKey="date"
                  defaultSortDirection="desc"
                  pageSize={1000}
                  columns={[
                    {
                      key: "type",
                      header: "Type",
                      cell: (h) => (
                        <span
                          className={`lg-v2-pill ${h.type === "facture" ? "lg-v2-pill-success" : "lg-v2-pill-primary"}`}
                        >
                          <FileText size={11} aria-hidden />
                          {h.type === "facture" ? "Facture" : "Devis"}
                        </span>
                      ),
                      sortValue: (h) => h.type,
                      width: "120px",
                    },
                    {
                      key: "id",
                      header: "N°",
                      cell: (h) => (
                        <span className="font-mono text-sm font-medium lg-v2-text">{h.id}</span>
                      ),
                      sortValue: (h) => h.id,
                      width: "150px",
                    },
                    {
                      key: "date",
                      header: "Date",
                      cell: (h) => <span className="text-sm lg-v2-text-muted">{h.date}</span>,
                      sortValue: (h) => new Date(h.date).getTime(),
                      width: "120px",
                    },
                    {
                      key: "statut",
                      header: "Statut",
                      cell: (h) => {
                        const tone =
                          h.statut === "Accepté" || h.statut === "Signé" || h.statut === "Payée"
                            ? "lg-v2-pill-success"
                            : h.statut === "Refusé" || h.statut === "Annulée" || h.statut === "En retard"
                              ? "lg-v2-pill-danger"
                              : "lg-v2-pill-warning";
                        return <span className={`lg-v2-pill ${tone}`}>{h.statut}</span>;
                      },
                      sortValue: (h) => h.statut,
                      width: "120px",
                    },
                    {
                      key: "totalTTC",
                      header: "Total TTC",
                      cell: (h) => (
                        <span className="text-sm font-semibold tabular-nums lg-v2-text-strong">
                          {fc(h.totalTTC)}
                        </span>
                      ),
                      sortValue: (h) => h.totalTTC,
                      align: "right",
                    },
                  ]}
                />
              )}
            </section>
          </div>

          {/* Col droite : Actions panel */}
          <aside className="lg-v2-panel sticky top-6 h-fit p-5">
            <h2 className="lg-v2-eyebrow mb-4">Actions</h2>
            <div className="flex flex-col gap-2">
              <Link href="/nouveau-devis" className="lg-v2-btn lg-v2-btn-primary w-full justify-center">
                <Plus size={14} aria-hidden /> Nouveau devis
              </Link>
              <Link
                href="/nouvelle-facture"
                className="lg-v2-btn lg-v2-btn-secondary w-full justify-center"
              >
                <Plus size={14} aria-hidden /> Nouvelle facture
              </Link>

              {client.email ? (
                <a
                  href={`mailto:${client.email}`}
                  className="lg-v2-btn lg-v2-btn-secondary w-full justify-center"
                >
                  <Mail size={14} aria-hidden /> Envoyer un email
                </a>
              ) : null}
              {client.telephone ? (
                <a
                  href={`tel:${client.telephone}`}
                  className="lg-v2-btn lg-v2-btn-secondary w-full justify-center"
                >
                  <Phone size={14} aria-hidden /> Appeler
                </a>
              ) : null}

              <div className="my-2 border-t lg-v2-divider" />

              <Link href="/clients" className="lg-v2-btn lg-v2-btn-ghost w-full justify-center">
                <ArrowLeft size={14} aria-hidden /> Retour à la liste
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </ClientSubpageShell>
  );
}
