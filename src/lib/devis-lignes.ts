/**
 * Helpers pour la gestion des lignes de devis normalisées
 */

import { prisma } from "@/lib/prisma";

export type LignePayload = {
  isOptional?: boolean;
  nomPrestation?: string;
  prixUnitaire?: number | string;
  quantite?: number | string;
  totalLigne?: number | string;
  tva?: string | number;
  unite?: string;
};

export function parseLignes(value: unknown): LignePayload[] {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as LignePayload[];
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value as LignePayload[];
  }

  return [];
}

export function getLineTotal(line: LignePayload): number {
  const total = Number(line.totalLigne);
  if (Number.isFinite(total) && total !== 0) return total;
  return Number(line.quantite ?? 0) * Number(line.prixUnitaire ?? 0);
}

export function parseNumber(value: unknown, fallback = 0): number {
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Normalise une ligne pour l'envoi au PDF ou au frontend
 */
export function normalizeLigneForOutput(line: LignePayload) {
  return {
    isOptional: Boolean(line.isOptional),
    nomPrestation: line.nomPrestation?.trim() || "Prestation",
    prixUnitaire: parseNumber(line.prixUnitaire),
    quantite: parseNumber(line.quantite, 1),
    totalLigne: getLineTotal(line),
    tva: String(parseNumber(line.tva, 20)),
    unite: line.unite?.trim() || "U",
  };
}

/**
 * Crée les LigneDevis en base pour un devis donné
 */
export async function createLignesForDevis(devisId: string, lignes: LignePayload[]) {
  if (lignes.length === 0) return;

  await prisma.ligneDevis.createMany({
    data: lignes.map((ligne, index) => ({
      devisId,
      nomPrestation: ligne.nomPrestation?.trim() || "Prestation",
      unite: ligne.unite?.trim() || "U",
      quantite: parseNumber(ligne.quantite, 1),
      prixUnitaire: parseNumber(ligne.prixUnitaire),
      totalLigne: getLineTotal(ligne),
      tva: String(parseNumber(ligne.tva, 20)),
      isOptional: Boolean(ligne.isOptional),
      position: index,
    })),
  });
}

/**
 * Remplace toutes les lignes d'un devis (delete + create)
 */
export async function replaceLignesForDevis(devisId: string, lignes: LignePayload[]) {
  await prisma.ligneDevis.deleteMany({ where: { devisId } });
  await createLignesForDevis(devisId, lignes);
}

/**
 * Récupère les lignes normalisées d'un devis depuis la table LigneDevis
 */
export async function getLignesForDevis(devisId: string) {
  const lignes = await prisma.ligneDevis.findMany({
    where: { devisId },
    orderBy: { position: "asc" },
  });

  return lignes.map((ligne) => ({
    isOptional: ligne.isOptional,
    nomPrestation: ligne.nomPrestation,
    prixUnitaire: ligne.prixUnitaire,
    quantite: ligne.quantite,
    totalLigne: ligne.totalLigne,
    tva: ligne.tva,
    unite: ligne.unite,
  }));
}

/**
 * Calcule les totaux à partir des lignes normalisées
 */
export function computeTotals(
  lignes: LignePayload[],
  defaultTva: number,
  remise: number,
) {
  const activeLines = lignes.filter((line) => !line.isOptional);
  const totalHTBase = activeLines.reduce((sum, line) => sum + getLineTotal(line), 0);
  const totalHT = totalHTBase * (1 - remise / 100);
  const totalTTC =
    activeLines.reduce((sum, line) => {
      const lineTva = parseNumber(line.tva, defaultTva);
      return sum + getLineTotal(line) * (1 + lineTva / 100);
    }, 0) * (1 - remise / 100);

  return { totalHT, totalHTBase, totalTTC };
}
