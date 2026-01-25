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
    retries?: number;
    retryDelay?: number;
}

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    statusCode?: number;
}

// Check if error is transient and should be retried
function isTransientError(statusCode: number): boolean {
    // Retry on network errors, server errors, and rate limiting
    return statusCode >= 500 || statusCode === 408 || statusCode === 429;
}

// Delay helper for retry logic
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {
    const { 
        method = 'GET', 
        body, 
        requireAuth = true,
        retries = 2,
        retryDelay = 1000
    } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    let lastError: string | null = null;
    let lastStatusCode: number | undefined;

    // Retry loop
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            lastStatusCode = response.status;

            // Try to parse response as JSON
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    removeToken();
                    window.location.href = '/login';
                    return { data: null, error: 'Unauthorized', statusCode: 401 };
                }

                // Extract error message
                const errorMessage = typeof data === 'object' && data?.error 
                    ? data.error 
                    : typeof data === 'string' 
                    ? data 
                    : 'Request failed';

                // Check if we should retry
                if (attempt < retries && isTransientError(response.status)) {
                    lastError = errorMessage;
                    console.warn(`API request failed (attempt ${attempt + 1}/${retries + 1}), retrying...`, {
                        endpoint,
                        status: response.status,
                        error: errorMessage
                    });
                    await delay(retryDelay * (attempt + 1)); // Exponential backoff
                    continue;
                }

                return { 
                    data: null, 
                    error: errorMessage,
                    statusCode: response.status
                };
            }

            return { data, error: null, statusCode: response.status };
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Network error';
            lastStatusCode = 0; // Network error

            // Retry on network errors
            if (attempt < retries) {
                console.warn(`Network error (attempt ${attempt + 1}/${retries + 1}), retrying...`, {
                    endpoint,
                    error: lastError
                });
                await delay(retryDelay * (attempt + 1)); // Exponential backoff
                continue;
            }

            console.error('API request error:', error);
            return {
                data: null,
                error: lastError,
                statusCode: lastStatusCode
            };
        }
    }

    // Should not reach here, but just in case
    return {
        data: null,
        error: lastError || 'Request failed after retries',
        statusCode: lastStatusCode
    };
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
