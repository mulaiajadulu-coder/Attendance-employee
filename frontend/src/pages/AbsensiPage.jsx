import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import CameraCapture from '../components/absensi/CameraCapture';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import clsx from 'clsx';

export default function AbsensiPage() {
    const navigate = useNavigate();

    // Core States
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState(null); // 'masuk' or 'pulang'
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

    // State for Outlets
    const [outlets, setOutlets] = useState([]);
    const [selectedOutlet, setSelectedOutlet] = useState(null);
    const [fetchingOutlets, setFetchingOutlets] = useState(false);

    // UI States
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // 1. Fetch Status Hari Ini
    useEffect(() => {
        fetchStatus();
        getLocation();
    }, []);

    // Fetch Outlets when location is available and mode is active
    useEffect(() => {
        if (location && mode) {
            fetchNearbyOutlets();
        }
    }, [location, mode]);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/absensi/today');
            setStatus(res.data.data);
        } catch (err) {
            console.error(err);
            setErrorMsg('Gagal memuat status absensi.');
        } finally {
            setLoading(false);
        }
    };

    const fetchNearbyOutlets = async () => {
        if (!location) return;
        setFetchingOutlets(true);
        try {
            const res = await api.get(`/outlets/nearby?lat=${location.lat}&lng=${location.lng}`);
            setOutlets(res.data.data);
            // Auto-select if only 1
            if (res.data.data.length === 1) {
                setSelectedOutlet(res.data.data[0]);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Gagal mencari lokasi absen terdekat.');
        } finally {
            setFetchingOutlets(false);
        }
    };

    // 2. Get Location
    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation tidak didukung browser ini.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationError(null);
            },
            (err) => {
                console.error(err);
                setLocationError('Gagal mengambil lokasi. Pastikan GPS aktif.');
            },
            { enableHighAccuracy: true }
        );
    };

    // Handle Photo Capture
    const handleCapture = (imgData) => {
        setPhoto(imgData);
    };

    // Start Action
    const startAbsen = (type) => {
        setMode(type);
        setPhoto(null);
        setErrorMsg('');
        setSuccessMsg('');
        setSelectedOutlet(null);
        // Refresh location just in case
        getLocation();
    };

    // Submit Absensi
    const handleSubmit = async () => {
        if (!photo || !location) {
            setErrorMsg('Foto dan Lokasi wajib ada!');
            return;
        }

        // Validate Outlet for both Check-In and Check-Out
        if (!selectedOutlet) {
            setErrorMsg('Silakan pilih lokasi absen/store terlebih dahulu.');
            return;
        }

        setSubmitting(true);
        setErrorMsg('');

        try {
            const payload = {
                foto: photo, // Base64 string
                lokasi: location, // Send object {lat, lng} directly
                outlet_id: selectedOutlet?.id, // Required for both masuk and pulang
                ...(mode === 'pulang' && { catatan: 'Absen pulang via web' })
            };

            const endpoint = mode === 'masuk' ? '/absensi/masuk' : '/absensi/pulang';
            await api.post(endpoint, payload);

            setSuccessMsg(`Berhasil Absen ${mode === 'masuk' ? 'Masuk' : 'Pulang'}!`);

            // Reset & Refresh after 2 seconds
            setTimeout(() => {
                setMode(null);
                setPhoto(null);
                fetchStatus();
                setSuccessMsg('');
            }, 2000);

        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error?.message || 'Gagal melakukan absensi.';
            setErrorMsg(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Memuat...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col items-center">
                {/* Header - Only show when NOT in absensi mode */}
                {!mode && (
                    <>
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                            <Clock className="w-8 h-8 text-blue-600" />
                        </div>

                        <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">Presensi Harian</h1>
                        <div className="text-center mb-8">
                            <p className="text-2xl font-black text-gray-900 tracking-tight">{format(new Date(), 'EEEE', { locale: id })}</p>
                            <p className="text-sm text-gray-500 mt-1">{status?.shift ? `${status.shift.nama_shift} • ${status.shift.jam_masuk?.slice(0, 5)} - ${status.shift.jam_pulang?.slice(0, 5)}` : 'Regular • 08:00 - 17:00'}</p>
                        </div>

                        {/* Current Info Cards */}
                        <div className="w-full grid grid-cols-2 gap-4 md:gap-6 mb-8">
                            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 text-center">
                                <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-2">Check-In</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {status?.record?.jam_masuk && !isNaN(new Date(status.record.jam_masuk).getTime())
                                        ? format(new Date(status.record.jam_masuk), 'HH:mm')
                                        : '--:--'}
                                </p>
                            </div>
                            <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50 text-center">
                                <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-2">Check-Out</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {status?.record?.jam_pulang && !isNaN(new Date(status.record.jam_pulang).getTime())
                                        ? format(new Date(status.record.jam_pulang), 'HH:mm')
                                        : '--:--'}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Messages */}
                {errorMsg && (
                    <div className="w-full bg-red-50 border border-red-100 text-red-700 px-5 py-4 rounded-2xl mb-6 flex items-center gap-3 animate-pulse">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                        <p className="font-semibold text-sm">{errorMsg}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="w-full bg-green-50 border border-green-100 text-green-700 px-5 py-4 rounded-2xl mb-6 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                        <p className="font-semibold text-sm">{successMsg}</p>
                    </div>
                )}

                {/* Main Action Area */}
                {!mode ? (
                    <div className="w-full space-y-4">
                        {status?.record?.on_leave ? (
                            <div className="text-center py-10 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="w-10 h-10 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900">Sedang Cuti</h3>
                                <p className="text-gray-500 font-medium mt-1">
                                    Status Anda hari ini: <span className="text-blue-600 font-bold uppercase">{status.record.catatan || 'Cuti Disetujui'}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-4 italic">Tombol presensi dinonaktifkan secara otomatis.</p>
                            </div>
                        ) : (
                            // Show both buttons: Masuk & Pulang. Disable based on status
                            <div className="w-full flex flex-col sm:flex-row sm:items-center gap-4">
                                <button
                                    onClick={() => startAbsen('masuk')}
                                    disabled={status?.has_checked_in}
                                    className={clsx("flex-1 py-4 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3", status?.has_checked_in ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95')}
                                >
                                    <Clock className="w-7 h-7" />
                                    Absen Masuk
                                </button>

                                <button
                                    onClick={() => startAbsen('pulang')}
                                    disabled={status?.has_checked_out}
                                    className={clsx("flex-1 py-4 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3", status?.has_checked_out ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-200 active:scale-95')}
                                >
                                    <Clock className="w-7 h-7" />
                                    Absen Pulang
                                </button>
                            </div>
                        )}

                        {status?.has_checked_in && status?.has_checked_out && (
                            <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900">Tugas Selesai!</h3>                                <p className="text-gray-500 font-medium mt-1">Anda telah menyelesaikan presensi hari ini.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                            <h2 className="font-black text-2xl capitalize text-gray-900">
                                Lakukan <span className={clsx(mode === 'masuk' ? "text-blue-600" : "text-orange-500")}>Presensi {mode}</span>
                            </h2>
                            <button
                                onClick={() => {
                                    setMode(null);
                                    setSelectedOutlet(null);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Batalkan"
                            >
                                <XCircle className="w-8 h-8" />
                            </button>
                        </div>

                        {/* STEP 1: GPS & Outlet Selection (for both Check-In and Check-Out) */}
                        {!selectedOutlet ? (
                            <div className="space-y-4">
                                {/* GPS Status */}
                                {!location ? (
                                    <div className="bg-blue-50 p-4 rounded-2xl flex gap-4 items-center border border-blue-100">
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                        <p className="text-sm font-bold text-blue-700">Mencari Koordinat GPS...</p>
                                        {locationError && <span className="text-red-600 text-xs font-bold block bg-white px-2 py-1 rounded-lg ml-auto">{locationError}</span>}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-xs bg-gray-50 border border-gray-100 p-3 rounded-2xl w-fit">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="font-mono font-bold text-gray-600 tracking-tight">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black text-[10px] uppercase">Lokasi Terkunci</span>
                                    </div>
                                )}

                                {/* Outlet Selection */}
                                {location && (
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <label className="block text-lg font-black text-gray-800 mb-4">
                                            📍 Pilih Lokasi / Store {mode === 'pulang' && '(Harus sama dengan saat masuk)'}
                                        </label>
                                        {fetchingOutlets ? (
                                            <div className="flex items-center gap-3 py-8">
                                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                                                <p className="text-sm text-slate-600 font-medium">Sedang mencari store terdekat...</p>
                                            </div>
                                        ) : outlets.length > 0 ? (
                                            <div className="space-y-3">
                                                {outlets.map((outlet) => (
                                                    <button
                                                        key={outlet.id}
                                                        onClick={() => setSelectedOutlet(outlet)}
                                                        className="w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between hover:shadow-lg bg-white border-gray-200 text-gray-700 hover:border-blue-400"
                                                    >
                                                        <div>
                                                            <div className="font-bold text-lg">{outlet.nama}</div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {outlet.alamat || 'No Address'}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                                                            {outlet.distance_meters}m
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-red-500 text-sm font-medium flex items-center gap-2 py-4">
                                                <AlertTriangle className="w-5 h-5" />
                                                Tidak ada store dalam jangkauan. Pastikan Anda berada di lokasi yang tepat.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // STEP 2: Camera & Submit (after outlet selected)
                            <div className="space-y-6">
                                {/* Show selected outlet info */}
                                {selectedOutlet && (
                                    <div className={clsx(
                                        "p-4 rounded-2xl border flex items-center justify-between",
                                        mode === 'masuk' ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"
                                    )}>
                                        <div>
                                            <p className={clsx(
                                                "text-xs font-bold uppercase mb-1",
                                                mode === 'masuk' ? "text-blue-600" : "text-orange-600"
                                            )}>
                                                Store Terpilih {mode === 'pulang' && '(Absen Pulang)'}
                                            </p>
                                            <p className={clsx(
                                                "font-black",
                                                mode === 'masuk' ? "text-blue-900" : "text-orange-900"
                                            )}>{selectedOutlet.nama}</p>
                                            <p className={clsx(
                                                "text-xs mt-1",
                                                mode === 'masuk' ? "text-blue-700" : "text-orange-700"
                                            )}>{selectedOutlet.alamat}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedOutlet(null)}
                                            className={clsx(
                                                "text-sm font-bold underline hover:opacity-80",
                                                mode === 'masuk' ? "text-blue-600" : "text-orange-600"
                                            )}
                                        >
                                            Ganti
                                        </button>
                                    </div>
                                )}

                                {/* Camera Interface */}
                                <div className="relative group">
                                    <CameraCapture
                                        onCapture={handleCapture}
                                        label={photo ? "Foto Terdeteksi" : "Klik untuk Potret Wajah"}
                                    />
                                </div>

                                {/* Submit Control */}
                                {photo && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || !location}
                                        className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-xl hover:bg-green-700 shadow-xl shadow-green-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
                                    >
                                        {submitting ? (
                                            <div className="flex items-center gap-3">
                                                <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
                                                <span>Mengirim Data...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-7 h-7" />
                                                Kirim Presensi {mode === 'masuk' ? 'Masuk' : 'Pulang'}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
