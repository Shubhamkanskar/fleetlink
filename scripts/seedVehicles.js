/**
 * Seed Vehicles Script for FleetLink
 * @fileoverview Script to populate the database with sample vehicles
 */

const mongoose = require('mongoose');
const Vehicle = require('../src/models/Vehicle');
const User = require('../src/models/User');
require('dotenv').config({ path: '../.env' });

/**
 * Sample vehicles data
 */
const sampleVehicles = [
    {
        name: 'Truck-001',
        capacityKg: 5000,
        tyres: 6,
        isActive: true
    },
    {
        name: 'Truck-002',
        capacityKg: 7500,
        tyres: 8,
        isActive: true
    },
    {
        name: 'Van-001',
        capacityKg: 2000,
        tyres: 4,
        isActive: true
    },
    {
        name: 'Van-002',
        capacityKg: 1500,
        tyres: 4,
        isActive: true
    },
    {
        name: 'Truck-003',
        capacityKg: 10000,
        tyres: 10,
        isActive: true
    },
    {
        name: 'Van-003',
        capacityKg: 3000,
        tyres: 4,
        isActive: true
    },
    {
        name: 'Truck-004',
        capacityKg: 6000,
        tyres: 6,
        isActive: true
    },
    {
        name: 'Van-004',
        capacityKg: 2500,
        tyres: 4,
        isActive: true
    }
];

/**
 * Connect to database
 */
async function connectDB() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetlink';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

/**
 * Create a default admin user if it doesn't exist
 */
async function createDefaultAdmin() {
    try {
        let adminUser = await User.findOne({ email: 'admin@fleetlink.com' });

        if (!adminUser) {
            adminUser = new User({
                name: 'Admin User',
                email: 'admin@fleetlink.com',
                password: 'admin123', // In production, this should be hashed
                role: 'admin'
            });
            await adminUser.save();
            console.log('✅ Created default admin user');
        } else {
            console.log('✅ Admin user already exists');
        }

        return adminUser;
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    }
}

/**
 * Seed vehicles into the database
 */
async function seedVehicles() {
    try {
        // Clear existing vehicles
        await Vehicle.deleteMany({});
        console.log('🗑️  Cleared existing vehicles');

        // Create default admin user
        const adminUser = await createDefaultAdmin();

        // Create vehicles
        const vehicles = [];
        for (const vehicleData of sampleVehicles) {
            const vehicle = new Vehicle({
                ...vehicleData,
                createdBy: adminUser._id
            });
            await vehicle.save();
            vehicles.push(vehicle);
        }

        console.log(`✅ Created ${vehicles.length} vehicles`);
        return vehicles;
    } catch (error) {
        console.error('❌ Error seeding vehicles:', error);
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    try {
        console.log('🚀 Starting vehicle seeding...');

        await connectDB();
        await seedVehicles();

        console.log('✅ Vehicle seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log('- Created 8 sample vehicles');
        console.log('- All vehicles are active and ready for booking');
        console.log('- Admin user: admin@fleetlink.com');
        console.log('- Admin password: admin123');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { seedVehicles, createDefaultAdmin };