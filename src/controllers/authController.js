/**
 * Authentication Controller for FleetLink
 * @fileoverview Handles user registration, login, and profile management
 */

const User = require('../models/User');

/**
 * Register a new user
 * @async
 * @function register
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Creates a new user account with email and password validation
 * @example
 * // POST /api/auth/register
 * // Body: { name: "John Doe", email: "john@example.com", password: "password123" }
 * // Response: { success: true, token: "jwt_token", user: { id, name, email, role } }
 */
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }

        // Check if email already exists
        const emailExists = await User.emailExists(email);
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        // Generate token
        const token = user.generateAuthToken();

        // Send response
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Registration error:', error);

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
                message: 'Email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

/**
 * Login user
 * @async
 * @function login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Authenticates user with email and password
 * @example
 * // POST /api/auth/login
 * // Body: { email: "john@example.com", password: "password123" }
 * // Response: { success: true, token: "jwt_token", user: { id, name, email, role } }
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by email (include password for comparison)
        const user = await User.findByEmail(email, true);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = user.generateAuthToken();

        // Send response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

/**
 * Get current user profile
 * @async
 * @function getProfile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Returns current authenticated user's profile
 * @example
 * // GET /api/auth/profile
 * // Headers: { Authorization: "Bearer jwt_token" }
 * // Response: { success: true, user: { id, name, email, role, createdAt } }
 */
const getProfile = async (req, res) => {
    try {
        // User is already attached to req by authenticate middleware
        const user = req.user;

        res.status(200).json({
            success: true,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
};

/**
 * Update user profile
 * @async
 * @function updateProfile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Updates current user's profile information
 * @example
 * // PUT /api/auth/profile
 * // Headers: { Authorization: "Bearer jwt_token" }
 * // Body: { name: "New Name" }
 * // Response: { success: true, user: { updated profile } }
 */
const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long'
            });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            { name: name.trim() },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Update profile error:', error);

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
            message: 'Failed to update profile'
        });
    }
};

/**
 * Change user password
 * @async
 * @function changePassword
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Changes current user's password
 * @example
 * // PUT /api/auth/change-password
 * // Headers: { Authorization: "Bearer jwt_token" }
 * // Body: { currentPassword: "oldpass", newPassword: "newpass" }
 * // Response: { success: true, message: "Password changed successfully" }
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current password and new password'
            });
        }

        // Validate new password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Get user with password
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

/**
 * Deactivate user account
 * @async
 * @function deactivateAccount
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Deactivates current user's account
 * @example
 * // DELETE /api/auth/account
 * // Headers: { Authorization: "Bearer jwt_token" }
 * // Response: { success: true, message: "Account deactivated successfully" }
 */
const deactivateAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // Deactivate user account
        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Account deactivated successfully'
        });
    } catch (error) {
        console.error('Deactivate account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate account'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    deactivateAccount
};
