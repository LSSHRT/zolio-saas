import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { generateDevisPDF } from "@/lib/generatePdf";
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

    const body = await request.json();
    const { client, lignes, tva, acompte } = body;

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
    const totalHT = lignes.reduce((sum: number, l: any) => sum + l.totalLigne, 0);
    const tauxTVA = parseFloat(tva) || 10;
    const totalTTC = totalHT * (1 + tauxTVA / 100);

    // 1. Écrire l'en-tête du devis (On ajoute le userId en 1er)
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:K", // On passe de A:I à A:J
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          userId,
          numeroDevis,
          date,
          client.nom,
          client.email,
          totalHT.toFixed(2),
          `${tauxTVA}%`,
          totalTTC.toFixed(2),
          "En attente",
          "", // Lien PDF
          acompte ? acompte.toString() : "" // Acompte (%)
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
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Lignes_Devis!A:G", // On passe de A:F à A:G
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
        entreprise: { nom: entrepriseName, email: entrepriseEmail, telephone: entreprisePhone, adresse: entrepriseAddress, siret: entrepriseSiret, color: entrepriseColor, logo: entrepriseLogo, iban: entrepriseIban, bic: entrepriseBic, legal: entrepriseLegal },
      lignes,
      totalHT: totalHT.toFixed(2),
      tva: `${tauxTVA}%`,
      totalTTC: totalTTC.toFixed(2),
      acompte: acompte ? acompte.toString() : "",
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
      tva: `${tauxTVA}%`,
      totalTTC: totalTTC.toFixed(2),
      acompte: acompte ? acompte.toString() : "",
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
      range: "Devis_Emis!A:K", // A est mnt userId
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
    }));

    return NextResponse.json(devis);
  } catch (error) {
    console.error("Erreur GET devis:", error);
    return NextResponse.json({ error: "Impossible de récupérer les devis" }, { status: 500 });
  }
}
