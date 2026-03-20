export type TradeKey = "peintre" | "plaquiste" | "plombier" | "electricien";

export type TradeDefinition = {
  key: TradeKey;
  label: string;
  shortLabel: string;
  pitch: string;
  summary: string;
};

export type StarterCatalogItem = {
  categorie: string;
  nom: string;
  unite: string;
  prix: number;
  cout: number;
  stock?: number;
  description?: string;
};

export type TradeBundleLine = {
  nomPrestation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  totalLigne: number;
};

export type TradeBundle = {
  nom: string;
  description: string;
  lignes: TradeBundleLine[];
};

export const DEFAULT_TRADE: TradeKey = "peintre";

export const TRADE_OPTIONS: readonly TradeDefinition[] = [
  {
    key: "peintre",
    label: "Peintre",
    shortLabel: "Peinture",
    pitch: "Starter prêt pour devis rapides intérieurs et rafraîchissements.",
    summary: "Préparation, peinture murs/plafonds, boiseries et finitions courantes.",
  },
  {
    key: "plaquiste",
    label: "Plaquiste",
    shortLabel: "Placo",
    pitch: "Base BA13 prête pour cloisons, doublages et plafonds.",
    summary: "Cloisons, isolation, bandes, faux plafonds et reprises standard.",
  },
  {
    key: "plombier",
    label: "Plombier",
    shortLabel: "Plomberie",
    pitch: "Services fréquents de dépannage, pose et rénovation.",
    summary: "Sanitaires, chauffe-eau, alimentation/évacuation et recherche de fuite.",
  },
  {
    key: "electricien",
    label: "Électricien",
    shortLabel: "Électricité",
    pitch: "Starter rénovation logement et mises aux normes.",
    summary: "Tableau, prises, éclairage, tirage de lignes et rénovation partielle.",
  },
] as const;

const TRADE_STARTERS: Record<TradeKey, StarterCatalogItem[]> = {
  peintre: [
    { categorie: "Préparation", nom: "Protection des sols et meubles", unite: "forfait", prix: 150, cout: 20 },
    { categorie: "Préparation", nom: "Rebouchage et ponçage", unite: "m²", prix: 14, cout: 2 },
    { categorie: "Préparation", nom: "Sous-couche d'impression", unite: "m²", prix: 8, cout: 1.8 },
    { categorie: "Peinture", nom: "Peinture murs 2 couches", unite: "m²", prix: 24, cout: 5 },
    { categorie: "Peinture", nom: "Peinture plafond sans traces", unite: "m²", prix: 20, cout: 4 },
    { categorie: "Peinture", nom: "Peinture boiseries satinée", unite: "ml", prix: 18, cout: 3.5 },
    { categorie: "Finition", nom: "Peinture porte intérieure", unite: "unité", prix: 65, cout: 10 },
    { categorie: "Déplacement", nom: "Déplacement chantier", unite: "forfait", prix: 45, cout: 5 },
  ],
  plaquiste: [
    { categorie: "Cloison", nom: "Montage cloison BA13 sur ossature", unite: "m²", prix: 42, cout: 14 },
    { categorie: "Isolation", nom: "Isolation laine de verre 100 mm", unite: "m²", prix: 19, cout: 8 },
    { categorie: "Doublage", nom: "Doublage collé BA13", unite: "m²", prix: 35, cout: 11 },
    { categorie: "Plafond", nom: "Faux plafond BA13 suspendu", unite: "m²", prix: 49, cout: 17 },
    { categorie: "Finition", nom: "Bandes et joints 3 passes", unite: "m²", prix: 14, cout: 2.5 },
    { categorie: "Finition", nom: "Ponçage et finition placo", unite: "m²", prix: 8, cout: 1 },
    { categorie: "Dépose", nom: "Dépose ancienne cloison légère", unite: "m²", prix: 16, cout: 0 },
    { categorie: "Déplacement", nom: "Déplacement chantier", unite: "forfait", prix: 45, cout: 5 },
  ],
  plombier: [
    { categorie: "Dépannage", nom: "Recherche de fuite", unite: "forfait", prix: 150, cout: 0 },
    { categorie: "Sanitaire", nom: "Remplacement mitigeur", unite: "unité", prix: 95, cout: 12 },
    { categorie: "Sanitaire", nom: "Pose WC suspendu", unite: "unité", prix: 380, cout: 30 },
    { categorie: "Réseau", nom: "Création alimentation EF/EC", unite: "forfait", prix: 220, cout: 35 },
    { categorie: "Réseau", nom: "Création évacuation PVC", unite: "forfait", prix: 180, cout: 25 },
    { categorie: "Chauffe-eau", nom: "Pose chauffe-eau électrique", unite: "unité", prix: 320, cout: 45 },
    { categorie: "Dépannage", nom: "Débouchage canalisation", unite: "forfait", prix: 130, cout: 0 },
    { categorie: "Déplacement", nom: "Déplacement chantier", unite: "forfait", prix: 55, cout: 5 },
  ],
  electricien: [
    { categorie: "Rénovation", nom: "Création prise de courant", unite: "unité", prix: 95, cout: 15 },
    { categorie: "Rénovation", nom: "Création point lumineux", unite: "unité", prix: 85, cout: 12 },
    { categorie: "Tableau", nom: "Remplacement tableau électrique", unite: "forfait", prix: 850, cout: 320 },
    { categorie: "Réseau", nom: "Tirage de ligne électrique", unite: "ml", prix: 14, cout: 3 },
    { categorie: "Sécurité", nom: "Mise aux normes partielle", unite: "forfait", prix: 480, cout: 90 },
    { categorie: "Éclairage", nom: "Pose de spot ou luminaire", unite: "unité", prix: 48, cout: 5 },
    { categorie: "Diagnostic", nom: "Recherche de panne", unite: "heure", prix: 78, cout: 0 },
    { categorie: "Déplacement", nom: "Déplacement chantier", unite: "forfait", prix: 55, cout: 5 },
  ],
};

const TRADE_BUNDLES: Record<TradeKey, TradeBundle[]> = {
  peintre: [
    {
      nom: "Rafraîchissement pièce 15m²",
      description: "Préparation légère, murs et plafond compris.",
      lignes: [
        { nomPrestation: "Protection des sols et meubles", quantite: 1, unite: "forfait", prixUnitaire: 150, totalLigne: 150 },
        { nomPrestation: "Rebouchage et ponçage", quantite: 40, unite: "m²", prixUnitaire: 14, totalLigne: 560 },
        { nomPrestation: "Peinture murs 2 couches", quantite: 40, unite: "m²", prixUnitaire: 24, totalLigne: 960 },
        { nomPrestation: "Peinture plafond sans traces", quantite: 15, unite: "m²", prixUnitaire: 20, totalLigne: 300 },
      ],
    },
    {
      nom: "Pack boiseries et portes",
      description: "Finition rapide pour rénovation intérieure.",
      lignes: [
        { nomPrestation: "Peinture boiseries satinée", quantite: 18, unite: "ml", prixUnitaire: 18, totalLigne: 324 },
        { nomPrestation: "Peinture porte intérieure", quantite: 3, unite: "unité", prixUnitaire: 65, totalLigne: 195 },
      ],
    },
  ],
  plaquiste: [
    {
      nom: "Cloison BA13 standard",
      description: "Ossature, plaques, bandes et finition.",
      lignes: [
        { nomPrestation: "Montage cloison BA13 sur ossature", quantite: 18, unite: "m²", prixUnitaire: 42, totalLigne: 756 },
        { nomPrestation: "Isolation laine de verre 100 mm", quantite: 18, unite: "m²", prixUnitaire: 19, totalLigne: 342 },
        { nomPrestation: "Bandes et joints 3 passes", quantite: 18, unite: "m²", prixUnitaire: 14, totalLigne: 252 },
      ],
    },
    {
      nom: "Plafond suspendu isolé",
      description: "Plafond BA13 avec finition prête à peindre.",
      lignes: [
        { nomPrestation: "Faux plafond BA13 suspendu", quantite: 22, unite: "m²", prixUnitaire: 49, totalLigne: 1078 },
        { nomPrestation: "Isolation laine de verre 100 mm", quantite: 22, unite: "m²", prixUnitaire: 19, totalLigne: 418 },
        { nomPrestation: "Ponçage et finition placo", quantite: 22, unite: "m²", prixUnitaire: 8, totalLigne: 176 },
      ],
    },
  ],
  plombier: [
    {
      nom: "Remplacement chauffe-eau",
      description: "Dépose, pose et remise en service.",
      lignes: [
        { nomPrestation: "Pose chauffe-eau électrique", quantite: 1, unite: "unité", prixUnitaire: 320, totalLigne: 320 },
        { nomPrestation: "Création alimentation EF/EC", quantite: 1, unite: "forfait", prixUnitaire: 220, totalLigne: 220 },
        { nomPrestation: "Déplacement chantier", quantite: 1, unite: "forfait", prixUnitaire: 55, totalLigne: 55 },
      ],
    },
    {
      nom: "Salle d'eau rénovation légère",
      description: "Sanitaires et raccordements principaux.",
      lignes: [
        { nomPrestation: "Pose WC suspendu", quantite: 1, unite: "unité", prixUnitaire: 380, totalLigne: 380 },
        { nomPrestation: "Remplacement mitigeur", quantite: 1, unite: "unité", prixUnitaire: 95, totalLigne: 95 },
        { nomPrestation: "Création évacuation PVC", quantite: 1, unite: "forfait", prixUnitaire: 180, totalLigne: 180 },
      ],
    },
  ],
  electricien: [
    {
      nom: "Mise à niveau pièce complète",
      description: "Prises, éclairage et ligne dédiée.",
      lignes: [
        { nomPrestation: "Création prise de courant", quantite: 4, unite: "unité", prixUnitaire: 95, totalLigne: 380 },
        { nomPrestation: "Création point lumineux", quantite: 2, unite: "unité", prixUnitaire: 85, totalLigne: 170 },
        { nomPrestation: "Tirage de ligne électrique", quantite: 25, unite: "ml", prixUnitaire: 14, totalLigne: 350 },
      ],
    },
    {
      nom: "Tableau et sécurité",
      description: "Pack rénovation tableau + mise aux normes.",
      lignes: [
        { nomPrestation: "Remplacement tableau électrique", quantite: 1, unite: "forfait", prixUnitaire: 850, totalLigne: 850 },
        { nomPrestation: "Mise aux normes partielle", quantite: 1, unite: "forfait", prixUnitaire: 480, totalLigne: 480 },
      ],
    },
  ],
};

export const STARTER_CATEGORIES = Array.from(
  new Set(
    Object.values(TRADE_STARTERS).flatMap((items) => items.map((item) => item.categorie)),
  ),
).sort((left, right) => left.localeCompare(right, "fr"));

export function isTradeKey(value: unknown): value is TradeKey {
  return typeof value === "string" && TRADE_OPTIONS.some((option) => option.key === value);
}

export function getTradeDefinition(value: unknown): TradeDefinition | null {
  if (!isTradeKey(value)) {
    return null;
  }

  return TRADE_OPTIONS.find((option) => option.key === value) ?? null;
}

export function getTradeLabel(value: unknown) {
  return getTradeDefinition(value)?.label ?? getTradeDefinition(DEFAULT_TRADE)?.label ?? "Métier";
}

export function getStarterCatalogForTrade(value: unknown) {
  const key = isTradeKey(value) ? value : DEFAULT_TRADE;
  return TRADE_STARTERS[key].map((item) => ({ ...item }));
}

export function getTradeBundlesForTrade(value: unknown) {
  const key = isTradeKey(value) ? value : DEFAULT_TRADE;
  return TRADE_BUNDLES[key].map((bundle) => ({
    ...bundle,
    lignes: bundle.lignes.map((line) => ({ ...line })),
  }));
}
