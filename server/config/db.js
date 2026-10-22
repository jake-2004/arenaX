import mongoose from 'mongoose';
import { initializeCollectionsAndSeed } from '../database/initDb.js';

export const connectDB = async (maxRetries = 3) => {
  const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax';
  const isAtlas = connStr.includes('mongodb+srv://') || connStr.includes('.mongodb.net');
  console.log(`Connecting to MongoDB at: ${connStr.replace(/:([^@]+)@/, ':****@')}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await mongoose.connect(connStr, {
        family: 4,
        ...(isAtlas ? { tls: true } : {}),
        serverSelectionTimeoutMS: 15000
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);

      // Auto-initialize collections and seed default data
      await initializeCollectionsAndSeed();

      return true;
    } catch (error) {
      console.warn(`⚠️ MongoDB Connection Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, 1200));
      } else {
        console.log('⚡ Server running in hybrid mode (local state fallback active)');
        return false;
      }
    }
  }
};

