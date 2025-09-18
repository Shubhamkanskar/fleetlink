/**
 * Vehicle Model for FleetLink
 * @fileoverview Vehicle schema with validation and business logic
 */

const mongoose = require('mongoose');

/**
 * Vehicle schema definition
 * @typedef {Object} VehicleSchema
 * @property {string} name - Vehicle name/identifier
 * @property {number} capacityKg - Vehicle capacity in kilograms
 * @property {number} tyres - Number of tyres
 * @property {ObjectId} createdBy - User who created the vehicle
 * @property {boolean} isActive - Vehicle status
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
const vehicleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vehicle name is required'],
        trim: true,
        minlength: [2, 'Vehicle name must be at least 2 characters'],
        maxlength: [100, 'Vehicle name cannot exceed 100 characters']
    },
    capacityKg: {
        type: Number,
        required: [true, 'Vehicle capacity is required'],
        min: [1, 'Capacity must be at least 1 kg'],
        max: [50000, 'Capacity cannot exceed 50,000 kg']
    },
    tyres: {
        type: Number,
        required: [true, 'Number of tyres is required'],
        min: [2, 'Vehicle must have at least 2 tyres'],
        max: [18, 'Vehicle cannot have more than 18 tyres']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by user is required']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/**
 * Index for frequently queried fields
 */
vehicleSchema.index({ isActive: 1, capacityKg: 1 });
vehicleSchema.index({ createdBy: 1 });

/**
 * Virtual for vehicle's capacity in tons
 */
vehicleSchema.virtual('capacityTons').get(function () {
    return (this.capacityKg / 1000).toFixed(2);
});

/**
 * Virtual for vehicle's API URL
 */
vehicleSchema.virtual('url').get(function () {
    return `/api/vehicles/${this._id}`;
});

/**
 * Static method to find active vehicles
 * @async
 * @function findActive
 * @returns {Promise<Array>} Array of active vehicles
 * @example
 * // Get all active vehicles
 * const vehicles = await Vehicle.findActive();
 */
vehicleSchema.statics.findActive = function () {
    return this.find({ isActive: true }).populate('createdBy', 'name email');
};

/**
 * Static method to find vehicles by capacity range
 * @async
 * @function findByCapacityRange
 * @param {number} minCapacity - Minimum capacity in kg
 * @param {number} maxCapacity - Maximum capacity in kg
 * @returns {Promise<Array>} Array of vehicles within capacity range
 * @example
 * // Find vehicles with capacity between 1000-5000 kg
 * const vehicles = await Vehicle.findByCapacityRange(1000, 5000);
 */
vehicleSchema.statics.findByCapacityRange = function (minCapacity, maxCapacity) {
    return this.find({
        isActive: true,
        capacityKg: { $gte: minCapacity, $lte: maxCapacity }
    }).populate('createdBy', 'name email');
};

/**
 * Static method to get vehicle statistics
 * @async
 * @function getStats
 * @returns {Promise<Object>} Vehicle statistics
 * @example
 * // Get vehicle statistics
 * const stats = await Vehicle.getStats();
 * // Returns: { total: 10, active: 8, inactive: 2, avgCapacity: 2500 }
 */
vehicleSchema.statics.getStats = async function () {
    const total = await this.countDocuments();
    const active = await this.countDocuments({ isActive: true });
    const inactive = total - active;

    const avgCapacityResult = await this.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, avgCapacity: { $avg: '$capacityKg' } } }
    ]);

    const avgCapacity = avgCapacityResult.length > 0 ? avgCapacityResult[0].avgCapacity : 0;

    return {
        total,
        active,
        inactive,
        avgCapacity: Math.round(avgCapacity)
    };
};

/**
 * Instance method to get vehicle summary
 * @function getSummary
 * @returns {Object} Vehicle summary information
 * @example
 * // Get vehicle summary
 * const summary = vehicle.getSummary();
 * // Returns: { id, name, capacity, tyres, status }
 */
vehicleSchema.methods.getSummary = function () {
    return {
        id: this._id.toString(),
        name: this.name,
        capacityKg: this.capacityKg,
        capacityTons: this.capacityTons,
        tyres: this.tyres,
        status: this.isActive ? 'Active' : 'Inactive',
        createdBy: this.createdBy,
        createdAt: this.createdAt
    };
};

/**
 * Transform JSON output
 */
vehicleSchema.methods.toJSON = function () {
    const vehicleObject = this.toObject();
    vehicleObject.capacityTons = this.capacityTons;
    return vehicleObject;
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
