// ✅ spreadsheetConnect.js — koneksi ke Google Spreadsheet tanpa bergantung pada file json
const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

let cachedDoc = null;

async function connectToSpreadsheet() {
  if (cachedDoc) return cachedDoc;

  try {
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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

async function tulisKeTransaksi({ tanggal, nama, nomor, pesan }) {
  const doc = await connectToSpreadsheet();
  const sheet = doc.sheetsByTitle['transaksi'];

  if (!sheet) throw new Error('❌ Sheet "transaksi" tidak ditemukan!');

  await sheet.addRow({
    Tanggal: tanggal,
    Nama: nama || '',
    Nomor: nomor,
    Pesan: pesan,
  });
}

async function deteksiKategori(pesan) {
  const doc = await connectToSpreadsheet();
  const sheet = doc.sheetsByTitle['kategori'];

  if (!sheet) throw new Error('❌ Sheet "kategori" tidak ditemukan!');

  await sheet.loadCells();
  const rows = await sheet.getRows();
  const teks = pesan.toLowerCase();

  for (const row of rows) {
    const tipe = row['tipe']?.toLowerCase();
    const kategori = row['kategori']?.trim();
    const kataKunci = row['kata_kunci']?.split(',') || [];

    if (!tipe || !kategori || kataKunci.length === 0) continue;

    for (const kata of kataKunci) {
      if (teks.includes(kata.trim().toLowerCase())) {
        return { tipe, kategori };
      }
    }
  }

  return { tipe: 'pengeluaran', kategori: 'Lainnya' };
}

// ✅ Export dengan benar
module.exports = {
  connectToSpreadsheet,
  tulisKeTransaksi,
  deteksiKategori,
};
