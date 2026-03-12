import { getGoogleSheetsClient } from "@/lib/googleSheets";
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

    const body = await request.json();
    const { devisNumero, client, lignes, tva, totalHT, totalTTC } = body;

    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // 1. Vérifier si l'onglet "Factures_Emises" existe, sinon le créer
    let sheetExists = false;
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === "Factures_Emises") || false;
    } catch(e) {
      console.error("Erreur vérification onglets:", e);
    }

    if (!sheetExists) {
      try {
        // Créer l'onglet
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: { properties: { title: "Factures_Emises" } }
            }]
          }
        });
        
        // Ajouter la ligne d'en-tête
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Factures_Emises!A1:J1",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [["ID_Utilisateur", "Numéro", "Date", "Nom_Client", "Email_Client", "Total_HT", "TVA", "Total_TTC", "Statut", "Ref_Devis"]],
          },
        });
        console.log("Onglet Factures_Emises créé avec succès.");
      } catch (e) {
        console.error("Erreur création onglet Factures_Emises:", e);
      }
    }

    // 2. Générer le numéro de facture
    let count = 1;
    try {
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Factures_Emises!B:B",
      });
      count = existing.data.values?.length || 1;
    } catch (e) {
      console.error("Erreur lecture Factures_Emises:", e);
    }
    
    const year = new Date().getFullYear();
    const numeroFacture = `FAC-${year}-${String(count).padStart(3, "0")}`;
    const date = new Date().toLocaleDateString("fr-FR");

    // 3. Écrire l'en-tête de la facture dans Sheets
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Factures_Emises!A:J",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            userId,
            numeroFacture,
            date,
            client.nom,
            client.email,
            totalHT,
            tva,
            totalTTC,
            "Émise",
            devisNumero || "" // Référence au devis
          ]],
        },
      });
    } catch (e) {
      console.error("Erreur écriture Factures_Emises:", e);
    }

    // 3. Générer le PDF
    const pdfBuffer = await generateFacturePDF({
      numeroDevis: numeroFacture, // using same interface
      date,
      client,
      entreprise: { nom: entrepriseName, email: entrepriseEmail, telephone: entreprisePhone, adresse: entrepriseAddress, siret: entrepriseSiret, color: entrepriseColor, logo: entrepriseLogo, iban: entrepriseIban, bic: entrepriseBic, legal: entrepriseLegal },
      lignes,
      totalHT,
      tva,
      totalTTC,
    });

    // 4. Envoyer l'email de la facture
    let emailSent = false;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendDevisEmail(client.email, client.nom, numeroFacture, totalTTC, pdfBuffer);
        emailSent = true;
      } catch (emailErr) {
        console.error("Email non envoyé (SMTP non configuré ou erreur):", emailErr);
      }
    }

    return NextResponse.json({
      numeroFacture,
      date,
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

    const sheets = await getGoogleSheetsClient();
    
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Factures_Emises!A:J",
      });
    } catch (e) {
      return NextResponse.json([]); // Return empty if sheet doesn't exist
    }

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    const dataRows = rows.slice(1); // skip header
    const myFactures = dataRows.filter((row) => row[0] === userId);

    const factures = myFactures.map((row) => ({
      numero: row[1] || "",
      date: row[2] || "",
      nomClient: row[3] || "",
      emailClient: row[4] || "",
      totalHT: row[5] || "",
      tva: row[6] || "",
      totalTTC: row[7] || "",
      statut: row[8] || "",
      devisRef: row[9] || "",
    }));

    return NextResponse.json(factures);
  } catch (error) {
    console.error("Erreur GET factures:", error);
    return NextResponse.json({ error: "Impossible de récupérer les factures" }, { status: 500 });
  }
}
