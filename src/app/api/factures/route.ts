import { prisma } from "@/lib/prisma";
import { generateFacturePDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const meta = (user?.unsafeMetadata as any) || (user?.publicMetadata as any) || {};
    const entrepriseName = meta.companyName || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Mon Entreprise");
    const entrepriseEmail = user?.emailAddresses?.[0]?.emailAddress || "";
    const entreprisePhone = meta.companyPhone || "";
    const entrepriseAddress = meta.companyAddress || "";
    const entrepriseSiret = meta.companySiret || "";
    const entrepriseColor = meta.companyColor || "";
    const entrepriseLogo = meta.companyLogo || "";
    const entrepriseIban = meta.companyIban || "";
    const entrepriseBic = meta.companyBic || "";
    const entrepriseLegal = meta.companyLegal || "";
    const entrepriseStatut = meta.companyStatut || "";
    const entrepriseAssurance = meta.companyAssurance || "";

    const body = await request.json();
    const { devisNumero, client, lignes, tva, totalHT, totalTTC } = body;

    // Generate numero
    const year = new Date().getFullYear();
    const count = await prisma.facture.count({
      where: { userId, numero: { startsWith: `FAC-${year}` } }
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
      }
    });

    const formattedDate = date.toLocaleDateString("fr-FR");

    // Generate PDF
    const pdfBuffer = await generateFacturePDF({
      numeroDevis: numeroFacture,
      date: formattedDate,
      client,
      isPro: user?.publicMetadata?.isPro === true,
      entreprise: { nom: entrepriseName, email: entrepriseEmail, telephone: entreprisePhone, adresse: entrepriseAddress, siret: entrepriseSiret, color: entrepriseColor, logo: entrepriseLogo, iban: entrepriseIban, bic: entrepriseBic, legal: entrepriseLegal, statut: entrepriseStatut, assurance: entrepriseAssurance },
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
    console.error("Erreur POST facture:", error);
    return NextResponse.json({ error: "Impossible de créer la facture" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const facturesDb = await prisma.facture.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const factures = facturesDb.map(f => ({
      numero: f.numero,
      date: f.date.toLocaleDateString("fr-FR"),
      nomClient: f.nomClient,
      emailClient: f.emailClient || "",
      totalHT: f.totalHT,
      tva: f.tva,
      totalTTC: f.totalTTC,
      statut: f.statut,
      devisRef: f.devisRef || "",
    }));

    return NextResponse.json(factures);
  } catch (error) {
    console.error("Erreur GET factures:", error);
    return NextResponse.json({ error: "Impossible de récupérer les factures" }, { status: 500 });
  }
}
