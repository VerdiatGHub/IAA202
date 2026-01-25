import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Search,
    UserPlus,
    RefreshCw,
    Edit,
    Trash2,
    Shield,
    BookOpen,
    Calendar,
    Save,
    X,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CreateUserModal } from '../../components/admin';
import { getUsers, updateUser, deleteUser } from '../../services/userService';
import type { UserRole } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './AdminUsers.css';

interface UserData {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    createdAt: string;
    avatarUrl?: string;
}

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [editForm, setEditForm] = useState({ fullName: '', role: 'student' as UserRole });
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            toast.error('Failed to load users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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
            fetchUsers();
        } catch (err) {
            toast.error('Failed to update user');
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
            fetchUsers();
        } catch (err) {
            toast.error('Failed to delete user');
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

    return (
        <div className="admin-users animate-fadeIn">
            <div className="page-header">
                <div className="page-title-group">
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">View and manage all users in the system</p>
                </div>
                <Button
                    variant="primary"
                    icon={<UserPlus size={18} />}
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    Add New User
                </Button>
            </div>

            <div className="controls-section">
                <div className="search-filter-group">
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={18} />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
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
                <Button
                    variant="ghost"
                    icon={<RefreshCw size={18} />}
                    onClick={fetchUsers}
                    loading={loading}
                    title="Refresh list"
                >
                    Refresh
                </Button>
            </div>

            <div className="users-table-container">
                <div className="table-header">
                    <span className="col-user">User</span>
                    <span className="col-role">Role</span>
                    <span className="col-joined">Joined</span>
                    <span className="col-actions">Actions</span>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="animate-spin">
                            <RefreshCw size={32} />
                        </div>
                        <p>Loading users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <h3>No users found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    filteredUsers.map((user, index) => (
                        <div
                            key={user.id}
                            className={`table-row animate-slideUp ${editingUser?.id === user.id ? 'editing' : ''}`}
                            style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
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
                                            autoFocus
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

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    toast.success('User created successfully');
                    fetchUsers();
                }}
            />
        </div>
    );
};
