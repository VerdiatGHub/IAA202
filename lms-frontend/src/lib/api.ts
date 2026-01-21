/**
 * API Client for LMS Backend
 * Replaces Supabase client with REST API calls
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Token management
const TOKEN_KEY = 'lms_auth_token';

export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
};

// API request helper
interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    requireAuth?: boolean;
}

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', body, requireAuth = true } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle token expiration
            if (response.status === 401) {
                removeToken();
                window.location.href = '/login';
            }
            return { data: null, error: data.error || 'Request failed' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('API request error:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}

// Convenience methods
export const api = {
    get: <T>(endpoint: string, requireAuth = true) =>
        apiRequest<T>(endpoint, { method: 'GET', requireAuth }),

    post: <T>(endpoint: string, body: unknown, requireAuth = true) =>
        apiRequest<T>(endpoint, { method: 'POST', body, requireAuth }),

    put: <T>(endpoint: string, body: unknown, requireAuth = true) =>
        apiRequest<T>(endpoint, { method: 'PUT', body, requireAuth }),

    delete: <T>(endpoint: string, requireAuth = true) =>
        apiRequest<T>(endpoint, { method: 'DELETE', requireAuth }),
};

// Check if API is configured
export const isApiConfigured = Boolean(API_URL);

export default api;
