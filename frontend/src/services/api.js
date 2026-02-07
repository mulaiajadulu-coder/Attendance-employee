import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').trim(), // Backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Add JWT token to header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 (Unauthorized)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not retried yet (Token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                // Refresh token call
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
                    refreshToken
                });

                const { token, refreshToken: newRefreshToken } = res.data.data;

                // Save new tokens
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', newRefreshToken);

                // Retry original request
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return api(originalRequest);

            } catch (refreshError) {
                // Logout if refresh fails
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
