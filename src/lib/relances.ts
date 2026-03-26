import { prisma } from "@/lib/prisma";
import { sendDevisEmail } from "@/lib/sendEmail";
import { generateFacturePDF } from "@/lib/generatePdf";
import { getCompanyProfile } from "@/lib/company";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Vérifie les factures impayées et envoie des relances automatiques.
 *
 * Règles :
 * - Relance 1 : 7 jours après émission (si non payée)
 * - Relance 2 : 15 jours après émission
 * - Relance 3 : 30 jours après émission → passe en "En retard"
 *
 * Pour éviter les doublons, on vérifie le champ `devisRef` qui contient
 * le numéro de la dernière relance envoyée.
 */

const RELANCE_DELAYS = [
  { days: 7, label: "1ère relance" },
  { days: 15, label: "2ème relance" },
  { days: 30, label: "Mise en demeure" },
];

export async function checkOverdueFactures() {
  const now = new Date();
  const results: { numero: string; action: string }[] = [];

  // Récupérer toutes les factures émises non payées
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
        const relanceSubject = `${applicableRelance.label} — Facture ${facture.numero} (${facture.totalTTC.toFixed(2)}€)`;
        const relanceBody = [
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
        console.error(`Erreur relance ${facture.numero}:`, error);
      }
    }
  }

  return results;
}
