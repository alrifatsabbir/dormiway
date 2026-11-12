/* ============================================================
   server.js — HTTP server entry point
   Dormiway Hotel Backend
   ============================================================ */
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app                    = require('./app');
const { testConnection }     = require('./config/database');
const PORT                   = parseInt(process.env.PORT || '3001', 10);

async function start() {
  try {
    await testConnection();
  } catch (err) {
    console.error('[Server] DB connection failed:', err.message);
    console.error('[Server] Check your .env MONGODB_URI and network/Atlas access.');
    process.exit(1);
  }

  app.listen(PORT, function () {
    console.log(`[Server] Dormiway backend running on http://localhost:${PORT}`);
    console.log(`[Server] Health: http://localhost:${PORT}/health`);
    console.log(`[Server] Admin login: POST http://localhost:${PORT}/api/admin/login`);
  });
}

start();
