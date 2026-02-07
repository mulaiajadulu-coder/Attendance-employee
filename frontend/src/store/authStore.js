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
            // DEBUG: Show full error to user immediately
            let errorMessage = 'Login failed';

            if (error.response?.data) {
                // Backend sent a response (even 500)
                const data = error.response.data;

                // Case 1: Standard API Error ({ success: false, error: { message: "..." } })
                if (data.error?.message) {
                    errorMessage = data.error.message;
                }
                // Case 2: Critical Startup Error ({ error: "CRITICAL...", message: "..." })
                else if (data.message) {
                    errorMessage = `Server Error: ${data.message}`;
                    if (data.hint) errorMessage += ` (${data.hint})`;
                }
                // Case 3: Just a string
                else if (typeof data.error === 'string') {
                    errorMessage = data.error;
                }

                alert(`DEBUG ERROR FROM SERVER:\n${JSON.stringify(data, null, 2)}`);
            } else {
                // Network/CORS Error
                errorMessage = `Network Error: ${error.message}. Cek koneksi atau CORS.`;
                alert(errorMessage);
            }

            set({
                isLoading: false,
                error: errorMessage
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
