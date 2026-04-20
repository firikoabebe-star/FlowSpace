import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, LoginCredentials, RegisterCredentials } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const response = await this.client.post('/auth/refresh');
            const { accessToken } = response.data.data;
            
            localStorage.setItem('accessToken', accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            
            return this.client(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.post('/auth/login', credentials);
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.post('/auth/register', credentials);
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.post('/auth/logout');
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.get('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.post('/auth/refresh');
    return response.data;
  }

  // Generic methods
  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url);
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();