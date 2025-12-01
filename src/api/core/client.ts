import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { supabase } from '../../../lib/supabase';
import { ApiResponse, RequestConfig } from './types';
import { parseError, logError } from './errorHandler';

/**
 * API Client instance
 */
class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: import.meta.env.VITE_SUPABASE_URL || '',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    /**
     * Setup request and response interceptors
     */
    private setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            async (config) => {
                // Auto-attach auth token
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    config.headers.Authorization = `Bearer ${session.access_token}`;
                }

                // Add request ID for tracing
                config.headers['X-Request-ID'] = this.generateRequestId();

                // Log request in dev mode
                if (import.meta.env.DEV) {
                    console.log('[API Request]', config.method?.toUpperCase(), config.url, config.data);
                }

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                // Log response in dev mode
                if (import.meta.env.DEV) {
                    console.log('[API Response]', response.status, response.config.url, response.data);
                }

                return response;
            },
            async (error) => {
                const originalRequest = error.config;

                // Token refresh on 401
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

                        if (refreshError || !session) {
                            // Refresh failed, logout user
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                            return Promise.reject(error);
                        }

                        // Retry with new token
                        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        return Promise.reject(refreshError);
                    }
                }

                // Retry logic for network errors
                if (!error.response && !originalRequest._retryCount) {
                    originalRequest._retryCount = 0;
                }

                if (!error.response && originalRequest._retryCount < 2) {
                    originalRequest._retryCount++;

                    // Exponential backoff
                    const delay = Math.pow(2, originalRequest._retryCount) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));

                    return this.client(originalRequest);
                }

                // Parse and log error
                const apiError = parseError(error);
                logError(apiError, { url: originalRequest.url, method: originalRequest.method });

                return Promise.reject(apiError);
            }
        );
    }

    /**
     * GET request
     */
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.get<T>(url, config);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null as any,
                error: error.message,
            };
        }
    }

    /**
     * POST request
     */
    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.post<T>(url, data, config);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null as any,
                error: error.message,
            };
        }
    }

    /**
     * PUT request
     */
    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.put<T>(url, data, config);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null as any,
                error: error.message,
            };
        }
    }

    /**
     * DELETE request
     */
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.delete<T>(url, config);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null as any,
                error: error.message,
            };
        }
    }

    /**
     * Direct Supabase access (for non-REST API calls)
     */
    get supabase() {
        return supabase;
    }

    /**
     * Generate request ID
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
