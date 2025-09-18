# FleetLink - Logistics Vehicle Booking System

A comprehensive logistics vehicle booking system built with React/Next.js frontend and Node.js backend, featuring real-time notifications, advanced booking management, and a modern user interface.

## 📦 Tech Stack

- **Frontend**: ReactJS with Next.js
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Testing**: Jest (Backend)
- **UI Components**: shadcn/ui with Tailwind CSS
- **Authentication**: JWT-based authentication
- **Notifications**: Real-time notification system

## 🚀 Core Features Implemented

### Backend APIs

#### ✅ POST /api/vehicles

- **Purpose**: Add a new vehicle to the system
- **Request Body**: `{ "name": "...", "capacityKg": ..., "tyres": ... }`
- **Response**: 201 Created with the created vehicle object
- **Validation**: Ensures required fields are present and have correct types
- **Features**:
  - Vehicle ownership tracking
  - Capacity and tyre validation
  - Soft delete functionality

#### ✅ GET /api/vehicles/available

- **Purpose**: Find available vehicles based on criteria
- **Query Parameters**:
  - `capacityRequired`: Number (e.g., ?capacityRequired=500)
  - `fromPincode`: String (6-digit pincode)
  - `toPincode`: String (6-digit pincode)
  - `startTime`: String (ISO Date format)
- **Logic**:
  - Calculates `estimatedRideDurationHours` using pincode difference
  - Filters vehicles by capacity requirements
  - Excludes vehicles with overlapping bookings
  - Returns only truly available vehicles
- **Response**: 200 OK with available vehicles array and estimated duration

#### ✅ POST /api/bookings

- **Purpose**: Book a vehicle
- **Request Body**: `{ "vehicleId": "...", "fromPincode": "...", "toPincode": "...", "startTime": "...", "customerId": "..." }`
- **Logic**:
  - Calculates ride duration and end time
  - **Race condition prevention**: Re-verifies availability before booking
  - Creates booking with proper validation
  - Sends notifications to vehicle owners
- **Response**: 201 Created with booking details or 409 Conflict if unavailable

#### ✅ PUT /api/bookings/:id/complete

- **Purpose**: Mark a booking as completed
- **Authorization**: Vehicle owners, booking owners, or admins
- **Logic**:
  - Validates booking can be completed
  - Updates status and completion time
  - Sends completion notifications to customers

#### ✅ DELETE /api/bookings/:id

- **Purpose**: Cancel a booking
- **Logic**:
  - Validates cancellation rules (before start time)
  - Updates booking status
  - Handles time restrictions

### Core Logic

#### ✅ Ride Duration Calculation

```javascript
estimatedRideDurationHours =
  Math.abs(parseInt(toPincode) - parseInt(fromPincode)) % 24;
```

- **Minimum Duration**: 1 hour (even for same pincode bookings)
- **Validation**: 6-digit pincode format required
- **Note**: Simplified placeholder logic as specified

#### ✅ Time Overlap Detection

- **Advanced Algorithm**: Detects various overlap scenarios
- **Conflict Types**: Start overlap, end overlap, complete overlap, exact match
- **Race Condition Prevention**: Double-checking availability before booking

## 🎨 Frontend Features

### ✅ Add Vehicle Page

- **Form Fields**: Name, Capacity (KG), Tyres
- **Validation**: Client-side validation with Zod schemas
- **Integration**: Calls POST /api/vehicles endpoint
- **Feedback**: Success/error messages with toast notifications

### ✅ Search & Book Page

- **Search Form**:
  - Capacity Required
  - From/To Pincode (6-digit validation)
  - **Simple Date-Time Picker** (see Extra Features)
- **Results Display**:
  - Vehicle details (Name, Capacity, Tyres)
  - Estimated ride duration
  - Availability status
  - Book Now button
- **Booking Flow**:
  - Real-time availability checking
  - Conflict detection and handling
  - Success/error feedback

### ✅ Booking Management

- **Status Filtering**: All, Active, Completed, Cancelled
- **Action Buttons**:
  - Cancel (before start time)
  - Complete (after start time)
- **Real-time Updates**: Automatic refresh and status changes

### ✅ User Profile & Settings

- **Profile Management**: User information and preferences
- **Vehicle Management**: Add, edit, delete user vehicles
- **Settings**: System preferences and configurations

## 🔔 Extra Features Added

### 1. **Complete Notification System**

- **Real-time Notifications**: Vehicle owners get notified when vehicles are booked
- **Completion Notifications**: Customers get notified when bookings are completed
- **Navigation Badge**: Unread notification count in navigation
- **Rich Information**: Detailed booking information in notifications
- **Mark as Read**: Individual and bulk mark as read functionality
- **Auto-refresh**: Updates every 30 seconds

### 2. **Simple Time Picker**

- **Native HTML Inputs**: Uses reliable HTML5 time and date inputs
- **Cross-browser Compatible**: Works consistently across all browsers
- **Mobile Optimized**: Native mobile time pickers on mobile devices
- **Date Integration**: Seamless integration with date picker
- **Zero Dependencies**: No external libraries, pure HTML/CSS/JS

### 3. **Advanced Booking Management**

- **Complete Booking Lifecycle**: Create → Active → Complete
- **Smart Action Buttons**: Context-aware buttons based on booking status
- **Time-based Logic**: Cancel before start, complete after start
- **Visual Feedback**: Loading states and success messages

### 4. **Enhanced User Experience**

- **Dark Theme Support**: Varied colors with dark theme preference
- **Responsive Design**: Works perfectly on all devices
- **Loading States**: Clear feedback during operations
- **Error Handling**: Comprehensive error messages and recovery
- **Toast Notifications**: Modern notification system

### 5. **Admin Features**

- **Admin Dashboard**: Statistics and management tools
- **Vehicle Management**: Admin can manage all vehicles
- **Booking Oversight**: View and manage all bookings
- **User Management**: Admin controls and permissions

### 6. **Advanced Validation**

- **Zod Schemas**: Type-safe form validation
- **Client-side Validation**: Immediate feedback
- **Server-side Validation**: Secure backend validation
- **Pincode Validation**: 6-digit format enforcement

### 7. **Database Enhancements**

- **Soft Delete**: Vehicles and bookings can be soft deleted
- **Audit Trails**: Created/updated timestamps
- **Indexing**: Optimized database queries
- **Data Integrity**: Proper relationships and constraints

## 🧪 Testing Coverage

### ✅ Backend Testing (Jest)

- **Vehicle Controller Tests**: All CRUD operations
- **Booking Controller Tests**: Creation, cancellation, completion
- **Model Tests**: Validation and business logic
- **Integration Tests**: End-to-end workflows
- **Race Condition Tests**: Concurrent booking scenarios
- **Error Handling Tests**: Invalid inputs and edge cases

### ✅ Test Results

- **121 Tests Passed**: All core functionality tested
- **Coverage**: Controllers, models, utilities, and integration
- **Edge Cases**: Same pincode bookings, time overlaps, capacity filtering

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd FleetLink-logistics-vehicle-booking-system
```

2. **Install dependencies**

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. **Environment Setup**

```bash
# Create .env file in server directory
MONGODB_URI=mongodb://localhost:27017/fleetlink
JWT_SECRET=your-secret-key
NODE_ENV=development
```

4. **Start the application**

```bash
# Start MongoDB
mongod

# Start backend server
cd server
npm start

# Start frontend (in new terminal)
cd client
npm run dev
```

5. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Test User Credentials

For testing and development purposes, you can use these pre-configured user accounts:

#### Admin User

- **Email**: `shubhamkanaskar75@gmail.com`
- **Password**: `Shubham@2344`
- **Role**: Admin (full system access)

#### Regular User

- **Email**: `manasi@gmail.com`
- **Password**: `Shubham@2344`
- **Role**: User (standard user access)

> **Note**: These are test credentials for development purposes. In production, ensure proper user registration and secure password policies.

### Making a User Admin

To make any user an admin in the database, update the `role` field in the User collection:

#### Using MongoDB Compass or MongoDB Shell:

```javascript
// Connect to your MongoDB database
use fleetlink

// Update user to admin role
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)

// Verify the change
db.users.findOne({ email: "user@example.com" }, { role: 1, email: 1 })
```

#### Using Mongoose in Node.js:

```javascript
const User = require("./src/models/User");

// Update user to admin
await User.updateOne({ email: "user@example.com" }, { role: "admin" });

// Or find and update
const user = await User.findOne({ email: "user@example.com" });
user.role = "admin";
await user.save();
```

#### Available Roles:

- `"user"` - Standard user (default)
- `"admin"` - Administrator with full system access

## 📁 Project Structure

```
FleetLink-logistics-vehicle-booking-system/
├── client/                 # React/Next.js frontend
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── notifications.jsx
│   │   ├── vehicle-search.jsx
│   │   └── booking-management.jsx
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities and API client
│   └── hooks/            # Custom React hooks
├── server/               # Node.js backend
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # Express routes
│   │   ├── middlewares/  # Custom middlewares
│   │   └── utils/        # Utility functions
│   ├── tests/            # Jest test files
│   └── scripts/          # Database scripts
└── README.md
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Vehicles

- `POST /api/vehicles` - Add new vehicle
- `GET /api/vehicles` - Get all vehicles (with pagination)
- `GET /api/vehicles/available` - Get available vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `GET /api/vehicles/stats` - Get vehicle statistics

### Bookings

- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `GET /api/bookings` - Get all bookings (Admin)
- `PUT /api/bookings/:id/complete` - Complete booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/stats` - Get booking statistics

### Notifications

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/read` - Mark notifications as read
- `GET /api/notifications/unread-count` - Get unread count

## 🎯 Key Achievements

### ✅ All Original Requirements Met

- Complete backend API implementation
- Full frontend functionality
- Comprehensive testing coverage
- Race condition prevention
- Time overlap detection

### ✅ Extra Features Delivered

- **Real-time notification system**
- **Custom time picker with perfect UX**
- **Complete booking lifecycle management**
- **Advanced admin features**
- **Modern, responsive UI**
- **Comprehensive error handling**
- **Type-safe validation**

### ✅ Production-Ready Features

- **Security**: JWT authentication, input validation
- **Performance**: Optimized queries, proper indexing
- **Scalability**: Modular architecture, proper separation
- **Maintainability**: Clean code, comprehensive documentation
- **User Experience**: Intuitive interface, real-time feedback

---

**FleetLink** - Your comprehensive logistics vehicle booking solution! 🚛✨
