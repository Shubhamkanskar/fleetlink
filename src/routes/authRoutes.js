/**
 * Authentication Routes for FleetLink
 * @fileoverview Express routes for user authentication and profile management
 */

const express = require('express');
const { authenticate } = require('../middlewares/auth');
const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    deactivateAccount
} = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @param   {string} name - User's full name
 * @param   {string} email - User's email address
 * @param   {string} password - User's password (min 6 characters)
 * @returns {Object} success, message, token, user
 * @example
 * // Request
 * POST /api/auth/register
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "password123"
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "user",
 *     "isActive": true,
 *     "createdAt": "2021-07-20T10:30:00.000Z",
 *     "updatedAt": "2021-07-20T10:30:00.000Z"
 *   }
 * }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @param   {string} email - User's email address
 * @param   {string} password - User's password
 * @returns {Object} success, message, token, user
 * @example
 * // Request
 * POST /api/auth/login
 * {
 *   "email": "john@example.com",
 *   "password": "password123"
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "user",
 *     "isActive": true,
 *     "createdAt": "2021-07-20T10:30:00.000Z",
 *     "updatedAt": "2021-07-20T10:30:00.000Z"
 *   }
 * }
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @returns {Object} success, user
 * @example
 * // Request
 * GET /api/auth/profile
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "user": {
 *     "id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "user",
 *     "isActive": true,
 *     "createdAt": "2021-07-20T10:30:00.000Z",
 *     "updatedAt": "2021-07-20T10:30:00.000Z"
 *   }
 * }
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @param   {string} name - Updated user name
 * @returns {Object} success, message, user
 * @example
 * // Request
 * PUT /api/auth/profile
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * Body: {
 *   "name": "John Smith"
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "message": "Profile updated successfully",
 *   "user": {
 *     "id": "60f7b3b3b3b3b3b3b3b3b3b3",
 *     "name": "John Smith",
 *     "email": "john@example.com",
 *     "role": "user",
 *     "isActive": true,
 *     "createdAt": "2021-07-20T10:30:00.000Z",
 *     "updatedAt": "2021-07-20T11:00:00.000Z"
 *   }
 * }
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @param   {string} currentPassword - Current password
 * @param   {string} newPassword - New password (min 6 characters)
 * @returns {Object} success, message
 * @example
 * // Request
 * PUT /api/auth/change-password
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * Body: {
 *   "currentPassword": "oldpassword123",
 *   "newPassword": "newpassword123"
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "message": "Password changed successfully"
 * }
 */
router.put('/change-password', authenticate, changePassword);

/**
 * @route   DELETE /api/auth/account
 * @desc    Deactivate user account
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @returns {Object} success, message
 * @example
 * // Request
 * DELETE /api/auth/account
 * Headers: {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "message": "Account deactivated successfully"
 * }
 */
router.delete('/account', authenticate, deactivateAccount);

module.exports = router;
