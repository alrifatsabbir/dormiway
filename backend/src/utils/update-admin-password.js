'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { mongoose, connectDB } = require('../config/database');
const { Admin } = require('../models/admin.model');

const ADMIN_EMAIL = '0325694548@student.wub.edu.bd';
const NEW_PASSWORD = 'Nargish1234';

async function updatePassword() {
  try {
    console.log('[Password Update] Connecting to MongoDB…');
    await connectDB();

    const admin = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!admin) {
      console.error('❌ Admin not found with email:', ADMIN_EMAIL);
      await mongoose.disconnect();
      process.exit(1);
    }

    admin.password_hash = await bcrypt.hash(NEW_PASSWORD, 12);
    await admin.save();

    console.log('✅ Password updated successfully!');
    console.log(`   Email   : ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

updatePassword();
