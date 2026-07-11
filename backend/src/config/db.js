// ─── config/db.js ─────────────────────────────────────────────────────────────
// Establishes the MongoDB connection using Mongoose.
// Called once from server.js before starting the HTTP server.
// Doc reference: Document 6 — Folder Structure

import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      // Mongoose 8 no longer needs the legacy options (useNewUrlParser, etc.)
      // but these keep the connection resilient in production.
      serverSelectionTimeoutMS: 5000,  // fail fast if Atlas is unreachable
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    // Re-throw so server.js can handle the exit
    throw err;
  }
};
