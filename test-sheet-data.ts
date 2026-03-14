import { getGoogleSheetsClient } from "./src/lib/googleSheets";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function check() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  
  const clientsRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Clients!A:G" });
  console.log("Clients:", clientsRes.data.values?.slice(1, 5));

  const devisRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Devis_Emis!A:Q" });
  console.log("Devis:", devisRes.data.values?.slice(0, 3));
}

check();