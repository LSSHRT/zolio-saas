const { google } = require("googleapis");
require("dotenv").config({ path: ".env.local" });

async function test() {
  const authClient = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth: authClient });
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const hasDepenses = meta.data.sheets?.some(s => s.properties?.title === "Dépenses");
    console.log("Has Depenses:", hasDepenses);
    
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Dépenses!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "DEP-123",
          "user_123",
          "2023-10-10",
          "Test description",
          100.50,
          20.10,
          "Autre"
        ]],
      },
    });
    console.log("Append result:", res.data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
