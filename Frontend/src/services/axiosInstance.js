import axios from 'axios';
import { BASE_URL } from '../config/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle common errors (optional but good practice)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle 401 Unauthorized here (e.g. redirect to login)
    return Promise.reject(error);
  }
);

export default axiosInstance;
