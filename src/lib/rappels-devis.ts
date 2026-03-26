/**
 * Vérifie les devis qui expirent bientôt et envoie des rappels.
 *
 * Règles :
 * - Rappel 1 : 3 jours avant expiration (7 jours après création)
 * - Rappel 2 : 1 jour avant expiration
 * - Expiration : 7 jours → le devis passe en "Expiré" (optionnel)
 *
 * Les devis ont un token qui expire après 7 jours (PUBLIC_DEVIS_TOKEN_TTL_MS).
 */

import { prisma } from "@/lib/prisma";

const DEVIS_EXPIRY_DAYS = 7;
const REMINDER_DAYS = [4, 6]; // Jours 4 et 6 après création (3j et 1j avant expiration)

export async function checkExpiringDevis() {
  const now = new Date();
  const results: { numero: string; action: string }[] = [];

  // Récupérer les devis en attente non signés
  const devis = await prisma.devis.findMany({
    where: {
      statut: "En attente",
      signature: null,
    },
    include: { client: true },
    orderBy: { createdAt: "asc" },
  });

  for (const d of devis) {
    const daysSinceCreation = Math.floor(
      (now.getTime() - d.date.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Vérifier si un rappel est applicable
    const applicableReminder = REMINDER_DAYS.find((days) => daysSinceCreation >= days);
    if (!applicableReminder) continue;

    // Vérifier si un rappel a déjà été envoyé aujourd'hui
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const existingReminder = await prisma.prospectMail.findFirst({
      where: {
        email: d.client?.email || "",
        createdAt: { gte: todayStart },
        source: { startsWith: `Rappel devis ${d.numero}` },
      },
    });

    if (existingReminder) continue;

    // Marquer le rappel comme envoyé
    const daysLeft = DEVIS_EXPIRY_DAYS - daysSinceCreation;
    await prisma.prospectMail.create({
      data: {
        email: d.client?.email || "",
        status: "Sent",
        source: `Rappel devis ${d.numero} — ${daysLeft} jour(s) restant(s)`,
      },
    });

    results.push({
      numero: d.numero,
      action: `Rappel envoyé (${daysLeft}j restants)`,
    });
  }

  return results;
}
