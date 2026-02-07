# 📧 Fitur Auto-Email untuk Karyawan Baru

## Deskripsi
Fitur ini secara otomatis mengirim email ke karyawan baru setelah akun mereka berhasil dibuat. Email berisi:
- **NIK** untuk login
- **Password default** yang diberikan saat pendaftaran
- **Peringatan keamanan** untuk segera mengganti password
- **Link login** ke aplikasi

## Cara Kerja

### 1. Proses Pembuatan Karyawan
Ketika HR/Admin menambahkan karyawan baru melalui sistem:
1. Data karyawan disimpan ke database
2. Password di-hash untuk keamanan
3. Setelah berhasil disimpan, sistem mengirim email **secara asynchronous** (tidak menunggu email selesai terkirim)
4. Response dikembalikan ke client dengan pesan sukses

### 2. Email Template
Email menggunakan template HTML yang profesional dengan:
- Header dengan gradient warna
- Tabel kredensial (NIK & Password)
- Warning box berwarna kuning untuk peringatan keamanan
- Tombol CTA "Login Sekarang"
- Footer informatif

### 3. Keamanan
- Password hanya dikirim **sekali** saat pembuatan akun
- Email dikirim **setelah** user berhasil dibuat (jika email gagal, user tetap terbuat)
- Password di-hash di database (tidak disimpan dalam bentuk plain text)

---

## Konfigurasi SMTP

### File: `.env`
Pastikan konfigurasi SMTP sudah benar di file `.env`:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yudisutiyawannn@gmail.com
SMTP_PASS=ecegtdelajzwznnc
EMAIL_FROM_ADDRESS=yudisutiyawannn@gmail.com
EMAIL_FROM_NAME=Absensi System
```

### Untuk Gmail
Jika menggunakan Gmail, pastikan:
1. **App Password** sudah dibuat (bukan password biasa)
2. Cara membuat App Password:
   - Login ke Google Account
   - Masuk ke **Security** → **2-Step Verification**
   - Scroll ke bawah → **App passwords**
   - Generate password untuk "Mail" atau "Other"
   - Copy password 16 digit dan masukkan ke `SMTP_PASS`

### Untuk SMTP Lain
Sesuaikan `SMTP_HOST`, `SMTP_PORT`, dan kredensial sesuai provider email Anda.

---

## File yang Dimodifikasi

### 1. `src/services/emailService.js`
**Fungsi baru:** `sendWelcomeEmail()`
- Menerima email tujuan dan data user (nama, NIK, password, penempatan_store)
- Membuat HTML template yang profesional
- Mengirim email menggunakan `nodemailer`

### 2. `src/controllers/userController.js`
**Fungsi yang dimodifikasi:** `createUser()`
- Menyimpan password plain text sebelum di-hash (untuk dikirim via email)
- Setelah user dibuat, memanggil `emailService.sendWelcomeEmail()` secara asynchronous
- Menampilkan log console untuk tracking pengiriman email
- Response ke client langsung dikirim tanpa menunggu email selesai

---

## Monitoring & Logging

### Console Log
Saat karyawan baru dibuat, akan muncul log di console backend:

```
📧 Attempting to send welcome email to user@example.com...
✅ Welcome email berhasil dikirim ke user@example.com
```

Jika gagal:
```
⚠️ Warning: Email gagal terkirim ke user@example.com, tapi user sudah berhasil dibuat.
```

### Response ke Client
Response sukses akan berisi pesan:
```json
{
  "success": true,
  "message": "Karyawan berhasil ditambahkan. Email dengan kredensial login telah dikirim ke user@example.com",
  "data": { ... }
}
```

---

## Testing

### 1. Test Manual
1. Login sebagai HR/Admin
2. Buka halaman "Manage Users"
3. Klik "Tambah Karyawan Baru"
4. Isi form dengan **email yang valid** (gunakan email Anda sendiri untuk test)
5. Submit form
6. Cek inbox email yang didaftarkan
7. Email seharusnya masuk dalam beberapa detik

### 2. Troubleshooting

#### Email tidak masuk?
1. **Cek spam folder** - Email otomatis sering masuk spam
2. **Cek console backend** - Lihat apakah ada error log
3. **Cek konfigurasi SMTP** - Pastikan kredensial benar
4. **Test koneksi SMTP:**
   ```javascript
   // Tambahkan di nodemailer config untuk debugging
   debug: true,
   logger: true
   ```

#### Error "Invalid login"?
- SMTP credentials salah
- Untuk Gmail: pastikan menggunakan App Password, bukan password biasa
- Periksa apakah "Less secure app access" dibutuhkan (tidak recommended)

#### Email delay?
- Email dikirim asynchronous, tapi seharusnya sampai dalam 5-30 detik
- Jika lebih dari 1 menit, cek log server atau SMTP rate limiting

---

## Catatan Penting

### ⚠️ Security Best Practices
1. **Jangan simpan password plain text** di database
2. **Selalu gunakan HTTPS** untuk aplikasi production
3. **Gunakan App Password** untuk Gmail, jangan password utama
4. **Rate limiting** - Pertimbangkan batasan jumlah email per jam untuk mencegah spam

### 📝 Rekomendasi
1. **Test dengan email sendiri** sebelum digunakan untuk karyawan asli
2. **Dokumentasikan** password default yang digunakan untuk karyawan
3. **Ingatkan karyawan** untuk cek spam folder jika email tidak masuk
4. **Monitor log** secara berkala untuk memastikan email terkirim

---

## Update Future (Opsional)

### Fitur Enhancement yang bisa ditambahkan:
1. **Email notification untuk HR** saat email gagal terkirim
2. **Resend email** - Tombol untuk kirim ulang email kredensial
3. **Email template customization** - Admin bisa edit template email
4. **Multi-language support** - Email dalam bahasa Indonesia & Inggris
5. **Email tracking** - Simpan log email yang terkirim ke database
6. **Welcome SMS** - Alternatif atau tambahan untuk email

---

## Kontak Support
Jika ada masalah dengan fitur ini, hubungi Tim Development atau cek dokumentasi Nodemailer:
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

---

**Terakhir diperbarui:** 02 Februari 2026  
**Versi:** 1.0.0
