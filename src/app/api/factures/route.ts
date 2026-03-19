import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateFacturePDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { getCompanyProfile } from "@/lib/company";
import { internalServerError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const entreprise = getCompanyProfile(user);
    const body = await request.json();
    const { devisNumero, client, lignes, tva, totalHT, totalTTC } = body;

    const year = new Date().getFullYear();
    const count = await prisma.facture.count({
      where: { userId, numero: { startsWith: `FAC-${year}` } },
    });

    const numeroFacture = `FAC-${year}-${String(count + 1).padStart(3, "0")}`;
    const date = new Date();

    await prisma.facture.create({
      data: {
        userId,
        numero: numeroFacture,
        nomClient: client.nom,
        emailClient: client.email || null,
        totalHT: Number(totalHT),
        tva: Number(tva),
        totalTTC: Number(totalTTC),
        statut: "Émise",
        devisRef: devisNumero || null,
        date,
      },
    });

    const formattedDate = date.toLocaleDateString("fr-FR");
    const pdfBuffer = await generateFacturePDF({
      numeroDevis: numeroFacture,
      date: formattedDate,
      client,
      isPro: user?.publicMetadata?.isPro === true,
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
      lignes,
      totalHT,
      tva,
      totalTTC,
    });

    let emailSent = false;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendDevisEmail(client.email, client.nom, numeroFacture, totalTTC, pdfBuffer);
        emailSent = true;
      } catch (emailErr) {
        console.error("Email non envoyé:", emailErr);
      }
    }

    return NextResponse.json({
      numeroFacture,
      date: formattedDate,
      client,
      totalHT,
      tva,
      totalTTC,
      lignes,
      statut: "Émise",
      emailSent,
    });
  } catch (error) {
    return internalServerError("factures-post", error, "Impossible de créer la facture");
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const facturesDb = await prisma.facture.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const factures = facturesDb.map((facture) => ({
      numero: facture.numero,
      date: facture.date.toLocaleDateString("fr-FR"),
      nomClient: facture.nomClient,
      emailClient: facture.emailClient || "",
      totalHT: facture.totalHT,
      tva: facture.tva,
      totalTTC: facture.totalTTC,
      statut: facture.statut,
      devisRef: facture.devisRef || "",
    }));

    return NextResponse.json(factures);
  } catch (error) {
    return internalServerError(
      "factures-get",
      error,
      "Impossible de récupérer les factures",
    );
  }
}
