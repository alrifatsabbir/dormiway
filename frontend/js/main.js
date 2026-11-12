/* ============================================================
   MAIN.JS — Navbar scroll, accordion, search, interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ========================
  // 1. STICKY NAVBAR on scroll
  // ========================
  const navbar = document.getElementById('navbar');

  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }


  // ========================
  // 2. MOBILE NAV TOGGLE
  // ========================
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function () {
      navMobile.classList.toggle('open');
    });

    // Close mobile menu when a link is clicked
    navMobile.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMobile.classList.remove('open');
      });
    });
  }


  // ========================
  // 3. EXPERIENCES ACCORDION
  // ========================
  const accordionBtns = document.querySelectorAll('.accordion__btn');

  accordionBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      const body = this.nextElementSibling;

      // Close all
      accordionBtns.forEach(function (otherBtn) {
        otherBtn.setAttribute('aria-expanded', 'false');
        if (otherBtn.nextElementSibling) {
          otherBtn.nextElementSibling.classList.remove('open');
        }
      });

      // Open clicked (if it was closed)
      if (!isExpanded) {
        this.setAttribute('aria-expanded', 'true');
        body.classList.add('open');
      }
    });
  });


  // ========================
  // 4. DINING TABS
  // ========================
  const diningTabs = document.querySelectorAll('.dining__tab');

  diningTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      diningTabs.forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
    });
  });


  // ========================
  // 5. SEARCH DATE VALIDATION
  // ========================
  const checkin  = document.getElementById('checkin');
  const checkout = document.getElementById('checkout');

  if (checkin && checkout) {
    // Set minimum check-in to today
    const today = new Date().toISOString().split('T')[0];
    checkin.setAttribute('min', today);

    checkin.addEventListener('change', function () {
      // Checkout must be after check-in
      checkout.setAttribute('min', this.value);
      if (checkout.value && checkout.value <= this.value) {
        checkout.value = '';
      }
    });
  }

});


// ========================
// 6. SEARCH HANDLER (frontend only — no backend yet)
// ========================
function handleSearch() {
  const checkin  = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;

  if (!checkin || !checkout) {
    alert('Please select both check-in and check-out dates.');
    return;
  }

  if (checkout <= checkin) {
    alert('Check-out date must be after check-in date.');
    return;
  }

  const guestsSelect = document.getElementById('guestsSelect');
  const roomTypeSelect = document.getElementById('roomTypeSelect');
  const params = new URLSearchParams({ checkin: checkin, checkout: checkout });
  if (guestsSelect && guestsSelect.value) params.set('guests', guestsSelect.value);
  if (roomTypeSelect && roomTypeSelect.value) params.set('roomType', roomTypeSelect.value);

  window.location.href = 'reservation.html?' + params.toString();
}


// ========================
// 7. NEWSLETTER HANDLER (frontend only — no backend yet)
// ========================
function handleNewsletter(event) {
  event.preventDefault();
  const input = event.target.querySelector('input[type="email"]');
  if (input && input.value) {
    // Show simple confirmation (will connect to backend later)
    input.value = '';
    input.placeholder = 'Thank you for subscribing!';
    setTimeout(function () {
      input.placeholder = 'Your email address';
    }, 3000);
  }
}

