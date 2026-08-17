import mongoose from 'mongoose';
import { initializeCollectionsAndSeed } from '../database/initDb.js';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';
    console.log(`Connecting to MongoDB at: ${connStr}`);
    
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout fallback
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);

    // Auto-initialize collections and seed default data
    await initializeCollectionsAndSeed();

    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.log('⚡ Server running in hybrid mode (MongoDB attempts retry, local state fallback active)');
    return false;
  }
};
