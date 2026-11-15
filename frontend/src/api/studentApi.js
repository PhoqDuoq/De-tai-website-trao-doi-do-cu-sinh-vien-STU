import { apiClient } from './client';

export const studentApi = {
  /**
   * Submit student card verification request
   * @param {{ method: 'MANUAL_REVIEW' | 'INSTITUTION_API', evidenceReference: string, studentCode?: string }} data
   */
  async submitVerification(data) {
    const response = await apiClient.post('/api/v1/students/verify', data);
    return response.data;
  },

  /**
   * Get submission history of student verification requests
   */
  async getMyVerifications() {
    const response = await apiClient.get('/api/v1/students/my-verifications');
    return response.data;
  },

  /**
   * Moderator/Admin: Get pending student verifications
   */
  async getPendingVerifications() {
    const response = await apiClient.get('/api/v1/students/verifications');
    return response.data;
  },

  /**
   * Moderator/Admin: Review student verification submission
   * @param {number|string} id
   * @param {{ status: 'APPROVED' | 'REJECTED', note?: string }} data
   */
  async reviewVerification(id, data) {
    const response = await apiClient.patch(`/api/v1/students/verifications/${id}/review`, data);
    return response.data;
  },
};
