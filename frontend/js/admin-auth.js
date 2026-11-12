/* ============================================================
   ADMIN-AUTH.JS — Admin Sign In Page
   Dormiway Hotel Admin Panel
   ============================================================ */
'use strict';

/* API base — update this when deploying to production */
const API_BASE = window.DORMIWAY_API_BASE || (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:3001' : '');

document.addEventListener('DOMContentLoaded', function () {

  /* ── If already authenticated, go straight to dashboard ── */
  if (getStoredToken()) {
    window.location.replace('dashboard.html');
    return;
  }

  /* ── Elements ── */
  const form      = document.getElementById('adminSignInForm');
  const emailInp  = document.getElementById('adminEmail');
  const passInp   = document.getElementById('adminPassword');
  const pwToggle  = document.getElementById('pwToggle');
  const rememberMe= document.getElementById('rememberMe');
  const signInBtn = document.getElementById('signInBtn');
  const toast     = document.getElementById('authToast');

  /* ── Password visibility toggle ── */
  pwToggle.addEventListener('click', function () {
    const isHidden = passInp.type === 'password';
    passInp.type   = isHidden ? 'text' : 'password';
    pwToggle.classList.toggle('visible', isHidden);
    pwToggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    passInp.focus();
  });

  /* ── Clear errors on input ── */
  emailInp.addEventListener('input', function () {
    clearFieldError('fieldEmail', 'emailError');
    hideToast();
  });
  passInp.addEventListener('input', function () {
    clearFieldError('fieldPassword', 'passwordError');
    hideToast();
  });

  /* ── Form submit ── */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideToast();

    const email    = emailInp.value.trim();
    const password = passInp.value;

    /* Client-side validation */
    let valid = true;

    if (!email) {
      setFieldError('fieldEmail', 'emailError', 'Please enter your email address.');
      valid = false;
    } else if (!isValidEmail(email)) {
      setFieldError('fieldEmail', 'emailError', 'Please enter a valid email address.');
      valid = false;
    } else {
      clearFieldError('fieldEmail', 'emailError');
    }

    if (!password) {
      setFieldError('fieldPassword', 'passwordError', 'Please enter your password.');
      valid = false;
    } else {
      clearFieldError('fieldPassword', 'passwordError');
    }

    if (!valid) return;

    /* Loading state */
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.token) {
        /* Store token based on Remember Me preference */
        storeToken(data.token, rememberMe.checked);

        /* Store basic admin info for dashboard greeting */
        const storage = rememberMe.checked ? localStorage : sessionStorage;
        storage.setItem('dormiway_admin', JSON.stringify({
          name:  data.admin?.name  ?? 'Admin',
          email: data.admin?.email ?? email,
          role:  data.admin?.role  ?? 'admin',
        }));

        showToast('Signing you in…', 'success');

        /* Small delay so user sees the success state */
        setTimeout(function () {
          const dest = sessionStorage.getItem('dormiway_redirect_after_login');
          sessionStorage.removeItem('dormiway_redirect_after_login');
          window.location.replace(dest || 'dashboard.html');
        }, 500);

      } else {
        /* Server returned an error */
        const msg = data.message ?? 'Invalid email or password. Please try again.';
        showToast(msg, 'error');
        setLoading(false);
      }

    } catch (err) {
      /* Network / server unreachable */
      showToast('Unable to connect to server. Please check your connection.', 'error');
      setLoading(false);
    }
  });

  /* ── Forgot password placeholder ── */
  const forgotLink = document.getElementById('forgotLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', function (e) {
      e.preventDefault();
      showToast('Password reset — please contact your system administrator.', 'error');
    });
  }

  /* ============================================================
     HELPERS
  ============================================================ */
  function setLoading(loading) {
    signInBtn.disabled = loading;
    const label = signInBtn.querySelector('.admin-auth-btn__label');
    const arrow = signInBtn.querySelector('.admin-auth-btn__arrow');
    const spinner = signInBtn.querySelector('.admin-auth-btn__spinner');
    if (label) label.hidden = loading;
    if (arrow) arrow.hidden = loading;
    if (spinner) spinner.hidden = !loading;
  }

  function setFieldError(fieldId, errorId, msg) {
    const field = document.getElementById(fieldId);
    const err   = document.getElementById(errorId);
    if (field) field.classList.add('has-error');
    if (err)   err.textContent = msg;
  }

  function clearFieldError(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const err   = document.getElementById(errorId);
    if (field) field.classList.remove('has-error');
    if (err)   err.textContent = '';
  }

  function showToast(msg, type) {
    toast.textContent = msg;
    toast.className   = `auth-toast is-${type} rounded px-4 py-3 text-xs`;
    toast.hidden      = false;
  }

  function hideToast() {
    toast.hidden    = true;
    toast.className = 'auth-toast rounded px-4 py-3 text-xs';
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
});

/* ============================================================
   TOKEN STORAGE  (used by auth guard on other admin pages)
============================================================ */
function storeToken(token, remember) {
  if (remember) {
    localStorage.setItem('dormiway_admin_token', token);
    sessionStorage.removeItem('dormiway_admin_token');
  } else {
    sessionStorage.setItem('dormiway_admin_token', token);
    localStorage.removeItem('dormiway_admin_token');
  }
}

function getStoredToken() {
  return localStorage.getItem('dormiway_admin_token') ||
         sessionStorage.getItem('dormiway_admin_token') ||
         null;
}

function clearStoredToken() {
  localStorage.removeItem('dormiway_admin_token');
  localStorage.removeItem('dormiway_admin');
  sessionStorage.removeItem('dormiway_admin_token');
  sessionStorage.removeItem('dormiway_admin');
}

/* ── Exported for use in other admin pages ── */
window.DormiwayAdminAuth = { getStoredToken, clearStoredToken };
