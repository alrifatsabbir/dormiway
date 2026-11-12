/* ============================================================
   ROOMS.JS — Dormiway Rooms Page
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

  /* ── 3. Room filter tabs ─────────────────────────────────── */
  var filterBtns = document.querySelectorAll('.rooms-filter__btn');
  var roomCards  = document.querySelectorAll('.room-card[data-category]');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      /* Update active tab */
      filterBtns.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      /* Show / hide cards */
      roomCards.forEach(function (card) {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ── 4. Newsletter subscription handler ──────────────────── */
  var newsletterForm = document.getElementById('roomsNewsletterForm');
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
