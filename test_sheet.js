require("dotenv").config({ path: ".env.local" });
const { google } = require("googleapis");

async function test() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:M",
    });
    
    const devisRows = devisRes.data.values || [];
    console.log("Total devis:", devisRows.length);
    console.log("Header:", devisRows[0]);
    // List the last 5 devis
    const last = devisRows.slice(-5);
    last.forEach((r, i) => {
      console.log(`Devis ${i}: Numero=${r[1]}, Statut=${r[8]}, SignLength=${r[12] ? r[12].length : 0}`);
    });
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
