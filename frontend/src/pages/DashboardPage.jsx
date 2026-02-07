import useAuthStore from '../store/authStore';
import { Clock, Calendar, AlertCircle, BarChart3, PieChart as PieChartIcon, User, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import AttendanceSummaryChart from '../components/charts/AttendanceSummaryChart';
import AttendanceTrendChart from '../components/charts/AttendanceTrendChart';
import WorkHoursCircularChart from '../components/charts/WorkHoursCircularChart';
import clsx from 'clsx';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [todayStatus, setTodayStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/absensi/today');
                setTodayStatus(res.data.data);
            } catch (error) {
                console.error('Failed to fetch status', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();

        // Fetch analytics for ALL roles
        (async () => {
            try {
                setAnalyticsLoading(true);
                const res = await api.get('/absensi/analytics');
                setAnalytics(res.data.data);
            } catch (e) {
                console.error('Failed to fetch analytics', e);
            } finally {
                setAnalyticsLoading(false);
            }
        })();

    }, [user?.role]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-24">
            {/* Welcome Card - Dynamic & Premium */}
            <div className="relative group overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-200 p-5 md:p-8 text-white">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-blue-100 opacity-80">Dashboard Overview</span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                        {getGreeting()}, <br className="sm:hidden" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white">
                            {user?.nama_lengkap?.split(' ')[0] || 'User'}
                        </span>!
                    </h1>
                    <p className="text-blue-100/70 mt-2 text-xs md:text-base font-medium max-w-md leading-relaxed">
                        Semoga harimu produktif. Pastikan kehadiranmu tercatat hari ini dengan akurat.
                    </p>
                </div>
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
            </div>

            {/* Stats Grid - Ultra Compact & Glossy */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {/* Status Absensi Card */}
                <div className="bg-white rounded-3xl shadow-sm p-4 border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <Clock className="h-4 w-4" />
                        </div>
                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Kehadiran</h3>
                    </div>

                    {isLoading ? (
                        <div className="animate-pulse space-y-1"><div className="h-4 bg-gray-100 rounded w-1/2"></div><div className="h-8 bg-gray-100 rounded w-3/4"></div></div>
                    ) : (
                        <div>
                            <div className="mb-0.5">
                                {todayStatus?.on_leave || todayStatus?.is_scheduled_off ? (
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                        {todayStatus?.display_status === '-' ? '-' : (todayStatus?.display_status || 'OFF / Libur')}
                                    </span>
                                ) : !todayStatus?.has_checked_in ? (
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> Belum Absen
                                    </span>
                                ) : !todayStatus?.has_checked_out ? (
                                    <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Sedang Bekerja
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter flex items-center gap-1">
                                        <CheckCircle2 className="w-1.5 h-1.5" /> Absensi Selesai
                                    </span>
                                )}
                            </div>
                            <div className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter font-mono">
                                {todayStatus?.on_leave || todayStatus?.is_scheduled_off ? '--:--' : (todayStatus?.record?.jam_masuk && !isNaN(new Date(todayStatus.record.jam_masuk).getTime())
                                    ? format(new Date(todayStatus.record.jam_masuk), 'HH:mm')
                                    : '--:--')}
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 mt-1">Waktu Masuk</p>
                        </div>
                    )}
                </div>

                {/* Shift Card */}
                <div className="bg-white rounded-3xl shadow-sm p-4 border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Jadwal Shift</h3>
                    </div>

                    <div className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter truncate leading-none uppercase">
                        {todayStatus?.on_leave || todayStatus?.is_scheduled_off ? 'OFF' : (todayStatus?.shift?.nama_shift || 'REGULAR')}
                    </div>

                    <div className="mt-2 flex items-center gap-1.5">
                        <div className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-black rounded-md border border-orange-100 uppercase tracking-tighter">
                            {todayStatus?.on_leave || todayStatus?.is_scheduled_off ? (
                                'LIBUR'
                            ) : (
                                `${(todayStatus?.shift?.jam_masuk || '08:00').slice(0, 5)} - ${(todayStatus?.shift?.jam_pulang || '17:00').slice(0, 5)}`
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Card - Full width on very small mobile */}
                <div className="col-span-2 lg:col-span-1 bg-white rounded-3xl shadow-sm p-4 border border-gray-100 flex flex-col justify-between group">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Tips Absensi</h3>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-semibold italic">
                        "Pastikan GPS aktif & wajah terlihat jelas untuk verifikasi."
                    </p>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">
                            {['admin', 'hr', 'manager', 'supervisor'].includes(user?.role) ? 'Team Monitoring' : 'Statistik Pribadi'}
                        </h2>
                    </div>
                    <div className="h-px flex-1 bg-gray-100 mx-6 hidden sm:block"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Summary</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {analyticsLoading ? (
                        <div className="md:col-span-2 py-16 flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
                                <BarChart3 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-gray-400 font-black text-xs uppercase tracking-widest mt-4">Mengkalkulasi Data...</p>
                        </div>
                    ) : !analytics ? (
                        <div className="md:col-span-2 py-16 flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                <BarChart3 className="w-8 h-8 text-gray-200" />
                            </div>
                            <p className="text-gray-400 font-bold text-sm">Data analitik belum tersedia</p>
                        </div>
                    ) : (
                        <>
                            {/* Work Hours & Attendance Progress */}
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Clock className="w-4 h-4" /></div>
                                    <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest">Progress Jam Kerja</h3>
                                </div>
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-full max-w-[200px] md:max-w-[240px]">
                                        <WorkHoursCircularChart
                                            current={todayStatus?.current_work_hours || 0}
                                            target={todayStatus?.target_work_hours || 8}
                                        />
                                    </div>
                                    <div className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/20 rounded-full -mr-10 -mt-10"></div>
                                        <p className="text-[11px] text-gray-600 font-bold leading-relaxed relative z-10">
                                            {todayStatus?.current_work_hours >= todayStatus?.target_work_hours
                                                ? "Target tercapai! Hebat."
                                                : `Sisa ${Math.max(0, (todayStatus?.target_work_hours || 8) - (todayStatus?.current_work_hours || 0)).toFixed(1)} jam untuk mencapai target.`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Leave Information */}
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-orange-50 rounded-xl text-orange-600"><Calendar className="w-4 h-4" /></div>
                                    <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest">Sisa Kuota Cuti</h3>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center py-4">
                                    <div className="text-7xl font-black text-gray-900 tracking-tighter mb-2">
                                        {user?.sisa_cuti || 0}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-8">Hari Tersedia</p>

                                    <div className="w-full space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">Masa Kerja</span>
                                            <span className="text-[10px] font-black text-orange-600">{Math.min(100, Math.round((user?.tenure?.total_days || 0) / 365 * 100))}%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-1000 ease-out shadow-sm"
                                                style={{ width: `${Math.min(100, Math.round((user?.tenure?.total_days || 0) / 365 * 100))}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[9px] text-gray-400 font-bold italic text-center">
                                            {user?.tenure?.total_days || 0} hari telah dilalui
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* TEAM ANALYTICS - ONLY FOR LEADERS */}
                            {['admin', 'hr', 'manager', 'supervisor', 'area_manager'].includes(user?.role) && analytics.summary && (
                                <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 pt-4">
                                    <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="p-2 bg-green-50 rounded-xl text-green-600"><PieChartIcon className="w-4 h-4" /></div>
                                            <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest">Kehadiran Tim Hari Ini</h3>
                                        </div>
                                        <div className="h-[240px] md:h-[300px]">
                                            <AttendanceSummaryChart compact data={analytics.summary} />
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><BarChart3 className="w-4 h-4" /></div>
                                            <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest">Tren Minggu Ini</h3>
                                        </div>
                                        <div className="h-[240px] md:h-[300px]">
                                            <AttendanceTrendChart compact data={analytics.trend?.map(t => ({
                                                date: new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                                                hadir: t.hadir,
                                                terlambat: t.terlambat
                                            }))} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
