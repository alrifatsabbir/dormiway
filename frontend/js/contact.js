/* ============================================================
   CONTACT.JS — Form Validation, Submission & UI Interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ── 1. Sticky header shadow on scroll ──────────────────────
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // ── 2. Mobile navigation toggle ────────────────────────────
  const toggleBtn  = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('navMobile');

  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
      });
    });
  }

  // ── 3. Newsletter footer form ───────────────────────────────
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value) {
        const original = input.placeholder;
        input.value = '';
        input.placeholder = 'Thank you for subscribing!';
        setTimeout(() => { input.placeholder = original; }, 3500);
      }
    });
  }

  // ── 4. Contact form ─────────────────────────────────────────
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const successMsg = document.getElementById('formSuccess');
  const errorMsg   = document.getElementById('formError');

  if (!form) return;

  // Field refs
  const fields = {
    name:    { el: document.getElementById('name'),    err: document.getElementById('nameError') },
    email:   { el: document.getElementById('email'),   err: document.getElementById('emailError') },
    phone:   { el: document.getElementById('phone'),   err: document.getElementById('phoneError') },
    message: { el: document.getElementById('message'), err: document.getElementById('messageError') },
  };

  // Clear error on input
  Object.values(fields).forEach(function ({ el, err }) {
    el.addEventListener('input', function () {
      el.classList.remove('is-invalid');
      err.textContent = '';
    });
  });

  // Validation helpers
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function isValidPhone(val) {
    // Allow empty (optional), or digits/spaces/+-() with 7–15 digits
    if (!val.trim()) return true;
    return /^[\d\s\+\-\(\)]{7,20}$/.test(val.trim());
  }

  function validateForm() {
    let valid = true;

    // Name
    if (!fields.name.el.value.trim()) {
      fields.name.el.classList.add('is-invalid');
      fields.name.err.textContent = 'Please enter your name.';
      valid = false;
    }

    // Email
    if (!fields.email.el.value.trim()) {
      fields.email.el.classList.add('is-invalid');
      fields.email.err.textContent = 'Please enter your email address.';
      valid = false;
    } else if (!isValidEmail(fields.email.el.value)) {
      fields.email.el.classList.add('is-invalid');
      fields.email.err.textContent = 'Please enter a valid email address.';
      valid = false;
    }

    // Phone (optional but must be valid if provided)
    if (fields.phone.el.value.trim() && !isValidPhone(fields.phone.el.value)) {
      fields.phone.el.classList.add('is-invalid');
      fields.phone.err.textContent = 'Please enter a valid phone number.';
      valid = false;
    }

    // Message
    if (!fields.message.el.value.trim()) {
      fields.message.el.classList.add('is-invalid');
      fields.message.err.textContent = 'Please enter a message.';
      valid = false;
    } else if (fields.message.el.value.trim().length < 10) {
      fields.message.el.classList.add('is-invalid');
      fields.message.err.textContent = 'Message must be at least 10 characters.';
      valid = false;
    }

    return valid;
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle('is-loading', loading);
  }

  function hideStatuses() {
    successMsg.classList.remove('is-visible');
    errorMsg.classList.remove('is-visible');
  }

  // Submit handler
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideStatuses();

    // Honeypot check — if filled, silently reject (bot)
    const trap = form.querySelector('input[name="_trap"]');
    if (trap && trap.value) return;

    if (!validateForm()) {
      // Focus first invalid field
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setLoading(true);

    const payload = {
      name:    fields.name.el.value.trim(),
      email:   fields.email.el.value.trim(),
      phone:   fields.phone.el.value.trim(),
      message: fields.message.el.value.trim(),
    };

    try {
      const apiBase = window.DORMIWAY_API_BASE ||
        ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3001' : '');
      const response = await fetch(`${apiBase}/api/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (response.ok) {
        form.reset();
        successMsg.classList.add('is-visible');
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        const data = await response.json().catch(() => ({}));
        errorMsg.textContent = data.message || 'Something went wrong. Please try again.';
        errorMsg.classList.add('is-visible');
      }
    } catch (err) {
      // Network error or server not running
      errorMsg.textContent = 'Unable to send your message. Please email us directly or try again later.';
      errorMsg.classList.add('is-visible');
    } finally {
      setLoading(false);
    }
  });

});
