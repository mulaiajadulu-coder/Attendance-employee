import { useState, useEffect } from 'react';
import { DollarSign, Download, Eye, FileText, Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import clsx from 'clsx';
import { generateSlipGajiPDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

export default function SlipGajiPage() {
    // Mock Data yang Komprehensif
    const [slips, setSlips] = useState([
        {
            id: 1,
            periode_bulan: 1,
            periode_tahun: 2026,
            periode_mulai: '2025-12-26',
            periode_selesai: '2026-01-25',
            gaji_pokok: 4500000,
            tunjangan_jabatan: 500000,
            tunjangan_makan: 400000,
            tunjangan_transport: 300000,
            uang_lembur: 200000,
            bonus: 0,
            potongan_bpjs: 150000,
            potongan_pph21: 50000,
            potongan_kehadiran: 0,
            potongan_lain: 0,
            total_gaji_bersih: 5700000,
            status: 'published',
            created_at: '2026-01-31',
            user: {
                nama_lengkap: 'Setia Budi',
                nik: 'EMP001',
                role: 'Staff IT',
                departemen: { nama_departemen: 'Teknologi Informasi' }
            }
        },
        {
            id: 2,
            periode_bulan: 12,
            periode_tahun: 2025,
            periode_mulai: '2025-11-26',
            periode_selesai: '2025-12-25',
            gaji_pokok: 4500000,
            tunjangan_jabatan: 500000,
            tunjangan_makan: 380000,
            tunjangan_transport: 280000,
            uang_lembur: 0,
            bonus: 1000000, // THR/Bonus Akhir Tahun
            potongan_bpjs: 150000,
            potongan_pph21: 50000,
            potongan_kehadiran: 50000, // Ada telat
            potongan_lain: 0,
            total_gaji_bersih: 6410000,
            status: 'published',
            created_at: '2025-12-31',
            user: {
                nama_lengkap: 'Setia Budi',
                nik: 'EMP001',
                role: 'Staff IT',
                departemen: { nama_departemen: 'Teknologi Informasi' }
            }
        },
    ]);
    const [loading, setLoading] = useState(false);
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    const getMonthName = (monthNumber) => {
        return format(new Date(2023, monthNumber - 1, 1), 'MMMM', { locale: id });
    };

    const handleDownloadPDF = async () => {
        if (!selectedSlip) return;

        setDownloading(true);
        try {
            // Simulasi delay biar berasa prosesnya
            await new Promise(resolve => setTimeout(resolve, 800));

            generateSlipGajiPDF(selectedSlip);
            toast.success('Slip gaji berhasil diunduh');
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Gagal mengunduh slip gaji');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-24">
            {/* Page Header */}
            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                        <DollarSign className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">Slip Gaji</h1>
                        <p className="text-[10px] md:text-sm text-gray-400 font-medium italic">Informasi penghasilan bulanan resmi Anda.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* List of Slips - Responsive Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Pilih Periode</h2>
                        <div className="h-px flex-1 bg-gray-100 ml-4"></div>
                    </div>

                    <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                        {slips.map((slip) => (
                            <div
                                key={slip.id}
                                onClick={() => setSelectedSlip(slip)}
                                className={clsx(
                                    "flex-shrink-0 w-[240px] lg:w-full p-4 md:p-5 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden",
                                    selectedSlip?.id === slip.id
                                        ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 text-white"
                                        : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg text-gray-900"
                                )}
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <p className={clsx(
                                            "font-black text-base md:text-lg tracking-tight",
                                            selectedSlip?.id === slip.id ? "text-white" : "text-gray-900"
                                        )}>
                                            {getMonthName(slip.periode_bulan)} {slip.periode_tahun}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={clsx(
                                                "px-2 py-0.5 text-[8px] uppercase font-black rounded-lg border",
                                                selectedSlip?.id === slip.id
                                                    ? "bg-white/20 border-white/20 text-white"
                                                    : "bg-green-50 border-green-100 text-green-600"
                                            )}>
                                                {slip.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg md:text-xl font-mono leading-none">{formatCurrency(slip.total_gaji_bersih)}</p>
                                        <p className={clsx(
                                            "text-[8px] font-bold uppercase mt-1 opacity-60",
                                            selectedSlip?.id === slip.id ? "text-white" : "text-gray-400"
                                        )}>Net Pay</p>
                                    </div>
                                </div>
                                {selectedSlip?.id === slip.id && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detailed View - Premium Invoice Style */}
                <div className="lg:col-span-8">
                    {selectedSlip ? (
                        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                            {/* Detailed Header */}
                            <div className="p-4 md:p-8 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:flex w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 items-center justify-center">
                                        <FileText className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg md:text-2xl text-gray-900 tracking-tight">
                                            Detail Slip Gaji
                                        </h3>
                                        <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                            Periode: {format(new Date(selectedSlip.periode_mulai), 'dd MMM')} — {format(new Date(selectedSlip.periode_selesai), 'dd MMM yyyy')}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={downloading}
                                    className="w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
                                >
                                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    {downloading ? 'Mempersiapkan...' : 'Unduh PDF'}
                                </button>
                            </div>

                            {/* Slip Document Body */}
                            <div className="p-5 md:p-10 space-y-8 md:space-y-12 bg-white relative">
                                {/* Watermark Background */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-45deg] select-none">
                                    <div className="text-[100px] font-black text-gray-900">CONFIDENTIAL</div>
                                </div>

                                {/* Information Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Karyawan</h4>
                                        </div>
                                        <div className="space-y-2 ml-1">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Nama Lengkap</span>
                                                <span className="text-sm font-black text-gray-900">{selectedSlip.user.nama_lengkap}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Nomor Induk / NIK</span>
                                                <span className="text-sm font-black text-gray-900">{selectedSlip.user.nik}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Penempatan</h4>
                                        </div>
                                        <div className="space-y-2 ml-1">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Jabatan</span>
                                                <span className="text-sm font-black text-gray-900">{selectedSlip.user.role}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Departemen</span>
                                                <span className="text-sm font-black text-gray-900">{selectedSlip.user.departemen.nama_departemen}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 border-t border-gray-100 pt-8 relative z-10">
                                    {/* Earnings */}
                                    <div className="space-y-6 pb-8 md:pb-0">
                                        <div className="flex items-center justify-between border-b-2 border-green-500/10 pb-2 mb-4">
                                            <h5 className="font-black text-xs text-green-600 uppercase tracking-widest flex items-center gap-2">
                                                Penerimaan <div className="w-1 h-1 rounded-full bg-green-500"></div>
                                            </h5>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Gaji Pokok', value: selectedSlip.gaji_pokok },
                                                { label: 'Tunjangan Jabatan', value: selectedSlip.tunjangan_jabatan },
                                                { label: 'Tunjangan Makan', value: selectedSlip.tunjangan_makan },
                                                { label: 'Tunjangan Transport', value: selectedSlip.tunjangan_transport },
                                                { label: 'Lembur', value: selectedSlip.uang_lembur, hideIfZero: true },
                                                { label: 'Bonus / THR', value: selectedSlip.bonus, hideIfZero: true, highlight: true },
                                            ].map((item, id) => (
                                                (!item.hideIfZero || item.value > 0) && (
                                                    <div key={id} className="flex justify-between items-center group">
                                                        <span className={clsx("text-xs font-bold", item.highlight ? "text-blue-600" : "text-gray-500")}>{item.label}</span>
                                                        <div className="flex-1 border-b border-dotted border-gray-200 mx-4 group-hover:border-gray-300 transition-colors"></div>
                                                        <span className={clsx("text-sm font-black font-mono", item.highlight ? "text-blue-700" : "text-gray-900")}>
                                                            {formatCurrency(item.value)}
                                                        </span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>

                                    {/* Deductions */}
                                    <div className="space-y-6 pt-8 md:pt-0 border-t md:border-t-0 border-gray-100">
                                        <div className="flex items-center justify-between border-b-2 border-red-500/10 pb-2 mb-4">
                                            <h5 className="font-black text-xs text-red-600 uppercase tracking-widest flex items-center gap-2">
                                                Potongan <div className="w-1 h-1 rounded-full bg-red-500"></div>
                                            </h5>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'BPJS Kesehatan', value: selectedSlip.potongan_bpjs },
                                                { label: 'PPh 21 (Pajak)', value: selectedSlip.potongan_pph21 },
                                                { label: 'Potongan Kehadiran', value: selectedSlip.potongan_kehadiran, hideIfZero: true },
                                                { label: 'Lainnya', value: selectedSlip.potongan_lain, hideIfZero: true },
                                            ].map((item, id) => (
                                                (!item.hideIfZero || item.value > 0) && (
                                                    <div key={id} className="flex justify-between items-center group">
                                                        <span className="text-xs font-bold text-gray-500">{item.label}</span>
                                                        <div className="flex-1 border-b border-dotted border-gray-200 mx-4 group-hover:border-gray-300 transition-colors"></div>
                                                        <span className="text-sm font-black font-mono text-red-600">
                                                            ({formatCurrency(item.value)})
                                                        </span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Total Net Pay - Dramatic UI */}
                                <div className="relative z-10 pt-4">
                                    <div className="rounded-3xl p-1 bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 shadow-2xl shadow-blue-200">
                                        <div className="bg-white/5 backdrop-blur-sm rounded-[22px] px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
                                            <div className="text-center md:text-left">
                                                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-blue-100 opacity-80 mb-1">Total Penghasilan Bersih</p>
                                                <h6 className="text-lg md:text-xl font-bold">TAKE HOME PAY</h6>
                                            </div>
                                            <div className="text-4xl md:text-6xl font-black tracking-tighter drop-shadow-lg font-mono">
                                                {formatCurrency(selectedSlip.total_gaji_bersih)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 text-center relative z-10">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
                                        <Printer className="w-3 h-3 text-gray-400" />
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                            GENERATED BY SYSTEM — DOCUMENT IS VALID WITHOUT WET SIGNATURE
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-gray-200/50">
                                <DollarSign className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Belum Ada Slip Dipilih</h3>
                            <p className="text-gray-400 text-sm mt-2 font-medium max-w-[280px] text-center">Silahkan pilih salah satu periode gaji di sebelah kiri untuk melihat rincian lengkapnya.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
