import { useState, useEffect } from 'react';
import {
    User, Lock, Mail, Phone, Camera, ShieldCheck, ArrowRight,
    Loader2, CheckCircle2, Store, Briefcase, Calendar, Clock,
    Award, MapPin, Fingerprint, ChevronRight, Save
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({
        nama_lengkap: user?.nama_lengkap || '',
        nik: user?.nik || '',
        jabatan: user?.jabatan || '',
        email: user?.email || '',
        no_hp: user?.no_hp || '',
        penempatan_store: user?.penempatan_store || '',
        foto_profil: null, // base64
        previewUrl: user?.foto_profil_url ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${user.foto_profil_url}` : null
    });

    // Security State
    const [otpStep, setOtpStep] = useState(1);
    const [securityData, setSecurityData] = useState({
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData(prev => ({
                    ...prev,
                    foto_profil: reader.result,
                    previewUrl: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/profile`, profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Profil berhasil diperbarui');
                setUser({ ...user, ...res.data.data });
            }
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Gagal update profil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestOtp = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/profile/request-otp`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('OTP telah dikirim ke email Anda');
            setOtpStep(2);
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Gagal kirim OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        if (securityData.otp.length < 6) return toast.error('OTP harus 6 digit');
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/profile/verify-otp`, {
                otp: securityData.otp
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('OTP Terverifikasi! Silakan ubah password Anda.');
            setOtpStep(3);
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'OTP tidak valid');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        if (e) e.preventDefault();
        if (securityData.newPassword !== securityData.confirmPassword) {
            return toast.error('Konfirmasi password tidak cocok');
        }
        if (securityData.newPassword.length < 6) {
            return toast.error('Password minimal 6 karakter');
        }
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/profile/change-password`, {
                newPassword: securityData.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Password berhasil diubah!');
            setOtpStep(1);
            setSecurityData({ otp: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Gagal ubah password');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 px-4 md:px-0">
            {/* Header branding */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-3">
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Akun & Pengaturan</h1>
                    <p className="text-gray-400 text-xs font-medium">Kelola identitas dan keamanan profesional Anda</p>
                </div>

                {/* Modern Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-1.5 rounded-[0.5rem] text-[10px] font-bold transition-all duration-300",
                            activeTab === 'profile'
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <User className="w-3 h-3" /> Profil
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-1.5 rounded-[0.5rem] text-[10px] font-bold transition-all duration-300",
                            activeTab === 'security'
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Lock className="w-3 h-3" /> Keamanan
                    </button>
                </div>
            </div>

            {activeTab === 'profile' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                    {/* LEFT COLUMN: Identity Card (Sticky) */}
                    <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
                        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                            {/* Profile Header Background */}
                            <div className="h-24 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                            </div>

                            <div className="px-6 pb-8 -mt-12 relative">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative group mb-4">
                                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white p-1 shadow-2xl ring-4 ring-white">
                                            <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100">
                                                {profileData.previewUrl ? (
                                                    <img src={profileData.previewUrl} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <User className="w-10 h-10" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <label className="absolute -bottom-1 -right-1 p-2 bg-white hover:bg-gray-50 text-blue-600 rounded-xl shadow-xl cursor-pointer transition-all hover:scale-110 active:scale-95 border border-gray-100">
                                            <Camera className="w-4 h-4" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    </div>

                                    <h2 className="text-xl font-black text-gray-900 leading-tight">{user?.nama_lengkap}</h2>
                                    <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-1 mb-6">{user?.jabatan || 'Professional Member'}</p>

                                    <div className="w-full grid grid-cols-2 gap-2 mb-6">
                                        <div className="bg-gray-50 p-3 rounded-2xl text-left">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Masa Kerja</p>
                                            <p className="text-[11px] font-black text-blue-600">{user?.tenure?.string || '-'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-2xl text-left">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Sisa Cuti</p>
                                            <p className="text-[11px] font-black text-emerald-600">{user?.sisa_cuti || 0} Hari</p>
                                        </div>
                                    </div>

                                    <div className="w-full space-y-2">
                                        <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md"><Award className="w-3.5 h-3.5" /></div>
                                                <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Status Akun</span>
                                            </div>
                                            <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-bold rounded uppercase">Verified</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-gray-200 text-gray-500 rounded-md"><ShieldCheck className="w-3.5 h-3.5" /></div>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Role</span>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-700 uppercase">{user?.role}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info Block */}
                        <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-colors"></div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                                Security Status
                            </h4>
                            <div className="space-y-3">
                                <p className="text-[11px] text-indigo-100 leading-relaxed font-medium">Akun Anda dilindungi dengan enkripsi AES-256 dan verifikasi OTP.</p>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-400 w-full shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
                                </div>
                                <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Status: Maksimal</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Edit Form Content */}
                    <div className="lg:col-span-8">
                        <form onSubmit={handleUpdateProfile} className="space-y-6">

                            {/* Personal Information Group */}
                            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                                        <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                                        Informasi Personal
                                    </h3>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Nama Lengkap</label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 text-gray-400 rounded-lg group-focus-within:bg-blue-600 group-focus-within:text-white transition-all">
                                                <User className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                                type="text"
                                                value={profileData.nama_lengkap}
                                                onChange={(e) => setProfileData(prev => ({ ...prev, nama_lengkap: e.target.value }))}
                                                className="w-full pl-14 pr-4 py-2 bg-gray-50 border-transparent border-2 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:border-blue-100 outline-none transition-all shadow-inner"
                                                placeholder="Nama lengkap sesuai KTP"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Email Profesional</label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 text-gray-400 rounded-lg group-focus-within:bg-blue-600 group-focus-within:text-white transition-all">
                                                <Mail className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full pl-14 pr-4 py-2 bg-gray-50 border-transparent border-2 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:border-blue-100 outline-none transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Nomor WhatsApp</label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 text-gray-400 rounded-lg group-focus-within:bg-blue-600 group-focus-within:text-white transition-all">
                                                <Phone className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                                type="tel"
                                                value={profileData.no_hp}
                                                onChange={(e) => setProfileData(prev => ({ ...prev, no_hp: e.target.value }))}
                                                className="w-full pl-14 pr-4 py-2 bg-gray-50 border-transparent border-2 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:border-blue-100 outline-none transition-all shadow-inner"
                                                placeholder="Contoh: 081234..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Work Details Group */}
                            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                                        <div className="w-1 h-5 bg-orange-600 rounded-full"></div>
                                        Detail Pekerjaan
                                    </h3>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Nomor Induk Karyawan (NIK)</label>
                                        <div className="relative group opacity-80">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 text-gray-400 rounded-lg">
                                                <Briefcase className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                                type="text"
                                                disabled={!(user?.role === 'hr' || user?.role === 'admin')}
                                                value={profileData.nik}
                                                onChange={(e) => setProfileData(prev => ({ ...prev, nik: e.target.value }))}
                                                className="w-full pl-14 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm font-black text-gray-500 cursor-not-allowed shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Penempatan Unit/Store</label>
                                        <div className="relative group opacity-80">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 text-gray-400 rounded-lg">
                                                <MapPin className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                                type="text"
                                                disabled={!(user?.role === 'hr' || user?.role === 'admin')}
                                                value={profileData.penempatan_store}
                                                onChange={(e) => setProfileData(prev => ({ ...prev, penempatan_store: e.target.value }))}
                                                className="w-full pl-14 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm font-black text-gray-500 cursor-not-allowed shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Tanggal Bergabung</label>
                                        <div className="relative group opacity-80">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                                <Calendar className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="w-full pl-14 pr-4 py-2 bg-emerald-50/30 border-none rounded-xl text-sm font-black text-emerald-800 shadow-inner">
                                                {formatDate(user?.tanggal_bergabung)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Total Masa Kerja</label>
                                        <div className="relative group opacity-80">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                                                <Clock className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="w-full pl-14 pr-4 py-2 bg-orange-50/30 border-none rounded-xl text-sm font-black text-orange-800 shadow-inner">
                                                {user?.tenure?.string || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Action Bar / Mobile Submit */}
                            <div className="flex justify-end gap-3 pb-8">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="max-w-xl mx-auto items-center animate-in slide-in-from-right-8 duration-500">
                    <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200 border border-gray-100 p-8 md:p-10 overflow-hidden relative">
                        {/* Security Pattern Decor */}
                        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-blue-50/50 rounded-full blur-3xl"></div>
                        <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl"></div>

                        <div className="relative z-10 space-y-8">
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/40 transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                                    <Fingerprint className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Privasi & Keamanan</h3>
                                    <p className="text-gray-400 text-sm font-medium mt-1">Gunakan verifikasi dua langkah untuk ubah kata sandi</p>
                                </div>
                            </div>

                            {otpStep === 1 && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50/50 border-2 border-dashed border-blue-200 p-6 rounded-2xl flex items-start gap-4 group hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-default overflow-hidden">
                                        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Mail className="w-5 h-5" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Email Saat Ini</p>
                                            <p className="text-sm md:text-base font-black text-blue-900 break-all">{user?.email}</p>
                                            <p className="text-[10px] text-blue-600/60 font-medium mt-1 leading-tight">Kode rahasia akan dikirim ke alamat email di atas.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRequestOtp}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center group shadow-xl shadow-gray-400/10"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Ambil Kode Verifikasi
                                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
                                    </button>
                                </div>
                            )}

                            {otpStep === 2 && (
                                <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2 text-center">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Kode OTP 6-Digit</label>
                                        <input
                                            type="text"
                                            maxLength="6"
                                            value={securityData.otp}
                                            onChange={(e) => setSecurityData(prev => ({ ...prev, otp: e.target.value }))}
                                            className="w-full py-4 text-center text-4xl font-black tracking-[0.4em] bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-gray-200"
                                            placeholder="------"
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium mt-2">Silakan cek kotak masuk email Anda</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setOtpStep(1)}
                                            className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                            Verifikasi OTP
                                        </button>
                                    </div>
                                </form>
                            )}

                            {otpStep === 3 && (
                                <form onSubmit={handleChangePassword} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500 text-white rounded-lg">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <p className="text-[11px] font-bold text-emerald-800">OTP Terverifikasi. Silakan atur password baru Anda.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Password Baru</label>
                                            <input
                                                type="password"
                                                autoFocus
                                                value={securityData.newPassword}
                                                onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                className="w-full px-4 py-3 bg-gray-50 border-transparent border-2 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-100 outline-none transition-all shadow-inner"
                                                placeholder="Min 6 Karakter"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Konfirmasi</label>
                                            <input
                                                type="password"
                                                value={securityData.confirmPassword}
                                                onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                className="w-full px-4 py-3 bg-gray-50 border-transparent border-2 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-100 outline-none transition-all shadow-inner"
                                                placeholder="Ulangi Password"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center active:scale-95"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                        Simpan Password Baru
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

