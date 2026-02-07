# API Structure & Endpoints

## 📡 Base URL
```
Development: http://localhost:3000/api/v1
Production: https://yourdomain.com/api/v1
```

## 🔐 Authentication

### Headers
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

---

## 1️⃣ Authentication & User Management

### **POST** `/auth/login`
Login user dan dapatkan JWT token

**Request:**
```json
{
  "nik": "EMP001",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 1,
      "nik": "EMP001",
      "nama_lengkap": "John Doe",
      "email": "john@company.com",
      "role": "karyawan",
      "departemen": {
        "id": 1,
        "nama_departemen": "IT"
      },
      "shift_default": {
        "id": 1,
        "nama_shift": "Regular",
        "jam_masuk": "08:00",
        "jam_pulang": "17:00"
      }
    }
  }
}
```

---

### **POST** `/auth/refresh`
Refresh JWT token

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

### **POST** `/auth/logout`
Logout user (invalidate token)

**Request:** (No body, token in header)

**Response:**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

### **GET** `/auth/me`
Get current user profile

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nik": "EMP001",
    "nama_lengkap": "John Doe",
    "email": "john@company.com",
    "role": "karyawan",
    "departemen": {...},
    "atasan": {...},
    "shift_default": {...},
    "tanggal_bergabung": "2024-01-01",
    "status_aktif": true
  }
}
```

---

### **PUT** `/auth/change-password`
Change user password

**Request:**
```json
{
  "old_password": "oldpass123",
  "new_password": "newpass123",
  "confirm_password": "newpass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password berhasil diubah"
}
```

---

## 2️⃣ Absensi

### **POST** `/absensi/masuk`
Absen masuk

**Request:**
```json
{
  "lokasi": "-6.200000,106.816666" // Optional GPS coordinates
}
```

**Response:**
```json
{
  "success": true,
  "message": "Absen masuk berhasil",
  "data": {
    "id": 123,
    "tanggal": "2026-01-31",
    "jam_masuk": "2026-01-31T08:05:00+07:00",
    "shift": {
      "nama_shift": "Regular",
      "jam_masuk": "08:00",
      "toleransi_menit": 15
    },
    "status_terlambat": false,
    "menit_terlambat": 5
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "Anda sudah absen masuk hari ini"
  }
}
```

---

### **POST** `/absensi/pulang`
Absen pulang

**Request:**
```json
{
  "lokasi": "-6.200000,106.816666" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Absen pulang berhasil",
  "data": {
    "id": 123,
    "tanggal": "2026-01-31",
    "jam_masuk": "2026-01-31T08:05:00+07:00",
    "jam_pulang": "2026-01-31T17:10:00+07:00",
    "total_jam_kerja": 9.08,
    "shift": {...}
  }
}
```

---

### **GET** `/absensi/today`
Get absensi hari ini untuk user yang login

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tanggal": "2026-01-31",
    "jam_masuk": "2026-01-31T08:05:00+07:00",
    "jam_pulang": null,
    "status_hadir": "hadir",
    "status_terlambat": false,
    "menit_terlambat": 5,
    "total_jam_kerja": 0,
    "mode_kerja": "wfo",
    "shift": {...}
  }
}
```

---

### **GET** `/absensi/history`
Get history absensi user yang login

**Query Parameters:**
- `bulan` (optional): 1-12
- `tahun` (optional): 2024, 2025, etc
- `page` (optional): default 1
- `limit` (optional): default 30

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "tanggal": "2026-01-31",
        "jam_masuk": "2026-01-31T08:05:00+07:00",
        "jam_pulang": "2026-01-31T17:10:00+07:00",
        "status_hadir": "hadir",
        "status_terlambat": false,
        "menit_terlambat": 5,
        "total_jam_kerja": 9.08,
        "mode_kerja": "wfo",
        "shift": {...}
      },
      // ... more items
    ],
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 100,
      "totalPages": 4
    },
    "summary": {
      "total_hari_hadir": 20,
      "total_hari_alpha": 2,
      "total_hari_cuti": 1,
      "total_terlambat": 3,
      "total_jam_kerja": 180.5
    }
  }
}
```

---

### **GET** `/absensi/team` (Atasan/HR only)
Get absensi tim

**Query Parameters:**
- `tanggal` (optional): YYYY-MM-DD
- `bulan` (optional): 1-12
- `tahun` (optional): 2024, 2025
- `departemen_id` (optional): filter by departemen
- `status_hadir` (optional): hadir, alpha, cuti, etc

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "user": {
          "id": 2,
          "nik": "EMP002",
          "nama_lengkap": "Jane Doe",
          "departemen": "IT"
        },
        "absensi": {
          "tanggal": "2026-01-31",
          "jam_masuk": "2026-01-31T08:00:00+07:00",
          "jam_pulang": "2026-01-31T17:00:00+07:00",
          "status_hadir": "hadir",
          "status_terlambat": false,
          "total_jam_kerja": 9.0
        }
      },
      // ... more items
    ],
    "summary": {
      "total_karyawan": 50,
      "hadir": 45,
      "alpha": 2,
      "cuti": 3,
      "terlambat": 5
    }
  }
}
```

---

## 3️⃣ Cuti

### **POST** `/cuti/ajukan`
Ajukan cuti

**Request:**
```json
{
  "jenis_cuti": "tahunan",
  "tanggal_mulai": "2026-02-10",
  "tanggal_selesai": "2026-02-12",
  "alasan": "Keperluan keluarga",
  "dokumen_pendukung": "file_url_here" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pengajuan cuti berhasil",
  "data": {
    "id": 45,
    "jenis_cuti": "tahunan",
    "tanggal_mulai": "2026-02-10",
    "tanggal_selesai": "2026-02-12",
    "total_hari": 3,
    "alasan": "Keperluan keluarga",
    "status_approval": "pending",
    "created_at": "2026-01-31T23:00:00+07:00"
  }
}
```

---

### **GET** `/cuti/my-cuti`
Get daftar cuti user yang login

**Query Parameters:**
- `status_approval` (optional): pending, approved, rejected
- `tahun` (optional): 2024, 2025

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 45,
        "jenis_cuti": "tahunan",
        "tanggal_mulai": "2026-02-10",
        "tanggal_selesai": "2026-02-12",
        "total_hari": 3,
        "alasan": "Keperluan keluarga",
        "status_approval": "pending",
        "approved_by": null,
        "created_at": "2026-01-31T23:00:00+07:00"
      }
    ],
    "kuota": {
      "total_kuota_tahunan": 12,
      "terpakai": 5,
      "sisa": 7
    }
  }
}
```

---

### **GET** `/cuti/pending` (Atasan/HR only)
Get daftar cuti yang pending approval

**Query Parameters:**
- `departemen_id` (optional): filter by departemen

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "user": {
        "id": 2,
        "nik": "EMP002",
        "nama_lengkap": "Jane Doe",
        "departemen": "IT"
      },
      "jenis_cuti": "tahunan",
      "tanggal_mulai": "2026-02-10",
      "tanggal_selesai": "2026-02-12",
      "total_hari": 3,
      "alasan": "Keperluan keluarga",
      "status_approval": "pending",
      "created_at": "2026-01-31T23:00:00+07:00"
    }
  ]
}
```

---

### **PUT** `/cuti/:id/approve` (Atasan/HR only)
Approve cuti

**Request:**
```json
{
  "catatan_approval": "Approved" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cuti berhasil di-approve",
  "data": {
    "id": 45,
    "status_approval": "approved",
    "approved_by": {
      "id": 1,
      "nama_lengkap": "Manager Name"
    },
    "approved_at": "2026-01-31T23:30:00+07:00"
  }
}
```

---

### **PUT** `/cuti/:id/reject` (Atasan/HR only)
Reject cuti

**Request:**
```json
{
  "catatan_approval": "Alasan reject di sini"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cuti berhasil di-reject",
  "data": {
    "id": 45,
    "status_approval": "rejected",
    "approved_by": {...},
    "approved_at": "2026-01-31T23:30:00+07:00",
    "catatan_approval": "Alasan reject di sini"
  }
}
```

---

## 4️⃣ Koreksi Absensi

### **POST** `/koreksi-absensi/ajukan`
Ajukan koreksi absensi

**Request:**
```json
{
  "absensi_id": 123,
  "jenis_koreksi": "lupa_absen_pulang",
  "jam_pulang_usulan": "2026-01-31T17:00:00+07:00",
  "alasan": "Lupa absen pulang karena buru-buru",
  "bukti_pendukung": "file_url_here" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pengajuan koreksi berhasil",
  "data": {
    "id": 78,
    "absensi_id": 123,
    "jenis_koreksi": "lupa_absen_pulang",
    "jam_pulang_usulan": "2026-01-31T17:00:00+07:00",
    "alasan": "Lupa absen pulang karena buru-buru",
    "status_approval": "pending",
    "created_at": "2026-01-31T23:00:00+07:00"
  }
}
```

---

### **GET** `/koreksi-absensi/my-koreksi`
Get daftar koreksi user yang login

**Query Parameters:**
- `status_approval` (optional): pending, approved, rejected

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 78,
      "absensi": {
        "tanggal": "2026-01-31",
        "jam_masuk": "2026-01-31T08:05:00+07:00",
        "jam_pulang": null
      },
      "jenis_koreksi": "lupa_absen_pulang",
      "jam_pulang_usulan": "2026-01-31T17:00:00+07:00",
      "alasan": "Lupa absen pulang karena buru-buru",
      "status_approval": "pending",
      "created_at": "2026-01-31T23:00:00+07:00"
    }
  ]
}
```

---

### **GET** `/koreksi-absensi/pending` (Atasan/HR only)
Get daftar koreksi yang pending approval

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 78,
      "user": {
        "id": 2,
        "nik": "EMP002",
        "nama_lengkap": "Jane Doe"
      },
      "absensi": {
        "tanggal": "2026-01-31",
        "jam_masuk": "2026-01-31T08:05:00+07:00",
        "jam_pulang": null
      },
      "jenis_koreksi": "lupa_absen_pulang",
      "jam_pulang_usulan": "2026-01-31T17:00:00+07:00",
      "alasan": "Lupa absen pulang karena buru-buru",
      "status_approval": "pending",
      "created_at": "2026-01-31T23:00:00+07:00"
    }
  ]
}
```

---

### **PUT** `/koreksi-absensi/:id/approve` (Atasan/HR only)
Approve koreksi absensi

**Request:**
```json
{
  "catatan_approval": "Approved" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Koreksi berhasil di-approve dan absensi telah diupdate",
  "data": {
    "id": 78,
    "status_approval": "approved",
    "approved_by": {...},
    "approved_at": "2026-01-31T23:30:00+07:00",
    "absensi_updated": {
      "id": 123,
      "jam_pulang": "2026-01-31T17:00:00+07:00",
      "total_jam_kerja": 8.92
    }
  }
}
```

---

### **PUT** `/koreksi-absensi/:id/reject` (Atasan/HR only)
Reject koreksi absensi

**Request:**
```json
{
  "catatan_approval": "Alasan reject di sini"
}
```

---

## 5️⃣ Slip Gaji

### **GET** `/slip-gaji/my-slip`
Get daftar slip gaji user yang login

**Query Parameters:**
- `tahun` (optional): 2024, 2025

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "periode_bulan": 1,
      "periode_tahun": 2026,
      "periode_display": "Januari 2026",
      "gaji_pokok": 8000000,
      "tunjangan": 1000000,
      "potongan": 500000,
      "total_hari_kerja": 22,
      "total_hari_hadir": 20,
      "total_hari_alpha": 1,
      "total_hari_cuti": 1,
      "total_jam_kerja": 180,
      "total_terlambat": 30,
      "potongan_terlambat": 50000,
      "total_gaji_bersih": 8450000,
      "status": "published",
      "generated_at": "2026-02-01T10:00:00+07:00"
    }
  ]
}
```

---

### **GET** `/slip-gaji/:id`
Get detail slip gaji

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 100,
    "user": {
      "nik": "EMP001",
      "nama_lengkap": "John Doe",
      "departemen": "IT"
    },
    "periode_bulan": 1,
    "periode_tahun": 2026,
    "periode_display": "Januari 2026",
    "gaji_pokok": 8000000,
    "tunjangan": 1000000,
    "potongan": 500000,
    "total_hari_kerja": 22,
    "total_hari_hadir": 20,
    "total_hari_alpha": 1,
    "total_hari_cuti": 1,
    "total_jam_kerja": 180,
    "total_terlambat": 30,
    "potongan_terlambat": 50000,
    "total_gaji_bersih": 8450000,
    "status": "published",
    "generated_by": {
      "nama_lengkap": "HR Manager"
    },
    "generated_at": "2026-02-01T10:00:00+07:00",
    "breakdown": {
      "pendapatan": [
        { "item": "Gaji Pokok", "jumlah": 8000000 },
        { "item": "Tunjangan", "jumlah": 1000000 }
      ],
      "potongan": [
        { "item": "Potongan Umum", "jumlah": 500000 },
        { "item": "Potongan Keterlambatan", "jumlah": 50000 }
      ]
    }
  }
}
```

---

### **GET** `/slip-gaji/:id/download` (Generate PDF)
Download slip gaji sebagai PDF

**Response:** PDF file

---

### **POST** `/slip-gaji/generate` (HR only)
Generate slip gaji untuk periode tertentu

**Request:**
```json
{
  "periode_bulan": 1,
  "periode_tahun": 2026,
  "user_ids": [1, 2, 3] // Optional, jika kosong = semua user
}
```

**Response:**
```json
{
  "success": true,
  "message": "Slip gaji berhasil di-generate untuk 50 karyawan",
  "data": {
    "total_generated": 50,
    "periode_bulan": 1,
    "periode_tahun": 2026
  }
}
```

---

### **PUT** `/slip-gaji/:id/publish` (HR only)
Publish slip gaji (dari draft ke published)

**Response:**
```json
{
  "success": true,
  "message": "Slip gaji berhasil di-publish",
  "data": {
    "id": 100,
    "status": "published"
  }
}
```

---

## 6️⃣ Master Data - User (HR only)

### **GET** `/users`
Get daftar semua user

**Query Parameters:**
- `role` (optional): karyawan, atasan, hr, admin
- `departemen_id` (optional)
- `status_aktif` (optional): true, false
- `search` (optional): search by nik or nama
- `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "nik": "EMP001",
        "nama_lengkap": "John Doe",
        "email": "john@company.com",
        "role": "karyawan",
        "departemen": {...},
        "atasan": {...},
        "shift_default": {...},
        "tanggal_bergabung": "2024-01-01",
        "status_aktif": true
      }
    ],
    "pagination": {...}
  }
}
```

---

### **POST** `/users`
Create user baru

**Request:**
```json
{
  "nik": "EMP999",
  "email": "newuser@company.com",
  "password": "defaultpass123",
  "nama_lengkap": "New User",
  "role": "karyawan",
  "departemen_id": 1,
  "atasan_id": 5,
  "shift_default_id": 1,
  "tanggal_bergabung": "2026-02-01"
}
```

---

### **PUT** `/users/:id`
Update user

---

### **DELETE** `/users/:id`
Soft delete user (set status_aktif = false)

---

## 7️⃣ Master Data - Shift (HR only)

### **GET** `/shift`
Get daftar shift

---

### **POST** `/shift`
Create shift baru

**Request:**
```json
{
  "nama_shift": "Shift Malam",
  "jam_masuk": "20:00",
  "jam_pulang": "04:00",
  "toleransi_menit": 15,
  "durasi_jam_kerja": 8,
  "keterangan": "Shift malam untuk security"
}
```

---

### **PUT** `/shift/:id`
Update shift

---

### **DELETE** `/shift/:id`
Soft delete shift (set is_active = false)

---

## 8️⃣ Master Data - Hari Libur (HR only)

### **GET** `/hari-libur`
Get daftar hari libur

**Query Parameters:**
- `tahun` (optional): 2024, 2025

---

### **POST** `/hari-libur`
Create hari libur baru

**Request:**
```json
{
  "tanggal": "2026-08-17",
  "nama_libur": "Hari Kemerdekaan RI",
  "jenis_libur": "nasional",
  "keterangan": "Libur nasional"
}
```

---

### **PUT** `/hari-libur/:id`
Update hari libur

---

### **DELETE** `/hari-libur/:id`
Delete hari libur

---

## 9️⃣ Master Data - Departemen (HR only)

### **GET** `/departemen`
Get daftar departemen

---

### **POST** `/departemen`
Create departemen baru

**Request:**
```json
{
  "nama_departemen": "Marketing",
  "kode_departemen": "MKT"
}
```

---

### **PUT** `/departemen/:id`
Update departemen

---

### **DELETE** `/departemen/:id`
Delete departemen

---

## 🔟 Dashboard & Statistics

### **GET** `/dashboard/karyawan`
Get dashboard data untuk karyawan

**Response:**
```json
{
  "success": true,
  "data": {
    "absensi_hari_ini": {
      "sudah_absen_masuk": true,
      "sudah_absen_pulang": false,
      "jam_masuk": "2026-01-31T08:05:00+07:00",
      "status_terlambat": false
    },
    "ringkasan_bulan_ini": {
      "total_hadir": 20,
      "total_alpha": 1,
      "total_cuti": 1,
      "total_terlambat": 3,
      "total_jam_kerja": 180
    },
    "pending_approvals": {
      "cuti": 0,
      "koreksi": 1
    },
    "sisa_kuota_cuti": 7
  }
}
```

---

### **GET** `/dashboard/atasan`
Get dashboard data untuk atasan

**Response:**
```json
{
  "success": true,
  "data": {
    "ringkasan_tim_hari_ini": {
      "total_karyawan": 10,
      "hadir": 8,
      "alpha": 1,
      "cuti": 1,
      "terlambat": 2
    },
    "pending_approvals": {
      "cuti": 3,
      "koreksi": 2
    },
    "grafik_kehadiran_minggu_ini": [
      { "tanggal": "2026-01-27", "hadir": 9, "alpha": 1 },
      { "tanggal": "2026-01-28", "hadir": 10, "alpha": 0 },
      // ...
    ]
  }
}
```

---

### **GET** `/dashboard/hr`
Get dashboard data untuk HR

**Response:**
```json
{
  "success": true,
  "data": {
    "statistik_keseluruhan": {
      "total_karyawan": 100,
      "hadir_hari_ini": 85,
      "alpha_hari_ini": 5,
      "cuti_hari_ini": 10
    },
    "pending_approvals": {
      "cuti": 15,
      "koreksi": 8
    },
    "slip_gaji_bulan_ini": {
      "total_generated": 100,
      "published": 100,
      "draft": 0
    }
  }
}
```

---

## 1️⃣1️⃣ Reporting

### **GET** `/reports/kehadiran`
Laporan kehadiran

**Query Parameters:**
- `bulan`: 1-12 (required)
- `tahun`: 2024, 2025 (required)
- `departemen_id` (optional)
- `user_id` (optional)
- `format`: json, excel, pdf (default: json)

**Response (JSON):**
```json
{
  "success": true,
  "data": {
    "periode": "Januari 2026",
    "items": [
      {
        "user": {...},
        "total_hari_kerja": 22,
        "total_hadir": 20,
        "total_alpha": 1,
        "total_cuti": 1,
        "total_terlambat": 3,
        "total_jam_kerja": 180,
        "persentase_kehadiran": 90.9
      }
    ]
  }
}
```

---

### **GET** `/reports/keterlambatan`
Laporan keterlambatan

---

### **GET** `/reports/cuti`
Laporan penggunaan cuti

---

### **GET** `/reports/jam-kerja`
Laporan total jam kerja

---

## 🔔 Notifikasi

### **GET** `/notifications`
Get daftar notifikasi user yang login

**Query Parameters:**
- `is_read` (optional): true, false
- `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "cuti_approved",
        "title": "Cuti Disetujui",
        "message": "Pengajuan cuti Anda untuk tanggal 10-12 Feb 2026 telah disetujui",
        "is_read": false,
        "created_at": "2026-01-31T23:30:00+07:00",
        "related_data": {
          "cuti_id": 45
        }
      }
    ],
    "unread_count": 5,
    "pagination": {...}
  }
}
```

---

### **PUT** `/notifications/:id/read`
Mark notifikasi sebagai sudah dibaca

---

### **PUT** `/notifications/read-all`
Mark semua notifikasi sebagai sudah dibaca

---

## ⚠️ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional details
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Token invalid atau expired
- `FORBIDDEN`: User tidak memiliki permission
- `NOT_FOUND`: Resource tidak ditemukan
- `VALIDATION_ERROR`: Input validation failed
- `ALREADY_EXISTS`: Resource sudah ada (duplicate)
- `ALREADY_CHECKED_IN`: Sudah absen masuk
- `ALREADY_CHECKED_OUT`: Sudah absen pulang
- `NOT_CHECKED_IN`: Belum absen masuk
- `ABSENSI_LOCKED`: Absensi sudah terkunci (payroll generated)
- `INSUFFICIENT_QUOTA`: Kuota cuti tidak cukup

---

## 📝 Notes

1. **Pagination**: Semua endpoint list menggunakan pagination dengan format:
   ```json
   {
     "page": 1,
     "limit": 30,
     "total": 100,
     "totalPages": 4
   }
   ```

2. **Date Format**: Semua tanggal menggunakan ISO 8601 format dengan timezone
   - Date only: `YYYY-MM-DD`
   - DateTime: `YYYY-MM-DDTHH:mm:ss+07:00`

3. **Filtering & Sorting**: Endpoint list support query parameters:
   - `sort_by`: field name
   - `sort_order`: asc, desc

4. **Rate Limiting**: 
   - Login: 5 requests per 15 minutes
   - Other endpoints: 100 requests per minute

5. **File Upload**: 
   - Max file size: 5MB
   - Allowed types: jpg, png, pdf
   - Upload endpoint: `POST /upload`

