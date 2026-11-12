/* ============================================================
   AUTH.JS — Shared interactions for Sign Up & Sign In pages
   NOTE: No backend calls yet — structure ready for integration.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ── 1. Sticky header shadow ─────────────────────────────────
  const header = document.getElementById('authHeader');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // ── 2. Mobile nav toggle ────────────────────────────────────
  const toggle = document.getElementById('authNavToggle');
  const mobile = document.getElementById('authNavMobile');

  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      mobile.classList.toggle('open');
    });
    mobile.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobile.classList.remove('open');
      });
    });
  }

  // ── 3. Password visibility toggle ───────────────────────────
  const passwordInput  = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');

  if (passwordInput && passwordToggle) {
    passwordToggle.addEventListener('click', function () {
      const isHidden = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
      passwordToggle.classList.toggle('is-visible', isHidden);
      passwordToggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      passwordInput.focus();
    });
  }

  // ── 4. Helpers ───────────────────────────────────────────────
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = field ? field.querySelector('.auth-field__error') : null;
    if (field) field.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorEl = field ? field.querySelector('.auth-field__error') : null;
    if (field) field.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
  }

  function showToast(message, type) {
    const toast = document.getElementById('authToast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'auth-toast is-' + type;
  }

  function hideToast() {
    const toast = document.getElementById('authToast');
    if (toast) toast.className = 'auth-toast';
  }

  // Clear errors on input
  ['email', 'password', 'fullName'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function () {
        clearFieldError(el.closest('.auth-field') ? el.closest('.auth-field').id : '');
        hideToast();
      });
    }
  });

  // ── 5. Sign Up form ─────────────────────────────────────────
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideToast();

      let valid = true;

      const name     = document.getElementById('fullName');
      const email    = document.getElementById('email');
      const password = document.getElementById('password');

      // Name
      if (!name || !name.value.trim()) {
        setFieldError('fieldName', 'Please enter your full name.');
        valid = false;
      } else { clearFieldError('fieldName'); }

      // Email
      if (!email || !email.value.trim()) {
        setFieldError('fieldEmail', 'Please enter your email address.');
        valid = false;
      } else if (!isValidEmail(email.value)) {
        setFieldError('fieldEmail', 'Please enter a valid email address.');
        valid = false;
      } else { clearFieldError('fieldEmail'); }

      // Password
      if (!password || !password.value) {
        setFieldError('fieldPassword', 'Please create a password.');
        valid = false;
      } else if (password.value.length < 8) {
        setFieldError('fieldPassword', 'Password must be at least 8 characters.');
        valid = false;
      } else { clearFieldError('fieldPassword'); }

      if (!valid) return;

      const apiBase = window.DORMIWAY_API_BASE ||
        ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3001' : '');

      const parts = name.value.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '-';

      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) submitBtn.disabled = true;

      fetch(`${apiBase}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email.value.trim(),
          password: password.value,
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.message || 'Registration failed.');
          return fetch(`${apiBase}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.value.trim(), password: password.value, rememberMe: true }),
          });
        })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.token) throw new Error(data.message || 'Login after signup failed.');
          window.DormiwayUserAuth?.setSession({ token: data.token, user: data.user }, true);
          showToast('Account created! Redirecting…', 'success');
          setTimeout(function () {
            const nextUrl = window.DormiwayUserAuth ? window.DormiwayUserAuth.popRedirectTarget() : 'dashboard.html';
            window.location.replace(nextUrl);
          }, 500);
        })
        .catch((err) => {
          showToast(err.message || 'Unable to connect to server.', 'error');
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  // ── 6. Sign In form ─────────────────────────────────────────
  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideToast();

      let valid = true;

      const email    = document.getElementById('email');
      const password = document.getElementById('password');

      // Email
      if (!email || !email.value.trim()) {
        setFieldError('fieldEmail', 'Please enter your email address.');
        valid = false;
      } else if (!isValidEmail(email.value)) {
        setFieldError('fieldEmail', 'Please enter a valid email address.');
        valid = false;
      } else { clearFieldError('fieldEmail'); }

      // Password
      if (!password || !password.value) {
        setFieldError('fieldPassword', 'Please enter your password.');
        valid = false;
      } else { clearFieldError('fieldPassword'); }

      if (!valid) return;

      const rememberEl = document.getElementById('rememberMe');
      const remember = rememberEl ? rememberEl.checked : false;
      const apiBase = window.DORMIWAY_API_BASE ||
        ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3001' : '');

      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) submitBtn.disabled = true;

      fetch(`${apiBase}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value,
          rememberMe: remember,
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.token) throw new Error(data.message || 'Invalid email or password.');
          window.DormiwayUserAuth?.setSession({ token: data.token, user: data.user }, remember);
          showToast('Signed in! Redirecting…', 'success');
          setTimeout(function () {
            const nextUrl = window.DormiwayUserAuth ? window.DormiwayUserAuth.popRedirectTarget() : 'dashboard.html';
            window.location.replace(nextUrl);
          }, 500);
        })
        .catch((err) => {
          showToast(err.message || 'Unable to connect to server.', 'error');
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

});
