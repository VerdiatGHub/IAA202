import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Search,
    Moon,
    Sun,
    LogOut,
    User,
    Settings,
    ChevronDown,
    Menu,
} from 'lucide-react';
import type { User as UserType, Notification } from '../../../types';
import { api } from '../../../lib/api';
import './Header.css';

interface HeaderProps {
    user: UserType | null;
    onLogout: () => void;
    onToggleMobileMenu?: () => void;
}

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
};

export const Header: React.FC<HeaderProps> = ({
    user,
    onLogout,
    onToggleMobileMenu,
}) => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch notifications on mount
    useEffect(() => {
        const fetchNotifications = async () => {
            const { data } = await api.get<Notification[]>('/notifications');
            if (data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            }
        };
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    // Mark all notifications as read
    const handleMarkAllAsRead = async () => {
        const { error } = await api.put('/notifications/read-all', {});
        if (!error) {
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        }
    };

    // Mark single notification as read
    const handleMarkAsRead = async (id: string) => {
        const { error } = await api.put(`/notifications/${id}/read`, {});
        if (!error) {
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const toggleTheme = () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        setIsDarkMode(!isDarkMode);
        localStorage.setItem('theme', newTheme);
    };

    const handleProfileClick = (path: string) => {
        navigate(path);
        setShowProfileMenu(false);
    };

    const handleLogout = () => {
        setShowProfileMenu(false);
        onLogout();
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="header-mobile-menu" onClick={onToggleMobileMenu}>
                    <Menu size={24} />
                </button>
                <div className="header-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search courses, lessons..."
                        className="search-input"
                    />
                </div>
            </div>

            <div className="header-right">
                {/* Theme Toggle */}
                <button className="header-icon-btn" onClick={toggleTheme} title="Toggle theme">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <div className="header-dropdown">
                    <button
                        className="header-icon-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount}</span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="dropdown-menu notifications-menu animate-slideDown">
                            <div className="dropdown-header">
                                <h4>Notifications</h4>
                                {unreadCount > 0 && (
                                    <button className="link-btn" onClick={handleMarkAllAsRead}>
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="notifications-list">
                                {notifications.length === 0 ? (
                                    <div className="notification-item">
                                        <div className="notification-content">
                                            <p className="notification-text">No notifications</p>
                                        </div>
                                    </div>
                                ) : (
                                    notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                            onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                            style={{ cursor: !notification.isRead ? 'pointer' : 'default' }}
                                        >
                                            <div className="notification-content">
                                                <p className="notification-text">
                                                    <strong>{notification.title}</strong> {notification.message}
                                                </p>
                                                <span className="notification-time">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="dropdown-footer">
                                <button className="link-btn" onClick={() => navigate('/notifications')}>
                                    View all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="header-dropdown">
                    <button
                        className="profile-btn"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="profile-avatar">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} />
                            ) : (
                                <span>{user?.fullName?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                        <div className="profile-info">
                            <span className="profile-name">{user?.fullName || 'User'}</span>
                            <span className="profile-role">{user?.role || 'Student'}</span>
                        </div>
                        <ChevronDown size={16} className={`chevron ${showProfileMenu ? 'rotated' : ''}`} />
                    </button>
                    {showProfileMenu && (
                        <div className="dropdown-menu profile-menu animate-slideDown">
                            <button
                                className="dropdown-item"
                                onClick={() => handleProfileClick('/profile')}
                            >
                                <User size={16} />
                                My Profile
                            </button>
                            <button
                                className="dropdown-item"
                                onClick={() => handleProfileClick('/settings')}
                            >
                                <Settings size={16} />
                                Settings
                            </button>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item danger" onClick={handleLogout}>
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Click overlay to close dropdowns */}
            {(showProfileMenu || showNotifications) && (
                <div
                    className="dropdown-overlay"
                    onClick={() => {
                        setShowProfileMenu(false);
                        setShowNotifications(false);
                    }}
                />
            )}
        </header>
    );
};

export default Header;
