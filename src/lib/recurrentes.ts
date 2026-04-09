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

const MAX_SERIALIZABLE_RETRIES = 2;

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
    select: {
      id: true,
      nom: true,
    },
  });

  const results: RecurrenteResult[] = [];

  for (const rec of recurrentes) {
    for (let attempt = 0; attempt <= MAX_SERIALIZABLE_RETRIES; attempt += 1) {
      try {
        const processed = await prisma.$transaction(
          async (tx) => {
            const current = await tx.factureRecurrente.findFirst({
              where: {
                id: rec.id,
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

            if (!current) {
              return null;
            }

            const numero = await generateSequentialDocumentNumber({
              prefix: "FAC",
              userId: current.userId,
              findLatest: (basePrefix) =>
                tx.facture.findFirst({
                  where: { userId: current.userId, numero: { startsWith: basePrefix } },
                  orderBy: { numero: "desc" },
                  select: { numero: true },
                }),
            });

            const facture = await tx.facture.create({
              data: {
                userId: current.userId,
                numero,
                recurrenteId: current.id,
                nomClient: current.client.nom,
                emailClient: current.client.email || null,
                totalHT: current.montantHT,
                tva: current.tva,
                totalTTC: current.montantTTC,
                statut: "Émise",
                date: now,
              },
            });

            const prochaineDate = calculateNextDate(
              current.prochaineDate,
              current.frequence,
              current.jourMois,
            );

            await tx.factureRecurrente.update({
              where: { id: current.id },
              data: { prochaineDate },
            });

            return facture.numero;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        if (processed) {
          results.push({
            recurrenteId: rec.id,
            nom: rec.nom,
            factureNumero: processed,
            error: null,
          });
        }

        break;
      } catch (error) {
        const isRetryableSerialization =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034";

        if (isRetryableSerialization && attempt < MAX_SERIALIZABLE_RETRIES) {
          continue;
        }

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

        break;
      }
    }
  }

  return {
    processed: results.filter((r) => !r.error).length,
    results,
  };
}
