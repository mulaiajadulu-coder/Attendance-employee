import { useState, useEffect } from 'react';
import {
    CheckCircle, XCircle, Clock, Calendar,
    MessageSquare, AlertCircle, RefreshCw, FileText, ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Input } from '../components/ui';

export default function PersetujuanPage() {
    const [activeTab, setActiveTab] = useState('cuti'); // 'cuti' | 'koreksi' | 'shift'
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [catatan, setCatatan] = useState({});

    useEffect(() => {
        fetchApprovals();
    }, [activeTab]);

    const fetchApprovals = async () => {
        setLoading(true);
        setApprovals([]); // Reset list saat pindah tab
        try {
            let endpoint = '';
            if (activeTab === 'cuti') endpoint = '/cuti/approvals';
            if (activeTab === 'koreksi') endpoint = '/koreksi/approvals';
            if (activeTab === 'shift') endpoint = '/shift-change/approval-list';

            if (endpoint) {
                const res = await api.get(endpoint);
                console.log(`[FetchApprovals] ${activeTab}:`, res.data.data);
                setApprovals(res.data.data || []);
            }
        } catch (err) {
            console.error(err);
            // Hide error toast for 404/empty to keep UI clean
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        const confirmMsg = action === 'approve' ? 'menyetujui' : 'menolak';
        if (!window.confirm(`Yakin ingin ${confirmMsg} pengajuan ini?`)) return;

        setProcessingId(id);
        try {
            let endpoint = '';
            if (activeTab === 'cuti') endpoint = `/cuti/validate/${id}`;
            if (activeTab === 'koreksi') endpoint = `/koreksi/validate/${id}`;
            if (activeTab === 'shift') endpoint = `/shift-change/${id}/respond`;

            if (activeTab === 'shift') {
                await api.put(endpoint, {
                    status: action === 'approve' ? 'approved' : 'rejected',
                    keterangan: catatan[id] || ''
                });
            } else {
                await api.post(endpoint, {
                    action, // 'approve' or 'reject'
                    catatan: catatan[id] || ''
                });
            }

            toast.success(`Pengajuan berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}`);
            fetchApprovals(); // Refresh list

            // Clear catatan
            setCatatan(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Gagal memproses persetujuan');
        } finally {
            setProcessingId(null);
        }
    };

    const renderEmptyState = () => (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Tidak Ada Pengajuan</h3>
            <p className="text-gray-500 font-medium">Semua tugas persetujuan {activeTab} sudah selesai.</p>
        </div>
    );

    const renderCardContent = (item) => {
        // CONTENT UNTUK CUTI
        if (activeTab === 'cuti') {
            return (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="text-xs font-bold text-blue-500 uppercase">Durasi Cuti</p>
                            <p className="font-black text-gray-900">
                                {format(new Date(item.tanggal_mulai), 'dd MMM', { locale: id })} - {format(new Date(item.tanggal_selesai), 'dd MMM yyyy', { locale: id })}
                                <span className="ml-2 text-sm text-gray-500 font-medium">({item.jumlah_hari} Hari)</span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tipe & Alasan</p>
                        <p className="text-gray-900 font-bold capitalize">{item.tipe_cuti}</p>
                        <p className="text-gray-700 italic font-medium">"{item.alasan}"</p>
                    </div>

                    {item.bukti_url && (
                        <div className="pt-2">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Lampiran Dokumen</p>
                            <a
                                href={item.bukti_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors gap-2"
                            >
                                <FileText className="w-4 h-4 text-blue-600" />
                                Lihat Surat Dokter / Lampiran
                            </a>
                        </div>
                    )}
                </div>
            );
        }

        // CONTENT UNTUK KOREKSI
        if (activeTab === 'koreksi') {
            return (
                <div className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <div>
                            <p className="text-xs font-bold text-orange-500 uppercase">Tanggal Koreksi</p>
                            <p className="font-black text-gray-900">
                                {format(new Date(item.tanggal), 'EEEE, dd MMMM yyyy', { locale: id })}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-400 uppercase">Jam Masuk (Baru)</p>
                            <p className="font-mono font-black text-lg text-gray-900">{item.jam_masuk_baru || '-'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-400 uppercase">Jam Pulang (Baru)</p>
                            <p className="font-mono font-black text-lg text-gray-900">{item.jam_pulang_baru || '-'}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Alasan Perbaikan</p>
                        <p className="text-gray-700 italic font-medium">"{item.alasan}"</p>
                    </div>
                </div>
            );
        }

        // CONTENT UNTUK TUKAR SHIFT
        if (activeTab === 'shift') {
            return (
                <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-purple-600" />
                        <div>
                            <p className="text-xs font-bold text-purple-500 uppercase">Tanggal Penukaran</p>
                            <p className="font-black text-gray-900">
                                {format(new Date(item.tanggal), 'EEEE, dd MMMM yyyy', { locale: id })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Shift Asal</p>
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 shadow-sm">
                                {item.shift_asal?.nama_shift || 'OFF'}
                            </span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-purple-500 mx-2" />
                        <div className="text-center flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Shift Tujuan</p>
                            <span className="px-3 py-1 bg-purple-600 rounded-full text-xs font-bold text-white shadow-md shadow-purple-100">
                                {item.shift_tujuan?.nama_shift || 'OFF'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Alasan Penukaran</p>
                        <p className="text-gray-700 italic font-medium">"{item.alasan}"</p>
                    </div>
                </div>
            );
        }

        // Fallback
        return (
            <div className="p-4 text-center text-gray-400 italic text-sm">
                Data detail tidak tersedia
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 mb-2">
                    <CheckCircle className="text-blue-600 w-8 h-8" />
                    Persetujuan
                </h1>
                <p className="text-gray-500 font-medium">Kelola permintaan persetujuan dari anggota tim Anda.</p>

                {/* Tabs */}
                <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('cuti')}
                        className={clsx(
                            "px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                            activeTab === 'cuti'
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                    >
                        Pengajuan
                    </button>
                    <button
                        onClick={() => setActiveTab('koreksi')}
                        className={clsx(
                            "px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                            activeTab === 'koreksi'
                                ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                    >
                        Koreksi Absen
                    </button>
                    <button
                        onClick={() => setActiveTab('shift')}
                        className={clsx(
                            "px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                            activeTab === 'shift'
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                    >
                        Tukar Shift
                    </button>
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                    <p className="text-gray-400 font-bold">Memuat data...</p>
                </div>
            ) : approvals.length === 0 ? (
                renderEmptyState()
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {approvals.map((item) => (
                        <div key={item.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                            {/* Card Header: User Info */}
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-4">
                                <div className={clsx(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md",
                                    activeTab === 'cuti' ? "bg-blue-600 shadow-blue-200" :
                                        activeTab === 'koreksi' ? "bg-orange-500 shadow-orange-200" :
                                            "bg-purple-600 shadow-purple-200"
                                )}>
                                    {item.user?.nama_lengkap?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">{item.user?.nama_lengkap}</h3>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.user?.nik || 'NIK'}</p>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-1">
                                {renderCardContent(item)}
                            </div>

                            {/* Card Footer: Actions */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <Input
                                    placeholder="Catatan Approval (Opsional)"
                                    className="mb-3 bg-white text-sm"
                                    value={catatan[item.id] || ''}
                                    onChange={(e) => setCatatan({ ...catatan, [item.id]: e.target.value })}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="flex-1 bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200"
                                        disabled={processingId === item.id}
                                        onClick={() => handleAction(item.id, 'reject')}
                                    >
                                        Tolak
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        className={clsx(
                                            "flex-1 text-white",
                                            activeTab === 'cuti' ? "bg-blue-600 hover:bg-blue-700" :
                                                activeTab === 'koreksi' ? "bg-orange-500 hover:bg-orange-600" :
                                                    "bg-purple-600 hover:bg-purple-700"
                                        )}
                                        disabled={processingId === item.id}
                                        onClick={() => handleAction(item.id, 'approve')}
                                    >
                                        {processingId === item.id ? 'Proses...' : 'Setujui'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
