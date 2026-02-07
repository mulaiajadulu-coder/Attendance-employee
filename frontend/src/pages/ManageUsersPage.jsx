import { useState, useEffect } from 'react';
import { Search, Plus, User, Edit2, Trash2, Store, Shield, Briefcase, Mail, Phone, Lock, X, Check, Calendar } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import useAuthStore from '../store/authStore';

export default function ManageUsersPage() {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [stats, setStats] = useState({ total: 0, aktif: 0, nonaktif: 0 });
    const [shifts, setShifts] = useState([]);

    // Form states
    const [formData, setFormData] = useState({
        nik: '',
        nama_lengkap: '',
        email: '',
        no_hp: '',
        password: '',
        role: 'karyawan',
        jabatan: 'Pramuniaga',
        penempatan_store: '',
        atasan_id: '',
        shift_default_id: '',
        homebase_id: '', // Added
        status_aktif: true,
        tanggal_bergabung: new Date().toISOString().split('T')[0]
    });

    const JABATAN_OPTIONS = [
        'Pramuniaga',
        'Cashier',
        'Customer Service',
        'Teknisi',
        'Office Boy',
        'Security'
    ];

    const [selectedStore, setSelectedStore] = useState('');
    const [storeOptions, setStoreOptions] = useState([]);

    useEffect(() => {
        fetchUsers();
        fetchShifts();
        fetchStores();
    }, [search, selectedStore]);

    const fetchStores = async () => {
        try {
            const res = await api.get('/users/stores');
            setStoreOptions(res.data.data);
        } catch (err) {
            console.error('Gagal mengambil data store');
        }
    };

    const fetchShifts = async () => {
        try {
            const res = await api.get('/shifts');
            setShifts(res.data.data);
        } catch (err) {
            console.error('Gagal mengambil data shift');
        }
    };

    const [outlets, setOutlets] = useState([]);
    useEffect(() => {
        const fetchOutlets = async () => {
            try {
                const res = await api.get('/outlets');
                setOutlets(res.data.data);
            } catch (error) {
                console.error("Failed to fetch outlets", error);
            }
        };
        fetchOutlets();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = { search };
            if (selectedStore) params.penempatan_store = selectedStore;

            const res = await api.get('/users', { params });
            setUsers(res.data.data);

            // Calculate stats
            const active = res.data.data.filter(u => u.status_aktif).length;
            setStats({
                total: res.data.data.length,
                aktif: active,
                nonaktif: res.data.data.length - active
            });
        } catch (err) {
            toast.error('Gagal mengambil data karyawan');
        } finally {
            setLoading(false);
        }
    };

    // Helper to sync Jabatan based on Role
    const getJabatanByRole = (role, currentJabatan) => {
        if (role === 'karyawan') return currentJabatan || 'Pramuniaga';
        if (role === 'hr') return 'HR Manager (HO)';
        if (role === 'hr_cabang') return 'HR Cabang';
        if (role === 'admin') return 'Admin Cabang';
        if (role === 'general_manager') return 'General Manager';
        if (role === 'area_manager') return 'Area Manager';
        if (role === 'manager') return 'Manager';
        if (role === 'supervisor') return 'Supervisor';
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setSelectedUser(user);
            const initialRole = user.role || 'karyawan';
            setFormData({
                nik: user.nik || '',
                nama_lengkap: user.nama_lengkap || '',
                email: user.email || '',
                no_hp: user.no_hp || '',
                password: '',
                role: initialRole,
                jabatan: getJabatanByRole(initialRole, user.jabatan),
                penempatan_store: user.penempatan_store || '',
                atasan_id: user.atasan_id || '',
                shift_default_id: user.shift_default_id || '',
                homebase_id: user.homebase_id || '', // Added
                status_aktif: user.status_aktif !== undefined ? user.status_aktif : true,
                tanggal_bergabung: user.tanggal_bergabung || new Date().toISOString().split('T')[0]
            });
        } else {
            setSelectedUser(null);
            setFormData({
                nik: '',
                nama_lengkap: '',
                email: '',
                no_hp: '',
                password: '',
                role: 'karyawan',
                jabatan: 'Pramuniaga',
                penempatan_store: currentUser?.role === 'hr_cabang' ? currentUser.penempatan_store : '',
                atasan_id: '',
                shift_default_id: '',
                homebase_id: '', // Added
                status_aktif: true,
                tanggal_bergabung: new Date().toISOString().split('T')[0]
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validation for store
            if (currentUser?.role === 'hr_cabang') {
                if (formData.penempatan_store !== currentUser.penempatan_store) {
                    toast.error('Anda hanya boleh menambahkan karyawan untuk store ' + currentUser.penempatan_store);
                    return;
                }
            }

            if (selectedUser) {
                await api.put(`/users/${selectedUser.id}`, formData);
                toast.success('Data karyawan berhasil diperbarui');
            } else {
                await api.post('/users', formData);
                toast.success('Karyawan baru berhasil ditambahkan');
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Terjadi kesalahan pada server';
            toast.error(msg);
        }
    };

    const handleDeactivate = async (id) => {
        if (window.confirm('PERINGATAN: Karyawan ini akan dinonaktifkan SEGERA dan dihapus PERMANEN dari database dalam 30 menit. Karyawan tidak akan bisa login lagi. Lanjutkan?')) {
            try {
                await api.delete(`/users/${id}`);
                toast.success('Karyawan dinonaktifkan. Penghapusan permanen dijadwalkan dalam 30 menit.');
                fetchUsers();
            } catch (err) {
                const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menonaktifkan karyawan';
                toast.error(msg);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Briefcase className="text-indigo-600 w-8 h-8" />
                        Kelola Karyawan
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Manajemen data SDM dan penempatan store.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5 font-black" />
                    Tambah Karyawan
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 border-indigo-600 uppercase">Total Karyawan</p>
                        <p className="text-2xl font-black text-gray-900">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <Check className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Status Aktif</p>
                        <p className="text-2xl font-black text-green-600">{stats.aktif}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Non-Aktif</p>
                        <p className="text-2xl font-black text-red-600">{stats.nonaktif}</p>
                    </div>
                </div>
            </div>

            {/* List & Search */}
            <div className="bg-white rounded-3xl shadow-xl shadow-indigo-900/5 border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 font-black" />
                        <input
                            type="text"
                            placeholder="Cari NIK atau Nama..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner"
                        />
                    </div>

                    {/* Store Filter for HR/Admin */}
                    {['hr', 'admin'].includes(currentUser?.role) && (
                        <div className="w-full md:w-64">
                            <select
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                                className="w-full p-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 text-gray-700"
                            >
                                <option value="">Semua Lokasi Store</option>
                                {storeOptions.map(store => (
                                    <option key={store} value={store}>{store}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Karyawan</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Penempatan</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kontak</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                                            <span className="font-bold text-gray-400">Loading data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-medium italic">
                                        Data karyawan belum ada.
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className={clsx("hover:bg-indigo-50/30 transition-colors", !user.status_aktif && "opacity-60")}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-black text-xs">
                                                {user.nama_lengkap.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{user.nama_lengkap}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{user.jabatan || 'Karyawan'}</p>
                                                    <span className="text-gray-300">•</span>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{user.nik}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Store className="w-4 h-4 text-indigo-400" />
                                            <span className="text-sm font-semibold text-gray-700">{user.penempatan_store || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-600 flex items-center gap-2"><Mail className="w-3 h-3 text-gray-400" /> {user.email}</p>
                                            <p className="text-xs font-medium text-gray-600 flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400" /> {user.no_hp || '-'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                                                user.role === 'hr' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                                    user.role === 'admin' ? "bg-red-50 text-red-700 border-red-100" :
                                                        ['supervisor', 'manager', 'area_manager', 'general_manager'].includes(user.role) ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                            "bg-gray-50 text-gray-700 border-gray-100"
                                            )}>
                                                {user.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    console.log('Edit clicked for user:', user);
                                                    handleOpenModal(user);
                                                }}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {user.status_aktif && (
                                                <button
                                                    onClick={() => handleDeactivate(user.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Nonaktifkan"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Form Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
                        <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-black text-2xl text-gray-900">{selectedUser ? 'Edit Karyawan' : 'Tambah Karyawan'}</h3>
                                        <p className="text-gray-500 font-medium text-sm">Pastikan NIK dan Email sudah benar.</p>
                                    </div>
                                    <button type="button" onClick={() => setShowModal(false)} className="p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-200 transition-colors">
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="p-8 overflow-y-auto space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">NIK Karyawan</label>
                                                <div className="relative">
                                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.nik}
                                                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100"
                                                        placeholder="Contoh: EMP001"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nama Lengkap</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.nama_lengkap}
                                                        onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Email Perusahaan</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        required
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1">Tanggal Bergabung</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        required
                                                        value={formData.tanggal_bergabung}
                                                        onChange={(e) => setFormData({ ...formData, tanggal_bergabung: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1">{selectedUser ? 'Ganti Password (Opsional)' : 'Password Awal'}</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="password"
                                                        required={!selectedUser}
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1">Role Akun</label>
                                                <select
                                                    value={formData.role}
                                                    onChange={(e) => {
                                                        const role = e.target.value;
                                                        const jabatan = getJabatanByRole(role, formData.jabatan);
                                                        setFormData({ ...formData, role, jabatan, atasan_id: '' });
                                                    }}
                                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black text-indigo-700"
                                                >
                                                    <option value="karyawan">KARYAWAN</option>
                                                    <option value="supervisor">SUPERVISOR</option>
                                                    <option value="manager">MANAGER</option>
                                                    <option value="area_manager">AREA MANAGER</option>
                                                    <option value="general_manager">GENERAL MANAGER</option>
                                                    <option value="hr_cabang">HR CABANG</option>
                                                    <option value="admin">ADMIN CABANG</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1">Jabatan / Posisi</label>
                                                <select
                                                    disabled={formData.role !== 'karyawan'}
                                                    value={formData.jabatan}
                                                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                                                    className={clsx(
                                                        "w-full p-4 border-none rounded-2xl font-bold transition-all",
                                                        formData.role === 'karyawan' ? "bg-gray-50 text-gray-700" : "bg-gray-100 text-gray-400 opacity-60"
                                                    )}
                                                >
                                                    {formData.role !== 'karyawan' ? (
                                                        <option value={formData.jabatan}>{formData.jabatan.toUpperCase()}</option>
                                                    ) : (
                                                        JABATAN_OPTIONS.map(j => (
                                                            <option key={j} value={j}>{j.toUpperCase()}</option>
                                                        ))
                                                    )}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1">Penempatan Store</label>
                                                <div className="relative">
                                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        disabled={currentUser?.role === 'hr_cabang'}
                                                        value={formData.penempatan_store}
                                                        onChange={(e) => setFormData({ ...formData, penempatan_store: e.target.value })}
                                                        className={clsx(
                                                            "w-full pl-12 pr-4 py-3 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100",
                                                            currentUser?.role === 'hr_cabang'
                                                                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                                                : "bg-gray-50 text-gray-900"
                                                        )}
                                                        placeholder="Contoh: Store Jakarta, Warehouse A..."
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1">Homebase / Outlet</label>
                                                <div className="relative">
                                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <select
                                                        value={formData.homebase_id}
                                                        onChange={(e) => setFormData({ ...formData, homebase_id: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100"
                                                    >
                                                        <option value="">-- Pilih Homebase (Utama) --</option>
                                                        {outlets.map(o => (
                                                            <option key={o.id} value={o.id}>{o.nama}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            {/* Dropdown Atasan - Hanya muncul untuk role yang memiliki atasan */}
                                            {!['general_manager', 'hr', 'admin'].includes(formData.role) && (
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1">Atasan Langsung (Approval)</label>
                                                    <select
                                                        value={formData.atasan_id}
                                                        onChange={(e) => setFormData({ ...formData, atasan_id: e.target.value })}
                                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold"
                                                    >
                                                        <option value="">-- Pilih Atasan Langsung --</option>
                                                        {users.filter(u => {
                                                            const uRole = u.role?.toLowerCase();
                                                            const myRole = formData.role?.toLowerCase();

                                                            if (u.id === selectedUser?.id) return false;

                                                            // HIRARKI KETAT
                                                            if (myRole === 'karyawan') return uRole === 'supervisor' || uRole === 'atasan';
                                                            if (myRole === 'supervisor') return uRole === 'manager';
                                                            if (myRole === 'admin') return uRole === 'manager';
                                                            if (myRole === 'hr_cabang') return uRole === 'hr';
                                                            if (myRole === 'manager') return uRole === 'area_manager';
                                                            if (myRole === 'area_manager') return uRole === 'general_manager';

                                                            return false;
                                                        }).map(u => (
                                                            <option key={u.id} value={u.id}>{u.nik} - {u.nama_lengkap} ({u.role?.toUpperCase()})</option>
                                                        ))}
                                                    </select>
                                                    {users.filter(u => {
                                                        const uRole = u.role?.toLowerCase();
                                                        const myRole = formData.role?.toLowerCase();
                                                        if (myRole === 'karyawan') return uRole === 'supervisor';
                                                        if (myRole === 'supervisor') return uRole === 'manager';
                                                        if (myRole === 'admin') return uRole === 'manager';
                                                        if (myRole === 'hr_cabang') return uRole === 'hr';
                                                        if (myRole === 'manager') return uRole === 'area_manager';
                                                        if (myRole === 'area_manager') return uRole === 'general_manager';
                                                        return false;
                                                    }).length === 0 && (
                                                            <p className="text-[10px] text-red-500 mt-2 px-1 font-bold italic">* Belum ada akun dengan Role {
                                                                formData.role === 'karyawan' ? 'Supervisor' :
                                                                    formData.role === 'supervisor' ? 'Manager' :
                                                                        formData.role === 'admin' ? 'Manager' :
                                                                            formData.role === 'hr_cabang' ? 'HR Manager (HO)' :
                                                                                formData.role === 'manager' ? 'Area Manager' :
                                                                                    'General Manager'
                                                            } untuk dipilih sebagai atasan.</p>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-gray-50 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 px-6 bg-white border border-gray-200 text-gray-600 rounded-3xl font-black uppercase text-xs hover:bg-gray-100 transition-all"
                                    >
                                        Batalkan
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 px-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95"
                                    >
                                        {selectedUser ? 'Simpan Perubahan' : 'Daftarkan Karyawan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
