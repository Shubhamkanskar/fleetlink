/**
 * Notification Routes for FleetLink
 * @fileoverview API routes for notification management
 */

const express = require('express');
const { authenticate } = require('../middlewares/auth');
const {
    getUserNotifications,
    markNotificationsAsRead,
    getUnreadCount
} = require('../controllers/notificationController');

const router = express.Router();

/**
 * @route GET /api/notifications
 * @desc Get user notifications
 * @access Private (User)
 * @query {number} [limit=20] - Number of notifications to return
 * @query {number} [skip=0] - Number of notifications to skip
 * @returns {Object} User notifications with pagination
 * @example
 * GET /api/notifications?limit=10&skip=0
 */
router.get('/', authenticate, getUserNotifications);

/**
 * @route PUT /api/notifications/read
 * @desc Mark notifications as read
 * @access Private (User)
 * @param {Array} notificationIds - Array of notification IDs to mark as read
 * @returns {Object} Success response with modified count
 * @example
 * PUT /api/notifications/read
 * {
 *   "notificationIds": ["60f7b3b3b3b3b3b3b3b3b3b3", "60f7b3b3b3b3b3b3b3b3b3b4"]
 * }
 */
router.put('/read', authenticate, markNotificationsAsRead);

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count
 * @access Private (User)
 * @returns {Object} Unread notification count
 * @example
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', authenticate, getUnreadCount);

module.exports = router;
