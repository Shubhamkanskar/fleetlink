/**
 * Ride Calculation Utilities for FleetLink
 * @fileoverview Business logic for ride duration, time calculations, and overlap checking
 */

/**
 * Calculate ride duration based on pincode difference
 * @function calculateRideDuration
 * @param {string} startPincode - Starting pincode
 * @param {string} endPincode - Destination pincode
 * @returns {number} Duration in hours
 * @description Calculates ride duration as pincode difference % 24
 * @example
 * // Calculate duration between pincodes
 * const duration = calculateRideDuration('110001', '400001');
 * // Returns: 2 (hours)
 * 
 * // Edge case: same pincode
 * const duration = calculateRideDuration('110001', '110001');
 * // Returns: 0 (hours)
 */
const calculateRideDuration = (startPincode, endPincode) => {
    // Validate inputs
    if (!startPincode || !endPincode) {
        throw new Error('Both start and end pincodes are required');
    }

    // Convert pincodes to numbers
    const start = parseInt(startPincode, 10);
    const end = parseInt(endPincode, 10);

    // Validate pincode format (6 digits)
    if (isNaN(start) || isNaN(end) || startPincode.length !== 6 || endPincode.length !== 6) {
        throw new Error('Pincodes must be 6-digit numbers');
    }

    // Calculate difference and apply modulo 24
    const difference = Math.abs(end - start);
    const duration = difference % 24;

    // Ensure minimum duration of 1 hour for same pincode bookings
    return duration === 0 ? 1 : duration;
};

/**
 * Calculate end time based on start time and duration
 * @function calculateEndTime
 * @param {Date|string} startTime - Start time
 * @param {number} durationHours - Duration in hours
 * @returns {Date} End time
 * @description Adds duration to start time to get end time
 * @example
 * // Calculate end time
 * const startTime = new Date('2024-01-15T10:00:00Z');
 * const endTime = calculateEndTime(startTime, 5);
 * // Returns: Date object for 2024-01-15T15:00:00Z
 * 
 * // Handle string input
 * const endTime = calculateEndTime('2024-01-15T10:00:00Z', 3);
 * // Returns: Date object for 2024-01-15T13:00:00Z
 */
const calculateEndTime = (startTime, durationHours) => {
    // Validate inputs
    if (!startTime) {
        throw new Error('Start time is required');
    }

    if (typeof durationHours !== 'number' || durationHours < 0) {
        throw new Error('Duration must be a non-negative number');
    }

    // Convert startTime to Date object if it's a string
    const start = new Date(startTime);

    // Validate date
    if (isNaN(start.getTime())) {
        throw new Error('Invalid start time format');
    }

    // Calculate end time
    const endTime = new Date(start.getTime() + (durationHours * 60 * 60 * 1000));

    return endTime;
};

/**
 * Check if two time ranges overlap
 * @function checkTimeOverlap
 * @param {Date|string} start1 - First range start time
 * @param {Date|string} end1 - First range end time
 * @param {Date|string} start2 - Second range start time
 * @param {Date|string} end2 - Second range end time
 * @returns {boolean} True if ranges overlap, false otherwise
 * @description Checks if two time ranges have any overlap
 * @example
 * // No overlap
 * const overlap = checkTimeOverlap(
 *   '2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z',
 *   '2024-01-15T14:00:00Z', '2024-01-15T16:00:00Z'
 * );
 * // Returns: false
 * 
 * // Start overlap
 * const overlap = checkTimeOverlap(
 *   '2024-01-15T10:00:00Z', '2024-01-15T14:00:00Z',
 *   '2024-01-15T12:00:00Z', '2024-01-15T16:00:00Z'
 * );
 * // Returns: true
 * 
 * // Complete overlap
 * const overlap = checkTimeOverlap(
 *   '2024-01-15T10:00:00Z', '2024-01-15T16:00:00Z',
 *   '2024-01-15T12:00:00Z', '2024-01-15T14:00:00Z'
 * );
 * // Returns: true
 */
const checkTimeOverlap = (start1, end1, start2, end2) => {
    // Validate inputs
    if (!start1 || !end1 || !start2 || !end2) {
        throw new Error('All time parameters are required');
    }

    // Convert to Date objects
    const start1Date = new Date(start1);
    const end1Date = new Date(end1);
    const start2Date = new Date(start2);
    const end2Date = new Date(end2);

    // Validate dates
    if (isNaN(start1Date.getTime()) || isNaN(end1Date.getTime()) ||
        isNaN(start2Date.getTime()) || isNaN(end2Date.getTime())) {
        throw new Error('Invalid date format');
    }

    // Check if ranges are valid (start <= end)
    if (start1Date > end1Date || start2Date > end2Date) {
        throw new Error('Start time must be before or equal to end time');
    }

    // Check for overlap
    // Two ranges overlap if: start1 < end2 AND start2 < end1
    return start1Date < end2Date && start2Date < end1Date;
};

/**
 * Check if a time range conflicts with existing bookings
 * @function checkBookingConflict
 * @param {Array} existingBookings - Array of existing booking objects
 * @param {Date|string} newStartTime - New booking start time
 * @param {Date|string} newEndTime - New booking end time
 * @returns {Object} Conflict information
 * @description Checks if new booking time conflicts with existing bookings
 * @example
 * // Check for conflicts
 * const existingBookings = [
 *   { startTime: '2024-01-15T10:00:00Z', endTime: '2024-01-15T12:00:00Z' },
 *   { startTime: '2024-01-15T14:00:00Z', endTime: '2024-01-15T16:00:00Z' }
 * ];
 * const conflict = checkBookingConflict(
 *   existingBookings,
 *   '2024-01-15T11:00:00Z',
 *   '2024-01-15T13:00:00Z'
 * );
 * // Returns: { hasConflict: true, conflictingBookings: [...] }
 */
const checkBookingConflict = (existingBookings, newStartTime, newEndTime) => {
    // Validate inputs
    if (!Array.isArray(existingBookings)) {
        throw new Error('Existing bookings must be an array');
    }

    if (!newStartTime || !newEndTime) {
        throw new Error('New booking start and end times are required');
    }

    const conflictingBookings = [];

    // Check each existing booking for conflicts
    for (const booking of existingBookings) {
        try {
            const hasOverlap = checkTimeOverlap(
                booking.times.start,
                booking.times.end,
                newStartTime,
                newEndTime
            );

            if (hasOverlap) {
                conflictingBookings.push({
                    bookingId: booking._id || booking.id,
                    startTime: booking.times.start,
                    endTime: booking.times.end,
                    conflictType: getConflictType(
                        booking.times.start,
                        booking.times.end,
                        newStartTime,
                        newEndTime
                    )
                });
            }
        } catch (error) {
            console.error('Error checking booking conflict:', error);
            // Continue checking other bookings
        }
    }

    return {
        hasConflict: conflictingBookings.length > 0,
        conflictingBookings
    };
};

/**
 * Determine the type of time conflict
 * @function getConflictType
 * @param {Date|string} existingStart - Existing booking start
 * @param {Date|string} existingEnd - Existing booking end
 * @param {Date|string} newStart - New booking start
 * @param {Date|string} newEnd - New booking end
 * @returns {string} Type of conflict
 * @description Determines the specific type of time overlap
 * @example
 * // Get conflict type
 * const conflictType = getConflictType(
 *   '2024-01-15T10:00:00Z', '2024-01-15T14:00:00Z',
 *   '2024-01-15T12:00:00Z', '2024-01-15T16:00:00Z'
 * );
 * // Returns: 'start_overlap'
 */
const getConflictType = (existingStart, existingEnd, newStart, newEnd) => {
    const existingStartDate = new Date(existingStart);
    const existingEndDate = new Date(existingEnd);
    const newStartDate = new Date(newStart);
    const newEndDate = new Date(newEnd);

    // Same times (exact match) - check this first
    if (newStartDate.getTime() === existingStartDate.getTime() &&
        newEndDate.getTime() === existingEndDate.getTime()) {
        return 'exact_match';
    }

    // Complete overlap (new booking completely within existing)
    if (newStartDate >= existingStartDate && newEndDate <= existingEndDate) {
        return 'complete_overlap';
    }

    // Complete overlap (existing booking completely within new)
    if (existingStartDate >= newStartDate && existingEndDate <= newEndDate) {
        return 'complete_overlap';
    }

    // Start overlap (new booking starts before existing ends)
    if (newStartDate < existingEndDate && newEndDate > existingEndDate) {
        return 'start_overlap';
    }

    // End overlap (new booking ends after existing starts)
    if (newStartDate < existingStartDate && newEndDate > existingStartDate) {
        return 'end_overlap';
    }

    return 'unknown_overlap';
};

/**
 * Validate booking time parameters
 * @function validateBookingTimes
 * @param {Date|string} startTime - Booking start time
 * @param {Date|string} endTime - Booking end time
 * @returns {Object} Validation result
 * @description Validates booking time parameters
 * @example
 * // Validate booking times
 * const validation = validateBookingTimes(
 *   '2024-01-15T10:00:00Z',
 *   '2024-01-15T12:00:00Z'
 * );
 * // Returns: { isValid: true, errors: [] }
 */
const validateBookingTimes = (startTime, endTime) => {
    const errors = [];

    // Check if times are provided
    if (!startTime) {
        errors.push('Start time is required');
    }

    if (!endTime) {
        errors.push('End time is required');
    }

    if (errors.length > 0) {
        return { isValid: false, errors };
    }

    // Convert to Date objects
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Check if dates are valid
    if (isNaN(start.getTime())) {
        errors.push('Invalid start time format');
    }

    if (isNaN(end.getTime())) {
        errors.push('Invalid end time format');
    }

    // Check if start time is in the future
    const now = new Date();
    if (start <= now) {
        errors.push('Start time must be in the future');
    }

    // Check if end time is after start time
    if (end <= start) {
        errors.push('End time must be after start time');
    }

    // Check if booking duration is reasonable (max 24 hours)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours > 24) {
        errors.push('Booking duration cannot exceed 24 hours');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    calculateRideDuration,
    calculateEndTime,
    checkTimeOverlap,
    checkBookingConflict,
    getConflictType,
    validateBookingTimes
};
