// ─── config/db.js ─────────────────────────────────────────────────────────────
// Establishes the MongoDB connection using Mongoose.
// Called once from server.js before starting the HTTP server.
// Doc reference: Document 6 — Folder Structure

import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import Application from '../models/Application.model.js';

// Override the system DNS resolver with Google's public DNS servers.
// This is required when the system DNS (e.g. Cloudflare WARP) blocks
// the MongoDB Atlas SRV record lookups (_mongodb._tcp.*.mongodb.net).
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      // Mongoose 8 no longer needs the legacy options (useNewUrlParser, etc.)
      // but these keep the connection resilient in production.
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    // Sync Application indexes so partial unique index replaces old index
    try {
      await Application.syncIndexes();
    } catch (e) {
      console.log('Index sync info:', e.message);
    }
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    // Re-throw so server.js can handle the exit
    throw err;
  }
};
