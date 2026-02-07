# 🆘 QUICK RESTORE GUIDE

## ⚡ If Something Goes Wrong - QUICK STEPS

### 🔴 Emergency Restore (Copy-Paste ke Terminal)

```powershell
# Step 1: Backup error version (optional)
cd C:\Penyimpanan\Desktop
Rename-Item employee-attendance employee-attendance_ERROR_$(Get-Date -Format 'yyyyMMdd_HHmmss')

# Step 2: Restore from backup
Copy-Item employee-attendance_BACKUP_2026-02-02_113542 employee-attendance -Recurse

# Step 3: Reinstall backend dependencies
cd employee-attendance\backend
npm install

# Step 4: Reinstall frontend dependencies
cd ..\frontend
npm install

# Step 5: Done! Test the servers
Write-Host "✅ Restore completed!" -ForegroundColor Green
Write-Host "Start backend: cd ..\backend && npm run dev" -ForegroundColor Yellow
Write-Host "Start frontend: cd ..\frontend && npm run dev" -ForegroundColor Yellow
```

---

## 📋 Verification Checklist

After restore, verify:

- [ ] Backend folder exists with all files
- [ ] Frontend folder exists with all files
- [ ] `.env` file exists in backend
- [ ] `.env` file exists in frontend
- [ ] `node_modules/` di-reinstall di backend
- [ ] `node_modules/` di-reinstall di frontend
- [ ] Backend server dapat running: `npm run dev`
- [ ] Frontend server dapat running: `npm run dev`
- [ ] Dapat login dengan test account (ADMIN001 / admin123)

---

## 🔍 Quick Check Commands

```bash
# Check backend files
dir backend\src\models

# Check frontend files  
dir frontend\src\pages

# Check .env exists
dir backend\.env
dir frontend\.env

# Test backend
cd backend
npm run dev

# Test frontend (new terminal)
cd frontend
npm run dev
```

---

## 📱 Contact Info / Help

- Backup location: `C:\Penyimpanan\Desktop\employee-attendance_BACKUP_2026-02-02_113542`
- Full documentation: `CHECKPOINT_2026-02-02.md`
- Git guide: `GIT_SETUP_GUIDE.md`

---

**Keep this file handy for quick reference!** 🔖
