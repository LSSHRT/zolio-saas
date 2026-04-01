"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  PenTool,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { TRADE_OPTIONS, getStarterCatalogForTrade, getTradeBundlesForTrade, getTradeDefinition, type TradeKey } from "@/lib/trades";

interface Props {
  tradeKey: TradeKey;
}

export default function TradeLandingClient({ tradeKey }: Props) {
  const trade = getTradeDefinition(tradeKey);
  if (!trade) return null;

  const catalog = getStarterCatalogForTrade(tradeKey);
  const bundles = getTradeBundlesForTrade(tradeKey);

  const features = [
    { icon: FileText, title: "Devis en 3 min", desc: `Créez vos devis ${trade.label.toLowerCase()}e depuis votre téléphone, sur le chantier.` },
    { icon: PenTool, title: "Signature client", desc: "Faites signer vos clients directement sur l'écran, sans papier." },
    { icon: TrendingUp, title: "Marge visible", desc: "Coût matière vs prix affiché — vous savez ce que vous gagnez avant même d'envoyer." },
    { icon: Zap, title: "Catalogue métier prêt", desc: `${catalog.length} prestations pré-configurées pour ${trade.label.toLowerCase()}.`, },
    { icon: ShieldCheck, title: "Conforme 2026", desc: "Mentions légales, facturation électronique — tout est géré." },
    { icon: Rocket, title: "Premier devis offert", desc: "3 devis gratuits, sans carte bancaire. Passez Pro quand vous êtes prêt." },
  ];

  return (
    <div className="min-h-screen bg-[#0c0a1d] text-white">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-3 z-50 sm:top-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.5rem] items-center justify-between rounded-[28px] bg-white/[0.04] px-4 sm:px-6 backdrop-blur-xl border border-white/10">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zolio</span>
              <span className="hidden text-[10px] uppercase tracking-[0.28em] text-white/40 sm:block">{trade.shortLabel} OS</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/sign-in?redirect_url=/dashboard" className="text-sm font-medium text-neutral-300 hover:text-white transition">Se connecter</Link>
              <Link href="/sign-up?redirect_url=/dashboard" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-neutral-200 transition">Essayer</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-[8.5rem] pb-24 sm:pt-[10rem] sm:pb-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_64%_52%_at_50%_0%,rgba(99,102,241,0.16),rgba(4,6,18,0))]" />
          <div className="absolute right-[-6%] top-[12%] h-[20rem] w-[20rem] rounded-full bg-fuchsia-600/10 blur-[68px]" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-sm font-medium text-neutral-300">Conçu pour les {trade.label.toLowerCase()}s</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter">
            Logiciel Devis & Factures
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">pour {trade.label}</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto">
            {trade.pitch} {trade.summary} Démarrez gratuitement.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up?redirect_url=/dashboard" className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-black shadow-lg hover:scale-[1.02] transition">
              Démarrer l&apos;essai
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/#pricing" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-8 py-4 text-lg font-semibold text-white hover:bg-white/[0.08] transition">
              Voir les tarifs
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {["3 devis gratuits", "Sans carte bancaire", "Mobile & desktop"].map((t) => (
              <span key={t} className="landing-chip">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Tout ce qu&apos;un {trade.label.toLowerCase()}e a besoin
            </h2>
            <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto">
              Conçu spécifiquement pour votre métier. Pas un logiciel générique adapté.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/14 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-violet-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-neutral-400 leading-6">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Prestations catalogue */}
      <section className="py-24 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Catalogue {trade.shortLabel} prêt
            </h2>
            <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto">
              {catalog.length} prestations pré-configurées avec prix et coûts. Importez-les en 1 clic.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((p) => (
              <div key={p.nom} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <span className="text-[10px] uppercase tracking-[0.22em] text-violet-300">{p.categorie}</span>
                <p className="mt-2 font-semibold text-white">{p.nom}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{p.prix}€</span>
                  <span className="text-sm text-neutral-500">/{p.unite}</span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">Coût estimé : {p.cout}€/{p.unite}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packs/Bundles */}
      {bundles.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold">Exemples de devis {trade.shortLabel}</h2>
              <p className="mt-4 text-lg text-neutral-400">Des packs prêts à personnaliser pour vos chantiers types.</p>
            </div>

            <div className="space-y-6">
              {bundles.map((b) => (
                <div key={b.nom} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6 sm:p-8">
                  <h3 className="text-xl font-semibold text-white mb-2">{b.nom}</h3>
                  <p className="text-sm text-neutral-400 mb-6">{b.description}</p>
                  <div className="space-y-3">
                    {b.lignes.map((l, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-white">{l.nomPrestation}</p>
                          <p className="text-xs text-neutral-500">{l.quantite} {l.unite} × {l.prixUnitaire}€</p>
                        </div>
                        <span className="font-semibold text-white">{l.totalLigne.toFixed(0)}€</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-4 border-t border-white/8 mt-2">
                      <span className="text-sm font-semibold text-neutral-300">Total</span>
                      <span className="text-xl font-bold text-violet-300">
                        {b.lignes.reduce((s, l) => s + l.totalLigne, 0).toFixed(0)}€
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Prêt à digitaliser vos chantiers {trade.shortLabel.toLowerCase()}e ?
          </h2>
          <p className="text-lg text-neutral-400 mb-8">3 devis gratuits. Sans carte bancaire. Prêt en 2 minutes.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up?redirect_url=/dashboard" className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-black shadow-lg hover:scale-[1.02] transition">
              Créer mon compte
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-8 py-4 text-lg font-semibold text-white hover:bg-white/[0.08] transition">
              <Phone size={16} />
              Voir toute la plateforme
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
