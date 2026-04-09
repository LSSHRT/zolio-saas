import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateDevisPDF } from "@/lib/generatePdf";
import { getCompanyProfile } from "@/lib/company";
import { currentUser } from "@clerk/nextjs/server";
import { parseLignes, normalizeLigneForOutput, computeTotals, parseNumber, type LignePayload } from "@/lib/devis-lignes";
import { internalServerError, jsonError, rateLimitResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 120;

// POST — Exporter tous les devis en PDF (retourne les URLs de download)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const rl = rateLimit(`export-post:${userId}`, 5, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { type } = await request.json() as { type?: string };

    const user = await currentUser();
    if (!user) return jsonError("Utilisateur non trouvé", 401);
    const entreprise = getCompanyProfile(user);

    if (type === "devis") {
      const devis = await prisma.devis.findMany({
        where: { userId },
        include: { client: true, lignesNorm: { orderBy: { position: "asc" } } },
        orderBy: { createdAt: "desc" },
      });

      const results: { numero: string; status: string }[] = [];

      for (const d of devis.slice(0, 20)) { // Max 20 devis
        try {
          const lignes: LignePayload[] = d.lignesNorm.length > 0
            ? d.lignesNorm.map((ligne) => ({
                isOptional: ligne.isOptional,
                nomPrestation: ligne.nomPrestation,
                prixUnitaire: parseNumber(ligne.prixUnitaire),
                quantite: parseNumber(ligne.quantite),
                totalLigne: parseNumber(ligne.totalLigne),
                tva: ligne.tva,
                unite: ligne.unite,
              }))
            : [];

          const tvaNum = parseNumber(d.tva, 20);
          const remiseNum = parseNumber(d.remise, 0);
          const { totalHT, totalTTC } = computeTotals(lignes, tvaNum, remiseNum);

          const _pdfBuffer = await generateDevisPDF({
            numeroDevis: d.numero,
            date: d.date.toLocaleDateString("fr-FR"),
            client: {
              nom: d.client?.nom || "",
              email: d.client?.email || "",
              telephone: d.client?.telephone || "",
              adresse: d.client?.adresse || "",
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
              cgv: entreprise.cgv,
            },
            lignes: lignes.map(normalizeLigneForOutput),
            totalHT: totalHT.toFixed(2),
            tva: String(tvaNum),
            totalTTC: totalTTC.toFixed(2),
            acompte: parseNumber(d.acompte).toString(),
            remise: remiseNum.toString(),
            statut: d.statut,
            signatureBase64: d.signature || "",
            photos: [],
          });

          results.push({ numero: d.numero, status: "OK" });
        } catch {
          results.push({ numero: d.numero, status: "Erreur" });
        }
      }

      return NextResponse.json({ message: `${results.filter(r => r.status === "OK").length} devis générés`, results });
    }

    return jsonError("Type non supporté. Utilisez 'devis' ou 'factures'.", 400);
  } catch (error) {
    return internalServerError("export-post", error, "Erreur lors de l'export");
  }
}
