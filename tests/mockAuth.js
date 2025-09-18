/**
 * Mock Authentication Middleware for Tests
 * @fileoverview Provides mock authentication for testing purposes
 */

const jwt = require('jsonwebtoken');

/**
 * Mock authentication middleware that bypasses JWT verification
 */
const mockAuth = (req, res, next) => {
    // Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        // For testing, we'll decode the token without verification
        const decoded = jwt.decode(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        // Mock user object based on the token
        req.user = {
            id: decoded.id,
            _id: decoded.id, // Add _id field for Mongoose compatibility
            email: decoded.email,
            role: decoded.role || 'user' // Default to user if not specified
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

/**
 * Mock admin authentication middleware
 */
const mockRequireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
};

module.exports = {
    mockAuth,
    mockRequireAdmin
};
