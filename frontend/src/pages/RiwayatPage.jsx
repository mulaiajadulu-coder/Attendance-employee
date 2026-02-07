import { useState, useEffect } from 'react';
import { FileText, AlertCircle, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { format, getDaysInMonth, setDate, isAfter, isSameDay, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Badge, Button, Modal, Input, Card } from '../components/ui';

export default function RiwayatPage() {
    const [recordsMap, setRecordsMap] = useState({});
    const [correctionsMap, setCorrectionsMap] = useState({}); // New state for corrections
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    // Konfigurasi tanggal mulai aplikasi
    const APP_START_DATE = new Date(2026, 1, 1); // 1 Februari 2026 (bulan 0-indexed)
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedRequiresApproval, setSelectedRequiresApproval] = useState(false);

    // Correction Modal State
    const [showCorrection, setShowCorrection] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [missingFlags, setMissingFlags] = useState({ masuk: false, pulang: false });
    const [correctionForm, setCorrectionForm] = useState({
        jam_masuk: '',
        jam_pulang: '',
        alasan: ''
    });

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const fetchData = async () => {
        setLoading(true);
        try {
            setFetchError(false);
            // Jika sebelum tanggal mulai aplikasi, kosongkan data
            if (new Date(year, month - 1, 1) < APP_START_DATE) {
                setRecordsMap({});
                setCorrectionsMap({});
                setLoading(false);
                return;
            }
            // Paralel fetch history dan koreksi
            const [histRes, corrRes] = await Promise.all([
                api.get('/absensi/history', {
                    params: {
                        month,
                        year,
                        limit: 31
                    }
                }),
                api.get('/koreksi/my-requests') // Get all my requests
            ]);

            // Map History
            const histMap = {};
            if (histRes.data.data.records) {
                histRes.data.data.records.forEach(r => {
                    const dateStr = format(new Date(r.tanggal), 'yyyy-MM-dd');
                    // Filter: hanya tampilkan data >= APP_START_DATE
                    if (new Date(dateStr) >= APP_START_DATE) {
                        histMap[dateStr] = r;
                    }
                });
            }
            setRecordsMap(histMap);

            // Map Corrections (Filter only pending for this visual)
            const corrMap = {};
            if (corrRes.data.data) {
                corrRes.data.data.forEach(r => {
                    const dateStr = r.tanggal; // YYYY-MM-DD from DB
                    if (r.status === 'pending' && new Date(dateStr) >= APP_START_DATE) {
                        corrMap[dateStr] = r;
                    }
                });
            }
            setCorrectionsMap(corrMap);

        } catch (err) {
            console.error(err);
            setFetchError(true);
            toast.error("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    // Legacy single fetch removed in favor of fetchData
    /* 
    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Kita ambil semua data bulan ini (tanpa limit pagination kecil)
            const res = await api.get('/absensi/history', {
                params: {
                    month,
                    year,
                    limit: 31 // Ambil sebulan penuh
                }
            });

            // Convert array to Object map for easier lookup by date "YYYY-MM-DD"
            const map = {};
            if (res.data.data.records) {
                res.data.data.records.forEach(r => {
                    const dateStr = format(new Date(r.tanggal), 'yyyy-MM-dd');
                    map[dateStr] = r;
                });
            }
            setRecordsMap(map);
        } catch (err) {
            console.error(err);
            toast.error("Gagal memuat riwayat absen");
        } finally {
            setLoading(false);
        }
    };
    */

    // Generate dates for the selected month, hanya jika >= APP_START_DATE
    let datesArray = [];
    if (new Date(year, month - 1, 1) >= APP_START_DATE) {
        const daysInMonth = getDaysInMonth(new Date(year, month - 1));
        datesArray = Array.from({ length: daysInMonth }, (_, i) => {
            return setDate(new Date(year, month - 1), i + 1);
        });
    }

    const handleCorrectionClick = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const record = recordsMap[dateStr];
        setSelectedDate(date);
        setSelectedRequiresApproval(!!(record?.requires_approval || (isAfter(startOfDay(new Date()), startOfDay(date)))));
        setMissingFlags({
            masuk: record?.is_missing_masuk ?? true,
            pulang: record?.is_missing_pulang ?? true
        });
        setCorrectionForm({
            jam_masuk: record?.jam_masuk ? format(new Date(record.jam_masuk), 'HH:mm') : '',
            jam_pulang: record?.jam_pulang ? format(new Date(record.jam_pulang), 'HH:mm') : '',
            alasan: ''
        });
        setShowCorrection(true);
    };

    const submitCorrection = async (e) => {
        e.preventDefault();
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            await api.post('/koreksi/request', {
                tanggal: dateStr,
                jam_masuk_baru: correctionForm.jam_masuk,
                jam_pulang_baru: correctionForm.jam_pulang,
                alasan: correctionForm.alasan
            });

            toast.success('Pengajuan koreksi berhasil dikirim');
            setShowCorrection(false);
            // Refresh logic could be here (e.g., fetch pending corrections)
            fetchData(); // Re-fetch all data to update pending corrections
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Gagal mengirim koreksi');
        }
    };

    const renderRow = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const record = recordsMap[dateStr];
        const pendingCorrection = correctionsMap[dateStr]; // Check pending correction

        const isPast = isAfter(startOfDay(new Date()), startOfDay(date));
        const isToday = isSameDay(new Date(), date);

        let status = 'future'; // future, hadir, mangkir, libur?
        let badgeVariant = 'neutral';
        let badgeText = '-';

        if (pendingCorrection) {
            // Always prioritize pending correction if exists
            status = 'pending';
            badgeVariant = 'warning';
            badgeText = 'Diproses';
        } else if (record) {
            status = record.status_hadir || 'hadir';
            badgeText = record.display_status || record.status_hadir;
            switch (badgeText) {
                case 'hadir': badgeVariant = 'success'; break;
                case 'hadir telat': badgeVariant = 'warning'; break;
                case 'Sakit': badgeVariant = 'success'; break;
                case 'Sakit TPS': badgeVariant = 'danger'; break;
                case 'sakit': badgeVariant = 'warning'; break;
                case 'izin': badgeVariant = 'primary'; break;
                case 'cuti': badgeVariant = 'primary'; break;
                case 'libur': badgeVariant = 'default'; badgeText = 'OFF'; break;
                case 'mangkir': badgeVariant = 'danger'; break;
                case 'belum absen': badgeVariant = 'default'; break;
                case 'tidak absen masuk':
                case 'tidak absen pulang': badgeVariant = 'warning'; break;
                case '':
                case '-': badgeVariant = 'neutral'; badgeText = badgeText || '-'; break;
                default: badgeVariant = 'danger';
            }
        } else if (isPast) {
            status = 'mangkir';
            badgeVariant = 'danger';
            badgeText = 'Mangkir / Tanpa Ket.';
        } else if (isToday) {
            status = 'today';
            badgeVariant = 'neutral';
            badgeText = 'Hari Ini';
        }

        // If fetch failed, show a single error row instead of generating mangkir defaults
        if (fetchError) {
            return (
                <tr key={dateStr} className="border-b border-gray-100 last:border-0">
                    <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                        Gagal memuat data riwayat. Silakan klik tombol Refresh di atas atau tekan tombol Reload pada halaman.
                    </td>
                </tr>
            );
        }

        return (
            <tr key={dateStr} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <div className="flex flex-col items-start leading-tight">
                        <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-tighter">{format(date, 'EEEE', { locale: id })}</span>
                        <span className="text-xs md:text-base font-black text-gray-900">{format(date, 'dd MMM yyyy', { locale: id })}</span>
                        {!['libur', 'cuti', 'sakit', 'sakit tps', 'izin', 'alpha', 'off'].includes(badgeText?.toLowerCase()) && (record?.shift || status === 'mangkir' || status === 'today') && (
                            <span className="text-[10px] md:text-xs text-gray-400 font-bold">
                                {`${(record?.shift?.jam_masuk || '08:00:00').slice(0, 5)}-${(record?.shift?.jam_pulang || '17:00:00').slice(0, 5)}`}
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <Badge variant={badgeVariant} className="text-[7px] md:text-xs px-1 py-0 font-black uppercase tracking-tighter leading-none border-none min-h-0 h-4 md:h-auto inline-flex items-center justify-center">
                        {badgeText}
                    </Badge>
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 font-black font-mono">
                    {record?.jam_masuk ? format(new Date(record.jam_masuk), 'HH:mm') : '--:--'}
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 font-black font-mono">
                    {record?.jam_pulang ? format(new Date(record.jam_pulang), 'HH:mm') : '--:--'}
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                    {status === 'pending' ? (
                        <span className="text-[8px] text-orange-600 font-extrabold bg-orange-50 px-1 py-0 rounded border border-orange-100 uppercase">
                            PROSES
                        </span>
                    ) : (record?.can_request_koreksi && !pendingCorrection) ? (
                        <button
                            onClick={() => handleCorrectionClick(date)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 active:scale-95 transition-all shadow-sm font-black text-[10px] uppercase tracking-tighter hover:bg-orange-100/50"
                            title="Ajukan Perbaikan"
                        >
                            <AlertCircle className="w-4 h-4" />
                            <span>Ajukan Koreksi</span>
                        </button>
                    ) : (
                        <span className="text-gray-300 text-[8px]">—</span>
                    )}
                </td>
            </tr>
        );
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <FileText className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight leading-none">
                                Riwayat Absensi
                            </h1>
                            <p className="text-gray-400 text-[10px] md:text-sm mt-1 font-medium italic">Pantau kehadiran & ajukan koreksi.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100 self-start sm:self-auto">
                        <div className="relative">
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                className="appearance-none bg-transparent pl-3 pr-6 py-1.5 text-xs md:text-sm font-black text-gray-700 focus:outline-none cursor-pointer"
                            >
                                {Array.from({ length: 12 }, (_, i) => {
                                    const optionDate = new Date(year, i, 1);
                                    const disabled = optionDate < APP_START_DATE;
                                    return (
                                        <option key={i + 1} value={i + 1} disabled={disabled}>
                                            {format(new Date(2023, i, 1), 'MMMM', { locale: id })}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="h-3 w-px bg-gray-300"></div>
                        <div className="relative">
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="appearance-none bg-transparent pl-3 pr-6 py-1.5 text-xs md:text-sm font-black text-gray-700 focus:outline-none cursor-pointer"
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={y} disabled={y < 2026}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => fetchData()}
                            className="ml-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </Card>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Tanggal</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Masuk (IN)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Pulang (OUT)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center leading-none">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin h-8 w-8 border-4 border-blue-100 border-t-blue-600 rounded-full"></div>
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Memproses Data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : datesArray.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-gray-300 font-bold italic">
                                        Tidak ada data untuk periode ini
                                    </td>
                                </tr>
                            ) : (
                                datesArray.map(date => renderRow(date))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 pb-24">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-100 border-t-blue-600 rounded-full"></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Memuat Riwayat...</p>
                    </div>
                ) : datesArray.length === 0 ? (
                    <div className="py-20 text-center text-gray-300 font-bold italic text-sm">
                        Tidak ada data tersedia
                    </div>
                ) : (
                    datesArray.map(date => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const record = recordsMap[dateStr];
                        const pendingCorrection = correctionsMap[dateStr];
                        const isPast = isAfter(startOfDay(new Date()), startOfDay(date));
                        const isToday = isSameDay(new Date(), date);

                        let badgeVariant = 'neutral';
                        let badgeText = '-';
                        if (pendingCorrection) { badgeVariant = 'warning'; badgeText = 'Diproses'; }
                        else if (record) {
                            badgeText = record.display_status || record.status_hadir;
                            switch (badgeText) {
                                case 'hadir': badgeVariant = 'success'; break;
                                case 'hadir telat': badgeVariant = 'warning'; break;
                                case 'libur': badgeVariant = 'default'; badgeText = 'OFF'; break;
                                case 'mangkir': badgeVariant = 'danger'; break;
                                case '-': badgeVariant = 'neutral'; break;
                                default: badgeVariant = 'primary';
                            }
                        } else if (isPast) { badgeVariant = 'danger'; badgeText = 'Mangkir'; }
                        else if (isToday) { badgeText = 'Hari Ini'; }

                        return (
                            <div key={dateStr} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{format(date, 'EEEE', { locale: id })}</span>
                                        <span className="text-sm font-black text-gray-900">{format(date, 'dd MMM yyyy', { locale: id })}</span>
                                    </div>
                                    <Badge variant={badgeVariant} className="text-[10px] font-bold uppercase px-2 py-0 min-h-0 h-5 border-none shadow-none leading-none">
                                        {badgeText}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 rounded-2xl p-3 border border-gray-100/50">
                                    <div className="flex flex-col gap-1 items-center justify-center border-r border-gray-100">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Masuk</span>
                                        <span className="text-sm font-black font-mono text-gray-900">
                                            {record?.jam_masuk ? format(new Date(record.jam_masuk), 'HH:mm') : '--:--'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 items-center justify-center">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pulang</span>
                                        <span className="text-sm font-black font-mono text-gray-900">
                                            {record?.jam_pulang ? format(new Date(record.jam_pulang), 'HH:mm') : '--:--'}
                                        </span>
                                    </div>
                                </div>
                                {(record?.can_request_koreksi && !pendingCorrection) && (
                                    <button
                                        onClick={() => handleCorrectionClick(date)}
                                        className="w-full mt-3 py-2 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-orange-100 flex items-center justify-center gap-2"
                                    >
                                        <AlertCircle className="w-3.5 h-3.5" /> Ajukan Koreksi
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal Koreksi */}
            <Modal
                isOpen={showCorrection}
                onClose={() => setShowCorrection(false)}
                title="Pengajuan Perbaikan Absen"
            >
                <form onSubmit={submitCorrection} className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <div className="text-sm text-orange-800">
                            <p className="font-bold">Perhatian</p>
                            {selectedRequiresApproval ? (
                                <p>Anda mengajukan koreksi untuk tanggal <span className="font-bold">{selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: id })}</span>. Pengajuan ini <strong>membutuhkan persetujuan atasan</strong>.</p>
                            ) : (
                                <p>Anda mengajukan koreksi untuk tanggal <span className="font-bold">{selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: id })}</span>. Pengajuan ini akan diproses tanpa perlu persetujuan atasan (hari ini).</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {missingFlags.masuk && (
                            <Input
                                label="Jam Masuk (Koreksi)"
                                type="time"
                                value={correctionForm.jam_masuk}
                                onChange={(e) => setCorrectionForm({ ...correctionForm, jam_masuk: e.target.value })}
                                required
                            />
                        )}
                        {missingFlags.pulang && (
                            <Input
                                label="Jam Pulang (Koreksi)"
                                type="time"
                                value={correctionForm.jam_pulang}
                                onChange={(e) => setCorrectionForm({ ...correctionForm, jam_pulang: e.target.value })}
                                required
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-0.5">Alasan Perbaikan</label>
                        <textarea
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm min-h-[100px]"
                            placeholder="Jelaskan kenapa Anda tidak absen (Lupa / Error / Dinas Luar)..."
                            value={correctionForm.alasan}
                            onChange={(e) => setCorrectionForm({ ...correctionForm, alasan: e.target.value })}
                            required
                        ></textarea>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setShowCorrection(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                        >
                            Kirim Pengajuan
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
