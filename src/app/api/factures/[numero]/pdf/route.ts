import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateFacturePDF } from "@/lib/generatePdf";
import { getCompanyProfile } from "@/lib/company";
import { parseLignes, normalizeLigneForOutput, type LignePayload } from "@/lib/devis-lignes";
import { internalServerError, jsonError } from "@/lib/http";

export const maxDuration = 30;

export async function GET(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const { numero } = await context.params;

    const facture = await prisma.facture.findFirst({
      where: { numero, userId },
      include: {
        devis: {
          include: {
            lignesNorm: { orderBy: { position: "asc" } },
          },
        },
      },
    });

    if (!facture) return jsonError("Facture non trouvée", 404);

    const user = await currentUser();
    if (!user) return jsonError("Utilisateur non trouvé", 401);
    const entreprise = getCompanyProfile(user);

    // Récupérer les lignes du Devis source lié
    let lignes: LignePayload[] = [];
    if (facture.devis) {
      if (facture.devis.lignesNorm.length > 0) {
        lignes = facture.devis.lignesNorm.map((ligne) => ({
          isOptional: ligne.isOptional,
          nomPrestation: ligne.nomPrestation,
          prixUnitaire: ligne.prixUnitaire,
          quantite: ligne.quantite,
          totalLigne: ligne.totalLigne,
          tva: ligne.tva,
          unite: ligne.unite,
        }));
      } else if (facture.devis.lignesNorm) {
        lignes = parseLignes(facture.devis.lignesNorm);
      }
    }

    // Fallback : une ligne récap si pas de Devis lié
    if (lignes.length === 0) {
      lignes = [
        {
          isOptional: false,
          nomPrestation: "Prestations",
          prixUnitaire: facture.totalHT,
          quantite: 1,
          totalLigne: facture.totalHT,
          tva: facture.tva.toString(),
          unite: "forfait",
        },
      ];
    }

    const normalizedLignes = lignes.map(normalizeLigneForOutput);

    const pdfBuffer = await generateFacturePDF({
      numeroDevis: facture.numero,
      date: facture.date.toLocaleDateString("fr-FR"),
      client: {
        nom: facture.nomClient,
        email: facture.emailClient || "",
        telephone: "",
        adresse: "",
      },
      isPro: user.publicMetadata?.isPro === true,
      entreprise: {
        nom: entreprise.nom,
        email: entreprise.email,
        telephone: entreprise.telephone,
        adresse: entreprise.adresse,
        siret: entreprise.siret,
        color: entreprise.color,
        logo: entreprise.logo,
        iban: entreprise.iban,
        bic: entreprise.bic,
        legal: entreprise.legal,
        statut: entreprise.statut,
        assurance: entreprise.assurance,
      },
      lignes: normalizedLignes,
      totalHT: Number(facture.totalHT).toFixed(2),
      tva: String(facture.tva ?? 20),
      totalTTC: Number(facture.totalTTC).toFixed(2),
      statut: facture.statut,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${facture.numero}.pdf"`,
      },
    });
  } catch (error) {
    return internalServerError("facture-pdf", error, "Impossible de générer le PDF de la facture");
  }
}
