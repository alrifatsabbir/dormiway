/* ============================================================
   ROOM-DETAIL.JS — Individual Room Detail Pages
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── 1. Sticky header shadow ─────────────────────────────── */
  var header = document.getElementById('roomsHeader');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  /* ── 2. Mobile navigation toggle ────────────────────────── */
  var toggleBtn  = document.getElementById('roomsNavToggle');
  var mobileMenu = document.getElementById('roomsNavMobile');

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

  /* ── 3. Newsletter handler ───────────────────────────────── */
  var newsletterForm = document.getElementById('detailNewsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = newsletterForm.querySelector('input[type="email"]');
      if (input && input.value) {
        input.value = '';
        input.placeholder = 'Thank you for subscribing!';
        setTimeout(function () {
          input.placeholder = 'Your email address';
        }, 3000);
      }
    });
  }

});
