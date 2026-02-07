const { Announcement, User } = require('../models');
const { Op } = require('sequelize');

// Create new announcement
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, priority, role_targets, expires_at } = req.body;
        const userId = req.user.id;

        // Check permission - authorized roles only
        const authorizedRoles = ['hr', 'hr_cabang', 'hr_manager', 'area_manager', 'manager', 'supervisor', 'accounting', 'finance', 'admin'];
        if (!authorizedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk membuat pengumuman' });
        }

        const announcement = await Announcement.create({
            created_by: userId,
            title,
            content,
            priority: priority || 'medium',
            role_targets: role_targets || null,
            expires_at: expires_at || null
        });

        res.status(201).json({
            success: true,
            message: 'Pengumuman berhasil dibuat',
            data: announcement
        });
    } catch (error) {
        console.error('Create Announcement Error:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat pengumuman' });
    }
};

// Get current announcements for user
exports.getAnnouncements = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const now = new Date();

        // 1. Get User's Ancestors (Chain of Command)
        let ancestorIds = [];
        let currentUser = await User.findByPk(userId, { attributes: ['id', 'atasan_id'] });

        // Simple loop to get up to 5 levels of ancestors to avoid infinite loops
        let currentAtasanId = currentUser.atasan_id;
        let depth = 0;
        while (currentAtasanId && depth < 5) {
            ancestorIds.push(currentAtasanId);
            const parent = await User.findByPk(currentAtasanId, { attributes: ['id', 'atasan_id'] });
            if (!parent) break;
            currentAtasanId = parent.atasan_id;
            depth++;
        }

        // Global roles that can broadcast to anyone (filtered by target_role)
        const globalBroadcasters = ['admin', 'hr', 'hr_manager', 'hr_cabang', 'accounting', 'finance'];

        // 2. Fetch all potentially relevant announcements
        // We fetch a bit more than needed and filter in JS for complex "Ancestor" logic
        const announcements = await Announcement.findAll({
            include: [{ model: User, as: 'creator', attributes: ['id', 'nama_lengkap', 'role'] }],
            order: [['createdAt', 'DESC']]
        });

        // 3. Filter visible announcements (Based on custom duration rules)
        const visibleAnnouncements = announcements.filter(a => {
            // Case A: I created it (Always visible to creator)
            if (a.created_by == userId) return true;

            // Define dynamic thresholds
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
            const createdAt = new Date(a.createdAt);

            // Time filter logic
            let isWithinThreshold = false;
            if (a.priority === 'urgent') {
                isWithinThreshold = createdAt > fifteenDaysAgo;
            } else {
                isWithinThreshold = createdAt > sevenDaysAgo;
            }

            // Case B: Must be Active & Not Expired & Within Threshold & Targeted to Me
            const isActive = a.is_active;
            const notExpired = !a.expires_at || new Date(a.expires_at) > now;
            const isTargeted = !a.role_targets || a.role_targets.includes(userRole);

            if (isActive && notExpired && isWithinThreshold && isTargeted) {
                // Further restriction: Who created it?
                const creatorRole = a.creator ? a.creator.role : '';

                // If creator is Global (HR, Admin, etc) -> Visible
                if (globalBroadcasters.includes(creatorRole)) return true;

                // If creator is NOT Global (Manager, Spv) -> Must be my direct/indirect Atasan
                if (ancestorIds.includes(a.created_by)) return true;

                // Otherwise (e.g. Manager from another store), hide it
                return false;
            }

            return false;
        });

        res.json({
            success: true,
            data: visibleAnnouncements
        });
    } catch (error) {
        console.error('Fetch Announcements Error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil pengumuman' });
    }
};

// Delete announcement (only creator or admin)
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByPk(id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });
        }

        if (announcement.created_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Anda tidak diizinkan menghapus pengumuman ini' });
        }

        await announcement.destroy();
        res.json({ success: true, message: 'Pengumuman berhasil dihapus' });
    } catch (error) {
        console.error('Delete Announcement Error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus pengumuman' });
    }
};
