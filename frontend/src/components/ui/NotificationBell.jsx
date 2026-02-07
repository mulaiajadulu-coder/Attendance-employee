import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import api from '../../services/api';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const [readAnnouncementIds, setReadAnnouncementIds] = useState(() => {
        const saved = localStorage.getItem('read_announcements');
        return saved ? JSON.parse(saved) : [];
    });

    // Fetch notifications and announcements
    const fetchNotifications = async () => {
        try {
            const [notifRes, announcementRes] = await Promise.all([
                api.get('/notifications'),
                api.get('/notifications/announcements')
            ]);

            if (notifRes.data?.data) {
                setNotifications(notifRes.data.data.notifications || []);
                setUnreadCount(notifRes.data.data.unreadCount || 0);
            }

            if (announcementRes.data?.data) {
                setAnnouncements(announcementRes.data.data || []);
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (id) => {
        try {
            // Optimistic update
            const notif = notifications.find(n => n.id === id);
            if (notif && !notif.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            }
            await api.put(`/notifications/${id}/read`);
            await fetchNotifications();
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    };

    // Mark announcement as read (Local only)
    const markAnnouncementAsRead = (id) => {
        if (!readAnnouncementIds.includes(id)) {
            const newReadIds = [...readAnnouncementIds, id];
            setReadAnnouncementIds(newReadIds);
            localStorage.setItem('read_announcements', JSON.stringify(newReadIds));
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            setLoading(true);
            // 1. Mark all notifications as read on backend
            await api.put('/notifications/read-all');

            // 2. Mark all currently visible announcements as read locally
            const currentAnnouncementIds = announcements.map(a => a.id);
            const newReadIds = [...new Set([...readAnnouncementIds, ...currentAnnouncementIds])];
            setReadAnnouncementIds(newReadIds);
            localStorage.setItem('read_announcements', JSON.stringify(newReadIds));

            await fetchNotifications();
        } catch (error) {
            console.error('Mark all as read error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Polling every 5 seconds (Realtime-ish)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotifications();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'cuti_status':
            case 'cuti_request':
                return '🏖️';
            case 'koreksi_approved':
            case 'koreksi_rejected':
            case 'koreksi_request':
                return '📝';
            case 'shift_change_status':
            case 'shift_change_request':
                return '🔄';
            default:
                return '📢';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-50 border-red-200';
            case 'high':
                return 'bg-orange-50 border-orange-200';
            case 'medium':
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const combinedItems = [
        ...announcements.map(a => ({
            ...a,
            itemType: 'announcement',
            read: readAnnouncementIds.includes(a.id) // Add virtual read property
        })),
        ...notifications.map(n => ({ ...n, itemType: 'notification' }))
    ].sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

    // Calculate badge based on unread notifications AND unread announcements
    const unreadAnnouncementsCount = announcements.filter(a => !readAnnouncementIds.includes(a.id)).length;
    const badgeCount = unreadCount + unreadAnnouncementsCount;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell className="w-6 h-6 text-gray-600" />
                {badgeCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-gray-900">Notifikasi</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    disabled={loading}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto flex-1">
                        {combinedItems.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Tidak ada notifikasi</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {combinedItems.map((item, index) => {
                                    if (item.itemType === 'announcement') {
                                        return (
                                            <div
                                                key={`announcement-${item.id}`}
                                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${getPriorityColor(item.priority)}`}
                                                onClick={() => markAnnouncementAsRead(item.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">📢</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-sm text-gray-900 truncate">
                                                                {item.title}
                                                            </h4>
                                                            {!item.read && (
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                            )}
                                                            {item.priority === 'urgent' && (
                                                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                                                    URGENT
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                                            {item.content}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-400">
                                                                {item.creator?.nama_lengkap || 'HR'}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {format(new Date(item.createdAt), 'dd MMM HH:mm', { locale: id })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div
                                                key={`notification-${item.id}`}
                                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!item.read ? 'bg-blue-50' : ''
                                                    }`}
                                                onClick={() => !item.read && markAsRead(item.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">{getNotificationIcon(item.type)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-sm text-gray-900 truncate">
                                                                {item.title}
                                                            </h4>
                                                            {!item.read && (
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-600 mb-2">
                                                            {item.message}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-400 font-medium">
                                                                {item.actor?.nama_lengkap || ''}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {format(new Date(item.created_at), 'dd MMM HH:mm', { locale: id })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
