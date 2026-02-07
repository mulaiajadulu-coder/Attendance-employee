# 🔧 Setup Git untuk Version Control (Recommended)

## ⚠️ Git Belum Terinstall

Saat ini Git belum terinstall di system kamu. Git sangat direkomendasikan untuk:
- ✅ Version control yang lebih baik dari backup manual
- ✅ Easy rollback ke checkpoint sebelumnya
- ✅ Branch untuk develop fitur baru dengan aman
- ✅ Collaboration dengan tim (jika ada)
- ✅ Track semua perubahan dengan detail

---

## 📥 Install Git (Optional but Highly Recommended)

### Download Git untuk Windows:
1. Buka: https://git-scm.com/download/win
2. Download installer (64-bit recommended)
3. Install dengan default settings
4. Restart terminal/PowerShell

### Verify Installation:
```bash
git --version
# Output: git version 2.x.x
```

---

## 🚀 Quick Setup Git (After Installation)

### 1. Initialize Git Repository
```bash
cd C:\Penyimpanan\Desktop\employee-attendance
git init
```

### 2. Configure Git (First time only)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Create First Checkpoint
```bash
# Stage all files
git add .

# Create checkpoint commit
git commit -m "🔖 Checkpoint: Stable v1.0 - Production Ready 85%"
```

### 4. Create Branch untuk Fitur Baru
```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Develop di branch ini
# Jika ada masalah, tinggal switch back:
git checkout main
```

---

## 📝 Git Workflow untuk Development

### Sebelum Develop Fitur Baru:
```bash
# 1. Pastikan di main branch yang clean
git checkout main
git status

# 2. Create checkpoint (commit)
git add .
git commit -m "Checkpoint before feature X"

# 3. Create branch baru
git checkout -b feature/feature-name

# 4. Develop dengan bebas!
```

### Jika Fitur Sukses:
```bash
# 1. Commit changes
git add .
git commit -m "✅ Feature X completed"

# 2. Merge ke main
git checkout main
git merge feature/feature-name

# 3. Delete feature branch (optional)
git branch -d feature/feature-name
```

### Jika Fitur Gagal/Banyak Error:
```bash
# Option 1: Balik ke main branch (abandon changes)
git checkout main

# Option 2: Reset to specific commit
git log --oneline  # Lihat commit history
git reset --hard <commit-hash>

# Option 3: Stash changes (simpan untuk nanti)
git stash
git checkout main
```

---

## 🎯 Git vs Manual Backup

| Feature | Manual Backup | Git |
|---------|---------------|-----|
| **Space** | ~500 MB per backup | ~500 MB total (semua history) |
| **Speed** | Slow (copy files) | Fast (delta storage) |
| **Rollback** | Manual copy-paste | `git checkout` |
| **History** | Lost | Full history |
| **Branching** | ❌ None | ✅ Unlimited |
| **Merge** | ❌ Manual | ✅ Automatic |
| **Collaboration** | ❌ Sulit | ✅ Easy |

**Recommendation**: Use Git for development, keep manual backup as extra safety net.

---

## 📚 Useful Git Commands

### View History:
```bash
git log --oneline --graph --all
git log --stat  # With file changes
```

### Check Status:
```bash
git status
git diff  # View changes
```

### Undo Changes:
```bash
git restore <file>           # Undo file changes
git restore --staged <file>  # Unstage file
git reset --hard HEAD        # Undo all changes (dangerous!)
```

### Branch Management:
```bash
git branch                   # List branches
git branch -a                # List all branches
git checkout -b new-branch   # Create + switch
git branch -d branch-name    # Delete branch
```

---

## 🔒 Git Ignore Already Setup

File `.gitignore` sudah dibuat dengan exclude:
- ✅ `node_modules/` - Dependencies (akan di-reinstall)
- ✅ `.env` - Environment variables (sensitive!)
- ✅ `*.log` - Log files
- ✅ `uploads/*` - User uploaded files
- ✅ `certs/*` - SSL certificates

Ini berarti Git akan ignore file-file tersebut, hemat space!

---

## 🎓 Learn More

- Git Documentation: https://git-scm.com/doc
- GitHub Guides: https://guides.github.com/
- Interactive Tutorial: https://learngitbranching.js.org/

---

## ✅ Current Backup Status (Without Git)

**Manual Backup Sudah Dibuat!** ✅

Folder: `C:\Penyimpanan\Desktop\employee-attendance_BACKUP_2026-02-02_113542`

Backup ini sudah cukup untuk safety net. Git hanya untuk convenience dan professional workflow.

---

**You're safe to develop now!** 🚀

Either way (dengan atau tanpa Git), kamu punya backup yang aman untuk restore jika needed.

---

**Note**: Jika mau install Git nanti, tinggal run commands di atas. Semua file sudah ready dengan `.gitignore` yang proper.
