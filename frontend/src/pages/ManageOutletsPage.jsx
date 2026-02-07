import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Search } from 'lucide-react';
import api from '../services/api';
import LocationPickerMap from '../components/ui/LocationPickerMap';

export default function ManageOutletsPage() {
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nama: '',
        alamat: '',
        latitude: '',
        longitude: '',
        radius_meter: 100,
        is_active: true
    });

    useEffect(() => {
        fetchOutlets();
    }, []);

    const fetchOutlets = async () => {
        try {
            const res = await api.get('/outlets');
            setOutlets(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/outlets/${editingId}`, formData);
            } else {
                await api.post('/outlets', formData);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ nama: '', alamat: '', latitude: '', longitude: '', radius_meter: 100, is_active: true });
            fetchOutlets();
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan data.');
        }
    };

    const handleEdit = (outlet) => {
        setEditingId(outlet.id);
        setFormData({
            nama: outlet.nama,
            alamat: outlet.alamat,
            latitude: outlet.latitude,
            longitude: outlet.longitude,
            radius_meter: outlet.radius_meter,
            is_active: outlet.is_active
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus outlet ini?')) return;
        try {
            await api.delete(`/outlets/${id}`);
            fetchOutlets();
        } catch (err) {
            console.error(err);
            alert('Gagal menghapus.');
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }));
            });
        } else {
            alert("Geolocation not supported");
        }
    };

    if (loading) return <div className="p-8 text-center">Memuat data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Manajemen Outlet / Cabang</h1>
                    <p className="text-gray-500">Kelola lokasi store dan radius absensi.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ nama: '', alamat: '', latitude: '', longitude: '', radius_meter: 100, is_active: true });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Outlet
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                <th className="p-4 font-bold">Nama Store</th>
                                <th className="p-4 font-bold">Alamat</th>
                                <th className="p-4 font-bold">Koordinat</th>
                                <th className="p-4 font-bold">Radius</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {outlets.map((outlet) => (
                                <tr key={outlet.id} className="hover:bg-gray-50/50 transition">
                                    <td className="p-4 font-bold text-gray-900">{outlet.nama}</td>
                                    <td className="p-4 text-gray-600">{outlet.alamat || '-'}</td>
                                    <td className="p-4 font-mono text-xs text-blue-600 bg-blue-50/50 rounded-lg w-fit">
                                        {outlet.latitude}, {outlet.longitude}
                                    </td>
                                    <td className="p-4 text-gray-900 font-bold">{outlet.radius_meter}m</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${outlet.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {outlet.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEdit(outlet)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(outlet.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {outlets.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400">Belum ada data outlet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-black text-gray-900 mb-6">{editingId ? 'Edit Outlet' : 'Tambah Outlet Baru'}</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Store</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Kids Kingdom LP Cianjur"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.nama}
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Alamat</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="2"
                                    value={formData.alamat}
                                    onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                                />
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.latitude}
                                        onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.longitude}
                                        onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Map Picker */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Pin Lokasi di Peta</label>
                                <LocationPickerMap
                                    latitude={formData.latitude}
                                    longitude={formData.longitude}
                                    onLocationSelect={(loc) => setFormData(prev => ({ ...prev, latitude: loc.lat, longitude: loc.lng }))}
                                />
                                <p className="text-xs text-gray-400 italic">* Klik pada peta untuk menandai lokasi tepat outlet.</p>
                            </div>

                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                className="w-full py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-sm hover:bg-blue-100 flex items-center justify-center gap-2"
                            >
                                <MapPin className="w-4 h-4" />
                                Gunakan Lokasi Saya Saat Ini
                            </button>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Radius (Meter)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.radius_meter}
                                    onChange={e => setFormData({ ...formData, radius_meter: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Status Aktif</label>
                            </div>

                            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
