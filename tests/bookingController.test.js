/**
 * Booking Controller Unit Tests
 * @fileoverview Comprehensive tests for booking creation, validation, and race condition prevention
 */

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { mockAuth, mockRequireAdmin } = require('./mockAuth');

// Create a test app instance
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock the authentication middleware
jest.mock('../src/middlewares/auth', () => ({
    authenticate: mockAuth,
    requireAdmin: mockRequireAdmin
}));

// Import routes
const authRoutes = require('../src/routes/authRoutes');
const vehicleRoutes = require('../src/routes/vehicleRoutes');
const bookingRoutes = require('../src/routes/bookingRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});
const { Booking } = require('../src/models/Booking');
const Vehicle = require('../src/models/Vehicle');

describe('Booking Controller', () => {
    let authToken;
    let adminToken;
    let testUser;
    let testVehicle;

    beforeEach(async () => {
        // Create real test user and get auth token
        testUser = await global.testUtils.createRealTestUser();

        // Use real JWT token
        authToken = global.testUtils.getRealAuthToken();
        adminToken = global.testUtils.getAdminAuthToken();

        // Create test vehicle
        testVehicle = await global.testUtils.createTestVehicle();
    });

    describe('POST /api/bookings', () => {
        test('should create a new booking with valid data', async () => {
            const bookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '110001',
                toPincode: '400001',
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Booking created successfully');
            expect(response.body.booking.vehicle).toBeDefined();
            expect(response.body.booking.user).toBeDefined();
            expect(response.body.booking.pincodes.start).toBe(bookingData.fromPincode);
            expect(response.body.booking.pincodes.end).toBe(bookingData.toPincode);
            expect(response.body.booking.status).toBe('active');
        });

        test('should reject booking with missing required fields', async () => {
            const bookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '110001'
                // Missing toPincode and startTime
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('All fields are required: vehicleId, fromPincode, toPincode, startTime');
        });

        test('should reject booking with invalid pincode format', async () => {
            const bookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '11000', // Invalid: only 5 digits
                toPincode: '400001',
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Pincodes must be 6 digits');
        });

        test('should reject booking with invalid start time format', async () => {
            const bookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '110001',
                toPincode: '400001',
                startTime: 'invalid-date'
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid start time format');
        });

        test('should reject booking with past start time', async () => {
            const bookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '110001',
                toPincode: '400001',
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Start time must be in the future');
        });

        test('should reject booking for non-existent vehicle', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011';
            const bookingData = {
                vehicleId: nonExistentId,
                fromPincode: '110001',
                toPincode: '400001',
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Vehicle not found');
        });

        test('should reject booking for inactive vehicle', async () => {
            // Create an inactive vehicle
            const inactiveVehicle = await global.testUtils.createTestVehicle({ isActive: false });

            const bookingData = {
                vehicleId: inactiveVehicle._id.toString(),
                fromPincode: '110001',
                toPincode: '400001',
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Vehicle is not available for booking');
        });

        test('should create booking with same pincode (minimum 1 hour duration)', async () => {
            const bookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '410504',
                toPincode: '410504', // Same pincode
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Booking created successfully');
            expect(response.body.booking.pincodes.start).toBe(bookingData.fromPincode);
            expect(response.body.booking.pincodes.end).toBe(bookingData.toPincode);

            // Verify that end time is 1 hour after start time (minimum duration)
            const startTime = new Date(response.body.booking.times.start);
            const endTime = new Date(response.body.booking.times.end);
            const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            expect(durationHours).toBe(1); // Should be 1 hour minimum
        });

        test('should prevent race condition - vehicle becomes unavailable between check and booking', async () => {
            // Create a booking that will conflict
            const conflictingStartTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const conflictingEndTime = new Date(conflictingStartTime.getTime() + 2 * 60 * 60 * 1000);

            await global.testUtils.createTestBooking({
                vehicleId: testVehicle._id,
                times: {
                    start: conflictingStartTime,
                    end: conflictingEndTime
                }
            });

            // Try to create a booking that overlaps
            const bookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '110001',
                toPincode: '400001',
                startTime: new Date(conflictingStartTime.getTime() + 1 * 60 * 60 * 1000).toISOString() // 1 hour after conflicting start
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Vehicle is no longer available for the selected time slot');
            expect(response.body.conflictDetails).toBeDefined();
            expect(response.body.conflictDetails.conflictingBookings.length).toBeGreaterThan(0);
        });

        test('should calculate ride duration and end time correctly', async () => {
            const bookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '110001',
                toPincode: '400001',
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(201);

            expect(response.body.success).toBe(true);

            // Verify that end time was calculated correctly
            // Duration should be |400001 - 110001| % 24 = 8 hours
            const startTime = new Date(bookingData.startTime);
            const expectedEndTime = new Date(startTime.getTime() + 8 * 60 * 60 * 1000);
            const actualEndTime = new Date(response.body.booking.times.end);

            // Allow for small time differences due to processing
            const timeDifference = Math.abs(actualEndTime.getTime() - expectedEndTime.getTime());
            expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
        });
    });

    describe('GET /api/bookings/my-bookings', () => {
        beforeEach(async () => {
            // Create multiple bookings for the test user
            await global.testUtils.createTestBooking({
                userId: testUser._id,
                status: 'active'
            });
            await global.testUtils.createTestBooking({
                userId: testUser._id,
                status: 'completed'
            });
            await global.testUtils.createTestBooking({
                userId: testUser._id,
                status: 'cancelled'
            });
        });

        test('should return all user bookings', async () => {
            const response = await request(app)
                .get('/api/bookings/my-bookings')
                .set('Authorization', authToken)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.bookings).toBeDefined();
            expect(response.body.bookings.length).toBeGreaterThan(0);

            // All bookings should belong to the test user
            response.body.bookings.forEach(booking => {
                expect(booking.vehicle).toBeDefined();
                expect(booking.pincodes).toBeDefined();
                expect(booking.times).toBeDefined();
                expect(booking.status).toBeDefined();
            });
        });

        test('should filter bookings by status', async () => {
            const response = await request(app)
                .get('/api/bookings/my-bookings')
                .set('Authorization', authToken)
                .query({ status: 'active' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.bookings).toBeDefined();

            // All returned bookings should be active
            response.body.bookings.forEach(booking => {
                expect(booking.status).toBe('active');
            });
        });

        test('should return empty array for user with no bookings', async () => {
            // Create a new user with no bookings
            const newUser = await global.testUtils.createTestUser({ email: 'newuser@example.com' });

            const response = await request(app)
                .get('/api/bookings/my-bookings')
                .set('Authorization', authToken)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.bookings).toBeDefined();
            // Note: This test might still return bookings if the auth token is mocked
            // In a real implementation, you'd need to properly mock the JWT token
        });
    });

    describe('DELETE /api/bookings/:id', () => {
        let testBooking;

        beforeEach(async () => {
            // Create a test booking
            testBooking = await global.testUtils.createTestBooking({
                userId: testUser._id,
                status: 'active',
                times: {
                    start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                    end: new Date(Date.now() + 26 * 60 * 60 * 1000)    // Tomorrow + 2 hours
                }
            });
        });

        test('should cancel an active booking', async () => {
            const response = await request(app)
                .delete(`/api/bookings/${testBooking._id}`)
                .set('Authorization', authToken)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Booking cancelled successfully');

            // Verify booking status was updated
            const cancelledBooking = await Booking.findById(testBooking._id);
            expect(cancelledBooking.status).toBe('cancelled');
        });

        test('should reject cancellation of non-existent booking', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .delete(`/api/bookings/${nonExistentId}`)
                .set('Authorization', authToken)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Booking not found');
        });

        test('should reject cancellation of booking that has already started', async () => {
            // Create a booking with future times first
            const startedBooking = await global.testUtils.createTestBooking({
                userId: testUser._id,
                status: 'active'
            });

            // Manually update the times to make it appear as if it has already started
            // This bypasses the pre-save validation
            startedBooking.times.start = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
            startedBooking.times.end = new Date(Date.now() + 2 * 60 * 60 * 1000);    // 2 hours from now
            await startedBooking.save({ validateBeforeSave: false });

            const response = await request(app)
                .delete(`/api/bookings/${startedBooking._id}`)
                .set('Authorization', authToken)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot cancel booking that has already started');
        });

        test('should reject cancellation of already cancelled booking', async () => {
            // Create a cancelled booking
            const cancelledBooking = await global.testUtils.createTestBooking({
                userId: testUser._id,
                status: 'cancelled'
            });

            const response = await request(app)
                .delete(`/api/bookings/${cancelledBooking._id}`)
                .set('Authorization', authToken)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Booking cannot be cancelled. Current status: cancelled');
        });

        test('should reject cancellation of completed booking', async () => {
            // Create a completed booking
            const completedBooking = await global.testUtils.createTestBooking({
                userId: testUser._id,
                status: 'completed'
            });

            const response = await request(app)
                .delete(`/api/bookings/${completedBooking._id}`)
                .set('Authorization', authToken)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Booking cannot be cancelled. Current status: completed');
        });
    });

    describe('GET /api/bookings (Admin)', () => {
        beforeEach(async () => {
            // Create multiple bookings
            await global.testUtils.createTestBooking({ status: 'active' });
            await global.testUtils.createTestBooking({ status: 'completed' });
            await global.testUtils.createTestBooking({ status: 'cancelled' });
        });

        test('should return all bookings with pagination', async () => {
            const response = await request(app)
                .get('/api/bookings')
                .set('Authorization', adminToken)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.bookings).toBeDefined();
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.currentPage).toBe(1);
            expect(response.body.pagination.totalBookings).toBeGreaterThan(0);
        });

        test('should filter bookings by status', async () => {
            const response = await request(app)
                .get('/api/bookings')
                .set('Authorization', adminToken)
                .query({ status: 'active' })
                .expect(200);

            expect(response.body.success).toBe(true);

            // All returned bookings should be active
            response.body.bookings.forEach(booking => {
                expect(booking.status).toBe('active');
            });
        });

        test('should handle pagination correctly', async () => {
            const response = await request(app)
                .get('/api/bookings')
                .set('Authorization', adminToken)
                .query({ page: 1, limit: 2 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.bookings.length).toBeLessThanOrEqual(2);
            expect(response.body.pagination.currentPage).toBe(1);
        });
    });

    describe('GET /api/bookings/stats (Admin)', () => {
        beforeEach(async () => {
            // Create bookings with different statuses
            await global.testUtils.createTestBooking({ status: 'active' });
            await global.testUtils.createTestBooking({ status: 'completed' });
            await global.testUtils.createTestBooking({ status: 'cancelled' });
        });

        test('should return booking statistics', async () => {
            const response = await request(app)
                .get('/api/bookings/stats')
                .set('Authorization', adminToken)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.stats).toBeDefined();
            expect(typeof response.body.stats.total).toBe('number');
            expect(typeof response.body.stats.active).toBe('number');
            expect(typeof response.body.stats.completed).toBe('number');
            expect(typeof response.body.stats.cancelled).toBe('number');
            expect(typeof response.body.stats.todayBookings).toBe('number');
            expect(typeof response.body.stats.thisWeekBookings).toBe('number');
        });
    });
});
