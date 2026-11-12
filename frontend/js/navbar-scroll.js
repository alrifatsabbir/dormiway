/* ============================================================
   NAVBAR-SCROLL.JS  — Global top-only navbar visibility
   Dormiway website — applies to ALL pages

   Behaviour:
   - Navbar visible only when window.scrollY === 0
   - Hides (slides up) the moment the user scrolls down
   - Does NOT reappear on scroll-up — only when back at top
   ============================================================ */

(function () {
  'use strict';

  /* ── Find the header on any page ──────────────────────────
     Each page uses a different ID — try them all.           */
  function getHeader() {
    return (
      document.getElementById('navbar')            ||  // landing page
      document.getElementById('roomsHeader')       ||  // rooms, room-detail
      document.getElementById('reservationHeader') ||  // reservation
      document.getElementById('header')            ||  // events, offers, amenities, contact
      document.getElementById('authHeader')            // signup / signin
    );
  }

  /* ── CSS transition is defined in each page's own CSS.
     We add/remove one shared class: .nav-hidden
     Each header already has  position: sticky / fixed
     and a transition property we can piggyback on.
     We inject a minimal <style> block to ensure the
     transition and transform are always available.        */

  function injectStyles() {
    if (document.getElementById('navbarScrollStyle')) return;
    var style = document.createElement('style');
    style.id  = 'navbarScrollStyle';
    style.textContent = [
      /* Ensure every header can slide */
      '.navbar, .rooms-header, .header, .reservation-header, .auth-header, .login-header {',
      '  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),',
      '              box-shadow 0.3s ease !important;',
      '}',
      /* Hidden state — slide header fully above viewport */
      '.navbar.nav-hidden,',
      '.rooms-header.nav-hidden,',
      '.header.nav-hidden,',
      '.reservation-header.nav-hidden,',
      '.auth-header.nav-hidden,',
      '.login-header.nav-hidden {',
      '  transform: translateY(-110%) !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Scroll logic ─────────────────────────────────────── */
  function init() {
    var header = getHeader();
    if (!header) return;

    injectStyles();

    /* Threshold — treat anything within 4px of top as "at top"
       (handles rubber-band bounce on iOS)                    */
    var TOP_THRESHOLD = 4;

    function update() {
      if (window.scrollY <= TOP_THRESHOLD) {
        /* At the top — show navbar */
        header.classList.remove('nav-hidden');
      } else {
        /* Anywhere below top — hide navbar */
        header.classList.add('nav-hidden');
      }
    }

    /* Throttle scroll events with rAF for performance */
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    /* Run once on load to set correct initial state */
    update();
  }

  /* ── Init ─────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
