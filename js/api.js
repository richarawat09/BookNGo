/**
 * BookNGo — Frontend API Client
 * Communicates with the Python Flask backend & SQLite relational database.
 */

(function () {
  'use strict';

  const API_BASE = '/api';

  class ApiClient {
    constructor() {
      this.tokenKey = 'bng_session_token';
    }

    getToken() {
      try {
        return sessionStorage.getItem(this.tokenKey) || localStorage.getItem(this.tokenKey) || null;
      } catch (e) {
        return null;
      }
    }

    setToken(token) {
      try {
        if (token) {
          sessionStorage.setItem(this.tokenKey, token);
          localStorage.setItem(this.tokenKey, token);
        } else {
          sessionStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.tokenKey);
        }
      } catch (e) {}
    }

    async request(endpoint, options = {}) {
      const url = `${API_BASE}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(url, {
          ...options,
          headers
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          return {
            success: false,
            status: response.status,
            error: data.error || data.message || `Server request failed (${response.status})`
          };
        }

        return data;
      } catch (err) {
        console.warn(`[API] Error calling ${endpoint}:`, err);
        return {
          success: false,
          error: 'Could not connect to Python backend. Please ensure server.py is running.'
        };
      }
    }

    // --- Authentication ---
    async register(payload) {
      const res = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success && res.session?.token) {
        this.setToken(res.session.token);
      }
      return res;
    }

    async login(payload) {
      const res = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success && res.session?.token) {
        this.setToken(res.session.token);
      }
      return res;
    }

    async getMe() {
      return this.request('/auth/me');
    }

    async logout() {
      await this.request('/auth/logout', { method: 'POST' });
      this.setToken(null);
      return { success: true };
    }

    // --- Categories & Marketplace ---
    async getCategories() {
      return this.request('/categories');
    }

    async getProviders(params = {}) {
      const q = new URLSearchParams();
      if (params.category && params.category !== 'all') q.set('category', params.category);
      if (params.search) q.set('search', params.search);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return this.request(`/providers${queryStr}`);
    }

    async getProvider(providerId) {
      return this.request(`/providers/${providerId}`);
    }

    async getCustomers() {
      return this.request('/customers');
    }

    // --- Bookings ---
    async getBookings(params = {}) {
      const q = new URLSearchParams();
      if (params.customerId) q.set('customer_id', params.customerId);
      if (params.providerId) q.set('provider_id', params.providerId);
      if (params.date) q.set('date', params.date);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return this.request(`/bookings${queryStr}`);
    }

    async createBooking(bookingData) {
      return this.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
    }

    async updateBookingStatus(bookingId, status) {
      return this.request(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    }

    // --- Standby Waitlist ---
    async getWaitlist(params = {}) {
      const q = new URLSearchParams();
      if (params.providerId) q.set('provider_id', params.providerId);
      if (params.customerId) q.set('customer_id', params.customerId);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return this.request(`/waitlist${queryStr}`);
    }

    async addWaitlist(data) {
      return this.request('/waitlist', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }

    async assignWaitlist(waitlistId, workerId, date, time) {
      return this.request(`/waitlist/${waitlistId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ worker_id: workerId, date, time })
      });
    }

    // --- Reviews ---
    async getReviews(providerId) {
      return this.request(`/reviews?provider_id=${providerId}`);
    }

    async addReview(reviewData) {
      return this.request('/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData)
      });
    }

    // --- Admin Metrics ---
    async getAdminMetrics() {
      return this.request('/admin/metrics');
    }
  }

  window.api = new ApiClient();
})();
