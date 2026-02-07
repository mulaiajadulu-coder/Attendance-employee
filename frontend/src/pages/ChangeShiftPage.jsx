import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Clock, AlignLeft, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import useAuthStore from '../store/authStore';

export default function ChangeShiftPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('request');
    const [isLoading, setIsLoading] = useState(false);
    const [shifts, setShifts] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [approvalRequests, setApprovalRequests] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        tanggal: format(new Date(), 'yyyy-MM-dd'),
        shift_asal_id: '',
        shift_tujuan_id: '',
        alasan: ''
    });
    const [shiftAsalLabel, setShiftAsalLabel] = useState('-- Tidak Ada Jadwal --');
    const [fetchingShift, setFetchingShift] = useState(false);

    useEffect(() => {
        fetchShifts();
        fetchMyRequests();
        if (['supervisor', 'manager', 'hr', 'admin'].includes(user?.role)) {
            fetchApprovalRequests();
        }
    }, [user]);

    useEffect(() => {
        if (formData.tanggal) {
            fetchCurrentDateShift(formData.tanggal);
        }
    }, [formData.tanggal]);

    const fetchCurrentDateShift = async (date) => {
        setFetchingShift(true);
        try {
            const res = await api.get(`/jadwal/my-schedule?tanggal=${date}`);
            if (res.data.success && res.data.data) {
                setFormData(prev => ({ ...prev, shift_asal_id: res.data.data.id }));
                setShiftAsalLabel(`${res.data.data.nama_shift} (${res.data.data.jam_masuk?.slice(0, 5)} - ${res.data.data.jam_pulang?.slice(0, 5)})`);
            } else if (res.data.success && res.data.is_off) {
                setFormData(prev => ({ ...prev, shift_asal_id: 'OFF' })); // Use a marker
                setShiftAsalLabel('OFF (Libur)');
            } else {
                setFormData(prev => ({ ...prev, shift_asal_id: '' }));
                setShiftAsalLabel('-- Tidak Ada Jadwal --');
            }
        } catch (err) {
            console.error('Failed to fetch current shift for date', err);
            setFormData(prev => ({ ...prev, shift_asal_id: '' }));
            setShiftAsalLabel('-- Gagal Memuat Jadwal --');
        } finally {
            setFetchingShift(false);
        }
    };

    const fetchShifts = async () => {
        try {
            const res = await api.get('/shifts');
            setShifts(res.data.data);
        } catch (err) {
            console.error('Failed to fetch shifts', err);
        }
    };

    const fetchMyRequests = async () => {
        try {
            const res = await api.get('/shift-change/my-requests');
            setMyRequests(res.data.data);
        } catch (err) {
            console.error('Failed to fetch my requests', err);
        }
    };

    const fetchApprovalRequests = async () => {
        try {
            const res = await api.get('/shift-change/approval-list');
            setApprovalRequests(res.data.data);
        } catch (err) {
            console.error('Failed to fetch approval requests', err);
        }
    };

    const handleDateChange = (e) => {
        setFormData(prev => ({ ...prev, tanggal: e.target.value, shift_asal_id: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/shift-change/request', formData);
            toast.success('Pengajuan tukar shift berhasil dikirim');
            setFormData({ tanggal: format(new Date(), 'yyyy-MM-dd'), shift_asal_id: '', shift_tujuan_id: '', alasan: '' });
            fetchMyRequests();
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Gagal mengirim pengajuan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproval = async (id, status) => {
        if (!confirm(`Apakah anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} pengajuan ini?`)) return;

        try {
            await api.put(`/shift-change/${id}/respond`, {
                status,
                keterangan: status === 'approved' ? 'Disetujui' : 'Ditolak'
            });
            toast.success(`Pengajuan berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
            fetchApprovalRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal memproses persetujuan');
        }
    };

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-24">
            {/* Header - More compact on mobile */}
            <div className="px-1">
                <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2 md:gap-3">
                    <RefreshCw className="text-blue-600 w-6 h-6 md:w-8 md:h-8" />
                    Tukar Shift
                </h1>
                <p className="text-xs md:text-base text-gray-500 mt-0.5 md:mt-1 font-medium italic">Ajukan pergantian jadwal shift kerja</p>
            </div>

            {/* Tabs - Centered and compact on mobile */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-fit overflow-x-auto">
                <button
                    onClick={() => setActiveTab('request')}
                    className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'request' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pengajuan Saya
                </button>
                {['supervisor', 'manager', 'hr', 'admin'].includes(user?.role) && (
                    <button
                        onClick={() => setActiveTab('approval')}
                        className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'approval' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Persetujuan ({approvalRequests.length})
                    </button>
                )}
            </div>

            {activeTab === 'request' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Form - More compact padding */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-extrabold text-base md:text-lg mb-4 md:mb-6 flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-blue-500" />
                                Form Pengajuan
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                                <div>
                                    <label className="block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Tanggal Shift</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.tanggal}
                                        min={new Date().toLocaleDateString('en-CA')}
                                        onChange={handleDateChange}
                                        className="w-full p-2 md:p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-black text-xs md:text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Shift Saat Ini (Asal)</label>
                                    <div className="relative">
                                        <div className="w-full p-3 md:p-4 bg-blue-50/30 border-2 border-dashed border-blue-100 rounded-2xl font-black text-gray-700 text-xs md:text-sm">
                                            {fetchingShift ? 'Mencari Jadwal...' : shiftAsalLabel}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Shift Tujuan</label>
                                    <select
                                        value={formData.shift_tujuan_id}
                                        onChange={(e) => setFormData({ ...formData, shift_tujuan_id: e.target.value })}
                                        className="w-full p-2 md:p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-black text-xs md:text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                    >
                                        <option value="">-- OFF (Libur) --</option>
                                        {shifts.map(s => (
                                            <option key={s.id} value={s.id}>{s.nama_shift} ({s.jam_masuk?.slice(0, 5)} - {s.jam_pulang?.slice(0, 5)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Alasan</label>
                                    <textarea
                                        required
                                        value={formData.alasan}
                                        onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-100 h-24 resize-none outline-none"
                                        placeholder="Jelaskan alasan tukar shift..."
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />}
                                    <span className="text-sm md:text-base uppercase tracking-tight">Ajukan Pengajuan</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* My List - Compact for mobile */}
                    <div className="lg:col-span-2 space-y-3 md:space-y-4">
                        <h3 className="font-black text-xs md:text-sm text-gray-400 uppercase tracking-widest px-2">Riwayat Pengajuan</h3>
                        {myRequests.length === 0 ? (
                            <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center text-gray-400 font-medium text-sm italic">
                                Belum ada riwayat pengajuan.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myRequests.map((req) => (
                                    <div key={req.id} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3 md:gap-4">
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${req.status === 'approved' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                req.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                                                }`}>
                                                <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-gray-900 text-sm md:text-base truncate">
                                                    {format(new Date(req.tanggal), 'EEEE, dd MMM yyyy', { locale: id })}
                                                </p>
                                                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs mt-1">
                                                    <span className="font-black bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 uppercase truncate max-w-[80px]">
                                                        {req.shift_asal?.nama_shift || 'OFF'}
                                                    </span>
                                                    <span className="text-gray-300 font-bold">→</span>
                                                    <span className="font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase truncate max-w-[80px]">
                                                        {req.shift_tujuan?.nama_shift || 'OFF'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] md:text-xs text-gray-500 mt-1.5 italic line-clamp-1">"{req.alasan}"</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3 mt-1 sm:mt-0 pt-3 sm:pt-0 border-t border-dashed border-gray-100 sm:border-0">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-wider ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Approval List - Better spacing for mobile */}
                    <div className="flex items-center justify-between px-2 mb-1">
                        <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest">Menunggu Persetujuan</h3>
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{approvalRequests.length}</span>
                    </div>

                    {approvalRequests.length === 0 ? (
                        <div className="bg-white p-16 rounded-3xl border border-gray-100 text-center flex flex-col items-center">
                            <CheckCircle className="w-12 h-12 text-gray-100 mb-3" />
                            <p className="text-gray-400 font-bold text-sm">Tidak ada permintaan yang perlu disetujui.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {approvalRequests.map((req) => (
                                <div key={req.id} className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md shadow-blue-100">
                                            {req.user?.nama_lengkap?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-gray-900 text-sm md:text-base leading-tight">{req.user?.nama_lengkap}</h4>
                                            <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-wider">{req.user?.nik || 'NIK'} • {req.user?.jabatan || 'Jabatan'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-2xl p-4 space-y-3 border border-gray-100/50">
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight">Tanggal</span>
                                            <span className="text-sm font-black text-gray-800">{format(new Date(req.tanggal), 'dd MMM yyyy', { locale: id })}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight block mb-1">Dari</span>
                                                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 inline-block">{req.shift_asal?.nama_shift || 'OFF'}</span>
                                            </div>
                                            <div className="pt-3">
                                                <RefreshCw className="w-3 h-3 text-blue-300" />
                                            </div>
                                            <div className="flex-1 text-right">
                                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight block mb-1">Ke</span>
                                                <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">{req.shift_tujuan?.nama_shift || 'OFF'}</span>
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tight block mb-1">Alasan</span>
                                            <div className="bg-white p-2.5 rounded-xl text-xs italic text-gray-600 border border-gray-100 leading-relaxed font-medium">
                                                "{req.alasan}"
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2.5 pt-1">
                                        <button
                                            onClick={() => handleApproval(req.id, 'rejected')}
                                            className="flex-1 px-4 py-2.5 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                                        >
                                            Tolak
                                        </button>
                                        <button
                                            onClick={() => handleApproval(req.id, 'approved')}
                                            className="flex-[1.5] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-100 transition-all active:scale-95"
                                        >
                                            Setujui
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
