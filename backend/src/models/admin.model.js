/* ============================================================
   admin.model.js — Admin Mongoose Schema & Queries
   ============================================================ */
'use strict';

const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'admin', 'staff'], default: 'admin' },
    last_login: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function findAdminByEmail(email) {
  const doc = await Admin.findOne({ email: String(email).toLowerCase().trim() }).lean();
  if (!doc) return null;
  return { ...doc, id: doc._id.toString() };
}

async function updateLastLogin(adminId) {
  if (!mongoose.Types.ObjectId.isValid(adminId)) return;
  await Admin.findByIdAndUpdate(adminId, { last_login: new Date() });
}

module.exports = { Admin, findAdminByEmail, updateLastLogin };
