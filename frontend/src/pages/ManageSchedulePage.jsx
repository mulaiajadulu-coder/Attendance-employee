import { useState, useRef } from 'react';
import { Calendar, Download, Upload, FileText, CheckCircle2, AlertCircle, Info, Store } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import useAuthStore from '../store/authStore';

export default function ManageSchedulePage() {
    const { user: currentUser } = useAuthStore();
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/jadwal/template', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Template_Jadwal_Kerja.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Gagal mengunduh template');
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset result
        setUploadResult(null);
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/jadwal/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setUploadResult(res.data.data);
            if (res.data.data.failedCount === 0) {
                toast.success('Semua jadwal berhasil diunggah!');
            } else {
                toast.error(`Ada ${res.data.data.failedCount} data yang gagal diunggah.`);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Gagal mengunggah file';
            toast.error(msg);
        } finally {
            setUploading(false);
            // reset input
            e.target.value = '';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Calendar className="text-indigo-600 w-8 h-8" />
                    Penjadwalan Otomatis (Bulk)
                </h1>
                <p className="text-gray-500 mt-1 font-medium italic">
                    Kelola shifting karyawan selama 1 bulan dengan satu kali klik menggunakan upload Excel.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Step 1: Download */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-900/5 border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                            <Download className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">1. Unduh Template</h3>
                        <p className="text-gray-500 text-sm font-medium mb-6">
                            Unduh file Excel yang sudah berisi daftar karyawan di store Anda. Isi kolom 'Tanggal' dan 'Nama Shift' sesuai jadwal yang direncanakan.
                        </p>
                    </div>
                    <button
                        onClick={handleDownloadTemplate}
                        className="w-full py-4 bg-indigo-50 text-indigo-700 rounded-3xl font-black uppercase text-xs hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Unduh Template Excel
                    </button>
                </div>

                {/* Step 2: Upload */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-900/5 border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                            <Upload className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">2. Unggah Jadwal</h3>
                        <p className="text-gray-500 text-sm font-medium mb-6">
                            Setelah selesai mengisi jadwal, unggah kembali file tersebut ke sistem. Sistem akan otomatis memproses dan menerapkan jadwal ke masing-masing karyawan.
                        </p>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx, .xls"
                        className="hidden"
                    />
                    <button
                        onClick={handleUploadClick}
                        disabled={uploading}
                        className={clsx(
                            "w-full py-4 rounded-3xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200",
                            uploading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
                        )}
                    >
                        {uploading ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                Memproses...
                            </div>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Unggah File Excel
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Instruction Card */}
            <div className="bg-indigo-900 text-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="shrink-0 w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center">
                        <Info className="w-10 h-10 text-indigo-200" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black mb-2 tracking-tight">Tips Pengisian Jadwal</h4>
                        <ul className="space-y-2 text-indigo-100 text-sm font-medium list-disc list-inside opacity-90">
                            <li>Format Tanggal harus YYYY-MM-DD (Contoh: 2024-02-01).</li>
                            <li>Pastikan Nama Shift sesuai dengan yang ada di menu 'Shift Kerja'.</li>
                            <li>Jangan mengubah kolom NIK, karena itu identitas utama karyawan.</li>
                            <li>Anda bisa mengunggah jadwal untuk rentang waktu berapapun (mingguan/bulanan).</li>
                        </ul>
                    </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            </div>

            {/* Upload Results Table */}
            {uploadResult && (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Hasil Pemrosesan</h3>
                            <p className="text-sm font-medium text-gray-500">
                                Berhasil: <span className="text-green-600 font-black">{uploadResult.successCount}</span>,
                                Gagal: <span className="text-red-600 font-black">{uploadResult.failedCount}</span>
                            </p>
                        </div>
                    </div>

                    {uploadResult.errors.length > 0 && (
                        <div className="p-8 space-y-4 max-h-96 overflow-y-auto bg-red-50/30">
                            {uploadResult.errors.map((error, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-bold text-gray-700">{error}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {uploadResult.failedCount === 0 && (
                        <div className="p-16 text-center space-y-4">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h4 className="text-2xl font-black text-gray-900">Sempurna!</h4>
                            <p className="text-gray-500 font-medium max-w-sm mx-auto text-sm">
                                Semua jadwal telah berhasil diimpor ke sistem tanpa ada kendala.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
