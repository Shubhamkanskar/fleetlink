/**
 * Model Unit Tests
 * @fileoverview Comprehensive tests for Vehicle and Booking models
 */

const Vehicle = require('../src/models/Vehicle');
const { Booking, BOOKING_STATUS } = require('../src/models/Booking');

describe('Models', () => {
    describe('Vehicle Model', () => {
        test('should create a vehicle with valid data', async () => {
            const user = await global.testUtils.createTestUser();
            const vehicleData = {
                name: 'Test Vehicle',
                capacityKg: 2000,
                tyres: 6,
                createdBy: user._id
            };

            const vehicle = await Vehicle.create(vehicleData);

            expect(vehicle.name).toBe(vehicleData.name);
            expect(vehicle.capacityKg).toBe(vehicleData.capacityKg);
            expect(vehicle.tyres).toBe(vehicleData.tyres);
            expect(vehicle.createdBy.toString()).toBe(user._id.toString());
            expect(vehicle.isActive).toBe(true); // Default value
            expect(vehicle.createdAt).toBeDefined();
            expect(vehicle.updatedAt).toBeDefined();
        });

        test('should validate required fields', async () => {
            const vehicleData = {
                // Missing required fields
            };

            await expect(Vehicle.create(vehicleData)).rejects.toThrow();
        });

        test('should validate capacity range', async () => {
            const user = await global.testUtils.createTestUser();

            // Test minimum capacity
            const minCapacityVehicle = {
                name: 'Min Vehicle',
                capacityKg: 0, // Below minimum
                tyres: 4,
                createdBy: user._id
            };
            await expect(Vehicle.create(minCapacityVehicle)).rejects.toThrow();

            // Test maximum capacity
            const maxCapacityVehicle = {
                name: 'Max Vehicle',
                capacityKg: 60000, // Above maximum
                tyres: 4,
                createdBy: user._id
            };
            await expect(Vehicle.create(maxCapacityVehicle)).rejects.toThrow();
        });

        test('should validate tyre count range', async () => {
            const user = await global.testUtils.createTestUser();

            // Test minimum tyres
            const minTyresVehicle = {
                name: 'Min Tyres Vehicle',
                capacityKg: 1000,
                tyres: 1, // Below minimum
                createdBy: user._id
            };
            await expect(Vehicle.create(minTyresVehicle)).rejects.toThrow();

            // Test maximum tyres
            const maxTyresVehicle = {
                name: 'Max Tyres Vehicle',
                capacityKg: 1000,
                tyres: 20, // Above maximum
                createdBy: user._id
            };
            await expect(Vehicle.create(maxTyresVehicle)).rejects.toThrow();
        });

        test('should validate name length', async () => {
            const user = await global.testUtils.createTestUser();

            // Test minimum name length
            const shortNameVehicle = {
                name: 'A', // Too short
                capacityKg: 1000,
                tyres: 4,
                createdBy: user._id
            };
            await expect(Vehicle.create(shortNameVehicle)).rejects.toThrow();

            // Test maximum name length
            const longNameVehicle = {
                name: 'A'.repeat(101), // Too long
                capacityKg: 1000,
                tyres: 4,
                createdBy: user._id
            };
            await expect(Vehicle.create(longNameVehicle)).rejects.toThrow();
        });

        test('should calculate capacity in tons correctly', async () => {
            const user = await global.testUtils.createTestUser();
            const vehicle = await global.testUtils.createTestVehicle({
                capacityKg: 2500,
                createdBy: user._id
            });

            expect(vehicle.capacityTons).toBe('2.50');
        });

        test('should find active vehicles', async () => {
            const user = await global.testUtils.createTestUser();

            // Create active and inactive vehicles
            await global.testUtils.createTestVehicle({ isActive: true, createdBy: user._id });
            await global.testUtils.createTestVehicle({ isActive: false, createdBy: user._id });

            const activeVehicles = await Vehicle.findActive();

            expect(activeVehicles.length).toBeGreaterThan(0);
            activeVehicles.forEach(vehicle => {
                expect(vehicle.isActive).toBe(true);
            });
        });

        test('should find vehicles by capacity range', async () => {
            const user = await global.testUtils.createTestUser();

            // Create vehicles with different capacities
            await global.testUtils.createTestVehicle({ capacityKg: 1000, createdBy: user._id });
            await global.testUtils.createTestVehicle({ capacityKg: 3000, createdBy: user._id });
            await global.testUtils.createTestVehicle({ capacityKg: 5000, createdBy: user._id });

            const vehicles = await Vehicle.findByCapacityRange(2000, 4000);

            expect(vehicles.length).toBeGreaterThan(0);
            vehicles.forEach(vehicle => {
                expect(vehicle.capacityKg).toBeGreaterThanOrEqual(2000);
                expect(vehicle.capacityKg).toBeLessThanOrEqual(4000);
                expect(vehicle.isActive).toBe(true);
            });
        });

        test('should get vehicle statistics', async () => {
            const user = await global.testUtils.createTestUser();

            // Create vehicles with different statuses
            await global.testUtils.createTestVehicle({ isActive: true, capacityKg: 1000, createdBy: user._id });
            await global.testUtils.createTestVehicle({ isActive: true, capacityKg: 3000, createdBy: user._id });
            await global.testUtils.createTestVehicle({ isActive: false, capacityKg: 2000, createdBy: user._id });

            const stats = await Vehicle.getStats();

            expect(stats.total).toBe(3);
            expect(stats.active).toBe(2);
            expect(stats.inactive).toBe(1);
            expect(stats.avgCapacity).toBe(2000); // Average of active vehicles: (1000 + 3000) / 2
        });

        test('should get vehicle summary', async () => {
            const vehicle = await global.testUtils.createTestVehicle();
            const summary = vehicle.getSummary();

            expect(summary.id).toEqual(vehicle._id.toString());
            expect(summary.name).toBe(vehicle.name);
            expect(summary.capacityKg).toBe(vehicle.capacityKg);
            expect(summary.capacityTons).toBe(vehicle.capacityTons);
            expect(summary.tyres).toBe(vehicle.tyres);
            expect(summary.status).toBe('Active');
            expect(summary.createdBy).toBeDefined();
            expect(summary.createdAt).toBeDefined();
        });
    });

    describe('Booking Model', () => {
        test('should create a booking with valid data', async () => {
            const user = await global.testUtils.createTestUser();
            const vehicle = await global.testUtils.createTestVehicle();

            const bookingData = {
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
                status: BOOKING_STATUS.ACTIVE
            };

            const booking = await Booking.create(bookingData);

            expect(booking.vehicleId.toString()).toBe(vehicle._id.toString());
            expect(booking.userId.toString()).toBe(user._id.toString());
            expect(booking.pincodes.start).toBe(bookingData.pincodes.start);
            expect(booking.pincodes.end).toBe(bookingData.pincodes.end);
            expect(booking.times.start.getTime()).toBe(bookingData.times.start.getTime());
            expect(booking.times.end.getTime()).toBe(bookingData.times.end.getTime());
            expect(booking.status).toBe(BOOKING_STATUS.ACTIVE);
            expect(booking.createdAt).toBeDefined();
            expect(booking.updatedAt).toBeDefined();
        });

        test('should validate required fields', async () => {
            const bookingData = {
                // Missing required fields
            };

            await expect(Booking.create(bookingData)).rejects.toThrow();
        });

        test('should validate pincode format', async () => {
            const user = await global.testUtils.createTestUser();
            const vehicle = await global.testUtils.createTestVehicle();

            const invalidPincodeBooking = {
                vehicleId: vehicle._id,
                userId: user._id,
                pincodes: {
                    start: '11000', // Invalid: only 5 digits
                    end: '400001'
                },
                times: {
                    start: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    end: new Date(Date.now() + 26 * 60 * 60 * 1000)
                }
            };

            await expect(Booking.create(invalidPincodeBooking)).rejects.toThrow();
        });

        test('should validate booking status enum', async () => {
            const user = await global.testUtils.createTestUser();
            const vehicle = await global.testUtils.createTestVehicle();

            const invalidStatusBooking = {
                vehicleId: vehicle._id,
                userId: user._id,
                pincodes: {
                    start: '110001',
                    end: '400001'
                },
                times: {
                    start: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    end: new Date(Date.now() + 26 * 60 * 60 * 1000)
                },
                status: 'invalid_status'
            };

            await expect(Booking.create(invalidStatusBooking)).rejects.toThrow();
        });

        test('should validate end time is after start time', async () => {
            const user = await global.testUtils.createTestUser();
            const vehicle = await global.testUtils.createTestVehicle();

            const invalidTimeBooking = {
                vehicleId: vehicle._id,
                userId: user._id,
                pincodes: {
                    start: '110001',
                    end: '400001'
                },
                times: {
                    start: new Date(Date.now() + 26 * 60 * 60 * 1000), // Later time
                    end: new Date(Date.now() + 24 * 60 * 60 * 1000)    // Earlier time
                }
            };

            await expect(Booking.create(invalidTimeBooking)).rejects.toThrow();
        });

        test('should validate start time is in the future for new bookings', async () => {
            const user = await global.testUtils.createTestUser();
            const vehicle = await global.testUtils.createTestVehicle();

            const pastTimeBooking = {
                vehicleId: vehicle._id,
                userId: user._id,
                pincodes: {
                    start: '110001',
                    end: '400001'
                },
                times: {
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                    end: new Date(Date.now() - 22 * 60 * 60 * 1000)    // Yesterday + 2 hours
                }
            };

            await expect(Booking.create(pastTimeBooking)).rejects.toThrow();
        });

        test('should calculate duration in hours correctly', async () => {
            const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
            const futureEnd = new Date(futureStart.getTime() + 4 * 60 * 60 * 1000); // +4 hours

            const booking = await global.testUtils.createTestBooking({
                times: {
                    start: futureStart,
                    end: futureEnd
                }
            });

            expect(booking.durationHours).toBe(4);
        });

        test('should get status display correctly', async () => {
            const activeBooking = await global.testUtils.createTestBooking({ status: BOOKING_STATUS.ACTIVE });
            const completedBooking = await global.testUtils.createTestBooking({ status: BOOKING_STATUS.COMPLETED });
            const cancelledBooking = await global.testUtils.createTestBooking({ status: BOOKING_STATUS.CANCELLED });

            expect(activeBooking.statusDisplay).toBe('Active');
            expect(completedBooking.statusDisplay).toBe('Completed');
            expect(cancelledBooking.statusDisplay).toBe('Cancelled');
        });

        test('should find active bookings for vehicle in time range', async () => {
            const vehicle = await global.testUtils.createTestVehicle();
            const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const endTime = new Date(Date.now() + 26 * 60 * 60 * 1000);

            // Create overlapping booking
            await global.testUtils.createTestBooking({
                vehicleId: vehicle._id,
                times: { start: startTime, end: endTime },
                status: BOOKING_STATUS.ACTIVE
            });

            // Create non-overlapping booking
            await global.testUtils.createTestBooking({
                vehicleId: vehicle._id,
                times: {
                    start: new Date(Date.now() + 30 * 60 * 60 * 1000),
                    end: new Date(Date.now() + 32 * 60 * 60 * 1000)
                },
                status: BOOKING_STATUS.ACTIVE
            });

            // Create inactive booking
            await global.testUtils.createTestBooking({
                vehicleId: vehicle._id,
                times: { start: startTime, end: endTime },
                status: BOOKING_STATUS.CANCELLED
            });

            const activeBookings = await Booking.findActiveBookingsForVehicle(vehicle._id, startTime, endTime);

            expect(activeBookings.length).toBe(1);
            expect(activeBookings[0].vehicleId.toString()).toBe(vehicle._id.toString());
            expect(activeBookings[0].status).toBe(BOOKING_STATUS.ACTIVE);
        });

        test('should find user bookings', async () => {
            const user = await global.testUtils.createTestUser();

            // Create bookings for the user
            await global.testUtils.createTestBooking({ userId: user._id, status: BOOKING_STATUS.ACTIVE });
            await global.testUtils.createTestBooking({ userId: user._id, status: BOOKING_STATUS.COMPLETED });
            await global.testUtils.createTestBooking({ userId: user._id, status: BOOKING_STATUS.CANCELLED });

            const allBookings = await Booking.findUserBookings(user._id);
            const activeBookings = await Booking.findUserBookings(user._id, BOOKING_STATUS.ACTIVE);

            expect(allBookings.length).toBe(3);
            expect(activeBookings.length).toBe(1);
            expect(activeBookings[0].status).toBe(BOOKING_STATUS.ACTIVE);
        });

        test('should get booking statistics', async () => {
            // Create bookings with different statuses
            await global.testUtils.createTestBooking({ status: BOOKING_STATUS.ACTIVE });
            await global.testUtils.createTestBooking({ status: BOOKING_STATUS.COMPLETED });
            await global.testUtils.createTestBooking({ status: BOOKING_STATUS.CANCELLED });

            const stats = await Booking.getStats();

            expect(stats.total).toBe(3);
            expect(stats.active).toBe(1);
            expect(stats.completed).toBe(1);
            expect(stats.cancelled).toBe(1);
        });

        test('should check if booking is active', async () => {
            const activeBooking = await global.testUtils.createTestBooking({ status: BOOKING_STATUS.ACTIVE });
            const completedBooking = await global.testUtils.createTestBooking({ status: BOOKING_STATUS.COMPLETED });

            expect(activeBooking.isActive()).toBe(true);
            expect(completedBooking.isActive()).toBe(false);
        });

        test('should check if booking can be cancelled', async () => {
            const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
            const futureEnd = new Date(futureStart.getTime() + 2 * 60 * 60 * 1000); // +2 hours

            const futureBooking = await global.testUtils.createTestBooking({
                status: BOOKING_STATUS.ACTIVE,
                times: {
                    start: futureStart,
                    end: futureEnd
                }
            });

            // Create a past booking by directly setting the times after creation
            const pastBooking = await global.testUtils.createTestBooking({
                status: BOOKING_STATUS.ACTIVE
            });
            pastBooking.times.start = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
            pastBooking.times.end = new Date(Date.now() + 2 * 60 * 60 * 1000);    // 2 hours from now
            await pastBooking.save();

            const completedBooking = await global.testUtils.createTestBooking({ status: BOOKING_STATUS.COMPLETED });

            expect(futureBooking.canBeCancelled()).toBe(true);
            expect(pastBooking.canBeCancelled()).toBe(false);
            expect(completedBooking.canBeCancelled()).toBe(false);
        });

        test('should cancel booking', async () => {
            const booking = await global.testUtils.createTestBooking({
                status: BOOKING_STATUS.ACTIVE,
                times: {
                    start: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    end: new Date(Date.now() + 26 * 60 * 60 * 1000)
                }
            });

            const cancelledBooking = await booking.cancel();

            expect(cancelledBooking.status).toBe(BOOKING_STATUS.CANCELLED);
        });

        test('should complete booking', async () => {
            const booking = await global.testUtils.createTestBooking({ status: BOOKING_STATUS.ACTIVE });

            const completedBooking = await booking.complete();

            expect(completedBooking.status).toBe(BOOKING_STATUS.COMPLETED);
        });

        test('should get booking summary', async () => {
            const booking = await global.testUtils.createTestBooking();
            const summary = booking.getSummary();

            expect(summary.id).toEqual(booking._id.toString());
            expect(summary.vehicleId).toBeDefined();
            expect(summary.userId).toBeDefined();
            expect(summary.pincodes).toBeDefined();
            expect(summary.times).toBeDefined();
            expect(summary.durationHours).toBeDefined();
            expect(summary.status).toBeDefined();
            expect(summary.statusDisplay).toBeDefined();
            expect(summary.createdAt).toBeDefined();
            expect(summary.updatedAt).toBeDefined();
        });
    });
});
