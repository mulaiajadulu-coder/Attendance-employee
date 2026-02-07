# Setup Guide - Backend Employee Attendance System

## ✅ Backend Setup Selesai!

Backend API telah berhasil dibuat dengan struktur lengkap. Berikut adalah ringkasan:

### 📦 Yang Sudah Dibuat:

1. ✅ **Project Structure** - Folder dan file terorganisir
2. ✅ **Database Models** - User, Departemen, Shift, Absensi
3. ✅ **Authentication System** - Login, JWT, Password hashing
4. ✅ **Middleware** - Authentication & Authorization
5. ✅ **API Routes** - Auth endpoints
6. ✅ **Database Seeder** - Data awal untuk testing
7. ✅ **Environment Config** - .env setup

---

## 🚀 Langkah Selanjutnya

### Step 1: Install PostgreSQL

**Windows:**
1. Download PostgreSQL dari: https://www.postgresql.org/download/windows/
2. Install dengan default settings
3. Catat password untuk user `postgres`
4. Pastikan PostgreSQL service running

**Atau gunakan Docker:**
```bash
docker run --name postgres-attendance -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

### Step 2: Create Database

Buka Command Prompt atau PowerShell, lalu:

```bash
# Login ke PostgreSQL (akan diminta password)
psql -U postgres

# Di dalam psql prompt, jalankan:
CREATE DATABASE employee_attendance;

# Keluar dari psql
\q
```

**Atau menggunakan pgAdmin:**
1. Buka pgAdmin
2. Right-click "Databases" → Create → Database
3. Nama: `employee_attendance`
4. Save

### Step 3: Update .env File

Edit file `backend/.env` dan sesuaikan dengan setup PostgreSQL Anda:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_attendance
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
```

### Step 4: Run Database Seeder

Dari folder `backend`, jalankan:

```bash
node src/seeders/run.js
```

Output yang diharapkan:
```
Connecting to database...
✓ Database connection established successfully

Synchronizing database...
✓ Database synchronized successfully

Seeding data...
✓ Departemen created
✓ Shift created
✓ Admin user created
  NIK: ADMIN001
  Password: admin123
...
✓ Database seeding completed successfully!
```

### Step 5: Start Backend Server

```bash
npm run dev
```

Output yang diharapkan:
```
✓ Database connection established successfully
✓ Database synchronized successfully
==================================================
✓ Server running on port 3000
✓ Environment: development
✓ API URL: http://localhost:3000
==================================================
```

---

## 🧪 Testing API

### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-31T16:30:00.000Z"
}
```

### Test 2: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"nik\":\"EMP001\",\"password\":\"emp123\"}"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": 4,
      "nik": "EMP001",
      "nama_lengkap": "John Doe",
      "email": "employee@company.com",
      "role": "karyawan",
      ...
    }
  }
}
```

### Test 3: Get Current User

Copy token dari response login, lalu:

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 Database Tables Created

Setelah seeder berjalan, tabel berikut akan dibuat:

1. **users** - 5 users (1 admin, 1 hr, 1 manager, 2 employees)
2. **departemen** - 3 departments (IT, HR, Finance)
3. **shift_kerja** - 3 shifts (Regular, Pagi, Siang)
4. **absensi_harian** - Empty (siap untuk data absensi)

---

## 🔐 Test Accounts

| Role | NIK | Password | Email |
|------|-----|----------|-------|
| Admin | ADMIN001 | admin123 | admin@company.com |
| HR | HR001 | hr123 | hr@company.com |
| Manager | MGR001 | manager123 | manager@company.com |
| Employee | EMP001 | emp123 | employee@company.com |
| Employee | EMP002 | emp123 | jane@company.com |

---

## 🎯 Next Development Steps

### Phase 1: Core Absensi (Next)
- [ ] Create absensiController.js
- [ ] Implement POST /api/absensi/masuk
- [ ] Implement POST /api/absensi/pulang
- [ ] Implement GET /api/absensi/today
- [ ] Implement GET /api/absensi/history
- [ ] Add validation & error handling

### Phase 2: Cuti System
- [ ] Create Cuti model
- [ ] Create cutiController.js
- [ ] Implement cuti endpoints
- [ ] Add approval flow

### Phase 3: Face Recognition
- [ ] Add face recognition service
- [ ] Integrate with absensi
- [ ] Add photo upload

### Phase 4: Slip Gaji
- [ ] Create SlipGaji model
- [ ] Implement calculation logic
- [ ] Add PDF generation

---

## 🐛 Troubleshooting

### Error: "Unable to connect to database"
**Solution:**
- Pastikan PostgreSQL service running
- Cek credentials di `.env`
- Test koneksi: `psql -U postgres -d employee_attendance`

### Error: "Port 3000 already in use"
**Solution:**
- Ubah PORT di `.env` menjadi 3001 atau port lain
- Atau kill process: `netstat -ano | findstr :3000` lalu `taskkill /PID <PID> /F`

### Error: "Module not found"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database tables not created
**Solution:**
```bash
# Run seeder again (will drop and recreate tables)
node src/seeders/run.js
```

---

## 📝 Notes

- Backend menggunakan **Sequelize ORM** untuk database operations
- Password di-hash menggunakan **bcryptjs**
- Authentication menggunakan **JWT (JSON Web Tokens)**
- API mengikuti **RESTful** conventions
- Error handling menggunakan standard format

---

## ✅ Checklist Setup

- [ ] PostgreSQL installed & running
- [ ] Database `employee_attendance` created
- [ ] `.env` file configured
- [ ] Dependencies installed (`npm install`)
- [ ] Seeder executed successfully
- [ ] Server running (`npm run dev`)
- [ ] API tested (health check & login)

---

Jika semua checklist di atas sudah ✅, maka backend Anda siap untuk development selanjutnya!

**Lanjut ke:** Implementasi Absensi Controller
