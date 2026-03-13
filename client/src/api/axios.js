
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_APP_API_BASE_URL || '/api';

const api = axios.create({
    baseURL: apiBaseUrl,
});

// Add a request interceptor to include the token
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

export default api;
