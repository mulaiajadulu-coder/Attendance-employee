# Business Process Flow & Use Cases

## 🔄 Alur Bisnis Proses Detail

### 1. PROSES ABSENSI HARIAN

#### A. Happy Path - Absensi Normal
```
┌─────────────────────────────────────────────────────────────┐
│ PAGI HARI                                                   │
└─────────────────────────────────────────────────────────────┘

Karyawan datang kantor (08:00)
    ↓
Buka aplikasi → Klik "Absen Masuk"
    ↓
Sistem:
  ✓ Cek apakah sudah absen hari ini? → Belum
  ✓ Ambil shift default user (Regular: 08:00-17:00, toleransi 15 menit)
  ✓ Catat timestamp: 08:00
  ✓ Bandingkan dengan jam_masuk shift + toleransi
  ✓ 08:00 <= 08:15 → status_terlambat = FALSE
  ✓ menit_terlambat = 0
  ✓ Simpan record absensi_harian
    ↓
Response: "Absen masuk berhasil! Tepat waktu ✓"

┌─────────────────────────────────────────────────────────────┐
│ SORE HARI                                                   │
└─────────────────────────────────────────────────────────────┘

Karyawan selesai kerja (17:05)
    ↓
Buka aplikasi → Klik "Absen Pulang"
    ↓
Sistem:
  ✓ Cek record absensi hari ini → Ada
  ✓ Cek jam_pulang → NULL (belum absen pulang)
  ✓ Catat timestamp: 17:05
  ✓ Hitung total_jam_kerja = 17:05 - 08:00 = 9.08 jam
  ✓ Update record absensi_harian
    ↓
Response: "Absen pulang berhasil! Total jam kerja: 9.08 jam"
```

---

#### B. Scenario - Karyawan Terlambat
```
Karyawan datang kantor (08:25)
    ↓
Klik "Absen Masuk"
    ↓
Sistem:
  ✓ Shift: 08:00-17:00, toleransi 15 menit
  ✓ Batas toleransi: 08:15
  ✓ Jam masuk aktual: 08:25
  ✓ 08:25 > 08:15 → status_terlambat = TRUE
  ✓ menit_terlambat = 25 - 15 = 10 menit
  ✓ Simpan record
    ↓
Response: "Absen masuk berhasil. Anda terlambat 10 menit ⚠️"
    ↓
Notifikasi ke atasan: "John Doe terlambat 10 menit hari ini"
```

---

#### C. Scenario - Lupa Absen Pulang
```
┌─────────────────────────────────────────────────────────────┐
│ HARI H (31 Jan)                                             │
└─────────────────────────────────────────────────────────────┘

Karyawan absen masuk (08:00) ✓
Karyawan lupa absen pulang ✗
    ↓
Jam 23:59 → Cron Job berjalan
    ↓
Sistem cek semua absensi hari ini:
  - user_id: 123
  - jam_masuk: 08:00
  - jam_pulang: NULL ← Belum absen pulang!
    ↓
Sistem auto-generate:
  - jam_pulang = shift.jam_pulang (17:00)
  - total_jam_kerja = 17:00 - 08:00 = 9 jam
  - catatan = "Auto-generated: Lupa absen pulang"
  - Tandai untuk review
    ↓
Kirim notifikasi ke karyawan:
  "Anda lupa absen pulang kemarin. Jika jam pulang tidak sesuai, 
   silakan ajukan koreksi absensi."

┌─────────────────────────────────────────────────────────────┐
│ HARI H+1 (1 Feb)                                            │
└─────────────────────────────────────────────────────────────┘

Karyawan buka aplikasi → Lihat notifikasi
    ↓
Karyawan: "Saya pulang jam 18:00, bukan 17:00"
    ↓
Klik "Ajukan Koreksi Absensi"
    ↓
[Lanjut ke PROSES KOREKSI ABSENSI]
```

---

#### D. Scenario - Absen di Hari Libur
```
Tanggal: 17 Agustus 2026 (Hari Kemerdekaan)
    ↓
Karyawan coba absen masuk
    ↓
Sistem:
  ✓ Cek tabel hari_libur untuk tanggal 17 Agustus 2026
  ✓ Found: "Hari Kemerdekaan RI" (jenis: nasional)
    ↓
Response: "Hari ini adalah hari libur nasional. 
           Absensi tidak diperlukan."
    ↓
[Optional] Jika perusahaan allow lembur di hari libur:
  → Tampilkan opsi "Absen sebagai Lembur"
  → Jika dipilih, catat dengan status khusus
```

---

#### E. Scenario - Karyawan Sedang Cuti
```
Tanggal: 10 Feb 2026
Karyawan memiliki cuti approved untuk 10-12 Feb 2026
    ↓
Cron Job jam 00:01:
  ✓ Cek semua cuti yang approved untuk hari ini
  ✓ Found: user_id 123, cuti 10-12 Feb
  ✓ Auto-generate record absensi_harian:
      - tanggal: 10 Feb 2026
      - status_hadir: 'cuti'
      - jam_masuk: NULL
      - jam_pulang: NULL
      - total_jam_kerja: 0
      - is_locked: FALSE (bisa di-override jika cuti dibatalkan)
    ↓
Jika karyawan coba absen:
  → Response: "Anda sedang cuti hari ini. Tidak perlu absen."
```

---

### 2. PROSES PENGAJUAN CUTI

#### A. Happy Path - Cuti Disetujui
```
┌─────────────────────────────────────────────────────────────┐
│ KARYAWAN                                                    │
└─────────────────────────────────────────────────────────────┘

Karyawan buka menu "Cuti" → Klik "Ajukan Cuti"
    ↓
Form pengajuan:
  - Jenis Cuti: Tahunan
  - Tanggal Mulai: 10 Feb 2026
  - Tanggal Selesai: 12 Feb 2026
  - Alasan: "Keperluan keluarga"
  - Upload dokumen (optional)
    ↓
Klik "Ajukan"
    ↓
Sistem validasi:
  ✓ Tanggal mulai <= tanggal selesai? → YES
  ✓ Cek overlap dengan cuti lain yang approved? → NO
  ✓ Hitung total hari (exclude weekend & hari libur):
      10 Feb (Senin), 11 Feb (Selasa), 12 Feb (Rabu) = 3 hari
  ✓ Cek kuota cuti tahunan:
      Total: 12 hari, Terpakai: 5 hari, Sisa: 7 hari
      3 hari <= 7 hari? → YES ✓
  ✓ Simpan dengan status_approval = 'pending'
    ↓
Response: "Pengajuan cuti berhasil. Menunggu approval atasan."
    ↓
Kirim notifikasi ke atasan:
  "John Doe mengajukan cuti tahunan 10-12 Feb 2026 (3 hari)"

┌─────────────────────────────────────────────────────────────┐
│ ATASAN                                                      │
└─────────────────────────────────────────────────────────────┘

Atasan buka dashboard → Lihat "Pending Approval (3)"
    ↓
Klik tab "Cuti" → Lihat detail pengajuan:
  - Nama: John Doe
  - Jenis: Cuti Tahunan
  - Tanggal: 10-12 Feb 2026 (3 hari)
  - Alasan: "Keperluan keluarga"
  - Sisa kuota: 7 hari
    ↓
Atasan review → Klik "Approve"
    ↓
Sistem:
  ✓ Update status_approval = 'approved'
  ✓ Catat approved_by = atasan_id
  ✓ Catat approved_at = timestamp
  ✓ Generate record absensi_harian untuk 10-12 Feb:
      - status_hadir = 'cuti'
      - jam_masuk = NULL
      - jam_pulang = NULL
    ↓
Kirim notifikasi ke karyawan:
  "Pengajuan cuti Anda untuk 10-12 Feb 2026 telah disetujui ✓"
```

---

#### B. Scenario - Cuti Ditolak
```
Atasan review pengajuan cuti
    ↓
Atasan: "Tim sedang sibuk, tidak bisa approve"
    ↓
Klik "Reject" → Input alasan: "Tim sedang ada project deadline"
    ↓
Sistem:
  ✓ Update status_approval = 'rejected'
  ✓ Catat catatan_approval
  ✓ Catat approved_by & approved_at
    ↓
Kirim notifikasi ke karyawan:
  "Pengajuan cuti Anda untuk 10-12 Feb 2026 ditolak.
   Alasan: Tim sedang ada project deadline"
```

---

#### C. Scenario - Kuota Cuti Tidak Cukup
```
Karyawan ajukan cuti 10 hari
    ↓
Sistem validasi:
  ✓ Sisa kuota: 7 hari
  ✓ Pengajuan: 10 hari
  ✓ 10 > 7 → FAILED ✗
    ↓
Response: "Kuota cuti tidak mencukupi. 
           Sisa kuota Anda: 7 hari, Pengajuan: 10 hari"
```

---

### 3. PROSES KOREKSI ABSENSI

#### A. Happy Path - Koreksi Lupa Absen Pulang
```
┌─────────────────────────────────────────────────────────────┐
│ KARYAWAN                                                    │
└─────────────────────────────────────────────────────────────┘

Karyawan buka "Riwayat Absensi"
    ↓
Lihat tanggal 31 Jan:
  - Jam Masuk: 08:00
  - Jam Pulang: 17:00 (auto-generated)
  - Catatan: "Auto-generated: Lupa absen pulang"
    ↓
Karyawan: "Saya pulang jam 18:00, bukan 17:00"
    ↓
Klik "Ajukan Koreksi"
    ↓
Form koreksi:
  - Jenis Koreksi: Lupa absen pulang
  - Jam Pulang Usulan: 18:00
  - Alasan: "Saya lupa absen pulang karena buru-buru. 
             Saya pulang jam 18:00 setelah selesai meeting."
  - Upload bukti (optional): Screenshot email meeting
    ↓
Klik "Ajukan"
    ↓
Sistem validasi:
  ✓ Absensi exists? → YES
  ✓ Absensi locked? → NO
  ✓ Ada koreksi pending untuk absensi ini? → NO
  ✓ Simpan dengan status_approval = 'pending'
    ↓
Response: "Pengajuan koreksi berhasil. Menunggu approval."
    ↓
Kirim notifikasi ke atasan/HR:
  "John Doe mengajukan koreksi absensi untuk 31 Jan 2026"

┌─────────────────────────────────────────────────────────────┐
│ ATASAN / HR                                                 │
└─────────────────────────────────────────────────────────────┘

Atasan buka "Pending Approval" → Tab "Koreksi Absensi (2)"
    ↓
Lihat detail:
  - Nama: John Doe
  - Tanggal: 31 Jan 2026
  - Jenis: Lupa absen pulang
  - Data Saat Ini:
      Jam Masuk: 08:00
      Jam Pulang: 17:00 (auto-generated)
      Total Jam: 9 jam
  - Usulan Koreksi:
      Jam Pulang: 18:00
      Total Jam (baru): 10 jam
  - Alasan: "Lupa absen pulang karena buru-buru..."
  - Bukti: [Screenshot meeting]
    ↓
Atasan review bukti → Klik "Approve"
    ↓
Sistem:
  ✓ Update record absensi_harian:
      - jam_pulang = 18:00
      - total_jam_kerja = 10 jam
      - Recalculate status_terlambat (jika perlu)
  ✓ Update koreksi_absensi:
      - status_approval = 'approved'
      - approved_by = atasan_id
      - approved_at = timestamp
  ✓ Log ke audit_log:
      - action: "koreksi_absensi_approved"
      - old_value: {"jam_pulang": "17:00", "total_jam_kerja": 9}
      - new_value: {"jam_pulang": "18:00", "total_jam_kerja": 10}
    ↓
Kirim notifikasi ke karyawan:
  "Koreksi absensi Anda untuk 31 Jan 2026 telah disetujui ✓"
```

---

#### B. Scenario - Koreksi Ditolak
```
Atasan review koreksi
    ↓
Atasan: "Bukti tidak cukup valid"
    ↓
Klik "Reject" → Input alasan: "Bukti yang dilampirkan tidak valid"
    ↓
Sistem:
  ✓ Update status_approval = 'rejected'
  ✓ Absensi tetap tidak berubah
  ✓ Catat alasan reject
    ↓
Kirim notifikasi ke karyawan:
  "Koreksi absensi Anda untuk 31 Jan 2026 ditolak.
   Alasan: Bukti yang dilampirkan tidak valid"
```

---

### 4. PROSES GENERATE SLIP GAJI

#### A. Happy Path - Generate Slip Gaji Bulanan
```
┌─────────────────────────────────────────────────────────────┐
│ HR/ADMIN (Awal Bulan Februari)                             │
└─────────────────────────────────────────────────────────────┘

HR buka menu "Slip Gaji" → Klik "Generate Slip Gaji"
    ↓
Form:
  - Periode Bulan: Januari
  - Periode Tahun: 2026
  - Karyawan: [Semua Karyawan] atau pilih spesifik
    ↓
Klik "Generate"
    ↓
Sistem processing (background job):

FOR EACH karyawan:
  ┌─────────────────────────────────────────────┐
  │ 1. QUERY DATA ABSENSI                       │
  └─────────────────────────────────────────────┘
  Query: SELECT * FROM absensi_harian 
         WHERE user_id = ? 
         AND MONTH(tanggal) = 1 
         AND YEAR(tanggal) = 2026
  
  ┌─────────────────────────────────────────────┐
  │ 2. HITUNG STATISTIK                         │
  └─────────────────────────────────────────────┘
  - Total hari kerja = 22 hari (exclude weekend & libur)
  - Total hari hadir = COUNT(status_hadir = 'hadir') = 20
  - Total hari alpha = COUNT(status_hadir = 'alpha') = 1
  - Total hari cuti = COUNT(status_hadir = 'cuti') = 1
  - Total jam kerja = SUM(total_jam_kerja) = 180.5 jam
  - Total terlambat = COUNT(status_terlambat = TRUE) = 3
  - Total menit terlambat = SUM(menit_terlambat) = 30 menit
  
  ┌─────────────────────────────────────────────┐
  │ 3. HITUNG GAJI                              │
  └─────────────────────────────────────────────┘
  - Gaji pokok = 8.000.000 (dari master user)
  - Tunjangan = 1.000.000
  - Potongan umum = 500.000
  - Potongan terlambat = (30 menit / 60) * rate_per_jam
                       = 0.5 * 100.000 = 50.000
  - Potongan alpha = 1 hari * (gaji_pokok / total_hari_kerja)
                   = 1 * (8.000.000 / 22) = 363.636
  
  Total Gaji Bersih = Gaji Pokok + Tunjangan 
                    - Potongan - Potongan Terlambat - Potongan Alpha
                    = 8.000.000 + 1.000.000 
                    - 500.000 - 50.000 - 363.636
                    = 8.086.364
  
  ┌─────────────────────────────────────────────┐
  │ 4. SIMPAN SLIP GAJI                         │
  └─────────────────────────────────────────────┘
  INSERT INTO slip_gaji (
    user_id, periode_bulan, periode_tahun,
    gaji_pokok, tunjangan, potongan,
    total_hari_kerja, total_hari_hadir, total_hari_alpha,
    total_jam_kerja, total_terlambat, potongan_terlambat,
    total_gaji_bersih, status, generated_by
  ) VALUES (...)
  
  Status = 'draft' (belum dipublish)

END FOR
    ↓
Response: "Slip gaji berhasil di-generate untuk 100 karyawan"

┌─────────────────────────────────────────────────────────────┐
│ HR REVIEW & PUBLISH                                         │
└─────────────────────────────────────────────────────────────┘

HR review semua slip gaji (status = 'draft')
    ↓
Jika ada yang perlu dikoreksi:
  → Edit manual (tunjangan, potongan khusus, dll)
    ↓
Jika sudah OK semua → Klik "Publish Semua"
    ↓
Sistem:
  FOR EACH slip_gaji WHERE status = 'draft':
    ✓ Update status = 'published'
    ✓ Lock semua absensi di periode tersebut:
        UPDATE absensi_harian 
        SET is_locked = TRUE
        WHERE MONTH(tanggal) = 1 AND YEAR(tanggal) = 2026
    ↓
Kirim notifikasi ke semua karyawan:
  "Slip gaji Januari 2026 Anda sudah tersedia. Silakan cek aplikasi."

┌─────────────────────────────────────────────────────────────┐
│ KARYAWAN                                                    │
└─────────────────────────────────────────────────────────────┘

Karyawan buka menu "Slip Gaji"
    ↓
Lihat list slip gaji:
  - Januari 2026 (Published) ✓
  - Desember 2025 (Published) ✓
    ↓
Klik "Januari 2026" → Lihat detail slip gaji
    ↓
Klik "Download PDF" → Download slip gaji dalam format PDF
```

---

## 🎯 Use Case Diagram

### Actor: KARYAWAN
```
┌─────────────────────────────────────────────────────────────┐
│ KARYAWAN                                                    │
├─────────────────────────────────────────────────────────────┤
│ ✓ Login                                                     │
│ ✓ Absen Masuk                                               │
│ ✓ Absen Pulang                                              │
│ ✓ Lihat Riwayat Absensi Sendiri                            │
│ ✓ Ajukan Cuti                                               │
│ ✓ Lihat Status Cuti                                         │
│ ✓ Ajukan Koreksi Absensi                                    │
│ ✓ Lihat Slip Gaji Sendiri                                   │
│ ✓ Download Slip Gaji PDF                                    │
│ ✓ Lihat Notifikasi                                          │
│ ✓ Update Profil                                             │
│ ✓ Ganti Password                                            │
└─────────────────────────────────────────────────────────────┘
```

### Actor: ATASAN
```
┌─────────────────────────────────────────────────────────────┐
│ ATASAN (inherit dari KARYAWAN + tambahan)                  │
├─────────────────────────────────────────────────────────────┤
│ ✓ Semua fitur KARYAWAN                                      │
│ ✓ Lihat Absensi Tim                                         │
│ ✓ Lihat Statistik Kehadiran Tim                             │
│ ✓ Approve/Reject Cuti Tim                                   │
│ ✓ Approve/Reject Koreksi Absensi Tim                        │
│ ✓ Lihat Slip Gaji Tim                                       │
│ ✓ Export Laporan Kehadiran Tim                              │
└─────────────────────────────────────────────────────────────┘
```

### Actor: HR/ADMIN
```
┌─────────────────────────────────────────────────────────────┐
│ HR/ADMIN (full access)                                      │
├─────────────────────────────────────────────────────────────┤
│ ✓ Semua fitur ATASAN                                        │
│ ✓ Kelola User (CRUD)                                        │
│ ✓ Kelola Departemen (CRUD)                                  │
│ ✓ Kelola Shift Kerja (CRUD)                                 │
│ ✓ Kelola Hari Libur (CRUD)                                  │
│ ✓ Lihat Semua Absensi                                       │
│ ✓ Approve/Reject Semua Cuti                                 │
│ ✓ Approve/Reject Semua Koreksi Absensi                      │
│ ✓ Generate Slip Gaji Bulanan                                │
│ ✓ Publish Slip Gaji                                         │
│ ✓ Lihat Semua Slip Gaji                                     │
│ ✓ Export Laporan (Kehadiran, Cuti, Jam Kerja, dll)         │
│ ✓ Lihat Audit Log                                           │
│ ✓ Dashboard Analytics                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 State Diagram

### State: ABSENSI HARIAN
```
┌─────────────┐
│   CREATED   │ (Record dibuat, jam_masuk = NULL, jam_pulang = NULL)
└──────┬──────┘
       │
       │ [Karyawan absen masuk]
       ↓
┌─────────────┐
│ CHECKED_IN  │ (jam_masuk filled, jam_pulang = NULL)
└──────┬──────┘
       │
       │ [Karyawan absen pulang]
       ↓
┌─────────────┐
│ COMPLETED   │ (jam_masuk & jam_pulang filled)
└──────┬──────┘
       │
       │ [Slip gaji di-publish]
       ↓
┌─────────────┐
│   LOCKED    │ (is_locked = TRUE, tidak bisa diubah)
└─────────────┘
```

### State: CUTI
```
┌─────────────┐
│   PENDING   │ (Menunggu approval)
└──────┬──────┘
       │
       ├─────[Atasan approve]────→ ┌──────────┐
       │                            │ APPROVED │
       │                            └──────────┘
       │
       └─────[Atasan reject]─────→ ┌──────────┐
                                    │ REJECTED │
                                    └──────────┘
```

### State: KOREKSI ABSENSI
```
┌─────────────┐
│   PENDING   │ (Menunggu approval)
└──────┬──────┘
       │
       ├─────[Approve]────→ ┌──────────┐
       │                     │ APPROVED │ → Update absensi_harian
       │                     └──────────┘
       │
       └─────[Reject]─────→ ┌──────────┐
                             │ REJECTED │ → Absensi tetap
                             └──────────┘
```

### State: SLIP GAJI
```
┌─────────────┐
│    DRAFT    │ (Baru di-generate, bisa diedit)
└──────┬──────┘
       │
       │ [HR publish]
       ↓
┌─────────────┐
│  PUBLISHED  │ (Read-only, visible to karyawan)
└─────────────┘
```

---

## 📊 Data Validation Rules

### ABSENSI
```
✓ Satu user hanya boleh punya 1 record per tanggal
✓ jam_masuk harus <= jam_pulang (jika keduanya ada)
✓ Tidak boleh absen masuk 2x di hari yang sama
✓ Tidak boleh absen pulang sebelum absen masuk
✓ Tidak boleh edit absensi yang sudah locked
✓ total_jam_kerja = jam_pulang - jam_masuk (dalam jam)
✓ status_terlambat = TRUE jika jam_masuk > (shift.jam_masuk + toleransi)
```

### CUTI
```
✓ tanggal_mulai <= tanggal_selesai
✓ Tidak boleh overlap dengan cuti approved lainnya
✓ total_hari harus exclude weekend & hari libur
✓ Kuota cuti tahunan harus mencukupi (jika jenis = tahunan)
✓ Tidak boleh edit/delete cuti yang sudah approved
```

### KOREKSI ABSENSI
```
✓ absensi_id harus exist
✓ Tidak boleh koreksi absensi yang locked
✓ Tidak boleh ada 2 koreksi pending untuk absensi yang sama
✓ jam_masuk_usulan harus <= jam_pulang_usulan (jika keduanya ada)
```

### SLIP GAJI
```
✓ Satu user hanya boleh punya 1 slip per periode (bulan+tahun)
✓ total_gaji_bersih = gaji_pokok + tunjangan - potongan
✓ Tidak boleh edit slip gaji yang sudah published
✓ Setelah publish, semua absensi di periode tersebut harus locked
```

---

## 🔔 Notification Triggers

| Event | Recipient | Message |
|-------|-----------|---------|
| Cuti diajukan | Atasan | "John Doe mengajukan cuti 10-12 Feb 2026" |
| Cuti approved | Karyawan | "Cuti Anda untuk 10-12 Feb 2026 disetujui" |
| Cuti rejected | Karyawan | "Cuti Anda untuk 10-12 Feb 2026 ditolak" |
| Koreksi diajukan | Atasan/HR | "John Doe mengajukan koreksi absensi" |
| Koreksi approved | Karyawan | "Koreksi absensi Anda disetujui" |
| Koreksi rejected | Karyawan | "Koreksi absensi Anda ditolak" |
| Slip gaji published | Karyawan | "Slip gaji Januari 2026 sudah tersedia" |
| Lupa absen pulang | Karyawan | "Anda lupa absen pulang kemarin" |
| Reminder absen pulang | Karyawan | "Jangan lupa absen pulang" (jam 17:00) |
| Karyawan terlambat | Atasan | "John Doe terlambat 10 menit hari ini" |

