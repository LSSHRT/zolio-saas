"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  ChevronDown,
  Lock,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ClientSectionCard } from "@/components/client-shell";
import {
  TRADE_OPTIONS,
  type TradeBundle,
  type TradeDefinition,
  type TradeKey,
} from "@/lib/trades";
import type { LigneDevis, Prestation } from "./types";

type LineEditorProps = {
  activeTrade: TradeKey;
  activeTradeDefinition: TradeDefinition;
  canEdit: boolean;
  expressPrestations: Prestation[];
  filteredPrestations: Prestation[];
  hasClient: boolean;
  isImportingStarter: boolean;
  lignes: LigneDevis[];
  onAddFreeLine: () => void;
  onAddPrestation: (prestation: Prestation) => void;
  onApplyBundle: (bundle: TradeBundle) => void;
  onImportStarter: () => void;
  onOpenAI: () => void;
  onRemoveLine: (index: number) => void;
  onSearchChange: (value: string) => void;
  onSelectTrade: (trade: TradeKey) => void;
  onToggleOptional: (index: number) => void;
  onUpdateNom: (index: number, value: string) => void;
  onUpdatePrix: (index: number, value: number) => void;
  onUpdateQty: (index: number, value: number) => void;
  onUpdateTva: (index: number, value: string) => void;
  prestationSearch: string;
  prestations: Prestation[];
  starterCount: number;
  tradeBundles: TradeBundle[];
};

const TVA_OPTIONS = [
  { label: "0%", value: "0" },
  { label: "5.5%", value: "5.5" },
  { label: "10%", value: "10" },
  { label: "20%", value: "20" },
];

export function LineEditor({
  activeTrade,
  activeTradeDefinition,
  canEdit,
  expressPrestations,
  filteredPrestations,
  hasClient,
  isImportingStarter,
  lignes,
  onAddFreeLine,
  onAddPrestation,
  onApplyBundle,
  onImportStarter,
  onOpenAI,
  onRemoveLine,
  onSearchChange,
  onSelectTrade,
  onToggleOptional,
  onUpdateNom,
  onUpdatePrix,
  onUpdateQty,
  onUpdateTva,
  prestationSearch,
  prestations,
  starterCount,
  tradeBundles,
}: LineEditorProps) {
  const [showBundles, setShowBundles] = useState(false);

  const visiblePrestations = useMemo(
    () => filteredPrestations.slice(0, prestationSearch.trim() ? 12 : 8),
    [filteredPrestations, prestationSearch],
  );

  return (
    <>
      <ClientSectionCard>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-200">
              <BriefcaseBusiness size={16} />
              <p className="text-xs font-semibold uppercase tracking-[0.24em]">
                Chiffrage
              </p>
            </div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Étape 2. Composez le devis
            </h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Packs rapides, starter catalogue, recherche libre et lignes éditables: tout est regroupé dans l’étape de chiffrage.
            </p>
          </div>

          {!hasClient ? (
            <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-300/40 bg-amber-400/10 px-4 py-4 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
              <Lock size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Choisissez un client pour activer le chiffrage</p>
                <p className="mt-1 leading-6 opacity-80">
                  Le catalogue reste visible, mais les actions de création et d’édition sont volontairement mises en attente tant qu’aucune fiche client n’est liée au devis.
                </p>
              </div>
            </div>
          ) : null}

          <details className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4 md:hidden">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                    Configurer le chiffrage
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                    {activeTradeDefinition.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Packs, starter, métier et IA restent ici pour garder la zone de saisie propre.
                  </p>
                </div>
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                  {starterCount} starter
                </span>
              </div>
            </summary>

            <div className="mt-4 space-y-4 border-t border-slate-200/70 pt-4 dark:border-white/8">
              <div className="flex flex-wrap gap-2">
                {TRADE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onSelectTrade(option.key)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      activeTrade === option.key
                        ? "bg-violet-600 text-white shadow-brand"
                        : "bg-white/80 text-slate-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={onImportStarter}
                  disabled={isImportingStarter || !canEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
                >
                  {isImportingStarter ? "Import..." : `Importer ${starterCount} lignes starter`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBundles(true)}
                  disabled={!canEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200"
                >
                  <Package size={16} />
                  Packs rapides
                </button>
                <button
                  type="button"
                  onClick={onOpenAI}
                  disabled={!canEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20"
                >
                  <Sparkles size={16} />
                  Assistant IA
                </button>
                <Link
                  href="/catalogue"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20"
                >
                  Ouvrir le catalogue
                </Link>
              </div>
            </div>
          </details>

          <div className="hidden rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4 md:block">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                  Starter métier
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  {activeTradeDefinition.label} prêt à chiffrer
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {prestations.length === 0
                    ? "Importez vos lignes starter pour démarrer sans ressaisie."
                    : "Gardez vos prestations, vos packs rapides et vos lignes libres dans le même flux de saisie."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {TRADE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onSelectTrade(option.key)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      activeTrade === option.key
                        ? "bg-violet-600 text-white shadow-brand"
                        : "bg-white/80 text-slate-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onImportStarter}
                  disabled={isImportingStarter || !canEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
                >
                  {isImportingStarter ? "Import..." : `Importer ${starterCount} lignes starter`}
                </button>
                <Link
                  href="/catalogue"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20"
                >
                  Ouvrir le catalogue
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {expressPrestations.length > 0 ? (
              <div className="rounded-[1.6rem] border border-violet-200/70 bg-violet-50/80 p-4 dark:border-violet-400/20 dark:bg-violet-500/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-200">
                      Devis express
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Ajoutez vos prestations les plus proches en un tap.
                    </p>
                  </div>
                  <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200 dark:bg-white/8 dark:text-violet-200 dark:ring-violet-400/20">
                    {expressPrestations.length} rapide{expressPrestations.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 min-[390px]:grid-cols-2">
                  {expressPrestations.map((prestation) => (
                    <button
                      key={`express-${prestation.id}`}
                      type="button"
                      onClick={() => onAddPrestation(prestation)}
                      disabled={!canEdit}
                      className="rounded-[1.2rem] border border-white/70 bg-white/90 px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/8"
                    >
                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{prestation.nom}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                        {prestation.categorie}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-violet-700 dark:text-violet-200">
                        {prestation.prix}€ / {prestation.unite}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={prestationSearch}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Rechercher une prestation ou une catégorie..."
                disabled={!canEdit}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/6"
              />
            </div>
            <button
              type="button"
              onClick={onAddFreeLine}
              disabled={!canEdit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/4 dark:text-slate-100 dark:hover:bg-white/8"
            >
              <Plus size={16} />
              Ligne libre
            </button>
          </div>

          <div className="hidden gap-3 md:grid lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={prestationSearch}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Rechercher une prestation ou une catégorie..."
                disabled={!canEdit}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/6"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowBundles(true)}
              disabled={!canEdit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200"
            >
              <Package size={16} />
              Packs rapides
            </button>
            <button
              type="button"
              onClick={onOpenAI}
              disabled={!canEdit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20"
            >
              <Sparkles size={16} />
              Assistant IA
            </button>
            <button
              type="button"
              onClick={onAddFreeLine}
              disabled={!canEdit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/4 dark:text-slate-100 dark:hover:bg-white/8"
            >
              <Plus size={16} />
              Ligne libre
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {visiblePrestations.length > 0 ? (
              visiblePrestations.map((prestation) => (
                <button
                  key={prestation.id}
                  type="button"
                  onClick={() => onAddPrestation(prestation)}
                  disabled={!canEdit}
                  className="rounded-[1.4rem] border border-slate-200/70 bg-white/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:bg-white/4 dark:hover:border-violet-400/20 dark:hover:bg-violet-500/8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                        {prestation.nom}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {prestation.categorie}
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-200">
                      {prestation.prix}€ / {prestation.unite}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="lg:col-span-2 rounded-[1.4rem] border border-dashed border-slate-300/70 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/4 dark:text-slate-300">
                {prestations.length === 0
                  ? "Votre catalogue est vide. Importez le starter métier ou ajoutez une ligne libre."
                  : "Aucune prestation ne correspond à votre recherche. Ajoutez une ligne libre pour continuer."}
              </div>
            )}
          </div>

          <datalist id="prestations-list-new-devis">
            {prestations.map((prestation) => (
              <option key={prestation.id} value={prestation.nom} />
            ))}
          </datalist>

          <div className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">
                  Lignes du devis
                </h3>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-900/6 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                {lignes.length} ligne{lignes.length > 1 ? "s" : ""}
              </span>
            </div>

            {lignes.length > 0 ? (
              <>
                <div className="mt-5 hidden overflow-hidden rounded-[1.4rem] border border-slate-200/70 dark:border-white/8 lg:block">
                  <div className="grid grid-cols-[minmax(0,2.2fr)_0.65fr_0.8fr_0.95fr_0.75fr_0.8fr_0.42fr] gap-3 bg-slate-100/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:bg-white/6 dark:text-slate-400">
                    <span>Prestation</span>
                    <span>Qté</span>
                    <span>Prix</span>
                    <span>TVA</span>
                    <span>Option</span>
                    <span className="text-right">Total</span>
                    <span />
                  </div>
                  <div className="divide-y divide-slate-200/70 dark:divide-white/8">
                    {lignes.map((ligne, index) => (
                      <div
                        key={`${ligne.nomPrestation || "ligne"}-${index}`}
                        className="grid grid-cols-[minmax(0,2.2fr)_0.65fr_0.8fr_0.95fr_0.75fr_0.8fr_0.42fr] gap-3 px-4 py-3"
                      >
                        <input
                          type="text"
                          list="prestations-list-new-devis"
                          value={ligne.nomPrestation}
                          onChange={(event) => onUpdateNom(index, event.target.value)}
                          disabled={!canEdit}
                          placeholder="Nom de la prestation"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/8"
                        />
                        <input
                          type="number"
                          min="1"
                          step="any"
                          inputMode="decimal"
                          value={ligne.quantite}
                          onChange={(event) => onUpdateQty(index, Number.parseFloat(event.target.value) || 1)}
                          disabled={!canEdit}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/8"
                        />
                        <input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={ligne.prixUnitaire}
                          onChange={(event) => onUpdatePrix(index, Number.parseFloat(event.target.value) || 0)}
                          disabled={!canEdit}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/8"
                        />
                        <select
                          value={ligne.tva || "10"}
                          onChange={(event) => onUpdateTva(index, event.target.value)}
                          disabled={!canEdit}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/8"
                        >
                          {TVA_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <label className="inline-flex items-center gap-2 text-base text-slate-600 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={Boolean(ligne.isOptional)}
                            onChange={() => onToggleOptional(index)}
                            disabled={!canEdit}
                            className="h-4 w-4 rounded border-slate-300 text-brand-violet focus:ring-violet-500"
                          />
                          Option
                        </label>
                        <div className="flex items-center justify-end text-sm font-semibold text-slate-950 dark:text-white">
                          {ligne.totalLigne.toFixed(2)}€
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveLine(index)}
                          disabled={!canEdit}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Supprimer la ligne"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:hidden">
                  {lignes.map((ligne, index) => (
                    <details
                      key={`${ligne.nomPrestation || "ligne"}-${index}`}
                      className="rounded-[1.4rem] border border-slate-200/70 bg-white/80 p-4 dark:border-white/8 dark:bg-white/4"
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                            {ligne.nomPrestation || `Ligne ${index + 1}`}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/8 dark:text-slate-300">
                              Qté {ligne.quantite}
                            </span>
                            <span className="inline-flex rounded-full bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-200">
                              {ligne.prixUnitaire.toFixed(2)}€ / unité
                            </span>
                            {ligne.isOptional ? (
                              <span className="inline-flex rounded-full bg-amber-400/12 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-200">
                                Option
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            Total
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                            {ligne.totalLigne.toFixed(2)}€
                          </p>
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Modifier
                            <ChevronDown size={14} />
                          </span>
                        </div>
                      </summary>

                      <div className="mt-4 grid gap-3 border-t border-slate-200/70 pt-4 dark:border-white/8">
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Prestation
                          <input
                            type="text"
                            list="prestations-list-new-devis"
                            value={ligne.nomPrestation}
                            onChange={(event) => onUpdateNom(index, event.target.value)}
                            disabled={!canEdit}
                            placeholder="Nom de la prestation"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/8"
                          />
                        </label>

                        <div className="grid gap-3 min-[390px]:grid-cols-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Quantité
                            <input
                              type="number"
                              min="1"
                              step="any"
                              inputMode="decimal"
                              value={ligne.quantite}
                              onChange={(event) => onUpdateQty(index, Number.parseFloat(event.target.value) || 1)}
                              disabled={!canEdit}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/8"
                            />
                          </label>

                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Prix unitaire
                            <input
                              type="number"
                              min="0"
                              step="any"
                              inputMode="decimal"
                              value={ligne.prixUnitaire}
                              onChange={(event) => onUpdatePrix(index, Number.parseFloat(event.target.value) || 0)}
                              disabled={!canEdit}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/8"
                            />
                          </label>

                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            TVA
                            <select
                              value={ligne.tva || "10"}
                              onChange={(event) => onUpdateTva(index, event.target.value)}
                              disabled={!canEdit}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/8"
                            >
                              {TVA_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-white/4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              Total
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                              {ligne.totalLigne.toFixed(2)}€
                            </p>
                          </div>
                        </div>

                        <label className="inline-flex items-center gap-2 text-base text-slate-600 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={Boolean(ligne.isOptional)}
                            onChange={() => onToggleOptional(index)}
                            disabled={!canEdit}
                            className="h-4 w-4 rounded border-slate-300 text-brand-violet focus:ring-violet-500"
                          />
                          Ligne optionnelle
                        </label>

                        <button
                          type="button"
                          onClick={() => onRemoveLine(index)}
                          disabled={!canEdit}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-400/20 dark:bg-rose-500/8 dark:text-rose-200"
                        >
                          <Trash2 size={16} />
                          Supprimer cette ligne
                        </button>
                      </div>
                    </details>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300/70 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/4 dark:text-slate-300">
                Aucune ligne pour le moment. Ajoutez une prestation du catalogue, appliquez un pack métier ou démarrez avec une ligne libre.
              </div>
            )}
          </div>
        </div>
      </ClientSectionCard>

      {showBundles ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#0d1328] sm:max-h-[80vh] sm:rounded-[2rem] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                  Packs rapides
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white sm:text-2xl">
                  {activeTradeDefinition.label}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Ajoutez un lot métier en un clic, puis ajustez les quantités ou le prix si besoin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBundles(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/8"
                aria-label="Fermer les packs rapides"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid flex-1 gap-3 overflow-y-auto pr-1">
              {tradeBundles.map((bundle) => (
                <button
                  key={bundle.nom}
                  type="button"
                  onClick={() => {
                    onApplyBundle(bundle);
                    setShowBundles(false);
                  }}
                  className="rounded-[1.4rem] border border-slate-200/70 bg-slate-50/80 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50 dark:border-white/8 dark:bg-white/4 dark:hover:border-violet-400/20 dark:hover:bg-violet-500/8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{bundle.nom}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {bundle.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-200">
                      {bundle.lignes.length} lignes
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
