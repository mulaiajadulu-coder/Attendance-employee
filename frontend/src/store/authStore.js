import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    // Login
    login: async (nik, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { nik, password });
            const { token, refreshToken, user } = response.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);

            set({ user, isAuthenticated: true, isLoading: false });
            return true;
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.error?.message || 'Login failed'
            });
            return false;
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
    },

    // Check Auth (On App Load)
    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
        }

        try {
            const response = await api.get('/auth/me');
            set({
                user: response.data.data,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false
            });
        }
    }
}));

export default useAuthStore;
