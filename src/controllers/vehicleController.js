/**
 * Vehicle Controller for FleetLink
 * @fileoverview Handles vehicle management and availability checking
 */

const Vehicle = require('../models/Vehicle');
const { Booking, BOOKING_STATUS } = require('../models/Booking');
const { checkBookingConflict, validateBookingTimes, calculateRideDuration, calculateEndTime } = require('../utils/rideCalculations');

/**
 * Add a new vehicle (Admin only)
 * @async
 * @function addVehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Creates a new vehicle with admin protection
 * @example
 * // POST /api/vehicles
 * // Headers: { Authorization: "Bearer jwt_token" }
 * // Body: { name: "Truck-001", capacityKg: 5000, tyres: 6 }
 * // Response: { success: true, vehicle: { id, name, capacityKg, tyres, createdBy } }
 */
const addVehicle = async (req, res) => {
    try {
        const { name, capacityKg, tyres } = req.body;
        const createdBy = req.user._id;

        // Validate required fields
        if (!name || capacityKg === undefined || capacityKg === null || tyres === undefined || tyres === null) {
            return res.status(400).json({
                success: false,
                message: 'Name, capacity, and tyres are required'
            });
        }

        // Validate capacity
        if (capacityKg < 1 || capacityKg > 50000) {
            return res.status(400).json({
                success: false,
                message: 'Capacity must be between 1 and 50,000 kg'
            });
        }

        // Validate tyres
        if (tyres < 2 || tyres > 18) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle must have between 2 and 18 tyres'
            });
        }

        // Create vehicle
        const vehicle = await Vehicle.create({
            name,
            capacityKg,
            tyres,
            createdBy
        });

        // Populate createdBy field
        await vehicle.populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Vehicle added successfully',
            vehicle: vehicle.getSummary()
        });
    } catch (error) {
        console.error('Add vehicle error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to add vehicle'
        });
    }
};

/**
 * Get available vehicles with complex filtering
 * @async
 * @function getAvailableVehicles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Finds available vehicles based on capacity and time constraints
 * @example
 * // GET /api/vehicles/available?capacityRequired=3000&fromPincode=110001&toPincode=400001&startTime=2024-01-15T10:00:00Z
 * // Response: { success: true, vehicles: [...], total: 5, estimatedRideDurationHours: 2 }
 */
const getAvailableVehicles = async (req, res) => {
    try {
        const { capacityRequired, fromPincode, toPincode, startTime } = req.query;

        // Validate required parameters
        if (!startTime) {
            return res.status(400).json({
                success: false,
                message: 'Start time is required'
            });
        }

        // Validate pincode format if provided
        if (fromPincode && toPincode) {
            const pincodeRegex = /^\d{6}$/;
            if (!pincodeRegex.test(fromPincode) || !pincodeRegex.test(toPincode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Pincodes must be 6 digits'
                });
            }
        }

        // Validate start time
        const startDateTime = new Date(startTime);
        if (isNaN(startDateTime.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start time format'
            });
        }

        // Calculate ride duration and end time if pincodes are provided
        let estimatedRideDurationHours = 0;
        let endTime = startDateTime;

        if (fromPincode && toPincode) {
            try {
                estimatedRideDurationHours = calculateRideDuration(fromPincode, toPincode);
                endTime = calculateEndTime(startDateTime, estimatedRideDurationHours);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        } else {
            // If no pincodes provided, use a default duration of 8 hours
            estimatedRideDurationHours = 8;
            endTime = calculateEndTime(startDateTime, estimatedRideDurationHours);
        }

        // Convert to Date objects
        const start = startDateTime;

        // Build query for vehicles
        const vehicleQuery = { isActive: true };

        // Add capacity filter if provided
        if (capacityRequired) {
            const capacity = parseInt(capacityRequired, 10);
            if (isNaN(capacity) || capacity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Capacity must be a positive number'
                });
            }
            vehicleQuery.capacityKg = { $gte: capacity };
        }

        // Get all active vehicles that meet capacity requirements
        const vehicles = await Vehicle.find(vehicleQuery).populate('createdBy', 'name email');

        // Check availability for each vehicle
        const availableVehicles = [];

        for (const vehicle of vehicles) {
            try {
                // Get existing bookings for this vehicle in the time range
                const existingBookings = await Booking.findActiveBookingsForVehicle(
                    vehicle._id,
                    start,
                    endTime
                );

                // Check for conflicts
                const conflictCheck = checkBookingConflict(
                    existingBookings,
                    start,
                    endTime
                );

                // If no conflicts, vehicle is available
                if (!conflictCheck.hasConflict) {
                    availableVehicles.push({
                        ...vehicle.getSummary(),
                        availability: {
                            isAvailable: true,
                            conflictingBookings: []
                        }
                    });
                } else {
                    // Vehicle has conflicts, but include it with conflict info
                    availableVehicles.push({
                        ...vehicle.getSummary(),
                        availability: {
                            isAvailable: false,
                            conflictingBookings: conflictCheck.conflictingBookings
                        }
                    });
                }
            } catch (error) {
                console.error(`Error checking availability for vehicle ${vehicle._id}:`, error);
                // Continue with other vehicles
            }
        }

        // Separate available and unavailable vehicles
        const available = availableVehicles.filter(v => v.availability.isAvailable);
        const unavailable = availableVehicles.filter(v => !v.availability.isAvailable);

        res.status(200).json({
            success: true,
            vehicles: {
                available, // Only truly available vehicles
                unavailable // Keep unavailable for debugging/admin purposes
            },
            total: available.length, // Only count available vehicles
            availableCount: available.length,
            unavailableCount: unavailable.length,
            estimatedRideDurationHours,
            searchCriteria: {
                capacityRequired: capacityRequired ? parseInt(capacityRequired, 10) : null,
                fromPincode,
                toPincode,
                startTime,
                endTime: endTime.toISOString()
            }
        });
    } catch (error) {
        console.error('Get available vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get available vehicles'
        });
    }
};

/**
 * Get all vehicles (Admin only)
 * @async
 * @function getAllVehicles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Gets all vehicles with pagination and filtering
 * @example
 * // GET /api/vehicles?page=1&limit=10&status=active
 * // Response: { success: true, vehicles: [...], pagination: {...} }
 */
const getAllVehicles = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, capacityMin, capacityMax } = req.query;

        // Build query
        const query = {};

        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        if (capacityMin || capacityMax) {
            query.capacityKg = {};
            if (capacityMin) query.capacityKg.$gte = parseInt(capacityMin, 10);
            if (capacityMax) query.capacityKg.$lte = parseInt(capacityMax, 10);
        }

        // Calculate pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Get vehicles with pagination
        const vehicles = await Vehicle.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Get total count
        const total = await Vehicle.countDocuments(query);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            vehicles: vehicles.map(vehicle => vehicle.getSummary()),
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: total,
                itemsPerPage: limitNum,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error('Get all vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get vehicles'
        });
    }
};

/**
 * Get vehicle by ID
 * @async
 * @function getVehicleById
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Gets a specific vehicle by ID
 * @example
 * // GET /api/vehicles/:id
 * // Response: { success: true, vehicle: {...} }
 */
const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;

        const vehicle = await Vehicle.findById(id).populate('createdBy', 'name email');

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            success: true,
            vehicle: vehicle.getSummary()
        });
    } catch (error) {
        console.error('Get vehicle by ID error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid vehicle ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to get vehicle'
        });
    }
};

/**
 * Update vehicle (Admin only)
 * @async
 * @function updateVehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Updates vehicle information
 * @example
 * // PUT /api/vehicles/:id
 * // Headers: { Authorization: "Bearer jwt_token" }
 * // Body: { name: "Updated Truck", capacityKg: 6000 }
 * // Response: { success: true, vehicle: {...} }
 */
const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, capacityKg, tyres, isActive } = req.body;

        // Validate capacity if provided
        if (capacityKg !== undefined && (capacityKg < 1 || capacityKg > 50000)) {
            return res.status(400).json({
                success: false,
                message: 'Capacity must be between 1 and 50,000 kg'
            });
        }

        // Validate tyres if provided
        if (tyres !== undefined && (tyres < 2 || tyres > 18)) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle must have between 2 and 18 tyres'
            });
        }

        // Build update object
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (capacityKg !== undefined) updateData.capacityKg = capacityKg;
        if (tyres !== undefined) updateData.tyres = tyres;
        if (isActive !== undefined) updateData.isActive = isActive;

        const vehicle = await Vehicle.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Vehicle updated successfully',
            vehicle: vehicle.getSummary()
        });
    } catch (error) {
        console.error('Update vehicle error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid vehicle ID'
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update vehicle'
        });
    }
};

/**
 * Delete vehicle (Admin only)
 * @async
 * @function deleteVehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Soft deletes a vehicle by setting isActive to false
 * @example
 * // DELETE /api/vehicles/:id
 * // Headers: { Authorization: "Bearer jwt_token" }
 * // Response: { success: true, message: "Vehicle deleted successfully" }
 */
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if vehicle has active bookings
        const activeBookings = await Booking.countDocuments({
            vehicleId: id,
            status: BOOKING_STATUS.ACTIVE
        });

        if (activeBookings > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete vehicle with active bookings'
            });
        }

        // Soft delete by setting isActive to false
        const vehicle = await Vehicle.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Vehicle deleted successfully'
        });
    } catch (error) {
        console.error('Delete vehicle error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid vehicle ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete vehicle'
        });
    }
};

/**
 * Get vehicle statistics (Admin only)
 * @async
 * @function getVehicleStats
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Gets vehicle statistics and metrics
 * @example
 * // GET /api/vehicles/stats
 * // Response: { success: true, stats: {...} }
 */
const getVehicleStats = async (req, res) => {
    try {
        const vehicleStats = await Vehicle.getStats();
        const bookingStats = await Booking.getStats();

        res.status(200).json({
            success: true,
            stats: {
                vehicles: vehicleStats,
                bookings: bookingStats
            }
        });
    } catch (error) {
        console.error('Get vehicle stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get vehicle statistics'
        });
    }
};

/**
 * Get user's vehicles
 * @async
 * @function getUserVehicles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Gets vehicles created by the current user
 * @example
 * // GET /api/vehicles/my-vehicles
 * // Response: { success: true, vehicles: [...] }
 */
const getUserVehicles = async (req, res) => {
    try {
        const userId = req.user.id;

        const vehicles = await Vehicle.find({ createdBy: userId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            vehicles: vehicles.map(vehicle => vehicle.getSummary())
        });
    } catch (error) {
        console.error('Get user vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user vehicles'
        });
    }
};

/**
 * Delete user's own vehicle
 * @async
 * @function deleteUserVehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Allows users to delete their own vehicles (with booking validation)
 * @example
 * // DELETE /api/vehicles/my-vehicles/:id
 * // Response: { success: true, message: "Vehicle deleted successfully" }
 */
const deleteUserVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const userId = req.user.id;

        // Find the vehicle and check ownership
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check if user owns this vehicle
        if (vehicle.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own vehicles'
            });
        }

        // Check for active bookings
        const activeBookings = await Booking.find({
            vehicleId: vehicleId,
            status: 'active'
        });

        if (activeBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete vehicle with active bookings'
            });
        }

        // Delete the vehicle
        await Vehicle.findByIdAndDelete(vehicleId);

        res.status(200).json({
            success: true,
            message: 'Vehicle deleted successfully'
        });
    } catch (error) {
        console.error('Delete user vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete vehicle'
        });
    }
};

module.exports = {
    addVehicle,
    getAvailableVehicles,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    getVehicleStats,
    getUserVehicles,
    deleteUserVehicle
};
