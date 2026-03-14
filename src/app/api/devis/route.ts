import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateDevisPDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const devis = await prisma.devis.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = devis.map((d: any) => {
      const parsedLignes = typeof d.lignes === 'string' ? JSON.parse(d.lignes) : (d.lignes || []);
      const remiseGlobale = d.remise || 0;
      const tvaGlobale = d.tva || 0;

      const totalHTBase = parsedLignes.filter((l: any) => !l.isOptional).reduce((s: number, l: any) => {
        return s + (l.totalLigne || (l.quantite * l.prixUnitaire) || 0);
      }, 0);
      const totalHT = totalHTBase * (1 - remiseGlobale / 100);

      const totalTTC = parsedLignes.filter((l: any) => !l.isOptional).reduce((sum: number, l: any) => {
        const ligneTva = parseFloat(l.tva || tvaGlobale.toString()) || 0;
        const ligneTotal = l.totalLigne || (l.quantite * l.prixUnitaire) || 0;
        return sum + (ligneTotal * (1 + ligneTva / 100));
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
        photos: typeof d.photos === 'string' ? JSON.parse(d.photos) : (d.photos || []),
        dateDebut: d.dateDebut ? d.dateDebut.toISOString().split('T')[0] : "",
        dateFin: d.dateFin ? d.dateFin.toISOString().split('T')[0] : ""
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Erreur GET devis:", error);
    return NextResponse.json({ error: "Impossible de récupérer les devis", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();
    const { client, clientId, lignes, remise, acompte, tva, photos } = body;

    let finalClientId = clientId;
    let clientName = typeof client === 'string' ? client : (client?.nom || "");

    if (!finalClientId && clientName) {
      // Find or create client
      const existingClient = await prisma.client.findFirst({
        where: { userId, nom: clientName }
      });
      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: { userId, nom: clientName }
        });
        finalClientId = newClient.id;
      }
    }

    const currentYear = new Date().getFullYear();
    
    // Calculate new devis number
    const count = await prisma.devis.count({
       where: { userId, numero: { startsWith: `DEV-${currentYear}-` } }
    });
    const nextNum = count + 1;
    const numero = `DEV-${currentYear}-${String(nextNum).padStart(3, "0")}`;

    const parsedLignes = typeof lignes === 'string' ? JSON.parse(lignes) : lignes;
    const tvaGlobale = parseFloat(tva || 0);
    const remiseGlobale = parseFloat(remise || 0);
    
    const finalTotalTTC = (parsedLignes as any[]).filter(l => !l.isOptional).reduce((sum, l) => {
      const ligneTva = parseFloat(l.tva || tvaGlobale.toString()) || 0;
      const ligneTotal = l.totalLigne || (l.quantite * l.prixUnitaire);
      return sum + (ligneTotal * (1 + ligneTva / 100));
    }, 0) * (1 - remiseGlobale / 100);

    const devis = await prisma.devis.create({
      data: {
        userId,
        numero,
        clientId: finalClientId,
        lignes: parsedLignes,
        remise: remiseGlobale,
        acompte: parseFloat(acompte || 0),
        tva: tvaGlobale,
        photos: typeof photos === 'string' ? JSON.parse(photos) : (photos || []),
        statut: "En attente"
      },
      include: { client: true }
    });

    // Envoyer l'email
    try {
      const user = await currentUser();
      if (user && devis.client && devis.client.email && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const meta = user.unsafeMetadata || {};
        const entrepriseInfo = {
          nom: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Mon Entreprise",
          email: user.emailAddresses[0]?.emailAddress || "",
          telephone: meta.telephone as string || "",
          adresse: meta.adresse as string || "",
          siret: meta.siret as string || "",
          rib: meta.rib as string || "",
          color: meta.color as string || "#6b21a8",
          logoUrl: meta.logoUrl as string || "",
          statutJuridique: meta.statutJuridique as string || "",
          assurance: meta.assurance as string || "",
          mentions: meta.mentions as string || ""
        };

        const totalHTBase = (parsedLignes as any[]).filter(l => !l.isOptional).reduce((s, l) => s + (l.totalLigne || (l.quantite * l.prixUnitaire)), 0);
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
          entreprise: entrepriseInfo,
          lignes: parsedLignes,
          totalHT: totalHT.toFixed(2),
          tva: tvaGlobale.toString(),
          totalTTC: finalTotalTTC.toFixed(2),
          acompte: devis.acompte?.toString() || "",
          remise: remiseGlobale.toString() || "",
          statut: "En attente",
          signatureBase64: "",
          photos: typeof devis.photos === 'string' ? JSON.parse(devis.photos) : (devis.photos || []),
        });

        await sendDevisEmail(devis.client.email, devis.client.nom, devis.numero, finalTotalTTC.toFixed(2), pdfBuffer);
      }
    } catch (emailErr) {
      console.error("Email non envoyé (erreur):", emailErr);
    }

    return NextResponse.json({
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      totalTTC: finalTotalTTC.toFixed(2)
    });
  } catch (error) {
    console.error("Erreur POST devis:", error);
    return NextResponse.json({ error: "Impossible de créer le devis", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}