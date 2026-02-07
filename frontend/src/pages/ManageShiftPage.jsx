import { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function ManageShiftPage() {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);

    const [formData, setFormData] = useState({
        nama_shift: '',
        jam_masuk: '08:00',
        jam_pulang: '17:00',
        toleransi_menit: 15,
        keterangan: ''
    });

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/shifts');
            setShifts(res.data.data);
        } catch (err) {
            toast.error('Gagal mengambil data shift');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (shift = null) => {
        if (shift) {
            setSelectedShift(shift);
            setFormData({
                nama_shift: shift.nama_shift,
                jam_masuk: shift.jam_masuk.slice(0, 5),
                jam_pulang: shift.jam_pulang.slice(0, 5),
                toleransi_menit: shift.toleransi_menit,
                keterangan: shift.keterangan || ''
            });
        } else {
            setSelectedShift(null);
            setFormData({
                nama_shift: '',
                jam_masuk: '08:00',
                jam_pulang: '17:00',
                toleransi_menit: 15,
                keterangan: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedShift) {
                await api.put(`/shifts/${selectedShift.id}`, formData);
                toast.success('Shift berhasil diperbarui');
            } else {
                await api.post('/shifts', formData);
                toast.success('Shift baru berhasil ditambahkan');
            }
            setShowModal(false);
            fetchShifts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Terjadi kesalahan');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Hapus shift ini? Karyawan yang menggunakan shift ini mungkin akan terdampak.')) {
            try {
                await api.delete(`/shifts/${id}`);
                toast.success('Shift berhasil dihapus');
                fetchShifts();
            } catch (err) {
                toast.error('Gagal menghapus shift');
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Clock className="text-orange-500 w-8 h-8" />
                        Kelola Shift Kerja
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Atur jadwal jam masuk dan pulang untuk operasional.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5 font-black" />
                    Tambah Shift
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="animate-spin h-10 w-10 border-4 border-orange-600 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 font-bold text-gray-400">Memuat data shift...</p>
                    </div>
                ) : shifts.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                        <p className="text-gray-400 font-bold italic">Belum ada data shift.</p>
                    </div>
                ) : shifts.map((shift) => (
                    <div key={shift.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 group-hover:bg-orange-100 transition-colors"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-black text-gray-900">{shift.nama_shift}</h3>
                                <div className="flex gap-1">
                                    <button onClick={() => handleOpenModal(shift)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(shift.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 bg-gray-50 p-3 rounded-2xl text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Masuk</p>
                                        <p className="text-lg font-black text-gray-900">{shift.jam_masuk.slice(0, 5)}</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 p-3 rounded-2xl text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pulang</p>
                                        <p className="text-lg font-black text-gray-900">{shift.jam_pulang.slice(0, 5)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 italic text-xs font-bold">
                                    <AlertCircle className="w-4 h-4" />
                                    Toleransi: {shift.toleransi_menit} Menit
                                </div>

                                {shift.keterangan && (
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                        {shift.keterangan}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-black text-xl text-gray-900">{selectedShift ? 'Edit Shift Kerja' : 'Tambah Shift Baru'}</h3>
                            <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1 tracking-widest">Nama Shift</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Shift Pagi, Regular..."
                                    value={formData.nama_shift}
                                    onChange={(e) => setFormData({ ...formData, nama_shift: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1 tracking-widest">Jam Masuk</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.jam_masuk}
                                        onChange={(e) => setFormData({ ...formData, jam_masuk: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1 tracking-widest">Jam Pulang</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.jam_pulang}
                                        onChange={(e) => setFormData({ ...formData, jam_pulang: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1 tracking-widest">Toleransi Level Telat (Menit)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.toleransi_menit}
                                    onChange={(e) => setFormData({ ...formData, toleransi_menit: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-100"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1 tracking-widest">Keterangan (Opsional)</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-orange-100 h-24 resize-none"
                                    placeholder="Catatan tambahan tentang shift ini..."
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-4 px-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-4 px-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                {selectedShift ? 'Simpan Perubahan' : 'Buat Shift'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
