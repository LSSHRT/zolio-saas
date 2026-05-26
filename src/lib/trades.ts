export type TradeKey = "residentiel" | "tertiaire" | "irve" | "securite";

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

export const DEFAULT_TRADE: TradeKey = "residentiel";

export const TRADE_OPTIONS: readonly TradeDefinition[] = [
  {
    key: "residentiel",
    label: "Élec Résidentielle",
    shortLabel: "Résidentiel",
    pitch: "Starter rénovation logement, prises, éclairage et pieuvre.",
    summary: "Idéal pour vos chantiers de maisons individuelles et appartements.",
  },
  {
    key: "tertiaire",
    label: "Élec Tertiaire",
    shortLabel: "Tertiaire",
    pitch: "Base pour chantiers de bureaux, commerces et réseaux.",
    summary: "Chemins de câbles, armoires tertiaires, prises RJ45 et goulottes.",
  },
  {
    key: "irve",
    label: "Bornes & IRVE",
    shortLabel: "IRVE",
    pitch: "Services d'installation de bornes de recharge.",
    summary: "Bornes de recharge résidentielles, monophasées, triphasées et protections.",
  },
  {
    key: "securite",
    label: "Sécurité & Normes",
    shortLabel: "Mises aux normes",
    pitch: "Mises en sécurité et conformité NF C 15-100.",
    summary: "Tableaux électriques, prises de terre, diagnostics et Consuel.",
  },
] as const;

const TRADE_STARTERS: Record<TradeKey, StarterCatalogItem[]> = {
  residentiel: [
    { categorie: "Rénovation", nom: "Création prise de courant encastrée", unite: "unité", prix: 95, cout: 15 },
    { categorie: "Rénovation", nom: "Création point lumineux simple allumage", unite: "unité", prix: 85, cout: 12 },
    { categorie: "Réseau", nom: "Tirage de ligne électrique sous gaine", unite: "ml", prix: 14, cout: 3 },
    { categorie: "Éclairage", nom: "Pose de spot LED encastré", unite: "unité", prix: 48, cout: 5 },
    { categorie: "Chauffage", nom: "Remplacement radiateur électrique", unite: "unité", prix: 150, cout: 30 },
    { categorie: "VMC", nom: "Pose de kit VMC simple flux auto", unite: "forfait", prix: 350, cout: 80 },
    { categorie: "Déplacement", nom: "Déplacement chantier résidentiel", unite: "forfait", prix: 55, cout: 5 },
  ],
  tertiaire: [
    { categorie: "Cheminement", nom: "Pose de goulotte PVC 80x50", unite: "ml", prix: 35, cout: 8 },
    { categorie: "Réseau", nom: "Câblage RJ45 Cat 6", unite: "unité", prix: 110, cout: 18 },
    { categorie: "Armoire", nom: "Pose de coffret électrique tertiaire", unite: "unité", prix: 650, cout: 180 },
    { categorie: "Éclairage", nom: "Pose de dalle LED 600x600", unite: "unité", prix: 90, cout: 22 },
    { categorie: "Réseau", nom: "Tirage de câble RJ45 Cat 6 FTP", unite: "ml", prix: 4.5, cout: 0.9 },
    { categorie: "Déplacement", nom: "Déplacement chantier tertiaire", unite: "forfait", prix: 75, cout: 10 },
  ],
  irve: [
    { categorie: "Borne", nom: "Installation Borne Recharge 7.4 kW Monophasée", unite: "unité", prix: 1250, cout: 450 },
    { categorie: "Borne", nom: "Installation Borne Recharge 22 kW Triphasée", unite: "unité", prix: 1950, cout: 750 },
    { categorie: "Sécurité", nom: "Interrupteur différentiel Type B 40A", unite: "unité", prix: 280, cout: 95 },
    { categorie: "Câblage", nom: "Tirage de câble 3G10 (borne IRVE)", unite: "ml", prix: 25, cout: 8 },
    { categorie: "Mise en service", nom: "Paramétrage de la borne et test de charge", unite: "forfait", prix: 180, cout: 20 },
    { categorie: "Déplacement", nom: "Déplacement spécialiste IRVE", unite: "forfait", prix: 65, cout: 10 },
  ],
  securite: [
    { categorie: "Tableau", nom: "Remplacement tableau électrique résidentiel 2 rangées", unite: "forfait", prix: 850, cout: 320 },
    { categorie: "Tableau", nom: "Remplacement tableau électrique résidentiel 3 rangées", unite: "forfait", prix: 1150, cout: 410 },
    { categorie: "Sécurité", nom: "Mise en conformité de la prise de terre", unite: "forfait", prix: 380, cout: 90 },
    { categorie: "Sécurité", nom: "Mise en sécurité partielle NF C 15-100", unite: "forfait", prix: 480, cout: 90 },
    { categorie: "Diagnostic", nom: "Recherche de panne et dépannage d'urgence", unite: "heure", prix: 78, cout: 0 },
    { categorie: "Déplacement", nom: "Déplacement d'urgence / dépannage", unite: "forfait", prix: 65, cout: 5 },
  ],
};

const TRADE_BUNDLES: Record<TradeKey, TradeBundle[]> = {
  residentiel: [
    {
      nom: "Pack prises & éclairage",
      description: "Installation standard pour une pièce à vivre.",
      lignes: [
        { nomPrestation: "Création prise de courant encastrée", quantite: 6, unite: "unité", prixUnitaire: 95, totalLigne: 570 },
        { nomPrestation: "Création point lumineux simple allumage", quantite: 2, unite: "unité", prixUnitaire: 85, totalLigne: 170 },
        { nomPrestation: "Tirage de ligne électrique sous gaine", quantite: 35, unite: "ml", prixUnitaire: 14, totalLigne: 490 },
      ],
    },
  ],
  tertiaire: [
    {
      nom: "Équipement poste de travail",
      description: "Prises de courant et RJ45 pour bureau.",
      lignes: [
        { nomPrestation: "Câblage RJ45 Cat 6", quantite: 4, unite: "unité", prixUnitaire: 110, totalLigne: 440 },
        { nomPrestation: "Pose de goulotte PVC 80x50", quantite: 10, unite: "ml", prixUnitaire: 35, totalLigne: 350 },
      ],
    },
  ],
  irve: [
    {
      nom: "Installation Borne standard",
      description: "Pose complète de borne 7.4 kW with protection.",
      lignes: [
        { nomPrestation: "Installation Borne Recharge 7.4 kW Monophasée", quantite: 1, unite: "unité", prixUnitaire: 1250, totalLigne: 1250 },
        { nomPrestation: "Interrupteur différentiel Type B 40A", quantite: 1, unite: "unité", prixUnitaire: 280, totalLigne: 280 },
        { nomPrestation: "Tirage de câble 3G10 (borne IRVE)", quantite: 15, unite: "ml", prixUnitaire: 25, totalLigne: 375 },
      ],
    },
  ],
  securite: [
    {
      nom: "Remplacement Tableau complet",
      description: "Tableau 3 rangées conforme Consuel.",
      lignes: [
        { nomPrestation: "Remplacement tableau électrique résidentiel 3 rangées", quantite: 1, unite: "forfait", prixUnitaire: 1150, totalLigne: 1150 },
        { nomPrestation: "Mise en conformité de la prise de terre", quantite: 1, unite: "forfait", prixUnitaire: 380, totalLigne: 380 },
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
  return getTradeDefinition(value)?.label ?? getTradeDefinition(DEFAULT_TRADE)?.label ?? "Spécialité";
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
