/* ============================================================
   user.model.js — User (customer) Mongoose Schema & Queries
   ============================================================ */
'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    phone: { type: String, default: null },
    nationality: { type: String, default: null },
    passportNumber: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    last_login: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

function formatUser(doc) {
  if (!doc) return null;
  return { ...doc, id: doc._id.toString() };
}

async function findUserByEmail(email) {
  const doc = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();
  return formatUser(doc);
}

async function findUserById(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  const doc = await User.findById(userId).select('-password_hash').lean();
  return formatUser(doc);
}

async function createUser(userData) {
  const { firstName, lastName, email, passwordHash, phone } = userData;
  const doc = await User.create({
    firstName,
    lastName,
    email: String(email).toLowerCase().trim(),
    password_hash: passwordHash,
    phone: phone || null,
    is_active: true,
  });
  return doc._id.toString();
}

async function updateUserProfile(userId, userData) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return;
  const { firstName, lastName, phone, nationality, passportNumber } = userData;
  await User.findByIdAndUpdate(userId, {
    firstName,
    lastName,
    phone: phone || null,
    nationality: nationality || null,
    passportNumber: passportNumber || null,
  });
}

async function updateLastLogin(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return;
  await User.findByIdAndUpdate(userId, { last_login: new Date() });
}

async function updateUserPassword(userId, passwordHash) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return;
  await User.findByIdAndUpdate(userId, { password_hash: passwordHash });
}

async function getAllUsers(limit = 20, offset = 0) {
  const docs = await User.find()
    .select('-password_hash')
    .sort({ created_at: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();
  return docs.map(formatUser);
}

async function getUserCount() {
  return User.countDocuments();
}

module.exports = {
  User,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  updateLastLogin,
  updateUserPassword,
  getAllUsers,
  getUserCount,
};
