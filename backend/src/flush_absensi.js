// flush_absensi.js
// Script untuk reset data absensi harian user test (EMP001)
require('dotenv').config();
const { Absensi, User } = require('./models');

async function flushAbsensi() {
  try {
    const user = await User.findOne({ where: { nik: 'EMP001' } });
    if (!user) throw new Error('User EMP001 tidak ditemukan');
    const deleted = await Absensi.destroy({ where: { user_id: user.id } });
    console.log(`✅ Data absensi untuk EMP001 dihapus (${deleted} record)`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal reset absensi:', err);
    process.exit(1);
  }
}

flushAbsensi();
