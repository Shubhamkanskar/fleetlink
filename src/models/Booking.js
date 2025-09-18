/**
 * Booking Model for FleetLink
 * @fileoverview Booking schema with validation and relationships
 */

const mongoose = require('mongoose');

/**
 * Booking status enum
 * @readonly
 * @enum {string}
 */
const BOOKING_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

/**
 * Booking schema definition
 * @typedef {Object} BookingSchema
 * @property {ObjectId} vehicleId - Reference to Vehicle
 * @property {ObjectId} userId - Reference to User
 * @property {Object} pincodes - Start and end pincodes
 * @property {Object} times - Start and end times
 * @property {string} status - Booking status
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
const bookingSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle ID is required']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    pincodes: {
        start: {
            type: String,
            required: [true, 'Start pincode is required'],
            match: [/^\d{6}$/, 'Start pincode must be 6 digits']
        },
        end: {
            type: String,
            required: [true, 'End pincode is required'],
            match: [/^\d{6}$/, 'End pincode must be 6 digits']
        }
    },
    times: {
        start: {
            type: Date,
            required: [true, 'Start time is required']
        },
        end: {
            type: Date,
            required: [true, 'End time is required']
        }
    },
    status: {
        type: String,
        enum: {
            values: Object.values(BOOKING_STATUS),
            message: `Status must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`
        },
        default: BOOKING_STATUS.ACTIVE
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/**
 * Indexes for efficient queries
 */
bookingSchema.index({ vehicleId: 1, 'times.start': 1, 'times.end': 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ status: 1, 'times.start': 1 });

/**
 * Virtual for booking duration in hours
 */
bookingSchema.virtual('durationHours').get(function () {
    if (!this.times.start || !this.times.end) {
        return 0;
    }
    return (this.times.end.getTime() - this.times.start.getTime()) / (1000 * 60 * 60);
});

/**
 * Virtual for booking status display
 */
bookingSchema.virtual('statusDisplay').get(function () {
    const statusMap = {
        [BOOKING_STATUS.ACTIVE]: 'Active',
        [BOOKING_STATUS.COMPLETED]: 'Completed',
        [BOOKING_STATUS.CANCELLED]: 'Cancelled'
    };
    return statusMap[this.status] || 'Unknown';
});

/**
 * Virtual for booking API URL
 */
bookingSchema.virtual('url').get(function () {
    return `/api/bookings/${this._id}`;
});

/**
 * Pre-save middleware to validate booking times
 */
bookingSchema.pre('save', function (next) {
    // Validate that end time is after start time
    if (this.times.start >= this.times.end) {
        return next(new Error('End time must be after start time'));
    }

    // Validate that start time is in the future (for new bookings)
    if (this.isNew && this.times.start <= new Date()) {
        return next(new Error('Start time must be in the future'));
    }

    next();
});

/**
 * Static method to find active bookings for a vehicle in a time range
 * @async
 * @function findActiveBookingsForVehicle
 * @param {ObjectId} vehicleId - Vehicle ID
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {Promise<Array>} Array of active bookings
 * @example
 * // Find active bookings for a vehicle
 * const bookings = await Booking.findActiveBookingsForVehicle(
 *   vehicleId,
 *   new Date('2024-01-15T10:00:00Z'),
 *   new Date('2024-01-15T16:00:00Z')
 * );
 */
bookingSchema.statics.findActiveBookingsForVehicle = function (vehicleId, startTime, endTime) {
    return this.find({
        vehicleId,
        status: BOOKING_STATUS.ACTIVE,
        $or: [
            // Booking starts within the time range
            { 'times.start': { $gte: startTime, $lt: endTime } },
            // Booking ends within the time range
            { 'times.end': { $gt: startTime, $lte: endTime } },
            // Booking completely encompasses the time range
            { 'times.start': { $lte: startTime }, 'times.end': { $gte: endTime } }
        ]
    }).populate('userId', 'name email');
};

/**
 * Static method to find user's bookings
 * @async
 * @function findUserBookings
 * @param {ObjectId} userId - User ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} Array of user's bookings
 * @example
 * // Find all user bookings
 * const bookings = await Booking.findUserBookings(userId);
 * 
 * // Find only active bookings
 * const activeBookings = await Booking.findUserBookings(userId, 'active');
 */
bookingSchema.statics.findUserBookings = function (userId, status = null) {
    const query = { userId };
    if (status) {
        query.status = status;
    }

    return this.find(query)
        .populate('vehicleId', 'name capacityKg tyres')
        .sort({ 'times.start': -1 });
};

/**
 * Static method to get booking statistics
 * @async
 * @function getStats
 * @returns {Promise<Object>} Booking statistics
 * @example
 * // Get booking statistics
 * const stats = await Booking.getStats();
 * // Returns: { total: 100, active: 20, completed: 70, cancelled: 10 }
 */
bookingSchema.statics.getStats = async function () {
    const total = await this.countDocuments();
    const active = await this.countDocuments({ status: BOOKING_STATUS.ACTIVE });
    const completed = await this.countDocuments({ status: BOOKING_STATUS.COMPLETED });
    const cancelled = await this.countDocuments({ status: BOOKING_STATUS.CANCELLED });

    return {
        total,
        active,
        completed,
        cancelled
    };
};

/**
 * Instance method to check if booking is active
 * @function isActive
 * @returns {boolean} True if booking is active
 * @example
 * // Check if booking is active
 * const isActive = booking.isActive();
 */
bookingSchema.methods.isActive = function () {
    return this.status === BOOKING_STATUS.ACTIVE;
};

/**
 * Instance method to check if booking can be cancelled
 * @function canBeCancelled
 * @returns {boolean} True if booking can be cancelled
 * @example
 * // Check if booking can be cancelled
 * const canCancel = booking.canBeCancelled();
 */
bookingSchema.methods.canBeCancelled = function () {
    // Can only cancel active bookings that haven't started yet
    return this.status === BOOKING_STATUS.ACTIVE && this.times.start > new Date();
};

/**
 * Instance method to cancel booking
 * @function cancel
 * @returns {Promise<Booking>} Updated booking
 * @example
 * // Cancel booking
 * const cancelledBooking = await booking.cancel();
 */
bookingSchema.methods.cancel = function () {
    if (!this.canBeCancelled()) {
        throw new Error('Booking cannot be cancelled');
    }

    this.status = BOOKING_STATUS.CANCELLED;
    return this.save();
};

/**
 * Instance method to complete booking
 * @function complete
 * @returns {Promise<Booking>} Updated booking
 * @example
 * // Complete booking
 * const completedBooking = await booking.complete();
 */
bookingSchema.methods.complete = function () {
    if (this.status !== BOOKING_STATUS.ACTIVE) {
        throw new Error('Only active bookings can be completed');
    }

    this.status = BOOKING_STATUS.COMPLETED;
    return this.save();
};

/**
 * Instance method to get booking summary
 * @function getSummary
 * @returns {Object} Booking summary
 * @example
 * // Get booking summary
 * const summary = booking.getSummary();
 */
bookingSchema.methods.getSummary = function () {
    return {
        id: this._id.toString(),
        vehicleId: this.vehicleId,
        userId: this.userId,
        pincodes: this.pincodes,
        times: this.times,
        durationHours: this.durationHours,
        status: this.status,
        statusDisplay: this.statusDisplay,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

/**
 * Transform JSON output
 */
bookingSchema.methods.toJSON = function () {
    const bookingObject = this.toObject();
    bookingObject.durationHours = this.durationHours;
    bookingObject.statusDisplay = this.statusDisplay;
    return bookingObject;
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { Booking, BOOKING_STATUS };
