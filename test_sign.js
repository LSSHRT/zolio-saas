require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const devisRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Devis_Emis!A:M',
  });
  
  const devisRows = devisRes.data.values || [];
  console.log("Total rows:", devisRows.length);
  devisRows.forEach((r, i) => {
    if(i === 0 || i === devisRows.length - 1) {
      console.log(`Row ${i}: numero=${r[1]}, statut=${r[8]}`);
    }
  });
}

main().catch(console.error);
