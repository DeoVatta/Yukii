// index.js
require('dotenv').config();
const path = require('path');
const connectToSpreadsheet = require('./config/spreadsheetConnect');
const startWhatsApp = require('./services/whatsapp');

// 🕒 Timestamp log startup
console.log(`\n🚀 Yukii bot mulai dijalankan pada: ${new Date().toLocaleString()}\n`);

(async () => {
  // ===================== 📊 CONNECT TO SPREADSHEET =====================
  try {
    const doc = await connectToSpreadsheet();

    console.log('\n📄 Daftar Sheet dalam Spreadsheet:');
    doc.sheetsByIndex.forEach((sheet, i) => {
      console.log(`👉 [${i}] ${sheet.title} (${sheet.rowCount} baris)`);
    });

    console.log('\n✅ Yukii siap terkoneksi dengan Spreadsheet!');
  } catch (err) {
    console.error('❌ Gagal menghubungkan Yukii ke Spreadsheet:', err.message);
    process.exit(1); // ❗ Stop jika spreadsheet gagal konek
  }

  // ===================== 📲 CONNECT TO WHATSAPP =====================
  try {
    await startWhatsApp();
    console.log('📲 Yukii siap menerima pesan WhatsApp!\n');
  } catch (err) {
    console.error('❌ Gagal menjalankan koneksi WhatsApp:', err.message);
    process.exit(1); // ❗ Stop jika WhatsApp gagal jalan
  }
})();
