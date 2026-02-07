// update_penempatan_store.js
// Script untuk update penempatan_store user HR001
require('dotenv').config();
const { User } = require('./models');

async function updateStore() {
  try {
    const user = await User.findOne({ where: { nik: 'HR001' } });
    if (!user) throw new Error('User HR001 tidak ditemukan');
    user.penempatan_store = 'DefaultStore'; // Ganti sesuai kebutuhan
    await user.save();
    console.log('✅ penempatan_store HR001 diupdate:', user.penempatan_store);
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal update penempatan_store:', err);
    process.exit(1);
  }
}

updateStore();
