# Implementation Guide & Best Practices

## 🚀 Panduan Implementasi

### Phase 1: Setup & Foundation (Week 1-2)

#### 1.1 Project Initialization
```bash
# Backend (Node.js + Express example)
mkdir employee-attendance-backend
cd employee-attendance-backend
npm init -y
npm install express pg sequelize bcrypt jsonwebtoken dotenv cors
npm install -D nodemon

# Frontend (React + Vite example)
npm create vite@latest employee-attendance-frontend -- --template react
cd employee-attendance-frontend
npm install axios react-router-dom zustand date-fns
```

#### 1.2 Database Setup
```sql
-- Create database
CREATE DATABASE employee_attendance;

-- Create user
CREATE USER attendance_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE employee_attendance TO attendance_user;

-- Run migration scripts (create tables sesuai ERD)
```

#### 1.3 Project Structure

**Backend Structure:**
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── jwt.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Absensi.js
│   │   ├── Cuti.js
│   │   ├── KoreksiAbsensi.js
│   │   ├── SlipGaji.js
│   │   ├── Shift.js
│   │   ├── HariLibur.js
│   │   └── Departemen.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── absensiController.js
│   │   ├── cutiController.js
│   │   ├── koreksiController.js
│   │   ├── slipGajiController.js
│   │   └── masterDataController.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── roleCheck.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── absensi.js
│   │   ├── cuti.js
│   │   ├── koreksi.js
│   │   ├── slipGaji.js
│   │   └── masterData.js
│   ├── services/
│   │   ├── absensiService.js
│   │   ├── cutiService.js
│   │   ├── slipGajiService.js
│   │   └── notificationService.js
│   ├── utils/
│   │   ├── dateHelper.js
│   │   ├── calculator.js
│   │   └── validator.js
│   ├── jobs/
│   │   ├── autoGenerateAlpha.js
│   │   ├── autoGenerateCuti.js
│   │   └── reminderAbsenPulang.js
│   └── app.js
├── migrations/
├── seeders/
├── .env
└── package.json
```

**Frontend Structure:**
```
frontend/
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Badge.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   └── features/
│   │       ├── absensi/
│   │       ├── cuti/
│   │       ├── koreksi/
│   │       └── slipGaji/
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Absensi.jsx
│   │   ├── Cuti.jsx
│   │   ├── SlipGaji.jsx
│   │   └── MasterData/
│   ├── store/
│   │   ├── authStore.js
│   │   ├── absensiStore.js
│   │   └── notificationStore.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── absensiService.js
│   │   └── cutiService.js
│   ├── utils/
│   │   ├── dateFormatter.js
│   │   └── constants.js
│   ├── styles/
│   │   ├── index.css
│   │   └── variables.css
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

---

### Phase 2: Core Features (Week 3-6)

#### 2.1 Authentication & Authorization

**Backend: authController.js**
```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { nik, password } = req.body;
    
    // Find user
    const user = await User.findOne({ 
      where: { nik },
      include: ['departemen', 'shift_default']
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'NIK atau password salah' }
      });
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'NIK atau password salah' }
      });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, nik: user.nik, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          nik: user.nik,
          nama_lengkap: user.nama_lengkap,
          email: user.email,
          role: user.role,
          departemen: user.departemen,
          shift_default: user.shift_default
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};
```

**Middleware: auth.js**
```javascript
const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token tidak ditemukan' }
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token invalid atau expired' }
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses' }
      });
    }
    next();
  };
};
```

---

#### 2.2 Absensi Module

**Backend: absensiController.js**
```javascript
const Absensi = require('../models/Absensi');
const User = require('../models/User');
const Shift = require('../models/Shift');
const { calculateLate, calculateWorkHours } = require('../utils/calculator');

exports.absenMasuk = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lokasi } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in
    const existing = await Absensi.findOne({
      where: { user_id: userId, tanggal: today }
    });
    
    if (existing && existing.jam_masuk) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CHECKED_IN', message: 'Anda sudah absen masuk hari ini' }
      });
    }
    
    // Get user's shift
    const user = await User.findByPk(userId, { include: 'shift_default' });
    const shift = user.shift_default;
    
    // Calculate late status
    const jamMasuk = new Date();
    const { isLate, minutesLate } = calculateLate(jamMasuk, shift);
    
    // Create or update absensi
    const absensi = existing 
      ? await existing.update({
          jam_masuk: jamMasuk,
          shift_id: shift.id,
          status_hadir: 'hadir',
          status_terlambat: isLate,
          menit_terlambat: minutesLate,
          lokasi_masuk: lokasi
        })
      : await Absensi.create({
          user_id: userId,
          tanggal: today,
          jam_masuk: jamMasuk,
          shift_id: shift.id,
          status_hadir: 'hadir',
          status_terlambat: isLate,
          menit_terlambat: minutesLate,
          lokasi_masuk: lokasi
        });
    
    res.json({
      success: true,
      message: isLate ? `Absen masuk berhasil. Anda terlambat ${minutesLate} menit` : 'Absen masuk berhasil',
      data: absensi
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};

exports.absenPulang = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lokasi } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if checked in
    const absensi = await Absensi.findOne({
      where: { user_id: userId, tanggal: today }
    });
    
    if (!absensi || !absensi.jam_masuk) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_CHECKED_IN', message: 'Anda belum absen masuk' }
      });
    }
    
    if (absensi.jam_pulang) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CHECKED_OUT', message: 'Anda sudah absen pulang' }
      });
    }
    
    // Calculate work hours
    const jamPulang = new Date();
    const totalJamKerja = calculateWorkHours(absensi.jam_masuk, jamPulang);
    
    await absensi.update({
      jam_pulang: jamPulang,
      total_jam_kerja: totalJamKerja,
      lokasi_pulang: lokasi
    });
    
    res.json({
      success: true,
      message: 'Absen pulang berhasil',
      data: absensi
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};
```

**Utils: calculator.js**
```javascript
exports.calculateLate = (jamMasuk, shift) => {
  const shiftStart = new Date(jamMasuk);
  const [hours, minutes] = shift.jam_masuk.split(':');
  shiftStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const toleransi = shift.toleransi_menit || 0;
  const batasToleransi = new Date(shiftStart.getTime() + toleransi * 60000);
  
  if (jamMasuk <= batasToleransi) {
    return { isLate: false, minutesLate: 0 };
  }
  
  const diffMs = jamMasuk - batasToleransi;
  const minutesLate = Math.ceil(diffMs / 60000);
  
  return { isLate: true, minutesLate };
};

exports.calculateWorkHours = (jamMasuk, jamPulang) => {
  const diffMs = jamPulang - new Date(jamMasuk);
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100; // Round to 2 decimal places
};
```

---

#### 2.3 Cron Jobs

**Jobs: autoGenerateAlpha.js**
```javascript
const cron = require('node-cron');
const { Op } = require('sequelize');
const Absensi = require('../models/Absensi');
const User = require('../models/User');
const HariLibur = require('../models/HariLibur');
const Cuti = require('../models/Cuti');

// Run every day at 23:59
cron.schedule('59 23 * * *', async () => {
  console.log('Running auto-generate alpha job...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if today is holiday
    const isHoliday = await HariLibur.findOne({ where: { tanggal: today } });
    if (isHoliday) {
      console.log('Today is holiday, skipping...');
      return;
    }
    
    // Get all active users
    const users = await User.findAll({ where: { status_aktif: true } });
    
    for (const user of users) {
      // Check if user has absensi record today
      const absensi = await Absensi.findOne({
        where: { user_id: user.id, tanggal: today }
      });
      
      if (absensi) continue; // Already has record
      
      // Check if user is on leave
      const cuti = await Cuti.findOne({
        where: {
          user_id: user.id,
          status_approval: 'approved',
          tanggal_mulai: { [Op.lte]: today },
          tanggal_selesai: { [Op.gte]: today }
        }
      });
      
      if (cuti) continue; // User is on leave
      
      // Create alpha record
      await Absensi.create({
        user_id: user.id,
        tanggal: today,
        shift_id: user.shift_default_id,
        status_hadir: 'alpha',
        status_terlambat: false,
        menit_terlambat: 0,
        total_jam_kerja: 0,
        catatan: 'Auto-generated: Alpha'
      });
      
      console.log(`Generated alpha for user ${user.nik}`);
    }
    
    console.log('Auto-generate alpha job completed');
  } catch (error) {
    console.error('Error in auto-generate alpha job:', error);
  }
});
```

---

### Phase 3: Approval Flow (Week 7-8)

#### 3.1 Cuti Approval

**Backend: cutiController.js**
```javascript
exports.approveCuti = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan_approval } = req.body;
    const approverId = req.user.id;
    
    const cuti = await Cuti.findByPk(id, { include: 'user' });
    
    if (!cuti) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cuti tidak ditemukan' }
      });
    }
    
    if (cuti.status_approval !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Cuti sudah diproses' }
      });
    }
    
    // Update cuti status
    await cuti.update({
      status_approval: 'approved',
      approved_by: approverId,
      approved_at: new Date(),
      catatan_approval
    });
    
    // Generate absensi records for leave dates
    const dates = getDateRange(cuti.tanggal_mulai, cuti.tanggal_selesai);
    for (const date of dates) {
      // Skip weekends and holidays
      if (isWeekend(date) || await isHoliday(date)) continue;
      
      await Absensi.upsert({
        user_id: cuti.user_id,
        tanggal: date,
        shift_id: cuti.user.shift_default_id,
        status_hadir: 'cuti',
        status_terlambat: false,
        menit_terlambat: 0,
        total_jam_kerja: 0
      });
    }
    
    // Send notification to user
    await sendNotification(cuti.user_id, {
      type: 'cuti_approved',
      title: 'Cuti Disetujui',
      message: `Pengajuan cuti Anda untuk ${cuti.tanggal_mulai} - ${cuti.tanggal_selesai} telah disetujui`
    });
    
    res.json({
      success: true,
      message: 'Cuti berhasil di-approve',
      data: cuti
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};
```

---

### Phase 4: Payroll (Week 9-10)

#### 4.1 Generate Slip Gaji

**Backend: slipGajiService.js**
```javascript
const { Op } = require('sequelize');
const Absensi = require('../models/Absensi');
const SlipGaji = require('../models/SlipGaji');
const User = require('../models/User');

exports.generateSlipGaji = async (periode_bulan, periode_tahun, userIds = null) => {
  try {
    // Get users to process
    const users = userIds 
      ? await User.findAll({ where: { id: userIds } })
      : await User.findAll({ where: { status_aktif: true } });
    
    const results = [];
    
    for (const user of users) {
      // Get all absensi for the period
      const absensiList = await Absensi.findAll({
        where: {
          user_id: user.id,
          tanggal: {
            [Op.and]: [
              { [Op.gte]: `${periode_tahun}-${String(periode_bulan).padStart(2, '0')}-01` },
              { [Op.lt]: getNextMonth(periode_bulan, periode_tahun) }
            ]
          }
        }
      });
      
      // Calculate statistics
      const stats = calculateAbsensiStats(absensiList);
      
      // Calculate salary
      const gaji = calculateSalary(user, stats);
      
      // Create slip gaji
      const slip = await SlipGaji.create({
        user_id: user.id,
        periode_bulan,
        periode_tahun,
        gaji_pokok: gaji.gaji_pokok,
        tunjangan: gaji.tunjangan,
        potongan: gaji.potongan,
        total_hari_kerja: stats.total_hari_kerja,
        total_hari_hadir: stats.total_hari_hadir,
        total_hari_alpha: stats.total_hari_alpha,
        total_hari_cuti: stats.total_hari_cuti,
        total_jam_kerja: stats.total_jam_kerja,
        total_terlambat: stats.total_terlambat,
        potongan_terlambat: gaji.potongan_terlambat,
        total_gaji_bersih: gaji.total_gaji_bersih,
        status: 'draft',
        generated_by: user.id,
        generated_at: new Date()
      });
      
      results.push(slip);
    }
    
    return results;
  } catch (error) {
    throw error;
  }
};

function calculateAbsensiStats(absensiList) {
  return {
    total_hari_kerja: absensiList.length,
    total_hari_hadir: absensiList.filter(a => a.status_hadir === 'hadir').length,
    total_hari_alpha: absensiList.filter(a => a.status_hadir === 'alpha').length,
    total_hari_cuti: absensiList.filter(a => a.status_hadir === 'cuti').length,
    total_jam_kerja: absensiList.reduce((sum, a) => sum + (a.total_jam_kerja || 0), 0),
    total_terlambat: absensiList.filter(a => a.status_terlambat).length,
    total_menit_terlambat: absensiList.reduce((sum, a) => sum + (a.menit_terlambat || 0), 0)
  };
}

function calculateSalary(user, stats) {
  const gaji_pokok = user.gaji_pokok || 8000000;
  const tunjangan = 1000000;
  const potongan = 500000;
  
  // Potongan keterlambatan: Rp 100.000 per jam
  const potongan_terlambat = Math.floor((stats.total_menit_terlambat / 60) * 100000);
  
  // Potongan alpha: gaji_pokok / total_hari_kerja per hari
  const potongan_alpha = stats.total_hari_alpha * (gaji_pokok / stats.total_hari_kerja);
  
  const total_gaji_bersih = gaji_pokok + tunjangan - potongan - potongan_terlambat - potongan_alpha;
  
  return {
    gaji_pokok,
    tunjangan,
    potongan,
    potongan_terlambat,
    potongan_alpha,
    total_gaji_bersih: Math.round(total_gaji_bersih)
  };
}
```

---

## 🎨 Frontend Implementation

### Component Example: AbsenButton.jsx
```jsx
import { useState } from 'react';
import { absenMasuk, absenPulang } from '../services/absensiService';
import Button from './common/Button';

export default function AbsenButton({ type, disabled, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  const handleAbsen = async () => {
    setLoading(true);
    try {
      const result = type === 'masuk' 
        ? await absenMasuk()
        : await absenPulang();
      
      alert(result.message);
      onSuccess?.(result.data);
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      onClick={handleAbsen}
      disabled={disabled || loading}
      variant={type === 'masuk' ? 'primary' : 'secondary'}
    >
      {loading ? 'Processing...' : type === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'}
    </Button>
  );
}
```

### CSS Variables (variables.css)
```css
:root {
  /* Colors */
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-secondary: #3B82F6;
  --color-white: #FFFFFF;
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-600: #4B5563;
  --color-gray-900: #1F2937;
  
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
}
```

---

## 🔒 Security Best Practices

### 1. Password Security
```javascript
// Hash password with bcrypt (cost factor 10)
const hashedPassword = await bcrypt.hash(password, 10);

// Password validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
// Min 8 chars, 1 uppercase, 1 lowercase, 1 number
```

### 2. SQL Injection Prevention
```javascript
// ✅ GOOD: Use parameterized queries (Sequelize ORM)
const user = await User.findOne({ where: { nik: userInput } });

// ❌ BAD: Never use raw queries with user input
const query = `SELECT * FROM users WHERE nik = '${userInput}'`;
```

### 3. XSS Prevention
```javascript
// Sanitize user input
const sanitizeHtml = require('sanitize-html');
const clean = sanitizeHtml(userInput, {
  allowedTags: [],
  allowedAttributes: {}
});
```

### 4. CORS Configuration
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### 5. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/login', loginLimiter, authController.login);
```

---

## 📊 Performance Optimization

### 1. Database Indexing
```sql
-- Index for frequent queries
CREATE INDEX idx_absensi_user_tanggal ON absensi_harian(user_id, tanggal);
CREATE INDEX idx_absensi_tanggal ON absensi_harian(tanggal);
CREATE INDEX idx_cuti_user_status ON cuti(user_id, status_approval);
CREATE INDEX idx_slip_periode ON slip_gaji(periode_bulan, periode_tahun);
```

### 2. Query Optimization
```javascript
// ✅ GOOD: Use eager loading
const user = await User.findByPk(id, {
  include: ['departemen', 'shift_default', 'atasan']
});

// ❌ BAD: N+1 query problem
const users = await User.findAll();
for (const user of users) {
  const departemen = await Departemen.findByPk(user.departemen_id);
}
```

### 3. Caching (Redis)
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache user data
const getUserData = async (userId) => {
  const cached = await client.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const user = await User.findByPk(userId);
  await client.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
};
```

---

## 🧪 Testing Strategy

### 1. Unit Testing (Jest)
```javascript
// absensiService.test.js
const { calculateLate } = require('../utils/calculator');

describe('calculateLate', () => {
  it('should return not late when within tolerance', () => {
    const jamMasuk = new Date('2026-01-31T08:10:00');
    const shift = { jam_masuk: '08:00', toleransi_menit: 15 };
    
    const result = calculateLate(jamMasuk, shift);
    
    expect(result.isLate).toBe(false);
    expect(result.minutesLate).toBe(0);
  });
  
  it('should return late when exceeds tolerance', () => {
    const jamMasuk = new Date('2026-01-31T08:20:00');
    const shift = { jam_masuk: '08:00', toleransi_menit: 15 };
    
    const result = calculateLate(jamMasuk, shift);
    
    expect(result.isLate).toBe(true);
    expect(result.minutesLate).toBe(5);
  });
});
```

### 2. Integration Testing
```javascript
// absensi.test.js
const request = require('supertest');
const app = require('../app');

describe('POST /api/absensi/masuk', () => {
  it('should create absensi masuk successfully', async () => {
    const token = 'valid_jwt_token';
    
    const response = await request(app)
      .post('/api/absensi/masuk')
      .set('Authorization', `Bearer ${token}`)
      .send({ lokasi: '-6.200000,106.816666' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('jam_masuk');
  });
});
```

---

## 📦 Deployment

### 1. Environment Variables
```env
# .env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_attendance
DB_USER=attendance_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 2. Docker Setup
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: employee_attendance
      POSTGRES_USER: attendance_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
    depends_on:
      - postgres
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 📝 Documentation Checklist

- [x] System Architecture
- [x] Database ERD
- [x] API Documentation
- [x] Business Process Flow
- [x] Implementation Guide
- [ ] User Manual
- [ ] Deployment Guide
- [ ] Troubleshooting Guide

