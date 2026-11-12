/* ============================================================
   LOGIN.JS — Interactive Behaviors for Dormiway Sign In
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ========================
  // 1. PASSWORD VISIBILITY TOGGLE
  // ========================
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');

  if (passwordInput && passwordToggle) {
    passwordToggle.addEventListener('click', function () {
      const isPassword = passwordInput.getAttribute('type') === 'password';

      if (isPassword) {
        passwordInput.setAttribute('type', 'text');
        passwordToggle.classList.add('is-visible');
        passwordToggle.setAttribute('title', 'Hide password');
        passwordToggle.setAttribute('aria-label', 'Hide password');
      } else {
        passwordInput.setAttribute('type', 'password');
        passwordToggle.classList.remove('is-visible');
        passwordToggle.setAttribute('title', 'Show password');
        passwordToggle.setAttribute('aria-label', 'Show password');
      }

      passwordInput.focus();
    });
  }


  // ========================
  // 2. MOBILE NAVIGATION DRAWER
  // ========================
  const navToggle = document.getElementById('loginNavToggle');
  const navMobile = document.getElementById('loginNavMobile');

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function () {
      navMobile.classList.toggle('open');
    });

    navMobile.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMobile.classList.remove('open');
      });
    });
  }


  // ========================
  // 3. FORM VALIDATION & CLIENT-SIDE SUBMISSION (NO BACKEND)
  // ========================
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const toast = document.getElementById('loginToast');
  const emailField = emailInput ? emailInput.closest('.login-field') : null;
  const passwordField = passwordInput ? passwordInput.closest('.login-field') : null;

  // Simple email format check
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  // Clear errors on typing
  if (emailInput && emailField) {
    emailInput.addEventListener('input', function () {
      emailField.classList.remove('has-error');
      hideToast();
    });
  }

  if (passwordInput && passwordField) {
    passwordInput.addEventListener('input', function () {
      passwordField.classList.remove('has-error');
      hideToast();
    });
  }

  function showToast(message, type) {
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'login-toast is-' + type;
  }

  function hideToast() {
    if (!toast) return;
    toast.className = 'login-toast';
    toast.textContent = '';
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      let hasError = false;

      // Validate email
      const emailVal = emailInput ? emailInput.value.trim() : '';
      if (!emailVal || !isValidEmail(emailVal)) {
        if (emailField) emailField.classList.add('has-error');
        hasError = true;
      } else if (emailField) {
        emailField.classList.remove('has-error');
      }

      // Validate password
      const passVal = passwordInput ? passwordInput.value : '';
      if (!passVal) {
        if (passwordField) passwordField.classList.add('has-error');
        hasError = true;
      } else if (passwordField) {
        passwordField.classList.remove('has-error');
      }

      if (hasError) {
        showToast('Please correct the highlighted fields.', 'error');
        return;
      }

      // Success feedback (Simulated frontend login)
      showToast('Welcome back. Accessing your reservations...', 'success');

      // Optional redirect back to home/dashboard after 1.5 seconds
      setTimeout(function () {
        window.location.href = 'index.html';
      }, 1500);
    });
  }


  // ========================
  // 4. ACCESSIBILITY: ESCAPE KEY TO GO BACK
  // ========================
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.location.href = 'index.html';
    }
  });

});

