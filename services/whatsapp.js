const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const { tulisKeTransaksi, deteksiKategori } = require('../config/spreadsheetConnect');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
  });

  // 🔁 Handle QR dan koneksi
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📸 Scan QR untuk login WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('❌ WhatsApp disconnected. Reconnect:', shouldReconnect);
      if (shouldReconnect) startWhatsApp();
    } else if (connection === 'open') {
      console.log('✅ WhatsApp terhubung!');
    }
  });

  // 📩 Handle pesan masuk
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const name = msg.pushName || '';

    console.log(`📨 Pesan dari ${from}: ${text}`);

    // ✍️ Simpan ke Google Sheet
    try {
      const kategoriHasil = await deteksiKategori(text);
      await tulisKeTransaksi({
        tanggal: new Date().toISOString(),
        nama: name,
        nomor: from,
        pesan: text + ` [${kategoriHasil.tipe} - ${kategoriHasil.kategori}]`,
      });
      console.log(`✅ Pesan dicatat dengan kategori: ${kategoriHasil.tipe} - ${kategoriHasil.kategori}`);
    } catch (err) {
      console.error('⚠️ Gagal mencatat ke spreadsheet:', err.message);
    }

    // 💬 Respon otomatis
    if (text?.toLowerCase() === 'halo') {
      await sock.sendMessage(from, { text: 'Hai juga! Aku Yukii 🤖' });
    }
  });

  // 💾 Simpan sesi login
  sock.ev.on('creds.update', saveCreds);
}

module.exports = startWhatsApp;
