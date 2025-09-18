/**
 * Vehicle Routes for FleetLink
 * @fileoverview Express routes for vehicle management and availability
 */

const express = require('express');
const { authenticate, requireAdmin, authorize } = require('../middlewares/auth');
const {
    addVehicle,
    getAvailableVehicles,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    getVehicleStats,
    getUserVehicles,
    deleteUserVehicle
} = require('../controllers/vehicleController');

const router = express.Router();

/**
 * @route   POST /api/vehicles
 * @desc    Add a new vehicle (Authenticated users)
 * @access  Private (Authenticated)
 * @header  Authorization: Bearer <token>
 * @param   {string} name - Vehicle name
 * @param   {number} capacityKg - Vehicle capacity in kilograms
 * @param   {number} tyres - Number of tyres
 * @returns {Object} success, message, vehicle
 * @example
 * // Request
 * POST /api/vehicles
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * Body: {
 *   "name": "Truck-001",
 *   "capacityKg": 5000,
 *   "tyres": 6
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "message": "Vehicle added successfully",
 *   "vehicle": {
 *     "id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *     "name": "Truck-001",
 *     "capacityKg": 5000,
 *     "capacityTons": "5.00",
 *     "tyres": 6,
 *     "status": "Active",
 *     "createdBy": "60f7b3b3b3b3b3b3b3b3b3b4",
 *     "createdAt": "2021-07-20T10:30:00.000Z"
 *   }
 * }
 */
router.post('/', authenticate, addVehicle);

/**
 * @route   GET /api/vehicles/available
 * @desc    Get available vehicles with filtering
 * @access  Public
 * @query   {number} capacityRequired - Minimum capacity filter
 * @query   {string} fromPincode - Starting location pincode (6 digits)
 * @query   {string} toPincode - Destination pincode (6 digits)
 * @query   {string} startTime - Start time (ISO string)
 * @returns {Object} success, vehicles, total, availableCount, estimatedRideDurationHours
 * @example
 * // Request
 * GET /api/vehicles/available?capacityRequired=3000&fromPincode=110001&toPincode=400001&startTime=2024-01-15T10:00:00Z
 * 
 * // Response
 * {
 *   "success": true,
 *   "vehicles": {
 *     "available": [
 *       {
 *         "id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *         "name": "Truck-001",
 *         "capacityKg": 5000,
 *         "capacityTons": "5.00",
 *         "tyres": 6,
 *         "status": "Active",
 *         "availability": {
 *           "isAvailable": true,
 *           "conflictingBookings": []
 *         }
 *       }
 *     ],
 *     "unavailable": []
 *   },
 *   "total": 1,
 *   "availableCount": 1,
 *   "unavailableCount": 0,
 *   "estimatedRideDurationHours": 2,
 *   "searchCriteria": {
 *     "capacityRequired": 3000,
 *     "fromPincode": "110001",
 *     "toPincode": "400001",
 *     "startTime": "2024-01-15T10:00:00Z",
 *     "endTime": "2024-01-15T12:00:00Z"
 *   }
 * }
 */
router.get('/available', getAvailableVehicles);

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles with pagination (Admin only)
 * @access  Private (Admin)
 * @header  Authorization: Bearer <token>
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10)
 * @query   {string} status - Filter by status (active|inactive)
 * @query   {number} capacityMin - Minimum capacity filter
 * @query   {number} capacityMax - Maximum capacity filter
 * @returns {Object} success, vehicles, pagination
 * @example
 * // Request
 * GET /api/vehicles?page=1&limit=10&status=active
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "vehicles": [
 *     {
 *       "id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *       "name": "Truck-001",
 *       "capacityKg": 5000,
 *       "capacityTons": "5.00",
 *       "tyres": 6,
 *       "status": "Active",
 *       "createdBy": {
 *         "id": "60f7b3b3b3b3b3b3b3b3b3b4",
 *         "name": "Admin User",
 *         "email": "admin@example.com"
 *       },
 *       "createdAt": "2021-07-20T10:30:00.000Z"
 *     }
 *   ],
 *   "pagination": {
 *     "currentPage": 1,
 *     "totalPages": 1,
 *     "totalItems": 1,
 *     "itemsPerPage": 10,
 *     "hasNextPage": false,
 *     "hasPrevPage": false
 *   }
 * }
 */
router.get('/', authenticate, requireAdmin, getAllVehicles);

/**
 * @route   GET /api/vehicles/stats
 * @desc    Get vehicle statistics (Admin only)
 * @access  Private (Admin)
 * @header  Authorization: Bearer <token>
 * @returns {Object} success, stats
 * @example
 * // Request
 * GET /api/vehicles/stats
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "stats": {
 *     "vehicles": {
 *       "total": 10,
 *       "active": 8,
 *       "inactive": 2,
 *       "avgCapacity": 2500
 *     },
 *     "bookings": {
 *       "total": 100,
 *       "active": 20,
 *       "completed": 70,
 *       "cancelled": 10
 *     }
 *   }
 * }
 */
router.get('/stats', authenticate, requireAdmin, getVehicleStats);

/**
 * @route   GET /api/vehicles/my-vehicles
 * @desc    Get current user's vehicles
 * @access  Private (User)
 * @header  Authorization: Bearer <token>
 * @returns {Object} success, vehicles
 * @example
 * // Request
 * GET /api/vehicles/my-vehicles
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "vehicles": [
 *     {
 *       "id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *       "name": "My Truck-001",
 *       "capacityKg": 5000,
 *       "capacityTons": "5.00",
 *       "tyres": 6,
 *       "status": "Active",
 *       "createdBy": "60f7b3b3b3b3b3b3b3b3b3b4",
 *       "createdAt": "2021-07-20T10:30:00.000Z"
 *     }
 *   ]
 * }
 */
router.get('/my-vehicles', authenticate, getUserVehicles);

/**
 * @route   DELETE /api/vehicles/my-vehicles/:id
 * @desc    Delete user's own vehicle
 * @access  Private (User)
 * @header  Authorization: Bearer <token>
 * @param   {string} id - Vehicle ID
 * @returns {Object} success, message
 * @example
 * // Request
 * DELETE /api/vehicles/my-vehicles/60f7b3b3b3b3b3b3b3b3b3b3
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "message": "Vehicle deleted successfully"
 * }
 */
router.delete('/my-vehicles/:id', authenticate, deleteUserVehicle);

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Public
 * @param   {string} id - Vehicle ID
 * @returns {Object} success, vehicle
 * @example
 * // Request
 * GET /api/vehicles/60f7b3b3b3b3b3b3b3b3b3b3
 * 
 * // Response
 * {
 *   "success": true,
 *   "vehicle": {
 *     "id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *     "name": "Truck-001",
 *     "capacityKg": 5000,
 *     "capacityTons": "5.00",
 *     "tyres": 6,
 *     "status": "Active",
 *     "createdBy": {
 *       "id": "60f7b3b3b3b3b3b3b3b3b3b4",
 *       "name": "Admin User",
 *       "email": "admin@example.com"
 *     },
 *     "createdAt": "2021-07-20T10:30:00.000Z"
 *   }
 * }
 */
router.get('/:id', getVehicleById);

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update vehicle (Admin only)
 * @access  Private (Admin)
 * @header  Authorization: Bearer <token>
 * @param   {string} id - Vehicle ID
 * @param   {string} name - Updated vehicle name
 * @param   {number} capacityKg - Updated capacity
 * @param   {number} tyres - Updated number of tyres
 * @param   {boolean} isActive - Updated status
 * @returns {Object} success, message, vehicle
 * @example
 * // Request
 * PUT /api/vehicles/60f7b3b3b3b3b3b3b3b3b3b3
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * Body: {
 *   "name": "Updated Truck-001",
 *   "capacityKg": 6000
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "message": "Vehicle updated successfully",
 *   "vehicle": {
 *     "id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *     "name": "Updated Truck-001",
 *     "capacityKg": 6000,
 *     "capacityTons": "6.00",
 *     "tyres": 6,
 *     "status": "Active",
 *     "createdBy": "60f7b3b3b3b3b3b3b3b3b3b4",
 *     "createdAt": "2021-07-20T10:30:00.000Z",
 *     "updatedAt": "2021-07-20T11:00:00.000Z"
 *   }
 * }
 */
router.put('/:id', authenticate, requireAdmin, updateVehicle);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete vehicle (Admin only)
 * @access  Private (Admin)
 * @header  Authorization: Bearer <token>
 * @param   {string} id - Vehicle ID
 * @returns {Object} success, message
 * @example
 * // Request
 * DELETE /api/vehicles/60f7b3b3b3b3b3b3b3b3b3b3
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "message": "Vehicle deleted successfully"
 * }
 */
router.delete('/:id', authenticate, requireAdmin, deleteVehicle);

module.exports = router;
