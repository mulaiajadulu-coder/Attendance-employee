const { Notification, User } = require('../models');
const { Op } = require('sequelize');

exports.getNotifications = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const notifications = await Notification.findAll({
            where: {
                user_id: req.user.id,
                created_at: { [Op.gt]: sevenDaysAgo }
            },
            include: [
                { model: User, as: 'actor', attributes: ['id', 'nama_lengkap', 'nik'] }
            ],
            order: [['created_at', 'DESC']],
            limit: 50
        });

        // Calculate unread count (only for those visible in the last 7 days)
        const unreadCount = await Notification.count({
            where: {
                user_id: req.user.id,
                read: false,
                created_at: { [Op.gt]: sevenDaysAgo }
            }
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (err) {
        console.error('GetNotifications Error:', err);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
};

exports.markRead = async (req, res) => {
    try {
        const { id } = req.params;
        const n = await Notification.findByPk(id);
        if (!n || n.user_id !== req.user.id) return res.status(404).json({ error: { message: 'Not found' } });
        await n.update({ read: true });
        res.json({ message: 'Marked read' });
    } catch (err) {
        console.error('MarkRead Error:', err);
        res.status(500).json({ error: { message: 'Server Error' } });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        await Notification.update({ read: true }, { where: { user_id: req.user.id, read: false } });
        res.json({ message: 'All marked read' });
    } catch (err) {
        console.error('MarkAllRead Error:', err);
        res.status(500).json({ error: { message: 'Server Error' } });
    }
};