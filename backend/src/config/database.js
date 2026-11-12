/* ============================================================
   database.js — MongoDB (Mongoose) connection
   Dormiway Hotel Backend
   ============================================================ */
'use strict';

const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'dormiway';

  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
  });

  isConnected = true;
  console.log(`[DB] Connected to MongoDB (database: ${dbName})`);
  return mongoose.connection;
}

async function testConnection() {
  return connectDB();
}

module.exports = { mongoose, connectDB, testConnection };
