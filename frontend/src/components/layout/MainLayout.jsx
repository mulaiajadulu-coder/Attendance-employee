import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import NotificationBell from '../ui/NotificationBell';
import {
    Menu, X, Home, Clock, Calendar, FileText,
    Settings, LogOut, User, DollarSign, CheckCircle, Eye, Briefcase, RefreshCw, ChevronDown, ChevronRight, MapPin, Megaphone
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import clsx from 'clsx';

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const location = useLocation();

    // Navigation Groups Configuration
    const navigationGroups = [
        {
            title: 'Utama',
            items: [
                { name: 'Dashboard', href: '/', icon: Home, roles: ['all'] },
            ]
        },
        {
            title: 'Presensi',
            items: [
                { name: 'In Out', href: '/absensi', icon: Clock, roles: ['all'] },
                { name: 'Absensi', href: '/riwayat', icon: FileText, roles: ['all'] },
                { name: 'Pengajuan', href: '/cuti', icon: Calendar, roles: ['all'] },
                { name: 'Tukar Shift', href: '/tukar-shift', icon: RefreshCw, roles: ['all'] },
                { name: 'Monitoring', href: '/monitoring', icon: Eye, roles: ['atasan', 'supervisor', 'manager', 'area_manager', 'general_manager', 'hr', 'hr_cabang', 'admin'] },
                { name: 'Persetujuan', href: '/persetujuan', icon: CheckCircle, roles: ['atasan', 'supervisor', 'manager', 'area_manager', 'general_manager', 'hr', 'hr_cabang', 'admin'] },
            ]
        },
        {
            title: 'Payroll',
            items: [
                { name: 'Slip Gaji', href: '/slip-gaji', icon: DollarSign, roles: ['all'] },
            ]
        },
        {
            title: 'Manajemen',
            items: [
                { name: 'Karyawan', href: '/manage-users', icon: Briefcase, roles: ['hr', 'hr_cabang', 'admin'] },
                { name: 'Lokasi Store', href: '/manage-outlets', icon: MapPin, roles: ['hr', 'admin'] }, // Added
                { name: 'Pengumuman', href: '/manage-announcements', icon: Megaphone, roles: ['hr', 'hr_manager', 'area_manager', 'manager', 'accounting', 'finance', 'admin', 'hr_cabang'] },
                { name: 'Jadwal Kerja', href: '/manage-schedule', icon: Calendar, roles: ['hr', 'hr_cabang', 'admin'] },
                { name: 'Shift Kerja', href: '/manage-shifts', icon: Clock, roles: ['hr', 'admin'] },
            ]
        },
        {
            title: 'Akun',
            items: [
                { name: 'Pengaturan', href: '/settings', icon: Settings, roles: ['all'] },
            ]
        }
    ];

    const isActive = (path) => location.pathname === path;

    // Filter groups based on user role
    const filteredGroups = navigationGroups.map(group => {
        const filteredItems = group.items.filter(item => {
            if (item.roles.includes('all')) return true;
            return item.roles.includes(user?.role);
        });
        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);

    // State for Collapsible Groups
    const [collapsedGroups, setCollapsedGroups] = useState({});

    // Toggle Collapse
    const toggleGroup = (title) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-[60] w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col h-full shadow-2xl lg:shadow-none",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-200">
                        <span className="text-white font-bold text-lg leading-none">A</span>
                    </div>
                    <span className="text-xl font-black text-gray-900 tracking-tight italic">Attendify</span>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/50 shrink-0">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {user?.nama_lengkap ? user.nama_lengkap.charAt(0) : '?'}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.nama_lengkap || 'User'}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role || 'karyawan'}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {filteredGroups.map((group) => (
                        <div key={group.title}>
                            {/* Group Header */}
                            <button
                                onClick={() => toggleGroup(group.title)}
                                className="w-full flex items-center justify-between px-3 text-xs font-black text-gray-400 uppercase tracking-wider mb-2 hover:text-blue-600 transition-colors"
                            >
                                {group.title}
                                {collapsedGroups[group.title] ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {/* Group Items */}
                            {!collapsedGroups[group.title] && (
                                <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                                    {group.items.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={clsx(
                                                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                                isActive(item.href)
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                            )}
                                            onClick={() => setIsSidebarOpen(false)}
                                        >
                                            <item.icon className={clsx(
                                                "mr-3 h-5 w-5",
                                                isActive(item.href) ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                                            )} />
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-200 shrink-0">
                    <button
                        onClick={logout}
                        className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Keluar
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Desktop Top Bar (Hidden on Mobile) */}
                <header className="hidden lg:flex bg-white border-b border-gray-200 h-16 items-center justify-end px-8 z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-gray-200 h-16 flex items-center px-5 justify-between shrink-0 sticky top-0 z-50">
                    <div className="flex items-center">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-200 animate-in zoom-in duration-500">
                            <span className="text-white font-bold text-lg">A</span>
                        </div>
                        <span className="text-xl font-black text-gray-900 tracking-tight italic">Attendify</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 active:scale-90 transition-all border border-gray-100 shadow-sm"
                            aria-label="Toggle Menu"
                        >
                            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 lg:p-8 relative scroll-smooth bg-gray-50/50">
                    {/* Content Wrapper */}
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
