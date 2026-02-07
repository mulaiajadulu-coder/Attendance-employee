// test_all_features.js
// Script otomatis uji semua fitur utama (bawahan & atasan)
// Jalankan dari folder backend: node src/test_all_features.js

require('dotenv').config();
const API_URL = 'http://localhost:3000/api';

const fetch = global.fetch || require('node-fetch');

async function main() {
  try {
    console.log('🚀 MULAI UJI OTOMATIS SEMUA FITUR');

    // Helper
    const post = async (url, body, token) => {
      try {
        const res = await fetch(API_URL + url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(body)
        });
        let data;
        try {
          data = await res.json();
        } catch (e) {
          const text = await res.text();
          console.error(`❌ [${url}] Gagal parse JSON. Response mentah:`, text);
          data = { error: 'Invalid JSON', raw: text };
        }
        return { status: res.status, data };
      } catch (err) {
        console.error(`❌ [${url}] Fetch error:`, err);
        return { status: 0, data: { error: err.message } };
      }
    };
    const get = async (url, token) => {
      try {
        const res = await fetch(API_URL + url, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        });
        let data;
        try {
          data = await res.json();
        } catch (e) {
          const text = await res.text();
          console.error(`❌ [${url}] Gagal parse JSON. Response mentah:`, text);
          data = { error: 'Invalid JSON', raw: text };
        }
        return { status: res.status, data };
      } catch (err) {
        console.error(`❌ [${url}] Fetch error:`, err);
        return { status: 0, data: { error: err.message } };
      }
    };

    // Helper delay antar request
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Login sebagai EMP001 (karyawan)

    // Helper untuk ambil token dari response
    const extractToken = (data) => {
      if (data.token) return data.token;
      if (data.data && data.data.token) return data.data.token;
      return null;
    };

    let res = await post('/auth/login', { nik: 'EMP001', password: '123456' });
    let tokenEmp = extractToken(res.data);
    if (!tokenEmp) throw new Error('Login EMP001 gagal: ' + JSON.stringify(res.data));
    console.log('✅ Login EMP001 OK');

    // 2. Login sebagai MGR001 (atasan)
    res = await post('/auth/login', { nik: 'MGR001', password: '123456' });
    let tokenMgr = extractToken(res.data);
    if (!tokenMgr) throw new Error('Login MGR001 gagal: ' + JSON.stringify(res.data));
    console.log('✅ Login MGR001 OK');

    // 3. Login sebagai HR001 (HR)
    res = await post('/auth/login', { nik: 'HR001', password: 'hr123' });
    let tokenHR = extractToken(res.data);
    if (!tokenHR) throw new Error('Login HR001 gagal: ' + JSON.stringify(res.data));
    console.log('✅ Login HR001 OK');

    // 4. Uji absensi harian (EMP001)
    // Check-in
    let checkin = await post('/absensi/masuk', { foto: 'base64_mock', lokasi: '-6.2,106.8' }, tokenEmp);
    console.log('Check-in:', checkin.data.message || checkin.data.error?.message);
    await delay(500);
    // Double check-in (harus gagal)
    let doubleIn = await post('/absensi/masuk', { foto: 'base64_mock', lokasi: '-6.2,106.8' }, tokenEmp);
    console.log('Double Check-in:', doubleIn.data.message || doubleIn.data.error?.message);
    await delay(500);
    // Check-out
    let checkout = await post('/absensi/pulang', { foto: 'base64_mock', lokasi: '-6.2,106.8' }, tokenEmp);
    console.log('Check-out:', checkout.data.message || checkout.data.error?.message);
    await delay(500);
    // Double check-out (harus gagal)
    let doubleOut = await post('/absensi/pulang', { foto: 'base64_mock', lokasi: '-6.2,106.8' }, tokenEmp);
    console.log('Double Check-out:', doubleOut.data.message || doubleOut.data.error?.message);
    await delay(500);

    // 5. Ajukan koreksi absensi (EMP001)
    let koreksi = await post('/koreksi-absensi/ajukan', {
      absensi_id: 1, // Ganti dengan id absensi yang valid jika perlu
      jenis_koreksi: 'lupa_absen_pulang',
      jam_pulang_usulan: '17:00:00',
      alasan: 'Lupa absen pulang',
    }, tokenEmp);
    console.log('Ajukan Koreksi:', koreksi.data.message || koreksi.data.error?.message);

    // 6. Approve koreksi (MGR001)
    let pendingKoreksi = await get('/koreksi-absensi/pending', tokenMgr);
    if (pendingKoreksi.data && pendingKoreksi.data.length > 0) {
      let approve = await post(`/koreksi-absensi/approve`, {
        koreksi_id: pendingKoreksi.data[0].id,
        action: 'approve',
        catatan: 'OK',
      }, tokenMgr);
      console.log('Approve Koreksi:', approve.data.message || approve.data.error?.message);
    } else {
      console.log('Tidak ada koreksi pending untuk di-approve');
    }

    // 7. Ajukan cuti (EMP001)
    let cuti = await post('/cuti/ajukan', {
      jenis_cuti: 'tahunan',
      tanggal_mulai: '2026-02-10',
      tanggal_selesai: '2026-02-12',
      alasan: 'Keperluan keluarga',
    }, tokenEmp);
    console.log('Ajukan Cuti:', cuti.data.message || cuti.data.error?.message);

    // 8. Approve cuti (MGR001)
    let pendingCuti = await get('/cuti/pending', tokenMgr);
    if (pendingCuti.data && pendingCuti.data.length > 0) {
      let approveCuti = await post(`/cuti/approve`, {
        cuti_id: pendingCuti.data[0].id,
        action: 'approve',
        catatan: 'OK',
      }, tokenMgr);
      console.log('Approve Cuti:', approveCuti.data.message || approveCuti.data.error?.message);
    } else {
      console.log('Tidak ada cuti pending untuk di-approve');
    }

    // 9. Cek slip gaji (EMP001)
    let slip = await get('/slip-gaji/my-slip', tokenEmp);
    console.log('Slip Gaji:', slip.data && slip.data.length ? 'Ada slip' : 'Tidak ada slip');

    // 10. Cek dashboard (EMP001, MGR001, HR001)
    let dashEmp = await get('/dashboard', tokenEmp);
    let dashMgr = await get('/dashboard', tokenMgr);
    let dashHR = await get('/dashboard/hr', tokenHR);
    console.log('Dashboard EMP:', dashEmp.data ? 'OK' : 'Gagal');
    console.log('Dashboard MGR:', dashMgr.data ? 'OK' : 'Gagal');
    console.log('Dashboard HR:', dashHR.data ? 'OK' : 'Gagal');

    // Skenario: HR001 coba akses monitoring/statistik (dashboard khusus HR)
    let monitoringHR = await get('/dashboard/hr', tokenHR);
    if (monitoringHR.status === 200 && monitoringHR.data && monitoringHR.data.success) {
      console.log('✅ HR001 bisa akses monitoring/statistik HR.');
    } else if (monitoringHR.status === 403 || monitoringHR.status === 401) {
      console.log('❌ HR001 TIDAK BISA akses monitoring/statistik (FORBIDDEN)');
    } else {
      console.log('❌ HR001 monitoring/statistik error:', monitoringHR.data?.error || monitoringHR);
    }

    // 11. Cek notifikasi (EMP001, MGR001)
    let notifEmp = await get('/notifications', tokenEmp);
    let notifMgr = await get('/notifications', tokenMgr);
    console.log('Notifikasi EMP:', notifEmp.data ? 'OK' : 'Gagal');
    console.log('Notifikasi MGR:', notifMgr.data ? 'OK' : 'Gagal');

    console.log('✨ SEMUA UJI FITUR SELESAI!');
    process.exit(0);
  } catch (err) {
    console.error('❌ ERROR UJI FITUR:', err);
    process.exit(1);
  }
}

main();
