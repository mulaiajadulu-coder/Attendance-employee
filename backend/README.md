# Employee Attendance System - Backend

Backend API untuk sistem kekaryawanan/SDM dengan fitur absensi, cuti, dan slip gaji.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm atau yarn

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Setup database**

Buat database PostgreSQL:
```sql
CREATE DATABASE employee_attendance;
```

3. **Configure environment**

Copy `.env.example` ke `.env` dan sesuaikan:
```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_attendance
DB_USER=postgres
DB_PASSWORD=your_password
```

4. **Run database seeder**

Ini akan membuat tabel dan data awal:
```bash
node src/seeders/run.js
```

5. **Start development server**
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Departemen.js         # Departemen model
│   │   ├── Shift.js              # Shift model
│   │   ├── Absensi.js            # Absensi model
│   │   └── index.js              # Models index & relationships
│   ├── controllers/
│   │   └── authController.js     # Authentication controller
│   ├── middlewares/
│   │   ├── authenticate.js       # JWT authentication middleware
│   │   └── authorize.js          # Role authorization middleware
│   ├── routes/
│   │   └── auth.js               # Authentication routes
│   ├── seeders/
│   │   ├── seed.js               # Database seeder
│   │   └── run.js                # Seeder runner
│   └── app.js                    # Main application file
├── .env                          # Environment variables
├── .env.example                  # Environment variables template
├── .gitignore
└── package.json
```

---

## 🔌 API Endpoints

### Authentication

#### POST `/api/auth/login`
Login user

**Request:**
```json
{
  "nik": "EMP001",
  "password": "emp123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 1,
      "nik": "EMP001",
      "nama_lengkap": "John Doe",
      "email": "employee@company.com",
      "role": "karyawan",
      "departemen": {...},
      "shift_default": {...}
    }
  }
}
```

#### GET `/api/auth/me`
Get current user (requires authentication)

**Headers:**
```
Authorization: Bearer {token}
```

#### PUT `/api/auth/change-password`
Change password (requires authentication)

**Request:**
```json
{
  "old_password": "emp123",
  "new_password": "newpass123",
  "confirm_password": "newpass123"
}
```

#### POST `/api/auth/refresh`
Refresh JWT token

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

---

## 👥 Test Accounts

Setelah menjalankan seeder, Anda dapat login dengan akun berikut:

| Role | NIK | Password | Email |
|------|-----|----------|-------|
| Admin | ADMIN001 | admin123 | admin@company.com |
| HR | HR001 | hr123 | hr@company.com |
| Manager | MGR001 | manager123 | manager@company.com |
| Employee | EMP001 | emp123 | employee@company.com |
| Employee | EMP002 | emp123 | jane@company.com |

---

## 🗄️ Database Schema

### Tables Created:
- `users` - Master karyawan
- `departemen` - Master departemen
- `shift_kerja` - Master shift
- `absensi_harian` - Data absensi (akan diimplementasikan)

---

## 🔧 Development

### Run in development mode
```bash
npm run dev
```

### Run in production mode
```bash
npm start
```

### Reset database and reseed
```bash
node src/seeders/run.js
```

---

## 🧪 Testing API

### Using cURL

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nik":"EMP001","password":"emp123"}'
```

**Get current user:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Thunder Client / Postman

1. Import collection (akan dibuat)
2. Set environment variable `baseUrl` = `http://localhost:3000`
3. Test endpoints

---

## 📝 Next Steps

- [ ] Implement Absensi endpoints
- [ ] Implement Cuti endpoints
- [ ] Implement Koreksi Absensi endpoints
- [ ] Implement Slip Gaji endpoints
- [ ] Add face recognition service
- [ ] Add cron jobs (auto-generate alpha, etc)
- [ ] Add file upload for photos
- [ ] Add validation middleware
- [ ] Add unit tests

---

## 🐛 Troubleshooting

### Database connection error
- Pastikan PostgreSQL berjalan
- Cek credentials di `.env`
- Pastikan database sudah dibuat

### Port already in use
- Ubah PORT di `.env`
- Atau kill process yang menggunakan port 3000

### Module not found
- Jalankan `npm install` lagi
- Hapus `node_modules` dan `package-lock.json`, lalu install ulang

---

## 📄 License

ISC
