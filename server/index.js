import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  const reqPath = req.path;
  const primaryPath = path.join(process.cwd(), 'uploads', reqPath);

  if (fs.existsSync(primaryPath) && fs.statSync(primaryPath).isFile()) {
    return res.sendFile(primaryPath);
  }

  // Fallback 1: check inside uploads/misc/
  const filename = path.basename(reqPath);
  const miscPath = path.join(process.cwd(), 'uploads', 'misc', filename);
  if (fs.existsSync(miscPath) && fs.statSync(miscPath).isFile()) {
    return res.sendFile(miscPath);
  }

  // Fallback 2: check inside uploads/proofs/
  const proofsPath = path.join(process.cwd(), 'uploads', 'proofs', filename);
  if (fs.existsSync(proofsPath) && fs.statSync(proofsPath).isFile()) {
    return res.sendFile(proofsPath);
  }

  // Fallback 3: check inside uploads/profiles/
  const profilesPath = path.join(process.cwd(), 'uploads', 'profiles', filename);
  if (fs.existsSync(profilesPath) && fs.statSync(profilesPath).isFile()) {
    return res.sendFile(profilesPath);
  }

  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);


// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  
  res.json({
    status: 'online',
    platform: 'ArenaX AI Sports Platform',
    mongodb: {
      status: states[dbState] || 'Unknown',
      database: mongoose.connection.name || 'arenax',
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/arenax'
    },
    timestamp: new Date().toISOString()
  });
});

// Catch unmatched routes with JSON 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler Middleware (ensures JSON response on all errors)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 ArenaX Express Backend running on http://localhost:${PORT}`);
  await connectDB();
});
