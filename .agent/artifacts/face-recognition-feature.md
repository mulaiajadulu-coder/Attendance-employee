# Fitur Face Recognition untuk Absensi

## 🎯 Overview

Sistem absensi akan dilengkapi dengan **face recognition** untuk memvalidasi identitas karyawan saat absen masuk dan pulang. Setiap absensi harus disertai dengan foto selfie yang akan diverifikasi menggunakan teknologi deteksi wajah.

---

## 📋 Requirements

### Functional Requirements
1. ✅ Karyawan harus mengambil foto selfie saat absen masuk
2. ✅ Karyawan harus mengambil foto selfie saat absen pulang
3. ✅ Sistem harus mendeteksi wajah di foto (face detection)
4. ✅ Sistem harus memverifikasi kesesuaian wajah dengan foto profil (face recognition)
5. ✅ Foto absensi disimpan untuk audit trail
6. ✅ Tampilkan mark "Wajah Terdeteksi" saat berhasil
7. ✅ Reject absensi jika wajah tidak terdeteksi atau tidak cocok

### Non-Functional Requirements
1. ✅ Response time < 3 detik untuk verifikasi
2. ✅ Akurasi deteksi wajah > 95%
3. ✅ Support berbagai kondisi pencahayaan
4. ✅ Privacy & security (enkripsi foto)

---

## 🏗️ Architecture

### Technology Stack

#### Face Recognition Library
**Option 1: Face-api.js** (Recommended untuk web)
- JavaScript library
- Berjalan di browser (client-side)
- Lightweight & fast
- Support face detection, recognition, landmarks

**Option 2: Python + OpenCV + face_recognition**
- Server-side processing
- Lebih akurat
- Lebih resource-intensive

**Recommendation**: Hybrid approach
- **Face detection** di client-side (Face-api.js) untuk real-time feedback
- **Face recognition** di server-side (Python) untuk validasi final

#### Storage
- **Foto profil**: Stored saat registrasi/onboarding
- **Foto absensi**: Stored per absensi (masuk & pulang)
- **Storage**: Cloud Storage (AWS S3, Google Cloud Storage) atau Local Storage

---

## 📊 Database Schema Update

### Update Tabel: **users**
Tambahkan kolom untuk menyimpan foto profil:

```sql
ALTER TABLE users ADD COLUMN foto_profil_url VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN face_encoding TEXT NULL; -- JSON array untuk face recognition
```

### Update Tabel: **absensi_harian**
Tambahkan kolom untuk menyimpan foto absensi:

```sql
ALTER TABLE absensi_harian ADD COLUMN foto_masuk_url VARCHAR(255) NULL;
ALTER TABLE absensi_harian ADD COLUMN foto_pulang_url VARCHAR(255) NULL;
ALTER TABLE absensi_harian ADD COLUMN face_verified_masuk BOOLEAN DEFAULT false;
ALTER TABLE absensi_harian ADD COLUMN face_verified_pulang BOOLEAN DEFAULT false;
ALTER TABLE absensi_harian ADD COLUMN face_confidence_masuk DECIMAL(5,2) NULL; -- 0-100%
ALTER TABLE absensi_harian ADD COLUMN face_confidence_pulang DECIMAL(5,2) NULL;
```

### Schema Lengkap: **absensi_harian** (Updated)
```
id                      : BIGINT (PK)
user_id                 : BIGINT (FK -> users) NOT NULL
tanggal                 : DATE NOT NULL
jam_masuk               : TIMESTAMP NULL
jam_pulang              : TIMESTAMP NULL
shift_id                : BIGINT (FK -> shift_kerja) NOT NULL
status_hadir            : ENUM('hadir', 'alpha', 'cuti', 'sakit', 'izin', 'libur')
status_terlambat        : BOOLEAN DEFAULT false
menit_terlambat         : INT DEFAULT 0
total_jam_kerja         : DECIMAL(4,2) DEFAULT 0
mode_kerja              : ENUM('wfo', 'wfh', 'hybrid') DEFAULT 'wfo'
lokasi_masuk            : VARCHAR(255) NULL (GPS coordinates)
lokasi_pulang           : VARCHAR(255) NULL
foto_masuk_url          : VARCHAR(255) NULL ← NEW
foto_pulang_url         : VARCHAR(255) NULL ← NEW
face_verified_masuk     : BOOLEAN DEFAULT false ← NEW
face_verified_pulang    : BOOLEAN DEFAULT false ← NEW
face_confidence_masuk   : DECIMAL(5,2) NULL ← NEW
face_confidence_pulang  : DECIMAL(5,2) NULL ← NEW
catatan                 : TEXT NULL
is_locked               : BOOLEAN DEFAULT false
created_at              : TIMESTAMP
updated_at              : TIMESTAMP

UNIQUE KEY (user_id, tanggal)
INDEX (user_id, tanggal)
INDEX (tanggal)
```

---

## 🔄 Updated Flow: Absensi dengan Face Recognition

### Flow Absen Masuk (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│ KARYAWAN - ABSEN MASUK                                      │
└─────────────────────────────────────────────────────────────┘

1. Karyawan buka aplikasi → Klik "Absen Masuk"
    ↓
2. Aplikasi buka kamera (permission request)
    ↓
3. Tampilkan live camera feed dengan overlay:
   - Face detection box (real-time)
   - Instruksi: "Posisikan wajah di dalam frame"
   - Countdown: 3, 2, 1...
    ↓
4. CLIENT-SIDE: Face Detection (Face-api.js)
   ✓ Deteksi wajah di frame
   ✓ Validasi kualitas foto:
     - Wajah terdeteksi? ✓
     - Wajah cukup besar? ✓
     - Pencahayaan cukup? ✓
     - Tidak blur? ✓
    ↓
   [Jika validasi GAGAL]
   → Tampilkan error: "Wajah tidak terdeteksi. Coba lagi."
   → Kembali ke step 3
    ↓
   [Jika validasi BERHASIL]
   → Tampilkan mark: "✓ Wajah Terdeteksi"
   → Capture foto
    ↓
5. Upload foto ke server
    ↓
6. SERVER-SIDE: Face Recognition
   ✓ Load foto profil user dari database
   ✓ Extract face encoding dari foto absensi
   ✓ Compare dengan face encoding foto profil
   ✓ Calculate confidence score (0-100%)
    ↓
   [Jika confidence < 70%]
   → Response: "Wajah tidak cocok. Silakan coba lagi."
   → Kembali ke step 3
    ↓
   [Jika confidence >= 70%]
   → Lanjut ke validasi absensi
    ↓
7. Validasi Absensi (sama seperti sebelumnya)
   ✓ Cek apakah sudah absen hari ini?
   ✓ Ambil shift default
   ✓ Catat timestamp
   ✓ Hitung status terlambat
    ↓
8. Simpan record absensi:
   - jam_masuk = timestamp
   - foto_masuk_url = URL foto
   - face_verified_masuk = TRUE
   - face_confidence_masuk = confidence score
   - lokasi_masuk = GPS coordinates
    ↓
9. Response ke client:
   {
     "success": true,
     "message": "Absen masuk berhasil! Wajah terverifikasi.",
     "data": {
       "jam_masuk": "08:05",
       "status_terlambat": false,
       "face_verified": true,
       "face_confidence": 95.5
     }
   }
    ↓
10. Tampilkan success screen:
    - ✓ "Absen Masuk Berhasil"
    - "Wajah Terverifikasi (95.5%)"
    - Preview foto
    - Jam masuk: 08:05
```

### Flow Absen Pulang (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│ KARYAWAN - ABSEN PULANG                                     │
└─────────────────────────────────────────────────────────────┘

1. Karyawan klik "Absen Pulang"
    ↓
2. [SAMA seperti flow absen masuk, step 2-6]
    ↓
7. Validasi Absensi
   ✓ Cek apakah sudah absen masuk? → YES
   ✓ Cek apakah sudah absen pulang? → NO
   ✓ Catat timestamp
   ✓ Hitung total jam kerja
    ↓
8. Update record absensi:
   - jam_pulang = timestamp
   - foto_pulang_url = URL foto
   - face_verified_pulang = TRUE
   - face_confidence_pulang = confidence score
   - total_jam_kerja = calculated
   - lokasi_pulang = GPS coordinates
    ↓
9. Response & Success screen
```

---

## 🔌 API Updates

### **POST** `/api/absensi/masuk` (Updated)

**Request:**
```json
{
  "foto": "base64_encoded_image_string",
  "lokasi": "-6.200000,106.816666"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Absen masuk berhasil! Wajah terverifikasi.",
  "data": {
    "id": 123,
    "tanggal": "2026-01-31",
    "jam_masuk": "2026-01-31T08:05:00+07:00",
    "foto_masuk_url": "https://storage.example.com/absensi/123_masuk.jpg",
    "face_verified_masuk": true,
    "face_confidence_masuk": 95.5,
    "status_terlambat": false,
    "menit_terlambat": 5,
    "shift": {...}
  }
}
```

**Response (Face Not Detected):**
```json
{
  "success": false,
  "error": {
    "code": "FACE_NOT_DETECTED",
    "message": "Wajah tidak terdeteksi di foto. Silakan coba lagi."
  }
}
```

**Response (Face Not Matched):**
```json
{
  "success": false,
  "error": {
    "code": "FACE_NOT_MATCHED",
    "message": "Wajah tidak cocok dengan foto profil. Confidence: 45.2%"
  }
}
```

---

### **POST** `/api/absensi/pulang` (Updated)

**Request & Response:** Sama seperti `/absensi/masuk`

---

### **POST** `/api/users/upload-foto-profil` (New)

Upload foto profil untuk face recognition

**Request:**
```json
{
  "foto": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Foto profil berhasil diupload dan face encoding berhasil dibuat",
  "data": {
    "foto_profil_url": "https://storage.example.com/profiles/user_123.jpg",
    "face_detected": true
  }
}
```

---

## 💻 Implementation

### Frontend: React Component

**CameraCapture.jsx**
```jsx
import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    loadModels();
    startCamera();
    return () => stopCamera();
  }, []);

  const loadModels = async () => {
    const MODEL_URL = '/models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    setLoading(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        detectFace();
      }
    } catch (error) {
      alert('Tidak dapat mengakses kamera: ' + error.message);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const detectFace = async () => {
    if (!videoRef.current) return;

    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Draw detection box
    if (canvasRef.current && detections) {
      const canvas = canvasRef.current;
      const displaySize = { width: 640, height: 480 };
      faceapi.matchDimensions(canvas, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      
      setFaceDetected(true);
    } else {
      setFaceDetected(false);
    }

    // Continue detection loop
    requestAnimationFrame(detectFace);
  };

  const handleCapture = () => {
    if (!faceDetected) {
      alert('Wajah tidak terdeteksi. Posisikan wajah Anda di dalam frame.');
      return;
    }

    // Countdown
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        capturePhoto();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result); // base64 string
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="camera-capture">
      <div className="camera-container">
        <video ref={videoRef} width="640" height="480" />
        <canvas ref={canvasRef} className="overlay-canvas" />
        
        {countdown && (
          <div className="countdown">{countdown}</div>
        )}
        
        {faceDetected && !countdown && (
          <div className="face-detected-badge">
            ✓ Wajah Terdeteksi
          </div>
        )}
        
        {!faceDetected && !loading && (
          <div className="instruction">
            Posisikan wajah Anda di dalam frame
          </div>
        )}
      </div>

      <div className="actions">
        <button onClick={handleCapture} disabled={!faceDetected || countdown}>
          {countdown ? `Mengambil foto... ${countdown}` : 'Ambil Foto'}
        </button>
        <button onClick={onCancel} className="btn-secondary">
          Batal
        </button>
      </div>
    </div>
  );
}
```

**AbsenMasukPage.jsx**
```jsx
import { useState } from 'react';
import CameraCapture from '../components/CameraCapture';
import { absenMasuk } from '../services/absensiService';

export default function AbsenMasukPage() {
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCapture = async (photoBase64) => {
    setLoading(true);
    try {
      const result = await absenMasuk({
        foto: photoBase64,
        lokasi: await getCurrentLocation()
      });

      alert(`✓ ${result.message}\nWajah terverifikasi: ${result.data.face_confidence_masuk}%`);
      setShowCamera(false);
      // Refresh data
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || 'Terjadi kesalahan';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(`${position.coords.latitude},${position.coords.longitude}`);
        },
        () => resolve(null)
      );
    });
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCapture}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="absen-page">
      <h1>Absensi Masuk</h1>
      <button onClick={() => setShowCamera(true)} className="btn-primary">
        Absen Masuk dengan Foto
      </button>
    </div>
  );
}
```

---

### Backend: Python Face Recognition Service

**face_recognition_service.py**
```python
import face_recognition
import numpy as np
from PIL import Image
import io
import base64

class FaceRecognitionService:
    
    @staticmethod
    def detect_face(image_base64):
        """
        Detect face in image
        Returns: (bool, message)
        """
        try:
            # Decode base64 to image
            image_data = base64.b64decode(image_base64.split(',')[1])
            image = Image.open(io.BytesIO(image_data))
            image_np = np.array(image)
            
            # Detect faces
            face_locations = face_recognition.face_locations(image_np)
            
            if len(face_locations) == 0:
                return False, "Wajah tidak terdeteksi"
            
            if len(face_locations) > 1:
                return False, "Terdeteksi lebih dari satu wajah"
            
            return True, "Wajah terdeteksi"
            
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    @staticmethod
    def extract_face_encoding(image_base64):
        """
        Extract face encoding from image
        Returns: face_encoding (128-d vector) or None
        """
        try:
            image_data = base64.b64decode(image_base64.split(',')[1])
            image = Image.open(io.BytesIO(image_data))
            image_np = np.array(image)
            
            face_encodings = face_recognition.face_encodings(image_np)
            
            if len(face_encodings) == 0:
                return None
            
            return face_encodings[0].tolist()  # Convert to list for JSON storage
            
        except Exception as e:
            print(f"Error extracting face encoding: {e}")
            return None
    
    @staticmethod
    def compare_faces(known_encoding, unknown_encoding, tolerance=0.6):
        """
        Compare two face encodings
        Returns: (is_match, confidence)
        """
        try:
            known_np = np.array(known_encoding)
            unknown_np = np.array(unknown_encoding)
            
            # Calculate face distance (lower = more similar)
            distance = face_recognition.face_distance([known_np], unknown_np)[0]
            
            # Convert distance to confidence (0-100%)
            confidence = (1 - distance) * 100
            
            # Check if match
            is_match = distance <= tolerance
            
            return is_match, round(confidence, 2)
            
        except Exception as e:
            print(f"Error comparing faces: {e}")
            return False, 0.0
```

**absensi_controller.py** (Updated)
```python
from flask import request, jsonify
from models import Absensi, User
from services.face_recognition_service import FaceRecognitionService
from services.storage_service import StorageService
import json
from datetime import datetime

def absen_masuk():
    try:
        user_id = request.user_id  # From JWT middleware
        foto_base64 = request.json.get('foto')
        lokasi = request.json.get('lokasi')
        
        # 1. Detect face in photo
        face_detected, message = FaceRecognitionService.detect_face(foto_base64)
        if not face_detected:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'FACE_NOT_DETECTED',
                    'message': message
                }
            }), 400
        
        # 2. Extract face encoding from photo
        face_encoding = FaceRecognitionService.extract_face_encoding(foto_base64)
        if face_encoding is None:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'FACE_ENCODING_FAILED',
                    'message': 'Gagal mengekstrak data wajah'
                }
            }), 400
        
        # 3. Get user's profile face encoding
        user = User.query.get(user_id)
        if not user.face_encoding:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NO_PROFILE_FACE',
                    'message': 'Foto profil belum diupload. Silakan upload foto profil terlebih dahulu.'
                }
            }), 400
        
        profile_encoding = json.loads(user.face_encoding)
        
        # 4. Compare faces
        is_match, confidence = FaceRecognitionService.compare_faces(
            profile_encoding, 
            face_encoding,
            tolerance=0.6  # 60% threshold
        )
        
        if not is_match or confidence < 70:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'FACE_NOT_MATCHED',
                    'message': f'Wajah tidak cocok dengan foto profil. Confidence: {confidence}%'
                }
            }), 400
        
        # 5. Upload photo to storage
        foto_url = StorageService.upload_photo(
            foto_base64, 
            f'absensi/{user_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}_masuk.jpg'
        )
        
        # 6. Check existing absensi
        today = datetime.now().date()
        absensi = Absensi.query.filter_by(user_id=user_id, tanggal=today).first()
        
        if absensi and absensi.jam_masuk:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'ALREADY_CHECKED_IN',
                    'message': 'Anda sudah absen masuk hari ini'
                }
            }), 400
        
        # 7. Calculate late status
        jam_masuk = datetime.now()
        shift = user.shift_default
        is_late, minutes_late = calculate_late(jam_masuk, shift)
        
        # 8. Create or update absensi
        if absensi:
            absensi.jam_masuk = jam_masuk
            absensi.foto_masuk_url = foto_url
            absensi.face_verified_masuk = True
            absensi.face_confidence_masuk = confidence
            absensi.status_hadir = 'hadir'
            absensi.status_terlambat = is_late
            absensi.menit_terlambat = minutes_late
            absensi.lokasi_masuk = lokasi
        else:
            absensi = Absensi(
                user_id=user_id,
                tanggal=today,
                jam_masuk=jam_masuk,
                foto_masuk_url=foto_url,
                face_verified_masuk=True,
                face_confidence_masuk=confidence,
                shift_id=user.shift_default_id,
                status_hadir='hadir',
                status_terlambat=is_late,
                menit_terlambat=minutes_late,
                lokasi_masuk=lokasi
            )
            db.session.add(absensi)
        
        db.session.commit()
        
        # 9. Return success
        return jsonify({
            'success': True,
            'message': 'Absen masuk berhasil! Wajah terverifikasi.',
            'data': {
                'id': absensi.id,
                'tanggal': str(absensi.tanggal),
                'jam_masuk': absensi.jam_masuk.isoformat(),
                'foto_masuk_url': absensi.foto_masuk_url,
                'face_verified_masuk': True,
                'face_confidence_masuk': confidence,
                'status_terlambat': is_late,
                'menit_terlambat': minutes_late
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': str(e)
            }
        }), 500
```

---

## 🎨 UI/UX Design

### Camera Capture Screen
```
┌─────────────────────────────────────────────────────────┐
│  ← Kembali                    Absen Masuk               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌───────────────────────────────────────────────┐   │
│   │                                               │   │
│   │          [LIVE CAMERA FEED]                   │   │
│   │                                               │   │
│   │     ┌─────────────────────────┐              │   │
│   │     │  [FACE DETECTION BOX]   │              │   │
│   │     │                         │              │   │
│   │     │      👤 Wajah           │              │   │
│   │     │                         │              │   │
│   │     └─────────────────────────┘              │   │
│   │                                               │   │
│   └───────────────────────────────────────────────┘   │
│                                                         │
│              ✓ Wajah Terdeteksi                        │
│                                                         │
│   Posisikan wajah Anda di dalam frame                  │
│   Pastikan pencahayaan cukup                           │
│                                                         │
│   ┌─────────────────────────────────────────────┐     │
│   │          [AMBIL FOTO]                       │     │
│   └─────────────────────────────────────────────┘     │
│                                                         │
│              [Batal]                                    │
└─────────────────────────────────────────────────────────┘
```

### Success Screen
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ✓                                    │
│          Absen Masuk Berhasil!                         │
│                                                         │
│   ┌───────────────────────────────────────────────┐   │
│   │                                               │   │
│   │      [FOTO YANG DIAMBIL]                     │   │
│   │                                               │   │
│   └───────────────────────────────────────────────┘   │
│                                                         │
│   ✓ Wajah Terverifikasi (95.5%)                       │
│                                                         │
│   Jam Masuk: 08:05 WIB                                 │
│   Status: Tepat Waktu                                  │
│                                                         │
│   ┌─────────────────────────────────────────────┐     │
│   │          [Kembali ke Dashboard]             │     │
│   └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Security & Privacy

### 1. Data Encryption
```python
# Encrypt face encoding before storing
from cryptography.fernet import Fernet

def encrypt_face_encoding(encoding):
    key = os.getenv('ENCRYPTION_KEY')
    f = Fernet(key)
    encoded = json.dumps(encoding).encode()
    encrypted = f.encrypt(encoded)
    return encrypted.decode()

def decrypt_face_encoding(encrypted_encoding):
    key = os.getenv('ENCRYPTION_KEY')
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_encoding.encode())
    return json.loads(decrypted.decode())
```

### 2. Photo Storage Security
- Store photos in private bucket (not public)
- Use signed URLs with expiry
- Implement access control (only user & HR can view)

### 3. Privacy Compliance
- Inform user about face data collection
- Get consent during onboarding
- Allow user to delete face data
- Comply with GDPR/local privacy laws

---

## 📊 Configuration & Settings

### Admin Settings
```
┌─────────────────────────────────────────────────────────┐
│  Pengaturan Face Recognition                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Confidence Threshold:  [70]%                          │
│  (Minimal tingkat kemiripan wajah)                     │
│                                                         │
│  Face Detection Timeout: [10] detik                    │
│  (Maksimal waktu untuk mendeteksi wajah)               │
│                                                         │
│  Require Face Verification: [✓] Ya  [ ] Tidak         │
│  (Wajib verifikasi wajah saat absen)                   │
│                                                         │
│  Allow Manual Override: [ ] Ya  [✓] Tidak             │
│  (HR dapat approve absensi tanpa foto)                 │
│                                                         │
│  Photo Quality: [ ] Low  [✓] Medium  [ ] High         │
│  (Kualitas foto yang disimpan)                         │
│                                                         │
│  [Simpan Pengaturan]                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Test Cases
1. ✅ Happy path: Wajah terdeteksi dan cocok (confidence > 70%)
2. ✅ Wajah tidak terdeteksi di foto
3. ✅ Wajah terdeteksi tapi tidak cocok (confidence < 70%)
4. ✅ Lebih dari satu wajah terdeteksi
5. ✅ Foto blur atau pencahayaan buruk
6. ✅ User belum upload foto profil
7. ✅ Network error saat upload foto
8. ✅ Camera permission denied

---

## 📈 Performance Optimization

### 1. Client-Side Optimization
- Use TinyFaceDetector (faster, less accurate) for real-time detection
- Compress image before upload (max 1MB)
- Use WebWorker for face detection (non-blocking)

### 2. Server-Side Optimization
- Cache face encodings in Redis
- Use async processing for face recognition
- Implement queue system for high load

### 3. Storage Optimization
- Compress photos (JPEG quality 80%)
- Use CDN for photo delivery
- Implement photo cleanup (delete old photos after X months)

---

## 🚀 Deployment Checklist

- [ ] Install face-api.js models in frontend
- [ ] Install face_recognition library in backend
- [ ] Setup cloud storage (S3/GCS)
- [ ] Configure encryption keys
- [ ] Test camera permissions on different browsers
- [ ] Test face recognition accuracy
- [ ] Setup monitoring & alerts
- [ ] Prepare user documentation

---

## 📝 User Documentation

### Cara Menggunakan Absensi dengan Face Recognition

1. **Upload Foto Profil** (Pertama kali)
   - Buka menu Profil
   - Klik "Upload Foto Profil"
   - Ambil foto selfie dengan pencahayaan yang baik
   - Pastikan wajah terlihat jelas
   - Sistem akan memverifikasi dan menyimpan foto

2. **Absen Masuk/Pulang**
   - Klik tombol "Absen Masuk" atau "Absen Pulang"
   - Izinkan akses kamera
   - Posisikan wajah di dalam frame
   - Tunggu hingga muncul "✓ Wajah Terdeteksi"
   - Klik "Ambil Foto" atau tunggu countdown
   - Sistem akan memverifikasi wajah Anda
   - Jika berhasil, absensi tercatat

3. **Tips untuk Hasil Terbaik**
   - Gunakan pencahayaan yang cukup
   - Pastikan wajah tidak tertutup (masker, kacamata hitam)
   - Posisikan wajah menghadap kamera
   - Jangan bergerak saat foto diambil

---

## 🎯 Success Metrics

- **Accuracy**: > 95% face recognition accuracy
- **Speed**: < 3 seconds total processing time
- **User Satisfaction**: > 90% positive feedback
- **Fraud Prevention**: Reduce buddy punching by 99%

