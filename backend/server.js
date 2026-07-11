// ─── server.js ────────────────────────────────────────────────────────────────
// Application entry point.
// Responsibilities:
//   1. Load environment variables from .env
//   2. Validate environment variables (via env.js — fails fast if misconfigured)
//   3. Connect to MongoDB
//   4. Start the HTTP server
// Doc reference: Document 6 — Folder Structure (server.js responsibility)

import 'dotenv/config'; // must be first — loads .env before any other import reads process.env

import { env }       from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import app           from './src/app.js';

const startServer = async () => {
  try {
    // Connect to MongoDB first — server should not accept requests before DB is ready
    await connectDB();

    app.listen(env.PORT, () => {
      console.log('');
      console.log('🚀 TalentFlow API is running');
      console.log(`   Port:        ${env.PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   URL:         http://localhost:${env.PORT}`);
      console.log(`   API Base:    http://localhost:${env.PORT}/api/v1`);
      console.log(`   Health:      http://localhost:${env.PORT}/health`);
      console.log('');
    });
  } catch (err) {
    // connectDB re-throws on failure — log and exit rather than serving with no DB
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
