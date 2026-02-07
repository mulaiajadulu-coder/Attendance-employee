require('dotenv').config();
const { KoreksiAbsensi } = require('./models');

const flushData = async () => {
    try {
        console.log('🧹 Membersihkan semua data koreksi yang nyangkut...');
        // Hapus semua data di tabel KoreksiAbsensi (Truncate)

        // DEBUG: Log DB_PASSWORD untuk memastikan nilainya string
        console.log('DEBUG DB_PASSWORD:', JSON.stringify(process.env.DB_PASSWORD));
        await KoreksiAbsensi.destroy({
            where: {},
            truncate: true // Reset ID auto-increment juga
        });
        console.log('✅ Tabel KoreksiAbsensi BERSIH.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal flush data:', error);
        process.exit(1);
    }
};

flushData();
