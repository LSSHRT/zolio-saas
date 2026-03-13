import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { generateDevisPDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const { client, lignes, tva, acompte, remise, photos } = body;

    const sheets = await getGoogleSheetsClient();

    // Générer le numéro de devis (colonne B au lieu de A car A = userId)
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!B:B",
    });
    const count = existing.data.values?.length || 1;
    const year = new Date().getFullYear();
    const numeroDevis = `DEV-${year}-${String(count).padStart(3, "0")}`;
    const date = new Date().toLocaleDateString("fr-FR");

    // Calculer les totaux
    const totalHT = lignes.filter((l: any) => !l.isOptional).reduce((sum: number, l: any) => sum + l.totalLigne, 0);
    // Multi-TVA: on calcule le TTC ligne par ligne
    const totalTTC = lignes.filter((l: any) => !l.isOptional).reduce((sum: number, l: any) => sum + (l.totalLigne * (1 + (parseFloat(l.tva) || 0) / 100)), 0);
    // Pour la rétrocompatibilité ou l'affichage global de l'en-tête (on peut mettre "Multi" si plusieurs TVA)
    const tvaRates = [...new Set(lignes.map((l: any) => l.tva || "0"))];
    const tvaLabel = tvaRates.length > 1 ? "Multi" : (tvaRates[0] || tva) + "%";

    // 1. Écrire l'en-tête du devis (On ajoute le userId en 1er)
    // Colonnes : A=userId, B=numero, C=date, D=client.nom, E=client.email, F=HT, G=TVA, H=TTC, I=statut, J=lien, K=acompte, L=remise, M=signature, N=lu_le, O=photos
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:O",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          userId,
          numeroDevis,
          date,
          client.nom,
          client.email,
          totalHT.toFixed(2),
          tvaLabel,
          totalTTC.toFixed(2),
          "En attente",
          "", // Lien PDF
          acompte ? acompte.toString() : "", // Acompte (%)
          remise ? remise.toString() : "", // Remise globale (%)
          "", // Signature
          "", // Lu le
          photos ? JSON.stringify(photos) : "" // Photos (base64)
        ]],
      },
    });

    // 2. Écrire les lignes de détail du devis (On ajoute le userId)
    const lignesValues = lignes.map((l: any) => [
      userId,
      numeroDevis,
      l.nomPrestation,
      l.quantite,
      l.unite,
      l.prixUnitaire,
      l.totalLigne.toFixed(2),
      l.tva || "20", // Colonne H
      l.isOptional ? "Oui" : "Non", // Colonne I
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Lignes_Devis!A:I", // On passe de A:G à A:I
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: lignesValues,
      },
    });

    // 3. Générer le PDF du devis
    const pdfBuffer = await generateDevisPDF({
      numeroDevis,
      date,
      client,
      isPro: user?.publicMetadata?.isPro === true,
        entreprise: { nom: entrepriseName, email: entrepriseEmail, telephone: entreprisePhone, adresse: entrepriseAddress, siret: entrepriseSiret, color: entrepriseColor, logo: entrepriseLogo, iban: entrepriseIban, bic: entrepriseBic, legal: entrepriseLegal, statut: entrepriseStatut, assurance: entrepriseAssurance },
      lignes,
      totalHT: totalHT.toFixed(2),
      tva: tvaLabel,
      totalTTC: totalTTC.toFixed(2),
      acompte: acompte ? acompte.toString() : "",
      remise: remise ? remise.toString() : "",
      photos: photos || [],
    });

    // 4. Envoyer le devis par email (si SMTP configuré)
    let emailSent = false;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendDevisEmail(client.email, client.nom, numeroDevis, totalTTC.toFixed(2), pdfBuffer);
        emailSent = true;
      } catch (emailErr) {
        console.error("Email non envoyé (SMTP non configuré ou erreur):", emailErr);
      }
    }

    return NextResponse.json({
      numeroDevis,
      date,
      client,
      totalHT: totalHT.toFixed(2),
      tva: tvaLabel,
      totalTTC: totalTTC.toFixed(2),
      acompte: acompte ? acompte.toString() : "",
      remise: remise ? remise.toString() : "",
      lignes,
      statut: "En attente",
      emailSent,
    });
  } catch (error) {
    console.error("Erreur POST devis:", error);
    return NextResponse.json({ error: "Impossible de créer le devis" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:Q", // A est mnt userId, Q = dateFin
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    const dataRows = rows.slice(1);
    
    // On ne garde que les devis du user connecté
    const myDevis = dataRows.filter((row) => row[0] === userId);

    const devis = myDevis.map((row) => ({
      numero: row[1] || "",
      date: row[2] || "",
      nomClient: row[3] || "",
      emailClient: row[4] || "",
      totalHT: row[5] || "",
      tva: row[6] || "",
      totalTTC: row[7] || "",
      statut: row[8] || "",
      lienPdf: row[9] || "",
      acompte: row[10] || "",
      remise: row[11] || "",
      lu_le: row[13] || "",
      dateDebut: row[15] || "",
      dateFin: row[16] || "",
    }));

    return NextResponse.json(devis, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Erreur GET devis:", error);
    return NextResponse.json({ error: "Impossible de récupérer les devis" }, { status: 500 });
  }
}
