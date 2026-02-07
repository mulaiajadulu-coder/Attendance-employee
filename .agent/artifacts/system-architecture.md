# Arsitektur Sistem Kekaryawanan / SDM

## 🎯 Konsep Utama

### Prinsip Dasar
1. **Absensi sebagai Single Source of Truth**
   - Semua timestamp dari sistem, bukan input manual
   - Satu karyawan = satu record per tanggal
   - Immutable (tidak bisa diedit langsung)
   - Koreksi melalui approval flow

2. **Data Integrity**
   - Slip gaji read-only
   - Cuti override absensi
   - Audit trail untuk semua perubahan

3. **Role-Based Access Control**
   - Karyawan: Self-service terbatas
   - Atasan: Approval & monitoring tim
   - HR/Admin: Full control & configuration

---

## 🏗️ Arsitektur Sistem

### Technology Stack (Rekomendasi)

#### Backend
- **Framework**: Node.js + Express / Laravel / NestJS
- **Database**: PostgreSQL (relational, ACID compliant)
- **Authentication**: JWT + Role-based middleware
- **Validation**: Joi / Zod
- **Scheduler**: Node-cron / Laravel Queue (untuk auto-generate slip gaji)

#### Frontend
- **Framework**: React / Vue.js / Next.js
- **State Management**: Redux / Zustand / Pinia
- **UI Components**: Custom components (sesuai tema warna)
- **Date/Time**: Day.js / date-fns
- **HTTP Client**: Axios

#### Infrastructure
- **API Pattern**: RESTful API
- **Real-time**: WebSocket (optional, untuk notifikasi)
- **File Storage**: Local / Cloud Storage (untuk dokumen)
- **Logging**: Winston / Pino

---

## 📊 Database Schema (ERD)

### 1. **users** (Master Karyawan)
```
id                  : UUID/BIGINT (PK)
nik                 : VARCHAR(20) UNIQUE NOT NULL
email               : VARCHAR(100) UNIQUE NOT NULL
password_hash       : VARCHAR(255) NOT NULL
nama_lengkap        : VARCHAR(100) NOT NULL
role                : ENUM('karyawan', 'atasan', 'hr', 'admin') NOT NULL
departemen_id       : BIGINT (FK -> departemen)
atasan_id           : BIGINT (FK -> users) NULL
shift_default_id    : BIGINT (FK -> shift_kerja) NULL
tanggal_bergabung   : DATE NOT NULL
status_aktif        : BOOLEAN DEFAULT true
foto_profil         : VARCHAR(255) NULL
created_at          : TIMESTAMP
updated_at          : TIMESTAMP
```

### 2. **departemen**
```
id                  : BIGINT (PK)
nama_departemen     : VARCHAR(100) NOT NULL
kode_departemen     : VARCHAR(20) UNIQUE NOT NULL
created_at          : TIMESTAMP
updated_at          : TIMESTAMP
```

### 3. **shift_kerja**
```
id                  : BIGINT (PK)
nama_shift          : VARCHAR(50) NOT NULL
jam_masuk           : TIME NOT NULL
jam_pulang          : TIME NOT NULL
toleransi_menit     : INT DEFAULT 0
durasi_jam_kerja    : DECIMAL(4,2) NOT NULL
keterangan          : TEXT NULL
is_active           : BOOLEAN DEFAULT true
created_at          : TIMESTAMP
updated_at          : TIMESTAMP
```

### 4. **absensi_harian** (Core Table)
```
id                  : BIGINT (PK)
user_id             : BIGINT (FK -> users) NOT NULL
tanggal             : DATE NOT NULL
jam_masuk           : TIMESTAMP NULL
jam_pulang          : TIMESTAMP NULL
shift_id            : BIGINT (FK -> shift_kerja) NOT NULL
status_hadir        : ENUM('hadir', 'alpha', 'cuti', 'sakit', 'izin', 'libur') NOT NULL
status_terlambat    : BOOLEAN DEFAULT false
menit_terlambat     : INT DEFAULT 0
total_jam_kerja     : DECIMAL(4,2) DEFAULT 0
mode_kerja          : ENUM('wfo', 'wfh', 'hybrid') DEFAULT 'wfo'
lokasi_masuk        : VARCHAR(255) NULL (GPS coordinates)
lokasi_pulang       : VARCHAR(255) NULL
catatan             : TEXT NULL
is_locked           : BOOLEAN DEFAULT false (locked after payroll generated)
created_at          : TIMESTAMP
updated_at          : TIMESTAMP

UNIQUE KEY (user_id, tanggal)
INDEX (user_id, tanggal)
INDEX (tanggal)
```

### 5. **hari_libur**
```
id                  : BIGINT (PK)
tanggal             : DATE NOT NULL UNIQUE
nama_libur          : VARCHAR(100) NOT NULL
jenis_libur         : ENUM('nasional', 'perusahaan', 'regional') NOT NULL
keterangan          : TEXT NULL
created_at          : TIMESTAMP
updated_at          : TIMESTAMP
```

### 6. **cuti**
```
id                  : BIGINT (PK)
user_id             : BIGINT (FK -> users) NOT NULL
jenis_cuti          : ENUM('tahunan', 'sakit', 'izin', 'khusus') NOT NULL
tanggal_mulai       : DATE NOT NULL
tanggal_selesai     : DATE NOT NULL
total_hari          : INT NOT NULL
alasan              : TEXT NOT NULL
dokumen_pendukung   : VARCHAR(255) NULL
status_approval     : ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
approved_by         : BIGINT (FK -> users) NULL
approved_at         : TIMESTAMP NULL
catatan_approval    : TEXT NULL
created_at          : TIMESTAMP
updated_at          : TIMESTAMP

INDEX (user_id, status_approval)
INDEX (tanggal_mulai, tanggal_selesai)
```

### 7. **koreksi_absensi**
```
id                  : BIGINT (PK)
absensi_id          : BIGINT (FK -> absensi_harian) NOT NULL
user_id             : BIGINT (FK -> users) NOT NULL
jenis_koreksi       : ENUM('lupa_absen_masuk', 'lupa_absen_pulang', 'salah_shift', 'lainnya') NOT NULL
jam_masuk_usulan    : TIMESTAMP NULL
jam_pulang_usulan   : TIMESTAMP NULL
shift_usulan_id     : BIGINT (FK -> shift_kerja) NULL
alasan              : TEXT NOT NULL
bukti_pendukung     : VARCHAR(255) NULL
status_approval     : ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
approved_by         : BIGINT (FK -> users) NULL
approved_at         : TIMESTAMP NULL
catatan_approval    : TEXT NULL
created_at          : TIMESTAMP
updated_at          : TIMESTAMP

INDEX (user_id, status_approval)
INDEX (absensi_id)
```

### 8. **slip_gaji**
```
id                  : BIGINT (PK)
user_id             : BIGINT (FK -> users) NOT NULL
periode_bulan       : INT NOT NULL (1-12)
periode_tahun       : INT NOT NULL
gaji_pokok          : DECIMAL(15,2) NOT NULL
tunjangan           : DECIMAL(15,2) DEFAULT 0
potongan            : DECIMAL(15,2) DEFAULT 0
total_hari_kerja    : INT NOT NULL
total_hari_hadir    : INT NOT NULL
total_hari_alpha    : INT NOT NULL
total_hari_cuti     : INT NOT NULL
total_jam_kerja     : DECIMAL(8,2) NOT NULL
total_terlambat     : INT DEFAULT 0
potongan_terlambat  : DECIMAL(15,2) DEFAULT 0
total_gaji_bersih   : DECIMAL(15,2) NOT NULL
status              : ENUM('draft', 'published') DEFAULT 'draft'
generated_by        : BIGINT (FK -> users) NOT NULL
generated_at        : TIMESTAMP NOT NULL
is_locked           : BOOLEAN DEFAULT false
created_at          : TIMESTAMP
updated_at          : TIMESTAMP

UNIQUE KEY (user_id, periode_bulan, periode_tahun)
INDEX (periode_bulan, periode_tahun)
```

### 9. **audit_log**
```
id                  : BIGINT (PK)
user_id             : BIGINT (FK -> users) NOT NULL
action              : VARCHAR(100) NOT NULL
table_name          : VARCHAR(50) NOT NULL
record_id           : BIGINT NOT NULL
old_value           : JSON NULL
new_value           : JSON NULL
ip_address          : VARCHAR(45) NULL
user_agent          : VARCHAR(255) NULL
created_at          : TIMESTAMP

INDEX (user_id, created_at)
INDEX (table_name, record_id)
```

---

## 🔄 Alur Data & Business Logic

### A. Flow Absensi Harian

#### 1. **Absen Masuk**
```
Karyawan → Klik "Absen Masuk" → Sistem:
  1. Cek apakah sudah ada record absensi untuk tanggal hari ini
     - Jika sudah ada dan jam_masuk != NULL → Error: "Sudah absen masuk"
     - Jika belum ada → Buat record baru
  2. Ambil shift_default dari user
  3. Catat timestamp sistem sebagai jam_masuk
  4. Catat lokasi (GPS) jika diperlukan
  5. Hitung status_terlambat:
     - Bandingkan jam_masuk dengan shift.jam_masuk + toleransi
     - Set status_terlambat = true/false
     - Hitung menit_terlambat
  6. Set status_hadir = 'hadir'
  7. Simpan ke database
  8. Return success + data absensi
```

#### 2. **Absen Pulang**
```
Karyawan → Klik "Absen Pulang" → Sistem:
  1. Cek record absensi hari ini
     - Jika tidak ada → Error: "Belum absen masuk"
     - Jika jam_pulang != NULL → Error: "Sudah absen pulang"
  2. Catat timestamp sistem sebagai jam_pulang
  3. Catat lokasi (GPS) jika diperlukan
  4. Hitung total_jam_kerja:
     - Selisih jam_pulang - jam_masuk (dalam jam)
  5. Update record absensi
  6. Return success + data absensi
```

#### 3. **Auto-Generate Absensi Alpha**
```
Cron Job (setiap hari jam 23:59) → Sistem:
  1. Ambil semua user dengan status_aktif = true
  2. Untuk setiap user:
     - Cek apakah ada record absensi untuk tanggal hari ini
     - Cek apakah tanggal hari ini adalah hari libur
     - Cek apakah user sedang cuti
     - Jika tidak ada record dan bukan libur/cuti:
       → Buat record dengan status_hadir = 'alpha'
```

### B. Flow Pengajuan Cuti

```
Karyawan → Ajukan Cuti → Sistem:
  1. Validasi:
     - Tanggal mulai <= tanggal selesai
     - Tidak overlap dengan cuti yang sudah approved
     - Cek sisa kuota cuti (jika jenis_cuti = 'tahunan')
  2. Hitung total_hari (exclude hari libur)
  3. Simpan dengan status_approval = 'pending'
  4. Kirim notifikasi ke atasan

Atasan → Review Cuti → Approve/Reject:
  1. Jika Approve:
     - Update status_approval = 'approved'
     - Catat approved_by dan approved_at
     - Generate/Update record absensi untuk tanggal cuti:
       → status_hadir = 'cuti'
       → is_locked = false (bisa di-override jika cuti dibatalkan)
  2. Jika Reject:
     - Update status_approval = 'rejected'
     - Catat alasan di catatan_approval
```

### C. Flow Koreksi Absensi

```
Karyawan → Ajukan Koreksi → Sistem:
  1. Validasi:
     - Absensi yang dikoreksi harus sudah ada
     - Tidak boleh koreksi absensi yang sudah locked
     - Tidak boleh ada koreksi pending untuk absensi yang sama
  2. Simpan koreksi dengan status_approval = 'pending'
  3. Kirim notifikasi ke atasan/HR

Atasan/HR → Review Koreksi → Approve/Reject:
  1. Jika Approve:
     - Update record absensi_harian sesuai usulan
     - Recalculate status_terlambat, menit_terlambat, total_jam_kerja
     - Update status_approval = 'approved'
     - Log ke audit_log
  2. Jika Reject:
     - Update status_approval = 'rejected'
     - Catat alasan
```

### D. Flow Generate Slip Gaji

```
HR/Admin → Generate Slip Gaji Bulanan → Sistem:
  1. Input: periode_bulan, periode_tahun, user_id (atau semua user)
  2. Untuk setiap user:
     - Query semua absensi_harian di periode tersebut
     - Hitung:
       * total_hari_kerja (hari kerja - hari libur)
       * total_hari_hadir (status_hadir = 'hadir')
       * total_hari_alpha (status_hadir = 'alpha')
       * total_hari_cuti (status_hadir = 'cuti')
       * total_jam_kerja (SUM total_jam_kerja)
       * total_terlambat (SUM menit_terlambat)
       * potongan_terlambat (formula: total_terlambat * rate)
     - Ambil gaji_pokok dari master user atau tabel gaji
     - Hitung total_gaji_bersih:
       = gaji_pokok + tunjangan - potongan - potongan_terlambat
     - Simpan ke slip_gaji dengan status = 'draft'
  3. HR review dan publish
  4. Setelah publish:
     - Lock semua absensi di periode tersebut (is_locked = true)
     - Slip gaji menjadi read-only

Karyawan → Lihat Slip Gaji:
  - Hanya bisa melihat slip gaji sendiri
  - Tampilkan detail breakdown
```

---

## 🔐 Role & Permission Matrix

| Fitur | Karyawan | Atasan | HR/Admin |
|-------|----------|--------|----------|
| **Absensi** |
| Absen Masuk/Pulang | ✅ | ✅ | ✅ |
| Lihat Absensi Sendiri | ✅ | ✅ | ✅ |
| Lihat Absensi Tim | ❌ | ✅ | ✅ |
| Lihat Semua Absensi | ❌ | ❌ | ✅ |
| **Cuti** |
| Ajukan Cuti | ✅ | ✅ | ✅ |
| Approve/Reject Cuti Tim | ❌ | ✅ | ✅ |
| Approve/Reject Semua Cuti | ❌ | ❌ | ✅ |
| **Koreksi Absensi** |
| Ajukan Koreksi | ✅ | ✅ | ✅ |
| Approve/Reject Koreksi Tim | ❌ | ✅ | ✅ |
| Approve/Reject Semua Koreksi | ❌ | ❌ | ✅ |
| **Slip Gaji** |
| Lihat Slip Gaji Sendiri | ✅ | ✅ | ✅ |
| Lihat Slip Gaji Tim | ❌ | ✅ | ✅ |
| Generate Slip Gaji | ❌ | ❌ | ✅ |
| **Master Data** |
| Kelola Shift | ❌ | ❌ | ✅ |
| Kelola Hari Libur | ❌ | ❌ | ✅ |
| Kelola User | ❌ | ❌ | ✅ |
| Kelola Departemen | ❌ | ❌ | ✅ |

---

## 🎨 UI/UX Considerations

### Tema Warna
- **Primer**: Putih (#FFFFFF)
- **Sekunder**: Biru (#2563EB, #3B82F6, #60A5FA)
- **Tambahan**: Abu Muda (#F3F4F6, #E5E7EB, #D1D5DB)
- **Text**: #1F2937, #4B5563, #6B7280
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444

### Icon Style
- Gunakan icon library seperti **Lucide**, **Heroicons**, atau **Feather Icons**
- Simple, outline-based, formal
- Konsisten dalam ukuran dan stroke width

### Layout Principles
- Clean & minimalist
- Card-based design dengan shadow halus
- Spacing konsisten (8px grid system)
- Responsive (mobile-first)

---

## 📱 Halaman Utama

### 1. **Dashboard Karyawan**
- Widget absensi hari ini (status, jam masuk/pulang)
- Quick action: Absen Masuk/Pulang
- Ringkasan bulan ini (total hadir, cuti, terlambat)
- Notifikasi (approval cuti, koreksi)

### 2. **Dashboard Atasan**
- Ringkasan tim (hadir hari ini, yang cuti, yang terlambat)
- Pending approvals (cuti, koreksi)
- Grafik kehadiran tim

### 3. **Dashboard HR/Admin**
- Statistik keseluruhan
- Pending approvals
- Quick access ke master data
- Generate slip gaji

### 4. **Halaman Absensi**
- Kalender view dengan status harian
- Filter by bulan/tahun
- Detail per hari (jam masuk/pulang, total jam kerja)
- Tombol ajukan koreksi

### 5. **Halaman Cuti**
- List cuti (pending, approved, rejected)
- Form ajukan cuti
- Kalender cuti tim (untuk atasan)

### 6. **Halaman Slip Gaji**
- List slip gaji per bulan
- Detail breakdown (gaji pokok, tunjangan, potongan)
- Download PDF

### 7. **Halaman Master Data** (HR only)
- Kelola User
- Kelola Shift
- Kelola Hari Libur
- Kelola Departemen

---

## 🔔 Notifikasi

### Event yang Trigger Notifikasi:
1. Cuti diajukan → Notif ke atasan
2. Cuti approved/rejected → Notif ke karyawan
3. Koreksi absensi diajukan → Notif ke atasan/HR
4. Koreksi approved/rejected → Notif ke karyawan
5. Slip gaji published → Notif ke karyawan
6. Reminder absen pulang (jika belum absen pulang jam 17:00)

---

## 📈 Reporting & Analytics

### Report yang Diperlukan:
1. **Laporan Kehadiran Bulanan**
   - Per karyawan atau per departemen
   - Total hadir, alpha, cuti, terlambat

2. **Laporan Keterlambatan**
   - Karyawan dengan keterlambatan terbanyak
   - Trend keterlambatan per bulan

3. **Laporan Cuti**
   - Sisa kuota cuti per karyawan
   - Penggunaan cuti per departemen

4. **Laporan Jam Kerja**
   - Total jam kerja per karyawan
   - Overtime (jika ada)

---

## 🚀 Roadmap Implementasi

### Phase 1: Core System (MVP)
- [ ] Setup project & database
- [ ] Authentication & authorization
- [ ] Master data (user, shift, departemen)
- [ ] Absensi masuk/pulang
- [ ] Dashboard karyawan

### Phase 2: Approval Flow
- [ ] Pengajuan cuti
- [ ] Approval cuti
- [ ] Koreksi absensi
- [ ] Approval koreksi
- [ ] Notifikasi

### Phase 3: Payroll
- [ ] Generate slip gaji
- [ ] Lihat slip gaji
- [ ] Download PDF slip gaji
- [ ] Lock absensi setelah payroll

### Phase 4: Advanced Features
- [ ] Reporting & analytics
- [ ] Export data (Excel, PDF)
- [ ] Hari libur & shift management
- [ ] Audit log viewer
- [ ] Mobile app (optional)

---

## ⚠️ Edge Cases & Validations

### Edge Cases yang Harus Ditangani:
1. **Lupa Absen Pulang**
   - Auto-generate jam pulang = shift.jam_pulang
   - Tandai sebagai "perlu koreksi"
   - Karyawan ajukan koreksi dengan bukti

2. **Absen di Hari Libur**
   - Sistem cek hari_libur
   - Jika libur, tandai sebagai "lembur" atau tolak absensi
   - Tergantung kebijakan perusahaan

3. **Shift Berubah Mendadak**
   - HR update shift untuk tanggal tertentu
   - Sistem recalculate status_terlambat

4. **Cuti Dibatalkan**
   - Jika cuti dibatalkan, hapus/update record absensi
   - Unlock absensi yang sudah di-override

5. **Ganti Shift**
   - Karyawan request ganti shift
   - Approval flow terpisah (optional)

6. **Timezone**
   - Pastikan semua timestamp menggunakan timezone yang konsisten
   - Simpan dalam UTC, display dalam local timezone

---

## 🔒 Security Considerations

1. **Authentication**
   - Password hashing (bcrypt/argon2)
   - JWT dengan expiry time
   - Refresh token mechanism

2. **Authorization**
   - Middleware untuk cek role
   - Row-level security (user hanya bisa akses data sendiri kecuali role tertentu)

3. **Input Validation**
   - Validasi semua input dari client
   - Sanitize untuk prevent SQL injection, XSS

4. **Audit Trail**
   - Log semua perubahan data penting
   - IP address & user agent tracking

5. **Rate Limiting**
   - Prevent brute force login
   - Limit API calls per user

---

## 📝 Notes

- Sistem ini dirancang untuk **scalable** dan **maintainable**
- Database schema menggunakan **normalization** untuk menghindari redundansi
- Business logic dipusatkan di backend untuk **consistency**
- Frontend hanya untuk **presentation layer**
- Semua perhitungan dilakukan di backend untuk **data integrity**

