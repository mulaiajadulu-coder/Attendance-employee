# Sistem Kekaryawanan / SDM - Documentation

## 📚 Daftar Dokumentasi

Dokumentasi lengkap untuk sistem kekaryawanan/SDM telah disiapkan dalam folder `.agent/artifacts/`. Berikut adalah daftar dokumen yang tersedia:

### 1. **System Architecture** (`system-architecture.md`)
Dokumen ini berisi:
- ✅ Konsep dan prinsip dasar sistem
- ✅ Technology stack recommendation
- ✅ Database schema lengkap (9 tabel utama)
- ✅ Role & permission matrix
- ✅ UI/UX considerations
- ✅ Halaman-halaman utama aplikasi
- ✅ Roadmap implementasi (4 phase)
- ✅ Edge cases & validations
- ✅ Security considerations

### 2. **API Structure** (`api-structure.md`)
Dokumen ini berisi:
- ✅ Struktur API lengkap (RESTful)
- ✅ 50+ endpoints dengan request/response format
- ✅ Authentication & authorization
- ✅ Error handling & error codes
- ✅ Pagination & filtering
- ✅ Notification system
- ✅ Reporting endpoints

### 3. **Business Process Flow** (`business-process-flow.md`)
Dokumen ini berisi:
- ✅ Alur bisnis proses detail untuk setiap fitur
- ✅ Happy path & edge case scenarios
- ✅ Use case diagram per role
- ✅ State diagram untuk setiap entity
- ✅ Data validation rules
- ✅ Notification triggers

### 4. **Implementation Guide** (`implementation-guide.md`)
Dokumen ini berisi:
- ✅ Panduan implementasi step-by-step
- ✅ Project structure (backend & frontend)
- ✅ Code examples (controllers, services, components)
- ✅ Security best practices
- ✅ Performance optimization
- ✅ Testing strategy
- ✅ Deployment guide (Docker)

### 5. **Face Recognition Feature** (`face-recognition-feature.md`) ⭐ NEW
Dokumen ini berisi:
- ✅ Fitur absensi dengan foto selfie
- ✅ Face detection & recognition
- ✅ Database schema update
- ✅ API updates untuk upload foto
- ✅ Frontend implementation (camera capture)
- ✅ Backend implementation (Python face_recognition)
- ✅ Security & privacy considerations
- ✅ User guide & testing scenarios

### 6. **Visual Designs**
Wireframe dan diagram visual:
- ✅ Database ERD (Entity Relationship Diagram)
- ✅ Dashboard Karyawan wireframe
- ✅ Riwayat Absensi wireframe
- ✅ Dashboard Atasan wireframe
- ✅ Slip Gaji wireframe
- ✅ System Flow Diagram

---

## 🎯 Ringkasan Sistem

### Fitur Utama
1. **Absensi Harian dengan Face Recognition** ⭐ NEW
   - Absen masuk & pulang dengan foto selfie
   - Face detection real-time di kamera
   - Face recognition untuk verifikasi identitas
   - Mark "Wajah Terdeteksi" saat berhasil
   - Timestamp otomatis dari sistem
   - Deteksi keterlambatan otomatis
   - Auto-generate alpha untuk yang tidak absen
   - Support WFO, WFH, dan shift kerja
   - GPS location tracking

2. **Pengajuan & Approval Cuti**
   - Karyawan ajukan cuti
   - Atasan/HR approve/reject
   - Auto-generate absensi untuk hari cuti
   - Tracking kuota cuti

3. **Koreksi Absensi**
   - Karyawan ajukan koreksi (lupa absen, salah shift, dll)
   - Atasan/HR approve/reject
   - Audit trail lengkap

4. **Slip Gaji**
   - Auto-generate dari data absensi bulanan
   - Perhitungan otomatis (gaji pokok, tunjangan, potongan)
   - Read-only setelah publish
   - Download PDF

### Prinsip Utama
- ✅ **Absensi sebagai Single Source of Truth**
- ✅ **Immutable Data** (tidak bisa edit langsung, harus via approval)
- ✅ **Timestamp dari Sistem** (bukan input manual)
- ✅ **One Record per Day** (satu karyawan = satu absensi per tanggal)
- ✅ **Audit Trail** (semua perubahan tercatat)

### Role & Permission
- **Karyawan**: Absen, ajukan cuti/koreksi, lihat slip gaji sendiri
- **Atasan**: Lihat & approve tim
- **HR/Admin**: Full access, kelola master data, generate slip gaji

---

## 🗂️ Database Schema

### Tabel Utama
1. **users** - Master karyawan
2. **departemen** - Master departemen
3. **shift_kerja** - Master shift
4. **absensi_harian** - Core table (single source of truth)
5. **hari_libur** - Master hari libur
6. **cuti** - Pengajuan cuti
7. **koreksi_absensi** - Approval layer untuk koreksi
8. **slip_gaji** - Read-only payroll
9. **audit_log** - Tracking semua perubahan

### Relasi Kunci
- `absensi_harian.user_id` → `users.id`
- `absensi_harian.shift_id` → `shift_kerja.id`
- `cuti.user_id` → `users.id`
- `koreksi_absensi.absensi_id` → `absensi_harian.id`
- `slip_gaji.user_id` → `users.id`

---

## 🎨 Tema Warna

```css
/* Warna Primer */
--color-primary: #FFFFFF (Putih)

/* Warna Sekunder */
--color-secondary: #2563EB (Biru)
--color-secondary-light: #3B82F6
--color-secondary-lighter: #60A5FA

/* Warna Tambahan */
--color-gray-light: #F3F4F6 (Abu Muda)
--color-gray: #E5E7EB
--color-gray-dark: #D1D5DB

/* Status Colors */
--color-success: #10B981 (Hijau)
--color-warning: #F59E0B (Kuning)
--color-error: #EF4444 (Merah)
```

### Icon Style
- Gunakan **Lucide Icons**, **Heroicons**, atau **Feather Icons**
- Simple, outline-based, formal
- Konsisten dalam ukuran (24px default)

---

## 🚀 Quick Start

### 1. Review Dokumentasi
Baca dokumen dalam urutan berikut:
1. `system-architecture.md` - Pahami konsep sistem
2. `business-process-flow.md` - Pahami alur bisnis
3. `api-structure.md` - Pahami struktur API
4. `implementation-guide.md` - Mulai coding

### 2. Setup Database
```sql
-- Create database
CREATE DATABASE employee_attendance;

-- Run migrations (sesuai schema di system-architecture.md)
```

### 3. Backend Setup
```bash
# Initialize project
npm init -y
npm install express pg sequelize bcrypt jsonwebtoken dotenv cors

# Setup struktur folder (lihat implementation-guide.md)
```

### 4. Frontend Setup
```bash
# Create React app
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-router-dom zustand date-fns
```

### 5. Development
```bash
# Backend
npm run dev

# Frontend
npm run dev
```

---

## 📋 Roadmap Implementasi

### Phase 1: Core System (Week 1-2)
- [ ] Setup project & database
- [ ] Authentication & authorization
- [ ] Master data (user, shift, departemen)
- [ ] Absensi masuk/pulang
- [ ] Dashboard karyawan

### Phase 2: Approval Flow (Week 3-4)
- [ ] Pengajuan cuti
- [ ] Approval cuti
- [ ] Koreksi absensi
- [ ] Approval koreksi
- [ ] Notifikasi

### Phase 3: Payroll (Week 5-6)
- [ ] Generate slip gaji
- [ ] Lihat slip gaji
- [ ] Download PDF slip gaji
- [ ] Lock absensi setelah payroll

### Phase 4: Advanced Features (Week 7-8)
- [ ] Reporting & analytics
- [ ] Export data (Excel, PDF)
- [ ] Hari libur & shift management
- [ ] Audit log viewer

---

## 🔐 Security Checklist

- [ ] Password hashing dengan bcrypt
- [ ] JWT authentication dengan expiry
- [ ] Role-based access control
- [ ] Input validation & sanitization
- [ ] SQL injection prevention (use ORM)
- [ ] XSS prevention
- [ ] CORS configuration
- [ ] Rate limiting (login & API)
- [ ] Audit logging

---

## 📊 Key Metrics to Track

### Operational Metrics
- Total karyawan aktif
- Tingkat kehadiran harian (%)
- Tingkat keterlambatan (%)
- Penggunaan cuti per bulan

### Performance Metrics
- API response time (target: < 200ms)
- Database query time
- Page load time (target: < 2s)

### Business Metrics
- Total jam kerja per karyawan
- Total potongan keterlambatan
- Total cuti yang diambil vs kuota

---

## 🤝 Support & Maintenance

### Regular Tasks
- **Daily**: Monitor cron jobs (auto-generate alpha, reminder)
- **Weekly**: Review pending approvals
- **Monthly**: Generate & publish slip gaji
- **Quarterly**: Database backup & optimization

### Troubleshooting
Lihat `implementation-guide.md` untuk:
- Common errors & solutions
- Database optimization
- Performance tuning

---

## 📞 Next Steps

1. **Review semua dokumentasi** di folder `.agent/artifacts/`
2. **Diskusikan dengan tim** untuk finalisasi requirement
3. **Setup development environment**
4. **Mulai implementasi Phase 1**
5. **Testing & iteration**

---

## 📝 Notes

- Sistem ini dirancang untuk **scalable** dan **maintainable**
- Semua perhitungan dilakukan di **backend** untuk data integrity
- Frontend hanya untuk **presentation layer**
- Database menggunakan **normalization** untuk menghindari redundansi
- **Audit trail** untuk semua perubahan penting

---

**Dokumentasi ini dibuat pada:** 31 Januari 2026

**Status:** ✅ Ready for Implementation

**Versi:** 1.0

