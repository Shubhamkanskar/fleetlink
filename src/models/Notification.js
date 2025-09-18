/**
 * Notification Model for FleetLink
 * @fileoverview Notification schema for user notifications
 */

const mongoose = require('mongoose');

/**
 * Notification type enum
 * @readonly
 * @enum {string}
 */
const NOTIFICATION_TYPE = {
    BOOKING_CREATED: 'booking_created',
    BOOKING_CANCELLED: 'booking_cancelled',
    BOOKING_COMPLETED: 'booking_completed',
    VEHICLE_ADDED: 'vehicle_added',
    VEHICLE_UPDATED: 'vehicle_updated'
};

/**
 * Notification schema definition
 * @typedef {Object} NotificationSchema
 * @property {ObjectId} userId - Reference to User
 * @property {string} type - Notification type
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {Object} data - Additional notification data
 * @property {boolean} isRead - Whether notification is read
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    type: {
        type: String,
        enum: {
            values: Object.values(NOTIFICATION_TYPE),
            message: `Type must be one of: ${Object.values(NOTIFICATION_TYPE).join(', ')}`
        },
        required: [true, 'Notification type is required']
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        maxlength: [500, 'Message cannot exceed 500 characters']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/**
 * Indexes for efficient queries
 */
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

/**
 * Static method to create a booking notification
 * @async
 * @function createBookingNotification
 * @param {ObjectId} vehicleOwnerId - Vehicle owner ID
 * @param {ObjectId} bookingId - Booking ID
 * @param {Object} bookingData - Booking data
 * @returns {Promise<Object>} Created notification
 */
notificationSchema.statics.createBookingNotification = async function (recipientId, bookingId, bookingData) {
    // Determine notification type and content based on bookingData.type
    let type, title, message;

    if (bookingData.type === 'booking_completed') {
        type = NOTIFICATION_TYPE.BOOKING_COMPLETED;
        title = 'Booking Completed';
        message = bookingData.message || `Your booking for vehicle "${bookingData.vehicleName}" has been completed`;
    } else {
        type = NOTIFICATION_TYPE.BOOKING_CREATED;
        title = 'New Booking Created';
        message = `Your vehicle "${bookingData.vehicleName}" has been booked for ${bookingData.startTime} to ${bookingData.endTime}`;
    }

    const notification = new this({
        userId: recipientId,
        type: type,
        title: title,
        message: message,
        data: {
            bookingId,
            vehicleId: bookingData.vehicleId,
            vehicleName: bookingData.vehicleName,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            fromPincode: bookingData.fromPincode,
            toPincode: bookingData.toPincode,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            completedAt: bookingData.completedAt
        }
    });

    return await notification.save();
};

/**
 * Static method to get user notifications
 * @async
 * @function getUserNotifications
 * @param {ObjectId} userId - User ID
 * @param {number} limit - Number of notifications to return
 * @param {number} skip - Number of notifications to skip
 * @returns {Promise<Array>} User notifications
 */
notificationSchema.statics.getUserNotifications = async function (userId, limit = 20, skip = 0) {
    return await this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

/**
 * Static method to mark notifications as read
 * @async
 * @function markAsRead
 * @param {ObjectId} userId - User ID
 * @param {Array} notificationIds - Array of notification IDs
 * @returns {Promise<Object>} Update result
 */
notificationSchema.statics.markAsRead = async function (userId, notificationIds) {
    return await this.updateMany(
        { _id: { $in: notificationIds }, userId },
        { isRead: true }
    );
};

/**
 * Static method to get unread count
 * @async
 * @function getUnreadCount
 * @param {ObjectId} userId - User ID
 * @returns {Promise<number>} Unread notification count
 */
notificationSchema.statics.getUnreadCount = async function (userId) {
    return await this.countDocuments({ userId, isRead: false });
};

module.exports = {
    Notification: mongoose.model('Notification', notificationSchema),
    NOTIFICATION_TYPE
};
