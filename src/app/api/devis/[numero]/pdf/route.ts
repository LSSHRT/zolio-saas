import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateDevisPDF } from "@/lib/generatePdf";
import { getCompanyProfile } from "@/lib/company";
import { parseLignes, normalizeLigneForOutput, type LignePayload } from "@/lib/devis-lignes";
import { internalServerError, jsonError } from "@/lib/http";

export const maxDuration = 30;

export async function GET(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const { numero } = await context.params;

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: {
        client: true,
        lignesNorm: { orderBy: { position: "asc" } },
      },
    });

    if (!devis) return jsonError("Devis non trouvé", 404);

    const user = await currentUser();
    if (!user) return jsonError("Utilisateur non trouvé", 401);
    const entreprise = getCompanyProfile(user);

    let lignes: LignePayload[] = [];
    if (devis.lignesNorm.length > 0) {
      lignes = devis.lignesNorm.map((ligne) => ({
        isOptional: ligne.isOptional,
        nomPrestation: ligne.nomPrestation,
        prixUnitaire: ligne.prixUnitaire,
        quantite: ligne.quantite,
        totalLigne: ligne.totalLigne,
        tva: ligne.tva,
        unite: ligne.unite,
      }));
    } else if (devis.lignesNorm) {
      lignes = parseLignes(devis.lignesNorm);
    }

    const normalizedLignes = lignes.map(normalizeLigneForOutput);

    const pdfBuffer = await generateDevisPDF({
      numeroDevis: devis.numero,
      date: devis.date.toLocaleDateString("fr-FR"),
      client: devis.client
        ? {
            nom: devis.client.nom,
            email: devis.client.email || "",
            telephone: devis.client.telephone || "",
            adresse: devis.client.adresse || "",
          }
        : { nom: "", email: "", telephone: "", adresse: "" },
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
      totalHT: lignes.reduce((s, l) => s + Number(l.totalLigne || l.quantite || 0) * Number(l.prixUnitaire || 0), 0).toFixed(2),
      tva: String(devis.tva ?? 20),
      totalTTC: "0",
      acompte: devis.acompte ? String(devis.acompte) : undefined,
      remise: devis.remise ? String(devis.remise) : undefined,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${devis.numero}.pdf"`,
      },
    });
  } catch (error) {
    return internalServerError("devis-pdf", error, "Impossible de générer le PDF du devis");
  }
}
