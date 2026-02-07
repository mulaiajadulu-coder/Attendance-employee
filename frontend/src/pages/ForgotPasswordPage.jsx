import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, Key, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1); // 1: Input ID, 2: Verify OTP, 3: New Password, 4: Success
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    // Step 1: Request OTP
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/forgot-password', { identifier });
            toast.success(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Gagal mengirim OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-otp', { identifier, otp });
            toast.success(res.data.message);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Kode OTP tidak valid');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return setError('Konfirmasi password tidak cocok');
        }
        if (newPassword.length < 6) {
            return setError('Password minimal 6 karakter');
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/reset-password', {
                identifier,
                otp,
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            toast.success(res.data.message);
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Gagal mengatur ulang password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">E</span>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {step === 4 ? 'Selesai!' : 'Lupa Password'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {step === 1 && 'Masukkan NIK atau Email terdaftar Anda.'}
                    {step === 2 && 'Masukkan 6 digit kode OTP yang dikirim ke email.'}
                    {step === 3 && 'Buat password baru yang kuat untuk akun Anda.'}
                    {step === 4 && 'Password Anda berhasil diperbarui.'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-gray-100">

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <p className="ml-3 text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <form className="space-y-6" onSubmit={handleRequestOTP}>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">NIK / Email</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                        placeholder="NIK atau Alamat Email"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
                            </button>
                            <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Kembali ke Login
                            </Link>
                        </form>
                    )}

                    {step === 2 && (
                        <form className="space-y-6" onSubmit={handleVerifyOTP}>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Kode OTP</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all font-black text-center text-2xl tracking-[10px]"
                                        placeholder="000000"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Memvalidasi...' : 'Verifikasi OTP'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Salah memasukkan data? Ganti Email/NIK
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form className="space-y-6" onSubmit={handleResetPassword}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Password Baru</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Konfirmasi Password Baru</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Menyimpan...' : 'Atur Ulang Password'}
                            </button>
                        </form>
                    )}

                    {step === 4 && (
                        <div className="text-center py-4">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                                </div>
                            </div>
                            <p className="text-gray-600 font-medium mb-8">
                                Password kamu sudah berhasil diganti. Silakan login kembali menggunakan password baru.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold shadow-lg transition-all"
                            >
                                Masuk Sekarang
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
