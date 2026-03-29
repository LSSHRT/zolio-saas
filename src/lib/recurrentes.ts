/**
 * Helper pour traiter les factures récurrentes.
 * Utilisé par le cron endpoint `/api/cron/recurrentes`.
 */
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { generateSequentialDocumentNumber } from "@/lib/document-number";
import { Prisma } from "@prisma/client";

export type RecurrenteResult = {
  recurrenteId: string;
  nom: string;
  factureNumero: string | null;
  error: string | null;
};

/**
 * Calcule la prochaine date de facturation en fonction de la fréquence.
 */
export function calculateNextDate(
  currentDate: Date,
  frequence: string,
  jourMois: number,
): Date {
  const next = new Date(currentDate);

  switch (frequence) {
    case "mensuel":
      next.setMonth(next.getMonth() + 1);
      break;
    case "trimestriel":
      next.setMonth(next.getMonth() + 3);
      break;
    case "annuel":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }

  // Clamp le jour du mois (max 28 pour éviter les problèmes de février)
  next.setDate(Math.min(jourMois, 28));
  return next;
}

/**
 * Trouve et traite toutes les factures récurrentes échues.
 * Pour chaque récurrente :
 *   1. Crée une Facture
 *   2. Met à jour prochaineDate
 * Retourne un résumé des résultats.
 */
export async function processRecurrentInvoices(): Promise<{
  processed: number;
  results: RecurrenteResult[];
}> {
  const now = new Date();

  const recurrentes = await prisma.factureRecurrente.findMany({
    where: {
      actif: true,
      prochaineDate: { lte: now },
      OR: [{ dateFin: null }, { dateFin: { gt: now } }],
    },
    include: {
      client: {
        select: { nom: true, email: true },
      },
    },
  });

  const results: RecurrenteResult[] = [];

  for (const rec of recurrentes) {
    try {
      // Générer un numéro de facture unique
      const numero = await generateSequentialDocumentNumber({
        prefix: "FAC",
        userId: rec.userId,
        findLatest: (basePrefix) =>
          prisma.facture.findFirst({
            where: { userId: rec.userId, numero: { startsWith: basePrefix } },
            orderBy: { numero: "desc" },
            select: { numero: true },
          }),
      });

      // Créer la facture
      const facture = await prisma.facture.create({
        data: {
          userId: rec.userId,
          numero,
          recurrenteId: rec.id,
          nomClient: rec.client.nom,
          emailClient: rec.client.email || null,
          totalHT: rec.montantHT,
          tva: rec.tva,
          totalTTC: rec.montantTTC,
          statut: "Émise",
          date: now,
        },
      });

      // Calculer la prochaine date
      const prochaineDate = calculateNextDate(
        rec.prochaineDate,
        rec.frequence,
        rec.jourMois,
      );

      await prisma.factureRecurrente.update({
        where: { id: rec.id },
        data: { prochaineDate },
      });

      results.push({
        recurrenteId: rec.id,
        nom: rec.nom,
        factureNumero: facture.numero,
        error: null,
      });
    } catch (error) {
      const isUniqueConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      logError(
        "recurrentes-process",
        error,
        `Erreur pour la récurrente ${rec.id}`,
      );

      results.push({
        recurrenteId: rec.id,
        nom: rec.nom,
        factureNumero: null,
        error: isUniqueConflict
          ? "Conflit de numéro de facture"
          : "Erreur lors de la création",
      });
    }
  }

  return {
    processed: results.filter((r) => !r.error).length,
    results,
  };
}
