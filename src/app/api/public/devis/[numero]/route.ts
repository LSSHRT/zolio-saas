export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDevisSignedEmail } from "@/lib/sendEmail";
import { generateDevisPDF } from "@/lib/generatePdf";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("u");

    if (!userId) return new NextResponse("User ID manquant", { status: 400 });

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true }
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    const clientData = await clerkClient();
    const user = await clientData.users.getUser(userId);

    const lignes = typeof devis.lignes === 'string' ? JSON.parse(devis.lignes) : (devis.lignes || []);
    const remiseGlobale = devis.remise || 0;
    const tvaGlobale = devis.tva || 0;
    const totalTTC = lignes.filter((l: any) => !l.isOptional).reduce((sum: number, l: any) => {
      const ligneTva = parseFloat(l.tva || tvaGlobale.toString()) || 0;
      const ligneTotal = l.totalLigne || (l.quantite * l.prixUnitaire) || 0;
      return sum + (ligneTotal * (1 + ligneTva / 100));
    }, 0) * (1 - remiseGlobale / 100);

    const devisData = {
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      nomClient: devis.client ? devis.client.nom : "",
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      lignes,
      remise: remiseGlobale,
      acompte: devis.acompte,
      tva: tvaGlobale,
      totalTTC: totalTTC.toFixed(2),
      signature: devis.signature || "",
      photos: typeof devis.photos === 'string' ? JSON.parse(devis.photos) : (devis.photos || []),
      entrepriseInfo: {
        nom: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Mon Entreprise",
        email: user.emailAddresses[0]?.emailAddress || "",
        telephone: user.unsafeMetadata?.telephone as string || "",
        adresse: user.unsafeMetadata?.adresse as string || "",
        siret: user.unsafeMetadata?.siret as string || "",
        rib: user.unsafeMetadata?.rib as string || "",
        color: user.unsafeMetadata?.color as string || "#6b21a8",
        logoUrl: user.unsafeMetadata?.logoUrl as string || "",
        statutJuridique: user.unsafeMetadata?.statutJuridique as string || "",
        assurance: user.unsafeMetadata?.assurance as string || "",
        mentions: user.unsafeMetadata?.mentions as string || ""
      }
    };

    return NextResponse.json(devisData);
  } catch (error) {
    console.error("Erreur GET public devis:", error);
    return NextResponse.json({ error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("u");

    if (!userId) return new NextResponse("User ID manquant", { status: 400 });

    const body = await request.json();
    const { signature } = body;

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true }
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: {
        statut: "Accepté",
        signature: signature || ""
      }
    });

    // Send email with PDF
    try {
      const clientData = await clerkClient();
      const user = await clientData.users.getUser(userId);
      const emailClient = devis.client?.email;
      
      if (emailClient && signature) {
        const entrepriseInfo = {
          nom: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Mon Entreprise",
          email: user.emailAddresses[0]?.emailAddress || "",
          telephone: user.unsafeMetadata?.telephone as string || "",
          adresse: user.unsafeMetadata?.adresse as string || "",
          siret: user.unsafeMetadata?.siret as string || "",
          rib: user.unsafeMetadata?.rib as string || "",
          color: user.unsafeMetadata?.color as string || "#6b21a8",
          logoUrl: user.unsafeMetadata?.logoUrl as string || "",
          statutJuridique: user.unsafeMetadata?.statutJuridique as string || "",
          assurance: user.unsafeMetadata?.assurance as string || "",
          mentions: user.unsafeMetadata?.mentions as string || ""
        };

        const lignes = typeof devis.lignes === 'string' ? JSON.parse(devis.lignes) : devis.lignes;
        const tvaGlobale = devis.tva?.toString() || "0";
        const remiseGlobale = devis.remise || 0;
        
        const totalHTBase = (lignes as any[]).filter(l => !l.isOptional).reduce((s, l) => s + (l.totalLigne || (l.quantite * l.prixUnitaire)), 0);
        const montantRemise = totalHTBase * remiseGlobale / 100;
        const totalHT = totalHTBase - montantRemise;
        
        const totalTTC = (lignes as any[]).filter(l => !l.isOptional).reduce((sum, l) => {
          const tva = parseFloat(l.tva || tvaGlobale) || 0;
          const ligneTotal = l.totalLigne || (l.quantite * l.prixUnitaire);
          return sum + (ligneTotal * (1 + tva / 100));
        }, 0) * (1 - remiseGlobale / 100);

        const pdfBuffer = await generateDevisPDF({
          numeroDevis: devis.numero,
          date: devis.date.toLocaleDateString("fr-FR"),
          client: {
            nom: devis.client?.nom || "",
            email: emailClient,
            telephone: devis.client?.telephone || "",
            adresse: devis.client?.adresse || "",
          },
          entreprise: entrepriseInfo,
          lignes,
          totalHT: totalHT.toFixed(2),
          tva: tvaGlobale,
          totalTTC: totalTTC.toFixed(2),
          acompte: devis.acompte?.toString() || "",
          remise: remiseGlobale.toString() || "",
          statut: "Accepté",
          signatureBase64: signature,
          photos: typeof devis.photos === 'string' ? JSON.parse(devis.photos) : (devis.photos || []),
        });
        await sendDevisSignedEmail(emailClient, entrepriseInfo.nom, devis.numero, totalTTC.toFixed(2), pdfBuffer);
      }
    } catch (e) {
      console.error("Erreur envoi email PDF:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST public devis:", error);
    return NextResponse.json({ error: "Erreur lors de la signature", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}