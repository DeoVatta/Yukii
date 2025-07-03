const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

let cachedDoc = null;

async function connectToSpreadsheet() {
  if (cachedDoc) return cachedDoc;

  try {
    const { SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;

    if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      throw new Error("❌ Missing required env variables (SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)");
    }

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

    await doc.useServiceAccountAuth({
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    console.log(`📊 Connected to spreadsheet: ${doc.title}`);

    cachedDoc = doc;
    return doc;
  } catch (err) {
    console.error('❌ Gagal konek ke Google Spreadsheet:', err);
    throw err;
  }
}
