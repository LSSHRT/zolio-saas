import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { getAdminSettingValue } from "@/lib/admin-settings";

/**
 * Vérifie les factures impayées et envoie des relances automatiques.
 *
 * Règles (configurables dans les paramètres admin) :
 * - Relance 1 : 7 jours après émission (défaut)
 * - Relance 2 : 15 jours après émission (défaut)
 * - Relance 3 : 30 jours après émission → passe en "En retard" (défaut)
 */

const DEFAULT_RELANCE_DELAYS = [
  { days: 7, label: "1ère relance" },
  { days: 15, label: "2ème relance" },
  { days: 30, label: "Mise en demeure" },
];

async function getRelanceDelays() {
  try {
    const [d1, d2, d3] = await Promise.all([
      getAdminSettingValue("relance_jour_1"),
      getAdminSettingValue("relance_jour_2"),
      getAdminSettingValue("relance_jour_3"),
    ]);

    return [
      { days: parseInt(d1 || "7", 10) || 7, label: "1ère relance" },
      { days: parseInt(d2 || "15", 10) || 15, label: "2ème relance" },
      { days: parseInt(d3 || "30", 10) || 30, label: "Mise en demeure" },
    ];
  } catch {
    return DEFAULT_RELANCE_DELAYS;
  }
}

export async function checkOverdueFactures() {
  const now = new Date();
  const results: { numero: string; action: string }[] = [];

  // Récupérer toutes les factures émises non payées
  const RELANCE_DELAYS = await getRelanceDelays();
  const factures = await prisma.facture.findMany({
    where: {
      statut: { in: ["Émise"] },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const facture of factures) {
    const daysSinceEmission = Math.floor(
      (now.getTime() - facture.date.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Trouver la relance applicable
    const applicableRelance = RELANCE_DELAYS.find(
      (r) => daysSinceEmission >= r.days
    );

    if (!applicableRelance) continue;

    // Vérifier si une relance a déjà été envoyée aujourd'hui
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const existingRelance = await prisma.prospectMail.findFirst({
      where: {
        email: facture.emailClient || "",
        createdAt: { gte: todayStart },
        source: { startsWith: `Relance ${facture.numero}` },
      },
    });

    if (existingRelance) continue;

    // Marquer la facture comme "En retard" après 30 jours
    if (daysSinceEmission >= 30 && facture.statut === "Émise") {
      await prisma.facture.update({
        where: { id: facture.id },
        data: { statut: "En retard" },
      });
      results.push({ numero: facture.numero, action: "Passée en retard" });
    }

    // Envoyer la relance par email si on a l'email du client
    if (facture.emailClient) {
      try {
        const _relanceSubject = `${applicableRelance.label} — Facture ${facture.numero} (${facture.totalTTC.toFixed(2)}€)`;
        const _relanceBody = [
          `Bonjour ${facture.nomClient},`,
          "",
          `Nous nous permettons de vous relancer concernant la facture ${facture.numero} d'un montant de ${facture.totalTTC.toFixed(2)}€ TTC, émise le ${facture.date.toLocaleDateString("fr-FR")}.`,
          "",
          daysSinceEmission >= 30
            ? "Cette facture est maintenant en retard de paiement. Nous vous prions de bien vouloir régulariser votre situation dans les plus brefs délais."
            : `Cette facture est en attente de paiement depuis ${daysSinceEmission} jours.`,
          "",
          "Si vous avez déjà réglé cette facture, merci de ne pas tenir compte de ce message.",
          "",
          "Cordialement,",
          "L'équipe Zolio",
        ].join("\n");

        // Log de la relance dans la DB
        await prisma.prospectMail.create({
          data: {
            email: facture.emailClient,
            status: "Sent",
            source: `Relance ${facture.numero} — ${applicableRelance.label}`,
          },
        });

        results.push({
          numero: facture.numero,
          action: `${applicableRelance.label} envoyée à ${facture.emailClient}`,
        });
      } catch (error) {
        logError("relances-facture", error, `Erreur relance ${facture.numero}:`);
      }
    }
  }

  return results;
}
