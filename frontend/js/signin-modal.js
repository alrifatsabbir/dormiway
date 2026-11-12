/* ============================================================
   SIGNIN-MODAL.JS  v2
   Two-panel modal: Sign Up first, switch to Sign In inline.
   No page navigation needed.

   Trigger: any element with  data-signin-trigger
   ============================================================ */

(function () {
  'use strict';

  /* ── SVG helpers ─────────────────────────────────────────── */
  var EYE_CLOSED = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  var EYE_OPEN  = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var CHECK_SVG = '<svg viewBox="0 0 14 14" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5 7 5.5 10 11.5 4"/></svg>';

  /* ── Modal HTML ──────────────────────────────────────────── */
  var MODAL_HTML = '<div class="sm-overlay" id="smOverlay" role="dialog" aria-modal="true" aria-labelledby="smPanelTitle">' +
    '<div class="sm-scrim" id="smScrim"></div>' +
    '<div class="sm-card" id="smCard">' +

      '<button class="sm-close" id="smClose" aria-label="Close">\u2715</button>' +

      /* ── SIGN UP PANEL ── */
      '<div class="sm-panel" id="smPanelSignup">' +
        '<p class="sm-eyebrow">SIGN UP</p>' +
        '<h2 class="sm-title" id="smPanelTitle">Begin your Dormiway<br>journey.</h2>' +
        '<p class="sm-subtitle">Create an account to save rooms, receive thoughtful invitations, and plan your next stay.</p>' +

        '<form class="sm-form" id="smSignupForm" novalidate>' +

          '<div class="sm-field" id="suFieldName">' +
            '<label for="suName" class="sm-label">FULL NAME</label>' +
            '<input type="text" id="suName" name="name" class="sm-input" placeholder="Your full name" autocomplete="name" required />' +
            '<span class="sm-err" id="suNameErr"></span>' +
          '</div>' +

          '<div class="sm-field" id="suFieldEmail">' +
            '<label for="suEmail" class="sm-label">EMAIL ADDRESS</label>' +
            '<input type="email" id="suEmail" name="email" class="sm-input" placeholder="hello@dormiway.com" autocomplete="email" required />' +
            '<span class="sm-err" id="suEmailErr"></span>' +
          '</div>' +

          '<div class="sm-field" id="suFieldPassword">' +
            '<label for="suPassword" class="sm-label">PASSWORD</label>' +
            '<div class="sm-pw-wrap">' +
              '<input type="password" id="suPassword" name="password" class="sm-input sm-input--pw" placeholder="Create a password" autocomplete="new-password" required />' +
              '<button type="button" class="sm-pw-btn" id="suPwToggle" aria-label="Show password">' +
                '<span class="sm-eye-closed">' + EYE_CLOSED + '</span>' +
                '<span class="sm-eye-open">'   + EYE_OPEN   + '</span>' +
              '</button>' +
            '</div>' +
            '<span class="sm-err" id="suPasswordErr"></span>' +
          '</div>' +

          '<div class="sm-checks">' +
            '<label class="sm-checkbox">' +
              '<input type="checkbox" id="suNewsletter" name="newsletter" />' +
              '<span class="sm-box" aria-hidden="true">' + CHECK_SVG + '</span>' +
              '<span class="sm-chk-text">Receive thoughtful stories and invitations from our team.</span>' +
            '</label>' +
            '<p class="sm-legal">By creating an account, you agree to our <a href="#">Privacy Policy</a> and <a href="#">Terms of Stay</a></p>' +
          '</div>' +

          '<div class="sm-action">' +
            '<button type="submit" class="sm-btn">CREATE ACCOUNT <span class="sm-arrow">\u2197</span></button>' +
          '</div>' +

          '<div class="sm-toast" id="suToast" role="status" aria-live="polite"></div>' +

        '</form>' +

        '<div class="sm-switch">' +
          'Already have an account?\u00a0<button type="button" class="sm-switch-btn" id="smToSignin">Sign in instead</button>' +
        '</div>' +
      '</div>' +

      /* ── SIGN IN PANEL ── */
      '<div class="sm-panel sm-panel--hidden" id="smPanelSignin">' +
        '<p class="sm-eyebrow">SIGN IN</p>' +
        '<h2 class="sm-title">Return to your stay.</h2>' +
        '<p class="sm-subtitle">Access your reservations, saved rooms, and personalized invitations.</p>' +

        '<form class="sm-form" id="smSigninForm" novalidate>' +

          '<div class="sm-field" id="siFieldEmail">' +
            '<label for="siEmail" class="sm-label">EMAIL ADDRESS</label>' +
            '<input type="email" id="siEmail" name="email" class="sm-input" placeholder="hello@dormiway.com" autocomplete="email" required />' +
            '<span class="sm-err" id="siEmailErr"></span>' +
          '</div>' +

          '<div class="sm-field" id="siFieldPassword">' +
            '<label for="siPassword" class="sm-label">PASSWORD</label>' +
            '<div class="sm-pw-wrap">' +
              '<input type="password" id="siPassword" name="password" class="sm-input sm-input--pw" placeholder="Your password" autocomplete="current-password" required />' +
              '<button type="button" class="sm-pw-btn" id="siPwToggle" aria-label="Show password">' +
                '<span class="sm-eye-closed">' + EYE_CLOSED + '</span>' +
                '<span class="sm-eye-open">'   + EYE_OPEN   + '</span>' +
              '</button>' +
            '</div>' +
            '<span class="sm-err" id="siPasswordErr"></span>' +
          '</div>' +

          '<div class="sm-options">' +
            '<label class="sm-checkbox">' +
              '<input type="checkbox" id="siRemember" name="rememberMe" />' +
              '<span class="sm-box" aria-hidden="true">' + CHECK_SVG + '</span>' +
              '<span class="sm-chk-text">Remember me</span>' +
            '</label>' +
            '<a href="#" class="sm-forgot">Forgot?</a>' +
          '</div>' +

          '<div class="sm-action">' +
            '<button type="submit" class="sm-btn">SIGN IN <span class="sm-arrow">\u2197</span></button>' +
          '</div>' +

          '<div class="sm-toast" id="siToast" role="status" aria-live="polite"></div>' +

        '</form>' +

        '<div class="sm-switch">' +
          'New to Dormiway?\u00a0<button type="button" class="sm-switch-btn" id="smToSignup">Create an account</button>' +
        '</div>' +
      '</div>' +

    '</div>' +
  '</div>';

  /* ── State ───────────────────────────────────────────────── */
  var isInjected  = false;
  var scrollY     = 0;
  var overlay, card, scrim, closeBtn;

  /* ── Inject once ─────────────────────────────────────────── */
  function inject() {
    if (isInjected) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = MODAL_HTML;
    document.body.appendChild(wrap.firstElementChild);
    isInjected = true;

    overlay  = document.getElementById('smOverlay');
    card     = document.getElementById('smCard');
    scrim    = document.getElementById('smScrim');
    closeBtn = document.getElementById('smClose');

    /* close triggers */
    scrim.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKey);

    /* panel switches */
    document.getElementById('smToSignin').addEventListener('click', function () { showPanel('signin'); });
    document.getElementById('smToSignup').addEventListener('click', function () { showPanel('signup'); });

    /* password toggles */
    wirePwToggle('suPassword', 'suPwToggle');
    wirePwToggle('siPassword', 'siPwToggle');

    /* clear-on-input */
    ['suName','suEmail','suPassword','siEmail','siPassword'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () {
        clearFieldError(el.closest('.sm-field'));
        hideToast(el.closest('.sm-panel').querySelector('.sm-toast'));
      });
    });

    /* form submits */
    document.getElementById('smSignupForm').addEventListener('submit', onSignupSubmit);
    document.getElementById('smSigninForm').addEventListener('submit', onSigninSubmit);
  }

  /* ── Password toggle wiring ──────────────────────────────── */
  function wirePwToggle(inputId, btnId) {
    var inp = document.getElementById(inputId);
    var btn = document.getElementById(btnId);
    if (!inp || !btn) return;
    btn.addEventListener('click', function () {
      var hidden = inp.type === 'password';
      inp.type = hidden ? 'text' : 'password';
      btn.classList.toggle('sm-pw-btn--visible', hidden);
      btn.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
      inp.focus();
    });
  }

  /* ── Panel switching ─────────────────────────────────────── */
  function showPanel(name) {
    var signup = document.getElementById('smPanelSignup');
    var signin = document.getElementById('smPanelSignin');
    resetPanel(signup);
    resetPanel(signin);

    if (name === 'signin') {
      signup.classList.add('sm-panel--hidden');
      signin.classList.remove('sm-panel--hidden');
      setTimeout(function () {
        var f = document.getElementById('siEmail');
        if (f) f.focus();
      }, 50);
    } else {
      signin.classList.add('sm-panel--hidden');
      signup.classList.remove('sm-panel--hidden');
      setTimeout(function () {
        var f = document.getElementById('suName');
        if (f) f.focus();
      }, 50);
    }
  }

  function resetPanel(panel) {
    if (!panel) return;
    var form = panel.querySelector('form');
    if (form) form.reset();
    panel.querySelectorAll('.sm-field.has-error').forEach(function (f) { f.classList.remove('has-error'); });
    var toast = panel.querySelector('.sm-toast');
    if (toast) toast.className = 'sm-toast';
    /* reset pw toggles */
    panel.querySelectorAll('.sm-pw-btn--visible').forEach(function (b) {
      b.classList.remove('sm-pw-btn--visible');
      var inp = b.closest('.sm-pw-wrap').querySelector('input');
      if (inp) inp.type = 'password';
    });
  }

  /* ── Open / Close ────────────────────────────────────────── */
  function open() {
    inject();
    scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    /* always start on Sign Up */
    showPanel('signup');
    overlay.classList.add('is-open');
    setTimeout(function () {
      var f = document.getElementById('suName');
      if (f) f.focus();
    }, 310);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);
  }

  /* ── Keyboard ────────────────────────────────────────────── */
  function onKey(e) {
    if (!overlay || !overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      var focusable = card.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      /* filter to visible elements only */
      var visible = Array.prototype.filter.call(focusable, function (el) {
        return el.offsetParent !== null;
      });
      if (!visible.length) return;
      var first = visible[0], last = visible[visible.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  /* ── Validation helpers ──────────────────────────────────── */
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

  function setFieldError(fieldEl, msg) {
    if (!fieldEl) return;
    fieldEl.classList.add('has-error');
    var err = fieldEl.querySelector('.sm-err');
    if (err) err.textContent = msg;
  }

  function clearFieldError(fieldEl) {
    if (!fieldEl) return;
    fieldEl.classList.remove('has-error');
  }

  function showToast(toastEl, msg, type) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'sm-toast sm-toast--' + type;
  }

  function hideToast(toastEl) {
    if (!toastEl) return;
    toastEl.className = 'sm-toast';
  }

  /* ── Sign Up submit ──────────────────────────────────────── */
  function onSignupSubmit(e) {
    e.preventDefault();
    var toast    = document.getElementById('suToast');
    hideToast(toast);

    var nameEl  = document.getElementById('suName');
    var emailEl = document.getElementById('suEmail');
    var passEl  = document.getElementById('suPassword');
    var valid   = true;

    if (!nameEl.value.trim()) {
      setFieldError(document.getElementById('suFieldName'), 'Please enter your full name.'); valid = false;
    } else { clearFieldError(document.getElementById('suFieldName')); }

    if (!emailEl.value.trim()) {
      setFieldError(document.getElementById('suFieldEmail'), 'Please enter your email address.'); valid = false;
    } else if (!isEmail(emailEl.value)) {
      setFieldError(document.getElementById('suFieldEmail'), 'Please enter a valid email address.'); valid = false;
    } else { clearFieldError(document.getElementById('suFieldEmail')); }

    if (!passEl.value) {
      setFieldError(document.getElementById('suFieldPassword'), 'Please create a password.'); valid = false;
    } else if (passEl.value.length < 8) {
      setFieldError(document.getElementById('suFieldPassword'), 'Password must be at least 8 characters.'); valid = false;
    } else { clearFieldError(document.getElementById('suFieldPassword')); }

    if (!valid) return;

    // TODO: POST /api/auth/register
    showToast(toast, 'Account creation coming soon — backend not yet connected.', 'error');
  }

  /* ── Sign In submit ──────────────────────────────────────── */
  function onSigninSubmit(e) {
    e.preventDefault();
    var toast   = document.getElementById('siToast');
    hideToast(toast);

    var emailEl = document.getElementById('siEmail');
    var passEl  = document.getElementById('siPassword');
    var valid   = true;

    if (!emailEl.value.trim()) {
      setFieldError(document.getElementById('siFieldEmail'), 'Please enter your email address.'); valid = false;
    } else if (!isEmail(emailEl.value)) {
      setFieldError(document.getElementById('siFieldEmail'), 'Please enter a valid email address.'); valid = false;
    } else { clearFieldError(document.getElementById('siFieldEmail')); }

    if (!passEl.value) {
      setFieldError(document.getElementById('siFieldPassword'), 'Please enter your password.'); valid = false;
    } else { clearFieldError(document.getElementById('siFieldPassword')); }

    if (!valid) return;

    // TODO: POST /api/auth/login
    showToast(toast, 'Sign in coming soon — backend not yet connected.', 'error');
  }

  /* ── Bind triggers ───────────────────────────────────────── */
  function bindTriggers() {
    document.querySelectorAll('[data-signin-trigger]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTriggers);
  } else {
    bindTriggers();
  }

  window.DormiwayAuth = { open: open, close: close, showPanel: showPanel };

}());
