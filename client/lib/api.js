/**
 * API Service for FleetLink Next.js Frontend
 * @fileoverview Centralized API service with Axios configuration and authentication
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor to add authentication token
 */
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('fleetlink_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor to handle common errors
 */
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('fleetlink_token');
            localStorage.removeItem('fleetlink_user');
            window.location.href = '/login';
        }

        // Handle network errors
        if (!error.response) {
            error.message = 'Network error. Please check your connection.';
        }

        return Promise.reject(error);
    }
);

/**
 * Authentication API methods
 */
export const authAPI = {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @param {string} userData.name - User's name
     * @param {string} userData.email - User's email
     * @param {string} userData.password - User's password
     * @returns {Promise<Object>} Registration response
     */
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    /**
     * Login user
     * @param {Object} credentials - Login credentials
     * @param {string} credentials.email - User's email
     * @param {string} credentials.password - User's password
     * @returns {Promise<Object>} Login response
     */
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    /**
     * Get current user profile
     * @returns {Promise<Object>} User profile
     */
    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    /**
     * Update user profile
     * @param {Object} profileData - Profile update data
     * @param {string} profileData.name - Updated name
     * @returns {Promise<Object>} Updated profile
     */
    updateProfile: async (profileData) => {
        const response = await api.put('/auth/profile', profileData);
        return response.data;
    },

    /**
     * Change user password
     * @param {Object} passwordData - Password change data
     * @param {string} passwordData.currentPassword - Current password
     * @param {string} passwordData.newPassword - New password
     * @returns {Promise<Object>} Password change response
     */
    changePassword: async (passwordData) => {
        const response = await api.put('/auth/change-password', passwordData);
        return response.data;
    },

    /**
     * Deactivate user account
     * @returns {Promise<Object>} Account deactivation response
     */
    deactivateAccount: async () => {
        const response = await api.delete('/auth/account');
        return response.data;
    }
};

/**
 * Vehicle API methods
 */
export const vehicleAPI = {
    /**
     * Get available vehicles with filtering
     * @param {Object} filters - Search filters
     * @param {number} filters.capacityRequired - Minimum capacity
     * @param {string} filters.fromPincode - Starting location pincode
     * @param {string} filters.toPincode - Destination pincode
     * @param {string} filters.startTime - Start time (ISO string)
     * @returns {Promise<Object>} Available vehicles
     */
    getAvailableVehicles: async (filters) => {
        const params = new URLSearchParams();
        if (filters.capacityRequired) params.append('capacityRequired', filters.capacityRequired);
        if (filters.fromPincode) params.append('fromPincode', filters.fromPincode);
        if (filters.toPincode) params.append('toPincode', filters.toPincode);
        if (filters.startTime) params.append('startTime', filters.startTime);

        const response = await api.get(`/vehicles/available?${params.toString()}`);
        return response.data;
    },

    /**
     * Get all vehicles (Admin only)
     * @param {Object} options - Query options
     * @param {number} options.page - Page number
     * @param {number} options.limit - Items per page
     * @param {string} options.status - Status filter
     * @returns {Promise<Object>} Vehicles with pagination
     */
    getAllVehicles: async (options = {}) => {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page);
        if (options.limit) params.append('limit', options.limit);
        if (options.status) params.append('status', options.status);

        const response = await api.get(`/vehicles?${params.toString()}`);
        return response.data;
    },

    /**
     * Get vehicle by ID
     * @param {string} vehicleId - Vehicle ID
     * @returns {Promise<Object>} Vehicle details
     */
    getVehicleById: async (vehicleId) => {
        const response = await api.get(`/vehicles/${vehicleId}`);
        return response.data;
    },

    /**
     * Add new vehicle (Admin only)
     * @param {Object} vehicleData - Vehicle data
     * @param {string} vehicleData.name - Vehicle name
     * @param {number} vehicleData.capacityKg - Vehicle capacity
     * @param {number} vehicleData.tyres - Number of tyres
     * @returns {Promise<Object>} Created vehicle
     */
    addVehicle: async (vehicleData) => {
        const response = await api.post('/vehicles', vehicleData);
        return response.data;
    },

    /**
     * Update vehicle (Admin only)
     * @param {string} vehicleId - Vehicle ID
     * @param {Object} vehicleData - Updated vehicle data
     * @returns {Promise<Object>} Updated vehicle
     */
    updateVehicle: async (vehicleId, vehicleData) => {
        const response = await api.put(`/vehicles/${vehicleId}`, vehicleData);
        return response.data;
    },

    /**
     * Delete vehicle (Admin only)
     * @param {string} vehicleId - Vehicle ID
     * @returns {Promise<Object>} Deletion response
     */
    deleteVehicle: async (vehicleId) => {
        const response = await api.delete(`/vehicles/${vehicleId}`);
        return response.data;
    },

    /**
     * Delete user's own vehicle
     * @param {string} vehicleId - Vehicle ID
     * @returns {Promise<Object>} Deletion result
     */
    deleteUserVehicle: async (vehicleId) => {
        const response = await api.delete(`/vehicles/my-vehicles/${vehicleId}`);
        return response.data;
    },

    /**
     * Get vehicle statistics (Admin only)
     * @returns {Promise<Object>} Vehicle statistics
     */
    getVehicleStats: async () => {
        const response = await api.get('/vehicles/stats');
        return response.data;
    },

    /**
     * Get user's vehicles
     * @returns {Promise<Object>} User's vehicles
     */
    getUserVehicles: async () => {
        const response = await api.get('/vehicles/my-vehicles');
        return response.data;
    }
};

/**
 * Booking API methods (to be implemented)
 */
export const bookingAPI = {
    /**
     * Create new booking
     * @param {Object} bookingData - Booking data
     * @param {string} bookingData.vehicleId - Vehicle ID to book
     * @param {string} bookingData.fromPincode - Starting location pincode
     * @param {string} bookingData.toPincode - Destination pincode
     * @param {string} bookingData.startTime - Booking start time (ISO string)
     * @returns {Promise<Object>} Created booking
     */
    createBooking: async (bookingData) => {
        const response = await api.post('/bookings', bookingData);
        return response.data;
    },

    /**
     * Get user's bookings
     * @param {string} status - Optional status filter
     * @returns {Promise<Object>} User's bookings
     */
    getUserBookings: async (status = null) => {
        const params = status ? `?status=${status}` : '';
        const response = await api.get(`/bookings/my-bookings${params}`);
        return response.data;
    },

    /**
     * Cancel booking
     * @param {string} bookingId - Booking ID
     * @returns {Promise<Object>} Cancellation response
     */
    cancelBooking: async (bookingId) => {
        const response = await api.delete(`/bookings/${bookingId}`);
        return response.data;
    },

    /**
     * Complete booking
     * @param {string} bookingId - Booking ID
     * @returns {Promise<Object>} Completion response
     */
    completeBooking: async (bookingId) => {
        const response = await api.put(`/bookings/${bookingId}/complete`);
        return response.data;
    },

    /**
     * Get booking statistics (Admin only)
     * @returns {Promise<Object>} Booking statistics
     */
    getBookingStats: async () => {
        const response = await api.get('/bookings/stats');
        return response.data;
    }
};

/**
 * Notification API methods
 */
export const notificationAPI = {
    /**
     * Get user notifications
     * @param {Object} params - Query parameters
     * @param {number} [params.limit=20] - Number of notifications to return
     * @param {number} [params.skip=0] - Number of notifications to skip
     * @returns {Promise<Object>} User notifications
     */
    getNotifications: async (params = {}) => {
        const response = await api.get('/notifications', { params });
        return response.data;
    },

    /**
     * Mark notifications as read
     * @param {Array} notificationIds - Array of notification IDs
     * @returns {Promise<Object>} Success response
     */
    markAsRead: async (notificationIds) => {
        const response = await api.put('/notifications/read', { notificationIds });
        return response.data;
    },

    /**
     * Get unread notification count
     * @returns {Promise<Object>} Unread count
     */
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    }
};

/**
 * Utility function to handle API errors
 * @param {Error} error - API error
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data?.errors) {
        return error.response.data.errors.join(', ');
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

/**
 * Utility function to check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('fleetlink_token');
    return !!token;
};

/**
 * Utility function to get stored user data
 * @returns {Object|null} User data or null
 */
export const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('fleetlink_user');
    return userData ? JSON.parse(userData) : null;
};

/**
 * Utility function to store user data
 * @param {Object} user - User data
 * @param {string} token - JWT token
 */
export const storeUserData = (user, token) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('fleetlink_user', JSON.stringify(user));
    localStorage.setItem('fleetlink_token', token);
};

/**
 * Utility function to clear user data
 */
export const clearUserData = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('fleetlink_user');
    localStorage.removeItem('fleetlink_token');
};

export default api;
