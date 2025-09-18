/**
 * Jest Test Setup for FleetLink
 * @fileoverview Global test setup and teardown
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

/**
 * Setup before all tests
 */
beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

/**
 * Cleanup after all tests
 */
afterAll(async () => {
    // Close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    // Stop in-memory MongoDB instance
    await mongoServer.stop();
});

/**
 * Global test utilities
 */
global.testUtils = {
    /**
     * Create a test user
     */
    createTestUser: async (userData = {}) => {
        const User = require('../src/models/User');
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const defaultUser = {
            name: 'Test User',
            email: `test-${timestamp}-${randomId}@example.com`,
            password: 'password123',
            role: 'user',
            ...userData
        };
        return await User.create(defaultUser);
    },

    /**
     * Create the real test user with your credentials
     */
    createRealTestUser: async () => {
        const User = require('../src/models/User');
        const realUser = {
            _id: '68cbef1c03690487fa4395ee', // From your JWT token
            name: 'Shubham Kanaskar',
            email: 'shubhamkanaskar75@gmail.com',
            password: 'password123',
            role: 'user'
        };

        // Try to find existing user first
        let user = await User.findById(realUser._id);
        if (!user) {
            user = await User.create(realUser);
        }
        return user;
    },

    /**
     * Get the real JWT token for testing
     */
    getRealAuthToken: () => {
        return 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2JlZjFjMDM2OTA0ODdmYTQzOTVlZSIsImVtYWlsIjoic2h1YmhhbWthbmFza2FyNzVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTgxOTg2MTgsImV4cCI6MTc1ODgwMzQxOH0.ilnVAfvE4UKCvOR7wCsLL0TuslruWxPGUlNNIWUKF7Q';
    },

    /**
     * Get admin JWT token for testing
     */
    getAdminAuthToken: () => {
        // Create a mock admin token with admin role
        const jwt = require('jsonwebtoken');
        const adminPayload = {
            id: '68cbef1c03690487fa4395ee',
            email: 'admin@fleetlink.com',
            role: 'admin',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        };
        const adminToken = jwt.sign(adminPayload, 'your-super-secret-jwt-key-change-this-in-production');
        return `Bearer ${adminToken}`;
    },

    /**
     * Create a test vehicle
     */
    createTestVehicle: async (vehicleData = {}) => {
        const Vehicle = require('../src/models/Vehicle');
        const user = await global.testUtils.createTestUser();
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const defaultVehicle = {
            name: `Test Vehicle ${timestamp}-${randomId}`,
            capacityKg: 1000,
            tyres: 4,
            createdBy: user._id,
            ...vehicleData
        };
        return await Vehicle.create(defaultVehicle);
    },

    /**
     * Create a test booking
     */
    createTestBooking: async (bookingData = {}) => {
        const { Booking } = require('../src/models/Booking');
        const user = await global.testUtils.createTestUser();
        const vehicle = await global.testUtils.createTestVehicle();
        const defaultBooking = {
            vehicleId: vehicle._id,
            userId: user._id,
            pincodes: {
                start: '110001',
                end: '400001'
            },
            times: {
                start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                end: new Date(Date.now() + 26 * 60 * 60 * 1000)    // Tomorrow + 2 hours
            },
            status: 'active',
            ...bookingData
        };
        return await Booking.create(defaultBooking);
    }
};
