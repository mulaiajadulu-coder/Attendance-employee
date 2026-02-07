import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, Upload, FileText } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import clsx from 'clsx';

export default function CutiPage() {
    const [cutiList, setCutiList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [tipeCuti, setTipeCuti] = useState('tahunan');
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');
    const [alasan, setAlasan] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [buktiBase64, setBuktiBase64] = useState('');

    useEffect(() => {
        fetchCutiHistory();
    }, []);

    const fetchCutiHistory = async () => {
        try {
            const res = await api.get('/cuti/my-history');
            setCutiList(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await api.post('/cuti/apply', {
                tipe_cuti: tipeCuti,
                tanggal_mulai: tanggalMulai,
                tanggal_selesai: tanggalSelesai,
                alasan,
                bukti_url: buktiBase64 // Changed to handle file
            });

            setShowForm(false);
            resetForm();
            fetchCutiHistory();
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Gagal mengajukan cuti');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTipeCuti('tahunan');
        setTanggalMulai('');
        setTanggalSelesai('');
        setAlasan('');
        setBuktiBase64('');
    };

    const getStatusBadge = (status, tipe) => {
        const icons = {
            pending: <Clock className="w-3 h-3 mr-1" />,
            approved: <CheckCircle className="w-3 h-3 mr-1" />,
            rejected: <XCircle className="w-3 h-3 mr-1" />,
            cancelled: <XCircle className="w-3 h-3 mr-1" />
        };

        const getStatusStyles = (status, t) => {
            if (status === 'approved') return 'bg-green-100 text-green-800';
            if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
            if (status === 'rejected') return 'bg-red-100 text-red-800';
            return 'bg-gray-100 text-gray-800';
        };

        return (
            <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", getStatusStyles(status, tipe))}>
                {icons[status]}
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-4 md:space-y-6 pb-24">
            {/* Header */}
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Calendar className="text-blue-600 w-6 h-6 md:w-7 md:h-7" />
                        Pengajuan Cuti
                    </h1>
                    <p className="text-[10px] md:text-sm text-gray-500 font-medium italic">Kelola dan ajukan permohonan istirahat Anda</p>
                </div>

                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        BUAT PENGAJUAN
                    </button>
                )}
            </div>

            {/* Form (Centered & Compact) */}
            {showForm && (
                <div className="bg-white p-5 rounded-3xl shadow-2xl border border-blue-50 animate-in fade-in zoom-in-95 duration-300 max-w-lg mx-auto w-full sticky top-4 z-20">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 tracking-tight">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Form Pengajuan
                        </h2>
                        <button onClick={() => setShowForm(false)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl text-[11px] font-bold flex items-center gap-2 border border-red-100 animate-pulse">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider ml-1">Tipe Pengajuan</label>
                            <select
                                value={tipeCuti}
                                onChange={(e) => setTipeCuti(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-sm focus:ring-2 focus:ring-blue-100 h-12 px-4 shadow-inner appearance-none outline-none"
                                required
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2rem' }}
                            >
                                <option value="tahunan">Cuti Tahunan</option>
                                <option value="sakit">Sakit</option>
                                <option value="melahirkan">Melahirkan</option>
                                <option value="penting">Izin Penting</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider ml-1">Dari</label>
                                <input
                                    type="date"
                                    value={tanggalMulai}
                                    min={new Date().toLocaleDateString('en-CA')}
                                    onChange={(e) => setTanggalMulai(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-xl font-black text-gray-700 text-sm focus:ring-2 focus:ring-blue-100 h-12 px-3 shadow-inner outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider ml-1">Sampai</label>
                                <input
                                    type="date"
                                    value={tanggalSelesai}
                                    min={tanggalMulai || new Date().toLocaleDateString('en-CA')}
                                    onChange={(e) => setTanggalSelesai(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-xl font-black text-gray-700 text-sm focus:ring-2 focus:ring-blue-100 h-12 px-3 shadow-inner outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider ml-1">Alasan / Keperluan</label>
                            <textarea
                                value={alasan}
                                onChange={(e) => setAlasan(e.target.value)}
                                rows="3"
                                className="w-full bg-gray-50 border-none rounded-2xl font-medium text-gray-700 text-sm focus:ring-2 focus:ring-blue-100 p-4 resize-none shadow-inner outline-none"
                                placeholder="Jelaskan secara mendetail..."
                                required
                            ></textarea>
                        </div>

                        {tipeCuti === 'sakit' && (
                            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                <label className="block text-[11px] font-black text-blue-600 uppercase tracking-widest">Surat Dokter (Wajib PDF/JPG)</label>
                                <div className="mt-1 flex justify-center px-4 py-3 border-2 border-blue-200 border-dashed rounded-2xl hover:border-blue-400 transition-all bg-white group cursor-pointer relative">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform" />
                                        <div className="flex text-[11px] text-gray-600 justify-center">
                                            <span className="font-bold text-blue-600">Klik untuk upload</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setBuktiBase64(reader.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }} />
                                        </div>
                                        {buktiBase64 ? (
                                            <p className="text-[10px] text-green-600 font-black uppercase mt-1">✓ Berkas Terpilih</p>
                                        ) : (
                                            <p className="text-[8px] text-gray-400 uppercase tracking-tighter">Maksimal ukuran 5MB</p>
                                        )}
                                    </div>
                                    <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer"></label>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="w-full py-3.5 bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Batalkan
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50 active:scale-95"
                            >
                                {submitting ? 'Mengirim...' : 'Ajukan Sekarang'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List - Converted to responsive grid of cards */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-black text-gray-400 text-xs md:text-sm uppercase tracking-widest">Riwayat Perjalanan Cuti</h3>
                    <div className="h-0.5 flex-1 bg-gray-100 mx-4 hidden sm:block"></div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 animate-pulse h-24"></div>
                        ))}
                    </div>
                ) : cutiList.length === 0 ? (
                    <div className="bg-white px-6 py-20 rounded-3xl border-2 border-dashed border-gray-100 text-center">
                        <Calendar className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                        <h4 className="text-gray-400 font-black text-base md:text-lg">Belum Ada Riwayat</h4>
                        <p className="text-gray-300 text-sm mt-1">Pengajuan anda akan muncul di sini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {cutiList.map((cuti) => (
                            <div key={cuti.id} className="bg-white p-4 md:p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                                {/* Status Indicator Strip */}
                                <div className={clsx(
                                    "absolute top-0 left-0 w-1.5 h-full",
                                    cuti.status === 'approved' ? 'bg-green-500' :
                                        cuti.status === 'pending' ? 'bg-yellow-400' : 'bg-red-500'
                                )}></div>

                                <div className="flex justify-between items-start mb-3 ml-1">
                                    <div className="bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">Periode</p>
                                        <p className="text-xs font-black text-gray-900 font-mono">
                                            {format(new Date(cuti.tanggal_mulai), 'dd MMM')} - {format(new Date(cuti.tanggal_selesai), 'dd MMM yyyy')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[18px] font-black text-gray-900 leading-none">{cuti.jumlah_hari}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Hari</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-dashed border-gray-100 ml-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                                                <FileText className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-[11px] font-black text-gray-900 uppercase">{cuti.tipe_cuti}</span>
                                        </div>
                                        {getStatusBadge(cuti.status, cuti.tipe_cuti)}
                                    </div>

                                    <div className="bg-blue-50/30 p-2.5 rounded-xl border border-blue-100/50">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight mb-1">Alasan</p>
                                        <p className="text-xs text-gray-600 font-medium italic line-clamp-2">"{cuti.alasan}"</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
