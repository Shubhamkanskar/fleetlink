/**
 * Booking Routes for FleetLink
 * @fileoverview API routes for booking management with authentication and authorization
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
    createBooking,
    getUserBookings,
    cancelBooking,
    getAllBookings,
    getBookingStats,
    completeBooking
} = require('../controllers/bookingController');

/**
 * @route POST /api/bookings
 * @desc Create a new booking
 * @access Private (User)
 * @param {string} vehicleId - Vehicle ID to book
 * @param {string} fromPincode - Starting location pincode (6 digits)
 * @param {string} toPincode - Destination pincode (6 digits)
 * @param {string} startTime - Booking start time (ISO string)
 * @returns {Object} Created booking with vehicle and user details
 * @example
 * POST /api/bookings
 * {
 *   "vehicleId": "60f7b3b3b3b3b3b3b3b3b3b3",
 *   "fromPincode": "110001",
 *   "toPincode": "400001",
 *   "startTime": "2024-01-15T10:00:00.000Z"
 * }
 */
router.post('/', authenticate, createBooking);

/**
 * @route GET /api/bookings/my-bookings
 * @desc Get current user's bookings
 * @access Private (User)
 * @param {string} [status] - Filter by booking status (active, completed, cancelled)
 * @returns {Array} User's bookings with vehicle details
 * @example
 * GET /api/bookings/my-bookings
 * GET /api/bookings/my-bookings?status=active
 */
router.get('/my-bookings', authenticate, getUserBookings);

/**
 * @route DELETE /api/bookings/:id
 * @desc Cancel a booking
 * @access Private (User - Owner only)
 * @param {string} id - Booking ID
 * @returns {Object} Cancellation confirmation
 * @example
 * DELETE /api/bookings/60f7b3b3b3b3b3b3b3b3b3b4
 */
router.delete('/:id', authenticate, cancelBooking);

/**
 * @route GET /api/bookings
 * @desc Get all bookings (Admin only)
 * @access Private (Admin)
 * @param {string} [status] - Filter by booking status
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Items per page
 * @returns {Object} All bookings with pagination
 * @example
 * GET /api/bookings?status=active&page=1&limit=10
 */
router.get('/', authenticate, requireAdmin, getAllBookings);

/**
 * @route GET /api/bookings/stats
 * @desc Get booking statistics (Admin only)
 * @access Private (Admin)
 * @returns {Object} Booking statistics and metrics
 * @example
 * GET /api/bookings/stats
 */
router.get('/stats', authenticate, requireAdmin, getBookingStats);

/**
 * @route PUT /api/bookings/:id/complete
 * @desc Complete a booking
 * @access Private (Vehicle Owner, Booking Owner, or Admin)
 * @param {string} id - Booking ID
 * @returns {Object} Completed booking details
 * @example
 * PUT /api/bookings/507f1f77bcf86cd799439011/complete
 * Response:
 * {
 *   "success": true,
 *   "message": "Booking completed successfully",
 *   "booking": {
 *     "_id": "507f1f77bcf86cd799439011",
 *     "status": "completed",
 *     "completedAt": "2023-12-01T10:30:00.000Z"
 *   }
 * }
 */
router.put('/:id/complete', authenticate, completeBooking);

module.exports = router;
