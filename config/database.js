/**
 * Database connection configuration for FleetLink
 * Handles MongoDB connection with error handling and environment-specific settings
 * @fileoverview Database connection setup with Mongoose
 */

const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Connects to MongoDB database
 * @async
 * @function connectDB
 * @description Establishes connection to MongoDB using environment variables
 * @throws {Error} When database connection fails
 * @example
 * // Connect to database
 * await connectDB();
 */
const connectDB = async () => {
    try {
        const mongoURI = process.env.NODE_ENV === 'test'
            ? process.env.MONGODB_TEST_URI
            : process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error('MongoDB URI not found in environment variables');
        }

        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    } catch (error) {
        console.error('Database connection error:', error.message);
        process.exit(1);
    }
};

/**
 * Disconnects from MongoDB database
 * @async
 * @function disconnectDB
 * @description Gracefully closes database connection
 * @example
 * // Disconnect from database
 * await disconnectDB();
 */
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB Disconnected');
    } catch (error) {
        console.error('Error disconnecting from database:', error.message);
    }
};

/**
 * Handles database connection events
 */
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// Handle application termination
process.on('SIGINT', async () => {
    await disconnectDB();
    process.exit(0);
});

module.exports = {
    connectDB,
    disconnectDB
};
