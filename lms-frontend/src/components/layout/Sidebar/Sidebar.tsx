import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Home,
    BookOpen,
    FileText,
    ClipboardCheck,
    MessageSquare,
    BarChart3,
    Users,
    GraduationCap,
    PlusCircle,
    BookCheck,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import type { UserRole } from '../../../types';
import './Sidebar.css';

interface SidebarProps {
    userRole: UserRole;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    roles: UserRole[];
}

const navItems: NavItem[] = [
    // Student Navigation
    { icon: <Home size={20} />, label: 'Dashboard', href: '/student', roles: ['student'] },
    { icon: <BookOpen size={20} />, label: 'My Courses', href: '/student/courses', roles: ['student'] },
    { icon: <GraduationCap size={20} />, label: 'Browse Courses', href: '/student/catalog', roles: ['student'] },
    { icon: <FileText size={20} />, label: 'Assignments', href: '/student/assignments', roles: ['student'] },
    { icon: <ClipboardCheck size={20} />, label: 'Quizzes', href: '/student/quizzes', roles: ['student'] },
    { icon: <BarChart3 size={20} />, label: 'My Progress', href: '/student/progress', roles: ['student'] },
    { icon: <MessageSquare size={20} />, label: 'AI Assistant', href: '/student/ai-chat', roles: ['student'] },

    // Instructor Navigation
    { icon: <Home size={20} />, label: 'Dashboard', href: '/instructor', roles: ['instructor'] },
    { icon: <BookOpen size={20} />, label: 'My Courses', href: '/instructor/courses', roles: ['instructor'] },
    { icon: <PlusCircle size={20} />, label: 'Create Course', href: '/instructor/courses/new', roles: ['instructor'] },
    { icon: <BookCheck size={20} />, label: 'Grading', href: '/instructor/grading', roles: ['instructor'] },
    { icon: <Users size={20} />, label: 'Students', href: '/instructor/students', roles: ['instructor'] },
    { icon: <BarChart3 size={20} />, label: 'Analytics', href: '/instructor/analytics', roles: ['instructor'] },

    // Admin Navigation
    { icon: <Home size={20} />, label: 'Dashboard', href: '/admin', roles: ['admin'] },
    { icon: <Users size={20} />, label: 'Users', href: '/admin/users', roles: ['admin'] },
    { icon: <BookOpen size={20} />, label: 'Courses', href: '/admin/courses', roles: ['admin'] },
];

export const Sidebar: React.FC<SidebarProps> = ({
    userRole,
    isCollapsed,
    onToggleCollapse,
}) => {
    const location = useLocation();
    const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

    return (
        <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <GraduationCap size={32} className="logo-icon" />
                    {!isCollapsed && <span className="logo-text">EduLearn</span>}
                </div>
            </div>

            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {filteredNavItems.map((item) => (
                        <li key={item.href} className="sidebar-nav-item">
                            <NavLink
                                to={item.href}
                                className={({ isActive }) =>
                                    `nav-link ${isActive || location.pathname.startsWith(item.href + '/') ? 'nav-link-active' : ''}`
                                }
                                end={item.href === `/${userRole}`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <button className="sidebar-toggle" onClick={onToggleCollapse}>
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
        </aside>
    );
};

export default Sidebar;
