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
            client: true,
            lignesNorm: { orderBy: { position: "asc" } },
          },
        },
      },
    });

    if (!facture) return jsonError("Facture non trouvée", 404);

    const user = await currentUser();
    if (!user) return jsonError("Utilisateur non trouvé", 401);
    const entreprise = getCompanyProfile(user);

    // Get lignes from the linked devis if available
    let lignes: LignePayload[] = [];
    let clientInfo = {
      nom: facture.nomClient,
      email: facture.emailClient || "",
      telephone: "",
      adresse: "",
    };

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
      } else if (facture.devis.lignes) {
        lignes = parseLignes(facture.devis.lignes);
      }

      if (facture.devis.client) {
        clientInfo = {
          nom: facture.devis.client.nom,
          email: facture.devis.client.email || "",
          telephone: facture.devis.client.telephone || "",
          adresse: facture.devis.client.adresse || "",
        };
      }
    }

    const normalizedLignes = lignes.map(normalizeLigneForOutput);

    const pdfBuffer = await generateFacturePDF({
      numeroDevis: facture.numero,
      date: facture.date.toLocaleDateString("fr-FR"),
      client: clientInfo,
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
        cgv: entreprise.cgv,
      },
      lignes: normalizedLignes,
      totalHT: facture.totalHT.toFixed(2),
      tva: String(facture.tva),
      totalTTC: facture.totalTTC.toFixed(2),
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${facture.numero}.pdf"`,
      },
    });
  } catch (error) {
    return internalServerError("facture-pdf", error, "Impossible de générer le PDF de la facture");
  }
}
