import { apiClient } from './client';

export const authApi = {
  /**
   * Log in user with email or student code
   * @param {{ emailOrStudentCode: string, password: string }} credentials
   */
  async login(credentials) {
    const response = await apiClient.post('/api/v1/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new student account
   * @param {{ email: string, password: string, fullName: string, studentCode?: string, phone?: string }} data
   */
  async register(data) {
    const response = await apiClient.post('/api/v1/auth/register', data);
    return response.data;
  },

  /**
   * Rotate refresh token
   * @param {string} refreshToken
   */
  async refreshToken(refreshToken) {
    const response = await apiClient.post('/api/v1/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Logout user and revoke tokens on server
   */
  async logout() {
    try {
      const response = await apiClient.post('/api/v1/auth/logout');
      return response.data;
    } catch (err) {
      // Even if network fails, proceed with client-side cleanup
      return { success: true };
    }
  },

  /**
   * Retrieve current user profile
   */
  async getProfile() {
    const response = await apiClient.get('/api/v1/users/me');
    return response.data;
  },

  /**
   * Update current user profile
   * @param {{ fullName?: string, phone?: string, avatarUrl?: string }} data
   */
  async updateProfile(data) {
    const response = await apiClient.put('/api/v1/users/me', data);
    return response.data;
  },

  /**
   * Request password reset link (anti-enumeration)
   * @param {string} email
   */
  async forgotPassword(email) {
    const response = await apiClient.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with reset token
   * @param {{ token: string, newPassword: string }} data
   */
  async resetPassword(data) {
    const response = await apiClient.post('/api/v1/auth/reset-password', data);
    return response.data;
  },
};
