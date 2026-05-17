import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Sparkles, Wrench, Zap, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Changelog — Zolio",
  description: "Historique des mises à jour et nouvelles fonctionnalités de Zolio.",
};

const ICONS = {
  feature: Sparkles,
  improvement: Wrench,
  performance: Zap,
  security: Shield,
};

const CHANGELOG = [
  {
    date: "2026-05-13",
    version: "2.0.0",
    entries: [
      { type: "feature" as const, title: "Pages d'authentification allégées", desc: "Inscription et connexion repensées : badges de confiance (RGPD, hébergé en France) visibles sur mobile, chargement instantané, plus de dépendances externes." },
      { type: "feature" as const, title: "Centre de notifications enrichi", desc: "Filtres par catégorie, regroupement par date, état vide soigné. Tout est plus lisible et plus rapide à traiter." },
      { type: "feature" as const, title: "Signature client enrichie", desc: "Aperçu détaillé des lignes de devis et totaux dans le portail de signature, autosave de la signature, parcours mobile fluide." },
      { type: "improvement" as const, title: "Pages secondaires unifiées", desc: "Calepin, Modèles, Catalogue, Planning, TVA, Rapports et Récurrences partagent maintenant le même en-tête avec fil d'Ariane et indicateurs clés." },
      { type: "improvement" as const, title: "Pages d'erreur à la marque", desc: "Erreurs 404, 500 et erreurs de page partagées habillées aux couleurs Zolio, avec actions claires pour reprendre la main." },
      { type: "improvement" as const, title: "Pages légales unifiées", desc: "CGU, CGV, mentions légales et politique de confidentialité alignées sur la même mise en forme dark, lisible sur mobile." },
      { type: "improvement" as const, title: "Accessibilité clavier", desc: "Anneau de focus visible quand vous naviguez au clavier, libellés ARIA sur les boutons-icones, meilleur contraste sur les pills d'état." },
      { type: "performance" as const, title: "Dépendances externes éliminées", desc: "Plus d'images chargées depuis pravatar.cc ou transparenttextures.com sur les pages publiques. CSP plus stricte, LCP réduit." },
      { type: "performance" as const, title: "Graphiques chargés à la demande", desc: "Le camembert des dépenses ne charge recharts qu'au moment du rendu : page /dépenses plus légère au premier affichage." },
      { type: "security" as const, title: "Email de support aligné", desc: "Les messages envoyés depuis /contact arrivent maintenant sur la bonne boîte (contact@zolio.site). Échappement HTML ajouté sur les contenus utilisateur." },
    ],
  },
  {
    date: "2026-04-06",
    version: "1.9.0",
    entries: [
      { type: "feature" as const, title: "Recherche globale (Cmd+K)", desc: "Recherchez dans tous vos devis, factures, clients et dépenses en une seule requête avec actions rapides." },
      { type: "feature" as const, title: "Notes internes", desc: "Ajoutez des notes privées sur chaque devis et facture pour suivre les détails importants." },
      { type: "feature" as const, title: "Planning mensuel", desc: "Calendrier interactif avec échéances, fins de devis et factures récurrentes." },
      { type: "feature" as const, title: "Actions batch", desc: "Marquez, relancez ou supprimez plusieurs factures et devis en une seule action." },
      { type: "feature" as const, title: "Résumé de semaine", desc: "Vue d'activité hebdo sur le dashboard : nouveaux devis, factures payées, CA encaissé." },
      { type: "feature" as const, title: "Raccourcis clavier", desc: "Appuyez sur ? pour voir tous les raccourcis disponibles." },
      { type: "feature" as const, title: "Export CSV dépenses", desc: "Téléchargez vos dépenses en CSV pour votre comptable." },
      { type: "feature" as const, title: "Comparaison multi-options", desc: "Comparez côte à côte les options basique/standard/premium de vos devis." },
      { type: "feature" as const, title: "Bouton FAB dashboard", desc: "Accès rapide à la création de devis, facture, client ou dépense." },
      { type: "feature" as const, title: "Fiche client détaillée", desc: "Page dédiée avec stats, historique et liens vers chaque document." },
      { type: "improvement" as const, title: "Paiement Stripe sur détail facture", desc: "Lien direct vers le dashboard Stripe pour suivre les paiements." },
      { type: "improvement" as const, title: "Navigation enrichie", desc: "Liens vers notifications et rapports ajoutés dans le menu outils." },
    ],
  },
  {
    date: "2026-04-01",
    version: "1.8.0",
    entries: [
      { type: "feature" as const, title: "Paiement en ligne Stripe", desc: "Vos clients paient leurs factures directement depuis l'espace client." },
      { type: "feature" as const, title: "Reçu PDF par email", desc: "Confirmation automatique avec reçu PDF après paiement Stripe." },
      { type: "feature" as const, title: "Prochaines échéances", desc: "Section dashboard avec factures à venir dans les 14 prochains jours." },
      { type: "feature" as const, title: "Page Rapports", desc: "Hub central pour tous les exports : FEC, TVA, CSV, URSSAF." },
      { type: "improvement" as const, title: "Signal factures en retard", desc: "Alerte intelligente dans les priorités du dashboard." },
    ],
  },
  {
    date: "2026-03-25",
    version: "1.7.0",
    entries: [
      { type: "feature" as const, title: "Relances automatiques", desc: "3 niveaux de relance : doux (J+3), ferme (J+7), mise en demeure (J+15)." },
      { type: "feature" as const, title: "Espace client white-label", desc: "Portail client personnalisé avec accès aux factures et devis." },
      { type: "feature" as const, title: "Factures d'acompte", desc: "Créez des factures d'acompte depuis un devis accepté ou signé." },
      { type: "improvement" as const, title: "Trésorerie & Bénéfice", desc: "Sections dashboard avec encaissé, à encaisser, en retard et bénéfice net." },
    ],
  },
  {
    date: "2026-03-15",
    version: "1.6.0",
    entries: [
      { type: "feature" as const, title: "Multi-options devis", desc: "Proposez 3 options (basique, standard, premium) sur chaque devis." },
      { type: "feature" as const, title: "Templates IA", desc: "Génération automatique de prestations par métier via IA." },
      { type: "performance" as const, title: "Performance dashboard", desc: "Optimisation du chargement et des requêtes API." },
    ],
  },
  {
    date: "2026-03-01",
    version: "1.5.0",
    entries: [
      { type: "feature" as const, title: "Lancement Zolio", desc: "Première version publique : devis, factures, clients, dépenses." },
      { type: "feature" as const, title: "Signature électronique", desc: "Signature des devis directement en ligne." },
      { type: "feature" as const, title: "Export comptable FEC", desc: "Export au format FEC pour votre comptable." },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MOBILE — preserved as-is                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:hidden">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>

          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
              <Sparkles size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Changelog
            </h1>
            <p className="mt-3 text-lg text-slate-500 dark:text-slate-400">
              L&apos;historique des mises à jour de Zolio. On livre chaque semaine.
            </p>
          </div>

          <div className="relative space-y-10">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 sm:left-6" />

            {CHANGELOG.map((release) => (
              <div key={release.version} className="relative pl-12 sm:pl-14">
                {/* Dot */}
                <div className="absolute left-3 top-1.5 h-4 w-4 rounded-full border-2 border-violet-500 bg-white dark:border-violet-400 dark:bg-slate-900 sm:left-4" />

                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    v{release.version}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <Calendar size={12} />
                    {new Date(release.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>

                {/* Entries */}
                <div className="space-y-3">
                  {release.entries.map((entry, i) => {
                    const Icon = ICONS[entry.type];
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                            entry.type === "feature" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" :
                            entry.type === "improvement" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" :
                            entry.type === "performance" ? "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" :
                            "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                          }`}>
                            <Icon size={12} />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{entry.title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{entry.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DESKTOP — v2 polish (timeline + cards using v2 tokens)        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="hidden min-h-screen lg-v2-workspace lg:block">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm lg-v2-text-muted transition hover:lg-v2-text"
          >
            <ArrowLeft size={14} aria-hidden /> Retour à l&apos;accueil
          </Link>

          {/* Header */}
          <header className="mt-6 mb-10 flex items-start justify-between gap-6">
            <div>
              <p className="lg-v2-eyebrow">Journal</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight lg-v2-text-strong">
                Changelog
              </h1>
              <p className="mt-1 text-sm lg-v2-text-muted">
                L&apos;historique des mises à jour de Zolio. On livre chaque semaine.
              </p>
            </div>
            <span className="lg-v2-pill lg-v2-pill-primary">
              <Sparkles size={12} aria-hidden /> {CHANGELOG.length} versions
            </span>
          </header>

          <div className="relative space-y-10">
            {/* Timeline line */}
            <div
              className="absolute left-6 top-0 bottom-0 w-px"
              style={{ backgroundColor: "var(--v2-divider)" }}
              aria-hidden
            />

            {CHANGELOG.map((release) => (
              <div key={release.version} className="relative pl-16">
                {/* Dot */}
                <div
                  className="absolute left-4 top-1.5 h-4 w-4 rounded-full border-2"
                  style={{
                    borderColor: "var(--v2-primary)",
                    backgroundColor: "var(--v2-panel)",
                  }}
                  aria-hidden
                />

                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="lg-v2-pill lg-v2-pill-primary">
                    v{release.version}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs lg-v2-text-subtle">
                    <Calendar size={12} aria-hidden />
                    {new Date(release.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Entries */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {release.entries.map((entry, i) => {
                    const Icon = ICONS[entry.type];
                    const toneClass =
                      entry.type === "feature"
                        ? "lg-v2-pill-success"
                        : entry.type === "improvement"
                          ? "lg-v2-pill-info"
                          : entry.type === "performance"
                            ? "lg-v2-pill-warning"
                            : "lg-v2-pill-danger";
                    return (
                      <div key={i} className="lg-v2-panel p-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${toneClass}`}
                          >
                            <Icon size={12} aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold lg-v2-text-strong">
                              {entry.title}
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed lg-v2-text-muted">
                              {entry.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
