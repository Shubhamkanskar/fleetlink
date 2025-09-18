/**
 * Vehicle Controller Unit Tests
 * @fileoverview Comprehensive tests for vehicle management and availability checking
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
const Vehicle = require('../src/models/Vehicle');
const { Booking } = require('../src/models/Booking');

describe('Vehicle Controller', () => {
    let authToken;
    let adminToken;
    let testUser;
    let testVehicle;

    beforeEach(async () => {
        // Create real test user and get auth token
        testUser = await global.testUtils.createRealTestUser();

        // Use real JWT token for user operations
        authToken = global.testUtils.getRealAuthToken();

        // Use admin JWT token for admin operations
        adminToken = global.testUtils.getAdminAuthToken();

        // Create test vehicle
        testVehicle = await global.testUtils.createTestVehicle();
    });

    describe('POST /api/vehicles', () => {
        test('should create a new vehicle with valid data', async () => {
            const vehicleData = {
                name: 'Test Truck',
                capacityKg: 2000,
                tyres: 6
            };

            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', authToken)
                .send(vehicleData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Vehicle added successfully');
            expect(response.body.vehicle.name).toBe(vehicleData.name);
            expect(response.body.vehicle.capacityKg).toBe(vehicleData.capacityKg);
            expect(response.body.vehicle.tyres).toBe(vehicleData.tyres);
        });

        test('should reject vehicle with missing required fields', async () => {
            const vehicleData = {
                name: 'Test Truck'
                // Missing capacityKg and tyres
            };

            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', authToken)
                .send(vehicleData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Name, capacity, and tyres are required');
        });

        test('should reject vehicle with invalid capacity', async () => {
            const vehicleData = {
                name: 'Test Truck',
                capacityKg: 0, // Invalid capacity
                tyres: 6
            };

            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', authToken)
                .send(vehicleData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Capacity must be between 1 and 50,000 kg');
        });

        test('should reject vehicle with invalid tyre count', async () => {
            const vehicleData = {
                name: 'Test Truck',
                capacityKg: 2000,
                tyres: 1 // Invalid tyre count
            };

            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', authToken)
                .send(vehicleData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Vehicle must have between 2 and 18 tyres');
        });

        test('should reject vehicle with capacity exceeding maximum', async () => {
            const vehicleData = {
                name: 'Test Truck',
                capacityKg: 60000, // Exceeds maximum
                tyres: 6
            };

            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', authToken)
                .send(vehicleData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Capacity must be between 1 and 50,000 kg');
        });

        test('should reject vehicle with tyre count exceeding maximum', async () => {
            const vehicleData = {
                name: 'Test Truck',
                capacityKg: 2000,
                tyres: 20 // Exceeds maximum
            };

            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', authToken)
                .send(vehicleData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Vehicle must have between 2 and 18 tyres');
        });
    });

    describe('GET /api/vehicles/available', () => {
        beforeEach(async () => {
            // Create multiple test vehicles with different capacities
            await global.testUtils.createTestVehicle({ name: 'Small Truck', capacityKg: 1000, tyres: 4 });
            await global.testUtils.createTestVehicle({ name: 'Medium Truck', capacityKg: 3000, tyres: 6 });
            await global.testUtils.createTestVehicle({ name: 'Large Truck', capacityKg: 5000, tyres: 8 });
        });

        test('should return available vehicles with valid parameters', async () => {
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow

            const response = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 2000,
                    fromPincode: '110001',
                    toPincode: '400001',
                    startTime
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.vehicles.available).toBeDefined();
            expect(response.body.vehicles.unavailable).toBeDefined();
            expect(response.body.total).toBeGreaterThan(0);
            expect(response.body.availableCount).toBeGreaterThanOrEqual(0);
            expect(response.body.unavailableCount).toBeGreaterThanOrEqual(0);
            expect(response.body.estimatedRideDurationHours).toBeDefined();
        });

        test('should filter vehicles by capacity requirement', async () => {
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const response = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 4000, // Should only return Large Truck
                    fromPincode: '110001',
                    toPincode: '400001',
                    startTime
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // All returned vehicles should meet capacity requirement
            response.body.vehicles.available.forEach(vehicle => {
                expect(vehicle.capacityKg).toBeGreaterThanOrEqual(4000);
            });
        });

        test('should reject request with missing time parameters', async () => {
            const response = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 2000
                    // Missing startTime
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Start time is required');
        });

        test('should reject request with invalid time parameters', async () => {
            const response = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 2000,
                    startTime: 'invalid-date'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid start time format');
        });

        test('should reject request with invalid capacity', async () => {
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const response = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 'invalid',
                    fromPincode: '110001',
                    toPincode: '400001',
                    startTime
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Capacity must be a positive number');
        });

        test('should handle vehicles with existing bookings', async () => {
            // Create a booking for the test vehicle
            await global.testUtils.createTestBooking({
                vehicleId: testVehicle._id,
                times: {
                    start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                    end: new Date(Date.now() + 26 * 60 * 60 * 1000)    // Tomorrow + 2 hours
                }
            });

            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const response = await request(app)
                .get('/api/vehicles/available')
                .query({
                    capacityRequired: 500,
                    fromPincode: '110001',
                    toPincode: '400001',
                    startTime
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // The test vehicle should be in unavailable list due to existing booking
            const unavailableVehicle = response.body.vehicles.unavailable.find(
                v => v.id === testVehicle._id.toString()
            );
            expect(unavailableVehicle).toBeDefined();
            expect(unavailableVehicle.availability.isAvailable).toBe(false);
            expect(unavailableVehicle.availability.conflictingBookings.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/vehicles', () => {
        test('should return all vehicles with pagination', async () => {
            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', adminToken)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.vehicles).toBeDefined();
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.currentPage).toBe(1);
            expect(response.body.pagination.itemsPerPage).toBe(10);
        });

        test('should filter vehicles by status', async () => {
            // Create an inactive vehicle
            await global.testUtils.createTestVehicle({ name: 'Inactive Truck', isActive: false });

            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', adminToken)
                .query({ status: 'active' })
                .expect(200);

            expect(response.body.success).toBe(true);

            // All returned vehicles should be active
            response.body.vehicles.forEach(vehicle => {
                expect(vehicle.status).toBe('Active');
            });
        });

        test('should filter vehicles by capacity range', async () => {
            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', adminToken)
                .query({ capacityMin: 2000, capacityMax: 4000 })
                .expect(200);

            expect(response.body.success).toBe(true);

            // All returned vehicles should be within capacity range
            response.body.vehicles.forEach(vehicle => {
                expect(vehicle.capacityKg).toBeGreaterThanOrEqual(2000);
                expect(vehicle.capacityKg).toBeLessThanOrEqual(4000);
            });
        });
    });

    describe('GET /api/vehicles/:id', () => {
        test('should return vehicle by ID', async () => {
            const response = await request(app)
                .get(`/api/vehicles/${testVehicle._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.vehicle.id).toBe(testVehicle._id.toString());
            expect(response.body.vehicle.name).toBe(testVehicle.name);
        });

        test('should return 404 for non-existent vehicle', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

            const response = await request(app)
                .get(`/api/vehicles/${nonExistentId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Vehicle not found');
        });

        test('should return 400 for invalid vehicle ID', async () => {
            const response = await request(app)
                .get('/api/vehicles/invalid-id')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid vehicle ID');
        });
    });

    describe('PUT /api/vehicles/:id', () => {
        test('should update vehicle with valid data', async () => {
            const updateData = {
                name: 'Updated Truck',
                capacityKg: 3000
            };

            const response = await request(app)
                .put(`/api/vehicles/${testVehicle._id}`)
                .set('Authorization', adminToken)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Vehicle updated successfully');
            expect(response.body.vehicle.name).toBe(updateData.name);
            expect(response.body.vehicle.capacityKg).toBe(updateData.capacityKg);
        });

        test('should reject update with invalid capacity', async () => {
            const updateData = {
                capacityKg: 0 // Invalid capacity
            };

            const response = await request(app)
                .put(`/api/vehicles/${testVehicle._id}`)
                .set('Authorization', adminToken)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Capacity must be between 1 and 50,000 kg');
        });

        test('should reject update with invalid tyre count', async () => {
            const updateData = {
                tyres: 1 // Invalid tyre count
            };

            const response = await request(app)
                .put(`/api/vehicles/${testVehicle._id}`)
                .set('Authorization', adminToken)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Vehicle must have between 2 and 18 tyres');
        });
    });

    describe('DELETE /api/vehicles/:id', () => {
        test('should soft delete vehicle without active bookings', async () => {
            const response = await request(app)
                .delete(`/api/vehicles/${testVehicle._id}`)
                .set('Authorization', adminToken)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Vehicle deleted successfully');

            // Verify vehicle is soft deleted (isActive = false)
            const deletedVehicle = await Vehicle.findById(testVehicle._id);
            expect(deletedVehicle.isActive).toBe(false);
        });

        test('should reject deletion of vehicle with active bookings', async () => {
            // Create an active booking for the test vehicle
            await global.testUtils.createTestBooking({
                vehicleId: testVehicle._id,
                status: 'active'
            });

            const response = await request(app)
                .delete(`/api/vehicles/${testVehicle._id}`)
                .set('Authorization', adminToken)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot delete vehicle with active bookings');
        });

        test('should return 404 for non-existent vehicle', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .delete(`/api/vehicles/${nonExistentId}`)
                .set('Authorization', adminToken)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Vehicle not found');
        });
    });

    describe('GET /api/vehicles/stats', () => {
        test('should return vehicle statistics', async () => {
            const response = await request(app)
                .get('/api/vehicles/stats')
                .set('Authorization', adminToken)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.stats).toBeDefined();
            expect(response.body.stats.vehicles).toBeDefined();
            expect(response.body.stats.bookings).toBeDefined();
            expect(typeof response.body.stats.vehicles.total).toBe('number');
            expect(typeof response.body.stats.vehicles.active).toBe('number');
            expect(typeof response.body.stats.vehicles.inactive).toBe('number');
        });
    });
});
