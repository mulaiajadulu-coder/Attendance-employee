import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Camera, User, Clock, Filter, Eye, X, Store, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function MonitoringPage() {
    const { user } = useAuthStore();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showCorrectionModal, setShowCorrectionModal] = useState(false);
    const [correctionData, setCorrectionData] = useState({ alasan: '', jam_masuk: '', jam_pulang: '' });
    const [selectedStore, setSelectedStore] = useState('SEMUA');
    const [stores, setStores] = useState(['SEMUA']);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchMonitoring();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [date, search, selectedStore]);

    const fetchMonitoring = async () => {
        setLoading(true);
        try {
            const res = await api.get('/absensi/monitoring', {
                params: { date, search, store: selectedStore }
            });
            setRecords(res.data.data.records);
            if (res.data.data.stores) {
                setStores(res.data.data.stores);
            }
        } catch (err) {
            console.error(err);
            toast.error('Gagal mengambil data monitoring');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCorrection = async (e) => {
        e.preventDefault();
        try {
            await api.post('/koreksi/request', {
                absensi_id: selectedRecord.id, // null if mangkir/virtual
                tanggal: selectedRecord.tanggal,
                jam_masuk_baru: correctionData.jam_masuk,
                jam_pulang_baru: correctionData.jam_pulang,
                alasan: correctionData.alasan
            });
            toast.success('Permintaan perbaikan absen terkirim');
            setShowCorrectionModal(false);
            setCorrectionData({ alasan: '', jam_masuk: '', jam_pulang: '' });
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Gagal mengirim permintaan');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'hadir': return 'bg-green-100 text-green-700 border-green-200';
            case 'cuti': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'alpha':
            case 'mangkir': return 'bg-red-100 text-red-700 border-red-200';
            case 'belum absen': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
            case 'OFF': return 'bg-gray-100 text-gray-500 border-gray-200';
            case 'tidak absen masuk':
            case 'tidak absen pulang': return 'bg-orange-50 text-orange-700 border-orange-100';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getAssetUrl = (path) => {
        if (!path) return null;
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        return `${baseUrl}/${path}`;
    };

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <Eye className="text-blue-600 w-6 h-6 md:w-8 md:h-8" />
                            Monitoring
                        </h1>
                        <p className="text-gray-400 text-[10px] md:text-sm font-medium italic">"Mangkir" otomatis jika tidak ada absen.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="relative w-full sm:w-auto">
                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <select
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-blue-100 transition-all shadow-inner appearance-none cursor-pointer"
                            >
                                {stores.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Cari Nama/NIK..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
                            />
                        </div>

                        <div className="relative w-full sm:w-auto">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="px-3 md:px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Karyawan</th>
                                <th className="px-3 md:px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Lokasi</th>
                                <th className="px-3 md:px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Jam</th>
                                <th className="px-3 md:px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Status</th>
                                <th className="px-3 md:px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                                            <span className="font-bold text-gray-400">Loading data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-medium italic">
                                        Data tidak ditemukan.
                                    </td>
                                </tr>
                            ) : records.map((record, index) => (
                                <tr key={index} className="hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-0">
                                    <td className="px-3 md:px-6 py-2.5 md:py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-[10px] shadow-sm">
                                                {record.user?.nama_lengkap?.charAt(0)}
                                            </div>
                                            <div className="leading-tight">
                                                <p className="font-black text-gray-900 text-xs truncate max-w-[80px] md:max-w-none">{record.user?.nama_lengkap}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase truncate">{record.user?.nik}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 md:px-6 py-2.5 md:py-4">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Store className="w-3 h-3 text-blue-400" />
                                            <span className="text-[10px] font-black uppercase truncate max-w-[60px] md:max-w-none">{record.user?.penempatan_store || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 md:px-6 py-2.5 md:py-4">
                                        <div className="flex flex-col leading-none">
                                            <span className="text-[10px] font-black text-gray-900 font-mono">I:{record.jam_masuk ? format(new Date(record.jam_masuk), 'HH:mm') : '--'}</span>
                                            <span className="text-[10px] font-black text-gray-400 font-mono">O:{record.jam_pulang ? format(new Date(record.jam_pulang), 'HH:mm') : '--'}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 md:px-6 py-2.5 md:py-4">
                                        <span className={clsx(
                                            "inline-flex items-center justify-center h-4 px-1.5 rounded text-[7px] font-black uppercase border-none",
                                            getStatusStyle(record.display_status || record.status_hadir)
                                        )}>
                                            {(record.display_status || record.status_hadir)}
                                        </span>
                                    </td>
                                    <td className="px-3 md:px-6 py-2.5 md:py-4 text-center">
                                        {record.id ? (
                                            <button
                                                onClick={() => setSelectedRecord(record)}
                                                className="p-1.5 bg-gray-50 text-blue-600 rounded-lg border border-gray-100 shadow-sm active:scale-90 transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <span className="text-gray-300 text-[10px]">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Perbaikan Absen Modal */}
            {showCorrectionModal && selectedRecord && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCorrectionModal(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <form onSubmit={handleRequestCorrection} className="flex flex-col overflow-hidden">
                            <div className="p-4 md:p-6 border-b border-gray-100 bg-red-50 flex-shrink-0">
                                <h3 className="font-black text-lg md:text-xl text-red-900 flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6" /> Perbaikan Absen
                                </h3>
                                <p className="text-sm text-red-600 font-medium">Lengkapi data untuk tanggal {format(new Date(selectedRecord.tanggal), 'dd MMM yyyy')}</p>
                                {selectedRecord?.requires_approval && (
                                    <p className="text-xs text-red-600 mt-1">Pengajuan ini membutuhkan persetujuan atasan.</p>
                                )}
                            </div>

                            <div className="p-4 md:p-6 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Masuk (Baru)</label>
                                        <input
                                            type="time"
                                            required
                                            value={correctionData.jam_masuk}
                                            onChange={(e) => setCorrectionData({ ...correctionData, jam_masuk: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border-none rounded-xl font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Pulang (Baru)</label>
                                        <input
                                            type="time"
                                            required
                                            value={correctionData.jam_pulang}
                                            onChange={(e) => setCorrectionData({ ...correctionData, jam_pulang: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border-none rounded-xl font-bold text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Alasan Perbaikan</label>
                                    <textarea
                                        required
                                        placeholder="Contoh: Lupa absen, sistem error..."
                                        value={correctionData.alasan}
                                        onChange={(e) => setCorrectionData({ ...correctionData, alasan: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl font-medium h-24 text-sm resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowCorrectionModal(false)}
                                    className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                                >
                                    Kirim Permintaan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedRecord && !showCorrectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
                            <div>
                                <h3 className="font-black text-lg md:text-xl text-gray-900 leading-tight">Detail Kehadiran</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-500 font-medium">{selectedRecord.user?.nama_lengkap}</span>
                                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                    <span className="text-sm text-gray-500 font-medium">{format(new Date(selectedRecord.tanggal), 'EEEE, dd MMM yyyy', { locale: id })}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors font-bold">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-4 md:p-8 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                {/* Check In Info */}
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-green-600 uppercase tracking-widest">
                                        <CheckCircle2 className="w-4 h-4" /> Masuk
                                    </h4>
                                    <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden border-4 border-white shadow-inner relative flex items-center justify-center">
                                        {selectedRecord.foto_masuk_url ? (
                                            <img
                                                src={getAssetUrl(selectedRecord.foto_masuk_url)}
                                                alt="Foto Masuk"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-indigo-200 font-black italic text-xs text-center p-4">
                                                [ FOTO TIDAK TERSEDIA ]
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Waktu</p>
                                                <p className="text-xs font-bold">{selectedRecord.jam_masuk ? format(new Date(selectedRecord.jam_masuk), 'HH:mm:ss') : '--:--:--'}</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <div className="overflow-hidden">
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Koordinat</p>
                                                <p className="text-[9px] font-bold truncate">{selectedRecord.lokasi_masuk || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Check Out Info */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase tracking-widest">
                                        <CheckCircle2 className="w-4 h-4" /> Pulang
                                    </h4>
                                    <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden border-4 border-white shadow-inner relative flex items-center justify-center">
                                        {selectedRecord.foto_pulang_url ? (
                                            <img
                                                src={getAssetUrl(selectedRecord.foto_pulang_url)}
                                                alt="Foto Pulang"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center text-orange-200 font-black italic text-xs text-center p-4">
                                                [ FOTO TIDAK TERSEDIA ]
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Waktu</p>
                                                <p className="text-xs font-bold">{selectedRecord.jam_pulang ? format(new Date(selectedRecord.jam_pulang), 'HH:mm:ss') : '--:--:--'}</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <div className="overflow-hidden">
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Koordinat</p>
                                                <p className="text-[9px] font-bold truncate">{selectedRecord.lokasi_pulang || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 md:mt-8 p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Catatan Karyawan</p>
                                <p className="text-xs md:text-sm text-gray-600 font-medium italic">
                                    {selectedRecord.catatan ? `"${selectedRecord.catatan}"` : 'Tidak ada catatan.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
