import React, { useState } from 'react';
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
import type { User as UserType } from '../../../types';
import './Header.css';

interface HeaderProps {
    user: UserType | null;
    onLogout: () => void;
    onToggleMobileMenu?: () => void;
}

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
                        <span className="notification-badge">3</span>
                    </button>
                    {showNotifications && (
                        <div className="dropdown-menu notifications-menu animate-slideDown">
                            <div className="dropdown-header">
                                <h4>Notifications</h4>
                                <button className="link-btn">Mark all as read</button>
                            </div>
                            <div className="notifications-list">
                                <div className="notification-item unread">
                                    <div className="notification-content">
                                        <p className="notification-text">
                                            <strong>New assignment</strong> posted in Web Development
                                        </p>
                                        <span className="notification-time">2 hours ago</span>
                                    </div>
                                </div>
                                <div className="notification-item unread">
                                    <div className="notification-content">
                                        <p className="notification-text">
                                            Your quiz score is <strong>85%</strong>
                                        </p>
                                        <span className="notification-time">5 hours ago</span>
                                    </div>
                                </div>
                                <div className="notification-item">
                                    <div className="notification-content">
                                        <p className="notification-text">
                                            Course <strong>React Mastery</strong> has been updated
                                        </p>
                                        <span className="notification-time">1 day ago</span>
                                    </div>
                                </div>
                            </div>
                            <div className="dropdown-footer">
                                <button className="link-btn">View all notifications</button>
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
