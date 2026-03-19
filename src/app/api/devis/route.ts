import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateDevisPDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { getCompanyProfile } from "@/lib/company";
import { internalServerError } from "@/lib/http";
import { createPublicDevisToken } from "@/lib/public-devis-token";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const devis = await prisma.devis.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });

    const mapped = devis.map((d: any) => {
      const parsedLignes =
        typeof d.lignes === "string" ? JSON.parse(d.lignes) : (d.lignes || []);
      const remiseGlobale = d.remise || 0;
      const tvaGlobale = d.tva || 0;

      const totalHTBase = parsedLignes
        .filter((l: any) => !l.isOptional)
        .reduce((sum: number, l: any) => {
          return sum + (l.totalLigne || l.quantite * l.prixUnitaire || 0);
        }, 0);
      const totalHT = totalHTBase * (1 - remiseGlobale / 100);

      const totalTTC = parsedLignes
        .filter((l: any) => !l.isOptional)
        .reduce((sum: number, l: any) => {
          const ligneTva = Number.parseFloat(l.tva || tvaGlobale.toString()) || 0;
          const ligneTotal = l.totalLigne || l.quantite * l.prixUnitaire || 0;
          return sum + ligneTotal * (1 + ligneTva / 100);
        }, 0) * (1 - remiseGlobale / 100);

      return {
        numero: d.numero,
        client: d.client ? d.client.nom : "Inconnu",
        nomClient: d.client ? d.client.nom : "Inconnu",
        emailClient: d.client ? d.client.email : "",
        clientId: d.clientId,
        date: d.date.toLocaleDateString("fr-FR"),
        statut: d.statut,
        lignes: parsedLignes,
        remise: remiseGlobale,
        acompte: d.acompte || 0,
        tva: `${tvaGlobale}%`,
        totalHT: totalHT.toFixed(2),
        totalTTC: totalTTC.toFixed(2),
        signature: d.signature || "",
        signingToken: createPublicDevisToken(d.numero, userId),
        photos: typeof d.photos === "string" ? JSON.parse(d.photos) : (d.photos || []),
        dateDebut: d.dateDebut ? d.dateDebut.toISOString().split("T")[0] : "",
        dateFin: d.dateFin ? d.dateFin.toISOString().split("T")[0] : "",
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    return internalServerError("devis-get", error, "Impossible de récupérer les devis");
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();
    const { client, clientId, lignes, remise, acompte, tva, photos } = body;

    let finalClientId = clientId;
    const clientName = typeof client === "string" ? client : client?.nom || "";

    if (!finalClientId && clientName) {
      const existingClient = await prisma.client.findFirst({
        where: { userId, nom: clientName },
      });

      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: { userId, nom: clientName },
        });
        finalClientId = newClient.id;
      }
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.devis.count({
      where: { userId, numero: { startsWith: `DEV-${currentYear}-` } },
    });
    const numero = `DEV-${currentYear}-${String(count + 1).padStart(3, "0")}`;

    const parsedLignes = typeof lignes === "string" ? JSON.parse(lignes) : lignes;
    const tvaGlobale = Number.parseFloat(tva || 0);
    const remiseGlobale = Number.parseFloat(remise || 0);

    const finalTotalTTC = (parsedLignes as any[])
      .filter((line) => !line.isOptional)
      .reduce((sum, line) => {
        const ligneTva = Number.parseFloat(line.tva || tvaGlobale.toString()) || 0;
        const ligneTotal = line.totalLigne || line.quantite * line.prixUnitaire;
        return sum + ligneTotal * (1 + ligneTva / 100);
      }, 0) * (1 - remiseGlobale / 100);

    const devis = await prisma.devis.create({
      data: {
        userId,
        numero,
        clientId: finalClientId,
        lignes: parsedLignes,
        remise: remiseGlobale,
        acompte: Number.parseFloat(acompte || 0),
        tva: tvaGlobale,
        photos: typeof photos === "string" ? JSON.parse(photos) : (photos || []),
        statut: "En attente",
      },
      include: { client: true },
    });

    try {
      const user = await currentUser();
      if (user && devis.client && devis.client.email && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const entreprise = getCompanyProfile(user);
        const totalHTBase = (parsedLignes as any[])
          .filter((line) => !line.isOptional)
          .reduce((sum, line) => sum + (line.totalLigne || line.quantite * line.prixUnitaire), 0);
        const montantRemise = totalHTBase * remiseGlobale / 100;
        const totalHT = totalHTBase - montantRemise;

        const pdfBuffer = await generateDevisPDF({
          numeroDevis: devis.numero,
          date: devis.date.toLocaleDateString("fr-FR"),
          client: {
            nom: devis.client.nom,
            email: devis.client.email,
            telephone: devis.client.telephone || "",
            adresse: devis.client.adresse || "",
          },
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
          lignes: parsedLignes,
          totalHT: totalHT.toFixed(2),
          tva: tvaGlobale.toString(),
          totalTTC: finalTotalTTC.toFixed(2),
          acompte: devis.acompte?.toString() || "",
          remise: remiseGlobale.toString(),
          statut: "En attente",
          signatureBase64: "",
          photos: typeof devis.photos === "string" ? JSON.parse(devis.photos) : (devis.photos || []),
        });

        await sendDevisEmail(
          devis.client.email,
          devis.client.nom,
          devis.numero,
          finalTotalTTC.toFixed(2),
          pdfBuffer,
        );
      }
    } catch (emailErr) {
      console.error("Email non envoyé (erreur):", emailErr);
    }

    return NextResponse.json({
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      totalTTC: finalTotalTTC.toFixed(2),
      signingToken: createPublicDevisToken(devis.numero, userId),
    });
  } catch (error) {
    return internalServerError("devis-post", error, "Impossible de créer le devis");
  }
}
