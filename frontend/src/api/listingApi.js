import { apiClient } from './client';

export const listingApi = {
  /**
   * Get all active categories
   */
  async getCategories() {
    const response = await apiClient.get('/api/v1/categories');
    return response.data;
  },

  /**
   * Get category by id
   * @param {number|string} id
   */
  async getCategory(id) {
    const response = await apiClient.get(`/api/v1/categories/${id}`);
    return response.data;
  },

  /**
   * Search / filter public listings
   * @param {Object} params
   */
  async getListings(params = {}) {
    const response = await apiClient.get('/api/v1/listings', { params });
    return response.data;
  },

  /**
   * Get single listing details
   * @param {number|string} id
   */
  async getListingById(id) {
    const response = await apiClient.get(`/api/v1/listings/${id}`);
    return response.data;
  },

  /**
   * Get current authenticated user's listings
   * @param {number} page
   * @param {number} size
   */
  async getMyListings(page = 0, size = 20) {
    const response = await apiClient.get('/api/v1/listings/my-listings', {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Create new listing
   * @param {Object} data
   */
  async createListing(data) {
    const response = await apiClient.post('/api/v1/listings', data);
    return response.data;
  },

  /**
   * Update listing
   * @param {number|string} id
   * @param {Object} data
   */
  async updateListing(id, data) {
    const response = await apiClient.put(`/api/v1/listings/${id}`, data);
    return response.data;
  },

  /**
   * Submit listing for review
   * @param {number|string} id
   */
  async submitForReview(id) {
    const response = await apiClient.post(`/api/v1/listings/${id}/submit-review`);
    return response.data;
  },

  /**
   * Update listing status by seller (HIDDEN, PUBLISHED, SOLD)
   * @param {number|string} id
   * @param {{ status: string, reason?: string }} data
   */
  async updateStatus(id, data) {
    const response = await apiClient.patch(`/api/v1/listings/${id}/status`, data);
    return response.data;
  },

  /**
   * Moderator: Moderate listing (PUBLISHED, REJECTED)
   * @param {number|string} id
   * @param {{ status: string, reason?: string }} data
   */
  async moderateListing(id, data) {
    const response = await apiClient.patch(`/api/v1/listings/${id}/moderate`, data);
    return response.data;
  },
};
