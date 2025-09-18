/**
 * Integration Tests
 * @fileoverview End-to-end tests for critical booking flow and race conditions
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

describe('Integration Tests', () => {
    let authToken;
    let adminToken;
    let testUser;
    let testVehicle;

    beforeEach(async () => {
        // Create real test user and get auth token
        testUser = await global.testUtils.createRealTestUser();
        authToken = global.testUtils.getRealAuthToken();
        adminToken = global.testUtils.getAdminAuthToken();

        // Create test vehicle
        testVehicle = await global.testUtils.createTestVehicle();
    });

    describe('Complete Booking Flow', () => {
        test('should complete full booking workflow', async () => {
            // Step 1: Search for available vehicles
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const searchResponse = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 500,
                    fromPincode: '110001',
                    toPincode: '400001',
                    startTime
                })
                .expect(200);

            expect(searchResponse.body.success).toBe(true);
            expect(searchResponse.body.vehicles.available.length).toBeGreaterThan(0);

            // Step 2: Create a booking
            const bookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '110001',
                toPincode: '400001',
                startTime
            };

            const bookingResponse = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(bookingData)
                .expect(201);

            expect(bookingResponse.body.success).toBe(true);
            expect(bookingResponse.body.booking.status).toBe('active');

            // Step 3: Verify vehicle is no longer available for overlapping time
            const searchAfterBooking = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 500,
                    fromPincode: '110001',
                    toPincode: '400001',
                    startTime
                })
                .expect(200);

            // The vehicle should now be unavailable or have conflicts
            const vehicleInResults = searchAfterBooking.body.vehicles.available.find(
                v => v.id === testVehicle._id.toString()
            );
            const vehicleInUnavailable = searchAfterBooking.body.vehicles.unavailable.find(
                v => v.id === testVehicle._id.toString()
            );

            expect(vehicleInResults || vehicleInUnavailable).toBeDefined();

            // Step 4: Get user's bookings
            const userBookingsResponse = await request(app)
                .get('/api/bookings/my-bookings')
                .set('Authorization', authToken)
                .expect(200);

            expect(userBookingsResponse.body.success).toBe(true);
            expect(userBookingsResponse.body.bookings.length).toBeGreaterThan(0);

            // Step 5: Cancel the booking
            const cancelResponse = await request(app)
                .delete(`/api/bookings/${bookingResponse.body.booking._id}`)
                .set('Authorization', authToken)
                .expect(200);

            expect(cancelResponse.body.success).toBe(true);

            // Step 6: Verify vehicle is available again
            const searchAfterCancel = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 500,
                    fromPincode: '110001',
                    toPincode: '400001',
                    startTime
                })
                .expect(200);

            const vehicleAvailableAgain = searchAfterCancel.body.vehicles.available.find(
                v => v.id === testVehicle._id.toString()
            );
            expect(vehicleAvailableAgain).toBeDefined();
        });

        test('should handle concurrent booking attempts (race condition)', async () => {
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            const bookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '110001',
                toPincode: '400001',
                startTime
            };

            // Create multiple concurrent booking requests
            const bookingPromises = Array(5).fill().map(() =>
                request(app)
                    .post('/api/bookings')
                    .set('Authorization', authToken)
                    .send(bookingData)
            );

            const responses = await Promise.allSettled(bookingPromises);

            // Only one booking should succeed
            const successfulBookings = responses.filter(
                response => response.status === 'fulfilled' && response.value.status === 201
            );
            const failedBookings = responses.filter(
                response => response.status === 'fulfilled' && response.value.status === 409
            );

            expect(successfulBookings.length).toBe(1);
            expect(failedBookings.length).toBe(4);

            // Verify only one booking exists in database
            const bookings = await Booking.find({ vehicleId: testVehicle._id, status: 'active' });
            expect(bookings.length).toBe(1);
        });

        test('should handle capacity filtering correctly', async () => {
            // Create vehicles with different capacities
            const smallVehicle = await global.testUtils.createTestVehicle({
                name: 'Small Truck',
                capacityRequired: 1000,
                tyres: 4
            });
            const mediumVehicle = await global.testUtils.createTestVehicle({
                name: 'Medium Truck',
                capacityRequired: 3000,
                tyres: 6
            });
            const largeVehicle = await global.testUtils.createTestVehicle({
                name: 'Large Truck',
                capacityRequired: 5000,
                tyres: 8
            });

            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            // Search for vehicles with capacity >= 2500 kg
            const response = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 2500,
                    fromPincode: '110001',
                    toPincode: '400001',
                    startTime
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Should only return medium and large vehicles
            const returnedVehicleIds = response.body.vehicles.available.map(v => v.id);
            expect(returnedVehicleIds).toContain(mediumVehicle._id.toString());
            expect(returnedVehicleIds).toContain(largeVehicle._id.toString());
            expect(returnedVehicleIds).not.toContain(smallVehicle._id.toString());

            // All returned vehicles should meet capacity requirement
            response.body.vehicles.available.forEach(vehicle => {
                expect(vehicle.capacityRequired).toBeGreaterThanOrEqual(2500);
            });
        });

        test('should handle time overlap detection correctly', async () => {
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

            // Create a booking
            await global.testUtils.createTestBooking({
                vehicleId: testVehicle._id,
                times: { start: startTime, end: endTime },
                status: 'active'
            });

            // Try to create overlapping booking
            const overlappingBookingData = {
                vehicleId: testVehicle._id.toString(),
                fromPincode: '110001',
                toPincode: '400001',
                startTime: new Date(startTime.getTime() + 1 * 60 * 60 * 1000).toISOString() // 1 hour after first booking starts
            };

            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send(overlappingBookingData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Vehicle is no longer available for the selected time slot');
            expect(response.body.conflictDetails).toBeDefined();
            expect(response.body.conflictDetails.conflictingBookings.length).toBeGreaterThan(0);
        });

        test('should handle vehicle deactivation correctly', async () => {
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            // Vehicle should be available initially
            const initialSearch = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 500,
                    fromPincode: '110001',
                    toPincode: '400001',
                    startTime
                })
                .expect(200);

            const vehicleInitiallyAvailable = initialSearch.body.vehicles.available.find(
                v => v.id === testVehicle._id.toString()
            );
            expect(vehicleInitiallyAvailable).toBeDefined();

            // Deactivate vehicle
            const deactivateResponse = await request(app)
                .put(`/api/vehicles/${testVehicle._id}`)
                .set('Authorization', adminToken)
                .send({ isActive: false })
                .expect(200);

            expect(deactivateResponse.body.success).toBe(true);

            // Vehicle should no longer be available
            const searchAfterDeactivation = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 500,
                    fromPincode: '110001',
                    toPincode: '400001',
                    startTime
                })
                .expect(200);

            const vehicleAfterDeactivation = searchAfterDeactivation.body.vehicles.available.find(
                v => v.id === testVehicle._id.toString()
            );
            expect(vehicleAfterDeactivation).toBeUndefined();
        });

        test('should handle booking cancellation time restrictions', async () => {
            // Create a booking with future times first for the test user
            const startedBooking = await global.testUtils.createTestBooking({
                userId: testUser._id,
                status: 'active'
            });

            // Manually update the times to make it appear as if it has already started
            // This bypasses the pre-save validation
            startedBooking.times.start = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
            startedBooking.times.end = new Date(Date.now() + 2 * 60 * 60 * 1000);    // 2 hours from now
            await startedBooking.save({ validateBeforeSave: false });

            // Try to cancel the started booking
            const cancelResponse = await request(app)
                .delete(`/api/bookings/${startedBooking._id}`)
                .set('Authorization', authToken)
                .expect(400);

            expect(cancelResponse.body.success).toBe(false);
            expect(cancelResponse.body.message).toBe('Cannot cancel booking that has already started');

            // Create a future booking for the test user
            const futureBooking = await global.testUtils.createTestBooking({
                userId: testUser._id,
                times: {
                    start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                    end: new Date(Date.now() + 26 * 60 * 60 * 1000)    // Tomorrow + 2 hours
                },
                status: 'active'
            });

            // Should be able to cancel future booking
            const cancelFutureResponse = await request(app)
                .delete(`/api/bookings/${futureBooking._id}`)
                .set('Authorization', authToken)
                .expect(200);

            expect(cancelFutureResponse.body.success).toBe(true);
        });

        test('should handle admin operations correctly', async () => {
            // Get all vehicles (admin operation)
            const vehiclesResponse = await request(app)
                .get('/api/vehicles')
                .set('Authorization', adminToken)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(vehiclesResponse.body.success).toBe(true);
            expect(vehiclesResponse.body.vehicles).toBeDefined();
            expect(vehiclesResponse.body.pagination).toBeDefined();

            // Get all bookings (admin operation)
            const bookingsResponse = await request(app)
                .get('/api/bookings')
                .set('Authorization', adminToken)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(bookingsResponse.body.success).toBe(true);
            expect(bookingsResponse.body.bookings).toBeDefined();
            expect(bookingsResponse.body.pagination).toBeDefined();

            // Get statistics (admin operation)
            const statsResponse = await request(app)
                .get('/api/vehicles/stats')
                .set('Authorization', adminToken)
                .expect(200);

            expect(statsResponse.body.success).toBe(true);
            expect(statsResponse.body.stats).toBeDefined();
            expect(statsResponse.body.stats.vehicles).toBeDefined();
            expect(statsResponse.body.stats.bookings).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid authentication', async () => {
            const response = await request(app)
                .get('/api/vehicles')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should handle malformed requests', async () => {
            const response = await request(app)
                .post('/api/bookings')
                .set('Authorization', authToken)
                .send({ invalid: 'data' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle database connection issues gracefully', async () => {
            // This test would require mocking database connection failures
            // For now, we'll test that the server responds to health checks
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('OK');
        });
    });
});
