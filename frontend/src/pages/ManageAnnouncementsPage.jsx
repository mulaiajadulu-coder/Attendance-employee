import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Plus, Trash2, Search, Megaphone, Calendar,
    AlertCircle, Users, CheckCircle, X, User
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function ManageAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'medium',
        expires_at: '',
        role_targets: [] // Empty means all
    });

    const rolesList = [
        { value: 'karyawan', label: 'Karyawan' },
        { value: 'hr', label: 'HR Pusat' },
        { value: 'hr_cabang', label: 'HR Cabang' },
        { value: 'manager', label: 'Manager Store' },
        { value: 'area_manager', label: 'Area Manager' },
        { value: 'supervisor', label: 'Supervisor' },
        { value: 'accounting', label: 'Accounting' },
        { value: 'finance', label: 'Finance' },
        { value: 'admin', label: 'Admin' }
    ];

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications/announcements');
            // The endpoint returns active ones for USER. 
            // Ideally we need an endpoint to "Manage" announcements (see all created by me, or all if admin)
            // For now let's reuse the get endpoint but in real app might need separate "admin list"
            if (response.data.success) {
                setAnnouncements(response.data.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Gagal memuat pengumuman');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus pengumuman ini?')) return;
        try {
            await api.delete(`/notifications/announcements/${id}`);
            toast.success('Pengumuman dihapus');
            fetchAnnouncements();
        } catch (error) {
            toast.error('Gagal menghapus pengumuman');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/notifications/announcements', {
                ...formData,
                role_targets: formData.role_targets.length > 0 ? formData.role_targets : null
            });
            toast.success('Pengumuman berhasil dibuat');
            setIsModalOpen(false);
            setFormData({
                title: '',
                content: '',
                priority: 'medium',
                expires_at: '',
                role_targets: []
            });
            fetchAnnouncements();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.response?.data?.message || 'Gagal membuat pengumuman');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleRole = (roleValue) => {
        setFormData(prev => {
            if (prev.role_targets.includes(roleValue)) {
                return { ...prev, role_targets: prev.role_targets.filter(r => r !== roleValue) };
            } else {
                return { ...prev, role_targets: [...prev.role_targets, roleValue] };
            }
        });
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            urgent: 'bg-red-100 text-red-700 border-red-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            medium: 'bg-blue-100 text-blue-700 border-blue-200',
            low: 'bg-gray-100 text-gray-700 border-gray-200'
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${styles[priority] || styles.medium}`}>
                {priority.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Pengumuman</h1>
                    <p className="text-gray-500">Buat dan kelola pengumuman untuk karyawan</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                    <Plus className="w-5 h-5" />
                    Buat Pengumuman
                </button>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Memuat data...</div>
                ) : announcements.length === 0 ? (
                    <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Megaphone className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-900">Belum ada pengumuman</h3>
                        <p className="text-gray-500 text-sm mt-1">Buat pengumuman pertama Anda sekarang</p>
                    </div>
                ) : (
                    announcements.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                                        {getPriorityBadge(item.priority)}
                                        {item.createdAt && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm', { Locale: id })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 whitespace-pre-wrap">{item.content}</p>

                                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            Target: {item.target_roles ? JSON.parse(JSON.stringify(item.target_roles)).join(', ') : 'Semua User'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            Oleh: {item.creator?.nama_lengkap || 'System'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus Pengumuman"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-xl text-gray-900">Buat Pengumuman Baru</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Judul Pengumuman</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Contoh: Jadwal Libur Lebaran"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Isi Pengumuman</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Tulis detail pengumuman di sini..."
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Prioritas</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Berlaku Sampai (Opsional)</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        value={formData.expires_at}
                                        onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Target Penerima (Opsional)</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50">
                                    {rolesList.map(role => (
                                        <label key={role.value} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.role_targets.includes(role.value)}
                                                onChange={() => toggleRole(role.value)}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{role.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">*Jika tidak ada yang dipilih, pengumuman akan dikirim ke SEMUA user.</p>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                                >
                                    {submitting ? 'Mengirim...' : 'Kirim Pengumuman'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
