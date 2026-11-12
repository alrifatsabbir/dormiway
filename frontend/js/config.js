/* ============================================================
   CONFIG.JS — Backend API Base URL for Dormiway Frontend
   Frontend: https://dormiway.vercel.app
   ============================================================ */
(function () {
  'use strict';

  var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  // Replace the production URL below with your deployed Express + MongoDB backend URL
  window.DORMIWAY_API_BASE = window.DORMIWAY_API_BASE || (
    isLocal ? 'http://localhost:3001' : 'https://dormiway-api.onrender.com'
  );
}());

