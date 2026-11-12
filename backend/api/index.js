'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app = require('../src/app');
const { connectDB } = require('../src/config/database');

module.exports = async function handler(req, res) {
  await connectDB();
  return app(req, res);
};

