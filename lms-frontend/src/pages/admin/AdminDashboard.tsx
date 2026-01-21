import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    BookOpen,
    TrendingUp,
    Search,
    Edit,
    Trash2,
    UserPlus,
    Shield,
    Calendar,
    RefreshCw,
    AlertCircle,
    Save,
    X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CreateUserModal } from '../../components/admin';
import { getUsers, getUserStats, updateUser, deleteUser } from '../../services/userService';
import { getCourseStats } from '../../services/courseService';
import type { UserRole } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

interface UserData {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    createdAt: string;
    avatarUrl?: string;
}

interface Stats {
    totalUsers: number;
    totalStudents: number;
    totalInstructors: number;
    totalAdmins: number;
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
}

export const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentUsers, setRecentUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [editForm, setEditForm] = useState({ fullName: '', role: 'student' as UserRole });
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [usersData, userStats, courseStats] = await Promise.all([
                getUsers(),
                getUserStats(),
                getCourseStats(),
            ]);

            setUsers(usersData);
            setRecentUsers(userStats.recentUsers.slice(0, 4));
            setStats({
                totalUsers: userStats.totalUsers,
                totalStudents: userStats.totalStudents,
                totalInstructors: userStats.totalInstructors,
                totalAdmins: userStats.totalAdmins,
                totalCourses: courseStats.totalCourses,
                publishedCourses: courseStats.publishedCourses,
                totalEnrollments: courseStats.totalEnrollments,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch data';
            setError(message);
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    const handleEditUser = (user: UserData) => {
        setEditingUser(user);
        setEditForm({ fullName: user.fullName, role: user.role });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;

        setSavingEdit(true);
        try {
            await updateUser(editingUser.id, {
                fullName: editForm.fullName,
                role: editForm.role,
            });
            toast.success('User updated successfully');
            setEditingUser(null);
            fetchData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update user';
            toast.error(message);
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        setDeletingUserId(userId);
        try {
            await deleteUser(userId);
            toast.success('User deleted successfully');
            fetchData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete user';
            toast.error(message);
        } finally {
            setDeletingUserId(null);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield size={14} />;
            case 'instructor': return <BookOpen size={14} />;
            default: return <Users size={14} />;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch {
            return dateString;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const statsCards = stats ? [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: <Users size={24} />, color: 'primary' },
        { label: 'Total Courses', value: stats.totalCourses.toLocaleString(), icon: <BookOpen size={24} />, color: 'success' },
        { label: 'Enrollments', value: stats.totalEnrollments.toLocaleString(), icon: <TrendingUp size={24} />, color: 'info' },
        { label: 'Instructors', value: stats.totalInstructors.toLocaleString(), icon: <Shield size={24} />, color: 'warning' },
    ] : [];

    if (error && users.length === 0) {
        return (
            <div className="admin-dashboard">
                <div className="error-container">
                    <AlertCircle size={48} />
                    <h2>Failed to Load Dashboard</h2>
                    <p>{error}</p>
                    <Button onClick={fetchData} icon={<RefreshCw size={18} />}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <section className="admin-header animate-slideUp">
                <div className="header-content">
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">Manage users, courses, and platform settings</p>
                </div>
                <div className="header-actions">
                    <Button
                        variant="outline"
                        icon={<RefreshCw size={18} />}
                        onClick={fetchData}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="primary"
                        icon={<UserPlus size={18} />}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Add User
                    </Button>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="stats-section">
                <div className="stats-grid">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <Card key={index} className="stat-card stat-loading animate-pulse">
                                <div className="stat-skeleton"></div>
                            </Card>
                        ))
                    ) : (
                        statsCards.map((stat, index) => (
                            <Card
                                key={stat.label}
                                className={`stat-card stat-${stat.color} animate-slideUp`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="stat-icon">{stat.icon}</div>
                                <div className="stat-info">
                                    <span className="stat-value">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </section>

            {/* Main Content */}
            <div className="dashboard-grid">
                {/* Users Table */}
                <section className="users-section">
                    <div className="section-header">
                        <h2 className="section-title">User Management</h2>
                        <div className="section-actions">
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                icon={<Search size={16} />}
                                className="search-input"
                            />
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="role-filter"
                            >
                                <option value="all">All Roles</option>
                                <option value="student">Students</option>
                                <option value="instructor">Instructors</option>
                                <option value="admin">Admins</option>
                            </select>
                        </div>
                    </div>

                    <div className="users-table">
                        <div className="table-header">
                            <span className="col-user">User</span>
                            <span className="col-role">Role</span>
                            <span className="col-joined">Joined</span>
                            <span className="col-actions">Actions</span>
                        </div>

                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="table-row table-row-loading animate-pulse">
                                    <div className="col-user">
                                        <div className="skeleton-avatar"></div>
                                        <div className="skeleton-text"></div>
                                    </div>
                                    <div className="col-role"><div className="skeleton-badge"></div></div>
                                    <div className="col-joined"><div className="skeleton-text-sm"></div></div>
                                    <div className="col-actions"><div className="skeleton-actions"></div></div>
                                </div>
                            ))
                        ) : filteredUsers.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} />
                                <p>No users found</p>
                            </div>
                        ) : (
                            filteredUsers.map((user, index) => (
                                <div
                                    key={user.id}
                                    className={`table-row animate-slideUp ${editingUser?.id === user.id ? 'editing' : ''}`}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="col-user">
                                        <div className="user-avatar">
                                            {user.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        {editingUser?.id === user.id ? (
                                            <div className="user-info">
                                                <input
                                                    type="text"
                                                    className="edit-input"
                                                    value={editForm.fullName}
                                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                                />
                                                <span className="user-email">{user.email}</span>
                                            </div>
                                        ) : (
                                            <div className="user-info">
                                                <span className="user-name">{user.fullName}</span>
                                                <span className="user-email">{user.email}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-role">
                                        {editingUser?.id === user.id ? (
                                            <select
                                                className="edit-select"
                                                value={editForm.role}
                                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                                            >
                                                <option value="student">Student</option>
                                                <option value="instructor">Instructor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <span className={`role-badge ${user.role}`}>
                                                {getRoleIcon(user.role)}
                                                {user.role}
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-joined">
                                        <Calendar size={14} />
                                        {formatDate(user.createdAt)}
                                    </div>
                                    <div className="col-actions">
                                        {editingUser?.id === user.id ? (
                                            <>
                                                <button
                                                    className="action-btn success"
                                                    title="Save"
                                                    onClick={handleSaveEdit}
                                                    disabled={savingEdit}
                                                >
                                                    <Save size={16} />
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    title="Cancel"
                                                    onClick={() => setEditingUser(null)}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="action-btn"
                                                    title="Edit"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="action-btn danger"
                                                    title="Delete"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={deletingUserId === user.id}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="dashboard-sidebar">
                    {/* Recent Signups */}
                    <Card className="signups-card animate-slideUp">
                        <CardHeader>
                            <CardTitle>
                                <UserPlus size={20} />
                                Recent Users
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="loading-list">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="signup-item-skeleton animate-pulse"></div>
                                    ))}
                                </div>
                            ) : recentUsers.length === 0 ? (
                                <p className="empty-text">No recent users</p>
                            ) : (
                                <ul className="signups-list">
                                    {recentUsers.map((user) => (
                                        <li key={user.id} className="signup-item">
                                            <div className="signup-avatar">
                                                {user.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="signup-info">
                                                <span className="signup-name">{user.fullName}</span>
                                                <span className="signup-role">{user.role}</span>
                                            </div>
                                            <span className="signup-time">{formatTimeAgo(user.createdAt)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="quick-stats-card animate-slideUp" style={{ animationDelay: '0.1s' }}>
                        <CardHeader>
                            <CardTitle>
                                <TrendingUp size={20} />
                                Platform Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="loading-stats">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="stat-row-skeleton animate-pulse"></div>
                                    ))}
                                </div>
                            ) : stats && (
                                <>
                                    <div className="stat-row">
                                        <span className="stat-label">Students</span>
                                        <span className="stat-value">{stats.totalStudents.toLocaleString()}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span className="stat-label">Instructors</span>
                                        <span className="stat-value">{stats.totalInstructors.toLocaleString()}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span className="stat-label">Published Courses</span>
                                        <span className="stat-value">{stats.publishedCourses.toLocaleString()}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span className="stat-label">Total Enrollments</span>
                                        <span className="stat-value">{stats.totalEnrollments.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </aside>
            </div>

            {/* Create User Modal */}
            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    toast.success('User created successfully');
                    fetchData();
                }}
            />
        </div>
    );
};

export default AdminDashboard;
