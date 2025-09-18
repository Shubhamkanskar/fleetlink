/**
 * User Model for FleetLink
 * @fileoverview User schema with authentication methods and JSDoc documentation
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * User schema definition
 * @typedef {Object} UserSchema
 * @property {string} name - User's full name
 * @property {string} email - User's email address (unique)
 * @property {string} password - Hashed password
 * @property {string} role - User role (user|admin)
 * @property {boolean} isActive - Account status
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin'],
            message: 'Role must be either user or admin'
        },
        default: 'user'
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
 * Index for email field for faster queries
 */
userSchema.index({ email: 1 });

/**
 * Pre-save middleware to hash password
 * @async
 * @function
 * @description Hashes password before saving to database
 * @param {Function} next - Express next function
 * @example
 * // Password will be automatically hashed when saving
 * const user = new User({ name: 'John', email: 'john@example.com', password: 'password123' });
 * await user.save(); // Password is hashed automatically
 */
userSchema.pre('save', async function (next) {
    // Only hash password if it's been modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Compare provided password with hashed password
 * @async
 * @function comparePassword
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * @example
 * // Compare password during login
 * const user = await User.findOne({ email }).select('+password');
 * const isMatch = await user.comparePassword(password);
 * if (isMatch) {
 *   // Login successful
 * }
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

/**
 * Generate JWT token for user
 * @function generateAuthToken
 * @returns {string} JWT token
 * @example
 * // Generate token after successful login
 * const user = await User.findOne({ email });
 * const token = user.generateAuthToken();
 * res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
 */
userSchema.methods.generateAuthToken = function () {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

/**
 * Get user profile without sensitive data
 * @function getPublicProfile
 * @returns {Object} User profile without password
 * @example
 * // Get user profile for API response
 * const profile = user.getPublicProfile();
 * res.json({ success: true, user: profile });
 */
userSchema.methods.getPublicProfile = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        isActive: this.isActive,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

/**
 * Static method to find user by email
 * @async
 * @function findByEmail
 * @param {string} email - User email
 * @param {boolean} includePassword - Whether to include password in result
 * @returns {Promise<User|null>} User document or null
 * @example
 * // Find user by email for login
 * const user = await User.findByEmail('john@example.com', true);
 * if (user) {
 *   const isMatch = await user.comparePassword(password);
 * }
 */
userSchema.statics.findByEmail = async function (email, includePassword = false) {
    const query = this.findOne({ email, isActive: true });
    if (includePassword) {
        query.select('+password');
    }
    return await query;
};

/**
 * Static method to check if email exists
 * @async
 * @function emailExists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 * @example
 * // Check if email exists during registration
 * const exists = await User.emailExists('john@example.com');
 * if (exists) {
 *   return res.status(400).json({ success: false, message: 'Email already exists' });
 * }
 */
userSchema.statics.emailExists = async function (email) {
    const user = await this.findOne({ email });
    return !!user;
};

/**
 * Virtual for user's full profile URL
 */
userSchema.virtual('profileUrl').get(function () {
    return `/api/users/${this._id}`;
});

/**
 * Transform JSON output to remove sensitive fields
 */
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
