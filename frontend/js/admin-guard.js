/* ============================================================
   admin-guard.js — Auth guard for all Admin Panel pages
   Include this script FIRST on every protected admin page.

   Behaviour:
   - Reads token from localStorage or sessionStorage
   - If missing → redirect to Admin Sign In immediately
   - If present → continues loading page normally
   - Exposes DormiwayAdminAuth.logout() for sign-out buttons
   ============================================================ */
(function () {
  'use strict';

  var TOKEN_KEY = 'dormiway_admin_token';
  var ADMIN_KEY = 'dormiway_admin';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) ||
           sessionStorage.getItem(TOKEN_KEY) ||
           null;
  }

  function clearAll() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
  }

  /* ── Guard: redirect to login if no token ── */
  if (!getToken()) {
    /* Preserve the intended destination so login can redirect back */
    sessionStorage.setItem('dormiway_redirect_after_login', window.location.href);
    window.location.replace('login.html');
  }

  /* ── Expose logout helper ── */
  window.DormiwayAdminAuth = {
    getToken: getToken,

    getAdmin: function () {
      var raw = localStorage.getItem(ADMIN_KEY) || sessionStorage.getItem(ADMIN_KEY);
      try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    },

    logout: function () {
      var token = getToken();
      clearAll();
      /* Optional: notify backend (fire-and-forget) */
      if (token) {
        var apiBase = window.DORMIWAY_API_BASE ||
          ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3001' : '');
        fetch(apiBase + '/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
        }).catch(function () {});
      }
      window.location.replace('login.html');
    },
  };

  /* ── Populate greeting in dashboard if element exists ── */
  document.addEventListener('DOMContentLoaded', function () {
    var admin = window.DormiwayAdminAuth.getAdmin();
    if (!admin) return;

    /* Update profile name in sidebars */
    var nameEls = document.querySelectorAll('.sidebar__profile-name');
    nameEls.forEach(function (el) { el.textContent = admin.name; });

    /* Update dashboard greeting */
    var headline = document.getElementById('welcomeHeadline');
    if (headline) {
      var hour     = new Date().getHours();
      var greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      var firstName = admin.name.split(' ')[0];
      headline.textContent = greeting + ', ' + firstName + '.';
    }
  });

}());
