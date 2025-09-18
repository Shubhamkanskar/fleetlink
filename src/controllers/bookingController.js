/**
 * Booking Controller for FleetLink
 * @fileoverview Handles booking creation, retrieval, and management with race condition prevention
 */

const { Booking } = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { Notification } = require('../models/Notification');
const { calculateRideDuration, calculateEndTime, checkTimeOverlap } = require('../utils/rideCalculations');

/**
 * Create a new booking with race condition prevention
 * @async
 * @function createBooking
 * @param {Object} req - Express request object
 * @param {Object} req.body - Booking data
 * @param {string} req.body.vehicleId - Vehicle ID to book
 * @param {string} req.body.startPincode - Starting location pincode
 * @param {string} req.body.endPincode - Destination pincode
 * @param {string} req.body.startTime - Booking start time (ISO string)
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Created booking or error response
 * 
 * @example
 * // Request body
 * {
 *   "vehicleId": "60f7b3b3b3b3b3b3b3b3b3b3",
 *   "startPincode": "110001",
 *   "endPincode": "400001",
 *   "startTime": "2024-01-15T10:00:00.000Z"
 * }
 * 
 * // Success response (201)
 * {
 *   "success": true,
 *   "message": "Booking created successfully",
 *   "booking": {
 *     "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
 *     "vehicleId": "60f7b3b3b3b3b3b3b3b3b3b3",
 *     "userId": "60f7b3b3b3b3b3b3b3b3b3b2",
 *     "pincodes": {
 *       "start": "110001",
 *       "end": "400001"
 *     },
 *     "times": {
 *       "start": "2024-01-15T10:00:00.000Z",
 *       "end": "2024-01-15T22:00:00.000Z"
 *     },
 *     "status": "active",
 *     "createdAt": "2024-01-10T08:00:00.000Z"
 *   }
 * }
 * 
 * // Error responses
 * // 400 - Validation error
 * // 404 - Vehicle not found
 * // 409 - Vehicle not available (race condition)
 * // 500 - Server error
 */
const createBooking = async (req, res) => {
    try {
        const { vehicleId, fromPincode, toPincode, startTime } = req.body;
        const userId = req.user.id;

        // Input validation
        if (!vehicleId || !fromPincode || !toPincode || !startTime) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: vehicleId, fromPincode, toPincode, startTime'
            });
        }

        // Validate pincode format (6 digits)
        const pincodeRegex = /^\d{6}$/;
        if (!pincodeRegex.test(fromPincode) || !pincodeRegex.test(toPincode)) {
            return res.status(400).json({
                success: false,
                message: 'Pincodes must be 6 digits'
            });
        }

        // Validate start time
        const startDateTime = new Date(startTime);
        if (isNaN(startDateTime.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start time format'
            });
        }

        // Check if start time is in the future
        if (startDateTime <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Start time must be in the future'
            });
        }

        // Find the vehicle
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check if vehicle is active
        if (!vehicle.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle is not available for booking'
            });
        }

        // Calculate ride duration and end time
        const duration = calculateRideDuration(fromPincode, toPincode);
        const endTime = calculateEndTime(startDateTime, duration);

        // RACE CONDITION PREVENTION: Re-check availability just before creating booking
        const existingBookings = await Booking.find({
            vehicleId,
            status: 'active',
            $or: [
                {
                    'times.start': { $lt: endTime },
                    'times.end': { $gt: startDateTime }
                }
            ]
        });

        if (existingBookings.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Vehicle is no longer available for the selected time slot',
                conflictDetails: {
                    requestedStart: startDateTime,
                    requestedEnd: endTime,
                    conflictingBookings: existingBookings.map(booking => ({
                        id: booking._id,
                        start: booking.times.start,
                        end: booking.times.end
                    }))
                }
            });
        }

        // Create the booking
        const booking = new Booking({
            vehicleId,
            userId,
            pincodes: {
                start: fromPincode,
                end: toPincode
            },
            times: {
                start: startDateTime,
                end: endTime
            },
            status: 'active'
        });

        await booking.save();

        // Populate the booking with vehicle and user details
        await booking.populate([
            { path: 'vehicleId', select: 'name capacityKg tyres createdBy' },
            { path: 'userId', select: 'name email' }
        ]);

        // Create notification for vehicle owner (if different from booking user)
        try {
            const vehicleOwnerId = booking.vehicleId.createdBy;
            if (vehicleOwnerId && vehicleOwnerId.toString() !== userId) {
                await Notification.createBookingNotification(vehicleOwnerId, booking._id, {
                    vehicleId: booking.vehicleId._id,
                    vehicleName: booking.vehicleId.name,
                    customerName: booking.userId.name,
                    customerEmail: booking.userId.email,
                    fromPincode: booking.pincodes.start,
                    toPincode: booking.pincodes.end,
                    startTime: booking.times.start,
                    endTime: booking.times.end
                });
            }
        } catch (notificationError) {
            // Log notification error but don't fail the booking
            console.error('Failed to create notification:', notificationError);
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: {
                _id: booking._id,
                vehicle: booking.vehicleId,
                user: booking.userId,
                pincodes: booking.pincodes,
                times: booking.times,
                status: booking.status,
                createdAt: booking.createdAt
            }
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get user's bookings with optional status filter
 * @async
 * @function getUserBookings
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.status] - Filter by booking status
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} User's bookings or error response
 * 
 * @example
 * // GET /bookings/my-bookings
 * // GET /bookings/my-bookings?status=active
 * 
 * // Success response (200)
 * {
 *   "success": true,
 *   "bookings": [
 *     {
 *       "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
 *       "vehicle": {
 *         "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *         "name": "Truck-001",
 *         "capacityKg": 1000,
 *         "tyres": 6
 *       },
 *       "pincodes": {
 *         "start": "110001",
 *         "end": "400001"
 *       },
 *       "times": {
 *         "start": "2024-01-15T10:00:00.000Z",
 *         "end": "2024-01-15T22:00:00.000Z"
 *       },
 *       "status": "active",
 *       "createdAt": "2024-01-10T08:00:00.000Z"
 *     }
 *   ]
 * }
 */
const getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        // Build query
        const query = { userId };
        if (status) {
            query.status = status;
        }

        // Get user's bookings with vehicle details
        const bookings = await Booking.find(query)
            .populate('vehicleId', 'name capacityKg tyres')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            bookings: bookings.map(booking => ({
                _id: booking._id,
                vehicle: booking.vehicleId,
                pincodes: booking.pincodes,
                times: booking.times,
                status: booking.status,
                createdAt: booking.createdAt
            }))
        });

    } catch (error) {
        console.error('Get user bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Cancel a booking
 * @async
 * @function cancelBooking
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Booking ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Cancellation result or error response
 * 
 * @example
 * // DELETE /bookings/60f7b3b3b3b3b3b3b3b3b3b4
 * 
 * // Success response (200)
 * {
 *   "success": true,
 *   "message": "Booking cancelled successfully"
 * }
 * 
 * // Error responses
 * // 404 - Booking not found
 * // 403 - Not authorized to cancel this booking
 * // 400 - Booking cannot be cancelled (already completed/cancelled)
 */
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the booking
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user owns the booking
        if (booking.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this booking'
            });
        }

        // Check if booking can be cancelled
        if (booking.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: `Booking cannot be cancelled. Current status: ${booking.status}`
            });
        }

        // Check if booking has already started
        if (new Date() >= booking.times.start) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel booking that has already started'
            });
        }

        // Update booking status
        booking.status = 'cancelled';
        await booking.save();

        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get all bookings (Admin only)
 * @async
 * @function getAllBookings
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.status] - Filter by booking status
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=10] - Items per page
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} All bookings with pagination or error response
 * 
 * @example
 * // GET /bookings?status=active&page=1&limit=10
 * 
 * // Success response (200)
 * {
 *   "success": true,
 *   "bookings": [...],
 *   "pagination": {
 *     "currentPage": 1,
 *     "totalPages": 5,
 *     "totalBookings": 50,
 *     "hasNext": true,
 *     "hasPrev": false
 *   }
 * }
 */
const getAllBookings = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Build query
        const query = {};
        if (status) {
            query.status = status;
        }

        // Calculate pagination
        const skip = (pageNum - 1) * limitNum;

        // Get bookings with pagination
        const [bookings, totalBookings] = await Promise.all([
            Booking.find(query)
                .populate('vehicleId', 'name capacityKg tyres')
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Booking.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalBookings / limitNum);

        res.json({
            success: true,
            bookings: bookings.map(booking => ({
                _id: booking._id,
                vehicle: booking.vehicleId,
                user: booking.userId,
                pincodes: booking.pincodes,
                times: booking.times,
                status: booking.status,
                createdAt: booking.createdAt
            })),
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalBookings,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get booking statistics (Admin only)
 * @async
 * @function getBookingStats
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Booking statistics or error response
 * 
 * @example
 * // GET /bookings/stats
 * 
 * // Success response (200)
 * {
 *   "success": true,
 *   "stats": {
 *     "total": 150,
 *     "active": 25,
 *     "completed": 120,
 *     "cancelled": 5,
 *     "todayBookings": 8,
 *     "thisWeekBookings": 45
 *   }
 * }
 */
const getBookingStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);

        const [
            total,
            active,
            completed,
            cancelled,
            todayBookings,
            thisWeekBookings
        ] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'active' }),
            Booking.countDocuments({ status: 'completed' }),
            Booking.countDocuments({ status: 'cancelled' }),
            Booking.countDocuments({
                createdAt: { $gte: today },
                status: 'active'
            }),
            Booking.countDocuments({
                createdAt: { $gte: thisWeek },
                status: 'active'
            })
        ]);

        res.json({
            success: true,
            stats: {
                total,
                active,
                completed,
                cancelled,
                todayBookings,
                thisWeekBookings
            }
        });

    } catch (error) {
        console.error('Get booking stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Complete a booking
 * @async
 * @function completeBooking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route PUT /api/bookings/:id/complete
 * @access Private
 * @description Mark a booking as completed. Only the vehicle owner or admin can complete bookings.
 * @param {string} req.params.id - Booking ID
 * @returns {Object} 200 - Booking completed successfully
 * @returns {Object} 400 - Invalid request or booking cannot be completed
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 404 - Booking not found
 * @returns {Object} 500 - Internal server error
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
const completeBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Find the booking
        const booking = await Booking.findById(id)
            .populate('vehicleId', 'createdBy name')
            .populate('userId', 'name email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user can complete this booking
        const isVehicleOwner = booking.vehicleId.createdBy.toString() === userId;
        const isBookingOwner = booking.userId._id.toString() === userId;
        const isAdmin = userRole === 'admin';

        if (!isVehicleOwner && !isBookingOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to complete this booking'
            });
        }

        // Check if booking can be completed
        if (booking.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: `Cannot complete booking with status: ${booking.status}`
            });
        }

        // Check if booking has started
        const now = new Date();
        if (now < booking.times.start) {
            return res.status(400).json({
                success: false,
                message: 'Cannot complete booking before it has started'
            });
        }

        // Complete the booking
        booking.status = 'completed';
        booking.completedAt = now;
        await booking.save();

        // Create notification for the customer
        try {
            if (isVehicleOwner && booking.userId._id.toString() !== userId) {
                await Notification.createBookingNotification(booking.userId._id, booking._id, {
                    vehicleId: booking.vehicleId._id,
                    vehicleName: booking.vehicleId.name,
                    type: 'booking_completed',
                    message: `Your booking for vehicle "${booking.vehicleId.name}" has been completed`,
                    completedAt: now
                });
            }
        } catch (notificationError) {
            console.error('Failed to create completion notification:', notificationError);
        }

        res.json({
            success: true,
            message: 'Booking completed successfully',
            booking: {
                _id: booking._id,
                status: booking.status,
                completedAt: booking.completedAt,
                vehicle: booking.vehicleId,
                user: booking.userId,
                pincodes: booking.pincodes,
                times: booking.times
            }
        });

    } catch (error) {
        console.error('Complete booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    createBooking,
    getUserBookings,
    cancelBooking,
    getAllBookings,
    getBookingStats,
    completeBooking
};
