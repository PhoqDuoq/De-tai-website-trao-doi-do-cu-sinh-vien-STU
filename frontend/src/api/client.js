import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 with Token Rotation queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not attempt refresh on auth endpoints (login, refresh, register)
      if (
        originalRequest.url?.includes('/api/v1/auth/login') ||
        originalRequest.url?.includes('/api/v1/auth/refresh') ||
        originalRequest.url?.includes('/api/v1/auth/register')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, wait in queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        clearAuthData();
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const data = response.data;
        if (data.success && data.data) {
          const { accessToken, refreshToken: newRefreshToken, user } = data.data;

          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }

          processQueue(null, accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error(data.message || 'Phiên đăng nhập đã hết hạn');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAuthData();
        redirectToLogin();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function clearAuthData() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function redirectToLogin() {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
}

/**
 * Extracts a friendly error message from backend ApiResponse<T> or Axios error
 */
export function extractErrorMessage(error, defaultMsg = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  if (!error) return defaultMsg;

  if (error.response?.data) {
    const apiData = error.response.data;

    // If validation error returned data map { field: error }
    if (apiData.data && typeof apiData.data === 'object' && !Array.isArray(apiData.data)) {
      const fieldErrors = Object.values(apiData.data);
      if (fieldErrors.length > 0) {
        return fieldErrors[0];
      }
    }

    if (apiData.message) {
      return apiData.message;
    }
  }

  if (error.message) {
    if (error.message.includes('Network Error')) {
      return 'Không thể kết nối đến máy chủ API Gateway (http://localhost:8080).';
    }
    return error.message;
  }

  return defaultMsg;
}
