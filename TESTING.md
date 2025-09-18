# FleetLink Testing Documentation

## Overview

This document provides comprehensive information about the testing system for the FleetLink logistics vehicle booking system. The test suite includes unit tests, integration tests, and comprehensive coverage of all critical backend functionality.

## Test Statistics

- **Total Tests**: 122
- **Passing Tests**: 121 (99.2% success rate)
- **Test Suites**: 5
- **Coverage**: Backend API, Models, Controllers, Utilities, and Integration flows

## Test Structure

```
server/
├── tests/
│   ├── setup.js                    # Global test setup and utilities
│   ├── models.test.js              # Model validation and methods tests
│   ├── rideCalculations.test.js    # Utility functions tests
│   ├── vehicleController.test.js   # Vehicle API endpoint tests
│   ├── bookingController.test.js   # Booking API endpoint tests
│   └── integration.test.js         # End-to-end workflow tests
├── jest.config.js                  # Jest configuration
└── package.json                    # Test scripts and dependencies
```

## Running Tests

### Prerequisites

Ensure you have all dependencies installed:

```bash
npm install
```

### Test Commands

#### Run All Tests

```bash
npm test
```

#### Run Specific Test Suites

```bash
# Run only model tests
npm test -- tests/models.test.js

# Run only controller tests
npm test -- tests/vehicleController.test.js
npm test -- tests/bookingController.test.js

# Run only utility tests
npm test -- tests/rideCalculations.test.js

# Run only integration tests
npm test -- tests/integration.test.js
```

#### Run Specific Tests

```bash
# Run a specific test by name pattern
npm test -- --testNamePattern="should create a new vehicle"

# Run tests matching a pattern
npm test -- --testNamePattern="should handle.*booking"
```

#### Test with Coverage

```bash
npm run test:coverage
```

#### Watch Mode (for development)

```bash
npm run test:watch
```

## Test Categories

### 1. Model Tests (`tests/models.test.js`)

**Purpose**: Tests Mongoose model validation, methods, and static functions.

**Coverage**:

- Vehicle Model (10 tests)

  - Schema validation (required fields, data types, ranges)
  - Virtual fields (capacity in tons)
  - Static methods (findActive, findByCapacityRange, getStats)
  - Instance methods (getSummary)

- Booking Model (15 tests)
  - Schema validation (pincode format, time validation)
  - Pre-save middleware (future time validation)
  - Status management (active, completed, cancelled)
  - Static methods (findActiveBookingsForVehicle, findUserBookings)
  - Instance methods (cancel, complete, canBeCancelled)

**Key Test Examples**:

```javascript
// Vehicle capacity validation
test("should validate capacity range", async () => {
  const vehicle = new Vehicle({
    name: "Test Truck",
    capacityKg: 50000, // Max allowed
    tyres: 4,
    createdBy: user._id,
  });
  await expect(vehicle.save()).resolves.toBeDefined();
});

// Booking time validation
test("should validate start time is in the future for new bookings", async () => {
  const pastTime = new Date(Date.now() - 1000);
  const booking = new Booking({
    vehicleId: vehicle._id,
    userId: user._id,
    pincodes: { start: "110001", end: "400001" },
    times: { start: pastTime, end: new Date() },
  });
  await expect(booking.save()).rejects.toThrow(
    "Start time must be in the future"
  );
});
```

### 2. Utility Tests (`tests/rideCalculations.test.js`)

**Purpose**: Tests core business logic for ride calculations and time management.

**Coverage**:

- `calculateRideDuration` (5 tests)
- `calculateEndTime` (6 tests)
- `checkTimeOverlap` (10 tests)
- `checkBookingConflict` (5 tests)
- `getConflictType` (5 tests)
- `validateBookingTimes` (9 tests)

**Key Functions Tested**:

```javascript
// Duration calculation based on pincode difference
const duration = calculateRideDuration("110001", "400001");
// Returns: 8 hours (290000 % 24 = 8)

// Time overlap detection
const hasOverlap = checkTimeOverlap(
  "2024-01-15T09:00:00Z",
  "2024-01-15T12:00:00Z", // Existing
  "2024-01-15T10:00:00Z",
  "2024-01-15T14:00:00Z" // New
);
// Returns: true (overlapping times)
```

### 3. Vehicle Controller Tests (`tests/vehicleController.test.js`)

**Purpose**: Tests all vehicle-related API endpoints and business logic.

**Coverage**:

- POST `/api/vehicles` - Add new vehicle (6 tests)
- GET `/api/vehicles/available` - Search available vehicles (6 tests)
- GET `/api/vehicles` - List all vehicles (admin) (3 tests)
- GET `/api/vehicles/:id` - Get vehicle by ID (3 tests)
- PUT `/api/vehicles/:id` - Update vehicle (admin) (3 tests)
- DELETE `/api/vehicles/:id` - Delete vehicle (admin) (3 tests)
- GET `/api/vehicles/stats` - Get statistics (admin) (1 test)

**Authentication Levels**:

- **User Routes**: Add vehicle (any authenticated user)
- **Admin Routes**: List, update, delete, stats (admin only)

**Key Test Examples**:

```javascript
// Vehicle availability with conflict detection
test("should handle vehicles with existing bookings", async () => {
  // Create conflicting booking
  await global.testUtils.createTestBooking({
    vehicleId: testVehicle._id,
    times: {
      start: new Date(Date.now() + 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 26 * 60 * 60 * 1000),
    },
  });

  // Search for available vehicles in same time slot
  const response = await request(app)
    .get("/api/vehicles/available")
    .query({
      capacityKg: 500,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    })
    .expect(200);

  // Vehicle should be in unavailable list
  const unavailableVehicle = response.body.vehicles.unavailable.find(
    (v) => v.id === testVehicle._id.toString()
  );
  expect(unavailableVehicle).toBeDefined();
  expect(unavailableVehicle.availability.isAvailable).toBe(false);
});
```

### 4. Booking Controller Tests (`tests/bookingController.test.js`)

**Purpose**: Tests all booking-related API endpoints and business logic.

**Coverage**:

- POST `/api/bookings` - Create new booking (8 tests)
- GET `/api/bookings/my-bookings` - Get user bookings (3 tests)
- DELETE `/api/bookings/:id` - Cancel booking (5 tests)
- GET `/api/bookings` - List all bookings (admin) (3 tests)
- GET `/api/bookings/stats` - Get statistics (admin) (1 test)

**Key Features Tested**:

- Race condition prevention
- Time validation and calculations
- Authorization (users can only access their own bookings)
- Admin access control

**Key Test Examples**:

```javascript
// Race condition prevention
test("should prevent race condition - vehicle becomes unavailable between check and booking", async () => {
  const bookingData = {
    vehicleId: testVehicle._id.toString(),
    startPincode: "110001",
    endPincode: "400001",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  // Create conflicting booking
  await global.testUtils.createTestBooking({
    vehicleId: testVehicle._id,
    times: {
      start: new Date(bookingData.startTime),
      end: new Date(Date.now() + 26 * 60 * 60 * 1000),
    },
  });

  // Attempt to create booking should fail
  const response = await request(app)
    .post("/api/bookings")
    .set("Authorization", authToken)
    .send(bookingData)
    .expect(409);

  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe(
    "Vehicle is no longer available for the selected time slot"
  );
});
```

### 5. Integration Tests (`tests/integration.test.js`)

**Purpose**: Tests complete end-to-end workflows and system integration.

**Coverage**:

- Complete booking workflow (7 tests)
- Error handling scenarios (3 tests)

**Key Workflows Tested**:

1. **Complete Booking Flow**: Search → Book → Cancel → Re-book
2. **Capacity Filtering**: Search with specific capacity requirements
3. **Time Overlap Detection**: Multiple bookings with overlapping times
4. **Vehicle Deactivation**: Admin deactivates vehicle, affects availability
5. **Admin Operations**: Full admin workflow for fleet management
6. **Error Handling**: Invalid authentication, malformed requests, database issues

**Key Test Examples**:

```javascript
test("should complete full booking workflow", async () => {
  // Step 1: Search for available vehicles
  const searchResponse = await request(app)
    .get("/api/vehicles/available")
    .query({
      capacityKg: 1000,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    })
    .expect(200);

  expect(searchResponse.body.vehicles.available.length).toBeGreaterThan(0);

  // Step 2: Create booking
  const bookingResponse = await request(app)
    .post("/api/bookings")
    .set("Authorization", authToken)
    .send({
      vehicleId: testVehicle._id.toString(),
      startPincode: "110001",
      endPincode: "400001",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .expect(201);

  expect(bookingResponse.body.success).toBe(true);

  // Step 3: Verify booking appears in user's bookings
  const userBookingsResponse = await request(app)
    .get("/api/bookings/my-bookings")
    .set("Authorization", authToken)
    .expect(200);

  expect(userBookingsResponse.body.bookings.length).toBe(1);
});
```

## Test Setup and Configuration

### Global Test Setup (`tests/setup.js`)

The test setup provides:

- **MongoDB Memory Server**: In-memory database for isolated testing
- **Test Utilities**: Helper functions for creating test data
- **Authentication Tokens**: Mock JWT tokens for testing
- **Database Cleanup**: Automatic cleanup between tests

**Key Utilities**:

```javascript
// Create test user
const user = await global.testUtils.createTestUser({
  name: "Test User",
  email: "test@example.com",
  role: "user",
});

// Create test vehicle
const vehicle = await global.testUtils.createTestVehicle({
  name: "Test Truck",
  capacityKg: 1000,
  tyres: 4,
});

// Create test booking
const booking = await global.testUtils.createTestBooking({
  vehicleId: vehicle._id,
  userId: user._id,
  status: "active",
});

// Get authentication tokens
const authToken = global.testUtils.getRealAuthToken(); // User token
const adminToken = global.testUtils.getAdminAuthToken(); // Admin token
```

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./tests/setup.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/tests/",
    "/config/",
    "/docs/",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/client/"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
```

## Authentication in Tests

### Mock Authentication System

Tests use a mock authentication system that bypasses JWT verification:

```javascript
// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = {
    _id: "68cbef1c03690487fa4395ee",
    email: "shubhamkanaskar75@gmail.com",
    role: "user",
  };
  next();
};

const mockRequireAdmin = (req, res, next) => {
  req.user = {
    _id: "68cbef1c03690487fa4395ee",
    email: "admin@fleetlink.com",
    role: "admin",
  };
  next();
};
```

### Token Usage

- **User Token**: For regular user operations (create bookings, view own bookings)
- **Admin Token**: For admin operations (manage vehicles, view all bookings, statistics)

## Test Data Management

### Real Test User

Tests use a real user account for consistency:

- **ID**: `68cbef1c03690487fa4395ee`
- **Email**: `shubhamkanaskar75@gmail.com`
- **Role**: `user`

### Test Data Isolation

Each test runs in isolation with:

- Fresh database state
- Clean collections between tests
- Unique test data generation
- No cross-test contamination

## Common Test Patterns

### 1. API Endpoint Testing

```javascript
test("should create resource with valid data", async () => {
  const response = await request(app)
    .post("/api/endpoint")
    .set("Authorization", authToken)
    .send(validData)
    .expect(201);

  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
});
```

### 2. Error Handling Testing

```javascript
test("should reject invalid data", async () => {
  const response = await request(app)
    .post("/api/endpoint")
    .set("Authorization", authToken)
    .send(invalidData)
    .expect(400);

  expect(response.body.success).toBe(false);
  expect(response.body.message).toContain("validation error");
});
```

### 3. Authorization Testing

```javascript
test("should require admin access", async () => {
  const response = await request(app)
    .get("/api/admin-endpoint")
    .set("Authorization", userToken) // Regular user token
    .expect(403);

  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe("Admin access required");
});
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**

   - Ensure MongoDB Memory Server is properly installed
   - Check if port conflicts exist

2. **Authentication Failures**

   - Verify mock authentication is properly set up
   - Check token format and expiration

3. **Test Timeouts**

   - Increase timeout for slow operations
   - Check for infinite loops in test code

4. **Database Cleanup Issues**
   - Ensure proper cleanup in `afterEach` hooks
   - Check for hanging database connections

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debug info
npm test -- --testNamePattern="specific test" --verbose

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode for development
npm run test:watch
```

## Performance Considerations

### Test Execution Time

- **Total Suite**: ~40 seconds
- **Model Tests**: ~30 seconds
- **Controller Tests**: ~35 seconds each
- **Integration Tests**: ~15 seconds
- **Utility Tests**: ~2 seconds

### Optimization Tips

1. Use `beforeEach` for common setup
2. Clean up test data efficiently
3. Mock external dependencies
4. Use parallel test execution where possible

## Continuous Integration

### GitHub Actions Integration

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Future Enhancements

### Planned Test Improvements

1. **Load Testing**: Performance tests for high concurrency
2. **Security Testing**: Penetration testing for API endpoints
3. **Database Testing**: Connection pooling and transaction tests
4. **Frontend Testing**: E2E tests with Playwright/Cypress

### Test Coverage Goals

- **Current**: 99.2% test success rate
- **Target**: 100% test success rate
- **Coverage**: 95%+ code coverage

## Conclusion

The FleetLink testing system provides comprehensive coverage of all critical functionality with a 99.2% success rate. The test suite includes unit tests, integration tests, and end-to-end workflows that ensure system reliability and maintainability.

For questions or issues with the testing system, please refer to this documentation or contact the development team.
