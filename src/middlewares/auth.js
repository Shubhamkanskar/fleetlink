/**
 * Authentication Middleware for FleetLink
 * @fileoverview JWT authentication and authorization middleware
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and authenticate user
 * @async
 * @function authenticate
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @description Verifies JWT token from Authorization header and attaches user to request
 * @example
 * // Protect routes with authentication
 * app.get('/api/profile', authenticate, (req, res) => {
 *   res.json({ success: true, user: req.user });
 * });
 */
const authenticate = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check for token in cookies (alternative method)
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        // Make sure token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token is valid but user no longer exists'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            // Add user to request object
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Middleware to authorize admin users only
 * @function requireAdmin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @description Checks if authenticated user has admin role
 * @example
 * // Protect admin routes
 * app.post('/api/vehicles', authenticate, requireAdmin, addVehicle);
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }

    next();
};

/**
 * Middleware to authorize specific roles
 * @function authorize
 * @param {...string} roles - Roles that are allowed to access the route
 * @returns {Function} Middleware function
 * @description Checks if authenticated user has one of the specified roles
 * @example
 * // Allow both admin and user roles
 * app.get('/api/bookings', authenticate, authorize('admin', 'user'), getBookings);
 * 
 * // Allow only admin role
 * app.delete('/api/users/:id', authenticate, authorize('admin'), deleteUser);
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Optional authentication middleware
 * @async
 * @function optionalAuth
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @description Authenticates user if token is provided, but doesn't require it
 * @example
 * // Optional authentication for public routes that can show user-specific data
 * app.get('/api/vehicles', optionalAuth, getVehicles);
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check for token in cookies
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');

                if (user && user.isActive) {
                    req.user = user;
                }
            } catch (error) {
                // Token is invalid, but we don't fail the request
                console.log('Optional auth: Invalid token provided');
            }
        }

        next();
    } catch (error) {
        console.error('Optional authentication error:', error);
        next(); // Continue even if there's an error
    }
};

/**
 * Middleware to check if user owns the resource
 * @function checkOwnership
 * @param {string} userIdParam - Parameter name containing user ID (default: 'userId')
 * @returns {Function} Middleware function
 * @description Checks if authenticated user owns the resource or is admin
 * @example
 * // Check if user owns the booking
 * app.get('/api/bookings/:bookingId', authenticate, checkOwnership('userId'), getBooking);
 */
const checkOwnership = (userIdParam = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const resourceUserId = req.params[userIdParam] || req.body[userIdParam];

        // Admin can access any resource
        if (req.user.role === 'admin') {
            return next();
        }

        // User can only access their own resources
        if (req.user._id.toString() !== resourceUserId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own resources.'
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    requireAdmin,
    authorize,
    optionalAuth,
    checkOwnership
};
