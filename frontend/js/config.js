/* ============================================================
   CONFIG.JS — Backend API Base URL for Dormiway Frontend
   Frontend: https://dormiway.vercel.app
   ============================================================ */
(function () {
  'use strict';

  var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var rawBase = window.DORMIWAY_API_BASE || (
    isLocal ? 'http://localhost:3001' : 'https://dormiway-backend.vercel.app'
  );
  window.DORMIWAY_API_BASE = rawBase.replace(/\/+$/, '');
}());

