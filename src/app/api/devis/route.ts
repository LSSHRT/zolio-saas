import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { generateDevisPDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client, lignes, tva } = body;

    const sheets = await getGoogleSheetsClient();

    // Générer le numéro de devis
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:A",
    });
    const count = existing.data.values?.length || 1;
    const year = new Date().getFullYear();
    const numeroDevis = `DEV-${year}-${String(count).padStart(3, "0")}`;
    const date = new Date().toLocaleDateString("fr-FR");

    // Calculer les totaux
    const totalHT = lignes.reduce((sum: number, l: any) => sum + l.totalLigne, 0);
    const tauxTVA = parseFloat(tva) || 10;
    const totalTTC = totalHT * (1 + tauxTVA / 100);

    // 1. Écrire l'en-tête du devis
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:I",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          numeroDevis,
          date,
          client.nom,
          client.email,
          totalHT.toFixed(2),
          `${tauxTVA}%`,
          totalTTC.toFixed(2),
          "En attente",
          "" // Lien PDF (sera rempli plus tard)
        ]],
      },
    });

    // 2. Écrire les lignes de détail du devis
    const lignesValues = lignes.map((l: any) => [
      numeroDevis,
      l.nomPrestation,
      l.quantite,
      l.unite,
      l.prixUnitaire,
      l.totalLigne.toFixed(2),
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Lignes_Devis!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: lignesValues,
      },
    });

    // 3. Générer le PDF du devis
    const pdfBuffer = generateDevisPDF({
      numeroDevis,
      date,
      client,
      lignes,
      totalHT: totalHT.toFixed(2),
      tva: `${tauxTVA}%`,
      totalTTC: totalTTC.toFixed(2),
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
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:I",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    const dataRows = rows.slice(1);
    const devis = dataRows.map((row) => ({
      numero: row[0] || "",
      date: row[1] || "",
      nomClient: row[2] || "",
      emailClient: row[3] || "",
      totalHT: row[4] || "",
      tva: row[5] || "",
      totalTTC: row[6] || "",
      statut: row[7] || "",
      lienPdf: row[8] || "",
    }));

    return NextResponse.json(devis);
  } catch (error) {
    console.error("Erreur GET devis:", error);
    return NextResponse.json({ error: "Impossible de récupérer les devis" }, { status: 500 });
  }
}
