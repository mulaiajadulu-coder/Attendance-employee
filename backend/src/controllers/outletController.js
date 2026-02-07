const { Outlet } = require('../models');

// Helper: Calculate distance (Haversine Formula) return meters
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000; // Distance in meters
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// 1. Create Outlet
exports.createOutlet = async (req, res) => {
    try {
        const { nama, alamat, latitude, longitude, radius_meter } = req.body;

        const outlet = await Outlet.create({
            nama,
            alamat,
            latitude,
            longitude,
            radius_meter: radius_meter || 100
        });

        res.status(201).json({
            success: true,
            message: 'Outlet berhasil ditambahkan',
            data: outlet
        });
    } catch (error) {
        console.error('Create Outlet Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 2. Get All Outlets (Admin)
exports.getAllOutlets = async (req, res) => {
    try {
        const outlets = await Outlet.findAll({
            order: [['nama', 'ASC']]
        });

        res.json({
            success: true,
            data: outlets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 3. Update Outlet
exports.updateOutlet = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, alamat, latitude, longitude, radius_meter, is_active } = req.body;

        const outlet = await Outlet.findByPk(id);
        if (!outlet) {
            return res.status(404).json({ success: false, message: 'Outlet tidak ditemukan' });
        }

        await outlet.update({
            nama,
            alamat,
            latitude,
            longitude,
            radius_meter,
            is_active
        });

        res.json({
            success: true,
            message: 'Outlet berhasil diupdate',
            data: outlet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 4. Delete Outlet
exports.deleteOutlet = async (req, res) => {
    try {
        const { id } = req.params;
        const outlet = await Outlet.findByPk(id);
        if (!outlet) {
            return res.status(404).json({ success: false, message: 'Outlet tidak ditemukan' });
        }

        await outlet.destroy();
        res.json({
            success: true,
            message: 'Outlet berhasil dihapus'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 5. Get Nearby Outlets (For User App)
exports.getNearbyOutlets = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'Latitude dan Longitude diperlukan' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        // Fetch all active outlets
        // Note: For large datasets, use PostGIS or bounding box query. For now (small number of outlets), JS filter is fine.
        const outlets = await Outlet.findAll({
            where: { is_active: true }
        });

        const nearbyOutlets = outlets.map(outlet => {
            const distance = getDistanceFromLatLonInMeters(userLat, userLng, outlet.latitude, outlet.longitude);
            return {
                ...outlet.toJSON(),
                distance_meters: Math.round(distance),
                is_within_radius: distance <= outlet.radius_meter
            };
        }).filter(o => o.is_within_radius); // Only return valid ones? Or return all sorted? 
        // User Requirement: "Misal ... Kids Kingdom ... muncul pilihan store baru bisa absen"
        // Let's return valid ones mostly. But maybe 1-2 closest ones even if slightly out of range just in case?
        // Let's stick to returning only "Valid" ones for simplicity of UI first, or maybe sorted by distance.

        // Sorting by distance
        nearbyOutlets.sort((a, b) => a.distance_meters - b.distance_meters);

        res.json({
            success: true,
            data: nearbyOutlets // Returns array of outlets user is close to
        });

    } catch (error) {
        console.error('Get Nearby Outlets Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
