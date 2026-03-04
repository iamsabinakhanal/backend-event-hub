import mongoose from 'mongoose';
import { connectDatabase } from '../database/mongodb';

// Setup before all tests
beforeAll(async () => {
    await connectDatabase();
}, 30000);

// Cleanup after all tests
afterAll(async () => {
    await mongoose.connection.close();
});
