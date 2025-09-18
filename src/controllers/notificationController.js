/**
 * Notification Controller for FleetLink
 * @fileoverview Handles notification operations
 */

const { Notification } = require('../models/Notification');

/**
 * Get user notifications
 * @async
 * @function getUserNotifications
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.limit=20] - Number of notifications to return
 * @param {number} [req.query.skip=0] - Number of notifications to skip
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} User notifications or error response
 */
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        const skip = parseInt(req.query.skip) || 0;

        const notifications = await Notification.getUserNotifications(userId, limit, skip);
        const unreadCount = await Notification.getUnreadCount(userId);

        res.json({
            success: true,
            notifications,
            unreadCount,
            pagination: {
                limit,
                skip,
                total: notifications.length
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications'
        });
    }
};

/**
 * Mark notifications as read
 * @async
 * @function markNotificationsAsRead
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Array} req.body.notificationIds - Array of notification IDs
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Success or error response
 */
const markNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationIds } = req.body;

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({
                success: false,
                message: 'Notification IDs array is required'
            });
        }

        const result = await Notification.markAsRead(userId, notificationIds);

        res.json({
            success: true,
            message: 'Notifications marked as read',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Mark notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read'
        });
    }
};

/**
 * Get unread notification count
 * @async
 * @function getUnreadCount
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Unread count or error response
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await Notification.getUnreadCount(userId);

        res.json({
            success: true,
            unreadCount
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count'
        });
    }
};

module.exports = {
    getUserNotifications,
    markNotificationsAsRead,
    getUnreadCount
};
