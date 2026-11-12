/* ============================================================
   USER-AUTH.JS — Client-side auth state, guards & navbar
   ============================================================ */
(function () {
  'use strict';

  var TOKEN_KEY = 'dormiway_user_token';
  var USER_KEY = 'dormiway_user';
  var REDIRECT_KEY = 'dormiway_redirect_after_auth';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  }

  function isSignedIn() {
    return Boolean(getToken());
  }

  function getUser() {
    var raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(payload, remember) {
    var storage = remember ? localStorage : sessionStorage;
    var other = remember ? sessionStorage : localStorage;
    other.removeItem(TOKEN_KEY);
    other.removeItem(USER_KEY);

    storage.setItem(TOKEN_KEY, payload.token);
    storage.setItem(USER_KEY, JSON.stringify(payload.user || {}));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  function requireAuthForReservation() {
    if (!isSignedIn()) {
      sessionStorage.setItem(REDIRECT_KEY, window.location.href);
      window.location.replace('signup.html');
      return false;
    }
    return true;
  }

  function requireAuthForDashboard() {
    if (!isSignedIn()) {
      sessionStorage.setItem(REDIRECT_KEY, window.location.href);
      window.location.replace('signin.html');
      return false;
    }
    return true;
  }

  function popRedirectTarget() {
    var target = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    return target || 'dashboard.html';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var adminToken = localStorage.getItem('dormiway_admin_token') || sessionStorage.getItem('dormiway_admin_token');
    if (adminToken) {
      var adminRaw = localStorage.getItem('dormiway_admin') || sessionStorage.getItem('dormiway_admin');
      var adminName = 'Admin';
      try {
        var parsed = adminRaw ? JSON.parse(adminRaw) : null;
        if (parsed && parsed.name) adminName = String(parsed.name).split(' ')[0];
      } catch (e) {}

      document.querySelectorAll('a[href="signin.html"]').forEach(function (link) {
        if (link.closest('.auth-card') || link.closest('.auth-footer')) return;
        link.textContent = adminName + ' · Admin Dashboard';
        link.setAttribute('href', 'admin/dashboard.html');
        link.setAttribute('title', 'Open Dormiway Admin Dashboard');
      });
      return;
    }

    if (!isSignedIn()) return;
    var user = getUser();
    var firstName = (user && (user.firstName || user.name))
      ? String(user.firstName || user.name).split(' ')[0]
      : 'Account';

    document.querySelectorAll('a[href="signin.html"]').forEach(function (link) {
      if (link.closest('.auth-card') || link.closest('.auth-footer')) return;
      link.textContent = firstName + ' · Dashboard';
      link.setAttribute('href', 'dashboard.html');
      link.setAttribute('title', 'Open your Dormiway Dashboard');
    });
  });

  window.DormiwayUserAuth = {
    isSignedIn: isSignedIn,
    getToken: getToken,
    getUser: getUser,
    setSession: setSession,
    clearSession: clearSession,
    requireAuthForReservation: requireAuthForReservation,
    requireAuthForDashboard: requireAuthForDashboard,
    popRedirectTarget: popRedirectTarget,
  };
}());
