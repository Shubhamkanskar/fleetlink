/**
 * Ride Calculations Unit Tests
 * @fileoverview Comprehensive tests for ride calculation utilities
 */

const {
    calculateRideDuration,
    calculateEndTime,
    checkTimeOverlap,
    checkBookingConflict,
    getConflictType,
    validateBookingTimes
} = require('../src/utils/rideCalculations');

describe('Ride Calculations', () => {
    describe('calculateRideDuration', () => {
        test('should calculate duration correctly for different pincodes', () => {
            expect(calculateRideDuration('110001', '400001')).toBe(8); // |400001 - 110001| % 24 = 8
            expect(calculateRideDuration('400001', '110001')).toBe(8); // Same result (absolute difference)
            expect(calculateRideDuration('100000', '200000')).toBe(16); // |200000 - 100000| % 24 = 16
        });

        test('should return 1 for same pincode (minimum duration)', () => {
            expect(calculateRideDuration('110001', '110001')).toBe(1);
            expect(calculateRideDuration('400001', '400001')).toBe(1);
        });

        test('should handle edge cases with modulo 24', () => {
            expect(calculateRideDuration('100000', '100024')).toBe(1); // 24 % 24 = 0, but minimum is 1
            expect(calculateRideDuration('100000', '100025')).toBe(1); // 25 % 24 = 1
            expect(calculateRideDuration('100000', '100048')).toBe(1); // 48 % 24 = 0, but minimum is 1
        });

        test('should throw error for invalid inputs', () => {
            expect(() => calculateRideDuration('', '400001')).toThrow('Both start and end pincodes are required');
            expect(() => calculateRideDuration('110001', '')).toThrow('Both start and end pincodes are required');
            expect(() => calculateRideDuration(null, '400001')).toThrow('Both start and end pincodes are required');
            expect(() => calculateRideDuration('110001', null)).toThrow('Both start and end pincodes are required');
        });

        test('should throw error for invalid pincode format', () => {
            expect(() => calculateRideDuration('11000', '400001')).toThrow('Pincodes must be 6-digit numbers');
            expect(() => calculateRideDuration('110001', '40000')).toThrow('Pincodes must be 6-digit numbers');
            expect(() => calculateRideDuration('abc123', '400001')).toThrow('Pincodes must be 6-digit numbers');
            expect(() => calculateRideDuration('110001', 'xyz789')).toThrow('Pincodes must be 6-digit numbers');
        });
    });

    describe('calculateEndTime', () => {
        test('should calculate end time correctly', () => {
            const startTime = new Date('2024-01-15T10:00:00Z');
            const endTime = calculateEndTime(startTime, 5);
            const expected = new Date('2024-01-15T15:00:00Z');
            expect(endTime.getTime()).toBe(expected.getTime());
        });

        test('should handle string input', () => {
            const endTime = calculateEndTime('2024-01-15T10:00:00Z', 3);
            const expected = new Date('2024-01-15T13:00:00Z');
            expect(endTime.getTime()).toBe(expected.getTime());
        });

        test('should handle zero duration', () => {
            const startTime = new Date('2024-01-15T10:00:00Z');
            const endTime = calculateEndTime(startTime, 0);
            expect(endTime.getTime()).toBe(startTime.getTime());
        });

        test('should handle fractional hours', () => {
            const startTime = new Date('2024-01-15T10:00:00Z');
            const endTime = calculateEndTime(startTime, 2.5);
            const expected = new Date('2024-01-15T12:30:00Z');
            expect(endTime.getTime()).toBe(expected.getTime());
        });

        test('should throw error for invalid inputs', () => {
            expect(() => calculateEndTime(null, 5)).toThrow('Start time is required');
            expect(() => calculateEndTime('2024-01-15T10:00:00Z', -1)).toThrow('Duration must be a non-negative number');
            expect(() => calculateEndTime('2024-01-15T10:00:00Z', 'invalid')).toThrow('Duration must be a non-negative number');
        });

        test('should throw error for invalid date format', () => {
            expect(() => calculateEndTime('invalid-date', 5)).toThrow('Invalid start time format');
            expect(() => calculateEndTime('2024-13-45T25:70:90Z', 5)).toThrow('Invalid start time format');
        });
    });

    describe('checkTimeOverlap', () => {
        test('should detect no overlap', () => {
            expect(checkTimeOverlap(
                '2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z',
                '2024-01-15T14:00:00Z', '2024-01-15T16:00:00Z'
            )).toBe(false);
        });

        test('should detect start overlap', () => {
            expect(checkTimeOverlap(
                '2024-01-15T10:00:00Z', '2024-01-15T14:00:00Z',
                '2024-01-15T12:00:00Z', '2024-01-15T16:00:00Z'
            )).toBe(true);
        });

        test('should detect end overlap', () => {
            expect(checkTimeOverlap(
                '2024-01-15T12:00:00Z', '2024-01-15T16:00:00Z',
                '2024-01-15T10:00:00Z', '2024-01-15T14:00:00Z'
            )).toBe(true);
        });

        test('should detect complete overlap (new within existing)', () => {
            expect(checkTimeOverlap(
                '2024-01-15T10:00:00Z', '2024-01-15T16:00:00Z',
                '2024-01-15T12:00:00Z', '2024-01-15T14:00:00Z'
            )).toBe(true);
        });

        test('should detect complete overlap (existing within new)', () => {
            expect(checkTimeOverlap(
                '2024-01-15T12:00:00Z', '2024-01-15T14:00:00Z',
                '2024-01-15T10:00:00Z', '2024-01-15T16:00:00Z'
            )).toBe(true);
        });

        test('should detect exact match', () => {
            expect(checkTimeOverlap(
                '2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z',
                '2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z'
            )).toBe(true);
        });

        test('should handle adjacent times (no overlap)', () => {
            expect(checkTimeOverlap(
                '2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z',
                '2024-01-15T12:00:00Z', '2024-01-15T14:00:00Z'
            )).toBe(false);
        });

        test('should throw error for invalid inputs', () => {
            expect(() => checkTimeOverlap(null, '2024-01-15T12:00:00Z', '2024-01-15T14:00:00Z', '2024-01-15T16:00:00Z'))
                .toThrow('All time parameters are required');
        });

        test('should throw error for invalid date format', () => {
            expect(() => checkTimeOverlap('invalid', '2024-01-15T12:00:00Z', '2024-01-15T14:00:00Z', '2024-01-15T16:00:00Z'))
                .toThrow('Invalid date format');
        });

        test('should throw error for invalid time ranges', () => {
            expect(() => checkTimeOverlap('2024-01-15T12:00:00Z', '2024-01-15T10:00:00Z', '2024-01-15T14:00:00Z', '2024-01-15T16:00:00Z'))
                .toThrow('Start time must be before or equal to end time');
        });
    });

    describe('checkBookingConflict', () => {
        test('should detect no conflicts with empty bookings', () => {
            const result = checkBookingConflict([], '2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z');
            expect(result.hasConflict).toBe(false);
            expect(result.conflictingBookings).toHaveLength(0);
        });

        test('should detect no conflicts with non-overlapping bookings', () => {
            const existingBookings = [
                { _id: '1', times: { start: '2024-01-15T08:00:00Z', end: '2024-01-15T10:00:00Z' } },
                { _id: '2', times: { start: '2024-01-15T14:00:00Z', end: '2024-01-15T16:00:00Z' } }
            ];
            const result = checkBookingConflict(existingBookings, '2024-01-15T11:00:00Z', '2024-01-15T13:00:00Z');
            expect(result.hasConflict).toBe(false);
            expect(result.conflictingBookings).toHaveLength(0);
        });

        test('should detect conflicts with overlapping bookings', () => {
            const existingBookings = [
                { _id: '1', times: { start: '2024-01-15T08:00:00Z', end: '2024-01-15T10:00:00Z' } },
                { _id: '2', times: { start: '2024-01-15T11:00:00Z', end: '2024-01-15T13:00:00Z' } },
                { _id: '3', times: { start: '2024-01-15T14:00:00Z', end: '2024-01-15T16:00:00Z' } }
            ];
            const result = checkBookingConflict(existingBookings, '2024-01-15T09:00:00Z', '2024-01-15T12:00:00Z');
            expect(result.hasConflict).toBe(true);
            expect(result.conflictingBookings).toHaveLength(2);
            expect(result.conflictingBookings[0].bookingId).toBe('1');
            expect(result.conflictingBookings[1].bookingId).toBe('2');
        });

        test('should handle invalid booking data gracefully', () => {
            const existingBookings = [
                { _id: '1', times: { start: 'invalid-date', end: '2024-01-15T10:00:00Z' } },
                { _id: '2', times: { start: '2024-01-15T11:00:00Z', end: '2024-01-15T13:00:00Z' } }
            ];
            const result = checkBookingConflict(existingBookings, '2024-01-15T12:00:00Z', '2024-01-15T14:00:00Z');
            expect(result.hasConflict).toBe(true);
            expect(result.conflictingBookings).toHaveLength(1);
            expect(result.conflictingBookings[0].bookingId).toBe('2');
        });

        test('should throw error for invalid inputs', () => {
            expect(() => checkBookingConflict('not-array', '2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z'))
                .toThrow('Existing bookings must be an array');
            expect(() => checkBookingConflict([], null, '2024-01-15T12:00:00Z'))
                .toThrow('New booking start and end times are required');
        });
    });

    describe('getConflictType', () => {
        test('should identify complete overlap (new within existing)', () => {
            const conflictType = getConflictType(
                '2024-01-15T10:00:00Z', '2024-01-15T16:00:00Z',
                '2024-01-15T12:00:00Z', '2024-01-15T14:00:00Z'
            );
            expect(conflictType).toBe('complete_overlap');
        });

        test('should identify complete overlap (existing within new)', () => {
            const conflictType = getConflictType(
                '2024-01-15T12:00:00Z', '2024-01-15T14:00:00Z',
                '2024-01-15T10:00:00Z', '2024-01-15T16:00:00Z'
            );
            expect(conflictType).toBe('complete_overlap');
        });

        test('should identify start overlap', () => {
            const conflictType = getConflictType(
                '2024-01-15T10:00:00Z', '2024-01-15T14:00:00Z',
                '2024-01-15T12:00:00Z', '2024-01-15T16:00:00Z'
            );
            expect(conflictType).toBe('start_overlap');
        });

        test('should identify end overlap', () => {
            const conflictType = getConflictType(
                '2024-01-15T12:00:00Z', '2024-01-15T16:00:00Z',
                '2024-01-15T10:00:00Z', '2024-01-15T14:00:00Z'
            );
            expect(conflictType).toBe('end_overlap');
        });

        test('should identify exact match', () => {
            const conflictType = getConflictType(
                '2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z',
                '2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z'
            );
            expect(conflictType).toBe('exact_match');
        });
    });

    describe('validateBookingTimes', () => {
        test('should validate correct booking times', () => {
            const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
            const endTime = new Date(futureTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours

            const result = validateBookingTimes(futureTime.toISOString(), endTime.toISOString());
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject missing start time', () => {
            const result = validateBookingTimes(null, '2024-01-15T12:00:00Z');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Start time is required');
        });

        test('should reject missing end time', () => {
            const result = validateBookingTimes('2024-01-15T10:00:00Z', null);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('End time is required');
        });

        test('should reject invalid start time format', () => {
            const result = validateBookingTimes('invalid-date', '2024-01-15T12:00:00Z');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid start time format');
        });

        test('should reject invalid end time format', () => {
            const result = validateBookingTimes('2024-01-15T10:00:00Z', 'invalid-date');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid end time format');
        });

        test('should reject past start time', () => {
            const pastTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
            const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2 hours from now

            const result = validateBookingTimes(pastTime.toISOString(), endTime.toISOString());
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Start time must be in the future');
        });

        test('should reject end time before start time', () => {
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
            const endTime = new Date(startTime.getTime() - 2 * 60 * 60 * 1000); // -2 hours from start

            const result = validateBookingTimes(startTime.toISOString(), endTime.toISOString());
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('End time must be after start time');
        });

        test('should reject booking duration exceeding 24 hours', () => {
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
            const endTime = new Date(startTime.getTime() + 25 * 60 * 60 * 1000); // +25 hours

            const result = validateBookingTimes(startTime.toISOString(), endTime.toISOString());
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Booking duration cannot exceed 24 hours');
        });

        test('should accept maximum allowed duration (24 hours)', () => {
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
            const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // +24 hours

            const result = validateBookingTimes(startTime.toISOString(), endTime.toISOString());
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});
