import axios from "axios";

// Constants for configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://192.168.1.11:4000/api/v1";
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 1000; // 1 second base delay
const RETRY_MULTIPLIER = 2; // Exponential backoff multiplier

// Vercel error codes that should trigger retries
const RETRYABLE_ERROR_STATUSES = [502, 503, 504, 500];

// Error messages for user-friendly display
const ERROR_MESSAGES = {
  400: "Bad request. Please check your input.",
  401: "Authentication required. Please log in again.",
  402: "Payment required.",
  403: "Access denied.",
  404: "Resource not found.",
  405: "Method not allowed.",
  408: "Request timeout.",
  413: "Request too large.",
  414: "URL too long.",
  416: "Range not satisfiable.",
  429: "Too many requests. Please try again later.",
  431: "Request header too large.",
  500: "Internal server error. Please try again later.",
  502: "Bad gateway. The server is temporarily unavailable.",
  503: "Service unavailable. Please try again later.",
  504: "Gateway timeout. Please try again later.",
  508: "Loop detected. Please contact support.",
};

/**
 * Axios instance configured for API communication
 * Includes interceptors for authentication, retry logic, and error handling
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Request interceptor to add authentication token to headers
 * @param {Object} config - Axios request configuration
 * @returns {Object} Modified config with authorization header
 */
api.interceptors.request.use((config) => {
  // Add token to Authorization header if available
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor to handle errors and implement retry logic
 * @param {Object} response - Axios response object
 * @returns {Object} Response object
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const config = error.config;
    const status = error.response?.status;

    // Initialize retry count if not present
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    // Skip retry for registration endpoint on rate limiting
    const isRegistrationEndpoint = config.url?.includes('/user/register');

    // Handle retryable errors (502, 503, 504, 500) with exponential backoff
    if (status && RETRYABLE_ERROR_STATUSES.includes(status) && config._retryCount < MAX_RETRY_ATTEMPTS) {
      config._retryCount += 1;
      const delay = RETRY_BASE_DELAY * Math.pow(RETRY_MULTIPLIER, config._retryCount - 1);

      console.warn(`Retrying request due to ${status} error. Attempt ${config._retryCount}/${MAX_RETRY_ATTEMPTS}`);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(api.request(config));
        }, delay);
      });
    }

    // Handle rate limiting (429 errors) with exponential backoff, but skip for registration
    if (status === 429 && config._retryCount < MAX_RETRY_ATTEMPTS && !isRegistrationEndpoint) {
      config._retryCount += 1;
      const delay = RETRY_BASE_DELAY * Math.pow(RETRY_MULTIPLIER, config._retryCount - 1);

      console.warn(`Retrying request due to rate limiting. Attempt ${config._retryCount}/${MAX_RETRY_ATTEMPTS}`);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(api.request(config));
        }, delay);
      });
    }

    // Enhance error with user-friendly message
    if (status && ERROR_MESSAGES[status]) {
      error.userMessage = ERROR_MESSAGES[status];
    } else if (error.response?.data?.message) {
      error.userMessage = error.response.data.message;
    } else {
      error.userMessage = "An unexpected error occurred. Please try again.";
    }

    // Handle authentication errors (401)
    if (status === 401) {
      // Clear authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      localStorage.removeItem("isAuthorized");
      localStorage.removeItem("tokenType");

      // Redirect to appropriate login page based on current path or stored type
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const storedType = localStorage.getItem("tokenType");

        if (currentPath.startsWith('/admin') || storedType === 'admin') {
          if (currentPath !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        } else {
          if (currentPath !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
