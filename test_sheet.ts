import { getGoogleSheetsClient } from "./src/lib/googleSheets";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function test() {
  try {
    const sheets = await getGoogleSheetsClient();
    
    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:M",
    });
    
    const devisRows = devisRes.data.values || [];
    console.log("Total devis:", devisRows.length);
    if (devisRows.length > 0) {
      console.log("Header:", devisRows[0]);
    }
    const last = devisRows.slice(-3);
    last.forEach((r, i) => {
      console.log(`Devis ${i} columns:`, r);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
