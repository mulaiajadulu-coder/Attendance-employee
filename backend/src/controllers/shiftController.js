const { Shift } = require('../models');

exports.getAllShifts = async (req, res) => {
    try {
        const shifts = await Shift.findAll({
            order: [['nama_shift', 'ASC']]
        });
        res.json({
            success: true,
            data: shifts
        });
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data shift'
        });
    }
};

exports.createShift = async (req, res) => {
    try {
        const shift = await Shift.create(req.body);
        res.json({
            success: true,
            data: shift
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal membuat shift'
        });
    }
};

exports.updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        await Shift.update(req.body, { where: { id } });
        res.json({
            success: true,
            message: 'Shift berhasil diperbarui'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui shift'
        });
    }
};

exports.deleteShift = async (req, res) => {
    try {
        const { id } = req.params;
        await Shift.destroy({ where: { id } });
        res.json({
            success: true,
            message: 'Shift berhasil dihapus'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus shift'
        });
    }
};
