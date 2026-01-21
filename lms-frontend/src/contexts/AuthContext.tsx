import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, removeToken, isApiConfigured } from '../lib/api';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isConfigured: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

interface LoginResponse {
    token: string;
    user: {
        id: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
        role: 'student' | 'instructor' | 'admin';
        createdAt: string;
    };
}

interface MeResponse {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role: 'student' | 'instructor' | 'admin';
    createdAt: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch current user from token
    const fetchCurrentUser = useCallback(async () => {
        const token = getToken();
        if (!token) {
            return null;
        }

        const { data, error } = await api.get<MeResponse>('/auth/me');
        if (error || !data) {
            removeToken();
            return null;
        }

        return {
            id: data.id,
            email: data.email,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl,
            role: data.role,
            createdAt: data.createdAt,
        };
    }, []);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            if (!isApiConfigured) {
                setError('API is not configured. Please set VITE_API_URL in your .env file.');
                setLoading(false);
                return;
            }

            try {
                const currentUser = await fetchCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                }
            } catch (err) {
                console.error('Error initializing auth:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, [fetchCurrentUser]);

    const login = async (email: string, password: string) => {
        if (!isApiConfigured) {
            setError('API is not configured. Please contact administrator.');
            throw new Error('API not configured');
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: loginError } = await api.post<LoginResponse>(
                '/auth/login',
                { email, password },
                false // Don't require auth for login
            );

            if (loginError || !data) {
                throw new Error(loginError || 'Failed to login');
            }

            // Store token
            setToken(data.token);

            // Set user
            setUser({
                id: data.user.id,
                email: data.user.email,
                fullName: data.user.fullName,
                avatarUrl: data.user.avatarUrl,
                role: data.user.role,
                createdAt: data.user.createdAt,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to login';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        setError(null);

        try {
            // Call logout endpoint (optional, JWT is stateless)
            await api.post('/auth/logout', {});
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Always clear local state
            removeToken();
            setUser(null);
            setLoading(false);
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                isConfigured: isApiConfigured,
                login,
                logout,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
