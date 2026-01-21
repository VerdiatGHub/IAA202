/**
 * User Service - REST API implementation
 */

import { api } from '../lib/api';
import type { User, UserRole } from '../types';

// Response types
interface UsersApiResponse {
    users: Array<{
        id: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
        role: UserRole;
        createdAt: string;
        updatedAt?: string;
    }>;
    total: number;
    limit: number;
    offset: number;
}

interface UserStatsApiResponse {
    students: number;
    instructors: number;
    admins: number;
    total: number;
    recentUsers: Array<{
        id: string;
        email: string;
        fullName: string;
        role: UserRole;
        createdAt: string;
    }>;
}

interface CreateUserData {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
}

interface UpdateUserData {
    fullName?: string;
    avatarUrl?: string;
    role?: UserRole;
    password?: string;
}

// Get all users (admin only)
export async function getUsers(options?: {
    role?: UserRole;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<User[]> {
    const params = new URLSearchParams();
    if (options?.role) params.append('role', options.role);
    if (options?.search) params.append('search', options.search);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

    const { data, error } = await api.get<UsersApiResponse>(endpoint);

    if (error || !data) {
        throw new Error(error || 'Failed to fetch users');
    }

    return data.users.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        role: u.role,
        createdAt: u.createdAt,
    }));
}

// Get user by ID
export async function getUserById(userId: string): Promise<User> {
    const { data, error } = await api.get<User>(`/users/${userId}`);
    if (error || !data) {
        throw new Error(error || 'Failed to fetch user');
    }
    return data;
}

// Get user statistics (admin only) - returns format expected by AdminDashboard
export async function getUserStats(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalInstructors: number;
    totalAdmins: number;
    recentUsers: User[];
}> {
    const { data, error } = await api.get<UserStatsApiResponse>('/users/stats');

    if (error || !data) {
        throw new Error(error || 'Failed to fetch user stats');
    }

    return {
        totalUsers: data.total,
        totalStudents: data.students,
        totalInstructors: data.instructors,
        totalAdmins: data.admins,
        recentUsers: data.recentUsers.map(u => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            role: u.role,
            createdAt: u.createdAt,
        })),
    };
}

// Create new user (admin only)
export async function createUser(userData: CreateUserData): Promise<User> {
    const { data, error } = await api.post<User>('/users', userData);
    if (error || !data) {
        throw new Error(error || 'Failed to create user');
    }
    return data;
}

// Update user
export async function updateUser(userId: string, updates: UpdateUserData): Promise<User> {
    const { data, error } = await api.put<User>(`/users/${userId}`, updates);
    if (error || !data) {
        throw new Error(error || 'Failed to update user');
    }
    return data;
}

// Delete user (admin only)
export async function deleteUser(userId: string): Promise<void> {
    const { error } = await api.delete(`/users/${userId}`);
    if (error) {
        throw new Error(error);
    }
}

// Export all functions as named exports
export const userService = {
    getUsers,
    getUserById,
    getUserStats,
    createUser,
    updateUser,
    deleteUser,
};

export default userService;
