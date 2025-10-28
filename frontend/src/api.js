import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api/v1",
  withCredentials: true,
});

// Request interceptor to add retry logic for rate limiting and auth token
api.interceptors.request.use((config) => {
  // Add token to Authorization header if available
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const config = error.config;

    // Handle rate limiting (429 errors)
    if (error.response?.status === 429 && !config._retry) {
      config._retry = true;

      // Wait for 5 seconds before retrying
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(api.request(config));
        }, 5000);
      });
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
